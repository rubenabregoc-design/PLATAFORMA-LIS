import React, { useState, useEffect } from 'react';
import { Analyzer, MiddlewareMessageLog, TestResult, Order } from '../types';
import {
  Cpu, Wifi, Radio, Send, Play, Terminal, CheckCircle2, AlertCircle,
  RefreshCw, FileText, ArrowRightLeft, ShieldCheck, Zap, Download,
  Activity, Search, Filter, Layers, Check, AlertTriangle, Copy,
  Eye, Code2, Sliders, Database, HardDrive, Network, Sparkles,
  CheckCircle, Clock, ChevronDown, ChevronRight
} from 'lucide-react';

interface MiddlewareSimulatorProps {
  analyzers: Analyzer[];
  logs: MiddlewareMessageLog[];
  orders: Order[];
  onNewResultSimulated: (newLog: MiddlewareMessageLog, newResult: TestResult) => void;
}

export const MiddlewareSimulator: React.FC<MiddlewareSimulatorProps> = ({
  analyzers,
  logs,
  orders,
  onNewResultSimulated
}) => {
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<string>(analyzers[0]?.id || 'an-sysmex-01');
  const [activeTab, setActiveTab] = useState<'live_sniffer' | 'scenario_lab' | 'auto_verification' | 'port_diagnostics'>('live_sniffer');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simScenario, setSimScenario] = useState<
    | 'critical_glucose'
    | 'normal_cbc'
    | 'cobas_troponin'
    | 'alinity_potassium'
    | 'mindray_retics'
    | 'stago_inr'
    | 'biorad_hba1c'
    | 'custom_injector'
  >('critical_glucose');

  // Custom Frame Injector state
  const [customProtocol, setCustomProtocol] = useState<'ASTM_E1381' | 'HL7_V2'>('ASTM_E1381');
  const [customPayload, setCustomPayload] = useState('1H|\\^&|||VITROS^4600|||||||P|1\n2P|1||8-812-4432||Pinzon^Gabriela\n3O|1|BC-882001||^^^GLU_101|R\n4R|1|^^^GLU|105|mg/dL|70-99|H||F\n5L|1|N');

  // Sniffer Filters & Inspection
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnalyzer, setFilterAnalyzer] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'ascii' | 'hex'>('ascii');
  const [inspectingLog, setInspectingLog] = useState<MiddlewareMessageLog | null>(null);

  // Buffer & Port Simulation
  const [bufferOfflineQueue, setBufferOfflineQueue] = useState<number>(0);
  const [isNetworkOffline, setIsNetworkOffline] = useState(false);
  const [deltaCheckActive, setDeltaCheckActive] = useState(true);
  const [hilInterceptorActive, setHilInterceptorActive] = useState(true);
  const [reflexEngineActive, setReflexEngineActive] = useState(true);

  // Live Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedAnalyzer = analyzers.find((a) => a.id === selectedAnalyzerId) || analyzers[0];

  const handleSimulateScenario = () => {
    setIsSimulating(true);

    setTimeout(() => {
      const timestamp = new Date().toISOString();
      const timeClean = timestamp.replace(/[-:T.Z]/g, '').slice(0, 14);

      let newLog: MiddlewareMessageLog;
      let newResult: TestResult;

      if (simScenario === 'critical_glucose') {
        const rawAstm = `1H|\\^&|||VITROS^4600|||||||P|1|${timeClean}\n2P|1||8-112-9901||Arosemena^Ricardo||19750820|M\n3O|1|BC-882004||^^^GLU_101|S||${timeClean}\n4R|1|^^^GLU|340|mg/dL|70-99|HH||F||||${timeClean}\n5C|1|I|HIL Absorbance Index: H=12 (OK), I=0.4, L=15|G\n6L|1|N`;

        newLog = {
          id: `msg-${Date.now()}`,
          tenantId: 'lab-san-jose',
          analyzerId: 'an-vitros-01',
          analyzerName: 'Ortho Vitros 4600',
          protocol: 'ASTM E1381 / E1394 (Host-Query)',
          direction: 'INBOUND',
          frameType: 'STX_RECORD',
          checksumValid: true,
          executionTimeMs: 14,
          sampleBarcode: 'BC-882004',
          patientName: 'Arosemena, Ricardo',
          matchedOrderCode: 'ORD-2026-00102',
          autoValidated: false,
          hilFlags: ['HIL_INDEX_OK (H: 12 mg/dL)'],
          rawPayload: rawAstm,
          hexDump: '02 31 48 7C 5C 5E 26 7C 7C 7C 56 49 54 52 4F 53 0D 03 44 32 0D 0A',
          parsedData: {
            sampleBarcode: 'BC-882004',
            orderMatched: 'ORD-2026-00102',
            testCode: 'GLU',
            value: 340,
            unit: 'mg/dL',
            flag: 'CRITICO_ALTO',
            clinicalAlert: '¡ALERTA DE PÁNICO BIOLÓGICO! Glucosa 340 mg/dL transmitida vía TCP 5100.'
          },
          status: 'PROCESADO',
          timestamp
        };

        newResult = {
          id: `res-${Date.now()}`,
          tenantId: 'lab-san-jose',
          orderId: 'ord-1002',
          testId: 'test-glucosa',
          parameterId: 'p-glu',
          parameterName: 'Glucosa Basal',
          unit: 'mg/dL',
          value: '340',
          numericValue: 340,
          flag: 'CRITICO_ALTO',
          refRangeText: '70 - 99',
          source: 'MIDDLEWARE_ASTM',
          analyzerName: 'Ortho Vitros 4600',
          status: 'INGRESADO',
          specimenType: 'Suero',
          interpretation: 'Valor crítico de pánico. Requiere confirmación por dilución y notificación médica inmediata.'
        };
      } else if (simScenario === 'cobas_troponin') {
        const rawHl7 = `MSH|^~\\&|COBAS_6000|ROCHE_LAB|LIS_CORE|ABREGOTECH|${timeClean}||ORU^R01|MSG-9921|P|2.5\nPID|1||8-765-4321||Castillo^Esteban||19800312|M\nOBR|1|ORD-2026-00103|BC-882005|TROPONIN_HS^Troponina I Ultrasensible|||${timeClean}\nOBX|1|NM|TROP_I_HS^Troponina I Ultrasensible||4520|pg/mL|< 14.0|HH|||F\nNTE|1|L|¡PÁNICO CARDÍACO! Sugestivo de Infarto Agudo de Miocardio (IAM).`;

        newLog = {
          id: `msg-${Date.now()}`,
          tenantId: 'lab-san-jose',
          analyzerId: 'an-cobas-01',
          analyzerName: 'Roche Cobas 6000',
          protocol: 'HL7 v2.5 (ORU^R01 MLLP)',
          direction: 'INBOUND',
          frameType: 'MLLP_ORU',
          checksumValid: true,
          executionTimeMs: 19,
          sampleBarcode: 'BC-882005',
          patientName: 'Castillo, Esteban',
          matchedOrderCode: 'ORD-2026-00103',
          autoValidated: false,
          rawPayload: rawHl7,
          hexDump: '0B 4D 53 48 7C 5E 7E 5C 26 7C 43 4F 42 41 53 5F 36 30 30 30 1C 0D',
          parsedData: {
            sampleBarcode: 'BC-882005',
            orderMatched: 'ORD-2026-00103',
            troponin: 4520,
            unit: 'pg/mL',
            flag: 'CRITICO_ALTO'
          },
          status: 'PROCESADO',
          timestamp
        };

        newResult = {
          id: `res-${Date.now()}`,
          tenantId: 'lab-san-jose',
          orderId: 'ord-1003',
          testId: 'test-troponina',
          parameterId: 'p-trop-i',
          parameterName: 'Troponina I Ultrasensible (hs-cTnI)',
          unit: 'pg/mL',
          value: '4520',
          numericValue: 4520,
          flag: 'CRITICO_ALTO',
          refRangeText: '< 14.0',
          source: 'MIDDLEWARE_HL7',
          analyzerName: 'Roche Cobas 6000 (e601 ECLIA)',
          status: 'INGRESADO',
          specimenType: 'Suero',
          interpretation: '¡ALERTA CRÍTICA STAT! Elevación severa compatible con síndrome coronario agudo.'
        };
      } else if (simScenario === 'alinity_potassium') {
        const rawHl7 = `MSH|^~\\&|ALINITY_CI|ABBOTT_LAB|LIS_CORE|ABREGOTECH|${timeClean}||ORU^R01|MSG-8841|P|2.5\nPID|1||8-812-4432||Pinzon^Gabriela||19920514|F\nOBR|1|ORD-2026-00101|BC-882001|ELECTROLITOS^Panel Electrolitos|||${timeClean}\nOBX|1|NM|K_ISE^Potasio Sérico||2.4|mEq/L|3.5-5.1|LL|||F\nOBX|2|NM|NA_ISE^Sodio Sérico||139|mEq/L|135-145|N|||F`;

        newLog = {
          id: `msg-${Date.now()}`,
          tenantId: 'lab-san-jose',
          analyzerId: 'an-alinity-01',
          analyzerName: 'Abbott Alinity ci-series',
          protocol: 'HL7 v2.5.1 MLLP',
          direction: 'INBOUND',
          frameType: 'MLLP_ORU',
          checksumValid: true,
          executionTimeMs: 16,
          sampleBarcode: 'BC-882001',
          patientName: 'Pinzón, Gabriela',
          matchedOrderCode: 'ORD-2026-00101',
          autoValidated: false,
          rawPayload: rawHl7,
          hexDump: '0B 4D 53 48 7C 5E 7E 5C 26 7C 41 4C 49 4E 49 54 59 1C 0D',
          parsedData: {
            sampleBarcode: 'BC-882001',
            orderMatched: 'ORD-2026-00101',
            k: 2.4,
            na: 139,
            flag: 'CRITICO_BAJO'
          },
          status: 'PROCESADO',
          timestamp
        };

        newResult = {
          id: `res-${Date.now()}`,
          tenantId: 'lab-san-jose',
          orderId: 'ord-1001',
          testId: 'test-electrolitos',
          parameterId: 'p-k',
          parameterName: 'Potasio Sérico (K+)',
          unit: 'mEq/L',
          value: '2.4',
          numericValue: 2.4,
          flag: 'CRITICO_BAJO',
          refRangeText: '3.5 - 5.1',
          source: 'MIDDLEWARE_HL7',
          analyzerName: 'Abbott Alinity ci',
          status: 'INGRESADO',
          specimenType: 'Suero',
          interpretation: '¡Peligro de arritmia cardíaca por hipopotasemia severa! Notificar a médico tratante.'
        };
      } else if (simScenario === 'stago_inr') {
        const rawAstm = `1H|\\^&|||STAGO^STA_COMPACT|||||||P|1|${timeClean}\n2P|1||8-450-9811||Valdes^Carlos||19680210|M\n3O|1|BC-882009||^^^COAG_PT|S||${timeClean}\n4R|1|^^^PT_SEC|38.5|s|11.0-14.5|HH||F\n5R|2|^^^INR|4.20|Ratio|0.8-1.2|HH||F\n6L|1|N`;

        newLog = {
          id: `msg-${Date.now()}`,
          tenantId: 'lab-san-jose',
          analyzerId: 'an-stago-01',
          analyzerName: 'Stago STA Compact Max',
          protocol: 'ASTM E1381 / E1394 (Coagulation)',
          direction: 'INBOUND',
          frameType: 'STX_RECORD',
          checksumValid: true,
          executionTimeMs: 12,
          sampleBarcode: 'BC-882009',
          patientName: 'Valdés, Carlos',
          matchedOrderCode: 'ORD-2026-00104',
          autoValidated: false,
          rawPayload: rawAstm,
          hexDump: '02 31 48 7C 5C 5E 26 7C 7C 7C 53 54 41 47 4F 0D 03 39 34 0D 0A',
          parsedData: {
            sampleBarcode: 'BC-882009',
            orderMatched: 'ORD-2026-00104',
            pt: 38.5,
            inr: 4.20,
            flag: 'CRITICO_ALTO'
          },
          status: 'PROCESADO',
          timestamp
        };

        newResult = {
          id: `res-${Date.now()}`,
          tenantId: 'lab-san-jose',
          orderId: 'ord-1004',
          testId: 'test-pt',
          parameterId: 'p-inr',
          parameterName: 'INR Internacional (Anticoagulación)',
          unit: 'Ratio',
          value: '4.20',
          numericValue: 4.20,
          flag: 'CRITICO_ALTO',
          refRangeText: '0.80 - 1.20',
          source: 'MIDDLEWARE_ASTM',
          analyzerName: 'Stago STA Compact Max',
          status: 'INGRESADO',
          specimenType: 'Plasma Citratado',
          interpretation: 'Riesgo hemorrágico elevado. Paciente en sobre-anticoagulación por cumarínicos.'
        };
      } else if (simScenario === 'biorad_hba1c') {
        const rawAstm = `1H|\\^&|||BIORAD^D10_HPLC|||||||P|1|${timeClean}\n2P|1||8-332-1144||Morales^Lucia||19850415|F\n3O|1|BC-882012||^^^HBA1C_PROGRAM|R||${timeClean}\n4R|1|^^^HBA1C_HPLC|11.2|%|4.0-5.6|HH||F\n5C|1|I|Peak Area A1c: 184.2 mAU*s (Area: 11.2%) Total Area: 1640 mAU*s|G\n6L|1|N`;

        newLog = {
          id: `msg-${Date.now()}`,
          tenantId: 'lab-san-jose',
          analyzerId: 'an-biorad-01',
          analyzerName: 'Bio-Rad D-10 HPLC',
          protocol: 'ASTM E1381 (HPLC Dialect)',
          direction: 'INBOUND',
          frameType: 'STX_RECORD',
          checksumValid: true,
          executionTimeMs: 15,
          sampleBarcode: 'BC-882012',
          patientName: 'Morales, Lucía',
          matchedOrderCode: 'ORD-2026-00105',
          autoValidated: false,
          rawPayload: rawAstm,
          hexDump: '02 31 48 7C 5C 5E 26 7C 7C 7C 42 49 4F 52 41 44 0D 03 36 41 0D 0A',
          parsedData: {
            sampleBarcode: 'BC-882012',
            orderMatched: 'ORD-2026-00105',
            hba1c: 11.2,
            unit: '%',
            flag: 'CRITICO_ALTO'
          },
          status: 'PROCESADO',
          timestamp
        };

        newResult = {
          id: `res-${Date.now()}`,
          tenantId: 'lab-san-jose',
          orderId: 'ord-1005',
          testId: 'test-hba1c',
          parameterId: 'p-hba1c',
          parameterName: 'Hemoglobina Glicosilada (HbA1c HPLC)',
          unit: '%',
          value: '11.2',
          numericValue: 11.2,
          flag: 'CRITICO_ALTO',
          refRangeText: '4.0 - 5.6',
          source: 'MIDDLEWARE_ASTM',
          analyzerName: 'Bio-Rad D-10 HPLC',
          status: 'INGRESADO',
          specimenType: 'Sangre Total EDTA',
          interpretation: 'Descontrol metabólico severo. Control glucémico promedio estimado > 275 mg/dL.'
        };
      } else {
        // Normal CBC
        const rawAstm = `1H|\\^&|||Sysmex^XN-1000|||||||P|1|${timeClean}\n2P|1||8-812-4432||Pinzon^Gabriela||19920514|F\n3O|1|BC-882001||^^^SYSMEX_CBC|R||${timeClean}\n4R|1|^^^WBC|7.40|10^3/uL|4.5-11.0|N||F||||${timeClean}\n5R|2|^^^HGB|14.0|g/dL|12.0-15.5|N||F||||${timeClean}\n6R|3|^^^PLT|245|10^3/uL|150-450|N||F||||${timeClean}\n7L|1|N`;

        newLog = {
          id: `msg-${Date.now()}`,
          tenantId: 'lab-san-jose',
          analyzerId: 'an-sysmex-01',
          analyzerName: 'Sysmex XN-1000',
          protocol: 'ASTM E1381 / E1394',
          direction: 'INBOUND',
          frameType: 'STX_RECORD',
          checksumValid: true,
          executionTimeMs: 10,
          sampleBarcode: 'BC-882001',
          patientName: 'Pinzón, Gabriela',
          matchedOrderCode: 'ORD-2026-00101',
          autoValidated: deltaCheckActive,
          rawPayload: rawAstm,
          hexDump: '02 31 48 7C 5C 5E 26 7C 7C 7C 53 79 73 6D 65 78 0D 03 37 45 0D 0A',
          parsedData: {
            sampleBarcode: 'BC-882001',
            orderMatched: 'ORD-2026-00101',
            wbc: 7.4,
            hgb: 14.0,
            plt: 245,
            status: 'Auto-validado por reglas de normalidad Westgard'
          },
          status: deltaCheckActive ? 'AUTO_VALIDADO' : 'PROCESADO',
          timestamp
        };

        newResult = {
          id: `res-${Date.now()}`,
          tenantId: 'lab-san-jose',
          orderId: 'ord-1001',
          testId: 'test-hemograma',
          parameterId: 'p-wbc',
          parameterName: 'Leucocitos (WBC)',
          unit: 'x10^3/µL',
          value: '7.40',
          numericValue: 7.40,
          flag: 'NORMAL',
          refRangeText: '4.50 - 11.00',
          source: 'MIDDLEWARE_ASTM',
          analyzerName: 'Sysmex XN-1000',
          status: deltaCheckActive ? 'VALIDADO_TEC' : 'INGRESADO',
          specimenType: 'Sangre Total EDTA',
          interpretation: 'Parámetros hematológicos normales auto-verificados por LIS-Core.'
        };
      }

      onNewResultSimulated(newLog, newResult);
      setIsSimulating(false);
      triggerToast(`📥 Trama recibida y procesada desde ${newLog.analyzerName}. Muestra ${newLog.sampleBarcode} sincronizada.`);
    }, 550);
  };

  const handleFlushBuffer = () => {
    setBufferOfflineQueue(0);
    triggerToast('✅ Cola de búfer FIFO sincronizada con PostgreSQL.');
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      log.analyzerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.rawPayload.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.sampleBarcode && log.sampleBarcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.patientName && log.patientName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAnalyzer = filterAnalyzer === 'ALL' || log.analyzerId === filterAnalyzer;
    const matchesStatus = filterStatus === 'ALL' || log.status === filterStatus;

    return matchesSearch && matchesAnalyzer && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-teal-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-slate-950 text-white p-6 rounded-3xl shadow-2xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[11px] font-mono px-3 py-1 rounded-full uppercase tracking-wider font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-teal-400" />
            <span>AbregoTech LIS-Bridge • Socket Hub ASTM E1381 & HL7 v2.5 MLLP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center space-x-3">
            <span>Middleware de Integración de Analizadores</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Motor de comunicaciones clínicas de alto rendimiento: escucha sockets TCP/IP y puertos serie RS-232, decodifica dialectos propietarios, aplica auto-verificación y sincroniza en tiempo real con el LIS.
          </p>
        </div>

        {/* Global Telemetry Card */}
        <div className="relative z-10 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl text-xs space-y-2 min-w-[280px] shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-bold text-[11px] uppercase tracking-wider text-teal-400">Estado de Conectividad:</span>
            <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>7 Analizadores Online</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[9px]">PROCESADOS HOY</div>
              <div className="font-black text-white text-sm">1,057 Tubos</div>
            </div>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[9px]">LATENCIA SOCKET</div>
              <div className="font-black text-teal-400 text-sm">~6.8 ms</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Búfer FIFO: <strong className="text-emerald-400">{bufferOfflineQueue} pendientes</strong></span>
            <button
              onClick={handleFlushBuffer}
              className="text-[10px] text-teal-400 hover:text-teal-300 font-bold cursor-pointer underline"
            >
              Forzar Flush
            </button>
          </div>
        </div>
      </div>

      {/* Fleet Overview Cards (Scrollable horizontal or grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {analyzers.slice(0, 4).map((an) => (
          <div
            key={an.id}
            onClick={() => setSelectedAnalyzerId(an.id)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
              selectedAnalyzerId === an.id
                ? 'bg-slate-900 border-teal-500 text-white ring-2 ring-teal-500/20 shadow-xl'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-white truncate max-w-[150px]">{an.name}</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{an.status}</span>
              </span>
            </div>

            <div className="text-[11px] space-y-1 text-slate-400 font-mono">
              <div className="flex items-center justify-between">
                <span>Protocolo:</span>
                <strong className="text-teal-300">{an.protocol}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Puerto:</span>
                <span className="text-slate-200">{an.connectionType === 'TCP_IP' ? `${an.ipAddress}:${an.port}` : an.comPort}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                <span>Hoy: <strong className="text-white">{an.totalProcessedToday || 0}</strong></span>
                <span>Latencia: <strong className="text-emerald-400">{an.pingLatencyMs || 5}ms</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Subtabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
        <button
          onClick={() => setActiveTab('live_sniffer')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === 'live_sniffer'
              ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Sniffer de Tráfico Socket & Hex Viewer</span>
        </button>

        <button
          onClick={() => setActiveTab('scenario_lab')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === 'scenario_lab'
              ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Laboratorio de Emisión de Escenarios Clínicos</span>
        </button>

        <button
          onClick={() => setActiveTab('auto_verification')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === 'auto_verification'
              ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Reglas de Auto-Verificación, Delta & HIL</span>
        </button>

        <button
          onClick={() => setActiveTab('port_diagnostics')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === 'port_diagnostics'
              ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Diagnóstico de Puertos RS-232 / TCP MLLP</span>
        </button>
      </div>

      {/* TAB 1: LIVE PROTOCOL TRAFFIC SNIFFER */}
      {activeTab === 'live_sniffer' && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-6 text-white">
          {/* Header Controls & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs font-mono text-teal-400">
                <Terminal className="w-4 h-4 animate-pulse" />
                <span>BIDIRECTIONAL TRAFFIC MONITOR (ASTM E1381 & HL7 v2.5 MLLP)</span>
              </div>
              <h3 className="font-black text-base text-white">Registro de Tramas en Tiempo Real</h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrar por código de barra, paciente o payload..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 w-64 font-medium"
                />
              </div>

              <select
                value={filterAnalyzer}
                onChange={(e) => setFilterAnalyzer(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">Todos los Analizadores</option>
                {analyzers.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>

              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setViewMode('ascii')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${viewMode === 'ascii' ? 'bg-teal-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                >
                  ASCII Raw
                </button>
                <button
                  onClick={() => setViewMode('hex')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${viewMode === 'hex' ? 'bg-teal-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                >
                  HEX Dump
                </button>
              </div>
            </div>
          </div>

          {/* Traffic Stream Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Hora • Latencia</th>
                  <th className="p-3">Analizador</th>
                  <th className="p-3">Protocolo</th>
                  <th className="p-3">Muestra • Paciente</th>
                  <th className="p-3">Trama / Contenido del Paquete</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-600 font-sans text-xs">
                      No hay tramas registradas que coincidan con los filtros. Use el "Laboratorio de Emisión" para enviar datos de prueba.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">
                        <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                        <div className="text-[10px] text-teal-400 font-bold">{log.executionTimeMs || 12} ms</div>
                      </td>
                      <td className="p-3 font-bold text-white whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>{log.analyzerName}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-300 text-[11px] whitespace-nowrap">
                        <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-teal-300">
                          {log.protocol}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-teal-300 font-mono">{log.sampleBarcode || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{log.patientName || 'Anónimo'}</div>
                      </td>
                      <td className="p-3 max-w-md truncate text-slate-300 font-mono text-[11px]">
                        {viewMode === 'ascii' ? (
                          <span className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800 block truncate">
                            {log.rawPayload.split('\n')[0]}...
                          </span>
                        ) : (
                          <span className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800 block truncate text-emerald-400 text-[10px]">
                            {log.hexDump || '02 31 48 7C 5C 5E 26 7C 7C 7C 0D 03...'}
                          </span>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            log.status === 'AUTO_VALIDADO'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : log.status === 'PROCESADO'
                              ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setInspectingLog(log)}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-teal-300 rounded-lg text-[11px] font-bold border border-slate-800 transition cursor-pointer"
                        >
                          Inspeccionar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SCENARIO LAB & INJECTOR */}
      {activeTab === 'scenario_lab' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-white">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="space-y-1 border-b border-slate-800 pb-4">
              <div className="text-teal-400 font-mono text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1.5">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Clinical Packet Generator</span>
              </div>
              <h3 className="font-black text-base text-white">Emisión de Escenarios Clínicos Reales</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Seleccione un caso clínico para transmitir una trama real de analizador al middleware y validar la auto-ingesta en el LIS.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { id: 'critical_glucose', title: 'Ortho Vitros 4600 — Glucosa 340 mg/dL (¡Pánico!)', desc: 'ASTM E1381 Host-Query con índice HIL y alerta de hiperglucemia severa.', badge: 'QUÍMICA CRÍTICA', color: 'rose' },
                { id: 'cobas_troponin', title: 'Roche Cobas 6000 — Troponina I hs 4,520 pg/mL', desc: 'HL7 v2.5 ORU^R01 MLLP. Alerta crítica STAT de Infarto Agudo (IAM).', badge: 'ECLIA CARDIACO', color: 'rose' },
                { id: 'normal_cbc', title: 'Sysmex XN-1000 — Hemograma Completo Normal', desc: 'ASTM E1381 5-Diff con auto-validación inmediata por Westgard.', badge: 'HEMATOLOGÍA', color: 'teal' },
                { id: 'alinity_potassium', title: 'Abbott Alinity ci — Potasio 2.4 mEq/L (Hipopotasemia)', desc: 'HL7 v2.5 ORU^R01 MLLP. Riesgo arritmogénico de emergencia.', badge: 'ELECTROLITOS', color: 'amber' },
                { id: 'stago_inr', title: 'Stago STA Compact — INR 4.20 Quirúrgico', desc: 'ASTM E1394 TP/INR con alerta de sobre-anticoagulación.', badge: 'COAGULACIÓN', color: 'amber' },
                { id: 'biorad_hba1c', title: 'Bio-Rad D-10 HPLC — HbA1c 11.2%', desc: 'ASTM Dialect HPLC con reporte de área de pico cromatográfico.', badge: 'HPLC DIABETES', color: 'purple' },
                { id: 'custom_injector', title: 'Inyector Personalizado de Tramas (Custom Payload)', desc: 'Escriba o pegue tramas ASTM / HL7 manuales para pruebas de ingeniería.', badge: 'CUSTOM INJECTOR', color: 'blue' }
              ].map((sc) => {
                const isSelected = simScenario === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => setSimScenario(sc.id as any)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-1 ${
                      isSelected
                        ? 'bg-teal-500/10 border-teal-500/60 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{sc.title}</span>
                      <span className="text-[9px] font-mono font-bold bg-slate-900 px-2 py-0.5 rounded text-teal-300 border border-slate-800">
                        {sc.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{sc.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={handleSimulateScenario}
                disabled={isSimulating}
                className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-2xl text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transmitiendo Paquete Socket...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Emitir Trama a Middleware LIS</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel: Frame Code Preview */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
            <div className="space-y-1 border-b border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-white">Vista Previa de la Trama a Emitir</h3>
                <p className="text-slate-400 text-xs">Payload serial / TCP exacto que viajará por la red hospitalaria.</p>
              </div>
              <span className="text-[10px] font-mono bg-slate-950 px-3 py-1 rounded-xl text-teal-400 border border-slate-800">
                Socket: 0.0.0.0:5100 (Listening)
              </span>
            </div>

            {simScenario === 'custom_injector' ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-xs">
                  <label className="text-slate-400 font-bold">Protocolo:</label>
                  <select
                    value={customProtocol}
                    onChange={(e) => setCustomProtocol(e.target.value as any)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1 text-white font-bold"
                  >
                    <option value="ASTM_E1381">ASTM E1381 / E1394</option>
                    <option value="HL7_V2">HL7 v2.5 MLLP</option>
                  </select>
                </div>
                <textarea
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 font-mono text-xs text-teal-300 focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-emerald-400 h-80 overflow-y-auto space-y-2">
                <div className="text-[10px] text-slate-500 font-sans border-b border-slate-900 pb-1">
                  // Muestra decodificada por el parser ASTM/HL7 antes de su validación médica
                </div>
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {simScenario === 'critical_glucose' && `1H|\\^&|||VITROS^4600|||||||P|1|20260818203000\n2P|1||8-112-9901||Arosemena^Ricardo||19750820|M\n3O|1|BC-882004||^^^GLU_101|S||20260818202800\n4R|1|^^^GLU|340|mg/dL|70-99|HH||F||||20260818203000\n5C|1|I|HIL Absorbance Index: H=12 (OK), I=0.4, L=15|G\n6L|1|N`}
                  {simScenario === 'cobas_troponin' && `MSH|^~\\&|COBAS_6000|ROCHE_LAB|LIS_CORE|ABREGOTECH|20260818203500||ORU^R01|MSG-9921|P|2.5\nPID|1||8-765-4321||Castillo^Esteban||19800312|M\nOBR|1|ORD-2026-00103|BC-882005|TROPONIN_HS^Troponina I Ultrasensible|||20260818203300\nOBX|1|NM|TROP_I_HS^Troponina I Ultrasensible||4520|pg/mL|< 14.0|HH|||F\nNTE|1|L|¡PÁNICO CARDÍACO! Sugestivo de Infarto Agudo de Miocardio (IAM).`}
                  {simScenario === 'normal_cbc' && `1H|\\^&|||Sysmex^XN-1000|||||||P|1|20260818203200\n2P|1||8-812-4432||Pinzon^Gabriela||19920514|F\n3O|1|BC-882001||^^^SYSMEX_CBC|R||20260818203100\n4R|1|^^^WBC|7.40|10^3/uL|4.5-11.0|N||F||||20260818203200\n5R|2|^^^HGB|14.0|g/dL|12.0-15.5|N||F||||20260818203200\n6R|3|^^^PLT|245|10^3/uL|150-450|N||F||||20260818203200\n7L|1|N`}
                  {simScenario === 'alinity_potassium' && `MSH|^~\\&|ALINITY_CI|ABBOTT_LAB|LIS_CORE|ABREGOTECH|20260818203800||ORU^R01|MSG-8841|P|2.5\nPID|1||8-812-4432||Pinzon^Gabriela||19920514|F\nOBR|1|ORD-2026-00101|BC-882001|ELECTROLITOS^Panel Electrolitos|||20260818203600\nOBX|1|NM|K_ISE^Potasio Sérico||2.4|mEq/L|3.5-5.1|LL|||F\nOBX|2|NM|NA_ISE^Sodio Sérico||139|mEq/L|135-145|N|||F`}
                  {simScenario === 'stago_inr' && `1H|\\^&|||STAGO^STA_COMPACT|||||||P|1|20260818204000\n2P|1||8-450-9811||Valdes^Carlos||19680210|M\n3O|1|BC-882009||^^^COAG_PT|S||20260818203800\n4R|1|^^^PT_SEC|38.5|s|11.0-14.5|HH||F\n5R|2|^^^INR|4.20|Ratio|0.8-1.2|HH||F\n6L|1|N`}
                  {simScenario === 'biorad_hba1c' && `1H|\\^&|||BIORAD^D10_HPLC|||||||P|1|20260818204000\n2P|1||8-332-1144||Morales^Lucia||19850415|F\n3O|1|BC-882012||^^^HBA1C_PROGRAM|R||20260818202500\n4R|1|^^^HBA1C_HPLC|11.2|%|4.0-5.6|HH||F\n5C|1|I|Peak Area A1c: 184.2 mAU*s (Area: 11.2%) Total Area: 1640 mAU*s|G\n6L|1|N`}
                </pre>
              </div>
            )}

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-400 flex items-center justify-between font-mono">
              <span>Parser SHA-256 Signature: <strong className="text-teal-400">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</strong></span>
              <span className="text-emerald-400">ISO 15189 Validated</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUTO-VERIFICATION & SAFETY RULES */}
      {activeTab === 'auto_verification' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-6">
          <div className="space-y-1 border-b border-slate-800 pb-4">
            <div className="text-teal-400 font-mono text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Intelligent Clinical Safety Engine</span>
            </div>
            <h3 className="font-black text-lg text-white">Motores de Auto-Verificación, Delta Check & Filtro HIL</h3>
            <p className="text-slate-400 text-xs max-w-3xl leading-relaxed">
              Reglas lógicas pre-analíticas y analíticas que evalúan los resultados antes de su validación técnica para prevenir errores de transcripción o interferencias de muestra.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Rule 1: Delta Check */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">Delta Check Histórico</span>
                <input
                  type="checkbox"
                  checked={deltaCheckActive}
                  onChange={(e) => setDeltaCheckActive(e.target.checked)}
                  className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compara automáticamente el resultado con la última prueba histórica del paciente. Si la variación excede el umbral (ej. Creatinina &gt; 50% en 48h), bloquea la auto-validación y exige revisión manual.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-xl text-[11px] font-mono text-teal-300">
                Límite Delta: ±30% | Ventana: 72 horas
              </div>
            </div>

            {/* Rule 2: HIL Interceptor */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">Intercepción de Índices HIL</span>
                <input
                  type="checkbox"
                  checked={hilInterceptorActive}
                  onChange={(e) => setHilInterceptorActive(e.target.checked)}
                  className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evalúa los índices espectrofotométricos de Hemólisis (H), Ictericia (I) y Lipemia (L) transmitidos por analizadores ópticos como Vitros, Cobas y Alinity.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-xl text-[11px] font-mono text-amber-300">
                Hemólisis &gt; 150 mg/dL ➔ Bloqueo K+/LDH
              </div>
            </div>

            {/* Rule 3: Reflex Testing */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">Pruebas Reflejo (Reflex Testing)</span>
                <input
                  type="checkbox"
                  checked={reflexEngineActive}
                  onChange={(e) => setReflexEngineActive(e.target.checked)}
                  className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gatilla automáticamente exámenes complementarios sin intervención médica: si TSH &gt; 10.0 µIU/mL ➔ ordena T4 Libre; si Plaquetas &lt; 50k ➔ solicita frotis periférico.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-xl text-[11px] font-mono text-emerald-300">
                TSH &gt; 10 µIU/mL ➔ Auto-Order T4L
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PORT DIAGNOSTICS & HARDWARE CONFIG */}
      {activeTab === 'port_diagnostics' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-6">
          <div className="space-y-1 border-b border-slate-800 pb-4">
            <div className="text-teal-400 font-mono text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Biomedical Hardware & Connectivity</span>
            </div>
            <h3 className="font-black text-lg text-white">Diagnóstico de Puertos y Enrutamiento Físico</h3>
            <p className="text-slate-400 text-xs max-w-3xl leading-relaxed">
              Configuración de capas de transporte: puertos serie RS-232/USB con control de flujo por hardware y servidores de sockets TCP/IP con encapsulación MLLP estándar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TCP/IP MLLP Server */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-teal-400 flex items-center space-x-2">
                  <Network className="w-4 h-4" />
                  <span>Servidor TCP/IP MLLP (HL7 & ASTM TCP)</span>
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">BIND OK</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">IP de Enlace:</label>
                  <input type="text" value="0.0.0.0 (Todas las Interfaces)" disabled className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-300 font-mono" />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Puerto de Escucha:</label>
                  <input type="text" value="5100 / 5200 / 2575" disabled className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-teal-300 font-mono font-bold" />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Carácter Start Block:</label>
                  <input type="text" value="0x0B (<VT>)" disabled className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-300 font-mono" />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Carácter End Block:</label>
                  <input type="text" value="0x1C 0x0D (<FS><CR>)" disabled className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-300 font-mono" />
                </div>
              </div>
            </div>

            {/* RS-232 Serial Server */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-teal-400 flex items-center space-x-2">
                  <Radio className="w-4 h-4" />
                  <span>Controlador de Puertos Serie RS-232</span>
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">DRIVER ACTIVO</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Puertos COM:</label>
                  <input type="text" value="COM1, COM3, COM4 (/dev/ttyUSB*)" disabled className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-300 font-mono" />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Baud Rate Primario:</label>
                  <input type="text" value="9600 / 19200 bps" disabled className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-teal-300 font-mono font-bold" />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Paridad & Bits:</label>
                  <input type="text" value="8 Bits, None Parity, 1 Stop" disabled className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-300 font-mono" />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Control de Flujo:</label>
                  <input type="text" value="Hardware (RTS/CTS DTR)" disabled className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-300 font-mono" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTOR MODAL */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 text-white animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-teal-400">
                <FileText className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Inspección de Paquete #{inspectingLog.id}</h3>
              </div>
              <button
                onClick={() => setInspectingLog(null)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">ANALIZADOR</span>
                <span className="font-bold text-white">{inspectingLog.analyzerName}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">PROTOCOLO</span>
                <span className="font-bold text-teal-300">{inspectingLog.protocol}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">CÓDIGO DE BARRA</span>
                <span className="font-bold text-emerald-400">{inspectingLog.sampleBarcode || 'N/A'}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">CHECKSUM</span>
                <span className="font-bold text-emerald-400">{inspectingLog.checksumValid ? 'VÁLIDO (MOD 256)' : 'FALLIDO'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 block">Payload ASCII Completo:</label>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-teal-300 max-h-48 overflow-y-auto">
                <pre className="whitespace-pre-wrap leading-relaxed">{inspectingLog.rawPayload}</pre>
              </div>
            </div>

            {inspectingLog.hexDump && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 block">Volcado Hexadecimal (Hex Dump):</label>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-emerald-400 max-h-24 overflow-y-auto">
                  {inspectingLog.hexDump}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setInspectingLog(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
