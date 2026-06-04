import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import useAuthStore from '../store/authStore';

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputs = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithToken } = useAuthStore();

  const email = location.state?.email;

  useEffect(() => {
    if (!email) navigate('/register');
    inputs.current[0]?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = (index, val) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = v;
    setOtp(newOtp);
    if (v && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return toast.error('Enter the full 6-digit code.');
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post('/auth/verify-otp', { email, otp: code });
      loginWithToken(data.token, data.user);
      toast.success('Email verified! Welcome to ECHO 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP.');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await axiosInstance.post('/auth/resend-otp', { email });
      toast.success('New OTP sent!');
      setResendTimer(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 overflow-auto animate-fade-in" style={{ background: '#161618' }}>

      {/* Ambient background glow */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,109,250,0.12) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />

      {/* Card (macOS glassmorphic style) */}
      <div
        className="relative z-10 w-full max-w-[400px] rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: 'rgba(30,30,32,0.92)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.06)',
        }}
      >
        <div className="px-8 pt-10 pb-8">

          {/* Logo / Icon */}
          <div className="flex flex-col items-center mb-8 select-none">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(145deg, #7c6dfa, #fa6d9b)',
                boxShadow: '0 8px 24px rgba(124,109,250,0.35)',
              }}
            >
              <span className="text-white font-bold text-2xl tracking-tight">E</span>
            </div>
            <h1
              className="text-[22px] font-semibold tracking-tight text-white mb-2 text-center"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif', letterSpacing: '-0.3px' }}
            >
              Verify Your Email
            </h1>
            <p className="text-center" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif', color: '#98989d', fontSize: '13px', lineHeight: '1.5' }}>
              We sent a 6-digit verification code to:<br />
              <span style={{ color: '#7c6dfa', fontWeight: 600 }}>{email}</span>
            </p>
          </div>

          {/* OTP Digit Inputs */}
          <div className="flex gap-2.5 sm:gap-3 justify-center mb-8" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-2xl font-bold rounded-xl border transition-all duration-150 outline-none"
                style={{
                  background: digit ? 'rgba(124,109,250,0.12)' : 'rgba(118,118,128,0.12)',
                  borderColor: digit ? 'rgba(124,109,250,0.5)' : 'rgba(255,255,255,0.07)',
                  color: '#f5f5f7',
                  boxShadow: digit ? '0 0 8px rgba(124,109,250,0.3)' : 'none',
                }}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            id="verify-submit"
            onClick={handleVerify}
            disabled={isLoading || otp.join('').length !== 6}
            className="w-full py-3 rounded-xl font-semibold text-[14px] transition-all duration-150 active:scale-[0.98] cursor-pointer mb-5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: isLoading || otp.join('').length !== 6
                ? 'rgba(124,109,250,0.4)'
                : 'linear-gradient(145deg, #7c6dfa, #6057e8)',
              color: '#ffffff',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
              boxShadow: otp.join('').length === 6 ? '0 4px 14px rgba(124,109,250,0.3)' : 'none',
              letterSpacing: '-0.1px',
            }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying...
              </>
            ) : 'Verify & Continue'}
          </button>

          {/* Resend Link */}
          <p className="text-center text-sm font-semibold select-none" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
            <span style={{ color: '#636366' }}>Didn't receive code? </span>
            <button
              onClick={handleResend}
              disabled={resendTimer > 0}
              className="font-semibold transition-colors border-none bg-none outline-none focus:outline-none"
              style={{
                color: resendTimer > 0 ? '#636366' : '#7c6dfa',
                cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </button>
          </p>

        </div>

        {/* Secure & Encrypted Strip */}
        <div
          className="px-8 py-4 flex items-center justify-center gap-2 select-none"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
            color: '#636366',
            fontSize: '12px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          }}
        >
          <Shield size={14} style={{ color: '#444' }} />
          Secure 256-bit encryption
        </div>
      </div>

      {/* Footer */}
      <p
        className="fixed bottom-4 left-0 right-0 text-center select-none pointer-events-none"
        style={{ color: '#3a3a3c', fontSize: '12px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif' }}
      >
        © {new Date().getFullYear()} Echo — End-to-end encrypted
      </p>
    </div>
  );
};

export default VerifyOTP;
