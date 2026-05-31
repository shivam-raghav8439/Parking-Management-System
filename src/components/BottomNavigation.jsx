import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LogIn, LogOut, Map, Camera, CalendarRange, CalendarCheck } from 'lucide-react';

export default function BottomNavigation() {
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
    return [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Entry', path: '/entry', icon: LogIn },
      { name: 'ANPR', path: '/anpr', icon: Camera },
      { name: 'Parking Map', path: '/map', icon: Map },
      { name: 'Exit', path: '/exit', icon: LogOut },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-2xl transition-colors duration-300 safe-bottom">
      <nav className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400 scale-105'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary-50 dark:bg-primary-950/30' : ''}`}>
                  <item.icon className="w-5.5 h-5.5" />
                </div>
                <span className="mt-0.5 font-medium">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
