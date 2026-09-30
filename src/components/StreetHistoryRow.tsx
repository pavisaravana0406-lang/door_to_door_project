import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check, X, ChevronDown, Search, MapPin, Camera, MessageSquare, Save, Loader2,
} from 'lucide-react';
import { StreetProgress, writeQrRemark, remarkKey } from '../utils/streetProgress';

interface StreetHistoryRowProps {
  row: StreetProgress;
  lang: 'en' | 'ta';
  defaultOpen?: boolean;
  onRemarkChange?: (key: string, value: string) => void;
}

const STATUS_STYLE: Record<StreetProgress['status'], { chip: string; dot: string; labelKey: 'covered' | 'partial' | 'not_collected' }> = {
  covered: { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', labelKey: 'covered' },
  partial: { chip: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', labelKey: 'partial' },
  not_collected: { chip: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', labelKey: 'not_collected' },
};

const STATUS_TEXT = {
  covered: 'Collected',
  partial: 'Partially Collected',
  not_collected: 'Not Collected',
};

/**
 * One street in the recent-scans history. The 5 small boxes expand to reveal
 * per-QR status, and any missed QR accepts a remark.
 */
export const StreetHistoryRow: React.FC<StreetHistoryRowProps> = ({
  row,
  lang = 'en',
  defaultOpen = false,
  onRemarkChange,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [editingPoint, setEditingPoint] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  const style = STATUS_STYLE[row.status];
  const statusText = STATUS_TEXT[row.status];

  const startRemark = (point: number, current?: string) => {
    setEditingPoint(point);
    setDraft(current || '');
  };

  const saveRemark = (point: number) => {
    writeQrRemark(row.streetName, point, draft);
    const key = remarkKey(row.streetName, point);
    setRemarks(prev => {
      const next = { ...prev };
      if (draft.trim()) next[key] = draft.trim();
      else delete next[key];
      return next;
    });
    onRemarkChange?.(key, draft);
    setEditingPoint(null);
    setDraft('');
  };

  const remarkFor = (point: number): string =>
    row.points.find(p => p.position === point)?.remark
    ?? remarks[remarkKey(row.streetName, point)]
    ?? '';

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden transition hover:border-slate-300 hover:shadow-md">
      {/* Summary row */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-3 sm:px-4 py-3 flex items-center gap-3 text-left cursor-pointer hover:bg-slate-50/70 transition-colors"
      >
        {/* Street name + zone/ward */}
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-black text-slate-900 truncate flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
            <span className="truncate">{row.streetName}</span>
          </div>
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 mt-0.5 truncate">
            {[row.zone, row.ward].filter(Boolean).join(' • ')}
          </div>
        </div>

        {/* QR progress */}
        <div className="text-center flex-shrink-0">
          <div className="text-sm sm:text-base font-black font-num text-slate-900 leading-none">
            {row.scannedCount}<span className="text-slate-400">/{row.totalCheckpoints}</span>
          </div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">QR</div>
        </div>

        {/* Status chip */}
        <span className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-black flex-shrink-0 ${style.chip}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          {statusText}
        </span>

        {/* Expand arrow */}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 text-slate-400"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.span>
      </button>

      {/* Mobile status line */}
      <div className="px-3 sm:px-4 pb-2 sm:hidden">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[9px] font-black ${style.chip}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          {statusText}
        </span>
      </div>

      {/* Expandable QR boxes */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-100 overflow-hidden"
          >
            <div className="p-3 sm:p-4 bg-slate-50/60 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {row.points.map(p => {
                  const remark = remarkFor(p.position);
                  return (
                    <React.Fragment key={p.position}>
                      <button
                        type="button"
                        onClick={() => (p.isScanned ? undefined : startRemark(p.position, remark))}
                        disabled={p.isScanned}
                        title={
                          p.isScanned
                            ? (lang === 'ta' ? `ஸ்கேன் ${p.position} சேகரிக்கப்பட்டது` : `Scan ${p.position} collected`)
                            : (lang === 'ta'
                              ? `ஸ்கேன் ${p.position} சேகரிக்கப்படவில்லை — குறிப்பு சேர்க்க தட்டச்சு`
                              : `Scan ${p.position} not collected — tap to add a remark`)
                        }
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg border-2 flex flex-col items-center justify-center flex-shrink-0 transition
                          ${p.isScanned
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-600'
                            : 'bg-rose-50 border-rose-300 text-rose-500 hover:bg-rose-100 active:scale-95 cursor-pointer'}`}
                      >
                        <span className="text-[8px] font-black leading-none">{p.position}</span>
                        {p.isScanned
                          ? <Check className="w-3.5 h-3.5 stroke-[3] -mt-0.5" />
                          : <X className="w-3.5 h-3.5 stroke-[3] -mt-0.5" />}
                      </button>

                      {/* Remark editor, shown under a missed QR */}
                      <AnimatePresence>
                        {editingPoint === p.position && !p.isScanned && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="flex items-center gap-1.5 flex-1 min-w-[180px]"
                          >
                            <div className="relative flex-1">
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                autoFocus
                                value={draft}
                                onChange={e => setDraft(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveRemark(p.position);
                                  if (e.key === 'Escape') setEditingPoint(null);
                                }}
                                placeholder={lang === 'ta' ? 'காரணம்...' : 'Reason...'}
                                className="w-full pl-7 pr-2 py-1.5 text-[11px] font-bold rounded-lg border border-slate-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-300 outline-none bg-white"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => saveRemark(p.position)}
                              className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex-shrink-0 transition active:scale-95"
                              title={lang === 'ta' ? 'சேமி' : 'Save remark'}
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPoint(null)}
                              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 flex-shrink-0 transition active:scale-95"
                              title={lang === 'ta' ? 'ரத்து' : 'Cancel'}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Saved remarks summary */}
              {row.points.some(p => !p.isScanned && remarkFor(p.position)) && (
                <div className="space-y-1 pt-1">
                  {row.points
                    .filter(p => !p.isScanned && remarkFor(p.position))
                    .map(p => (
                      <button
                        key={p.position}
                        type="button"
                        onClick={() => startRemark(p.position, remarkFor(p.position))}
                        className="w-full text-left flex items-start gap-2 rounded-lg bg-white border border-rose-200 px-2.5 py-1.5 hover:bg-rose-50 transition"
                      >
                        <X className="w-3 h-3 text-rose-500 flex-shrink-0 mt-0.5" />
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 min-w-0">
                          <span className="text-rose-600 font-black">QR {p.position}:</span>{' '}
                          <span className="break-words">{remarkFor(p.position)}</span>
                        </span>
                      </button>
                    ))}
                </div>
              )}

              {/* Photo proof state for scanned QRs */}
              {row.points.some(p => p.isScanned) && (
                <div className="flex items-center gap-1.5 pt-1 text-[10px] font-bold text-slate-500">
                  <Camera className="w-3.5 h-3.5 flex-shrink-0" />
                  {lang === 'ta' ? 'படங்கள்:' : 'Photos:'}
                  {row.points.filter(p => p.isScanned).map(p => (
                    <span
                      key={p.position}
                      className={`px-1 rounded ${p.hasPhotos ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
                    >
                      {p.position}:{p.hasPhotos ? '2/2' : `${Math.min(p.photoCount, 1)}/2`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
