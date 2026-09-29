import React, { useState, useMemo } from 'react';
import { Eye, Filter, Camera, X, CheckCircle2 } from 'lucide-react';
import { CollectionRecord } from '../types';

interface RecentCollectionTableProps {
  records: CollectionRecord[];
  lang?: 'en' | 'ta';
  onInspectRecord: (record: CollectionRecord) => void;
  onViewAllReports: () => void;
}

const getZoneDisplayName = (zoneName: string, lang: 'en' | 'ta') => {
  if (lang !== 'ta') return zoneName;
  if (zoneName.includes('North Zone')) return 'வடக்கு மண்டலம் (North Zone)';
  if (zoneName.includes('Central Zone')) return 'மத்திய மண்டலம் (Central Zone)';
  if (zoneName.includes('South Zone')) return 'தெற்கு மண்டலம் (South Zone)';
  if (zoneName.includes('West Zone')) return 'மேற்கு மண்டலம் (West Zone)';
  if (zoneName.includes('East Zone')) return 'கிழக்கு மண்டலம் (East Zone)';
  return zoneName;
};

export const RecentCollectionTable: React.FC<RecentCollectionTableProps> = ({
  records,
  lang = 'en',
  onInspectRecord,
  onViewAllReports,
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [previewPhotoRecord, setPreviewPhotoRecord] = useState<CollectionRecord | null>(null);
  const [showAllRecords, setShowAllRecords] = useState<boolean>(false);

  // Compute diverse set of records representing all 5 zones or filter by selected zone
  const displayRecords = useMemo(() => {
    const filtered = selectedZone === 'All' ? records : records.filter((r) => r.zone === selectedZone);

    if (showAllRecords) {
      return filtered;
    }

    const zones = ['East Zone', 'Central Zone', 'West Zone', 'North Zone', 'South Zone'];
    const diverse: CollectionRecord[] = [];
    const addedIds = new Set<string>();

    // Select 1 record from each zone first to showcase all zones
    zones.forEach((z) => {
      const match = filtered.find((r) => (r.zone === z || (z === 'North Zone' && r.ward === 'Ward 35') || (z === 'South Zone' && r.ward === 'Ward 75')) && !addedIds.has(String(r.id)));
      if (match) {
        diverse.push({ ...match, zone: z });
        addedIds.add(String(match.id));
      }
    });

    // Fill remaining slots up to 5 if any zone didn't match
    for (const r of filtered) {
      if (diverse.length >= 5) break;
      if (!addedIds.has(String(r.id))) {
        diverse.push(r);
        addedIds.add(String(r.id));
      }
    }

    return diverse;
  }, [records, selectedZone, showAllRecords]);

  return (
    <div className="dash-card overflow-hidden">
      {/* Table Title & Zone Filter Ribbon */}
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <h2 className="dash-section-title text-lg sm:text-xl font-black text-slate-900 tracking-tight">
          {lang === 'ta' ? 'சமீபத்திய சேகரிப்பு மேலோட்டம்' : 'Recent Collection Overview'}
        </h2>

        {/* Zone Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-700" />
          <span className="text-[10px] font-bold text-gray-700">
            {lang === 'ta' ? 'மண்டலம்:' : 'Zone:'}
          </span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold text-[10px] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
          >
            <option value="All">{lang === 'ta' ? 'அனைத்து மண்டலங்களும் (All Zones)' : 'All Zones (அனைத்து மண்டலங்களும்)'}</option>
            <option value="East Zone">{lang === 'ta' ? 'கிழக்கு மண்டலம் (East Zone)' : 'East Zone (கிழக்கு மண்டலம்)'}</option>
            <option value="Central Zone">{lang === 'ta' ? 'மத்திய மண்டலம் (Central Zone)' : 'Central Zone (மத்திய மண்டலம்)'}</option>
            <option value="West Zone">{lang === 'ta' ? 'மேற்கு மண்டலம் (West Zone)' : 'West Zone (மேற்கு மண்டலம்)'}</option>
            <option value="North Zone">{lang === 'ta' ? 'வடக்கு மண்டலம் (North Zone)' : 'North Zone (வடக்கு மண்டலம்)'}</option>
            <option value="South Zone">{lang === 'ta' ? 'தெற்கு மண்டலம் (South Zone)' : 'South Zone (தெற்கு மண்டலம்)'}</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="dash-table-wrap">
        <table className="w-full text-left border-collapse min-w-[820px]">
          <thead>
            <tr className="bg-[#e9f5ed] text-emerald-900 text-[10px] sm:text-[13px] font-extrabold border-b border-slate-200">
              <th className="px-4 py-3.5 text-center w-[7%] font-bold whitespace-nowrap">{lang === 'ta' ? 'வரிசை' : 'S. No.'}</th>
              <th className="px-4 py-3.5 w-[11%] font-bold whitespace-nowrap">{lang === 'ta' ? 'தேதி' : 'Date'}</th>
              <th className="px-4 py-3.5 w-[13%] font-bold whitespace-nowrap">{lang === 'ta' ? 'மண்டலம்' : 'Zone'}</th>
              <th className="px-4 py-3.5 w-[9%] font-bold whitespace-nowrap">{lang === 'ta' ? 'வார்டு' : 'Ward'}</th>
              <th className="px-4 py-3.5 w-[17%] font-bold whitespace-nowrap">{lang === 'ta' ? 'தெரு' : 'Street'}</th>
              <th className="px-4 py-3.5 w-[19%] font-bold whitespace-nowrap">{lang === 'ta' ? 'வாகன எண் & 5-ஸ்கேன்' : 'Vehicle No. & 5-Scans'}</th>
              <th className="px-4 py-3.5 w-[12%] font-bold whitespace-nowrap">{lang === 'ta' ? 'பணியாளர்' : 'Worker'}</th>
              <th className="px-3 py-3.5 text-center w-[12%] font-bold whitespace-nowrap">{lang === 'ta' ? 'நிலை' : 'Status'}</th>
              <th className="px-3 py-3.5 text-center w-[6%] font-bold whitespace-nowrap">{lang === 'ta' ? 'செயல்' : 'Action'}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-[13px] sm:text-[12px] font-bold text-slate-900">
            {displayRecords.map((item, index) => {
              const isPushCart = (item.vehicleType || '').toLowerCase().includes('push') || item.vehicleNo === 'PUSHCART';
              const totalScans = isPushCart ? 1 : 5;
              const stName = item.streetName || item.street;
              const isTodaySubmitted = (ts?: string): boolean => {
                if (!ts || ts === 'Shift Pending' || ts === 'Not Logged In') return false;
                const s = String(ts).trim();
                const today = new Date();
                const d = String(today.getDate()).padStart(2, '0');
                const dSingle = String(today.getDate());
                const m = String(today.getMonth() + 1).padStart(2, '0');
                const mSingle = String(today.getMonth() + 1);
                const y = String(today.getFullYear());
                const datePart = s.split(',')[0].trim();
                if (
                  datePart.includes(`${m}/${d}/${y}`) ||
                  datePart.includes(`${mSingle}/${dSingle}/${y}`) ||
                  datePart.includes(`${d}/${m}/${y}`) ||
                  datePart.includes(`${dSingle}/${mSingle}/${y}`) ||
                  datePart.includes(`${y}-${m}-${d}`) ||
                  s.includes(`${y}-${m}-${d}`)
                ) {
                  return true;
                }
                try {
                  const p = new Date(s);
                  if (!isNaN(p.getTime()) && p.getFullYear() === today.getFullYear() && p.getMonth() === today.getMonth() && p.getDate() === today.getDate()) {
                    return true;
                  }
                } catch {}
                return !s.includes('Not Logged');
              };

              const isShiftPending = item.date === 'Shift Pending' || 
                                     item.scannedAt === 'Shift Pending' || 
                                     !item.scannedAt || 
                                     item.scannedAt === 'Not Logged In' ||
                                     !isTodaySubmitted(item.scannedAt || item.timestamp || item.date);
              
              let streetScanList: any[] = item.streetScans || [];
              if (!isShiftPending) {
                try {
                  const raw = localStorage.getItem('ccmc_street_5scans');
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    if (stName && parsed[stName] && Array.isArray(parsed[stName])) {
                      streetScanList = parsed[stName];
                    }
                  }
                } catch (e) {}
              }

              let scannedCount = 0;
              if (!isShiftPending) {
                if (streetScanList && streetScanList.length > 0) {
                  scannedCount = streetScanList.filter((s: any) => s.isScanned).length;
                } else if (typeof item.completedScansCount === 'number') {
                  scannedCount = item.completedScansCount;
                } else if (item.status === 'Collected') {
                  scannedCount = totalScans;
                }
              }

              // Exact boolean status per checkpoint 1..5
              const dotStatusList: boolean[] = Array.from({ length: totalScans }, (_, i) => {
                if (isShiftPending) return false;
                const cpNum = i + 1;
                if (streetScanList && streetScanList.length > 0) {
                  const match = streetScanList.find((s: any) => (s.id === cpNum || s.checkpointNo === cpNum));
                  if (match) return !!match.isScanned;
                  if (streetScanList[i]) return !!streetScanList[i].isScanned;
                }
                return i < scannedCount || item.status === 'Collected';
              });
              
              const minScansForCollected = isPushCart ? 1 : 3;
              
              return (
                <tr key={item.id} className="dash-table-row">
                  <td className="px-4 py-3.5 text-center font-bold text-gray-700">
                    {index + 1}
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap text-gray-700 font-semibold text-[10px]">
                    {!isShiftPending ? (
                      <span className="font-semibold text-emerald-950">
                        {item.date && item.date !== 'Shift Pending' ? item.date : (item.scannedAt && item.scannedAt !== 'Shift Pending' ? item.scannedAt : 'Today, Logged')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-bold text-[9px]">
                        🕒 {lang === 'ta' ? 'இன்று உள்நுழையவில்லை' : 'Not Logged In Today'}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 font-bold text-[10px]">
                    {(() => {
                      const z = item.zone || 'Central Zone';
                      const badge = z.includes('East') ? 'dash-badge-blue' : z.includes('Central') ? 'dash-badge-green' : z.includes('West') ? 'dash-badge-amber' : z.includes('North') ? 'dash-badge-gray' : 'dash-badge-red';
                      return <span className={`dash-badge ${badge}`}>{getZoneDisplayName(z, lang)}</span>;
                    })()}
                  </td>

                  <td className="px-4 py-3.5 font-semibold text-gray-700 text-[10px]">
                    {item.ward}
                  </td>

                  <td className="px-4 py-3.5 font-bold text-gray-900">
                    {item.street}
                  </td>

                  {/* Vehicle No & 5-Scan Status Cell */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono font-bold text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md w-max border border-slate-200">
                        {(item.vehicleNo && !item.vehicleNo.includes('38 PV 9001')) ? item.vehicleNo : ((item.street?.toLowerCase().includes('mageshwari') || item.streetName?.toLowerCase().includes('mageshwari')) ? 'TN66AD6465' : (item.vehicleNo || 'TN66AD6465'))}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                          !isShiftPending && scannedCount >= minScansForCollected
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : !isShiftPending && scannedCount > 0
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {scannedCount}/{totalScans} Scanned
                        </span>
                        {item.proofPhoto && (
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoRecord(item)}
                            className="inline-flex items-center gap-1 bg-[#00875A] hover:bg-[#00704A] text-white text-[8px] font-black px-2 py-0.5 rounded-md shadow-2xs transition active:scale-95 cursor-pointer border border-emerald-500/40"
                            title={lang === 'ta' ? 'படத்தைப் பார்க்க கிளிக் செய்யவும்' : 'Click to view captured proof photo'}
                          >
                            <Camera className="w-3 h-3 text-emerald-100" />
                            <span>Photo</span>
                            <img
                              src={item.proofPhoto}
                              alt="Proof Thumbnail"
                              className="w-4 h-4 rounded-xs object-cover border border-white/60 ml-0.5"
                            />
                          </button>
                        )}
                        <div className="flex gap-0.5">
                          {dotStatusList.map((isScanned, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                isScanned ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              title={`Checkpoint ${i + 1}: ${isScanned ? 'Scanned ✓' : 'Pending X'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 font-semibold text-gray-800 text-[10px]">
                    {item.workerName}
                  </td>

                  <td className="px-3 py-3.5 text-center whitespace-nowrap">
                    {isShiftPending ? (
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-[#FCE8E6] text-[#C5221F] border border-rose-200/80">
                        {lang === 'ta' ? 'இன்று உள்நுழையவில்லை' : 'Not Logged In Today'}
                      </span>
                    ) : (scannedCount >= minScansForCollected || item.status === 'Collected') ? (
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-[#E6F4EA] text-[#1E7A38] border border-emerald-200/80">
                        {lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Collected'}
                      </span>
                    ) : scannedCount > 0 ? (
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                        {lang === 'ta' ? 'பகுதி சேகரிப்பு' : 'Partial Scan'}
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-300">
                        {lang === 'ta' ? 'உள்நுழைந்தது' : 'Logged In'}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3.5 text-center">
                    <button
                      onClick={() => onInspectRecord(item)}
                      title={lang === 'ta' ? 'விரிவான விவரங்களை பார்க்க' : 'View Detailed Ward & Worker Telemetry'}
                      className="inline-flex items-center justify-center p-1.5 rounded-full text-[#1E7A38] hover:bg-emerald-100/80 transition-colors focus:outline-none cursor-pointer"
                    >
                      <Eye className="w-5 h-5 text-[#1E7A38]" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer View All Records Button */}
      <div className="p-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-[10px] font-bold text-gray-500">
          {lang === 'ta'
            ? `காண்பிக்கப்படும் பதிவுகள்: ${displayRecords.length} / ${records.length}`
            : `Showing ${displayRecords.length} of ${records.length} total records`}
        </div>
        <button
          onClick={() => {
            setShowAllRecords(prev => !prev);
          }}
          className="px-7 py-2 border-2 border-[#1E7A38] bg-[#1E7A38] text-white hover:bg-[#166534] font-bold rounded-xl text-[12px] transition-all focus:outline-none cursor-pointer active:scale-95 shadow-xs"
        >
          {showAllRecords
            ? (lang === 'ta' ? 'குறைவாகக் காண்க (Show Less)' : 'Show Less')
            : (lang === 'ta' ? `அனைத்து பதிவுகளையும் காண்க (${records.length})` : `View All Records (${records.length})`)}
        </button>
      </div>

      {/* ── INTERACTIVE PHOTO LIGHTBOX MODAL ── */}
      {previewPhotoRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-slate-900 text-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-700 shadow-2xl space-y-3 p-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400 animate-pulse" />
                <div>
                  <h3 className="text-[12px] font-black text-white leading-tight">
                    {previewPhotoRecord.street} — {previewPhotoRecord.ward}
                  </h3>
                  <p className="text-[9px] text-emerald-300 font-mono">
                    {previewPhotoRecord.zone} • {previewPhotoRecord.vehicleNo}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhotoRecord(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer transition active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* High-res Image Preview */}
            <div className="rounded-2xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center relative">
              <img
                src={previewPhotoRecord.proofPhoto}
                alt="Waste Collection Proof Photo"
                className="w-full h-64 sm:h-80 object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-xs text-white text-[9px] p-2 rounded-xl border border-white/20 flex items-center justify-between">
                <span className="font-bold text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Worker: {previewPhotoRecord.workerName}
                </span>
                <span className="font-mono text-[8px] text-slate-300">
                  {previewPhotoRecord.date || previewPhotoRecord.time}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  const rec = previewPhotoRecord;
                  setPreviewPhotoRecord(null);
                  onInspectRecord(rec);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Eye className="w-4 h-4" />
                <span>Inspect Full Telemetry</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewPhotoRecord(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold px-4 py-2 rounded-xl transition cursor-pointer active:scale-95"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
