import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Map,
  History,
  BarChart3,
  Settings,
  Camera,
  ShieldCheck,
  Users,
  Layers,
  CalendarCheck,
  CalendarRange
} from 'lucide-react';

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

  const getNavItems = () => {
    if (role === 'user') {
      return [
        { name: 'Book Parking', path: '/book-slot', icon: CalendarRange },
        { name: 'My Bookings', path: '/my-bookings', icon: CalendarCheck },
        { name: 'Parking Map', path: '/map', icon: Map }
      ];
    }

    const items = [];
    items.push({ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard });
    items.push({ name: 'Entry Desk', path: '/entry', icon: LogIn });
    items.push({ name: 'Exit Checkpoint', path: '/exit', icon: LogOut });
    items.push({ name: 'Live Gate Camera', path: '/anpr', icon: Camera });
    items.push({ name: 'Vehicle Registry', path: '/register-vehicle', icon: ShieldCheck });
    items.push({ name: 'Parking Map', path: '/map', icon: Map });
    items.push({ name: 'History Logs', path: '/history', icon: History });

    if (role === 'admin') {
      items.push({ name: 'User Management', path: '/admin/users', icon: Users });
      items.push({ name: 'Slot Management', path: '/admin/slots', icon: Layers });
      items.push({ name: 'Booking Management', path: '/admin/bookings', icon: CalendarCheck });
      items.push({ name: 'Reports', path: '/reports', icon: BarChart3 });
      items.push({ name: 'Settings', path: '/settings', icon: Settings });
    }

    return items;
  };

  const navItems = getNavItems();

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
              <item.icon className="w-5.5 h-5.5 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer Info */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-800/50 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-650 dark:text-slate-400 uppercase tracking-widest">
          {role === 'admin' ? 'Admin Panel' : role === 'operator' ? 'Campus Control' : 'User Portal'}
        </p>
        <p className="mt-0.5">Version 1.0.0 (Vite + React)</p>
      </div>
    </aside>
  );
}
