import React,{useEffect,useMemo,useState} from 'react';
import {ArrowRight,Banknote,Check,CheckCircle2,Clipboard,Copy,ExternalLink,Facebook,ImagePlus,Loader2,ShieldCheck,Sparkles,UploadCloud} from 'lucide-react';
import {supabase} from './supabase';
import './promoters-rewards-campaign.css';

type Campaign={
  id:string;slug:string;title:string;hero_title:string;hero_subtitle:string;currency:string;
  reward_amount:number;winner_limit:number;approved_count:number;share_text:string;
  platforms:string[];redirect_url:string|null;redirect_label:string;status:string
};
type StatusResult={status:string;verification_note:string|null;payout_status:string;updated_at:string};
const SLUG='promoters-rewards-campaign';
const STORAGE_BUCKET='promoter-proof';
const FALLBACK:Campaign={
  id:'00000000-0000-0000-0000-000000000000',slug:SLUG,title:'Promoters Rewards Campaign',
  hero_title:'Share. Submit proof. Earn a reward.',
  hero_subtitle:'Share the campaign message on an approved social platform, upload a screenshot and submit your reward details for verification.',
  currency:'NGN',reward_amount:1000,winner_limit:50,approved_count:0,
  share_text:'Want to learn how affiliate marketing and online selling work? I found a free guide for beginners. Message me if you want the details.',
  platforms:['WhatsApp','Snapchat','Facebook'],redirect_url:'https://dright.store',
  redirect_label:'See more ways to earn money online',status:'active'
};
const money=(amount:number,currency:string)=>new Intl.NumberFormat('en-NG',{style:'currency',currency,maximumFractionDigits:0}).format(amount||0);

export default function PromotersRewardsCampaign(){
  const [campaign,setCampaign]=useState<Campaign>(FALLBACK);
  const [loading,setLoading]=useState(true);
  const [serviceReady,setServiceReady]=useState(true);
  const [copied,setCopied]=useState(false);
  const [file,setFile]=useState<File|null>(null);
  const [submitting,setSubmitting]=useState(false);
  const [submitError,setSubmitError]=useState('');
  const [status,setStatus]=useState<StatusResult|null>(null);
  const [statusToken,setStatusToken]=useState(()=>localStorage.getItem('promoters-rewards-status-token')||'');
  const [form,setForm]=useState({full_name:'',contact:'',platform:'WhatsApp',payout_method:'Bank Transfer',bank_name:'',account_name:'',account_number:''});

  useEffect(()=>{loadCampaign()},[]);
  useEffect(()=>{if(statusToken)refreshStatus(statusToken)},[statusToken]);

  async function loadCampaign(){
    setLoading(true);
    const {data,error}=await supabase.from('promoter_campaigns').select('id,slug,title,hero_title,hero_subtitle,currency,reward_amount,winner_limit,approved_count,share_text,platforms,redirect_url,redirect_label,status').eq('slug',SLUG).maybeSingle();
    if(error||!data){setServiceReady(false);setCampaign(FALLBACK)}
    else{setCampaign(data as Campaign);setServiceReady(true);setForm(v=>({...v,platform:(data.platforms||[])[0]||'WhatsApp'}))}
    setLoading(false);
  }

  async function copyText(){
    await navigator.clipboard.writeText(campaign.share_text);
    setCopied(true);
    window.setTimeout(()=>setCopied(false),1800);
  }

  async function refreshStatus(token=statusToken){
    if(!token)return;
    const {data,error}=await supabase.rpc('get_promoter_submission_status',{p_token:token});
    if(error)return;
    const row=Array.isArray(data)?data[0]:data;
    if(row)setStatus(row as StatusResult);
  }

  async function submit(e:React.FormEvent){
    e.preventDefault();
    setSubmitError('');
    if(!serviceReady){setSubmitError('Campaign submissions are temporarily unavailable. Please try again when the Dright1 campaign service is online.');return}
    if(!file){setSubmitError('Upload the screenshot showing that you shared the message.');return}
    if(file.size>5*1024*1024){setSubmitError('Screenshot must be 5 MB or smaller.');return}
    if(!file.type.startsWith('image/')){setSubmitError('Please upload an image screenshot.');return}
    if(campaign.approved_count>=campaign.winner_limit){setStatus({status:'valid_but_full',verification_note:null,payout_status:'not_required',updated_at:new Date().toISOString()});return}

    setSubmitting(true);
    const id=crypto.randomUUID();
    const token=crypto.randomUUID();
    const extension=(file.name.split('.').pop()||'jpg').replace(/[^a-zA-Z0-9]/g,'').slice(0,8)||'jpg';
    const proofPath=`submissions/${campaign.id}/${id}.${extension}`;
    const {error:uploadError}=await supabase.storage.from(STORAGE_BUCKET).upload(proofPath,file,{cacheControl:'3600',upsert:false,contentType:file.type});
    if(uploadError){setSubmitError('We could not upload your screenshot. Please try again.');setSubmitting(false);return}

    const {error}=await supabase.from('promoter_reward_submissions').insert({
      id,campaign_id:campaign.id,status_token:token,full_name:form.full_name.trim(),contact:form.contact.trim(),
      platform:form.platform,payout_method:form.payout_method,bank_name:form.bank_name.trim(),
      account_name:form.account_name.trim(),account_number:form.account_number.trim(),proof_path:proofPath,status:'pending'
    });
    if(error){
      setSubmitError(error.code==='23505'?'This contact has already submitted a reward claim for this campaign.':'We could not submit your proof. Please check your details and try again.');
      setSubmitting(false);return
    }
    localStorage.setItem('promoters-rewards-status-token',token);
    setStatusToken(token);
    setStatus({status:'pending',verification_note:null,payout_status:'unpaid',updated_at:new Date().toISOString()});
    setSubmitting(false);
  }

  const remaining=Math.max(0,campaign.winner_limit-campaign.approved_count);
  const result=useMemo(()=>status?statusCopy(status,campaign):null,[status,campaign]);

  return <main className="prc-page">
    <section className="prc-shell">
      <header className="prc-brand"><div className="prc-mark">D</div><div><strong>DRIGHT</strong><span>{campaign.title}</span></div></header>

      <div className="prc-hero">
        <div className="prc-badge"><Sparkles size={16}/> Promoters Rewards Campaign</div>
        <h1>{campaign.hero_title}</h1>
        <p>{campaign.hero_subtitle}</p>
        <div className="prc-reward-card">
          <span>Reward per successful verification</span>
          <strong>{money(campaign.reward_amount,campaign.currency)}</strong>
          <small>{remaining} of {campaign.winner_limit} reward slots currently remain</small>
        </div>
      </div>

      {loading?<div className="prc-state"><Loader2 className="prc-spin"/>Loading campaign…</div>:
      result?<ResultCard result={result} campaign={campaign} onCheck={()=>refreshStatus()}/>:
      remaining===0?<ResultCard result={statusCopy({status:'valid_but_full',verification_note:null,payout_status:'not_required',updated_at:new Date().toISOString()},campaign)} campaign={campaign} onCheck={()=>{}}/>:
      <div className="prc-flow">
        <section className="prc-card">
          <div className="prc-step"><span>1</span><div><strong>Copy the message</strong><small>Do not edit the campaign text before sharing.</small></div></div>
          <div className="prc-share-box">{campaign.share_text}</div>
          <button className="prc-primary" type="button" onClick={copyText}>{copied?<><Check size={18}/>Copied</>:<><Copy size={18}/>Copy text</>}</button>
          <div className="prc-platforms">{campaign.platforms.map(p=><span key={p}>{p==='Facebook'?<Facebook size={15}/>:<Clipboard size={15}/>} {p}</span>)}</div>
          <p className="prc-note">Sharing is manual. This page does not post to your social account and the campaign message does not automatically include a website link.</p>
        </section>

        <form className="prc-card prc-form" onSubmit={submit}>
          <div className="prc-step"><span>2</span><div><strong>Submit your proof</strong><small>Upload the screenshot, then add the reward account details.</small></div></div>
          <label className="prc-upload">
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/>
            <UploadCloud size={26}/>
            <strong>{file?file.name:'Upload screenshot'}</strong>
            <small>PNG, JPG or WEBP · maximum 5 MB</small>
          </label>
          <div className="prc-grid">
            <Field label="Full name"><input required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></Field>
            <Field label="Phone number or email"><input required value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})}/></Field>
            <Field label="Shared on"><select value={form.platform} onChange={e=>setForm({...form,platform:e.target.value})}>{campaign.platforms.map(p=><option key={p}>{p}</option>)}</select></Field>
            <Field label="Reward method"><select value={form.payout_method} onChange={e=>setForm({...form,payout_method:e.target.value})}><option>Bank Transfer</option><option>OPay</option><option>PalmPay</option><option>Moniepoint</option></select></Field>
            <Field label="Bank / wallet"><input required value={form.bank_name} onChange={e=>setForm({...form,bank_name:e.target.value})}/></Field>
            <Field label="Account name"><input required value={form.account_name} onChange={e=>setForm({...form,account_name:e.target.value})}/></Field>
            <Field label="Account number"><input required inputMode="numeric" autoComplete="off" value={form.account_number} onChange={e=>setForm({...form,account_number:e.target.value.replace(/\D/g,'').slice(0,16)})}/></Field>
          </div>
          {submitError&&<div className="prc-error">{submitError}</div>}
          <button className="prc-primary prc-submit" disabled={submitting}>{submitting?<><Loader2 className="prc-spin" size={18}/>Submitting…</>:<><ImagePlus size={18}/>Submit proof for verification</>}</button>
          <div className="prc-security"><ShieldCheck size={16}/><span>Your payout details and screenshot are private and are only available to authorized campaign administrators.</span></div>
        </form>
      </div>}
    </section>
  </main>
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="prc-field"><span>{label}</span>{children}</label>}

function ResultCard({result,campaign,onCheck}:{result:{tone:string,title:string,body:string,showRedirect:boolean};campaign:Campaign;onCheck:()=>void}){
  return <section className={`prc-result ${result.tone}`}>
    <div className="prc-result-icon"><CheckCircle2 size={28}/></div>
    <h2>{result.title}</h2><p>{result.body}</p>
    <div className="prc-result-actions">
      {result.showRedirect&&campaign.redirect_url&&<a className="prc-primary" href={campaign.redirect_url} target="_blank" rel="noopener noreferrer">{campaign.redirect_label}<ExternalLink size={17}/></a>}
      {!result.showRedirect&&<button className="prc-secondary" onClick={onCheck}>Check verification status</button>}
    </div>
  </section>
}

function statusCopy(s:StatusResult,c:Campaign){
  if(s.status==='approved')return s.payout_status==='paid'
    ?{tone:'success',title:'Reward sent successfully',body:`Your ${money(c.reward_amount,c.currency)} reward has been marked as paid.`,showRedirect:false}
    :{tone:'success',title:'Your proof was verified',body:`Congratulations. Your submission qualified for the ${money(c.reward_amount,c.currency)} reward and is waiting for payout processing.`,showRedirect:false};
  if(s.status==='valid_but_full')return {tone:'full',title:'The rewarded slots are already filled',body:`Your proof can be valid, but the first ${c.winner_limit} verified reward slots have already been claimed. You can still see other ways to earn online.`,showRedirect:true};
  if(['rejected','invalid','duplicate'].includes(s.status))return {tone:'rejected',title:'Your proof was not accepted',body:s.verification_note||'This submission did not pass campaign verification. You can still see other ways to earn online.',showRedirect:true};
  return {tone:'pending',title:'Proof received',body:'Your screenshot and reward details are waiting for verification. Keep this page or return later to check the result.',showRedirect:false};
}
