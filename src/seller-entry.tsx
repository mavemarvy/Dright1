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
      .seller-sidebar{min-height:0!important;overflow:hidden!important}
      .seller-sidebar nav{min-height:0!important;flex:1 1 auto!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;padding-right:4px!important;scrollbar-width:thin}
      .seller-sidebar nav::-webkit-scrollbar{width:6px}
      .seller-sidebar nav::-webkit-scrollbar-thumb{background:#26384f;border-radius:999px}
      .seller-sidebar nav::-webkit-scrollbar-track{background:transparent}
      .seller-sidebar .sidebar-foot{flex:0 0 auto!important;margin-top:8px!important}
      .seller-brand .brand-mark{font-size:0!important;background:#0b111a url('/dright-icon.svg') center/cover no-repeat!important;border:1px solid #64748b!important;box-shadow:0 8px 22px #0008!important}
      .seller-identity{flex:0 0 auto!important}
      .seller-identity strong{color:#fff!important}
      .seller-identity span{color:#7890ad!important}
      @media(max-width:800px){.seller-sidebar{height:100dvh!important;max-height:100dvh!important}.seller-sidebar nav{min-height:0!important}}
    `;
    document.head.appendChild(style);

    let cancelled = false;
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

    const observer = new MutationObserver(() => {
      const nav = document.querySelector('.seller-sidebar nav');
      if (nav instanceof HTMLElement) {
        nav.style.minHeight = '0';
        nav.style.flex = '1 1 auto';
        nav.style.overflowY = 'auto';
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    syncIdentity();

    return () => { cancelled = true; observer.disconnect(); style.remove(); };
  }, []);
  return null;
}

createRoot(root).render(
  <React.StrictMode>
    <SellerShellFix />
    <SellerDashboard />
  </React.StrictMode>
);
