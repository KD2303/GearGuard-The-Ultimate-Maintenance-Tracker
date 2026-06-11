"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_i18next_1 = require("react-i18next");
var lucide_react_1 = require("lucide-react");
var LanguageSelector = function () {
    var i18n = (0, react_i18next_1.useTranslation)().i18n;
    var _a = (0, react_1.useState)(false), isOpen = _a[0], setIsOpen = _a[1];
    var dropdownRef = (0, react_1.useRef)(null);
    var languages = [
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'es', label: 'Español', flag: '🇪🇸' },
        { code: 'fr', label: 'Français', flag: '🇫🇷' },
    ];
    var currentLang = languages.find(function (lang) { var _a; return lang.code === ((_a = i18n.language) === null || _a === void 0 ? void 0 : _a.split('-')[0]); }) || languages[0];
    (0, react_1.useEffect)(function () {
        var handleClickOutside = function (event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return function () { return document.removeEventListener('mousedown', handleClickOutside); };
    }, []);
    var handleLanguageChange = function (langCode) {
        i18n.changeLanguage(langCode);
        setIsOpen(false);
    };
    return (<div className="relative" ref={dropdownRef}>
      <button onClick={function () { return setIsOpen(!isOpen); }} className={"flex items-center space-x-2 rounded-xl border p-2 text-sm font-medium shadow-sm backdrop-blur-xl transition-all ".concat(isOpen
            ? 'border-purple-300 bg-gradient-to-r from-blue-600 to-purple-600 text-white'
            : 'border-white/50 bg-white/30 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400')} title="Change Language">
        <lucide_react_1.Globe className="h-5 w-5"/>
        <span className="hidden md:inline">{currentLang.flag}</span>
      </button>

      {isOpen && (<div className="absolute right-0 mt-2 w-36 rounded-2xl border border-white/40 bg-white/90 dark:bg-gray-800/90 shadow-xl backdrop-blur-xl z-50 overflow-hidden">
          {languages.map(function (lang) {
                var _a;
                return (<button key={lang.code} onClick={function () { return handleLanguageChange(lang.code); }} className={"flex w-full items-center space-x-3 px-4 py-2.5 text-left text-sm transition-colors ".concat(((_a = i18n.language) === null || _a === void 0 ? void 0 : _a.startsWith(lang.code))
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50')}>
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>);
            })}
        </div>)}
    </div>);
};
exports.default = LanguageSelector;
