import React from 'react';
import { NavigationTab } from '../types';
import { GIcon } from './icons/GIcon';
import {
  ccmcLogo,
  ccmcFallbackLogo,
} from '../constants/branding';

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
      gicon: 'dashboard',
    },
    {
      id: 'ai-prediction' as NavigationTab,
      label: lang === 'ta' ? 'AI Analytics and Prediction' : 'AI Analytics and Prediction',
      shortLabel: lang === 'ta' ? 'AI ANALYTICS' : 'AI ANALYTICS',
      gicon: 'psychology',
      badge: 'AI',
    },
    {
      id: 'collected' as NavigationTab,
      label: lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Collected',
      shortLabel: lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Collected',
      gicon: 'local_shipping',
    },
    {
      id: 'not-collected' as NavigationTab,
      label: lang === 'ta' ? 'சேகரிக்கப்படாதவை' : 'Not Collected',
      shortLabel: lang === 'ta' ? 'விடுபட்டவை' : 'Missed',
      gicon: 'cancel',
    },
    {
      id: 'partially-not-collected' as NavigationTab,
      label: lang === 'ta' ? 'பகுதி சேகரிக்கப்படவில்லை' : 'Partially Not Collected',
      shortLabel: lang === 'ta' ? 'பகுதி விடுபட்டவை' : 'Partial',
      gicon: 'warning',
    },
    {
      id: 'frequently-not-covered-area' as NavigationTab,
      label: lang === 'ta' ? 'அடிக்கடி விடுபட்ட வீடுகள்' : 'Frequently Missed Houses',
      shortLabel: lang === 'ta' ? 'விடுபட்ட வீடுகள்' : 'Uncollected Houses',
      gicon: 'repeat',
    },
    {
      id: 'reports' as NavigationTab,
      label: lang === 'ta' ? 'அறிக்கைகள்' : 'Reports',
      shortLabel: lang === 'ta' ? 'அறிக்கைகள்' : 'Reports',
      gicon: 'description',
    },
    {
      id: 'qr-management' as NavigationTab,
      label: lang === 'ta' ? 'QR மேலாண்மை' : 'QR Management',
      shortLabel: lang === 'ta' ? 'QR மேலாண்மை' : 'QR Management',
      gicon: 'qr_code_2',
      badge: 'QR',
    },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP SIDEBAR (Visible on lg and up)                                 */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex w-60 xl:w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-64px)] flex-col justify-between px-3 py-4 flex-shrink-0 select-none sticky top-16 self-start">
        {/* Top Navigation Items */}
        <div className="space-y-1.5">
          {/* 1. Overview Tab */}
          <button
            onClick={() => handleTabClick('overview')}
            data-active={activeTab === 'overview'}
            className={`dash-sidebar-item group w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm text-left cursor-pointer border ${
              activeTab === 'overview'
                ? 'bg-emerald-50 text-emerald-900 shadow-sm border-emerald-200'
                : 'text-slate-600 border-transparent hover:bg-slate-50 hover:text-emerald-900 hover:border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-[#1E7A38] text-white'
                    : 'dash-sidebar-icon bg-slate-100 text-slate-600'
                }`}
              >
                <GIcon name="dashboard" size={22} filled={activeTab === 'overview'} />
              </div>
              <span className="text-sm font-bold text-slate-800">{lang === 'ta' ? 'கண்ணோட்டம்' : 'Overview'}</span>
            </div>
          </button>

          {/* 2. AI Prediction Tab (SWMS Copilot) — moved right after Overview */}
          <button
            onClick={() => handleTabClick('ai-prediction')}
            data-active={activeTab === 'ai-prediction'}
            className={`dash-sidebar-item w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm text-left cursor-pointer border ${
              activeTab === 'ai-prediction'
                ? 'bg-white text-emerald-900 shadow-sm border-emerald-300'
                : 'text-slate-700 border-transparent hover:bg-white hover:text-emerald-900 hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex-shrink-0 flex items-center justify-center">
                <GIcon name="psychology" size={22} />
              </div>
              <span className="text-sm font-bold leading-snug">{lang === 'ta' ? 'AI Analytics and Prediction' : 'AI Analytics and Prediction'}</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
              AI
            </span>
          </button>

          {/* 3. Collected Tab */}
          <button
            onClick={() => handleTabClick('collected')}
            className={`dash-sidebar-item group w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm text-left cursor-pointer border ${
              activeTab === 'collected'
                ? 'bg-white text-emerald-900 shadow-sm border-emerald-300'
                : 'text-slate-700 border-transparent hover:bg-white hover:text-emerald-900 hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex-shrink-0 flex items-center justify-center">
                <GIcon name="local_shipping" size={22} />
              </div>
              <span className="text-sm font-bold">{lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Collected'}</span>
            </div>
          </button>

          {/* 4. Not Collected Tab */}
          <button
            onClick={() => handleTabClick('not-collected')}
            className={`dash-sidebar-item group w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm text-left cursor-pointer border ${
              activeTab === 'not-collected'
                ? 'bg-white text-emerald-900 shadow-sm border-emerald-300'
                : 'text-slate-700 border-transparent hover:bg-white hover:text-emerald-900 hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex-shrink-0 flex items-center justify-center">
                <GIcon name="cancel" size={22} />
              </div>
              <span className="text-sm font-bold">{lang === 'ta' ? 'சேகரிக்கப்படாதவை' : 'Not Collected'}</span>
            </div>
          </button>

          {/* 5. Partially Not Collected Tab */}
          <button
            onClick={() => handleTabClick('partially-not-collected')}
            data-active={activeTab === 'partially-not-collected'}
            title={lang === 'ta' ? 'பகுதி சேகரிக்கப்படவில்லை' : 'Partially Not Collected'}
            className={`dash-sidebar-item group w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm text-left cursor-pointer border ${
              activeTab === 'partially-not-collected'
                ? 'bg-white text-amber-900 shadow-sm border-amber-400'
                : 'text-slate-700 border-transparent hover:bg-[#fef6e7] hover:text-amber-900 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="dash-sidebar-icon w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex-shrink-0 flex items-center justify-center">
                <GIcon name="warning" size={22} />
              </div>
              <span className="text-[13px] font-bold text-slate-800 leading-snug break-words flex-1">{lang === 'ta' ? 'பகுதி சேகரிக்கப்படவில்லை' : 'Partially Not Collected'}</span>
            </div>
          </button>

          {/* 6. Frequently Missed Houses Tab */}
          <button
            onClick={() => handleTabClick('frequently-not-covered-area')}
            data-active={activeTab === 'frequently-not-covered-area'}
            title={lang === 'ta' ? 'அடிக்கடி விடுபட்ட வீடுகள்' : 'Frequently Not Collected Household'}
            className={`dash-sidebar-item group w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm text-left cursor-pointer border ${
              activeTab === 'frequently-not-covered-area'
                ? 'bg-white text-rose-900 shadow-sm border-rose-400'
                : 'text-slate-700 border-transparent hover:bg-[#fdecea] hover:text-rose-900 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="dash-sidebar-icon w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex-shrink-0 flex items-center justify-center">
                <GIcon name="repeat" size={22} />
              </div>
              <span className="text-[13px] font-bold text-slate-800 leading-snug break-words flex-1">{lang === 'ta' ? 'அடிக்கடி விடுபட்ட வீடுகள்' : 'Frequently Missed'}</span>
            </div>
            <span className="dash-badge dash-badge-red flex-shrink-0 ml-2">!</span>
          </button>

          {/* 6. Municipal Reports Tab */}
          <button
            onClick={() => handleTabClick('reports')}
            className={`dash-sidebar-item group w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm text-left cursor-pointer border ${
              activeTab === 'reports'
                ? 'bg-white text-emerald-900 shadow-sm border-emerald-300'
                : 'text-slate-700 border-transparent hover:bg-white hover:text-emerald-900 hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex-shrink-0 flex items-center justify-center">
                <GIcon name="description" size={22} />
              </div>
              <span className="text-sm font-bold">{lang === 'ta' ? 'அறிக்கைகள்' : 'Reports'}</span>
            </div>
          </button>

          {/* 7. QR Management Tab (QR Checkpoint Admin) */}
          <button
            onClick={() => handleTabClick('qr-management')}
            className={`dash-sidebar-item group w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm text-left cursor-pointer border ${
              activeTab === 'qr-management'
                ? 'bg-white text-emerald-900 shadow-sm border-emerald-300'
                : 'text-slate-700 border-transparent hover:bg-white hover:text-emerald-900 hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  activeTab === 'qr-management'
                    ? 'bg-[#1E7A38] text-white'
                    : 'bg-emerald-50 text-[#1E7A38]'
                }`}
              >
                <GIcon name="qr_code_2" size={22} />
              </div>
              <span className="text-sm font-bold leading-snug" style={{ whiteSpace: 'nowrap' }}>{lang === 'ta' ? 'QR மேலாண்மை' : 'QR Management'}</span>
            </div>
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
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#1E7A38] flex items-center justify-center flex-shrink-0">
              <GIcon name="logout" size={22} />
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
                  <GIcon name="close" size={20} />
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
                          ? 'bg-white text-emerald-900 shadow-sm border-emerald-300'
                          : 'text-slate-700 border-transparent hover:bg-white hover:text-emerald-900 hover:border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex-shrink-0 flex items-center justify-center">
                          <GIcon name={item.gicon} size={22} filled={isActive} />
                        </div>
                        <span className="text-sm font-bold">{item.label}</span>
                      </div>

                      {(item as any).count !== undefined && (item as any).count > 0 && (
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-full ${
                            (item as any).isCritical
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
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
                  <GIcon name="location_on" size={16} />
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
                <GIcon name="logout" size={18} />
                <span>Logout Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


