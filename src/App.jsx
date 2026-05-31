import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNavigation from './components/BottomNavigation';
import Spinner from './components/Loader';
import { resetInactivityTimer, logout } from './api/client';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load route pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Entry = lazy(() => import('./pages/Entry'));
const Exit = lazy(() => import('./pages/Exit'));
const ParkingMap = lazy(() => import('./pages/ParkingMap'));
const History = lazy(() => import('./pages/History'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Anpr = lazy(() => import('./pages/Anpr'));
const RegisterVehicle = lazy(() => import('./pages/RegisterVehicle'));

// New Admin & User pages
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const SlotManagement = lazy(() => import('./pages/admin/SlotManagement'));
const BookingManagement = lazy(() => import('./pages/admin/BookingManagement'));
const BookSlot = lazy(() => import('./pages/user/BookSlot'));
const MyBookings = lazy(() => import('./pages/user/MyBookings'));

// Advanced Security pages
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const GoogleSuccess = lazy(() => import('./pages/GoogleSuccess'));

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const [countdown, setCountdown] = useState(120);

  // Sync auth state on startup & listen to state updates
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    checkAuth();

    // Listen to custom dispatchers for immediate auth changes
    window.addEventListener('authChange', checkAuth);
    window.addEventListener('storage', checkAuth);
    window.addEventListener('auth_logout', checkAuth);

    return () => {
      window.removeEventListener('authChange', checkAuth);
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth_logout', checkAuth);
    };
  }, []);

  // Inactivity warning listener
  useEffect(() => {
    let interval;
    const onWarning = () => {
      setShowInactivityModal(true);
      setCountdown(120);
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const onReset = () => {
      setShowInactivityModal(false);
      clearInterval(interval);
    };

    window.addEventListener('inactivity-warning', onWarning);
    window.addEventListener('inactivity-reset', onReset);

    return () => {
      window.removeEventListener('inactivity-warning', onWarning);
      window.removeEventListener('inactivity-reset', onReset);
      clearInterval(interval);
    };
  }, []);

  // Sync dashboard theme on startup & listen to theme changes
  useEffect(() => {
    const applyTheme = () => {
      const currentTheme = localStorage.getItem('dashboard_theme') || 'classic';
      document.body.classList.remove('theme-classic', 'theme-galgotias', 'theme-emerald', 'theme-sunset', 'theme-amber');
      if (currentTheme !== 'classic') {
        document.body.classList.add(`theme-${currentTheme}`);
      }
    };

    applyTheme();

    window.addEventListener('themeChange', applyTheme);
    return () => {
      window.removeEventListener('themeChange', applyTheme);
    };
  }, []);

  const handleStayLoggedIn = () => {
    resetInactivityTimer();
  };

  const handleLogoutNow = () => {
    logout();
  };

  const isAuthRoute = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/auth/google/success'].includes(location.pathname);

  // Guard Wrapper Component
  const RequireAuth = ({ children, allowedRoles }) => {
    return <ProtectedRoute allowedRoles={allowedRoles}>{children}</ProtectedRoute>;
  };

  const RootRedirect = () => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const dest = user.role === 'user' ? '/book-slot' : '/dashboard';
    return <Navigate to={dest} replace />;
  };

  // If we are on auth routes, don't show the dashboard shell layout (Sidebar/Navbar)
  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center transition-colors duration-300">
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <RootRedirect />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <RootRedirect />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/google/success" element={<GoogleSuccess />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-350">
      {/* Top Navigation Bar */}
      <Navbar />
      
      {/* Main Framework Grid */}
      <div className="flex flex-1 relative">
        {/* Left Side Sidebar Menu */}
        <Sidebar />
        
        {/* Main Content Workspace */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full overflow-y-auto">
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/dashboard" element={<RequireAuth allowedRoles={['admin', 'operator']}><Dashboard /></RequireAuth>} />
              <Route path="/entry" element={<RequireAuth allowedRoles={['admin', 'operator']}><Entry /></RequireAuth>} />
              <Route path="/exit" element={<RequireAuth allowedRoles={['admin', 'operator']}><Exit /></RequireAuth>} />
              <Route path="/map" element={<RequireAuth><ParkingMap /></RequireAuth>} />
              <Route path="/history" element={<RequireAuth allowedRoles={['admin', 'operator']}><History /></RequireAuth>} />
              <Route path="/reports" element={<RequireAuth allowedRoles={['admin']}><Reports /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth allowedRoles={['admin']}><Settings /></RequireAuth>} />
              <Route path="/anpr" element={<RequireAuth allowedRoles={['admin', 'operator']}><Anpr /></RequireAuth>} />
              <Route path="/register-vehicle" element={<RequireAuth allowedRoles={['admin', 'operator']}><RegisterVehicle /></RequireAuth>} />
              
              {/* User Routes */}
              <Route path="/book-slot" element={<RequireAuth allowedRoles={['user', 'admin']}><BookSlot /></RequireAuth>} />
              <Route path="/my-bookings" element={<RequireAuth allowedRoles={['user', 'admin']}><MyBookings /></RequireAuth>} />

              {/* Admin Routes */}
              <Route path="/admin/users" element={<RequireAuth allowedRoles={['admin']}><UserManagement /></RequireAuth>} />
              <Route path="/admin/slots" element={<RequireAuth allowedRoles={['admin']}><SlotManagement /></RequireAuth>} />
              <Route path="/admin/bookings" element={<RequireAuth allowedRoles={['admin']}><BookingManagement /></RequireAuth>} />
              
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isAuthenticated && <BottomNavigation />}

      {/* Inactivity warning modal */}
      {showInactivityModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#161b22] border border-gray-800 rounded-2xl p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in duration-200 font-sans">
            <div className="w-12 h-12 bg-amber-500 bg-opacity-10 text-amber-500 rounded-full flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <h3 className="text-xl font-bold text-white">Inactivity Warning</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              You will be logged out in <span className="font-mono text-amber-500 font-bold">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span> due to inactivity.
            </p>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={handleStayLoggedIn}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-[0_4px_12px_rgba(59,130,246,0.2)] cursor-pointer"
              >
                Stay Logged In
              </button>
              <button
                onClick={handleLogoutNow}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold text-sm transition-all cursor-pointer"
              >
                Logout Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
