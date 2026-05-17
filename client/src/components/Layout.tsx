import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
  LogOut,
} from "lucide-react";
import NotificationCenter from "./NotificationCenter";
import LanguageSelector from "./LanguageSelector";
import { useTranslation } from "react-i18next";
import { authService } from "../services/authService";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const currentUser = authService.getCurrentUser() || { name: "Guest User", role: "Technician" };

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
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/";
  };

  const navItems = [
    {
      to: "/",
      icon: LayoutDashboard,
      label: t("nav.dashboard"),
      gradient: "from-blue-500 to-indigo-600 shadow-blue-500/20",
    },
    {
      to: "/admin",
      icon: Shield,
      label: t("nav.admin"),
      gradient: "from-rose-500 to-red-600 shadow-rose-500/20",
    },
    {
      to: "/requests",
      icon: Wrench,
      label: t("nav.kanban"),
      gradient: "from-purple-500 to-pink-600 shadow-purple-500/20",
    },
    {
      to: "/requests-all",
      icon: List,
      label: t("nav.allRequests"),
      gradient: "from-pink-500 to-rose-600 shadow-pink-500/20",
    },
    {
      to: "/calendar",
      icon: Calendar,
      label: t("nav.calendar"),
      gradient: "from-cyan-500 to-blue-600 shadow-cyan-500/20",
    },
    {
      to: "/equipment",
      icon: Box,
      label: t("nav.equipment"),
      gradient: "from-green-500 to-emerald-600 shadow-green-500/20",
    },
    {
      to: "/vehicles",
      icon: Car,
      label: t("nav.vehicles"),
      gradient: "from-orange-500 to-amber-600 shadow-orange-500/20",
    },
    {
      to: "/teams",
      icon: Users,
      label: t("nav.teams"),
      gradient: "from-yellow-500 to-orange-600 shadow-yellow-500/20",
    },
    {
      to: "/activity",
      icon: Activity,
      label: t("nav.activity"),
      gradient: "from-indigo-500 to-purple-600 shadow-indigo-500/20",
    },
    {
      to: "/analytics",
      icon: BarChart3,
      label: t("nav.analytics"),
      gradient: "from-emerald-500 to-teal-600 shadow-emerald-500/20",
    },
  ];

  const activeItem = navItems.find((item) => item.to === location.pathname) || navItems[0];
  const pageTitle = activeItem ? activeItem.label : t("nav.dashboard");

  // Get initials for profile badge
  const userInitials = currentUser.name
    ? currentUser.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "GU";

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* 💻 DESKTOP LEFT SIDEBAR NAVIGATION */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-colors duration-300 sticky top-0 h-screen z-40">
        
        {/* Sidebar Header (Logo) */}
        <div className="h-[4.5rem] px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-55"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl shadow-lg ring-1 ring-white/20">
                <Wrench className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-none">
                {t("layout.title") || "GearGuard"}
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5 tracking-wider uppercase">
                {t("layout.subtitle") || "Maintenance"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group relative flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? "text-white shadow-lg shadow-indigo-600/10"
                    : "text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-xl shadow-md ring-1 ring-white/10`}
                    ></div>
                  )}

                  <item.icon
                    className={`relative h-5 w-5 mr-3 transition-transform duration-300 ${
                      isActive ? "scale-100" : "group-hover:scale-110 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                    }`}
                  />

                  <span className="relative z-10">{item.label}</span>

                  {isActive && (
                    <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full z-10 animate-pulse"></div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md ring-1 ring-white/20">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider truncate">
                {currentUser.role}
              </p>
            </div>
          </div>
        </div>

      </aside>

      {/* 🚀 MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Header (Top Utility Bar) */}
        <header className="sticky top-0 z-30 h-[4.5rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/85 dark:border-slate-700/85 flex items-center justify-between px-6 transition-colors duration-300">
          
          {/* Header Left (Breadcrumbs / Navigation trigger) */}
          <div className="flex items-center space-x-4">
            
            {/* Mobile Sidebar Hamburger Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition duration-200"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* dynamic Page Title / Breadcrumb */}
            <div className="hidden sm:block">
              <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {pageTitle}
              </h2>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center space-x-2.5">
            
            {/* Notifications panel */}
            <NotificationCenter />

            {/* Language Selector Selector */}
            <LanguageSelector />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>

            {/* User Settings Gear */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`rounded-xl border p-2 shadow-sm transition-all duration-200 ${
                  settingsOpen
                    ? "border-indigo-300 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-slate-300"
                }`}
              >
                <Settings
                  className={`h-5 w-5 ${settingsOpen ? "rotate-90" : ""}`}
                />
              </button>

              {settingsOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-50 py-1.5">
                  <button
                    onClick={() => {
                      navigate("/settings");
                      setSettingsOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-sm font-semibold text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    {t("layout.settings") || "Settings"}
                  </button>

                  <button
                    onClick={() => {
                      navigate("/admin");
                      setSettingsOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-sm font-semibold text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    {t("nav.admin") || "Admin"}
                  </button>

                  <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-2 text-sm font-bold text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("nav.logout") || "Log Out"}
                  </button>
                </div>
              )}
            </div>

            {/* Desktop Quick User initials badge */}
            <div className="hidden sm:flex items-center space-x-2 border-l border-slate-200 dark:border-slate-700 pl-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-extrabold shadow shadow-blue-500/10">
                {userInitials}
              </div>
            </div>

          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-6 py-6 page-container">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center space-x-2">
                <Wrench className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t("layout.rights") || "© 2026 GearGuard. All rights reserved."}
                </span>
              </div>
              <div className="flex space-x-5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  {t("layout.privacy") || "Privacy Policy"}
                </a>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  {t("layout.terms") || "Terms of Service"}
                </a>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  {t("layout.support") || "Support"}
                </a>
              </div>
            </div>
          </div>
        </footer>

      </div>

      {/* 📱 MOBILE SIDEBAR DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          
          {/* Clicking outside dim block */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          ></div>

          {/* Drawer menu */}
          <div className="relative flex flex-col w-72 max-w-xs bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-full shadow-2xl transition duration-300 animate-slide-in">
            
            {/* Drawer Close Button */}
            <div className="absolute right-4 top-4">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Logo area */}
            <div className="h-[4.5rem] px-6 border-b border-slate-200 dark:border-slate-700 flex items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl shadow shadow-blue-500/10">
                  <Wrench className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-none">
                    {t("layout.title") || "GearGuard"}
                  </h1>
                </div>
              </div>
            </div>

            {/* Dynamic mobile nav links */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? "text-white shadow-lg shadow-indigo-600/10"
                        : "text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-xl shadow-md ring-1 ring-white/10`}
                        ></div>
                      )}

                      <item.icon
                        className={`relative h-5 w-5 mr-3 transition-transform duration-300 ${
                          isActive ? "scale-100" : "group-hover:scale-110 text-slate-400 group-hover:text-indigo-600"
                        }`}
                      />

                      <span className="relative z-10">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Profile Drawer footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {userInitials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">
                      {currentUser.role}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 text-red-600 p-2 hover:bg-red-100 transition"
                  title={t("nav.logout") || "Log Out"}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Layout;
