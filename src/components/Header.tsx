import React, { useState, useEffect } from 'react';
import { ChevronDown, Bell, Navigation, Menu, X, LogOut, Truck, ShieldCheck, Sparkles, Globe, RefreshCw, UserCheck, User } from 'lucide-react';
import { 
  ccmcLogo, 
  ccmcFallbackLogo,
  smartCityLogo,
  smartCityFallbackLogo
} from '../constants/branding';
import { MunicipalAlert } from '../types';

interface HeaderProps {
  liveConnection: boolean;
  onToggleLiveConnection: () => void;
  alerts?: MunicipalAlert[];
  onOpenAlerts?: () => void;
  onNavigateToLiveTracking?: (zone?: string) => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  onLogout?: () => void;
  onSwitchRole?: () => void;
  userRole?: 'admin' | 'worker';
  userName?: string;
  userDesignation?: string;
  lang?: 'en' | 'ta';
  onSetLang?: (l: 'en' | 'ta') => void;
  onOpenLangModal?: () => void;
  onOpenAiModal?: () => void;
  onRefreshData?: () => void;
  hideRightControls?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  liveConnection,
  onToggleLiveConnection,
  alerts = [],
  onOpenAlerts,
  onNavigateToLiveTracking,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
  onLogout,
  onSwitchRole,
  userRole = 'admin',
  userName = userRole === 'admin' ? 'Administrative Directorate' : 'Karthik Muthusamy',
  userDesignation = userRole === 'admin' ? 'Admin Officer, CCMC' : 'Sanitary Inspector (SI) • Ward 12',
  lang = 'en',
  onSetLang,
  onOpenLangModal,
  onOpenAiModal,
  onRefreshData,
  hideRightControls = false,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isAlertsDropdownOpen, setIsAlertsDropdownOpen] = useState<boolean>(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);

  const unreadAlerts = alerts.filter((a) => !a.isRead && !a.isResolved);
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && !a.isResolved).length;

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const day = now.getDate();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const month = monthNames[now.getMonth()];
      const year = now.getFullYear();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = dayNames[now.getDay()];

      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;

      setCurrentTime(`${day} ${month} ${year} • ${dayOfWeek} ${hours}:${minutes} ${ampm}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full select-none text-white shadow-md sticky top-0 z-50">
      {/* Top Main Green Bar - Exact Login Green #1E7A38 */}
      <div className="bg-[#1E7A38] px-2 sm:px-4 lg:px-8 py-1.5 sm:py-2 lg:py-4 flex items-center justify-between gap-1.5 sm:gap-4 border-b border-[#166534] min-h-[52px] sm:min-h-[64px] lg:min-h-[88px]">
        {/* Left Side: Mobile Menu Toggle + CM Portrait & CCMC Emblem Duo + Municipal Titles */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
          
          {/* Mobile Menu Hamburger Button (if applicable) */}
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl bg-[#166534] hover:bg-[#113B22] text-emerald-100 border border-emerald-400/30 transition-all flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              aria-label="Toggle Navigation Drawer"
            >
              {/* larger hit area for touch devices */}
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          {/* Unified Government Brand Insignia: CCMC Emblem + Smart City Logo */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* 1. Coimbatore City Emblem / CCMC Logo */}
            <div 
              className="w-7 h-7 sm:w-9 sm:h-9 lg:w-14 lg:h-14 rounded-lg overflow-hidden border-2 border-amber-400 bg-white p-0.5 shadow-sm relative flex-shrink-0 flex items-center justify-center" 
              title="Coimbatore City Municipal Corporation Emblem"
            >
              <img
                src={ccmcLogo}
                alt="Coimbatore City Municipal Corporation Logo"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (e.currentTarget.src !== ccmcFallbackLogo) {
                    e.currentTarget.src = ccmcFallbackLogo;
                  }
                }}
                className="w-full h-full object-contain"
              />
            </div>

            {/* 2. Smart City Mission Logo */}
            <div 
              className="w-7 h-7 sm:w-9 sm:h-9 lg:w-14 lg:h-14 rounded-lg overflow-hidden border-2 border-amber-400 bg-white p-0.5 shadow-sm relative flex-shrink-0 flex items-center justify-center" 
              title="Smart City Mission"
            >
              <img
                src={smartCityLogo}
                alt="Smart City Mission Logo"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (e.currentTarget.src !== smartCityFallbackLogo) {
                    e.currentTarget.src = smartCityFallbackLogo;
                  }
                }}
                className="w-full h-full object-contain p-0.5"
              />
            </div>
          </div>

            {/* Municipal Title - Responsive Layout: Desktop single line, Mobile stacked */}
            <div className="min-w-0 flex flex-col justify-center">
              {/* Mobile View: Stacked line-by-line (< sm) */}
              <div className="sm:hidden flex flex-col justify-center leading-none">
                <div className="text-[12px] font-black tracking-tight text-white truncate leading-tight drop-shadow-xs">
                  Coimbatore City Municipal Corporation
                </div>
                <div className="text-[9.5px] font-black tracking-tight text-amber-300 uppercase truncate leading-tight mt-0.5 drop-shadow-xs">
                  Integrated Command and Control Center
                </div>
                {userRole !== 'admin' && (
                  <div className="text-[9px] font-bold text-cyan-300 tracking-wide uppercase truncate leading-tight mt-0.5">
                    {lang === 'ta' ? 'களப் பணியாளர்' : 'SANITARY FIELD WORKER'}
                  </div>
                )}
              </div>

              {/* Desktop View: Single horizontal line (>= sm) */}
              <div className="hidden sm:flex sm:flex-col sm:justify-center leading-tight">
                <div className="flex items-center gap-2">
                  <span className="text-sm lg:text-lg font-black tracking-tight text-white whitespace-nowrap drop-shadow-xs">
                    Coimbatore City Municipal Corporation
                  </span>
                  {userRole !== 'admin' && (
                    <span className="text-xs lg:text-base font-black tracking-wider text-amber-300 uppercase whitespace-nowrap drop-shadow-xs">
                      • {lang === 'ta' ? 'களப் பணியாளர்' : 'SANITARY FIELD WORKER'}
                    </span>
                  )}
                </div>
                <div className="text-[10px] lg:text-sm font-black tracking-wider text-amber-300 uppercase whitespace-nowrap drop-shadow-xs mt-0.5">
                  Integrated Command and Control Center (ICCC)
                </div>
              </div>
            </div>
        </div>

        {/* Right Side: User Profile + Language + Logout */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">

          {/* User Profile Console / "S" Logo Pill with Dropdown (Worker view only if applicable) */}
          {userRole !== 'admin' && (
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-1 sm:gap-2 bg-[#166534] hover:bg-[#113B22] border border-emerald-400/40 rounded-full px-1.5 sm:px-2.5 py-0.5 sm:py-1 shadow-sm transition cursor-pointer"
                title={`${userName} Account & Menu`}
              >
                {/* Official SWMS Logo Badge */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-white shadow-xs flex items-center justify-center border border-emerald-200 flex-shrink-0 overflow-hidden p-0.5" title="Swachh Bharat SWMS Portal">
                    <img
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9Yi9x2fIRfFWOX4bKywfFVpp7-ZnDqGUpXdxKwQ0g15y5DQlyWabP8PI&s=10"
                      alt="SWMS"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-xs"
                    />
                  </div>
                  <div className="text-left pr-1 hidden md:block max-w-[120px] sm:max-w-none">
                    <div className="text-xs font-bold text-white leading-tight truncate">
                      {userName}
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-semibold text-emerald-200 tracking-wider flex items-center gap-1">
                      <span>{lang === 'ta' ? 'களப் பணியாளர்' : 'FIELD WORKER'}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    </div>
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-emerald-200 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Menu Dropdown */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-gray-800">
                  <div className="px-4 py-3 border-b border-gray-100 bg-slate-50 rounded-t-2xl">
                    <p className="text-xs font-black text-gray-900">{userName}</p>
                    <p className="text-[10px] text-[#1E7A38] font-bold uppercase tracking-wider mt-0.5">{userDesignation}</p>
                  </div>

                  <div className="p-1.5 space-y-1">
                    {/* Language Selector */}
                    {onSetLang && (
                      <div className="px-3 py-2 text-xs border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 font-bold flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-[#1E7A38]" />
                            <span>Language:</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onSetLang('en')}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                lang === 'en' ? 'bg-[#1E7A38] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              EN
                            </button>
                            <button
                              onClick={() => onSetLang('ta')}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                lang === 'ta' ? 'bg-[#1E7A38] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              தமிழ்
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Ward Audit */}
                    {onOpenAiModal && (
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          onOpenAiModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-700 hover:text-[#1E7A38] hover:bg-emerald-50 rounded-xl transition text-left cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-[#1E7A38]" />
                        <span>{lang === 'ta' ? 'AI தணிக்கை மற்றும் உதவி' : 'Gemini AI Ward Audit'}</span>
                      </button>
                    )}

                    {/* Refresh Data */}
                    {onRefreshData && (
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          onRefreshData();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-700 hover:text-[#1E7A38] hover:bg-emerald-50 rounded-xl transition text-left cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4 text-[#1E7A38]" />
                        <span>{lang === 'ta' ? 'சர்வர் தரவை புதுப்பி' : 'Sync Live SWMS Data'}</span>
                      </button>
                    )}

                    {/* Switch Role Option */}
                    {onSwitchRole && (
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          onSwitchRole();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-700 hover:text-[#1E7A38] hover:bg-emerald-50 rounded-xl transition text-left cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span>Switch to Admin / Commissioner</span>
                      </button>
                    )}

                    {/* Logout */}
                    {onLogout && (
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition text-left cursor-pointer border-t border-gray-100"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Log Out of Console</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Language Switcher */}
          {onSetLang && (
            <>
              {/* Mobile Single Toggle Pill (< sm) */}
              <button
                type="button"
                onClick={() => onSetLang(lang === 'en' ? 'ta' : 'en')}
                className="sm:hidden px-2 py-1 rounded-full text-[10px] font-black bg-[#113B22] border border-emerald-400/40 text-amber-300 hover:text-white flex items-center gap-1 shadow-xs flex-shrink-0 cursor-pointer active:scale-95"
                title={lang === 'en' ? 'Switch to Tamil' : 'Switch to English'}
              >
                <Globe className="w-3 h-3 text-emerald-300" />
                <span>{lang === 'en' ? 'தமிழ்' : 'EN'}</span>
              </button>

              {/* Desktop / Tablet Segmented Pill (>= sm) */}
              <div className="hidden sm:flex bg-[#113B22] border border-emerald-500/40 rounded-full p-0.5 items-center shadow-xs flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onSetLang('ta')}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                    lang === 'ta'
                      ? 'bg-[#FF9E00] text-slate-950 shadow-xs'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                  }`}
                  title="தமிழ் மொழியைத் தேர்வு செய்"
                >
                  <Globe className={`w-3 h-3 ${lang === 'ta' ? 'text-slate-950' : 'text-emerald-300'}`} />
                  <span>தமிழ்</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetLang('en')}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                    lang === 'en'
                      ? 'bg-[#FF9E00] text-slate-950 shadow-xs'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                  }`}
                  title="Select English Language"
                >
                  <span>English</span>
                </button>
              </div>
            </>
          )}

          {/* Direct Header Logout Button */}
          {onLogout && (
            <>
              {/* Mobile Compact Icon Button (< sm) */}
              <button
                onClick={onLogout}
                className="sm:hidden p-1.5 rounded-full bg-[#E11D48] hover:bg-[#BE123C] active:bg-[#9F1239] text-white shadow-md border border-rose-400/50 cursor-pointer active:scale-95 flex-shrink-0 flex items-center justify-center"
                title="Logout Portal / வெளியேறு"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>

              {/* Desktop / Tablet Full Button (>= sm) */}
              <button
                onClick={onLogout}
                className="hidden sm:flex items-center gap-1 bg-[#E11D48] hover:bg-[#BE123C] active:bg-[#9F1239] text-white font-bold px-3 py-1.5 rounded-full text-xs transition-all shadow-md border border-rose-400/50 cursor-pointer active:scale-95 flex-shrink-0"
                title="Logout Portal / வெளியேறு"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="font-bold">{lang === 'ta' ? 'வெளியேறு' : 'Logout'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dark Secondary Ticker/Stream Status Bar - Hidden on mobile & tablet view (< lg), visible only on large desktop */}
      <div className="hidden lg:flex bg-[#113B22] px-2.5 py-1.5 sm:px-6 sm:py-1.5 items-center justify-between text-[9px] sm:text-xs text-emerald-100/90 font-medium border-t border-[#166534] overflow-hidden">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="hidden md:inline text-emerald-100 truncate">{currentTime || '13 August 2026 • Thursday 12:34 pm'}</span>
        </div>
      </div>
    </header>
  );
};


