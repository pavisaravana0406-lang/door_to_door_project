import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  ArrowRight, 
  X,
  LayoutDashboard,
  Lock,
  MapPin
} from 'lucide-react';
import { CoverageStatus } from '../types';

interface DustbinAnimationModalProps {
  isOpen: boolean;
  coverageStatus: CoverageStatus;
  houseId: string;
  doorNo: string;
  streetName: string;
  gpsCoordinates?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  ward?: string;
  lang?: 'en' | 'ta';
  assignedVehicleId?: string;
  onClose: () => void;
}

// Clean any full URL or prefix into a pure alphanumeric House ID
const cleanHouseId = (rawId: string): string => {
  if (!rawId) return 'HID100101';
  let cleaned = rawId.trim();
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    cleaned = parts[parts.length - 1].trim();
  }
  if (cleaned.includes('?')) {
    cleaned = cleaned.split('?')[0].trim();
  }
  return cleaned || 'HID100101';
};

export const DustbinAnimationModal: React.FC<DustbinAnimationModalProps> = ({
  isOpen,
  coverageStatus,
  houseId,
  doorNo,
  streetName,
  ward = 'Ward 12',
  lang = 'en',
  assignedVehicleId = 'v-push-cart',
  onClose
}) => {
  const isPushCart = !assignedVehicleId || assignedVehicleId === 'v-push-cart' || assignedVehicleId.includes('push');
  const [isActive, setIsActive] = useState(false);
  const displayHouseId = cleanHouseId(houseId);

  const triggerAnimation = () => {
    setIsActive(false);
    setTimeout(() => {
      setIsActive(true);
    }, 50);
  };

  useEffect(() => {
    if (isOpen) {
      triggerAnimation();
    } else {
      setIsActive(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isCovered = coverageStatus === 'Covered';
  const isPartiallyCovered = coverageStatus === 'Partially Covered';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
        
        {/* INJECT CCMC SMART TRASH COLLECTION & NOT COVERED ANIMATION CSS */}
        <style>{`
          /* --- MAIN BUTTON / ANIMATION CONTAINER --- */
          .trash-button {
            position: relative;
            width: 140px;
            height: 140px;
            background: transparent;
            border: none;
            cursor: pointer;
            outline: none;
            transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto;
          }

          .trash-button:hover {
            transform: scale(1.05);
          }

          .trash-button:active {
            transform: scale(0.95);
          }

          /* --- WRAPPER FOR ENTIRE BIN TO FADE OUT COMPLETELY --- */
          .entire-bin-wrapper {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            transition: opacity 0.3s ease;
          }

          /* --- LIGHT GREEN PREMIUM BIN --- */
          .bin-container {
            position: absolute;
            bottom: 10px;
            left: 40px;
            width: 60px;
            height: 70px;
            z-index: 2;
            transform-origin: bottom center;
          }

          .bin {
            position: absolute;
            width: 100%;
            height: 100%;
            background: linear-gradient(145deg, #81c784 0%, #4caf50 100%);
            border-radius: 0 0 10px 10px;
            box-shadow: 
              inset 2px 2px 5px rgba(255, 255, 255, 0.6), 
              inset -3px -3px 5px rgba(46, 125, 50, 0.5),      
              0 8px 15px rgba(0, 0, 0, 0.08);               
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }

          .ccmc-text {
            font-size: 14px;
            font-weight: 900;
            color: #ffffff; 
            letter-spacing: 1px;
            margin-top: 2px;
            text-shadow: 
              1px 1px 2px rgba(46, 125, 50, 0.8), 
              -1px -1px 1px rgba(255, 255, 255, 0.6);
          }

          .recycle-mini {
            font-size: 16px;
            color: #ffffff;
            line-height: 1;
            text-shadow: 1px 1px 2px rgba(46, 125, 50, 0.8);
          }

          /* --- LIGHT GREEN PREMIUM LID --- */
          .lid {
            position: absolute;
            bottom: 82px;
            left: 35px;
            width: 70px;
            height: 12px;
            background: linear-gradient(145deg, #81c784 0%, #4caf50 100%);
            border-radius: 10px;
            z-index: 3;
            box-shadow: 
              inset 2px 2px 4px rgba(255, 255, 255, 0.6),
              inset -2px -2px 4px rgba(46, 125, 50, 0.5),
              0 4px 6px rgba(0, 0, 0, 0.08);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            transform-origin: right bottom;
          }

          .lid::after {
            content: '';
            position: absolute;
            top: -7px;
            left: 25px;
            width: 20px;
            height: 7px;
            background: linear-gradient(145deg, #81c784, #4caf50);
            border-radius: 5px 5px 0 0;
            box-shadow: 
              inset 1px 1px 2px rgba(255, 255, 255, 0.6),
              inset -1px 0px 2px rgba(46, 125, 50, 0.5);
          }

          /* --- 6 REAL GARBAGE ITEMS --- */
          .garbage-item {
            position: absolute;
            opacity: 0;
            z-index: 1; 
            font-size: 20px; 
            pointer-events: none;
          }

          .garbage-item:nth-child(1) { top: -20px; left: 0px; font-size: 22px; } 
          .garbage-item:nth-child(2) { top: -10px; left: 90px; font-size: 18px; } 
          .garbage-item:nth-child(3) { top: -30px; left: 50px; font-size: 24px; } 
          .garbage-item:nth-child(4) { top: 0px; left: -10px; font-size: 20px; } 
          .garbage-item:nth-child(5) { top: -15px; left: 100px; font-size: 22px; } 
          .garbage-item:nth-child(6) { top: -40px; left: 70px; font-size: 18px; } 

          /* --- GPAY STYLE SUCCESS TICK CONTAINER --- */
          .gpay-success-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 140px;
            height: 140px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transform: scale(0.5);
            pointer-events: none;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          /* Circular Green Badge mimicking GPay */
          .gpay-circle {
            width: 65px;
            height: 65px;
            background-color: #34a853; /* Google Green */
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: 0 6px 15px rgba(52, 168, 83, 0.35);
            position: relative;
          }

          /* Smooth SVG Checkmark Animation */
          .gpay-tick {
            width: 35px;
            height: 35px;
            stroke: #ffffff;
            stroke-width: 4;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
          }

          .gpay-text {
            font-size: 10px;
            font-weight: 900;
            color: #34a853;
            font-family: 'Arial Black', sans-serif;
            margin-top: 8px;
            letter-spacing: 0.5px;
            text-align: center;
            text-transform: uppercase;
            white-space: nowrap;
          }

          /* --- ACTIVE ANIMATIONS TRIGGER --- */
          
          /* Step 1: Lid opens and closes */
          .trash-button.active .lid {
            animation: openAndCloseLid 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }

          .trash-button.active .bin-container {
            animation: binImpact 0.25s ease-out 0.35s;
          }

          /* Garbage Tossing */
          .trash-button.active .garbage-item:nth-child(1) { animation: tossRightArc 0.4s ease-in forwards 0.05s; }
          .trash-button.active .garbage-item:nth-child(2) { animation: tossLeftArc 0.4s ease-in forwards 0.1s; }
          .trash-button.active .garbage-item:nth-child(3) { animation: dropCenter 0.3s ease-in forwards 0.15s; }
          .trash-button.active .garbage-item:nth-child(4) { animation: tossRightArc 0.4s ease-in forwards 0.2s; }
          .trash-button.active .garbage-item:nth-child(5) { animation: tossLeftArc 0.4s ease-in forwards 0.25s; }
          .trash-button.active .garbage-item:nth-child(6) { animation: dropCenter 0.35s ease-in forwards 0.3s; }

          /* Step 2: Entire Bin completely disappears */
          .trash-button.active .entire-bin-wrapper {
            animation: fadeOutComplete 0.2s ease forwards 0.75s;
          }

          /* Step 3: GPay Tick pops up and stroke draws smoothly */
          .trash-button.active .gpay-success-container {
            animation: popGpay 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 0.8s;
          }

          .trash-button.active .gpay-tick {
            animation: drawTick 0.4s ease forwards 0.9s;
          }

          /* --- KEYFRAMES --- */

          @keyframes openAndCloseLid {
            0% { transform: rotate(0deg) translateY(0); }
            30% { transform: rotate(50deg) translateY(-10px); } 
            70% { transform: rotate(50deg) translateY(-10px); } 
            100% { transform: rotate(0deg) translateY(0); }     
          }

          @keyframes tossRightArc {
            0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0; }
            20% { opacity: 1; }
            50% { transform: translate(25px, -20px) rotate(90deg) scale(1.1); }
            100% { transform: translate(40px, 90px) rotate(270deg) scale(0.5); opacity: 0; }
          }

          @keyframes tossLeftArc {
            0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0; }
            20% { opacity: 1; }
            50% { transform: translate(-20px, -25px) rotate(-90deg) scale(1.1); }
            100% { transform: translate(-30px, 90px) rotate(-270deg) scale(0.5); opacity: 0; }
          }

          @keyframes dropCenter {
            0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0; }
            20% { opacity: 1; }
            100% { transform: translate(5px, 100px) rotate(180deg) scale(0.5); opacity: 0; }
          }

          @keyframes binImpact {
            0% { transform: scaleY(1) scaleX(1) translateY(0); }
            50% { transform: scaleY(0.9) scaleX(1.05) translateY(4px); }
            100% { transform: scaleY(1) scaleX(1) translateY(0); }
          }

          @keyframes fadeOutComplete {
            to { opacity: 0; transform: scale(0.8); pointer-events: none; }
          }

          @keyframes popGpay {
            to { opacity: 1; transform: scale(1); }
          }

          @keyframes drawTick {
            to { stroke-dashoffset: 0; }
          }

          /* NOT COVERED ANIMATED WARNING PULSE */
          .not-covered-box {
            position: relative;
            width: 140px;
            height: 140px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .amber-pulse-circle {
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6);
            animation: amberWarningPulse 1.5s infinite;
          }

          @keyframes amberWarningPulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
            70% { transform: scale(1.1); box-shadow: 0 0 0 20px rgba(245, 158, 11, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
          }
        `}</style>

        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          className="bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl border-2 border-[#1E7A38]/40 relative overflow-hidden text-center flex flex-col items-center"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full transition z-30 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* DUSTBIN DROP / NOT COVERED ANIMATION AREA */}
          <div className="relative w-full h-44 bg-gradient-to-b from-slate-50 to-amber-50/50 rounded-2xl flex items-center justify-center border border-slate-200 overflow-hidden mb-3">
            {isCovered ? (
              <button
                type="button"
                id="trashButton"
                onClick={triggerAnimation}
                className={`trash-button ${isActive ? 'active' : ''}`}
                aria-label="Trash Bin Animation"
              >
                {/* Entire Bin Wrapper (Fades out completely when done) */}
                <div className="entire-bin-wrapper">
                  {/* 6 Real waste items */}
                  <div className="garbage-item">🍌</div>
                  <div className="garbage-item">🥫</div>
                  <div className="garbage-item">🗞️</div>
                  <div className="garbage-item">🍏</div>
                  <div className="garbage-item">🥤</div>
                  <div className="garbage-item">🦴</div>
                  
                  {/* Trash Can Parts */}
                  <div className="lid" />
                  <div className="bin-container">
                    <div className="bin">
                      <div className="recycle-mini">&#x267B;&#xFE0E;</div>
                      <div className="ccmc-text">CCMC</div>
                    </div>
                  </div>
                </div>

                {/* GPay Style Success Tick Popup */}
                <div className="gpay-success-container">
                  <div className="gpay-circle">
                    <svg className="gpay-tick" viewBox="0 0 24 24">
                      <polyline points="4 12 9 17 20 6" />
                    </svg>
                  </div>
                  <div className="gpay-text">
                    {isPushCart
                      ? (lang === 'ta' ? 'வெற்றிகரமாக சேகரிக்கப்பட்டது' : 'GARBAGE COLLECTED SUCCESSFULLY')
                      : (lang === 'ta' ? 'தெரு ஆய்வு மூடப்பட்டது' : 'STREET ROUTE COVERED')}
                  </div>
                </div>
              </button>
            ) : (
              /* NOT COVERED / PARTIALLY COVERED ANIMATED VIEW */
              <div className="not-covered-box">
                <div className={isPartiallyCovered ? "amber-pulse-circle !bg-gradient-to-br !from-orange-500 !to-amber-600" : "amber-pulse-circle !bg-gradient-to-br !from-rose-600 !to-red-700"}>
                  {isPartiallyCovered ? (
                    <AlertTriangle className="w-10 h-10 text-white animate-pulse" />
                  ) : (
                    <Lock className="w-10 h-10 text-white animate-bounce" />
                  )}
                </div>
                <div className={`mt-2.5 flex items-center space-x-1 border px-3 py-1 rounded-full shadow-xs ${
                  isPartiallyCovered 
                    ? 'bg-orange-100 text-orange-900 border-orange-300' 
                    : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}>
                  <AlertTriangle className={`w-3.5 h-3.5 ${isPartiallyCovered ? 'text-orange-700' : 'text-rose-700'}`} />
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {isPartiallyCovered
                      ? (lang === 'ta' ? 'பகுதி மூடப்பட்டது என பதிவானது (4/5)' : 'PARTIALLY COVERED (4/5)')
                      : (isPushCart
                          ? (lang === 'ta' ? 'சேகரிக்கப்படவில்லை என பதிவானது' : 'NOT COLLECTED RECORDED')
                          : (lang === 'ta' ? 'மூடப்படாத பகுதி என பதிவானது (≤3)' : 'NOT COVERED RECORDED (≤3)'))}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* RECORD DETAILS DISPLAY */}
          <div className="w-full space-y-2 mb-4 text-center">
            <span
              className={`inline-block text-[11px] font-black px-3.5 py-1 rounded-full border ${
                isCovered
                  ? 'bg-emerald-50 text-[#1E7A38] border-[#1E7A38]/40'
                  : isPartiallyCovered
                    ? 'bg-orange-50 text-orange-800 border-orange-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              {isCovered
                ? (isPushCart 
                    ? (lang === 'ta' ? '✓ வெற்றிகரமாக சேகரிக்கப்பட்டது' : '✓ Successfully Collected') 
                    : (lang === 'ta' ? '✓ தெரு ஆய்வு முடிந்தது (5/5 Covered)' : '✓ Street Route Covered (5/5)'))
                : isPartiallyCovered
                  ? (lang === 'ta' ? '⚠ பகுதி ஆய்வு முடிந்தது (4/5 Partially Covered)' : '⚠ Partially Covered (4/5 Checkpoints)')
                  : (isPushCart 
                      ? (lang === 'ta' ? '⚠ சேகரிக்கவில்லை என பதிவானது' : '⚠ Not Collected Recorded') 
                      : (lang === 'ta' ? '⚠ மூடப்படாத பகுதி (≤3 Not Covered)' : '⚠ Not Covered Recorded (≤3)'))}
            </span>

            {/* Clean Area / Street Name Details */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 text-center space-y-2 mt-1 shadow-2xs">
              {/* Area / Street Name */}
              <div className="flex items-center justify-center space-x-1.5 text-slate-900">
                <MapPin className="w-4 h-4 text-[#1E7A38] flex-shrink-0" />
                <span className="text-sm font-black tracking-tight">
                  {streetName || 'Kamaraj Salai'} {ward ? `• ${ward}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTON: BACK TO DASHBOARD */}
          <div className="w-full">
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-[#1E7A38] hover:bg-[#166534] active:bg-[#113B22] text-white rounded-2xl font-black text-xs shadow-lg flex items-center justify-center space-x-2 transition active:scale-98 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-200" />
              <span className="text-white font-black">{lang === 'ta' ? 'டாஷ்போர்டிற்குத் திரும்பு' : 'BACK TO DASHBOARD'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
