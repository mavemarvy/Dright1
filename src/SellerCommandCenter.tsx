import React, {useEffect, useMemo, useState} from 'react';
import {ArrowLeft, BarChart3, Copy, ExternalLink, Filter, Package, RefreshCw, ShoppingCart, TrendingUp, Users, Wallet} from 'lucide-react';
import {supabase} from './supabase';
import './seller-command-center.css';

type Summary={gross_revenue:number;orders:number;product_views:number;unique_visitors:number;conversion_rate:number;affiliate_clicks:number;affiliate_sales:number;affiliate_revenue:number;affiliate_commissions:number;active_affiliates:number;promotion_spend:number;promotion_impressions:number;promotion_clicks:number;promotion_conversions:number;promotion_revenue:number;refunds:number};
const emptySummary:Summary={gross_revenue:0,orders:0,product_views:0,unique_visitors:0,conversion_rate:0,affiliate_clicks:0,affiliate_sales:0,affiliate_revenue:0,affiliate_commissions:0,active_affiliates:0,promotion_spend:0,promotion_impressions:0,promotion_clicks:0,promotion_conversions:0,promotion_revenue:0,refunds:0};
const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(n)||0);
const num=(n:number)=>new Intl.NumberFormat('en-US').format(Number(n)||0);
const pct=(n:number)=>`${Number(n||0).toFixed(2)}%`;

export default function SellerCommandCenter({back}:{back:()=>void}){
 const [range,setRange]=useState('30'); const [summary,setSummary]=useState<Summary>(emptySummary); const [affiliates,setAffiliates]=useState<any[]>([]); const [products,setProducts]=useState<any[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [copied,setCopied]=useState('');
 const dates=useMemo(()=>{const to=new Date();const from=new Date(to.getTime()-Number(range)*86400000);return {from:from.toISOString(),to:to.toISOString()}},[range]);
 const load=async()=>{setLoading(true);setError('');const [s,a,p]=await Promise.all([supabase.rpc('seller_dashboard_summary',{p_from:dates.from,p_to:dates.to}),supabase.rpc('seller_affiliate_performance',{p_from:dates.from,p_to:dates.to}),supabase.rpc('seller_product_performance',{p_from:dates.from,p_to:dates.to})]);if(s.error)setError(s.error.message);setSummary({...emptySummary,...(s.data||{})});setAffiliates(a.error?[]:(a.data||[]));setProducts(p.error?[]:(p.data||[]));setLoading(false)};
 useEffect(()=>{load()},[dates.from,dates.to]);
 useEffect(()=>{
   localStorage.setItem('dright-active-profile','Seller');
   const syncSellerIdentity=async()=>{
     const {data:{user}}=await supabase.auth.getUser();
     if(!user)return;
     const {data}=await supabase.from('profiles').select('first_name,last_name,username').eq('id',user.id).maybeSingle();
     const name=[data?.first_name,data?.last_name].filter(Boolean).join(' ').trim()||data?.username||user.email?.split('@')[0]||'DRIGHT Seller';
     const strong=document.querySelector('.profile-switcher-copy strong') as HTMLElement|null;
     const small=document.querySelector('.profile-switcher-copy small') as HTMLElement|null;
     if(strong)strong.textContent=name;
     if(small)small.textContent='DRIGHT profile · Seller';
     const trigger=document.querySelector('.profile-switcher-trigger') as HTMLElement|null;
     if(trigger)trigger.setAttribute('aria-label',`DRIGHT profile: Seller — ${name}`);
   };
   syncSellerIdentity();
   if(window.innerWidth<=900){
     window.setTimeout(()=>{
       const menu=document.querySelector('.menu-btn') as HTMLButtonElement|null;
       if(menu && !document.querySelector('.left-sidebar.open'))menu.click();
     },50);
   }
 },[]);
 const copy=async(text:string)=>{try{await navigator.clipboard.writeText(text);setCopied(text);setTimeout(()=>setCopied(''),1500)}catch{setCopied('')}};
 const maxRevenue=Math.max(1,...products.map(p=>Number(p.total_sales)||0));
 return <main className="seller-command-center"><div className="seller-command-header"><button className="back-link" onClick={back}><ArrowLeft size={16}/> Marketplace</button><div><span className="section-kicker">DRIGHT Seller / Vendor</span><h1>Seller Command Center</h1><p>Sales, products, promotions, affiliate attribution and authorized sales-team performance in the same DRIGHT ecosystem.</p></div><div className="seller-controls"><select value={range} onChange={e=>setRange(e.target.value)}><option value="1">Today</option><option value="7">7 days</option><option value="28">28 days</option><option value="30">30 days</option><option value="90">90 days</option></select><button onClick={load} title="Refresh"><RefreshCw size={16}/></button></div></div>
 {error&&<div className="seller-error">{error}</div>}
 <section className="seller-metric-grid">{[["Gross Revenue",money(summary.gross_revenue),Wallet],["Orders",num(summary.orders),ShoppingCart],["Product Views",num(summary.product_views),Package],["Conversion Rate",pct(summary.conversion_rate),TrendingUp],["Affiliate Sales",money(summary.affiliate_revenue),BarChart3],["Affiliate Clicks",num(summary.affiliate_clicks),ExternalLink],["Active Affiliates",num(summary.active_affiliates),Users],["Refunds",num(summary.refunds),RefreshCw]].map(([label,value,Icon]:any)=><article className="seller-metric" key={label}><span><Icon size={17}/>{label}</span><strong>{loading?'…':value}</strong><small>Real Supabase data · no synthetic values</small></article>)}</section>
 <section className="seller-grid-two"><div className="seller-panel"><div className="seller-panel-head"><div><span className="section-kicker">Sales analytics</span><h2>Revenue attribution</h2></div><BarChart3 size={18}/></div><div className="seller-bars"><div><span>Direct / organic</span><b>{money(Math.max(0,summary.gross_revenue-summary.affiliate_revenue))}</b><i style={{width:`${Math.min(100,Math.max(0,(summary.gross_revenue-summary.affiliate_revenue)/Math.max(1,summary.gross_revenue)*100))}%`}}/></div><div><span>Affiliate sales</span><b>{money(summary.affiliate_revenue)}</b><i style={{width:`${Math.min(100,summary.gross_revenue?summary.affiliate_revenue/summary.gross_revenue*100:0)}%`}}/></div><div><span>Promotion revenue</span><b>{money(summary.promotion_revenue)}</b><i style={{width:`${Math.min(100,summary.gross_revenue?summary.promotion_revenue/summary.gross_revenue*100:0)}%`}}/></div></div><p className="seller-note">Platform-fee and seller-net calculations are not shown unless DRIGHT has an authoritative configured fee source. This prevents invented financial values.</p></div>
 <div className="seller-panel"><div className="seller-panel-head"><div><span className="section-kicker">Affiliate funnel</span><h2>Clicks → purchases</h2></div><TrendingUp size={18}/></div><div className="seller-funnel"><div><strong>{num(summary.affiliate_clicks)}</strong><span>Affiliate clicks</span></div><div><strong>{num(summary.unique_visitors)}</strong><span>Unique visitors</span></div><div><strong>{num(summary.affiliate_sales)}</strong><span>Purchases</span></div></div><div className="seller-mini-grid"><span>Commission <b>{money(summary.affiliate_commissions)}</b></span><span>Promo spend <b>{money(summary.promotion_spend)}</b></span><span>Promo clicks <b>{num(summary.promotion_clicks)}</b></span><span>Promo conversions <b>{num(summary.promotion_conversions)}</b></span></div></div></section>
 <section className="seller-panel"><div className="seller-panel-head"><div><span className="section-kicker">Affiliate performance</span><h2>Affiliate-by-affiliate tracking</h2><p>Only affiliate/product relationships belonging to this seller are returned.</p></div><Filter size={18}/></div><div className="seller-table-wrap"><table><thead><tr><th>Affiliate</th><th>Product</th><th>Unique Link</th><th>Clicks</th><th>Unique</th><th>Views</th><th>Orders</th><th>CVR</th><th>Revenue</th><th>Commission</th><th>Status</th></tr></thead><tbody>{affiliates.length===0?<tr><td colSpan={11} className="empty">No affiliate performance records for this period.</td></tr>:affiliates.map((r,i)=>{const link=`https://dright.com/go/${r.affiliate_link_id}`;return <tr key={`${r.affiliate_link_id}-${i}`}><td><b>{r.affiliate_name}</b><small>{r.affiliate_id}</small></td><td><b>{r.product_name}</b><small>{r.product_id}</small></td><td><div className="link-cell"><code>{link}</code><button onClick={()=>copy(link)}>{copied===link?<span>Copied</span>:<Copy size={14}/>}</button></div></td><td>{num(r.clicks)}</td><td>{num(r.unique_clicks)}</td><td>{num(r.product_views)}</td><td>{num(r.orders)}</td><td>{pct(r.conversion_rate)}</td><td>{money(r.revenue)}</td><td>{money(r.commission)}</td><td><span className={`status ${r.status}`}>{r.status}</span></td></tr>})}</tbody></table></div></section>
 <section className="seller-panel"><div className="seller-panel-head"><div><span className="section-kicker">Product analytics</span><h2>Product-level affiliate performance</h2></div></div><div className="seller-product-list">{products.length===0?<div className="empty">No seller products have recorded performance yet.</div>:products.map((p,i)=><article key={p.product_id||i}><div className="seller-product-title"><b>{p.product_name}</b><small>{p.product_id}</small></div><div className="seller-product-bar"><i style={{width:`${Math.min(100,(Number(p.total_sales)||0)/maxRevenue*100)}%`}}/></div><div className="seller-product-stats"><span>Total <b>{money(p.total_sales)}</b></span><span>Organic <b>{money(p.organic_sales)}</b></span><span>Affiliate <b>{money(p.affiliate_sales)}</b></span><span>Aff. clicks <b>{num(p.affiliate_clicks)}</b></span><span>CVR <b>{pct(p.affiliate_conversion_rate)}</b></span><span>Affiliates <b>{num(p.active_affiliates)}</b></span><span>Commission <b>{money(p.affiliate_commission)}</b></span></div></article>)}</div></section>
 </main>;
}
