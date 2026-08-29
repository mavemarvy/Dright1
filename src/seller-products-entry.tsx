import React from 'react';
import {createRoot} from 'react-dom/client';
import SellerProductManagement from './SellerProductManagement';

const root=document.getElementById('seller-products-root');
if(!root) throw new Error('DRIGHT Seller Product Listings root was not found.');

function Shell(){
 const apply=()=>{const shell=document.querySelector('.seller-product-page');if(!(shell instanceof HTMLElement))return;const saved=localStorage.getItem('dright-theme');const theme=saved==='dark'||saved==='light'||saved==='system'||saved==='red'?saved:'light';shell.classList.remove('theme-dright-dark','theme-dright-light','theme-dright-system','theme-dright-red');shell.classList.add(`theme-dright-${theme}`)};
 React.useEffect(()=>{apply();const observer=new MutationObserver(apply);observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect()},[]);
 return null;
}
createRoot(root).render(<React.StrictMode><Shell/><SellerProductManagement back={()=>window.location.assign('/seller.html')}/></React.StrictMode>);
