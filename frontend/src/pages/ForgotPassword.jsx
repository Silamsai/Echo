import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter Code & New Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const codeInputs = useRef([]);
  const navigate = useNavigate();

  // Focus code inputs automatically on step 2
  useEffect(() => {
    if (step === 2) {
      codeInputs.current[0]?.focus();
    }
  }, [step]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email address.');

    setIsLoading(true);
    try {
      await axiosInstance.post('/auth/forgot-password', { email });
      toast.success('Reset code sent! Check your inbox 📬');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index, val) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = v;
    setCode(newCode);
    if (v && index < 5) codeInputs.current[index + 1]?.focus();
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      codeInputs.current[5]?.focus();
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const verificationCode = code.join('');

    if (verificationCode.length !== 6) {
      return toast.error('Please enter the 6-digit code sent to your email.');
    }
    if (!password) {
      return toast.error('Please enter your new password.');
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters long.');
    }
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match.');
    }

    setIsLoading(true);
    try {
      await axiosInstance.post('/auth/reset-password', {
        email,
        code: verificationCode,
        password,
      });
      toast.success('Password reset successfully! Please log in. 🎉');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 md:p-6 overflow-y-auto select-none bg-[#07070c] relative">
      {/* Ambient background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#ef4444]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#f59e0b]/5 blur-[120px] pointer-events-none" />

      {/* macOS Glassmorphic Card */}
      <div className="w-full max-w-[450px] rounded-3xl overflow-hidden bg-[#0e0e15]/40 border border-white/5 backdrop-blur-xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] z-10 p-8 md:p-10 animate-fade-in">
        
        {/* Step 1: Request Reset Code */}
        {step === 1 ? (
          <div>
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-[#ef4444] to-[#f59e0b] shadow-[0_8px_24px_rgba(239,68,68,0.25)]">
                <KeyRound size={26} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight text-center">Forgot Password?</h1>
              <p className="text-slate-400 text-xs mt-2 text-center leading-relaxed">
                Enter your email address below and we'll send you a 6-digit code to reset your password.
              </p>
            </div>

            <form onSubmit={handleSendCode} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1.5">Email address</label>
                <div className="flex items-center bg-[#14141c] border border-white/5 rounded-xl px-3 py-2.5 focus-within:border-[#ef4444]/40 focus-within:shadow-[0_0_15px_rgba(239,68,68,0.1)] transition-all">
                  <Mail size={15} className="text-slate-500 mr-2.5 flex-shrink-0" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-slate-600 font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl border border-transparent bg-gradient-to-r from-[#ef4444] to-[#f59e0b] text-white text-xs font-bold shadow-lg shadow-[#ef4444]/15 hover:shadow-[#ef4444]/30 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending code...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>

            <div className="mt-8 pt-4 border-t border-white/5 text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={14} />
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          /* Step 2: Reset Password Form */
          <div>
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-[#ef4444] to-[#f59e0b] shadow-[0_8px_24px_rgba(239,68,68,0.25)]">
                <Lock size={26} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight text-center">Reset Password</h1>
              <p className="text-slate-400 text-xs mt-2 text-center leading-relaxed">
                Enter the code sent to <span className="text-[#ef4444] font-semibold">{email}</span> and your new password.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* Digit verification inputs */}
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-2.5 text-center">Verification Code</label>
                <div className="flex gap-2 justify-center" onPaste={handleCodePaste}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (codeInputs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      className="w-10 h-12 text-center text-lg font-bold rounded-lg border transition-all outline-none"
                      style={{
                        background: digit ? 'rgba(239,68,68,0.12)' : 'rgba(118,118,128,0.12)',
                        borderColor: digit ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)',
                        color: '#f5f5f7',
                        boxShadow: digit ? '0 0 8px rgba(239,68,68,0.3)' : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1.5">New Password</label>
                <div className="flex items-center bg-[#14141c] border border-white/5 rounded-xl px-3 py-2 focus-within:border-[#ef4444]/40 focus-within:shadow-[0_0_15px_rgba(239,68,68,0.1)] transition-all">
                  <Lock size={15} className="text-slate-500 mr-2.5 flex-shrink-0" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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

              {/* Confirm Password field */}
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1.5">Confirm Password</label>
                <div className="flex items-center bg-[#14141c] border border-white/5 rounded-xl px-3 py-2 focus-within:border-[#ef4444]/40 focus-within:shadow-[0_0_15px_rgba(239,68,68,0.1)] transition-all">
                  <Lock size={15} className="text-slate-500 mr-2.5 flex-shrink-0" />
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-slate-600 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((p) => !p)}
                    className="text-slate-500 hover:text-slate-300 outline-none flex items-center justify-center p-0.5"
                  >
                    {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl border border-transparent bg-gradient-to-r from-[#ef4444] to-[#f59e0b] text-white text-xs font-bold shadow-lg shadow-[#ef4444]/15 hover:shadow-[#ef4444]/30 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Resetting password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-[#ef4444] font-bold hover:underline"
              >
                Resend Code or Change Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
