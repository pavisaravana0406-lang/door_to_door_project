import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Check, Sparkles, Languages } from 'lucide-react';

interface LanguageSelectionModalProps {
  isOpen: boolean;
  currentLang: 'en' | 'ta';
  onSelectLanguage: (lang: 'en' | 'ta') => void;
  onClose?: () => void;
}

export const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({
  isOpen,
  currentLang,
  onSelectLanguage,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-emerald-500 relative overflow-hidden text-center flex flex-col items-center"
        >
          {/* Decorative Top Green Gradient Arc */}
          <div className="absolute top-0 left-0 right-0 h-3 border-b border-emerald-600 bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-800" />

          {/* Icon Header */}
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-3xl flex items-center justify-center border-2 border-emerald-300 shadow-md mt-2 mb-3">
            <Globe className="w-9 h-9 text-emerald-700 animate-pulse" />
          </div>

          <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 tracking-wider mb-2 flex items-center space-x-1">
            <Languages className="w-3.5 h-3.5" />
            <span>Select Portal Language / மொழியைத் தேர்ந்தெடுக்கவும்</span>
          </span>

          {/* LANGUAGE CHOICE CARDS */}
          <div className="w-full space-y-3 mb-6 mt-4">
            
            {/* ENGLISH OPTION CARD */}
            <button
              onClick={() => onSelectLanguage('en')}
              className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all transform active:scale-98 ${
                currentLang === 'en'
                  ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-400/50 shadow-md'
                  : 'bg-slate-50 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40'
              }`}
            >
              <div className="flex items-center space-x-3.5 text-left">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-xs sm:text-sm tracking-wider flex items-center justify-center border border-slate-700 shadow-sm uppercase">
                  ENG
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">English</h3>
                  <p className="text-[11px] font-semibold text-slate-500">Proceed in English language</p>
                </div>
              </div>

              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                currentLang === 'en' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
              }`}>
                {currentLang === 'en' && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
            </button>

            {/* TAMIL OPTION CARD */}
            <button
              onClick={() => onSelectLanguage('ta')}
              className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all transform active:scale-98 ${
                currentLang === 'ta'
                  ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-400/50 shadow-md'
                  : 'bg-slate-50 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40'
              }`}
            >
              <div className="flex items-center space-x-3.5 text-left">
                <div className="w-12 h-12 rounded-2xl bg-[#FF9E00] text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center border border-amber-400 shadow-sm">
                  தமிழ்
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">தமிழ் (Tamil)</h3>
                  <p className="text-[11px] font-semibold text-slate-500">தமிழில் தொடர்ந்து பயன்படுத்தவும்</p>
                </div>
              </div>

              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                currentLang === 'ta' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
              }`}>
                {currentLang === 'ta' && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
            </button>

          </div>

          {/* CONFIRM BUTTON */}
          <button
            onClick={() => {
              if (onClose) onClose();
            }}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-700 via-green-700 to-emerald-800 hover:from-emerald-800 hover:to-green-800 text-white rounded-2xl font-black text-xs shadow-xl flex items-center justify-center space-x-2 transition active:scale-98 uppercase tracking-wider"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>
              {currentLang === 'ta' ? 'தொடரவும் (CONTINUE)' : 'CONTINUE TO PORTAL'}
            </span>
          </button>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
