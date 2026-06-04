import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const GOOGLE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/google`;
const CARD_BASE_H = 500;

/* ─── Styles ─── */
const S = {
  page: {
    position: 'fixed', inset: 0,
    background: 'linear-gradient(135deg, #08081a 0%, #0d0d22 50%, #0a0818 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  card: {
    width: '100%', maxWidth: '620px',
    borderRadius: '16px', overflow: 'hidden',
    display: 'flex', boxShadow: '0 24px 80px rgba(0,0,0,0.65)',
    transformOrigin: 'center center',
  },
  left: {
    flex: '0 0 40%',
    background: 'linear-gradient(170deg, #0b0f33 0%, #0d1040 40%, #11083a 75%, #0e0c35 100%)',
    padding: '32px 24px 26px',
    display: 'flex', flexDirection: 'column',
    position: 'relative', overflow: 'hidden',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  logoText: { color: '#ffffff', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' },
  tagline: {
    color: '#ffffff', fontSize: '22px', fontWeight: 800,
    lineHeight: 1.25, margin: '20px 0 6px', letterSpacing: '-0.3px',
  },
  accent: { color: '#7c72ff' },
  desc: { color: 'rgba(255,255,255,0.5)', fontSize: '11.5px', lineHeight: 1.6, margin: 0 },
  featureList: { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 },
  featureItem: { display: 'flex', alignItems: 'center', gap: '10px' },
  featureDot: {
    width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
    background: 'rgba(124,114,255,0.18)', border: '1px solid rgba(124,114,255,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px',
  },
  featureText: { color: 'rgba(255,255,255,0.7)', fontSize: '11px', lineHeight: 1.4 },
  badge: {
    display: 'flex', alignItems: 'center', gap: '7px',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', padding: '7px 10px', marginTop: 'auto',
  },
  badgeIcon: {
    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
    background: 'rgba(120,110,255,0.2)', border: '1px solid rgba(120,110,255,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  badgeT1: { color: '#dde0ff', fontSize: '9.5px', fontWeight: 600, margin: 0, lineHeight: 1.4 },
  badgeT2: { color: 'rgba(255,255,255,0.4)', fontSize: '9px', margin: 0 },

  right: {
    flex: 1, background: '#ffffff',
    padding: '28px 32px 22px',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
  },
  title: { color: '#0f172a', fontSize: '20px', fontWeight: 700, textAlign: 'center', margin: '0 0 2px', letterSpacing: '-0.3px' },
  subtitle: { color: '#6b7280', fontSize: '11.5px', textAlign: 'center', margin: '0 0 16px' },
  oauthBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    width: '100%', padding: '9px 12px', borderRadius: '8px',
    border: '1px solid #e0e4ef', background: '#ffffff',
    color: '#1e293b', fontSize: '12.5px', fontWeight: 500,
    cursor: 'pointer', textDecoration: 'none', boxSizing: 'border-box',
    transition: 'background 0.15s',
  },
  divider: { display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0 12px' },
  divLine: { flex: 1, height: '1px', background: '#e5e7eb' },
  divText: { color: '#9ca3af', fontSize: '11px' },
  label: { display: 'block', color: '#374151', fontSize: '11px', fontWeight: 500, marginBottom: '3px' },
  fieldWrap: {
    display: 'flex', alignItems: 'center',
    border: '1px solid #e0e4ef', borderRadius: '7px',
    background: '#f8f9fc', overflow: 'hidden',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  fieldInput: {
    flex: 1, border: 'none', background: 'transparent',
    padding: '9px 6px', fontSize: '13px', color: '#1e293b', outline: 'none',
  },
  fieldIcon: { padding: '0 10px', color: '#9ca3af', flexShrink: 0, display: 'flex', alignItems: 'center' },
  eyeBtn: {
    padding: '0 10px', background: 'none', border: 'none',
    cursor: 'pointer', color: '#9ca3af', flexShrink: 0, display: 'flex', alignItems: 'center',
  },
  submitBtn: {
    width: '100%', padding: '10px',
    borderRadius: '8px', border: 'none',
    background: 'linear-gradient(90deg, #7b6ef6 0%, #5956e9 100%)',
    color: '#ffffff', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', boxShadow: '0 3px 12px rgba(120,110,246,0.38)',
    transition: 'box-shadow 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    marginTop: '6px',
  },
  bottomRow: { textAlign: 'center', color: '#6b7280', fontSize: '12px', marginTop: '14px' },
  link: { color: '#7b6ef6', fontWeight: 600, textDecoration: 'none', marginLeft: '4px' },
};

const onFocus = e => {
  e.currentTarget.style.borderColor = '#7b6ef6';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,110,246,0.15)';
};
const onBlur = e => {
  e.currentTarget.style.borderColor = '#e0e4ef';
  e.currentTarget.style.boxShadow = 'none';
};

/* ─── Echo Logo Mark ─── */
const EchoMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <defs>
      <linearGradient id="lm-g" x1="20%" y1="10%" x2="80%" y2="90%">
        <stop offset="0%" stopColor="#6eb5ff" />
        <stop offset="50%" stopColor="#7b6ef6" />
        <stop offset="100%" stopColor="#5956e9" />
      </linearGradient>
    </defs>
    <path d="M50 12C73.2 12 92 30.8 92 54C92 77.2 73.2 96 50 96C41 96 32.6 93.2 25.8 88.3C15.6 93.3 7.5 95.5 6.7 95.6C5.9 95.7 5.1 95 5.3 94.1C5.9 91.3 8.7 81.4 12.8 73.9C8.3 67.9 5.7 60.3 5.7 54C5.7 30.8 26.8 12 50 12Z" fill="url(#lm-g)" />
    <path d="M50 34C38.4 34 29 43.4 29 55C29 66.6 38.4 76 50 76C58.6 76 66 71 69.2 63.6L57.8 63.6C55.6 66.9 53 68 50 68C44.4 68 39.8 63.8 39 58L71 58C71 57 71 56 71 55C71 43.4 61.6 34 50 34ZM50 42C54 42 57.2 44.8 58.6 48.6L41.4 48.6C42.8 44.8 46 42 50 42Z" fill="#ffffff" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7b6ef6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ─── Main Component ─── */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [scale, setScale] = useState(1);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const scaleH = (vh - 32) / CARD_BASE_H;
      const scaleW = (vw - 32) / 620;
      setScale(Math.min(1, scaleH, scaleW));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill all fields.');
    const result = await login(email, password);
    if (result.success) {
      toast.success('Welcome back! 👋');
      navigate('/');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div style={S.page}>
      <div style={{ ...S.card, transform: `scale(${scale})` }}>

        {/* ══ LEFT PANEL ══ */}
        <div style={S.left}>
          {/* sparkle dots */}
          {[[8,14],[18,70],[28,42],[38,88],[52,18],[62,60],[72,30],[82,80]].map(([t,l],i) => (
            <div key={i} style={{ position:'absolute', borderRadius:'50%', background:'rgba(255,255,255,0.45)', width: i%3===0?'3px':'2px', height: i%3===0?'3px':'2px', top:t+'%', left:l+'%' }} />
          ))}

          <div style={S.logoRow}>
            <EchoMark size={30} />
            <span style={S.logoText}>echo</span>
          </div>

          <h2 style={S.tagline}>
            Welcome<br />
            <span style={S.accent}>back.</span>
          </h2>
          <p style={S.desc}>Sign in to continue your conversations where you left off.</p>

          <div style={S.featureList}>
            {[
              { icon: '💬', text: 'Real-time messaging with instant delivery' },
              { icon: '🔒', text: 'End-to-end encrypted conversations' },
              { icon: '🎙️', text: 'Voice notes & image sharing' },
              { icon: '🌐', text: 'Stay connected anywhere, anytime' },
            ].map(({ icon, text }, i) => (
              <div key={i} style={S.featureItem}>
                <span style={S.featureDot}>{icon}</span>
                <span style={S.featureText}>{text}</span>
              </div>
            ))}
          </div>

          <div style={S.badge}>
            <div style={S.badgeIcon}><ShieldIcon /></div>
            <div>
              <p style={S.badgeT1}>Your conversations are</p>
              <p style={S.badgeT2}>end-to-end encrypted.</p>
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div style={S.right}>
          <h1 style={S.title}>Sign in to Echo</h1>
          <p style={S.subtitle}>Enter your credentials to access your account</p>

          {/* Google */}
          <a href={GOOGLE_URL} style={S.oauthBtn}
            onMouseEnter={e => e.currentTarget.style.background = '#f8f9fc'}
            onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          <div style={S.divider}>
            <div style={S.divLine} />
            <span style={S.divText}>or sign in with email</span>
            <div style={S.divLine} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Email */}
            <div>
              <label style={S.label}>Email address</label>
              <div style={S.fieldWrap} onFocus={onFocus} onBlur={onBlur}>
                <span style={S.fieldIcon}><MailIcon /></span>
                <input id="login-email" type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  style={{ ...S.fieldInput, caretColor: '#7b6ef6' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={S.label}>Password</label>
              <div style={S.fieldWrap} onFocus={onFocus} onBlur={onBlur}>
                <span style={S.fieldIcon}><LockIcon /></span>
                <input id="login-password" type={showPw ? 'text' : 'password'} placeholder="Your password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ ...S.fieldInput, caretColor: '#7b6ef6' }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} style={S.eyeBtn}>
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button id="login-submit" type="submit" disabled={isLoading}
              style={{ ...S.submitBtn, opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => { if (!isLoading) e.currentTarget.style.boxShadow = '0 6px 24px rgba(123,110,246,0.55)'; }}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 3px 12px rgba(120,110,246,0.38)'}
            >
              {isLoading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <p style={S.bottomRow}>
            Don't have an account?
            <Link to="/register" style={S.link}>Create one</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Login;
