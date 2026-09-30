import React, { useState, useEffect } from 'react';
import {
  FileText,
  User,
  Activity,
  Stethoscope,
  Plus,
  Send,
  Microscope,
  Pill,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Download,
  Flame,
  ShieldAlert,
  ChevronRight,
  BedDouble,
  Droplets,
  Layers,
  HeartPulse,
  Eye,
  Calendar,
  ShieldCheck,
  Check,
  Thermometer,
  RotateCw,
  ZoomIn,
  Sliders,
  Maximize2,
  Sparkles,
  Zap,
  Search,
  X,
  CheckCheck,
  RefreshCw,
  Scissors,
  Dna,
  Heart,
  Radio,
  Tag,
  Filter,
  Shield,
  Edit3,
  BookOpen,
  Info
} from 'lucide-react';
import { useHisStore } from '../../store/useHisStore';
import { useLisStore } from '../../store/useLisStore';
import { SoapNote, Order, MedicationOrder, Priority } from '../../types';
import { MOCK_TEST_CATALOG } from '../../data/mockData';
import { INITIAL_TRANSFUSION_CASES } from '../Phase6Suite/TechnologistSuite/TransfusionEvolutionManager';
import { AnatomicalBodyMap } from './AnatomicalBodyMap';

interface EhrProps {
  onOpenPdf?: (orderId: string) => void;
}

export const ElectronicHealthRecordEHR: React.FC<EhrProps> = ({ onOpenPdf }) => {
  const {
    admissions,
    selectedAdmissionId,
    setSelectedAdmissionId,
    beds,
    soapNotes,
    addSoapNote,
    medicationOrders,
    addMedicationOrder
  } = useHisStore();

  const { orders, results, addOrder, currentUser } = useLisStore();

  // Active admission
  const activeAdmission = admissions.find((a) => a.id === selectedAdmissionId) || admissions[0];
  const activeBed = beds.find((b) => b.id === activeAdmission?.bedId);

  // Sub-tabs in EHR: 7 Comprehensive Clinical Dimensions for Doctor
  const [subTab, setSubTab] = useState<'resumen' | 'soap' | 'anatomia' | 'meds' | 'lab' | 'imaging' | 'bloodbank'>('resumen');

  // Helper to count paragraphs and words for doctor's clinical documentation
  const countStats = (text: string) => {
    const paras = text ? text.split(/\n+/).filter((p) => p.trim().length > 0).length : 0;
    const words = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    return { paras, words };
  };

  // Professional Patient Directory Modal
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientFilterService, setPatientFilterService] = useState<'TODOS' | 'HOSP' | 'URG' | 'EXT'>('TODOS');

  const filteredAdmissions = admissions.filter((adm) => {
    const matchesSearch =
      adm.patientName.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
      adm.patientNationalId.includes(patientSearchTerm) ||
      adm.primaryDiagnosisIcd10.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
      (adm.assignedBedId && adm.assignedBedId.toLowerCase().includes(patientSearchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (patientFilterService === 'HOSP') return adm.assignedBedId?.includes('hosp') || (adm.ward && adm.ward !== 'CONSULTA_EXTERNA' && !adm.assignedBedId?.includes('urg'));
    if (patientFilterService === 'URG') return adm.assignedBedId?.includes('urg') || (adm.ward && adm.ward.toLowerCase().includes('urg'));
    if (patientFilterService === 'EXT') return adm.ward === 'CONSULTA_EXTERNA';
    return true;
  });

  // New SOAP note state
  const [subjective, setSubjective] = useState<string>('');
  const [objective, setObjective] = useState<string>('');
  const [assessment, setAssessment] = useState<string>('');
  const [plan, setPlan] = useState<string>('');

  // New Lab Order state (Inicia limpio sin selección por defecto)
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [orderPriority, setOrderPriority] = useState<Priority>('RUTINA');
  const [labNotes, setLabNotes] = useState<string>('Evaluación clínica ambulatoria / hospitalaria.');

  // New Med Order state
  const [drugName, setDrugName] = useState<string>('');
  const [dose, setDose] = useState<string>('');
  const [route, setRoute] = useState<MedicationOrder['route']>('INTRAVENOSA');
  const [frequency, setFrequency] = useState<MedicationOrder['frequency']>('CADA_8H');

  // DICOM Viewer Modal state
  const [selectedDicomStudy, setSelectedDicomStudy] = useState<any | null>(null);

  // --- 1. Ubicación y Sala del Paciente ---
  const getWardLocationLabel = (adm: any) => {
    if (adm.ward === 'CONSULTA_EXTERNA') return 'Consulta Externa (Ambulatorio)';
    if (adm.ward) return adm.ward;
    if (adm.assignedBedId?.includes('urg')) return 'Urgencias / Observación';
    if (adm.assignedBedId?.includes('hosp')) return 'Hospitalización General';
    if (adm.assignedBedId?.includes('uci')) return 'Cuidados Intensivos (UCI)';
    return 'Hospitalización';
  };

  // --- 2. Signos Vitales & Telemetría (Monitor vs Manual con Auto-Sincronización) ---
  const [vitalSource, setVitalSource] = useState<'TELEMETRY' | 'MANUAL'>('TELEMETRY');
  const [isAutoSyncActive, setIsAutoSyncActive] = useState<boolean>(true);
  const [lastAutoSyncSeconds, setLastAutoSyncSeconds] = useState<number>(0);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [vitalsData, setVitalsData] = useState({
    bp: '125 / 80',
    hr: '78',
    hrRhythm: 'Sinusal',
    rr: '16',
    temp: '36.7',
    tempType: 'Afebril',
    spo2: '98%',
    o2Delivery: 'Aire ambiente',
    glasgow: '15 / 15',
    glasgowState: 'Lúcido / Alerta',
    monitorModel: 'Mindray BeneVision N12',
    monitorBed: 'Cama 104 (Sala General / Urgencias)',
    protocol: 'HL7 PCD-01 / IEEE 11073',
    lastSyncTime: 'En vivo • Auto-sincronizado vía HL7 PCD-01',
    nurseInCharge: 'Licda. Katherine Vergara (Enf. Triage)'
  });

  // Auto-sincronización continua de telemetría cada 4 segundos
  useEffect(() => {
    if (vitalSource !== 'TELEMETRY' || !isAutoSyncActive) return;

    const interval = setInterval(() => {
      setVitalsData((prev) => {
        const baseHr = 78;
        const hrOffset = Math.floor(Math.random() * 5) - 2;
        const hr = String(baseHr + hrOffset);
        const spo2 = Math.random() > 0.25 ? '98%' : '99%';
        const rr = Math.random() > 0.4 ? '16' : '17';
        return {
          ...prev,
          hr,
          spo2,
          rr,
          lastSyncTime: 'En vivo (Auto-sync continuo HL7 PCD-01)'
        };
      });
      setLastAutoSyncSeconds(0);
    }, 4000);

    const secondsTicker = setInterval(() => {
      setLastAutoSyncSeconds((s) => s + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(secondsTicker);
    };
  }, [vitalSource, isAutoSyncActive]);

  // --- 3. Antecedentes Dinámicos e Interactivos ---
  const [antecedenteFilter, setAntecedenteFilter] = useState<'TODOS' | 'ALERGIAS' | 'PATOLOGICOS' | 'QUIRURGICOS' | 'FAMILIARES' | 'HABITOS'>('TODOS');
  const [isAddAntecedenteOpen, setIsAddAntecedenteOpen] = useState(false);
  const [newAntCategory, setNewAntCategory] = useState<'ALERGIAS' | 'PATOLOGICOS' | 'QUIRURGICOS' | 'FAMILIARES' | 'HABITOS'>('PATOLOGICOS');
  const [newAntTitle, setNewAntTitle] = useState('');
  const [newAntDetail, setNewAntDetail] = useState('');
  const [newAntBadge, setNewAntBadge] = useState('Activo');

  const [antecedentesList, setAntecedentesList] = useState([
    { id: 'ant-1', category: 'PATOLOGICOS', title: 'Hipertensión Arterial Esencial', detail: 'Estadio 2 • En tratamiento regular con Enalapril', badge: 'Crónico', color: 'indigo' },
    { id: 'ant-2', category: 'PATOLOGICOS', title: 'Dislipidemia Mixta', detail: 'Colesterol y triglicéridos elevados • Control dietético', badge: 'En Control', color: 'indigo' },
    { id: 'ant-3', category: 'QUIRURGICOS', title: 'Apendicectomía Laparoscópica', detail: 'Año 2018 • Hospital San Fernando • Sin complicaciones', badge: '2018', color: 'purple' },
    { id: 'ant-4', category: 'QUIRURGICOS', title: 'Colecistectomía por Litiasis', detail: 'Año 2021 • Abordaje laparoscópico programado', badge: '2021', color: 'purple' },
    { id: 'ant-5', category: 'HABITOS', title: 'Tabaquismo Negativo', detail: 'No fumador activo ni pasivo', badge: '0 cig/día', color: 'emerald' },
    { id: 'ant-6', category: 'HABITOS', title: 'Consumo Social de Alcohol', detail: 'Esporádico y social • Sin patrón de dependencia', badge: 'Social', color: 'emerald' },
    { id: 'ant-7', category: 'FAMILIARES', title: 'Padre: Infarto Agudo de Miocardio', detail: 'Evento coronario agudo a los 58 años', badge: 'Cardiovascular', color: 'amber' },
    { id: 'ant-8', category: 'FAMILIARES', title: 'Madre: Diabetes Mellitus Tipo 2', detail: 'Diagnóstico a los 52 años • Tratamiento con metformina', badge: 'Endocrino', color: 'amber' },
    { id: 'ant-9', category: 'ALERGIAS', title: 'Penicilina / Betalactámicos', detail: 'Reacción anafilactoide previa (Urticaria severa + Angioedema)', badge: 'Riesgo Alto', color: 'rose' },
    { id: 'ant-10', category: 'ALERGIAS', title: 'Dipirona (Metamizol)', detail: 'Exantema pruriginoso generalizado e hipotensión leve', badge: 'Riesgo Severo', color: 'rose' },
  ]);

  // --- 4. Plantillas Clínicas SOAP & Automatización AI ---
  const SOAP_TEMPLATES = [
    {
      id: 'visita_general',
      name: '🏥 Pase de Visita General',
      subjective: 'Paciente despierto, orientado, afebril, refiere mejoría del dolor respecto al ingreso. Buena tolerancia a dieta blanda y líquidos. Sin disnea ni náuseas.',
      objective: 'Tórax simétrico, normoexpansible. Murmullo vesicular conservado sin ruidos sobreagregados. Abdomen blando, depresible, ruidos hidroaéreos normales. Diuresis espontánea presente.',
      assessment: 'Evolución clínica favorable hacia la resolución del cuadro agudo. Sin signos de respuesta inflamatoria sistémica ni complicaciones.',
      plan: '1. Mantener esquema terapéutico actual.\n2. Monitoreo de signos vitales cada turno.\n3. Evaluar retiro de vía periférica y transición a medicación oral según evolución.'
    },
    {
      id: 'quirurgico',
      name: '🔪 Evolución Post-Quirúrgica',
      subjective: 'Paciente en 1er día postoperatorio. Refiere dolor en herida quirúrgica controlado (EVA 3/10 con analgesia). Tolera líquidos claros.',
      objective: 'Herida quirúrgica limpia, afrontada con apósito seco, sin eritema perilesional ni secreción purulenta. Drenajes con débito serohemático escaso (<30cc). Abdomen sin irritación peritoneal.',
      assessment: 'Postoperatorio mediato con evolución adecuada. Riesgo infeccioso bajo.',
      plan: '1. Curación diaria de herida quirúrgica con técnica aséptica.\n2. Continuar analgesia pautada y profilaxis antitrombótica.\n3. Deambulación asistida temprana.'
    },
    {
      id: 'urgencias',
      name: '🚨 Urgencias & Observación',
      subjective: 'Ingresa derivado de Triage por dolor agudo de 6 horas de evolución. No refiere fiebre previa ni vómitos.',
      objective: 'Facies álgica. Abdomen con dolor a la palpación en fosa ilíaca derecha. Signo de Blumberg dudoso. RHA disminuidos.',
      assessment: 'Cuadro abdominal agudo en estudio. Se sospecha proceso apendicular incipiente vs adenitis mesentérica.',
      plan: '1. Nada por boca (NPO).\n2. Canalizar vía venosa periférica con Solución Salina 0.9% a 100 cc/h.\n3. Solicitar Hemograma completo, PCR, Examen General de Orina y Ultrasonido abdominal STAT.'
    },
    {
      id: 'uci',
      name: '🩺 Cuidados Críticos (UCI)',
      subjective: 'Paciente bajo sedoanalgesia superficial (RASS -1 a 0), reactivo a estímulos verbales.',
      objective: 'Ventilación mecánica protectora: Vt 420ml, PEEP 6, FiO2 35%. PaO2/FiO2 > 300. Hemodinámicamente estable con soporte vasopresor en descenso (Norepinefrina 0.04 mcg/kg/min). Balance hídrico neutro.',
      assessment: 'Shock séptico en fase de resolución. Destete de vasopresor en curso satisfactorio.',
      plan: '1. Ventana de sedación matutina y prueba de respiración espontánea.\n2. Control gasométrico y lactato cada 6 horas.\n3. Ajuste de antibiótico guiado por función renal.'
    },
    {
      id: 'transfusion',
      name: '🩸 Control Pre/Post Transfusional',
      subjective: 'Paciente asintomático durante y tras la infusión de hemocomponente. Niega prurito, escalofríos, dolor lumbar, torácico o disnea.',
      objective: 'Signos vitales post-transfusión estables. Sin eritema, rash cutáneo ni cambios térmicos. Gasto urinario claro sin coluria.',
      assessment: 'Transfusión de Concentrado de Glóbulos Rojos culminada satisfactoriamente sin evidencia de Reacción Transfusional Aguda (RTA).',
      plan: '1. Hemovigilancia activa durante las próximas 4 horas.\n2. Hemograma de control post-transfusión a las 6 horas.\n3. Registro y cierre de trazabilidad en Banco de Sangre.'
    }
  ];

  const DEFAULT_EXAM_CHIPS = [
    { id: '1', label: 'Alerta y orientado', text: 'Paciente consciente, orientado en tiempo, espacio y persona.' },
    { id: '2', label: 'Cardíaco rítmico', text: 'Ruidos cardíacos rítmicos, normofonéticos, sin soplos.' },
    { id: '3', label: 'Pulmonar limpio', text: 'Murmullo vesicular conservado bilateral sin sobreagregados.' },
    { id: '4', label: 'Abdomen blando', text: 'Abdomen suave, depresible, no doloroso a la palpación profunda, RHA normales.' },
    { id: '5', label: 'Sin edemas', text: 'Extremidades simétricas, pulsos palpables, sin edemas.' },
    { id: '6', label: 'Neurológico íntegro', text: 'Pares craneales conservados, sin focalización neurológica.' },
    { id: '7', label: 'Llenado capilar < 2s', text: 'Adecuada perfusión tisular, llenado capilar menor a 2 segundos.' },
    { id: '8', label: 'Herida limpia', text: 'Herida quirúrgica limpia, bordes afrontados, sin signos de infección.' }
  ];

  const [examChips, setExamChips] = useState<{ id: string; label: string; text: string; isCustom?: boolean }[]>(() => {
    try {
      const saved = localStorage.getItem('lis_ehr_exam_chips_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_EXAM_CHIPS;
  });

  const [isCreatingChip, setIsCreatingChip] = useState(false);
  const [newChipLabel, setNewChipLabel] = useState('');
  const [newChipText, setNewChipText] = useState('');

  const handleSaveCustomChip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChipLabel.trim() || !newChipText.trim()) return;
    const newChip = {
      id: `custom-${Date.now()}`,
      label: newChipLabel.trim(),
      text: newChipText.trim(),
      isCustom: true
    };
    const updated = [...examChips, newChip];
    setExamChips(updated);
    try {
      localStorage.setItem('lis_ehr_exam_chips_v2', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    setNewChipLabel('');
    setNewChipText('');
    setIsCreatingChip(false);
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `Frase de exploración física "${newChip.label}" creada.`, type: 'success' }
      })
    );
  };

  const handleDeleteCustomChip = (id: string, label: string) => {
    const updated = examChips.filter((c) => c.id !== id);
    setExamChips(updated);
    try {
      localStorage.setItem('lis_ehr_exam_chips_v2', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `Frase "${label}" eliminada.`, type: 'info' }
      })
    );
  };

  const QUICK_ICD10_LIST = [
    { code: 'K35.80', name: 'Apendicitis aguda' },
    { code: 'J18.9', name: 'Neumonía' },
    { code: 'N39.0', name: 'Infección urinaria (ITU)' },
    { code: 'A41.9', name: 'Sepsis' },
    { code: 'I10', name: 'Hipertensión arterial' },
    { code: 'E11.9', name: 'Diabetes mellitus tipo 2' },
    { code: 'D64.9', name: 'Anemia' }
  ];

  // --- 5. CDS Recomendaciones de Medicamentos por Enfermedad (No obligatorio) ---
  const [selectedDiseaseCategory, setSelectedDiseaseCategory] = useState<string>('Infección Intraabdominal / Apendicitis');

  const MED_DISEASE_RECOMMENDATIONS = [
    {
      id: 'intraabdominal',
      name: 'Infección Intraabdominal / Apendicitis',
      icon: '🩺',
      protocols: [
        { name: 'Ampicilina / Sulbactam', dose: '1.5 g', route: 'INTRAVENOSA' as const, frequency: 'CADA_6H' as const, note: '1ra línea MINSA' },
        { name: 'Ceftriaxona', dose: '1 g', route: 'INTRAVENOSA' as const, frequency: 'CADA_12H' as const, note: 'Asociar con Metronidazol' },
        { name: 'Metronidazol', dose: '500 mg', route: 'INTRAVENOSA' as const, frequency: 'CADA_8H' as const, note: 'Cobertura anaeróbica' },
        { name: 'Ketorolaco', dose: '30 mg', route: 'INTRAVENOSA' as const, frequency: 'CADA_8H' as const, note: 'Analgesia post-op (máx 3 días)' }
      ]
    },
    {
      id: 'neumonia',
      name: 'Neumonía Adquirida en Comunidad (NAC)',
      icon: '🫁',
      protocols: [
        { name: 'Ceftriaxona', dose: '1 g', route: 'INTRAVENOSA' as const, frequency: 'CADA_24H' as const, note: 'Cefalosporina 3ra gen' },
        { name: 'Claritromicina', dose: '500 mg', route: 'ORAL' as const, frequency: 'CADA_12H' as const, note: 'Atípicos' },
        { name: 'Azitromicina', dose: '500 mg', route: 'INTRAVENOSA' as const, frequency: 'CADA_24H' as const, note: 'Alternativa IV' },
        { name: 'Salbutamol Inhalador', dose: '2 puff', route: 'INHALATORIA' as const, frequency: 'CADA_6H' as const, note: 'Broncodilatador de rescate' }
      ]
    },
    {
      id: 'itu',
      name: 'ITU Complicada / Pielonefritis Aguda',
      icon: '🧪',
      protocols: [
        { name: 'Ceftriaxona', dose: '1 g', route: 'INTRAVENOSA' as const, frequency: 'CADA_24H' as const, note: 'Empírico hospitalario' },
        { name: 'Ciprofloxacino', dose: '400 mg', route: 'INTRAVENOSA' as const, frequency: 'CADA_12H' as const, note: 'Quinolona parenteral' },
        { name: 'Paracetamol', dose: '1 g', route: 'INTRAVENOSA' as const, frequency: 'CADA_8H' as const, note: 'Control febril y dolor' }
      ]
    },
    {
      id: 'profilaxis',
      name: 'Profilaxis Hospitalaria & Gastroprotección',
      icon: '🛡️',
      protocols: [
        { name: 'Omeprazol', dose: '40 mg', route: 'INTRAVENOSA' as const, frequency: 'CADA_24H' as const, note: 'Protección mucosa gástrica' },
        { name: 'Enoxaparina', dose: '40 mg', route: 'SUBCUTANEA' as const, frequency: 'CADA_24H' as const, note: 'Profilaxis TEV en cama' },
        { name: 'Metoclopramida', dose: '10 mg', route: 'INTRAVENOSA' as const, frequency: 'CADA_8H' as const, note: 'Antiemético PRN' }
      ]
    },
    {
      id: 'cardiovascular',
      name: 'Cardiovascular & Crisis Hipertensiva',
      icon: '❤️',
      protocols: [
        { name: 'Enalaprilato', dose: '1.25 mg', route: 'INTRAVENOSA' as const, frequency: 'CADA_6H' as const, note: 'Antihipertensivo parenteral' },
        { name: 'Amlodipino', dose: '5 mg', route: 'ORAL' as const, frequency: 'CADA_24H' as const, note: 'Mantenimiento VO' },
        { name: 'Furosemida', dose: '20 mg', route: 'INTRAVENOSA' as const, frequency: 'STAT_UNICA' as const, note: 'Diurético de asa rescate' },
        { name: 'Aspirina (Ácido Acetilsalicílico)', dose: '100 mg', route: 'ORAL' as const, frequency: 'CADA_24H' as const, note: 'Antiagregante plaquetario' }
      ]
    }
  ];

  // --- 6. CPOE Catálogo de Laboratorio LIS Profesional ---
  const [labSearchTerm, setLabSearchTerm] = useState('');
  const [labCategoryFilter, setLabCategoryFilter] = useState<'TODOS' | 'HEMATOLOGIA' | 'QUIMICA' | 'COAGULACION' | 'INMUNOLOGIA'>('TODOS');

  const CLINICAL_ORDER_SETS = [
    {
      id: 'set-preop',
      name: '🩺 Perfil Preoperatorio',
      desc: 'Hemograma, Coagulación, Glucosa, Creatinina',
      testIds: ['test-hemograma', 'test-quimica-basica', 'test-creatinina']
    },
    {
      id: 'set-metabolico',
      name: '🧪 Perfil Metabólico & Renal',
      desc: 'Glucosa, Urea, Creatinina, Electrolitos',
      testIds: ['test-glucosa', 'test-creatinina', 'test-quimica-basica']
    },
    {
      id: 'set-cardiaco',
      name: '❤️ Perfil Cardíaco STAT',
      desc: 'Troponina ultrasensible + Enzimas',
      testIds: ['test-troponina', 'test-quimica-basica']
    },
    {
      id: 'set-infeccioso',
      name: '🦠 Perfil Infeccioso / Sepsis',
      desc: 'Hemograma, PCR, Procalcitonina',
      testIds: ['test-hemograma', 'test-quimica-basica']
    }
  ];

  // Filtered lists for this active patient
  const patientSoapNotes = soapNotes.filter(
    (s) => s.admissionId === activeAdmission?.id || s.patientId === activeAdmission?.patientId
  );
  const patientLabOrders = orders.filter(
    (o) => o.patientNationalId === activeAdmission?.patientNationalId || o.patientId === activeAdmission?.patientId
  );
  const patientMeds = medicationOrders.filter(
    (m) => m.admissionId === activeAdmission?.id || m.patientId === activeAdmission?.patientId
  );

  // Transfusion records for this active patient
  const patientTransfusions = INITIAL_TRANSFUSION_CASES.filter(
    (t) =>
      (activeAdmission?.patientNationalId && t.patientNationalId === activeAdmission.patientNationalId) ||
      (activeAdmission?.patientId && t.patientId === activeAdmission.patientId)
  );

  // Imaging studies for this active patient (RIS/PACS) - Strictly patient-specific
  const patientImagingStudies = (
    activeAdmission?.patientNationalId === '8-745-1290'
      ? [
          {
            id: 'img-101',
            accessionNumber: 'RAD-2026-0812',
            modality: 'RX_TORAX',
            modalityName: 'Radiografía de Tórax PA y Lateral Portátil',
            studyDate: '2026-09-07 08:30 AM',
            orderingDoctor: activeAdmission?.admittingDoctorName || 'Dr. Alejandro Icaza',
            radiologist: 'Dr. Fernando Arango (Radiólogo Especialista)',
            status: 'INFORMADO',
            report: 'Silueta cardíaca limítrofe con aumento leve del índice cardiotorácico. Sin signos de congestión venocapilar activa ni derrame pleural. Senos costofrénicos libres.',
            dicomImagesCount: 2
          }
        ]
      : activeAdmission?.patientNationalId === '8-812-4432'
      ? [
          {
            id: 'img-102',
            accessionNumber: 'RAD-2026-0815',
            modality: 'ULTRASONIDO_RENAL',
            modalityName: 'Ultrasonido Renal y Vías Urinarias',
            studyDate: '2026-09-06 16:45 PM',
            orderingDoctor: activeAdmission?.admittingDoctorName || 'Dra. Patricia Boyd',
            radiologist: 'Dra. Marcela Guardia (Radióloga Especialista)',
            status: 'INFORMADO',
            report: 'Riñón derecho con discreto aumento de volumen y pérdida de diferenciación corticomedular en polo inferior, hallazgos compatibles con proceso pielonefrítico agudo. No se observan colecciones perirrenales ni litiasis obstructiva.',
            dicomImagesCount: 16
          }
        ]
      : []
  );

  const handleCreateSoap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdmission || !subjective || !assessment) {
      alert('Por favor complete los campos obligatorios de la nota SOAP.');
      return;
    }

    const newNote: SoapNote = {
      id: `soap-${Date.now()}`,
      admissionId: activeAdmission.id,
      patientId: activeAdmission.patientId,
      doctorId: currentUser?.id || 'doc-icaza',
      doctorName: currentUser?.name || 'Dr. Alejandro Icaza',
      doctorLicense: currentUser?.licenseNumber || 'MP-6612-PA',
      timestamp: new Date().toISOString(),
      subjective,
      objective,
      assessment,
      plan
    };

    addSoapNote(newNote);
    setSubjective('');
    setObjective('');
    setAssessment('');
    setPlan('');
    alert('Nota médica SOAP registrada en el expediente clínico.');
  };

  const handleDispatchLabOrder = () => {
    if (!activeAdmission || selectedTestIds.length === 0) return;

    const newOrder: Order = {
      id: `ord-his-${Date.now()}`,
      tenantId: activeAdmission.tenantId,
      branchId: activeAdmission.branchId,
      orderNumber: `HOSP-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: activeAdmission.patientId,
      patientName: activeAdmission.patientName,
      patientNationalId: activeAdmission.patientNationalId,
      patientGender: 'M',
      patientAge: 48,
      doctorId: currentUser?.id || 'doc-hosp',
      doctorName: activeAdmission.admittingDoctorName,
      priority: orderPriority,
      status: 'REGISTRADA',
      createdAt: new Date().toISOString(),
      totalAmount: 45.00,
      paymentStatus: 'ASEGURADORA',
      serviceOrigin: `${activeAdmission.ward} - Cama ${activeBed?.bedNumber || '01'}`,
      specimens: selectedTestIds.map((tId, idx) => ({
        id: `spc-${Date.now()}-${idx}`,
        orderId: `ord-his-${Date.now()}`,
        barcode: `BC-HOSP-${Math.floor(10000 + Math.random() * 90000)}`,
        tubeType: 'SUERO_ROJO',
        status: 'PENDIENTE'
      })),
      testIds: selectedTestIds
    };

    addOrder(newOrder);
    alert(`¡Orden ${newOrder.orderNumber} enviada al LIS con éxito desde Cama ${activeBed?.bedNumber}!`);
  };

  const handleCreateMedOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdmission || !drugName || !dose) return;

    const newMed: MedicationOrder = {
      id: `med-${Date.now()}`,
      admissionId: activeAdmission.id,
      patientId: activeAdmission.patientId,
      drugName,
      dose,
      route,
      frequency,
      startDate: new Date().toISOString(),
      orderedBy: activeAdmission.admittingDoctorName,
      status: 'ACTIVA'
    };

    addMedicationOrder(newMed);
    setDrugName('');
    setDose('');
    alert(`Medicamento ${newMed.drugName} prescrito e ingresado al Kardex.`);
  };

  if (!activeAdmission) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <h3 className="font-bold text-white">No hay admisiones hospitalarias activas</h3>
        <p className="text-xs text-slate-400 mt-1">Realice un ingreso desde el módulo de Triage de Urgencias.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient 360 Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Patient Details */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                {activeAdmission.ward === 'CONSULTA_EXTERNA' ? 'Consulta Externa' : activeAdmission.ward} • {activeAdmission.ward === 'CONSULTA_EXTERNA' ? 'Consultorio 102' : `Cama ${activeBed?.bedNumber || 'S/A'}`}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Cédula: <strong className="text-white">{activeAdmission.patientNationalId}</strong>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Expediente: <strong className="text-indigo-400">EXP-{activeAdmission.patientNationalId.replace(/-/g, '')}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activeAdmission.patientName}
            </h1>

            <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3">
              <span>Médico Tratante: <strong className="text-indigo-300">{activeAdmission.admittingDoctorName}</strong></span>
              <span>• Ingreso: <strong>{new Date(activeAdmission.admissionDate).toLocaleDateString('es-PA')}</strong></span>
              <span>• Tipo Sanguíneo: <strong className="text-rose-400">
                {patientTransfusions.length > 0
                  ? `${patientTransfusions[0].aboGroup} Rh(${patientTransfusions[0].rhFactor === 'POS' ? '+' : '-'})`
                  : activeAdmission.patientNationalId === '8-710-3321'
                  ? 'Sin tipificar (No requerido)'
                  : 'O Rhesus Positivo (O+)'}
              </strong></span>
            </div>

            {/* Diagnosis & Allergies */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] bg-slate-800 text-slate-200 px-3 py-1 rounded-xl border border-slate-700 font-medium">
                DX Activo: <strong className="text-white">{activeAdmission.primaryDiagnosisIcd10}</strong>
              </span>
              {activeAdmission.allergies.map((allg, idx) => (
                <span key={idx} className="text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-xl font-bold flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Alergia: {allg}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Executive Patient Switcher for Doctors */}
          <div className="bg-slate-950/90 border border-slate-800 hover:border-indigo-500/50 p-3 rounded-2xl shrink-0 space-y-1.5 shadow-lg transition min-w-[280px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Expediente en Atención</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {admissions.length} Pacientes
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPatientModalOpen(true)}
              className="w-full flex items-center justify-between gap-3 bg-slate-900 hover:bg-slate-800/90 border border-slate-700 hover:border-indigo-400 text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer group"
            >
              <div className="flex items-center space-x-2 truncate">
                <User className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate">{activeAdmission.patientName}</span>
              </div>
              <span className="text-[10px] bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 px-2 py-0.5 rounded-md shrink-0 flex items-center space-x-1">
                <Search className="w-2.5 h-2.5" />
                <span>Cambiar</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Directorio Clínico de Pacientes (Búsqueda Rápida) */}
      {isPatientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Directorio Clínico de Pacientes</h3>
                  <p className="text-xs text-slate-400">Seleccione el expediente activo para evolución, órdenes y fármacos</p>
                </div>
              </div>
              <button
                onClick={() => setIsPatientModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Buscar por Nombre, Cédula / Documento, Diagnóstico o Cama..."
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  { id: 'TODOS', label: `Todos (${admissions.length})` },
                  { id: 'HOSP', label: 'Hospitalización' },
                  { id: 'URG', label: 'Urgencias' },
                  { id: 'EXT', label: 'Consulta Externa' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPatientFilterService(tab.id as any)}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                      patientFilterService === tab.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Patient List */}
            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1 max-h-[420px]">
              {filteredAdmissions.map((adm) => {
                const isSelected = adm.id === activeAdmission.id;
                const wardLabel = getWardLocationLabel(adm);
                return (
                  <div
                    key={adm.id}
                    onClick={() => {
                      setSelectedAdmissionId(adm.id);
                      setIsPatientModalOpen(false);
                      window.dispatchEvent(
                        new CustomEvent('lis-global-toast', {
                          detail: { message: `Expediente activo: ${adm.patientName}`, type: 'info' }
                        })
                      );
                    }}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-300 shrink-0 mt-0.5">
                        {adm.patientName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Fila 1: Paciente, Cédula y Ubicación */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-sm">{adm.patientName}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-md border border-slate-700/60">
                            {adm.patientNationalId}
                          </span>
                          <span className="text-[10px] font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 px-2 py-0.5 rounded-md">
                            📍 {wardLabel}
                          </span>
                        </div>

                        {/* Fila 2: Diagnóstico CIE-10 Completo */}
                        <div className="text-xs flex items-baseline gap-1.5 leading-relaxed">
                          <span className="text-indigo-400 font-bold text-[11px] shrink-0">Dx:</span>
                          <span className="text-slate-300 font-medium">{adm.primaryDiagnosisIcd10}</span>
                        </div>

                        {/* Fila 3: Médico Tratante Completo (sin cortes) */}
                        <div className="text-[11px] flex items-center gap-1.5 text-slate-400">
                          <span className="text-emerald-400 font-semibold shrink-0">🩺 Médico:</span>
                          <span className="text-slate-200 font-medium">
                            {adm.admittingDoctorName || 'Dr. Médico Adscrito / Turno'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 self-center ml-2">
                      <button
                        type="button"
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25'
                        }`}
                      >
                        {isSelected ? (
                          <span>✓ Activo</span>
                        ) : (
                          <>
                            <span>Abrir</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs: Unified 7 Dimensions */}
      <div className="flex flex-wrap border border-slate-800 bg-slate-900 rounded-2xl p-1.5 shadow-lg gap-1.5">
        <button
          onClick={() => setSubTab('resumen')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'resumen' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4 text-indigo-300" />
          <span>Resumen Clínico 360°</span>
        </button>

        <button
          onClick={() => setSubTab('soap')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'soap' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Stethoscope className="w-4 h-4 text-cyan-400" />
          <span>Evolución Médica (Notas SOAP)</span>
        </button>

        <button
          onClick={() => setSubTab('anatomia')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'anatomia' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4 text-cyan-300" />
          <span>Mapa Corporal Anatómico</span>
        </button>

        <button
          onClick={() => setSubTab('meds')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'meds' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Pill className="w-4 h-4 text-amber-400" />
          <span>Medicamentos & Farmacia ({patientMeds.length})</span>
        </button>

        <button
          onClick={() => setSubTab('lab')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'lab' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Microscope className="w-4 h-4 text-teal-400" />
          <span>Laboratorio LIS ({patientLabOrders.length})</span>
        </button>

        <button
          onClick={() => setSubTab('imaging')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'imaging' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-sky-400" />
          <span>Imágenes RIS / PACS ({patientImagingStudies.length})</span>
        </button>

        <button
          onClick={() => setSubTab('bloodbank')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'bloodbank' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Droplets className="w-4 h-4 text-rose-300" />
          <span>Banco de Sangre & Transfusiones ({patientTransfusions.length})</span>
        </button>
      </div>

      {/* DIMENSIÓN 1: RESUMEN CLÍNICO 360° */}
      {subTab === 'resumen' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* Col 1: Antecedentes & Constantes */}
          <div className="lg:col-span-6 space-y-4">
            {/* Antecedentes Dinámicos e Interactivos */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">Antecedentes Clínicos del Paciente</h3>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                    {antecedentesList.length} Registros
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddAntecedenteOpen(!isAddAntecedenteOpen)}
                  className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isAddAntecedenteOpen ? 'Cerrar' : '+ Agregar Antecedente'}</span>
                </button>
              </div>

              {/* Formulario Rápido para Agregar Antecedente */}
              {isAddAntecedenteOpen && (
                <div className="p-3 bg-slate-950 rounded-2xl border border-indigo-500/40 space-y-3 animate-in fade-in duration-200">
                  <div className="text-[11px] font-bold text-indigo-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nuevo Registro en Expediente Clínico</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={newAntCategory}
                      onChange={(e) => setNewAntCategory(e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs"
                    >
                      <option value="ALERGIAS">🚨 Alergia Severa</option>
                      <option value="PATOLOGICOS">🩺 Patológico (Enfermedad)</option>
                      <option value="QUIRURGICOS">🔪 Quirúrgico (Cirugía)</option>
                      <option value="FAMILIARES">🧬 Familiar / Hereditario</option>
                      <option value="HABITOS">🚭 Hábito / Toxicológico</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Título / Diagnóstico (Ej: Asma, Cirugía hernia...)"
                      value={newAntTitle}
                      onChange={(e) => setNewAntTitle(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs sm:col-span-2"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Detalles clínicos o año (Ej: Reacción moderada, control con inhalador...)"
                      value={newAntDetail}
                      onChange={(e) => setNewAntDetail(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newAntTitle.trim()) return;
                        setAntecedentesList([
                          ...antecedentesList,
                          {
                            id: `ant-${Date.now()}`,
                            category: newAntCategory,
                            title: newAntTitle,
                            detail: newAntDetail || 'Registrado por médico tratante',
                            badge: newAntCategory === 'ALERGIAS' ? 'Severo' : 'Activo',
                            color: newAntCategory === 'ALERGIAS' ? 'rose' : newAntCategory === 'QUIRURGICOS' ? 'purple' : newAntCategory === 'HABITOS' ? 'emerald' : 'indigo'
                          }
                        ]);
                        setNewAntTitle('');
                        setNewAntDetail('');
                        setIsAddAntecedenteOpen(false);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              )}

              {/* Filtros por Categoría */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'TODOS', label: 'Todos', count: antecedentesList.length },
                  { id: 'ALERGIAS', label: '🚨 Alergias', count: antecedentesList.filter(a => a.category === 'ALERGIAS').length },
                  { id: 'PATOLOGICOS', label: '🩺 Patológicos', count: antecedentesList.filter(a => a.category === 'PATOLOGICOS').length },
                  { id: 'QUIRURGICOS', label: '🔪 Quirúrgicos', count: antecedentesList.filter(a => a.category === 'QUIRURGICOS').length },
                  { id: 'FAMILIARES', label: '🧬 Genética', count: antecedentesList.filter(a => a.category === 'FAMILIARES').length },
                  { id: 'HABITOS', label: '🚭 Hábitos', count: antecedentesList.filter(a => a.category === 'HABITOS').length },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setAntecedenteFilter(cat.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center space-x-1 ${
                      antecedenteFilter === cat.id
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="opacity-70 text-[9px]">({cat.count})</span>
                  </button>
                ))}
              </div>

              {/* Chips / Cards Dinámicos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {antecedentesList
                  .filter((item) => antecedenteFilter === 'TODOS' || item.category === antecedenteFilter)
                  .map((item) => {
                    const isAllergy = item.category === 'ALERGIAS';
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between ${
                          isAllergy
                            ? 'bg-rose-950/30 border-rose-500/50 hover:border-rose-400 shadow-md shadow-rose-950/20'
                            : item.category === 'QUIRURGICOS'
                            ? 'bg-purple-950/20 border-purple-500/30 hover:border-purple-400'
                            : item.category === 'HABITOS'
                            ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400'
                            : item.category === 'FAMILIARES'
                            ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5 mb-1">
                          <span className={`font-bold text-xs leading-snug ${isAllergy ? 'text-rose-200' : 'text-white'}`}>
                            {item.title}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0 ${
                              isAllergy
                                ? 'bg-rose-500 text-slate-950 font-black animate-pulse'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                          {item.detail}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Constantes Vitales con Soporte Dual: Monitor de Cabecera (IoT / HL7 PCD-01) vs Toma Manual (Enfermería) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-white text-sm">Signos Vitales & Monitorización de Cabecera</h3>
                </div>

                {/* Selector de Fuente: Telemetría vs Manual */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setVitalSource('TELEMETRY')}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer ${
                      vitalSource === 'TELEMETRY'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block mr-0.5"></span>
                    <span>📡 Monitor Multiparamétrico</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVitalSource('MANUAL')}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer ${
                      vitalSource === 'MANUAL'
                        ? 'bg-indigo-500 text-white font-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>✍️ Toma Manual</span>
                  </button>
                </div>
              </div>

              {/* Banner de Origen y Conectividad con Auto-Sincronización Continua */}
              <div className="p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                <div className="flex items-center space-x-2">
                  {vitalSource === 'TELEMETRY' ? (
                    <>
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        {isAutoSyncActive && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        )}
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span>
                        <strong className="text-emerald-300">Conectado a {vitalsData.monitorModel}</strong> • {vitalsData.monitorBed} ({vitalsData.protocol})
                      </span>
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>
                        <strong className="text-indigo-300">Registro Clínico Manual:</strong> {vitalsData.nurseInCharge}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {vitalSource === 'TELEMETRY' ? (
                    <>
                      <span className="text-[10px] font-mono text-emerald-400/90 hidden sm:inline">
                        {isAutoSyncActive ? `Sincronizando automáticamente (hace ${lastAutoSyncSeconds}s)` : 'En pausa'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !isAutoSyncActive;
                          setIsAutoSyncActive(nextState);
                          window.dispatchEvent(
                            new CustomEvent('lis-global-toast', {
                              detail: {
                                message: nextState
                                  ? '🟢 Auto-sincronización continua de signos vitales activada.'
                                  : '⏸️ Auto-sincronización pausada.',
                                type: 'info'
                              }
                            })
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                          isAutoSyncActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                        }`}
                        title="Auto-sincronización en tiempo real desde el monitor de cabecera"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isAutoSyncActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        <span>{isAutoSyncActive ? 'Auto-Sincronización en Vivo' : 'Auto-Sync Pausado'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setVitalsData((prev) => ({
                            ...prev,
                            lastSyncTime: 'En vivo (Auto-sync continuo HL7 PCD-01)',
                            hr: String(Math.floor(74 + Math.random() * 8))
                          }));
                          setLastAutoSyncSeconds(0);
                          window.dispatchEvent(new CustomEvent('lis-global-toast', {
                            detail: { message: '📡 Telemetría HL7 actualizada forzosamente.', type: 'info' }
                          }));
                        }}
                        className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                        title="Forzar actualización manual ahora"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsVitalsModalOpen(true)}
                      className="px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Modificar Datos</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Grid de 6 Tarjetas de Constantes Vitales */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Presión Arterial</span>
                  <strong className="text-white text-sm font-mono">{vitalsData.bp}</strong>
                  <span className="text-[10px] text-emerald-400 block">mmHg</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Frec. Cardíaca</span>
                  <strong className="text-white text-sm font-mono">{vitalsData.hr}</strong>
                  <span className="text-[10px] text-emerald-400 block">{vitalsData.hrRhythm}</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Frec. Resp.</span>
                  <strong className="text-white text-sm font-mono">{vitalsData.rr}</strong>
                  <span className="text-[10px] text-emerald-400 block">rpm</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Temperatura</span>
                  <strong className="text-white text-sm font-mono">{vitalsData.temp}</strong>
                  <span className="text-[10px] text-emerald-400 block">°C ({vitalsData.tempType})</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Saturación SpO2</span>
                  <strong className="text-white text-sm font-mono">{vitalsData.spo2}</strong>
                  <span className="text-[10px] text-emerald-400 block">{vitalsData.o2Delivery}</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">Glasgow</span>
                  <strong className="text-white text-sm font-mono">{vitalsData.glasgow}</strong>
                  <span className="text-[10px] text-emerald-400 block">{vitalsData.glasgowState}</span>
                </div>
              </div>

              {/* Modal para Modificar Constantes Manualmente */}
              {isVitalsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
                  <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-indigo-400" />
                        <h4 className="font-bold text-white text-sm">Registro Manual de Signos Vitales</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsVitalsModalOpen(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-slate-400 font-bold block mb-1">Presión Arterial (PA)</label>
                        <input
                          type="text"
                          value={vitalsData.bp}
                          onChange={(e) => setVitalsData({ ...vitalsData, bp: e.target.value })}
                          placeholder="120 / 80"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 font-bold block mb-1">Frec. Cardíaca (lpm)</label>
                        <input
                          type="text"
                          value={vitalsData.hr}
                          onChange={(e) => setVitalsData({ ...vitalsData, hr: e.target.value })}
                          placeholder="78"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 font-bold block mb-1">Frec. Respiratoria (rpm)</label>
                        <input
                          type="text"
                          value={vitalsData.rr}
                          onChange={(e) => setVitalsData({ ...vitalsData, rr: e.target.value })}
                          placeholder="16"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 font-bold block mb-1">Temperatura (°C)</label>
                        <input
                          type="text"
                          value={vitalsData.temp}
                          onChange={(e) => setVitalsData({ ...vitalsData, temp: e.target.value })}
                          placeholder="36.7"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 font-bold block mb-1">Saturación SpO2</label>
                        <input
                          type="text"
                          value={vitalsData.spo2}
                          onChange={(e) => setVitalsData({ ...vitalsData, spo2: e.target.value })}
                          placeholder="98%"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 font-bold block mb-1">Escala Glasgow</label>
                        <input
                          type="text"
                          value={vitalsData.glasgow}
                          onChange={(e) => setVitalsData({ ...vitalsData, glasgow: e.target.value })}
                          placeholder="15 / 15"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsVitalsModalOpen(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVitalsData({
                            ...vitalsData,
                            lastSyncTime: 'Registrado manualmente hace instantes'
                          });
                          setIsVitalsModalOpen(false);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Guardar Signos
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Col 2: Resumen Integrado (Lab + Transfusiones + Imágenes + Citas) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2.5 flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <HeartPulse className="w-4 h-4 text-rose-400" />
                  <span>Estado Clínico Transversal Integrado</span>
                </span>
                <span className="text-[10px] text-indigo-400 font-bold">HIS ↔ LIS ↔ Banco de Sangre</span>
              </h3>

              <div className="space-y-2.5">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Laboratorio Clínico (LIS)</span>
                    <span className="text-slate-400 text-[11px]">
                      {patientLabOrders.length > 0
                        ? `${patientLabOrders.length} orden(es) analítica(s) en curso con sincronización LIS.`
                        : 'Sin estudios de laboratorio registrados (Consulta médica independiente).'}
                    </span>
                  </div>
                  <button onClick={() => setSubTab('lab')} className="px-3 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 rounded-xl font-bold cursor-pointer text-xs">
                    {patientLabOrders.length > 0 ? 'Ver Resultados' : 'Solicitar si Aplica'}
                  </button>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Imágenes Diagnósticas (RIS / PACS)</span>
                    <span className="text-slate-400 text-[11px]">
                      {patientImagingStudies.length > 0
                        ? `${patientImagingStudies.length} estudio(s) informado(s) con visor DICOM.`
                        : 'Sin estudios de imagenología registrados para este paciente.'}
                    </span>
                  </div>
                  <button onClick={() => setSubTab('imaging')} className="px-3 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 rounded-xl font-bold cursor-pointer text-xs">
                    {patientImagingStudies.length > 0 ? 'Ver Rayos X / TAC' : 'Revisar PACS'}
                  </button>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Medicina Transfusional & Banco de Sangre</span>
                    <span className="text-slate-400 text-[11px]">
                      {patientTransfusions.length > 0
                        ? `${patientTransfusions.length} caso(s) en flujo transfusional activo (${patientTransfusions[0].componentRequested.replace(/_/g, ' ')})`
                        : 'Sin solicitudes ni antecedentes de transfusión registrados.'}
                    </span>
                  </div>
                  <button onClick={() => setSubTab('bloodbank')} className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl font-bold cursor-pointer text-xs">
                    {patientTransfusions.length > 0 ? 'Ver Sangre' : 'Revisar Inmuno'}
                  </button>
                </div>
              </div>
            </div>

            {/* Próximo Seguimiento y Citas */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2.5 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Seguimiento Médico & Próximas Citas</span>
              </h3>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-indigo-300 font-bold">
                  <span>Consulta de Control Especializado</span>
                  <span>15 de Octubre 2026 • 10:00 AM</span>
                </div>
                <p className="text-slate-300">Consultorio 304 • Especialidad: Medicina Interna & Cardiología Clínica</p>
                <p className="text-slate-500 text-[11px]">Objetivo: Reevaluación de biomarcadores cardíacos y respuesta a farmacoterapia post-alta.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIMENSIÓN 2: NOTAS SOAP */}
      {subTab === 'soap' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Nueva Nota de Evolución Médica (Pase de Visita)</h3>
              </div>

              {/* Botón Maestro de Sincronización Clínica Directa */}
              <button
                type="button"
                onClick={() => {
                  const vitalsStr = `CONSTANTES VITALES (${vitalSource === 'TELEMETRY' ? 'Monitor de Cabecera Mindray N12' : 'Toma Enfermería'}):\nPA: ${vitalsData.bp} mmHg | FC: ${vitalsData.hr} ${vitalsData.hrRhythm} | FR: ${vitalsData.rr} rpm | T: ${vitalsData.temp} ${vitalsData.tempType} | SpO2: ${vitalsData.spo2} (${vitalsData.o2Delivery}) | Glasgow: ${vitalsData.glasgow} (${vitalsData.glasgowState}).`;
                  
                  const labsSummary = patientLabOrders.length > 0
                    ? `\n\nÚLTIMOS LABORATORIOS LIS (VALIDADOS):\n• Hemograma: Hb 13.8 g/dL (Normal), Leucocitos 7,200 /µL, Plaquetas 245,000 /µL.\n• Bioquímica: Glucosa 95 mg/dL, Creatinina 0.9 mg/dL (Normal).\n• Trazabilidad LIS: Sin banderas de pánico activas.`
                    : `\n\nLABORATORIOS LIS: Sin exámenes recientes en proceso.`;

                  const physicalExam = `\n\nEXAMEN FÍSICO:\nPaciente orientado en tiempo y espacio, hidratado, ruidos cardíacos rítmicos, murmullo vesicular presente bilateral, abdomen blando depresible, extremidades simétricas sin edemas periféricos.`;

                  setObjective(vitalsStr + labsSummary + physicalExam);
                  setSubjective(`Paciente refiere estado general estable, descanso nocturno adecuado, refiere mejoría del dolor y buena tolerancia oral a la medicación y dieta.`);
                  
                  const transfusionNote = patientTransfusions.length > 0 ? ` Paciente cuenta con registro de soporte transfusional en Banco de Sangre (${patientTransfusions[0].componentRequested.replace(/_/g, ' ')}).` : '';
                  setAssessment(`Paciente cursando internación por ${activeAdmission.primaryDiagnosisIcd10 || 'proceso patológico agudo'}.${transfusionNote} Signos vitales dentro de parámetros fisiológicos con estabilidad hemodinámica.`);

                  const planItems: string[] = [];
                  if (patientMeds.length > 0) {
                    patientMeds.forEach((m) => {
                      planItems.push(`Continuar ${m.drugName} ${m.dose} vía ${m.route} (${m.frequency})`);
                    });
                  } else {
                    planItems.push('Hidratación y pauta médica hospitalaria habitual.');
                  }
                  planItems.push('Monitoreo de signos vitales cada 6 horas.');
                  planItems.push('Dieta a tolerancia y control evolutivo en siguiente turno.');

                  setPlan(`PLAN TERAPÉUTICO:\n${planItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}`);

                  window.dispatchEvent(
                    new CustomEvent('lis-global-toast', {
                      detail: {
                        message: 'Sincronización exitosa: Constantes vitales, LIS y Fármacos consolidados.',
                        type: 'success'
                      }
                    })
                  );
                }}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-cyan-500/40 hover:border-cyan-400 font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sincronizar Datos Clínicos (Constantes + LIS + Farmacia)</span>
              </button>
            </div>

            {/* Selector de Plantillas Clínicas Especializadas */}
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                📋 Plantillas Clínicas de 1-Click (Macros Especializadas):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SOAP_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setSubjective(tmpl.subjective);
                      setObjective(tmpl.objective);
                      setAssessment(tmpl.assessment);
                      setPlan(tmpl.plan);
                      window.dispatchEvent(
                        new CustomEvent('lis-global-toast', {
                          detail: { message: `Plantilla aplicada: ${tmpl.name}`, type: 'info' }
                        })
                      );
                    }}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center space-x-1"
                  >
                    <span>{tmpl.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateSoap} className="space-y-3.5 text-xs">
              {/* [S] Subjetivo */}
              <div>
                <div className="flex flex-wrap items-center justify-between mb-1 gap-1">
                  <label className="font-bold text-slate-300">
                    [S] Subjetivo (Síntomas referidos por el paciente)
                  </label>
                </div>
                <textarea
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  placeholder="Paciente refiere alivio del dolor, descanso nocturno adecuado, buena tolerancia a líquidos... (Puede escribir todos los párrafos que desee presionando Enter)"
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 font-normal leading-relaxed resize-y min-h-[90px]"
                  required
                />
              </div>

              {/* [O] Objetivo + Chips de Inserción Rápida */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <label className="font-bold text-slate-300">
                    [O] Objetivo (Examen físico, constantes vitales y hallazgos)
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSubTab('anatomia')}
                      className="px-2 py-0.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 rounded-md text-[9px] font-bold hover:bg-cyan-600/30 flex items-center space-x-1 cursor-pointer"
                      title="Explorar cuerpo humano en mapa interactivo"
                    >
                      <Activity className="w-3 h-3" />
                      <span>🗺️ Mapa Corporal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const vitText = `\nPA: ${vitalsData.bp} mmHg | FC: ${vitalsData.hr} ${vitalsData.hrRhythm} | FR: ${vitalsData.rr} rpm | T: ${vitalsData.temp} ${vitalsData.tempType} | SpO2: ${vitalsData.spo2}`;
                        setObjective(prev => prev ? `${prev}\n${vitText}` : vitText);
                      }}
                      className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-md text-[9px] font-bold hover:bg-emerald-500/20 cursor-pointer"
                    >
                      + Signos Vitales
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const labText = `\nLabs LIS: Glucosa 95 mg/dL, Creatinina 0.9 mg/dL, Hb 13.8 g/dL, Leucocitos 7.2 x10³/µL.`;
                        setObjective(prev => prev ? `${prev}\n${labText}` : labText);
                      }}
                      className="px-2 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/30 rounded-md text-[9px] font-bold hover:bg-teal-500/20 cursor-pointer"
                    >
                      + Labs LIS
                    </button>
                  </div>
                </div>

                {/* Examen Físico Chips Dinámicos & Creador Personalizado */}
                <div className="mb-1.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">
                      Exploración Rápida (1-Click):
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingChip(!isCreatingChip)}
                      className="px-2 py-0.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-[9px] font-bold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isCreatingChip ? 'Cerrar' : '+ Crear Más Chips / Frases'}</span>
                    </button>
                  </div>

                  {/* Formulario Creador de Nuevo Chip */}
                  {isCreatingChip && (
                    <div className="p-2.5 bg-slate-900 border border-indigo-500/40 rounded-xl space-y-2 animate-in fade-in duration-200">
                      <div className="text-[10px] font-bold text-indigo-300 flex items-center justify-between">
                        <span>➕ Agregar Nueva Frase de Exploración Física</span>
                        <button type="button" onClick={() => setIsCreatingChip(false)} className="text-slate-400 hover:text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Etiqueta corta (Ej: Abdomen en tabla)"
                          value={newChipLabel}
                          onChange={(e) => setNewChipLabel(e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Texto clínico completo a insertar en Objetivo..."
                          value={newChipText}
                          onChange={(e) => setNewChipText(e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white text-xs sm:col-span-2"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCreatingChip(false)}
                          className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCustomChip}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                        >
                          Guardar Frase
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Lista de Chips Disponibles */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {examChips.map((chip) => (
                      <div key={chip.id} className="inline-flex items-center rounded-lg bg-slate-900 border border-slate-700/60 hover:border-slate-500 overflow-hidden text-[9px] transition">
                        <button
                          type="button"
                          onClick={() => setObjective(prev => prev ? `${prev} ${chip.text}` : chip.text)}
                          className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer font-medium"
                          title={chip.text}
                        >
                          + {chip.label}
                        </button>
                        {chip.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomChip(chip.id, chip.label)}
                            className="px-1 py-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition border-l border-slate-800"
                            title="Eliminar este chip personalizado"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="PA 120/80 mmHg, afebril, campos pulmonares limpios, abdomen blando, sin edemas periféricos... (Escriba los párrafos que requiera)"
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 font-normal leading-relaxed resize-y min-h-[95px]"
                  required
                />
              </div>

              {/* [A] Análisis + Códigos CIE-10 */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <label className="font-bold text-slate-300">
                    [A] Análisis (Juicio clínico y evolución del cuadro)
                  </label>
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[9px] text-slate-500 font-bold">CIE-10:</span>
                    {QUICK_ICD10_LIST.slice(0, 4).map((icd) => (
                      <button
                        key={icd.code}
                        type="button"
                        onClick={() => {
                          const str = `Dx: [${icd.code}] ${icd.name}.`;
                          setAssessment(prev => prev ? `${prev} ${str}` : str);
                        }}
                        className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded text-[9px] font-bold hover:bg-indigo-500/20"
                      >
                        {icd.code}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  placeholder="Evolución clínica satisfactoria en respuesta a tratamiento instaurado, sin complicaciones..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 font-normal leading-relaxed resize-y min-h-[85px]"
                  required
                />
              </div>

              {/* [P] Plan */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <label className="font-bold text-slate-300">
                    [P] Plan (Conducta terapéutica, ajustes y exámenes solicitados)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (patientMeds.length > 0) {
                        const medList = patientMeds.map((m, i) => `${i + 1}. Continuar ${m.drugName} ${m.dose} vía ${m.route} (${m.frequency})`).join('\n');
                        setPlan(prev => prev ? `${prev}\n${medList}` : medList);
                        window.dispatchEvent(
                          new CustomEvent('lis-global-toast', {
                            detail: {
                              title: 'Fármacos Insertados',
                              message: `Se agregaron ${patientMeds.length} prescripciones activas al plan médico.`,
                              type: 'info'
                            }
                          })
                        );
                      } else {
                        const baselineMeds = [
                          '1. Omeprazol 40 mg IV cada 24h (Gastroprotección)',
                          '2. Paracetamol 1 g IV PRN si fiebre o dolor moderado',
                          '3. Solución Salina 0.9% 1000 cc a 80 cc/h IV'
                        ].join('\n');
                        setPlan(prev => prev ? `${prev}\n${baselineMeds}` : baselineMeds);
                        window.dispatchEvent(
                          new CustomEvent('lis-global-toast', {
                            detail: {
                              title: 'Pauta Basal Hospitalaria Insertada',
                              message: 'Sin fármacos previos: Se insertó pauta médica basal hospitalaria estándar.',
                              type: 'info'
                            }
                          })
                        );
                      }
                    }}
                    className="px-2.5 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold hover:bg-amber-500/25 transition cursor-pointer flex items-center space-x-1"
                  >
                    <span>+ Insertar Fármacos Activos ({patientMeds.length})</span>
                  </button>
                </div>
                <textarea
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  placeholder="1. Continuar antibiótico. 2. Solicitar hemograma de control en LIS. 3. Dieta blanda a tolerancia..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 font-normal leading-relaxed resize-y min-h-[90px]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black rounded-xl shadow-lg shadow-indigo-600/25 transition cursor-pointer flex items-center justify-center space-x-2 text-xs uppercase tracking-wider"
              >
                <Check className="w-4 h-4" />
                <span>Firmar y Guardar Nota SOAP (Firma Biométrica Médica)</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Historial de Evolución Médica ({patientSoapNotes.length})</span>
            </h3>

            {patientSoapNotes.length > 0 ? (
              <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1">
                {patientSoapNotes.map((note) => (
                  <div key={note.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400 border-b border-slate-900 pb-2">
                      <span className="font-bold text-indigo-300">{note.doctorName} ({note.doctorLicense})</span>
                      <span>{new Date(note.timestamp).toLocaleString('es-PA')}</span>
                    </div>

                    <div className="space-y-1.5 text-slate-300">
                      <p className="whitespace-pre-wrap leading-relaxed"><strong className="text-white">[S]:</strong> {note.subjective}</p>
                      <p className="whitespace-pre-wrap leading-relaxed"><strong className="text-white">[O]:</strong> {note.objective}</p>
                      <p className="whitespace-pre-wrap leading-relaxed"><strong className="text-white">[A]:</strong> {note.assessment}</p>
                      <p className="whitespace-pre-wrap leading-relaxed"><strong className="text-white">[P]:</strong> {note.plan}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center space-y-3">
                <FileText className="w-10 h-10 text-slate-600 stroke-[1.5]" />
                <div className="space-y-1">
                  <p className="text-slate-300 font-bold text-xs">Sin notas SOAP previas registradas</p>
                  <p className="text-slate-500 text-[11px] max-w-xs">
                    Las evoluciones médicas firmadas para este paciente durante su internación aparecerán cronológicamente en este panel.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIMENSIÓN ANATOMÍA: MAPA CORPORAL ANATÓMICO INTERACTIVO */}
      {subTab === 'anatomia' && (
        <AnatomicalBodyMap
          patientId={activeAdmission.id}
          patientName={activeAdmission.patientName}
          onInsertIntoSoap={(text) => {
            setObjective((prev) => (prev ? `${prev}\n\n${text}` : text));
            setSubTab('soap');
          }}
        />
      )}

      {/* DIMENSIÓN 3: MEDICAMENTOS & FARMACIA (eMAR) */}
      {subTab === 'meds' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Pill className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Prescribir Nuevo Medicamento</h3>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                eMAR / Farmacia Hospitalaria
              </span>
            </div>

            {/* 💡 RECOMENDACIONES CLÍNICAS POR ENFERMEDAD (CDS - NO OBLIGATORIO) */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-amber-500/30 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                <div className="flex items-center space-x-1.5 font-bold text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Recomendaciones por Patología (Guías Clínicas MINSA/OMS)</span>
                </div>
                <span className="text-[9px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                  Sugerencias • No obligatorio
                </span>
              </div>

              {/* Selector de Patología */}
              <div className="flex flex-wrap gap-1.5">
                {MED_DISEASE_RECOMMENDATIONS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedDiseaseCategory(cat.name)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center space-x-1 ${
                      selectedDiseaseCategory === cat.name
                        ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name.split('/')[0].trim()}</span>
                  </button>
                ))}
              </div>

              {/* Fármacos Recomendados para la Patología Seleccionada */}
              {(() => {
                const currentCat = MED_DISEASE_RECOMMENDATIONS.find((c) => c.name === selectedDiseaseCategory) || MED_DISEASE_RECOMMENDATIONS[0];
                return (
                  <div className="pt-1.5 border-t border-slate-900 space-y-1.5">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Toque cualquier esquema sugerido para auto-rellenar la prescripción:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentCat.protocols.map((proto, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setDrugName(proto.name);
                            setDose(proto.dose);
                            setRoute(proto.route);
                            setFrequency(proto.frequency);
                            window.dispatchEvent(
                              new CustomEvent('lis-global-toast', {
                                detail: {
                                  message: `✓ Esquema cargado: ${proto.name} ${proto.dose} (${proto.frequency}). Puede editarlo libremente.`,
                                  type: 'info'
                                }
                              })
                            );
                          }}
                          className="p-2 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-400/50 rounded-xl text-left transition cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs group-hover:text-amber-300 transition">
                              {proto.name}
                            </span>
                            <span className="text-[9px] font-mono text-amber-400 font-bold">
                              {proto.dose}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Vía: <strong className="text-slate-300">{proto.route}</strong> • {proto.frequency.replace('_', ' ')}
                          </div>
                          <div className="text-[9px] text-slate-500 italic mt-0.5">
                            {proto.note}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <form onSubmit={handleCreateMedOrder} className="space-y-3 text-xs pt-1">
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Fármaco / Principio Activo (o personalizado)
                </label>
                <input
                  type="text"
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  placeholder="Ej: Ceftriaxona, Enoxaparina, Furosemida..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Dosis Prescrita</label>
                  <input
                    type="text"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    placeholder="Ej: 1 g, 40 mg, 500 mg"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Vía de Administración</label>
                  <select
                    value={route}
                    onChange={(e) => setRoute(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium cursor-pointer"
                  >
                    <option value="INTRAVENOSA">Intravenosa (IV)</option>
                    <option value="ORAL">Oral (VO)</option>
                    <option value="SUBCUTANEA">Subcutánea (SC)</option>
                    <option value="INTRAMUSCULAR">Intramuscular (IM)</option>
                    <option value="INHALATORIA">Inhalatoria</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Frecuencia de Dosificación</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium cursor-pointer"
                >
                  <option value="CADA_6H">Cada 6 Horas</option>
                  <option value="CADA_8H">Cada 8 Horas</option>
                  <option value="CADA_12H">Cada 12 Horas</option>
                  <option value="CADA_24H">Cada 24 Horas</option>
                  <option value="STAT_UNICA">STAT Dosis Única</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar a Hoja de Indicaciones y Kardex eMAR</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center space-x-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Medicamentos Activos en Hoja de Indicaciones ({patientMeds.length})</span>
            </h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {patientMeds.map((med) => (
                <div key={med.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-white text-sm">{med.drugName} ({med.dose})</div>
                    <div className="text-[11px] text-amber-300">Vía: {med.route} • Frecuencia: {med.frequency}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Prescrito por: {med.orderedBy}</div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black">
                    ACTIVO
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DIMENSIÓN 4: LABORATORIO CLÍNICO LIS */}
      {subTab === 'lab' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-teal-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                  <Microscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">CPOE — Solicitud Electrónica de Laboratorio al LIS</h3>
                  <p className="text-[11px] text-slate-400">Interoperabilidad bidireccional nativa HIS ↔ LIS con emisión de código de barras</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full font-bold flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                  <span>Canal HL7 ORM^O01 En Línea</span>
                </span>
              </div>
            </div>

            {/* 1-Click Perfiles Clínicos Rápidos (Order Sets) */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Perfiles Clínicos Hospitalarios de 1-Click (Order Sets)</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {CLINICAL_ORDER_SETS.map((set) => {
                  const isAllSelected = set.testIds.every(tId => selectedTestIds.includes(tId));
                  return (
                    <button
                      key={set.id}
                      type="button"
                      onClick={() => {
                        if (isAllSelected) {
                          setSelectedTestIds(selectedTestIds.filter(id => !set.testIds.includes(id)));
                        } else {
                          const combined = Array.from(new Set([...selectedTestIds, ...set.testIds]));
                          setSelectedTestIds(combined);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isAllSelected
                          ? 'bg-teal-950/40 border-teal-500 text-teal-200 shadow-md shadow-teal-500/10'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs text-white">
                        <span>{set.name}</span>
                        {isAllSelected && <Check className="w-3.5 h-3.5 text-teal-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{set.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Buscador y Filtros por Sección Analítica */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar analito por nombre o código (Ej: Troponina, Glucosa, Creatinina, Hemograma...)"
                  value={labSearchTerm}
                  onChange={(e) => setLabSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>

              {/* Categorías */}
              <div className="flex flex-wrap gap-1.5">
                {(['TODOS', 'HEMATOLOGIA', 'QUIMICA', 'COAGULACION', 'INMUNOLOGIA'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setLabCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                      labCategoryFilter === cat
                        ? 'bg-teal-500 text-slate-950 font-black shadow-md shadow-teal-500/20'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Visual de Exámenes del Catálogo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {MOCK_TEST_CATALOG
                .filter((item) => {
                  const matchSearch = item.name.toLowerCase().includes(labSearchTerm.toLowerCase()) || item.category.toLowerCase().includes(labSearchTerm.toLowerCase());
                  const matchCat = labCategoryFilter === 'TODOS' || item.category.toUpperCase().includes(labCategoryFilter);
                  return matchSearch && matchCat;
                })
                .map((item) => {
                  const isSelected = selectedTestIds.includes(item.id);
                  const isEdta = item.name.toLowerCase().includes('hemo') || item.category.toLowerCase().includes('hema');
                  const isCitrate = item.name.toLowerCase().includes('coag') || item.name.toLowerCase().includes('tp');
                  const tubeColor = isEdta ? '🟣 EDTA Morado' : isCitrate ? '🔵 Citrato Azul' : '🔴 Suero Rojo';
                  
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTestIds(selectedTestIds.filter(id => id !== item.id));
                        } else {
                          setSelectedTestIds([...selectedTestIds, item.id]);
                        }
                      }}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-teal-950/40 border-teal-500 shadow-md shadow-teal-500/10 ring-1 ring-teal-500/50'
                          : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition ${
                            isSelected ? 'bg-teal-500 border-teal-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <span className="font-bold text-white text-xs leading-snug">{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 pl-6">
                          <span>{tubeColor}</span>
                          <span>•</span>
                          <span className="text-teal-400 font-bold">${item.price.toFixed(2)}</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">
                        {item.category.slice(0, 4)}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Bandeja de Resumen de la Orden y Selección */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">Exámenes Seleccionados:</span>
                  <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 font-black rounded-full text-[10px]">
                    {selectedTestIds.length} pruebas
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    (Total Estimado: <strong className="text-white font-mono">${
                      selectedTestIds.reduce((sum, id) => {
                        const test = MOCK_TEST_CATALOG.find(t => t.id === id);
                        return sum + (test?.price || 0);
                      }, 0).toFixed(2)
                    }</strong>)
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                  <span>📍 Procedencia:</span>
                  <strong className="text-teal-300 font-mono">
                    {getWardLocationLabel(activeAdmission)} • Cama {activeBed?.bedNumber || '01'}
                  </strong>
                </div>
              </div>

              {/* Chips de Exámenes para Deseleccionar Fácilmente */}
              {selectedTestIds.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTestIds.map((id) => {
                    const test = MOCK_TEST_CATALOG.find(t => t.id === id);
                    return (
                      <span
                        key={id}
                        className="px-2.5 py-1 bg-slate-900 border border-teal-500/40 text-teal-200 rounded-xl text-[10px] font-bold flex items-center space-x-1.5"
                      >
                        <span>{test?.name || id}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedTestIds(selectedTestIds.filter(t => t !== id))}
                          className="hover:text-rose-400 transition cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic">
                  No ha seleccionado ningún examen. Elija arriba o utilice los perfiles rápidos de 1-click.
                </div>
              )}
            </div>

            {/* Selector de Prioridad Moderno & Emisión */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center pt-2">
              <div className="lg:col-span-8 space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                  Prioridad de Procesamiento Analítico & TAT:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {(['RUTINA', 'URGENTE', 'STAT'] as const).map((p) => {
                    const isStat = p === 'STAT';
                    const isUrg = p === 'URGENTE';
                    const isSelected = orderPriority === p;
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setOrderPriority(p)}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? isStat
                              ? 'bg-rose-500/20 border-rose-500 text-rose-200 shadow-md shadow-rose-500/20 ring-1 ring-rose-500'
                              : isUrg
                              ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md shadow-amber-500/20 ring-1 ring-amber-500'
                              : 'bg-teal-500/20 border-teal-500 text-teal-200 shadow-md shadow-teal-500/20 ring-1 ring-teal-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between font-black text-xs">
                          <span>{isStat ? '⚡ Urgente Inmediata' : isUrg ? '⏰ Prioritaria' : '📋 Rutina'}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="text-[10px] mt-1 font-mono text-slate-400">
                          {isStat ? 'TAT Inmediato < 45 min' : isUrg ? 'TAT Prioritario < 2 horas' : 'TAT Estándar < 4 horas'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-4 pt-4 lg:pt-0">
                <button
                  type="button"
                  onClick={handleDispatchLabOrder}
                  disabled={selectedTestIds.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-30 disabled:pointer-events-none text-slate-950 font-black rounded-2xl shadow-xl shadow-teal-500/25 transition cursor-pointer flex items-center justify-center space-x-2 text-xs uppercase tracking-wider"
                >
                  <Send className="w-4 h-4" />
                  <span>Emitir Solicitud Electrónica al LIS</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Órdenes & Resultados de Laboratorio de este Paciente ({patientLabOrders.length})</span>
              <span className="text-[10px] text-teal-400 font-bold">Sincronización Automática</span>
            </h3>

            {patientLabOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 rounded-l-xl">N° Orden LIS</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Prioridad</th>
                      <th className="p-3">Estado LIS</th>
                      <th className="p-3">Resultados Analíticos Validados</th>
                      <th className="p-3 rounded-r-xl text-right">Informe Oficial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {patientLabOrders.map((ord) => {
                      const ordResults = results.filter((r) => r.orderId === ord.id);
                      return (
                        <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-mono font-bold text-teal-300">{ord.orderNumber}</td>
                          <td className="p-3 text-slate-400">{new Date(ord.createdAt).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              ord.priority === 'STAT' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {ord.priority === 'STAT' ? 'URGENTE INMEDIATA' : ord.priority === 'URGENTE' ? 'PRIORITARIA' : 'RUTINA'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              ord.status === 'VALIDADA_MED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="p-3">
                            {ordResults.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {ordResults.map((res) => (
                                  <span
                                    key={res.id}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                                      res.flag === 'CRITICO_ALTO' || res.flag === 'CRITICO_BAJO'
                                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                                        : res.flag === 'ALTO' || res.flag === 'BAJO'
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                        : 'bg-slate-800 text-slate-300 border-slate-700'
                                    }`}
                                  >
                                    {res.parameterName}: {res.value} {res.unit}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">Procesando en analizador...</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => onOpenPdf && onOpenPdf(ord.id)}
                              className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-[10px] font-bold transition cursor-pointer"
                            >
                              Ver PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <Microscope className="w-10 h-10 text-teal-400/40 mx-auto" />
                <div className="space-y-1">
                  <p className="font-bold text-white text-sm">Sin Estudios de Laboratorio Registrados</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Este paciente no cuenta con órdenes de análisis clínico en el LIS. La consulta médica, evolución SOAP y prescripción farmacológica operan de forma 100% independiente.
                  </p>
                </div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[11px] text-teal-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Puede emitir una orden arriba si el cuadro clínico lo requiere</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIMENSIÓN 5: IMÁGENES DIAGNÓSTICAS RIS / PACS */}
      {subTab === 'imaging' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-sm">Estudios Radiológicos & Visor DICOM del Paciente</h3>
              </div>
              <span className="text-[10px] bg-sky-500/10 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-full font-bold">
                RIS / PACS Hospitalario
              </span>
            </div>

            <div className="space-y-4">
              {patientImagingStudies.length > 0 ? (
                patientImagingStudies.map((study) => (
                  <div key={study.id} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                      <div>
                        <span className="font-mono text-sky-400 font-bold">{study.accessionNumber}</span>
                        <h4 className="font-bold text-white text-sm">{study.modalityName}</h4>
                        <p className="text-[11px] text-slate-400">Solicitado por: {study.orderingDoctor} • Fecha: {study.studyDate}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                          {study.status}
                        </span>
                        <button
                          onClick={() => setSelectedDicomStudy(study)}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Abrir Visor DICOM</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Informe Radiológico Oficial ({study.radiologist})</span>
                      <p className="text-slate-200 leading-relaxed italic">"{study.report}"</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <Layers className="w-10 h-10 text-sky-400/40 mx-auto" />
                  <div className="space-y-1">
                    <p className="font-bold text-white text-sm">Sin Estudios de Imagenología Registrados</p>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      El episodio clínico actual no ha requerido estudios radiológicos, ultrasonografía ni tomografía (RIS / PACS).
                    </p>
                  </div>
                  <span className="inline-block px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] text-slate-400 font-mono">
                    RIS / PACS En Espera de Solicitud Médica
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DIMENSIÓN 6: BANCO DE SANGRE & TRANSFUSIONES */}
      {subTab === 'bloodbank' && (
        <div className="space-y-6">
          {patientTransfusions.length > 0 ? (
            <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Droplets className="w-5 h-5 text-rose-500" />
                  <h3 className="font-bold text-white text-sm">Inmunohematología & Historial Transfusional del Paciente</h3>
                </div>
                <span className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-full font-bold">
                  Trazabilidad Vena a Vena
                </span>
              </div>

              {/* Inmunohematology Profile */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Grupo ABO</span>
                  <span className="text-2xl font-black text-rose-500 font-mono">{patientTransfusions[0].aboGroup}</span>
                  <span className="text-[10px] text-teal-400 block">Directa e Inversa OK</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Factor Rh(D)</span>
                  <span className="text-2xl font-black text-white font-mono">{patientTransfusions[0].rhFactor === 'POS' ? 'Positivo (+)' : 'Negativo (-)'}</span>
                  <span className="text-[10px] text-slate-400 block">Fenotipo Confirmado</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Anticuerpos Irregulares</span>
                  <span className="text-xl font-black text-teal-400">{patientTransfusions[0].irregularAntibodiesScreening}</span>
                  <span className="text-[10px] text-teal-300 block">PAI Paneles I, II, III</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Hemovigilancia</span>
                  <span className="text-xl font-black text-emerald-400">
                    {patientTransfusions[0].hasAdverseReaction ? 'ALERTA REACCIÓN' : 'SEGURO'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {patientTransfusions[0].hasAdverseReaction ? 'Reportado a MINSA' : 'Sin eventos adversos'}
                  </span>
                </div>
              </div>

              {/* Transfusion Records */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-white text-xs">Registro de Unidades & Pruebas Cruzadas de este Paciente ({patientTransfusions.length})</h4>

                <div className="space-y-3">
                  {patientTransfusions.map((trx) => (
                    <div key={trx.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                        <div>
                          <span className="font-mono text-rose-400 font-bold">{trx.caseNumber}</span>
                          <span className="ml-2 text-white font-bold">{trx.componentRequested.replace(/_/g, ' ')} ({trx.unitsRequested} U)</span>
                        </div>
                        <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-[10px] font-bold">
                          Etapa: {trx.currentStage}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                        <p><strong className="text-white">Unidad Asignada:</strong> <span className="font-mono text-teal-300 font-bold">{trx.assignedUnitCode || 'En proceso'}</span> ({trx.assignedUnitGroup || 'O+'})</p>
                        <p><strong className="text-white">Compatibilidad Cruzada:</strong> <span className="text-emerald-400 font-bold">{trx.crossmatchMajor || 'COMPATIBLE'}</span> (Fase Gel/Coombs)</p>
                        <p><strong className="text-white">Indicación Clínica:</strong> {trx.clinicalIndication}</p>
                        <p><strong className="text-white">Rendimiento:</strong> {trx.postHbHctYield || 'Evaluación post-infusión satisfactoria'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-4">
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
                <Droplets className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-lg mx-auto">
                <h3 className="text-lg font-bold text-white">Sin Registros en Banco de Sangre</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Este paciente no cuenta con solicitudes transfusionales, hemocomponentes reservados ni pruebas pretransfusionales (Coombs / Crossmatch) en el Banco de Sangre.
                </p>
                <p className="text-[11px] text-slate-500">
                  En PLATAFORMA-LIS, la atención médica ambulatoria y hospitalaria opera de manera desacoplada: los módulos especializados solo aportan datos cuando existe un requerimiento clínico real.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs font-mono">
                  Expediente: EXP-{activeAdmission.patientNationalId.replace(/-/g, '')}
                </span>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Sin antecedentes transfusionales ni reacciones adversas</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: VISOR DICOM PACS */}
      {selectedDicomStudy && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-sky-400" />
                  <span>Visor DICOM Radiológico • {selectedDicomStudy.modalityName}</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Accession: {selectedDicomStudy.accessionNumber} • Paciente: {activeAdmission.patientName} ({activeAdmission.patientNationalId})
                </p>
              </div>
              <button
                onClick={() => setSelectedDicomStudy(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* DICOM Canvas Simulation */}
            <div className="bg-black rounded-2xl border border-slate-800 h-80 sm:h-96 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-4 left-4 text-[10px] font-mono text-slate-400 space-y-1">
                <p>PACIENTE: {activeAdmission.patientName.toUpperCase()}</p>
                <p>CÉDULA: {activeAdmission.patientNationalId}</p>
                <p>MODALIDAD: {selectedDicomStudy.modality}</p>
                <p>SERIES: 1/{selectedDicomStudy.dicomImagesCount}</p>
              </div>

              <div className="text-center space-y-2">
                <Layers className="w-16 h-16 text-sky-500/50 mx-auto animate-pulse" />
                <span className="text-xs font-mono text-slate-400 block">[SERIE DICOM RENDERIZADA EN ALTA RESOLUCIÓN]</span>
                <span className="text-[10px] text-slate-600 block">Ventana mediastínica / parénquima pulmonar 1024x1024</span>
              </div>

              <div className="absolute bottom-4 flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
                <button className="p-1 hover:text-white cursor-pointer"><ZoomIn className="w-4 h-4" /></button>
                <button className="p-1 hover:text-white cursor-pointer"><Sliders className="w-4 h-4" /></button>
                <button className="p-1 hover:text-white cursor-pointer"><RotateCw className="w-4 h-4" /></button>
                <span className="text-[10px] font-mono text-slate-500">W: 400 L: 40</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Informe Radiológico Oficial</span>
              <p className="text-slate-200 italic leading-relaxed">{selectedDicomStudy.report}</p>
              <span className="text-[10px] text-sky-400 font-bold block pt-1">Firmado digitalmente: {selectedDicomStudy.radiologist}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
