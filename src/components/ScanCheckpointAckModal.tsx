import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ArrowRight, X, LayoutDashboard, MapPin, Check } from 'lucide-react';

interface ScanCheckpointAckModalProps {
  isOpen: boolean;
  /** The scan that was just saved. */
  scanNumber: number;
  /** How many of the 5 scans are now complete. */
  completedCount: number;
  totalScans?: number;
  streetName?: string;
  ward?: string;
  lang?: 'en' | 'ta';
  /** True on the final scan, when the whole street is done. */
  isFinalScan?: boolean;
  onClose: () => void;
  onNextScan: () => void;
}

/**
 * Shown after each of the five scans is saved, so the worker gets a clear
 * acknowledgement before walking to the next QR. The badge states how many
 * checkpoints are recorded so far.
 */
export const ScanCheckpointAckModal: React.FC<ScanCheckpointAckModalProps> = ({
  isOpen,
  scanNumber,
  completedCount,
  totalScans = 5,
  streetName = '',
  ward = '',
  lang = 'en',
  isFinalScan = false,
  onClose,
  onNextScan,
}) => {
  if (!isOpen) return null;

  const isCovered = isFinalScan || completedCount >= totalScans;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ duration: 0.22 }}
          className="w-full max-w-sm bg-white rounded-3xl border-2 border-rose-300 shadow-2xl overflow-hidden"
        >
          {/* Header strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500" />

          <div className="relative p-4 sm:p-5">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition active:scale-95"
              title={lang === 'ta' ? 'மூடு' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon + result text */}
            <div className="flex flex-col items-center text-center pt-2">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isCovered ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'
                }`}
              >
                {isCovered ? <Check className="w-8 h-8 stroke-[3]" /> : <AlertTriangle className="w-8 h-8" />}
              </div>

              <div className="mt-3">
                <h3
                  className={`text-base sm:text-lg font-black uppercase tracking-wide ${
                    isCovered ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {isCovered
                    ? (lang === 'ta' ? 'முழுமையாகச் சேகரிக்கப்பட்டது' : 'STREET COVERED')
                    : (lang === 'ta'
                      ? `சேகரிக்கப்படவில்லை பதிவு (${completedCount}/${totalScans})`
                      : `NOT COVERED RECORDED (${completedCount}/${totalScans})`)}
                </h3>
              </div>
            </div>

            {/* Status pill */}
            <div
              className={`mt-3 w-full rounded-xl border px-3 py-2 text-center text-[11px] sm:text-xs font-black ${
                isCovered
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-rose-50 border-rose-300 text-rose-700'
              }`}
            >
              {isCovered
                ? (lang === 'ta'
                  ? `✅ அனைத்து ${totalScans} ஸ்கேன்களும் முடிந்தது`
                  : `✓ All ${totalScans} checkpoints recorded with photos`)
                : (lang === 'ta'
                  ? `⚠ ${completedCount} ஸ்கேன் மட்டும் பதிவு செய்யப்பட்டது (${totalScans} இல்)`
                  : `⚠ ${completedCount} of ${totalScans} checkpoints recorded`)}
            </div>

            {/* Location */}
            {(streetName || ward) && (
              <div className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] sm:text-xs font-bold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                <span className="truncate">
                  {[streetName, ward].filter(Boolean).join(' • ')}
                </span>
              </div>
            )}

            {/* Which scan was just saved */}
            <p className="mt-2.5 text-center text-[11px] font-bold text-slate-400">
              {lang === 'ta'
                ? `ஸ்கேன் ${scanNumber} சேமிக்கப்பட்டது`
                : `Scan ${scanNumber} saved`}
            </p>

            {/* Actions */}
            <div className="mt-4 space-y-2.5">
              {!isFinalScan && (
                <button
                  type="button"
                  onClick={onNextScan}
                  className="w-full flex items-center justify-center gap-2 bg-[#1E7A38] hover:bg-[#166534] text-white font-black text-xs px-4 py-3.5 rounded-xl transition shadow-lg active:scale-95 cursor-pointer border border-emerald-400"
                >
                  <span className="inline-flex h-4 w-4 items-center justify-center">
                    <span className="grid grid-cols-2 gap-[2px]">
                      <span className="h-[6px] w-[6px] rounded-[1px] bg-white/90" />
                      <span className="h-[6px] w-[6px] rounded-[1px] bg-white/60" />
                      <span className="h-[6px] w-[6px] rounded-[1px] bg-white/60" />
                      <span className="h-[6px] w-[6px] rounded-[1px] bg-white/90" />
                    </span>
                  </span>
                  {lang === 'ta' ? 'அடுத்து வீட்டை ஸ்கேன் செய்' : 'Scan Next House'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 bg-[#00875A] hover:bg-[#00704A] text-white font-black text-xs px-4 py-3.5 rounded-xl transition shadow-lg active:scale-95 cursor-pointer border border-emerald-500/40"
              >
                <LayoutDashboard className="w-4 h-4" />
                {lang === 'ta' ? 'டாஷ்போர்டு திரைக்கு செல்' : 'BACK TO DASHBOARD'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
