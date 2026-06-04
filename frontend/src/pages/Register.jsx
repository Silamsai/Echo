import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Lock, Mic, Globe, Shield, Mail, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import useAuthStore from '../store/authStore';

const GOOGLE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/google`;

const EchoMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <defs>
      <linearGradient id="reg-logo-g" x1="20%" y1="10%" x2="80%" y2="90%">
        <stop offset="0%" stopColor="#6eb5ff" />
        <stop offset="50%" stopColor="#7b6ef6" />
        <stop offset="100%" stopColor="#5956e9" />
      </linearGradient>
    </defs>
    <path d="M50 12C73.2 12 92 30.8 92 54C92 77.2 73.2 96 50 96C41 96 32.6 93.2 25.8 88.3C15.6 93.3 7.5 95.5 6.7 95.6C5.9 95.7 5.1 95 5.3 94.1C5.9 91.3 8.7 81.4 12.8 73.9C8.3 67.9 5.7 60.3 5.7 54C5.7 30.8 26.8 12 50 12Z" fill="url(#reg-logo-g)" />
    <path d="M50 34C38.4 34 29 43.4 29 55C29 66.6 38.4 76 50 76C58.6 76 66 71 69.2 63.6L57.8 63.6C55.6 66.9 53 68 50 68C44.4 68 39.8 63.8 39 58L71 58C71 57 71 56 71 55C71 43.4 61.6 34 50 34ZM50 42C54 42 57.2 44.8 58.6 48.6L41.4 48.6C42.8 44.8 46 42 50 42Z" fill="#ffffff" />
  </svg>
);

const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  const { loginWithToken } = useAuthStore();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
        toast.success('Registration successful! Welcome to Echo 🎉');
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

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 md:p-6 overflow-y-auto select-none bg-[#07070c] relative">
      {/* Background lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#7b6ef6]/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#5956e9]/6 blur-[120px] pointer-events-none" />

      {/* Main Glass Card */}
      <div className="w-full max-w-[880px] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-white/5 bg-[#0e0e15]/40 backdrop-blur-xl z-10 animate-fade-in">
        
        {/* LEFT COLUMN: Features Panel (Hidden on Mobile) */}
        {!isMobile && (
          <div className="w-[38%] bg-gradient-to-br from-[#0c0c16] to-[#121226] p-10 flex flex-col justify-between border-r border-white/5 relative overflow-hidden">
            {/* Sparkles */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-10 left-20 w-1 h-1 bg-white rounded-full animate-ping" />
              <div className="absolute top-40 left-10 w-1 h-1 bg-white rounded-full animate-pulse" />
              <div className="absolute bottom-20 left-32 w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-3">
              <EchoMark size={32} />
              <span className="text-white text-xl font-black tracking-tight font-sans">echo</span>
            </div>

            {/* Tagline */}
            <div className="my-8">
              <h2 className="text-2xl font-black text-white leading-tight">
                Join <br />
                <span className="bg-gradient-to-r from-[#7b6ef6] to-[#6eb5ff] bg-clip-text text-transparent">Echo.</span>
              </h2>
              <p className="text-slate-400 text-xs mt-3 leading-relaxed">
                Create an account to start communicating in real-time, holding encrypted chats, and setting custom preferences.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4 my-auto">
              {[
                { icon: MessageSquare, text: 'Real-time chatting with messaging queues', color: 'text-[#7b6ef6]' },
                { icon: Shield, text: 'Secure accounts with verified sessions', color: 'text-[#22c55e]' },
                { icon: Mic, text: 'Voice notes and rich image attachments', color: 'text-[#ec4899]' },
                { icon: Globe, text: 'Stay connected on web or mobile devices', color: 'text-[#06b6d4]' },
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <feat.icon size={15} className={feat.color} />
                  </div>
                  <span className="text-slate-300 text-[11px] leading-snug">{feat.text}</span>
                </div>
              ))}
            </div>

            {/* Footer Trust Strip */}
            <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-3 text-slate-500">
              <Shield size={14} className="text-slate-600" />
              <div className="text-[10px]">
                <p className="font-semibold text-slate-400">Encrypted Workspace</p>
                <p className="text-[9px] text-slate-500">Privacy & Security guaranteed.</p>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Signup Form */}
        <div className="flex-1 bg-[#0b0b11]/80 p-8 md:p-10 flex flex-col justify-center min-h-[500px]">
          
          {/* Logo showing only on mobile */}
          {isMobile && (
            <div className="flex justify-center mb-5">
              <div className="flex items-center gap-2">
                <EchoMark size={36} />
                <span className="text-white text-2xl font-black tracking-tight">echo</span>
              </div>
            </div>
          )}

          <div className="mb-5 text-center">
            <h1 className="text-lg font-bold text-white tracking-tight">Create your account</h1>
            <p className="text-slate-400 text-xs mt-1">Get started with your secure workspace account</p>
          </div>

          {/* Google SSO */}
          <a
            href={GOOGLE_URL}
            className="flex items-center justify-center gap-3 w-full py-2.5 rounded-xl border border-white/5 bg-[#14141c] hover:bg-[#1a1a26] text-slate-200 text-xs font-semibold cursor-pointer transition-all duration-200 shadow-md"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-[1px] bg-white/5" />
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">or sign up</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">Full Name</label>
              <div className="flex items-center bg-[#14141c] border border-white/5 rounded-xl px-3 py-1.5 focus-within:border-[#7b6ef6]/40 focus-within:shadow-[0_0_15px_rgba(123,110,246,0.1)] transition-all">
                <User size={15} className="text-slate-500 mr-2.5 flex-shrink-0" />
                <input
                  id="reg-username"
                  name="username"
                  type="text"
                  placeholder="Enter full name"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="name"
                  className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-slate-600 font-sans"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">Email</label>
              <div className="flex items-center bg-[#14141c] border border-white/5 rounded-xl px-3 py-1.5 focus-within:border-[#7b6ef6]/40 focus-within:shadow-[0_0_15px_rgba(123,110,246,0.1)] transition-all">
                <Mail size={15} className="text-slate-500 mr-2.5 flex-shrink-0" />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-slate-600 font-sans"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">Password</label>
              <div className="flex items-center bg-[#14141c] border border-white/5 rounded-xl px-3 py-1.5 focus-within:border-[#7b6ef6]/40 focus-within:shadow-[0_0_15px_rgba(123,110,246,0.1)] transition-all">
                <Lock size={15} className="text-slate-500 mr-2.5 flex-shrink-0" />
                <input
                  id="reg-password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Create password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-slate-600 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="text-slate-500 hover:text-slate-300 outline-none flex items-center justify-center p-0.5"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">Confirm Password</label>
              <div className="flex items-center bg-[#14141c] border border-white/5 rounded-xl px-3 py-1.5 focus-within:border-[#7b6ef6]/40 focus-within:shadow-[0_0_15px_rgba(123,110,246,0.1)] transition-all">
                <Lock size={15} className="text-slate-500 mr-2.5 flex-shrink-0" />
                <input
                  id="reg-confirm-password"
                  name="confirmPassword"
                  type={showCPw ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-slate-600 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowCPw((p) => !p)}
                  className="text-slate-500 hover:text-slate-300 outline-none flex items-center justify-center p-0.5"
                >
                  {showCPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="reg-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl border border-transparent bg-gradient-to-r from-[#7b6ef6] to-[#5956e9] text-white text-xs font-bold shadow-lg shadow-[#7b6ef6]/15 hover:shadow-[#7b6ef6]/30 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-5"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          {/* Bottom link */}
          <p className="text-center text-xs text-slate-400 mt-5">
            Already have an account?
            <Link to="/login" className="text-[#7b6ef6] font-bold hover:underline ml-1">Log in</Link>
          </p>

          {/* Terms */}
          <p className="text-[9px] text-center text-slate-500 leading-normal mt-5 select-text">
            By signing up, you agree to our{' '}
            <a href="#" className="text-[#7b6ef6] hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-[#7b6ef6] hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
