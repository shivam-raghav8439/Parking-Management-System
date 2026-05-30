import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Entry from './pages/Entry';
import Exit from './pages/Exit';
import ParkingMap from './pages/ParkingMap';
import History from './pages/History';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import Anpr from './pages/Anpr';
import RegisterVehicle from './pages/RegisterVehicle';
import BottomNavigation from './components/BottomNavigation';


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
  const RequireAuth = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  // If we are on login/register, don't show the dashboard shell layout (Sidebar/Navbar)
  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center transition-colors duration-300">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
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
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/entry" element={<RequireAuth><Entry /></RequireAuth>} />
            <Route path="/exit" element={<RequireAuth><Exit /></RequireAuth>} />
            <Route path="/map" element={<RequireAuth><ParkingMap /></RequireAuth>} />
            <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
            <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
            <Route path="/anpr" element={<RequireAuth><Anpr /></RequireAuth>} />
            <Route path="/register-vehicle" element={<RequireAuth><RegisterVehicle /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isAuthenticated && <BottomNavigation />}
    </div>
  );
}
