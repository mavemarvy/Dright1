import React,{useEffect,useMemo,useState} from 'react';
import {ArrowRight,Check,CheckCircle2,Copy,ExternalLink,Flame,Gift,ImagePlus,Loader2,LockKeyhole,ShieldCheck,Trophy,UploadCloud,Zap} from 'lucide-react';
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
  hero_title:'Share it. Prove it. Get rewarded.',
  hero_subtitle:'A simple Dright reward challenge: copy the campaign message, share it, upload proof and submit for verification.',
  currency:'NGN',reward_amount:1000,winner_limit:50,approved_count:0,
  share_text:'Dright is opening up more ways for people to earn, sell, promote, work and grow online. I found this opportunity and thought you might want to check it out. Message me for the details.',
  platforms:['Telegram','WhatsApp','WhatsApp Business','Messenger','Facebook','Snapchat','Instagram','X','TikTok'],redirect_url:'https://dright.store',
  redirect_label:'Discover more ways to earn online',status:'active'
};
const money=(amount:number,currency:string)=>new Intl.NumberFormat('en-NG',{style:'currency',currency,maximumFractionDigits:0}).format(amount||0);
const HOOKS=['ONE MESSAGE. ONE QUICK MISSION.','COPY IT. SHARE IT. SHOW PROOF.','FIRST VERIFIED SHARES TAKE THE SPOTS.','YOUR NEXT ONLINE OPPORTUNITY CAN START HERE.'];
const SOCIALS=[
  {name:'Telegram',slug:'telegram',bg:'#229ED9'},
  {name:'WhatsApp',slug:'whatsapp',bg:'#25D366'},
  {name:'WhatsApp Business',slug:'whatsapp',bg:'#0B9A58',business:true},
  {name:'Messenger',slug:'messenger',bg:'linear-gradient(135deg,#00B2FF,#8A3AB9,#FF4F9A)'},
  {name:'Facebook',slug:'facebook',bg:'#1877F2'},
  {name:'Snapchat',slug:'snapchat',bg:'#FFFC00',fg:'#050505'},
  {name:'Instagram',slug:'instagram',bg:'linear-gradient(135deg,#FEDA75,#FA7E1E 28%,#D62976 55%,#962FBF 76%,#4F5BD5)'},
  {name:'X',slug:'x',bg:'#050505'},
  {name:'TikTok',slug:'tiktok',bg:'#050505'}
];

export default function PromotersRewardsCampaign(){
  const [campaign,setCampaign]=useState<Campaign>(FALLBACK);
  const [loading,setLoading]=useState(true);
  const [serviceReady,setServiceReady]=useState(true);
  const [copied,setCopied]=useState(false);
  const [copiedOnce,setCopiedOnce]=useState(false);
  const [sharedOn,setSharedOn]=useState('');
  const [shareNotice,setShareNotice]=useState('');
  const [file,setFile]=useState<File|null>(null);
  const [submitting,setSubmitting]=useState(false);
  const [submitError,setSubmitError]=useState('');
  const [status,setStatus]=useState<StatusResult|null>(null);
  const [statusToken,setStatusToken]=useState(()=>localStorage.getItem('promoters-rewards-status-token')||'');
  const [hookIndex,setHookIndex]=useState(0);
  const [form,setForm]=useState({full_name:'',contact:'',platform:'WhatsApp',payout_method:'Bank Transfer',bank_name:'',account_name:'',account_number:''});

  useEffect(()=>{loadCampaign()},[]);
  useEffect(()=>{if(statusToken)refreshStatus(statusToken)},[statusToken]);
  useEffect(()=>{const timer=window.setInterval(()=>setHookIndex(i=>(i+1)%HOOKS.length),2100);return()=>window.clearInterval(timer)},[]);

  async function loadCampaign(){
    setLoading(true);
    const {data,error}=await supabase.from('promoter_campaigns').select('id,slug,title,hero_title,hero_subtitle,currency,reward_amount,winner_limit,approved_count,share_text,platforms,redirect_url,redirect_label,status').eq('slug',SLUG).maybeSingle();
    if(error||!data){setServiceReady(false);setCampaign(FALLBACK)}
    else{setCampaign(data as Campaign);setServiceReady(true);setForm(v=>({...v,platform:(data.platforms||[])[0]||'WhatsApp'}))}
    setLoading(false);
  }

  async function copyCampaignText(showCopied=true){
    try{
      await navigator.clipboard.writeText(campaign.share_text);
    }catch{
      const textarea=document.createElement('textarea');
      textarea.value=campaign.share_text;
      textarea.style.position='fixed';
      textarea.style.opacity='0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    setCopiedOnce(true);
    if(showCopied){
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1800);
    }
  }

  async function copyText(){
    await copyCampaignText(true);
  }

  async function shareTo(platform:string){
    await copyCampaignText(false);
    setCopied(true);
    setSharedOn(platform);
    setForm(v=>({...v,platform}));
    setShareNotice(`${platform}: message copied. Opening the app so you can send it.`);
    window.setTimeout(()=>setCopied(false),1800);

    const text=encodeURIComponent(campaign.share_text);
    const destinations:Record<string,string>={
      Telegram:`https://t.me/share/url?url=&text=${text}`,
      WhatsApp:`https://wa.me/?text=${text}`,
      'WhatsApp Business':`whatsapp-business://send?text=${text}`,
      Messenger:'https://www.messenger.com/',
      Facebook:'https://www.facebook.com/',
      Snapchat:'https://www.snapchat.com/',
      Instagram:'https://www.instagram.com/',
      X:`https://twitter.com/intent/tweet?text=${text}`,
      TikTok:'https://www.tiktok.com/'
    };

    const destination=destinations[platform];
    if(destination)window.location.href=destination;
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
  const claimedPercent=Math.min(100,(campaign.approved_count/Math.max(campaign.winner_limit,1))*100);
  const missionDone=[copiedOnce,Boolean(sharedOn),Boolean(file)].filter(Boolean).length;
  const missionPercent=(missionDone/3)*100;
  const redirectLabel=campaign.redirect_label||'Discover more ways to earn online';
  const result=useMemo(()=>status?statusCopy(status,campaign):null,[status,campaign]);

  return <main className="prc-page">
    <div className="prc-floating-orb orb-one"/><div className="prc-floating-orb orb-two"/>
    <section className="prc-shell">
      <header className="prc-topbar">
        <div className="prc-brand"><div className="prc-mark"><span>D</span></div><div><strong>DRIGHT</strong><span>Promoters Rewards</span></div></div>
        <div className="prc-live"><i/> LIVE CHALLENGE</div>
      </header>

      <section className="prc-hero">
        <div className="prc-hero-copy">
          <div className="prc-kicker"><Zap size={17}/> QUICK REWARD MISSION</div>
          <div className="prc-hook-wrap"><span key={hookIndex} className="prc-hook">{HOOKS[hookIndex]}</span></div>
          <h1>{campaign.hero_title}</h1>
          <p>{campaign.hero_subtitle}</p>
          <div className="prc-hero-chips"><span><Check/>Copy message</span><span><Check/>Share on a listed app</span><span><Check/>Upload proof</span></div>
        </div>
        <div className="prc-prize-stage" aria-hidden="true">
          <div className="prc-confetti c1">✦</div><div className="prc-confetti c2">●</div><div className="prc-confetti c3">✦</div><div className="prc-confetti c4">◆</div>
          <div className="prc-trophy"><Trophy size={72}/></div>
          <div className="prc-gift"><Gift size={44}/></div>
          <div className="prc-coin coin1">₦</div><div className="prc-coin coin2">₦</div><div className="prc-coin coin3">₦</div>
        </div>
      </section>

      <section className="prc-scoreboard">
        <div className="prc-reward-big"><small>EACH VERIFIED WINNER GETS</small><strong>{money(campaign.reward_amount,campaign.currency)}</strong><span>reward</span></div>
        <div className="prc-slots">
          <div className="prc-slot-title"><span><Flame size={18}/> FIRST {campaign.winner_limit}</span><b>{remaining} spots left</b></div>
          <div className="prc-slot-bar"><i style={{width:claimedPercent+'%'}}/></div>
          <small>{campaign.approved_count} verified · {remaining} remaining</small>
        </div>
      </section>

      <section className="prc-mission">
        <div className="prc-mission-head"><div><span>YOUR MISSION</span><strong>{missionDone}/3 complete</strong></div><b>{Math.round(missionPercent)}%</b></div>
        <div className="prc-mission-bar"><i style={{width:missionPercent+'%'}}/></div>
        <div className="prc-mission-steps"><MissionStep done={copiedOnce} n="1" label="Copy"/><MissionStep done={Boolean(sharedOn)} n="2" label="Share"/><MissionStep done={Boolean(file)} n="3" label="Proof"/></div>
      </section>

      {loading?<div className="prc-state"><Loader2 className="prc-spin"/>Loading campaign…</div>:
      result?<ResultCard result={result} campaign={campaign} onCheck={()=>refreshStatus()}/>:
      remaining===0?<ResultCard result={statusCopy({status:'valid_but_full',verification_note:null,payout_status:'not_required',updated_at:new Date().toISOString()},campaign)} campaign={campaign} onCheck={()=>{}}/>:
      <>
        <section className="prc-card prc-message-card">
          <div className="prc-section-title"><div className="prc-section-icon">01</div><div><span>CAMPAIGN MESSAGE</span><h2>Copy exactly. Share quickly.</h2></div></div>
          <div className="prc-share-box"><p>{campaign.share_text}</p><button type="button" className="prc-copy-mini" onClick={()=>copyCampaignText(true)}><Copy size={20}/></button></div>
          <button className="prc-copy-main" type="button" onClick={()=>copyCampaignText(true)}>{copied?<><Check size={20}/>MESSAGE COPIED</>:<><Copy size={20}/>COPY CAMPAIGN MESSAGE</>}</button>
        </section>

        <section className="prc-card prc-share-card">
          <div className="prc-section-title"><div className="prc-section-icon">02</div><div><span>CHOOSE WHERE TO SHARE</span><h2>Big app buttons. One tap.</h2></div></div>
          <div className="prc-social-grid">{SOCIALS.map(s=><SocialBubble key={s.name} platform={s} active={sharedOn===s.name} onClick={()=>shareTo(s.name)}/>)}</div>
          {shareNotice&&<div className="prc-share-notice"><CheckCircle2 size={17}/>{shareNotice}</div>}
          <p className="prc-note">WhatsApp, Telegram and X can receive the text pre-filled. Other apps open after the message is copied so you can paste it. Dright never posts without your action.</p>
        </section>

        <form className="prc-card prc-form" onSubmit={submit}>
          <div className="prc-section-title"><div className="prc-section-icon">03</div><div><span>PROOF + PAYOUT</span><h2>Show us the share.</h2></div></div>
          <label className={'prc-upload '+(file?'has-file':'')}>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/>
            <div className="prc-upload-icon">{file?<CheckCircle2 size={30}/>:<UploadCloud size={32}/>}</div>
            <strong>{file?'Screenshot ready':'Tap to upload your screenshot'}</strong>
            <small>{file?file.name:'PNG, JPG or WEBP · maximum 5 MB'}</small>
          </label>
          <div className="prc-grid">
            <Field label="Full name"><input required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} placeholder="Your full name"/></Field>
            <Field label="Phone number or email"><input required value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} placeholder="How we can identify you"/></Field>
            <Field label="Shared on"><select value={form.platform} onChange={e=>setForm({...form,platform:e.target.value})}>{campaign.platforms.map(p=><option key={p}>{p}</option>)}</select></Field>
            <Field label="Reward method"><select value={form.payout_method} onChange={e=>setForm({...form,payout_method:e.target.value})}><option>Bank Transfer</option><option>OPay</option><option>PalmPay</option><option>Moniepoint</option></select></Field>
            <Field label="Bank / wallet"><input required value={form.bank_name} onChange={e=>setForm({...form,bank_name:e.target.value})} placeholder="Bank or wallet"/></Field>
            <Field label="Account name"><input required value={form.account_name} onChange={e=>setForm({...form,account_name:e.target.value})} placeholder="Account holder"/></Field>
            <Field label="Account number"><input required inputMode="numeric" autoComplete="off" value={form.account_number} onChange={e=>setForm({...form,account_number:e.target.value.replace(/\D/g,'').slice(0,16)})} placeholder="Account number"/></Field>
          </div>
          {submitError&&<div className="prc-error">{submitError}</div>}
          <button className="prc-submit" disabled={submitting}>{submitting?<><Loader2 className="prc-spin" size={20}/>SUBMITTING…</>:<><ImagePlus size={20}/>SUBMIT PROOF FOR VERIFICATION</>}</button>
          <div className="prc-security"><LockKeyhole size={17}/><span>Your screenshot and payout details are private and only visible to authorized campaign administrators.</span></div>
        </form>
      </>}

      <section className="prc-discover-card">
        <div className="prc-discover-glow"/>
        <div><span>DON'T STOP AT ONE OPPORTUNITY</span><h2>Discover more ways to earn online</h2><p>Explore more Dright opportunities after you finish this challenge.</p></div>
        {campaign.redirect_url&&<a className="prc-discover-button" href={campaign.redirect_url} target="_blank" rel="noopener noreferrer"><span className="prc-discover-gift"><Gift size={28}/></span><span className="prc-discover-copy"><strong>{redirectLabel}</strong><small>Tap to explore more opportunities on Dright</small></span><span className="prc-discover-arrow"><ArrowRight size={26}/></span></a>}
      </section>
    </section>

    {campaign.redirect_url&&<a className="prc-sticky-cta" href={campaign.redirect_url} target="_blank" rel="noopener noreferrer"><span className="prc-sticky-spark">✦</span><span className="prc-sticky-copy"><strong>Discover more ways to earn online</strong><small>Tap here to explore Dright opportunities</small></span><span className="prc-sticky-arrow"><ArrowRight size={24}/></span></a>}
  </main>
}

function SocialBubble({platform,active,onClick}:{platform:any;active:boolean;onClick:()=>void}){
  const color=platform.fg||'#fff';
  const src='https://cdn.simpleicons.org/'+platform.slug+'/'+color.replace('#','');
  return <button type="button" className={'prc-social-bubble '+(active?'active':'')} onClick={onClick} aria-label={'Share with '+platform.name}>
    <span className="prc-app-icon" style={{background:platform.bg}}><img src={src} alt=""/>{platform.business&&<b>B</b>}</span>
    <strong>{platform.name==='WhatsApp Business'?'WA Business':platform.name}</strong>
    {active&&<i><Check size={12}/></i>}
  </button>
}
function MissionStep({done,n,label}:{done:boolean;n:string;label:string}){return <div className={done?'done':''}><b>{done?<Check size={15}/>:n}</b><span>{label}</span></div>}

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
