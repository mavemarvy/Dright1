import React,{useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import EmployerManagement from './EmployerManagement';
import './seller-dright-theme.css';
const root=document.getElementById('employer-root');
if(!root) throw new Error('DRIGHT Employer root was not found.');
function Shell(){useEffect(()=>{const apply=()=>{const el=document.querySelector('.employer-page');if(!(el instanceof HTMLElement))return;const saved=localStorage.getItem('dright-theme');const theme=saved==='dark'||saved==='light'||saved==='system'||saved==='red'?saved:'light';el.classList.remove('theme-dright-dark','theme-dright-light','theme-dright-system','theme-dright-red');el.classList.add(`theme-dright-${theme}`)};apply();const o=new MutationObserver(apply);o.observe(document.body,{childList:true,subtree:true});return()=>o.disconnect()},[]);return null}
createRoot(root).render(<React.StrictMode><Shell/><EmployerManagement back={()=>window.location.assign('/seller.html')}/></React.StrictMode>);
