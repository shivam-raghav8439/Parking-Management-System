import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

// Navigation links with emoji icons exactly as requested
const adminNavLinks = [
  { path: '/dashboard',    icon: '📊', label: 'Dashboard' },
  { path: '/entry',        icon: '🚗', label: 'Vehicle Entry' },
  { path: '/exit',         icon: '🚪', label: 'Vehicle Exit' },
  { path: '/map',          icon: '🗺️',  label: 'Parking Map' },
  { path: '/history',      icon: '📋', label: 'History' },
  { path: '/passes',       icon: '🎫', label: 'Passes' },
  { path: '/reports',      icon: '📈', label: 'Reports' },
  { path: '/anpr',         icon: '📷', label: 'ANPR Gate' },
  { path: '/cctv',         icon: '🎥', label: 'CCTV' },
  { path: '/users',        icon: '👥', label: 'Users' },
  { path: '/ai-assistant', icon: '🤖', label: 'AI Assistant', badge: 'NEW' },
  { path: '/settings',     icon: '⚙️',  label: 'Settings' },
];

const userNavLinks = [
  { path: '/map',          icon: '🗺️',  label: 'Parking Map' },
  { path: '/my-bookings',  icon: '📋', label: 'My Bookings' },
  { path: '/book-slot',    icon: '🎫', label: 'Book a Pass' },
  { path: '/ai-assistant', icon: '🤖', label: 'AI Assistant', badge: 'NEW' },
];

export default function Sidebar() {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('user');
    return cached ? JSON.parse(cached) : null;
  });

  useEffect(() => {
    const handleAuth = () => {
      const cached = localStorage.getItem('user');
      setUser(cached ? JSON.parse(cached) : null);
    };
    window.addEventListener('authChange', handleAuth);
    return () => window.removeEventListener('authChange', handleAuth);
  }, []);

  const role = user ? user.role : 'user';
  const navItems = role === 'user' ? userNavLinks : adminNavLinks;

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between hidden md:flex transition-colors duration-300 z-10">
      <div className="flex flex-col py-6">
        {/* Navigation Items */}
        <nav className="px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-750 dark:bg-primary-950/30 dark:text-primary-400 border-l-4 border-primary-600 pl-3'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`
              }
            >
              {/* Render emoji as text, not as a React component */}
              <span className="text-lg leading-none shrink-0 w-6 text-center">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-blue-600 text-white rounded">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer Info */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-800/50 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-650 dark:text-slate-400 uppercase tracking-widest">
          {role === 'admin' ? 'Admin Panel' : role === 'operator' ? 'Campus Control' : 'User Portal'}
        </p>
        <p className="mt-0.5">Galgotias University · v1.0</p>
      </div>
    </aside>
  );
}
