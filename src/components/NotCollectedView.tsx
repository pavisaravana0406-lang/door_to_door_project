import React, { useState } from 'react';
import { AlertTriangle, XCircle, Search, Filter, Eye, RefreshCw, MapPin, Truck, ArrowLeft, CheckCircle2, Phone, AlertCircle, FileSpreadsheet, Lock, Ban, Milestone, HelpCircle } from 'lucide-react';
import { CollectionRecord } from '../types';
import { householdNotCoveredIcon, householdNotCoveredFallbackIcon } from '../constants/branding';

interface NotCollectedViewProps {
  records: CollectionRecord[];
  onInspectRecord: (record: CollectionRecord) => void;
  onBackToOverview?: () => void;
  onNavigateToCovered?: () => void;
  lang?: 'en' | 'ta';
}

export const NotCollectedView: React.FC<NotCollectedViewProps> = ({
  records,
  onInspectRecord,
  onBackToOverview,
  onNavigateToCovered,
  lang = 'en',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('All');
  const [reasonFilter, setReasonFilter] = useState('All');

  const pendingRecords = records.filter(
    (r) => r.status === 'Not Collected'
  );
  const collectedCount = records.filter(r => r.status === 'Collected').length;

  const lockedCount = pendingRecords.filter(r => r.reasonIfNotCollected?.toLowerCase().includes('lock') || r.reasonIfNotCollected?.toLowerCase().includes('closed') || r.remarks?.toLowerCase().includes('lock')).length;
  const refusedCount = pendingRecords.filter(r => r.reasonIfNotCollected?.toLowerCase().includes('segregat') || r.reasonIfNotCollected?.toLowerCase().includes('refus') || r.remarks?.toLowerCase().includes('refus')).length;
  const narrowLaneCount = pendingRecords.filter(r => r.reasonIfNotCollected?.toLowerCase().includes('narrow') || r.reasonIfNotCollected?.toLowerCase().includes('road') || r.reasonIfNotCollected?.toLowerCase().includes('obstacle') || r.remarks?.toLowerCase().includes('narrow')).length;
  const otherReasonCount = pendingRecords.length - lockedCount - refusedCount - narrowLaneCount > 0
    ? pendingRecords.length - lockedCount - refusedCount - narrowLaneCount
    : 0;

  const filtered = pendingRecords.filter((r) => {
    const matchesSearch =
      r.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.workerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = selectedZone === 'All' || r.zone === selectedZone;
    const matchesReason = reasonFilter === 'All' || (r.reasonIfNotCollected && r.reasonIfNotCollected.includes(reasonFilter));
    return matchesSearch && matchesZone && matchesReason;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white rounded-2xl p-6 border border-rose-200/90 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-rose-600/60 bg-white p-0.5 flex-shrink-0 shadow-sm flex items-center justify-center">
            <img
              src={householdNotCoveredIcon}
              alt="Total Household Not Collected"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (e.currentTarget.src !== householdNotCoveredFallbackIcon) {
                  e.currentTarget.src = householdNotCoveredFallbackIcon;
                }
              }}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              {onBackToOverview && (
                <button
                  onClick={onBackToOverview}
                  className="text-xs text-gray-500 hover:text-rose-700 font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> {lang === 'ta' ? 'டாஷ்போர்டிற்குத் திரும்பு' : 'Back to Dashboard'}
                </button>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
              {lang === 'ta' ? 'சேகரிக்கப்படாத வீடுகள் அறிக்கை' : 'Total Household Not Collected Reports'}
            </h1>
          </div>
        </div>

        {/* Action / Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-rose-50 border border-rose-200 px-4 py-3 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-[#C5221F]" />
            <div>
              <div className="text-[11px] text-rose-800 font-bold uppercase tracking-wider">
                {lang === 'ta' ? 'சேகரிக்கப்படாத வீடுகள்' : 'Not Collected Count'}
              </div>
              <div className="text-2xl font-black text-[#C5221F]">
                {pendingRecords.length.toLocaleString()}{' '}
                <span className="text-xs font-normal text-gray-500">
                  {lang === 'ta' ? 'வீடுகள்' : 'Households'}
                </span>
              </div>
            </div>
          </div>

          {onNavigateToCovered && (
            <button
              onClick={onNavigateToCovered}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-3.5 py-3 rounded-2xl transition flex items-center gap-2 cursor-pointer"
            >
              <span>
                {lang === 'ta'
                  ? `சேகரிக்கப்பட்டவை (${collectedCount.toLocaleString()})`
                  : `View Collected (${collectedCount.toLocaleString()})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Missed Reason Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold">
              {lang === 'ta' ? 'வீடு பூட்டப்பட்டுள்ளது' : 'House Closed / Locked'}
            </div>
            <div className="text-xl font-black text-rose-900">
              {lockedCount} {lang === 'ta' ? 'வீடுகள்' : 'Households'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Ban className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold">
              {lang === 'ta' ? 'கழிவு பிரிக்கப்படாத மறுப்பு' : 'Unsegregated Waste Refused'}
            </div>
            <div className="text-xl font-black text-amber-900">
              {refusedCount} {lang === 'ta' ? 'வீடுகள்' : 'Households'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-orange-50 text-orange-700 rounded-xl">
            <Milestone className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold">
              {lang === 'ta' ? 'குறுகிய சந்து' : 'Narrow Lane'}
            </div>
            <div className="text-xl font-black text-orange-900">
              {narrowLaneCount} {lang === 'ta' ? 'பகுதிகள்' : 'Locations'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold">
              {lang === 'ta' ? 'பிற காரணங்கள்' : 'Other Reason'}
            </div>
            <div className="text-xl font-black text-blue-900">
              {otherReasonCount} {lang === 'ta' ? 'பகுதிகள்' : 'Locations'}
            </div>
          </div>
        </div>
      </div>

      {/* Uncollected Vehicles Summary Banner (Zone-wise Vehicle Tracking) */}
      <div className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-rose-700" />
          <h3 className="text-sm font-black text-rose-950 uppercase tracking-tight">
            {lang === 'ta' ? 'மண்டலம் வாரியாக இன்னும் குப்பை சேகரிக்காத வாகனங்கள்' : 'Not Collected Vehicles by Zones'}
          </h3>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-200 text-rose-900 ml-auto">
            LIVE UNCOLLECTED VEHICLE TRACKER
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {['South Zone', 'East Zone', 'West Zone', 'North Zone', 'Central Zone'].map((z) => {
            const zonePending = pendingRecords.filter((r) => r.zone === z);
            return (
              <div key={z} className="bg-white p-3 rounded-xl border border-rose-200/80 shadow-2xs space-y-1">
                <div className="text-[11px] font-extrabold text-gray-500 uppercase">{z}</div>
                <div className="text-xs font-black text-rose-800">
                  {zonePending.length} {lang === 'ta' ? 'வீடுகள் நிலுவை' : 'Households Missed'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={
              lang === 'ta'
                ? 'சேகரிக்கப்படாத தெரு, வார்டு, வாகனம் அல்லது பணியாளர் பெயரைத் தேடவும்...'
                : 'Search uncollected street, ward, vehicle or worker name...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5221F] font-medium text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#C5221F] text-xs sm:text-sm cursor-pointer"
          >
            <option value="All">{lang === 'ta' ? 'அனைத்து மண்டலங்கள்' : 'All Zones'}</option>
            <option value="North Zone">{lang === 'ta' ? 'வடக்கு மண்டலம் (North Zone)' : 'North Zone'}</option>
            <option value="Central Zone">{lang === 'ta' ? 'மத்திய மண்டலம் (Central Zone)' : 'Central Zone'}</option>
            <option value="South Zone">{lang === 'ta' ? 'தெற்கு மண்டலம் (South Zone)' : 'South Zone'}</option>
            <option value="West Zone">{lang === 'ta' ? 'மேற்கு மண்டலம் (West Zone)' : 'West Zone'}</option>
            <option value="East Zone">{lang === 'ta' ? 'கிழக்கு மண்டலம் (East Zone)' : 'East Zone'}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs font-bold text-gray-600">
            {lang === 'ta' ? (
              <>
                மொத்தம் <span className="text-rose-700 font-extrabold">{filtered.length}</span> முன்னுரிமை நிலுவை கழிவு பகுதிகள்
              </>
            ) : (
              <>
                Showing <span className="text-rose-700 font-extrabold">{filtered.length}</span> Priority Pending Waste Locations
              </>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FCE8E6] text-[#C5221F] text-xs sm:text-sm font-bold border-b border-gray-200">
                <th className="px-5 py-3.5">{lang === 'ta' ? 'தேதி & நேரம்' : 'Date & Time'}</th>
                <th className="px-5 py-3.5">{lang === 'ta' ? 'மண்டலம்' : 'Zone'}</th>
                <th className="px-5 py-3.5">{lang === 'ta' ? 'வார்டு' : 'Ward'}</th>
                <th className="px-5 py-3.5">{lang === 'ta' ? 'தெரு முகவரி' : 'Street Address'}</th>
                <th className="px-5 py-3.5">{lang === 'ta' ? 'வாகன எண் & வகை' : 'Vehicle No. & Type'}</th>
                <th className="px-5 py-3.5">{lang === 'ta' ? 'காரணம் / தடை' : 'Reason / Obstacle'}</th>
                <th className="px-5 py-3.5">{lang === 'ta' ? 'பணியாளர் பெயர்' : 'Worker Name'}</th>
                <th className="px-5 py-3.5 text-center">{lang === 'ta' ? 'நிலை' : 'Status'}</th>
                <th className="px-5 py-3.5 text-center">{lang === 'ta' ? 'நடவடிக்கைகள்' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-800">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-rose-50/30 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-gray-700 text-xs">{item.date} • {item.timestamp || '09:15 AM'}</td>
                  <td className="px-5 py-3.5 font-bold text-gray-900">{item.zone}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-700">{item.ward}</td>
                  <td className="px-5 py-3.5 font-bold text-gray-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#C5221F] flex-shrink-0" />
                    <span>{item.street}</span>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-gray-900 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                      <span className="bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded font-black">{item.vehicleNo || 'TN66AD6465'}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-sans font-semibold mt-0.5">{item.vehicleType || 'Tata Ace'}</div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-rose-900 font-bold max-w-[220px]">
                    <span className="bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md block truncate">
                      {item.reasonIfNotCollected || (lang === 'ta' ? 'பிற காரணங்கள்' : 'Other Reason')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-gray-800">{item.workerName}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-[#FCE8E6] text-[#C5221F] border border-rose-200">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{lang === 'ta' ? 'சேகரிக்கப்படவில்லை' : 'Not Collected'}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onInspectRecord(item)}
                        title="View Incident Details"
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#C5221F] bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{lang === 'ta' ? 'விவரங்கள்' : 'Details'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
