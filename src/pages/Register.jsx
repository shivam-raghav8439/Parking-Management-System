import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { parkingApi } from '../api/parkingApi';
import toast from 'react-hot-toast';
import { ShieldCheck, User, Mail, Lock, UserPlus, Loader, Phone } from 'lucide-react';
import GalgotiasLogo from '../components/GalgotiasLogo';

export default function Register() {
  const navigate = useNavigate();

  // Wizard state: 'form', 'otp', 'email-confirm'
  const [step, setStep] = useState('form');

  // Step 1 Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isLoading, setIsLoading] = useState(false);

  // Step 2 OTP fields
  const [otpArray, setOtpArray] = useState(new Array(6).fill(''));
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [resendingOtp, setResendingOtp] = useState(false);
  const otpInputsRef = useRef([]);

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

  const checkStrength = (pass) => {
    if (!pass) return { label: 'None', color: 'bg-gray-700', percentage: 0 };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', percentage: 25 };
    if (score <= 3) return { label: 'Medium', color: 'bg-yellow-500', percentage: 60 };
    return { label: 'Strong', color: 'bg-green-500', percentage: 100 };
  };

  const strength = checkStrength(password);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please enter all required fields.');
      return;
    }

    if (password.length < 8 || !/[0-9]/.test(password) || !/[A-Z]/.test(password)) {
      toast.error('Password must be at least 8 characters, contain 1 uppercase letter and 1 number.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = { name, email, password, role };
      if (mobile) {
        payload.mobile = mobile;
      }
      
      const res = await parkingApi.register(payload);
      
      if (res && res.success) {
        if (res.step === 'verify-otp') {
          setStep('otp');
          setOtpCountdown(45);
          toast.success(res.message || 'Verification OTP sent to mobile!');
          setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
        } else {
          setStep('email-confirm');
          toast.success('Registration request complete!');
        }
      } else {
        toast.error(res?.message || 'Registration failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failure. Please check input details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setResendingOtp(true);
    try {
      const res = await parkingApi.sendOtp({ mobile });
      setOtpCountdown(45);
      toast.success(res.message || 'OTP resent successfully!');
      setOtpArray(new Array(6).fill(''));
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to resend OTP.');
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

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    const otpStr = otpArray.join('');
    if (otpStr.length !== 6) {
      toast.error('Please enter 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await parkingApi.verifyOtp({ mobile, otp: otpStr });
      if (res && res.success) {
        toast.success(res.message || 'Mobile verification successful!');
        setStep('email-confirm');
      } else {
        toast.error(res?.message || 'Verification failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Invalid OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glowing backdrop accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <GalgotiasLogo className="w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-4" />
          <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans leading-none">
            {step === 'form' ? 'Register Account' : step === 'otp' ? 'OTP Verification' : 'Verify Email'}
          </h2>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-2 text-center leading-relaxed font-semibold">
            Galgotias University Parking System
          </p>
        </div>

        {/* Form Wizard Step 1 */}
        {step === 'form' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400">
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
                <span className="absolute left-3 top-3 text-slate-400">
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

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block">
                Mobile Number (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400">
                  <Phone className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="e.g. 9876543210 (For SMS Alerts)"
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
                <span className="absolute left-3 top-3 text-slate-400">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 upper, 1 number"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              {/* Password strength meter */}
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                    <span className="text-slate-400">Password Strength:</span>
                    <span className={`${
                      strength.label === 'Strong' ? 'text-green-400' : strength.label === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>{strength.label}</span>
                  </div>
                  <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400">
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

            {/* Google Signup Button */}
            <div className="mt-4 space-y-4 pt-2">
              <div className="flex items-center justify-center gap-3">
                <div className="h-[1px] bg-gray-800 flex-1"></div>
                <span className="text-[10px] text-gray-500 font-bold uppercase">Or signup with</span>
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
                Register with Google
              </button>
            </div>
          </form>
        )}

        {/* Wizard Step 2: OTP verify */}
        {step === 'otp' && (
          <form onSubmit={handleOtpVerify} className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block text-center leading-relaxed">
                Enter 6-Digit OTP sent to mobile <br />
                <span className="text-slate-800 dark:text-white font-extrabold font-mono">+91 XXXXXX{mobile.slice(-4)}</span>
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
                    disabled={resendingOtp}
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-750 hover:bg-primary-850 active:bg-primary-900 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Verify OTP Code
            </button>
          </form>
        )}

        {/* Wizard Step 3: Email confirmation screen */}
        {step === 'email-confirm' && (
          <div className="text-center space-y-6 py-4 animate-fade-in font-sans">
            <div className="w-16 h-16 bg-blue-500 bg-opacity-15 text-blue-400 rounded-full flex items-center justify-center mx-auto text-3xl shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              ✉
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Check Your Email!</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Verification link successfully sent to <br />
                <span className="text-blue-400 font-bold">{email}</span>
              </p>
              <p className="text-gray-400 text-xs leading-relaxed pt-2">
                Click the confirmation link inside the verification email to activate your account and access the dashboard.
              </p>
            </div>
            <Link
              to="/login"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium transition-all shadow-[0_4px_15px_rgba(59,130,246,0.3)] block text-center cursor-pointer"
            >
              Proceed to Login
            </Link>
          </div>
        )}

        {/* Login Redirect Link */}
        {step !== 'email-confirm' && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
            <span className="text-slate-400 font-medium">Already have an account?</span>{' '}
            <Link to="/login" className="text-primary-650 dark:text-primary-400 font-bold hover:underline">
              Login here
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
