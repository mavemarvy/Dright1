import React,{useCallback,useEffect,useState} from 'react';
import {CheckCircle2,ExternalLink,Gift,Loader2,RefreshCw,Save,ShieldCheck,WalletCards,XCircle} from 'lucide-react';
import {supabase} from './supabase';
import './admin-promoters-rewards.css';

type Campaign={id?:string;slug:string;title:string;hero_title:string;hero_subtitle:string;currency:string;reward_amount:number;winner_limit:number;approved_count:number;share_text:string;platforms:string[];redirect_url:string;redirect_label:string;status:string};
type Submission={id:string;submission_code:string;full_name:string;contact:string;platform:string;payout_method:string;bank_name:string;account_name:string;account_number:string;proof_path:string;status:string;verification_note:string|null;payout_status:string;created_at:string};
const empty:Campaign={slug:'promoters-rewards-campaign',title:'Promoters Rewards Campaign',hero_title:'Share it. Prove it. Get rewarded.',hero_subtitle:'Copy the campaign message, share it, upload proof and submit for reward verification.',currency:'NGN',reward_amount:1000,winner_limit:50,approved_count:0,share_text:'Dright is opening up more ways for people to earn, sell, promote, work and grow online. I found this opportunity and thought you might want to check it out. Message me for the details.',platforms:['Telegram','WhatsApp','WhatsApp Business','Messenger','Facebook','Snapchat','Instagram','X','TikTok'],redirect_url:'https://dright.store',redirect_label:'Discover more ways to earn online',status:'active'};
const money=(n:number)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(Number(n)||0);

export default function AdminPromotersRewards(){
 const [campaign,setCampaign]=useState<Campaign>(empty);
 const [rows,setRows]=useState<Submission[]>([]);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [filter,setFilter]=useState('all');

 const load=useCallback(async()=>{
   setLoading(true);setError('');
   const [a,b]=await Promise.all([
     supabase.from('promoter_campaigns').select('*').eq('slug','promoters-rewards-campaign').maybeSingle(),
     supabase.from('promoter_reward_submissions').select('id,submission_code,full_name,contact,platform,payout_method,bank_name,account_name,account_number,proof_path,status,verification_note,payout_status,created_at').order('created_at',{ascending:false}).limit(250)
   ]);
   if(a.error)setError(a.error.message); else if(a.data)setCampaign(a.data as Campaign);
   if(b.error)setError(v=>v||b.error.message); else setRows((b.data||[]) as Submission[]);
   setLoading(false);
 },[]);
 useEffect(()=>{load()},[load]);

 async function save(){
   setSaving(true);setError('');setNotice('');
   const payload={...campaign,approved_count:undefined,id:campaign.id||undefined,updated_at:new Date().toISOString()};
   const {error:e}=await supabase.from('promoter_campaigns').upsert(payload,{onConflict:'slug'});
   if(e)setError(e.message);else{setNotice('Campaign settings saved.');await load()}
   setSaving(false);
 }

 async function review(id:string,decision:'approved'|'rejected'|'invalid'|'duplicate'){
   const note=decision==='approved'?'Verified by campaign admin':window.prompt('Optional verification note','')||'';
   const {data,error:e}=await supabase.rpc('admin_review_promoter_submission',{p_submission_id:id,p_decision:decision,p_note:note});
   if(e){setError(e.message);return}
   const finalStatus=Array.isArray(data)?data[0]?.status:data?.status;
   setNotice(finalStatus==='valid_but_full'?'Proof was valid, but the reward limit was already full.':'Submission updated.');
   await load();
 }

 async function markPaid(id:string){
   if(!window.confirm('Mark this approved reward as paid?'))return;
   const {error:e}=await supabase.rpc('admin_mark_promoter_reward_paid',{p_submission_id:id});
   if(e)setError(e.message);else{setNotice('Reward marked as paid.');await load()}
 }

 async function openProof(path:string){
   const {data,error:e}=await supabase.storage.from('promoter-proof').createSignedUrl(path,300);
   if(e){setError(e.message);return}
   window.open(data.signedUrl,'_blank','noopener,noreferrer');
 }

 const visible=filter==='all'?rows:rows.filter(r=>r.status===filter);
 return <section className="apr">
   <header className="apr-head"><div><span>DRIGHT ADMIN</span><h2>Promoters Rewards Campaign</h2><p>Configure the public one-page campaign, verify screenshots and track reward payouts.</p></div><button onClick={load}><RefreshCw size={16}/>Refresh</button></header>
   {error&&<div className="apr-error">{error}</div>}{notice&&<div className="apr-notice">{notice}</div>}
   <div className="apr-kpis"><Kpi label="Reward" value={money(campaign.reward_amount)} icon={Gift}/><Kpi label="Approved" value={campaign.approved_count||0} icon={CheckCircle2}/><Kpi label="Limit" value={campaign.winner_limit} icon={ShieldCheck}/><Kpi label="Pending" value={rows.filter(x=>x.status==='pending').length} icon={WalletCards}/></div>
   <div className="apr-card">
     <div className="apr-card-title"><div><h3>Campaign settings</h3><p>The share text is kept separate from the external redirect URL.</p></div><button className="apr-save" onClick={save} disabled={saving}>{saving?<Loader2 className="apr-spin" size={16}/>:<Save size={16}/>}Save</button></div>
     <div className="apr-grid">
       <Label t="Reward amount"><input type="number" min="0" value={campaign.reward_amount} onChange={e=>setCampaign({...campaign,reward_amount:Number(e.target.value)})}/></Label>
       <Label t="Rewarded slots"><input type="number" min="1" value={campaign.winner_limit} onChange={e=>setCampaign({...campaign,winner_limit:Number(e.target.value)})}/></Label>
       <Label t="Campaign status"><select value={campaign.status} onChange={e=>setCampaign({...campaign,status:e.target.value})}><option value="active">Active</option><option value="paused">Paused</option><option value="ended">Ended</option></select></Label>
       <Label t="Redirect button text"><input value={campaign.redirect_label} onChange={e=>setCampaign({...campaign,redirect_label:e.target.value})}/></Label>
       <Label t="Hero title" wide><input value={campaign.hero_title} onChange={e=>setCampaign({...campaign,hero_title:e.target.value})}/></Label>
       <Label t="Hero subtitle" wide><textarea value={campaign.hero_subtitle} onChange={e=>setCampaign({...campaign,hero_subtitle:e.target.value})}/></Label>
       <Label t="Text users must share" wide><textarea rows={5} value={campaign.share_text} onChange={e=>setCampaign({...campaign,share_text:e.target.value})}/><small>No website URL is automatically appended.</small></Label>
       <Label t="External redirect URL" wide><input type="url" value={campaign.redirect_url||''} onChange={e=>setCampaign({...campaign,redirect_url:e.target.value})}/><small>Users must tap the button themselves; there is no automatic redirect.</small></Label>
     </div>
   </div>
   <div className="apr-card">
     <div className="apr-card-title"><div><h3>Proof verification</h3><p>Review private screenshots and payout details. Only approved submissions consume reward slots.</p></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="valid_but_full">Valid but full</option><option value="rejected">Rejected</option><option value="invalid">Invalid</option><option value="duplicate">Duplicate</option></select></div>
     {loading?<div className="apr-empty"><Loader2 className="apr-spin"/>Loading campaign data…</div>:!visible.length?<div className="apr-empty">No submissions in this filter.</div>:<div className="apr-list">{visible.map(row=><article key={row.id} className="apr-submission">
       <div className="apr-submission-top"><div><strong>{row.full_name}</strong><span>{row.platform} · {new Date(row.created_at).toLocaleString()}</span></div><b className={`apr-status ${row.status}`}>{row.status.replaceAll('_',' ')}</b></div>
       <div className="apr-detail-grid"><Detail l="Contact" v={row.contact}/><Detail l="Payout method" v={row.payout_method}/><Detail l="Bank / wallet" v={row.bank_name}/><Detail l="Account name" v={row.account_name}/><Detail l="Account number" v={row.account_number}/><Detail l="Payout" v={row.payout_status}/></div>
       {row.verification_note&&<div className="apr-note">{row.verification_note}</div>}
       <div className="apr-actions"><button onClick={()=>openProof(row.proof_path)}><ExternalLink size={15}/>View screenshot</button>{row.status==='pending'&&<><button className="approve" onClick={()=>review(row.id,'approved')}><CheckCircle2 size={15}/>Approve</button><button onClick={()=>review(row.id,'rejected')}><XCircle size={15}/>Reject</button><button onClick={()=>review(row.id,'invalid')}>Invalid</button><button onClick={()=>review(row.id,'duplicate')}>Duplicate</button></>}{row.status==='approved'&&row.payout_status!=='paid'&&<button className="approve" onClick={()=>markPaid(row.id)}><WalletCards size={15}/>Mark paid</button>}</div>
     </article>)}</div>}
   </div>
 </section>
}
function Label({t,wide=false,children}:{t:string;wide?:boolean;children:React.ReactNode}){return <label className={wide?'wide':''}><span>{t}</span>{children}</label>}
function Detail({l,v}:{l:string;v:any}){return <div><small>{l}</small><strong>{v||'—'}</strong></div>}
function Kpi({label,value,icon:Icon}:{label:string;value:any;icon:React.ElementType}){return <div><span><Icon size={17}/></span><small>{label}</small><strong>{value}</strong></div>}
