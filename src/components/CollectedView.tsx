import React, { useState, useRef } from 'react';
import { Truck, CheckCircle2, Search, Filter, Eye, ShieldCheck, MapPin, Download, ArrowLeft, Layers, Users, Calendar, Sparkles, Home } from 'lucide-react';
import { CollectionRecord } from '../types';
import { householdCoveredIcon, householdCoveredFallbackIcon } from '../constants/branding';

interface CollectedViewProps {
  records: CollectionRecord[];
  onInspectRecord: (record: CollectionRecord) => void;
  onBackToOverview?: () => void;
  onNavigateToNotCovered?: () => void;
  lang?: 'en' | 'ta';
}

export const CollectedView: React.FC<CollectedViewProps> = ({
  records,
  onInspectRecord,
  onBackToOverview,
  onNavigateToNotCovered,
  lang = 'en',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('All');
  const tableRef = useRef<HTMLDivElement>(null);

  const handleKpiCardClick = (zone: string = 'All') => {
    setSelectedZone(zone);
    setSearchTerm('');
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const collectedRecords = records.filter(
    (r) => r.status === 'Collected'
  );
  const notCollectedCount = records.filter(r => r.status === 'Not Collected').length;
  const uniqueWorkersCount = new Set(records.map(r => r.workerName).filter(Boolean)).size;
  const uniqueWardsCount = new Set(records.map(r => r.ward).filter(Boolean)).size;

  const filtered = collectedRecords.filter((r) => {
    const matchesSearch =
      r.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.workerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = selectedZone === 'All' || r.zone === selectedZone;
    return matchesSearch && matchesZone;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Summary */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-200/90 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500/60 bg-white p-0.5 flex-shrink-0 shadow-sm flex items-center justify-center">
            <img
              src={householdCoveredIcon}
              alt="Total Household Collected"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (e.currentTarget.src !== householdCoveredFallbackIcon) {
                  e.currentTarget.src = householdCoveredFallbackIcon;
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
                  className="text-xs text-gray-500 hover:text-[#1E7A38] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> {lang === 'ta' ? 'டாஷ்போர்டிற்குத் திரும்பு' : 'Back to Dashboard'}
                </button>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
              {lang === 'ta' ? 'மொத்த வீட்டுச் சேகரிப்பு விவரங்கள்' : 'Total Household Collected Details'}
            </h1>
          </div>
        </div>

        {/* Action / Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-[#1E7A38]" />
            <div>
              <div className="text-[11px] text-[#1E7A38] font-bold uppercase tracking-wider">
                {lang === 'ta' ? 'சேகரிக்கப்பட்ட வீடுகள்' : 'Collected Count'}
              </div>
              <div className="text-2xl font-black text-[#1E7A38]">
                {collectedRecords.length.toLocaleString()}{' '}
                <span className="text-xs font-normal text-gray-500">
                  {lang === 'ta' ? 'வீடுகள்' : 'Households'}
                </span>
              </div>
            </div>
          </div>

          {onNavigateToNotCovered && (
            <button
              onClick={onNavigateToNotCovered}
              className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold px-3.5 py-3 rounded-2xl transition flex items-center gap-2 cursor-pointer"
            >
              <span>
                {lang === 'ta'
                  ? `சேகரிக்கப்படாதவை (${notCollectedCount.toLocaleString()})`
                  : `View Not Collected (${notCollectedCount.toLocaleString()})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => handleKpiCardClick('All')}
          title={lang === 'ta' ? 'முழு பட்டியலைப் பார்க்க கிளிக் செய்யவும்' : 'Click to view full collected list'}
          className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3.5 text-left cursor-pointer transition hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        >
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold">
              {lang === 'ta' ? 'வீடுகள் சேகரிக்கப்பட்ட வீதம்' : 'Household Collected %'}
            </div>
            <div className="text-xl font-black text-emerald-900">
              {records.length > 0 ? `${((collectedRecords.length / records.length) * 100).toFixed(1)}%` : '0.0%'}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleKpiCardClick('All')}
          title={lang === 'ta' ? 'பணியாளர் பட்டியலைப் பார்க்க கிளிக் செய்யவும்' : 'Click to view worker collections'}
          className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3.5 text-left cursor-pointer transition hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold">
              {lang === 'ta' ? 'தூய்மைப் பணியாளர்கள்' : 'Active Sanitary Workers'}
            </div>
            <div className="text-xl font-black text-blue-900">
              {uniqueWorkersCount} {lang === 'ta' ? 'பணியாளர்' : uniqueWorkersCount === 1 ? 'Worker' : 'Workers'}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleKpiCardClick('All')}
          title={lang === 'ta' ? 'வார்டு பட்டியலைப் பார்க்க கிளிக் செய்யவும்' : 'Click to view ward collections'}
          className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3.5 text-left cursor-pointer transition hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold">
              {lang === 'ta' ? 'சேகரிக்கப்பட்ட வார்டுகள்' : 'Active Wards Cleared'}
            </div>
            <div className="text-xl font-black text-amber-900">
              {uniqueWardsCount} {lang === 'ta' ? 'வார்டுகள்' : 'Wards'}
            </div>
          </div>
        </button>
      </div>

      {/* Collected Vehicles Summary Banner (Zone-wise Vehicle Tracking) */}
      <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-700" />
          <h3 className="text-sm font-black text-emerald-950 uppercase tracking-tight">
            {lang === 'ta' ? 'மண்டலம் வாரியாக சேகரிக்கப்பட்ட வாகனங்கள்' : 'Collected Vehicles by Zones'}
          </h3>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 ml-auto">
            {lang === 'ta' ? 'நேரடி சேகரிப்பு வாகன கண்காணிப்பு' : 'Live Collected Vehicle Tracker'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {['South Zone', 'East Zone', 'West Zone', 'North Zone', 'Central Zone'].map((z) => {
            const zoneCollected = collectedRecords.filter((r) => r.zone === z);
            return (
              <div key={z} className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-2xs space-y-1">
                <div className="text-[11px] font-extrabold text-gray-500 uppercase">{z}</div>
                <div className="text-xs font-black text-[#1E7A38]">
                  {zoneCollected.length} {lang === 'ta' ? 'வீடுகள் சேகரிக்கப்பட்டது' : 'Households Collected'}
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
                ? 'தெரு, வார்டு அல்லது பணியாளர் பெயரைத் தேடவும்...'
                : 'Search collected street, ward or worker name...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1E7A38] font-medium text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-[#1E7A38] text-xs sm:text-sm cursor-pointer"
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
      <div ref={tableRef} className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#E9F5ED] text-[#1E7A38] text-xs sm:text-sm font-bold border-b border-gray-200">
                <th className="px-5 py-3.5">{lang === 'ta' ? 'தேதி & நேரம்' : 'Date & Time'}</th>
                <th className="px-5 py-3.5">{lang === 'ta' ? 'மண்டலம்' : 'Zone'}</th>
                <th className="px-5 py-3.5">{lang === 'ta' ? 'வார்டு' : 'Ward'}</th>
                <th className="px-5 py-3.5">{lang === 'ta' ? 'தெரு முகவரி' : 'Street Address'}</th>
                <th className="px-5 py-3.5">{lang === 'ta' ? 'ஒதுக்கப்பட்ட பணியாளர்' : 'Assigned Worker'}</th>
                <th className="px-5 py-3.5 text-center">{lang === 'ta' ? 'நிலை' : 'Status'}</th>
                <th className="px-5 py-3.5 text-center">{lang === 'ta' ? 'விவரங்கள்' : 'Details'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-800">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-gray-700 text-xs">{item.date} • {item.timestamp || '08:45 AM'}</td>
                  <td className="px-5 py-3.5 font-bold text-gray-900">{item.zone}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-700">{item.ward}</td>
                  <td className="px-5 py-3.5 font-bold text-gray-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#1E7A38] flex-shrink-0" />
                    <span>{item.street}</span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-gray-800">{item.workerName}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-[#E9F5ED] text-[#1E7A38] border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{lang === 'ta' ? 'சேகரிக்கப்பட்டது' : 'Covered'}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => onInspectRecord(item)}
                      title="View Detailed Inspection & Photo Proof"
                      className="px-3 py-1 rounded-xl text-xs font-bold text-[#1E7A38] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1 mx-auto"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#1E7A38]" />
                      <span>{lang === 'ta' ? 'விவரங்கள்' : 'Details'}</span>
                    </button>
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
