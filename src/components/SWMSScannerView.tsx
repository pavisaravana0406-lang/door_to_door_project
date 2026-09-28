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
  Globe,
  Play,
  Route
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { cmPhoto, cmFallbackPhoto, ccmcLogo, ccmcFallbackLogo } from '../constants/branding';

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
  // Serializes camera start/stop so overlapping transitions can never collide
  // ("Cannot transition to a new state, already under transition").
  const transitionLock = useRef<Promise<void>>(Promise.resolve());
  const busyRef = useRef(false);
  const startGenRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [manualQrId, setManualQrId] = useState('');
  const [galleryError, setGalleryError] = useState<string | null>(null);
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

  // HD constraints: forces a sharp high-resolution stream instead of the
  // default blurry 640x480 that can never resolve a printed QR.
  const hdConstraints = (facing: 'environment' | 'user', deviceId?: string) => ({
    ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
    facingMode: facing,
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  });

  // Apply continuous autofocus once the video track is live (fixes blurry prints
  // that never decode no matter how long you hold them).
  const applyFocusFix = async (refocus = false) => {
    try {
      const videoElem = document.querySelector(`#${readerElementId} video`) as HTMLVideoElement | null;
      const stream = videoElem?.srcObject as MediaStream | undefined;
      const track = stream?.getVideoTracks?.()[0];
      if (!track) return false;
      const caps = (track.getCapabilities?.() || {}) as Record<string, unknown>;
      // Tap-to-focus: kick the lens by flipping manual -> continuous.
      if (refocus && 'focusMode' in caps) {
        try {
          await track.applyConstraints({
            advanced: [{ focusMode: 'manual' } as unknown as MediaTrackConstraintSet],
          });
          await new Promise((r) => setTimeout(r, 250));
        } catch {
          // ignore — fall through to continuous
        }
      }
      const advanced: MediaTrackConstraintSet[] = [];
      if ('focusMode' in caps) advanced.push({ focusMode: 'continuous' } as unknown as MediaTrackConstraintSet);
      if ('exposureMode' in caps) advanced.push({ exposureMode: 'continuous' } as unknown as MediaTrackConstraintSet);
      if ('whiteBalanceMode' in caps) advanced.push({ whiteBalanceMode: 'continuous' } as unknown as MediaTrackConstraintSet);
      if (advanced.length > 0) {
        try {
          await track.applyConstraints({ advanced });
          return true;
        } catch {
          return false;
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  // Tap on the viewfinder forces the lens to refocus (fixes stuck blur).
  const [focusTick, setFocusTick] = useState(false);
  const handleViewfinderTap = async () => {
    setFocusTick(true);
    setTimeout(() => setFocusTick(false), 600);
    const ok = await applyFocusFix(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(20); } catch { /* ignore */ }
    }
    // Restart only when the scanner is truly idle — never mid-transition.
    if (!ok && !busyRef.current && !scannerRef.current?.isScanning) {
      startCamera(cameraFacing);
    }
  };

  // Wait for any in-flight camera transition, then hold the lock.
  const acquireCameraTurn = async (): Promise<() => void> => {
    const prev = transitionLock.current;
    let release = () => {};
    const cur = new Promise<void>((res) => { release = res; });
    transitionLock.current = cur;
    await prev;
    busyRef.current = true;
    return () => {
      busyRef.current = false;
      release();
    };
  };

  // Start Camera with resilient multi-stage fallback for mobile & laptop webcams
  const startCamera = async (facing: 'environment' | 'user' = 'environment') => {
    const myGen = ++startGenRef.current;
    const release = await acquireCameraTurn();
    setCameraError(null);
    setIsCameraActive(false);

    // Keep the real underlying failure so the UI can explain it
    // instead of a generic "unavailable" message.
    let lastStageError: unknown = null;

    try {
      // A newer start/stop superseded this one while it waited — bail out.
      if (myGen !== startGenRef.current) return;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch {
          // ignore
        }
        scannerRef.current = null;
      }

      // Check if browser has mediaDevices support
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const inApp = /FBAN|FBAV|FB_IAB|FBAN\/|Instagram|Line\/|MicroMessenger|WhatsApp/i.test(
          typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
        );
        throw new Error(
          inApp
            ? 'INAPP_BROWSER: camera is blocked inside this in-app browser. Open this page in Chrome/Safari.'
            : 'UNSUPPORTED_BROWSER: getUserMedia is not supported on this browser or context.'
        );
      }

      // Camera needs a secure context (HTTPS or localhost). Plain HTTP/IP fails.
      try {
        const insecure =
          typeof window !== 'undefined' &&
          window.isSecureContext === false &&
          !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
        if (insecure) {
          throw new Error('INSECURE_CONTEXT: camera requires HTTPS. Open the https:// site URL.');
        }
      } catch (e) {
        if (e instanceof Error && e.message.startsWith('INSECURE_CONTEXT')) throw e;
        // ignore detection errors
      }

      // Pre-request permission first: unlocks device labels + autofocus on mobile.
      try {
        const preStream = await navigator.mediaDevices.getUserMedia({
          video: facing === 'environment' ? { facingMode: 'environment' } : { facingMode: 'user' },
          audio: false,
        });
        preStream.getTracks().forEach((t) => t.stop());
      } catch (e) {
        console.warn('Pre-permission request failed:', e);
      }

      const html5QrCode = new Html5Qrcode(readerElementId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        useBarCodeDetectorIfSupported: true,
      } as unknown as ConstructorParameters<typeof Html5Qrcode>[1]);
      scannerRef.current = html5QrCode;

      // qrbox matches the visible 224–288px frame (capped) so the decoder
      // looks where the user actually holds the QR, at a calm 10 fps.
      const dynamicQrBox = (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const edgeSize = Math.max(200, Math.min(300, Math.floor(minEdge * 0.62)));
        return { width: edgeSize, height: edgeSize };
      };

      const qrConfig = {
        fps: 10,
        qrbox: dynamicQrBox,
        aspectRatio: 1.0,
        disableFlip: false,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      };

      // One attempt to start the stream. A "transition" collision means a
      // previous stop/start is still settling — wait and retry once on the
      // same instance instead of failing the whole camera.
      const safeStart = async (constraints: unknown): Promise<boolean> => {
        try {
          await html5QrCode.start(
            constraints as never,
            qrConfig,
            (decodedText) => handleDecodedCode(decodedText),
            () => {}
          );
          return true;
        } catch (e) {
          const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
          if (/transition/i.test(msg)) {
            console.warn('Camera transition collision, waiting and retrying once:', msg);
            await new Promise((r) => setTimeout(r, 900));
            // A newer start/stop took over while waiting — give up quietly.
            if (myGen !== startGenRef.current) return false;
            try {
              await html5QrCode.start(
                constraints as never,
                qrConfig,
                (decodedText) => handleDecodedCode(decodedText),
                () => {}
              );
              return true;
            } catch (e2) {
              lastStageError = e2;
              return false;
            }
          }
          lastStageError = e;
          return false;
        }
      };

      const startOk = async (constraints: unknown): Promise<boolean> => {
        const ok = await safeStart(constraints);
        if (ok && myGen === startGenRef.current) {
          setIsCameraActive(true);
          void applyFocusFix();
          return true;
        }
        return false;
      };

      // Stage 1: Enumerate device cameras to select camera
      let cameras: Array<{ id: string; label: string }> = [];
      try {
        cameras = await Html5Qrcode.getCameras();
      } catch (e) {
        console.warn('getCameras enumeration error:', e);
        lastStageError = e;
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

        if (await startOk(hdConstraints(facing, chosenCamera.id))) return;
        console.warn('Failed to start with enumerated camera ID, trying fallback.');
      }

      // Stage 2: Direct facingMode constraint with HD ask (best for autofocus on phones)
      if (await startOk(hdConstraints(facing))) return;
      console.warn('Direct facingMode failed, trying default.');

      // Stage 3: Laptop Webcam / Default video constraint (Works on all Laptops!)
      if (await startOk({})) return;
      console.warn('Laptop default video start failed, trying each camera.');

      // Stage 4: Try any camera ID with HD ask
      if (cameras && cameras.length > 0) {
        for (const cam of cameras) {
          if (await startOk(hdConstraints(facing, cam.id))) return;
          // continue loop
        }
      }

      throw new Error('All live camera stream attempts failed on this device.');
    } catch (err: unknown) {
      console.warn('Camera auto-start error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      const stageMsg =
        lastStageError instanceof Error
          ? `${lastStageError.name}: ${lastStageError.message}`
          : String(lastStageError || '');
      const combined = `${errMsg} ${stageMsg}`;
      const ta = lang === 'ta';

      const permissionHelp = ta
        ? 'கேமரா அனுமதி மறுக்கப்பட்டது. Browser address bar-ல் lock icon → Site settings → Camera → Allow, பிறகு page-ஐ reload செய்து Retry அழுத்தவும்.'
        : 'Camera permission was denied. Tap the lock icon in the address bar → Site settings → Camera → Allow, then reload and press Retry camera.';
      const busyHelp = ta
        ? 'கேமரா வேறு app/tab-ல் பயன்பாட்டில் உள்ளது. மற்ற camera app/Tab-களை மூடிவிட்டு Retry அழுத்தவும்.'
        : 'The camera is busy in another app or tab. Close other camera apps/tabs and press Retry camera.';
      const missingHelp = ta
        ? 'இந்த device/browser-ல் பயன்படுத்தக்கூடிய கேமரா இல்லை. Chrome/Safari-ல் திறக்கவும்.'
        : 'No usable camera was found on this device/browser. Try opening in Chrome or Safari.';
      const httpsHelp = ta
        ? 'கேமராவுக்கு HTTPS தேவை. https:// தள URL-ல் திறக்கவும் (http/IP-ல் வேலை செய்யாது).'
        : 'Camera needs HTTPS. Open the https:// site URL (plain http/IP will not work).';
      const inappHelp = ta
        ? 'WhatsApp/Facebook உள்-browser-ல் கேமரா block ஆகும். Chrome/Safari-ல் link-ஐ திறக்கவும்.'
        : 'In-app browsers (WhatsApp/Facebook) block the camera. Open this link in Chrome or Safari.';

      if (combined.includes('INAPP_BROWSER')) {
        setCameraError(inappHelp);
      } else if (combined.includes('INSECURE_CONTEXT')) {
        setCameraError(httpsHelp);
      } else if (
        combined.includes('NotAllowedError') ||
        combined.includes('Permission denied') ||
        combined.includes('Permission dismissed')
      ) {
        setCameraError(permissionHelp);
      } else if (combined.includes('NotReadableError') || combined.includes('AbortError') || combined.includes('TrackStartError')) {
        setCameraError(busyHelp);
      } else if (
        combined.includes('NotFoundError') ||
        combined.includes('OverconstrainedError') ||
        combined.includes('DevicesNotFound')
      ) {
        setCameraError(missingHelp);
      } else if (combined.includes('UNSUPPORTED_BROWSER')) {
        setCameraError(inappHelp);
      } else {
        setCameraError(
          ta
            ? `நேரடி கேமரா தொடங்கவில்லை (${stageMsg || errMsg}). Retry அழுத்தவும் அல்லது கீழே QR ID தட்டச்சு செய்யவும்.`
            : `Live camera did not start (${stageMsg || errMsg}). Press Retry or type the QR ID below.`
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
    } finally {
      release();
    }
  };

  const stopCamera = async () => {
    // Bumps the generation so any queued start aborts, then stops serially.
    startGenRef.current++;
    const release = await acquireCameraTurn();
    try {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch {
          // ignore — a colliding transition settles on its own
        }
        scannerRef.current = null;
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
    } finally {
      release();
    }
  };

  // Auto start camera on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startCamera(cameraFacing);
    }, 200);

    return () => {
      clearTimeout(timer);
      void stopCamera();
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

  // Manual QR-ID entry fallback (e.g. E-SCAN1 when the lens can't focus)
  const handleManualSubmit = () => {
    const clean = manualQrId.trim().toUpperCase().replace(/\s+/g, '');
    if (!clean) {
      setGalleryError(lang === 'ta' ? 'QR ID-ஐ தட்டச்சு செய்யவும் (எ.கா. E-SCAN1).' : 'Type the QR ID first (e.g. E-SCAN1).');
      return;
    }
    setGalleryError(null);
    handleDecodedCode(clean);
  };

  // Gallery upload fallback — decode a photo of the QR from the phone gallery
  const handleGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGalleryError(null);
    try {
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(readerElementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          useBarCodeDetectorIfSupported: true,
        } as unknown as ConstructorParameters<typeof Html5Qrcode>[1]);
        scannerRef.current = scanner;
      }
      const decoded = await scanner.scanFile(file, false);
      if (decoded) {
        handleDecodedCode(decoded);
        return;
      }
      throw new Error('empty');
    } catch {
      setGalleryError(
        lang === 'ta'
          ? 'புகைப்படத்தில் QR கண்டுபிடிக்க முடியவில்லை. தெளிவான புகைப்படம் எடுக்கவும்.'
          : 'No QR found in that photo. Try a clearer, well-lit photo.'
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isCameraActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{isCameraActive ? (lang === 'ta' ? 'QR கோட்டை கட்டத்தில் வையுங்கள்' : 'Align Door QR Code within frame') : (lang === 'ta' ? 'கேமரா தொடங்குகிறது...' : 'Starting camera...')}</span>
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

        {/* Viewfinder Window — tap to force refocus when blurry */}
        <div
          onClick={handleViewfinderTap}
          title={lang === 'ta' ? 'Focus செய்ய தட்டவும்' : 'Tap to focus'}
          className={`z-20 relative w-56 h-56 xs:w-64 xs:h-64 sm:w-72 sm:h-72 my-auto flex-shrink-0 flex items-center justify-center cursor-pointer transition-transform ${focusTick ? 'scale-[0.98]' : ''}`}
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

          {/* Camera Off Placeholder when camera initializing or off */}
          {!isCameraActive && !isSuccessFlash && (
            <div className="flex flex-col items-center justify-center text-center p-4 z-10 max-w-[260px]">
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
              {cameraError ? (
                <div className="mt-3 w-full bg-rose-950/80 border border-rose-500/60 rounded-xl px-3 py-2.5">
                  <p className="text-[11px] font-bold text-rose-200 leading-snug">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => startCamera(cameraFacing)}
                    className="mt-2 w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black px-3 py-2 rounded-lg transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {lang === 'ta' ? 'மீண்டும் முயற்சி' : 'Retry camera'}
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-[11px] font-bold text-white/80 leading-snug">
                  {lang === 'ta' ? 'கேமரா தொடங்குகிறது... அனுமதியை உறுதிப்படுத்தவும்' : 'Starting camera... please allow permission'}
                </p>
              )}
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

      {/* ── 3. BOTTOM TOOLBAR + FALLBACKS ── */}
      <div className="flex-shrink-0 z-30 bg-[#0B132B] py-3 px-4 flex flex-col gap-2.5 border-t border-white/10 max-h-[42vh] overflow-y-auto">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleFlipCamera}
            className="flex items-center gap-1.5 bg-white text-[#0B132B] hover:bg-slate-100 font-extrabold text-xs px-4 py-2.5 rounded-full transition active:scale-95 cursor-pointer shadow-xl border border-slate-200"
          >
            <SwitchCamera className="w-4 h-4 text-emerald-600" />
            <span>{cameraFacing === 'environment' ? 'Rear' : 'Front'}</span>
          </button>
        </div>

        <p className="text-center text-[11px] font-semibold text-white/60 leading-snug">
          {lang === 'ta'
            ? 'QR-ஐ சட்டகத்தில் நிறுத்தி 10–15 செ.மீ தூரத்தில் பிடிக்கவும் • Blur-ஆ இருந்தால் frame-ஐ தட்டவும்'
            : 'Hold the QR steady inside the frame, 10–15 cm away • Tap the frame if blurry'}
        </p>

        {/* Manual QR-ID entry — works even when the lens can't focus */}
        <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl p-2">
          <QrCode className="w-4 h-4 text-emerald-300 flex-shrink-0 ml-1" />
          <input
            value={manualQrId}
            onChange={(e) => setManualQrId(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') handleManualSubmit(); }}
            placeholder="E-SCAN1"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 min-w-0 bg-transparent text-white text-sm font-bold font-mono placeholder:text-white/30 focus:outline-none px-1"
          />
          <button
            type="button"
            onClick={handleManualSubmit}
            className="bg-emerald-500 hover:bg-emerald-400 text-[#0B132B] text-xs font-black px-4 py-2 rounded-xl transition active:scale-95 flex-shrink-0"
          >
            {lang === 'ta' ? 'சமர்ப்பி' : 'Submit'}
          </button>
        </div>
        {galleryError && (
          <p className="text-center text-[11px] font-bold text-rose-300 leading-snug">{galleryError}</p>
        )}
      </div>

    </div>
  );
};

export default SWMSScannerView;
