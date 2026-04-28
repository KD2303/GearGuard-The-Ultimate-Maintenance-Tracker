import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Wrench, Box, Users, Calendar, LayoutDashboard, List, Activity, Bell, Menu, X, Car, Settings, Shield } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', gradient: 'from-blue-500 to-purple-600' },
    { to: '/admin', icon: Shield, label: 'Admin', gradient: 'from-rose-500 to-red-600' },
    { to: '/requests', icon: Wrench, label: 'Kanban', gradient: 'from-purple-500 to-pink-600' },
    { to: '/requests-all', icon: List, label: 'All Requests', gradient: 'from-pink-500 to-red-600' },
    { to: '/calendar', icon: Calendar, label: 'Calendar', gradient: 'from-cyan-500 to-blue-600' },
    { to: '/equipment', icon: Box, label: 'Equipment', gradient: 'from-green-500 to-teal-600' },
    { to: '/vehicles', icon: Car, label: 'Vehicles', gradient: 'from-orange-500 to-red-600' },
    { to: '/teams', icon: Users, label: 'Teams', gradient: 'from-yellow-500 to-orange-600' },
    { to: '/activity', icon: Activity, label: 'Activity', gradient: 'from-indigo-500 to-purple-600' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%)' }}>
      {/* Unified Header + Navigation */}
      <header className="glass sticky top-0 z-50 border border-white/45 bg-white/25 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.55)] backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid h-16 lg:h-[4.5rem] grid-cols-[auto,1fr,auto] items-center gap-3">
            {/* Logo */}
            <div className="flex items-center space-x-2.5">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-60"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 rounded-xl shadow-lg ring-1 ring-white/40">
                  <Wrench className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                  GearGuard
                </h1>
                <p className="hidden lg:block text-xs text-gray-500 font-medium">Maintenance Tracker</p>
              </div>
            </div>

            {/* Center Navigation */}
            <div className="hidden lg:flex min-w-0 justify-center px-2 lg:px-6">
              <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-white/50 bg-white/35 px-2 py-1.5 shadow-lg shadow-slate-900/5 backdrop-blur-xl scrollbar-thin">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `group relative flex items-center whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-300 lg:text-sm ${
                        isActive
                          ? 'border-white/30 text-white shadow-lg'
                          : 'border-transparent text-gray-600 hover:border-white/60 hover:text-gray-900 hover:bg-white/60'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-xl ring-1 ring-white/30`}></div>
                        )}
                        <item.icon className={`relative h-4 w-4 lg:h-5 lg:w-5 mr-1.5 lg:mr-2 transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`} />
                        <span className="relative">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 lg:space-x-3">
              <NotificationCenter />

              {/* Settings Icon with Dropdown */}
              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  title="Settings"
                  className={`rounded-xl border p-2 shadow-sm backdrop-blur-xl transition-all duration-200 ${
                    settingsOpen
                      ? 'border-purple-300 bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'border-white/50 bg-white/30 text-gray-600 hover:border-white/70 hover:text-purple-600'
                  }`}
                >
                  <Settings className={`h-5 w-5 transition-transform duration-300 ${settingsOpen ? 'rotate-90' : ''}`} />
                </button>

                {settingsOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/50 bg-white/90 shadow-xl backdrop-blur-xl z-50 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Settings</p>
                    </div>
                    <button
                      onClick={() => { navigate('/settings'); setSettingsOpen(false); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      App Settings
                    </button>
                    <button
                      onClick={() => { navigate('/profile'); setSettingsOpen(false); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                    >
                      <Users className="h-4 w-4" />
                      Profile
                    </button>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <div className="hidden lg:flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl border border-white/50 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg ring-1 ring-white/40">
                  JD
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden rounded-xl border border-white/50 bg-white/30 p-2 text-gray-600 shadow-sm backdrop-blur-xl hover:border-white/70 hover:text-purple-600"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-2 space-y-2 rounded-2xl border border-white/45 bg-white/35 p-3 shadow-lg backdrop-blur-xl">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? 'border-white/30 text-white shadow-lg bg-gradient-to-r ' + item.gradient
                        : 'border-transparent text-gray-600 hover:border-white/60 hover:bg-white/60'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content with Animation */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 page-container">
        {children}
      </main>

      {/* Footer */}
      <footer className="glass border-t border-white/20 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Wrench className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">
                © 2025 GearGuard. All rights reserved.
              </span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-purple-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-purple-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-purple-600 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
