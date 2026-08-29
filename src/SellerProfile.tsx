import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Globe2, Mail, MapPin, Pencil, RefreshCw, ShieldCheck, Store, UserRound } from 'lucide-react';
import { supabase } from './supabase';

type SellerProfileData = { username: string | null; first_name: string | null; last_name: string | null; email: string | null; seller_id: string | null };

export default function SellerProfile({ back }: { back: () => void }) {
  const [profile, setProfile] = useState<SellerProfileData>({ username: null, first_name: null, last_name: null, email: null, seller_id: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) { setError('Sign in to view your Seller Profile.'); setLoading(false); return; }
    const [profileRes, entityRes] = await Promise.all([
      supabase.from('profiles').select('username,first_name,last_name').eq('id', user.id).maybeSingle(),
      supabase.from('dright_entities').select('public_id').eq('owner_user_id', user.id).in('entity_type', ['profile_seller', 'seller', 'store']).limit(1).maybeSingle()
    ]);
    if (profileRes.error) setError(profileRes.error.message);
    setProfile({ username: profileRes.data?.username ?? null, first_name: profileRes.data?.first_name ?? null, last_name: profileRes.data?.last_name ?? null, email: user.email ?? null, seller_id: entityRes.data?.public_id ?? null });
    localStorage.setItem('dright-active-profile', 'Seller');
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || profile.username || 'Seller';
  const initials = name.slice(0, 2).toUpperCase();
  if (loading) return <main className="section" style={{ padding: '48px 24px' }}><div className="loading-card"><RefreshCw className="spin" size={22} /><strong>Loading Seller Profile</strong><span>Reading your authorized DRIGHT profile…</span></div></main>;

  return <main className="section" style={{ padding: '32px 24px', maxWidth: 1100, margin: '0 auto' }}>
    <button className="back-link" onClick={back}><ArrowLeft size={16} /> Seller Dashboard</button>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, margin: '28px 0 22px', flexWrap: 'wrap' }}>
      <div><span className="section-kicker">DRIGHT SELLER PROFILE</span><h1 style={{ margin: '7px 0 6px' }}>{name}</h1><p style={{ margin: 0, opacity: .72 }}>Your public seller identity and authorized account profile.</p></div>
      <button className="guest-primary" type="button"><Pencil size={15} /> Edit profile</button>
    </div>
    {error && <div className="data-notice"><ShieldCheck size={17} /><span>{error}</span></div>}
    <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, .65fr)', gap: 18 }}>
      <article className="seller-panel" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}><div className="header-avatar" style={{ width: 64, height: 64, fontSize: 20 }}>{initials}</div><div><h2 style={{ margin: 0 }}>{name}</h2><p style={{ margin: '4px 0 0', opacity: .65 }}>@{profile.username || 'seller'}</p></div><span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5 }}><CheckCircle2 size={16} /> Seller</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
          <div className="seller-mini-grid"><span><UserRound size={15} /> Name <b>{name}</b></span></div>
          <div className="seller-mini-grid"><span><Mail size={15} /> Email <b>{profile.email || 'Not available'}</b></span></div>
          <div className="seller-mini-grid"><span><Store size={15} /> Seller ID <b>{profile.seller_id || 'Not assigned'}</b></span></div>
          <div className="seller-mini-grid"><span><Globe2 size={15} /> Marketplace <b>Global</b></span></div>
        </div>
      </article>
      <article className="seller-panel" style={{ padding: 24 }}><span className="section-kicker">SELLER STATUS</span><h2 style={{ margin: '7px 0 16px' }}>Account readiness</h2><div style={{ display: 'grid', gap: 12 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckCircle2 size={17} /><span>Seller profile active</span></div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><ShieldCheck size={17} /><span>Authorized DRIGHT account</span></div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><MapPin size={17} /><span>Global marketplace profile</span></div></div></article>
    </section>
  </main>;
}
