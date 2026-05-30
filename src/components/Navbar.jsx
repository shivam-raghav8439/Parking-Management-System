import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Sun, Moon, Clock, ShieldCheck, Menu, X, User, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { useParkingStats } from '../hooks/useParkingData';
import { parkingApi } from '../api/parkingApi';
import GalgotiasLogo from './GalgotiasLogo';

export default function Navbar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collegeName, setCollegeName] = useState('State Institute of Technology');
  const [currentUser, setCurrentUser] = useState(null);

  const { data: stats } = useParkingStats();

  // Update Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Session User Info
  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    };
    checkUser();

    // Listen for auth changes
    window.addEventListener('authChange', checkUser);
    return () => {
      window.removeEventListener('authChange', checkUser);
    };
  }, []);

  // Fetch College Name from Settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await parkingApi.getSettings();
        if (settings && settings.collegeName) {
          setCollegeName(settings.collegeName);
        }
      } catch (err) {}
    };
    loadSettings();

    const handleStorageChange = () => {
      const stored = localStorage.getItem('college_parking_settings');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.collegeName) setCollegeName(parsed.collegeName);
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('settingsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsUpdated', handleStorageChange);
    };
  }, []);

  // Dark Mode Toggle Logic
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setDarkMode(isDark);
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Dispatch auth state change
    window.dispatchEvent(new Event('authChange'));
    
    // Redirect to login
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
      <div className="mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        
        {/* Brand/Logo */}
        <div className="flex items-center gap-3">
          <GalgotiasLogo className="w-10 h-10 shrink-0" />
          <div>
            <h1 className="text-sm md:text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight font-sans m-0">
              Galgotias University
            </h1>
            <p className="text-[9px] text-primary-650 dark:text-primary-400 font-extrabold tracking-widest uppercase">
              Parking Management System
            </p>
          </div>
        </div>

        {/* Desktop Header Info */}
        <div className="hidden md:flex items-center gap-6">
          
          {/* Available Slots Indicator */}
          {currentUser && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-450">
                {stats?.availableSlots ?? '--'} Slots Available
              </span>
            </div>
          )}

          {/* Live Ticking Clock */}
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium text-xs font-mono">
            <Clock className="w-4 h-4 text-slate-450" />
            <span>{format(currentTime, 'dd MMM yyyy, hh:mm:ss a')}</span>
          </div>

          {/* Dark Mode Button */}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all duration-200 cursor-pointer"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          {/* User Profile Badge & Logout (If authenticated) */}
          {currentUser && (
            <div className="flex items-center gap-3.5 pl-4 border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-200 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left leading-none">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[100px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[9px] font-extrabold text-primary-650 dark:text-primary-400 uppercase tracking-wider block mt-0.5">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {/* Logout Trigger */}
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                title="Logout Account"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          )}

        </div>

        {/* Mobile Header Actions */}
        <div className="flex md:hidden items-center gap-2">
          {/* Dark Mode Button */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Logout for Mobile */}
          {currentUser && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/15"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {/* Burger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-850"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-4 space-y-3 transition-colors duration-300">
          {stats && (
            <div className="flex justify-between items-center px-2 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">Available Slots:</span>
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">{stats?.availableSlots ?? '--'}</span>
            </div>
          )}

          {currentUser && (
            <div className="px-2 py-1 text-xs text-slate-500 font-medium">
              Signed in as: <span className="font-bold text-slate-800 dark:text-slate-200">{currentUser.name} ({currentUser.role})</span>
            </div>
          )}

          <nav className="flex flex-col gap-1">
            {[
              { name: 'Dashboard', path: '/dashboard' },
              { name: 'Entry Desk', path: '/entry' },
              { name: 'Exit Checkpoint', path: '/exit' },
              { name: 'Live Gate Camera', path: '/anpr' },
              { name: 'Vehicle Registry', path: '/register-vehicle' },
              { name: 'Parking Map', path: '/map' },
              { name: 'History Logs', path: '/history' },
              { name: 'Reports', path: '/reports' },
              { name: 'Settings', path: '/settings' }
            ].map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-semibold block ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400'
                      : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
