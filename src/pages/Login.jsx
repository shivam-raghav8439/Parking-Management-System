import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { parkingApi } from '../api/parkingApi';
import client from '../api/client';
import toast from 'react-hot-toast';
import { ShieldCheck, Mail, Lock, LogIn, Loader, AlertTriangle, Phone, KeyRound } from 'lucide-react';
import GalgotiasLogo from '../components/GalgotiasLogo';
import ReCAPTCHA from 'react-google-recaptcha';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isBlocked = queryParams.get('blocked') === 'true';

  // Standard Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [lockoutTime, setLockoutTime] = useState(null);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);
  
  // Unverified warning states
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resendingEmail, setResendingEmail] = useState(false);

  // OTP Login states
  const [isOtpLogin, setIsOtpLogin] = useState(false);
  const [mobile, setMobile] = useState('');
  const [otpArray, setOtpArray] = useState(new Array(6).fill(''));
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [resendingOtp, setResendingOtp] = useState(false);

  const otpInputsRef = useRef([]);

  // Lockout Countdown effect
  useEffect(() => {
    let interval;
    if (lockoutCountdown > 0) {
      interval = setInterval(() => {
        setLockoutCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setLockoutTime(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutCountdown]);

  // OTP Countdown effect
  useEffect(() => {
    let interval;
    if (otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpCountdown]);

  const handleSendOtp = async () => {
    if (!mobile || mobile.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }
    setResendingOtp(true);
    try {
      const res = await parkingApi.sendOtp({ mobile });
      setOtpSent(true);
      setOtpCountdown(45);
      toast.success(res.message || 'OTP sent to your mobile number!');
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send OTP.');
    } finally {
      setResendingOtp(false);
    }
  };

  const handleOtpChange = (val, index) => {
    if (isNaN(val)) return;
    const newOtp = [...otpArray];
    newOtp[index] = val;
    setOtpArray(newOtp);

    // Focus next box
    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split('');
    setOtpArray(digits);
    otpInputsRef.current[5]?.focus();
  };

  const handleResendEmail = async () => {
    toast.success('A new verification link has already been sent to your email. Please check your inbox or try logging in again to trigger a new link.');
    setUnverifiedEmail(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setUnverifiedEmail(null);

    if (isOtpLogin) {
      toast.error('OTP login is not supported by the persistent database. Please use email and password.');
      return;
    }

    // Email/Password login
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    if (failedAttempts >= 3 && !captchaToken) {
      toast.error('Please complete the CAPTCHA check.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await client.post('/auth/login', { email, password });
      const res = response.data;
      
      if (res && res.token) {
        localStorage.setItem('token', res.token);
        if (res.refreshToken) {
          localStorage.setItem('refreshToken', res.refreshToken);
        }
        localStorage.setItem('user', JSON.stringify(res.user));
        
        toast.success(`Welcome back, ${res.user.name}!`);
        
        // Reset security alerts
        setFailedAttempts(0);
        setCaptchaToken(null);
        
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
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 403 && (data?.needsVerification || data?.step === 'verify-email')) {
        // Unverified email handler
        setUnverifiedEmail(data.email || email);
        toast.error(data.message || 'Email verification required.');
      } else if (status === 423) {
        // Account lockout handler
        const unlockAt = data.lockUntil ? new Date(data.lockUntil) : new Date(Date.now() + 30 * 60 * 1000);
        setLockoutTime(unlockAt);
        setLockoutCountdown(Math.ceil((unlockAt - Date.now()) / 1000));
        toast.error(data.message || 'Account locked due to brute force protection.');
      } else {
        // Standard failed passwords count
        setFailedAttempts((prev) => prev + 1);
        toast.error(data?.message || 'Invalid credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glowing backdrop accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <GalgotiasLogo className="w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-4" />
          <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans leading-none">
            Parking Portal
          </h2>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-2 text-center leading-relaxed font-semibold">
            Galgotias University Parking System
          </p>
        </div>

        {/* Account Blocked Alert Banner */}
        {isBlocked && (
          <div className="mb-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/35 text-rose-600 dark:text-rose-450 text-xs font-semibold flex items-start gap-2.5 shadow-sm animate-pulse">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-extrabold uppercase tracking-wide">Access Denied</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">Your account has been blocked by an administrator. Active sessions have been terminated.</p>
            </div>
          </div>
        )}

        {/* Unverified Email Warning Banner */}
        {unverifiedEmail && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/35 text-amber-800 dark:text-amber-400 text-xs font-semibold space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="font-extrabold uppercase tracking-wide">Email Verification Needed</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">Please verify your email address. Resend verification link below:</p>
              </div>
            </div>
            <button
              onClick={handleResendEmail}
              disabled={resendingEmail}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex justify-center items-center cursor-pointer"
            >
              {resendingEmail ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Resend Verification Link'
              )}
            </button>
          </div>
        )}

        {/* Lockout Screen overlay */}
        {lockoutTime && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/35 text-red-600 dark:text-red-400 text-xs font-semibold flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-extrabold uppercase tracking-wide">Brute Force Protection Active</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                Too many incorrect login attempts. System locked. Please wait{' '}
                <span className="font-mono text-red-500 font-bold">{Math.floor(lockoutCountdown / 60)}:{(lockoutCountdown % 60).toString().padStart(2, '0')}</span> before retrying.
              </p>
            </div>
          </div>
        )}

        {/* Toggle Login Option */}
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => {
              setIsOtpLogin(!isOtpLogin);
              setOtpArray(new Array(6).fill(''));
              setOtpSent(false);
            }}
            className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
          >
            {isOtpLogin ? 'Login with Password instead' : 'Login with OTP instead'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {!isOtpLogin ? (
            <>
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400">
                    <Mail className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. operator@campus.edu"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-[10px] font-bold text-primary-650 dark:text-primary-400 hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400">
                    <Lock className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              {/* Security Attempts Counter */}
              {failedAttempts > 0 && failedAttempts < 5 && (
                <div className="text-right text-[10px] font-bold text-amber-500 uppercase tracking-wide">
                  {5 - failedAttempts} attempts remaining before lockout
                </div>
              )}

              {/* reCAPTCHA panel */}
              {failedAttempts >= 3 && (
                <div className="flex justify-center py-2">
                  <ReCAPTCHA
                    sitekey="6LeIxAcTAAAAAJcZVRqyhGJk1ia15hg_aMraWP8F" // fallback testing sitekey
                    onChange={setCaptchaToken}
                    theme="dark"
                  />
                </div>
              )}
            </>
          ) : (
            <>
              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider block">
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <Phone className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type="text"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={resendingOtp || otpCountdown > 0}
                    className="px-4 py-2.5 bg-gray-800 text-white rounded-xl text-xs font-bold hover:bg-gray-700 transition-all disabled:opacity-50 cursor-pointer flex justify-center items-center"
                  >
                    {resendingOtp ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : otpCountdown > 0 ? (
                      `Sent (${otpCountdown}s)`
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                </div>
              </div>

              {/* 6-box OTP entry screen */}
              {otpSent && (
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block text-center">
                    Enter 6-Digit OTP sent to +91 XXXXXX{mobile.slice(-4)}
                  </label>
                  <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                    {otpArray.map((digit, idx) => (
                      <input
                        key={idx}
                        type="text"
                        maxLength="1"
                        value={digit}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        className="w-10 h-12 text-center text-lg font-bold border border-slate-200 dark:border-slate-800 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    ))}
                  </div>

                  {otpCountdown === 0 ? (
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-xs font-bold text-primary-650 dark:text-primary-400 hover:underline cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-[10px] text-gray-500 font-bold uppercase">
                      Resend OTP in {otpCountdown}s
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Action */}
          <button
            type="submit"
            disabled={isLoading || lockoutCountdown > 0 || (failedAttempts >= 3 && !captchaToken)}
            className="w-full mt-2 py-3 bg-primary-750 hover:bg-primary-850 active:bg-primary-900 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {isOtpLogin ? 'Authorize OTP Check-in' : 'Sign In to Operator Panel'}
          </button>
        </form>

        {/* Google SSO Login */}
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="h-[1px] bg-gray-800 flex-1"></div>
            <span className="text-[10px] text-gray-500 font-bold uppercase">Or sign in with</span>
            <div className="h-[1px] bg-gray-800 flex-1"></div>
          </div>

          <button
            type="button"
            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`}
            className="w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.1.1 2.07l-3.3-2.07-.12.07z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.87-3c-1.08.72-2.47 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-5.01H1.27v3.1C3.25 21.84 7.37 24 12 24z"/>
              <path fill="#FBBC05" d="M5.24 14.24c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3V6.54H1.27C.46 8.18 0 10.02 0 12s.46 3.82 1.27 5.46l3.97-3.22z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.37 0 3.25 2.16 1.27 6.54l3.97 3.22c.95-2.88 3.61-5.01 6.76-5.01z"/>
            </svg>
            Sign in with Google
          </button>
        </div>

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
