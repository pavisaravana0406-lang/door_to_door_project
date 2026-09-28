import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Zap, 
  ZapOff, 
  QrCode, 
  ArrowLeft, 
  CheckCircle2, 
  SwitchCamera, 
  RefreshCw, 
  Sparkles, 
  Volume2, 
  VolumeX,
  Navigation,
  MapPin,
  Globe,
  Play,
  Route
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { cmPhoto, cmFallbackPhoto, ccmcLogo, ccmcFallbackLogo } from '../constants/branding';
import { SREE_NAGAR_QR_PAYLOAD } from './SWMSStreetScanQRCard';

interface SWMSScannerViewProps {
  lang?: 'en' | 'ta';
  onSetLanguage?: (lang: 'en' | 'ta') => void;
  onToggleLang?: () => void;
  onScanComplete: (houseId: string) => void;
  onBackToDashboard?: () => void;
}

// Play pleasant PhonePe / GPay style scan chime using Web Audio API
const playGPayChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    gain1.gain.setValueAtTime(0.25, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.18);

    // Tone 2 (Higher success ping)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1760, ctx.currentTime + 0.08); // A6
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.28);
  } catch (e) {
    console.warn('Audio feedback error:', e);
  }
};

export const SWMSScannerView: React.FC<SWMSScannerViewProps> = ({
  lang = 'en',
  onSetLanguage,
  onToggleLang,
  onScanComplete,
  onBackToDashboard
}) => {
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSuccessFlash, setIsSuccessFlash] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'gpay-style-qr-reader';

  // Helper to extract clean House ID from QR payload
  const parseHouseId = (raw: string): string => {
    let text = raw.trim();
    // Handle URL payloads like https://ccmc-qr-swm.onrender.com/form/ST1HOU10
    if (text.includes('/')) {
      const parts = text.split('/');
      text = parts[parts.length - 1].trim();
      if (text.includes('?')) {
        text = text.split('?')[0].trim();
      }
    }
    // If format is like HID100101 or ST1HOU10
    if (text.startsWith('HID') || text.startsWith('ST')) return text;
    // If format is like SBM:Z1:W01:str-01:45:SBM-Z1-W01-STR01-D045
    const parts = text.split(':');
    if (parts.length >= 5) {
      const doorNo = parts[4];
      return `HID100${String(doorNo).padStart(3, '0')}`;
    }
    // If contains HID or HOU inside text
    const match = text.match(/(HID\d+|ST\d+HOU\d+|HOU\d+)/i);
    if (match) return match[0].toUpperCase();
    // Default fallback to text or generate formatted ID
    if (/^\d+$/.test(text)) {
      return `HID100${String(text).padStart(3, '0')}`;
    }
    return text || 'HID100101';
  };

  // Trigger successful scan action
  const handleDecodedCode = (decodedText: string) => {
    if (isSuccessFlash) return; // avoid duplicate triggers
    setIsSuccessFlash(true);
    const houseId = parseHouseId(decodedText);
    setScannedResult(houseId);

    // Audio & Haptic feedback (PhonePe / GPay vibe)
    if (soundEnabled) {
      playGPayChime();
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([60, 40, 60]);
    }

    // Stop scanner and transition directly to Household Form View
    setTimeout(() => {
      stopCamera();
      onScanComplete(houseId);
    }, 350);
  };

  // Start Camera with resilient multi-stage fallback for mobile & laptop webcams
  const startCamera = async (facing: 'environment' | 'user' = 'environment') => {
    setCameraError(null);
    setIsCameraActive(false);

    try {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch {
          // ignore
        }
      }

      // Check if browser has mediaDevices support
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported on this browser or context.');
      }

      const html5QrCode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5QrCode;

      // Dynamic qrbox to prevent crashes on smaller mobile screens
      const dynamicQrBox = (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const edgeSize = Math.max(140, Math.floor(minEdge * 0.72));
        return { width: edgeSize, height: edgeSize };
      };

      const qrConfig = {
        fps: 15,
        qrbox: dynamicQrBox,
        disableFlip: facing === 'environment'
      };

      // Stage 1: Enumerate device cameras to select camera
      let cameras: Array<{ id: string; label: string }> = [];
      try {
        cameras = await Html5Qrcode.getCameras();
      } catch (e) {
        console.warn('getCameras enumeration error:', e);
      }

      if (cameras && cameras.length > 0) {
        let chosenCamera = cameras[0];
        if (facing === 'environment') {
          const backCam = cameras.find((c) =>
            c.label.toLowerCase().includes('back') ||
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('environment') ||
            c.label.toLowerCase().includes('0')
          );
          chosenCamera = backCam || cameras[cameras.length - 1] || cameras[0];
        } else {
          const frontCam = cameras.find((c) =>
            c.label.toLowerCase().includes('front') ||
            c.label.toLowerCase().includes('user')
          );
          chosenCamera = frontCam || cameras[0];
        }

        try {
          await html5QrCode.start(
            chosenCamera.id,
            qrConfig,
            (decodedText) => handleDecodedCode(decodedText),
            () => {}
          );
          setIsCameraActive(true);
          return;
        } catch (err1) {
          console.warn('Failed to start with enumerated camera ID, trying fallback:', err1);
        }
      }

      // Stage 2: Laptop Webcam / Default video constraint (Works on all Laptops!)
      try {
        await html5QrCode.start(
          {},
          qrConfig,
          (decodedText) => handleDecodedCode(decodedText),
          () => {}
        );
        setIsCameraActive(true);
        return;
      } catch (errLaptop) {
        console.warn('Laptop default video start failed:', errLaptop);
      }

      // Stage 3: Direct facingMode constraint
      try {
        await html5QrCode.start(
          { facingMode: facing },
          qrConfig,
          (decodedText) => handleDecodedCode(decodedText),
          () => {}
        );
        setIsCameraActive(true);
        return;
      } catch (err2) {
        console.warn('Direct facingMode failed:', err2);
      }

      // Stage 4: Try any camera ID
      if (cameras && cameras.length > 0) {
        for (const cam of cameras) {
          try {
            await html5QrCode.start(
              cam.id,
              qrConfig,
              (decodedText) => handleDecodedCode(decodedText),
              () => {}
            );
            setIsCameraActive(true);
            return;
          } catch {
            // continue loop
          }
        }
      }

      throw new Error('All live camera stream attempts failed on this device.');
    } catch (err: unknown) {
      console.warn('Camera auto-start error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission')) {
        setCameraError(
          lang === 'ta'
            ? 'கேமரா அனுமதி தேவைப்படுகிறது. பிரவுசரில் கேமரா அனுமதியை அனுமதிக்கவும்.'
            : 'Camera permission is required. Please allow camera access in browser settings.'
        );
      } else {
        setCameraError(
          lang === 'ta'
            ? 'நேரடி கேமரா கிடைக்கவில்லை. கேமரா சரியாக இணைக்கப்பட்டுள்ளதா என சரிபார்க்கவும்.'
            : 'Live camera stream is unavailable. Please verify your camera connection.'
        );
      }
      setIsCameraActive(false);
      // Clean DOM container to remove injected raw html5qrcode SVGs/IMGs
      try {
        const container = document.getElementById(readerElementId);
        if (container) {
          Array.from(container.children).forEach(child => {
            if (child.tagName !== 'VIDEO') child.remove();
          });
        }
      } catch {}
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch {
        // ignore
      }
    }
    setIsCameraActive(false);
    try {
      const container = document.getElementById(readerElementId);
      if (container) {
        Array.from(container.children).forEach(child => {
          if (child.tagName !== 'VIDEO') child.remove();
        });
      }
    } catch {}
  };

  // Auto start camera on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startCamera(cameraFacing);
    }, 200);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [cameraFacing]);

  // Toggle Torch/Flashlight
  const toggleFlashlight = async () => {
    if (!scannerRef.current || !isCameraActive) return;
    try {
      const videoElem = document.querySelector(`#${readerElementId} video`) as HTMLVideoElement | null;
      if (videoElem && videoElem.srcObject) {
        const stream = videoElem.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() as { torch?: boolean } | undefined;
        if (capabilities && 'torch' in capabilities) {
          const nextState = !flashlightOn;
          await track.applyConstraints({
            advanced: [{ torch: nextState } as unknown as MediaTrackConstraintSet]
          });
          setFlashlightOn(nextState);
          return;
        }
      }
      setFlashlightOn(!flashlightOn);
    } catch (e) {
      console.warn('Torch not supported on this device:', e);
      setFlashlightOn(!flashlightOn);
    }
  };

  // Flip Camera
  const handleFlipCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
  };

  // Quick Laptop Test Scan Handler — simulates scanning a QR checkpoint id (e.g. E-SCAN1)
  const handleQuickTestScan = () => {
    const sampleIds = ['E-SCAN1', 'E-SCAN2', 'E-SCAN3', 'E-SCAN4', 'E-SCAN5'];
    const randomQrId = sampleIds[Math.floor(Math.random() * sampleIds.length)];
    handleDecodedCode(randomQrId);
  };

  // Sree Nagar Route Test Scan — simulates scanning the Sree Nagar QR card
  const handleSreeNagarScan = () => {
    handleDecodedCode(SREE_NAGAR_QR_PAYLOAD);
  };

  return (
    <div className="flex flex-col h-full min-h-screen w-full max-w-full bg-[#0B132B] text-white overflow-hidden relative select-none font-sans">
      <style>{`
        #${readerElementId},
        #${readerElementId} > div,
        #${readerElementId} [id*="__scan_region"] {
          width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          inset: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          background: transparent !important;
        }
        #${readerElementId} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          position: absolute !important;
          inset: 0 !important;
          display: block !important;
          z-index: 1 !important;
        }
        #${readerElementId} img,
        #${readerElementId} svg,
        #${readerElementId} canvas,
        #${readerElementId} button,
        #${readerElementId} span,
        #${readerElementId} a,
        #${readerElementId} [id*="__dashboard"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          width: 0 !important;
          height: 0 !important;
          pointer-events: none !important;
        }
      `}</style>

      {/* ── 1. TOP BAR (Dark Midnight Navy matching screenshot) ── */}
      <div className="flex-shrink-0 z-30 bg-[#0B132B] pt-3 pb-3 px-4 flex flex-col items-center gap-2 border-b border-white/10 shadow-md">
        {/* Row 1: Back + Status Pill + Sound Control */}
        <div className="w-full flex items-center justify-between">
          {onBackToDashboard ? (
            <button
              onClick={onBackToDashboard}
              className="w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center border border-white/20 cursor-pointer active:scale-95 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-9" />
          )}

          {/* Top Status Pill */}
          <div className="flex items-center gap-2 bg-white text-[#0B132B] px-4 py-1.5 rounded-full font-extrabold text-xs sm:text-sm shadow-lg border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0 animate-ping" />
            <span>{lang === 'ta' ? 'QR கோட்டை கட்டத்தில் வையுங்கள்' : 'Align Door QR Code within frame'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center border border-white/20 cursor-pointer active:scale-95 transition"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-white/40" />}
            </button>
          </div>
        </div>

        {/* Row 2: Location & GPS Pill */}
        <div className="flex items-center gap-1.5 bg-[#060D1E] border border-emerald-500/40 text-emerald-300 px-3.5 py-1 rounded-full text-[11px] font-mono font-bold shadow-inner">
          <Navigation className="w-3 h-3 text-emerald-400 rotate-45" />
          <span>11.0168° N, 76.9558° E • Gandhipuram, Ward 12</span>
        </div>
      </div>

      {/* ── 2. CAMERA VIEWPORT & VIEWFINDER ── */}
      <div className="relative flex-1 w-full flex flex-col justify-center items-center overflow-hidden bg-black py-4 px-4 min-h-0">

        {/* Html5Qrcode video container */}
        <div
          id={readerElementId}
          className="absolute inset-0 w-full h-full bg-black"
        />

        {/* Dark vignette overlay */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 65% 65% at 50% 50%, transparent 0%, rgba(0,0,0,0.75) 100%)'
          }}
        />

        {/* Viewfinder Window (exact match with media_1790162413143.png - click to scan demo QR anytime) */}
        <div
          onClick={handleSreeNagarScan}
          title={lang === 'ta' ? 'QR ஸ்கேன் செய்ய தட்டவும்' : 'Tap to scan QR code'}
          className="z-20 relative w-56 h-56 xs:w-64 xs:h-64 sm:w-72 sm:h-72 my-auto flex-shrink-0 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
        >
          {/* Top-Left Corner */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-xl drop-shadow-[0_0_8px_#10B981] z-20" />
          <div className="absolute top-1 left-1 w-8 h-8 rounded-tl-lg bg-emerald-500/20 border-t-2 border-l-2 border-emerald-400 z-10" />

          {/* Top-Right Corner */}
          <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-xl drop-shadow-[0_0_8px_#10B981] z-20" />
          <div className="absolute top-1 right-1 w-8 h-8 rounded-tr-lg bg-emerald-500/20 border-t-2 border-r-2 border-emerald-400 z-10" />

          {/* Bottom-Left Corner */}
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-xl drop-shadow-[0_0_8px_#10B981] z-20" />
          <div className="absolute bottom-1 left-1 w-8 h-8 rounded-bl-lg bg-emerald-500/20 border-b-2 border-l-2 border-emerald-400 z-10" />

          {/* Bottom-Right Corner */}
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-xl drop-shadow-[0_0_8px_#10B981] z-20" />
          <div className="absolute bottom-1 right-1 w-8 h-8 rounded-br-lg bg-emerald-500/20 border-b-2 border-r-2 border-emerald-400 z-10" />

          {/* Laser scan line */}
          {!isSuccessFlash && (
            <div className="absolute left-2 right-2 h-[2.5px] bg-emerald-400 shadow-[0_0_12px_#10B981] animate-[scan_2s_ease-in-out_infinite] z-20" />
          )}

          {/* Camera Off Placeholder matching media_1790162413143.png when camera initializing or off */}
          {!isCameraActive && !isSuccessFlash && (
            <div className="flex flex-col items-center justify-center text-center p-4 z-10">
              <div className="relative flex items-center justify-center">
                <svg className="w-24 h-24 text-white opacity-90 drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                  <line x1="2" y1="2" x2="22" y2="22"/>
                </svg>
                <div className="absolute w-10 h-10 rounded-full bg-white border-2 border-emerald-500 shadow-xl flex flex-col items-center justify-center">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  <span className="text-[7px] font-black text-emerald-800 tracking-tighter uppercase leading-none">QR</span>
                </div>
              </div>
            </div>
          )}

          {/* Success Flash Overlay */}
          {isSuccessFlash && (
            <div className="absolute inset-0 rounded-2xl bg-emerald-600/40 flex items-center justify-center animate-pulse z-30">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. BOTTOM TOOLBAR ── */}
      <div className="flex-shrink-0 z-30 bg-[#0B132B] py-4 px-4 flex items-center justify-center border-t border-white/10">
        <button
          type="button"
          onClick={handleFlipCamera}
          className="flex items-center gap-2 bg-white text-[#0B132B] hover:bg-slate-100 font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-full transition active:scale-95 cursor-pointer shadow-xl border border-slate-200"
        >
          <SwitchCamera className="w-4 h-4 text-emerald-600" />
          <span>{cameraFacing === 'environment' ? 'Rear' : 'Front'}</span>
        </button>
      </div>

    </div>
  );
};

export default SWMSScannerView;
