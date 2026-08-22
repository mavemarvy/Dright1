import React, { useState } from 'react';
import { ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { GoogleAuthButton } from './AuthPages';
import './auth.css';

type GetStartedProps = {
  onSignUp: () => void;
  onSignIn: () => void;
  onBack: () => void;
};

export default function GetStartedPage({ onSignUp, onSignIn, onBack }: GetStartedProps) {
  const [error, setError] = useState('');

  return (
    <div className="auth-page">
      <div className="auth-card get-started-card">
        <div className="auth-mark"><span>D</span></div>
        <div className="auth-heading">
          <span className="auth-kicker">DRIGHT</span>
          <h1>Get started</h1>
          <p>Choose how you want to continue to DRIGHT.</p>
        </div>

        <div className="get-started-actions">
          <button type="button" className="auth-submit" onClick={onSignUp}>
            <UserPlus size={17} />
            Sign up
            <ArrowRight size={17} />
          </button>
          <button type="button" className="auth-secondary" onClick={onSignIn}>
            <LogIn size={17} />
            Sign in
            <ArrowRight size={17} />
          </button>
        </div>

        <div className="auth-divider"><span>or</span></div>

        <GoogleAuthButton label="Continue with Google" onError={setError} />
        {error && <div className="auth-error">{error}</div>}

        <div className="auth-future-methods" aria-label="Additional sign-in methods coming later">
          <span>Other sign-in methods</span>
          <small>More options can be added here later.</small>
        </div>

        <button className="auth-back" type="button" onClick={onBack}>Back to DRIGHT</button>
      </div>
    </div>
  );
}
