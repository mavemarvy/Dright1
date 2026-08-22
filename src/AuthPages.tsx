import React, { FormEvent, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserPlus } from 'lucide-react';
import { supabase, DRIGHT1_AUTH_REDIRECT } from './supabase';
import './auth.css';

type AuthPageProps = { onBack: () => void; onAuthenticated: () => void };

export function GoogleAuthButton({ label = 'Continue with Google', onError }: { label?: string; onError?: (message: string) => void }) {
  const [loading, setLoading] = useState(false);
  const continueWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: DRIGHT1_AUTH_REDIRECT } });
    if (error) { setLoading(false); onError?.(error.message); }
  };
  return <button type="button" className="auth-google" onClick={continueWithGoogle} disabled={loading}><span className="google-g">G</span>{loading ? 'Connecting to Google…' : label}</button>;
}

export default function SignInPage({ onBack, onAuthenticated }: AuthPageProps) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false);
  const signIn = async (e: FormEvent) => { e.preventDefault(); setError(''); setMessage(''); setLoading(true); const { error } = await supabase.auth.signInWithPassword({ email, password }); setLoading(false); if (error) { setError(error.message); return; } onAuthenticated(); };
  const resetPassword = async () => { setError(''); setMessage(''); if (!email) { setError('Enter your email address first.'); return; } const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: DRIGHT1_AUTH_REDIRECT }); if (error) setError(error.message); else setMessage('Password reset instructions have been sent to your email.'); };
  return <div className="auth-page"><div className="auth-card"><div className="auth-mark"><span>D</span></div><div className="auth-heading"><span className="auth-kicker">DRIGHT</span><h1>Welcome back</h1><p>Sign in to continue to your DRIGHT account.</p></div><GoogleAuthButton onError={setError}/><div className="auth-divider"><span>or continue with email</span></div><form className="auth-form" onSubmit={signIn}><label className="auth-field"><span>Email</span><div><Mail size={16}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div></label><label className="auth-field"><span>Password</span><div><LockKeyhole size={16}/><input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password" required/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>{error&&<div className="auth-error">{error}</div>}{message&&<div className="auth-message">{message}</div>}<button className="auth-submit" type="submit" disabled={loading}>{loading?'Signing in…':'Sign in'} <ArrowRight size={17}/></button></form><div className="auth-links"><button type="button" onClick={resetPassword}>Forgot password?</button><button type="button" onClick={()=>onBack()}>Create an account</button></div><button className="auth-back" type="button" onClick={onBack}><UserPlus size={15}/> Back to DRIGHT</button></div></div>;
}
