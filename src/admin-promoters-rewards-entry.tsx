import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Loader2,LockKeyhole,LogIn,Mail,ShieldCheck} from 'lucide-react';
import AdminPromotersRewards from './AdminPromotersRewards';
import {supabase} from './supabase';
import './styles.css';
import './admin-promoters-rewards.css';

function AdminGate(){
  const [checking,setChecking]=useState(true);
  const [authorized,setAuthorized]=useState(false);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);

  async function verifyAdmin(){
    setChecking(true);
    setError('');
    const {data:{session}}=await supabase.auth.getSession();
    if(!session){setAuthorized(false);setChecking(false);return}
    const {data,error}=await supabase.rpc('is_admin');
    if(error||data!==true){
      setAuthorized(false);
      setError('This signed-in account is not authorized to manage Dright campaigns.');
    }else{
      setAuthorized(true);
    }
    setChecking(false);
  }

  useEffect(()=>{
    verifyAdmin();
    const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{verifyAdmin()});
    return()=>subscription.unsubscribe();
  },[]);

  async function signIn(e:React.FormEvent){
    e.preventDefault();
    setBusy(true);setError('');setNotice('');
    const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
    if(error)setError(error.message);else await verifyAdmin();
    setBusy(false);
  }

  async function sendLink(){
    if(!email.trim()){setError('Enter the admin email address first.');return}
    setBusy(true);setError('');setNotice('');
    const {error}=await supabase.auth.signInWithOtp({
      email:email.trim(),
      options:{emailRedirectTo:`${window.location.origin}/admin-promoters-rewards`}
    });
    if(error)setError(error.message);
    else setNotice('A secure sign-in link has been sent to the admin email address.');
    setBusy(false);
  }

  async function signOut(){
    await supabase.auth.signOut();
    setAuthorized(false);
  }

  if(checking)return <main className="apr-gate-page"><div className="apr-gate-card apr-gate-loading"><Loader2 className="apr-spin"/><strong>Checking admin access…</strong></div></main>;

  if(!authorized)return <main className="apr-gate-page">
    <section className="apr-gate-card">
      <div className="apr-gate-icon"><LockKeyhole size={28}/></div>
      <span className="apr-gate-kicker">DRIGHT ADMIN</span>
      <h1>Promoters Rewards Campaign</h1>
      <p>Sign in with an authorized Dright1 admin account to configure rewards, verify screenshots and manage payouts.</p>
      {error&&<div className="apr-error">{error}</div>}
      {notice&&<div className="apr-notice">{notice}</div>}
      <form className="apr-login-form" onSubmit={signIn}>
        <label><span>Email</span><input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Admin email"/></label>
        <label><span>Password</span><input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/></label>
        <button className="apr-login-primary" disabled={busy}>{busy?<Loader2 className="apr-spin" size={17}/>:<LogIn size={17}/>}Sign in</button>
      </form>
      <button className="apr-login-link" type="button" disabled={busy} onClick={sendLink}><Mail size={16}/>Send secure sign-in link instead</button>
      <div className="apr-gate-security"><ShieldCheck size={16}/><span>Campaign administration remains protected by Supabase authentication and row-level security.</span></div>
    </section>
  </main>;

  return <main className="admin-panel-page">
    <section className="admin-panel-main" style={{maxWidth:'1400px',margin:'0 auto',width:'100%'}}>
      <div className="apr-session-bar"><span>Authorized admin session</span><button onClick={signOut}>Sign out</button></div>
      <AdminPromotersRewards/>
    </section>
  </main>;
}

const root=document.getElementById('root');
if(root)createRoot(root).render(<React.StrictMode><AdminGate/></React.StrictMode>);
