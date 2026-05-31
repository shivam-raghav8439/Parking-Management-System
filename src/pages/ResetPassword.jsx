import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { parkingApi } from '../api/parkingApi';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const token = searchParams.get('token');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Reset token is missing from URL.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast.error('All fields are required.');
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
      const res = await parkingApi.resetPassword({ token, newPassword });
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

        <div className="relative z-10 font-sans">
          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2 text-center">Reset Password</h2>
          <p className="text-gray-400 text-sm mb-6 text-center">
            Set your new account password to log back in.
          </p>

          {!token ? (
            <div className="text-center py-4 space-y-4">
              <p className="text-red-400 text-sm">
                Invalid or missing reset token. Please request a new password reset link.
              </p>
              <Link
                to="/forgot-password"
                className="inline-block py-2 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-all text-sm cursor-pointer text-center"
              >
                Forgot Password Page
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  'Update Password'
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

export default ResetPassword;
