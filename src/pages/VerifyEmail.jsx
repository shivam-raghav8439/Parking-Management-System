import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { parkingApi } from '../api/parkingApi';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided. Please check your email link.');
        return;
      }

      try {
        const res = await parkingApi.verifyEmail(token);
        setStatus('success');
        setMessage(res.message || 'Email verified successfully!');
        
        if (res.token) {
          localStorage.setItem('token', res.token);
        }
        if (res.refreshToken) {
          localStorage.setItem('refreshToken', res.refreshToken);
        }
        if (res.user) {
          localStorage.setItem('user', JSON.stringify(res.user));
        }

        // Reboot inactivity timer by dispatching token change
        window.dispatchEvent(new Event('storage'));

        // Redirect after 3 seconds
        setTimeout(() => {
          const role = res.user?.role;
          if (role === 'admin' || role === 'superadmin' || role === 'operator') {
            navigate('/dashboard');
          } else {
            navigate('/user/bookings');
          }
        }, 3000);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || err.message || 'Email verification failed. The link may have expired.');
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-white p-6 font-sans">
      <div className="w-full max-w-md bg-opacity-10 bg-white backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-10 text-center shadow-2xl relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500 rounded-full blur-[80px] opacity-25"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500 rounded-full blur-[80px] opacity-25"></div>

        <div className="relative z-10 flex flex-col items-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Verifying Your Email</h2>
              <p className="text-gray-400 text-sm">Please wait while we confirm your email address...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500 bg-opacity-20 text-green-400 rounded-full flex items-center justify-center mb-6 text-3xl shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-pulse">
                ✓
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Verification Successful!</h2>
              <p className="text-green-400 text-sm mb-6">{message}</p>
              <p className="text-gray-400 text-xs mb-6">Redirecting you to dashboard shortly...</p>
              <button
                onClick={() => {
                  const user = JSON.parse(localStorage.getItem('user'));
                  if (user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'operator') {
                    navigate('/dashboard');
                  } else {
                    navigate('/user/bookings');
                  }
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium transition-all shadow-[0_4px_15px_rgba(59,130,246,0.3)] cursor-pointer"
              >
                Go to Dashboard
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500 bg-opacity-20 text-red-400 rounded-full flex items-center justify-center mb-6 text-3xl shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                ✕
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Verification Failed</h2>
              <p className="text-red-400 text-sm mb-6">{message}</p>
              <Link
                to="/login"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-medium transition-all shadow-[0_4px_15px_rgba(0,0,0,0.3)] cursor-pointer block text-center"
              >
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
