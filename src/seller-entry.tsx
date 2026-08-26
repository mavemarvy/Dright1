import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import SellerDashboard from './SellerDashboard';
import { supabase } from './supabase';

const root = document.getElementById('seller-root');
if (!root) throw new Error('DRIGHT Seller root element was not found.');

function SellerShellFix() {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'dright-seller-shell-fix';
    style.textContent = `
      .seller-sidebar{min-height:100vh!important;height:100vh!important;overflow:hidden!important}
      .seller-sidebar nav{min-height:0!important;height:auto!important;flex:1 1 0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;padding-right:4px!important;scrollbar-width:thin}
      .seller-sidebar nav::-webkit-scrollbar{width:6px}
      .seller-sidebar nav::-webkit-scrollbar-thumb{background:#26384f;border-radius:999px}
      .seller-sidebar nav::-webkit-scrollbar-track{background:transparent}
      .seller-sidebar .sidebar-foot{flex:0 0 auto!important;margin-top:8px!important}
      .seller-brand .brand-mark{font-size:0!important;background:#0b111a url('/dright-icon.svg') center/cover no-repeat!important;border:1px solid #64748b!important;box-shadow:0 8px 22px #0008!important}
      .seller-identity{flex:0 0 auto!important;cursor:pointer!important;position:relative!important}
      .seller-identity strong{color:#fff!important}
      .seller-identity span{color:#7890ad!important}
      .dright-profile-switcher{position:absolute;left:12px;right:12px;top:100%;margin-top:6px;z-index:100;background:#0d1520;border:1px solid #24354a;border-radius:12px;padding:6px;box-shadow:0 18px 45px #000b;display:none}
      .dright-profile-switcher.open{display:block}
      .dright-profile-switcher button{width:100%;border:0;background:transparent;color:#aebed2;text-align:left;padding:10px 11px;border-radius:8px;font:500 12px Inter,system-ui,sans-serif;cursor:pointer}
      .dright-profile-switcher button:hover{background:#162337;color:#fff}
      .dright-profile-switcher button.current{background:#132846;color:#fff}
      .dright-profile-switcher small{display:block;color:#627995;font-size:9px;margin-top:2px}
      @media(max-width:800px){.seller-sidebar{height:100dvh!important;max-height:100dvh!important}.seller-sidebar nav{min-height:0!important;flex:1 1 0!important}}
    `;
    document.head.appendChild(style);

    let cancelled = false;
    let switcher: HTMLDivElement | null = null;

    const syncIdentity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      const [profileRes, entityRes] = await Promise.all([
        supabase.from('profiles').select('username,first_name,last_name').eq('id', user.id).maybeSingle(),
        supabase.from('dright_entities').select('public_id,entity_type').eq('owner_user_id', user.id).in('entity_type', ['profile_seller','seller','store']).limit(1).maybeSingle()
      ]);
      const profile = profileRes.data;
      const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() || profile?.username || user.email?.split('@')[0] || 'Seller';
      const sellerId = entityRes.data?.public_id || 'Seller ID not assigned';
      const identity = document.querySelector('.seller-identity');
      if (!identity) return;
      const strong = identity.querySelector('strong');
      const span = identity.querySelector('span');
      if (strong) strong.textContent = name;
      if (span) span.textContent = sellerId;
    };

    const installSwitcher = () => {
      const identity = document.querySelector('.seller-identity');
      if (!(identity instanceof HTMLElement) || identity.dataset.profileSwitcherReady === 'true') return;
      identity.dataset.profileSwitcherReady = 'true';
      identity.setAttribute('aria-label', 'Switch DRIGHT profile');
      identity.setAttribute('role', 'button');
      identity.setAttribute('tabindex', '0');
      switcher = document.createElement('div');
      switcher.className = 'dright-profile-switcher';
      switcher.innerHTML = `
        <button class="current" data-profile="seller">Seller<small>Current profile</small></button>
        <button data-profile="affiliate">Affiliate<small>Open Affiliate profile</small></button>
        <button data-profile="buyer">Buyer<small>Open Buyer profile</small></button>
        <button data-profile="employer">Employer<small>Open Employer profile</small></button>
        <button data-profile="freelancer">Freelancer<small>Open Freelancer profile</small></button>`;
      identity.appendChild(switcher);

      const go = (profile: string) => {
        if (profile === 'seller') return;
        const paths: Record<string,string> = {
          affiliate: '/affiliate.html',
          buyer: '/buyer.html',
          employer: '/employer.html',
          freelancer: '/freelancer.html'
        };
        const target = paths[profile];
        if (target) window.location.assign(target);
      };
      switcher.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          go((button as HTMLElement).dataset.profile || 'seller');
        });
      });
      const toggle = (event: Event) => {
        event.stopPropagation();
        switcher?.classList.toggle('open');
      };
      identity.addEventListener('click', toggle);
      identity.addEventListener('keydown', (event) => {
        const key = (event as KeyboardEvent).key;
        if (key === 'Enter' || key === ' ') toggle(event);
      });
      document.addEventListener('click', () => switcher?.classList.remove('open'));
    };

    const observer = new MutationObserver(() => {
      const nav = document.querySelector('.seller-sidebar nav');
      if (nav instanceof HTMLElement) {
        nav.style.minHeight = '0';
        nav.style.flex = '1 1 0';
        nav.style.overflowY = 'auto';
      }
      installSwitcher();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    syncIdentity();
    installSwitcher();

    return () => { cancelled = true; observer.disconnect(); switcher?.remove(); style.remove(); };
  }, []);
  return null;
}

createRoot(root).render(
  <React.StrictMode>
    <SellerShellFix />
    <SellerDashboard />
  </React.StrictMode>
);
