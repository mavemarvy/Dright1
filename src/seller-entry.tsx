import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import SellerDashboard from './SellerDashboard';
import { supabase } from './supabase';
import './seller-dright-theme.css';

const root = document.getElementById('seller-root');
if (!root) throw new Error('DRIGHT Seller root element was not found.');

function SellerShellFix() {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'dright-seller-shell-fix';
    style.textContent = `
      .seller-sidebar{min-height:100vh!important;height:100vh!important;overflow:hidden!important;transition:width .2s ease,transform .2s ease!important}
      .seller-sidebar nav{min-height:0!important;flex:1 1 0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;padding-right:4px!important;scrollbar-width:thin}
      .seller-sidebar nav::-webkit-scrollbar{width:6px}.seller-sidebar nav::-webkit-scrollbar-thumb{background:#26384f;border-radius:999px}
      .seller-sidebar .sidebar-foot{flex:0 0 auto!important;margin-top:8px!important}
      .seller-identity{flex:0 0 auto!important;cursor:pointer!important;position:relative!important}
      .dright-profile-switcher{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:9999;background:#0d1520;border:1px solid #24354a;border-radius:12px;padding:6px;box-shadow:0 18px 45px #000b;display:none}
      .dright-profile-switcher.open{display:block}.dright-profile-switcher button{width:100%;border:0;background:transparent;color:#aebed2;text-align:left;padding:10px 11px;border-radius:8px;font:500 12px Inter,system-ui,sans-serif;cursor:pointer}.dright-profile-switcher button:hover{background:#162337;color:#fff}.dright-profile-switcher button.current{background:#132846;color:#fff}.dright-profile-switcher small{display:block;color:#627995;font-size:9px;margin-top:2px}
      .dright-admin-entry,.dright-collapse-entry{display:flex;align-items:center;gap:12px;width:100%;border:0;background:transparent;color:#94a3b8;text-align:left;padding:10px 12px;border-radius:8px;font:500 13px Inter,system-ui,sans-serif;cursor:pointer}.dright-admin-entry:hover,.dright-collapse-entry:hover{background:#0f172a;color:#fff}.dright-admin-entry{margin-bottom:3px}.dright-admin-entry svg,.dright-collapse-entry svg{width:17px;height:17px;flex:0 0 auto}.dright-collapse-entry{justify-content:center;border-top:1px solid #1e293b;margin-top:6px;padding-top:12px}
      .seller-sidebar.dright-collapsed{width:76px!important}.seller-sidebar.dright-collapsed .seller-brand>span,.seller-sidebar.dright-collapsed .seller-brand>small,.seller-sidebar.dright-collapsed .seller-identity>div:not(.avatar),.seller-sidebar.dright-collapsed .seller-identity>svg,.seller-sidebar.dright-collapsed nav button span,.seller-sidebar.dright-collapsed .sidebar-foot button:not(.dright-collapse-entry) span,.seller-sidebar.dright-collapsed .dright-admin-entry span{display:none!important}.seller-sidebar.dright-collapsed .seller-brand,.seller-sidebar.dright-collapsed .seller-identity,.seller-sidebar.dright-collapsed nav button,.seller-sidebar.dright-collapsed .sidebar-foot button{justify-content:center!important}.seller-sidebar.dright-collapsed .dright-profile-switcher{left:70px;right:auto;width:210px}.seller-sidebar.dright-collapsed .dright-collapse-entry svg{transform:rotate(180deg)}
      @media(max-width:800px){.seller-sidebar{height:100dvh!important;max-height:100dvh!important}.seller-sidebar nav{min-height:0!important;flex:1 1 0!important}.seller-sidebar.dright-collapsed{width:76px!important}}
    `;
    document.head.appendChild(style);

    let switcher: HTMLDivElement | null = null;
    let collapseButton: HTMLButtonElement | null = null;
    let outsideClick: ((event: MouseEvent) => void) | null = null;

    const applyDrightTheme = () => {
      const shell = document.querySelector('.seller-shell');
      if (!(shell instanceof HTMLElement)) return;
      const saved = localStorage.getItem('dright-theme');
      const theme = saved === 'dark' || saved === 'light' || saved === 'system' || saved === 'red' ? saved : 'light';
      shell.classList.remove('theme-dright-dark','theme-dright-light','theme-dright-system','theme-dright-red');
      shell.classList.add(`theme-dright-${theme}`);
    };

    const navigateProfile = (profile: string) => {
      const paths: Record<string,string> = {
        seller: '/seller.html', affiliate: '/', buyer: '/', employer: '/', freelancer: '/'
      };
      if (profile === 'seller') return;
      localStorage.setItem('dright_requested_profile', profile);
      window.location.assign(paths[profile]);
    };

    const install = () => {
      const sidebar = document.querySelector('.seller-sidebar');
      const identity = document.querySelector('.seller-identity');
      const nav = sidebar?.querySelector('nav');
      applyDrightTheme();
      if (!(sidebar instanceof HTMLElement) || !(identity instanceof HTMLElement) || !(nav instanceof HTMLElement)) return;

      if (!sidebar.querySelector('.dright-admin-entry')) {
        const admin = document.createElement('button');
        admin.className = 'dright-admin-entry';
        admin.innerHTML = '<span aria-hidden="true">🛡️</span><span>Admin Panel</span>';
        admin.addEventListener('click', () => {
          localStorage.setItem('dright_return_profile', 'seller');
          window.location.assign('/admin');
        });
        sidebar.insertBefore(admin, nav);
      }

      if (!sidebar.querySelector('.dright-collapse-entry')) {
        collapseButton = document.createElement('button');
        collapseButton.className = 'dright-collapse-entry';
        collapseButton.innerHTML = '<span>‹</span><span>Collapse sidebar</span>';
        collapseButton.addEventListener('click', () => {
          const collapsed = sidebar.classList.toggle('dright-collapsed');
          localStorage.setItem('dright_seller_sidebar_collapsed', collapsed ? '1' : '0');
        });
        sidebar.querySelector('.sidebar-foot')?.appendChild(collapseButton);
        if (localStorage.getItem('dright_seller_sidebar_collapsed') === '1') sidebar.classList.add('dright-collapsed');
      }

      if (!identity.dataset.profileSwitcherReady) {
        identity.dataset.profileSwitcherReady = 'true';
        switcher = document.createElement('div');
        switcher.className = 'dright-profile-switcher';
        switcher.innerHTML = '<button class="current" data-profile="seller">Seller<small>Current profile</small></button><button data-profile="affiliate">Affiliate<small>Switch to Affiliate</small></button><button data-profile="buyer">Buyer<small>Switch to Buyer</small></button><button data-profile="employer">Employer<small>Switch to Employer</small></button><button data-profile="freelancer">Freelancer<small>Switch to Freelancer</small></button>';
        identity.appendChild(switcher);
        identity.addEventListener('click', event => { if ((event.target as HTMLElement).closest('.dright-profile-switcher')) return; event.stopPropagation(); switcher?.classList.toggle('open'); });
        switcher.querySelectorAll('button').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); navigateProfile((button as HTMLElement).dataset.profile || 'seller'); }));
        outsideClick = () => switcher?.classList.remove('open');
        document.addEventListener('click', outsideClick);
      }
    };

    const observer = new MutationObserver(install);
    observer.observe(document.documentElement, { childList:true, subtree:true });
    install();

    return () => { observer.disconnect(); if (outsideClick) document.removeEventListener('click', outsideClick); switcher?.remove(); collapseButton?.remove(); style.remove(); };
  }, []);
  return null;
}

createRoot(root).render(<React.StrictMode><SellerShellFix/><SellerDashboard/></React.StrictMode>);
