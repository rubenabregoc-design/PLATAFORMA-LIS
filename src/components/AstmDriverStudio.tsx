import React, { useState } from 'react';
import { Analyzer, TestCatalogItem, TestResult, MiddlewareMessageLog, Order, AutoResponseProfile } from '../types';
import {
  Cpu, Terminal, Play, RefreshCw, CheckCircle2, AlertTriangle,
  ArrowRightLeft, Code2, Database, Sliders, ShieldCheck, Zap,
  Download, Upload, Copy, Check, Info, Layers, Radio, Network,
  FileCode, CheckCircle, Clock, Search, ChevronRight, BarChart2,
  HardDrive, Activity, Settings2, Plus, Trash2, Edit3, Sparkles
} from 'lucide-react';

interface AstmDriverStudioProps {
  analyzers: Analyzer[];
  testCatalog: TestCatalogItem[];
  orders?: Order[];
  onTestSimulated?: (rawFrame: string, parsedResults: any) => void;
}

const DEFAULT_PROFILES: AutoResponseProfile[] = [
  {
    id: 'prof-sysmex',
    name: 'Sysmex XN-Series Handshake Ultra-Fast (0ms)',
    targetModel: 'Sysmex XN-1000',
    protocol: 'ASTM_E1381',
    enqResponseSignal: 'ACK_06',
    ackDelayMs: 0,
    frameAckSignal: 'ACK_06',
    checksumErrorSignal: 'NAK_15',
    maxRetriesOnNak: 6,
    lineContentionAction: 'ANALYZER_PRIORITY',
    hostQueryNoOrderAction: 'EMPTY_TERMINATOR',
    eotHandshakeRequired: true,
    autoSendWorklistOnEnq: false,
    active: true,
    description: 'Respuesta inmediata (<1ms) con ACK (0x06) a señal <ENQ>. Reintento estricto de hasta 6 veces antes de abortar con <EOT>.'
  },
  {
    id: 'prof-vitros',
    name: 'Ortho Vitros 4600 / 5600 Host-Query Paced (20ms)',
    targetModel: 'Ortho Vitros 4600',
    protocol: 'ASTM_E1381',
    enqResponseSignal: 'DELAYED_ACK',
    ackDelayMs: 20,
    frameAckSignal: 'ACK_06',
    checksumErrorSignal: 'NAK_15',
    maxRetriesOnNak: 3,
    lineContentionAction: 'ANALYZER_PRIORITY',
    hostQueryNoOrderAction: 'QUERY_REJECT_X',
    eotHandshakeRequired: true,
    autoSendWorklistOnEnq: true,
    active: true,
    description: 'Pacing controlado de 20ms para permitir al firmware de Vitros conmutar buffer TCP. Emite código de rechazo X si no hay orden pendiente.'
  },
  {
    id: 'prof-cobas',
    name: 'Roche Cobas 6000 DataLink MLLP Profile',
    targetModel: 'Roche Cobas 6000 (c501/e601)',
    protocol: 'HL7_V2',
    enqResponseSignal: 'ACK_06',
    ackDelayMs: 10,
    frameAckSignal: 'ACK_06',
    checksumErrorSignal: 'NAK_15',
    maxRetriesOnNak: 3,
    lineContentionAction: 'HOST_PRIORITY',
    hostQueryNoOrderAction: 'EMPTY_TERMINATOR',
    eotHandshakeRequired: true,
    mllpAckFormat: 'MSA_AA',
    autoSendWorklistOnEnq: true,
    active: true,
    description: 'Confirmación HL7 MSA|AA con encapsulación MLLP (0x0B/0x1C). Envío bidireccional de lista de trabajo bajo demanda.'
  },
  {
    id: 'prof-alinity',
    name: 'Abbott Alinity ci Bidirectional MLLP Host-Query',
    targetModel: 'Abbott Alinity ci-series',
    protocol: 'HL7_V2',
    enqResponseSignal: 'ACK_06',
    ackDelayMs: 15,
    frameAckSignal: 'ACK_06',
    checksumErrorSignal: 'NAK_15',
    maxRetriesOnNak: 3,
    lineContentionAction: 'HOST_PRIORITY',
    hostQueryNoOrderAction: 'EMPTY_TERMINATOR',
    eotHandshakeRequired: true,
    mllpAckFormat: 'MSA_AA',
    autoSendWorklistOnEnq: true,
    active: true,
    description: 'Protocolo HL7 v2.5.1 de alto rendimiento con eco estricto de Message Control ID y respuesta <ACK> MLLP sincronizada.'
  },
  {
    id: 'prof-stago',
    name: 'Stago STA Compact Hardware Flow Safe (50ms)',
    targetModel: 'Stago STA Compact Max',
    protocol: 'ASTM_E1381',
    enqResponseSignal: 'DELAYED_ACK',
    ackDelayMs: 50,
    frameAckSignal: 'ACK_06',
    checksumErrorSignal: 'NAK_15',
    maxRetriesOnNak: 6,
    lineContentionAction: 'ANALYZER_PRIORITY',
    hostQueryNoOrderAction: 'EMPTY_TERMINATOR',
    eotHandshakeRequired: true,
    autoSendWorklistOnEnq: false,
    active: true,
    description: 'Retardo de 50ms para evitar sobrecarga en UART de baja velocidad RS-232 COM con control de flujo por hardware RTS/CTS.'
  },
  {
    id: 'prof-biorad',
    name: 'Bio-Rad D-10 HPLC Chromatogram Receiver',
    targetModel: 'Bio-Rad D-10 HPLC',
    protocol: 'ASTM_E1381',
    enqResponseSignal: 'ACK_06',
    ackDelayMs: 0,
    frameAckSignal: 'ACK_06',
    checksumErrorSignal: 'NAK_15',
    maxRetriesOnNak: 3,
    lineContentionAction: 'ANALYZER_PRIORITY',
    hostQueryNoOrderAction: 'EMPTY_TERMINATOR',
    eotHandshakeRequired: true,
    autoSendWorklistOnEnq: false,
    active: true,
    description: 'Aceptación rápida de tramas ASTM con preservación de comentarios C de área de pico cromatográfico.'
  }
];

export const AstmDriverStudio: React.FC<AstmDriverStudioProps> = ({
  analyzers,
  testCatalog,
  orders = []
}) => {
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<string>(analyzers[0]?.id || 'an-sysmex-01');
  const [activeSubTab, setActiveSubTab] = useState<
    'auto_response_profiles' | 'host_query' | 'batch_worklist' | 'state_machine' | 'mapping' | 'checksum_builder'
  >('auto_response_profiles');

  // Auto-Response Profiles State
  const [profiles, setProfiles] = useState<AutoResponseProfile[]>(DEFAULT_PROFILES);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(DEFAULT_PROFILES[0].id);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingProfileData, setEditingProfileData] = useState<AutoResponseProfile>(DEFAULT_PROFILES[0]);

  // Profile Test Simulator State
  const [testSimIncomingSignal, setTestSimIncomingSignal] = useState<'ENQ' | 'VALID_FRAME' | 'BAD_CHECKSUM_FRAME' | 'HOST_QUERY_NO_ORDER'>('ENQ');
  const [isTestingProfile, setIsTestingProfile] = useState(false);
  const [testProfileLogs, setTestProfileLogs] = useState<Array<{ time: string; direction: string; signal: string; hex: string; detail: string }>>([]);

  // Mapping Matrix state
  const [mappings, setMappings] = useState([
    { id: 'm1', analyzerId: 'an-sysmex-01', analyzerCode: 'WBC', lisParameter: 'Hemograma — Leucocitos (WBC)', unit: '10^3/µL', multiplier: 1.0, decimals: 2, status: 'ACTIVO', category: 'HEMATOLOGIA' },
    { id: 'm2', analyzerId: 'an-sysmex-01', analyzerCode: 'RBC', lisParameter: 'Hemograma — Eritrocitos (RBC)', unit: '10^6/µL', multiplier: 1.0, decimals: 2, status: 'ACTIVO', category: 'HEMATOLOGIA' },
    { id: 'm3', analyzerId: 'an-sysmex-01', analyzerCode: 'HGB', lisParameter: 'Hemograma — Hemoglobina', unit: 'g/dL', multiplier: 1.0, decimals: 1, status: 'ACTIVO', category: 'HEMATOLOGIA' },
    { id: 'm4', analyzerId: 'an-sysmex-01', analyzerCode: 'HCT', lisParameter: 'Hemograma — Hematocrito', unit: '%', multiplier: 1.0, decimals: 1, status: 'ACTIVO', category: 'HEMATOLOGIA' },
    { id: 'm5', analyzerId: 'an-sysmex-01', analyzerCode: 'PLT', lisParameter: 'Hemograma — Plaquetas', unit: '10^3/µL', multiplier: 1.0, decimals: 0, status: 'ACTIVO', category: 'HEMATOLOGIA' },
    { id: 'm6', analyzerId: 'an-vitros-01', analyzerCode: 'GLU_V', lisParameter: 'Química — Glucosa Basal', unit: 'mg/dL', multiplier: 1.0, decimals: 0, status: 'ACTIVO', category: 'QUIMICA' },
    { id: 'm7', analyzerId: 'an-vitros-01', analyzerCode: 'CREA_V', lisParameter: 'Química — Creatinina Sérica', unit: 'mg/dL', multiplier: 1.0, decimals: 2, status: 'ACTIVO', category: 'QUIMICA' },
    { id: 'm8', analyzerId: 'an-vitros-01', analyzerCode: 'BUN_V', lisParameter: 'Química — Nitrógeno de Urea (BUN)', unit: 'mg/dL', multiplier: 1.0, decimals: 1, status: 'ACTIVO', category: 'QUIMICA' },
    { id: 'm9', analyzerId: 'an-stago-01', analyzerCode: 'PT_SEC', lisParameter: 'Coagulación — Tiempo de Protrombina (TP)', unit: 'Segundos', multiplier: 1.0, decimals: 1, status: 'ACTIVO', category: 'COAGULACION' },
    { id: 'm10', analyzerId: 'an-stago-01', analyzerCode: 'INR_CALC', lisParameter: 'Coagulación — INR Internacional', unit: 'Ratio', multiplier: 1.0, decimals: 2, status: 'ACTIVO', category: 'COAGULACION' },
    { id: 'm11', analyzerId: 'an-biorad-01', analyzerCode: 'HBA1C_HPLC', lisParameter: 'Especiales — Hemoglobina Glicosilada (HbA1c)', unit: '%', multiplier: 1.0, decimals: 1, status: 'ACTIVO', category: 'ESPECIALES' }
  ]);

  const [mappingSearch, setMappingSearch] = useState('');
  const [newAnalyzerCode, setNewAnalyzerCode] = useState('');
  const [newLisParam, setNewLisParam] = useState('');
  const [newUnit, setNewUnit] = useState('mg/dL');
  const [newMultiplier, setNewMultiplier] = useState(1.0);

  // Host Query Simulator State
  const [queryBarcode, setQueryBarcode] = useState('BC-882001');
  const [queryPriority, setQueryPriority] = useState<'RUTINA' | 'STAT'>('STAT');
  const [autoDilution, setAutoDilution] = useState(false);
  const [rackNumber, setRackNumber] = useState('RACK-04');
  const [cupPosition, setCupPosition] = useState('02');
  const [hostQueryLogs, setHostQueryLogs] = useState<Array<{ timestamp: string; sender: 'ANALYZER' | 'LIS_HOST'; raw: string; hex: string; description: string; recordType?: string }>>([]);
  const [isSimulatingHostQuery, setIsSimulatingHostQuery] = useState(false);
  const [parsedHostQueryData, setParsedHostQueryData] = useState<any | null>(null);

  // Batch Worklist State
  const [selectedBatchOrders, setSelectedBatchOrders] = useState<string[]>(['ord-1001', 'ord-1002']);
  const [batchGeneratedAstm, setBatchGeneratedAstm] = useState<string>('');
  const [batchTransmitted, setBatchTransmitted] = useState(false);

  // Checksum & Frame Builder state
  const [testPayload, setTestPayload] = useState('1H|\\^&|||Sysmex^XN-1000|||||||P|1|20260818204000');
  const [selectedPreset, setSelectedPreset] = useState<'sysmex' | 'vitros' | 'stago' | 'biorad' | 'custom'>('sysmex');
  const [frameCopied, setFrameCopied] = useState(false);

  const selectedAnalyzer = analyzers.find((a) => a.id === selectedAnalyzerId) || analyzers[0];
  const activeProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0];

  // ASTM Modulo 256 Checksum Calculator
  const calculateAstmChecksum = (str: string): string => {
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
      sum += str.charCodeAt(i);
    }
    return (sum % 256).toString(16).toUpperCase().padStart(2, '0');
  };

  const stringToHex = (str: string): string => {
    return Array.from(str)
      .map((c) => c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'))
      .join(' ');
  };

  const handleOpenEditProfile = (profile: AutoResponseProfile) => {
    setEditingProfileData({ ...profile });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    setProfiles(profiles.map(p => p.id === editingProfileData.id ? editingProfileData : p));
    setIsEditingProfile(false);
  };

  const handleCreateProfile = () => {
    const newProf: AutoResponseProfile = {
      id: `prof-${Date.now()}`,
      name: `Nuevo Perfil ${selectedAnalyzer.name}`,
      targetModel: selectedAnalyzer.name,
      protocol: selectedAnalyzer.protocol,
      enqResponseSignal: 'ACK_06',
      ackDelayMs: 0,
      frameAckSignal: 'ACK_06',
      checksumErrorSignal: 'NAK_15',
      maxRetriesOnNak: 3,
      lineContentionAction: 'ANALYZER_PRIORITY',
      hostQueryNoOrderAction: 'EMPTY_TERMINATOR',
      eotHandshakeRequired: true,
      autoSendWorklistOnEnq: false,
      active: true,
      description: 'Perfil personalizado creado por el usuario para este modelo.'
    };
    setProfiles([...profiles, newProf]);
    setSelectedProfileId(newProf.id);
    setEditingProfileData(newProf);
    setIsEditingProfile(true);
  };

  const handleDeleteProfile = (id: string) => {
    if (profiles.length <= 1) {
      alert('Debe existir al menos un perfil de respuesta configurado.');
      return;
    }
    setProfiles(profiles.filter(p => p.id !== id));
    if (selectedProfileId === id) {
      setSelectedProfileId(profiles[0].id);
    }
  };

  const handleTestAutoResponse = () => {
    setIsTestingProfile(true);
    setTestProfileLogs([]);

    const startTime = Date.now();
    const formattedTime = () => new Date().toLocaleTimeString() + '.' + String(Date.now() % 1000).padStart(3, '0');

    let sequence: Array<{ direction: string; signal: string; hex: string; detail: string; delay: number }> = [];

    if (testSimIncomingSignal === 'ENQ') {
      sequence = [
        {
          direction: 'INBOUND (Analizador)',
          signal: '<ENQ>',
          hex: '05',
          detail: `Analizador (${activeProfile.targetModel}) envía señal de inicio de sesión física <ENQ>.`,
          delay: 50
        },
        {
          direction: 'DECISION ENGINE (LIS-Bridge)',
          signal: 'EVALUATE_RULE',
          hex: '--',
          detail: `Motor evalúa perfil "${activeProfile.name}". Respuesta configurada: ${activeProfile.enqResponseSignal}. Retardo: ${activeProfile.ackDelayMs}ms.`,
          delay: 150
        },
        {
          direction: 'OUTBOUND (LIS Host)',
          signal: activeProfile.enqResponseSignal === 'NAK_15' ? '<NAK>' : '<ACK>',
          hex: activeProfile.enqResponseSignal === 'NAK_15' ? '15' : '06',
          detail: `LIS Host responde con ${activeProfile.enqResponseSignal === 'NAK_15' ? '<NAK> (0x15)' : '<ACK> (0x06)'} tras ${activeProfile.ackDelayMs}ms de pacing. Handshake completado.`,
          delay: 150 + activeProfile.ackDelayMs
        }
      ];
    } else if (testSimIncomingSignal === 'BAD_CHECKSUM_FRAME') {
      sequence = [
        {
          direction: 'INBOUND (Analizador)',
          signal: '<STX>1H|\\^&|||BAD_FRAME<ETX>99<CR><LF>',
          hex: '02 31 48 7C 5C 5E 26 03 39 39 0D 0A',
          detail: 'Analizador envía frame con checksum corrupto o ruido en la línea serial.',
          delay: 50
        },
        {
          direction: 'DECISION ENGINE (LIS-Bridge)',
          signal: 'CHECKSUM_MISMATCH',
          hex: '--',
          detail: `Modulo 256 esperado (D4) != recibido (99). Regla de fallo activada: ${activeProfile.checksumErrorSignal}.`,
          delay: 120
        },
        {
          direction: 'OUTBOUND (LIS Host)',
          signal: activeProfile.checksumErrorSignal === 'NAK_15' ? '<NAK>' : '<EOT>',
          hex: activeProfile.checksumErrorSignal === 'NAK_15' ? '15' : '04',
          detail: `LIS Host emite ${activeProfile.checksumErrorSignal === 'NAK_15' ? '<NAK> (0x15) solicitando retransmisión' : '<EOT> (0x04) abortando sesión'}. Reintentos restantes: ${activeProfile.maxRetriesOnNak - 1}.`,
          delay: 120 + activeProfile.ackDelayMs
        }
      ];
    } else if (testSimIncomingSignal === 'VALID_FRAME') {
      sequence = [
        {
          direction: 'INBOUND (Analizador)',
          signal: '<STX>1H|\\^&|||Sysmex^XN<CR><ETX>7E<CR><LF>',
          hex: '02 31 48 7C 5C 5E 26 7C 0D 03 37 45 0D 0A',
          detail: 'Analizador envía Header Frame con Checksum válido 7E.',
          delay: 50
        },
        {
          direction: 'DECISION ENGINE (LIS-Bridge)',
          signal: 'CHECKSUM_OK',
          hex: '--',
          detail: 'Checksum verificado al 100%. Regla de frame: <ACK> estándar.',
          delay: 100
        },
        {
          direction: 'OUTBOUND (LIS Host)',
          signal: '<ACK>',
          hex: '06',
          detail: `LIS Host confirma recepción con <ACK> (0x06). Listo para siguiente frame de datos.`,
          delay: 100 + activeProfile.ackDelayMs
        }
      ];
    } else {
      // Host Query No Order
      sequence = [
        {
          direction: 'INBOUND (Analizador)',
          signal: '<STX>2Q|1|^BC-999999||ALL||||||||O<CR><ETX>5F<CR><LF>',
          hex: '02 32 51 7C 31 7C 5E 0D 03 35 46 0D 0A',
          detail: 'Analizador consulta orden para tubo "BC-999999" no existente en base de datos LIS.',
          delay: 50
        },
        {
          direction: 'DECISION ENGINE (LIS-Bridge)',
          signal: 'ORDER_NOT_FOUND',
          hex: '--',
          detail: `Base de datos retorna null. Acción configurada en perfil: ${activeProfile.hostQueryNoOrderAction}.`,
          delay: 150
        },
        {
          direction: 'OUTBOUND (LIS Host)',
          signal: activeProfile.hostQueryNoOrderAction === 'QUERY_REJECT_X'
            ? '<STX>2Q|1|^BC-999999||ALL||||||||X<CR><ETX>68<CR><LF>'
            : '<STX>2L|1|N<CR><ETX>06<CR><LF>',
          hex: '02 32 4C 7C 31 7C 4E 0D 03 30 36 0D 0A',
          detail: `LIS emite ${activeProfile.hostQueryNoOrderAction === 'QUERY_REJECT_X' ? 'Query Reject (X) para expulsar tubo' : 'Terminador Vacío L|1|N liberando gradilla'}.`,
          delay: 200 + activeProfile.ackDelayMs
        }
      ];
    }

    sequence.forEach((step, idx) => {
      setTimeout(() => {
        setTestProfileLogs(prev => [
          ...prev,
          {
            time: formattedTime(),
            direction: step.direction,
            signal: step.signal,
            hex: step.hex,
            detail: step.detail
          }
        ]);

        if (idx === sequence.length - 1) {
          setIsTestingProfile(false);
        }
      }, step.delay);
    });
  };

  const handleRunHostQuery = () => {
    setIsSimulatingHostQuery(true);
    setHostQueryLogs([]);
    setParsedHostQueryData(null);

    const timestamp = new Date().toISOString();
    const timeFormatted = timestamp.replace(/[-:T.Z]/g, '').slice(0, 14);

    const steps = [
      {
        sender: 'ANALYZER' as const,
        raw: '<ENQ> (0x05)',
        hex: '05',
        description: `Analizador (${selectedAnalyzer.name}) solicita establecer sesión física con perfil "${activeProfile.name}".`,
        recordType: 'HANDSHAKE'
      },
      {
        sender: 'LIS_HOST' as const,
        raw: `${activeProfile.enqResponseSignal === 'NAK_15' ? '<NAK> (0x15)' : '<ACK> (0x06)'} [Pacing: ${activeProfile.ackDelayMs}ms]`,
        hex: activeProfile.enqResponseSignal === 'NAK_15' ? '15' : '06',
        description: `LIS-Core Host responde según perfil activo de auto-respuesta.`,
        recordType: 'HANDSHAKE'
      },
      {
        sender: 'ANALYZER' as const,
        raw: `<STX>1H|\\^&|||${selectedAnalyzer.model}|||||||P|1|${timeFormatted}<CR><ETX>${calculateAstmChecksum(`1H|\\^&|||${selectedAnalyzer.model}|||||||P|1|${timeFormatted}`)}<CR><LF>`,
        hex: stringToHex(`1H|\\^&|||${selectedAnalyzer.model}|||||||P|1`),
        description: `Header Frame (H): Identificación del Analizador y delimitadores.`,
        recordType: 'HEADER'
      },
      {
        sender: 'LIS_HOST' as const,
        raw: '<ACK> (0x06)',
        hex: '06',
        description: 'LIS-Core verifica Checksum de Header Frame y solicita siguiente registro.',
        recordType: 'HANDSHAKE'
      },
      {
        sender: 'ANALYZER' as const,
        raw: `<STX>2Q|1|^${queryBarcode}^${rackNumber}^${cupPosition}||ALL||||||||O<CR><ETX>${calculateAstmChecksum(`2Q|1|^${queryBarcode}^${rackNumber}^${cupPosition}||ALL||||||||O`)}<CR><LF>`,
        hex: stringToHex(`2Q|1|^${queryBarcode}^${rackNumber}^${cupPosition}||ALL||||||||O`),
        description: `Query Record (Q): Consulta de pruebas para tubo "${queryBarcode}".`,
        recordType: 'QUERY'
      },
      {
        sender: 'LIS_HOST' as const,
        raw: `<STX>3P|1||8-812-4432||Pinzon^Gabriela||19920514|F<CR><ETX>${calculateAstmChecksum(`3P|1||8-812-4432||Pinzon^Gabriela||19920514|F`)}<CR><LF>`,
        hex: stringToHex('3P|1||8-812-4432||Pinzon^Gabriela||19920514|F'),
        description: `Patient Record (P): Gabriela Pinzón (8-812-4432).`,
        recordType: 'PATIENT'
      },
      {
        sender: 'LIS_HOST' as const,
        raw: `<STX>4O|1|${queryBarcode}|${rackNumber}^${cupPosition}|^^^HEM_COMPLETE\\^^^RETICS|${queryPriority === 'STAT' ? 'S' : 'R'}||${timeFormatted}|||||A|||Sangre_Total||||||||||O<CR><ETX>${calculateAstmChecksum(`4O|1|${queryBarcode}|${rackNumber}^${cupPosition}|^^^HEM_COMPLETE\\^^^RETICS|${queryPriority === 'STAT' ? 'S' : 'R'}||${timeFormatted}`)}<CR><LF>`,
        hex: stringToHex(`4O|1|${queryBarcode}|${rackNumber}^${cupPosition}`),
        description: `Order Record (O): Prioridad ${queryPriority} ${autoDilution ? 'con Dilución 1:10' : 'Directo'}.`,
        recordType: 'ORDER'
      },
      {
        sender: 'ANALYZER' as const,
        raw: '<ACK> (0x06)',
        hex: '06',
        description: 'Analizador acepta la orden de trabajo.',
        recordType: 'HANDSHAKE'
      },
      {
        sender: 'LIS_HOST' as const,
        raw: `<STX>5L|1|N<CR><ETX>${calculateAstmChecksum('5L|1|N')}<CR><LF>`,
        hex: stringToHex('5L|1|N'),
        description: 'Terminator Record (L): Fin de respuesta de Worklist.',
        recordType: 'TERMINATOR'
      },
      {
        sender: 'ANALYZER' as const,
        raw: '<ACK> (0x06)',
        hex: '06',
        description: 'Analizador confirma recepción final.',
        recordType: 'HANDSHAKE'
      },
      {
        sender: 'LIS_HOST' as const,
        raw: '<EOT> (0x04)',
        hex: '04',
        description: 'Session Termination (<EOT>): Sesión liberada.',
        recordType: 'HANDSHAKE'
      }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setHostQueryLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString() + '.' + String(Date.now() % 1000).padStart(3, '0'),
            sender: step.sender,
            raw: step.raw,
            hex: step.hex,
            description: step.description,
            recordType: step.recordType
          }
        ]);

        if (idx === steps.length - 1) {
          setIsSimulatingHostQuery(false);
          setParsedHostQueryData({
            patientName: 'Gabriela Pinzón',
            nationalId: '8-812-4432',
            barcode: queryBarcode,
            priority: queryPriority,
            rack: rackNumber,
            cup: cupPosition,
            orderedProfiles: ['HEM_COMPLETE (Hemograma Completo 5-Diff)', 'RETICS (Recuento Reticulocitos)'],
            status: 'TRANSMITIDO_AL_ANALIZADOR_EXITOSAMENTE',
            checksumStatus: '100% VÁLIDO (MODULO 256)',
            appliedProfile: activeProfile.name,
            socketLatency: `${6.5 + activeProfile.ackDelayMs} ms`
          });
        }
      }, (idx + 1) * (260 + activeProfile.ackDelayMs));
    });
  };

  const handleAddMapping = () => {
    if (!newAnalyzerCode || !newLisParam) {
      alert('Ingrese el código del analizador y el parámetro LIS correspondiente.');
      return;
    }
    setMappings([
      ...mappings,
      {
        id: `m-${Date.now()}`,
        analyzerId: selectedAnalyzer.id,
        analyzerCode: newAnalyzerCode.trim(),
        lisParameter: newLisParam.trim(),
        unit: newUnit,
        multiplier: Number(newMultiplier) || 1.0,
        decimals: 2,
        status: 'ACTIVO',
        category: (selectedAnalyzer.category as any) || 'QUIMICA'
      }
    ]);
    setNewAnalyzerCode('');
    setNewLisParam('');
  };

  const handlePresetChange = (preset: 'sysmex' | 'vitros' | 'stago' | 'biorad' | 'custom') => {
    setSelectedPreset(preset);
    if (preset === 'sysmex') {
      setTestPayload('1H|\\^&|||Sysmex^XN-1000|||||||P|1|20260818204000\n2P|1||||Pinzon^Gabriela\n3O|1|BC-882001||^^^HEM_COMPLETE|R||20260818203500\n4R|1|^^^WBC|7.40|10^3/uL|4.5-11.0|N||F\n5R|2|^^^RBC|4.65|10^6/uL|4.2-5.4|N||F\n6R|3|^^^HGB|14.0|g/dL|12.0-15.5|N||F\n7R|4|^^^PLT|245|10^3/uL|150-450|N||F\n8L|1|N');
    } else if (preset === 'vitros') {
      setTestPayload('1H|\\^&|||VITROS^4600|||||||P|1|20260818204000\n2P|1||||Arosemena^Ricardo\n3O|1|BC-882004||^^^GLU_101|S||20260818203000\n4R|1|^^^GLU|340|mg/dL|70-99|HH||F\n5R|2|^^^CREA|1.15|mg/dL|0.7-1.3|N||F\n6R|3|^^^BUN|18.4|mg/dL|8-23|N||F\n7L|1|N');
    } else if (preset === 'stago') {
      setTestPayload('1H|\\^&|||STAGO^STA_COMPACT|||||||P|1|20260818204000\n2P|1||||Valdes^Carlos\n3O|1|BC-882009||^^^COAG_PROFILE|S||20260818203000\n4R|1|^^^PT_SEC|13.2|s|11.0-14.5|N||F\n5R|2|^^^INR|1.05|Ratio|0.8-1.2|N||F\n6R|3|^^^FIBRINOGEN|310|mg/dL|200-400|N||F\n7L|1|N');
    } else if (preset === 'biorad') {
      setTestPayload('1H|\\^&|||BIORAD^D10_HPLC|||||||P|1|20260818204000\n2P|1||||Morales^Lucia\n3O|1|BC-882012||^^^HBA1C_PROGRAM|R||20260818202500\n4R|1|^^^HBA1C_HPLC|7.8|%|4.0-5.6|H||F\n5C|1|I|HPLC Peak Area A1c: 124.5 mAU*s, Area%: 7.8%|G\n6L|1|N');
    }
  };

  const filteredMappings = mappings.filter(
    (m) =>
      m.analyzerId === selectedAnalyzer.id &&
      (m.analyzerCode.toLowerCase().includes(mappingSearch.toLowerCase()) ||
        m.lisParameter.toLowerCase().includes(mappingSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner with Architecture Badges */}
      <div className="bg-slate-950 text-white p-6 rounded-3xl shadow-2xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[11px] font-mono px-3 py-1 rounded-full uppercase tracking-wider font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-teal-400" />
            <span>LIS-Core Middleware • Handshake Auto-Response & ASTM E1381 Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center space-x-3">
            <span>Estudio de Comunicación & Drivers ASTM</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Configure perfiles de respuesta automática por modelo de analizador: defina el comportamiento de señales <strong className="text-teal-300">&lt;ACK&gt;</strong>, <strong className="text-amber-300">&lt;ENQ&gt;</strong> y <strong className="text-rose-300">&lt;NAK&gt;</strong> con retardos de pacing milimétricos para un handshake profesional.
          </p>
        </div>

        {/* Selected Analyzer Switcher */}
        <div className="relative z-10 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl text-xs space-y-2 min-w-[260px] shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-bold text-[11px] uppercase tracking-wider text-teal-400">Analizador Activo:</span>
            <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{selectedAnalyzer.status}</span>
            </span>
          </div>
          <select
            value={selectedAnalyzerId}
            onChange={(e) => setSelectedAnalyzerId(e.target.value)}
            className="w-full bg-slate-950 text-white font-bold text-xs p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500"
          >
            {analyzers.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} • {a.category || a.protocol}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
            <span>Perfil Asignado: <strong className="text-teal-300">{activeProfile.name.split(' ')[0]}...</strong></span>
            <span>Pacing: <strong className="text-slate-200">{activeProfile.ackDelayMs}ms</strong></span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
        <button
          onClick={() => setActiveSubTab('auto_response_profiles')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeSubTab === 'auto_response_profiles'
              ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>Perfiles de Auto-Respuesta (ACK/ENQ)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('host_query')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeSubTab === 'host_query'
              ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Host-Query Bidireccional STAT</span>
        </button>

        <button
          onClick={() => setActiveSubTab('batch_worklist')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeSubTab === 'batch_worklist'
              ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Emisión de Listas de Trabajo (Worklists)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('state_machine')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeSubTab === 'state_machine'
              ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Máquina de Estados ASTM E1381</span>
        </button>

        <button
          onClick={() => setActiveSubTab('mapping')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeSubTab === 'mapping'
              ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Matriz de Mapeo Parámetro ↔ LIS</span>
        </button>

        <button
          onClick={() => setActiveSubTab('checksum_builder')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeSubTab === 'checksum_builder'
              ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Laboratorio de Checksum & Tramas</span>
        </button>
      </div>

      {/* TAB: AUTO-RESPONSE PROFILES (ACK / ENQ HANDSHAKE CONFIGURATION) */}
      {activeSubTab === 'auto_response_profiles' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Profiles List & Selector */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="text-teal-400 font-mono text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Handshake Decision Engine</span>
                  </div>
                  <h3 className="font-black text-base text-white">Perfiles de Auto-Respuesta</h3>
                </div>
                <button
                  onClick={handleCreateProfile}
                  className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Nuevo Perfil</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {profiles.map((prof) => {
                  const isSelected = selectedProfileId === prof.id;
                  return (
                    <div
                      key={prof.id}
                      onClick={() => setSelectedProfileId(prof.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 relative overflow-hidden ${
                        isSelected
                          ? 'bg-slate-950 border-teal-500 shadow-lg ring-1 ring-teal-500/30'
                          : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white flex items-center space-x-1.5">
                          {isSelected && <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />}
                          <span>{prof.name}</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-slate-900 px-2 py-0.5 rounded text-teal-300 border border-slate-800">
                          {prof.targetModel}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                        {prof.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                        <span className="text-slate-300">
                          Respuesta &lt;ENQ&gt;: <strong className="text-teal-400">{prof.enqResponseSignal}</strong>
                        </span>
                        <span className="text-slate-400">
                          Delay: <strong className="text-amber-400">{prof.ackDelayMs} ms</strong>
                        </span>
                        <span className="text-slate-400">
                          Max Reintentos: <strong className="text-slate-200">{prof.maxRetriesOnNak}</strong>
                        </span>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditProfile(prof);
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-800 flex items-center space-x-1"
                        >
                          <Edit3 className="w-3 h-3 text-teal-400" />
                          <span>Configurar Señales</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProfile(prof.id);
                          }}
                          className="p-1 bg-slate-900 hover:bg-rose-950 text-slate-500 hover:text-rose-400 rounded-lg text-[10px] border border-slate-800"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Live Auto-Response Test Bench */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-white flex flex-col justify-between">
              <div className="space-y-1 border-b border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <div className="text-teal-400 font-mono text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Real-Time Handshake Test Bench</span>
                  </div>
                  <h3 className="font-black text-base text-white">
                    Banco de Pruebas: Perfil "{activeProfile.name}"
                  </h3>
                </div>
                <span className="text-[10px] font-mono bg-slate-950 px-3 py-1 rounded-xl text-teal-400 border border-slate-800">
                  Modelo: {activeProfile.targetModel}
                </span>
              </div>

              {/* Simulator Action Trigger */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Señal Entrante del Analizador:</label>
                    <select
                      value={testSimIncomingSignal}
                      onChange={(e) => setTestSimIncomingSignal(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-teal-500"
                    >
                      <option value="ENQ">1. Señal &lt;ENQ&gt; (0x05) Solicitud de Sesión</option>
                      <option value="VALID_FRAME">2. Trama de Datos Válida con Checksum OK</option>
                      <option value="BAD_CHECKSUM_FRAME">3. Trama con Error de Checksum (Simular Ruido)</option>
                      <option value="HOST_QUERY_NO_ORDER">4. Host-Query sin Orden Pendiente</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleTestAutoResponse}
                      disabled={isTestingProfile}
                      className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50"
                    >
                      {isTestingProfile ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Evaluando Handshake...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-current" />
                          <span>Probar Respuesta Automática</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Handshake Diagnostic Trace */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 font-mono text-xs space-y-2.5 max-h-56 overflow-y-auto">
                  {testProfileLogs.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs font-sans">
                      Presione "Probar Respuesta Automática" para validar cómo responde el middleware ante señales de este modelo.
                    </div>
                  ) : (
                    testProfileLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                          log.direction.includes('INBOUND')
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                            : log.direction.includes('DECISION')
                            ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                            : 'bg-teal-950/20 border-teal-500/30 text-teal-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] opacity-80">
                          <span className="font-bold">{log.direction}</span>
                          <span>{log.time} • Hex: {log.hex}</span>
                        </div>
                        <div className="font-bold text-white text-[11px]">{log.signal}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{log.detail}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Profile Technical Parameter Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[9px] block">RESPUESTA A &lt;ENQ&gt;</span>
                  <span className="font-bold text-teal-400">{activeProfile.enqResponseSignal}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[9px] block">PACING DELAY</span>
                  <span className="font-bold text-amber-400">{activeProfile.ackDelayMs} ms</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[9px] block">ERROR CHECKSUM</span>
                  <span className="font-bold text-rose-400">{activeProfile.checksumErrorSignal}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[9px] block">SIN ORDEN</span>
                  <span className="font-bold text-slate-200">{activeProfile.hostQueryNoOrderAction}</span>
                </div>
              </div>
            </div>
          </div>

          {/* EDIT PROFILE MODAL */}
          {isEditingProfile && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-white animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2 text-teal-400">
                    <Settings2 className="w-5 h-5" />
                    <h3 className="font-bold text-base text-white">Configurar Perfil de Auto-Respuesta Handshake</h3>
                  </div>
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="text-slate-400 hover:text-white font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Nombre del Perfil:</label>
                      <input
                        type="text"
                        value={editingProfileData.name}
                        onChange={(e) => setEditingProfileData({ ...editingProfileData, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Modelo de Analizador de Destino:</label>
                      <input
                        type="text"
                        value={editingProfileData.targetModel}
                        onChange={(e) => setEditingProfileData({ ...editingProfileData, targetModel: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-teal-300 font-bold focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Señal de Respuesta ante &lt;ENQ&gt; (0x05):</label>
                      <select
                        value={editingProfileData.enqResponseSignal}
                        onChange={(e) => setEditingProfileData({ ...editingProfileData, enqResponseSignal: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-teal-500"
                      >
                        <option value="ACK_06">Emitir &lt;ACK&gt; (0x06) Estándar Inmediato</option>
                        <option value="DELAYED_ACK">Emitir &lt;ACK&gt; con Retardo de Pacing</option>
                        <option value="NAK_15">Emitir &lt;NAK&gt; (0x15) Rechazo Temporal</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Retardo de Pacing (ACK Delay en milisegundos):</label>
                      <select
                        value={editingProfileData.ackDelayMs}
                        onChange={(e) => setEditingProfileData({ ...editingProfileData, ackDelayMs: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-teal-500"
                      >
                        <option value={0}>0 ms (Ultra-Fast Sockets / Sysmex)</option>
                        <option value={15}>15 ms (Abbott Alinity)</option>
                        <option value={20}>20 ms (Ortho Vitros 4600 / 5600)</option>
                        <option value={50}>50 ms (Stago STA Compact RS-232 Flow)</option>
                        <option value={100}>100 ms (Equipos antiguos con buffer lento)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Acción ante Error de Checksum:</label>
                      <select
                        value={editingProfileData.checksumErrorSignal}
                        onChange={(e) => setEditingProfileData({ ...editingProfileData, checksumErrorSignal: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-teal-500"
                      >
                        <option value="NAK_15">Emitir &lt;NAK&gt; (0x15) y pedir reintento</option>
                        <option value="ABORT_EOT">Emitir &lt;EOT&gt; (0x04) y abortar sesión</option>
                        <option value="SILENT_IGNORE">Ignorar en silencio (Timeout)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Máximo de Reintentos de Trama:</label>
                      <select
                        value={editingProfileData.maxRetriesOnNak}
                        onChange={(e) => setEditingProfileData({ ...editingProfileData, maxRetriesOnNak: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-teal-500"
                      >
                        <option value={1}>1 Reintento</option>
                        <option value={3}>3 Reintentos (Estándar ASTM)</option>
                        <option value={6}>6 Reintentos (Estándar Sysmex / Stago)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Host-Query sin Orden Pendiente:</label>
                      <select
                        value={editingProfileData.hostQueryNoOrderAction}
                        onChange={(e) => setEditingProfileData({ ...editingProfileData, hostQueryNoOrderAction: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-teal-500"
                      >
                        <option value="EMPTY_TERMINATOR">Enviar Terminador Vacío (L|1|N)</option>
                        <option value="QUERY_REJECT_X">Enviar Rechazo Explícito (Q|...|X)</option>
                        <option value="NAK_REPLY">Responder con &lt;NAK&gt;</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Arbitraje de Contención de Línea:</label>
                      <select
                        value={editingProfileData.lineContentionAction}
                        onChange={(e) => setEditingProfileData({ ...editingProfileData, lineContentionAction: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-teal-500"
                      >
                        <option value="ANALYZER_PRIORITY">Prioridad al Analizador (Ceder canal)</option>
                        <option value="HOST_PRIORITY">Prioridad al Host LIS</option>
                        <option value="BACKOFF_RANDOM">Retroceso Aleatorio (Random Backoff)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Descripción / Notas Técnicas:</label>
                    <textarea
                      rows={2}
                      value={editingProfileData.description || ''}
                      onChange={(e) => setEditingProfileData({ ...editingProfileData, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 font-sans text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-lg shadow-teal-500/20"
                  >
                    Guardar Perfil de Handshake
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: HOST QUERY BIDIRECTIONAL SIMULATION */}
      {activeSubTab === 'host_query' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-white">
            <div className="space-y-1 border-b border-slate-800 pb-4">
              <div className="text-teal-400 font-mono text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Host-Query Protocol Engine</span>
              </div>
              <h3 className="font-black text-base text-white">Configurar Consulta de Tubo</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                El analizador lee el código de barras y consulta al LIS aplicando el perfil de auto-respuesta <strong className="text-teal-300">"{activeProfile.name}"</strong>.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Código de Barras del Tubo (Specimen Barcode):</label>
                <div className="relative">
                  <input
                    type="text"
                    value={queryBarcode}
                    onChange={(e) => setQueryBarcode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-teal-300 font-mono font-bold focus:outline-none focus:border-teal-500"
                    placeholder="BC-882001"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">Code128</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1.5">Gradilla / Carrusel:</label>
                  <input
                    type="text"
                    value={rackNumber}
                    onChange={(e) => setRackNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1.5">Posición (Cup):</label>
                  <input
                    type="text"
                    value={cupPosition}
                    onChange={(e) => setCupPosition(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1.5">Prioridad LIS:</label>
                  <select
                    value={queryPriority}
                    onChange={(e) => setQueryPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-teal-500"
                  >
                    <option value="RUTINA">RUTINA (Normal)</option>
                    <option value="STAT">STAT (Emergencia)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1.5">Auto-Dilución LIS:</label>
                  <button
                    type="button"
                    onClick={() => setAutoDilution(!autoDilution)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      autoDilution ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-950 text-slate-400 border-slate-700'
                    }`}
                  >
                    <span>{autoDilution ? '1:10 H-Ratio' : 'Directa (1:1)'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleRunHostQuery}
                  disabled={isSimulatingHostQuery}
                  className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-2xl text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSimulatingHostQuery ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Ejecutando Handshake Socket...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Disparar Host-Query al LIS</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {parsedHostQueryData && (
              <div className="bg-slate-950/90 border border-teal-500/30 rounded-2xl p-4 space-y-2 text-xs animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-teal-400 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Worklist Resuelta en LIS</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{parsedHostQueryData.socketLatency}</span>
                </div>
                <div className="text-slate-300 font-bold">{parsedHostQueryData.patientName} ({parsedHostQueryData.nationalId})</div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div>Tubo: <strong className="text-teal-300">{parsedHostQueryData.barcode}</strong> • Pos: <span className="text-slate-200">{parsedHostQueryData.rack} #{parsedHostQueryData.cup}</span></div>
                  <div>Perfil aplicado: <span className="text-amber-400 font-mono">{parsedHostQueryData.appliedProfile}</span></div>
                  <ul className="list-disc list-inside text-emerald-400 text-[10px] space-y-0.5 pt-1">
                    {parsedHostQueryData.orderedProfiles.map((p: string, idx: number) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 font-mono text-xs text-teal-400">
                <Terminal className="w-4 h-4" />
                <span>ASTM E1381 BIDIRECTIONAL PROTOCOL SNIFFER (TCP/IP PORT {selectedAnalyzer.port || 5100})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono text-slate-500">Pacing: {activeProfile.ackDelayMs}ms • Reintentos: {activeProfile.maxRetriesOnNak}</span>
                <button
                  onClick={() => setHostQueryLogs([])}
                  className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-800 cursor-pointer"
                >
                  Limpiar Consola
                </button>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 font-mono text-xs space-y-3 h-[400px] overflow-y-auto">
              {hostQueryLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center space-y-2">
                  <ArrowRightLeft className="w-10 h-10 text-slate-700 animate-pulse" />
                  <p className="max-w-sm text-xs">
                    Presione <strong className="text-teal-400">"Disparar Host-Query al LIS"</strong> para observar el intercambio de tramas ASTM byte por byte con el perfil de auto-respuesta activo.
                  </p>
                </div>
              ) : (
                hostQueryLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                      log.sender === 'LIS_HOST'
                        ? 'bg-teal-950/30 border-teal-500/30 text-teal-200'
                        : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-80 border-b border-white/5 pb-1">
                      <span className="font-bold flex items-center space-x-1.5">
                        <span className={`w-2 h-2 rounded-full ${log.sender === 'LIS_HOST' ? 'bg-teal-400' : 'bg-emerald-400'}`} />
                        <span>{log.sender === 'LIS_HOST' ? '🔵 LIS-CORE (HOST RESPONSE)' : `🟢 ANALIZADOR (${selectedAnalyzer.name})`}</span>
                      </span>
                      <span className="text-slate-400">{log.timestamp} • {log.recordType}</span>
                    </div>

                    <div className="font-mono text-[11px] font-bold tracking-wide break-all text-white">
                      {log.raw}
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                      <span>{log.description}</span>
                      <span className="text-slate-500 font-mono text-[9px]">HEX: {log.hex.slice(0, 24)}...</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Cumplimiento Estándar CLSI LIS01-A2 & ASTM E1394-97</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Auto-Response Handshake: <strong className="text-emerald-400">{activeProfile.name}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: BATCH WORKLIST BROADCAST */}
      {activeSubTab === 'batch_worklist' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-white">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="space-y-1 border-b border-slate-800 pb-4">
              <div className="text-teal-400 font-mono text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Broadcast Worklist Dispatcher</span>
              </div>
              <h3 className="font-black text-base text-white">Órdenes Pendientes para Emisión</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Seleccione las muestras de la bandeja de recepción para compilar y transmitir la lista de trabajo al carrusel del analizador.
              </p>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {[
                { id: 'ord-1001', code: 'ORD-2026-00101', patient: 'Gabriela Pinzón', test: 'Hemograma Completo', tube: 'EDTA Morado', barcode: 'BC-882001' },
                { id: 'ord-1002', code: 'ORD-2026-00102', patient: 'Ricardo Arosemena', test: 'Glucosa + Perfil Renal', tube: 'Suero Rojo', barcode: 'BC-882004' },
                { id: 'ord-1003', code: 'ORD-2026-00103', patient: 'Esteban Castillo', test: 'TSH Ultrasensible', tube: 'Suero Rojo', barcode: 'BC-882005' },
                { id: 'ord-1004', code: 'ORD-2026-00104', patient: 'Carlos Valdés', test: 'TP / INR Coagulación', tube: 'Citrato Azul', barcode: 'BC-882009' }
              ].map((item) => {
                const isSelected = selectedBatchOrders.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedBatchOrders(selectedBatchOrders.filter(id => id !== item.id));
                      } else {
                        setSelectedBatchOrders([...selectedBatchOrders, item.id]);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-teal-500/10 border-teal-500/50 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-white flex items-center space-x-2">
                        <span>{item.patient}</span>
                        <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">{item.code}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{item.test} • Tubo {item.tube}</div>
                      <div className="text-[10px] font-mono text-slate-500">Barcode: {item.barcode}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${isSelected ? 'bg-teal-500 border-teal-400 text-slate-950' : 'border-slate-700'}`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  const timeStr = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
                  let batch = `H|\\^&|||LIS_CORE^ABREGOTECH|||||||P|1|${timeStr}\n`;
                  selectedBatchOrders.forEach((ordId, idx) => {
                    const barcode = `BC-88200${idx + 1}`;
                    batch += `P|${idx + 1}||8-812-4432||Pinzon^Gabriela||19900101|F\n`;
                    batch += `O|1|${barcode}|RACK-01^${String(idx + 1).padStart(2, '0')}|^^^HEM_COMPLETE|R||${timeStr}|||||A|||Sangre_Total||||||||||O\n`;
                  });
                  batch += `L|1|N\n`;
                  setBatchGeneratedAstm(batch);
                  setBatchTransmitted(false);
                }}
                className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-2xl text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                <Code2 className="w-4 h-4" />
                <span>Compilar Trama ASTM Worklist ({selectedBatchOrders.length} Tubos)</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
            <div className="space-y-1 border-b border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-white">Trama ASTM E1394 Generada</h3>
                <p className="text-slate-400 text-xs">Formato oficial con cabecera H, pacientes P, órdenes O y terminador L.</p>
              </div>
              {batchGeneratedAstm && (
                <button
                  onClick={() => {
                    setBatchTransmitted(true);
                    setTimeout(() => {
                      alert(`✅ Lista de trabajo transmitida exitosamente a ${selectedAnalyzer.name}.`);
                    }, 300);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Transmitir a {selectedAnalyzer.name}</span>
                </button>
              )}
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-teal-300 h-80 overflow-y-auto">
              {batchGeneratedAstm ? (
                <pre className="whitespace-pre-wrap">{batchGeneratedAstm}</pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-2">
                  <FileCode className="w-8 h-8 text-slate-700" />
                  <span>Seleccione las muestras y haga clic en "Compilar Trama ASTM Worklist"</span>
                </div>
              )}
            </div>

            {batchTransmitted && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center space-x-2 animate-fadeIn">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Lista de trabajo enviada y confirmada con &lt;ACK&gt; por el analizador {selectedAnalyzer.name}.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: ASTM E1381 STATE MACHINE */}
      {activeSubTab === 'state_machine' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-6">
          <div className="space-y-1 border-b border-slate-800 pb-4">
            <div className="text-teal-400 font-mono text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1.5">
              <Network className="w-3.5 h-3.5" />
              <span>Low-Level Physical Layer Protocol</span>
            </div>
            <h3 className="font-black text-lg text-white">Máquina de Estados de Transmisión ASTM E1381-02</h3>
            <p className="text-slate-400 text-xs max-w-3xl leading-relaxed">
              El protocolo de bajo nivel gobierna la sincronización entre el Host LIS y el Analizador mediante 3 fases formales: Establecimiento de Línea, Transferencia de Registros por Tramas (Frames 0-7) y Terminación de Sesión.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="text-teal-400 text-xs font-mono font-bold">FASE 1: ESTABLECIMIENTO</div>
              <h4 className="font-bold text-sm text-white">Session Handshake</h4>
              <div className="bg-slate-900 p-3 rounded-xl font-mono text-[11px] text-slate-300 space-y-1">
                <div>Emisor: <strong className="text-emerald-400">&lt;ENQ&gt; (0x05)</strong></div>
                <div>Receptor: <strong className="text-teal-400">&lt;ACK&gt; (0x06)</strong></div>
                <div className="text-rose-400">Error: &lt;NAK&gt; (0x15)</div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                El emisor toma el control de la línea. El perfil activo aplica {activeProfile.ackDelayMs}ms de retardo antes de emitir {activeProfile.enqResponseSignal}.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="text-teal-400 text-xs font-mono font-bold">FASE 2: TRANSFERENCIA</div>
              <h4 className="font-bold text-sm text-white">Data Frame Transfer</h4>
              <div className="bg-slate-900 p-3 rounded-xl font-mono text-[11px] text-slate-300 space-y-1">
                <div className="text-teal-300">&lt;STX&gt; [FN] [Data] &lt;CR&gt; &lt;ETX&gt; [CS] &lt;CR&gt;&lt;LF&gt;</div>
                <div className="text-[10px] text-slate-500">FN: Secuencia 0 a 7 (Rollover)</div>
                <div className="text-[10px] text-slate-500">CS: Modulo 256 Checksum (2 bytes)</div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Máximo 240 bytes por frame intermedio (&lt;ETB&gt;) o frame final de registro (&lt;ETX&gt;). Cada frame debe ser acusado con &lt;ACK&gt;.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="text-teal-400 text-xs font-mono font-bold">FASE 3: TERMINACIÓN</div>
              <h4 className="font-bold text-sm text-white">Session Release</h4>
              <div className="bg-slate-900 p-3 rounded-xl font-mono text-[11px] text-slate-300 space-y-1">
                <div>Emisor: <strong className="text-amber-400">&lt;EOT&gt; (0x04)</strong></div>
                <div className="text-[10px] text-slate-400">Estado: IDLE (Línea disponible)</div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                El emisor emite &lt;EOT&gt; para ceder el canal y permitir que la contraparte envíe resultados o nuevas consultas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PARAMETER MAPPING MATRIX */}
      {activeSubTab === 'mapping' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white text-base">
                Tabla de Mapeo de Códigos ({selectedAnalyzer.name})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Traduce los identificadores crudos del analizador a las pruebas del Catálogo LIS de Laboratorio San José.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar parámetro..."
                value={mappingSearch}
                onChange={(e) => setMappingSearch(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500 font-medium"
              />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Cód. Analizador:</label>
              <input
                type="text"
                placeholder="ALT_3"
                value={newAnalyzerCode}
                onChange={(e) => setNewAnalyzerCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-teal-300 font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Parámetro Mapeado en LIS:</label>
              <input
                type="text"
                placeholder="Química — Alanina Aminotransferasa (ALT)"
                value={newLisParam}
                onChange={(e) => setNewLisParam(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Unidad:</label>
              <input
                type="text"
                placeholder="U/L"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddMapping}
                className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer"
              >
                + Mapear Código
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Código Analizador (Driver)</th>
                  <th className="p-3">Parámetro en Catálogo LIS</th>
                  <th className="p-3">Sección</th>
                  <th className="p-3">Unidad</th>
                  <th className="p-3">Factor</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium">
                {filteredMappings.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-teal-400">{m.analyzerCode}</td>
                    <td className="p-3 text-white font-bold">{m.lisParameter}</td>
                    <td className="p-3 text-slate-400">{m.category}</td>
                    <td className="p-3 text-slate-300 font-mono">{m.unit}</td>
                    <td className="p-3 font-mono text-slate-400">{m.multiplier.toFixed(2)}x</td>
                    <td className="p-3">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: ASTM CHECKSUM & FRAME BUILDER */}
      {activeSubTab === 'checksum_builder' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <Code2 className="w-5 h-5 text-teal-400" />
                <span>Calculadora de Suma de Verificación ASTM (Modulo 256 Checksum)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Herramienta para verificar la integridad de paquetes según el estándar ASTM E1381 / CLSI LIS01-A2.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 font-bold">Plantillas Oficiales:</span>
              <select
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-teal-300 font-bold focus:outline-none focus:border-teal-500"
              >
                <option value="sysmex">Sysmex XN-1000 (Hemograma Completo)</option>
                <option value="vitros">Ortho Vitros 4600 (Química Pánico)</option>
                <option value="stago">Stago STA Compact (TP / INR Coagulación)</option>
                <option value="biorad">Bio-Rad D-10 (HbA1c HPLC)</option>
                <option value="custom">Personalizado...</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Payload ASCII del Registro ASTM (Entre &lt;STX&gt; y &lt;ETX&gt;):
            </label>
            <textarea
              value={testPayload}
              onChange={(e) => {
                setTestPayload(e.target.value);
                setSelectedPreset('custom');
              }}
              rows={6}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 font-mono text-xs text-teal-300 focus:outline-none focus:border-teal-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-slate-400 text-xs font-bold block">Checksum Calculado (Hexadecimal):</span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-3xl font-black text-teal-400">
                  {calculateAstmChecksum(testPayload)}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(calculateAstmChecksum(testPayload));
                    setFrameCopied(true);
                    setTimeout(() => setFrameCopied(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  {frameCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{frameCopied ? 'Copiado' : 'Copiar Checksum'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800">
                Fórmula: (Sum of ASCII byte codes mod 256).toUpperCase().padStart(2, '0')
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-slate-400 text-xs font-bold block">Trama Completa Enmarcada (&lt;STX&gt; ... &lt;ETX&gt;[CS]&lt;CR&gt;&lt;LF&gt;):</span>
              <div className="font-mono text-[11px] text-emerald-400 break-all bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                &lt;STX&gt;{testPayload.split('\n')[0]}&lt;CR&gt;&lt;ETX&gt;{calculateAstmChecksum(testPayload.split('\n')[0])}&lt;CR&gt;&lt;LF&gt;
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
