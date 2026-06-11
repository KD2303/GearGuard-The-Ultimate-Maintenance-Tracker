"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var ThemeContext_1 = require("../contexts/ThemeContext");
var AuthContext_1 = require("../contexts/AuthContext");
var lucide_react_1 = require("lucide-react");
var NotificationCenter_1 = require("./NotificationCenter");
var LanguageSelector_1 = require("./LanguageSelector");
var react_i18next_1 = require("react-i18next");
var useNetworkStatus_1 = require("../hooks/useNetworkStatus");
var syncManager_1 = require("../services/syncManager");
var db_1 = require("../services/db");
var SyncQueueIndicator = function () {
    var _a = (0, react_1.useState)(0), count = _a[0], setCount = _a[1];
    (0, react_1.useEffect)(function () {
        // Initial fetch
        db_1.dbService.getQueueCount().then(setCount);
        // Subscribe to changes
        var unsubscribe = db_1.dbService.subscribe(function (newCount) {
            setCount(newCount);
        });
        return unsubscribe;
    }, []);
    if (count === 0)
        return null;
    return (<div className="relative flex items-center justify-center mr-2">
      <div className="rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 p-2 shadow-sm flex items-center space-x-1.5 transition-all duration-200">
        <lucide_react_1.Cloud className="h-5 w-5 text-blue-500 dark:text-blue-400 animate-pulse"/>
        <span className="text-sm font-bold text-blue-600 dark:text-blue-300">{count}</span>
      </div>
    </div>);
};
var Layout = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(false), mobileMenuOpen = _b[0], setMobileMenuOpen = _b[1];
    var _c = (0, react_1.useState)(false), settingsOpen = _c[0], setSettingsOpen = _c[1];
    var _d = (0, react_1.useState)(false), profileOpen = _d[0], setProfileOpen = _d[1];
    var settingsRef = (0, react_1.useRef)(null);
    var profileRef = (0, react_1.useRef)(null);
    var navigate = (0, react_router_dom_1.useNavigate)();
    var location = (0, react_router_dom_1.useLocation)();
    var _e = (0, ThemeContext_1.useTheme)(), theme = _e.theme, toggleTheme = _e.toggleTheme;
    var t = (0, react_i18next_1.useTranslation)().t;
    var isOnline = (0, useNetworkStatus_1.useNetworkStatus)();
    var _f = (0, AuthContext_1.useAuth)(), user = _f.user, logout = _f.logout, logoutAll = _f.logoutAll;
    (0, react_1.useEffect)(function () {
        syncManager_1.syncManager.init(); // Initialize the sync manager listener
        var handleClickOutside = function (e) {
            if (settingsRef.current &&
                !settingsRef.current.contains(e.target)) {
                setSettingsOpen(false);
            }
            if (profileRef.current &&
                !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return function () {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    var allNavItems = [
        { to: '/', icon: lucide_react_1.LayoutDashboard, label: t('nav.dashboard'), gradient: 'from-blue-500 to-indigo-600 shadow-blue-500/20', roles: ['Admin', 'Manager', 'Technician'] },
        { to: '/admin', icon: lucide_react_1.Shield, label: t('nav.admin'), gradient: 'from-rose-500 to-red-600 shadow-rose-500/20', roles: ['Admin', 'Manager'] },
        { to: '/admin/rca-builder', icon: lucide_react_1.Shield, label: 'RCA Builder', gradient: 'from-blue-500 to-cyan-600 shadow-blue-500/20', roles: ['Admin', 'Manager'] },
        { to: '/requests', icon: lucide_react_1.Wrench, label: t('nav.kanban'), gradient: 'from-purple-500 to-pink-600 shadow-purple-500/20', roles: ['Admin', 'Manager', 'Technician'] },
        { to: '/requests-all', icon: lucide_react_1.List, label: t('nav.allRequests'), gradient: 'from-pink-500 to-rose-600 shadow-pink-500/20', roles: ['Admin', 'Manager', 'Technician'] },
        { to: '/shift-handovers', icon: lucide_react_1.Activity, label: 'Shift Logbook', gradient: 'from-amber-400 to-orange-500 shadow-amber-500/20', roles: ['Admin', 'Manager', 'Technician'] },
        { to: '/calendar', icon: lucide_react_1.Calendar, label: t('nav.calendar'), gradient: 'from-cyan-500 to-blue-600 shadow-cyan-500/20', roles: ['Admin', 'Manager', 'Technician'] },
        { to: '/downtime', icon: lucide_react_1.Activity, label: 'Downtime Schedule', gradient: 'from-blue-400 to-indigo-500 shadow-blue-500/20', roles: ['Admin', 'Manager', 'Technician'] },
        { to: '/equipment', icon: lucide_react_1.Box, label: t('nav.equipment'), gradient: 'from-green-500 to-emerald-600 shadow-green-500/20', roles: ['Admin', 'Manager', 'Technician'] },
        { to: '/floor-plan', icon: lucide_react_1.Map, label: 'Floor Plan', gradient: 'from-sky-500 to-indigo-500 shadow-sky-500/20', roles: ['Admin', 'Manager', 'Technician'] },
        { to: '/inventory', icon: lucide_react_1.Package, label: t('nav.inventory') || 'Inventory', gradient: 'from-teal-500 to-emerald-600 shadow-teal-500/20', roles: ['Admin', 'Manager', 'Technician'] },
        { to: '/vehicles', icon: lucide_react_1.Car, label: t('nav.vehicles'), gradient: 'from-orange-500 to-amber-600 shadow-orange-500/20', roles: ['Admin', 'Manager', 'Technician'] },
        { to: '/teams', icon: lucide_react_1.Users, label: t('nav.teams'), gradient: 'from-yellow-500 to-orange-600 shadow-yellow-500/20', roles: ['Admin', 'Manager', 'Technician'] },
        { to: '/activity', icon: lucide_react_1.Activity, label: t('nav.activity'), gradient: 'from-indigo-500 to-purple-600 shadow-indigo-500/20', roles: ['Admin', 'Manager', 'Technician'] },
        { to: '/analytics', icon: lucide_react_1.BarChart3, label: t('nav.analytics'), gradient: 'from-emerald-500 to-teal-600 shadow-emerald-500/20', roles: ['Admin', 'Manager'] },
        { to: '/financials', icon: lucide_react_1.Activity, label: 'Financials', gradient: 'from-green-500 to-emerald-600 shadow-green-500/20', roles: ['Admin', 'Manager'] },
        { to: '/predictive', icon: lucide_react_1.Activity, label: t('nav.predictive') || 'Predictive Portal', gradient: 'from-rose-500 to-pink-600 shadow-rose-500/20', roles: ['Admin', 'Manager'] },
        { to: '/procurement', icon: lucide_react_1.Package, label: 'Procurement Hub', gradient: 'from-amber-500 to-yellow-600 shadow-amber-500/20', roles: ['Admin', 'Manager'] },
        { to: '/tool-crib', icon: lucide_react_1.Wrench, label: 'Tool Crib', gradient: 'from-blue-500 to-cyan-600 shadow-blue-500/20', roles: ['Admin', 'Manager', 'Technician'] },
    ];
    var navItems = allNavItems.filter(function (item) { return user && item.roles.includes(user.role); });
    var activeItem = navItems.find(function (item) { return item.to === location.pathname; }) || navItems[0];
    var pageTitle = activeItem ? activeItem.label : t("nav.dashboard");
    var userInitials = (user === null || user === void 0 ? void 0 : user.name)
        ? user.name
            .split(" ")
            .map(function (n) { return n[0]; })
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "GU";
    var handleLogout = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, logout()];
                case 1:
                    _a.sent();
                    navigate('/');
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* 💻 DESKTOP LEFT SIDEBAR NAVIGATION */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-colors duration-300 sticky top-0 h-screen z-40">
        
        {/* Sidebar Header (Logo) */}
        <div className="h-[4.5rem] px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-55"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl shadow-lg ring-1 ring-white/20">
                <lucide_react_1.Wrench className="h-5 w-5 text-white"/>
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
          {navItems.map(function (item) { return (<react_router_dom_1.NavLink key={item.to} to={item.to} className={function (_a) {
                var isActive = _a.isActive;
                return "group relative flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ".concat(isActive
                    ? "text-white shadow-lg shadow-indigo-600/10"
                    : "text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750");
            }}>
              {function (_a) {
                var isActive = _a.isActive;
                return (<>
                  {isActive && (<div className={"absolute inset-0 bg-gradient-to-r ".concat(item.gradient, " rounded-xl shadow-md ring-1 ring-white/10")}></div>)}

                  <item.icon className={"relative h-5 w-5 mr-3 transition-transform duration-300 ".concat(isActive ? "scale-100" : "group-hover:scale-110 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400")}/>

                  <span className="relative z-10">{item.label}</span>

                  {isActive && (<div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full z-10 animate-pulse"></div>)}
                </>);
            }}
            </react_router_dom_1.NavLink>); })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md ring-1 ring-white/20">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {user === null || user === void 0 ? void 0 : user.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider truncate">
                {user === null || user === void 0 ? void 0 : user.role}
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
            <button onClick={function () { return setMobileMenuOpen(!mobileMenuOpen); }} className="lg:hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition duration-200">
              <lucide_react_1.Menu className="h-5 w-5"/>
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
            
            <SyncQueueIndicator />

            {/* Notifications panel */}
            <NotificationCenter_1.default />

            {/* Language Selector Selector */}
            <LanguageSelector_1.default />

            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200" title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"} aria-label={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}>
              {theme === "light" ? (<lucide_react_1.Moon className="h-5 w-5 text-slate-600 dark:text-slate-300"/>) : (<lucide_react_1.Sun className="h-5 w-5 text-slate-600 dark:text-slate-300"/>)}
            </button>

            {/* User Settings Gear */}
            <div className="relative" ref={settingsRef}>
              <button onClick={function () { return setSettingsOpen(!settingsOpen); }} className={"rounded-xl border p-2 shadow-sm transition-all duration-200 ".concat(settingsOpen
            ? "border-indigo-300 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/10"
            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-slate-300")} aria-label="Settings menu">
                <lucide_react_1.Settings className={"h-5 w-5 transition-transform duration-200 ".concat(settingsOpen ? "rotate-90" : "")}/>
              </button>

              {settingsOpen && (<div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-50 py-1.5">
                  <button onClick={function () {
                navigate("/settings");
                setSettingsOpen(false);
            }} className="flex w-full items-center px-4 py-2 text-sm font-semibold text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <lucide_react_1.Settings className="h-4 w-4 mr-2"/>
                    {t("layout.settings") || "Settings"}
                  </button>

                  <button onClick={function () {
                navigate("/admin");
                setSettingsOpen(false);
            }} className="flex w-full items-center px-4 py-2 text-sm font-semibold text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <lucide_react_1.Shield className="h-4 w-4 mr-2"/>
                    {t("nav.admin") || "Admin"}
                  </button>
                </div>)}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button onClick={function () { return setProfileOpen(!profileOpen); }} className={"flex items-center space-x-2 rounded-xl border p-1.5 pr-3 shadow-sm transition-all duration-200 ".concat(profileOpen
            ? "border-indigo-300 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-indigo-600/10"
            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 hover:shadow-md")} aria-label="User profile menu">
                <div className={"w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ".concat(profileOpen ? "ring-white/40" : "ring-transparent")}>
                  {userInitials}
                </div>
                <div className="hidden lg:block text-left">
                  <p className={"text-xs font-semibold leading-tight transition-colors ".concat(profileOpen ? "text-white" : "text-slate-800 dark:text-slate-200")}>
                    {user === null || user === void 0 ? void 0 : user.name}
                  </p>
                  <p className={"text-[10px] leading-tight transition-colors ".concat(profileOpen ? "text-white/80" : "text-slate-500 dark:text-slate-400")}>
                    {user === null || user === void 0 ? void 0 : user.role}
                  </p>
                </div>
              </button>

              {profileOpen && (<div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl z-50 overflow-hidden">
                  {/* Profile Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold shadow-lg ring-2 ring-white/40">
                        {userInitials}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white leading-tight">
                          {user === null || user === void 0 ? void 0 : user.name}
                        </p>
                        <p className="text-xs text-white/80 font-semibold mt-0.5">
                          {user === null || user === void 0 ? void 0 : user.email}
                        </p>
                        <div className="mt-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider">
                            {user === null || user === void 0 ? void 0 : user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Actions */}
                  <div className="p-2">
                    <button onClick={function () {
                navigate("/settings");
                setProfileOpen(false);
            }} className="flex w-full items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <lucide_react_1.Settings className="h-4 w-4 mr-3 text-slate-500"/>
                      {t("layout.settings") || "Settings"}
                    </button>

                    <button onClick={function () {
                navigate("/admin");
                setProfileOpen(false);
            }} className="flex w-full items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <lucide_react_1.Shield className="h-4 w-4 mr-3 text-slate-500"/>
                      {t("nav.admin") || "Admin"}
                    </button>

                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>

                    <button onClick={handleLogout} className="flex w-full items-center px-4 py-2.5 rounded-xl text-sm font-bold text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                      <lucide_react_1.LogOut className="h-4 w-4 mr-3"/>
                      {t("nav.logout") || "Log Out"}
                    </button>
                  </div>
                </div>)}
            </div>

          </div>
        </header>

        {/* Offline Banner */}
        {!isOnline && (<div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-6 py-2 flex items-center justify-center text-sm font-medium text-amber-800 dark:text-amber-200">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mr-2"></span>
            You are currently offline. Changes will be saved locally and synced when you reconnect.
          </div>)}

        {/* Main Content Area */}
        <main className="flex-1 px-6 py-6 page-container">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center space-x-2">
                <lucide_react_1.Wrench className="h-4 w-4 text-indigo-600 dark:text-indigo-400"/>
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
      {mobileMenuOpen && (<div className="lg:hidden fixed inset-0 z-50 flex">
          
          {/* Clicking outside dim block */}
          <div onClick={function () { return setMobileMenuOpen(false); }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"></div>

          {/* Drawer menu */}
          <div className="relative flex flex-col w-72 max-w-xs bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-full shadow-2xl transition duration-300 animate-slide-in">
            
            {/* Drawer Close Button */}
            <div className="absolute right-4 top-4">
              <button onClick={function () { return setMobileMenuOpen(false); }} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition">
                <lucide_react_1.X className="h-5 w-5"/>
              </button>
            </div>

            {/* Logo area */}
            <div className="h-[4.5rem] px-6 border-b border-slate-200 dark:border-slate-700 flex items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl shadow shadow-blue-500/10">
                  <lucide_react_1.Wrench className="h-5 w-5 text-white"/>
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
              {navItems.map(function (item) { return (<react_router_dom_1.NavLink key={item.to} to={item.to} onClick={function () { return setMobileMenuOpen(false); }} className={function (_a) {
                    var isActive = _a.isActive;
                    return "group relative flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ".concat(isActive
                        ? "text-white shadow-lg shadow-indigo-600/10"
                        : "text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750");
                }}>
                  {function (_a) {
                    var isActive = _a.isActive;
                    return (<>
                      {isActive && (<div className={"absolute inset-0 bg-gradient-to-r ".concat(item.gradient, " rounded-xl shadow-md ring-1 ring-white/10")}></div>)}

                      <item.icon className={"relative h-5 w-5 mr-3 transition-transform duration-300 ".concat(isActive ? "scale-100" : "group-hover:scale-110 text-slate-400 group-hover:text-indigo-600")}/>

                      <span className="relative z-10">{item.label}</span>
                    </>);
                }}
                </react_router_dom_1.NavLink>); })}
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
                      {user === null || user === void 0 ? void 0 : user.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">
                      {user === null || user === void 0 ? void 0 : user.role}
                    </p>
                  </div>
                </div>
                
                <button onClick={handleLogout} className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 text-red-600 p-2 hover:bg-red-100 transition" title={t("nav.logout") || "Log Out"}>
                  <lucide_react_1.LogOut className="h-5 w-5"/>
                </button>
              </div>
            </div>

          </div>
        </div>)}

    </div>);
};
exports.default = Layout;
