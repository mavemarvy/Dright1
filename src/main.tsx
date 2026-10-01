import React from 'react';
import {createRoot} from 'react-dom/client';
import PromotersRewardsCampaign from './PromotersRewardsCampaign';
import './styles.css';

const root=document.getElementById('root');

if(root){
  createRoot(root).render(
    <React.StrictMode>
      <PromotersRewardsCampaign/>
    </React.StrictMode>
  );
}
