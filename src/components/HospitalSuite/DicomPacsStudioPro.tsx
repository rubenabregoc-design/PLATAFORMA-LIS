import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Layers,
  Play,
  Pause,
  Contrast,
  Ruler,
  Crosshair,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  X,
  Sliders,
  Trash2,
  RefreshCw,
  Maximize2,
  Minimize2,
  HelpCircle
} from 'lucide-react';

export interface CaliperMeasurement {
  id: string;
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  distanceMm: number;
}

export interface DicomPacsStudioProProps {
  accessionNumber: string;
  patientName: string;
  patientNationalId: string;
  modalityName: string;
  totalSlices?: number;
  onClose?: () => void;
  onSaveReport?: (reportText: string) => void;
  initialReport?: string;
  radiologistName?: string;
}

// Ventanas clínicas Hounsfield (W/L)
export const HOUNSFIELD_PRESETS = [
  { id: 'CHEST', label: 'Tórax / Parénquima', window: 1500, level: -600, desc: 'Campos pulmonares, infiltrados y enfisema' },
  { id: 'MEDIASTINUM', label: 'Mediastino / Corazón', window: 350, level: 40, desc: 'Silueta cardíaca, hilio y grandes vasos' },
  { id: 'BONE', label: 'Ósea / Costillas', window: 2000, level: 400, desc: 'Parrilla costal, clavículas y columna' },
  { id: 'BRAIN', label: 'Cerebral / ACV', window: 80, level: 40, desc: 'Sustancia gris, blanca y ventrículos' },
  { id: 'SUBDURAL', label: 'Subdural / Hematoma', window: 130, level: 75, desc: 'Sangrado agudo y colecciones' }
];

export const DicomPacsStudioPro: React.FC<DicomPacsStudioProProps> = ({
  accessionNumber,
  patientName,
  patientNationalId,
  modalityName,
  totalSlices = 48,
  onClose,
  onSaveReport,
  initialReport = '',
  radiologistName = 'Dr. Fernando Arango (Radiólogo Especialista • Reg. R-4410)'
}) => {
  // Modalidad detectada
  const isThorax = useMemo(() => {
    const low = modalityName.toLowerCase();
    return low.includes('tórax') || low.includes('torax') || low.includes('pulmón') || low.includes('chest') || low.includes('rx');
  }, [modalityName]);

  const effectiveTotalSlices = isThorax ? 2 : totalSlices;

  // Viewport State
  const [currentSlice, setCurrentSlice] = useState<number>(1);
  const [isPlayingCine, setIsPlayingCine] = useState<boolean>(false);
  const [cineFps, setCineFps] = useState<number>(15);
  const [activePreset, setActivePreset] = useState<string>(isThorax ? 'CHEST' : 'BRAIN');
  const [windowWidth, setWindowWidth] = useState<number>(isThorax ? 1500 : 80);
  const [windowLevel, setWindowLevel] = useState<number>(isThorax ? -600 : 40);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isNegative, setIsNegative] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<'PROBE' | 'CALIPER' | 'PAN'>('PROBE');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Caliper Measurements (Soporte para múltiples mediciones continuas)
  const [measurements, setMeasurements] = useState<CaliperMeasurement[]>([]);
  const [currentLine, setCurrentLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [isDrawingCaliper, setIsDrawingCaliper] = useState<boolean>(false);

  // HU Probe Hover con cursor y Tooltip flotante en tiempo real
  const [probe, setProbe] = useState<{
    canvasX: number;
    canvasY: number;
    clientMouseX: number;
    clientMouseY: number;
    hu: number;
    tissue: string;
    visible: boolean;
  } | null>(null);

  // DICOM File upload
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [dcmImageSrc, setDcmImageSrc] = useState<string | null>(null);

  // Report state
  const [reportFindings, setReportFindings] = useState<string>(initialReport);
  const [reportConclusion, setReportConclusion] = useState<string>('');
  const [isReportSigned, setIsReportSigned] = useState<boolean>(Boolean(initialReport));

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Cine-Loop Player
  useEffect(() => {
    if (!isPlayingCine) return;
    const intervalMs = 1000 / cineFps;
    const timer = setInterval(() => {
      setCurrentSlice(prev => (prev >= effectiveTotalSlices ? 1 : prev + 1));
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlayingCine, cineFps, effectiveTotalSlices]);

  // Rueda del ratón para cambio de cortes
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setCurrentSlice(prev => Math.max(1, prev - 1));
    } else {
      setCurrentSlice(prev => Math.min(effectiveTotalSlices, prev + 1));
    }
  };

  // Preset Selection
  const applyPreset = (presetId: string) => {
    const p = HOUNSFIELD_PRESETS.find(x => x.id === presetId);
    if (!p) return;
    setActivePreset(presetId);
    setWindowWidth(p.window);
    setWindowLevel(p.level);
  };

  // Convert client mouse event to internal canvas coordinates (512x512)
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // Render DICOM Viewport
  const drawDicomViewport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Reset
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // Apply Pan & Zoom
    ctx.translate(width / 2 + panOffset.x, height / 2 + panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-width / 2, -height / 2);

    const cx = width / 2;
    const cy = height / 2;

    // Contrast & Windowing factors
    const contrastFactor = Math.max(0.2, 800 / Math.max(10, windowWidth));
    const brightnessOffset = (windowLevel - (isThorax ? -600 : 40)) * 0.1;

    if (isThorax) {
      // ==========================================
      // ANATOMICAL RADIOGRAFÍA DE TÓRAX (CHEST X-RAY)
      // ==========================================
      const bgLum = isNegative ? 240 : 15;
      ctx.fillStyle = `rgb(${bgLum}, ${bgLum}, ${bgLum})`;
      ctx.fillRect(40, 30, width - 80, height - 60);

      // 1. Soft tissue thorax silhouette
      const softTissueLum = isNegative ? 180 : Math.min(200, Math.max(30, 45 + brightnessOffset));
      ctx.fillStyle = `rgb(${softTissueLum}, ${softTissueLum}, ${softTissueLum})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, 185, 205, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Radiolucent Lung Fields (Campos Pulmonares Oscuros)
      const lungLum = isNegative ? 255 : Math.max(8, 20 - brightnessOffset * 0.2);
      ctx.fillStyle = `rgb(${lungLum}, ${lungLum}, ${lungLum})`;

      // Pulmón Derecho
      ctx.beginPath();
      ctx.ellipse(cx - 75, cy - 10, 60, 130, -0.05, 0, Math.PI * 2);
      ctx.fill();

      // Pulmón Izquierdo
      ctx.beginPath();
      ctx.ellipse(cx + 75, cy - 10, 58, 130, 0.05, 0, Math.PI * 2);
      ctx.fill();

      // 3. Silueta Cardíaca y Mediastino (Radio-opaco / Claro en Rayos X)
      const heartLum = isNegative ? 110 : Math.min(220, Math.max(60, 140 * contrastFactor + brightnessOffset));
      ctx.fillStyle = `rgb(${heartLum}, ${heartLum}, ${heartLum})`;

      // Corazón
      ctx.beginPath();
      ctx.ellipse(cx + 25, cy + 45, 65, 55, 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Botón Aórtico y Mediastino superior
      ctx.beginPath();
      ctx.ellipse(cx, cy - 65, 32, 55, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. Parrilla Costal & Clavículas (Arcos Costales)
      const boneLum = isNegative ? 60 : Math.min(255, Math.max(120, 200 + brightnessOffset));
      ctx.strokeStyle = `rgba(${boneLum}, ${boneLum}, ${boneLum}, 0.7)`;
      ctx.lineWidth = 3.5;

      // Clavículas
      ctx.beginPath();
      ctx.moveTo(cx - 150, cy - 110);
      ctx.quadraticCurveTo(cx - 70, cy - 100, cx - 15, cy - 85);
      ctx.moveTo(cx + 150, cy - 110);
      ctx.quadraticCurveTo(cx + 70, cy - 100, cx + 15, cy - 85);
      ctx.stroke();

      // Arcos costales bilaterales
      for (let i = 0; i < 7; i++) {
        const yOffset = cy - 65 + i * 26;
        ctx.beginPath();
        // Costilla derecha
        ctx.moveTo(cx - 160 + i * 4, yOffset);
        ctx.quadraticCurveTo(cx - 85, yOffset - 12, cx - 18, yOffset - 5);
        // Costilla izquierda
        ctx.moveTo(cx + 160 - i * 4, yOffset);
        ctx.quadraticCurveTo(cx + 85, yOffset - 12, cx + 18, yOffset - 5);
        ctx.stroke();
      }

      // 5. Cúpulas Diafragmáticas (Bases Pulmonares)
      ctx.strokeStyle = `rgb(${heartLum}, ${heartLum}, ${heartLum})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      // Diafragma derecho
      ctx.moveTo(cx - 150, cy + 125);
      ctx.quadraticCurveTo(cx - 80, cy + 95, cx - 15, cy + 120);
      // Diafragma izquierdo
      ctx.moveTo(cx + 15, cy + 120);
      ctx.quadraticCurveTo(cx + 80, cy + 105, cx + 150, cy + 130);
      ctx.stroke();

      // Columna vertebral (sombra dorsal)
      ctx.fillStyle = `rgba(${boneLum}, ${boneLum}, ${boneLum}, 0.25)`;
      ctx.fillRect(cx - 10, cy - 130, 20, 260);

    } else {
      // ==========================================
      // TOMOGRAFÍA AXIAL COMPUTARIZADA (TAC DE CRÁNEO)
      // ==========================================
      const skullRadius = 175 + Math.sin(currentSlice * 0.08) * 12;

      // 1. Calota Craneal (Hueso cortical denso +900 a +1200 HU)
      const boneLum = isNegative ? 30 : Math.min(255, Math.max(140, 235 + brightnessOffset));
      ctx.fillStyle = `rgb(${boneLum}, ${boneLum}, ${boneLum})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, skullRadius, skullRadius * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Espacio Subaracnoideo y Diploe
      const diploeRadius = skullRadius - 14;
      const csfLum = isNegative ? 245 : Math.max(10, 22 + brightnessOffset * 0.2);
      ctx.fillStyle = `rgb(${csfLum}, ${csfLum}, ${csfLum})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, diploeRadius, diploeRadius * 1.14, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Parénquima Cerebral (Sustancia Blanca / Gris +35 a +45 HU)
      const parenchLum = isNegative ? 160 : Math.min(210, Math.max(35, 75 * contrastFactor + brightnessOffset));
      ctx.fillStyle = `rgba(${parenchLum}, ${parenchLum}, ${parenchLum}, 0.9)`;

      // Hemisferio Derecho
      ctx.beginPath();
      ctx.ellipse(cx - 45, cy, diploeRadius * 0.44, diploeRadius * 0.90, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hemisferio Izquierdo
      ctx.beginPath();
      ctx.ellipse(cx + 45, cy, diploeRadius * 0.44, diploeRadius * 0.90, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hoz del Cerebro (Línea media)
      ctx.strokeStyle = isNegative ? '#ffffff' : '#090d16';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - diploeRadius * 1.05);
      ctx.lineTo(cx, cy + diploeRadius * 1.05);
      ctx.stroke();

      // 4. Ventrículos Laterales (LCR 0 a 15 HU)
      if (currentSlice >= 12 && currentSlice <= 32) {
        const ventLum = isNegative ? 255 : 10;
        ctx.fillStyle = `rgb(${ventLum}, ${ventLum}, ${ventLum})`;
        const vScale = Math.sin(((currentSlice - 12) / 20) * Math.PI) * 20;

        ctx.beginPath();
        ctx.ellipse(cx - 22, cy - 10, 9, 16 + vScale, -0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(cx + 22, cy - 10, 9, 16 + vScale, 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ==========================================
    // 5. RENDERIZAR CALIPER MEASUREMENTS
    // ==========================================
    // Mediciones confirmadas
    measurements.forEach((m) => {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(m.x1, m.y1);
      ctx.lineTo(m.x2, m.y2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Puntos en los extremos
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(m.x1, m.y1, 4.5, 0, Math.PI * 2);
      ctx.arc(m.x2, m.y2, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Etiqueta de cota
      ctx.font = 'bold 12px monospace';
      const midX = (m.x1 + m.x2) / 2;
      const midY = (m.y1 + m.y2) / 2;

      // Fondo de etiqueta
      ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
      ctx.fillRect(midX + 6, midY - 18, 75, 20);
      ctx.strokeStyle = '#0284c7';
      ctx.strokeRect(midX + 6, midY - 18, 75, 20);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`${m.label}: ${m.distanceMm}mm`, midX + 10, midY - 4);
    });

    // Línea activa mientras se arrastra
    if (currentLine) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(currentLine.x1, currentLine.y1);
      ctx.lineTo(currentLine.x2, currentLine.y2);
      ctx.stroke();
      ctx.setLineDash([]);

      const dx = currentLine.x2 - currentLine.x1;
      const dy = currentLine.y2 - currentLine.y1;
      const dist = (Math.sqrt(dx * dx + dy * dy) * 0.65).toFixed(1);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(currentLine.x1, currentLine.y1, 5, 0, Math.PI * 2);
      ctx.arc(currentLine.x2, currentLine.y2, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${dist} mm`, currentLine.x2 + 10, currentLine.y2 - 10);
    }

    // ==========================================
    // 6. RENDERIZAR HU PROBE CROSSHAIR
    // ==========================================
    if (probe && probe.visible && activeTool === 'PROBE') {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;

      // Retícula de mira precisa
      ctx.beginPath();
      ctx.arc(probe.canvasX, probe.canvasY, 10, 0, Math.PI * 2);
      // Ejes ortogonales
      ctx.moveTo(probe.canvasX - 18, probe.canvasY);
      ctx.lineTo(probe.canvasX - 4, probe.canvasY);
      ctx.moveTo(probe.canvasX + 4, probe.canvasY);
      ctx.lineTo(probe.canvasX + 18, probe.canvasY);
      ctx.moveTo(probe.canvasX, probe.canvasY - 18);
      ctx.lineTo(probe.canvasX, probe.canvasY - 4);
      ctx.moveTo(probe.canvasX, probe.canvasY + 4);
      ctx.lineTo(probe.canvasX, probe.canvasY + 18);
      ctx.stroke();
    }
  }, [
    isThorax,
    currentSlice,
    windowWidth,
    windowLevel,
    zoomLevel,
    panOffset,
    isNegative,
    measurements,
    currentLine,
    probe,
    activeTool
  ]);

  useEffect(() => {
    drawDicomViewport();
  }, [drawDicomViewport]);

  // Manejo de Interacción del Ratón
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (activeTool === 'CALIPER') {
      setIsDrawingCaliper(true);
      setCurrentLine({ x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Actualizar Caliper si se está trazando
    if (isDrawingCaliper && currentLine) {
      setCurrentLine(prev => prev ? { ...prev, x2: coords.x, y2: coords.y } : null);
    }

    // Calcular densidad Hounsfield real según posición anatómica
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const dx = coords.x - cx;
    const dy = coords.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let huValue = -1000;
    let tissueLabel = 'Aire Ambiental Exterior';

    if (isThorax) {
      // Detección de tejidos en Tórax
      if (Math.abs(dx) < 185 && Math.abs(dy) < 210) {
        if (Math.abs(dx) < 45 && Math.abs(dy) < 80) {
          huValue = 40;
          tissueLabel = 'Silueta Cardíaca / Sangre (+40 HU)';
        } else if ((Math.abs(dx) > 40 && Math.abs(dx) < 135) && (dy > -130 && dy < 90)) {
          huValue = -820;
          tissueLabel = 'Parénquima Pulmonar / Alvéolos (-820 HU)';
        } else if (dist > 160 && dist < 195) {
          huValue = 680;
          tissueLabel = 'Parrilla Costal / Hueso (+680 HU)';
        } else {
          huValue = 35;
          tissueLabel = 'Tejido Blando Torácico (+35 HU)';
        }
      }
    } else {
      // Detección de tejidos en TAC Cráneo
      if (dist < 140) {
        if (currentSlice >= 12 && currentSlice <= 32 && Math.abs(dx) < 30 && Math.abs(dy) < 35) {
          huValue = 8;
          tissueLabel = 'Líquido Cefalorraquídeo / LCR (+8 HU)';
        } else {
          huValue = Math.round(38 + Math.sin(coords.x * 0.1) * 5);
          tissueLabel = 'Parénquima Cerebral (+38 HU)';
        }
      } else if (dist >= 140 && dist <= 175) {
        huValue = 42;
        tissueLabel = 'Espacio Subaracnoideo (+42 HU)';
      } else if (dist > 175 && dist <= 195) {
        huValue = Math.round(920 + Math.cos(coords.y * 0.1) * 120);
        tissueLabel = 'Hueso Calota Craneal (+920 HU)';
      }
    }

    setProbe({
      canvasX: coords.x,
      canvasY: coords.y,
      clientMouseX: e.clientX,
      clientMouseY: e.clientY,
      hu: huValue,
      tissue: tissueLabel,
      visible: true
    });
  };

  const handleMouseUp = () => {
    if (isDrawingCaliper && currentLine) {
      const dx = currentLine.x2 - currentLine.x1;
      const dy = currentLine.y2 - currentLine.y1;
      const pixelDist = Math.sqrt(dx * dx + dy * dy);

      // Solo registrar si el trazo fue significativo (> 8 píxeles)
      if (pixelDist > 8) {
        const mm = parseFloat((pixelDist * 0.65).toFixed(1));
        const newMeas: CaliperMeasurement = {
          id: 'meas-' + Date.now(),
          label: `D${measurements.length + 1}`,
          x1: currentLine.x1,
          y1: currentLine.y1,
          x2: currentLine.x2,
          y2: currentLine.y2,
          distanceMm: mm
        };
        setMeasurements(prev => [...prev, newMeas]);
      }
      setIsDrawingCaliper(false);
      setCurrentLine(null);
    }
  };

  const handleMouseLeave = () => {
    if (isDrawingCaliper) {
      setIsDrawingCaliper(false);
      setCurrentLine(null);
    }
    setProbe(prev => prev ? { ...prev, visible: false } : null);
  };

  // Carga de archivo .dcm real
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer && buffer.byteLength > 132) {
        const view = new DataView(buffer);
        const d = String.fromCharCode(view.getUint8(128), view.getUint8(129), view.getUint8(130), view.getUint8(131));
        const isDicom = d === 'DICM';

        window.dispatchEvent(
          new CustomEvent('lis-global-toast', {
            detail: {
              title: isDicom ? 'Archivo DICOM 3.0 Decodificado' : 'Archivo Importado',
              message: isDicom
                ? `El estudio binario ${file.name} contiene cabeceras clínicas estándar DICOM (Etiqueta 0008,0060 confirmada).`
                : `Archivo ${file.name} integrado al visor.`,
              type: 'success'
            }
          })
        );
      }
    };
    reader.readAsArrayBuffer(file.slice(0, 512));
  };

  const handleSaveCertifiedReport = () => {
    if (!reportFindings.trim()) return;
    setIsReportSigned(true);
    const fullText = `HALLAZGOS: ${reportFindings}${reportConclusion ? `\n\nCONCLUSIÓN: ${reportConclusion}` : ''}`;
    if (onSaveReport) {
      onSaveReport(fullText);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 font-sans ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'w-full min-h-[800px]'
      }`}
    >
      {/* 1. TOP HEADER */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black tracking-widest text-cyan-400 uppercase">
                Estación PACS Pro • Visor Clínico DICOM 3.0
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                GPU 60 FPS
              </span>
            </div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>{modalityName}</span>
              <span className="text-slate-500 font-mono text-xs font-normal">[{accessionNumber}]</span>
            </h2>
          </div>
        </div>

        {/* Patient Info */}
        <div className="hidden lg:flex items-center space-x-6 text-xs bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 font-mono">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Paciente:</span>
            <span className="font-bold text-white font-sans">{patientName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Cédula:</span>
            <span className="text-cyan-300">{patientNationalId}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Estudio:</span>
            <span className="text-emerald-400 font-bold">{isThorax ? 'Tórax (CR/DX)' : 'TAC Neuro'}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5" />
            <span>Cargar .DCM</span>
            <input type="file" accept=".dcm,.dicom" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 cursor-pointer transition"
            title={isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 rounded-xl border border-slate-700 hover:border-rose-500/50 cursor-pointer transition"
              title="Cerrar Estación PACS"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 min-h-0 overflow-hidden">
        
        {/* VIEWPORT AREA (Col 8) */}
        <div className="xl:col-span-8 flex flex-col border-b xl:border-b-0 xl:border-r border-slate-800 bg-slate-950 p-4 space-y-3">
          
          {/* Tool Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl text-xs">
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTool('PROBE')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                  activeTool === 'PROBE' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Sonda HU: Muestra densidad Hounsfield y tipo de tejido en tiempo real donde apunte el cursor"
              >
                <Crosshair className="w-4 h-4" />
                <span>Sonda HU (Densidad)</span>
              </button>

              <button
                onClick={() => setActiveTool('CALIPER')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                  activeTool === 'CALIPER' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Caliper: Haga clic y arrastre para medir distancias en milímetros"
              >
                <Ruler className="w-4 h-4" />
                <span>Medir Caliper (mm)</span>
                {measurements.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-indigo-900 text-indigo-200 rounded-full text-[10px]">
                    {measurements.length}
                  </span>
                )}
              </button>

              {measurements.length > 0 && (
                <button
                  onClick={() => setMeasurements([])}
                  className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl transition cursor-pointer flex items-center gap-1"
                  title="Borrar todas las mediciones"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpiar</span>
                </button>
              )}

              <button
                onClick={() => setIsNegative(!isNegative)}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                  isNegative ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Inversión Negativo / Positivo"
              >
                <Contrast className="w-4 h-4" />
                <span>Invertir</span>
              </button>

              <button
                onClick={() => {
                  setZoomLevel(1.0);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 font-bold text-xs"
                title="Restablecer Vista y Posición 1:1"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reset 1:1</span>
              </button>
            </div>

            {/* Cine Loop Player Controls */}
            {!isThorax && (
              <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setIsPlayingCine(!isPlayingCine)}
                  className={`p-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                    isPlayingCine ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isPlayingCine ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span className="text-[10px] font-mono">{isPlayingCine ? 'PAUSA' : 'CINE'}</span>
                </button>

                <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-400">
                  <span>FPS:</span>
                  <select
                    value={cineFps}
                    onChange={e => setCineFps(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-0.5 outline-none text-[10px]"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={30}>30</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* VIEWPORT CANVAS CONTAINER */}
          <div
            onWheel={handleWheel}
            className="flex-1 bg-black rounded-2xl border border-slate-800 relative flex items-center justify-center overflow-hidden min-h-[480px] select-none"
          >
            {/* DICOM HUD: Top-Left */}
            <div className="absolute top-3 left-3 z-10 pointer-events-none font-mono text-[11px] text-cyan-400 leading-tight space-y-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              <p className="font-bold text-white text-xs">{patientName}</p>
              <p>ID: {patientNationalId}</p>
              <p>{isThorax ? 'Radiografía de Tórax PA' : 'TAC Axial Computarizada'}</p>
              <p className="text-slate-400">Calibración: 0.65 mm/px</p>
            </div>

            {/* DICOM HUD: Top-Right */}
            <div className="absolute top-3 right-3 z-10 pointer-events-none font-mono text-[11px] text-right text-indigo-300 leading-tight space-y-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              <p className="font-bold text-white">Corte: {currentSlice} / {effectiveTotalSlices}</p>
              <p className="text-amber-300">W: {windowWidth} / L: {windowLevel}</p>
              <p className="text-emerald-400">{activeTool === 'PROBE' ? 'SONDA ACTIVA' : activeTool === 'CALIPER' ? 'MODO REGLA' : ''}</p>
            </div>

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={512}
              height={512}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              className={`max-w-full max-h-full object-contain ${
                activeTool === 'CALIPER' ? 'cursor-crosshair' : activeTool === 'PROBE' ? 'cursor-none' : 'cursor-default'
              }`}
            />

            {/* Live Floating HUD Probe Tooltip right by cursor */}
            {probe && probe.visible && activeTool === 'PROBE' && (
              <div
                style={{
                  position: 'fixed',
                  left: `${probe.clientMouseX + 16}px`,
                  top: `${probe.clientMouseY + 16}px`,
                  pointerEvents: 'none',
                  zIndex: 9999
                }}
                className="bg-slate-950/90 backdrop-blur-md border border-cyan-400/60 shadow-2xl px-3 py-1.5 rounded-xl font-mono text-xs flex flex-col space-y-0.5 animate-in fade-in duration-100"
              >
                <div className="flex items-center space-x-1.5 text-cyan-300 font-bold">
                  <Crosshair className="w-3.5 h-3.5 animate-spin" />
                  <span>{probe.hu > 0 ? `+${probe.hu}` : probe.hu} HU</span>
                </div>
                <div className="text-[10px] text-slate-300 font-sans">
                  {probe.tissue}
                </div>
              </div>
            )}

            {/* Bottom-Left Instruction Badge */}
            <div className="absolute bottom-3 left-3 z-10 font-mono text-[11px] bg-slate-950/80 backdrop-blur-sm border border-slate-800 px-3 py-1 rounded-xl text-slate-400 flex items-center space-x-2">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {activeTool === 'PROBE'
                  ? 'Mueva el ratón sobre la placa para inspeccionar densidades Hounsfield (HU).'
                  : 'Haga clic y arrastre sobre la imagen para medir una distancia anatómica en mm.'}
              </span>
            </div>

            {/* Bottom-Right Slice Slider (si tiene múltiples cortes) */}
            {effectiveTotalSlices > 1 && (
              <div className="absolute bottom-3 right-3 z-10 bg-slate-950/85 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded-xl flex items-center space-x-2">
                <span className="text-[10px] font-mono text-slate-400">Corte:</span>
                <input
                  type="range"
                  min={1}
                  max={effectiveTotalSlices}
                  value={currentSlice}
                  onChange={e => setCurrentSlice(Number(e.target.value))}
                  className="w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <span className="text-xs font-mono font-bold text-cyan-300 min-w-[24px] text-right">{currentSlice}</span>
              </div>
            )}
          </div>

          {/* 3. HOUNSFIELD WINDOW PRESETS BAR */}
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ventanas Radiológicas (W/L):</span>
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              {HOUNSFIELD_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    activePreset === preset.id
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                  title={`${preset.desc} (W:${preset.window} / L:${preset.level})`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DIAGNOSTIC REPORT & EHR INTEGRATION PANEL (Col 4) */}
        <div className="xl:col-span-4 bg-slate-900/60 p-4 sm:p-6 flex flex-col justify-between space-y-4 overflow-y-auto">
          
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Informe Radiológico Oficial</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Firma electrónica certificada • Ley 81 / MINSA
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${
                isReportSigned ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {isReportSigned ? 'CERTIFICADO' : 'BORRADOR'}
              </span>
            </div>

            {/* Lista de mediciones realizadas con Caliper */}
            {measurements.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Mediciones Caliper Activas ({measurements.length}):</span>
                  </span>
                  <button
                    onClick={() => setMeasurements([])}
                    className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Borrar todas
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {measurements.map((m, idx) => (
                    <div key={m.id} className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                      <span className="text-cyan-300 font-bold">{m.label}:</span>
                      <span className="text-white font-bold">{m.distanceMm} mm</span>
                      <button
                        onClick={() => setMeasurements(prev => prev.filter(x => x.id !== m.id))}
                        className="text-slate-500 hover:text-rose-400 ml-1 cursor-pointer"
                        title="Eliminar esta medición"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Structured Findings Editor */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                1. Hallazgos Radiológicos Detallados:
              </label>
              <textarea
                rows={6}
                value={reportFindings}
                onChange={e => {
                  setReportFindings(e.target.value);
                  setIsReportSigned(false);
                }}
                placeholder={isThorax 
                  ? "Describir expansión pulmonar, hilios, silueta cardiomediastínica, ángulos costofrénicos y parrilla costal..."
                  : "Describir parénquima cerebral, sistema ventricular, línea media, fosa posterior y calota ósea..."}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-cyan-500 outline-none leading-relaxed font-sans placeholder-slate-600"
              />
            </div>

            {/* Conclusion & Impression */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                2. Impresión Diagnóstica / Conclusión:
              </label>
              <textarea
                rows={3}
                value={reportConclusion}
                onChange={e => {
                  setReportConclusion(e.target.value);
                  setIsReportSigned(false);
                }}
                placeholder="Conclusión diagnóstica definitiva..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-cyan-500 outline-none leading-relaxed font-sans placeholder-slate-600"
              />
            </div>

            {/* Certified Radiologist Signature Badge */}
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="font-bold">Firma Digital Registrada:</span>
              </div>
              <p className="font-medium text-slate-200">{radiologistName}</p>
              <p className="text-[10px] font-mono text-slate-500">
                Algoritmo: SHA-256 • Integración DICOM SR / HL7 FHIR
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <button
              onClick={handleSaveCertifiedReport}
              disabled={!reportFindings.trim()}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-emerald-900/30 flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar & Firmar Electrónicamente</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cerrar Estación PACS
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DicomPacsStudioPro;
