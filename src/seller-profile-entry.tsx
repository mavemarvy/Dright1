import React from 'react';
import { createRoot } from 'react-dom/client';
import SellerProfile from './SellerProfile';
import { supabase } from './supabase';
import './seller-dright-theme.css';

const root = document.getElementById('seller-profile-root');
if (!root) throw new Error('DRIGHT Seller Profile root element was not found.');

function SellerProfileShell() {
  React.useEffect(() => {
    localStorage.setItem('dright-active-profile', 'Seller');
    const saved = localStorage.getItem('dright-theme');
    const theme = saved === 'dark' || saved === 'light' || saved === 'system' || saved === 'red' ? saved : 'light';
    document.body.classList.add(`theme-dright-${theme}`);
    return () => document.body.classList.remove(`theme-dright-${theme}`);
  }, []);
  return <SellerProfile back={() => { window.location.assign('/seller.html'); }} />;
}

createRoot(root).render(<React.StrictMode><SellerProfileShell /></React.StrictMode>);
