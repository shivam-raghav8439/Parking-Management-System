import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { parkingApi } from '../api/parkingApi';
import toast from 'react-hot-toast';
import { ShieldCheck, Mail, Lock, LogIn, Loader, AlertTriangle } from 'lucide-react';
import GalgotiasLogo from '../components/GalgotiasLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isBlocked = queryParams.get('blocked') === 'true';

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await parkingApi.login({ email, password });
      
      if (res && res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        
        toast.success(`Welcome back, ${res.user.name}!`);
        
        // Dispatch event to sync auth changes in App.jsx
        window.dispatchEvent(new Event('authChange'));
        if (res.user.role === 'user') {
          navigate('/book-slot');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(res?.message || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Connection failure. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glowing backdrop accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <GalgotiasLogo className="w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-4" />
          <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans">
            Parking Portal
          </h2>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-1 text-center leading-relaxed font-semibold">
            Galgotias University Parking System
          </p>
        </div>

        {/* Account Blocked Alert Banner */}
        {isBlocked && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/35 text-rose-600 dark:text-rose-450 text-xs font-semibold flex items-start gap-2.5 shadow-sm animate-pulse">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-extrabold uppercase tracking-wide">Access Denied</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">Your account has been blocked by an administrator. Active sessions have been terminated.</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-slate-400">
                <Mail className="w-4.5 h-4.5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. operator@campus.edu"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-slate-400">
                <Lock className="w-4.5 h-4.5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Action */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-primary-700 hover:bg-primary-850 active:bg-primary-900 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Sign In to Operator Panel
          </button>
        </form>

        {/* Registration Redirect Link */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
          <span className="text-slate-400 font-medium">First-time system setup?</span>{' '}
          <Link to="/register" className="text-primary-650 dark:text-primary-400 font-bold hover:underline">
            Register Admin Account
          </Link>
        </div>

      </div>
    </div>
  );
}
