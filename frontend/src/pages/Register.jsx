import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import useAuthStore from '../store/authStore';

const GOOGLE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/google`;

/* ── Echo Logo ── */
const EchoMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <defs>
      <linearGradient id="reg-logo-g" x1="20%" y1="10%" x2="80%" y2="90%">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="50%" stopColor="#7b6ef6" />
        <stop offset="100%" stopColor="#5956e9" />
      </linearGradient>
    </defs>
    <path d="M50 12C73.2 12 92 30.8 92 54C92 77.2 73.2 96 50 96C41 96 32.6 93.2 25.8 88.3C15.6 93.3 7.5 95.5 6.7 95.6C5.9 95.7 5.1 95 5.3 94.1C5.9 91.3 8.7 81.4 12.8 73.9C8.3 67.9 5.7 60.3 5.7 54C5.7 30.8 26.8 12 50 12Z" fill="url(#reg-logo-g)" />
    <path d="M50 34C38.4 34 29 43.4 29 55C29 66.6 38.4 76 50 76C58.6 76 66 71 69.2 63.6L57.8 63.6C55.6 66.9 53 68 50 68C44.4 68 39.8 63.8 39 58L71 58C71 57 71 56 71 55C71 43.4 61.6 34 50 34ZM50 42C54 42 57.2 44.8 58.6 48.6L41.4 48.6C42.8 44.8 46 42 50 42Z" fill="#ffffff" />
  </svg>
);

/* ── Liquid Orb ── */
const LiquidOrb = ({ style }) => (
  <div style={{
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none',
    willChange: 'transform',
    ...style,
  }} />
);

/* ── Feature Tag ── */
const FeatureTag = ({ icon, text, delay }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '6px 12px',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '99px',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.6)',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontWeight: 500,
    animation: `tagFadeIn 0.6s ease forwards ${delay}`,
    opacity: 0,
  }}>
    <span style={{ fontSize: '12px' }}>{icon}</span>
    {text}
  </div>
);

const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);
  const navigate = useNavigate();
  const { loginWithToken } = useAuthStore();

  useEffect(() => {
    const handleMouse = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouse, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
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
      const { data } = await axiosInstance.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
      });
      if (data.token) {
        loginWithToken(data.token, data.user);
        toast.success('Welcome to Echo 🎉');
        navigate('/');
      } else {
        toast.success('OTP sent to your email! 📧');
        navigate('/verify-otp', { state: { email: form.email } });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const getFieldStyle = (name) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: focusedField === name
      ? 'rgba(123,110,246,0.08)'
      : 'rgba(255,255,255,0.04)',
    border: `1px solid ${focusedField === name ? 'rgba(123,110,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: '14px',
    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
    boxShadow: focusedField === name ? '0 0 0 3px rgba(123,110,246,0.12), inset 0 1px 0 rgba(255,255,255,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.04)',
  });

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      overflow: 'auto',
      background: '#050508',
      position: 'relative',
      fontFamily: '"Plus Jakarta Sans", -apple-system, sans-serif',
    }}>
      <style>{`
        @keyframes liquidOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.97); }
        }
        @keyframes liquidOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-25px, 20px) scale(1.08); }
          70% { transform: translate(15px, -10px) scale(0.95); }
        }
        @keyframes liquidOrb3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, 25px) scale(1.1); }
        }
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes tagFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spinLoader {
          to { transform: rotate(360deg); }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        .reg-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #f0eeff;
          font-size: 13px;
          font-family: "Plus Jakarta Sans", sans-serif;
          font-weight: 500;
        }
        .reg-input::placeholder { color: rgba(255,255,255,0.2); }
        .reg-btn-google:hover { background: rgba(255,255,255,0.09) !important; transform: translateY(-1px); }
        .reg-btn-google:active { transform: translateY(0); }
        .reg-submit-btn:not(:disabled):hover { 
          box-shadow: 0 8px 32px rgba(123,110,246,0.45), 0 2px 8px rgba(0,0,0,0.3) !important;
          transform: translateY(-1px);
        }
        .reg-submit-btn:active { transform: translateY(0) !important; }
        .feature-left-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          transition: background 0.2s;
          animation: tagFadeIn 0.5s ease forwards;
          opacity: 0;
        }
        .feature-left-item:hover { background: rgba(255,255,255,0.04); }
      `}</style>

      {/* Liquid orbs */}
      <LiquidOrb style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(123,110,246,0.18) 0%, transparent 70%)', top: '-15%', left: '-15%', animation: 'liquidOrb 12s ease-in-out infinite' }} />
      <LiquidOrb style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(88,86,233,0.12) 0%, transparent 70%)', bottom: '-10%', right: '-10%', animation: 'liquidOrb2 15s ease-in-out infinite' }} />
      <LiquidOrb style={{ width: 350, height: 350, background: 'radial-gradient(circle, rgba(110,181,255,0.1) 0%, transparent 70%)', top: '40%', right: '20%', animation: 'liquidOrb3 10s ease-in-out infinite' }} />

      {/* Glass card */}
      <div ref={cardRef} style={{
        width: '100%',
        maxWidth: '900px',
        display: 'flex',
        borderRadius: '28px',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 40px 120px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.12)',
        animation: 'cardReveal 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
        position: 'relative',
        zIndex: 10,
      }}>

        {/* LEFT PANEL */}
        <div style={{
          width: '40%',
          minWidth: '300px',
          padding: '44px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(160deg, rgba(123,110,246,0.12) 0%, rgba(88,86,233,0.06) 50%, rgba(0,0,0,0) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          position: 'relative',
          overflow: 'hidden',
        }} className="reg-left-panel">
          {/* Subtle mesh */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none',
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(123,110,246,0.25) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(110,181,255,0.15) 0%, transparent 50%)`,
          }} />
          
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
            <EchoMark size={36} />
            <div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: '20px', letterSpacing: '-0.5px', lineHeight: 1 }}>echo</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'monospace', marginTop: '2px' }}>by Silamsai</div>
            </div>
          </div>

          {/* Main headline */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} style={{ color: '#a78bfa' }} />
              <span style={{ color: '#a78bfa', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'monospace' }}>New account</span>
            </div>
            <h2 style={{ color: '#fff', fontSize: '30px', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-1px', margin: 0 }}>
              Start your<br />
              <span style={{ background: 'linear-gradient(135deg, #a78bfa, #7b6ef6, #6eb5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                journey.
              </span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12.5px', lineHeight: 1.65, marginTop: '12px', maxWidth: '220px' }}>
              Join thousands of people connecting through Echo's encrypted messaging platform.
            </p>
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative', zIndex: 1 }}>
            {[
              { icon: '💬', label: 'Real-time messages', color: '#a78bfa', delay: '0.1s' },
              { icon: '🔒', label: 'End-to-end encrypted', color: '#34d399', delay: '0.2s' },
              { icon: '🎙️', label: 'Voice notes & media', color: '#f472b6', delay: '0.3s' },
              { icon: '🌐', label: 'Web & mobile ready', color: '#38bdf8', delay: '0.4s' },
            ].map((f, i) => (
              <div key={i} className="feature-left-item" style={{ animationDelay: f.delay }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px',
                }}>{f.icon}</div>
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', fontWeight: 500 }}>{f.label}</span>
              </div>
            ))}
          </div>

          {/* Footer strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(52,211,153,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>🛡️</div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 600 }}>Privacy Guaranteed</div>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', letterSpacing: '0.3px' }}>Your data stays yours, always.</div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Form */}
        <div style={{ flex: 1, padding: '44px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(0,0,0,0.25)', minHeight: '580px' }}>
          
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', margin: 0 }}>Create account</h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12.5px', marginTop: '5px' }}>Fill in your details to get started</p>
          </div>

          {/* Google SSO */}
          <a href={GOOGLE_URL} className="reg-btn-google" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            padding: '12px 18px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '14px',
            color: 'rgba(255,255,255,0.85)',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
            marginBottom: '20px',
            cursor: 'pointer',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', letterSpacing: '1.5px', fontFamily: 'monospace', textTransform: 'uppercase' }}>or register</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Username */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'monospace' }}>Full Name</label>
              <div style={getFieldStyle('username')}>
                <User size={15} style={{ color: focusedField === 'username' ? '#a78bfa' : 'rgba(255,255,255,0.2)', flexShrink: 0, transition: 'color 0.2s' }} />
                <input id="reg-username" name="username" type="text" placeholder="Your display name"
                  value={form.username} onChange={handleChange}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="name" className="reg-input"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'monospace' }}>Email</label>
              <div style={getFieldStyle('email')}>
                <Mail size={15} style={{ color: focusedField === 'email' ? '#a78bfa' : 'rgba(255,255,255,0.2)', flexShrink: 0, transition: 'color 0.2s' }} />
                <input id="reg-email" name="email" type="email" placeholder="name@example.com"
                  value={form.email} onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="email" className="reg-input"
                />
              </div>
            </div>

            {/* Passwords row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'monospace' }}>Password</label>
                <div style={getFieldStyle('password')}>
                  <Lock size={15} style={{ color: focusedField === 'password' ? '#a78bfa' : 'rgba(255,255,255,0.2)', flexShrink: 0, transition: 'color 0.2s' }} />
                  <input id="reg-password" name="password" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                    value={form.password} onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    autoComplete="new-password" className="reg-input"
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{ color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'monospace' }}>Confirm</label>
                <div style={getFieldStyle('confirmPassword')}>
                  <Lock size={15} style={{ color: focusedField === 'confirmPassword' ? '#a78bfa' : 'rgba(255,255,255,0.2)', flexShrink: 0, transition: 'color 0.2s' }} />
                  <input id="reg-confirm-password" name="confirmPassword" type={showCPw ? 'text' : 'password'} placeholder="••••••••"
                    value={form.confirmPassword} onChange={handleChange}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    autoComplete="new-password" className="reg-input"
                  />
                  <button type="button" onClick={() => setShowCPw(p => !p)} style={{ color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}>
                    {showCPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button id="reg-submit" type="submit" disabled={loading} className="reg-submit-btn" style={{
              width: '100%',
              padding: '14px 20px',
              marginTop: '8px',
              borderRadius: '14px',
              border: '1px solid rgba(123,110,246,0.4)',
              background: loading
                ? 'rgba(123,110,246,0.4)'
                : 'linear-gradient(135deg, #7b6ef6 0%, #5956e9 100%)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 4px 24px rgba(123,110,246,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              letterSpacing: '-0.2px',
              opacity: loading ? 0.75 : 1,
            }}>
              {loading ? (
                <>
                  <svg style={{ animation: 'spinLoader 0.8s linear infinite', width: 16, height: 16 }} fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating your account…
                </>
              ) : (
                <>
                  Get started free
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Bottom links */}
          <p style={{ textAlign: 'center', fontSize: '12.5px', color: 'rgba(255,255,255,0.35)', marginTop: '18px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#a78bfa', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
          </p>
          <p style={{ textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.18)', marginTop: '10px', lineHeight: 1.7 }}>
            By continuing, you agree to our{' '}
            <a href="#" style={{ color: 'rgba(167,139,250,0.6)', textDecoration: 'none' }}>Terms</a>
            {' '}and{' '}
            <a href="#" style={{ color: 'rgba(167,139,250,0.6)', textDecoration: 'none' }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
      
      {/* Mobile-only: hide left panel */}
      <style>{`
        @media (max-width: 700px) {
          .reg-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Register;
