import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNavigation from './components/BottomNavigation';
import Spinner from './components/Loader';

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



export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  // Sync auth state on startup & listen to state updates
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    checkAuth();

    // Listen to custom dispatchers for immediate auth changes
    window.addEventListener('authChange', checkAuth);
    return () => {
      window.removeEventListener('authChange', checkAuth);
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

  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';
 
  // Guard Wrapper Component
  const RequireAuth = ({ children, allowedRoles }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return <Navigate to="/login" replace />;
    
    const user = JSON.parse(userStr);
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      const fallbackUrl = user.role === 'user' ? '/book-slot' : '/dashboard';
      return <Navigate to={fallbackUrl} replace />;
    }
    
    return children;
  };

  const RootRedirect = () => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const dest = user.role === 'user' ? '/book-slot' : '/dashboard';
    return <Navigate to={dest} replace />;
  };
 
  // If we are on login/register, don't show the dashboard shell layout (Sidebar/Navbar)
  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center transition-colors duration-300">
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <RootRedirect />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <RootRedirect />} />
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
    </div>
  );
}
