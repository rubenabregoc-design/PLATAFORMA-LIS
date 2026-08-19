import React, { useState } from 'react';
import {
  Printer,
  QrCode,
  Barcode as BarcodeIcon,
  Wifi,
  WifiOff,
  Settings,
  Layers,
  Copy,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Plus,
  Trash2,
  Move,
  Type,
  Maximize2,
  Sliders,
  FileCode,
  Download,
  Send,
  Eye,
  Sparkles,
  TestTube,
  Layout,
  Tag,
  Check,
  Zap,
  Flame,
  Baby,
  Microscope,
  Container,
  Bookmark,
  X,
  Grid,
  Search,
  Server,
  HardDrive,
  Radio,
  MapPin,
  Globe,
  Activity,
  Cpu
} from 'lucide-react';

export interface TubeLabelTemplate {
  id: string;
  name: string;
  category: 'PRIMARIO' | 'ALICUOTA' | 'STAT' | 'PEDIATRICO' | 'HISTOLOGIA' | 'FRASCO';
  description: string;
  widthMm: number;
  heightMm: number;
  barcodeType: 'CODE128' | 'QR' | 'DATAMATRIX' | 'EAN13';
  fontSize: number;
  showPatientName: boolean;
  showOrderNumber: boolean;
  showCollectionDate: boolean;
  showTubeColorBadge: boolean;
  showTestsRequested: boolean;
  showBranchName: boolean;
  isStatUrgent?: boolean;
  aliquotTag?: string;
  dpi: 203 | 300;
  printerLanguage: 'ZPL' | 'TSPL' | 'EPL';
  rotation: 0 | 90 | 180 | 270;
  samplePatientName?: string;
  sampleTubeType?: 'EDTA_LAVENDER' | 'SST_GOLD' | 'CITRATE_BLUE' | 'HEPARIN_GREEN' | 'FLUORIDE_GRAY';
  sampleTests?: string;
}

export interface PrintQueueJob {
  id: string;
  orderNumber: string;
  patientName: string;
  patientCedula: string;
  tubeType: 'EDTA_LAVENDER' | 'SST_GOLD' | 'CITRATE_BLUE' | 'HEPARIN_GREEN' | 'FLUORIDE_GRAY';
  testCodes: string[];
  quantity: number;
  timestamp: string;
  status: 'PENDIENTE' | 'IMPRESO' | 'EN_COLA' | 'ERROR';
}

export interface NetworkPrinter {
  id: string;
  name: string;
  ip: string;
  port: number;
  protocol: 'WEBSOCKET' | 'RAW_TCP_9100' | 'USB_BRIDGE';
  model: string;
  location: string;
  branch: string;
  dpi: 203 | 300 | 600;
  languages: ('ZPL' | 'TSPL' | 'EPL')[];
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'PAPER_OUT';
  pingMs: number;
  isDefault: boolean;
  ribbonLevelPct: number;
  labelRollRemaining: number;
}

const AVAILABLE_BRANCHES = [
  'Sede Vía España',
  'Sede Calle 50',
  'Sede Costa del Este',
  'Sede Coronado',
  'Sede David Chiriquí'
];

const INITIAL_NETWORK_PRINTERS: NetworkPrinter[] = [
  {
    id: 'prn-01',
    name: 'Zebra ZD421 (Recepción #1)',
    ip: '192.168.1.105',
    port: 9100,
    protocol: 'WEBSOCKET',
    model: 'Zebra ZD421 Direct Thermal (203 dpi)',
    location: 'Módulo de Toma de Muestra - Box 1',
    branch: 'Sede Vía España',
    dpi: 203,
    languages: ['ZPL'],
    status: 'ONLINE',
    pingMs: 4,
    isDefault: true,
    ribbonLevelPct: 82,
    labelRollRemaining: 310
  },
  {
    id: 'prn-02',
    name: 'TSC TTP-244 Pro (Bioquímica)',
    ip: '192.168.1.112',
    port: 9100,
    protocol: 'RAW_TCP_9100',
    model: 'TSC TTP-244 Pro (203 dpi)',
    location: 'Área de Centrifugación & Separación',
    branch: 'Sede Vía España',
    dpi: 203,
    languages: ['TSPL', 'EPL'],
    status: 'ONLINE',
    pingMs: 7,
    isDefault: false,
    ribbonLevelPct: 65,
    labelRollRemaining: 185
  },
  {
    id: 'prn-03',
    name: 'Zebra ZT411 (Búnker Genética)',
    ip: '192.168.2.40',
    port: 9100,
    protocol: 'WEBSOCKET',
    model: 'Zebra ZT411 Industrial (300 dpi)',
    location: 'Laboratorio de Hematología & ADN',
    branch: 'Sede Calle 50',
    dpi: 300,
    languages: ['ZPL'],
    status: 'ONLINE',
    pingMs: 11,
    isDefault: true,
    ribbonLevelPct: 94,
    labelRollRemaining: 540
  },
  {
    id: 'prn-04',
    name: 'Citizen CL-S621 (Urgencias STAT)',
    ip: '192.168.3.18',
    port: 9100,
    protocol: 'RAW_TCP_9100',
    model: 'Citizen CL-S621 (203 dpi)',
    location: 'Recepción Triage Urgencias',
    branch: 'Sede Costa del Este',
    dpi: 203,
    languages: ['ZPL', 'EPL'],
    status: 'OFFLINE',
    pingMs: 0,
    isDefault: true,
    ribbonLevelPct: 15,
    labelRollRemaining: 40
  },
  {
    id: 'prn-05',
    name: 'Bixolon SLP-TX400 (Anatomía Patológica)',
    ip: '192.168.4.88',
    port: 9100,
    protocol: 'WEBSOCKET',
    model: 'Bixolon SLP-TX400 (300 dpi)',
    location: 'Procesamiento de Biopsias & Cassettes',
    branch: 'Sede Coronado',
    dpi: 300,
    languages: ['ZPL', 'TSPL'],
    status: 'ONLINE',
    pingMs: 14,
    isDefault: true,
    ribbonLevelPct: 88,
    labelRollRemaining: 220
  }
];

// --- GALERÍA DE PLANTILLAS PRE-DISEÑADAS ---
export const PREDESIGNED_TEMPLATES_GALLERY: TubeLabelTemplate[] = [
  {
    id: 'tpl-std-tube',
    name: 'Tubo Primario Estándar (50x25 mm)',
    category: 'PRIMARIO',
    description: 'Etiqueta de extracción directa en flebotomía con código de barras lineal Code128 y distinción de color de tapón.',
    widthMm: 50,
    heightMm: 25,
    barcodeType: 'CODE128',
    fontSize: 10,
    showPatientName: true,
    showOrderNumber: true,
    showCollectionDate: true,
    showTubeColorBadge: true,
    showTestsRequested: true,
    showBranchName: true,
    dpi: 203,
    printerLanguage: 'ZPL',
    rotation: 0,
    samplePatientName: 'ABREGO, FERNANDO',
    sampleTubeType: 'EDTA_LAVENDER',
    sampleTests: 'CBC, CREA, LIPID, TSH'
  },
  {
    id: 'tpl-aliquot-secondary',
    name: 'Tubo Alícuota / Secundario (35x20 mm)',
    category: 'ALICUOTA',
    description: 'Etiqueta compacta para tubos secundarios derivados tras centrifugación de suero o plasma en alícuotas de almacenamiento.',
    widthMm: 35,
    heightMm: 20,
    barcodeType: 'DATAMATRIX',
    fontSize: 8,
    showPatientName: true,
    showOrderNumber: true,
    showCollectionDate: false,
    showTubeColorBadge: true,
    showTestsRequested: true,
    showBranchName: false,
    aliquotTag: 'ALÍCUOTA #1 (SUERO)',
    dpi: 300,
    printerLanguage: 'ZPL',
    rotation: 0,
    samplePatientName: 'SANTOS, MARIA LOURDES',
    sampleTubeType: 'SST_GOLD',
    sampleTests: 'ALÍCUOTA - SEROTECA (F1)'
  },
  {
    id: 'tpl-stat-urgent',
    name: 'Etiqueta de Urgencia / STAT (50x30 mm)',
    category: 'STAT',
    description: 'Etiqueta destacada con franja roja de advertencia 🚨 STAT / URGENCIA MÉDICA para procesamiento prioritario inmediato.',
    widthMm: 50,
    heightMm: 30,
    barcodeType: 'CODE128',
    fontSize: 11,
    showPatientName: true,
    showOrderNumber: true,
    showCollectionDate: true,
    showTubeColorBadge: true,
    showTestsRequested: true,
    showBranchName: true,
    isStatUrgent: true,
    dpi: 203,
    printerLanguage: 'ZPL',
    rotation: 0,
    samplePatientName: 'VARGAS, ROBERTO (UCI)',
    sampleTubeType: 'HEPARIN_GREEN',
    sampleTests: 'GASES, ELECTROLITOS, TPT (STAT)'
  },
  {
    id: 'tpl-micro-pediatric',
    name: 'Micro-Tubo Pediátrico / Capilar (30x15 mm)',
    category: 'PEDIATRICO',
    description: 'Micro etiqueta ultra ajustada para tubos capilares o microvetas pediátricas de escaso volumen.',
    widthMm: 30,
    heightMm: 15,
    barcodeType: 'DATAMATRIX',
    fontSize: 8,
    showPatientName: true,
    showOrderNumber: true,
    showCollectionDate: false,
    showTubeColorBadge: true,
    showTestsRequested: false,
    showBranchName: false,
    dpi: 300,
    printerLanguage: 'ZPL',
    rotation: 0,
    samplePatientName: 'BEBÉ PÉREZ (NEONATOS)',
    sampleTubeType: 'EDTA_LAVENDER',
    sampleTests: 'BILIRRUBINA, HEMOGRAMA PED'
  },
  {
    id: 'tpl-cassette-pathology',
    name: 'Cassette Histología / Biopsias (25x25 mm)',
    category: 'HISTOLOGIA',
    description: 'Formato cuadrado con QR 2D de alta densidad resistente a solventes de parafinación en Anatomía Patológica.',
    widthMm: 25,
    heightMm: 25,
    barcodeType: 'QR',
    fontSize: 9,
    showPatientName: true,
    showOrderNumber: true,
    showCollectionDate: true,
    showTubeColorBadge: false,
    showTestsRequested: true,
    showBranchName: false,
    dpi: 300,
    printerLanguage: 'TSPL',
    rotation: 0,
    samplePatientName: 'GONZALEZ, ARTURO',
    sampleTubeType: 'SST_GOLD',
    sampleTests: 'BIOPSIA PIEL B-2026-89'
  },
  {
    id: 'tpl-sterile-container',
    name: 'Frasco Estéril / Orina - Copro (60x30 mm)',
    category: 'FRASCO',
    description: 'Etiqueta amplia para recipientes de recolección de orina de 24h, frascos coprológicos y cultivos de fluidos.',
    widthMm: 60,
    heightMm: 30,
    barcodeType: 'CODE128',
    fontSize: 11,
    showPatientName: true,
    showOrderNumber: true,
    showCollectionDate: true,
    showTubeColorBadge: true,
    showTestsRequested: true,
    showBranchName: true,
    dpi: 203,
    printerLanguage: 'ZPL',
    rotation: 0,
    samplePatientName: 'DE ICAZA, ELENA',
    sampleTubeType: 'FLUORIDE_GRAY',
    sampleTests: 'EGO, UROCULTIVO, CITIQUÍMICO'
  }
];

const INITIAL_QUEUE: PrintQueueJob[] = [
  {
    id: 'job-01',
    orderNumber: '20260810074210',
    patientName: 'Sr. Fernando Abrego',
    patientCedula: '8-812-4920',
    tubeType: 'EDTA_LAVENDER',
    testCodes: ['CBC', 'RET', 'VSG'],
    quantity: 1,
    timestamp: '07:42:10 AM',
    status: 'IMPRESO'
  },
  {
    id: 'job-02',
    orderNumber: '20260810074211',
    patientName: 'Sr. Fernando Abrego',
    patientCedula: '8-812-4920',
    tubeType: 'SST_GOLD',
    testCodes: ['GLU', 'CREA', 'LIPID', 'TSH'],
    quantity: 1,
    timestamp: '07:42:11 AM',
    status: 'IMPRESO'
  },
  {
    id: 'job-03',
    orderNumber: '20260813080115',
    patientName: 'Dra. Gabriela Solís',
    patientCedula: '4-780-1192',
    tubeType: 'CITRATE_BLUE',
    testCodes: ['TP', 'TPT', 'FIB'],
    quantity: 1,
    timestamp: '08:01:15 AM',
    status: 'PENDIENTE'
  },
  {
    id: 'job-04',
    orderNumber: '20260813081000',
    patientName: 'Sra. Elena de Icaza',
    patientCedula: '8-220-9911',
    tubeType: 'EDTA_LAVENDER',
    testCodes: ['HbA1c', 'HEMOGRAMA'],
    quantity: 1,
    timestamp: '08:10:00 AM',
    status: 'PENDIENTE'
  }
];

export const LabelPrinterStudio: React.FC = () => {
  const [templates, setTemplates] = useState<TubeLabelTemplate[]>(PREDESIGNED_TEMPLATES_GALLERY);
  const [activeTemplate, setActiveTemplate] = useState<TubeLabelTemplate>(PREDESIGNED_TEMPLATES_GALLERY[0]);
  const [printQueue, setPrintQueue] = useState<PrintQueueJob[]>(INITIAL_QUEUE);

  // Batch Print Queue Selection & Sequential Execution State
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>(['job-01', 'job-03', 'job-04']);
  const [isBatchPrinting, setIsBatchPrinting] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; activeJobId: string | null }>({
    current: 0,
    total: 0,
    activeJobId: null
  });

  // New Job Modal Form State
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState<boolean>(false);
  const [newOrderNum, setNewOrderNum] = useState<string>(new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14));
  const [newPatientName, setNewPatientName] = useState<string>('MENDOZA, CARLOS');
  const [newCedula, setNewCedula] = useState<string>('8-771-3049');
  const [newTubeType, setNewTubeType] = useState<PrintQueueJob['tubeType']>('SST_GOLD');
  const [newTests, setNewTests] = useState<string>('LIPID, GLU, CREA, TSH');
  const [newCopies, setNewCopies] = useState<number>(1);

  // Hardware Spooler & Roll Metrics State
  const [printedCountToday, setPrintedCountToday] = useState<number>(142);
  const [ribbonRollPct, setRibbonRollPct] = useState<number>(78);
  const [labelRollRemaining, setLabelRollRemaining] = useState<number>(310);

  // Gallery Modal & Category Filter State
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('TODAS');
  const [loadedNotification, setLoadedNotification] = useState<string | null>(null);

  // Printer Management & LAN Discovery State
  const [selectedBranch, setSelectedBranch] = useState<string>('Sede Vía España');
  const [networkPrinters, setNetworkPrinters] = useState<NetworkPrinter[]>(INITIAL_NETWORK_PRINTERS);
  const [isPrinterManagerOpen, setIsPrinterManagerOpen] = useState<boolean>(false);
  const [isScanningLan, setIsScanningLan] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [subnetInput, setSubnetInput] = useState<string>('192.168.1.0/24');
  const [printerSearchQuery, setPrinterSearchQuery] = useState<string>('');

  // Manual Add Printer Form State
  const [isAddManualPrinterOpen, setIsAddManualPrinterOpen] = useState<boolean>(false);
  const [manualName, setManualName] = useState<string>('');
  const [manualIp, setManualIp] = useState<string>('192.168.1.135');
  const [manualPort, setManualPort] = useState<number>(9100);
  const [manualModel, setManualModel] = useState<string>('Zebra ZD421 (203 dpi)');
  const [manualProtocol, setManualProtocol] = useState<'WEBSOCKET' | 'RAW_TCP_9100' | 'USB_BRIDGE'>('WEBSOCKET');
  const [manualLocation, setManualLocation] = useState<string>('Recepción Box 2');
  const [manualBranch, setManualBranch] = useState<string>('Sede Vía España');
  const [manualDpi, setManualDpi] = useState<203 | 300 | 600>(203);

  // WebSocket Thermal Printer State
  const [wsUrl, setWsUrl] = useState<string>('ws://192.168.1.105:9100/zebra-zpl');
  const [wsConnected, setWsConnected] = useState<boolean>(true);
  const [printerModel, setPrinterModel] = useState<string>('Zebra ZD421 (203 dpi) - Sede Vía España');
  const [lastPrintedJobId, setLastPrintedJobId] = useState<string | null>('job-02');

  // Scan LAN Subnet for Thermal Printers
  const handleScanLanNetwork = () => {
    setIsScanningLan(true);
    setScanProgress(10);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 300);

    setTimeout(() => {
      setIsScanningLan(false);
      setScanProgress(0);

      setNetworkPrinters(prev => prev.map(p => ({
        ...p,
        pingMs: p.status === 'ONLINE' ? Math.floor(Math.random() * 10) + 3 : 0,
        status: p.ip === '192.168.3.18' ? 'OFFLINE' : 'ONLINE'
      })));

      setLoadedNotification(`🔍 Escaneo de red LAN (${subnetInput}) completado: 5 impresoras térmicas activas encontradas.`);
      setTimeout(() => setLoadedNotification(null), 4500);
    }, 1600);
  };

  // Set Printer as Default for a Specific Branch
  const handleSaveAsBranchDefault = (printer: NetworkPrinter) => {
    setNetworkPrinters(prev => prev.map(p => {
      if (p.branch === printer.branch) {
        return { ...p, isDefault: p.id === printer.id };
      }
      return p;
    }));

    if (printer.branch === selectedBranch) {
      setPrinterModel(`${printer.name} - ${printer.branch}`);
      setWsUrl(`ws://${printer.ip}:${printer.port}/zebra-zpl`);
      setWsConnected(printer.status === 'ONLINE');
    }

    setLoadedNotification(`⭐ Impresora Predeterminada guardada para ${printer.branch}: "${printer.name}" (${printer.ip}:${printer.port})`);
    setTimeout(() => setLoadedNotification(null), 5000);
  };

  // Test Print Calibration Page
  const handleTestPrintCalibration = (printer: NetworkPrinter) => {
    alert(`⚡ [WebSocket Raw Output -> ${printer.ip}:${printer.port}]\n\nComando de prueba de calibración enviado a ${printer.name}:\n\n^XA\n^FO30,30^A0N,30,30^FDPRUEBA DE CALIBRACIÓN^FS\n^FO30,70^A0N,20,20^FDSEDE: ${printer.branch}^FS\n^FO30,100^A0N,20,20^FDIP: ${printer.ip}:${printer.port} (${printer.dpi} DPI)^FS\n^FO30,135^BCN,50,Y,N,N^FDCALIB-2026^FS\n^XZ`);
  };

  // Manual Printer Creation Handler
  const handleAddManualPrinterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualIp.trim()) return;

    const newPrinter: NetworkPrinter = {
      id: `prn-${Date.now()}`,
      name: manualName.trim(),
      ip: manualIp.trim(),
      port: manualPort,
      protocol: manualProtocol,
      model: manualModel,
      location: manualLocation || 'Recepción General',
      branch: manualBranch,
      dpi: manualDpi,
      languages: manualModel.toLowerCase().includes('tsc') ? ['TSPL', 'EPL'] : ['ZPL'],
      status: 'ONLINE',
      pingMs: 5,
      isDefault: false,
      ribbonLevelPct: 100,
      labelRollRemaining: 500
    };

    setNetworkPrinters(prev => [newPrinter, ...prev]);
    setIsAddManualPrinterOpen(false);

    setManualName('');
    setManualIp('192.168.1.135');

    setLoadedNotification(`➕ Nueva impresora "${newPrinter.name}" registrada exitosamente en ${newPrinter.branch}.`);
    setTimeout(() => setLoadedNotification(null), 4500);
  };

  // Delete Printer
  const handleDeletePrinter = (printerId: string) => {
    if (confirm('¿Confirmas eliminar esta impresora térmica de la configuración local de la sede?')) {
      setNetworkPrinters(prev => prev.filter(p => p.id !== printerId));
    }
  };

  // Interactive Live Label Customizing Form Data
  const [samplePatientName, setSamplePatientName] = useState<string>('ABREGO, FERNANDO');
  const [sampleOrderNumber, setSampleOrderNumber] = useState<string>('20260810074210');
  const [sampleCedula, setSampleCedula] = useState<string>('8-812-4920');
  const [sampleTests, setSampleTests] = useState<string>('CBC, CREA, LIPID, TSH');
  const [sampleTubeType, setSampleTubeType] = useState<'EDTA_LAVENDER' | 'SST_GOLD' | 'CITRATE_BLUE' | 'HEPARIN_GREEN' | 'FLUORIDE_GRAY'>('EDTA_LAVENDER');

  // Visual Preview Studio Controls State
  const [previewZoom, setPreviewZoom] = useState<number>(1.0);
  const [previewRotation, setPreviewRotation] = useState<0 | 90 | 180 | 270>(0);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(false);
  const [isSimulatingScan, setIsSimulatingScan] = useState<boolean>(false);
  const [scannedPayload, setScannedPayload] = useState<string | null>(null);
  const [isInspectorModalOpen, setIsInspectorModalOpen] = useState<boolean>(false);

  // Barcode Laser Scanner Simulation
  const handleSimulateScan = () => {
    setIsSimulatingScan(true);
    setScannedPayload(null);
    setTimeout(() => {
      setIsSimulatingScan(false);
      setScannedPayload(`PAYLOAD DENSIDAD OK: [${sampleOrderNumber}] - ${samplePatientName} (CED: ${sampleCedula})`);
    }, 1500);
  };

  // Load a template from gallery
  const handleLoadTemplate = (tpl: TubeLabelTemplate) => {
    setActiveTemplate(tpl);
    if (tpl.samplePatientName) setSamplePatientName(tpl.samplePatientName);
    if (tpl.sampleTubeType) setSampleTubeType(tpl.sampleTubeType);
    if (tpl.sampleTests) setSampleTests(tpl.sampleTests);

    setLoadedNotification(`¡Plantilla "${tpl.name}" cargada con éxito!`);
    setTimeout(() => {
      setLoadedNotification(null);
    }, 4000);
  };

  // Batch Print Selection Logic
  const handleToggleSelectAll = () => {
    if (selectedJobIds.length === printQueue.length) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(printQueue.map(j => j.id));
    }
  };

  const handleToggleSelectJob = (jobId: string) => {
    setSelectedJobIds(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  const handleSelectOnlyPending = () => {
    setSelectedJobIds(printQueue.filter(j => j.status === 'PENDIENTE').map(j => j.id));
  };

  // Sequential Batch Print Execution
  const handleBatchPrintSelected = async () => {
    if (selectedJobIds.length === 0) {
      alert('⚠️ Por favor selecciona al menos una etiqueta de la cola.');
      return;
    }

    const jobsToPrint = printQueue.filter(j => selectedJobIds.includes(j.id));
    setIsBatchPrinting(true);
    setBatchProgress({ current: 0, total: jobsToPrint.length, activeJobId: null });

    for (let i = 0; i < jobsToPrint.length; i++) {
      const job = jobsToPrint[i];
      setBatchProgress({ current: i + 1, total: jobsToPrint.length, activeJobId: job.id });

      // Simulate WebSocket latency & thermal print head movement
      await new Promise(res => setTimeout(res, 700));

      setPrintQueue(prev => prev.map(j => j.id === job.id ? { ...j, status: 'IMPRESO' } : j));
      setLastPrintedJobId(job.id);
      setPrintedCountToday(prev => prev + (job.quantity || 1));
      setLabelRollRemaining(prev => Math.max(0, prev - (job.quantity || 1)));
    }

    setIsBatchPrinting(false);
    setBatchProgress({ current: 0, total: 0, activeJobId: null });
    alert(`🎉 [WebSocket Batch Spooler OK]\n¡Lote de ${jobsToPrint.length} etiqueta(s) impresas secuencialmente en ${printerModel}!`);
  };

  // Export Selected Batch to Raw ZPL File
  const handleExportBatchZpl = () => {
    const jobs = printQueue.filter(j => selectedJobIds.includes(j.id));
    if (jobs.length === 0) {
      alert('Selecciona al menos una etiqueta para exportar ZPL.');
      return;
    }

    let zplBatchContent = `; ==========================================\n; BATCH ZPL CODE - LIS LABORATORY SPOOLER\n; Impresora: ${printerModel}\n; Fecha: 2026-08-12 08:30 AM\n; Total Etiquetas: ${jobs.length}\n; ==========================================\n\n`;

    jobs.forEach((job, index) => {
      const dotsPerMm = activeTemplate.dpi === 300 ? 12 : 8;
      zplBatchContent += `; --- ETIQUETA #${index + 1}: ${job.orderNumber} (${job.patientName}) ---\n`;
      zplBatchContent += `^XA\n^PW${activeTemplate.widthMm * dotsPerMm}\n^LL${activeTemplate.heightMm * dotsPerMm}\n`;
      zplBatchContent += `^FO30,20^A0N,28,28^FD${job.orderNumber} - ${job.patientName}^FS\n`;
      zplBatchContent += `^FO30,55^A0N,18,18^FDCED: ${job.patientCedula} | ${job.tubeType}^FS\n`;
      zplBatchContent += `^FO30,85^BCN,50,Y,N,N^FD${job.orderNumber}^FS\n`;
      zplBatchContent += `^FO30,160^A0N,16,16^FDPRUEBAS: ${job.testCodes.join(', ')}^FS\n`;
      zplBatchContent += `^XZ\n\n`;
    });

    const blob = new Blob([zplBatchContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LOTE_ZPL_${jobs.length}_ETIQUETAS_${Date.now()}.zpl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Bulk Status Actions
  const handleBulkMarkStatus = (status: 'IMPRESO' | 'PENDIENTE') => {
    setPrintQueue(prev => prev.map(j => selectedJobIds.includes(j.id) ? { ...j, status } : j));
  };

  const handleDeleteSelectedJobs = () => {
    if (confirm(`¿Confirmas eliminar ${selectedJobIds.length} etiqueta(s) seleccionada(s) de la cola?`)) {
      setPrintQueue(prev => prev.filter(j => !selectedJobIds.includes(j.id)));
      setSelectedJobIds([]);
    }
  };

  // Add New Custom Job to Queue
  const handleAddNewJob = (e: React.FormEvent) => {
    e.preventDefault();
    const newJob: PrintQueueJob = {
      id: `job-${Date.now()}`,
      orderNumber: newOrderNum.trim() || new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
      patientName: newPatientName.trim() || 'PACIENTE PRUEBA',
      patientCedula: newCedula.trim() || '8-000-0000',
      tubeType: newTubeType,
      testCodes: newTests.split(',').map(s => s.trim()).filter(Boolean),
      quantity: newCopies,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: 'PENDIENTE'
    };

    setPrintQueue(prev => [newJob, ...prev]);
    setSelectedJobIds(prev => [...prev, newJob.id]);
    setIsAddJobModalOpen(false);

    // Auto-fill form values for next creation
    setNewOrderNum(new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14));
  };

  // Auto-Generate Sub-Aliquot Tube Jobs
  const handleGenerateAliquotJobs = (parentJob: PrintQueueJob) => {
    const aliq1: PrintQueueJob = {
      id: `job-aliq1-${Date.now()}`,
      orderNumber: `${parentJob.orderNumber}-A1`,
      patientName: parentJob.patientName,
      patientCedula: parentJob.patientCedula,
      tubeType: 'SST_GOLD',
      testCodes: [parentJob.testCodes[0] || 'ALICUOTA 1'],
      quantity: 1,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'PENDIENTE'
    };

    const aliq2: PrintQueueJob = {
      id: `job-aliq2-${Date.now()}`,
      orderNumber: `${parentJob.orderNumber}-A2`,
      patientName: parentJob.patientName,
      patientCedula: parentJob.patientCedula,
      tubeType: 'SST_GOLD',
      testCodes: [parentJob.testCodes[1] || 'ALICUOTA 2 (RESERVA)'],
      quantity: 1,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'PENDIENTE'
    };

    setPrintQueue(prev => [aliq1, aliq2, ...prev]);
    setSelectedJobIds(prev => [...prev, aliq1.id, aliq2.id]);
    alert(`🧪 ¡Se han desglosado 2 alícuotas automáticas (${parentJob.orderNumber}-A1 y A2) e insertado en la cola!`);
  };

  // Generate ZPL II Code dynamically for Thermal Printer
  const generateZplCode = (template: TubeLabelTemplate): string => {
    const dotsPerMm = template.dpi === 300 ? 12 : 8;
    const wDots = template.widthMm * dotsPerMm;
    const hDots = template.heightMm * dotsPerMm;

    const statHeader = template.isStatUrgent ? '^FO30,10^A0N,20,20^FD*** STAT / URGENCIA ***^FS\n' : '';
    const aliquotHeader = template.aliquotTag ? `^FO30,10^A0N,16,16^FD[${template.aliquotTag}]^FS\n` : '';

    return `^XA
^PW${wDots}
^LL${hDots}
^PON
${statHeader}${aliquotHeader}^BY2,2,60
^FO30,30^A0N,${template.fontSize * 2},${template.fontSize * 2}^FD${sampleOrderNumber} - ${samplePatientName}^FS
^FO30,60^A0N,16,16^FDCED: ${sampleCedula} | ${template.showBranchName ? 'VIA ESPAÑA' : ''}^FS
^FO30,90^BCN,60,Y,N,N
^FD${sampleOrderNumber}^FS
^FO30,170^A0N,14,14^FDPRUEBAS: ${sampleTests}^FS
^FO30,190^A0N,12,12^FDFECHA: 2026-08-12 08:05 AM | ${sampleTubeType.replace('_', ' ')}^FS
^XZ`;
  };

  const currentZplCode = generateZplCode(activeTemplate);

  const handlePrintJob = (jobId: string) => {
    setPrintQueue(prev => prev.map(j => j.id === jobId ? { ...j, status: 'IMPRESO' } : j));
    setLastPrintedJobId(jobId);
    alert(`⚡ [WebSocket -> ${printerModel}]\nEtiqueta de tubo enviada exitosamente a la impresora térmica.`);
  };

  const handlePrintAllPending = () => {
    setPrintQueue(prev => prev.map(j => j.status === 'PENDIENTE' ? { ...j, status: 'IMPRESO' } : j));
    alert(`🚀 Lote completo enviado por WebSocket a ${printerModel}!`);
  };

  const getTubeBadgeStyle = (tube: PrintQueueJob['tubeType']) => {
    switch (tube) {
      case 'EDTA_LAVENDER':
        return { bg: 'bg-purple-600', text: 'text-purple-200', border: 'border-purple-400', label: 'EDTA MORADO (Hematología)' };
      case 'SST_GOLD':
        return { bg: 'bg-amber-500', text: 'text-amber-950', border: 'border-amber-400', label: 'SST AMARILLO/ORO (Química/Suero)' };
      case 'CITRATE_BLUE':
        return { bg: 'bg-sky-500', text: 'text-sky-950', border: 'border-sky-400', label: 'CITRATO AZUL (Coagulación)' };
      case 'HEPARIN_GREEN':
        return { bg: 'bg-emerald-600', text: 'text-emerald-100', border: 'border-emerald-400', label: 'HEPARINA VERDE (STAT)' };
      case 'FLUORIDE_GRAY':
        return { bg: 'bg-slate-500', text: 'text-slate-100', border: 'border-slate-400', label: 'FLUORURO GRIS (Glucosa)' };
    }
  };

  const getCategoryBadge = (cat: TubeLabelTemplate['category']) => {
    switch (cat) {
      case 'PRIMARIO':
        return { label: 'Tubo Primario', bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30', icon: TestTube };
      case 'ALICUOTA':
        return { label: 'Tubo Alícuota', bg: 'bg-sky-500/15 text-sky-300 border-sky-500/30', icon: Container };
      case 'STAT':
        return { label: 'Urgencia / STAT', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40', icon: Flame };
      case 'PEDIATRICO':
        return { label: 'Pediátrico / Capilar', bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: Baby };
      case 'HISTOLOGIA':
        return { label: 'Histología / Cassette', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: Microscope };
      case 'FRASCO':
        return { label: 'Frasco Estéril', bg: 'bg-teal-500/15 text-teal-300 border-teal-500/30', icon: Bookmark };
    }
  };

  const filteredGallery = PREDESIGNED_TEMPLATES_GALLERY.filter(t => {
    return selectedCategoryFilter === 'TODAS' || t.category === selectedCategoryFilter;
  });

  return (
    <div id="label-studio-container" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 border border-indigo-500/30 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-teal-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center space-x-2">
              <Printer className="w-4 h-4 text-teal-400 animate-pulse" />
              <span>Diseñador de Etiquetas de Tubos Primarios & WebSocket Spooler</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Label Printer Studio (ZPL II / TSPL)
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Diseño WYSIWYG de etiquetas de muestras de laboratorio, generación de comandos de impresora térmica (Zebra, TSC, Citizen) y spooler automático de impresión en recepción/toma de muestra.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsPrinterManagerOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-4 py-2.5 rounded-2xl text-xs transition shadow-xl flex items-center space-x-2 cursor-pointer border border-indigo-400/30"
            >
              <Settings className="w-4 h-4 text-indigo-200" />
              <span>🖨️ Admin. Impresoras ({selectedBranch.replace('Sede ', '')})</span>
            </button>

            <button
              onClick={() => setIsGalleryOpen(true)}
              className="bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs transition shadow-xl flex items-center space-x-2 cursor-pointer border border-teal-300/40"
            >
              <Grid className="w-4 h-4 stroke-[2.5]" />
              <span>🎨 Galería de Plantillas</span>
            </button>

            <div className={`px-4 py-2.5 rounded-2xl border text-xs font-mono font-bold flex items-center space-x-2 ${
              wsConnected
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
            }`}>
              {wsConnected ? <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" /> : <WifiOff className="w-4 h-4 text-rose-400" />}
              <span>{wsConnected ? 'WebSocket Térmica CONECTADA' : 'Impresora Desconectada'}</span>
            </div>
          </div>
        </div>

        {/* Status Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div
            onClick={() => setIsPrinterManagerOpen(true)}
            className="bg-slate-950/60 border border-indigo-500/30 hover:border-indigo-500/70 p-4 rounded-2xl space-y-1 cursor-pointer transition group"
            title="Haz clic para administrar impresoras de red y configurar dispositivo predeterminado"
          >
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Impresora Activa ({selectedBranch.replace('Sede ', '')})</span>
              <Settings className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-90 transition-transform duration-300" />
            </div>
            <div className="text-sm font-bold text-white truncate">{printerModel}</div>
            <div className="text-[10px] text-teal-400 font-mono flex items-center justify-between">
              <span>Socket: {wsUrl}</span>
              <span className="text-indigo-300 underline font-bold">Cambiar / LAN</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cola de Impresión</div>
            <div className="text-2xl font-black font-mono text-amber-400">
              {printQueue.filter(j => j.status === 'PENDIENTE').length} Etiquetas Pendientes
            </div>
            <div className="text-[10px] text-amber-400 font-bold">Auto-Spool Activo</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lenguaje Térmico</div>
            <div className="text-2xl font-black font-mono text-emerald-400">{activeTemplate.printerLanguage}</div>
            <div className="text-[10px] text-emerald-400 font-bold">{activeTemplate.dpi} DPI Trazado Vectorial</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Formato Dimensiones</div>
            <div className="text-2xl font-black font-mono text-indigo-300">
              {activeTemplate.widthMm}x{activeTemplate.heightMm} mm
            </div>
            <div className="text-[10px] text-indigo-400 font-bold">
              {activeTemplate.category === 'STAT' ? '🚨 URGENCIA / STAT' : activeTemplate.category === 'ALICUOTA' ? '🧪 ALÍCUOTA DERIVADA' : 'Estándar Tubo'}
            </div>
          </div>
        </div>
      </div>

      {/* Loaded Template Banner Toast Notification */}
      {loadedNotification && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 border border-emerald-500/50 p-4 rounded-2xl shadow-2xl flex items-center justify-between text-xs text-emerald-200 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 border border-emerald-500/30">
              <Zap className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="font-extrabold text-white text-sm">{loadedNotification}</div>
              <p className="text-slate-300 text-[11px]">La plantilla seleccionada y sus datos de muestra simulada se han aplicado al lienzo de diseño.</p>
            </div>
          </div>
          <button onClick={() => setLoadedNotification(null)} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* QUICK INLINE TEMPLATE PRESETS GALLERY TABS */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Grid className="w-5 h-5 text-teal-400" />
            <h3 className="font-extrabold text-white text-sm">Galería Rápida de Plantillas Pre-diseñadas</h3>
            <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
              {PREDESIGNED_TEMPLATES_GALLERY.length} Disponibles
            </span>
          </div>
          <p className="text-xs text-slate-400">Haz clic en cualquier plantilla para cargarla instantáneamente en el diseñador.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {PREDESIGNED_TEMPLATES_GALLERY.map((tpl) => {
            const isSelected = activeTemplate.id === tpl.id;
            const badge = getCategoryBadge(tpl.category);
            const Icon = badge.icon;

            return (
              <button
                key={tpl.id}
                onClick={() => handleLoadTemplate(tpl)}
                className={`p-3.5 rounded-2xl border text-left transition duration-200 cursor-pointer flex flex-col justify-between space-y-3 relative group ${
                  isSelected
                    ? 'bg-slate-950 border-teal-500 ring-2 ring-teal-500/30 shadow-2xl scale-[1.02]'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {isSelected && (
                  <span className="absolute -top-2 -right-2 bg-teal-500 text-slate-950 rounded-full p-1 shadow-lg">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border flex items-center space-x-1 ${badge.bg}`}>
                      <Icon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">{tpl.widthMm}x{tpl.heightMm}mm</span>
                  </div>

                  <div className="font-extrabold text-white text-xs group-hover:text-teal-300 transition line-clamp-1">
                    {tpl.name}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                    {tpl.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                  <span className="font-mono text-teal-400 font-bold">{tpl.barcodeType}</span>
                  <span className="text-slate-500 font-mono">{tpl.dpi} DPI</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Template Config & Form Controls */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-teal-400" />
              <span>Configuración de Plantilla Activa</span>
            </h3>

            <button
              onClick={() => setIsGalleryOpen(true)}
              className="text-teal-400 hover:text-teal-300 text-xs font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Ver Galería</span>
            </button>
          </div>

          {/* Selector de Plantilla */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">Plantilla Seleccionada:</label>
            <select
              value={activeTemplate.id}
              onChange={(e) => {
                const found = PREDESIGNED_TEMPLATES_GALLERY.find(t => t.id === e.target.value);
                if (found) handleLoadTemplate(found);
              }}
              className="w-full bg-slate-950 border border-slate-800 text-xs font-bold text-teal-300 rounded-xl p-3 focus:ring-2 focus:ring-teal-500"
            >
              {PREDESIGNED_TEMPLATES_GALLERY.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.widthMm}x{t.heightMm}mm)</option>
              ))}
            </select>
          </div>

          {/* Dynamic Dimension Adjustment Controls Panel */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-teal-500/30 text-xs shadow-lg">
            <div className="font-bold text-white mb-1 flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="flex items-center space-x-1.5 text-teal-300">
                <Maximize2 className="w-4 h-4 text-teal-400" />
                <span>Dimensiones Personalizadas (mm)</span>
              </span>
              <span className="font-mono text-[11px] font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {activeTemplate.widthMm} × {activeTemplate.heightMm} mm
              </span>
            </div>

            {/* Width Adjustment (Ancho) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <label className="text-slate-300 font-bold">Ancho (Width):</label>
                <div className="flex items-center space-x-1 font-mono">
                  <input
                    type="number"
                    min={15}
                    max={120}
                    value={activeTemplate.widthMm}
                    onChange={(e) => {
                      const val = Math.max(15, Math.min(120, Number(e.target.value) || 15));
                      setActiveTemplate({ ...activeTemplate, widthMm: val });
                    }}
                    className="w-14 bg-slate-900 border border-slate-700 text-teal-300 text-center rounded p-1 font-bold focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="text-slate-400 font-bold">mm</span>
                </div>
              </div>
              <input
                type="range"
                min={15}
                max={120}
                value={activeTemplate.widthMm}
                onChange={(e) => setActiveTemplate({ ...activeTemplate, widthMm: Number(e.target.value) })}
                className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Height Adjustment (Alto) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <label className="text-slate-300 font-bold">Alto (Height):</label>
                <div className="flex items-center space-x-1 font-mono">
                  <input
                    type="number"
                    min={10}
                    max={90}
                    value={activeTemplate.heightMm}
                    onChange={(e) => {
                      const val = Math.max(10, Math.min(90, Number(e.target.value) || 10));
                      setActiveTemplate({ ...activeTemplate, heightMm: val });
                    }}
                    className="w-14 bg-slate-900 border border-slate-700 text-teal-300 text-center rounded p-1 font-bold focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="text-slate-400 font-bold">mm</span>
                </div>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                value={activeTemplate.heightMm}
                onChange={(e) => setActiveTemplate({ ...activeTemplate, heightMm: Number(e.target.value) })}
                className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Quick Dimension Preset Buttons */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Formatos Rápidos de Laboratorio:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: '50x25 mm', w: 50, h: 25, tag: 'Estándar' },
                  { label: '35x20 mm', w: 35, h: 20, tag: 'Alícuota' },
                  { label: '50x30 mm', w: 50, h: 30, tag: 'Urgencia' },
                  { label: '30x15 mm', w: 30, h: 15, tag: 'Pediátrico' },
                  { label: '25x25 mm', w: 25, h: 25, tag: 'Cassette' },
                  { label: '60x30 mm', w: 60, h: 30, tag: 'Frasco' },
                ].map((preset) => {
                  const isActive = activeTemplate.widthMm === preset.w && activeTemplate.heightMm === preset.h;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => setActiveTemplate({ ...activeTemplate, widthMm: preset.w, heightMm: preset.h })}
                      className={`p-1.5 rounded-lg border text-[10px] font-mono font-bold transition cursor-pointer flex flex-col items-center justify-center ${
                        isActive
                          ? 'bg-teal-500 text-slate-950 border-teal-400 shadow'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className={`text-[8px] ${isActive ? 'text-slate-950 font-black' : 'text-slate-500'}`}>{preset.tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calculated Pixel Density Indicator */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Resolución Trazado:</span>
              <span className="text-emerald-400 font-bold">
                {activeTemplate.widthMm * (activeTemplate.dpi === 300 ? 12 : 8)} × {activeTemplate.heightMm * (activeTemplate.dpi === 300 ? 12 : 8)} px
              </span>
            </div>
          </div>

          {/* Dynamic Controls */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
            <div className="font-bold text-white mb-1 flex items-center justify-between">
              <span>Parámetros de Diseño:</span>
              <span className="font-mono text-[10px] text-slate-500">{activeTemplate.dpi} DPI</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block">Simbología Código:</label>
                <select
                  value={activeTemplate.barcodeType}
                  onChange={(e) => setActiveTemplate({ ...activeTemplate, barcodeType: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                >
                  <option value="CODE128">Code 128 (Barra)</option>
                  <option value="QR">Código QR 2D</option>
                  <option value="DATAMATRIX">DataMatrix 2D</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block">Lenguaje Impresora:</label>
                <select
                  value={activeTemplate.printerLanguage}
                  onChange={(e) => setActiveTemplate({ ...activeTemplate, printerLanguage: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                >
                  <option value="ZPL">Zebra ZPL II</option>
                  <option value="TSPL">TSC TSPL / TSPL2</option>
                  <option value="EPL">Eltron EPL2</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                <span>Mostrar Nombre Paciente</span>
                <input
                  type="checkbox"
                  checked={activeTemplate.showPatientName}
                  onChange={(e) => setActiveTemplate({ ...activeTemplate, showPatientName: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-teal-500"
                />
              </label>

              <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                <span>Mostrar Insignia de Color Tubo</span>
                <input
                  type="checkbox"
                  checked={activeTemplate.showTubeColorBadge}
                  onChange={(e) => setActiveTemplate({ ...activeTemplate, showTubeColorBadge: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-teal-500"
                />
              </label>

              <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                <span>Mostrar Lista de Exámenes</span>
                <input
                  type="checkbox"
                  checked={activeTemplate.showTestsRequested}
                  onChange={(e) => setActiveTemplate({ ...activeTemplate, showTestsRequested: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-teal-500"
                />
              </label>

              <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                <span>Mostrar Franja Urgencia STAT</span>
                <input
                  type="checkbox"
                  checked={!!activeTemplate.isStatUrgent}
                  onChange={(e) => setActiveTemplate({ ...activeTemplate, isStatUrgent: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-rose-500"
                />
              </label>

              <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                <span>Mostrar Sede del LIS</span>
                <input
                  type="checkbox"
                  checked={activeTemplate.showBranchName}
                  onChange={(e) => setActiveTemplate({ ...activeTemplate, showBranchName: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-teal-500"
                />
              </label>
            </div>
          </div>

          {/* Live Data Customization */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">Datos de Muestra en Simulación:</h4>
            
            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block">Paciente:</label>
                <input
                  type="text"
                  value={samplePatientName}
                  onChange={(e) => setSamplePatientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block">N° Orden:</label>
                  <input
                    type="text"
                    value={sampleOrderNumber}
                    onChange={(e) => setSampleOrderNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-teal-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block">Tipo Tubo:</label>
                  <select
                    value={sampleTubeType}
                    onChange={(e) => setSampleTubeType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-bold"
                  >
                    <option value="EDTA_LAVENDER">EDTA Morado</option>
                    <option value="SST_GOLD">SST Amarillo/Oro</option>
                    <option value="CITRATE_BLUE">Citrato Azul</option>
                    <option value="HEPARIN_GREEN">Heparina Verde</option>
                    <option value="FLUORIDE_GRAY">Fluoruro Gris</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block">Pruebas / Exámenes:</label>
                <input
                  type="text"
                  value={sampleTests}
                  onChange={(e) => setSampleTests(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Interactive Label Canvas & ZPL Code Preview */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Label Preview Studio Board */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Previsualización WYSIWYG de la Etiqueta Térmica</h3>
                  <p className="text-[11px] text-slate-400">Inspección visual interactiva de textos y códigos de barra antes del spooler térmico</p>
                </div>
              </div>

              {/* Interactive Toolbar Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setPreviewZoom(prev => Math.max(0.75, +(prev - 0.25).toFixed(2)))}
                    className="p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800 cursor-pointer"
                    title="Alejar Zoom"
                  >
                    -
                  </button>
                  <span className="px-2 font-mono font-bold text-teal-400 text-[11px] min-w-[42px] text-center">
                    {Math.round(previewZoom * 100)}%
                  </span>
                  <button
                    onClick={() => setPreviewZoom(prev => Math.min(2.0, +(prev + 0.25).toFixed(2)))}
                    className="p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800 cursor-pointer"
                    title="Acercar Zoom"
                  >
                    +
                  </button>
                </div>

                {/* Rotation Control */}
                <button
                  onClick={() => {
                    const angles: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];
                    const next = angles[(angles.indexOf(previewRotation) + 1) % 4];
                    setPreviewRotation(next);
                  }}
                  className={`p-2 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    previewRotation !== 0
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                  title="Rotar Etiqueta"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="font-mono">{previewRotation}°</span>
                </button>

                {/* Grid Overlay Toggle */}
                <button
                  onClick={() => setShowGridOverlay(!showGridOverlay)}
                  className={`p-2 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    showGridOverlay
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                  title="Conmutar Guías de Alineación y Márgenes"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Guías</span>
                </button>

                {/* Laser Scan Simulator */}
                <button
                  onClick={handleSimulateScan}
                  disabled={isSimulatingScan}
                  className="bg-slate-950 hover:bg-slate-800 text-teal-300 border border-teal-500/30 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  title="Probar lectura con lector láser simulado"
                >
                  <QrCode className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                  <span>{isSimulatingScan} ...</span>
                </button>

                {/* Fullscreen Inspector Modal Trigger */}
                <button
                  onClick={() => setIsInspectorModalOpen(true)}
                  className="bg-slate-950 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 p-2 rounded-xl text-xs transition cursor-pointer"
                  title="Inspeccionar en Alta Resolución"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                {/* Direct Print Test Button */}
                <button
                  onClick={() => alert(`⚡ [WebSocket] Imprimiendo prueba en ${printerModel}...`)}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Prueba</span>
                </button>
              </div>
            </div>

            {/* Scanned Barcode Confirmation Alert Toast */}
            {scannedPayload && (
              <div className="bg-emerald-950/80 border border-emerald-500/50 p-3.5 rounded-2xl flex items-center justify-between text-xs text-emerald-200 animate-fadeIn">
                <div className="flex items-center space-x-2.5">
                  <div className="bg-emerald-500/20 p-1.5 rounded-xl text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-white">Escáner Láser Lectura Exitosa:</span>
                    <span className="font-mono text-emerald-300 ml-2 font-bold">{scannedPayload}</span>
                  </div>
                </div>
                <button onClick={() => setScannedPayload(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Simulated Thermal Label Feeder & Roll Plate Workspace */}
            <div className="relative bg-slate-950 p-8 sm:p-12 rounded-3xl border border-slate-800/80 overflow-hidden flex flex-col items-center justify-center min-h-[340px]">
              {/* Paper Roll Edge Guidelines */}
              <div className="absolute inset-x-0 top-0 h-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between px-6 text-[9px] font-mono text-slate-600">
                <span>◀ ALIMENTADOR DE RODILLO TÉRMICO (GAP SENSOR)</span>
                <span>ANCHO ROLLO: {activeTemplate.widthMm + 4} mm ▶</span>
              </div>

              {/* Label Canvas Element */}
              <div
                style={{
                  width: `${activeTemplate.widthMm * 7.5}px`,
                  height: `${activeTemplate.heightMm * 7.5}px`,
                  transform: `scale(${previewZoom}) rotate(${previewRotation}deg)`,
                  transformOrigin: 'center center'
                }}
                className={`bg-white text-black p-3.5 rounded-lg shadow-2xl relative font-sans flex flex-col justify-between border-2 overflow-hidden select-none transition-all duration-300 ${
                  activeTemplate.isStatUrgent ? 'border-rose-500 ring-4 ring-rose-500/20' : 'border-slate-300'
                }`}
              >
                {/* Laser Scanning Animation Beam */}
                {isSimulatingScan && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,1)] z-30 animate-pulse pointer-events-none"
                       style={{ animation: 'scanBeam 1.5s ease-in-out infinite' }}></div>
                )}

                {/* Alignment Grid Overlay */}
                {showGridOverlay && (
                  <div className="absolute inset-0 pointer-events-none z-20 border border-indigo-400/50 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:10px_10px] opacity-40">
                    <div className="absolute inset-1 border border-dashed border-rose-400 text-[6px] font-mono text-rose-600 p-0.5">MARGEN QUIET ZONE</div>
                  </div>
                )}

                {/* URGENT STAT BANNER */}
                {activeTemplate.isStatUrgent && (
                  <div className="bg-rose-600 text-white text-[9px] font-black uppercase text-center py-0.5 -mx-3.5 -mt-3.5 mb-1 tracking-widest flex items-center justify-center space-x-1 shadow-sm">
                    <Flame className="w-3 h-3 fill-white animate-pulse" />
                    <span>🚨 URGENCIA / STAT MÉDICO</span>
                  </div>
                )}

                {/* ALIQUOT TAG BANNER */}
                {activeTemplate.aliquotTag && !activeTemplate.isStatUrgent && (
                  <div className="bg-sky-600 text-white text-[8px] font-black uppercase text-center py-0.5 -mx-3.5 -mt-3.5 mb-1 tracking-wider">
                    {activeTemplate.aliquotTag}
                  </div>
                )}

                {/* Tube Color Badge Strip */}
                {activeTemplate.showTubeColorBadge && !activeTemplate.isStatUrgent && !activeTemplate.aliquotTag && (
                  <div className={`absolute top-0 right-0 left-0 h-2 ${getTubeBadgeStyle(sampleTubeType).bg}`}></div>
                )}

                <div className="space-y-1 mt-1">
                  <div className="flex items-center justify-between font-mono font-black text-[12px] leading-none">
                    <span>{sampleOrderNumber}</span>
                    {activeTemplate.showBranchName && <span className="text-[8px] uppercase tracking-tighter text-slate-700">VÍA ESPAÑA</span>}
                  </div>

                  {activeTemplate.showPatientName && (
                    <div className="font-black text-[11px] uppercase leading-tight tracking-tight truncate">
                      {samplePatientName}
                    </div>
                  )}

                  <div className="text-[8px] font-mono font-bold text-slate-700">
                    CED: {sampleCedula} • 2026-08-12 08:26
                  </div>
                </div>

                {/* Barcode Graphic Renderer (SVG Vector High Density) */}
                <div className="my-1 flex flex-col items-center justify-center">
                  {activeTemplate.barcodeType === 'CODE128' ? (
                    <div className="w-full flex flex-col items-center">
                      {/* High-Resolution SVG Code128 Vector Bars */}
                      <svg className="w-full h-10" viewBox="0 0 200 40" preserveAspectRatio="none">
                        <rect width="200" height="40" fill="#ffffff" />
                        {/* Start guard bars */}
                        <rect x="0" y="0" width="3" height="40" fill="#000" />
                        <rect x="5" y="0" width="2" height="40" fill="#000" />
                        {/* Data bars */}
                        <rect x="10" y="0" width="4" height="40" fill="#000" />
                        <rect x="18" y="0" width="1" height="40" fill="#000" />
                        <rect x="22" y="0" width="3" height="40" fill="#000" />
                        <rect x="28" y="0" width="5" height="40" fill="#000" />
                        <rect x="36" y="0" width="2" height="40" fill="#000" />
                        <rect x="42" y="0" width="4" height="40" fill="#000" />
                        <rect x="50" y="0" width="1" height="40" fill="#000" />
                        <rect x="54" y="0" width="3" height="40" fill="#000" />
                        <rect x="60" y="0" width="6" height="40" fill="#000" />
                        <rect x="70" y="0" width="2" height="40" fill="#000" />
                        <rect x="76" y="0" width="4" height="40" fill="#000" />
                        <rect x="84" y="0" width="2" height="40" fill="#000" />
                        <rect x="90" y="0" width="5" height="40" fill="#000" />
                        <rect x="98" y="0" width="1" height="40" fill="#000" />
                        <rect x="102" y="0" width="3" height="40" fill="#000" />
                        <rect x="108" y="0" width="4" height="40" fill="#000" />
                        <rect x="116" y="0" width="2" height="40" fill="#000" />
                        <rect x="122" y="0" width="5" height="40" fill="#000" />
                        <rect x="130" y="0" width="1" height="40" fill="#000" />
                        <rect x="134" y="0" width="3" height="40" fill="#000" />
                        <rect x="140" y="0" width="6" height="40" fill="#000" />
                        <rect x="150" y="0" width="2" height="40" fill="#000" />
                        <rect x="156" y="0" width="4" height="40" fill="#000" />
                        <rect x="164" y="0" width="2" height="40" fill="#000" />
                        <rect x="170" y="0" width="5" height="40" fill="#000" />
                        {/* Stop guard bars */}
                        <rect x="180" y="0" width="3" height="40" fill="#000" />
                        <rect x="185" y="0" width="1" height="40" fill="#000" />
                        <rect x="188" y="0" width="4" height="40" fill="#000" />
                        <rect x="195" y="0" width="2" height="40" fill="#000" />
                      </svg>
                      <span className="font-mono text-[8px] font-extrabold tracking-widest mt-0.5 text-black">
                        {sampleOrderNumber}
                      </span>
                    </div>
                  ) : activeTemplate.barcodeType === 'QR' ? (
                    <div className="flex items-center space-x-3">
                      {/* SVG Vector QR Code */}
                      <svg className="w-12 h-12" viewBox="0 0 100 100">
                        <rect width="100" height="100" fill="#ffffff" />
                        {/* Corner Finder 1 */}
                        <rect x="5" y="5" width="30" height="30" fill="#000" />
                        <rect x="10" y="10" width="20" height="20" fill="#fff" />
                        <rect x="15" y="15" width="10" height="10" fill="#000" />
                        {/* Corner Finder 2 */}
                        <rect x="65" y="5" width="30" height="30" fill="#000" />
                        <rect x="70" y="10" width="20" height="20" fill="#fff" />
                        <rect x="75" y="15" width="10" height="10" fill="#000" />
                        {/* Corner Finder 3 */}
                        <rect x="5" y="65" width="30" height="30" fill="#000" />
                        <rect x="10" y="70" width="20" height="20" fill="#fff" />
                        <rect x="15" y="75" width="10" height="10" fill="#000" />
                        {/* Data modules */}
                        <rect x="40" y="10" width="8" height="8" fill="#000" />
                        <rect x="50" y="20" width="8" height="8" fill="#000" />
                        <rect x="40" y="40" width="20" height="8" fill="#000" />
                        <rect x="70" y="45" width="8" height="15" fill="#000" />
                        <rect x="80" y="65" width="15" height="8" fill="#000" />
                        <rect x="45" y="70" width="10" height="20" fill="#000" />
                        <rect x="65" y="80" width="15" height="10" fill="#000" />
                      </svg>
                      <div className="text-[8px] font-mono leading-tight">
                        <div className="font-extrabold text-black">{sampleOrderNumber}</div>
                        <div className="text-slate-600 font-bold">QR MATRIX 2D</div>
                        <div className="text-[7px] text-slate-500">LIS VERIFIED</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      {/* SVG Vector DataMatrix */}
                      <svg className="w-12 h-12" viewBox="0 0 100 100">
                        <rect width="100" height="100" fill="#ffffff" />
                        {/* L-Shape finder pattern */}
                        <rect x="5" y="5" width="10" height="90" fill="#000" />
                        <rect x="5" y="85" width="90" height="10" fill="#000" />
                        {/* Dotted top & right boundary */}
                        <rect x="20" y="5" width="8" height="8" fill="#000" />
                        <rect x="36" y="5" width="8" height="8" fill="#000" />
                        <rect x="52" y="5" width="8" height="8" fill="#000" />
                        <rect x="68" y="5" width="8" height="8" fill="#000" />
                        <rect x="84" y="5" width="8" height="8" fill="#000" />
                        <rect x="85" y="20" width="8" height="8" fill="#000" />
                        <rect x="85" y="36" width="8" height="8" fill="#000" />
                        <rect x="85" y="52" width="8" height="8" fill="#000" />
                        <rect x="85" y="68" width="8" height="8" fill="#000" />
                        {/* Data matrix internal cells */}
                        <rect x="25" y="25" width="12" height="12" fill="#000" />
                        <rect x="45" y="25" width="12" height="12" fill="#000" />
                        <rect x="65" y="25" width="12" height="12" fill="#000" />
                        <rect x="25" y="45" width="12" height="12" fill="#000" />
                        <rect x="45" y="45" width="12" height="12" fill="#000" />
                        <rect x="65" y="65" width="12" height="12" fill="#000" />
                      </svg>
                      <div className="text-[8px] font-mono leading-tight">
                        <div className="font-extrabold text-black">{sampleOrderNumber}</div>
                        <div className="text-slate-600 font-bold">DATAMATRIX 2D</div>
                        <div className="text-[7px] text-slate-500">ECC 200</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Info */}
                <div className="text-[8px] font-bold border-t border-slate-300 pt-0.5 flex justify-between items-center text-slate-800">
                  <span className="truncate max-w-[180px]">EX: {sampleTests}</span>
                  <span className="font-mono font-black text-[7px] px-1 bg-slate-200 rounded">LIS CORE</span>
                </div>
              </div>
            </div>

            {/* Label Specification Details Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block">Dimensiones Físicas:</span>
                <span className="text-white font-bold">{activeTemplate.widthMm} x {activeTemplate.heightMm} mm</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Resolución Puntos:</span>
                <span className="text-teal-400 font-bold">
                  {activeTemplate.widthMm * (activeTemplate.dpi === 300 ? 12 : 8)} x {activeTemplate.heightMm * (activeTemplate.dpi === 300 ? 12 : 8)} px
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Margen de Impresión:</span>
                <span className="text-emerald-400 font-bold">2.0 mm Quiet Zone</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Tiempo Estimado:</span>
                <span className="text-indigo-300 font-bold">~0.12 s por etiqueta</span>
              </div>
            </div>

            {/* ZPL Code View Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 flex items-center space-x-1.5">
                  <FileCode className="w-4 h-4 text-teal-400" />
                  <span>Código de Control Térmico Generado ({activeTemplate.printerLanguage}):</span>
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentZplCode);
                    alert('¡Código ZPL copiado al portapapeles!');
                  }}
                  className="text-teal-400 hover:text-teal-300 text-[11px] font-mono font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar ZPL</span>
                </button>
              </div>

              <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] font-mono text-teal-300 overflow-x-auto max-h-36 leading-tight">
                {currentZplCode}
              </pre>
            </div>
          </div>

          {/* Batch Print Spooler Queue */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-5">
            {/* Header & Hardware Spooler Status Strip */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <span>Cola de Impresión de Tubos en Recepción (Batch Spooler)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selecciona múltiples etiquetas para imprimir secuencialmente en lote por WebSocket o exportar archivo ZPL.
                </p>
              </div>

              {/* Hardware Metrics Badge Strip */}
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center space-x-2">
                  <span className="text-slate-500">Impresas hoy:</span>
                  <span className="text-teal-400 font-extrabold">{printedCountToday} u.</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center space-x-2">
                  <span className="text-slate-500">Cinta Ribon:</span>
                  <span className="text-emerald-400 font-extrabold">{ribbonRollPct}%</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center space-x-2">
                  <span className="text-slate-500">Rollo Muestra:</span>
                  <span className="text-indigo-300 font-extrabold">{labelRollRemaining} et.</span>
                </div>

                <button
                  onClick={() => setIsAddJobModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Muestra a Cola</span>
                </button>
              </div>
            </div>

            {/* Batch Progress Bar during Sequential Execution */}
            {isBatchPrinting && (
              <div className="bg-indigo-950/80 border border-indigo-500/50 p-4 rounded-2xl space-y-2 animate-pulse">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-indigo-200">
                  <span className="flex items-center space-x-2">
                    <Printer className="w-4 h-4 text-teal-400 animate-spin" />
                    <span>ENVIANDO LOTE A IMPRESORA TÉRMICA... ({batchProgress.current} DE {batchProgress.total})</span>
                  </span>
                  <span className="text-teal-400 font-black">{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-teal-400 to-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Interactive Batch Actions Control Bar */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 font-bold text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={printQueue.length > 0 && selectedJobIds.length === printQueue.length}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500 cursor-pointer"
                  />
                  <span>Seleccionar Todos ({selectedJobIds.length}/{printQueue.length})</span>
                </label>

                <button
                  onClick={handleSelectOnlyPending}
                  className="text-teal-400 hover:text-teal-300 font-mono text-[11px] font-bold underline cursor-pointer"
                >
                  Sólo Pendientes
                </button>
              </div>

              {/* Batch Command Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleBatchPrintSelected}
                  disabled={isBatchPrinting || selectedJobIds.length === 0}
                  className="bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-black px-4 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>⚡ Imprimir Lote ({selectedJobIds.length})</span>
                </button>

                <button
                  onClick={handleExportBatchZpl}
                  disabled={selectedJobIds.length === 0}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-teal-300 border border-teal-500/30 px-3 py-2 rounded-xl transition flex items-center space-x-1 cursor-pointer"
                  title="Descargar código ZPL concatenado del lote para impresión directa"
                >
                  <Download className="w-3.5 h-3.5 text-teal-400" />
                  <span>Exportar ZPL</span>
                </button>

                <button
                  onClick={() => handleBulkMarkStatus('IMPRESO')}
                  disabled={selectedJobIds.length === 0}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-xl transition flex items-center space-x-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Marcar Impreso</span>
                </button>

                <button
                  onClick={() => handleBulkMarkStatus('PENDIENTE')}
                  disabled={selectedJobIds.length === 0}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-amber-300 border border-amber-500/30 px-3 py-2 rounded-xl transition flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Revertir Pendiente</span>
                </button>

                <button
                  onClick={handleDeleteSelectedJobs}
                  disabled={selectedJobIds.length === 0}
                  className="bg-slate-900 hover:bg-rose-950/60 disabled:opacity-40 text-rose-300 border border-rose-500/30 p-2 rounded-xl transition cursor-pointer"
                  title="Eliminar seleccionados"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                </button>
              </div>
            </div>

            {/* Print Queue Data Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={printQueue.length > 0 && selectedJobIds.length === printQueue.length}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-teal-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Orden / Paciente</th>
                    <th className="p-3">Tipo de Tubo Muestra</th>
                    <th className="p-3">Pruebas Asignadas</th>
                    <th className="p-3 text-center">Copias</th>
                    <th className="p-3 text-center">Hora</th>
                    <th className="p-3 text-center">Acciones Spooler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {printQueue.map((job) => {
                    const badge = getTubeBadgeStyle(job.tubeType);
                    const isSelected = selectedJobIds.includes(job.id);
                    const isActivePrinting = batchProgress.activeJobId === job.id;

                    return (
                      <tr
                        key={job.id}
                        className={`transition ${
                          isActivePrinting
                            ? 'bg-teal-500/20 border-l-4 border-teal-400 animate-pulse'
                            : isSelected
                            ? 'bg-slate-800/50'
                            : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectJob(job.id)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-teal-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-teal-300 font-extrabold flex items-center space-x-1.5">
                            <span>{job.orderNumber}</span>
                            {job.orderNumber.includes('-A') && (
                              <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-black border border-sky-500/30">
                                ALÍCUOTA
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-white text-[13px]">{job.patientName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">CED: {job.patientCedula}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border inline-block ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-300 font-bold">
                          {job.testCodes.join(', ')}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-amber-300">
                          x{job.quantity || 1}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-400 text-[11px]">
                          {job.timestamp}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {job.status === 'IMPRESO' ? (
                              <span className="text-emerald-400 font-bold flex items-center space-x-1 text-[10px] bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Impreso</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handlePrintJob(job.id)}
                                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-3 py-1 rounded-lg text-[10px] cursor-pointer shadow"
                              >
                                Imprimir
                              </button>
                            )}

                            {/* Generate Sub-Aliquot Button */}
                            <button
                              onClick={() => handleGenerateAliquotJobs(job)}
                              className="bg-slate-800 hover:bg-slate-700 text-sky-300 p-1.5 rounded-lg text-[10px] cursor-pointer border border-sky-500/30"
                              title="Generar alícuotas secundarias automáticas"
                            >
                              <Container className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* FULLSCREEN GALLERY MODAL */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-teal-500/10 p-2.5 rounded-2xl text-teal-400 border border-teal-500/20">
                  <Grid className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Galería de Plantillas Pre-diseñadas</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Selecciona y carga rápidamente configuraciones estandarizadas de etiquetas térmicas.</p>
                </div>
              </div>

              <button
                onClick={() => setIsGalleryOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-2xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedCategoryFilter('TODAS')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategoryFilter === 'TODAS'
                    ? 'bg-teal-500 text-slate-950 font-black shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Todas ({PREDESIGNED_TEMPLATES_GALLERY.length})
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('PRIMARIO')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategoryFilter === 'PRIMARIO'
                    ? 'bg-purple-500 text-slate-950 font-black shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Tubo Primario
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('ALICUOTA')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategoryFilter === 'ALICUOTA'
                    ? 'bg-sky-500 text-slate-950 font-black shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Tubo Alícuota
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('STAT')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategoryFilter === 'STAT'
                    ? 'bg-rose-500 text-white font-black shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🚨 Urgencia / STAT
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('PEDIATRICO')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategoryFilter === 'PEDIATRICO'
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Pediátrico / Capilar
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('HISTOLOGIA')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategoryFilter === 'HISTOLOGIA'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Histología / Cassette
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('FRASCO')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategoryFilter === 'FRASCO'
                    ? 'bg-teal-500 text-slate-950 font-black shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Frasco Estéril
              </button>
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGallery.map((tpl) => {
                const badge = getCategoryBadge(tpl.category);
                const Icon = badge.icon;
                const isCurrentActive = activeTemplate.id === tpl.id;

                return (
                  <div
                    key={tpl.id}
                    className={`bg-slate-950 border p-5 rounded-3xl flex flex-col justify-between space-y-4 transition ${
                      isCurrentActive ? 'border-teal-500 ring-2 ring-teal-500/30' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center space-x-1 ${badge.bg}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </span>
                        <span className="font-mono text-xs font-black text-amber-300">{tpl.widthMm}x{tpl.heightMm} mm</span>
                      </div>

                      <h3 className="font-extrabold text-white text-base leading-snug">{tpl.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{tpl.description}</p>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800/80 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">Simbología:</span>
                        <span className="text-teal-400 font-bold">{tpl.barcodeType}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">Lenguaje:</span>
                        <span className="text-emerald-400 font-bold">{tpl.printerLanguage} ({tpl.dpi} DPI)</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleLoadTemplate(tpl);
                        setIsGalleryOpen(false);
                      }}
                      className={`w-full py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow ${
                        isCurrentActive
                          ? 'bg-slate-800 text-teal-400 border border-teal-500/40'
                          : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                      }`}
                    >
                      {isCurrentActive ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Plantilla Activa Actual</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-current" />
                          <span>Cargar Esta Plantilla</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN HIGH-RESOLUTION LABEL INSPECTOR MODAL */}
      {isInspectorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-teal-500/10 p-2.5 rounded-2xl text-teal-400 border border-teal-500/20">
                  <Maximize2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Inspector de Etiqueta HD & Control de Calidad LIS</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Verificación ampliada de contraste de tinta, zonas silenciosas y nitidez de códigos de barra.</p>
                </div>
              </div>

              <button
                onClick={() => setIsInspectorModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-2xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-Resolution HD Label Render Canvas */}
            <div className="bg-slate-950 p-10 rounded-3xl border border-slate-800 flex items-center justify-center min-h-[380px] relative overflow-hidden">
              <div
                style={{
                  width: `${activeTemplate.widthMm * 10}px`,
                  height: `${activeTemplate.heightMm * 10}px`
                }}
                className={`bg-white text-black p-5 rounded-xl shadow-2xl relative font-sans flex flex-col justify-between border-2 select-none overflow-hidden ${
                  activeTemplate.isStatUrgent ? 'border-rose-500 ring-8 ring-rose-500/20' : 'border-slate-300'
                }`}
              >
                {/* URGENT STAT BANNER */}
                {activeTemplate.isStatUrgent && (
                  <div className="bg-rose-600 text-white text-[11px] font-black uppercase text-center py-1 -mx-5 -mt-5 mb-2 tracking-widest flex items-center justify-center space-x-1 shadow">
                    <Flame className="w-4 h-4 fill-white animate-pulse" />
                    <span>🚨 URGENCIA / STAT MÉDICO</span>
                  </div>
                )}

                {/* ALIQUOT TAG BANNER */}
                {activeTemplate.aliquotTag && !activeTemplate.isStatUrgent && (
                  <div className="bg-sky-600 text-white text-[10px] font-black uppercase text-center py-1 -mx-5 -mt-5 mb-2 tracking-wider">
                    {activeTemplate.aliquotTag}
                  </div>
                )}

                {/* Tube Color Badge Strip */}
                {activeTemplate.showTubeColorBadge && !activeTemplate.isStatUrgent && !activeTemplate.aliquotTag && (
                  <div className={`absolute top-0 right-0 left-0 h-3 ${getTubeBadgeStyle(sampleTubeType).bg}`}></div>
                )}

                <div className="space-y-1 mt-1">
                  <div className="flex items-center justify-between font-mono font-black text-[14px] leading-none">
                    <span>{sampleOrderNumber}</span>
                    {activeTemplate.showBranchName && <span className="text-[10px] uppercase font-bold text-slate-700">VÍA ESPAÑA</span>}
                  </div>

                  {activeTemplate.showPatientName && (
                    <div className="font-black text-[13px] uppercase leading-tight tracking-tight truncate">
                      {samplePatientName}
                    </div>
                  )}

                  <div className="text-[10px] font-mono font-bold text-slate-700">
                    CED: {sampleCedula} • 2026-08-12 08:26 AM
                  </div>
                </div>

                {/* Barcode Graphic Renderer (HD) */}
                <div className="my-2 flex flex-col items-center justify-center">
                  {activeTemplate.barcodeType === 'CODE128' ? (
                    <div className="w-full flex flex-col items-center">
                      <svg className="w-full h-14" viewBox="0 0 200 40" preserveAspectRatio="none">
                        <rect width="200" height="40" fill="#ffffff" />
                        <rect x="0" y="0" width="3" height="40" fill="#000" />
                        <rect x="5" y="0" width="2" height="40" fill="#000" />
                        <rect x="10" y="0" width="4" height="40" fill="#000" />
                        <rect x="18" y="0" width="1" height="40" fill="#000" />
                        <rect x="22" y="0" width="3" height="40" fill="#000" />
                        <rect x="28" y="0" width="5" height="40" fill="#000" />
                        <rect x="36" y="0" width="2" height="40" fill="#000" />
                        <rect x="42" y="0" width="4" height="40" fill="#000" />
                        <rect x="50" y="0" width="1" height="40" fill="#000" />
                        <rect x="54" y="0" width="3" height="40" fill="#000" />
                        <rect x="60" y="0" width="6" height="40" fill="#000" />
                        <rect x="70" y="0" width="2" height="40" fill="#000" />
                        <rect x="76" y="0" width="4" height="40" fill="#000" />
                        <rect x="84" y="0" width="2" height="40" fill="#000" />
                        <rect x="90" y="0" width="5" height="40" fill="#000" />
                        <rect x="98" y="0" width="1" height="40" fill="#000" />
                        <rect x="102" y="0" width="3" height="40" fill="#000" />
                        <rect x="108" y="0" width="4" height="40" fill="#000" />
                        <rect x="116" y="0" width="2" height="40" fill="#000" />
                        <rect x="122" y="0" width="5" height="40" fill="#000" />
                        <rect x="130" y="0" width="1" height="40" fill="#000" />
                        <rect x="134" y="0" width="3" height="40" fill="#000" />
                        <rect x="140" y="0" width="6" height="40" fill="#000" />
                        <rect x="150" y="0" width="2" height="40" fill="#000" />
                        <rect x="156" y="0" width="4" height="40" fill="#000" />
                        <rect x="164" y="0" width="2" height="40" fill="#000" />
                        <rect x="170" y="0" width="5" height="40" fill="#000" />
                        <rect x="180" y="0" width="3" height="40" fill="#000" />
                        <rect x="185" y="0" width="1" height="40" fill="#000" />
                        <rect x="188" y="0" width="4" height="40" fill="#000" />
                        <rect x="195" y="0" width="2" height="40" fill="#000" />
                      </svg>
                      <span className="font-mono text-[10px] font-extrabold tracking-widest mt-1 text-black">
                        {sampleOrderNumber}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <svg className="w-16 h-16" viewBox="0 0 100 100">
                        <rect width="100" height="100" fill="#ffffff" />
                        <rect x="5" y="5" width="30" height="30" fill="#000" />
                        <rect x="10" y="10" width="20" height="20" fill="#fff" />
                        <rect x="15" y="15" width="10" height="10" fill="#000" />
                        <rect x="65" y="5" width="30" height="30" fill="#000" />
                        <rect x="70" y="10" width="20" height="20" fill="#fff" />
                        <rect x="75" y="15" width="10" height="10" fill="#000" />
                        <rect x="5" y="65" width="30" height="30" fill="#000" />
                        <rect x="10" y="70" width="20" height="20" fill="#fff" />
                        <rect x="15" y="75" width="10" height="10" fill="#000" />
                        <rect x="40" y="10" width="8" height="8" fill="#000" />
                        <rect x="50" y="20" width="8" height="8" fill="#000" />
                        <rect x="40" y="40" width="20" height="8" fill="#000" />
                        <rect x="70" y="45" width="8" height="15" fill="#000" />
                        <rect x="80" y="65" width="15" height="8" fill="#000" />
                      </svg>
                      <div className="text-[10px] font-mono leading-tight">
                        <div className="font-extrabold text-black">{sampleOrderNumber}</div>
                        <div className="text-slate-600 font-bold">MATRIZ DENSIDAD 2D</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Info */}
                <div className="text-[10px] font-bold border-t border-slate-300 pt-1 flex justify-between items-center text-slate-800">
                  <span>EXÁMENES: {sampleTests}</span>
                  <span className="font-mono font-black text-[9px] px-1.5 py-0.5 bg-slate-200 rounded">LIS HD</span>
                </div>
              </div>
            </div>

            {/* Quality Checklist Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px]">Contraste de Tinta:</span>
                <span className="text-emerald-400 font-bold block">100% Térmico Directo (Negro Puro)</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px]">Verificación de Simbología:</span>
                <span className="text-teal-400 font-bold block">{activeTemplate.barcodeType} ISO/IEC 15417</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px]">Legibilidad Escáner:</span>
                <span className="text-indigo-400 font-bold block">Grado A (Excelente)</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsInspectorModalOpen(false)}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs transition cursor-pointer"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW SAMPLE JOB CREATION MODAL */}
      {isAddJobModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-500/10 p-2.5 rounded-2xl text-indigo-400 border border-indigo-500/20">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Añadir Muestra a la Cola de Impresión</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Ingresa los datos del paciente y la muestra para spooling directo.</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddJobModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-2xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewJob} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Número de Orden LIS:</label>
                  <input
                    type="text"
                    required
                    value={newOrderNum}
                    onChange={(e) => setNewOrderNum(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-teal-300 font-mono font-bold focus:ring-1 focus:ring-teal-500"
                    placeholder="ORD-2026-9050"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Cédula / ID Paciente:</label>
                  <input
                    type="text"
                    required
                    value={newCedula}
                    onChange={(e) => setNewCedula(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:ring-1 focus:ring-teal-500"
                    placeholder="8-888-9999"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Nombre Completo del Paciente:</label>
                <input
                  type="text"
                  required
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold uppercase focus:ring-1 focus:ring-teal-500"
                  placeholder="APELLIDO, NOMBRE"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Tipo de Tubo Primario:</label>
                  <select
                    value={newTubeType}
                    onChange={(e) => setNewTubeType(e.target.value as PrintQueueJob['tubeType'])}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:ring-1 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="EDTA_LAVENDER">EDTA Morado (Hematología)</option>
                    <option value="SST_GOLD">SST Amarillo/Oro (Química)</option>
                    <option value="CITRATE_BLUE">Citrato Azul (Coagulación)</option>
                    <option value="HEPARIN_GREEN">Heparina Verde (STAT)</option>
                    <option value="FLUORIDE_GRAY">Fluoruro Gris (Glucosa)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Copias a Imprimir:</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newCopies}
                    onChange={(e) => setNewCopies(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-amber-300 font-mono font-bold text-center focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Pruebas Asignadas (separadas por coma):</label>
                <input
                  type="text"
                  required
                  value={newTests}
                  onChange={(e) => setNewTests(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono focus:ring-1 focus:ring-teal-500"
                  placeholder="CBC, CREA, TSH"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddJobModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-6 py-2.5 rounded-xl font-black flex items-center space-x-2 cursor-pointer shadow"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Insertar en Cola</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTER MANAGEMENT MODAL (ADMINISTRACIÓN DE IMPRESORAS DE RED) */}
      {isPrinterManagerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-500/10 p-3 rounded-2xl text-indigo-400 border border-indigo-500/20">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white flex items-center space-x-2">
                    <span>Administración de Impresoras Térmicas de Red</span>
                    <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                      LAN / WS / IP
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Descubre dispositivos en la subred local, prueba la calibración de cabezal y asigna la impresora predeterminada por sede.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPrinterManagerOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-2xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sede / Branch Filter Tabs Bar */}
            <div className="space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  <span>Seleccionar Sede del Laboratorio:</span>
                </span>
                <span className="text-[11px] font-mono text-teal-400 font-bold">
                  Sede Activa Actual: {selectedBranch}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {AVAILABLE_BRANCHES.map(b => {
                  const isActive = selectedBranch === b;
                  const countForBranch = networkPrinters.filter(p => p.branch === b).length;
                  const defaultPrinter = networkPrinters.find(p => p.branch === b && p.isDefault);

                  return (
                    <button
                      key={b}
                      onClick={() => setSelectedBranch(b)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer border ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{b}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        isActive ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {countForBranch}
                      </span>
                      {defaultPrinter && (
                        <span className="text-[10px] text-amber-300 font-black">⭐</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LAN Subnet Search & Scanner Control Toolbar */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex flex-1 items-center space-x-2">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={printerSearchQuery}
                    onChange={(e) => setPrinterSearchQuery(e.target.value)}
                    placeholder="Filtrar por nombre, modelo o IP..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white font-mono placeholder-slate-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
                  <span className="text-slate-500 font-mono text-[11px]">Subred LAN:</span>
                  <input
                    type="text"
                    value={subnetInput}
                    onChange={(e) => setSubnetInput(e.target.value)}
                    className="w-28 bg-slate-950 border border-slate-700 rounded text-teal-300 text-center font-mono font-bold text-xs p-0.5"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleScanLanNetwork}
                  disabled={isScanningLan}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl transition flex items-center space-x-2 cursor-pointer shadow"
                >
                  <Radio className={`w-4 h-4 text-teal-300 ${isScanningLan ? 'animate-spin' : ''}`} />
                  <span>{isScanningLan ? 'Escaneando LAN...' : 'Escanear Red LAN'}</span>
                </button>

                <button
                  onClick={() => setIsAddManualPrinterOpen(true)}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-4 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Agregar Manual IP</span>
                </button>
              </div>
            </div>

            {/* Scanning LAN Progress Animation Strip */}
            {isScanningLan && (
              <div className="bg-indigo-950/80 border border-indigo-500/40 p-3.5 rounded-2xl space-y-1.5 animate-pulse shrink-0">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-indigo-200">
                  <span className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-teal-400 animate-spin" />
                    <span>ENVIANDO PAQUETES ICMP / TCP PORT 9100 EN SUBRED {subnetInput}...</span>
                  </span>
                  <span className="text-teal-400 font-black">{scanProgress}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-teal-400 to-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Network Printer List Grid */}
            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {networkPrinters
                .filter(p => p.branch === selectedBranch)
                .filter(p =>
                  !printerSearchQuery.trim() ||
                  p.name.toLowerCase().includes(printerSearchQuery.toLowerCase()) ||
                  p.ip.includes(printerSearchQuery) ||
                  p.model.toLowerCase().includes(printerSearchQuery.toLowerCase())
                )
                .map(printer => {
                  return (
                    <div
                      key={printer.id}
                      className={`p-5 rounded-2xl border transition space-y-3 ${
                        printer.isDefault
                          ? 'bg-slate-950 border-amber-500/50 shadow-lg shadow-amber-500/5'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-2xl border ${
                            printer.status === 'ONLINE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            <Printer className="w-6 h-6" />
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-extrabold text-white text-sm">{printer.name}</h3>
                              {printer.isDefault && (
                                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center space-x-1">
                                  <span>⭐ PREDETERMINADA DE SEDE</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{printer.model}</p>
                          </div>
                        </div>

                        {/* Status & Latency Badge */}
                        <div className="flex items-center space-x-3">
                          <div className="text-right font-mono text-xs">
                            <div className="flex items-center justify-end space-x-1.5">
                              <span className={`w-2 h-2 rounded-full ${printer.status === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
                              <span className={`font-bold ${printer.status === 'ONLINE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {printer.status}
                              </span>
                            </div>
                            {printer.status === 'ONLINE' && (
                              <div className="text-[10px] text-slate-500">Ping: {printer.pingMs} ms</div>
                            )}
                          </div>

                          {printer.isDefault ? (
                            <div className="bg-amber-500 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 shadow">
                              <CheckCircle2 className="w-4 h-4 fill-slate-950 text-amber-500" />
                              <span>Sede Activa</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSaveAsBranchDefault(printer)}
                              className="bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center space-x-1"
                            >
                              <span>⭐ Guardar como Predeterminada</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Technical Specs & Location Info Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-slate-300">
                        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
                          <span className="text-[10px] text-slate-500 block">IP / Puerto / Protocolo:</span>
                          <span className="text-teal-300 font-bold block">{printer.ip}:{printer.port}</span>
                          <span className="text-[10px] text-slate-400">{printer.protocol}</span>
                        </div>

                        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
                          <span className="text-[10px] text-slate-500 block">Ubicación Interna:</span>
                          <span className="text-white font-bold block truncate">{printer.location}</span>
                          <span className="text-[10px] text-indigo-300">{printer.branch}</span>
                        </div>

                        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
                          <span className="text-[10px] text-slate-500 block">Resolución & Lenguajes:</span>
                          <span className="text-emerald-400 font-bold block">{printer.dpi} DPI</span>
                          <span className="text-[10px] text-slate-400">{printer.languages.join(', ')}</span>
                        </div>

                        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
                          <span className="text-[10px] text-slate-500 block">Consumibles / Insumos:</span>
                          <span className="text-amber-300 font-bold block">{printer.ribbonLevelPct}% Ribbon</span>
                          <span className="text-[10px] text-slate-400">{printer.labelRollRemaining} etq. restantes</span>
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-[11px] text-slate-500 font-mono">
                          ID Dispositivo: {printer.id}
                        </span>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTestPrintCalibration(printer)}
                            className="bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 font-bold px-3 py-1 rounded-xl text-xs transition cursor-pointer flex items-center space-x-1"
                          >
                            <Play className="w-3.5 h-3.5 text-teal-400" />
                            <span>Probar Calibración</span>
                          </button>

                          <button
                            onClick={() => handleDeletePrinter(printer.id)}
                            className="bg-slate-900 hover:bg-rose-950/60 text-rose-300 border border-rose-500/30 p-1.5 rounded-xl transition cursor-pointer"
                            title="Eliminar impresora"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {networkPrinters.filter(p => p.branch === selectedBranch).length === 0 && (
                <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl text-center space-y-3">
                  <Printer className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">No hay impresoras térmicas registradas para {selectedBranch}.</p>
                  <p className="text-xs text-slate-500">Usa el botón "Escanear Red LAN" o "Agregar Manual IP" para vincular dispositivos en esta sede.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4 shrink-0 text-xs">
              <span className="text-slate-400 font-mono">
                Total Dispositivos LAN: <strong className="text-white">{networkPrinters.length}</strong>
              </span>

              <button
                onClick={() => setIsPrinterManagerOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-6 py-2.5 rounded-2xl transition cursor-pointer shadow"
              >
                Guardar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ADD PRINTER MODAL */}
      {isAddManualPrinterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-teal-500/10 p-2.5 rounded-2xl text-teal-400 border border-teal-500/20">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Vincular Nueva Impresora Manual</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Ingresa la IP estática y parámetros del puerto térmico.</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddManualPrinterOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-2xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualPrinterSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Nombre del Dispositivo:</label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold focus:ring-1 focus:ring-teal-500"
                  placeholder="Ej. Zebra ZD421 (Recepción Box 2)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Dirección IP Estática:</label>
                  <input
                    type="text"
                    required
                    value={manualIp}
                    onChange={(e) => setManualIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-teal-300 font-mono font-bold focus:ring-1 focus:ring-teal-500"
                    placeholder="192.168.1.135"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Puerto RAW / Socket:</label>
                  <input
                    type="number"
                    required
                    value={manualPort}
                    onChange={(e) => setManualPort(Number(e.target.value) || 9100)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-amber-300 font-mono font-bold text-center focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Protocolo de Comunicación:</label>
                  <select
                    value={manualProtocol}
                    onChange={(e) => setManualProtocol(e.target.value as NetworkPrinter['protocol'])}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold cursor-pointer"
                  >
                    <option value="WEBSOCKET">WebSocket (ws://)</option>
                    <option value="RAW_TCP_9100">Raw TCP Socket 9100</option>
                    <option value="USB_BRIDGE">Bridge USB Directo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Resolución Térmica (DPI):</label>
                  <select
                    value={manualDpi}
                    onChange={(e) => setManualDpi(Number(e.target.value) as 203 | 300 | 600)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-emerald-400 font-mono font-bold cursor-pointer"
                  >
                    <option value={203}>203 DPI (8 dots/mm)</option>
                    <option value={300}>300 DPI (12 dots/mm)</option>
                    <option value={600}>600 DPI (24 dots/mm)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Sede Asignada:</label>
                  <select
                    value={manualBranch}
                    onChange={(e) => setManualBranch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold cursor-pointer"
                  >
                    {AVAILABLE_BRANCHES.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Ubicación / Box:</label>
                  <input
                    type="text"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:ring-1 focus:ring-teal-500"
                    placeholder="Módulo Toma 2"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddManualPrinterOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-6 py-2.5 rounded-xl font-black flex items-center space-x-2 cursor-pointer shadow"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Guardar Impresora</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
