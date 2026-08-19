import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  Zap,
  ZapOff,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Barcode,
  QrCode,
  Sparkles,
  Maximize2,
  Volume2,
  VolumeX,
  Layers,
  TestTube,
  ShieldCheck,
  Search,
  ArrowRight,
  RefreshCw,
  Clock,
  Activity
} from 'lucide-react';
import jsQR from 'jsqr';

export interface ScanResult {
  code: string;
  format: string;
  timestamp: string;
}

interface QuickScanCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedCode: string, detectedFormat?: string) => void;
  sampleCatalogHints?: { barcode: string; label: string; patientName: string; test: string }[];
}

export const QuickScanCameraModal: React.FC<QuickScanCameraModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  sampleCatalogHints = [
    { barcode: 'BAR-CARD-01', label: 'Tubo Li-Heparina 4mL', patientName: 'Ríos, Gonzalo A.', test: 'Troponina I + CK-MB STAT' },
    { barcode: 'BAR-GAS-02', label: 'Jeringa Heparinizada 2mL', patientName: 'Morales, Valeria M.', test: 'Gasometría Arterial STAT' },
    { barcode: 'BAR-COAG-03', label: 'Tubo Citrato 3.2% 2.7mL', patientName: 'Castillo, Manuel E.', test: 'TTPa + TP / INR Quirúrgico' },
    { barcode: 'BAR-HEM-04', label: 'Tubo EDTA K2 3mL', patientName: 'Vega, Lucía S.', test: 'Hemograma Completo STAT' },
    { barcode: 'BAR-998101', label: 'Frasco BSL-3 Esputo', patientName: 'Santamaría, Fernando R.', test: 'PCR GenExpert BK (BSL-3)' },
    { barcode: 'LAB-9024', label: 'Tubo Suero 5mL', patientName: 'Restrepo, Elena M.', test: 'Perfil Tiroideo (Reflex TSH)' }
  ]
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastScanned, setLastScanned] = useState<ScanResult | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(true);

  // Play auditory feedback chime
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  // Stop camera media tracks
  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start camera media stream
  const startCamera = async (deviceId?: string) => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('El navegador actual no soporta acceso a la cámara mediante WebRTC.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        setIsScanning(true);

        // Check torch support
        const track = stream.getVideoTracks()[0];
        if (track && typeof track.getCapabilities === 'function') {
          const capabilities = track.getCapabilities() as { torch?: boolean };
          setTorchSupported(Boolean(capabilities.torch));
        }

        // List video devices for switcher
        if (navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevs = devices.filter((d) => d.kind === 'videoinput');
          setAvailableDevices(videoDevs);
        }

        // Start processing video frames
        processVideoFrame();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al acceder a la cámara.';
      setCameraError(`No se pudo iniciar la cámara: ${errorMsg}. Asegúrese de permitir los permisos de cámara en el navegador.`);
      setIsCameraActive(false);
    }
  };

  // Toggle flash torch if supported
  const toggleTorch = async () => {
    if (!streamRef.current || !torchSupported) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && typeof track.applyConstraints === 'function') {
      try {
        const nextState = !torchEnabled;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchEnabled(nextState);
      } catch (err) {
        console.warn('Torch not allowed or supported on this track:', err);
      }
    }
  };

  // Process live camera frames for barcodes and QR codes
  const processVideoFrame = async () => {
    if (!isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        let detectedCode: string | null = null;
        let detectedFormat = 'UNKNOWN';

        // 1. Try Native BarcodeDetector API if available in Chromium/Safari
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ('BarcodeDetector' in window && typeof (window as any).BarcodeDetector === 'function') {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const barcodeDetector = new (window as any).BarcodeDetector({
              formats: [
                'qr_code',
                'code_128',
                'code_39',
                'code_93',
                'codabar',
                'ean_13',
                'ean_8',
                'itf',
                'upc_a',
                'upc_e',
                'data_matrix'
              ]
            });
            const barcodes = await barcodeDetector.detect(canvas);
            if (barcodes && barcodes.length > 0) {
              detectedCode = barcodes[0].rawValue;
              detectedFormat = barcodes[0].format || 'BARCODE';
            }
          } catch {
            // Fallback to jsQR
          }
        }

        // 2. Try jsQR for robust QR Code detection fallback
        if (!detectedCode) {
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth'
            });
            if (qrResult && qrResult.data) {
              detectedCode = qrResult.data;
              detectedFormat = 'QR_CODE';
            }
          } catch {
            // Frame parsing skipped
          }
        }

        // 3. Handle Detected Barcode / QR Code
        if (detectedCode && detectedCode.trim()) {
          const cleanCode = detectedCode.trim();
          handleRecognizedCode(cleanCode, detectedFormat);
          return; // Stop scan loop until handled
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(processVideoFrame);
  };

  const handleRecognizedCode = (code: string, format: string) => {
    setIsScanning(false);
    playBeep();
    if (navigator.vibrate) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch {
        // Ignored if vibration not permitted
      }
    }

    const result: ScanResult = {
      code,
      format,
      timestamp: new Date().toLocaleTimeString()
    };
    setLastScanned(result);

    // Provide visual confirmation delay then dispatch
    setTimeout(() => {
      onScanSuccess(code, format);
      onClose();
    }, 600);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    handleRecognizedCode(manualCodeInput.trim(), 'MANUAL_ENTRY');
  };

  const handleSelectSimulated = (barcode: string) => {
    handleRecognizedCode(barcode, 'SIMULATED_TEST_SCAN');
  };

  useEffect(() => {
    if (isOpen) {
      setLastScanned(null);
      setIsScanning(true);
      startCamera(selectedDeviceId);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, selectedDeviceId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-teal-500/30 rounded-[2rem] sm:rounded-[2.5rem] max-w-2xl w-full p-5 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.85)] space-y-5 relative overflow-hidden text-slate-100">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-teal-400" />
                <span>Escáner Óptico de Mesón</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Code 128 / Code 39 / QR / DataMatrix
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center space-x-2">
              <Camera className="w-5 h-5 text-teal-400" />
              <span>Lectura Rápida de Muestra (Quick Scan)</span>
            </h2>
            <p className="text-xs text-slate-300">
              Enfoque el código de barras o QR de la etiqueta del tubo para abrir inmediatamente la orden.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport with Laser Reticle */}
        <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-teal-500/40 aspect-video flex items-center justify-center shadow-inner group">
          
          {/* Video Stream Element */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
            muted
            playsInline
          />
          
          {/* Hidden Canvas for Frame Processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Fallback View when Camera is Inactive or Error */}
          {!isCameraActive && (
            <div className="p-6 text-center space-y-3 max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto animate-pulse">
                <Camera className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-white">Iniciando Sensor Óptico...</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {cameraError || 'Solicitando permisos de cámara para escaneo de etiquetas de tubos...'}
              </p>
              <button
                onClick={() => startCamera(selectedDeviceId)}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 mx-auto cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reintentar Conexión de Cámara</span>
              </button>
            </div>
          )}

          {/* Viewfinder Target HUD Overlay (Active when camera is rolling) */}
          {isCameraActive && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              
              {/* Reticle Target Box */}
              <div className="relative w-64 sm:w-80 h-36 sm:h-44 border-2 border-teal-400/80 rounded-2xl shadow-[0_0_30px_rgba(45,212,191,0.25)]">
                
                {/* Corner Brackets */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-teal-300 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-teal-300 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-teal-300 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-teal-300 rounded-br-lg" />

                {/* Sweeping Laser Line Animation */}
                {isScanning && (
                  <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_12px_#2dd4bf] animate-[bounce_2s_infinite]" />
                )}

                {/* Lock-On Success Flash */}
                {lastScanned && (
                  <div className="absolute inset-0 bg-emerald-500/30 rounded-2xl flex items-center justify-center animate-in zoom-in-90 duration-200">
                    <div className="bg-slate-950/90 border border-emerald-400 px-3 py-1.5 rounded-xl flex items-center space-x-2 text-emerald-300 font-mono text-xs font-bold shadow-2xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{lastScanned.code}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Center Helper Text */}
              <div className="mt-3 bg-slate-950/80 border border-white/10 px-3 py-1 rounded-full text-[10px] font-mono text-teal-300 flex items-center space-x-1.5 shadow-md">
                <Barcode className="w-3.5 h-3.5 text-teal-400" />
                <span>Alinee el código de barras dentro del marco</span>
              </div>
            </div>
          )}

          {/* On-Screen Camera Controls Overlay */}
          {isCameraActive && (
            <div className="absolute top-3 right-3 flex items-center space-x-2 z-20">
              {torchSupported && (
                <button
                  onClick={toggleTorch}
                  title={torchEnabled ? 'Apagar Flash' : 'Encender Flash Linterna'}
                  className={`p-2 rounded-xl border backdrop-blur-md transition cursor-pointer ${
                    torchEnabled
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950/70 text-slate-300 border-white/10 hover:bg-slate-800'
                  }`}
                >
                  {torchEnabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                </button>
              )}

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Silenciar Beep' : 'Activar Sonido Beep'}
                className="p-2 rounded-xl bg-slate-950/70 text-slate-300 border border-white/10 hover:bg-slate-800 backdrop-blur-md transition cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {availableDevices.length > 1 && (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="bg-slate-950/80 border border-white/10 rounded-xl px-2 py-1.5 text-[10px] font-mono text-slate-300 focus:outline-none cursor-pointer"
                >
                  {availableDevices.map((dev, idx) => (
                    <option key={dev.deviceId} value={dev.deviceId}>
                      {dev.label || `Cámara ${idx + 1}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Manual Barcode Entry Fallback Form */}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Barcode className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="O ingrese código manual (Ej: BAR-CARD-01, ORD-2026-9001)..."
              value={manualCodeInput}
              onChange={(e) => setManualCodeInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={!manualCodeInput.trim()}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:hover:bg-teal-500 text-slate-950 font-black text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow"
          >
            <span>Buscar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Sample Presets (Bench Samples on Deck) */}
        <div className="space-y-2 pt-1 border-t border-white/10">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <TestTube className="w-3.5 h-3.5 text-teal-400" />
              <span>Muestras Activas en Mesón (Acceso Rápido 1-Clic)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Click para simular escaneo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {sampleCatalogHints.map((hint) => (
              <button
                key={hint.barcode}
                type="button"
                onClick={() => handleSelectSimulated(hint.barcode)}
                className="bg-slate-950/70 hover:bg-teal-950/40 hover:border-teal-500/50 p-2.5 rounded-xl border border-white/5 transition-all text-left flex items-center justify-between group cursor-pointer"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                      {hint.barcode}
                    </span>
                    <span className="text-[11px] font-bold text-white truncate">{hint.patientName}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {hint.test} • <span className="text-slate-500">{hint.label}</span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer info note */}
        <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-white/5">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>ISO 15189:2022 §7.3 - Trazabilidad unívoca de espécimen preanalítico.</span>
          </div>
          <span className="font-mono text-slate-500">AbregoTech LIS</span>
        </div>

      </div>
    </div>
  );
};
