import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  const currentLang = languages.find((lang) => lang.code === i18n.language?.split('-')[0]) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 rounded-xl border p-2 text-sm font-medium shadow-sm backdrop-blur-xl transition-all ${
          isOpen
            ? 'border-purple-300 bg-gradient-to-r from-blue-600 to-purple-600 text-white'
            : 'border-white/50 bg-white/30 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
        }`}
        title="Change Language"
      >
        <Globe className="h-5 w-5" />
        <span className="hidden md:inline">{currentLang.flag}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-2xl border border-white/40 bg-white/90 dark:bg-gray-800/90 shadow-xl backdrop-blur-xl z-50 overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex w-full items-center space-x-3 px-4 py-2.5 text-left text-sm transition-colors ${
                i18n.language?.startsWith(lang.code)
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
