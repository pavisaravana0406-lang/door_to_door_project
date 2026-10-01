import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Leaf } from 'lucide-react';
import { ccmcLogo, ccmcFallbackLogo, smartCityLogo, smartCityFallbackLogo, loginBgImage } from '../constants/branding';
import { authLogin } from '../api/client';
import type { SWMSAssignment } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: { role: 'worker' | 'admin'; name: string; token?: string; assignment?: SWMSAssignment; workerInfo?: any }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const userClean = (usernameInput || '').trim().toLowerCase();
    const passClean = (passwordInput || '').trim();

    if (!userClean) {
      setError('Please enter your Username / Officer ID');
      return;
    }

    if (!passClean) {
      setError('Please enter your Password');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authLogin(userClean, passClean);

      if (!result?.token) {
        setError('Server did not return a session token. Please try again.');
        return;
      }

      if (result.user?.role === 'admin') {
        onLoginSuccess({
          role: 'admin',
          name: result.user.fullName || 'Commissioner',
          token: result.token,
          assignment: result.user,
        });
      } else {
        const role = result.user?.role === 'worker' ? 'worker' : ('worker' as const);
        const assignment: SWMSAssignment = result.user;
        onLoginSuccess({
          role,
          name: assignment.fullName || assignment.username,
          token: result.token,
          assignment,
          workerInfo: {
            id: assignment.username,
            name: assignment.fullName || assignment.username,
            designation: assignment.isPushcart ? 'Sanitary Worker (Pushcart)' : 'Field Driver / Officer',
            ward: assignment.ward,
            area: assignment.zone,
            cssContact: null,
            isPushcart: assignment.isPushcart,
            vehicleType: assignment.vehicleType,
            vehicleNumber: assignment.vehicleNumber,
            workerName: assignment.workerName,
            workerCode: assignment.workerCode,
          },
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to reach the SWMS server. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6 font-sans relative overflow-y-auto bg-cover bg-center bg-no-repeat select-none"
      style={{
        backgroundImage: `url(${loginBgImage})`,
        backgroundColor: '#EFF5F0'
      }}
    >
      {/* Subtle atmospheric vignette / clean overlay to ensure exact contrast */}
      <div className="absolute inset-0 bg-emerald-950/[0.02] pointer-events-none z-0" />

      {/* 🍃 FLOATING ORGANIC LEAVES & ECO PARTICLES ANIMATION IN THE BACKGROUND (Hidden on mobile for clean focus) */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none z-0">
        
        {/* Top-Left Botanical Branch (Swaying with the eco breeze) */}
        <div className="absolute -top-6 -left-6 sm:top-2 sm:left-4 w-44 sm:w-60 h-44 sm:h-60 animate-sway-branch opacity-85 pointer-events-none">
          <svg viewBox="0 0 200 200" fill="none" className="w-full h-full drop-shadow-sm">
            {/* Main stem */}
            <path d="M10 10 C 60 40, 110 90, 180 150" stroke="#2d6a4f" strokeWidth="4" strokeLinecap="round" />
            <path d="M60 40 C 90 20, 130 30, 150 15" stroke="#40916c" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M110 90 C 130 70, 170 75, 190 60" stroke="#40916c" strokeWidth="2.5" strokeLinecap="round" />
            
            {/* Leaves attached to branch */}
            {/* Leaf 1 */}
            <path d="M60 40 C 50 15, 80 5, 95 25 C 90 45, 70 50, 60 40 Z" fill="#52b788" stroke="#1b4332" strokeWidth="1.5" />
            <path d="M60 40 Q 78 28 95 25" stroke="#1b4332" strokeWidth="1" />
            
            {/* Leaf 2 */}
            <path d="M110 90 C 100 65, 130 50, 145 70 C 140 90, 120 98, 110 90 Z" fill="#74c69d" stroke="#1b4332" strokeWidth="1.5" />
            <path d="M110 90 Q 128 78 145 70" stroke="#1b4332" strokeWidth="1" />

            {/* Leaf 3 */}
            <path d="M150 125 C 135 110, 160 90, 178 105 C 175 125, 160 135, 150 125 Z" fill="#40916c" stroke="#1b4332" strokeWidth="1.5" />
            <path d="M150 125 Q 164 115 178 105" stroke="#1b4332" strokeWidth="1" />

            {/* Leaf 4 */}
            <path d="M140 25 C 155 10, 180 20, 175 38 C 160 48, 145 38, 140 25 Z" fill="#95d5b2" stroke="#2d6a4f" strokeWidth="1.5" />
            
            {/* Leaf 5 */}
            <path d="M180 70 C 195 55, 215 70, 205 88 C 190 95, 180 85, 180 70 Z" fill="#52b788" stroke="#1b4332" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Floating Leaf 1 (Top Left Foliage Drift) */}
        <div className="absolute top-12 left-[12%] sm:left-[20%] w-11 h-11 text-emerald-700/70 animate-float-leaf1">
          <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full drop-shadow-md">
            <path d="M50 0 C20 30 10 70 50 100 C90 70 80 30 50 0 Z" fill="#2d6a4f" fillOpacity="0.55" stroke="#1b4332" strokeWidth="2.5" />
            <path d="M50 10 L50 90" stroke="#1b4332" strokeWidth="2" />
            <path d="M50 35 Q 35 25 25 35 M50 55 Q 35 45 25 55 M50 35 Q 65 25 75 35 M50 55 Q 65 45 75 55" stroke="#1b4332" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Floating Leaf 2 (Top Right Sway) */}
        <div className="absolute top-16 right-[10%] sm:right-[16%] w-14 h-14 animate-float-leaf2">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-md">
            <path d="M10 50 C30 10 70 20 90 50 C70 90 30 80 10 50 Z" fill="#52b788" fillOpacity="0.5" stroke="#1b4332" strokeWidth="2.5" />
            <path d="M15 50 Q 50 50 85 50" stroke="#1b4332" strokeWidth="2" />
            <path d="M35 50 Q 45 30 55 25 M60 50 Q 70 35 78 30 M35 50 Q 45 70 55 75 M60 50 Q 70 65 78 70" stroke="#1b4332" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Floating Leaf 3 (Bottom Left Rising Breeze) */}
        <div className="absolute bottom-20 left-[6%] sm:left-[16%] w-10 h-10 animate-float-leaf3">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-md">
            <path d="M50 5 C25 35 20 65 50 95 C80 65 75 35 50 5 Z" fill="#74c69d" fillOpacity="0.55" stroke="#2d6a4f" strokeWidth="2" />
            <path d="M50 15 L50 85" stroke="#2d6a4f" strokeWidth="2" />
          </svg>
        </div>

        {/* Floating Leaf 4 (Bottom Right Sway) */}
        <div className="absolute bottom-12 right-[8%] sm:right-[18%] w-12 h-12 animate-float-leaf1" style={{ animationDelay: '-3.5s' }}>
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-md">
            <path d="M5 50 C25 20 75 15 95 50 C75 85 25 80 5 50 Z" fill="#40916c" fillOpacity="0.5" stroke="#1b4332" strokeWidth="2.5" />
            <path d="M15 50 L85 50" stroke="#1b4332" strokeWidth="2" />
          </svg>
        </div>

        {/* Drifting Leaves Crossing Across Screen */}
        <div className="absolute top-1/4 -left-10 w-8 h-8 animate-leaf-flutter-1 pointer-events-none">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <path d="M50 0 C25 30 15 70 50 100 C85 70 75 30 50 0 Z" fill="#52b788" fillOpacity="0.6" stroke="#2d6a4f" strokeWidth="2" />
          </svg>
        </div>

        <div className="absolute top-1/2 -left-10 w-9 h-9 animate-leaf-flutter-2 pointer-events-none">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <path d="M10 50 C30 15 70 15 90 50 C70 85 30 85 10 50 Z" fill="#74c69d" fillOpacity="0.65" stroke="#1b4332" strokeWidth="2" />
          </svg>
        </div>

        {/* Ambient Eco Glow Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[660px] bg-gradient-to-tr from-emerald-400/20 via-green-200/30 to-emerald-300/20 rounded-[50px] blur-3xl animate-gentle-breathe -z-10" />
      </div>

      {/* Main Centered Floating Card with Glass Backdrop & Animated Leaf Accents */}
      <div className="relative w-full max-w-[440px] bg-white/95 backdrop-blur-md rounded-[28px] sm:rounded-[32px] p-5 xs:p-6 sm:p-9 my-auto shadow-[0_25px_70px_-15px_rgba(22,101,52,0.18),0_4px_20px_-2px_rgba(0,0,0,0.06)] border-2 border-emerald-200/80 z-10 flex flex-col items-center text-center overflow-hidden transition-all duration-300">
        
        {/* 🌿 TOP-LEFT SWAYING LEAF SPRIG INSIDE WHITE CARD */}
        <div className="absolute -top-3 -left-3 w-28 h-28 pointer-events-none opacity-50 animate-sway-branch">
          <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
            <path d="M5 5 C 35 25, 65 55, 105 95" stroke="#2d6a4f" strokeWidth="3" strokeLinecap="round" />
            <path d="M35 25 C 25 10, 48 2, 58 15 C 55 28, 42 32, 35 25 Z" fill="#52b788" stroke="#1b4332" strokeWidth="1.5" />
            <path d="M65 55 C 55 40, 78 30, 88 45 C 84 58, 72 62, 65 55 Z" fill="#74c69d" stroke="#1b4332" strokeWidth="1.5" />
            <path d="M85 75 C 95 62, 115 72, 110 88 C 98 95, 88 85, 85 75 Z" fill="#40916c" stroke="#1b4332" strokeWidth="1.5" />
          </svg>
        </div>

        {/* 🌿 TOP-RIGHT SWAYING LEAF SPRIG INSIDE WHITE CARD */}
        <div className="absolute -top-4 -right-4 w-28 h-28 pointer-events-none opacity-45 animate-sway-branch-reverse">
          <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
            <path d="M115 5 C 85 25, 55 55, 15 95" stroke="#2d6a4f" strokeWidth="3" strokeLinecap="round" />
            <path d="M85 25 C 95 10, 72 2, 62 15 C 65 28, 78 32, 85 25 Z" fill="#74c69d" stroke="#1b4332" strokeWidth="1.5" />
            <path d="M55 55 C 65 40, 42 30, 32 45 C 36 58, 48 62, 55 55 Z" fill="#52b788" stroke="#1b4332" strokeWidth="1.5" />
            <path d="M35 75 C 25 62, 5 72, 10 88 C 22 95, 32 85, 35 75 Z" fill="#40916c" stroke="#1b4332" strokeWidth="1.5" />
          </svg>
        </div>

        {/* 🍃 BOTTOM-LEFT CORNER WATERMARK LEAF */}
        <div className="absolute -bottom-10 -left-10 w-36 h-36 pointer-events-none opacity-25 animate-drift-rotate">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <path d="M10 90 C30 60 60 40 90 50 C80 75 50 95 10 90 Z" fill="#22c55e" fillOpacity="0.4" stroke="#15803d" strokeWidth="2" />
            <path d="M30 75 C45 65 65 60 85 55" stroke="#15803d" strokeWidth="1.5" />
            <path d="M45 70 Q 55 55 65 52 M60 65 Q 70 52 80 48" stroke="#15803d" strokeWidth="1" />
          </svg>
        </div>

        {/* 🍃 BOTTOM-RIGHT CORNER WATERMARK LEAF */}
        <div className="absolute -bottom-8 -right-8 w-32 h-32 pointer-events-none opacity-25 animate-drift-rotate" style={{ animationDelay: '-4s' }}>
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <path d="M90 90 C70 60 40 40 10 50 C20 75 50 95 90 90 Z" fill="#16a34a" fillOpacity="0.4" stroke="#166534" strokeWidth="2" />
            <path d="M70 75 C55 65 35 60 15 55" stroke="#166534" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Top Dual Badges with Gold Rings */}
        <div className="flex items-center justify-center gap-3.5 mb-5">
          
          {/* CCMC Municipal Emblem with Golden Ring */}
          <div 
            className="w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-full border-[3px] border-[#F59E0B] p-1 bg-white shadow-xs flex items-center justify-center overflow-hidden transition-transform duration-300"
            title="Coimbatore City Municipal Corporation Emblem"
          >
            <img 
              src={ccmcLogo} 
              alt="CCMC Emblem" 
              referrerPolicy="no-referrer" 
              onError={(e) => {
                if (e.currentTarget.src !== ccmcFallbackLogo) {
                  e.currentTarget.src = ccmcFallbackLogo;
                }
              }}
              className="w-full h-full object-contain" 
            />
          </div>

          {/* Smart City Mission Logo with Golden Ring */}
          <div 
            className="w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-full border-[3px] border-[#F59E0B] p-1 bg-white shadow-xs flex items-center justify-center overflow-hidden transition-transform duration-300"
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

        {/* Corporation Name in ALL CAPS */}
        <h1 className="text-sm xs:text-base sm:text-lg md:text-[20px] font-black text-[#15251D] uppercase tracking-wide leading-snug mb-1 px-1 max-w-full text-center">
          COIMBATORE CITY MUNICIPAL CORPORATION
        </h1>

        {/* Integrated Command and Control Center Subtitle in ALL CAPS */}
        <div className="text-[11px] sm:text-[13px] font-black text-[#1E7A38] uppercase tracking-wider text-center px-2">
          INTEGRATED COMMAND AND CONTROL CENTER (ICCC)
        </div>

        {/* SWMS Subtitle */}
        <div className="flex flex-col items-center gap-1.5 mt-3 mb-5">
          <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 shadow-2xs">
            <Leaf className="w-3.5 h-3.5 text-[#1E7A38] animate-float-gentle" />
            <span className="text-[9.5px] sm:text-[10.5px] font-black text-[#1E7A38] uppercase tracking-wider">
              SWMS DOOR-TO-DOOR MONITORING
            </span>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="w-full bg-rose-50 border border-rose-200 rounded-xl p-2.5 mb-4 flex items-center gap-2 text-left text-xs font-semibold text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleLogin} className="w-full space-y-4 text-left">
          
          {/* Username / Officer ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#203D28] block">
              Username / Officer ID
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                id="login-username-input"
                placeholder="Enter Username or Officer ID (e.g. admin or officer)"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#2E7D32] focus:ring-4 focus:ring-[#2E7D32]/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 font-bold placeholder-slate-400 outline-none transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#203D28] block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                id="login-password-input"
                placeholder="Enter Password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#2E7D32] focus:ring-4 focus:ring-[#2E7D32]/10 rounded-2xl pl-11 pr-11 py-3 text-sm text-slate-900 font-bold placeholder-slate-400 outline-none transition tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Login Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              id="login-submit-btn"
              disabled={isLoading}
              className="w-full bg-[#1E7A38] hover:bg-[#166534] active:scale-[0.99] disabled:opacity-50 text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-200 shadow-md shadow-[#1E7A38]/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'AUTHENTICATING...' : 'LOG IN TO PORTAL'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};


