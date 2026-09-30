import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  Navigation,
  Send,
  Truck,
  CheckCircle2,
  Filter,
  Search,
  ChevronRight,
  Flame,
  Clock,
  Home,
  FileWarning,
  Sparkles,
  Info,
  Calendar
} from 'lucide-react';
import { FrequentlyNotCollectedItem, NotCoveredReason } from '../types';
import { inSevereTier, inWatchTier } from '../utils/missedStreaks';

interface FrequentlyNotCollectedSectionProps {
  items: FrequentlyNotCollectedItem[];
  lang?: 'en' | 'ta';
  onNavigateToLiveTracking?: (zone?: string, info?: string) => void;
  onShowToast?: (msg: string) => void;
  onUpdateItemStatus?: (id: string, newStatus: 'Pending' | 'Notice Sent' | 'Special Dispatch' | 'Resolved') => void;
}

export const FrequentlyNotCollectedSection: React.FC<FrequentlyNotCollectedSectionProps> = ({
  items: initialItems,
  lang = 'en',
  onNavigateToLiveTracking,
  onShowToast,
  onUpdateItemStatus
}) => {
  const [items, setItems] = useState<FrequentlyNotCollectedItem[]>(initialItems);
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [selectedReason, setSelectedReason] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<FrequentlyNotCollectedItem | null>(null);
  const [actionModalItem, setActionModalItem] = useState<{
    item: FrequentlyNotCollectedItem;
    actionType: 'notice' | 'dispatch' | 'resolve';
  } | null>(null);

  // Filter items based on search and filters
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesZone = selectedZone === 'All' || item.zone === selectedZone;
      const matchesReason = selectedReason === 'All' || item.primaryReason === selectedReason;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.houseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.doorNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.streetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.householderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ward.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesZone && matchesReason && matchesSearch;
    });
  }, [items, selectedZone, selectedReason, searchQuery]);

  // Statistics summaries
  const stats = useMemo(() => {
    const total = items.length;
    // Benchmark tiers: 2-3 consecutive missed days is the watch list,
    // more than 3 days is the severe list.
    const watchStreak = items.filter((i) => inWatchTier(i.consecutiveDaysMissed)).length;
    const severeStreak = items.filter((i) => inSevereTier(i.consecutiveDaysMissed)).length;
    const noticeSent = items.filter((i) => i.actionStatus === 'Notice Sent').length;
    const dispatched = items.filter((i) => i.actionStatus === 'Special Dispatch').length;
    const resolved = items.filter((i) => i.actionStatus === 'Resolved').length;

    // Reason frequency
    const reasonCounts: { [key: string]: number } = {};
    items.forEach((i) => {
      reasonCounts[i.primaryReason] = (reasonCounts[i.primaryReason] || 0) + 1;
    });

    return { total, watchStreak, severeStreak, noticeSent, dispatched, resolved, reasonCounts };
  }, [items]);

  const handleExecuteAction = () => {
    if (!actionModalItem) return;
    const { item, actionType } = actionModalItem;

    let newStatus: FrequentlyNotCollectedItem['actionStatus'] = 'Pending';
    let toastMessage = '';

    if (actionType === 'notice') {
      newStatus = 'Notice Sent';
      toastMessage =
        lang === 'ta'
          ? `📢 ${item.householderName} (${item.doorNo}) க்கு SMS/நேரடி எச்சரிக்கை அறிவிப்பு அனுப்பப்பட்டது!`
          : `📢 Formal SBM Compliance Notice & SMS dispatched to ${item.householderName} (${item.doorNo})!`;
    } else if (actionType === 'dispatch') {
      newStatus = 'Special Dispatch';
      toastMessage =
        lang === 'ta'
          ? `🚚 ${item.streetName} க்கு சிறப்பு BOV வாகனம் உடனடியாக ஒதுக்கப்பட்டது!`
          : `🚚 Special Clearance BOV Unit assigned to ${item.streetName}!`;
    } else if (actionType === 'resolve') {
      newStatus = 'Resolved';
      toastMessage =
        lang === 'ta'
          ? `✅ ${item.doorNo}, ${item.streetName} வெற்றிகரமாக தீர்க்கப்பட்டது!`
          : `✅ House ${item.doorNo}, ${item.streetName} marked as cleared & resolved!`;
    }

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, actionStatus: newStatus } : i))
    );

    if (onUpdateItemStatus) {
      onUpdateItemStatus(item.id, newStatus);
    }

    if (onShowToast) {
      onShowToast(toastMessage);
    }

    setActionModalItem(null);
  };

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case 'House Locked':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
            🔒 {lang === 'ta' ? 'வீடு பூட்டப்பட்டுள்ளது' : 'House Locked'}
          </span>
        );
      case 'Waste Not Separated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-900 border border-rose-200">
            ⚠️ {lang === 'ta' ? 'குப்பை பிரிக்கப்படவில்லை' : 'Waste Not Separated'}
          </span>
        );
      case 'Door Closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-orange-50 text-orange-900 border border-orange-200">
            🚪 {lang === 'ta' ? 'கதவு மூடப்பட்டுள்ளது' : 'Door Closed'}
          </span>
        );
      case 'Refused':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-50 text-red-900 border border-red-200">
            🚫 {lang === 'ta' ? 'சேகரிப்பு மறுக்கப்பட்டது' : 'Refused Collection'}
          </span>
        );
      case 'Vacant House':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
            🏚️ {lang === 'ta' ? 'காலி வீடு' : 'Vacant House'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-100 text-gray-800 border border-gray-200">
            ℹ️ {reason}
          </span>
        );
    }
  };

  const getStatusBadge = (status: FrequentlyNotCollectedItem['actionStatus']) => {
    switch (status) {
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            {lang === 'ta' ? 'தீர்க்கப்பட்டது' : 'Resolved'}
          </span>
        );
      case 'Notice Sent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300">
            <Send className="w-3 h-3" />
            {lang === 'ta' ? 'நோட்டீஸ் அனுப்பப்பட்டது' : 'Notice Sent'}
          </span>
        );
      case 'Special Dispatch':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
            <Truck className="w-3 h-3" />
            {lang === 'ta' ? 'சிறப்பு வாகனம்' : 'BOV Dispatched'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            {lang === 'ta' ? 'நடவடிக்கை நிலுவை' : 'Action Pending'}
          </span>
        );
    }
  };

  return (
    <div id="frequently-not-collected-section" className="bg-white rounded-2xl border border-rose-200/80 shadow-sm overflow-hidden space-y-0">
      
      {/* Header Banner */}
      <div className="bg-white text-slate-900 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 bg-rose-50 rounded-2xl border border-rose-200 flex items-center justify-center shadow-xs flex-shrink-0">
            <Flame className="w-6 h-6 text-rose-600 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                <span>{lang === 'ta' ? 'அடிக்கடி சேகரிக்கப்படாத வீடுகள்' : 'Frequently Not Collected Households'}</span>
              </h2>
              <span className="bg-rose-50 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-rose-200 uppercase tracking-wider">
                {lang === 'ta' ? 'தொடர் கண்காணிப்பு' : 'Chronic Watchlist'}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {lang === 'ta'
                ? 'தொடர்ந்து 3+ நாட்கள் குப்பை சேகரிக்கப்படாத தொடர் சிக்கல் வீடுகள்'
                : 'Repeat uncollected households requiring SBM intervention'}
            </p>
          </div>
        </div>

        {/* Quick Highlights Counters */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-center shadow-2xs">
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">
              {lang === 'ta' ? 'மொத்த வீடுகள்' : 'Total Houses'}
            </span>
            <span className="text-sm sm:text-base font-black text-slate-900">{stats.total}</span>
          </div>

          {/* Benchmark tier: 2-3 consecutive missed days */}
          <div
            title={lang === 'ta'
              ? 'தொடராக 2 முதல் 3 நாட்கள் சேகரிக்கப்படாத வீடுகள்'
              : 'Houses missed on 2 or 3 consecutive days — monitor closely'}
            className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-center shadow-2xs"
          >
            <span className="text-[10px] text-amber-800 block font-bold uppercase tracking-wider">
              {lang === 'ta' ? '2-3 நாட்கள் விடுபட்டவை' : 'Streak 2-3 Days'}
            </span>
            <span className="text-sm sm:text-base font-black text-amber-700">{stats.watchStreak}</span>
          </div>

          {/* Benchmark tier: more than 3 consecutive missed days */}
          <div
            title={lang === 'ta'
              ? 'தொடராக 3 நாட்களுக்கு மேல் சேகரிக்கப்படாத வீடுகள்'
              : 'Houses missed on more than 3 consecutive days — needs special BOV clearance'}
            className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5 text-center shadow-2xs"
          >
            <span className="text-[10px] text-rose-800 block font-bold uppercase tracking-wider">
              {lang === 'ta' ? '3+ நாட்கள் விடுபட்டவை' : 'Streak > 3 Days'}
            </span>
            <span className="text-sm sm:text-base font-black text-rose-700">{stats.severeStreak}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'ta'
                ? 'வீட்டு எண், தெரு, முகவரி தேடவும்...'
                : 'Search House ID, Door No, Street, Ward...'
            }
            className="w-full pl-9 pr-4 py-2 bg-white text-xs text-slate-800 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap justify-between md:justify-end">
          {/* Zone filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-600 flex-shrink-0">
              {lang === 'ta' ? 'மண்டலம்:' : 'Zone:'}
            </span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
            >
              <option value="All">{lang === 'ta' ? 'அனைத்து மண்டலங்கள்' : 'All Zones'}</option>
              <option value="North Zone">{lang === 'ta' ? 'வடக்கு மண்டலம் (North Zone)' : 'North Zone (வடக்கு மண்டலம்)'}</option>
              <option value="Central Zone">{lang === 'ta' ? 'மத்திய மண்டலம் (Central Zone)' : 'Central Zone (மத்திய மண்டலம்)'}</option>
              <option value="South Zone">{lang === 'ta' ? 'தெற்கு மண்டலம் (South Zone)' : 'South Zone (தெற்கு மண்டலம்)'}</option>
              <option value="West Zone">{lang === 'ta' ? 'மேற்கு மண்டலம் (West Zone)' : 'West Zone (மேற்கு மண்டலம்)'}</option>
              <option value="East Zone">{lang === 'ta' ? 'கிழக்கு மண்டலம் (East Zone)' : 'East Zone (கிழக்கு மண்டலம்)'}</option>
            </select>
          </div>

          {/* Reason filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-600 flex-shrink-0">
              {lang === 'ta' ? 'காரணம்:' : 'Reason:'}
            </span>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
            >
              <option value="All">{lang === 'ta' ? 'அனைத்து காரணங்கள்' : 'All Reasons'}</option>
              <option value="House Locked">House Locked (பூட்டப்பட்டுள்ளது)</option>
              <option value="Waste Not Separated">Waste Not Separated (பிரிக்கவில்லை)</option>
              <option value="Door Closed">Door Closed (கதவு மூடல்)</option>
              <option value="Refused">Refused (மறுப்பு)</option>
              <option value="Vacant House">Vacant House (காலி வீடு)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main List / Table */}
      <div className="divide-y divide-slate-100 overflow-x-auto">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
            <p className="text-sm font-bold text-slate-700">
              {lang === 'ta' ? 'பொருத்தமான பகுதிகள் இல்லை' : 'No frequently missed locations found'}
            </p>
            <p className="text-xs text-slate-500">
              {lang === 'ta'
                ? 'தேர்ந்தெடுக்கப்பட்ட வடிகட்டிகளில் எந்த விடுபட்ட வீடுகளும் இல்லை.'
                : 'All collection rounds are operating smoothly under current filter criteria.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 hover:bg-rose-50/20 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
            >
              {/* Left Details */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Consecutive Streak Pill */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-600 text-white shadow-2xs">
                    <Clock className="w-3 h-3 text-rose-200" />
                    <span>
                      {item.consecutiveDaysMissed} {lang === 'ta' ? 'நாட்கள் தொடர் விடுபடல்' : 'Days Uncollected'}
                    </span>
                  </span>

                  {/* House ID */}
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {item.houseId}
                  </span>

                  {/* Reason Badge */}
                  {getReasonBadge(item.primaryReason)}

                  {/* Status Badge */}
                  {getStatusBadge(item.actionStatus)}
                </div>

                {/* Address & Householder */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <div className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                    <MapPin className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span className="font-extrabold text-rose-950">Door #{item.doorNo}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-800 truncate">{item.streetName}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md self-start sm:self-auto">
                    {item.ward}, {item.zone}
                  </span>
                </div>

                {/* Resident & Supervisor Meta */}
                <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{item.householderName}</span>
                    <a
                      href={`tel:${item.householderPhone || '9842101234'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const targetPhone = item.householderPhone || '9842101234';
                        if (onShowToast) {
                          onShowToast(
                            lang === 'ta'
                              ? `📞 ${item.householderName} (${targetPhone}) எண்ணிற்கு அழைப்பு மேற்கொள்ளப்படுகிறது...`
                              : `📞 Calling ${item.householderName} at ${targetPhone}...`
                          );
                        }
                        window.location.href = `tel:${targetPhone}`;
                      }}
                      className="text-emerald-700 hover:text-emerald-800 font-extrabold ml-1 flex items-center gap-1 hover:underline bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/80 cursor-pointer shadow-2xs"
                      title={lang === 'ta' ? 'அழைப்பு செய்ய கிளிக் செய்க' : 'Click to call resident'}
                    >
                      <Phone className="w-3 h-3 text-emerald-700 animate-pulse" />
                      <span>{item.householderPhone || '9842101234'}</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Supervisor: <strong className="text-slate-700">{item.supervisorName}</strong></span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Last Logged: <strong>{item.lastMissedDate}</strong> ({item.totalMissedThisMonth} missed this month)
                  </div>
                </div>

                {/* Worker Obstacle Remarks */}
                {item.remarks && (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2 text-xs text-amber-950 font-medium flex items-start gap-1.5">
                    <FileWarning className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="line-clamp-2">{item.remarks}</p>
                  </div>
                )}
              </div>

              {/* Right Action Controls */}
              <div className="flex items-center gap-2 self-start lg:self-center flex-wrap sm:flex-nowrap flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 w-full lg:w-auto justify-end">
                {/* Notice Action */}
                <button
                  type="button"
                  onClick={() => setActionModalItem({ item, actionType: 'notice' })}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-xl border border-purple-200 transition cursor-pointer flex items-center gap-1.5"
                  title="Send Resident SBM Notice / SMS"
                >
                  <Send className="w-3.5 h-3.5 text-purple-600" />
                  <span>{lang === 'ta' ? 'நோட்டீஸ் அனுப்பு' : 'Send Notice'}</span>
                </button>

                {/* BOV Special Dispatch */}
                <button
                  type="button"
                  onClick={() => setActionModalItem({ item, actionType: 'dispatch' })}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-xl border border-blue-200 transition cursor-pointer flex items-center gap-1.5"
                  title="Dispatch Special BOV Squad"
                >
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>{lang === 'ta' ? 'வாகனம் அனுப்பு' : 'Dispatch BOV'}</span>
                </button>

                {/* Track on GPS */}
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateToLiveTracking) {
                      onNavigateToLiveTracking(item.zone, `House #${item.doorNo}, ${item.streetName}`);
                    }
                  }}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition cursor-pointer flex items-center gap-1.5"
                  title="View on GPS Map"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'ta' ? 'GPS வரைபடம்' : 'Track GPS'}</span>
                </button>

                {/* Mark Resolved Button */}
                {item.actionStatus !== 'Resolved' && (
                  <button
                    type="button"
                    onClick={() => setActionModalItem({ item, actionType: 'resolve' })}
                    className="px-3 py-1.5 bg-[#1E7A38] hover:bg-[#166534] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    title="Mark obstacle resolved"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>{lang === 'ta' ? 'முடிந்தது' : 'Resolve'}</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Execution Confirmation Modal */}
      {actionModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-center">
            <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              {actionModalItem.actionType === 'notice' && <Send className="w-7 h-7" />}
              {actionModalItem.actionType === 'dispatch' && <Truck className="w-7 h-7" />}
              {actionModalItem.actionType === 'resolve' && <CheckCircle2 className="w-7 h-7" />}
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                {actionModalItem.actionType === 'notice' && (lang === 'ta' ? 'நோட்டீஸ் அனுப்ப உறுதி செய்க' : 'Dispatch SBM Warning Notice')}
                {actionModalItem.actionType === 'dispatch' && (lang === 'ta' ? 'சிறப்பு வாகனம் அனுப்ப உறுதி செய்க' : 'Assign Special Clearance Squad')}
                {actionModalItem.actionType === 'resolve' && (lang === 'ta' ? 'தீர்க்கப்பட்டதாக குறிக்கவும்' : 'Confirm Obstacle Resolution')}
              </h3>
              <p className="text-xs text-slate-600">
                {actionModalItem.item.householderName} • Door #{actionModalItem.item.doorNo}, {actionModalItem.item.streetName} ({actionModalItem.item.ward})
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-left border border-slate-200 text-xs space-y-1 text-slate-700">
              <p><strong>{lang === 'ta' ? 'விடுபட்ட நாட்கள்:' : 'Consecutive Missed Days:'}</strong> {actionModalItem.item.consecutiveDaysMissed} days</p>
              <p><strong>{lang === 'ta' ? 'காரணம்:' : 'Primary Obstacle:'}</strong> {actionModalItem.item.primaryReason}</p>
              <p><strong>{lang === 'ta' ? 'மேற்பார்வையாளர்:' : 'Supervisor In-Charge:'}</strong> {actionModalItem.item.supervisorName}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModalItem(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                {lang === 'ta' ? 'ரத்துசெய்' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === 'ta' ? 'உறுதி செய்' : 'Confirm Action'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
