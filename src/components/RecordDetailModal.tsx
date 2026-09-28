import React from 'react';
import {
  X,
  MapPin,
  User,
  Phone,
  Camera,
} from 'lucide-react';
import { CollectionRecord } from '../types';

// Fallback CCMC field-staff details used when a record doesn't carry its own
const DEFAULT_SI = { name: 'S.R.GERALD SATHIYA PUNITHAN', contact: '9442504589' };
const DEFAULT_SS = { name: 'Vibin', contact: '9442504589' };
const DEFAULT_CSS = { name: 'Vengatesh', contact: '8072092485' };

interface RecordDetailModalProps {
  record: CollectionRecord | null;
  onClose: () => void;
  onStatusChange?: (id: string | number, newStatus: 'Collected' | 'Not Collected') => void;
  onViewOnMap?: (record: CollectionRecord) => void;
  onUploadPhoto?: (recordId: string | number, photoUrl: string, timestamp: string) => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  onClose,
  onStatusChange,
  onViewOnMap,
}) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#1E7A38] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#166534]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#166534] rounded-lg text-amber-300">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold leading-tight">
                {record.street} — {record.ward}
              </h3>
              <p className="text-xs text-emerald-200 font-medium">
                {record.zone} • Coimbatore Municipal Corporation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-100 hover:text-white hover:bg-[#166534] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body — SI, SS, CSS details + Picture only */}
        <div className="p-5 overflow-y-auto space-y-3 text-gray-800 text-sm">
          {/* 1. SI Name & Number */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-[#1E7A38] rounded-lg">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-bold">Sanitary Inspector (SI)</div>
                <div className="font-bold text-gray-900">{record.siName || DEFAULT_SI.name}</div>
              </div>
            </div>
            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              <span>{record.siContact || DEFAULT_SI.contact}</span>
            </div>
          </div>

          {/* 2. SS Name & Phone Number */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-[#1E7A38] rounded-lg">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-bold">Sanitary Supervisor (SS)</div>
                <div className="font-bold text-gray-900">{record.ssName || DEFAULT_SS.name}</div>
              </div>
            </div>
            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              <span>{record.ssContact || DEFAULT_SS.contact}</span>
            </div>
          </div>

          {/* 3. CSS Name & Number */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-[#1E7A38] rounded-lg">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-bold">Chief Sanitary Supervisor (CSS)</div>
                <div className="font-bold text-gray-900">{record.cssName || DEFAULT_CSS.name}</div>
              </div>
            </div>
            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              <span>{record.cssContact || DEFAULT_CSS.contact}</span>
            </div>
          </div>

          {/* 4. Picture */}
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700 text-white space-y-2 shadow-md">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Field Proof Picture</span>
            </div>
            {record.proofPhoto ? (
              <div className="rounded-xl overflow-hidden border border-slate-700 max-h-64 bg-black flex items-center justify-center">
                <img
                  src={record.proofPhoto}
                  alt="Field Proof Picture"
                  className="w-full h-56 object-cover"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-600 h-32 flex items-center justify-center text-slate-400 text-xs font-semibold">
                No picture uploaded
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
