import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';

const GoogleSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      toast.error('Google login failed.');
      navigate('/login');
      return;
    }

    // Save the token to local storage first so the Axios request interceptor picks it up
    localStorage.setItem('echo_token', token);

    axiosInstance.get('/auth/me').then(({ data }) => {
      loginWithToken(token, data);
      toast.success(`Welcome, ${data.username}! 🎉`);
      navigate('/');
    }).catch((err) => {
      localStorage.removeItem('echo_token');
      console.error('Google login verification failed:', err);
      toast.error('Google login failed.');
      navigate('/login');
    });
  }, [searchParams, navigate, loginWithToken]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <div className="text-center fade-in">
        <div className="text-5xl font-black tracking-widest gradient-text mb-4">ECHO</div>
        <div className="flex items-center gap-2 text-slate-400">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Finishing Google login...
        </div>
      </div>
    </div>
  );
};

export default GoogleSuccess;
