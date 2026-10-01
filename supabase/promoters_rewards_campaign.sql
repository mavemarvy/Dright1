-- DRIGHT1 · Promoters Rewards Campaign
-- Run against the Dright1 Supabase project when it is active.
-- Designed for Supabase Postgres 17 + the 2026 Data API explicit-grant behavior.

create table if not exists public.promoter_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default 'Promoters Rewards Campaign',
  hero_title text not null,
  hero_subtitle text not null,
  currency text not null default 'NGN',
  reward_amount numeric(12,2) not null default 1000 check (reward_amount >= 0),
  winner_limit integer not null default 50 check (winner_limit > 0),
  approved_count integer not null default 0 check (approved_count >= 0),
  share_text text not null,
  platforms text[] not null default array['Telegram','WhatsApp','WhatsApp Business','Messenger','Facebook','Snapchat','Instagram']::text[],
  redirect_url text,
  redirect_label text not null default 'See more ways to earn money online',
  status text not null default 'active' check (status in ('active','paused','ended')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promoter_reward_submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.promoter_campaigns(id) on delete cascade,
  submission_code text not null unique default ('PR-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  status_token uuid not null unique,
  full_name text not null check (char_length(full_name) between 2 and 120),
  contact text not null check (char_length(contact) between 3 and 180),
  platform text not null,
  payout_method text not null,
  bank_name text not null,
  account_name text not null,
  account_number text not null check (char_length(account_number) between 4 and 32),
  proof_path text not null,
  status text not null default 'pending' check (status in ('pending','approved','valid_but_full','rejected','invalid','duplicate')),
  verification_note text,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  payout_status text not null default 'unpaid' check (payout_status in ('unpaid','paid','not_required')),
  paid_by uuid references auth.users(id) on delete set null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists promoter_reward_one_contact_per_campaign
  on public.promoter_reward_submissions (campaign_id, lower(contact));
create index if not exists promoter_reward_status_idx
  on public.promoter_reward_submissions (campaign_id,status,created_at desc);

alter table public.promoter_campaigns enable row level security;
alter table public.promoter_reward_submissions enable row level security;

-- Explicit Data API grants are required by current Supabase defaults.
grant select on public.promoter_campaigns to anon, authenticated;
grant insert on public.promoter_reward_submissions to anon, authenticated;
grant select, insert, update, delete on public.promoter_campaigns to authenticated;
grant select, insert, update on public.promoter_reward_submissions to authenticated;

drop policy if exists "promoter campaigns public active read" on public.promoter_campaigns;
create policy "promoter campaigns public active read"
on public.promoter_campaigns for select
to anon, authenticated
using (
  status='active'
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

drop policy if exists "promoter campaigns admin manage" on public.promoter_campaigns;
create policy "promoter campaigns admin manage"
on public.promoter_campaigns for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "promoter rewards public submit" on public.promoter_reward_submissions;
create policy "promoter rewards public submit"
on public.promoter_reward_submissions for insert
to anon, authenticated
with check (
  status='pending'
  and payout_status='unpaid'
  and exists (
    select 1
    from public.promoter_campaigns c
    where c.id=campaign_id
      and c.status='active'
      and c.approved_count < c.winner_limit
      and (c.starts_at is null or c.starts_at <= now())
      and (c.ends_at is null or c.ends_at > now())
  )
);

drop policy if exists "promoter rewards admin manage" on public.promoter_reward_submissions;
create policy "promoter rewards admin manage"
on public.promoter_reward_submissions for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create or replace function public.get_promoter_submission_status(p_token uuid)
returns table(status text,verification_note text,payout_status text,updated_at timestamptz)
language sql
stable
security definer
set search_path=public
as $$
  select s.status,s.verification_note,s.payout_status,s.updated_at
  from public.promoter_reward_submissions s
  where s.status_token=p_token
  limit 1
$$;
revoke all on function public.get_promoter_submission_status(uuid) from public;
grant execute on function public.get_promoter_submission_status(uuid) to anon, authenticated;

create or replace function public.admin_review_promoter_submission(
  p_submission_id uuid,
  p_decision text,
  p_note text default null
)
returns table(status text)
language plpgsql
security invoker
set search_path=public
as $$
declare
  v_campaign_id uuid;
  v_current_status text;
  v_final_status text;
  v_limit integer;
  v_count integer;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  if p_decision not in ('approved','rejected','invalid','duplicate') then
    raise exception 'Unsupported review decision';
  end if;

  select s.campaign_id,s.status
    into v_campaign_id,v_current_status
  from public.promoter_reward_submissions s
  where s.id=p_submission_id
  for update;

  if v_campaign_id is null then
    raise exception 'Submission not found';
  end if;

  select c.winner_limit,c.approved_count
    into v_limit,v_count
  from public.promoter_campaigns c
  where c.id=v_campaign_id
  for update;

  if v_current_status='approved' and p_decision<>'approved' then
    update public.promoter_campaigns
      set approved_count=greatest(0,approved_count-1),updated_at=now()
    where id=v_campaign_id;
    v_count:=greatest(0,v_count-1);
  end if;

  if p_decision='approved' and v_current_status<>'approved' then
    if v_count>=v_limit then
      v_final_status:='valid_but_full';
    else
      v_final_status:='approved';
      update public.promoter_campaigns
        set approved_count=approved_count+1,updated_at=now()
      where id=v_campaign_id;
    end if;
  else
    v_final_status:=p_decision;
  end if;

  update public.promoter_reward_submissions
  set status=v_final_status,
      verification_note=nullif(trim(coalesce(p_note,'')),''),
      verified_by=auth.uid(),
      verified_at=now(),
      payout_status=case when v_final_status='approved' then payout_status else 'not_required' end,
      updated_at=now()
  where id=p_submission_id;

  return query select v_final_status;
end
$$;
revoke all on function public.admin_review_promoter_submission(uuid,text,text) from public;
revoke execute on function public.admin_review_promoter_submission(uuid,text,text) from anon;
grant execute on function public.admin_review_promoter_submission(uuid,text,text) to authenticated;

create or replace function public.admin_mark_promoter_reward_paid(p_submission_id uuid)
returns void
language plpgsql
security invoker
set search_path=public
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  update public.promoter_reward_submissions
  set payout_status='paid',paid_by=auth.uid(),paid_at=now(),updated_at=now()
  where id=p_submission_id and status='approved';

  if not found then
    raise exception 'Only approved rewards can be marked paid';
  end if;
end
$$;
revoke all on function public.admin_mark_promoter_reward_paid(uuid) from public;
revoke execute on function public.admin_mark_promoter_reward_paid(uuid) from anon;
grant execute on function public.admin_mark_promoter_reward_paid(uuid) to authenticated;

-- Private screenshot bucket. Public users can upload but cannot read.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('promoter-proof','promoter-proof',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "promoter proof public upload" on storage.objects;
create policy "promoter proof public upload"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id='promoter-proof'
  and (storage.foldername(name))[1]='submissions'
);

drop policy if exists "promoter proof admin read" on storage.objects;
create policy "promoter proof admin read"
on storage.objects for select
to authenticated
using (
  bucket_id='promoter-proof'
  and (select public.is_admin())
);

insert into public.promoter_campaigns (
  slug,title,hero_title,hero_subtitle,currency,reward_amount,winner_limit,
  share_text,platforms,redirect_url,redirect_label,status
) values (
  'promoters-rewards-campaign',
  'Promoters Rewards Campaign',
  'Share. Submit proof. Earn a reward.',
  'Share the campaign message on WhatsApp, Snapchat or Facebook, upload your screenshot and submit your reward details for verification.',
  'NGN',
  1000,
  50,
  'Want to learn how affiliate marketing and online selling work? I found a free guide for beginners. Message me if you want the details.',
  array['Telegram','WhatsApp','WhatsApp Business','Messenger','Facebook','Snapchat','Instagram']::text[],
  'https://dright.store',
  'See more ways to earn money online',
  'active'
)
on conflict (slug) do nothing;
