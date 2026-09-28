import React, { useState, useEffect, useRef } from 'react';
import { 
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
import jsQR from 'jsqr';
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
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSuccessFlash, setIsSuccessFlash] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Native camera pipeline — we own the <video> element, the MediaStream and
  // the jsQR decode loop directly, so no library state machine can wedge.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const decodingRef = useRef(false);
  const startGenRef = useRef(0);
  const startingRef = useRef(false);
  const doneRef = useRef(false);

  // Transient "not our QR" notice — camera keeps scanning underneath.
  const [invalidQrNotice, setInvalidQrNotice] = useState<string | null>(null);
  const invalidNoticeTimer = useRef<number | null>(null);
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

  // Our created checkpoint QRs encode ONLY the id, e.g. "E-SCAN1".
  // Anything else (random QRs, URLs, barcodes) must NOT scan.
  const isOwnCheckpointQr = (raw: string): boolean =>
    /^[A-Z]-SCAN\d+$/i.test(raw.trim());

  const flashInvalidQr = (raw: string) => {
    const shown = raw.trim().slice(0, 24) || '???';
    setInvalidQrNotice(
      lang === 'ta'
        ? `இது நமது QR இல்லை (${shown}) — SWMS checkpoint QR-ஐ மட்டும் ஸ்கேன் செய்யவும்.`
        : `Not our QR (${shown}) — scan only SWMS checkpoint QR codes.`
    );
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(120); } catch { /* ignore */ }
    }
    if (invalidNoticeTimer.current) window.clearTimeout(invalidNoticeTimer.current);
    invalidNoticeTimer.current = window.setTimeout(() => setInvalidQrNotice(null), 2800);
  };

  // Trigger successful scan action — own checkpoint QRs only.
  const handleDecodedCode = (decodedText: string) => {
    if (isSuccessFlash || doneRef.current) return; // avoid duplicate triggers
    if (!isOwnCheckpointQr(decodedText)) {
      flashInvalidQr(decodedText);
      return; // keep the camera running for the correct QR
    }
    doneRef.current = true; // stop the decode loop immediately
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

  const getCanvas = (): HTMLCanvasElement | null => {
    if (typeof document === 'undefined') return null;
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
    return canvasRef.current;
  };

  // Apply continuous autofocus once the video track is live (fixes blurry prints
  // that never decode no matter how long you hold them).
  const applyFocusFix = async (refocus = false) => {
    try {
      const track = streamRef.current?.getVideoTracks?.()[0];
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
    // Restart only when the stream is truly idle.
    if (!ok && !decodingRef.current && !streamRef.current) {
      startCamera(cameraFacing);
    }
  };

  // Native decode loop: draws our own <video> frames to an offscreen canvas
  // and runs jsQR on them. No library owns the camera, so nothing can wedge.
  const decodeOnce = (): string | null => {
    const video = videoRef.current;
    const canvas = getCanvas();
    if (!video || !canvas) return null;
    if (video.readyState < 2 || video.videoWidth === 0) return null;
    const targetW = 640;
    const scale = Math.min(1, targetW / video.videoWidth);
    const w = Math.max(1, Math.floor(video.videoWidth * scale));
    const h = Math.max(1, Math.floor(video.videoHeight * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    let img: ImageData;
    try {
      img = ctx.getImageData(0, 0, w, h);
    } catch {
      return null;
    }
    try {
      const res = jsQR(img.data, w, h, { inversionAttempts: 'attemptBoth' });
      return res?.data ?? null;
    } catch {
      return null;
    }
  };

  const runDecodeLoop = () => {
    cancelAnimationFrame(rafRef.current);
    decodingRef.current = true;
    let lastRun = 0;
    const tick = () => {
      if (!streamRef.current || doneRef.current) {
        decodingRef.current = false;
        return;
      }
      const now = performance.now();
      if (now - lastRun >= 180) {
        lastRun = now;
        const text = decodeOnce();
        if (text) {
          handleDecodedCode(text);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopTracks = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    decodingRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try { t.stop(); } catch { /* ignore */ }
      });
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      try { video.pause(); } catch { /* ignore */ }
      video.srcObject = null;
    }
  };

  // Start Camera with resilient multi-stage fallback for mobile & laptop webcams.
  // Plain getUserMedia stages — track.stop() is synchronous, so overlapping
  // start/stop calls can never collide the way the old library did.
  const startCamera = async (facing: 'environment' | 'user' = 'environment') => {
    const myGen = ++startGenRef.current;
    if (startingRef.current) return;
    startingRef.current = true;
    setCameraError(null);
    setIsCameraActive(false);
    doneRef.current = false;

    // Keep the real underlying failure so the UI can explain it
    // instead of a generic "unavailable" message.
    let lastStageError: unknown = null;

    try {
      // A newer start/stop superseded this one while it waited — bail out.
      if (myGen !== startGenRef.current) return;
      stopTracks();

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

      // Attach a stream to our own <video> and wait for real frames.
      // Returns false on black/frozen preview so the next stage is tried.
      const attachAndVerify = async (stream: MediaStream): Promise<boolean> => {
        const video = videoRef.current;
        if (!video || myGen !== startGenRef.current) {
          stream.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
          return false;
        }
        streamRef.current = stream;
        video.srcObject = stream;
        video.muted = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        try {
          await video.play();
        } catch (e) {
          console.warn('Video play failed:', e);
        }
        for (let i = 0; i < 20; i++) {
          if (myGen !== startGenRef.current) return false;
          if (video.videoWidth > 0 && video.readyState >= 2 && !video.paused) return true;
          await new Promise((r) => setTimeout(r, 200));
        }
        console.warn('Camera stream opened but no video frames, trying next mode.');
        lastStageError = new Error('BLACK_PREVIEW: stream opened but no video frames arrived.');
        stopTracks();
        return false;
      };

      const tryConstraints = async (video: MediaTrackConstraints, label: string): Promise<boolean> => {
        if (myGen !== startGenRef.current) return false;
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
          if (myGen !== startGenRef.current) {
            stream.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
            return false;
          }
          if (await attachAndVerify(stream)) return true;
          console.warn(`Camera mode "${label}" gave no frames, trying next.`);
          return false;
        } catch (e) {
          console.warn(`Camera mode "${label}" failed:`, e);
          lastStageError = e;
          return false;
        }
      };

      const HD = { width: { ideal: 1920 }, height: { ideal: 1080 } };

      // Stage 1: exact rear/front device for a sharp HD stream.
      let devices: MediaDeviceInfo[] = [];
      try {
        devices = await navigator.mediaDevices.enumerateDevices();
      } catch (e) {
        console.warn('Device enumeration error:', e);
        lastStageError = e;
      }
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      const pickDevice = (): string | undefined => {
        if (videoInputs.length === 0) return undefined;
        const byLabel = (re: RegExp) => videoInputs.find((d) => re.test(d.label || ''));
        if (facing === 'environment') {
          return (
            byLabel(/back|rear|environment/i)?.deviceId ||
            videoInputs[videoInputs.length - 1]?.deviceId ||
            videoInputs[0]?.deviceId
          );
        }
        return byLabel(/front|user|face/i)?.deviceId || videoInputs[0]?.deviceId;
      };
      const exactId = pickDevice();
      if (exactId) {
        if (await tryConstraints({ deviceId: { exact: exactId }, facingMode: facing, ...HD }, 'exact-device-hd')) {
          setIsCameraActive(true);
          void applyFocusFix();
          runDecodeLoop();
          return;
        }
      } else {
        console.warn('No video input enumerated, trying facing mode.');
      }

      // Stage 2: facing mode with HD ask (best for autofocus on phones).
      if (await tryConstraints({ facingMode: facing, ...HD }, 'facing-hd')) {
        setIsCameraActive(true);
        void applyFocusFix();
        runDecodeLoop();
        return;
      }

      // Stage 3: plain facing mode (laptops + older phones).
      if (await tryConstraints({ facingMode: facing }, 'facing-basic')) {
        setIsCameraActive(true);
        void applyFocusFix();
        runDecodeLoop();
        return;
      }

      // Stage 4: any camera, no ideals at all.
      if (await tryConstraints(true as unknown as MediaTrackConstraints, 'any-camera')) {
        setIsCameraActive(true);
        void applyFocusFix();
        runDecodeLoop();
        return;
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
            ? `நேரடி கேமரா தொடங்கவில்லை (${stageMsg || errMsg}). Retry அழுத்தவும்.`
            : `Live camera did not start (${stageMsg || errMsg}). Press Retry camera.`
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
      startingRef.current = false;
    }
  };

  const stopCamera = () => {
    // Bumps the generation so any in-flight start aborts, then stops tracks.
    // track.stop() is fully synchronous — overlapping calls cannot collide.
    startGenRef.current++;
    stopTracks();
    setIsCameraActive(false);
  };

  // Auto start camera on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startCamera(cameraFacing);
    }, 200);

    return () => {
      clearTimeout(timer);
      if (invalidNoticeTimer.current) window.clearTimeout(invalidNoticeTimer.current);
      void stopCamera();
    };
  }, [cameraFacing]);

  // Flip Camera
  const handleFlipCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
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

        {/* Our own video element — direct MediaStream, no library DOM */}
        <div
          id={readerElementId}
          className="absolute inset-0 w-full h-full bg-black"
        >
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            disablePictureInPicture
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

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

          {/* Not-our-QR notice — camera keeps running underneath */}
          {invalidQrNotice && !isSuccessFlash && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-2 z-30 w-[92%] max-w-[300px] bg-amber-950/90 border border-amber-400/70 rounded-xl px-3 py-2 shadow-2xl">
              <p className="text-[11px] font-bold text-amber-200 leading-snug text-center">{invalidQrNotice}</p>
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
            ? 'நமது SWMS QR-ஐ மட்டும் ஸ்கேன் செய்யும் • சட்டகத்தில் 10–15 செ.மீ • Blur-ஆ இருந்தால் frame-ஐ தட்டவும்'
            : 'Scans only our SWMS QR codes • Hold 10–15 cm inside the frame • Tap the frame if blurry'}
        </p>


      </div>

    </div>
  );
};

export default SWMSScannerView;
