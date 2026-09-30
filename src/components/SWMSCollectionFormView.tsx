import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Truck,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Save,
  QrCode,
  Globe,
  UserCheck,
  ShieldCheck,
  Clock,
  Check,
  Loader2,
  Navigation,
  Users,
  Building2,
  Camera,
  ImagePlus,
  Trash2,
} from 'lucide-react';
import { submitCollection } from '../api/client';
import type { CheckpointResolveResponse, CheckpointStatus, NotCollectedReasonOption } from '../types';
import { NOT_COLLECTED_REASONS } from '../types';
import { DustbinAnimationModal } from './DustbinAnimationModal';

interface SWMSCollectionFormViewProps {
  lang?: 'en' | 'ta';
  token: string | null;
  resolution: CheckpointResolveResponse;
  onBack: () => void;
  onSaved: (info: { message: string; status: 'Collected' | 'Not Collected'; qrId: string; streetName: string }) => void;
  onNextScan: () => void;
  onSetLanguage?: (lang: 'en' | 'ta') => void;
  onToggleLang?: () => void;
}

const STATUS_META: Record<CheckpointStatus, { labelEn: string; labelTa: string; cardClass: string; icon: string }> = {
  Collected: {
    labelEn: 'Collected',
    labelTa: 'சேகரிக்கப்பட்டது',
    cardClass: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]',
    icon: 'check',
  },
  'Not Collected': {
    labelEn: 'Not Collected',
    labelTa: 'சேகரிக்கப்படவில்லை',
    cardClass: 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]',
    icon: 'x',
  },
  Pending: {
    labelEn: 'Pending',
    labelTa: 'நிலுவையில்',
    cardClass: 'bg-slate-50 border-slate-200 text-slate-500',
    icon: 'clock',
  },
};

export const SWMSCollectionFormView: React.FC<SWMSCollectionFormViewProps> = ({
  lang = 'en',
  token,
  resolution,
  onBack,
  onSaved,
  onNextScan,
}) => {
  const checkpoint = resolution.checkpoint;
  const assignment = resolution.assignment;

  const [status, setStatus] = useState<'Collected' | 'Not Collected' | null>(
    resolution.alreadySubmitted && resolution.existingRecord?.status === 'Not Collected' ? 'Not Collected' :
    resolution.alreadySubmitted && resolution.existingRecord?.status === 'Collected' ? 'Collected' : null
  );
  const [reason, setReason] = useState<NotCollectedReasonOption | ''>('');
  const [otherReason, setOtherReason] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showCollectedAnim, setShowCollectedAnim] = useState(false);

  // 5 mandatory scan photos for Tata Ace
  const [formPhotos, setFormPhotos] = useState<(string | null)[]>([null, null, null, null, null]);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const isPushcart = !!assignment?.isPushcart;
  const isTataAce = !isPushcart || (assignment?.vehicleType || '').toUpperCase().includes('TATA') || (checkpoint.streetName || '').toLowerCase().includes('nagar') || (checkpoint.streetName || '').toLowerCase().includes('veedhi');
  const statusMeta = STATUS_META[checkpoint.status];

  const handlePhotoSlotChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormPhotos(prev => {
        const next = [...prev];
        next[index] = result;
        return next;
      });
      setSaveError(null);
    };
    reader.readAsDataURL(file);
  };

  const removePhotoSlot = (index: number) => {
    setFormPhotos(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const handleSave = async () => {
    setSaveError(null);

    if (!status) {
      setSaveError(lang === 'ta' ? 'சேகரிப்பு நிலையைத் தேர்ந்தெடுக்கவும்.' : 'Please select a collection status.');
      return;
    }

    // Check mandatory 5 photos for Tata Ace
    const validPhotos = formPhotos.filter((p): p is string => Boolean(p));
    if (isTataAce && validPhotos.length < 5) {
      setSaveError(
        lang === 'ta'
          ? `Tata Ace வாகனத்திற்கு 5 புகைப்படங்கள் எடுப்பது கட்டாயமாகும் (${validPhotos.length}/5 புகைப்படங்கள் எடுக்கப்பட்டுள்ளன).`
          : `5 photos are mandatory for Tata Ace vehicle scan (${validPhotos.length}/5 photos uploaded).`
      );
      return;
    }

    let remarks: string | null = null;
    if (status === 'Not Collected') {
      if (!reason) {
        setSaveError(lang === 'ta' ? 'சேகரிக்கப்படவில்லை எனில் காரணம் கட்டாயம்.' : 'Reason is mandatory when status is "Not Collected".');
        return;
      }
      remarks = reason;
      if (reason === 'Other') {
        const extra = otherReason.trim();
        if (!extra) {
          setSaveError(lang === 'ta' ? 'கூடுதல் குறிப்பு கட்டாயம்.' : 'Additional remarks are mandatory for "Other".');
          return;
        }
        remarks = `Other - ${extra}`;
      }
    }

    if (!token) {
      setSaveError('Session missing. Please log in again.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await submitCollection(token, {
        qrId: checkpoint.qrId,
        status,
        remarks,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        photos: validPhotos.length > 0 ? validPhotos : null,
      });
      if (!result?.success) {
        setSaveError(result?.message || 'Submission failed.');
        return;
      }
      onSaved({
        message: result.message,
        status,
        qrId: checkpoint.qrId,
        streetName: checkpoint.streetName,
      });
      setSaved(true);
      // Play the dustbin garbage-drop animation only when collection is successful
      if (status === 'Collected') {
        setShowCollectedAnim(true);
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Unable to save. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Already submitted without a "change record" flow — show read-only confirmation
  const alreadySubmitted = resolution.alreadySubmitted;

  return (
    <div className="min-h-screen bg-[#F6F9F7] pb-16 font-sans">
      {/* ── GREEN HEADER ── */}
      <div className="bg-gradient-to-br from-[#166534] via-[#1E7A38] to-[#15803D] text-white px-4 py-3.5 shadow-lg sticky top-0 z-30">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center cursor-pointer active:scale-95 transition"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div className="text-center">
            <div className="text-xs font-black tracking-wide">{lang === 'ta' ? 'சேகரிப்பு விவரம்' : 'Collection Entry'}</div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-200 font-mono">
              <QrCode className="w-3 h-3" /> {checkpoint.qrId}
            </div>
          </div>
          <div className="w-9" />
        </div>
      </div>

      {saved ? (
        /* ── SUCCESS SCREEN ── */
        <div className="px-4 pt-10">
          <div className="bg-white border border-emerald-200 rounded-3xl p-6 text-center shadow-md">
            <div className="w-20 h-20 rounded-full bg-[#ECFDF5] border-4 border-[#A7F3D0] flex items-center justify-center mx-auto">
              {status === 'Collected'
                ? <CheckCircle2 className="w-11 h-11 text-[#059669]" />
                : <AlertTriangle className="w-11 h-11 text-[#C2410C]" />}
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-4">
              {status === 'Collected'
                ? (lang === 'ta' ? 'வெற்றிகரமாக சேகரிக்கப்பட்டது!' : 'Collected Successfully!')
                : (lang === 'ta' ? 'சேகரிக்கப்படாததாக பதிவு செய்யப்பட்டது' : 'Not Collected Recorded')}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5">
              {checkpoint.streetName} • {checkpoint.qrId}
            </p>
            <div className={`mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black ${
              status === 'Collected' ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]' : 'bg-[#FFF7ED] border-[#FDBA74] text-[#C2410C]'
            }`}>
              {status === 'Collected' ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {status === 'Collected' ? (lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Collected') : (lang === 'ta' ? 'சேகரிக்கப்படவில்லை' : 'Not Collected')}
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                onClick={() => { setSaved(false); onNextScan(); }}
                className="w-full flex items-center justify-center gap-2 bg-[#1E7A38] hover:bg-[#166534] text-white font-black py-3.5 rounded-2xl shadow-md active:scale-[0.98] transition cursor-pointer"
              >
                <QrCode className="w-4.5 h-4.5" />
                {lang === 'ta' ? 'அடுத்த QR ஸ்கேன்' : 'Scan Next QR'}
              </button>
              <button
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-black py-3.5 rounded-2xl active:scale-[0.98] transition cursor-pointer"
              >
                {lang === 'ta' ? 'டாஷ்போர்டிற்கு செல்' : 'Back to Dashboard'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-3.5">
          {/* ── 1. STREET DETAILS ── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 bg-emerald-50 border-b border-emerald-100 px-4 py-2.5">
              <span className="w-5 h-5 rounded-full bg-[#1E7A38] text-white text-[12px] font-black flex items-center justify-center">1</span>
              <span className="text-[11px] font-black uppercase tracking-wide text-[#1E7A38]">{lang === 'ta' ? 'தெரு விவரங்கள்' : 'Street Details'}</span>
            </div>
            <div className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-[#1E7A38]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-black text-slate-900 leading-tight">{checkpoint.streetName}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {checkpoint.zone} • {checkpoint.ward}{checkpoint.area ? ` • ${checkpoint.area}` : ''}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 text-[12px] font-black font-mono border border-slate-200">
                    <QrCode className="w-3 h-3" /> {checkpoint.qrId}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#ECFDF5] text-[#047857] rounded-full px-2.5 py-1 text-[12px] font-black border border-[#A7F3D0]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> {lang === 'ta' ? `புள்ளி ${checkpoint.position}` : `Point ${checkpoint.position}`}
                  </span>
                  {checkpoint.households ? (
                    <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 rounded-full px-2.5 py-1 text-[12px] font-black border border-sky-200">
                      <Users className="w-3 h-3" /> {checkpoint.households} {lang === 'ta' ? 'வீடுகள்' : 'households'}
                    </span>
                  ) : null}
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 text-[11px] font-black uppercase px-2 py-1 rounded-full border flex-shrink-0 ${statusMeta.cardClass}`}>
                {statusMeta.icon === 'check' ? <Check className="w-3 h-3" /> : statusMeta.icon === 'x' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {lang === 'ta' ? statusMeta.labelTa : statusMeta.labelEn}
              </span>
            </div>
          </div>

          {/* ── QR RECORD FIELD TEAM (fetched from DB after scan) ── */}
          {(checkpoint.workerName || checkpoint.ssName || checkpoint.cssName || checkpoint.siName) && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 bg-emerald-50 border-b border-emerald-100 px-4 py-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1E7A38] text-white text-[12px] font-black flex items-center justify-center">
                  <Users className="w-3 h-3" />
                </span>
                <span className="text-[11px] font-black uppercase tracking-wide text-[#1E7A38]">
                  {lang === 'ta' ? 'களக்குழு (QR பதிவு)' : 'Field Team (QR record)'}
                </span>
                <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-[#ECFDF5] border border-[#A7F3D0] rounded-full px-2 py-0.5">
                  <ShieldCheck className="w-3 h-3" /> {lang === 'ta' ? 'தானாக' : 'Auto'}
                </span>
              </div>
              <div className="p-4 space-y-2.5">
                {checkpoint.workerName && (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50/70 border border-emerald-100 px-3 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-black uppercase text-emerald-700">{lang === 'ta' ? 'பணியாளர்' : 'Worker'}</div>
                        <div className="text-xs font-black text-slate-900 truncate">{checkpoint.workerName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {checkpoint.workerCode && <div className="text-[11px] text-slate-500 font-mono">{checkpoint.workerCode}</div>}
                      {checkpoint.workerContact && <div className="text-[12px] font-bold text-slate-700 font-mono">{checkpoint.workerContact}</div>}
                    </div>
                  </div>
                )}
                {checkpoint.ssName && (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50/70 border border-emerald-100 px-3 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-black uppercase text-emerald-700">SS</div>
                        <div className="text-xs font-black text-slate-900 truncate">{checkpoint.ssName}</div>
                      </div>
                    </div>
                    {checkpoint.ssContact && <div className="text-[12px] font-bold text-slate-700 font-mono text-right">{checkpoint.ssContact}</div>}
                  </div>
                )}
                {checkpoint.cssName && (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50/70 border border-emerald-100 px-3 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-black uppercase text-emerald-700">CSS</div>
                        <div className="text-xs font-black text-slate-900 truncate">{checkpoint.cssName}</div>
                      </div>
                    </div>
                    {checkpoint.cssContact && <div className="text-[12px] font-bold text-slate-700 font-mono text-right">{checkpoint.cssContact}</div>}
                  </div>
                )}
                {checkpoint.siName && (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50/70 border border-emerald-100 px-3 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <UserCheck className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-black uppercase text-emerald-700">SI</div>
                        <div className="text-xs font-black text-slate-900 truncate">{checkpoint.siName}</div>
                      </div>
                    </div>
                    {checkpoint.siContact && <div className="text-[12px] font-bold text-slate-700 font-mono text-right">{checkpoint.siContact}</div>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 2. ASSIGNED (AUTO-LOADED) ── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 bg-emerald-50 border-b border-emerald-100 px-4 py-2.5">
              <span className="w-5 h-5 rounded-full bg-[#1E7A38] text-white text-[12px] font-black flex items-center justify-center">2</span>
              <span className="text-[11px] font-black uppercase tracking-wide text-[#1E7A38]">
                {lang === 'ta' ? 'ஒதுக்கப்பட்ட வசதி' : 'Assigned Vehicle / Worker'}
              </span>
              <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-[#ECFDF5] border border-[#A7F3D0] rounded-full px-2 py-0.5">
                <ShieldCheck className="w-3 h-3" /> {lang === 'ta' ? 'தானாக' : 'Auto'}
              </span>
            </div>

            <div className="p-4 space-y-3">
              {isPushcart ? (
                <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-2xl p-3.5">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-5 h-5 text-orange-700" />
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wider text-orange-700">{lang === 'ta' ? 'பணியாளர்' : 'Sanitary Worker'}</div>
                    <div className="text-sm font-black text-slate-900">{assignment?.workerName || '—'}</div>
                    <div className="text-[12px] text-slate-500 font-mono mt-0.5">
                      {assignment?.workerCode ? `ID: ${assignment.workerCode}` : ''}
                      {assignment?.workerPhone ? ` • ${assignment.workerPhone}` : ''}
                    </div>
                    <div className="text-[12px] font-semibold text-slate-600 mt-1 inline-flex items-center gap-1 bg-white border border-orange-200 rounded-full px-2 py-0.5">
                      <Truck className="w-3 h-3" /> {assignment?.vehicleType || 'Pushcart'}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3 bg-sky-50 border border-sky-200 rounded-2xl p-3.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-5 h-5 text-sky-700" />
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider text-sky-700">{lang === 'ta' ? 'வாகனம்' : 'Vehicle'}</div>
                      <div className="text-sm font-black text-slate-900">{assignment?.vehicleType || 'Vehicle'}</div>
                      <div className="text-[11px] text-slate-700 font-black font-mono mt-0.5 bg-white border border-sky-200 rounded-lg px-2 py-1 inline-block">
                        {assignment?.vehicleNumber || '—'}
                      </div>
                    </div>
                  </div>
                  {assignment?.workerName && (
                    <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-wider text-emerald-700">{lang === 'ta' ? 'பணியாளர்' : 'Worker'}</div>
                        <div className="text-sm font-black text-slate-900">{assignment?.workerName}</div>
                        <div className="text-[12px] text-slate-500 font-mono mt-0.5">
                          {assignment?.workerCode ? `ID: ${assignment.workerCode}` : ''}
                          {assignment?.workerPhone ? ` • ${assignment.workerPhone}` : ''}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── 3. COLLECTION STATUS ── */}
          {!alreadySubmitted ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 bg-emerald-50 border-b border-emerald-100 px-4 py-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1E7A38] text-white text-[12px] font-black flex items-center justify-center">3</span>
                <span className="text-[11px] font-black uppercase tracking-wide text-[#1E7A38]">{lang === 'ta' ? 'சேகரிப்பு நிலை' : 'Collection Status'}</span>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setStatus('Collected'); setSaveError(null); }}
                    className={`rounded-2xl border-2 p-4 text-center transition active:scale-[0.97] cursor-pointer ${
                      status === 'Collected'
                        ? 'border-[#059669] bg-[#ECFDF5] ring-4 ring-emerald-500/10'
                        : 'border-slate-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <CheckCircle2 className={`w-8 h-8 mx-auto ${status === 'Collected' ? 'text-[#059669]' : 'text-slate-300'}`} />
                    <div className={`text-sm font-black mt-2 ${status === 'Collected' ? 'text-[#047857]' : 'text-slate-600'}`}>
                      {lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Collected'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      {lang === 'ta' ? 'வீணை எடுக்கப்பட்டது' : 'Waste lifted'}
                    </div>
                  </button>

                  <button
                    onClick={() => { setStatus('Not Collected'); setSaveError(null); }}
                    className={`rounded-2xl border-2 p-4 text-center transition active:scale-[0.97] cursor-pointer ${
                      status === 'Not Collected'
                        ? 'border-[#E11D48] bg-[#FFF1F2] ring-4 ring-rose-500/10'
                        : 'border-slate-200 bg-white hover:border-rose-300'
                    }`}
                  >
                    <XCircle className={`w-8 h-8 mx-auto ${status === 'Not Collected' ? 'text-[#E11D48]' : 'text-slate-300'}`} />
                    <div className={`text-sm font-black mt-2 ${status === 'Not Collected' ? 'text-[#BE123C]' : 'text-slate-600'}`}>
                      {lang === 'ta' ? 'சேகரிக்கப்படவில்லை' : 'Not Collected'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      {lang === 'ta' ? 'காரணத்துடன்' : 'With reason'}
                    </div>
                  </button>
                </div>

                {/* ── 4. MANDATORY 5 SCAN PHOTOS (TATA ACE & COLLECTION PROOF) ── */}
                <div className="mt-5 border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between bg-sky-50 border border-sky-200 rounded-2xl p-3">
                    <div className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-sky-700" />
                      <div>
                        <div className="text-xs font-black text-sky-900 uppercase tracking-wide">
                          {lang === 'ta' ? '5 கட்டாய புகைப்படங்கள் (5 mandatory scan photos)' : '5 Mandatory Scan Photos (Tata Ace)'}
                        </div>
                        <div className="text-[11px] text-sky-700 font-semibold">
                          {lang === 'ta' ? 'அனைத்து 5 புகைப்படங்களும் கட்டாயமாகும்' : 'All 5 photo angles are required for verification'}
                        </div>
                      </div>
                    </div>
                    <div className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                      formPhotos.filter(Boolean).length === 5
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                        : 'bg-amber-100 border-amber-300 text-amber-900'
                    }`}>
                      {formPhotos.filter(Boolean).length}/5 {lang === 'ta' ? 'முடிந்தது' : 'Done'}
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {[
                      { num: 1, labelEn: 'Front', labelTa: 'முன்பக்கம்' },
                      { num: 2, labelEn: 'Left Side', labelTa: 'இடது' },
                      { num: 3, labelEn: 'Right Side', labelTa: 'வலது' },
                      { num: 4, labelEn: 'Rear Area', labelTa: 'பின்பக்கம்' },
                      { num: 5, labelEn: 'Proof', labelTa: 'சான்று' },
                    ].map((slot, idx) => (
                      <div key={slot.num} className="relative flex flex-col items-center">
                        <label className={`w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition relative overflow-hidden bg-slate-50 ${
                          formPhotos[idx] ? 'border-emerald-500 bg-emerald-50/40' : 'border-sky-300 hover:border-sky-500 hover:bg-sky-50/50'
                        }`}>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handlePhotoSlotChange(idx, e)}
                            className="hidden"
                          />
                          {formPhotos[idx] ? (
                            <>
                              <img src={formPhotos[idx]!} alt={`Photo ${slot.num}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); removePhotoSlot(idx); }}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center cursor-pointer border border-white/30"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center p-1">
                              <Camera className="w-4 h-4 text-sky-600 mb-0.5" />
                              <span className="text-[10px] font-black text-slate-700 leading-tight">#{slot.num}</span>
                              <span className="text-[9px] font-semibold text-slate-500 truncate max-w-full">
                                {lang === 'ta' ? slot.labelTa : slot.labelEn}
                              </span>
                            </div>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remarks when Not Collected */}
                {status === 'Not Collected' && (
                  <div className="mt-4 bg-[#FFF7ED] border border-[#FDBA74] rounded-2xl p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#C2410C] mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-black text-[#9A3412]">
                          {lang === 'ta' ? 'சேகரிக்கப்படாத காரணம் *' : 'Reason for Not Collected *'}
                        </div>
                        <div className="text-[11px] text-orange-700/80 mt-0.5">
                          {lang === 'ta' ? 'இது கட்டாயம்' : 'This is mandatory'}
                        </div>
                      </div>
                    </div>
                    <select
                      value={reason}
                      onChange={(e) => { setReason(e.target.value as NotCollectedReasonOption); setSaveError(null); }}
                      className="w-full bg-white border border-orange-200 rounded-xl px-3 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#EA580C] focus:ring-4 focus:ring-orange-500/10 cursor-pointer"
                    >
                      <option value="">{lang === 'ta' ? '— காரணத்தை தேர்ந்தெடுக்கவும் —' : '— Select a reason —'}</option>
                      {NOT_COLLECTED_REASONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>

                    {reason === 'Other' && (
                      <input
                        value={otherReason}
                        onChange={(e) => { setOtherReason(e.target.value); setSaveError(null); }}
                        placeholder={lang === 'ta' ? 'கூடுதல் குறிப்பு *' : 'Additional Remarks *'}
                        className="w-full bg-white border border-orange-200 rounded-xl px-3 py-3 text-sm font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-[#EA580C] focus:ring-4 focus:ring-orange-500/10"
                      />
                    )}
                  </div>
                )}

                {saveError && (
                  <div className="mt-3 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 flex items-center gap-2 text-xs font-bold text-rose-700">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {saveError}
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-[#1E7A38] hover:bg-[#166534] disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-md active:scale-[0.98] transition cursor-pointer"
                >
                  {isSaving
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> {lang === 'ta' ? 'சமர்ப்பிக்கிறது...' : 'Submitting...'}</>
                    : <><Save className="w-5 h-5" /> {lang === 'ta' ? 'சமர்ப்பி' : 'Submit'}</>}
                </button>
              </div>
            </div>
          ) : (
            /* ── ALREADY SUBMITTED BLOCK ── */
            <div className={`rounded-2xl border-2 p-5 ${status === 'Collected' ? 'bg-[#ECFDF5] border-[#A7F3D0]' : 'bg-[#FFF1F2] border-[#FECDD3]'}`}>
              <div className="flex items-start gap-3">
                {status === 'Collected'
                  ? <CheckCircle2 className="w-9 h-9 text-[#059669] flex-shrink-0" />
                  : <XCircle className="w-9 h-9 text-[#BE123C] flex-shrink-0" />}
                <div>
                  <div className={`text-sm font-black ${status === 'Collected' ? 'text-[#047857]' : 'text-[#BE123C]'}`}>
                    {lang === 'ta'
                      ? (status === 'Collected' ? 'இந்த புள்ளி ஏற்கனவே சேகரிக்கப்பட்டது' : 'இந்த புள்ளி சேகரிக்கப்படாததாக பதிவு')
                      : (status === 'Collected' ? 'This checkpoint was already collected today' : 'This checkpoint was already marked Not Collected today')}
                  </div>
                  <div className="text-[12px] text-slate-600 mt-1">
                    {resolution.existingRecord?.scannedAt && (
                      <>Scanned at {resolution.existingRecord.scannedAt}<br /></>
                    )}
                    {resolution.existingRecord?.remarks && (
                      <>Remarks: {resolution.existingRecord.remarks}</>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={onBack}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 font-black py-3 rounded-xl active:scale-[0.98] cursor-pointer text-xs"
                >
                  {lang === 'ta' ? 'டாஷ்போர்டு' : 'Dashboard'}
                </button>
                <button
                  onClick={onNextScan}
                  className="flex-1 bg-[#1E7A38] text-white font-black py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer text-xs"
                >
                  <QrCode className="w-3.5 h-3.5" /> {lang === 'ta' ? 'அடுத்த ஸ்கேன்' : 'Scan Next'}
                </button>
              </div>
            </div>
          )}

          {/* GPS note */}
          <div className="flex items-center justify-center gap-1.5 text-[12px] text-slate-400 font-semibold pb-2">
            <Navigation className="w-3 h-3" />
            {coords
              ? (lang === 'ta' ? `GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : `GPS locked: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`)
              : (lang === 'ta' ? 'GPS கிடைக்கவில்லை' : 'GPS not available')}
          </div>
        </div>
      )}

      {/* Dustbin garbage-drop success animation (only when Collected) */}
      <DustbinAnimationModal
        isOpen={showCollectedAnim}
        coverageStatus="Covered"
        houseId={checkpoint.qrId}
        doorNo={checkpoint.households ? String(checkpoint.households) : ''}
        streetName={checkpoint.streetName}
        ward={checkpoint.ward}
        lang={lang}
        assignedVehicleId={assignment?.isPushcart ? 'v-push-cart' : 'v-tata-ace'}
        onClose={() => {
          setShowCollectedAnim(false);
          onBack();
        }}
      />
    </div>
  );
};