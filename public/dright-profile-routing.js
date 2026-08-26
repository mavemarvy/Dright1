(() => {
  const isSeller = () => {
    const trigger = document.querySelector('.profile-switcher-trigger strong');
    return trigger?.textContent?.trim().toLowerCase() === 'seller';
  };

  const syncAffiliateAnalyticsVisibility = () => {
    document.querySelectorAll('.sidebar-nav button').forEach((button) => {
      const label = button.textContent?.trim().toLowerCase() || '';
      if (label.includes('affiliate analytics')) {
        button.style.display = isSeller() ? 'none' : '';
      }
    });
  };

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const profileOption = target?.closest('.profile-option');
    if (profileOption?.textContent?.trim().toLowerCase().startsWith('seller')) {
      localStorage.setItem('dright-active-profile', 'Seller');
      event.preventDefault();
      event.stopPropagation();
      window.location.assign('/seller.html');
      return;
    }
    setTimeout(syncAffiliateAnalyticsVisibility, 0);
  }, true);

  const observer = new MutationObserver(syncAffiliateAnalyticsVisibility);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(syncAffiliateAnalyticsVisibility, 250);
})();
