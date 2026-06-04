import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';

const GOOGLE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/google`;

/* ─── Inline styles to avoid Tailwind conflict ─── */
const S = {
  page: {
    position: 'fixed', inset: 0,
    background: 'linear-gradient(135deg, #08081a 0%, #0d0d22 50%, #0a0818 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  card: {
    width: '100%', maxWidth: '660px',
    borderRadius: '16px', overflow: 'hidden',
    display: 'flex', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
    transformOrigin: 'center center',
  },

  /* ── LEFT PANEL ── */
  left: {
    flex: '0 0 38%',
    background: 'linear-gradient(170deg, #0b0f33 0%, #0d1040 40%, #11083a 75%, #0e0c35 100%)',
    padding: '20px 18px 16px',
    display: 'flex', flexDirection: 'column',
    position: 'relative', overflow: 'hidden',
    minHeight: '0',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: '7px' },
  logoText: { color: '#ffffff', fontSize: '17px', fontWeight: 700, letterSpacing: '-0.3px' },
  tagline: {
    color: '#ffffff', fontSize: '18px', fontWeight: 800,
    lineHeight: 1.25, margin: '12px 0 5px', letterSpacing: '-0.3px',
  },
  taglineAccent: { color: '#7c72ff' },
  desc: { color: 'rgba(255,255,255,0.5)', fontSize: '11px', lineHeight: 1.5, margin: 0 },
  encryptedBadge: {
    display: 'flex', alignItems: 'center', gap: '7px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', padding: '6px 9px',
    marginTop: 'auto',
  },
  badgeIcon: {
    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
    background: 'rgba(120,110,255,0.2)',
    border: '1px solid rgba(120,110,255,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  badgeText1: { color: '#dde0ff', fontSize: '9.5px', fontWeight: 600, margin: 0, lineHeight: 1.4 },
  badgeText2: { color: 'rgba(255,255,255,0.4)', fontSize: '9px', margin: 0 },

  /* ── RIGHT PANEL ── */
  right: {
    flex: 1,
    background: '#ffffff',
    padding: '18px 24px 16px',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
  },
  title: {
    color: '#0f172a', fontSize: '17px', fontWeight: 700,
    textAlign: 'center', margin: '0 0 2px', letterSpacing: '-0.3px',
  },
  subtitle: { color: '#6b7280', fontSize: '11px', textAlign: 'center', margin: '0 0 10px' },

  /* OAuth buttons */
  oauthBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    width: '100%', padding: '7px 10px', borderRadius: '7px',
    border: '1px solid #e0e4ef', background: '#ffffff',
    color: '#1e293b', fontSize: '12px', fontWeight: 500,
    cursor: 'pointer', textDecoration: 'none', boxSizing: 'border-box',
    transition: 'background 0.15s',
  },

  /* Divider */
  divider: { display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 6px' },
  dividerLine: { flex: 1, height: '1px', background: '#e5e7eb' },
  dividerText: { color: '#9ca3af', fontSize: '10.5px' },

  /* Form */
  label: { display: 'block', color: '#374151', fontSize: '10.5px', fontWeight: 500, marginBottom: '2px' },
  fieldWrap: {
    display: 'flex', alignItems: 'center',
    border: '1px solid #e0e4ef', borderRadius: '6px',
    background: '#f8f9fc', overflow: 'hidden',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  fieldInput: {
    flex: 1, border: 'none', background: 'transparent',
    padding: '6px 4px', fontSize: '12px', color: '#1e293b',
    outline: 'none',
  },
  fieldIcon: { padding: '0 8px', color: '#9ca3af', flexShrink: 0, display: 'flex', alignItems: 'center' },
  eyeBtn: {
    padding: '0 8px', background: 'none', border: 'none',
    cursor: 'pointer', color: '#9ca3af', flexShrink: 0, display: 'flex', alignItems: 'center',
  },

  /* Sign Up */
  signupBtn: {
    width: '100%', padding: '8px',
    borderRadius: '6px', border: 'none',
    background: 'linear-gradient(90deg, #7b6ef6 0%, #5956e9 100%)',
    color: '#ffffff', fontSize: '12.5px', fontWeight: 600,
    cursor: 'pointer', letterSpacing: '-0.1px',
    boxShadow: '0 3px 10px rgba(120,110,246,0.35)',
    transition: 'box-shadow 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
  },
  alreadyRow: { textAlign: 'center', color: '#6b7280', fontSize: '11.5px', marginTop: '8px' },
  loginLink: { color: '#7b6ef6', fontWeight: 600, textDecoration: 'none', marginLeft: '4px' },
  termsText: { textAlign: 'center', color: '#9ca3af', fontSize: '10px', marginTop: '7px', lineHeight: 1.5 },
  termsLink: { color: '#7b6ef6', textDecoration: 'none' },
};

/* ─── Echo Logo Mark SVG ─── */
const EchoMark = ({ size = 42 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <defs>
      <linearGradient id="em-g" x1="20%" y1="10%" x2="80%" y2="90%">
        <stop offset="0%" stopColor="#6eb5ff" />
        <stop offset="50%" stopColor="#7b6ef6" />
        <stop offset="100%" stopColor="#5956e9" />
      </linearGradient>
    </defs>
    {/* speech bubble */}
    <path
      d="M50 12C73.2 12 92 30.8 92 54C92 77.2 73.2 96 50 96C41 96 32.6 93.2 25.8 88.3C15.6 93.3 7.5 95.5 6.7 95.6C5.9 95.7 5.1 95 5.3 94.1C5.9 91.3 8.7 81.4 12.8 73.9C8.3 67.9 5.7 60.3 5.7 54C5.7 30.8 26.8 12 50 12Z"
      fill="url(#em-g)"
    />
    {/* e cutout */}
    <path
      d="M50 34C38.4 34 29 43.4 29 55C29 66.6 38.4 76 50 76C58.6 76 66 71 69.2 63.6L57.8 63.6C55.6 66.9 53 68 50 68C44.4 68 39.8 63.8 39 58L71 58C71 57 71 56 71 55C71 43.4 61.6 34 50 34ZM50 42C54 42 57.2 44.8 58.6 48.6L41.4 48.6C42.8 44.8 46 42 50 42Z"
      fill="#ffffff"
    />
  </svg>
);

/* ─── Shield SVG ─── */
const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b6ef6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

/* ─── Person Icon ─── */
const PersonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

/* ─── Mail Icon ─── */
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

/* ─── Lock Icon ─── */
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

/* ─── Eye / EyeOff ─── */
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ─── Chat Bubble Illustration ─── */
const ChatIllustration = () => (
  <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '110px' }}>
    <svg style={{ position: 'absolute', bottom: 0, left: '-20px', right: '-20px', width: 'calc(100% + 40px)' }} viewBox="0 0 380 70" preserveAspectRatio="none" aria-hidden>
      <path d="M0,38 C60,8 130,60 200,33 C270,6 330,48 380,28 L380,70 L0,70Z" fill="rgba(80,60,180,0.18)" />
      <path d="M0,50 C80,28 160,58 240,42 C300,30 350,46 380,42 L380,70 L0,70Z" fill="rgba(60,40,160,0.15)" />
      <path d="M0,58 C100,46 200,65 300,54 C340,48 365,56 380,54 L380,70 L0,70Z" fill="rgba(40,25,130,0.2)" />
    </svg>
    {/* Large purple bubble */}
    <div style={{
      position: 'absolute', left: '10px', top: '8px',
      width: '118px', height: '74px',
      borderRadius: '15px 15px 15px 5px',
      background: 'linear-gradient(145deg, #7b72ff 0%, #5956dd 60%, #4845c5 100%)',
      boxShadow: '0 12px 36px rgba(90,80,220,0.5), 0 3px 12px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
      zIndex: 2,
    }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ffffff' }} />
      ))}
    </div>
    {/* Small glassy bubble */}
    <div style={{
      position: 'absolute', right: '8px', bottom: '14px',
      width: '82px', height: '50px',
      borderRadius: '11px 11px 4px 11px',
      background: 'rgba(255,255,255,0.1)',
      border: '1.5px solid rgba(255,255,255,0.18)',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 5px 18px rgba(0,0,0,0.22)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      zIndex: 1,
    }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'rgba(160,150,255,0.85)' }} />
      ))}
    </div>
  </div>
);

/* ─── Focus / blur helpers ─── */
const onFocus = e => {
  e.currentTarget.style.borderColor = '#7b6ef6';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,110,246,0.15)';
};
const onBlur = e => {
  e.currentTarget.style.borderColor = '#e0e4ef';
  e.currentTarget.style.boxShadow = 'none';
};

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const CARD_BASE_H = 560; // design height in px

const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw]   = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const navigate = useNavigate();

  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      setIsMobile(vw < 640);
      const maxH = vh - 32; // 16px top+bottom padding
      const maxW = vw - 32;
      const scaleH = maxH / CARD_BASE_H;
      const scaleW = maxW / 660; // card max-width
      setScale(Math.min(1, scaleH, scaleW));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password || !form.confirmPassword)
      return toast.error('All fields are required.');
    if (form.username.length < 3)
      return toast.error('Username must be at least 3 characters.');
    if (form.password.length < 6)
      return toast.error('Password must be at least 6 characters.');
    if (form.password !== form.confirmPassword)
      return toast.error('Passwords do not match.');
    setLoading(true);
    try {
      await axiosInstance.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
      });
      toast.success('OTP sent to your email! 📧');
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = isMobile ? {
    width: '100%',
    height: '100vh',
    maxHeight: '100vh',
    borderRadius: '0',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'none',
  } : S.card;

  const leftPanelStyle = isMobile ? {
    display: 'none',
  } : S.left;

  const rightPanelStyle = isMobile ? {
    flex: 1,
    background: '#ffffff',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: '100%',
    boxSizing: 'border-box',
  } : S.right;

  return (
    <div style={S.page}>
      <div style={isMobile ? cardStyle : { ...cardStyle, transform: `scale(${scale})` }}>

        {/* ════════ LEFT PANEL ════════ */}
        <div style={leftPanelStyle}>
          {/* Sparkle dots */}
          {[
            [8,14],[18,70],[28,42],[38,88],[52,18],[62,60],[72,30],[82,80],
          ].map(([top, left], i) => (
            <div key={i} style={{
              position: 'absolute', borderRadius: '50%',
              background: 'rgba(255,255,255,0.45)',
              width: i%3===0?'3px':'2px', height: i%3===0?'3px':'2px',
              top: top+'%', left: left+'%',
            }} />
          ))}
          {/* plus/cross sparkles */}
          {[[20,15],[60,72]].map(([top,left],i)=>(
            <div key={'c'+i} style={{position:'absolute',top:top+'%',left:left+'%',color:'rgba(255,255,255,0.25)',fontSize:'12px',fontWeight:300}}>+</div>
          ))}

          {/* Logo */}
          <div style={S.logoRow}>
            <EchoMark size={30} />
            <span style={S.logoText}>echo</span>
          </div>

          {/* Tagline */}
          <h2 style={S.tagline}>
            Speak freely.<br />
            Stay <span style={S.taglineAccent}>connected.</span>
          </h2>
          <p style={S.desc}>
            Echo is a modern, secure and<br />beautiful chat app for everyone.
          </p>

          {/* Chat Bubble Illustration */}
          <ChatIllustration />

          {/* Encrypted badge */}
          <div style={S.encryptedBadge}>
            <div style={S.badgeIcon}><ShieldIcon /></div>
            <div>
              <p style={S.badgeText1}>Your conversations are</p>
              <p style={S.badgeText2}>end-to-end encrypted.</p>
            </div>
          </div>
        </div>

        {/* ════════ RIGHT PANEL ════════ */}
        <div style={rightPanelStyle}>
          <h1 style={S.title}>Create your account</h1>
          <p style={S.subtitle}>Let's get started with your new Echo account</p>

          {/* Continue with Google */}
          <a href={GOOGLE_URL}
            style={{ ...S.oauthBtn, marginBottom: '0' }}
            onMouseEnter={e => e.currentTarget.style.background='#f8f9fc'}
            onMouseLeave={e => e.currentTarget.style.background='#ffffff'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          {/* or divider */}
          <div style={S.divider}>
            <div style={S.dividerLine} />
            <span style={S.dividerText}>or</span>
            <div style={S.dividerLine} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* Full Name */}
            <div>
              <label style={S.label}>Full Name</label>
              <div style={S.fieldWrap} onFocus={onFocus} onBlur={onBlur}>
                <span style={S.fieldIcon}><PersonIcon /></span>
                <input id="reg-username" name="username" type="text"
                  placeholder="Enter your full name"
                  value={form.username} onChange={handleChange}
                  autoComplete="name"
                  style={{ ...S.fieldInput, caretColor: '#7b6ef6' }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={S.label}>Email</label>
              <div style={S.fieldWrap} onFocus={onFocus} onBlur={onBlur}>
                <span style={S.fieldIcon}><MailIcon /></span>
                <input id="reg-email" name="email" type="email"
                  placeholder="Enter your email"
                  value={form.email} onChange={handleChange}
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
                <input id="reg-password" name="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={form.password} onChange={handleChange}
                  autoComplete="new-password"
                  style={{ ...S.fieldInput, caretColor: '#7b6ef6' }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} style={S.eyeBtn}>
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={S.label}>Confirm Password</label>
              <div style={S.fieldWrap} onFocus={onFocus} onBlur={onBlur}>
                <span style={S.fieldIcon}><LockIcon /></span>
                <input id="reg-confirm-password" name="confirmPassword"
                  type={showCPw ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={form.confirmPassword} onChange={handleChange}
                  autoComplete="new-password"
                  style={{ ...S.fieldInput, caretColor: '#7b6ef6' }}
                />
                <button type="button" onClick={() => setShowCPw(p => !p)} style={S.eyeBtn}>
                  {showCPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Sign Up button */}
            <button id="reg-submit" type="submit" disabled={loading}
              style={{ ...S.signupBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 24px rgba(123,110,246,0.55)'; }}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 18px rgba(123,110,246,0.4)'}
            >
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Creating Account...
                </>
              ) : 'Sign Up'}
            </button>
          </form>

          {/* Already have account */}
          <p style={S.alreadyRow}>
            Already have an account?
            <Link to="/login" style={S.loginLink}>Log in</Link>
          </p>

          {/* Terms */}
          <p style={S.termsText}>
            By signing up, you agree to our{' '}
            <a href="#" style={S.termsLink}>Terms of Service</a>
            {' '}and{' '}
            <a href="#" style={S.termsLink}>Privacy Policy</a>.
          </p>
        </div>

      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Register;
