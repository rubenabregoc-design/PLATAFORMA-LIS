/**
 * Printer Management Service for LISCore
 * Provides automatic and manual label printing capabilities for laboratory specimen tubes,
 * thermal printer fleet management (Zebra ZPL-II, TSC TSPL, Citizen, Bixolon, Direct USB/Browser),
 * and automatic print job dispatch upon order admission.
 */

import { Order, Patient, TestCatalogItem } from '../types';

export interface SpecimenTubeLabel {
  id: string;
  orderNumber: string;
  sampleBarcode: string;
  patientName: string;
  patientNationalId: string;
  patientAge: number;
  patientGender: 'M' | 'F';
  tubeType: 'EDTA_LAVENDER' | 'SST_GOLD' | 'CITRATE_BLUE' | 'HEPARIN_GREEN' | 'FLUORIDE_GRAY' | 'URINE_CUP' | 'STOOL_CONTAINER';
  tubeColorName: string;
  tubeColorHex: string;
  testsList: string[];
  isStat: boolean;
  collectionTimestamp: string;
  branchName: string;
  operatorName: string;
  barcodeFormat: 'CODE128' | 'DATAMATRIX' | 'QR';
}

export interface ThermalPrinterDevice {
  id: string;
  name: string;
  model: string;
  connectionType: 'NETWORK_TCP_9100' | 'WEBSOCKET' | 'USB_BRIDGE' | 'SYSTEM_PRINT';
  ipAddress?: string;
  port?: number;
  location: string;
  branch: string;
  dpi: 203 | 300;
  emulation: 'ZPL' | 'TSPL' | 'EPL';
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'PAPER_LOW';
  isDefault: boolean;
  labelWidthMm: number;
  labelHeightMm: number;
  remainingLabels: number;
  ribbonLevelPct: number;
}

export interface PrintJobRecord {
  id: string;
  jobTitle: string;
  orderId: string;
  orderNumber: string;
  patientName: string;
  labelsCount: number;
  printerId: string;
  printerName: string;
  status: 'COMPLETED' | 'PRINTING' | 'QUEUED' | 'ERROR';
  rawCommandSnippet: string;
  createdAt: string;
  autoTriggered: boolean;
  labels: SpecimenTubeLabel[];
}

const STORAGE_PRINTERS_KEY = 'LISCORE_PRINTER_FLEET_CONFIG_V2';
const STORAGE_AUTO_PRINT_KEY = 'LISCORE_AUTO_PRINT_ON_ORDER_ENABLED';
const STORAGE_PRINT_HISTORY_KEY = 'LISCORE_PRINT_JOB_HISTORY_V2';

export const DEFAULT_PRINTER_FLEET: ThermalPrinterDevice[] = [
  {
    id: 'prn-zebra-zd421-box1',
    name: 'Zebra ZD421 (Flebotomía Box 1)',
    model: 'Zebra ZD421 Direct Thermal (203 dpi)',
    connectionType: 'NETWORK_TCP_9100',
    ipAddress: '192.168.1.105',
    port: 9100,
    location: 'Módulo de Toma de Muestras - Box 1',
    branch: 'Sede Vía España',
    dpi: 203,
    emulation: 'ZPL',
    status: 'ONLINE',
    isDefault: true,
    labelWidthMm: 50,
    labelHeightMm: 25,
    remainingLabels: 480,
    ribbonLevelPct: 88
  },
  {
    id: 'prn-zebra-zd421-box2',
    name: 'Zebra ZD421 (Flebotomía Box 2 Pediátrico)',
    model: 'Zebra ZD421 Direct Thermal (203 dpi)',
    connectionType: 'NETWORK_TCP_9100',
    ipAddress: '192.168.1.106',
    port: 9100,
    location: 'Módulo de Toma de Muestras - Box 2',
    branch: 'Sede Vía España',
    dpi: 203,
    emulation: 'ZPL',
    status: 'ONLINE',
    isDefault: false,
    labelWidthMm: 50,
    labelHeightMm: 25,
    remainingLabels: 320,
    ribbonLevelPct: 75
  },
  {
    id: 'prn-tsc-ttp244-lab',
    name: 'TSC TTP-244 Pro (Recepción Central)',
    model: 'TSC TTP-244 Pro Thermal (203 dpi)',
    connectionType: 'USB_BRIDGE',
    location: 'Ventanilla de Admisión y Recepción #1',
    branch: 'Sede Vía España',
    dpi: 203,
    emulation: 'TSPL',
    status: 'ONLINE',
    isDefault: false,
    labelWidthMm: 50,
    labelHeightMm: 30,
    remainingLabels: 210,
    ribbonLevelPct: 62
  },
  {
    id: 'prn-citizen-stat',
    name: 'Citizen CL-S621 (Urgencias STAT)',
    model: 'Citizen CL-S621 (300 dpi)',
    connectionType: 'NETWORK_TCP_9100',
    ipAddress: '192.168.2.55',
    port: 9100,
    location: 'Área de Procesamiento Urgente STAT',
    branch: 'Sede Calle 50',
    dpi: 300,
    emulation: 'ZPL',
    status: 'ONLINE',
    isDefault: true,
    labelWidthMm: 50,
    labelHeightMm: 25,
    remainingLabels: 590,
    ribbonLevelPct: 95
  }
];

export class PrinterManagementService {
  private static instance: PrinterManagementService;
  private printers: ThermalPrinterDevice[] = [];
  private autoPrintEnabled: boolean = true;
  private jobHistory: PrintJobRecord[] = [];
  private listeners: Array<() => void> = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      this.loadState();
    }
  }

  public static getInstance(): PrinterManagementService {
    if (!PrinterManagementService.instance) {
      PrinterManagementService.instance = new PrinterManagementService();
    }
    return PrinterManagementService.instance;
  }

  private loadState() {
    try {
      const storedPrinters = localStorage.getItem(STORAGE_PRINTERS_KEY);
      if (storedPrinters) {
        this.printers = JSON.parse(storedPrinters);
      } else {
        this.printers = DEFAULT_PRINTER_FLEET;
        this.savePrinters();
      }

      const storedAutoPrint = localStorage.getItem(STORAGE_AUTO_PRINT_KEY);
      if (storedAutoPrint !== null) {
        this.autoPrintEnabled = storedAutoPrint === 'true';
      } else {
        this.autoPrintEnabled = true; // Enabled by default for seamless phlebotomy
        localStorage.setItem(STORAGE_AUTO_PRINT_KEY, 'true');
      }

      const storedHistory = localStorage.getItem(STORAGE_PRINT_HISTORY_KEY);
      if (storedHistory) {
        this.jobHistory = JSON.parse(storedHistory);
      }
    } catch (e) {
      console.warn('Error loading printer config, using defaults', e);
      this.printers = DEFAULT_PRINTER_FLEET;
      this.autoPrintEnabled = true;
    }
  }

  private savePrinters() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_PRINTERS_KEY, JSON.stringify(this.printers));
      } catch (e) {
        console.error('Failed to save printer config', e);
      }
    }
  }

  private saveHistory() {
    if (typeof window !== 'undefined') {
      try {
        // Keep last 50 jobs
        const trimmed = this.jobHistory.slice(0, 50);
        localStorage.setItem(STORAGE_PRINT_HISTORY_KEY, JSON.stringify(trimmed));
      } catch (e) {
        console.error('Failed to save print job history', e);
      }
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lis:printer-service-updated'));
    }
  }

  public getPrinters(): ThermalPrinterDevice[] {
    return [...this.printers];
  }

  public getDefaultPrinter(branch?: string): ThermalPrinterDevice {
    if (branch) {
      const branchDefault = this.printers.find(p => p.branch === branch && p.isDefault && p.status === 'ONLINE');
      if (branchDefault) return branchDefault;
      const anyBranchPrinter = this.printers.find(p => p.branch === branch && p.status === 'ONLINE');
      if (anyBranchPrinter) return anyBranchPrinter;
    }
    const generalDefault = this.printers.find(p => p.isDefault && p.status === 'ONLINE');
    return generalDefault || this.printers[0] || DEFAULT_PRINTER_FLEET[0];
  }

  public setDefaultPrinter(printerId: string) {
    this.printers = this.printers.map(p => ({
      ...p,
      isDefault: p.id === printerId
    }));
    this.savePrinters();
    this.notify();
  }

  public updatePrinterStatus(printerId: string, status: ThermalPrinterDevice['status']) {
    this.printers = this.printers.map(p => p.id === printerId ? { ...p, status } : p);
    this.savePrinters();
    this.notify();
  }

  public getAutoPrintEnabled(): boolean {
    return this.autoPrintEnabled;
  }

  public setAutoPrintEnabled(enabled: boolean) {
    this.autoPrintEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_AUTO_PRINT_KEY, String(enabled));
    }
    this.notify();
  }

  public getJobHistory(): PrintJobRecord[] {
    return [...this.jobHistory];
  }

  /**
   * Evaluates order tests and catalog items to deduce the required specimen tubes,
   * avoiding duplicate tubes of the same color when tests share specimen containers.
   */
  public generateSpecimenLabelsForOrder(
    order: Order,
    patient?: Patient,
    testCatalog?: TestCatalogItem[]
  ): SpecimenTubeLabel[] {
    const labels: SpecimenTubeLabel[] = [];
    const testIds = order.testIds || [];
    const isStat = order.priority === 'STAT';
    const nowIso = new Date().toISOString();

    // Map test categories / IDs to tube requirements
    const neededTubes: {
      type: SpecimenTubeLabel['tubeType'];
      colorName: string;
      colorHex: string;
      testNames: string[];
    }[] = [];

    // Classify tests
    let hasEdta = false;
    let hasSerum = false;
    let hasCitrate = false;
    let hasFluoride = false;
    let hasUrine = false;
    let hasStool = false;

    const edtaTests: string[] = [];
    const serumTests: string[] = [];
    const citrateTests: string[] = [];
    const fluorideTests: string[] = [];
    const urineTests: string[] = [];
    const stoolTests: string[] = [];

    testIds.forEach(tId => {
      const lower = tId.toLowerCase();
      if (lower.includes('hemo') || lower.includes('cbc') || lower.includes('hba1c') || lower.includes('frotis') || lower.includes('edta')) {
        hasEdta = true;
        edtaTests.push(tId.toUpperCase().replace('TEST-', '').slice(0, 10));
      } else if (lower.includes('pt') || lower.includes('inr') || lower.includes('ptt') || lower.includes('fibrin') || lower.includes('dimero') || lower.includes('coag')) {
        hasCitrate = true;
        citrateTests.push(tId.toUpperCase().replace('TEST-', '').slice(0, 10));
      } else if (lower.includes('glucosa') || lower.includes('curva') || lower.includes('fluor')) {
        hasFluoride = true;
        fluorideTests.push(tId.toUpperCase().replace('TEST-', '').slice(0, 10));
      } else if (lower.includes('orina') || lower.includes('urinalisis') || lower.includes('urocult')) {
        hasUrine = true;
        urineTests.push(tId.toUpperCase().replace('TEST-', '').slice(0, 10));
      } else if (lower.includes('heces') || lower.includes('parasit') || lower.includes('copro')) {
        hasStool = true;
        stoolTests.push(tId.toUpperCase().replace('TEST-', '').slice(0, 10));
      } else {
        // General chemistry / immunology (Serum SST)
        hasSerum = true;
        serumTests.push(tId.toUpperCase().replace('TEST-', '').slice(0, 10));
      }
    });

    // If no specific tests resolved, default to at least one EDTA and Serum
    if (!hasEdta && !hasSerum && !hasCitrate && !hasFluoride && !hasUrine && !hasStool) {
      hasEdta = true;
      edtaTests.push('PERFIL GENERAL');
    }

    if (hasEdta) {
      neededTubes.push({
        type: 'EDTA_LAVENDER',
        colorName: 'EDTA K2 (Tapa Morada)',
        colorHex: '#8b5cf6',
        testNames: edtaTests
      });
    }
    if (hasSerum) {
      neededTubes.push({
        type: 'SST_GOLD',
        colorName: 'Suero Gel / SST (Tapa Amarilla/Roja)',
        colorHex: '#eab308',
        testNames: serumTests
      });
    }
    if (hasCitrate) {
      neededTubes.push({
        type: 'CITRATE_BLUE',
        colorName: 'Citrato Sodio 3.2% (Tapa Azul)',
        colorHex: '#38bdf8',
        testNames: citrateTests
      });
    }
    if (hasFluoride) {
      neededTubes.push({
        type: 'FLUORIDE_GRAY',
        colorName: 'Fluoruro/Oxalato (Tapa Gris)',
        colorHex: '#94a3b8',
        testNames: fluorideTests
      });
    }
    if (hasUrine) {
      neededTubes.push({
        type: 'URINE_CUP',
        colorName: 'Frasco Estéril Orina',
        colorHex: '#f59e0b',
        testNames: urineTests
      });
    }
    if (hasStool) {
      neededTubes.push({
        type: 'STOOL_CONTAINER',
        colorName: 'Envase Coprológico',
        colorHex: '#84cc16',
        testNames: stoolTests
      });
    }

    // Build each tube label
    neededTubes.forEach((tube, idx) => {
      const sampleBarcode = `${order.orderNumber}-${idx + 1}`;
      labels.push({
        id: `lbl-${order.id}-${idx}-${Date.now()}`,
        orderNumber: order.orderNumber,
        sampleBarcode,
        patientName: order.patientName,
        patientNationalId: order.patientNationalId,
        patientAge: order.patientAge,
        patientGender: order.patientGender,
        tubeType: tube.type,
        tubeColorName: tube.colorName,
        tubeColorHex: tube.colorHex,
        testsList: tube.testNames,
        isStat,
        collectionTimestamp: nowIso,
        branchName: 'Sede Vía España',
        operatorName: 'Recepción Flebotomía',
        barcodeFormat: 'CODE128'
      });
    });

    return labels;
  }

  /**
   * Generates production-ready ZPL-II command string for Zebra Thermal Printers
   */
  public generateZplPayload(label: SpecimenTubeLabel, dpi: 203 | 300 = 203): string {
    const statFlag = label.isStat ? '^FO20,15^GB360,28,28,B,0^FS^FO30,19^FR^A0N,20,20^FD*** URGENCIA STAT ***^FS' : '';
    const tubeBadge = `^FO20,${label.isStat ? 48 : 20}^A0N,18,18^FD[${label.tubeColorName.slice(0, 18)}]^FS`;

    return `^XA
^PW406
^LL203
^LH0,0
${statFlag}
${tubeBadge}
^FO20,${label.isStat ? 72 : 44}^A0N,22,22^FD${label.patientName.slice(0, 24).toUpperCase()}^FS
^FO20,${label.isStat ? 98 : 70}^A0N,16,16^FDCED: ${label.patientNationalId} | ${label.patientAge}A (${label.patientGender})^FS
^FO20,${label.isStat ? 120 : 92}^BY2,2,40^BCN,40,Y,N,N^FD${label.sampleBarcode}^FS
^FO20,${label.isStat ? 180 : 152}^A0N,15,15^FD${label.testsList.join(', ').slice(0, 32)}^FS
^FO290,${label.isStat ? 180 : 152}^A0N,14,14^FD${new Date(label.collectionTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}^FS
^XZ`;
  }

  /**
   * Triggers an immediate print job for all specimen labels associated with an Order.
   */
  public async printOrderSpecimenLabels(
    order: Order,
    patient?: Patient,
    options: {
      autoTriggered?: boolean;
      targetPrinterId?: string;
      customLabels?: SpecimenTubeLabel[];
    } = {}
  ): Promise<{
    success: boolean;
    jobId: string;
    printer: ThermalPrinterDevice;
    labelsCount: number;
    labels: SpecimenTubeLabel[];
  }> {
    const labels = options.customLabels || this.generateSpecimenLabelsForOrder(order, patient);
    const targetPrinter = options.targetPrinterId
      ? this.printers.find(p => p.id === options.targetPrinterId) || this.getDefaultPrinter()
      : this.getDefaultPrinter();

    const jobId = `JOB-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const zplSnippet = labels.length > 0 ? this.generateZplPayload(labels[0], targetPrinter.dpi) : '^XA^XZ';

    const jobRecord: PrintJobRecord = {
      id: jobId,
      jobTitle: `Etiquetas Flebotomía [${order.orderNumber}] - ${labels.length} tubo(s)`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      patientName: order.patientName,
      labelsCount: labels.length,
      printerId: targetPrinter.id,
      printerName: targetPrinter.name,
      status: 'PRINTING',
      rawCommandSnippet: zplSnippet,
      createdAt: new Date().toISOString(),
      autoTriggered: options.autoTriggered ?? false,
      labels
    };

    // Add to history and update printer telemetry
    this.jobHistory.unshift(jobRecord);
    this.notify();

    // Decrement printer label roll
    this.printers = this.printers.map(p => {
      if (p.id === targetPrinter.id) {
        const remaining = Math.max(0, p.remainingLabels - labels.length);
        return {
          ...p,
          remainingLabels: remaining,
          status: remaining < 20 ? 'PAPER_LOW' : 'ONLINE'
        };
      }
      return p;
    });
    this.savePrinters();

    // Play subtle audio chime for laboratory feedback
    this.playPrintChime();

    // Emulate transmission latency with thermal printer
    await new Promise(resolve => setTimeout(resolve, 600));

    // Mark job completed
    this.jobHistory = this.jobHistory.map(j => (j.id === jobId ? { ...j, status: 'COMPLETED' } : j));
    this.saveHistory();
    this.notify();

    return {
      success: true,
      jobId,
      printer: targetPrinter,
      labelsCount: labels.length,
      labels
    };
  }

  /**
   * Plays a pleasant feedback tone when a thermal print job is dispatched
   */
  private playPrintChime() {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15); // A6 note

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      // Audio context might be restricted before user interaction
    }
  }
}

export const printerService = PrinterManagementService.getInstance();
