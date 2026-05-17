import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { 
  Wrench, 
  Box, 
  Users, 
  Calendar, 
  LayoutDashboard, 
  List, 
  Activity, 
  Bell, 
  Menu, 
  X, 
  Car, 
  Settings, 
  Shield,
  BarChart3,
} from "lucide-react";
import NotificationCenter from "./NotificationCenter";
import LanguageSelector from './LanguageSelector';
import { useTranslation } from 'react-i18next';


interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const settingsRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
    
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard'), gradient: 'from-blue-500 to-purple-600' },
    { to: '/admin', icon: Shield, label: t('nav.admin'), gradient: 'from-rose-500 to-red-600' },
    { to: '/requests', icon: Wrench, label: t('nav.kanban'), gradient: 'from-purple-500 to-pink-600' },
    { to: '/requests-all', icon: List, label: t('nav.allRequests'), gradient: 'from-pink-500 to-red-600' },
    { to: '/calendar', icon: Calendar, label: t('nav.calendar'), gradient: 'from-cyan-500 to-blue-600' },
    { to: '/equipment', icon: Box, label: t('nav.equipment'), gradient: 'from-green-500 to-teal-600' },
    { to: '/vehicles', icon: Car, label: t('nav.vehicles'), gradient: 'from-orange-500 to-red-600' },
    { to: '/teams', icon: Users, label: t('nav.teams'), gradient: 'from-yellow-500 to-orange-600' },
    { to: '/activity', icon: Activity, label: t('nav.activity'), gradient: 'from-indigo-500 to-purple-600' },
    { to: '/analytics', icon: BarChart3, label: t('nav.analytics'), gradient: 'from-emerald-500 to-cyan-600' },

  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border border-white/45 dark:border-gray-700 bg-white/25 dark:bg-gray-900/70 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.55)] backdrop-blur-2xl transition-colors">
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
                  {t('layout.title')}
                </h1>
                <p className="hidden lg:block text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium">{t('layout.subtitle')}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex min-w-0 justify-center px-2 lg:px-6">
              <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 px-2 py-1.5 shadow-lg shadow-slate-900/5 backdrop-blur-xl scrollbar-thin">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `group relative flex items-center whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-300 lg:text-sm ${
                        isActive
                          ? "border-white/30 text-white shadow-lg"
                          : "border-transparent text-gray-800 dark:text-gray-300 hover:border-white/60 hover:text-black dark:hover:text-white hover:bg-white/60"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div
                            className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-xl ring-1 ring-white/30`}
                          ></div>
                        )}

                        <item.icon
                          className={`relative h-4 w-4 lg:h-5 lg:w-5 mr-1.5 lg:mr-2 transition-transform duration-300 ${
                            isActive
                              ? ""
                              : "group-hover:scale-110"
                          }`}
                        />

                        <span className="relative">
                          {item.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2 lg:space-x-3">
             <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Notifications */}
            <NotificationCenter />

            {/* 🌍 Language Selector */}
            <LanguageSelector />

            {/* 🌙 Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-xl border border-white/50 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow backdrop-blur-xl hover:bg-white/50 transition"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>

            {/* Settings Dropdown */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={toggleTheme}
                className="rounded-xl border border-white/50 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow backdrop-blur-xl hover:bg-white/50 transition"
              >
                {theme === "light" ? "🌙" : "☀️"}
              </button>

              {/* Settings Dropdown */}
              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={`rounded-xl border p-2 shadow-sm backdrop-blur-xl transition-all ${
                    settingsOpen
                      ? "border-purple-300 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "border-white/50 bg-white/30 text-gray-600 hover:text-purple-600"
                  }`}
                >
                  <Settings
                    className={`h-5 w-5 ${settingsOpen ? "rotate-90" : ""}`}
                  />
                </button>

                {settingsOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl border bg-white/90 shadow-xl backdrop-blur-xl z-50">
                    <button
                      onClick={() => {
                        navigate("/settings");
                        setSettingsOpen(false);
                      }}
                      className="block w-full px-4 py-2 text-left hover:bg-purple-50"
                    >
                      {t('layout.settings')}
                    </button>

                    <button
                      onClick={() => {
                        navigate("/profile");
                        setSettingsOpen(false);
                      }}
                      className="block w-full px-4 py-2 text-left hover:bg-purple-50"
                    >
                      {t('layout.profile')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Avatar */}

              <div className="hidden lg:flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl border border-white/50 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg ring-1 ring-white/40">
                  JD
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() =>
                  setMobileMenuOpen(!mobileMenuOpen)
                }
                className="lg:hidden rounded-xl border border-white/50 bg-white dark:bg-gray-800 p-2 text-gray-800 dark:text-gray-300 shadow-sm backdrop-blur-xl hover:border-white/70 hover:text-purple-600"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-2 space-y-2 rounded-2xl border border-white/45 bg-white/80 dark:bg-gray-900/70 p-3 shadow-lg backdrop-blur-xl">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className={({ isActive }) =>
                    `flex items-center rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? "border-white/30 text-white shadow-lg bg-gradient-to-r " +
                          item.gradient
                        : "border-transparent text-gray-800 dark:text-gray-300 hover:border-white/60 hover:bg-white/60"
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 page-container">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Wrench className="h-5 w-5 text-purple-600 dark:text-purple-400" />

              <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
                {t('layout.rights')}
              </span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <a href="#" className="hover:text-purple-600 transition-colors">{t('layout.privacy')}</a>
              <a href="#" className="hover:text-purple-600 transition-colors">{t('layout.terms')}</a>
              <a href="#" className="hover:text-purple-600 transition-colors">{t('layout.support')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;