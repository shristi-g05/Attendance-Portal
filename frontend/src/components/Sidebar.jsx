import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Camera, 
  Users, 
  ClipboardList, 
  LogOut, 
  ScanFace 
} from 'lucide-react';
import { authService } from '../services/api';
import ThemeToggle from './ThemeToggle';

const Sidebar = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Webcam Session', path: '/webcam-session', icon: Camera },
    { name: 'Student Directory', path: '/students', icon: Users },
    { name: 'Attendance Logs', path: '/attendance', icon: ClipboardList },
  ];

  return (
    <aside className="w-64 h-screen fixed top-0 left-0 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-r border-slate-200/50 dark:border-slate-800/40 flex flex-col justify-between py-6 px-4 z-30 transition-all duration-300">
      <div className="flex flex-col space-y-8">
        {/* Sleek App Branding */}
        <div className="flex items-center space-x-3 px-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <ScanFace className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">Attendance Portal</h1>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold">Face-Recognition AI</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group
                  ${isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-r-4 border-indigo-500/80' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
              >
                <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-105" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Admin User Card & Utilities */}
      <div className="flex flex-col space-y-4 pt-6 border-t border-slate-200/50 dark:border-slate-800/40">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-sm">
              AD
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {currentUser?.username || 'Admin'}
              </p>
              <p className="text-[10px] font-medium text-indigo-500 uppercase tracking-wider">
                {currentUser?.role || 'Super Admin'}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
