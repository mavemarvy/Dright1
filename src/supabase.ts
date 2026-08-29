import { createClient } from '@supabase/supabase-js';

// DRIGHT1 production Supabase project.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jkqddapfluevbrzfdtsl.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Oq52s8TINBuJitmrbh0hag_vrPWHKXJ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const DRIGHT1_AUTH_REDIRECT = 'https://dright1.vercel.app/verification.html';

// Bridge the existing Affiliate Sidebar Sales Team entry to the real
// Sales Team tab inside AffiliateDashboard. No second Sales Team page.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const SALES_TEAM_INTENT = 'dright-open-affiliate-sales-team';

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest('button');
    if (!button || !button.closest('.left-sidebar')) return;
    const label = (button.textContent || '').replace(/\s+/g, ' ').trim();
    if (label === 'Sales Team') sessionStorage.setItem(SALES_TEAM_INTENT, '1');
  }, true);

  const selectSalesTeamTab = () => {
    if (sessionStorage.getItem(SALES_TEAM_INTENT) !== '1') return;
    const sidebar = document.querySelector('.affiliate-sidebar');
    if (!sidebar) return;
    const salesTeamButton = Array.from(sidebar.querySelectorAll('button')).find(
      (button) => (button.textContent || '').replace(/\s+/g, ' ').trim() === 'Sales Team'
    );
    if (!salesTeamButton) return;
    sessionStorage.removeItem(SALES_TEAM_INTENT);
    salesTeamButton.click();
  };

  const observer = new MutationObserver(selectSalesTeamTab);
  observer.observe(document.body, { childList: true, subtree: true });
  selectSalesTeamTab();
}
