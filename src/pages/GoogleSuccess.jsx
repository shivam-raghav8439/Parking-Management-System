import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { parkingApi } from '../api/parkingApi';

const GoogleSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleSuccess = async () => {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');

      if (!token) {
        toast.error('Google authentication failed: no token received.');
        navigate('/login');
        return;
      }

      try {
        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        // Fetch current user details to cache in local storage
        const userRes = await parkingApi.getCurrentUser();
        if (userRes && userRes.user) {
          localStorage.setItem('user', JSON.stringify(userRes.user));
          toast.success(`Welcome back, ${userRes.user.name}!`);
          
          // Re-boot inactivity timer by dispatching token change
          window.dispatchEvent(new Event('storage'));
          
          // Redirect based on role
          const role = userRes.user.role;
          if (role === 'admin' || role === 'superadmin' || role === 'operator') {
            navigate('/dashboard');
          } else {
            navigate('/user/bookings');
          }
        } else {
          throw new Error('User details could not be retrieved');
        }
      } catch (error) {
        toast.error('Failed to log in with Google.');
        navigate('/login');
      }
    };

    handleSuccess();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-white p-6 font-sans">
      <div className="w-full max-w-md bg-opacity-10 bg-white backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-10 text-center shadow-2xl relative overflow-hidden">
        {/* Decorative ambient light */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500 rounded-full blur-[80px] opacity-35"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500 rounded-full blur-[80px] opacity-35"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Authenticating</h2>
          <p className="text-gray-400 text-sm">Completing sign-in with Google. Please wait...</p>
        </div>
      </div>
    </div>
  );
};

export default GoogleSuccess;
