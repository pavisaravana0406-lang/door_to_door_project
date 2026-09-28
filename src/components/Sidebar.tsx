import React from 'react';
import { LayoutDashboard, LogOut, X, MapPin, QrCode } from 'lucide-react';
import { NavigationTab } from '../types';
import { 
  householdCoveredIcon, 
  householdCoveredFallbackIcon, 
  householdNotCoveredIcon, 
  householdNotCoveredFallbackIcon,
  frequentlyNotCollectedIcon,
  reportsIcon,
  aiPredictionIcon,
  ccmcLogo,
  ccmcFallbackLogo,
  smartCityLogo,
  smartCityFallbackLogo
} from '../constants/branding';

const REPORTS_ICON_URL = reportsIcon;
const AI_PREDICTION_ICON_URL = aiPredictionIcon;

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  collectedCount: number;
  notCollectedCount: number;
  unreadAlertsCount?: number;
  criticalAlertsCount?: number;
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
  onLogout?: () => void;
  lang?: 'en' | 'ta';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  collectedCount,
  notCollectedCount,
  unreadAlertsCount = 0,
  criticalAlertsCount = 0,
  isMobileMenuOpen = false,
  onCloseMobileMenu,
  onLogout,
  lang = 'en',
}) => {
  const handleTabClick = (tab: NavigationTab) => {
    onTabChange(tab);
    if (onCloseMobileMenu) {
      onCloseMobileMenu();
    }
  };

  const navItems = [
    {
      id: 'overview' as NavigationTab,
      label: lang === 'ta' ? 'கண்ணோட்டம்' : 'Overview',
      shortLabel: lang === 'ta' ? 'கண்ணோட்டம்' : 'Overview',
      type: 'icon',
      icon: LayoutDashboard,
    },
    {
      id: 'ai-prediction' as NavigationTab,
      label: lang === 'ta' ? 'AI ANALYTICS AND PREDICTION' : 'AI ANALYTICS AND PREDICTION',
      shortLabel: lang === 'ta' ? 'AI ANALYTICS' : 'AI ANALYTICS',
      type: 'image',
      image: AI_PREDICTION_ICON_URL,
      badge: 'AI',
    },
    {
      id: 'collected' as NavigationTab,
      label: lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Collected',
      shortLabel: lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Collected',
      type: 'image',
      image: householdCoveredIcon,
    },
    {
      id: 'not-collected' as NavigationTab,
      label: lang === 'ta' ? 'சேகரிக்கப்படாதவை' : 'Not Collected',
      shortLabel: lang === 'ta' ? 'விடுபட்டவை' : 'Missed',
      type: 'image',
      image: householdNotCoveredIcon,
    },
    {
      id: 'frequently-not-covered-area' as NavigationTab,
      label: lang === 'ta' ? 'அடிக்கடி விடுபட்ட வீடுகள்' : 'Frequently Not Collected Household',
      shortLabel: lang === 'ta' ? 'விடுபட்ட வீடுகள்' : 'Uncollected Houses',
      type: 'image',
      image: frequentlyNotCollectedIcon,
    },
    {
      id: 'reports' as NavigationTab,
      label: lang === 'ta' ? 'அறிக்கைகள்' : 'Reports',
      shortLabel: lang === 'ta' ? 'அறிக்கைகள்' : 'Reports',
      type: 'image',
      image: REPORTS_ICON_URL,
    },
    {
      id: 'qr-management' as NavigationTab,
      label: lang === 'ta' ? 'QR மேலாண்மை' : 'QR Management',
      shortLabel: lang === 'ta' ? 'QR மேலாண்மை' : 'QR Management',
      type: 'icon',
      icon: QrCode,
      badge: 'QR',
    },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP SIDEBAR (Visible on lg and up)                                 */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex w-72 lg:w-80 bg-[#F2F4F3] border-r border-gray-200/90 min-h-[calc(100vh-80px)] flex-col justify-between p-4 flex-shrink-0 select-none sticky top-20 self-start">
        {/* Top Navigation Items */}
        <div className="space-y-2.5">
          {/* 1. Overview Tab */}
          <button
            onClick={() => handleTabClick('overview')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-sm transition-all text-left cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#E9F5ED] text-[#1E7A38] shadow-xs border border-emerald-300/80'
                : 'text-gray-700 hover:bg-gray-100 hover:text-[#1E7A38]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors shadow-xs ${
                  activeTab === 'overview'
                    ? 'bg-[#1E7A38] text-white'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold">{lang === 'ta' ? 'கண்ணோட்டம்' : 'Overview'}</span>
            </div>
          </button>

          {/* 2. AI Prediction Tab (SWMS Copilot) — moved right after Overview */}
          <button
            onClick={() => handleTabClick('ai-prediction')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-sm transition-all text-left cursor-pointer ${
              activeTab === 'ai-prediction'
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 shadow-xs border border-emerald-300'
                : 'text-gray-700 hover:bg-emerald-50/60 hover:text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-emerald-50/50 p-0.5 flex-shrink-0 flex items-center justify-center shadow-xs">
                <img
                  src={AI_PREDICTION_ICON_URL}
                  alt="AI Prediction"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <span className="text-sm font-bold">{lang === 'ta' ? 'AI ANALYTICS AND PREDICTION' : 'AI ANALYTICS AND PREDICTION'}</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
              AI
            </span>
          </button>

          {/* 3. Collected Tab */}
          <button
            onClick={() => handleTabClick('collected')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-sm transition-all text-left cursor-pointer ${
              activeTab === 'collected'
                ? 'bg-[#E9F5ED] text-[#1E7A38] shadow-xs border border-emerald-300/80'
                : 'text-gray-700 hover:bg-gray-100 hover:text-[#1E7A38]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-white p-0.5 flex-shrink-0 flex items-center justify-center shadow-xs">
                <img
                  src={householdCoveredIcon}
                  alt="Collected"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (e.currentTarget.src !== householdCoveredFallbackIcon) {
                      e.currentTarget.src = householdCoveredFallbackIcon;
                    }
                  }}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <span className="text-sm font-bold">{lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Collected'}</span>
            </div>
          </button>

          {/* 4. Not Collected Tab */}
          <button
            onClick={() => handleTabClick('not-collected')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-sm transition-all text-left cursor-pointer ${
              activeTab === 'not-collected'
                ? 'bg-[#E9F5ED] text-[#1E7A38] shadow-xs border border-emerald-300/80'
                : 'text-gray-700 hover:bg-gray-100 hover:text-[#1E7A38]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-rose-600/50 bg-white p-0.5 flex-shrink-0 flex items-center justify-center shadow-xs">
                <img
                  src={householdNotCoveredIcon}
                  alt="Not Collected"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (e.currentTarget.src !== householdNotCoveredFallbackIcon) {
                      e.currentTarget.src = householdNotCoveredFallbackIcon;
                    }
                  }}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <span className="text-sm font-bold">{lang === 'ta' ? 'சேகரிக்கப்படாதவை' : 'Not Collected'}</span>
            </div>
          </button>

          {/* 5. Frequently Not Collected Household Tab */}
          <button
            onClick={() => handleTabClick('frequently-not-covered-area')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-sm transition-all text-left cursor-pointer ${
              activeTab === 'frequently-not-covered-area'
                ? 'bg-rose-50 text-rose-800 shadow-xs border border-rose-300'
                : 'text-gray-700 hover:bg-rose-50/50 hover:text-rose-800'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-rose-500/50 bg-rose-50 p-0.5 flex-shrink-0 flex items-center justify-center shadow-xs">
                <img
                  src={frequentlyNotCollectedIcon}
                  alt="Frequently Not Collected Household"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (e.currentTarget.src !== householdNotCoveredFallbackIcon) {
                      e.currentTarget.src = householdNotCoveredFallbackIcon;
                    }
                  }}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <span className="text-sm font-bold">{lang === 'ta' ? 'அடிக்கடி விடுபட்ட வீடுகள்' : 'Frequently Not Collected Household'}</span>
            </div>
          </button>

          {/* 6. Municipal Reports Tab */}
          <button
            onClick={() => handleTabClick('reports')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-sm transition-all text-left cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-[#E9F5ED] text-[#1E7A38] shadow-xs border border-emerald-300/80'
                : 'text-gray-700 hover:bg-gray-100 hover:text-[#1E7A38]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-white p-0.5 flex-shrink-0 flex items-center justify-center shadow-xs">
                <img
                  src={REPORTS_ICON_URL}
                  alt="Reports"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <span className="text-sm font-bold">{lang === 'ta' ? 'அறிக்கைகள்' : 'Reports'}</span>
            </div>
          </button>

          {/* 7. QR Management Tab (QR Checkpoint Admin) */}
          <button
            onClick={() => handleTabClick('qr-management')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-sm transition-all text-left cursor-pointer ${
              activeTab === 'qr-management'
                ? 'bg-[#E9F5ED] text-[#1E7A38] shadow-xs border border-emerald-300/80'
                : 'text-gray-700 hover:bg-gray-100 hover:text-[#1E7A38]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors shadow-xs ${
                  activeTab === 'qr-management'
                    ? 'bg-[#1E7A38] text-white'
                    : 'bg-white text-[#1E7A38] border border-emerald-300'
                }`}
              >
                <QrCode className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold">{lang === 'ta' ? 'QR மேலாண்மை' : 'QR Management'}</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
              QR
            </span>
          </button>
        </div>

        {/* Bottom Logout Item */}
        <div className="pt-4 border-t border-gray-200/80">
          <button
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                alert('Commissioner Console Session Logged Out safely.');
              }
            }}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-bold text-sm text-[#1E7A38] hover:bg-gray-200/60 transition-all text-left cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1E7A38] flex items-center justify-center flex-shrink-0 border border-emerald-200/80 shadow-xs">
              <LogOut className="w-6 h-6 text-[#1E7A38]" />
            </div>
            <span className="text-sm font-bold">{lang === 'ta' ? 'வெளியேறு' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MOBILE SLIDE-OUT DRAWER (Opened via Header hamburger)                  */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-in fade-in duration-200">
          {/* Dark Backdrop */}
          <div
            onClick={onCloseMobileMenu}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-full sm:w-4/5 max-w-xs bg-[#F2F4F3] min-h-screen shadow-2xl flex flex-col justify-between p-4 z-10 animate-in slide-in-from-left duration-250 border-r border-gray-200 overflow-y-auto">
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full border-2 border-[#F59E0B] bg-white p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={ccmcLogo}
                      alt="Coimbatore City Municipal Corporation Logo"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (e.currentTarget.src !== ccmcFallbackLogo) e.currentTarget.src = ccmcFallbackLogo;
                      }}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="font-bold text-gray-900 text-sm">Navigation Menu</span>
                </div>
                <button
                  onClick={onCloseMobileMenu}
                  className="p-1.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors cursor-pointer"
                  aria-label="Close Drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation List */}
              <div className="space-y-2">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl font-bold text-sm transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-[#E9F5ED] text-[#1E7A38] shadow-xs border border-emerald-300/80'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-[#1E7A38]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white border border-gray-200 p-0.5 flex-shrink-0 flex items-center justify-center shadow-2xs">
                          {item.type === 'icon' && item.icon && (
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-[#1E7A38]' : 'text-gray-700'}`} />
                          )}
                          {item.type === 'image' && item.image && (
                            <img
                              src={item.image}
                              alt={item.label}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          )}
                          {(item as any).isLive && (
                            <span className="flex h-2.5 w-2.5 absolute top-0.5 right-0.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white"></span>
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold">{item.label}</span>
                      </div>

                      {(item as any).count !== undefined && (item as any).count > 0 && (
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-full ${
                            (item as any).isCritical
                              ? 'bg-rose-100 text-rose-800 animate-pulse border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {(item as any).count}
                        </span>
                      )}
                      {item.badge && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/70 text-xs">
                <div className="font-bold text-[#1E7A38] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Coimbatore City Corporation</span>
                </div>
                <div className="text-[11px] text-gray-600 mt-0.5">
                  5 Zones • 100 Wards
                </div>
              </div>

              <button
                onClick={() => {
                  if (onCloseMobileMenu) onCloseMobileMenu();
                  if (onLogout) {
                    onLogout();
                  } else {
                    alert('Commissioner Console Session Logged Out safely.');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl font-bold text-xs text-[#1E7A38] bg-emerald-100/80 hover:bg-emerald-200 transition-all text-center border border-emerald-200 shadow-2xs cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-[#1E7A38]" />
                <span>Logout Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


