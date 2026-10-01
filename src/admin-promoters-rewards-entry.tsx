import React from 'react';
import {createRoot} from 'react-dom/client';
import AdminPromotersRewards from './AdminPromotersRewards';
import './styles.css';

const root=document.getElementById('root');
if(root){
  createRoot(root).render(
    <React.StrictMode>
      <main className="admin-panel-page">
        <section className="admin-panel-main" style={{maxWidth:'1400px',margin:'0 auto',width:'100%'}}>
          <AdminPromotersRewards/>
        </section>
      </main>
    </React.StrictMode>
  );
}
