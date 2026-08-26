import React from 'react';
import { createRoot } from 'react-dom/client';
import SellerDashboard from './SellerDashboard';

const root = document.getElementById('seller-root');

if (!root) {
  throw new Error('DRIGHT Seller root element was not found.');
}

createRoot(root).render(
  <React.StrictMode>
    <SellerDashboard />
  </React.StrictMode>
);
