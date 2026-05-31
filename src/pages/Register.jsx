import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { parkingApi } from '../api/parkingApi';
import toast from 'react-hot-toast';
import { ShieldCheck, User, Mail, Lock, UserPlus, Loader } from 'lucide-react';
import GalgotiasLogo from '../components/GalgotiasLogo';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.error('Please enter all required fields.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await parkingApi.register({ name, email, password, role });
      
      if (res && res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        
        toast.success(`Account registered! Welcome, ${res.user.name}`);
        
        // Dispatch event to sync auth changes in App.jsx
        window.dispatchEvent(new Event('authChange'));
        
        if (res.user.role === 'user') {
          navigate('/book-slot');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(res?.message || 'Registration failed.');
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
        {/* Glowing backdrop accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <GalgotiasLogo className="w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-4" />
          <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans">
            Register Account
          </h2>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-1 text-center leading-relaxed font-semibold">
            Galgotias University Parking System
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-slate-400">
                <User className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Email Address */}
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
                placeholder="e.g. name@campus.edu"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
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
                placeholder="Min 6 characters"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-slate-400">
                <Lock className="w-4.5 h-4.5" />
              </span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Account Type */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block">
              Account Type
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent dark:bg-slate-900 text-slate-950 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
              >
                <option value="user" className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">User / Customer (Student, Faculty, Visitor)</option>
                <option value="operator" className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">Operator / Staff (Manual entry desk)</option>
              </select>
            </div>
          </div>

          {/* Action */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-primary-700 hover:bg-primary-850 active:bg-primary-900 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Register Account
          </button>
        </form>

        {/* Login Redirect Link */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
          <span className="text-slate-400 font-medium">Already have an account?</span>{' '}
          <Link to="/login" className="text-primary-650 dark:text-primary-400 font-bold hover:underline">
            Login here
          </Link>
        </div>

      </div>
    </div>
  );
}
