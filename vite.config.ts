import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        seller: 'seller.html',
        'seller-profile': 'seller-profile.html',
        'seller-products': 'seller-products.html',
        employer: 'employer.html',
      },
    },
  },
});
