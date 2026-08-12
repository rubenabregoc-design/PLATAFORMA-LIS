import React, { useState, useEffect } from 'react';
import {
  Microscope,
  Clock,
  Droplet,
  FlaskConical,
  ShieldAlert,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Plus,
  Trash2,
  Info,
  ChevronRight,
  Shield,
  FileSpreadsheet,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Brain,
  Stethoscope,
  Search,
  ArrowRight,
  FileText,
  Check,
  ShieldCheck,
  AlertOctagon,
  X,
  Lock,
  Unlock,
  UserCheck,
  FileCheck,
  Flame,
  Radio,
  Timer,
  Bell,
  TrendingUp,
  Gauge,
  History,
  Fingerprint,
  Filter,
  FileDown,
  QrCode,
  RefreshCw,
  MessageSquare,
  XCircle
} from 'lucide-react';
import { SecureInternalMessagingWidget } from '../SecureInternalMessagingWidget';
import { RejectedSampleWizard } from './RejectedSampleWizard';

// --- TYPES ---
export interface AuditLogEvent {
  id: string;
  sampleBarcode: string;
  orderNumber: string;
  patientName: string;
  testName: string;
  timestamp: string;
  eventType: 'INGRESO' | 'VALIDACION' | 'MODIFICACION' | 'REENVASE' | 'HIL_CHECK' | 'REFLEX' | 'DISPOSICION';
  actionTitle: string;
  description: string;
  performedBy: string;
  role: string;
  workstation: string;
  isoClause: string;
  integrityHash: string;
  previousValue?: string;
  newValue?: string;
  aliquotCode?: string;
}

export interface TatSampleItem {
  id: string;
  orderNumber: string;
  sampleBarcode: string;
  patientName: string;
  patientLocation: string;
  testName: string;
  department: 'Marcadores Cardíacos' | 'Gases Arteriales' | 'Coagulación' | 'Hematología STAT' | 'Bioquímica';
  urgency: 'STAT / Crítico' | 'Urgente' | 'Rutina';
  slaMinutesTotal: number;
  elapsedSeconds: number;
  status: 'PROCESANDO' | 'EN_ANALIZADOR' | 'PENDIENTE_VALIDACION' | 'COMPLETADO';
  delayReason?: string;
  expedited: boolean;
  receivedTime: string;
}
export interface BiosafetyProtocol {
  bslLevel: 'BSL-1' | 'BSL-2' | 'BSL-3' | 'BSL-4';
  hazardAgent: string;
  hazardCategory: string;
  requiredEpp: string[];
  containmentEquipment: string;
  handlingInstructions: string[];
  spillProtocol: string;
  emergencyContact: string;
}

export interface BiosafetyWorkOrder {
  id: string;
  orderNumber: string;
  sampleBarcode: string;
  patientName: string;
  patientId: string;
  ageGender: string;
  location: string;
  requestedTests: string[];
  urgency: 'STAT / Urgente' | 'Rutina' | 'Prioritario';
  sampleType: string;
  isHighBiohazard: boolean;
  biosafetyProtocol?: BiosafetyProtocol;
  status: 'PENDIENTE' | 'EN_MESON' | 'VALIDADO';
  openedAt?: string;
}

export interface CdsRule {
  id: string;
  code: string;
  category: 'Cardiología' | 'Endocrinología' | 'Hematología' | 'Coagulación' | 'Infectología' | 'Metabólico/Renal' | 'Inmunología';
  triggerCondition: string;
  guidelineSource: string;
  riskLevel: 'CRITICO' | 'ALTO' | 'MODERADO';
  suggestedReflexTests: string[];
  clinicalRationale: string;
  capClsiReference: string;
}

export interface PatientScenario {
  id: string;
  patientName: string;
  ageGender: string;
  sampleId: string;
  location: string;
  primaryPanel: string;
  labValues: { [key: string]: number | string };
  cdsTriggers: CdsRule[];
  orderedReflexTests: string[];
}

export interface LeukocyteCount {
  neutrophils: number;
  lymphocytes: number;
  monocytes: number;
  eosinophils: number;
  basophils: number;
  bandCells: number;
  blasts: number;
  nrbc: number; // Nucleated RBCs per 100 WBCs
}

export interface BenchTimer {
  id: string;
  label: string;
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  category: 'Centrifugación' | 'Tinciones' | 'Coagulación' | 'Aglutinación' | 'Personalizado';
}

export interface PoikilocyteItem {
  id: string;
  name: string;
  category: 'Forma' | 'Inclusión' | 'Plaquetaria';
  description: string;
  clinicalSignificance: string;
  grade: 'AUSENTE' | '1+' | '2+' | '3+' | '4+';
}

export interface TemperatureCheckItem {
  id: string;
  equipmentName: string;
  targetRange: string;
  measuredTemp: number;
  unit: '°C';
  status: 'OPTIMO' | 'ALERTA' | 'CRITICO';
  checkedBy: string;
}

export const TechnologistWorkbench: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'hematology' | 'hil_dilution' | 'timers' | 'bloodbank' | 'biosafety' | 'cds_engine' | 'tat_monitor' | 'audit_trail' | 'inter_branch_chat' | 'rejected_samples'>('rejected_samples');

  // --- 1. HEMATOLOGY DIFFERENTIAL COUNTER STATE ---
  const [wbcTotal, setWbcTotal] = useState<number>(7.8); // x10^3 / µL
  const [counts, setCounts] = useState<LeukocyteCount>({
    neutrophils: 55,
    lymphocytes: 30,
    monocytes: 8,
    eosinophils: 4,
    basophils: 1,
    bandCells: 2,
    blasts: 0,
    nrbc: 0
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const totalCount = counts.neutrophils + counts.lymphocytes + counts.monocytes + counts.eosinophils + counts.basophils + counts.bandCells + counts.blasts;

  const playClickBeep = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(totalCount + 1 >= 100 ? 880 : 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio fallback
    }
  };

  const handleCellClick = (cellType: keyof LeukocyteCount) => {
    playClickBeep();
    setCounts(prev => ({
      ...prev,
      [cellType]: prev[cellType] + 1
    }));
  };

  const handleResetCounter = () => {
    setCounts({
      neutrophils: 0,
      lymphocytes: 0,
      monocytes: 0,
      eosinophils: 0,
      basophils: 0,
      bandCells: 0,
      blasts: 0,
      nrbc: 0
    });
  };

  // Keyboard shortcut listener for Differential Counter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeSubTab !== 'hematology') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case '1': handleCellClick('neutrophils'); break;
        case '2': handleCellClick('lymphocytes'); break;
        case '3': handleCellClick('monocytes'); break;
        case '4': handleCellClick('eosinophils'); break;
        case '5': handleCellClick('basophils'); break;
        case '6': handleCellClick('bandCells'); break;
        case '7': handleCellClick('blasts'); break;
        case '8': handleCellClick('nrbc'); break;
        case 'r':
        case 'R':
          handleResetCounter();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSubTab, totalCount, soundEnabled]);

  // Poikilocytosis Atlas State
  const [poikilocytes, setPoikilocytes] = useState<PoikilocyteItem[]>([
    { id: 'poik-1', name: 'Dacriocitos (Células en Gota)', category: 'Forma', description: 'Eritrocitos elongados en forma de lágrima.', clinicalSignificance: 'Mielofibrosis primaria, Talasemia.', grade: '1+' },
    { id: 'poik-2', name: 'Esquistocitos (Fragmentos)', category: 'Forma', description: 'Fragmentos eritrocutarios con extremos puntiagudos.', clinicalSignificance: 'Anemia Hemolítica Microangiopática (PTT, SUH, CID).', grade: 'AUSENTE' },
    { id: 'poik-3', name: 'Codocitos (Células en Diana / Target)', category: 'Forma', description: 'Eritrocitos con distribución en blanco de tiro.', clinicalSignificance: 'Hemoglobinopatías (HbS, HbC), Enfermedad hepática.', grade: '2+' },
    { id: 'poik-4', name: 'Cuerpos de Howell-Jolly', category: 'Inclusión', description: 'Remanentes de ADN nuclear de color azul/violáceo.', clinicalSignificance: 'Esplenectomía, Asplenia funcional.', grade: '1+' },
    { id: 'poik-5', name: 'Punteado Basófilo', category: 'Inclusión', description: 'Gránulos basófilos compuestos de ARN precipitado.', clinicalSignificance: 'Intoxicación por plomo (Saturnismo), Talasemia.', grade: 'AUSENTE' },
    { id: 'poik-6', name: 'Macroplaquetas / Plaquetas Gigantes', category: 'Plaquetaria', description: 'Plaquetas de tamaño superior a un eritrocito normal (>4 µm).', clinicalSignificance: 'Síndrome de Bernard-Soulier, PTI.', grade: '1+' }
  ]);

  const handleUpdateGrade = (id: string, grade: PoikilocyteItem['grade']) => {
    setPoikilocytes(prev => prev.map(p => p.id === id ? { ...p, grade } : p));
  };

  // --- 2. HIL INTERFERENCE & SERIAL DILUTION STATE ---
  const [hemolysisLevel, setHemolysisLevel] = useState<number>(1); // 0 to 4
  const [icterusLevel, setIcterusLevel] = useState<number>(0);
  const [lipemiaLevel, setLipemiaLevel] = useState<number>(2);

  // Dilution Calculator State
  const [rawAnalyteValue, setRawAnalyteValue] = useState<number>(1450); // U/L or mg/dL
  const [analyteName, setAnalyteName] = useState<string>('ALT (GPT)');
  const [dilutionFactor, setDilutionFactor] = useState<number>(10); // 1:10
  const [totalDesiredVolumeUl, setTotalDesiredVolumeUl] = useState<number>(300); // µL

  const sampleVolumeUl = Math.round(totalDesiredVolumeUl / dilutionFactor);
  const diluentVolumeUl = totalDesiredVolumeUl - sampleVolumeUl;
  const correctedFinalValue = rawAnalyteValue * dilutionFactor;

  // --- 3. BENCH MULTI-TIMER STATE ---
  const [timers, setTimers] = useState<BenchTimer[]>([
    { id: 'tmr-1', label: 'Centrifugación Tubo Gel (3000 RPM)', durationSeconds: 600, remainingSeconds: 600, isRunning: false, category: 'Centrifugación' },
    { id: 'tmr-2', label: 'Coloración de Wright (Extendido)', durationSeconds: 300, remainingSeconds: 300, isRunning: false, category: 'Tinciones' },
    { id: 'tmr-3', label: 'Rotador VDRL / RPR (180 RPM)', durationSeconds: 240, remainingSeconds: 240, isRunning: false, category: 'Aglutinación' },
    { id: 'tmr-4', label: 'Incubación Coombs en Baño María (37°C)', durationSeconds: 900, remainingSeconds: 900, isRunning: false, category: 'Coagulación' }
  ]);

  const [newTimerLabel, setNewTimerLabel] = useState<string>('');
  const [newTimerMinutes, setNewTimerMinutes] = useState<number>(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => prev.map(t => {
        if (t.isRunning && t.remainingSeconds > 0) {
          return { ...t, remainingSeconds: t.remainingSeconds - 1 };
        } else if (t.isRunning && t.remainingSeconds === 0) {
          return { ...t, isRunning: false };
        }
        return t;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleTimer = (id: string) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, isRunning: !t.isRunning } : t));
  };

  const resetTimer = (id: string) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, remainingSeconds: t.durationSeconds, isRunning: false } : t));
  };

  const handleAddCustomTimer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimerLabel.trim()) return;

    const seconds = newTimerMinutes * 60;
    const newTimer: BenchTimer = {
      id: `tmr-${Date.now()}`,
      label: newTimerLabel.trim(),
      durationSeconds: seconds,
      remainingSeconds: seconds,
      isRunning: false,
      category: 'Personalizado'
    };

    setTimers(prev => [...prev, newTimer]);
    setNewTimerLabel('');
  };

  const deleteTimer = (id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  // --- 4. BLOOD BANK COMPATIBILITY STATE ---
  const [donorGroup, setDonorGroup] = useState<string>('O_POS');
  const [recipientGroup, setRecipientGroup] = useState<string>('A_POS');
  const [crossmatchGrade, setCrossmatchGrade] = useState<string>('0'); // 0, 1+, 2+, 3+, 4+, MF
  const [coombsControlChecked, setCoombsControlChecked] = useState<boolean>(true);

  const getCompatibilityResult = (donor: string, recipient: string) => {
    if (donor === 'O_NEG') return { isCompatible: true, notes: 'Donante Universal de Glóbulos Rojos' };
    if (recipient === 'AB_POS') return { isCompatible: true, notes: 'Receptor Universal de Glóbulos Rojos' };
    if (donor === recipient) return { isCompatible: true, notes: 'Isogrupo Compatible Exacto' };

    if (recipient === 'A_POS' && (donor === 'A_NEG' || donor === 'O_POS' || donor === 'O_NEG')) return { isCompatible: true, notes: 'Compatible' };
    if (recipient === 'B_POS' && (donor === 'B_NEG' || donor === 'O_POS' || donor === 'O_NEG')) return { isCompatible: true, notes: 'Compatible' };

    return { isCompatible: false, notes: '🚫 INCOMPATIBLE - Riesgo Hemolítico Severo Transfusional' };
  };

  const compatibility = getCompatibilityResult(donorGroup, recipientGroup);

  // --- 5. BIOSAFETY & TEMPERATURE CHECK STATE ---
  const [tempChecks, setTempChecks] = useState<TemperatureCheckItem[]>([
    { id: 'temp-1', equipmentName: 'Refrigerador de Reactivos #1', targetRange: '2.0°C - 8.0°C', measuredTemp: 4.2, unit: '°C', status: 'OPTIMO', checkedBy: 'Lic. Abrego' },
    { id: 'temp-2', equipmentName: 'Banco de Sangre Conservador #1', targetRange: '1.0°C - 6.0°C', measuredTemp: 3.8, unit: '°C', status: 'OPTIMO', checkedBy: 'Lic. Abrego' },
    { id: 'temp-3', equipmentName: 'Ultracongelador de Plasma (-80°C)', targetRange: '-85.0°C - -70.0°C', measuredTemp: -78.4, unit: '°C', status: 'OPTIMO', checkedBy: 'Lic. Abrego' },
    { id: 'temp-4', equipmentName: 'Baño María Incubación (37°C)', targetRange: '36.5°C - 37.5°C', measuredTemp: 37.1, unit: '°C', status: 'OPTIMO', checkedBy: 'Lic. Abrego' }
  ]);

  const [incidentReportSubmitted, setIncidentReportSubmitted] = useState<boolean>(false);
  const [incidentType, setIncidentType] = useState<string>('Pinchazo con Aguja Usada');

  const handleUpdateTemp = (id: string, newTemp: number) => {
    setTempChecks(prev => prev.map(tc => {
      if (tc.id === id) {
        let status: TemperatureCheckItem['status'] = 'OPTIMO';
        if (tc.equipmentName.includes('Refrigerador') && (newTemp < 2 || newTemp > 8)) status = 'ALERTA';
        if (tc.equipmentName.includes('Ultracongelador') && newTemp > -70) status = 'CRITICO';
        return { ...tc, measuredTemp: newTemp, status };
      }
      return tc;
    }));
  };

  // --- 6. CLINICAL DECISION SUPPORT (CDS) SYSTEM STATE ---
  const [cdsRules] = useState<CdsRule[]>([
    {
      id: 'cds-1',
      code: 'CDS-CARD-01',
      category: 'Cardiología',
      triggerCondition: 'Troponina I High-Sensitivity > 0.040 ng/mL',
      guidelineSource: 'ESC 2024 / AACC Cardiac Marker Guidelines',
      riskLevel: 'CRITICO',
      suggestedReflexTests: ['CK-MB Masa Quantitativa', 'NT-proBNP Peptído Natriurético', 'Electrocardiograma 12 Derivaciones (Urgente)'],
      clinicalRationale: 'Elevación aguda de Troponina I sugiere injuria miocárdica/IAM. Reflex para CK-MB ayuda a estimar reinfarto y NT-proBNP evalúa insuficiencia cardíaca aguda.',
      capClsiReference: 'CLSI C51-A2 & CAP Cardiac Biomarkers Checklist'
    },
    {
      id: 'cds-2',
      code: 'CDS-ENDO-01',
      category: 'Endocrinología',
      triggerCondition: 'TSH > 10.0 µIU/mL (Tirotropina Elevada)',
      guidelineSource: 'ATA / AACE Thyroid Guidelines 2025',
      riskLevel: 'ALTO',
      suggestedReflexTests: ['T4 Libre (Tetrayodotironina Libre)', 'Anti-TPO (Ac. Anti-Peroxidasa Tiroidea)', 'Anti-Tiroglobulina'],
      clinicalRationale: 'TSH elevación marcada indica hipotiroidismo primario. Reflex automático de T4 Libre evalúa hipotiroidismo franco vs subclínico; Anti-TPO confirma etiología autoinmune (Hashimoto).',
      capClsiReference: 'CAP Endocrinology Audit Protocol E-04'
    },
    {
      id: 'cds-3',
      code: 'CDS-COAG-01',
      category: 'Coagulación',
      triggerCondition: 'TTPa Prolongado (> 42.0 s) con TP Normal (11-13 s)',
      guidelineSource: 'ISTH / CLSI H60-A Guidelines',
      riskLevel: 'ALTO',
      suggestedReflexTests: ['Prueba de Mezcla TTPa 1:1 (Mixing Study)', 'Dosaje de Factor VIII / IX', 'Anticoagulante Lúpico (dRVVT)'],
      clinicalRationale: 'Prolongación aislada de TTPa sugiere deficiencia de vía intrínseca (Factor VIII, IX, XI) o presencia de inhibidor/Anticoagulante Lúpico. Mezcla 1:1 diferencia deficiencia (corrige) de inhibidor (no corrige).',
      capClsiReference: 'CLSI H60-A: Laboratory Testing for Lupus Anticoagulant'
    },
    {
      id: 'cds-4',
      code: 'CDS-HEMA-01',
      category: 'Hematología',
      triggerCondition: 'Hemoglobina < 8.0 g/dL con VCM Microcítico (< 72.0 fL)',
      guidelineSource: 'ASH / WHO Anemia Guidelines',
      riskLevel: 'ALTO',
      suggestedReflexTests: ['Ferritina Sérica', 'Hierro Sérico & Capacidad de Fijación (TIBC)', 'Conteo de Reticulocitos', 'Frotis de Sangre Periférica'],
      clinicalRationale: 'Anemia microcítica severa requiere diagnóstico diferencial entre anemia ferropénica y rasgo talasémico. Ferritina es el indicador más sensible de depósitos de hierro.',
      capClsiReference: 'CAP Hematology Technical Standard H-12'
    },
    {
      id: 'cds-5',
      code: 'CDS-META-01',
      category: 'Metabólico/Renal',
      triggerCondition: 'Glucosa > 320 mg/dL + Cetonuria / Glucosuria en Parcial de Orina',
      guidelineSource: 'ADA Diabetes Care Standards 2026',
      riskLevel: 'CRITICO',
      suggestedReflexTests: ['Betahidroxibutirato en Sangre', 'Gasometría Venosa / pH / Bicarbonato', 'Osmolalidad Sérica Calculada'],
      clinicalRationale: 'Hiperglucemia marcada con cetonuria sugiere descompensación metabólica aguda (Cetoacidosis Diabética o Estado Hiperosmolar). Betahidroxibutirato es el cetoácido predominante.',
      capClsiReference: 'ADA Clinical Decision Support Protocol Met-9'
    },
    {
      id: 'cds-6',
      code: 'CDS-INFE-01',
      category: 'Infectología',
      triggerCondition: 'HBsAg (Antígeno de Superficie Hepatitis B) REACTIVO',
      guidelineSource: 'AASLD / CDC Viral Hepatitis Testing Algorithm',
      riskLevel: 'ALTO',
      suggestedReflexTests: ['DNA VHB Carga Viral Cuantitativa por PCR', 'Antígeno HBeAg & Ac. Anti-HBe', 'Anti-HBc IgM'],
      clinicalRationale: 'Detección reactiva de HBsAg requiere caracterización de la fase de replicación viral con PCR cuantitativo de ADN VHB y perfil de infectividad HBeAg/Anti-HBe.',
      capClsiReference: 'CDC Hepatitis B Laboratory Testing Guidance'
    },
    {
      id: 'cds-7',
      code: 'CDS-INMU-01',
      category: 'Inmunología',
      triggerCondition: 'Proteínas Totales Séricas > 8.8 g/dL con Inversión Albúmina/Globulina (< 0.8)',
      guidelineSource: 'NCCN Multiple Myeloma Guidelines 2025',
      riskLevel: 'MODERADO',
      suggestedReflexTests: ['Electroforesis de Proteínas Séricas (SPEP)', 'Inmunofijación Sérica (IFE)', 'Cadenas Ligeras Libres en Suero (Kappa/Lambda)'],
      clinicalRationale: 'Hiperproteinemia con pico de globulinas y relación A/G invertida requiere descartar Gammopatía Monoclonal (Mieloma Múltiple, Macroglobulinemia de Waldenström).',
      capClsiReference: 'CAP Immunopathology Reference Standards'
    }
  ]);

  const [patientScenarios, setPatientScenarios] = useState<PatientScenario[]>([
    {
      id: 'scen-1',
      patientName: 'Mendoza, Carlos E.',
      ageGender: '58 años • Masculino',
      sampleId: 'LAB-9021',
      location: 'Urgencias / Box 3',
      primaryPanel: 'Marcadores Cardíacos STAT',
      labValues: { 'Troponina I': 3.42, 'CK Total': 410, 'Mioglobina': 185 },
      cdsTriggers: [
        {
          id: 'cds-1',
          code: 'CDS-CARD-01',
          category: 'Cardiología',
          triggerCondition: 'Troponina I High-Sensitivity > 0.040 ng/mL',
          guidelineSource: 'ESC 2024 / AACC Cardiac Marker Guidelines',
          riskLevel: 'CRITICO',
          suggestedReflexTests: ['CK-MB Masa Quantitativa', 'NT-proBNP Peptído Natriurético', 'Electrocardiograma 12 Derivaciones (Urgente)'],
          clinicalRationale: 'Elevación aguda de Troponina I sugiere injuria miocárdica/IAM. Reflex para CK-MB ayuda a estimar reinfarto y NT-proBNP evalúa insuficiencia cardíaca aguda.',
          capClsiReference: 'CLSI C51-A2 & CAP Cardiac Biomarkers Checklist'
        }
      ],
      orderedReflexTests: ['CK-MB Masa Quantitativa']
    },
    {
      id: 'scen-2',
      patientName: 'Restrepo, Elena M.',
      ageGender: '42 años • Femenino',
      sampleId: 'LAB-9024',
      location: 'Consulta Externa / Endocrinología',
      primaryPanel: 'Perfil Tiroideo Básico',
      labValues: { 'TSH': 14.8, 'T4 Libre': 0.52 },
      cdsTriggers: [
        {
          id: 'cds-2',
          code: 'CDS-ENDO-01',
          category: 'Endocrinología',
          triggerCondition: 'TSH > 10.0 µIU/mL (Tirotropina Elevada)',
          guidelineSource: 'ATA / AACE Thyroid Guidelines 2025',
          riskLevel: 'ALTO',
          suggestedReflexTests: ['T4 Libre (Tetrayodotironina Libre)', 'Anti-TPO (Ac. Anti-Peroxidasa Tiroidea)', 'Anti-Tiroglobulina'],
          clinicalRationale: 'TSH elevación marcada indica hipotiroidismo primario. Reflex automático de T4 Libre evalúa hipotiroidismo franco vs subclínico; Anti-TPO confirma etiología autoinmune (Hashimoto).',
          capClsiReference: 'CAP Endocrinology Audit Protocol E-04'
        }
      ],
      orderedReflexTests: []
    },
    {
      id: 'scen-3',
      patientName: 'Gómez, Roberto A.',
      ageGender: '65 años • Masculino',
      sampleId: 'LAB-9028',
      location: 'Pre-Quirúrgico / Quirófano 2',
      primaryPanel: 'Tiempos de Coagulación Routine',
      labValues: { 'TTPa': 68.4, 'TP (Tiempo Protrombina)': 11.8, 'INR': 1.02 },
      cdsTriggers: [
        {
          id: 'cds-3',
          code: 'CDS-COAG-01',
          category: 'Coagulación',
          triggerCondition: 'TTPa Prolongado (> 42.0 s) con TP Normal (11-13 s)',
          guidelineSource: 'ISTH / CLSI H60-A Guidelines',
          riskLevel: 'ALTO',
          suggestedReflexTests: ['Prueba de Mezcla TTPa 1:1 (Mixing Study)', 'Dosaje de Factor VIII / IX', 'Anticoagulante Lúpico (dRVVT)'],
          clinicalRationale: 'Prolongación aislada de TTPa sugiere deficiencia de vía intrínseca (Factor VIII, IX, XI) o presencia de inhibidor/Anticoagulante Lúpico. Mezcla 1:1 diferencia deficiencia (corrige) de inhibidor (no corrige).',
          capClsiReference: 'CLSI H60-A: Laboratory Testing for Lupus Anticoagulant'
        }
      ],
      orderedReflexTests: ['Prueba de Mezcla TTPa 1:1 (Mixing Study)']
    },
    {
      id: 'scen-4',
      patientName: 'Vásquez, María del Carmen',
      ageGender: '31 años • Femenino',
      sampleId: 'LAB-9033',
      location: 'Maternidad / Hospitalización',
      primaryPanel: 'Hemograma Completo VI',
      labValues: { 'Hemoglobina': 7.2, 'VCM': 68.2, 'Leucocitos': 6.8, 'Plaquetaria': 380 },
      cdsTriggers: [
        {
          id: 'cds-4',
          code: 'CDS-HEMA-01',
          category: 'Hematología',
          triggerCondition: 'Hemoglobina < 8.0 g/dL con VCM Microcítico (< 72.0 fL)',
          guidelineSource: 'ASH / WHO Anemia Guidelines',
          riskLevel: 'ALTO',
          suggestedReflexTests: ['Ferritina Sérica', 'Hierro Sérico & Capacidad de Fijación (TIBC)', 'Conteo de Reticulocitos', 'Frotis de Sangre Periférica'],
          clinicalRationale: 'Anemia microcítica severa requiere diagnóstico diferencial entre anemia ferropénica y rasgo talasémico. Ferritina es el indicador más sensible de depósitos de hierro.',
          capClsiReference: 'CAP Hematology Technical Standard H-12'
        }
      ],
      orderedReflexTests: []
    }
  ]);

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scen-1');
  const [customAnalyteName, setCustomAnalyteName] = useState<string>('Troponina I');
  const [customAnalyteValue, setCustomAnalyteValue] = useState<number>(1.85);

  const activeScenario = patientScenarios.find(s => s.id === selectedScenarioId) || patientScenarios[0];

  const handleToggleReflexTest = (scenarioId: string, testName: string) => {
    setPatientScenarios(prev => prev.map(s => {
      if (s.id === scenarioId) {
        const exists = s.orderedReflexTests.includes(testName);
        const updated = exists
          ? s.orderedReflexTests.filter(t => t !== testName)
          : [...s.orderedReflexTests, testName];
        return { ...s, orderedReflexTests: updated };
      }
      return s;
    }));
  };

  const evalCustomAnalyteRule = () => {
    const val = customAnalyteValue;
    const name = customAnalyteName.toLowerCase();

    if (name.includes('tropo') && val > 0.04) return cdsRules[0];
    if (name.includes('tsh') && val > 10) return cdsRules[1];
    if (name.includes('ttpa') && val > 42) return cdsRules[2];
    if ((name.includes('hemo') || name.includes('hb')) && val < 8) return cdsRules[3];
    if (name.includes('gluco') && val > 300) return cdsRules[4];
    if (name.includes('prote') && val > 8.8) return cdsRules[6];

    return null;
  };

  const customCdsResult = evalCustomAnalyteRule();

  // --- 7. BIOSAFETY WORK ORDERS & PROTOCOL ALERTS STATE ---
  const [biosafetyWorkOrders, setBiosafetyWorkOrders] = useState<BiosafetyWorkOrder[]>([
    {
      id: 'wo-101',
      orderNumber: 'ORD-2026-8801',
      sampleBarcode: 'BAR-998101',
      patientName: 'Santamaría, Fernando R.',
      patientId: 'PAS-88120',
      ageGender: '62 años • Masculino',
      location: 'Neumología / Sala B-12',
      requestedTests: ['PCR GenExpert BK', 'Basciloscopía M. Tuberculosis', 'Cultivo Lowenstein-Jensen'],
      urgency: 'STAT / Urgente',
      sampleType: 'Esputo Espeso / Lavado Broncoalveolar',
      isHighBiohazard: true,
      status: 'PENDIENTE',
      biosafetyProtocol: {
        bslLevel: 'BSL-3',
        hazardAgent: 'Mycobacterium tuberculosis (Patrón Cavitario / BK+++ Multirresistente)',
        hazardCategory: 'Bacteriológico de Alto Riesgo - Contagio por Aerosoles Respiratorios',
        requiredEpp: [
          'Respirador N95 / FFP3 autocertificado y ajustado a rostro',
          'Gafas de Seguridad Herméticas con protección lateral y anti-empañante',
          'Doble Guante de Nitrilo de manga larga (descarte por capas)',
          'Bata de Polipropileno Impermeable con puños ajustados',
          'Cubrezapatos de protección biológica'
        ],
        containmentEquipment: 'Cabina de Seguridad Biológica (CSB) Clase II Tipo B2 con extracción HEPA 100% y flujo laminar vertical continuo.',
        handlingInstructions: [
          'PROHIBIDO destapar o manipular tubos y frascos de muestra en mesa o mesón abierto.',
          'Centrifugación obligatoria exclusivamente en rotores estancos con tapas de seguridad roscadas. Tras detener el rotor, esperar 10 minutos en reposo antes de abrir para decantación de micro-aerosoles.',
          'Vortex y homogeneización ejecutarse únicamente dentro de la CSB B2 activa.',
          'Inactivación química de alícuotas con solución de Hipoclorito de Sodio al 1% (10,000 ppm) previa al autoclavado.'
        ],
        spillProtocol: 'En caso de generación de aerosol o derrame: Detener respiración inmediata, evacuar la sala BSL-3 durante 30 minutos, notificar al Oficial de Bioseguridad LIS y aplicar protocolo de decontaminación con Hipoclorito al 1% durante 20 minutos.',
        emergencyContact: 'Oficial de Bioseguridad LIS (Dra. Arango) Ext. 4402 / Prevención de Riesgos'
      }
    },
    {
      id: 'wo-102',
      orderNumber: 'ORD-2026-8802',
      sampleBarcode: 'BAR-998102',
      patientName: 'Delgado, Xiomara A.',
      patientId: 'PAS-44109',
      ageGender: '42 años • Femenino',
      location: 'Infectología / Consulta 4',
      requestedTests: ['Carga Viral VIH-1 Ultra-Sensible', 'PCR ADN VHB Cuantitativo'],
      urgency: 'Prioritario',
      sampleType: 'Sangre Total EDTA (10 mL)',
      isHighBiohazard: true,
      status: 'PENDIENTE',
      biosafetyProtocol: {
        bslLevel: 'BSL-2',
        hazardAgent: 'Virus de la Inmunodeficiencia Humana (VIH-1) / Virus Hepatitis B (VHB)',
        hazardCategory: 'Patógeno Transmitido por Sangre (Virémico / Riesgo de Salpicadura y Inoculación)',
        requiredEpp: [
          'Gafas de Protección Anti-salpicaduras o Pantalla Facial',
          'Doble Guante de Nitrilo de examen',
          'Pechera o Delantal Impermeable sobre bata médica',
          'Mascarilla Quirúrgica Fluid-Resistant (Resistente a fluidos)'
        ],
        containmentEquipment: 'Cabina de Seguridad Biológica Clase II o Pantalla Acrílica Anti-Salpicaduras de Mesón.',
        handlingInstructions: [
          'Destapar tubos al vacío utilizando gasa impregnada en desinfectante sobre el tapón para prevenir micro-aerosoles por presión.',
          'Uso estricto de punzocortantes con mecanismo retráctil de seguridad. Prohibido reencapuchar agujas.',
          'Utilizar puntas con filtro biológico en todas las micropipetas de preparación de PCR.'
        ],
        spillProtocol: 'En caso de derrame de sangre: Cubrir con toallas de papel absorbente y verter Hipoclorito de Sodio al 0.5% (5,000 ppm). Dejar actuar por 15 minutos antes de remover.',
        emergencyContact: 'Salud Ocupacional Ext. 3310 / Comité de Bioseguridad'
      }
    },
    {
      id: 'wo-103',
      orderNumber: 'ORD-2026-8803',
      sampleBarcode: 'BAR-998103',
      patientName: 'Arosemena, Luis M.',
      patientId: 'PAS-90312',
      ageGender: '55 años • Masculino',
      location: 'Urgencias / Reanimación',
      requestedTests: ['Examen Citoquímico LCR', 'Tinta China / Gram LCR', 'Cultivo de Bacterias & Hongos'],
      urgency: 'STAT / Urgente',
      sampleType: 'Líquido Cefalorraquídeo (LCR - 3 mL)',
      isHighBiohazard: true,
      status: 'PENDIENTE',
      biosafetyProtocol: {
        bslLevel: 'BSL-3',
        hazardAgent: 'Neisseria meningitidis (Serogrupo B - Meningococcemia) / Cryptococcus neoformans',
        hazardCategory: 'Bacteriológico de Altísima Contagiosidad - Infección Severa del SNC',
        requiredEpp: [
          'Respirador N95 / FFP3 ajustado',
          'Pantalla Facial Integrada de cobertura total',
          'Doble Guante de Nitrilo',
          'Bata de Aislamiento de Malla Cerrada Impermeable'
        ],
        containmentEquipment: 'Cabina de Seguridad Biológica Clase II Tipo A2/B2',
        handlingInstructions: [
          'Preparación de frotis Gram y montaje en fresco ejecutarse estrictamente dentro de la CSB.',
          'Fijación del frotis Gram mediante metanol en lugar de calor directo para evitar micro-aerosoles térmicos.',
          'Notificación urgente al personal si hubo exposición a aerosoles para inicio inmediato de quimioprofilaxis con Ciprofloxacino/Rifampicina.'
        ],
        spillProtocol: 'Desinfección inmediata con solución de Amonio Cuaternario de 5ta generación o Hipoclorito al 1%. Contactar urgente a Bioseguridad.',
        emergencyContact: 'Epidemiología Hospitalaria Ext. 5001'
      }
    },
    {
      id: 'wo-104',
      orderNumber: 'ORD-2026-8804',
      sampleBarcode: 'BAR-998104',
      patientName: 'Camargo, Beatriz V.',
      patientId: 'PAS-12093',
      ageGender: '48 años • Femenino',
      location: 'UCI Adultos / Cama 8',
      requestedTests: ['Hemocultivo Automatizado', 'Identificación MALDI-TOF & Antibiograma'],
      urgency: 'STAT / Urgente',
      sampleType: 'Botella Hemocultivo Aerobio/Anaerobio',
      isHighBiohazard: true,
      status: 'PENDIENTE',
      biosafetyProtocol: {
        bslLevel: 'BSL-2',
        hazardAgent: 'Klebsiella pneumoniae Productora de Carbapenemasa (KPC / NDM-1 Multidrogorresistente)',
        hazardCategory: 'Superbacteria Hospitalaria MDR - Riesgo de Brote Epidemiológico',
        requiredEpp: [
          'Guantes de Nitrilo quirúrgicos',
          'Bata Quirúrgica Desechable con protección de mangas',
          'Mascarilla Quirúrgica',
          'Gafas de Seguridad'
        ],
        containmentEquipment: 'Mesón de Microbiología con Extracción de Aire / CSB Clase II',
        handlingInstructions: [
          'Manejo estricto de cepas en aislamiento de contacto.',
          'Puncionar botellas de hemocultivo únicamente con dispositivos de bioseguridad acoplados.',
          'Desinfección de asas de siembra con esterilizador infrarrojo/eléctrico (sin llama abierta).'
        ],
        spillProtocol: 'Limpieza con toallas absorbentes e inmersión en Fenólico o Hipoclorito de Sodio a 5,000 ppm durante 15 minutos.',
        emergencyContact: 'Control de Infecciones Intrahospitalarias (IAAS) Ext. 2200'
      }
    },
    {
      id: 'wo-105',
      orderNumber: 'ORD-2026-8805',
      sampleBarcode: 'BAR-998105',
      patientName: 'Mendoza, Carlos E.',
      patientId: 'PAS-90210',
      ageGender: '58 años • Masculino',
      location: 'Urgencias / Box 3',
      requestedTests: ['Troponina I STAT', 'CK-MB Masa', 'Perfil Renal STAT'],
      urgency: 'STAT / Urgente',
      sampleType: 'Suero Sanguíneo (Tubo Gel Separador)',
      isHighBiohazard: false,
      status: 'PENDIENTE'
    }
  ]);

  const [selectedOrderForModal, setSelectedOrderForModal] = useState<BiosafetyWorkOrder | null>(null);
  const [showBiosafetyAlertModal, setShowBiosafetyAlertModal] = useState<boolean>(false);
  const [activeWorkOrderInWorkbench, setActiveWorkOrderInWorkbench] = useState<BiosafetyWorkOrder | null>(null);

  // Verification checks inside Biosafety Alert Modal
  const [ppeCheckedItems, setPpeCheckedItems] = useState<{ [key: string]: boolean }>({});
  const [cabinetConfirmed, setCabinetConfirmed] = useState<boolean>(false);
  const [spillConfirmed, setSpillConfirmed] = useState<boolean>(false);
  const [safetyLogNotice, setSafetyLogNotice] = useState<string | null>(null);

  const handleOpenWorkOrder = (order: BiosafetyWorkOrder) => {
    setSelectedOrderForModal(order);
    if (order.isHighBiohazard && order.biosafetyProtocol) {
      // Initialize checklist state for high biohazard order
      const initialPpeState: { [key: string]: boolean } = {};
      order.biosafetyProtocol.requiredEpp.forEach((_, idx) => {
        initialPpeState[`ppe-${idx}`] = false;
      });
      setPpeCheckedItems(initialPpeState);
      setCabinetConfirmed(false);
      setSpillConfirmed(false);
      setShowBiosafetyAlertModal(true);
    } else {
      // Standard order opens directly
      setActiveWorkOrderInWorkbench(order);
      setBiosafetyWorkOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'EN_MESON', openedAt: new Date().toLocaleTimeString() } : o));
      setSafetyLogNotice(`Orden #${order.orderNumber} abierta en mesón (Riesgo Estándar BSL-1).`);
      setTimeout(() => setSafetyLogNotice(null), 4000);
    }
  };

  const handleTogglePpeCheck = (key: string) => {
    setPpeCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirmBiosafetyProtocol = () => {
    if (!selectedOrderForModal) return;

    setActiveWorkOrderInWorkbench(selectedOrderForModal);
    setBiosafetyWorkOrders(prev => prev.map(o => o.id === selectedOrderForModal.id ? { ...o, status: 'EN_MESON', openedAt: new Date().toLocaleTimeString() } : o));
    setShowBiosafetyAlertModal(false);

    setSafetyLogNotice(`🚨 Protocolo de Bioseguridad ${selectedOrderForModal.biosafetyProtocol?.bslLevel} verificado y aceptado para la Orden #${selectedOrderForModal.orderNumber}. Trabajo en CSB habilitado.`);
    setTimeout(() => setSafetyLogNotice(null), 6000);
  };

  const isProtocolFullyVerified = () => {
    if (!selectedOrderForModal?.biosafetyProtocol) return true;
    const allPpeChecked = selectedOrderForModal.biosafetyProtocol.requiredEpp.every((_, idx) => ppeCheckedItems[`ppe-${idx}`]);
    return allPpeChecked && cabinetConfirmed && spillConfirmed;
  };

  // --- 8. REAL-TIME CRITICAL TAT (TURNAROUND TIME) SLA MONITOR STATE & HANDLERS ---
  const [tatSamples, setTatSamples] = useState<TatSampleItem[]>([
    {
      id: 'tat-1',
      orderNumber: 'ORD-2026-9001',
      sampleBarcode: 'BAR-CARD-01',
      patientName: 'Ríos, Gonzalo A.',
      patientLocation: 'Urgencias / Box Reanimación 1',
      testName: 'Troponina I Ultrasensible + CK-MB Masa STAT',
      department: 'Marcadores Cardíacos',
      urgency: 'STAT / Crítico',
      slaMinutesTotal: 30,
      elapsedSeconds: 1680, // 28 minutes elapsed -> 2 mins remaining (RED)
      status: 'EN_ANALIZADOR',
      expedited: true,
      receivedTime: '08:42:10'
    },
    {
      id: 'tat-2',
      orderNumber: 'ORD-2026-9002',
      sampleBarcode: 'BAR-GAS-02',
      patientName: 'Morales, Valeria M.',
      patientLocation: 'UCI Adultos / Cama 4',
      testName: 'Gasometría Arterial + Lactato Sérico STAT',
      department: 'Gases Arteriales',
      urgency: 'STAT / Crítico',
      slaMinutesTotal: 15,
      elapsedSeconds: 1020, // 17 minutes elapsed -> VENCIDO BREACHED (RED)
      status: 'PROCESANDO',
      delayReason: 'Burbuja de aire en jeringa - Solicitada re-homogeneización',
      expedited: false,
      receivedTime: '08:53:40'
    },
    {
      id: 'tat-3',
      orderNumber: 'ORD-2026-9003',
      sampleBarcode: 'BAR-COAG-03',
      patientName: 'Castillo, Esteban R.',
      patientLocation: 'Quirófano 2 / Pre-Op',
      testName: 'TTPa + TP / INR Quirúrgico STAT',
      department: 'Coagulación',
      urgency: 'Urgente',
      slaMinutesTotal: 45,
      elapsedSeconds: 2160, // 36 minutes elapsed -> 9 mins remaining (AMARILLO)
      status: 'PENDIENTE_VALIDACION',
      expedited: false,
      receivedTime: '08:34:00'
    },
    {
      id: 'tat-4',
      orderNumber: 'ORD-2026-9004',
      sampleBarcode: 'BAR-HEM-04',
      patientName: 'Vega, Lucía S.',
      patientLocation: 'Ginecología / Observación',
      testName: 'Hemograma Completo STAT + Recuento Plaquetario',
      department: 'Hematología STAT',
      urgency: 'Urgente',
      slaMinutesTotal: 30,
      elapsedSeconds: 1080, // 18 minutes elapsed -> 12 mins remaining (AMARILLO)
      status: 'EN_ANALIZADOR',
      expedited: false,
      receivedTime: '08:52:10'
    },
    {
      id: 'tat-5',
      orderNumber: 'ORD-2026-9005',
      sampleBarcode: 'BAR-BIO-05',
      patientName: 'Paredes, Héctor F.',
      patientLocation: 'Medicina Interna / Sala 10',
      testName: 'Perfil Renal & Electrolitos Plasmáticos',
      department: 'Bioquímica',
      urgency: 'Rutina',
      slaMinutesTotal: 90,
      elapsedSeconds: 1800, // 30 minutes elapsed -> 60 mins remaining (VERDE)
      status: 'PROCESANDO',
      expedited: false,
      receivedTime: '08:40:00'
    },
    {
      id: 'tat-6',
      orderNumber: 'ORD-2026-9006',
      sampleBarcode: 'BAR-CARD-06',
      patientName: 'Gómez, Ana Patricia',
      patientLocation: 'Urgencias / Triage 2',
      testName: 'D-Dímero Cuantitativo STAT',
      department: 'Marcadores Cardíacos',
      urgency: 'STAT / Crítico',
      slaMinutesTotal: 40,
      elapsedSeconds: 2280, // 38 minutes elapsed -> 2 mins remaining (RED)
      status: 'EN_ANALIZADOR',
      expedited: true,
      receivedTime: '08:32:15'
    }
  ]);

  const [tatFilterStatus, setTatFilterStatus] = useState<'TODOS' | 'ROJO' | 'AMARILLO' | 'VERDE'>('TODOS');
  const [tatFilterDept, setTatFilterDept] = useState<string>('TODOS');
  const [delayModalSample, setDelayModalSample] = useState<TatSampleItem | null>(null);
  const [delayReasonInput, setDelayReasonInput] = useState<string>('');

  // Live timer tick effect for real-time TAT countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTatSamples(prev =>
        prev.map(s => {
          if (s.status === 'COMPLETADO') return s;
          return {
            ...s,
            elapsedSeconds: s.elapsedSeconds + 1
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getSampleTrafficLight = (sample: TatSampleItem): 'ROJO' | 'AMARILLO' | 'VERDE' => {
    if (sample.status === 'COMPLETADO') return 'VERDE';
    const remainingSeconds = (sample.slaMinutesTotal * 60) - sample.elapsedSeconds;
    const remainingMinutes = remainingSeconds / 60;

    if (remainingMinutes <= 5) return 'ROJO';
    if (remainingMinutes <= 15) return 'AMARILLO';
    return 'VERDE';
  };

  const handleExpediteTatSample = (sampleId: string) => {
    setTatSamples(prev =>
      prev.map(s => {
        if (s.id === sampleId) {
          const newExp = !s.expedited;
          setSafetyLogNotice(
            newExp
              ? `⚡ Muestra #${s.sampleBarcode} prioritizada en LIS. Elevada a cabecera de cola en analizador.`
              : `Prioridad normal restablecida para #${s.sampleBarcode}.`
          );
          setTimeout(() => setSafetyLogNotice(null), 4000);
          return { ...s, expedited: newExp };
        }
        return s;
      })
    );
  };

  const handleCompleteTatSample = (sampleId: string) => {
    setTatSamples(prev =>
      prev.map(s => {
        if (s.id === sampleId) {
          const minsTaken = Math.floor(s.elapsedSeconds / 60);
          setSafetyLogNotice(`✓ Muestra #${s.sampleBarcode} (${s.testName}) completada y liberada. TAT final: ${minsTaken} min.`);
          setTimeout(() => setSafetyLogNotice(null), 5000);
          return { ...s, status: 'COMPLETADO' };
        }
        return s;
      })
    );
  };

  const handleSaveDelayReason = () => {
    if (!delayModalSample || !delayReasonInput.trim()) return;

    setTatSamples(prev =>
      prev.map(s => {
        if (s.id === delayModalSample.id) {
          return { ...s, delayReason: delayReasonInput.trim() };
        }
        return s;
      })
    );

    setSafetyLogNotice(`📢 Motivo de retraso registrado para #${delayModalSample.sampleBarcode}: "${delayReasonInput.trim()}". Notificado a LIS Urgencias.`);
    setTimeout(() => setSafetyLogNotice(null), 5000);
    setDelayModalSample(null);
    setDelayReasonInput('');
  };

  // --- 9. REAL-TIME ISO 15189 AUDIT TRAIL STATE & HANDLERS ---
  const [selectedAuditBarcode, setSelectedAuditBarcode] = useState<string>('BAR-CARD-01');
  const [auditTypeFilter, setAuditTypeFilter] = useState<string>('TODAS');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');
  const [showAddAuditEventModal, setShowAddAuditEventModal] = useState<boolean>(false);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState<string>('');
  const [newEventDesc, setNewEventDesc] = useState<string>('');
  const [newEventType, setNewEventType] = useState<AuditLogEvent['eventType']>('MODIFICACION');
  const [newEventPrevVal, setNewEventPrevVal] = useState<string>('');
  const [newEventNewVal, setNewEventNewVal] = useState<string>('');

  const [auditEvents, setAuditEvents] = useState<AuditLogEvent[]>([
    {
      id: 'aud-101',
      sampleBarcode: 'BAR-CARD-01',
      orderNumber: 'ORD-2026-9001',
      patientName: 'Ríos, Gonzalo A.',
      testName: 'Troponina I Ultrasensible + CK-MB Masa STAT',
      timestamp: '2026-08-12 08:32:15',
      eventType: 'INGRESO',
      actionTitle: 'Ingreso & Recepción de Muestra en LIS',
      description: 'Tubo de plasma Li-Heparina recibido con código de barras legible. Verificación de identidad con pulsera de urgencias.',
      performedBy: 'T.M. Camilo S. (TM-3108)',
      role: 'Tecnólogo Recepción Central',
      workstation: 'Recepción Central LIS (IP 192.168.10.12)',
      isoClause: 'ISO 15189:2022 §7.3.2 (Recepción)',
      integrityHash: 'SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    {
      id: 'aud-102',
      sampleBarcode: 'BAR-CARD-01',
      orderNumber: 'ORD-2026-9001',
      patientName: 'Ríos, Gonzalo A.',
      testName: 'Troponina I Ultrasensible + CK-MB Masa STAT',
      timestamp: '2026-08-12 08:35:00',
      eventType: 'HIL_CHECK',
      actionTitle: 'Inspección de Índices de Interferencia HIL',
      description: 'Lectura espectrofotométrica pre-analítica: Hemólisis = 0 (Negativo), Ictericia = 1+ (Suave), Lipemia = 0. Muestra apta.',
      performedBy: 'Analizador Roche cobas e411 (Auto)',
      role: 'Sistema Analítico Automatizado',
      workstation: 'Modulo Inmuno-E (IP 192.168.10.22)',
      isoClause: 'ISO 15189:2022 §7.3.4 (Evaluación de muestras)',
      integrityHash: 'SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284ddd200126d9069'
    },
    {
      id: 'aud-103',
      sampleBarcode: 'BAR-CARD-01',
      orderNumber: 'ORD-2026-9001',
      patientName: 'Ríos, Gonzalo A.',
      testName: 'Troponina I Ultrasensible + CK-MB Masa STAT',
      timestamp: '2026-08-12 08:38:22',
      eventType: 'REENVASE',
      actionTitle: 'Generación de Alícuota Secundaria (Reenvasado)',
      description: 'Separación de 500 µL de plasma para tubo alícuota de respaldo en Criovial #ALI-CARD-01-A2. Etiquetado 2D DataMatrix.',
      performedBy: 'Lic. Valentina Soto (TM-4091)',
      role: 'Tecnólogo Médico de Mesón',
      workstation: 'Estación Pre-Analítica-01 (IP 192.168.10.45)',
      isoClause: 'ISO 15189:2022 §7.3.7 (Alícuotas y Sub-muestras)',
      integrityHash: 'SHA256: 8f93a1a3e3518e9060b86a075253816a70a83e0a1733e89139ff7b4b1049c6d3',
      aliquotCode: 'ALI-CARD-01-A2'
    },
    {
      id: 'aud-104',
      sampleBarcode: 'BAR-CARD-01',
      orderNumber: 'ORD-2026-9001',
      patientName: 'Ríos, Gonzalo A.',
      testName: 'Troponina I Ultrasensible + CK-MB Masa STAT',
      timestamp: '2026-08-12 08:44:10',
      eventType: 'MODIFICACION',
      actionTitle: 'Dilución Manual 1:5 por Superación de Rango',
      description: 'El resultado inicial superó el límite superior de cuantificación (> 10,000 pg/mL). Se aplicó dilución 1:5 con diluyente dedicado.',
      performedBy: 'Lic. Valentina Soto (TM-4091)',
      role: 'Tecnólogo Médico de Mesón',
      workstation: 'Estación Inmuno-02 (IP 192.168.10.48)',
      isoClause: 'ISO 15189:2022 §7.3.8 (Modificación y Diluciones)',
      integrityHash: 'SHA256: a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
      previousValue: 'Troponina I > 10,000 pg/mL (Out of Range)',
      newValue: 'Troponina I = 14,250 pg/mL (Calculado con Dil. 1:5)'
    },
    {
      id: 'aud-105',
      sampleBarcode: 'BAR-CARD-01',
      orderNumber: 'ORD-2026-9001',
      patientName: 'Ríos, Gonzalo A.',
      testName: 'Troponina I Ultrasensible + CK-MB Masa STAT',
      timestamp: '2026-08-12 08:50:00',
      eventType: 'VALIDACION',
      actionTitle: 'Validación Tecnológica & Notificación de Valor Pánico',
      description: 'Validación técnica realizada con firma digital SHA-256. Notificación telefónica inmediata a Dr. M. Tapia en Urgencias a las 08:51 hrs.',
      performedBy: 'Lic. Valentina Soto (TM-4091)',
      role: 'Tecnólogo Médico Senior',
      workstation: 'Estación Inmuno-02 (IP 192.168.10.48)',
      isoClause: 'ISO 15189:2022 §7.4.1 (Liberación e informe de resultados)',
      integrityHash: 'SHA256: 41b212f458129e924d0ed8479e399580b0800d1163473f3d7904738a7c29370f'
    },
    {
      id: 'aud-201',
      sampleBarcode: 'BAR-GAS-02',
      orderNumber: 'ORD-2026-9002',
      patientName: 'Morales, Valeria M.',
      testName: 'Gasometría Arterial + Lactato Sérico STAT',
      timestamp: '2026-08-12 08:53:40',
      eventType: 'INGRESO',
      actionTitle: 'Recepción en Jeringa Heparinizada',
      description: 'Ingreso directo desde UCI Adultos. Verificación de ausencia de microcoágulos y mantenimiento hermético en frío.',
      performedBy: 'T.M. Andrés G. (TM-2804)',
      role: 'Tecnólogo Gases Arteriales',
      workstation: 'Estación Gases-01 (IP 192.168.10.15)',
      isoClause: 'ISO 15189:2022 §7.3.2',
      integrityHash: 'SHA256: 3b1a8f9212003c94517316712398458921827401284091241029412048912049'
    },
    {
      id: 'aud-202',
      sampleBarcode: 'BAR-GAS-02',
      orderNumber: 'ORD-2026-9002',
      patientName: 'Morales, Valeria M.',
      testName: 'Gasometría Arterial + Lactato Sérico STAT',
      timestamp: '2026-08-12 08:56:10',
      eventType: 'MODIFICACION',
      actionTitle: 'Inyección de Disolución de Burbuja & Purga',
      description: 'Presencia de microburbuja detectada previo a aspiración. Extracción de burbuja y homogeneización en agitador de jeringas 30 seg.',
      performedBy: 'T.M. Andrés G. (TM-2804)',
      role: 'Tecnólogo Gases Arteriales',
      workstation: 'Estación Gases-01 (IP 192.168.10.15)',
      isoClause: 'ISO 15189:2022 §7.3.8',
      integrityHash: 'SHA256: 9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e'
    }
  ]);

  const handleAddAuditEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDesc.trim()) return;

    const sampleMatch = tatSamples.find(s => s.sampleBarcode === selectedAuditBarcode);
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
    const mockHash = 'SHA256: ' + Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join('');

    const newLog: AuditLogEvent = {
      id: `aud-live-${Date.now()}`,
      sampleBarcode: selectedAuditBarcode,
      orderNumber: sampleMatch?.orderNumber || 'ORD-2026-CUSTOM',
      patientName: sampleMatch?.patientName || 'Paciente Auditado',
      testName: sampleMatch?.testName || 'Ensayo LIS',
      timestamp: timeStr,
      eventType: newEventType,
      actionTitle: newEventTitle.trim(),
      description: newEventDesc.trim(),
      performedBy: 'Lic. Valentina Soto (TM-4091)',
      role: 'Tecnólogo Médico Responsable',
      workstation: 'Estación Workbench-01 (IP 192.168.10.45)',
      isoClause: 'ISO 15189:2022 §7.3.8 (Auditoría en Vivo)',
      integrityHash: mockHash,
      previousValue: newEventPrevVal.trim() || undefined,
      newValue: newEventNewVal.trim() || undefined
    };

    setAuditEvents(prev => [newLog, ...prev]);
    setSafetyLogNotice(`🔒 Evento de Auditoría ISO 15189 registrado para #${selectedAuditBarcode}. Hash digital generado.`);
    setTimeout(() => setSafetyLogNotice(null), 5000);

    setShowAddAuditEventModal(false);
    setNewEventTitle('');
    setNewEventDesc('');
    setNewEventPrevVal('');
    setNewEventNewVal('');
  };

  const handleExportAuditCertificate = () => {
    const activeLogs = auditEvents.filter(e => e.sampleBarcode === selectedAuditBarcode);
    const jsonBlob = new Blob([JSON.stringify({
      certificateTitle: 'INFORME DE TRAZABILIDAD Y AUDITORÍA EN TIEMPO REAL ISO 15189',
      issuedAt: new Date().toISOString(),
      sampleBarcode: selectedAuditBarcode,
      laboratoryName: 'Laboratorio Clínico Automatizado & Banco de Sangre ISO 15189',
      integrityStatus: 'CADENA_DE_CUSTODIA_INALTERADA_100%',
      auditor: 'Lic. Valentina Soto (TM-4091)',
      totalEvents: activeLogs.length,
      auditEvents: activeLogs
    }, null, 2)], { type: 'application/json' });

    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_ISO15189_${selectedAuditBarcode}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setSafetyLogNotice(`📥 Certificado de Auditoría ISO 15189 descargado en JSON firmado para #${selectedAuditBarcode}.`);
    setTimeout(() => setSafetyLogNotice(null), 5000);
  };

  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    setIncidentReportSubmitted(true);
    setTimeout(() => setIncidentReportSubmitted(false), 5000);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-3xl shadow-xl">
              <Microscope className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-white tracking-tight">Estación del Tecnólogo Médico</h1>
                <span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Bench Workstation v4.2
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Herramientas de cálculo en mesón, contador hematológico, banderas HIL, cronómetros de banca e inmunohaematología.
              </p>
            </div>
          </div>

          {/* Quick Sound Toggle & Bench Quick Controls */}
          <div className="flex items-center space-x-3 bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 text-xs font-bold ${
                soundEnabled ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'bg-slate-800 text-slate-400'
              }`}
              title="Activar/Desactivar tono de audio en conteo celular"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'Audio On' : 'Audio Mute'}</span>
            </button>
            <span className="text-slate-700">|</span>
            <span className="text-[11px] font-mono font-bold text-teal-400">
              TM. Guardia Activa
            </span>
          </div>
        </div>

        {/* SUB-MODULE TABS NAVIGATION */}
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/10 relative z-10">
          <button
            onClick={() => setActiveSubTab('hematology')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 cursor-pointer border ${
              activeSubTab === 'hematology'
                ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/20'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Microscope className="w-4 h-4" />
            <span>Contador Hematológico & Atlas</span>
          </button>

          <button
            onClick={() => setActiveSubTab('hil_dilution')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 cursor-pointer border ${
              activeSubTab === 'hil_dilution'
                ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/20'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Interferencias HIL & Diluciones</span>
          </button>

          <button
            onClick={() => setActiveSubTab('timers')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 cursor-pointer border ${
              activeSubTab === 'timers'
                ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/20'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Cronómetros de Mesón ({timers.filter(t => t.isRunning).length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('bloodbank')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 cursor-pointer border ${
              activeSubTab === 'bloodbank'
                ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/20'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Droplet className="w-4 h-4" />
            <span>Banco de Sangre & Aglutinación</span>
          </button>

          <button
            onClick={() => setActiveSubTab('biosafety')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 cursor-pointer border ${
              activeSubTab === 'biosafety'
                ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/20'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Bioseguridad & Temperaturas</span>
          </button>

          <button
            onClick={() => setActiveSubTab('cds_engine')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 cursor-pointer border ${
              activeSubTab === 'cds_engine'
                ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/30'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Brain className="w-4 h-4 text-amber-300" />
            <span>Soporte Decisiones Clínicas (CDS)</span>
            <span className="bg-indigo-900 text-indigo-200 text-[10px] px-2 py-0.5 rounded-full font-mono">
              AI-Reflex
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('tat_monitor')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 cursor-pointer border ${
              activeSubTab === 'tat_monitor'
                ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-lg shadow-rose-500/30'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Timer className="w-4 h-4 text-rose-400" />
            <span>Monitor TAT Crítico SLA</span>
            {tatSamples.filter(s => s.status !== 'COMPLETADO' && getSampleTrafficLight(s) === 'ROJO').length > 0 && (
              <span className="bg-rose-950 text-rose-300 border border-rose-500/50 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center space-x-1">
                <span>🔴</span>
                <span>{tatSamples.filter(s => s.status !== 'COMPLETADO' && getSampleTrafficLight(s) === 'ROJO').length} Críticos</span>
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('audit_trail')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 cursor-pointer border ${
              activeSubTab === 'audit_trail'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <History className="w-4 h-4 text-amber-400" />
            <span>Auditoría en Tiempo Real ISO 15189</span>
            <span className="bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
              Trazabilidad 100%
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('inter_branch_chat')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 cursor-pointer border ${
              activeSubTab === 'inter_branch_chat'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>Mensajería Inter-Sedes</span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>WSS En Vivo</span>
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('rejected_samples')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 cursor-pointer border ${
              activeSubTab === 'rejected_samples'
                ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/30'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Gestión Muestras Rechazadas</span>
            <span className="bg-rose-500/20 text-rose-300 border border-rose-400/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
              <span>Re-muestreo STAT</span>
            </span>
          </button>
        </div>
      </div>

      {/* SAFETY LOG NOTICE TOAST BANNER */}
      {safetyLogNotice && (
        <div className="bg-slate-900 border-2 border-emerald-500 text-emerald-300 p-4 rounded-2xl shadow-2xl flex items-center justify-between space-x-3 animate-bounce">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-emerald-500/20 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </span>
            <span className="text-xs font-bold font-mono">{safetyLogNotice}</span>
          </div>
          <button onClick={() => setSafetyLogNotice(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ACTIVE WORK ORDERS QUEUE & BIOHAZARD PROTOCOL LAUNCHER BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h2 className="text-base font-black text-white">Órdenes de Trabajo & Alerta Bioseguridad en Mesón</h2>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                ISO 15189 / CDC Protocols
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Seleccione una orden para abrir en la estación. Las muestras catalogadas como de <strong className="text-rose-400">alta peligrosidad biológica (BSL-2 / BSL-3)</strong> activarán automáticamente la capa visual de alerta de bioseguridad.
            </p>
          </div>

          {activeWorkOrderInWorkbench ? (
            <div className="bg-emerald-950/80 border border-emerald-500/50 p-2.5 px-4 rounded-2xl flex items-center space-x-3 shrink-0">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <div className="text-[10px] text-emerald-400 font-mono font-bold uppercase">Orden Activa en Mesón:</div>
                <div className="text-xs font-black text-white font-mono">
                  #{activeWorkOrderInWorkbench.orderNumber} • {activeWorkOrderInWorkbench.patientName}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl font-bold self-start sm:self-auto">
              Ninguna orden abierta en mesón
            </span>
          )}
        </div>

        {/* WORK ORDERS LIST CAROUSEL / GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {biosafetyWorkOrders.map(order => {
            const isOpened = activeWorkOrderInWorkbench?.id === order.id;

            return (
              <div
                key={order.id}
                className={`p-4 rounded-2xl border transition relative space-y-3 ${
                  isOpened
                    ? 'bg-slate-900 border-emerald-500/80 ring-1 ring-emerald-500/50 shadow-xl'
                    : order.isHighBiohazard
                    ? 'bg-slate-950 border-rose-500/40 hover:border-rose-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400">#{order.orderNumber}</span>
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                        {order.sampleBarcode}
                      </span>
                    </div>
                    <h3 className="text-xs font-black text-white mt-1">{order.patientName}</h3>
                    <p className="text-[11px] text-slate-400">{order.location}</p>
                  </div>

                  {order.isHighBiohazard && order.biosafetyProtocol ? (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono uppercase flex items-center space-x-1 ${
                      order.biosafetyProtocol.bslLevel === 'BSL-3'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      <AlertOctagon className="w-3 h-3" />
                      <span>{order.biosafetyProtocol.bslLevel}</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-teal-400 bg-teal-500/10 border border-teal-500/20">
                      BSL-1 Rutina
                    </span>
                  )}
                </div>

                <div className="text-[11px] bg-slate-900/80 p-2 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="text-slate-300 font-bold truncate">Muestra: {order.sampleType}</div>
                  <div className="text-slate-400 text-[10px] truncate">Exámenes: {order.requestedTests.join(', ')}</div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className={`text-[10px] font-mono font-bold ${
                    order.urgency.includes('STAT') ? 'text-rose-400' : 'text-slate-400'
                  }`}>
                    {order.urgency}
                  </span>

                  <button
                    onClick={() => handleOpenWorkOrder(order)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 ${
                      isOpened
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : order.isHighBiohazard
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isOpened ? 'Orden en Mesón' : '⚡ Abrir Orden'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- SUB-TAB 1: HEMATOLOGY DIFFERENTIAL COUNTER & ATLAS --- */}
      {activeSubTab === 'hematology' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Differential Counter Main Panel */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center space-x-2">
                  <span>Contador Digital de Diferencial (100 Células)</span>
                  <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
                    Atajos Teclado [1-8]
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Usa los botones o teclas numéricas para registrar el diferencial leucocitario.</p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-slate-950 px-3 py-2 rounded-2xl border border-slate-800 flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-400">Leucocitos Totales (WBC):</span>
                  <input
                    type="number"
                    step="0.1"
                    value={wbcTotal}
                    onChange={(e) => setWbcTotal(parseFloat(e.target.value) || 0)}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg text-center font-mono font-bold text-teal-300 text-xs py-1"
                  />
                  <span className="text-[10px] font-mono text-slate-500">x10³/µL</span>
                </div>

                <button
                  onClick={handleResetCounter}
                  className="bg-slate-800 hover:bg-rose-950/60 text-rose-300 border border-rose-500/30 px-3 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar (R)</span>
                </button>
              </div>
            </div>

            {/* Total Counter Progress Gauge */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono font-bold">
                <span className="text-slate-300 flex items-center space-x-2">
                  <span>Total Células Contadas:</span>
                  <strong className="text-lg text-teal-400">{totalCount} / 100</strong>
                </span>
                <span className={totalCount === 100 ? 'text-emerald-400 font-black animate-pulse' : totalCount > 100 ? 'text-amber-400' : 'text-slate-400'}>
                  {totalCount === 100 ? '✅ CONTEO COMPLETADO (100 CÉLULAS)' : totalCount > 100 ? '⚠️ Exceso >100' : `${100 - totalCount} restantes`}
                </span>
              </div>

              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-200 ${
                    totalCount === 100 ? 'bg-gradient-to-r from-teal-400 to-emerald-400' : 'bg-teal-500'
                  }`}
                  style={{ width: `${Math.min(totalCount, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Interactive Cell Keypad Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'neutrophils', label: 'Neutrófilos Seg.', hotkey: '1', color: 'border-blue-500/40 bg-blue-500/10 text-blue-300' },
                { key: 'lymphocytes', label: 'Linfocitos', hotkey: '2', color: 'border-purple-500/40 bg-purple-500/10 text-purple-300' },
                { key: 'monocytes', label: 'Monocitos', hotkey: '3', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
                { key: 'eosinophils', label: 'Eosinófilos', hotkey: '4', color: 'border-rose-500/40 bg-rose-500/10 text-rose-300' },
                { key: 'basophils', label: 'Basófilos', hotkey: '5', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
                { key: 'bandCells', label: 'Neutrófilos Bandas', hotkey: '6', color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' },
                { key: 'blasts', label: 'Blastos / Inmaduros', hotkey: '7', color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300' },
                { key: 'nrbc', label: 'Eritroblastos (NRBC)', hotkey: '8', color: 'border-slate-500/40 bg-slate-800/40 text-slate-300' },
              ].map((cell) => {
                const countVal = counts[cell.key as keyof LeukocyteCount];
                const pct = totalCount > 0 ? ((countVal / totalCount) * 100).toFixed(1) : '0.0';
                const absoluteVal = ((countVal / (totalCount || 100)) * wbcTotal).toFixed(2);

                return (
                  <button
                    key={cell.key}
                    onClick={() => handleCellClick(cell.key as keyof LeukocyteCount)}
                    className={`p-4 rounded-2xl border text-left transition transform active:scale-95 cursor-pointer hover:brightness-125 flex flex-col justify-between space-y-2 ${cell.color}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-extrabold">{cell.label}</span>
                      <span className="text-[10px] font-mono font-bold bg-slate-950/80 border border-slate-700 px-1.5 py-0.5 rounded text-white">
                        [{cell.hotkey}]
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-2xl font-black text-white">{countVal}</span>
                      <span className="text-xs font-mono font-bold text-slate-300">{pct}%</span>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 border-t border-white/10 pt-1">
                      Absoluto: <strong className="text-teal-300">{absoluteVal}</strong> x10³/µL
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Poikilocytosis & RBC Alterations Atlas */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Atlas de Poiquilocitosis & Inclusiones</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Clasificación graduada de morfología eritrocitaria en frotis.</p>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
              {poikilocytes.map(item => (
                <div key={item.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-white text-xs">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.description}</p>
                    </div>

                    <select
                      value={item.grade}
                      onChange={(e) => handleUpdateGrade(item.id, e.target.value as PoikilocyteItem['grade'])}
                      className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg border cursor-pointer ${
                        item.grade === 'AUSENTE'
                          ? 'bg-slate-900 text-slate-500 border-slate-800'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      <option value="AUSENTE">AUSENTE</option>
                      <option value="1+">1+ (Leve)</option>
                      <option value="2+">2+ (Moderado)</option>
                      <option value="3+">3+ (Marcado)</option>
                      <option value="4+">4+ (Severo)</option>
                    </select>
                  </div>

                  <div className="text-[10px] bg-slate-900/80 p-2 rounded-xl text-slate-400 border border-slate-800">
                    <strong className="text-teal-400">Asociación Clínica:</strong> {item.clinicalSignificance}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 2: HIL INTERFERENCES & SERIAL DILUTION --- */}
      {activeSubTab === 'hil_dilution' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Serum HIL Index Visual Inspector & Flag Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <FlaskConical className="w-5 h-5 text-teal-400" />
                <span>Índices HIL & Reglas de Auto-Supresión por Interferencia</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Evalúa el grado de hemólisis, ictericia y lipemia del suero y su impacto espectrofotométrico.</p>
            </div>

            {/* Interactive HIL Selectors */}
            <div className="space-y-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              {/* Hemolysis */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-rose-400">🩸 Hemólisis (H): Grade {hemolysisLevel}+</span>
                  <span className="text-[10px] font-mono text-slate-400">{hemolysisLevel * 50} mg/dL Hb libre</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={hemolysisLevel}
                  onChange={(e) => setHemolysisLevel(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Icterus */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-400">🟡 Ictericia (I): Grade {icterusLevel}+</span>
                  <span className="text-[10px] font-mono text-slate-400">{icterusLevel * 10} mg/dL Bilirrubina</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={icterusLevel}
                  onChange={(e) => setIcterusLevel(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Lipemia */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">⚪ Lipemia (L): Grade {lipemiaLevel}+</span>
                  <span className="text-[10px] font-mono text-slate-400">{lipemiaLevel * 150} mg/dL Triglicéridos</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={lipemiaLevel}
                  onChange={(e) => setLipemiaLevel(Number(e.target.value))}
                  className="w-full accent-slate-300 cursor-pointer"
                />
              </div>
            </div>

            {/* Affected Analytes Warning Matrix */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                Estado de Parámetros en Autoanalizador:
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className={`p-3 rounded-2xl border ${hemolysisLevel >= 2 ? 'bg-rose-950/60 border-rose-500/50 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                  <div className="font-extrabold flex justify-between">
                    <span>Potasio (K+)</span>
                    <span>{hemolysisLevel >= 2 ? '🚫 RECHAZADO' : '✅ VÁLIDO'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Liberación de K+ intraeritrocitario sesga falsamente elevado.</p>
                </div>

                <div className={`p-3 rounded-2xl border ${hemolysisLevel >= 2 ? 'bg-rose-950/60 border-rose-500/50 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                  <div className="font-extrabold flex justify-between">
                    <span>Lactato Deshidrogenasa (LDH)</span>
                    <span>{hemolysisLevel >= 2 ? '🚫 RECHAZADO' : '✅ VÁLIDO'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">LDH eritrocitaria alta induce error sistemático positivo.</p>
                </div>

                <div className={`p-3 rounded-2xl border ${lipemiaLevel >= 3 ? 'bg-amber-950/60 border-amber-500/50 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                  <div className="font-extrabold flex justify-between">
                    <span>Hemoglobina (Hb)</span>
                    <span>{lipemiaLevel >= 3 ? '⚠️ RE-CENTRIFUGAR' : '✅ VÁLIDO'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Turbidez quilomicrónica interfiere lectura a 540 nm.</p>
                </div>

                <div className={`p-3 rounded-2xl border ${icterusLevel >= 3 ? 'bg-amber-950/60 border-amber-500/50 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                  <div className="font-extrabold flex justify-between">
                    <span>Creatinina (Jaffé)</span>
                    <span>{icterusLevel >= 3 ? '⚠️ DILUIR' : '✅ VÁLIDO'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Bilirrubina compite cromogénicamente con picrato alcalino.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Serial Dilution & Range Extender Calculator */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span>Calculadora de Diluciones Seriadas (AMR)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Calcula volúmenes exactos de muestra y diluyente (Salina 0.9%) para muestras fuera de rango lineal.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Nombre del Analito:</label>
                  <input
                    type="text"
                    value={analyteName}
                    onChange={(e) => setAnalyteName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Valor Crudo Leído (Analizador):</label>
                  <input
                    type="number"
                    value={rawAnalyteValue}
                    onChange={(e) => setRawAnalyteValue(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-teal-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Factor de Dilución:</label>
                  <select
                    value={dilutionFactor}
                    onChange={(e) => setDilutionFactor(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold cursor-pointer"
                  >
                    <option value={2}>1:2 (Mitad)</option>
                    <option value={5}>1:5</option>
                    <option value={10}>1:10 (Estándar)</option>
                    <option value={20}>1:20</option>
                    <option value={50}>1:50</option>
                    <option value={100}>1:100 (Alta)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Volumen Total Deseado (µL):</label>
                  <input
                    type="number"
                    step="50"
                    value={totalDesiredVolumeUl}
                    onChange={(e) => setTotalDesiredVolumeUl(Number(e.target.value) || 100)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-300 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Calculation Output Card */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-500/30 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center font-mono">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Volumen Muestra / Suero:</span>
                    <strong className="text-lg text-teal-400 block">{sampleVolumeUl} µL</strong>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Volumen Salina / Buffer:</span>
                    <strong className="text-lg text-indigo-300 block">{diluentVolumeUl} µL</strong>
                  </div>
                </div>

                <div className="bg-indigo-950/60 p-4 rounded-xl border border-indigo-500/40 text-center space-y-1">
                  <span className="text-[10px] font-mono text-indigo-200 uppercase font-bold block">
                    VALOR FINAL REPORTABLE MULTIPLICADO (x{dilutionFactor}):
                  </span>
                  <div className="text-2xl font-black text-white font-mono">
                    {correctedFinalValue.toLocaleString()} <span className="text-sm font-normal text-teal-300">U/L</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Sustancia: {analyteName} • Nota al informe: "Resultado obtenido previa dilución {1}:{dilutionFactor} en solución salina isotónica 0.9%".
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 3: BENCH MULTI-TIMER --- */}
      {activeSubTab === 'timers' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-teal-400" />
                  <span>Cronómetros de Mesón Multicanal</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Controla tiempos de centrifugación, coloraciones de Wright/Gram, retracción de coágulo y VDRL simultáneamente.</p>
              </div>

              {/* Add Custom Timer Form */}
              <form onSubmit={handleAddCustomTimer} className="flex items-center space-x-2 text-xs">
                <input
                  type="text"
                  placeholder="Ej. Incubación Enzima"
                  value={newTimerLabel}
                  onChange={(e) => setNewTimerLabel(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold w-40"
                />
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={newTimerMinutes}
                  onChange={(e) => setNewTimerMinutes(Number(e.target.value) || 1)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-teal-300 font-mono font-bold w-16 text-center"
                />
                <span className="text-slate-400 font-mono">min</span>
                <button
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-3 py-2 rounded-xl transition flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar</span>
                </button>
              </form>
            </div>

            {/* Timers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {timers.map(timer => {
                const progressPct = ((timer.durationSeconds - timer.remainingSeconds) / timer.durationSeconds) * 100;
                const isFinished = timer.remainingSeconds === 0;

                return (
                  <div
                    key={timer.id}
                    className={`p-5 rounded-2xl border transition space-y-4 ${
                      isFinished
                        ? 'bg-rose-950/80 border-rose-500 animate-pulse'
                        : timer.isRunning
                        ? 'bg-slate-950 border-teal-500/50 shadow-lg shadow-teal-500/5'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-indigo-300 font-bold uppercase block">{timer.category}</span>
                        <h3 className="font-extrabold text-white text-xs truncate max-w-[160px]">{timer.label}</h3>
                      </div>

                      <button
                        onClick={() => deleteTimer(timer.id)}
                        className="text-slate-600 hover:text-rose-400 p-1 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Clock Display */}
                    <div className="text-center py-2 font-mono">
                      <span className={`text-3xl font-black ${isFinished ? 'text-rose-400' : timer.isRunning ? 'text-teal-400' : 'text-slate-300'}`}>
                        {formatTime(timer.remainingSeconds)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-300 ${isFinished ? 'bg-rose-500' : 'bg-teal-400'}`}
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>

                    {/* Timer Controls */}
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => toggleTimer(timer.id)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1 cursor-pointer ${
                          timer.isRunning
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                        }`}
                      >
                        {timer.isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{timer.isRunning ? 'Pausar' : 'Iniciar'}</span>
                      </button>

                      <button
                        onClick={() => resetTimer(timer.id)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
                        title="Reiniciar temporizador"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 4: BLOOD BANK COMPATIBILITY --- */}
      {activeSubTab === 'bloodbank' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <Droplet className="w-5 h-5 text-rose-500" />
                <span>Matriz de Compatibilidad Donante / Receptor</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Verificación instantánea de grupos sanguíneos ABO/Rh para eritroconcentrados.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <label className="text-slate-300 font-bold block">Grupo Donante (Bolsa):</label>
                <select
                  value={donorGroup}
                  onChange={(e) => setDonorGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono font-bold cursor-pointer"
                >
                  <option value="O_NEG">O Rh Negativo (O-)</option>
                  <option value="O_POS">O Rh Positivo (O+)</option>
                  <option value="A_NEG">A Rh Negativo (A-)</option>
                  <option value="A_POS">A Rh Positivo (A+)</option>
                  <option value="B_NEG">B Rh Negativo (B-)</option>
                  <option value="B_POS">B Rh Positivo (B+)</option>
                  <option value="AB_NEG">AB Rh Negativo (AB-)</option>
                  <option value="AB_POS">AB Rh Positivo (AB+)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 font-bold block">Grupo Paciente (Receptor):</label>
                <select
                  value={recipientGroup}
                  onChange={(e) => setRecipientGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono font-bold cursor-pointer"
                >
                  <option value="O_NEG">O Rh Negativo (O-)</option>
                  <option value="O_POS">O Rh Positivo (O+)</option>
                  <option value="A_NEG">A Rh Negativo (A-)</option>
                  <option value="A_POS">A Rh Positivo (A+)</option>
                  <option value="B_NEG">B Rh Negativo (B-)</option>
                  <option value="B_POS">B Rh Positivo (B+)</option>
                  <option value="AB_NEG">AB Rh Negativo (AB-)</option>
                  <option value="AB_POS">AB Rh Positivo (AB+)</option>
                </select>
              </div>
            </div>

            {/* Compatibility Badge Result */}
            <div className={`p-5 rounded-2xl border text-center space-y-2 ${
              compatibility.isCompatible
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
            }`}>
              <div className="text-xs font-mono font-bold uppercase tracking-wider">Resultado de Compatibilidad Serológica:</div>
              <div className="text-xl font-black">
                {compatibility.isCompatible ? '✅ COMPATIBLE PARA TRANSFUSIÓN' : '🚫 INCOMPATIBLE'}
              </div>
              <p className="text-xs text-slate-300 font-mono">{compatibility.notes}</p>
            </div>
          </div>

          {/* Crossmatch Agglutination Recorder */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                <span>Registro de Prueba Cruzada (Gel / Tubo)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Graduación de aglutinación serológica y control de Coombs.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">Grado de Aglutinación en Prueba Cruzada Mayor:</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {['0', '1+', '2+', '3+', '4+', 'MF'].map(grade => (
                    <button
                      key={grade}
                      onClick={() => setCrossmatchGrade(grade)}
                      className={`py-2 rounded-xl text-xs font-mono font-black border transition cursor-pointer ${
                        crossmatchGrade === grade
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">Validación Células de Control Coombs:</h4>
                  <p className="text-[10px] text-slate-400">Verifica reactivo AGH activo (Células sensibilizadas IgG).</p>
                </div>

                <button
                  onClick={() => setCoombsControlChecked(!coombsControlChecked)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                    coombsControlChecked ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{coombsControlChecked ? 'Coombs Check OK (+)' : 'Pendiente'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 6: CLINICAL DECISION SUPPORT (CDS) SYSTEM --- */}
      {activeSubTab === 'cds_engine' && (
        <div className="space-y-8">
          {/* CDS TOP SUMMARY METRICS & PROTOCOL BANNER */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute -top-10 -right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center space-x-2.5">
                  <span className="p-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-2xl">
                    <Brain className="w-6 h-6" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Clinical Decision Support System (CDS) & Reflex Engine
                  </h2>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                    CAP / CLSI Compliant
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  El sistema analiza los resultados analíticos en tiempo real, contrasta valores contra guías clínicas internacionales (ESC, ATA, ISTH, ADA, WHO) y genera sugerencias automáticas de pruebas confirmatorias (Reflex Testing) con justificación fisiopatológica.
                </p>
              </div>

              {/* KPI BADGES */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/80 border border-indigo-500/30 p-3 rounded-2xl text-center">
                  <div className="text-xs text-indigo-300 font-bold">Reglas Activas</div>
                  <div className="text-xl font-black text-white font-mono">{cdsRules.length} Protocolos</div>
                  <div className="text-[10px] text-slate-400">Guías Internacionales</div>
                </div>

                <div className="bg-slate-950/80 border border-rose-500/30 p-3 rounded-2xl text-center">
                  <div className="text-xs text-rose-300 font-bold">Alertas en Cola</div>
                  <div className="text-xl font-black text-rose-400 font-mono">{patientScenarios.length} Pacientes</div>
                  <div className="text-[10px] text-slate-400">Pánico / Críticos</div>
                </div>

                <div className="bg-slate-950/80 border border-emerald-500/30 p-3 rounded-2xl text-center col-span-2 sm:col-span-1">
                  <div className="text-xs text-emerald-300 font-bold">Modo Reflex</div>
                  <div className="text-xl font-black text-emerald-400 font-mono">AUTO-SUGERENCIA</div>
                  <div className="text-[10px] text-slate-400">Validación TM</div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN TWO-COLUMN WORKBENCH FOR CDS PATIENT ANALYSIS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: PATIENT QUEUE SELECTOR */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
                  <Stethoscope className="w-4 h-4 text-indigo-400" />
                  <span>Muestras Evaluadas por CDS</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">{patientScenarios.length} pendientes</span>
              </div>

              <div className="space-y-3">
                {patientScenarios.map(scen => {
                  const isSelected = scen.id === selectedScenarioId;
                  const primaryTrigger = scen.cdsTriggers[0];

                  return (
                    <button
                      key={scen.id}
                      onClick={() => setSelectedScenarioId(scen.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500'
                          : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                            Muestra #{scen.sampleId}
                          </span>
                          <h4 className="text-sm font-black text-white mt-1.5">{scen.patientName}</h4>
                          <p className="text-[11px] text-slate-400">{scen.ageGender} • {scen.location}</p>
                        </div>

                        {primaryTrigger && (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black font-mono uppercase ${
                            primaryTrigger.riskLevel === 'CRITICO'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {primaryTrigger.riskLevel}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-mono">{scen.primaryPanel}</span>
                        <span className="text-teal-400 font-bold flex items-center space-x-1">
                          <span>{scen.orderedReflexTests.length} Reflex Seleccionado(s)</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: ACTIVE PATIENT DETAILED CDS EVALUATION */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl relative">
                {/* PATIENT HEADER INFO */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                        Muestra: #{activeScenario.sampleId}
                      </span>
                      <span className="text-xs text-slate-400">Ubicación: {activeScenario.location}</span>
                    </div>
                    <h2 className="text-xl font-black text-white mt-1">{activeScenario.patientName}</h2>
                    <p className="text-xs text-slate-400">{activeScenario.ageGender} • Panel Primario: <span className="text-slate-200 font-bold">{activeScenario.primaryPanel}</span></p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-teal-300 flex items-center space-x-1.5">
                      <Activity className="w-4 h-4 text-teal-400" />
                      <span>Analizador LIS Conectado</span>
                    </span>
                  </div>
                </div>

                {/* MEASURED LAB VALUES PANEL */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valores de Laboratorio Reportados por el Equipo:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(activeScenario.labValues).map(([key, val]) => (
                      <div key={key} className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                        <div className="text-[11px] text-slate-400 font-bold">{key}</div>
                        <div className="text-base font-black text-white font-mono mt-0.5">{val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TRIGGERED CDS ALERT & REFLEX SUGGESTIONS */}
                {activeScenario.cdsTriggers.map(trigger => (
                  <div key={trigger.id} className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/20 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">{trigger.code} • {trigger.category}</span>
                          <h4 className="text-sm font-black text-white">{trigger.triggerCondition}</h4>
                        </div>
                      </div>

                      <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-mono font-black ${
                        trigger.riskLevel === 'CRITICO'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        Nivel de Riesgo: {trigger.riskLevel}
                      </span>
                    </div>

                    {/* RATIONALE STATEMENT */}
                    <div className="bg-indigo-950/40 border border-indigo-500/20 p-3.5 rounded-xl space-y-1 text-xs">
                      <span className="font-bold text-indigo-300 block flex items-center space-x-1.5">
                        <Info className="w-3.5 h-3.5" />
                        <span>Justificación Fisiopatológica & Criterio Clínico:</span>
                      </span>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{trigger.clinicalRationale}</p>
                    </div>

                    {/* SUGGESTED REFLEX TESTS LIST */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pruebas Confirmatorias (Reflex) Sugeridas por Protocolo:</span>
                        </h5>
                        <span className="text-[10px] font-mono text-slate-400">{trigger.guidelineSource}</span>
                      </div>

                      <div className="space-y-2">
                        {trigger.suggestedReflexTests.map(testName => {
                          const isOrdered = activeScenario.orderedReflexTests.includes(testName);

                          return (
                            <div
                              key={testName}
                              className={`p-3 rounded-xl border flex items-center justify-between transition ${
                                isOrdered
                                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5">
                                <span className={`p-1 rounded-lg ${isOrdered ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                  {isOrdered ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </span>
                                <span className="text-xs font-black">{testName}</span>
                              </div>

                              <button
                                onClick={() => handleToggleReflexTest(activeScenario.id, testName)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                                  isOrdered
                                    ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                                }`}
                              >
                                {isOrdered ? '✓ Orden Reflex Agregada' : '+ Añadir a Orden LIS'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* CAP/CLSI REFERENCE FOOTER */}
                    <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-800">
                      <span>Referencia Acreditación: {trigger.capClsiReference}</span>
                      <span className="text-indigo-400 font-bold">Estado: Pendiente Autorización TM</span>
                    </div>
                  </div>
                ))}

                {/* ACTION BAR */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    <span className="text-emerald-400 font-bold font-mono">{activeScenario.orderedReflexTests.length}</span> prueba(s) confirmatoria(s) lista(s) para ser enviadas al módulo de Muestras/LIS.
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => alert(`Notificación de Alerta Crítica enviada para el paciente ${activeScenario.patientName} (${activeScenario.sampleId}) al médico tratante.`)}
                      className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Notificar Médico (Valor Pánico)</span>
                    </button>

                    <button
                      onClick={() => alert(`Orden Reflex actualizada con éxito para muestra #${activeScenario.sampleId}. Se han generado las etiquetas de tubo adicionales.`)}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aprobar & Enviar Reflex a LIS</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* REAL-TIME INTERACTIVE ANALYTE EVALUATOR & SIMULATOR */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h3 className="text-lg font-black text-white flex items-center space-x-2">
                  <Search className="w-5 h-5 text-amber-400" />
                  <span>Simulador Evaluador de Parámetros en Tiempo Real</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ingrese cualquier resultado analítico para probar las reglas de decisión clínica y sugerencias de pruebas reflex instantáneas.
                </p>
              </div>

              {/* QUICK PRESET BUTTONS */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono uppercase mr-1">Probar presets:</span>
                {[
                  { label: 'Troponina I (3.42)', name: 'Troponina I', val: 3.42 },
                  { label: 'TSH (14.8)', name: 'TSH Tirotropina', val: 14.8 },
                  { label: 'TTPa (68.4)', name: 'TTPa Coagulación', val: 68.4 },
                  { label: 'Hemoglobina (7.2)', name: 'Hemoglobina', val: 7.2 },
                  { label: 'Glucosa (350)', name: 'Glucosa', val: 350 },
                  { label: 'Proteínas (9.2)', name: 'Proteínas Totales', val: 9.2 }
                ].map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setCustomAnalyteName(preset.name);
                      setCustomAnalyteValue(preset.val);
                    }}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-indigo-950 text-indigo-300 border border-slate-800 hover:border-indigo-500/50 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FORM INPUTS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">Nombre del Analito / Examen:</label>
                <input
                  type="text"
                  value={customAnalyteName}
                  onChange={(e) => setCustomAnalyteName(e.target.value)}
                  placeholder="ej. Troponina I, TSH, TTPa, Hemoglobina..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">Valor Medido en Muestra:</label>
                <input
                  type="number"
                  step="0.01"
                  value={customAnalyteValue}
                  onChange={(e) => setCustomAnalyteValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono font-bold text-center text-sm"
                />
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => alert(`Evaluación CDS ejecutada para ${customAnalyteName} = ${customAnalyteValue}`)}
                  className="w-full p-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition shadow-lg cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Brain className="w-4 h-4 text-amber-300" />
                  <span>Evaluar Regla de Decisión CDS</span>
                </button>
              </div>
            </div>

            {/* EVALUATION OUTPUT CARD */}
            {customCdsResult ? (
              <div className="bg-slate-950 border border-emerald-500/50 rounded-2xl p-5 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                      <Sparkles className="w-5 h-5" />
                    </span>
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Regla Disparada: {customCdsResult.code} ({customCdsResult.category})</span>
                      <h4 className="text-sm font-black text-white">{customCdsResult.triggerCondition}</h4>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-black ${
                    customCdsResult.riskLevel === 'CRITICO' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {customCdsResult.riskLevel}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <strong className="text-indigo-300 block mb-1">Fundamento Clínico:</strong>
                  {customCdsResult.clinicalRationale}
                </p>

                <div className="space-y-1.5">
                  <span className="text-xs font-extrabold text-white block">Pruebas Confirmatorias (Reflex) Sugeridas:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {customCdsResult.suggestedReflexTests.map(t => (
                      <div key={t} className="bg-indigo-950/60 border border-indigo-500/30 p-2.5 rounded-xl text-xs font-bold text-indigo-200 flex items-center space-x-1.5">
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl text-center space-y-1 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-bold text-slate-300">Valor dentro de Límites de Normalidad o Sin Criterio de Disparo Reflex</p>
                <p className="text-[11px] font-mono">Pruebe ingresando valores alterados (ej: Troponina &gt; 0.04, TSH &gt; 10, TTPa &gt; 42, Hemoglobina &lt; 8, Glucosa &gt; 300).</p>
              </div>
            )}
          </div>

          {/* FULL CATALOG OF CDS RULES & GUIDELINES REFERENCE TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-5">
              <div>
                <h3 className="text-lg font-black text-white flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <span>Catálogo de Protocolos CDS & Guías Clínicas Cómplices</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reglas estandarizadas de decisión clínica parametrizadas en el LIS bajo normativas CAP y CLSI.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 px-3 py-1.5 rounded-xl border border-teal-500/20">
                {cdsRules.length} Protocolos Cómplices
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cdsRules.map(rule => (
                <div key={rule.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-black text-indigo-400">{rule.code}</span>
                      <span className="text-xs font-bold text-slate-300">• {rule.category}</span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
                      rule.riskLevel === 'CRITICO' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {rule.riskLevel}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-white">{rule.triggerCondition}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{rule.clinicalRationale}</p>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-900">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Pruebas Reflex Asociadas:</span>
                    <ul className="text-[11px] text-teal-300 font-bold space-y-0.5">
                      {rule.suggestedReflexTests.map(t => (
                        <li key={t} className="flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 bg-teal-400 rounded-full"></span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-900/80 flex items-center justify-between">
                    <span>Guía: {rule.guidelineSource}</span>
                    <span>Acreditación: {rule.capClsiReference}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB: MONITOR DE TAT CRÍTICO & SEMÁFORO DE SLA --- */}
      {activeSubTab === 'tat_monitor' && (
        <div className="space-y-6 animate-fadeIn">
          {/* TOP METRICS & TRAFFIC LIGHT KPI HEADER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: CRITICAL / BREACHED SAMPLES */}
            <div className="bg-slate-900 border-2 border-rose-500/80 p-5 rounded-3xl space-y-2 shadow-2xl shadow-rose-500/10 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-rose-500/20 text-rose-400 rounded-2xl animate-pulse">
                  <AlertOctagon className="w-6 h-6" />
                </span>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {tatSamples.filter(s => s.status !== 'COMPLETADO' && getSampleTrafficLight(s) === 'ROJO').length} Muestras
              </div>
              <p className="text-xs text-rose-300 font-bold">🔴 Semáforo Rojo (&lt; 5 min o Vencido)</p>
            </div>

            {/* KPI 2: WARNING SAMPLES */}
            <div className="bg-slate-900 border border-amber-500/60 p-5 rounded-3xl space-y-2 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl">
                  <Clock className="w-6 h-6" />
                </span>
                <span className="text-amber-400 text-xs font-mono font-bold">SLA Rango Medio</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {tatSamples.filter(s => s.status !== 'COMPLETADO' && getSampleTrafficLight(s) === 'AMARILLO').length} Muestras
              </div>
              <p className="text-xs text-amber-300 font-bold">🟡 Semáforo Amarillo (6 - 15 min restantes)</p>
            </div>

            {/* KPI 3: SAFE SAMPLES */}
            <div className="bg-slate-900 border border-emerald-500/40 p-5 rounded-3xl space-y-2 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl">
                  <CheckCircle2 className="w-6 h-6" />
                </span>
                <span className="text-emerald-400 text-xs font-mono font-bold">Tiempo Seguro</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {tatSamples.filter(s => s.status !== 'COMPLETADO' && getSampleTrafficLight(s) === 'VERDE').length} Muestras
              </div>
              <p className="text-xs text-emerald-300 font-bold">🟢 Semáforo Verde (&gt; 15 min restantes)</p>
            </div>

            {/* KPI 4: GLOBAL SLA PERFORMANCE RATE */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl">
                  <Gauge className="w-6 h-6" />
                </span>
                <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  CAP / ISO 15189
                </span>
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">94.2% Cumplimiento</div>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '94.2%' }}></div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">SLA Target Lab: &gt; 95% en Muestras STAT</p>
              </div>
            </div>
          </div>

          {/* MAIN MONITOR CONTAINER WITH TRAFFIC LIGHT FILTERS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* TOOLBAR HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="p-2 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-xl">
                    <Timer className="w-5 h-5" />
                  </span>
                  <h2 className="text-lg font-black text-white">
                    Monitor en Tiempo Real de Turnaround Time (TAT) & Semáforo de SLA
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Alertas tempranas de riesgo de incumplimiento de tiempo de entrega para muestras críticas de urgencias, UCI y salas quirúrgicas.
                </p>
              </div>

              {/* FILTER CONTROLS */}
              <div className="flex flex-wrap items-center gap-2">
                {/* TRAFFIC LIGHT FILTER PILLS */}
                <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center space-x-1">
                  <button
                    onClick={() => setTatFilterStatus('TODOS')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      tatFilterStatus === 'TODOS'
                        ? 'bg-slate-800 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todos ({tatSamples.length})
                  </button>
                  <button
                    onClick={() => setTatFilterStatus('ROJO')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                      tatFilterStatus === 'ROJO'
                        ? 'bg-rose-500 text-slate-950 font-black shadow'
                        : 'text-rose-400 hover:bg-rose-500/10'
                    }`}
                  >
                    <span>🔴 Críticos</span>
                    <span className="font-mono">({tatSamples.filter(s => s.status !== 'COMPLETADO' && getSampleTrafficLight(s) === 'ROJO').length})</span>
                  </button>
                  <button
                    onClick={() => setTatFilterStatus('AMARILLO')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                      tatFilterStatus === 'AMARILLO'
                        ? 'bg-amber-500 text-slate-950 font-black shadow'
                        : 'text-amber-400 hover:bg-amber-500/10'
                    }`}
                  >
                    <span>🟡 Advertencia</span>
                    <span className="font-mono">({tatSamples.filter(s => s.status !== 'COMPLETADO' && getSampleTrafficLight(s) === 'AMARILLO').length})</span>
                  </button>
                  <button
                    onClick={() => setTatFilterStatus('VERDE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                      tatFilterStatus === 'VERDE'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow'
                        : 'text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    <span>🟢 En Rango</span>
                    <span className="font-mono">({tatSamples.filter(s => s.status !== 'COMPLETADO' && getSampleTrafficLight(s) === 'VERDE').length})</span>
                  </button>
                </div>

                {/* DEPARTMENT SELECTOR */}
                <select
                  value={tatFilterDept}
                  onChange={(e) => setTatFilterDept(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold p-2.5 rounded-2xl cursor-pointer focus:outline-none focus:border-indigo-500"
                >
                  <option value="TODOS">Todos los Departamentos</option>
                  <option value="Marcadores Cardíacos">Marcadores Cardíacos</option>
                  <option value="Gases Arteriales">Gases Arteriales</option>
                  <option value="Coagulación">Coagulación</option>
                  <option value="Hematología STAT">Hematología STAT</option>
                  <option value="Bioquímica">Bioquímica</option>
                </select>
              </div>
            </div>

            {/* SAMPLES GRID WITH LIVE SEMÁFORO COUNTDOWNS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tatSamples
                .filter(s => {
                  const tColor = getSampleTrafficLight(s);
                  if (tatFilterStatus !== 'TODOS' && tColor !== tatFilterStatus) return false;
                  if (tatFilterDept !== 'TODOS' && s.department !== tatFilterDept) return false;
                  return true;
                })
                .map(sample => {
                  const trafficColor = getSampleTrafficLight(sample);
                  const isCompleted = sample.status === 'COMPLETADO';
                  const remainingSec = (sample.slaMinutesTotal * 60) - sample.elapsedSeconds;
                  const remainingMin = Math.floor(remainingSec / 60);
                  const displaySec = Math.abs(remainingSec % 60);
                  const isBreached = remainingSec <= 0 && !isCompleted;
                  const elapsedPercent = Math.min(100, Math.round((sample.elapsedSeconds / (sample.slaMinutesTotal * 60)) * 100));

                  return (
                    <div
                      key={sample.id}
                      className={`p-5 rounded-3xl border transition relative space-y-4 shadow-xl ${
                        isCompleted
                          ? 'bg-slate-950/70 border-slate-800 opacity-75'
                          : trafficColor === 'ROJO'
                          ? 'bg-slate-950 border-rose-500/80 ring-2 ring-rose-500/40 shadow-rose-500/20'
                          : trafficColor === 'AMARILLO'
                          ? 'bg-slate-950 border-amber-500/70'
                          : 'bg-slate-950 border-emerald-500/40'
                      }`}
                    >
                      {/* HEADER BAR & TRAFFIC LIGHT BADGE */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              {sample.sampleBarcode}
                            </span>
                            <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded ${
                              sample.urgency.includes('STAT')
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {sample.urgency}
                            </span>
                          </div>
                          <h3 className="text-sm font-black text-white mt-1">{sample.patientName}</h3>
                          <p className="text-[11px] text-slate-400 truncate">{sample.patientLocation}</p>
                        </div>

                        {/* SEMÁFORO LAMP BADGE */}
                        <div className="shrink-0 text-right">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-black uppercase flex items-center space-x-1.5 ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : trafficColor === 'ROJO'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse'
                              : trafficColor === 'AMARILLO'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            <span>{isCompleted ? '🟢' : trafficColor === 'ROJO' ? '🔴' : trafficColor === 'AMARILLO' ? '🟡' : '🟢'}</span>
                            <span>{isCompleted ? 'COMPLETADO' : isBreached ? 'SLA BREACHED' : trafficColor === 'ROJO' ? 'CRÍTICO' : trafficColor === 'AMARILLO' ? 'ADVERTENCIA' : 'SEGURO'}</span>
                          </span>
                        </div>
                      </div>

                      {/* LIVE COUNTDOWN TIMER BANNER */}
                      <div className={`p-3.5 rounded-2xl border text-center space-y-1 ${
                        isCompleted
                          ? 'bg-slate-900 border-slate-800'
                          : isBreached
                          ? 'bg-rose-950/80 border-rose-500/80 text-rose-200 animate-pulse'
                          : trafficColor === 'ROJO'
                          ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                          : trafficColor === 'AMARILLO'
                          ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                          : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                      }`}>
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                          {isCompleted
                            ? 'Tiempo Final Procesado:'
                            : isBreached
                            ? '🚨 SLA INCUMPLIDO / TIEMPO EXCEDIDO:'
                            : '⏱️ Tiempo Restante de SLA:'}
                        </div>

                        <div className="text-xl sm:text-2xl font-black font-mono tracking-widest">
                          {isCompleted
                            ? `${Math.floor(sample.elapsedSeconds / 60)} min ${sample.elapsedSeconds % 60} s`
                            : isBreached
                            ? `-${Math.abs(remainingMin)} min ${displaySec} s`
                            : `${remainingMin} min ${displaySec.toString().padStart(2, '0')} s`}
                        </div>

                        {/* PROGRESS BAR */}
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted
                                ? 'bg-emerald-500'
                                : isBreached
                                ? 'bg-rose-600'
                                : trafficColor === 'ROJO'
                                ? 'bg-rose-500'
                                : trafficColor === 'AMARILLO'
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                            style={{ width: `${elapsedPercent}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                          <span>SLA Total: {sample.slaMinutesTotal} min</span>
                          <span>Transcurrido: {Math.floor(sample.elapsedSeconds / 60)} min</span>
                        </div>
                      </div>

                      {/* EXAM & DEPARTMENT INFO */}
                      <div className="space-y-1.5 text-xs">
                        <div className="font-extrabold text-white">{sample.testName}</div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-mono">Dpto: {sample.department}</span>
                          <span className="text-indigo-300 font-mono">Recepción: {sample.receivedTime}</span>
                        </div>
                      </div>

                      {/* OPERATIONAL DELAY REASON BANNER (IF ANY) */}
                      {sample.delayReason && (
                        <div className="bg-amber-950/60 border border-amber-500/40 p-2.5 rounded-xl text-[11px] text-amber-200 space-y-0.5">
                          <span className="font-bold flex items-center space-x-1 text-amber-300">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Retraso Operativo Registrado:</span>
                          </span>
                          <p className="font-mono text-[10px] leading-tight">{sample.delayReason}</p>
                        </div>
                      )}

                      {/* EXPEDITED TAG */}
                      {sample.expedited && (
                        <div className="bg-rose-500/10 border border-rose-500/30 p-2 rounded-xl text-[10px] font-mono font-black text-rose-300 flex items-center justify-between">
                          <span className="flex items-center space-x-1">
                            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span>PRIORIDAD MÁXIMA EN LIS (EXPEDITED)</span>
                          </span>
                          <span className="animate-pulse">⚡ STAT</span>
                        </div>
                      )}

                      {/* ACTION BUTTONS */}
                      {!isCompleted && (
                        <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-2 text-xs">
                          <button
                            onClick={() => handleExpediteTatSample(sample.id)}
                            className={`p-2 rounded-xl font-bold transition flex items-center justify-center space-x-1 cursor-pointer text-[10px] ${
                              sample.expedited
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                            title="Agilizar en LIS"
                          >
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>{sample.expedited ? 'Priorizado' : 'Agilizar'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setDelayModalSample(sample);
                              setDelayReasonInput(sample.delayReason || '');
                            }}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition flex items-center justify-center space-x-1 cursor-pointer text-[10px]"
                            title="Reportar Retraso"
                          >
                            <Bell className="w-3 h-3 text-amber-300" />
                            <span>Retraso</span>
                          </button>

                          <button
                            onClick={() => handleCompleteTatSample(sample.id)}
                            className="p-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer text-[10px] shadow-lg shadow-emerald-600/20"
                            title="Validar y Liberar TAT"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Liberar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* SLA POLICIES REFERENCE TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs">
            <h3 className="font-black text-white text-sm flex items-center space-x-2 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Estándares Internos de SLA LIS por Departamento (ISO 15189)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Marcadores Cardíacos:</span>
                <span className="text-rose-400 font-extrabold text-xs block">SLA STAT: 30 min</span>
                <span className="text-[10px] text-slate-400 block">Troponina I, CK-MB Masa</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Gases Arteriales:</span>
                <span className="text-rose-400 font-extrabold text-xs block">SLA STAT: 15 min</span>
                <span className="text-[10px] text-slate-400 block">pH, pCO2, pO2, Lactato</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Coagulación Quirúrgica:</span>
                <span className="text-amber-400 font-extrabold text-xs block">SLA STAT: 45 min</span>
                <span className="text-[10px] text-slate-400 block">TP / INR, TTPa, Fibrinógeno</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Hematología STAT:</span>
                <span className="text-amber-400 font-extrabold text-xs block">SLA STAT: 30 min</span>
                <span className="text-[10px] text-slate-400 block">Hemograma Completo + Plaquetas</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Bioquímica General:</span>
                <span className="text-emerald-400 font-extrabold text-xs block">SLA Rutina: 90 min</span>
                <span className="text-[10px] text-slate-400 block">Perfil Renal, Hepático, Electrolitos</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OPERATIONAL DELAY REGISTRATION MODAL */}
      {delayModalSample && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Bell className="w-5 h-5" />
                </span>
                <h3 className="text-sm font-black text-white">Reportar Retraso Operativo LIS</h3>
              </div>
              <button onClick={() => setDelayModalSample(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-slate-950 p-3 rounded-2xl border border-slate-800 font-mono">
              <div className="text-slate-400">Muestra: <span className="text-white font-bold">#{delayModalSample.sampleBarcode}</span></div>
              <div className="text-slate-400">Examen: <span className="text-indigo-300 font-bold">{delayModalSample.testName}</span></div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-bold block">Seleccionar Preset de Causa Frecuente:</label>
              <div className="space-y-1.5">
                {[
                  'Muestra Hemolizada (HIL 3+) - Solicitada repetición de venopunción',
                  'Re-calibración de electrodo en analizador de gases',
                  'Fibrina presente en tubo - Recentrifugación a 3500 RPM',
                  'Verificación obligatoria de valor pánico con frotis manual',
                  'Interferencia por Lipemia alta - Ejecución de aclaramiento'
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDelayReasonInput(preset)}
                    className="w-full text-left p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-[11px] text-slate-300 transition cursor-pointer"
                  >
                    • {preset}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="text-slate-300 font-bold block mb-1">Motivo Detallado / Observación LIS:</label>
                <textarea
                  rows={3}
                  value={delayReasonInput}
                  onChange={(e) => setDelayReasonInput(e.target.value)}
                  placeholder="Ingrese detalles del inconveniente técnico u operativo..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDelayModalSample(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveDelayReason}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Registrar Retraso en LIS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB: HISTORIAL DE AUDITORÍA EN TIEMPO REAL ISO 15189 --- */}
      {activeSubTab === 'audit_trail' && (
        <div className="space-y-6 animate-fadeIn">
          {/* HEADER AUDIT CERTIFICATE STATUS & SAMPLE SELECTOR */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* TOP BAR WITH SAMPLE BARCODE SELECTOR & ACTION BUTTONS */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl">
                    <History className="w-6 h-6" />
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center space-x-2">
                      <span>Trazabilidad & Auditoría en Tiempo Real</span>
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Cadena ISO 15189 Verificada</span>
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Registro cronológico e inmutable de todas las acciones pre-analíticas, analíticas y post-analíticas ejecutadas sobre la muestra.
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowAddAuditEventModal(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-indigo-600/20 flex items-center space-x-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Evento Manual</span>
                </button>

                <button
                  onClick={handleExportAuditCertificate}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold rounded-2xl text-xs transition flex items-center space-x-2 cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Exportar Reporte ISO 15189</span>
                </button>
              </div>
            </div>

            {/* AUDITED SAMPLE SELECTOR BAR & ACTIVE SAMPLE DETAILS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* SELECTOR DROPDOWN */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Seleccionar Muestra para Auditoría:
                </label>
                <select
                  value={selectedAuditBarcode}
                  onChange={(e) => setSelectedAuditBarcode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold p-3 rounded-xl focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="BAR-CARD-01">BAR-CARD-01 | Troponina I Ultrasensible (Ríos, Gonzalo)</option>
                  <option value="BAR-GAS-02">BAR-GAS-02 | Gasometría Arterial (Morales, Valeria)</option>
                  <option value="BAR-COAG-03">BAR-COAG-03 | TTPa + TP Quirúrgico (Castillo, Esteban)</option>
                  <option value="BAR-HEM-04">BAR-HEM-04 | Hemograma STAT (Vega, Lucía)</option>
                  <option value="BAR-BIO-05">BAR-BIO-05 | Perfil Renal & Electrolitos (Paredes, Héctor)</option>
                </select>
              </div>

              {/* AUDITED SAMPLE ACTIVE SUMMARY */}
              {(() => {
                const sample = tatSamples.find(s => s.sampleBarcode === selectedAuditBarcode) || {
                  patientName: 'Ríos, Gonzalo A.',
                  patientLocation: 'Urgencias / Box Reanimación 1',
                  testName: 'Troponina I Ultrasensible + CK-MB Masa STAT',
                  orderNumber: 'ORD-2026-9001',
                  urgency: 'STAT / Crítico'
                };
                const activeEvents = auditEvents.filter(e => e.sampleBarcode === selectedAuditBarcode);

                return (
                  <div className="lg:col-span-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          #{selectedAuditBarcode}
                        </span>
                        <span className="font-mono text-slate-400">{sample.orderNumber}</span>
                        <span className="bg-rose-500/20 text-rose-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                          {sample.urgency}
                        </span>
                      </div>
                      <h3 className="font-black text-white text-sm">{sample.patientName}</h3>
                      <p className="text-slate-400 text-[11px]">{sample.testName} • {sample.patientLocation}</p>
                    </div>

                    <div className="shrink-0 space-y-1 text-right sm:border-l sm:border-slate-800 sm:pl-4">
                      <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Eventos de Auditoría</div>
                      <div className="text-xl font-black font-mono text-amber-400">{activeEvents.length} Eventos</div>
                      <div className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1 justify-end">
                        <Fingerprint className="w-3 h-3 text-emerald-400" />
                        <span>Firma SHA-256 OK</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* TIMELINE SEARCH & CATEGORY FILTERS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
                {['TODAS', 'INGRESO', 'VALIDACION', 'MODIFICACION', 'REENVASE', 'HIL_CHECK'].map(fType => (
                  <button
                    key={fType}
                    onClick={() => setAuditTypeFilter(fType)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap ${
                      auditTypeFilter === fType
                        ? 'bg-amber-400 text-slate-950 font-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {fType === 'TODAS' ? 'Todos los Eventos' : fType}
                  </button>
                ))}
              </div>

              {/* SEARCH INPUT */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  placeholder="Buscar en historial ISO..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* TIMELINE CONTAINER */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <h3 className="text-sm font-black text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Línea de Tiempo de Auditoría Improbable de Alterar (Cláusula ISO 15189 §7.3 - §7.4)</span>
            </h3>

            {(() => {
              const filteredList = auditEvents
                .filter(e => e.sampleBarcode === selectedAuditBarcode)
                .filter(e => auditTypeFilter === 'TODAS' || e.eventType === auditTypeFilter)
                .filter(e => {
                  if (!auditSearchQuery.trim()) return true;
                  const q = auditSearchQuery.toLowerCase();
                  return (
                    e.actionTitle.toLowerCase().includes(q) ||
                    e.description.toLowerCase().includes(q) ||
                    e.performedBy.toLowerCase().includes(q) ||
                    e.isoClause.toLowerCase().includes(q)
                  );
                });

              if (filteredList.length === 0) {
                return (
                  <div className="text-center py-12 space-y-3 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
                    <History className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-mono">No se encontraron eventos para los criterios seleccionados.</p>
                  </div>
                );
              }

              return (
                <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-amber-400 before:via-indigo-500 before:to-slate-800">
                  {filteredList.map((event) => {
                    const isIngreso = event.eventType === 'INGRESO';
                    const isValidacion = event.eventType === 'VALIDACION';
                    const isModificacion = event.eventType === 'MODIFICACION';
                    const isReenvase = event.eventType === 'REENVASE';

                    return (
                      <div key={event.id} className="relative group">
                        {/* TIMELINE NODE ICON */}
                        <div className={`absolute -left-6 sm:-left-8 top-0.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shadow-lg transition ${
                          isIngreso
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-emerald-500/20'
                            : isValidacion
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400 shadow-indigo-500/20'
                            : isModificacion
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-amber-500/20'
                            : isReenvase
                            ? 'bg-purple-500/20 text-purple-300 border-purple-400 shadow-purple-500/20'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                        }`}>
                          {isIngreso ? <Check className="w-3.5 h-3.5" /> : isValidacion ? <FileCheck className="w-3.5 h-3.5" /> : isModificacion ? <AlertTriangle className="w-3.5 h-3.5" /> : isReenvase ? <Layers className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                        </div>

                        {/* EVENT CARD */}
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition shadow-lg">
                          {/* TOP LINE: TITLE & BADGES */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                                  isIngreso ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : isValidacion ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : isModificacion ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : isReenvase ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-300'
                                }`}>
                                  {event.eventType}
                                </span>
                                <span className="text-[10px] font-mono text-amber-400/90 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                  {event.isoClause}
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-white mt-1">{event.actionTitle}</h4>
                            </div>

                            <div className="text-[11px] font-mono text-slate-400 shrink-0">
                              🕒 {event.timestamp}
                            </div>
                          </div>

                          {/* DESCRIPTION */}
                          <p className="text-xs text-slate-300 leading-relaxed font-sans">
                            {event.description}
                          </p>

                          {/* DIFF BOX IF MODIFICATION (PREVIOUS VS NEW VALUE) */}
                          {(event.previousValue || event.newValue) && (
                            <div className="bg-slate-900 border border-amber-500/40 p-3 rounded-xl space-y-1 text-xs font-mono">
                              <span className="text-amber-400 font-bold block text-[10px] uppercase">
                                🔄 Registro de Modificación de Valor / Dilución:
                              </span>
                              {event.previousValue && (
                                <div className="text-rose-300 line-through text-[11px]">
                                  Antes: {event.previousValue}
                                </div>
                              )}
                              {event.newValue && (
                                <div className="text-emerald-300 font-bold text-[11px]">
                                  Después: {event.newValue}
                                </div>
                              )}
                            </div>
                          )}

                          {/* ALIQUOT BADGE IF REENVASE */}
                          {event.aliquotCode && (
                            <div className="bg-purple-950/60 border border-purple-500/40 p-2.5 rounded-xl text-xs font-mono text-purple-200 flex items-center space-x-2">
                              <Layers className="w-4 h-4 text-purple-400" />
                              <span>Alícuota Secundaria Registrada: <strong className="text-white">{event.aliquotCode}</strong></span>
                            </div>
                          )}

                          {/* OPERATOR, WORKSTATION & SHA-256 HASH FOOTER */}
                          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
                            <div className="space-x-2">
                              <span className="text-slate-300 font-bold">👤 {event.performedBy}</span>
                              <span className="text-slate-500">({event.role})</span>
                            </div>

                            <div className="text-[10px] text-slate-500 truncate max-w-xs" title={event.integrityHash}>
                              <span className="text-emerald-400 font-bold">🔐 Hash: </span>
                              <span>{event.integrityHash}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR EVENTO MANUAL DE AUDITORÍA ISO 15189 */}
      {showAddAuditEventModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <History className="w-5 h-5" />
                </span>
                <h3 className="text-sm font-black text-white">Registrar Evento de Auditoría ISO 15189</h3>
              </div>
              <button onClick={() => setShowAddAuditEventModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAuditEventSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 font-mono text-[11px] space-y-1">
                <span className="text-slate-400">Muestra Auditada: <strong className="text-amber-400">#{selectedAuditBarcode}</strong></span>
                <span className="text-slate-400 block">Operador Digital: <strong className="text-slate-200">Lic. Valentina Soto (TM-4091)</strong></span>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Tipo de Evento:</label>
                <select
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value as AuditLogEvent['eventType'])}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 font-bold cursor-pointer"
                >
                  <option value="MODIFICACION">MODIFICACION (Corrección / Dilución / Recálculo)</option>
                  <option value="REENVASE">REENVASE (Alícuota Secundaria / Trasvase)</option>
                  <option value="VALIDACION">VALIDACION (Aprobación Técnica Especial)</option>
                  <option value="HIL_CHECK">HIL_CHECK (Evaluación de Calidad Pre-analítica)</option>
                  <option value="INGRESO">INGRESO (Verificación Adicional Recepción)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Título de la Acción:</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="ej. Reenvasado a vial secundario para congelado"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Descripción Detallada / Justificación:</label>
                <textarea
                  rows={3}
                  required
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  placeholder="Ingrese justificación detallada y observaciones de calidad..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-sans"
                ></textarea>
              </div>

              {newEventType === 'MODIFICACION' && (
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="space-y-1">
                    <label className="text-[10px] text-rose-300 font-bold block">Valor Anterior:</label>
                    <input
                      type="text"
                      value={newEventPrevVal}
                      onChange={(e) => setNewEventPrevVal(e.target.value)}
                      placeholder="ej. > 10,000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-[11px] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-emerald-300 font-bold block">Valor Nuevo:</label>
                    <input
                      type="text"
                      value={newEventNewVal}
                      onChange={(e) => setNewEventNewVal(e.target.value)}
                      placeholder="ej. 14,250"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-[11px] font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddAuditEventModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-amber-400/20 cursor-pointer"
                >
                  🔒 Firmar y Guardar Evento ISO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB: MENSAJERÍA INTERNA SEGURA (WEBSOCKETS) */}
      {activeSubTab === 'inter_branch_chat' && (
        <div className="space-y-6 animate-fadeIn">
          <SecureInternalMessagingWidget embeddedMode={true} />
        </div>
      )}

      {/* SUB-TAB: GESTIÓN DE MUESTRAS RECHAZADAS (RE-MUESTREO STAT) */}
      {activeSubTab === 'rejected_samples' && (
        <div className="space-y-6 animate-fadeIn">
          <RejectedSampleWizard embeddedMode={true} />
        </div>
      )}

      {activeSubTab === 'biosafety' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Equipment Temperatures Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <Shield className="w-5 h-5 text-teal-400" />
                <span>Registro Diario de Temperaturas (ISO 15189)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Control de temperatura de refrigeradores de reactivo, banco de sangre e incubadoras.</p>
            </div>

            <div className="space-y-3">
              {tempChecks.map(tc => (
                <div key={tc.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <h4 className="font-extrabold text-white">{tc.equipmentName}</h4>
                    <span className="text-[10px] font-mono text-slate-500">Rango Aceptable: {tc.targetRange}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      step="0.1"
                      value={tc.measuredTemp}
                      onChange={(e) => handleUpdateTemp(tc.id, parseFloat(e.target.value) || 0)}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-xl text-center font-mono font-black text-teal-300 text-sm py-1.5"
                    />
                    <span className="font-mono text-slate-400">{tc.unit}</span>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-black ${
                      tc.status === 'OPTIMO' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {tc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Biological Incident & Exposure Immediate Reporter */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <span>Reporte de Incidentes de Bioseguridad / Derrames</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Notificación inmediata de pinchazo o derrame biológico con activación de protocolo PEP.</p>
            </div>

            {incidentReportSubmitted ? (
              <div className="bg-emerald-950/80 border border-emerald-500/50 p-6 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-black text-white">Reporte de Bioseguridad Registrado Exitosamente</h3>
                <p className="text-xs text-slate-300 font-mono">Notificación enviada a Salud Ocupacional & Jefatura de Laboratorio. Protocolo PEP activado.</p>
              </div>
            ) : (
              <form onSubmit={handleReportIncident} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Tipo de Evento Biológico:</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-bold cursor-pointer"
                  >
                    <option value="Pinchazo con Aguja Usada">Pinchazo Accidental con Aguja Usada</option>
                    <option value="Derrame Biológico en Mesón">Derrame de Muestra / Fluido Corporal en Mesón</option>
                    <option value="Salpicadura Ocular / Mucosas">Salpicadura en Mucosa Ocular / Conjuntiva</option>
                    <option value="Rotura de Tubo en Centrífuga">Rotura de Tubo en Centrífuga (Aerosoles)</option>
                  </select>
                </div>

                <div className="bg-rose-950/40 border border-rose-500/30 p-3.5 rounded-xl space-y-1 text-rose-200">
                  <strong className="text-xs block font-extrabold">Acciones Inmediatas Obligatorias:</strong>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 text-slate-300">
                    <li>Lavar zona afectada con agua abundante y jabón germicida (mínimo 5 min).</li>
                    <li>No re-encapsular agujas bajo ninguna circunstancia.</li>
                    <li>Reportar inmediatamente al Comité de Infecciones Nosocomiales.</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl transition shadow-lg shadow-rose-600/20 cursor-pointer flex items-center justify-center space-x-2"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Enviar Alerta de Incidente a Salud Ocupacional</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- VISUAL ALERT LAYER MODAL: HIGH BIOHAZARD PROTOCOL MANDATORY CHECK (ISO 15189 / CDC) --- */}
      {showBiosafetyAlertModal && selectedOrderForModal && selectedOrderForModal.biosafetyProtocol && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="max-w-3xl w-full bg-slate-900 border-2 border-rose-500 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-rose-500/30 relative my-8">
            {/* GLOWING HEADER */}
            <div className="flex items-start justify-between border-b border-rose-500/30 pb-5">
              <div className="flex items-center space-x-3.5">
                <span className="p-3 bg-rose-500/20 text-rose-400 border border-rose-500/50 rounded-2xl animate-pulse">
                  <ShieldAlert className="w-8 h-8" />
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      ALERTA OBLIGATORIA DE BIOSEGURIDAD • {selectedOrderForModal.biosafetyProtocol.bslLevel}
                    </span>
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                      ISO 15189 / CDC Compliance
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                    Protocolo de Manejo de Muestra de Alta Peligrosidad
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setShowBiosafetyAlertModal(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ORDER & PATIENT INFORMATION SUMMARY CARD */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-mono text-[10px] block uppercase">Orden de Trabajo:</span>
                <span className="font-black text-white font-mono text-sm">#{selectedOrderForModal.orderNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono text-[10px] block uppercase">Código de Muestra:</span>
                <span className="font-bold text-indigo-400 font-mono">{selectedOrderForModal.sampleBarcode}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono text-[10px] block uppercase">Paciente:</span>
                <span className="font-bold text-white truncate block">{selectedOrderForModal.patientName}</span>
                <span className="text-[10px] text-slate-400">{selectedOrderForModal.location}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono text-[10px] block uppercase">Tipo de Muestra:</span>
                <span className="font-bold text-rose-300 truncate block">{selectedOrderForModal.sampleType}</span>
              </div>
            </div>

            {/* HIGH BIOHAZARD PATHOGEN IDENTIFIED BANNER */}
            <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border-l-4 border-rose-500 p-4 rounded-2xl space-y-1">
              <div className="flex items-center space-x-2 text-rose-300 font-bold text-xs">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Agente / Patógeno de Alto Riesgo Identificado:</span>
              </div>
              <p className="text-base font-black text-white">{selectedOrderForModal.biosafetyProtocol.hazardAgent}</p>
              <p className="text-xs text-rose-200/80 font-mono">{selectedOrderForModal.biosafetyProtocol.hazardCategory}</p>
            </div>

            {/* REQUIRED PPE CHECKLIST */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>1. Verificación de Equipo de Protección Personal (EPP Obligatorio):</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Marque para confirmar uso</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedOrderForModal.biosafetyProtocol.requiredEpp.map((eppItem, idx) => {
                  const checkKey = `ppe-${idx}`;
                  const isChecked = !!ppeCheckedItems[checkKey];

                  return (
                    <button
                      key={checkKey}
                      onClick={() => handleTogglePpeCheck(checkKey)}
                      className={`p-3 rounded-xl border text-left transition flex items-center space-x-3 cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className={`p-1 rounded-lg shrink-0 ${isChecked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {isChecked ? <Check className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </span>
                      <span className="text-xs font-bold leading-tight">{eppItem}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CONTAINMENT & HANDLING INSTRUCTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                <span className="font-extrabold text-amber-300 flex items-center space-x-1.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>2. Equipamiento de Contención:</span>
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px] font-mono">
                  {selectedOrderForModal.biosafetyProtocol.containmentEquipment}
                </p>

                <label className="flex items-center space-x-2.5 pt-2 border-t border-slate-900 cursor-pointer text-[11px] font-bold text-slate-200">
                  <input
                    type="checkbox"
                    checked={cabinetConfirmed}
                    onChange={(e) => setCabinetConfirmed(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span>Confirmo uso de Cabina CSB / Extractor certificado</span>
                </label>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                <span className="font-extrabold text-rose-300 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>3. Protocolo de Derrames & Emergencias:</span>
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {selectedOrderForModal.biosafetyProtocol.spillProtocol}
                </p>

                <label className="flex items-center space-x-2.5 pt-2 border-t border-slate-900 cursor-pointer text-[11px] font-bold text-slate-200">
                  <input
                    type="checkbox"
                    checked={spillConfirmed}
                    onChange={(e) => setSpillConfirmed(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span>Comprendo el protocolo de derrame y contacto de emergencia</span>
                </label>
              </div>
            </div>

            {/* HANDLING STEPS LIST */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <span className="font-extrabold text-indigo-300 block">Instrucciones de Manipulación Segura en Mesón:</span>
              <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-1">
                {selectedOrderForModal.biosafetyProtocol.handlingInstructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>

            {/* ACTION FOOTER */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[11px] text-slate-400 font-mono">
                Contacto Bioseguridad: <span className="text-indigo-300 font-bold">{selectedOrderForModal.biosafetyProtocol.emergencyContact}</span>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowBiosafetyAlertModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancelar / Regresar
                </button>

                <button
                  type="button"
                  disabled={!isProtocolFullyVerified()}
                  onClick={handleConfirmBiosafetyProtocol}
                  className={`px-6 py-3 rounded-2xl text-xs font-black transition shadow-xl flex items-center justify-center space-x-2 cursor-pointer w-full sm:w-auto ${
                    isProtocolFullyVerified()
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30 font-extrabold'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isProtocolFullyVerified()
                      ? '✓ CONFIRMAR PROTOCOLO Y ABRIR MUESTRA EN MESÓN'
                      : 'Complete las verificaciones EPP para abrir'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
