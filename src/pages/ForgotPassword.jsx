import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { parkingApi } from '../api/parkingApi';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState(false);
  const [showOtpOption, setShowOtpOption] = useState(false);

  // SMS OTP fields
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTab, setActiveTab] = useState('email'); // 'email', 'otp'

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

  const strength = checkStrength(newPassword);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      const res = await parkingApi.forgotPassword({ email });
      setSentEmail(true);
      toast.success(res.message || 'Reset instructions sent to your email.');
      if (res.mobileVerified) {
        setShowOtpOption(true);
        toast.success('SMS OTP also sent to your registered mobile number!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!mobile || !otp || !newPassword || !confirmPassword) {
      toast.error('All fields are required.');
      return;
    }
    if (otp.length !== 6) {
      toast.error('OTP must be exactly 6 digits.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8 || !/[0-9]/.test(newPassword) || !/[A-Z]/.test(newPassword)) {
      toast.error('Password must be at least 8 characters, and contain at least 1 number and 1 uppercase letter.');
      return;
    }

    setLoading(true);
    try {
      const res = await parkingApi.resetPasswordOtp({ mobile, otp, newPassword });
      toast.success(res.message || 'Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-white p-6 font-sans">
      <div className="w-full max-w-md bg-opacity-10 bg-white backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-10 shadow-2xl relative overflow-hidden">
        {/* Decorative ambient light */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500 rounded-full blur-[80px] opacity-25"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500 rounded-full blur-[80px] opacity-25"></div>

        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2 text-center">Forgot Password</h2>
          <p className="text-gray-400 text-sm mb-6 text-center">
            Recover your account using email link or SMS verification.
          </p>

          {/* Tab buttons */}
          <div className="flex border-b border-gray-800 mb-6">
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 pb-3 text-sm font-semibold transition-all ${
                activeTab === 'email'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Email Link
            </button>
            <button
              onClick={() => setActiveTab('otp')}
              className={`flex-1 pb-3 text-sm font-semibold transition-all ${
                activeTab === 'otp'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              SMS OTP
            </button>
          </div>

          {activeTab === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all text-sm"
                  required
                />
              </div>

              {sentEmail && (
                <div className="p-4 rounded-xl bg-green-500 bg-opacity-10 border border-green-500 border-opacity-20 text-green-400 text-xs leading-relaxed">
                  <span className="font-bold">Success:</span> Reset link sent! Check your inbox. If you have a registered mobile, you can also use the <button type="button" onClick={() => setActiveTab('otp')} className="text-blue-400 underline font-semibold hover:text-blue-300">SMS OTP tab</button> to reset instantly.
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium transition-all shadow-[0_4px_15px_rgba(59,130,246,0.3)] disabled:opacity-50 cursor-pointer flex justify-center items-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}

          {activeTab === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Mobile Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  6-Digit OTP
                </label>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all text-sm tracking-widest text-center font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all text-sm"
                  required
                />

                {/* Password strength meter */}
                {newPassword && (
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Password Strength:</span>
                      <span className={`font-semibold ${
                        strength.label === 'Strong' ? 'text-green-400' : strength.label === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                      }`}>{strength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${strength.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium transition-all shadow-[0_4px_15px_rgba(59,130,246,0.3)] disabled:opacity-50 cursor-pointer flex justify-center items-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-blue-500 hover:text-blue-400 transition-all">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
