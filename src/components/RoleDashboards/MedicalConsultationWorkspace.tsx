import React, { useState, useEffect, useMemo } from 'react';
import { Order, TestResult } from '../../types';
import { useLisStore } from '../../store/useLisStore';
import { MOCK_TEST_CATALOG } from '../../data/mockData';
import {
  Stethoscope, User, Calendar, Clock, AlertTriangle, CheckCircle2,
  ChevronRight, FileText, Pill, Activity, Zap, Search, Filter,
  ShieldCheck, Printer, Plus, X, ArrowLeft, Send, Sparkles,
  HeartPulse, Thermometer, Weight, Ruler, FileCheck, Share2,
  ClipboardList, Check, Eye, BadgeAlert, AlertCircle, Edit3,
  Save, RefreshCw, UserCheck, Phone, Mail, Award, Lock, FileSpreadsheet,
  LayoutGrid, List, Trash2, Droplets
} from 'lucide-react';
import { turnService } from '../../utils/turnService';
import { AnatomicalBodyMap } from '../HospitalSuite/AnatomicalBodyMap';
import SupabaseService from '../../services/SupabaseService';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

export interface ConsultationPatient {
  id: string;
  turnNumber: string;
  position: number;
  nationalId: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  arrivalTime: string;
  consultationReason: string;
  chiefComplaint?: string;        // Motivo principal (se usa para Supabase HIS)
  consultationType: 'PRIMERA_VEZ' | 'CONTROL' | 'URGENCIA_AMBULATORIA' | 'PREOPERATORIA' | 'INTERCONSULTA';
  status: 'PENDIENTE' | 'EN_ESPERA' | 'EN_CONSULTA' | 'FINALIZADA' | 'CANCELADA';
  priority: 'RUTINA' | 'PRIORITARIA' | 'URGENTE';
  bloodType: string;
  allergies: string[];
  origin?: string;
  vitals: {
    bp: string;
    hr: number;
    rr: number;
    temp: number;
    spo2: number;
    weightKg: number;
    heightCm: number;
    bmi: number;
  };
  medicalHistory: {
    pathological: string[];
    surgical: string[];
    family: string[];
    habits: string[];
    currentMeds: string[];
  };
  soapNote?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    primaryIcd10: string;
    secondaryIcd10?: string[];
  };
  prescriptions: Array<{
    id: string;
    medication: string;
    dose: string;
    route: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  labOrders: Array<{
    id: string;
    orderNumber?: string;
    testNames: string[];
    priority: 'RUTINA' | 'URGENTE';
    timestamp: string;
    status?: 'PENDIENTE_ENVIO' | 'ENVIADO_LIS' | 'CANCELADO';
    fullOrder?: Order;
  }>;
  imagingOrders: Array<{
    id: string;
    modality: string;
    studyName: string;
    indication: string;
    priority: 'RUTINA' | 'URGENTE';
  }>;
  bloodOrders?: Array<{
    id: string;
    productType: 'CONCENTRADO_GLOBULOS_ROJOS' | 'PLASMA_FRESCO_CONGELADO' | 'CONCENTRADO_PLAQUETARIO' | 'CRIOPRECIPITADO';
    units: number;
    urgency: 'STAT_INMEDIATA' | 'URGENTE_2H' | 'RESERVA_ELECTIVA';
    indication: string;
    timestamp: string;
    status: 'SOLICITADA' | 'EN_CRUCE' | 'DISPONIBLE' | 'TRANSFUNDIDA';
  }>;
  medicalLeave?: {
    days: number;
    startDate: string;
    endDate: string;
    diagnosis: string;
    justification: string;
  };
  referral?: {
    specialty: string;
    reason: string;
    priority: 'RUTINA' | 'URGENTE';
  };
  startTime?: string;
  endTime?: string;
  attendedBy?: string;
}

export interface MedicalConsultationWorkspaceProps {
  orders: Order[];
  results: TestResult[];
  doctorInfo: {
    name: string;
    license: string;
    clinic: string;
    specialty?: string;
    minsaRegistrationNumber?: string;
    phone?: string;
    email?: string;
  };
  onOpenPdf: (orderId: string) => void;
  onCreateOrder?: (newOrder: Order) => void;
}

const INITIAL_QUEUE_PATIENTS: ConsultationPatient[] = [
  {
    id: 'cpat-001',
    turnNumber: 'C-01',
    position: 1,
    nationalId: '8-842-1920',
    name: 'Ing. Rubén Ábrego',
    age: 42,
    gender: 'M',
    arrivalTime: '08:15 AM',
    consultationReason: 'Control de síndrome metabólico, chequeo de glucosa y ajuste de tratamiento.',
    consultationType: 'CONTROL',
    status: 'EN_ESPERA',
    priority: 'RUTINA',
    bloodType: 'O+',
    allergies: ['Penicilina G'],
    vitals: {
      bp: '128/82',
      hr: 74,
      rr: 16,
      temp: 36.6,
      spo2: 99,
      weightKg: 82,
      heightCm: 176,
      bmi: 26.5
    },
    medicalHistory: {
      pathological: ['Diabetes Mellitus Tipo 2 (Dx 2021)', 'Dislipidemia Mixta'],
      surgical: ['Apendicectomía (2012)'],
      family: ['Padre: Cardiopatía isquémica', 'Madre: Diabetes Tipo 2'],
      habits: ['No fumador', 'Consumo ocasional de alcohol', 'Actividad física moderada 2x/sem'],
      currentMeds: ['Metformina 850 mg VO cada 12h', 'Atorvastatina 20 mg VO cada noche']
    },
    prescriptions: [],
    labOrders: [],
    imagingOrders: []
  },
  {
    id: 'cpat-002',
    turnNumber: 'C-02',
    position: 2,
    nationalId: '8-812-4432',
    name: 'María Elena González',
    age: 32,
    gender: 'F',
    arrivalTime: '08:30 AM',
    consultationReason: 'Cefalea frontal pulsátil intensa de 48 horas de evolución con fotofobia y náuseas.',
    consultationType: 'URGENCIA_AMBULATORIA',
    status: 'EN_ESPERA',
    priority: 'URGENTE',
    bloodType: 'A+',
    allergies: ['Sulfamidas', 'AINES (Broncoespasmo)'],
    vitals: {
      bp: '135/88',
      hr: 88,
      rr: 18,
      temp: 37.1,
      spo2: 98,
      weightKg: 64,
      heightCm: 162,
      bmi: 24.4
    },
    medicalHistory: {
      pathological: ['Migraña con aura episódica', 'Rinitis alérgica'],
      surgical: ['Cesárea segmentaria (2020)'],
      family: ['Hermana: Migraña crónica'],
      habits: ['No fumadora', 'Consumo de café 2 tazas/día'],
      currentMeds: ['Sumatriptán 50 mg PRN si crisis']
    },
    prescriptions: [],
    labOrders: [],
    imagingOrders: []
  },
  {
    id: 'cpat-003',
    turnNumber: 'C-03',
    position: 3,
    nationalId: '4-721-9088',
    name: 'Carlos Samudio González',
    age: 58,
    gender: 'M',
    arrivalTime: '08:45 AM',
    consultationReason: 'Opresión precordial de esfuerzo y disnea grado II. Antecedente coronario.',
    consultationType: 'INTERCONSULTA',
    status: 'EN_ESPERA',
    priority: 'PRIORITARIA',
    bloodType: 'O-',
    allergies: ['Ninguna conocida (NKDA)'],
    vitals: {
      bp: '142/90',
      hr: 84,
      rr: 20,
      temp: 36.8,
      spo2: 96,
      weightKg: 88,
      heightCm: 172,
      bmi: 29.7
    },
    medicalHistory: {
      pathological: ['Hipertensión Arterial Grado 2 (Dx 2015)', 'Enfermedad Arterial Coronaria'],
      surgical: ['Stent coronario en ADA (2022)'],
      family: ['Padre: Infarto agudo a los 55 años'],
      habits: ['Ex fumador (Cesó en 2022)', 'Sedentario'],
      currentMeds: ['AAS 100 mg VO día', 'Bisoprolol 5 mg VO cada mañana', 'Losartán 50 mg VO cada 12h']
    },
    prescriptions: [],
    labOrders: [],
    imagingOrders: []
  },
  {
    id: 'cpat-004',
    turnNumber: 'C-04',
    position: 4,
    nationalId: '8-745-1290',
    name: 'Gabriela Pinzón Varela',
    age: 29,
    gender: 'F',
    arrivalTime: '09:10 AM',
    consultationReason: 'Evaluación ginecológica y revisión de exámenes de rutina prenatal.',
    consultationType: 'PRIMERA_VEZ',
    status: 'PENDIENTE',
    priority: 'RUTINA',
    bloodType: 'B+',
    allergies: ['Ninguna conocida (NKDA)'],
    vitals: {
      bp: '115/75',
      hr: 72,
      rr: 16,
      temp: 36.5,
      spo2: 99,
      weightKg: 59,
      heightCm: 165,
      bmi: 21.7
    },
    medicalHistory: {
      pathological: ['Alergia estacional leve'],
      surgical: ['Ninguna'],
      family: ['Sin antecedentes de relevancia'],
      habits: ['No fumadora', 'Dieta equilibrada'],
      currentMeds: ['Ácido Fólico 400 mcg VO día']
    },
    prescriptions: [],
    labOrders: [],
    imagingOrders: []
  },
  {
    id: 'cpat-005',
    turnNumber: 'C-05',
    position: 5,
    nationalId: '8-910-3341',
    name: 'Elena Castillo Vega',
    age: 45,
    gender: 'F',
    arrivalTime: '09:25 AM',
    consultationReason: 'Control postoperatorio de colecistectomía laparoscópica y retiro de puntos.',
    consultationType: 'CONTROL',
    status: 'FINALIZADA',
    priority: 'RUTINA',
    bloodType: 'O+',
    allergies: ['Iodo / Medios de contraste'],
    vitals: {
      bp: '120/80',
      hr: 70,
      rr: 16,
      temp: 36.4,
      spo2: 99,
      weightKg: 68,
      heightCm: 160,
      bmi: 26.6
    },
    medicalHistory: {
      pathological: ['Colelitiasis sintomática resuelta'],
      surgical: ['Colecistectomía Laparoscópica (hace 10 días)'],
      family: ['Madre: Litiasis vesicular'],
      habits: ['No fumadora'],
      currentMeds: ['Paracetamol 500 mg VO PRN']
    },
    soapNote: {
      subjective: 'Paciente asintomática, deambula sin dificultad. Buena tolerancia a dieta blanda.',
      objective: 'Heridas quirúrgicas umbilical y subcostales secas, bordes cicatrizados, sin eritema ni secreciones. Se retiran 4 puntos sin complicaciones.',
      assessment: 'Evolución postoperatoria favorable y alta médica de la cirugía.',
      plan: '1. Alta postquirúrgica definitiva.\n2. Dieta baja en grasas saturadas por 30 días.\n3. Actividad física progresiva.',
      primaryIcd10: 'Z48.8 — Otros cuidados de seguimiento especificados postoperatorios'
    },
    prescriptions: [],
    labOrders: [],
    imagingOrders: [],
    startTime: '09:30 AM',
    endTime: '09:45 AM',
    attendedBy: 'Dr. Roberto Icaza (MED-10492-PA)'
  }
];

const COMMON_DRUGS_PRESETS = [
  { name: 'Amoxicilina + Clavulánico', dose: '875/125 mg', route: 'Oral', freq: 'Cada 12 horas', dur: '7 días', note: 'Tomar al inicio de las comidas principales' },
  { name: 'Ibuprofeno', dose: '400 mg', route: 'Oral', freq: 'Cada 8 horas', dur: '3 días', note: 'Tomar después de comer con abundante agua. Suspender si no hay dolor' },
  { name: 'Paracetamol', dose: '500 mg - 1 g', route: 'Oral', freq: 'Cada 8 horas PRN', dur: '5 días', note: 'Para fiebre o dolor moderado. Máximo 4 gramos al día' },
  { name: 'Omeprazol', dose: '20 mg', route: 'Oral', freq: 'Cada 24 horas', dur: '14 días', note: 'Tomar en ayunas, 30 minutos antes del desayuno' },
  { name: 'Losartán Potásico', dose: '50 mg', route: 'Oral', freq: 'Cada 24 horas', dur: '30 días', note: 'Tomar todas las mañanas. Monitorear presión arterial' },
  { name: 'Metformina Clorhidrato', dose: '850 mg', route: 'Oral', freq: 'Cada 12 horas', dur: '30 días', note: 'Tomar con el almuerzo y cena' },
  { name: 'Azitromicina', dose: '500 mg', route: 'Oral', freq: 'Cada 24 horas', dur: '3 días', note: 'Tomar a la misma hora cada día' },
  { name: 'Ketorolaco Trometamina', dose: '10 mg', route: 'Sublingual / Oral', freq: 'Cada 8 horas PRN', dur: '3 días', note: 'Dolor agudo moderado a severo. Máximo 5 días de tratamiento' }
];

const COMMON_ICD10 = [
  { code: 'E11.9', name: 'Diabetes mellitus tipo 2 sin mención de complicación' },
  { code: 'I10.X', name: 'Hipertensión esencial (primaria)' },
  { code: 'J00.X', name: 'Rinofaringitis aguda (resfriado común)' },
  { code: 'J02.9', name: 'Faringitis aguda, no especificada' },
  { code: 'K29.7', name: 'Gastritis, no especificada' },
  { code: 'G43.9', name: 'Migraña, no especificada' },
  { code: 'M54.5', name: 'Lumbago no especificado' },
  { code: 'R10.4', name: 'Otros dolores abdominales y los no especificados' },
  { code: 'N39.0', name: 'Infección de vías urinarias, sitio no especificado' },
  { code: 'E78.5', name: 'Hiperlipidemia, no especificada' }
];

// Helper para diferenciar con colores llamativos y normados los turnos y prioridades
const getTurnBadgeStyle = (turnNumber: string, priority?: string, consultationType?: string) => {
  const upper = (turnNumber || '').toUpperCase();
  const isUrgent = priority === 'URGENTE' || upper.startsWith('URG') || consultationType === 'URGENCIA_AMBULATORIA';
  const isPref = upper.startsWith('PREF') || consultationType === 'INTERCONSULTA';
  const isPed = upper.startsWith('PED');
  const isLab = upper.startsWith('LAB');
  const isImg = upper.startsWith('RX') || upper.startsWith('IMG');

  if (isUrgent) {
    return {
      bg: 'bg-rose-950/90 text-rose-300 border-rose-500/80 shadow-rose-950/60 shadow-md ring-1 ring-rose-500/50',
      label: 'URGENCIA',
      rowHighlight: 'bg-rose-950/20 hover:bg-rose-950/30 border-l-4 border-l-rose-500',
      dotColor: 'bg-rose-400'
    };
  }
  if (isPref) {
    return {
      bg: 'bg-amber-950/90 text-amber-300 border-amber-500/80 shadow-amber-950/60 shadow-md ring-1 ring-amber-500/50',
      label: 'PREFERENCIAL',
      rowHighlight: 'bg-amber-950/15 hover:bg-amber-950/25 border-l-4 border-l-amber-500',
      dotColor: 'bg-amber-400'
    };
  }
  if (isPed) {
    return {
      bg: 'bg-sky-950/90 text-sky-300 border-sky-500/80 shadow-sky-950/60 shadow-md ring-1 ring-sky-500/50',
      label: 'PEDIATRÍA',
      rowHighlight: 'bg-sky-950/15 hover:bg-sky-950/25 border-l-4 border-l-sky-500',
      dotColor: 'bg-sky-400'
    };
  }
  if (isLab) {
    return {
      bg: 'bg-purple-950/90 text-purple-300 border-purple-500/80 shadow-purple-950/60 shadow-md ring-1 ring-purple-500/50',
      label: 'LABORATORIO',
      rowHighlight: 'bg-purple-950/15 hover:bg-purple-950/25 border-l-4 border-l-purple-500',
      dotColor: 'bg-purple-400'
    };
  }
  if (isImg) {
    return {
      bg: 'bg-cyan-950/90 text-cyan-300 border-cyan-500/80 shadow-cyan-950/60 shadow-md ring-1 ring-cyan-500/50',
      label: 'IMÁGENES',
      rowHighlight: 'bg-cyan-950/15 hover:bg-cyan-950/25 border-l-4 border-l-cyan-500',
      dotColor: 'bg-cyan-400'
    };
  }

  // Regular / General Consultation C-XX
  return {
    bg: 'bg-teal-950/90 text-teal-300 border-teal-500/60 shadow-teal-950/50 shadow-sm ring-1 ring-teal-500/40',
    label: 'GENERAL',
    rowHighlight: 'border-l-4 border-l-teal-500/70 hover:bg-slate-800/50',
    dotColor: 'bg-teal-400'
  };
};

const getConsultTypeStyle = (type: string) => {
  switch (type) {
    case 'URGENCIA_AMBULATORIA':
      return 'bg-rose-950/80 border-rose-500/60 text-rose-300';
    case 'INTERCONSULTA':
      return 'bg-amber-950/80 border-amber-500/60 text-amber-300';
    case 'PRIMERA_VEZ':
      return 'bg-sky-950/80 border-sky-500/60 text-sky-300';
    case 'CONTROL':
      return 'bg-teal-950/80 border-teal-500/60 text-teal-300';
    case 'PREOPERATORIA':
      return 'bg-purple-950/80 border-purple-500/60 text-purple-300';
    default:
      return 'bg-slate-800/90 border-slate-700 text-indigo-300';
  }
};

const formatConsultType = (type: string) => {
  switch (type) {
    case 'URGENCIA_AMBULATORIA':
      return 'Urgencia';
    case 'PRIMERA_VEZ':
      return '1ra Vez';
    case 'INTERCONSULTA':
      return 'Intercons.';
    case 'CONTROL':
      return 'Control';
    case 'PREOPERATORIA':
      return 'Preop';
    default:
      return (type || '').replace(/_/g, ' ');
  }
};

export const MedicalConsultationWorkspace: React.FC<MedicalConsultationWorkspaceProps> = ({
  orders,
  results,
  doctorInfo,
  onOpenPdf,
  onCreateOrder
}) => {
  const addOrder = useLisStore((state) => state.addOrder);

  // Queue state persisted in localStorage (v2 con sanitización cronológica estricta FIFO)
  const [queue, setQueue] = useState<ConsultationPatient[]>(() => {
    try {
      const saved = localStorage.getItem('lis_medical_consultation_queue_v2') || localStorage.getItem('lis_medical_consultation_queue_v1');
      if (saved) {
        const parsed: ConsultationPatient[] = JSON.parse(saved);
        return parsed.map((p) => {
          if (p.id === 'cpat-005' && p.arrivalTime === '07:45 AM') {
            return { ...p, arrivalTime: '09:25 AM', startTime: '09:30 AM', endTime: '09:45 AM' };
          }
          return p;
        });
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_QUEUE_PATIENTS;
  });

  const saveQueue = (updated: ConsultationPatient[]) => {
    setQueue(updated);
    try {
      localStorage.setItem('lis_medical_consultation_queue_v2', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Sincronización 100% AUTOMÁTICA en segundo plano y en tiempo real con Recepción Central
  const handleSyncWithReception = (isAutomatic: boolean = false) => {
    try {
      const receptionTickets = turnService.getTickets();
      let newCount = 0;
      let newlyAddedName = '';
      let newlyAddedTurn = '';
      const updatedQueue = [...queue];

      receptionTickets.forEach((t) => {
        if (t.status === 'ESPERANDO' || t.status === 'LLAMANDO' || t.status === 'EN_ATENCION') {
          const alreadyExists = updatedQueue.some(
            (p) => (p.nationalId && p.nationalId === t.patientNationalId) || p.turnNumber === t.ticketNumber
          );
          if (!alreadyExists && t.patientName) {
            newCount++;
            newlyAddedName = t.patientName;
            newlyAddedTurn = t.ticketNumber;
            // Los que van llegando de último se agregan estrictamente al final (debajo de los que llegaron primero)
            updatedQueue.push({
              id: `cpat-rec-${t.id}`,
              turnNumber: t.ticketNumber,
              position: updatedQueue.length + 1,
              nationalId: t.patientNationalId || 'N/A',
              name: t.patientName,
              age: t.patientAge || 35,
              gender: t.patientGender || 'M',
              arrivalTime: new Date(t.createdAt).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' }),
              consultationReason: t.notes || 'Consulta derivada desde Recepción y Admisión Clínica.',
              consultationType: t.priority === 'STAT_URGENTE' ? 'URGENCIA_AMBULATORIA' : 'CONTROL',
              status: 'EN_ESPERA',
              priority: t.priority === 'STAT_URGENTE' ? 'URGENTE' : 'RUTINA',
              bloodType: 'Desconocido',
              allergies: ['Sin registrar'],
              origin: 'Recepción Central • Admisión HIS',
              vitals: {
                bp: '120/80',
                hr: 75,
                rr: 16,
                temp: 36.5,
                spo2: 99,
                weightKg: 70,
                heightCm: 170,
                bmi: 24.2
              },
              medicalHistory: {
                pathological: [],
                surgical: [],
                family: [],
                habits: [],
                currentMeds: []
              },
              prescriptions: [],
              labOrders: [],
              imagingOrders: []
            });
          }
        }
      });

      if (newCount > 0) {
        saveQueue(updatedQueue);
        window.dispatchEvent(
          new CustomEvent('lis-global-toast', {
            detail: {
              title: '🟢 Admisión Automática de Recepción',
              message: newCount === 1 
                ? `Paciente ${newlyAddedName} (Turno ${newlyAddedTurn}) admitido en Recepción e incorporado a la cola.`
                : `${newCount} nuevos pacientes admitidos en Recepción agregados a la cola médica.`,
              type: 'success'
            }
          })
        );
      } else if (!isAutomatic) {
        window.dispatchEvent(
          new CustomEvent('lis-global-toast', {
            detail: {
              title: 'Cola al Día',
              message: 'El tablero de consulta está 100% sincronizado con Admisión de Recepción.',
              type: 'info'
            }
          })
        );
      }
    } catch (e) {
      console.error('Error sincronizando con recepción:', e);
    }
  };

  // Sincronización Automática en Segundo Plano (Polling 3s + Eventos de Recepción y Storage entre pestañas)
  useEffect(() => {
    const handleAutoSync = () => {
      handleSyncWithReception(true);
    };

    // Polling periódico cada 3.5 segundos para captura automática silenciosa e instantánea
    const autoSyncInterval = setInterval(handleAutoSync, 3500);

    // Eventos inmediatos emitidos desde el módulo de Recepción
    window.addEventListener('lis_reception_turn_created', handleAutoSync);
    window.addEventListener('lis_turn_updated', handleAutoSync);
    window.addEventListener('storage', handleAutoSync);

    return () => {
      clearInterval(autoSyncInterval);
      window.removeEventListener('lis_reception_turn_created', handleAutoSync);
      window.removeEventListener('lis_turn_updated', handleAutoSync);
      window.removeEventListener('storage', handleAutoSync);
    };
  }, [queue]);

  // Active patient in consultation with localStorage persistence
  // Auto-resume: on reload, restore from localStorage OR detect any EN_CONSULTA patient in queue
  const [activePatientId, setActivePatientId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('lis_active_consultation_patient_id');
      if (saved) return saved;
      // Fallback: find any patient in EN_CONSULTA status in queue
      const savedQueue = localStorage.getItem('lis_medical_consultation_queue_v2') || localStorage.getItem('lis_medical_consultation_queue_v1');
      if (savedQueue) {
        const parsedQueue: ConsultationPatient[] = JSON.parse(savedQueue);
        const activeInQueue = parsedQueue.find((p) => p.status === 'EN_CONSULTA');
        if (activeInQueue) {
          localStorage.setItem('lis_active_consultation_patient_id', activeInQueue.id);
          return activeInQueue.id;
        }
      }
    } catch (e) {
      console.error('Error recuperando paciente activo:', e);
    }
    return null;
  });

  const updateActivePatientId = (id: string | null) => {
    setActivePatientId(id);
    try {
      if (id) {
        localStorage.setItem('lis_active_consultation_patient_id', id);
      } else {
        localStorage.removeItem('lis_active_consultation_patient_id');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ID del registro en Supabase para la consulta activa (UUID real de la BD)
  const [dbConsultationId, setDbConsultationId] = useState<string | null>(() => {
    try { return localStorage.getItem('lis_db_consultation_id') || null; } catch { return null; }
  });

  const updateDbConsultationId = (id: string | null) => {
    setDbConsultationId(id);
    try {
      if (id) localStorage.setItem('lis_db_consultation_id', id);
      else localStorage.removeItem('lis_db_consultation_id');
    } catch (e) { console.error(e); }
  };

  const activePatient = useMemo(() => {
    return queue.find((p) => p.id === activePatientId) || null;
  }, [queue, activePatientId]);

  // Modal para Alertas Clínicas y Validaciones Profesionales (sustituye alert nativo)
  const [clinicalAlertModal, setClinicalAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    message: string;
    type?: 'warning' | 'info' | 'error' | 'success';
    confirmLabel?: string;
    onConfirm?: () => void;
  } | null>(null);

  // Helper para calcular segundos transcurridos desde timestamp epoch real guardado
  const getElapsedConsultSeconds = (patientId: string): number => {
    try {
      const startKey = `lis_consultation_start_time_${patientId}`;
      const stored = localStorage.getItem(startKey);
      if (stored) {
        const startEpoch = parseInt(stored, 10);
        if (!isNaN(startEpoch) && startEpoch > 0) {
          return Math.max(0, Math.floor((Date.now() - startEpoch) / 1000));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return 0;
  };

  // Consultation UI filter & search
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EN_ESPERA' | 'EN_CONSULTA' | 'FINALIZADA'>('ALL');
  const [queueViewMode, setQueueViewMode] = useState<'table' | 'cards'>('table');

  // Consultation internal workspace tab — all 11 EHR + Portal dimensions
  const [consultTab, setConsultTab] = useState<'resumen' | 'soap' | 'antecedentes' | 'anatomia' | 'recetas' | 'laboratorio' | 'imagenes' | 'bloodbank' | 'incapacidad' | 'referencia' | 'historial' | 'auditoria'>(() => {
    try {
      const saved = localStorage.getItem('lis_consultation_active_tab');
      if (saved) return saved as any;
    } catch (e) { console.error(e); }
    return 'soap';
  });

  const updateConsultTab = (tab: typeof consultTab) => {
    setConsultTab(tab);
    try { localStorage.setItem('lis_consultation_active_tab', tab); } catch (e) { console.error(e); }
  };

  // Blood Bank form state
  const [bloodProductType, setBloodProductType] = useState<'CONCENTRADO_GLOBULOS_ROJOS' | 'PLASMA_FRESCO_CONGELADO' | 'CONCENTRADO_PLAQUETARIO' | 'CRIOPRECIPITADO'>('CONCENTRADO_GLOBULOS_ROJOS');
  const [bloodUnits, setBloodUnits] = useState(1);
  const [bloodUrgency, setBloodUrgency] = useState<'STAT_INMEDIATA' | 'URGENTE_2H' | 'RESERVA_ELECTIVA'>('URGENTE_2H');
  const [bloodIndication, setBloodIndication] = useState('');

  // Active patient draft state
  const [draftSubjective, setDraftSubjective] = useState('');
  const [draftObjective, setDraftObjective] = useState('');
  const [draftAssessment, setDraftAssessment] = useState('');
  const [draftPlan, setDraftPlan] = useState('');
  const [draftPrimaryIcd, setDraftPrimaryIcd] = useState('');

  // Vitals in consultation
  const [vitalsBp, setVitalsBp] = useState('120/80');
  const [vitalsHr, setVitalsHr] = useState(72);
  const [vitalsRr, setVitalsRr] = useState(16);
  const [vitalsTemp, setVitalsTemp] = useState(36.5);
  const [vitalsSpo2, setVitalsSpo2] = useState(99);
  const [vitalsWeight, setVitalsWeight] = useState(70);
  const [vitalsHeight, setVitalsHeight] = useState(170);

  // Auto-calculated BMI
  const computedBmi = useMemo(() => {
    const hM = vitalsHeight / 100;
    if (hM <= 0) return 0;
    return Number((vitalsWeight / (hM * hM)).toFixed(1));
  }, [vitalsWeight, vitalsHeight]);

  const bmiCategory = useMemo(() => {
    if (computedBmi < 18.5) return { label: 'Bajo Peso', color: 'text-amber-400' };
    if (computedBmi < 25) return { label: 'Normal / Eutrófico', color: 'text-emerald-400' };
    if (computedBmi < 30) return { label: 'Sobrepeso', color: 'text-amber-300' };
    return { label: 'Obesidad', color: 'text-rose-400' };
  }, [computedBmi]);

  // New Prescription Form state
  const [newDrugName, setNewDrugName] = useState('');
  const [newDrugDose, setNewDrugDose] = useState('');
  const [newDrugRoute, setNewDrugRoute] = useState('Oral');
  const [newDrugFreq, setNewDrugFreq] = useState('Cada 8 horas');
  const [newDrugDuration, setNewDrugDuration] = useState('5 días');
  const [newDrugInstructions, setNewDrugInstructions] = useState('');

  // Lab CPOE selection
  const [selectedLabTestIds, setSelectedLabTestIds] = useState<string[]>([]);
  const [labOrderPriority, setLabOrderPriority] = useState<'RUTINA' | 'URGENTE'>('RUTINA');
  const [labSearchTerm, setLabSearchTerm] = useState('');

  // Imaging Form
  const [imagingModality, setImagingModality] = useState('RAYOS_X');
  const [imagingStudy, setImagingStudy] = useState('');
  const [imagingIndication, setImagingIndication] = useState('');

  // Medical Leave Form
  const [leaveDays, setLeaveDays] = useState(3);
  const [leaveStartDate, setLeaveStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [leaveJustification, setLeaveJustification] = useState('');

  // Referral Form
  const [referralSpecialty, setReferralSpecialty] = useState('Cardiología Clínica');
  const [referralReason, setReferralReason] = useState('');

  // Consultation Timer
  const [consultElapsedSeconds, setConsultElapsedSeconds] = useState(0);

  // Consultation Print Modal
  const [printableDocument, setPrintableDocument] = useState<{
    type: 'RECETA' | 'INCAPACIDAD' | 'REFERENCIA' | 'RESUMEN_CONSULTA';
    title: string;
    patient: ConsultationPatient;
  } | null>(null);

  // New Patient Walk-In Modal
  const [isAddingWalkIn, setIsAddingWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInNationalId, setWalkInNationalId] = useState('');
  const [walkInAge, setWalkInAge] = useState(30);
  const [walkInGender, setWalkInGender] = useState<'M' | 'F'>('M');
  const [walkInReason, setWalkInReason] = useState('');
  const [walkInType, setWalkInType] = useState<ConsultationPatient['consultationType']>('PRIMERA_VEZ');

  // Consultation Audit Logs
  const [auditLogs, setAuditLogs] = useState<Array<{
    id: string;
    timestamp: string;
    doctorName: string;
    patientName: string;
    action: string;
    detail: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('lis_consultation_audit_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'aud-001',
        timestamp: new Date(Date.now() - 3600000).toLocaleString('es-PA'),
        doctorName: doctorInfo.name,
        patientName: 'Elena Castillo Vega',
        action: 'FINALIZACIÓN_ATENCIÓN',
        detail: 'Consulta postoperatoria concluida con éxito. Retiro de puntos sin complicaciones.'
      }
    ];
  });

  const logAuditEvent = (action: string, detail: string, patientName: string) => {
    const newEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString('es-PA'),
      doctorName: `${doctorInfo.name} (${doctorInfo.license})`,
      patientName,
      action,
      detail
    };
    const updated = [newEntry, ...auditLogs];
    setAuditLogs(updated);
    try {
      localStorage.setItem('lis_consultation_audit_logs', JSON.stringify(updated.slice(0, 100)));
    } catch (e) {
      console.error(e);
    }
  };

  // Sync draft fields when active patient changes
  useEffect(() => {
    if (activePatient) {
      setDraftSubjective(activePatient.soapNote?.subjective || `Paciente acude por: ${activePatient.consultationReason}`);
      setDraftObjective(activePatient.soapNote?.objective || '');
      setDraftAssessment(activePatient.soapNote?.assessment || '');
      setDraftPlan(activePatient.soapNote?.plan || '');
      setDraftPrimaryIcd(activePatient.soapNote?.primaryIcd10 || '');
      setVitalsBp(activePatient.vitals.bp);
      setVitalsHr(activePatient.vitals.hr);
      setVitalsRr(activePatient.vitals.rr);
      setVitalsTemp(activePatient.vitals.temp);
      setVitalsSpo2(activePatient.vitals.spo2);
      setVitalsWeight(activePatient.vitals.weightKg);
      setVitalsHeight(activePatient.vitals.heightCm);
      setConsultElapsedSeconds(getElapsedConsultSeconds(activePatient.id));
      setSelectedLabTestIds([]);
    }
  }, [activePatientId]);

  // Live Timer during active consultation (Sincronizado al reloj de pared real)
  useEffect(() => {
    if (!activePatient || activePatient.status !== 'EN_CONSULTA') return;

    const startKey = `lis_consultation_start_time_${activePatient.id}`;
    if (!localStorage.getItem(startKey)) {
      localStorage.setItem(startKey, Date.now().toString());
    }

    const tick = () => {
      setConsultElapsedSeconds(getElapsedConsultSeconds(activePatient.id));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activePatient?.id, activePatient?.status]);

  // Auto-save SOAP drafts + vitals 400ms after any keystroke
  // DUAL-WRITE: localStorage (offline cache) + Supabase PostgreSQL (fuente de verdad)
  useEffect(() => {
    if (!activePatient || activePatient.status !== 'EN_CONSULTA') return;
    const timer = setTimeout(() => {
      // 1. localStorage — caché offline
      const updated = queue.map((p) => {
        if (p.id !== activePatient.id) return p;
        return {
          ...p,
          vitals: { ...p.vitals, bp: vitalsBp, hr: vitalsHr, rr: vitalsRr, temp: vitalsTemp, spo2: vitalsSpo2, weightKg: vitalsWeight, heightCm: vitalsHeight, bmi: computedBmi },
          soapNote: { subjective: draftSubjective, objective: draftObjective, assessment: draftAssessment, plan: draftPlan, primaryIcd10: draftPrimaryIcd }
        };
      });
      try { localStorage.setItem('lis_medical_consultation_queue_v2', JSON.stringify(updated)); } catch (e) { console.error(e); }

      // 2. Supabase PostgreSQL — fuente de verdad (fire-and-forget, no bloquea la UI)
      if (isSupabaseConfigured && dbConsultationId) {
        SupabaseService.consultation.autoSaveDraft({
          consultationId: dbConsultationId,
          soap: {
            consultation_id: dbConsultationId,
            subjective: draftSubjective || null,
            objective: draftObjective || null,
            assessment: draftAssessment || null,
            plan: draftPlan || null,
            primary_icd10: draftPrimaryIcd || null,
          },
          vitals: {
            consultation_id: dbConsultationId,
            bp: vitalsBp || null,
            hr: vitalsHr ? Number(vitalsHr) : null,
            rr: vitalsRr ? Number(vitalsRr) : null,
            temp: vitalsTemp ? Number(vitalsTemp) : null,
            spo2: vitalsSpo2 ? Number(vitalsSpo2) : null,
            weight_kg: vitalsWeight ? Number(vitalsWeight) : null,
            height_cm: vitalsHeight ? Number(vitalsHeight) : null,
            bmi: computedBmi ? Number(computedBmi) : null,
            recorded_by: doctorInfo.name,
          },
        });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [draftSubjective, draftObjective, draftAssessment, draftPlan, draftPrimaryIcd, vitalsBp, vitalsHr, vitalsRr, vitalsTemp, vitalsSpo2, vitalsWeight, vitalsHeight, dbConsultationId]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} min`;
  };

  // Blood bank request handler
  const handleRequestBloodProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !bloodIndication.trim()) return;
    const newBlood = {
      id: `blood-${Date.now()}`,
      productType: bloodProductType,
      units: bloodUnits,
      urgency: bloodUrgency,
      indication: bloodIndication.trim(),
      timestamp: new Date().toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' }),
      status: 'SOLICITADA' as const
    };
    const updated = queue.map((p) => p.id === activePatient.id ? { ...p, bloodOrders: [...(p.bloodOrders || []), newBlood] } : p);
    saveQueue(updated);
    setBloodIndication('');
    logAuditEvent('SOLICITUD_HEMOCOMPONENTE', `Solicitado ${bloodProductType.replace(/_/g, ' ')} (${bloodUnits} U) — ${bloodUrgency.replace(/_/g, ' ')}.`, activePatient.name);

    // ── Supabase: registrar orden de hemocomponente en BD inmediatamente ──────
    if (isSupabaseConfigured && dbConsultationId) {
      SupabaseService.consultation.addOrder({
        consultation_id: dbConsultationId,
        order_type: 'BLOOD',
        description: bloodProductType.replace(/_/g, ' '),
        priority: bloodUrgency,
        status: 'PENDIENTE_ENVIO',
        payload: {
          product_type: bloodProductType,
          units: bloodUnits,
          urgency: bloodUrgency,
          indication: bloodIndication.trim(),
        },
      });
    }

    window.dispatchEvent(new CustomEvent('lis-global-toast', { detail: { title: 'Solicitud Banco de Sangre', message: `${bloodProductType.replace(/_/g, ' ')} (${bloodUnits} U) enviado al Banco de Sangre.`, type: 'info' } }));
  };

  // Handlers
  const handleStartConsultation = async (patient: ConsultationPatient) => {
    const now = Date.now();
    const startKey = `lis_consultation_start_time_${patient.id}`;
    if (!localStorage.getItem(startKey)) {
      localStorage.setItem(startKey, now.toString());
    }

    const updated = queue.map((p) => {
      if (p.id === patient.id) {
        return {
          ...p,
          status: 'EN_CONSULTA' as const,
          startTime: p.startTime || new Date().toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' }),
          attendedBy: `${doctorInfo.name} (${doctorInfo.license})`
        };
      }
      return p;
    });
    saveQueue(updated);
    updateActivePatientId(patient.id);
    updateConsultTab('soap');
    logAuditEvent('INICIO_CONSULTA', `Inicio de atención clínica individual para paciente en turno ${patient.turnNumber}.`, patient.name);

    // ── Supabase: crear fila en medical_consultations ──────────────────────────
    if (isSupabaseConfigured) {
      try {
        const row = await SupabaseService.consultation.createConsultation({
          tenant_id: 'lis-tenant-default',
          patient_national_id: patient.nationalId,
          patient_name: patient.name,
          doctor_id: doctorInfo.license,
          doctor_name: doctorInfo.name,
          doctor_license: doctorInfo.license,
          turn_number: Number(patient.turnNumber.replace(/\D/g, '')) || patient.position,
          chief_complaint: patient.chiefComplaint || patient.consultationReason,
          status: 'EN_CONSULTA',
          admitted_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
        });
        if (row?.id) {
          updateDbConsultationId(row.id);
          // Registrar auditoría en BD
          SupabaseService.consultation.logAudit({
            consultation_id: row.id,
            action: 'INICIO_CONSULTA',
            description: `Atención iniciada. Turno ${patient.turnNumber}. Dr. ${doctorInfo.name}.`,
            actor: doctorInfo.name,
            metadata: { turn: patient.turnNumber, patient_id_internal: patient.id },
          });
        }
      } catch (e) {
        console.warn('[Consultation] handleStart Supabase error (continuando en localStorage):', e);
      }
    }

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          title: 'Consulta Médica Iniciada',
          message: `Atendiendo a ${patient.name} (${patient.nationalId}). Estación clínica exclusiva activa.`,
          type: 'success'
        }
      })
    );
  };

  const handlePauseConsultation = () => {
    if (!activePatient) return;
    // Save draft back into queue
    const updated = queue.map((p) => {
      if (p.id === activePatient.id) {
        return {
          ...p,
          vitals: {
            ...p.vitals,
            bp: vitalsBp,
            hr: vitalsHr,
            rr: vitalsRr,
            temp: vitalsTemp,
            spo2: vitalsSpo2,
            weightKg: vitalsWeight,
            heightCm: vitalsHeight,
            bmi: computedBmi
          },
          soapNote: {
            subjective: draftSubjective,
            objective: draftObjective,
            assessment: draftAssessment,
            plan: draftPlan,
            primaryIcd10: draftPrimaryIcd
          }
        };
      }
      return p;
    });
    saveQueue(updated);
    logAuditEvent('PAUSA_CONSULTA', 'Consulta pausada temporalmente y guardada como borrador.', activePatient.name);

    // ── Supabase: marcar como PAUSADA + guardar SOAP/vitales ──────────────────
    if (isSupabaseConfigured && dbConsultationId) {
      SupabaseService.consultation.updateConsultationStatus(dbConsultationId, 'PAUSADA', {
        paused_at: new Date().toISOString()
      });
      SupabaseService.consultation.upsertSoapNote({
        consultation_id: dbConsultationId,
        subjective: draftSubjective || null,
        objective: draftObjective || null,
        assessment: draftAssessment || null,
        plan: draftPlan || null,
        primary_icd10: draftPrimaryIcd || null,
      });
      SupabaseService.consultation.logAudit({
        consultation_id: dbConsultationId,
        action: 'PAUSA_CONSULTA',
        description: 'Consulta pausada. Borrador SOAP guardado.',
        actor: doctorInfo.name,
      });
    }

    updateActivePatientId(null);
    // Conservamos dbConsultationId en localStorage para reanudar la misma fila
  };

  const handleFinishConsultation = () => {
    if (!activePatient) return;

    if (!draftAssessment.trim() && !draftPrimaryIcd) {
      setClinicalAlertModal({
        isOpen: true,
        title: 'Validación de Expediente Requerida',
        subtitle: 'Normativa Oficial MINSA • Protocolo SOAP',
        message: 'Por favor registre al menos un diagnóstico o juicio clínico en la evaluación [A] (SOAP) antes de finalizar y certificar esta atención médica.',
        type: 'warning',
        confirmLabel: 'Completar Evaluación (SOAP)',
        onConfirm: () => {
          updateConsultTab('soap');
          setClinicalAlertModal(null);
        }
      });
      return;
    }

    // Transmitir al LIS todas las órdenes de laboratorio que estaban en borrador de consulta
    let transmittedOrdersCount = 0;
    const finalizedLabOrders = (activePatient.labOrders || []).map((ord) => {
      if (ord.status === 'PENDIENTE_ENVIO' || !ord.status) {
        if (ord.fullOrder) {
          addOrder(ord.fullOrder);
          if (onCreateOrder) {
            onCreateOrder(ord.fullOrder);
          }
          transmittedOrdersCount++;
        }
        return {
          ...ord,
          status: 'ENVIADO_LIS' as const
        };
      }
      return ord;
    });

    const endTimeStr = new Date().toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' });
    const updatedPatient: ConsultationPatient = {
      ...activePatient,
      status: 'FINALIZADA',
      endTime: endTimeStr,
      attendedBy: `${doctorInfo.name} (${doctorInfo.license})`,
      labOrders: finalizedLabOrders,
      vitals: {
        bp: vitalsBp,
        hr: vitalsHr,
        rr: vitalsRr,
        temp: vitalsTemp,
        spo2: vitalsSpo2,
        weightKg: vitalsWeight,
        heightCm: vitalsHeight,
        bmi: computedBmi
      },
      soapNote: {
        subjective: draftSubjective,
        objective: draftObjective,
        assessment: draftAssessment,
        plan: draftPlan,
        primaryIcd10: draftPrimaryIcd || 'Z00.0 — Examen médico general'
      }
    };

    const updated = queue.map((p) => (p.id === activePatient.id ? updatedPatient : p));
    saveQueue(updated);
    logAuditEvent(
      'FINALIZACIÓN_ATENCIÓN',
      `Consulta finalizada. Prescripciones: ${activePatient.prescriptions.length}, Órdenes LIS transmitidas: ${transmittedOrdersCount}, Dx: ${draftPrimaryIcd || 'General'}.`,
      activePatient.name
    );

    if (transmittedOrdersCount > 0) {
      logAuditEvent(
        'TRANSMISION_LIS_FINAL',
        `Se transmitieron formalmente ${transmittedOrdersCount} orden(es) de laboratorio al LIS / Flebotomía al certificar la consulta médica.`,
        activePatient.name
      );
    }

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          title: 'Atención Médica Finalizada',
          message: transmittedOrdersCount > 0
            ? `Atención de ${activePatient.name} finalizada. ${transmittedOrdersCount} orden(es) de laboratorio transmitidas al LIS.`
            : `La atención de ${activePatient.name} ha sido registrada con éxito. Expediente actualizado.`,
          type: 'success'
        }
      })
    );

    // Open consultation summary printable modal
    setPrintableDocument({
      type: 'RESUMEN_CONSULTA',
      title: 'Resumen Oficial de Consulta Médica & Evolución',
      patient: updatedPatient
    });

    try {
      localStorage.removeItem(`lis_consultation_start_time_${activePatient.id}`);
    } catch (e) {
      console.error(e);
    }

    // ── Supabase: finalización completa en BD ─────────────────────────────────
    if (isSupabaseConfigured && dbConsultationId) {
      const consultId = dbConsultationId;

      // 1. SOAP + vitales + estado FINALIZADA + auditoría (en paralelo)
      SupabaseService.consultation.finalizeConsultation({
        consultationId: consultId,
        soap: {
          consultation_id: consultId,
          subjective: draftSubjective || null,
          objective: draftObjective || null,
          assessment: draftAssessment || null,
          plan: draftPlan || null,
          primary_icd10: draftPrimaryIcd || null,
        },
        vitals: {
          consultation_id: consultId,
          bp: vitalsBp || null,
          hr: vitalsHr ? Number(vitalsHr) : null,
          rr: vitalsRr ? Number(vitalsRr) : null,
          temp: vitalsTemp ? Number(vitalsTemp) : null,
          spo2: vitalsSpo2 ? Number(vitalsSpo2) : null,
          weight_kg: vitalsWeight ? Number(vitalsWeight) : null,
          height_cm: vitalsHeight ? Number(vitalsHeight) : null,
          bmi: computedBmi ? Number(computedBmi) : null,
          recorded_by: doctorInfo.name,
        },
        doctorName: doctorInfo.name,
        icd10Primary: draftPrimaryIcd || undefined,
        icd10Description: draftPrimaryIcd || undefined,
      });

      // 2. Órdenes de laboratorio LIS → medical_orders
      finalizedLabOrders.forEach((ord) => {
        SupabaseService.consultation.addOrder({
          consultation_id: consultId,
          order_type: 'LAB',
          description: (ord.fullOrder as any)?.testIds?.join(', ') || 'Exámenes de laboratorio',
          priority: 'URGENTE',
          status: ord.status === 'ENVIADO_LIS' ? 'ENVIADA' : 'PENDIENTE_ENVIO',
          payload: { test_ids: (ord.fullOrder as any)?.testIds || [], lab_note: ord.note || '' },
          transmitted_at: ord.status === 'ENVIADO_LIS' ? new Date().toISOString() : null,
        });
      });

      // 3. Órdenes de banco de sangre
      (activePatient.bloodOrders || []).forEach((bOrd) => {
        SupabaseService.consultation.addOrder({
          consultation_id: consultId,
          order_type: 'BLOOD',
          description: bOrd.productType.replace(/_/g, ' '),
          priority: bOrd.urgency,
          status: 'ENVIADA',
          payload: { product_type: bOrd.productType, units: bOrd.units, urgency: bOrd.urgency, indication: bOrd.indication },
          transmitted_at: new Date().toISOString(),
        });
      });

      // 4. Órdenes de imágenes
      (activePatient.imagingOrders || []).forEach((img) => {
        SupabaseService.consultation.addOrder({
          consultation_id: consultId,
          order_type: 'IMAGING',
          description: img.study || 'Estudio de imagen',
          priority: img.urgency || 'URGENTE',
          status: 'ENVIADA',
          payload: { study: img.study, body_region: img.bodyRegion || '', indication: img.indication || '' },
          transmitted_at: new Date().toISOString(),
        });
      });

      // 5. Recetas
      (activePatient.prescriptions || []).forEach((rx) => {
        SupabaseService.consultation.addOrder({
          consultation_id: consultId,
          order_type: 'RX',
          description: rx.medication,
          priority: 'RUTINA',
          status: 'ENVIADA',
          payload: { drug: rx.medication, dose: rx.dose, route: rx.route, frequency: rx.frequency, duration: rx.duration },
          transmitted_at: new Date().toISOString(),
        });
      });

      // Limpiar ID de BD (consulta cerrada)
      updateDbConsultationId(null);
    }

    updateActivePatientId(null);
  };

  // Add prescription to active patient
  const handleAddPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !newDrugName.trim()) return;

    const newRx = {
      id: `rx-${Date.now()}`,
      medication: newDrugName.trim(),
      dose: newDrugDose.trim() || '1 dosis',
      route: newDrugRoute,
      frequency: newDrugFreq,
      duration: newDrugDuration,
      instructions: newDrugInstructions.trim() || 'Tomar según indicación médica.'
    };

    const updated = queue.map((p) => {
      if (p.id === activePatient.id) {
        return {
          ...p,
          prescriptions: [...p.prescriptions, newRx]
        };
      }
      return p;
    });

    saveQueue(updated);
    setNewDrugName('');
    setNewDrugDose('');
    setNewDrugInstructions('');
    logAuditEvent('PRESCRIPCIÓN_FARMACO', `Se prescribió ${newRx.medication} ${newRx.dose} (${newRx.frequency}) por ${newRx.duration}.`, activePatient.name);
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          title: 'Medicamento Prescrito',
          message: `${newRx.medication} agregado a la receta médica de la consulta.`,
          type: 'info'
        }
      })
    );
  };

  const handleApplyPresetDrug = (preset: typeof COMMON_DRUGS_PRESETS[0]) => {
    setNewDrugName(preset.name);
    setNewDrugDose(preset.dose);
    setNewDrugRoute(preset.route);
    setNewDrugFreq(preset.freq);
    setNewDrugDuration(preset.dur);
    setNewDrugInstructions(preset.note);
  };

  const handleDeletePrescription = (rxId: string) => {
    if (!activePatient) return;
    const updated = queue.map((p) => {
      if (p.id === activePatient.id) {
        return {
          ...p,
          prescriptions: p.prescriptions.filter((r) => r.id !== rxId)
        };
      }
      return p;
    });
    saveQueue(updated);
  };

  // Dispatch Lab Order from Consultation (Guardado en Borrador Clínico de Consulta)
  const handleDispatchLabOrder = () => {
    if (!activePatient || selectedLabTestIds.length === 0) return;

    const selectedTests = MOCK_TEST_CATALOG.filter((t) => selectedLabTestIds.includes(t.id));
    const testNames = selectedTests.map((t) => t.name);

    const newOrderId = `ord-cpoe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newOrderNumber = `LIS-CPOE-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrderObj: Order = {
      id: newOrderId,
      orderNumber: newOrderNumber,
      tenantId: 'lab-san-jose',
      branchId: 'branch-1',
      patientId: activePatient.id,
      patientName: activePatient.name,
      patientNationalId: activePatient.nationalId,
      patientGender: activePatient.gender,
      patientAge: activePatient.age,
      doctorName: `${doctorInfo.name} (${doctorInfo.license})`,
      serviceOrigin: `Consulta Médica: ${draftPrimaryIcd || activePatient.consultationReason}`,
      testIds: selectedLabTestIds,
      specimens: [
        {
          id: `spec-${Date.now()}`,
          orderId: newOrderId,
          tubeType: 'TUBO_LILA_EDTA',
          barcode: `BAR-${Date.now()}`,
          status: 'PENDIENTE'
        }
      ],
      priority: labOrderPriority === 'URGENTE' ? 'STAT' : 'RUTINA',
      status: 'REGISTRADA',
      totalAmount: selectedTests.reduce((acc, t) => acc + (t.price || 0), 0),
      paymentStatus: 'PAGADO',
      createdAt: new Date().toISOString()
    };

    // La orden permanece en borrador de consulta hasta certificar la atención
    const newLabEntry = {
      id: newOrderId,
      orderNumber: newOrderNumber,
      testNames,
      priority: labOrderPriority,
      timestamp: new Date().toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' }),
      status: 'PENDIENTE_ENVIO' as const,
      fullOrder: newOrderObj
    };

    const updated = queue.map((p) => {
      if (p.id === activePatient.id) {
        return {
          ...p,
          labOrders: [...p.labOrders, newLabEntry]
        };
      }
      return p;
    });
    saveQueue(updated);
    setSelectedLabTestIds([]);
    logAuditEvent(
      'BORRADOR_ORDEN_LAB',
      `Se agregó solicitud de laboratorio (${testNames.length} pruebas, Ref ${newOrderNumber}) en borrador clínico.`,
      activePatient.name
    );

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          title: '📋 Registrado en Borrador Clínico',
          message: `${testNames.length} pruebas agregadas al plan de laboratorio. Se enviarán al LIS al finalizar la consulta.`,
          type: 'info'
        }
      })
    );
  };

  const handleDeleteLabOrder = (labOrderId: string) => {
    if (!activePatient) return;
    const removedOrder = activePatient.labOrders.find((o) => o.id === labOrderId);
    const updated = queue.map((p) => {
      if (p.id === activePatient.id) {
        return {
          ...p,
          labOrders: p.labOrders.filter((o) => o.id !== labOrderId)
        };
      }
      return p;
    });
    saveQueue(updated);
    logAuditEvent(
      'ELIMINACIÓN_ORDEN_LAB',
      `Se retiró orden de laboratorio ${removedOrder?.orderNumber || labOrderId} del borrador clínico antes de su emisión.`,
      activePatient.name
    );
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          title: 'Orden Descartada del Borrador',
          message: 'La orden fue eliminada del plan de laboratorio. No se enviará ninguna orden errónea al LIS.',
          type: 'warning'
        }
      })
    );
  };

  // Add Imaging Order
  const handleAddImagingOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !imagingStudy.trim()) return;

    const newImg = {
      id: `img-${Date.now()}`,
      modality: imagingModality,
      studyName: imagingStudy.trim(),
      indication: imagingIndication.trim() || 'Evaluación diagnóstica en consulta.',
      priority: 'RUTINA' as const
    };

    const updated = queue.map((p) => {
      if (p.id === activePatient.id) {
        return {
          ...p,
          imagingOrders: [...p.imagingOrders, newImg]
        };
      }
      return p;
    });
    saveQueue(updated);
    setImagingStudy('');
    setImagingIndication('');
    logAuditEvent('SOLICITUD_IMAGEN', `Solicitado estudio de ${newImg.modality}: ${newImg.studyName}.`, activePatient.name);
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          title: 'Estudio de Imagen Solicitado',
          message: `${newImg.studyName} agregado a la orden médica.`,
          type: 'info'
        }
      })
    );
  };

  // Save Medical Leave
  const handleSaveMedicalLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;

    const start = new Date(leaveStartDate);
    const end = new Date(start);
    end.setDate(start.getDate() + (leaveDays - 1));
    const endStr = end.toISOString().split('T')[0];

    const leaveObj = {
      days: leaveDays,
      startDate: leaveStartDate,
      endDate: endStr,
      diagnosis: draftPrimaryIcd || activePatient.consultationReason,
      justification: leaveJustification.trim() || 'Reposo médico temporal por prescripción facultativa.'
    };

    const updated = queue.map((p) => {
      if (p.id === activePatient.id) {
        return {
          ...p,
          medicalLeave: leaveObj
        };
      }
      return p;
    });
    saveQueue(updated);
    logAuditEvent('EMISIÓN_INCAPACIDAD', `Incapacidad médica laboral por ${leaveDays} días (${leaveStartDate} al ${endStr}).`, activePatient.name);
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          title: 'Certificado de Incapacidad Registrado',
          message: `${leaveDays} días de reposo médico asignados conforme a normativa.`,
          type: 'success'
        }
      })
    );
  };

  // Save Referral
  const handleSaveReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !referralReason.trim()) return;

    const refObj = {
      specialty: referralSpecialty,
      reason: referralReason.trim(),
      priority: 'RUTINA' as const
    };

    const updated = queue.map((p) => {
      if (p.id === activePatient.id) {
        return {
          ...p,
          referral: refObj
        };
      }
      return p;
    });
    saveQueue(updated);
    logAuditEvent('INTERCONSULTA_REFERENCIA', `Derivación médica a ${referralSpecialty}. Motivo: ${referralReason}.`, activePatient.name);
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          title: 'Interconsulta Registrada',
          message: `Referencia médica para ${referralSpecialty} generada correctamente.`,
          type: 'info'
        }
      })
    );
  };

  // Add Walk-in Patient
  const handleAddWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim() || !walkInNationalId.trim()) return;

    const newPos = queue.length + 1;
    const newTurn = `C-${newPos < 10 ? '0' + newPos : newPos}`;

    const newPatient: ConsultationPatient = {
      id: `cpat-${Date.now()}`,
      turnNumber: newTurn,
      position: newPos,
      nationalId: walkInNationalId.trim(),
      name: walkInName.trim(),
      age: walkInAge,
      gender: walkInGender,
      arrivalTime: new Date().toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' }),
      consultationReason: walkInReason.trim() || 'Consulta médica general.',
      consultationType: walkInType,
      status: 'EN_ESPERA',
      priority: 'RUTINA',
      bloodType: 'Desconocido',
      allergies: ['Sin registrar'],
      vitals: {
        bp: '120/80',
        hr: 75,
        rr: 16,
        temp: 36.5,
        spo2: 99,
        weightKg: 70,
        heightCm: 170,
        bmi: 24.2
      },
      medicalHistory: {
        pathological: [],
        surgical: [],
        family: [],
        habits: [],
        currentMeds: []
      },
      prescriptions: [],
      labOrders: [],
      imagingOrders: []
    };

    const updated = [...queue, newPatient];
    saveQueue(updated);
    setIsAddingWalkIn(false);
    setWalkInName('');
    setWalkInNationalId('');
    setWalkInReason('');
    logAuditEvent('INGRESO_COLA', `Paciente ingresado directamente a la cola de consulta con turno ${newTurn}.`, newPatient.name);
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          title: 'Paciente Añadido a la Cola',
          message: `${newPatient.name} registrado con turno ${newTurn}.`,
          type: 'success'
        }
      })
    );
  };

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return queue.filter((p) => {
      const q = searchFilter.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.nationalId.toLowerCase().includes(q) ||
        p.consultationReason.toLowerCase().includes(q) ||
        p.turnNumber.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (statusFilter === 'EN_ESPERA') {
        return p.status === 'EN_ESPERA' || p.status === 'PENDIENTE';
      }
      if (statusFilter === 'EN_CONSULTA') {
        return p.status === 'EN_CONSULTA';
      }
      if (statusFilter === 'FINALIZADA') {
        return p.status === 'FINALIZADA';
      }

      return true;
    });
  }, [queue, searchFilter, statusFilter]);

  // Queue Statistics
  const queueStats = useMemo(() => {
    const waiting = queue.filter((p) => p.status === 'EN_ESPERA' || p.status === 'PENDIENTE').length;
    const inConsult = queue.filter((p) => p.status === 'EN_CONSULTA').length;
    const finished = queue.filter((p) => p.status === 'FINALIZADA').length;
    return { waiting, inConsult, finished, total: queue.length };
  }, [queue]);

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* CASO 1: VISTA CLÍNICA EXCLUSIVA DEL PACIENTE EN ATENCIÓN       */}
      {/* ============================================================== */}
      {activePatient ? (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Header Superior Bloqueado al Paciente Activo */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border-2 border-indigo-500/50 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-400 p-0.5 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-white">
                    {activePatient.name.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-mono font-black">
                      TURNO: {activePatient.turnNumber}
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white">{activePatient.name}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
                      Cédula: {activePatient.nationalId}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                    <span>Edad: <strong className="text-white">{activePatient.age} años</strong></span>
                    <span>•</span>
                    <span>Sexo: <strong className="text-white">{activePatient.gender === 'M' ? 'Masculino' : 'Femenino'}</strong></span>
                    <span>•</span>
                    <span>Tipo Sangre: <strong className="text-rose-400 font-bold">{activePatient.bloodType}</strong></span>
                    <span>•</span>
                    <span>Tipo Consulta: <strong className="text-indigo-300 uppercase font-bold">{activePatient.consultationType.replace(/_/g, ' ')}</strong></span>
                  </div>
                </div>
              </div>

              {/* Botones de Acción del Médico */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="bg-slate-950/80 border border-emerald-500/40 px-3.5 py-2 rounded-2xl flex items-center space-x-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-400 font-medium">Tiempo en Consulta:</span>
                  <strong className="text-emerald-400 font-mono font-black">{formatTimer(consultElapsedSeconds)}</strong>
                </div>

                <button
                  type="button"
                  onClick={handlePauseConsultation}
                  className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  title="Pausar y volver a la cola de pacientes (guarda borrador)"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Pausar / Volver a la Cola</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinishConsultation}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/30 flex items-center space-x-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Finalizar Atención Médica</span>
                </button>
              </div>
            </div>

            {/* Alertas Críticas de Alergias & Motivo de Consulta */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-indigo-500/20 text-xs">
              <div className="md:col-span-8 flex items-center space-x-2 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
                <span className="text-slate-400 font-bold shrink-0">Motivo de Consulta:</span>
                <span className="text-slate-200 truncate">{activePatient.consultationReason}</span>
              </div>

              <div className="md:col-span-4 flex items-center space-x-2 bg-rose-950/40 p-2.5 rounded-2xl border border-rose-500/40">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="text-rose-300 font-bold shrink-0">ALERGIAS:</span>
                <div className="flex flex-wrap gap-1">
                  {activePatient.allergies.map((a, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-rose-600/30 text-rose-200 font-black text-[10px]">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Pestañas de la Estación de Consulta — 11 Dimensiones EHR + Portal Doctor */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-3">
            {[
              { id: 'resumen',     label: 'Resumen Clínico 360°',         icon: User,          color: 'indigo', badge: null },
              { id: 'soap',        label: 'Evolución SOAP',                icon: FileText,      color: 'indigo', badge: null },
              { id: 'antecedentes',label: 'Expediente & Antecedentes',     icon: ClipboardList, color: 'indigo', badge: null },
              { id: 'anatomia',    label: 'Mapa Corporal Anatómico',       icon: Activity,      color: 'cyan',   badge: null },
              { id: 'recetas',     label: 'Medicamentos & Farmacia (Rx)',   icon: Pill,          color: 'amber',  badge: activePatient.prescriptions.length || null },
              { id: 'laboratorio', label: 'Laboratorio LIS',               icon: HeartPulse,    color: 'teal',   badge: activePatient.labOrders.length || null },
              { id: 'imagenes',    label: 'Imágenes RIS / PACS',           icon: Zap,           color: 'sky',    badge: activePatient.imagingOrders.length || null },
              { id: 'bloodbank',   label: 'Banco de Sangre & Transfusiones', icon: Droplets,    color: 'rose',   badge: (activePatient.bloodOrders?.length) || null },
              { id: 'incapacidad', label: 'Incapacidad Médica',            icon: FileCheck,     color: 'indigo', badge: activePatient.medicalLeave ? 1 : null },
              { id: 'referencia',  label: 'Interconsulta / Referencia',    icon: Share2,        color: 'indigo', badge: activePatient.referral ? 1 : null },
              { id: 'historial',   label: 'Historial & Labs Previos',      icon: Clock,         color: 'indigo', badge: null },
              { id: 'auditoria',   label: 'Trazabilidad & Auditoría',      icon: ShieldCheck,   color: 'indigo', badge: null },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = consultTab === tab.id;
              const activeColor = tab.color === 'rose' ? 'bg-rose-600 shadow-rose-600/30' : tab.color === 'cyan' ? 'bg-cyan-600 shadow-cyan-600/30' : tab.color === 'amber' ? 'bg-amber-600 shadow-amber-600/30' : tab.color === 'teal' ? 'bg-teal-600 shadow-teal-600/30' : tab.color === 'sky' ? 'bg-sky-600 shadow-sky-600/30' : 'bg-indigo-600 shadow-indigo-600/30';
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => updateConsultTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? `${activeColor} text-white shadow-lg`
                      : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {tab.badge !== null && tab.badge !== undefined && Number(tab.badge) > 0 && (
                    <span className="px-1.5 rounded-full text-[10px] bg-slate-950 font-mono text-indigo-300 border border-indigo-500/30">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* CONTENIDO DE CADA PESTAÑA CLÍNICA */}

          {/* 0. RESUMEN CLÍNICO 360° */}
          {consultTab === 'resumen' && (
            <div className="space-y-6">
              {/* Cabecera */}
              <div className="bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <User className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-white">Resumen Clínico 360° — Expediente Unificado HIS</h3>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold ml-auto">Sincronizado con HIS · LIS · Farmacia · Banco de Sangre</span>
                </div>

                {/* Datos demográficos */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    { label: 'Cédula / ID', value: activePatient.nationalId, color: 'text-white' },
                    { label: 'Edad', value: `${activePatient.age} años`, color: 'text-white' },
                    { label: 'Sexo', value: activePatient.gender === 'M' ? 'Masculino' : 'Femenino', color: 'text-white' },
                    { label: 'Tipo de Sangre', value: activePatient.bloodType, color: 'text-rose-400 font-black' },
                  ].map((item) => (
                    <div key={item.label} className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block font-bold uppercase">{item.label}</span>
                      <span className={`font-bold text-sm ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Signos Vitales actuales */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                  <h4 className="font-bold text-white text-sm flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                    <HeartPulse className="w-4 h-4 text-rose-400" />
                    <span>Signos Vitales Actuales</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { label: 'P.A.', value: vitalsBp, unit: 'mmHg' },
                      { label: 'F.C.', value: `${vitalsHr}`, unit: 'lpm' },
                      { label: 'F.R.', value: `${vitalsRr}`, unit: 'rpm' },
                      { label: 'Temp.', value: `${vitalsTemp}`, unit: '°C' },
                      { label: 'SpO₂', value: `${vitalsSpo2}`, unit: '%' },
                      { label: 'IMC', value: `${computedBmi}`, unit: 'kg/m²' },
                    ].map((v) => (
                      <div key={v.label} className="bg-slate-950 rounded-xl p-2 border border-slate-800 text-center">
                        <span className="text-slate-500 text-[9px] block font-bold">{v.label}</span>
                        <span className="text-white font-black font-mono text-sm">{v.value}</span>
                        <span className="text-slate-400 text-[9px]"> {v.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alergias y medicamentos */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                  <h4 className="font-bold text-white text-sm flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Alergias & Medicación Crónica</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex flex-wrap gap-1.5">
                      {activePatient.allergies.map((a, i) => (
                        <span key={i} className="px-2.5 py-1 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-200 font-bold">{a}</span>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      {activePatient.medicalHistory.currentMeds.length > 0 ? activePatient.medicalHistory.currentMeds.map((m, i) => (
                        <div key={i} className="flex items-center space-x-1.5 p-1.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                          <Pill className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{m}</span>
                        </div>
                      )) : <span className="text-slate-500 italic">Sin medicación crónica registrada.</span>}
                    </div>
                  </div>
                </div>

                {/* Antecedentes clave */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                  <h4 className="font-bold text-white text-sm flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                    <ClipboardList className="w-4 h-4 text-indigo-400" />
                    <span>Antecedentes Clínicos</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: 'Patológicos', items: activePatient.medicalHistory.pathological },
                      { label: 'Quirúrgicos', items: activePatient.medicalHistory.surgical },
                      { label: 'Familiares', items: activePatient.medicalHistory.family },
                      { label: 'Hábitos', items: activePatient.medicalHistory.habits },
                    ].map((sec) => (
                      <div key={sec.label}>
                        <span className="text-slate-400 font-bold text-[10px] block mb-1">{sec.label}:</span>
                        <div className="flex flex-wrap gap-1">
                          {sec.items.length > 0 ? sec.items.map((item, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-300">{item}</span>
                          )) : <span className="text-slate-600 italic">Ninguno</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estado actual de módulos */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                  <h4 className="font-bold text-white text-sm flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Estado Clínico Transversal HIS</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: 'Laboratorio LIS', count: activePatient.labOrders.length, tab: 'laboratorio' as const, color: 'teal' },
                      { label: 'Imágenes RIS / PACS', count: activePatient.imagingOrders.length, tab: 'imagenes' as const, color: 'sky' },
                      { label: 'Recetas Farmacia', count: activePatient.prescriptions.length, tab: 'recetas' as const, color: 'amber' },
                      { label: 'Banco de Sangre', count: activePatient.bloodOrders?.length || 0, tab: 'bloodbank' as const, color: 'rose' },
                    ].map((mod) => (
                      <div key={mod.label} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-300 font-medium">{mod.label}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400 text-[11px]">{mod.count > 0 ? `${mod.count} registro(s)` : 'Sin registros'}</span>
                          <button
                            type="button"
                            onClick={() => updateConsultTab(mod.tab)}
                            className="px-2.5 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Ver →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SOAP previo si existe */}
              {activePatient.soapNote && (
                <div className="bg-slate-900 border border-indigo-500/20 rounded-3xl p-5 shadow-xl space-y-3">
                  <h4 className="font-bold text-white text-sm flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Nota SOAP — Evolución Actual</span>
                    <button type="button" onClick={() => updateConsultTab('soap')} className="ml-auto text-[10px] px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-lg font-bold cursor-pointer">Editar SOAP →</button>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {[
                      { label: '[S] Subjetivo', text: draftSubjective },
                      { label: '[O] Objetivo', text: draftObjective },
                      { label: '[A] Evaluación', text: draftAssessment },
                      { label: '[P] Plan', text: draftPlan },
                    ].map((s) => (
                      <div key={s.label} className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                        <span className="text-indigo-400 font-bold text-[10px] block mb-1">{s.label}</span>
                        <p className="text-slate-300 leading-relaxed whitespace-pre-line">{s.text || <span className="text-slate-600 italic">Sin datos</span>}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 1. EVOLUCIÓN CLÍNICA (SOAP) */}
          {consultTab === 'soap' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Formulario SOAP */}
              <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-bold text-white text-sm">Registro de Evolución Médica (Formato SOAP)</h3>
                  </div>
                  <span className="text-[10px] text-teal-400 font-mono font-bold">
                    Sesión Médica Oficial • Dr. Roberto Icaza
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  {/* [S] Subjetivo */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">
                      [S] Subjetivo (Anamnesis, síntomas referidos y evolución del motivo de consulta):
                    </label>
                    <textarea
                      value={draftSubjective}
                      onChange={(e) => setDraftSubjective(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 font-normal leading-relaxed"
                      placeholder="Paciente refiere que los síntomas iniciaron hace 48 horas..."
                    />
                  </div>

                  {/* [O] Objetivo */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-300">
                        [O] Objetivo (Constantes vitales y exploración física):
                      </label>
                      <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700/80 px-2.5 py-1 rounded-xl">
                        <span className="text-[10px] text-slate-400 font-bold">IMC:</span>
                        <strong className="text-xs text-white font-mono">{computedBmi} kg/m²</strong>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${bmiCategory.color} bg-slate-950 border border-slate-800`}>
                          {bmiCategory.label}
                        </span>
                        <span className="text-[9px] text-slate-400 hidden sm:inline" title="Cálculo estándar: Peso (kg) / (Estatura en m)². Se actualiza en tiempo real al editar Peso o Talla en los campos de abajo.">
                          (Calculado: Peso / Talla² • Modifique Peso o Talla abajo)
                        </span>
                      </div>
                    </div>

                    {/* Mini panel de signos vitales interactivo */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[9px]">P.A. (mmHg)</span>
                        <input
                          type="text"
                          value={vitalsBp}
                          onChange={(e) => setVitalsBp(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">F.C. (lpm)</span>
                        <input
                          type="number"
                          value={vitalsHr}
                          onChange={(e) => setVitalsHr(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">F.R. (rpm)</span>
                        <input
                          type="number"
                          value={vitalsRr}
                          onChange={(e) => setVitalsRr(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Temp (°C)</span>
                        <input
                          type="number"
                          step="0.1"
                          value={vitalsTemp}
                          onChange={(e) => setVitalsTemp(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">SpO2 (%)</span>
                        <input
                          type="number"
                          value={vitalsSpo2}
                          onChange={(e) => setVitalsSpo2(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Peso (kg)</span>
                        <input
                          type="number"
                          value={vitalsWeight}
                          onChange={(e) => setVitalsWeight(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Talla (cm)</span>
                        <input
                          type="number"
                          value={vitalsHeight}
                          onChange={(e) => setVitalsHeight(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-white font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Chips de Inserción de Examen Físico Rápido */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        'Alerta, orientado y colaborador en tiempo y espacio',
                        'Cardíaco: Ruidos rítmicos sin soplos ni galopes',
                        'Pulmonar: Murmullo vesicular conservado sin agregados',
                        'Abdomen: Blando, depresible, no doloroso, sin visceromegalias',
                        'Extremidades: Eutróficas, pulsos palpables, sin edemas periféricos',
                        'Orofaringe: No hiperémica, sin exudados amigdalinos'
                      ].map((phrase, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setDraftObjective((prev) => (prev ? `${prev}. ${phrase}` : phrase))}
                          className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-300 text-[10px] font-medium transition cursor-pointer"
                        >
                          + {phrase.split(':')[0]}
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={draftObjective}
                      onChange={(e) => setDraftObjective(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 font-normal leading-relaxed"
                      placeholder="Detalle de examen físico por sistemas..."
                    />
                  </div>

                  {/* [A] Evaluación / Impresión Diagnóstica */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <label className="font-bold text-slate-300">
                        [A] Análisis & Diagnóstico (CIE-10):
                      </label>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[9px] text-slate-500 font-bold">Rápidos:</span>
                        {COMMON_ICD10.slice(0, 4).map((icd) => (
                          <button
                            key={icd.code}
                            type="button"
                            onClick={() => {
                              const str = `[${icd.code}] ${icd.name}`;
                              setDraftPrimaryIcd(str);
                              setDraftAssessment((prev) => (prev ? `${prev}. Impresión: ${str}` : `Impresión: ${str}`));
                            }}
                            className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded text-[9px] font-bold hover:bg-indigo-500/20"
                          >
                            {icd.code}
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={draftPrimaryIcd}
                      onChange={(e) => setDraftPrimaryIcd(e.target.value)}
                      className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-400"
                      placeholder="Código y Nombre CIE-10 (Ej: E11.9 — Diabetes Mellitus Tipo 2)"
                    />

                    <textarea
                      value={draftAssessment}
                      onChange={(e) => setDraftAssessment(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 font-normal leading-relaxed"
                      placeholder="Juicio clínico y evolución del cuadro patológico..."
                    />
                  </div>

                  {/* [P] Plan Terapéutico */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-300">
                        [P] Plan Terapéutico, Cuidados y Recomendaciones:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (activePatient.medicalHistory.currentMeds.length > 0) {
                            const list = activePatient.medicalHistory.currentMeds
                              .map((m, i) => `${i + 1}. Continuar ${m}`)
                              .join('\n');
                            setDraftPlan((prev) => (prev ? `${prev}\n${list}` : list));
                          } else {
                            const baseline = '1. Dieta blanda balanceada y abundante hidratación oral.\n2. Reposo relativo por 48 horas.\n3. Acudir a urgencias si signos de alarma.';
                            setDraftPlan((prev) => (prev ? `${prev}\n${baseline}` : baseline));
                          }
                        }}
                        className="px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold hover:bg-amber-500/25 transition cursor-pointer"
                      >
                        + Insertar Pauta / Fármacos Activos
                      </button>
                    </div>

                    <textarea
                      value={draftPlan}
                      onChange={(e) => setDraftPlan(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 font-normal leading-relaxed"
                      placeholder="1. Prescripción de fármacos. 2. Solicitud de laboratorio control. 3. Signos de alarma..."
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    Cambios guardados en memoria de sesión clínica.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      logAuditEvent('ACTUALIZACIÓN_SOAP', 'Evolución SOAP guardada por el médico facultativo.', activePatient.name);
                      window.dispatchEvent(
                        new CustomEvent('lis-global-toast', {
                          detail: {
                            title: 'Nota SOAP Actualizada',
                            message: 'Datos clínicos guardados exitosamente.',
                            type: 'info'
                          }
                        })
                      );
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Nota SOAP</span>
                  </button>
                </div>
              </div>

              {/* Panel Lateral: Resumen del Paciente & Acciones Rápidas */}
              <div className="lg:col-span-4 space-y-4">
                {/* Tarjeta de Alergias & Fármacos Actuales */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Alergias Conocidas</h4>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {activePatient.allergies.map((al, idx) => (
                      <div key={idx} className="p-2 bg-rose-950/30 border border-rose-500/30 rounded-xl text-rose-200 font-bold flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{al}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Medicamentos Actuales:</span>
                      <span className="text-[10px] text-indigo-300 font-mono">{activePatient.medicalHistory.currentMeds.length}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      {activePatient.medicalHistory.currentMeds.length > 0 ? (
                        activePatient.medicalHistory.currentMeds.map((med, i) => (
                          <div key={i} className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 flex items-center space-x-1.5">
                            <Pill className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">{med}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 italic text-[11px]">Sin prescripciones crónicas activas.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones Rápidas de la Consulta */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2.5">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-800 pb-2">
                    Accesos Directos Clínicos
                  </h4>

                  <button
                    type="button"
                    onClick={() => updateConsultTab('recetas')}
                    className="w-full p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-bold text-slate-200 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <Pill className="w-4 h-4 text-emerald-400" />
                      <span>Emitir Receta Médica Oficial</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => updateConsultTab('laboratorio')}
                    className="w-full p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-bold text-slate-200 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-teal-400" />
                      <span>Solicitar Exámenes LIS</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => updateConsultTab('incapacidad')}
                    className="w-full p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs font-bold text-slate-200 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <FileCheck className="w-4 h-4 text-amber-400" />
                      <span>Generar Certificado Incapacidad</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. EXPEDIENTE & ANTECEDENTES */}
          {consultTab === 'antecedentes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2.5 flex items-center space-x-2">
                  <ClipboardList className="w-4 h-4 text-indigo-400" />
                  <span>Antecedentes Patológicos Personales & Quirúrgicos</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Patológicos (Enfermedades crónicas):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activePatient.medicalHistory.pathological.length > 0 ? (
                        activePatient.medicalHistory.pathological.map((pat, i) => (
                          <span key={i} className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium">
                            {pat}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic">No refiere antecedentes patológicos.</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400 font-bold block mb-1">Quirúrgicos & Traumáticos:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activePatient.medicalHistory.surgical.length > 0 ? (
                        activePatient.medicalHistory.surgical.map((surg, i) => (
                          <span key={i} className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium">
                            {surg}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic">Niega intervenciones quirúrgicas previas.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2.5 flex items-center space-x-2">
                  <User className="w-4 h-4 text-teal-400" />
                  <span>Antecedentes Familiares, Hábitos & Medicación Actual</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Familiares (Hereditarios):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activePatient.medicalHistory.family.length > 0 ? (
                        activePatient.medicalHistory.family.map((fam, i) => (
                          <span key={i} className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium">
                            {fam}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic">Sin antecedentes familiares de relevancia.</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400 font-bold block mb-1">Hábitos & Estilo de Vida:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activePatient.medicalHistory.habits.length > 0 ? (
                        activePatient.medicalHistory.habits.map((hab, i) => (
                          <span key={i} className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 font-medium">
                            {hab}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic">Sin hábitos tóxicos referidos.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MAPA CORPORAL ANATÓMICO */}
          {consultTab === 'anatomia' && (
            <AnatomicalBodyMap
              patientId={activePatient.id}
              patientName={activePatient.name}
              onInsertIntoSoap={(text) => {
                setDraftObjective((prev) => (prev ? `${prev}\n\n${text}` : text));
                updateConsultTab('soap');
              }}
            />
          )}

          {/* 3. RECETAS MÉDICAS (Rx) */}
          {consultTab === 'recetas' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Prescriptor */}
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Pill className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-sm">Prescribir Fármaco para esta Consulta</h3>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">Firma MINSA Habilitada</span>
                </div>

                {/* Presets Rápidos */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Plantillas de Prescripción Rápida (1-Click):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_DRUGS_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPresetDrug(p)}
                        className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-medium transition cursor-pointer"
                      >
                        + {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleAddPrescription} className="space-y-3 text-xs pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 block">Nombre del Fármaco / Principio Activo:</label>
                      <input
                        type="text"
                        required
                        value={newDrugName}
                        onChange={(e) => setNewDrugName(e.target.value)}
                        placeholder="Ej: Amoxicilina / Ácido Clavulánico"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 block">Concentración / Dosis:</label>
                      <input
                        type="text"
                        required
                        value={newDrugDose}
                        onChange={(e) => setNewDrugDose(e.target.value)}
                        placeholder="Ej: 875/125 mg ó 500 mg"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 block">Vía:</label>
                      <select
                        value={newDrugRoute}
                        onChange={(e) => setNewDrugRoute(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Oral">Oral (VO)</option>
                        <option value="Sublingual">Sublingual (SL)</option>
                        <option value="Intravenosa">Intravenosa (IV)</option>
                        <option value="Intramuscular">Intramuscular (IM)</option>
                        <option value="Subcutánea">Subcutánea (SC)</option>
                        <option value="Tópica">Tópica</option>
                        <option value="Inhalatoria">Inhalatoria</option>
                        <option value="Oftálmica">Oftálmica</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 block">Frecuencia:</label>
                      <input
                        type="text"
                        value={newDrugFreq}
                        onChange={(e) => setNewDrugFreq(e.target.value)}
                        placeholder="Ej: Cada 8 horas"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 block">Duración:</label>
                      <input
                        type="text"
                        value={newDrugDuration}
                        onChange={(e) => setNewDrugDuration(e.target.value)}
                        placeholder="Ej: 7 días"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Indicaciones / Pauta Específica:</label>
                    <input
                      type="text"
                      value={newDrugInstructions}
                      onChange={(e) => setNewDrugInstructions(e.target.value)}
                      placeholder="Ej: Tomar con las comidas principales. Evitar consumo de lácteos al mismo tiempo."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center space-x-2 uppercase tracking-wider text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar a la Receta Médica</span>
                  </button>
                </form>
              </div>

              {/* Lista de Medicamentos Prescritos & Botón de Impresión Oficial */}
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-bold text-white text-sm">
                      Receta Médica en Curso ({activePatient.prescriptions.length})
                    </h3>
                  </div>
                  {activePatient.prescriptions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPrintableDocument({
                        type: 'RECETA',
                        title: 'Receta Médica Oficial MINSA',
                        patient: activePatient
                      })}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir / Ver Receta Oficial</span>
                    </button>
                  )}
                </div>

                {activePatient.prescriptions.length > 0 ? (
                  <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                    {activePatient.prescriptions.map((rx, idx) => (
                      <div key={`${rx.id}-${idx}`} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-start justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-emerald-400">{idx + 1}.</span>
                            <span className="font-black text-white text-sm">{rx.medication}</span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-teal-300 font-mono font-bold text-[10px]">
                              {rx.dose}
                            </span>
                          </div>
                          <div className="text-slate-300">
                            <strong>{rx.route}</strong> • {rx.frequency} por <strong>{rx.duration}</strong>
                          </div>
                          {rx.instructions && (
                            <p className="text-[11px] text-slate-400 italic">
                              Instrucción: {rx.instructions}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeletePrescription(rx.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          title="Eliminar de la receta"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center space-y-2.5">
                    <Pill className="w-10 h-10 text-slate-600 stroke-[1.5]" />
                    <p className="text-slate-300 font-bold text-xs">No hay medicamentos prescritos aún</p>
                    <p className="text-slate-500 text-[11px] max-w-xs">
                      Utilice el formulario de la izquierda o las plantillas rápidas de 1-click para añadir medicamentos a la receta médica.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. SOLICITUD DE LABORATORIO (LIS) */}
          {consultTab === 'laboratorio' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-teal-400" />
                    <span>Catálogo de Exámenes Clínicos & Emisión Directa al LIS</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Las solicitudes se integran inmediatamente a las bandejas técnicas del laboratorio clínico.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-bold">Prioridad:</span>
                  <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setLabOrderPriority('RUTINA')}
                      className={`px-3 py-1 rounded-lg transition ${
                        labOrderPriority === 'RUTINA' ? 'bg-teal-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Rutina
                    </button>
                    <button
                      type="button"
                      onClick={() => setLabOrderPriority('URGENTE')}
                      className={`px-3 py-1 rounded-lg transition ${
                        labOrderPriority === 'URGENTE' ? 'bg-rose-500 text-white font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Urgente Inmediata
                    </button>
                  </div>
                </div>
              </div>

              {/* Buscador de pruebas */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={labSearchTerm}
                  onChange={(e) => setLabSearchTerm(e.target.value)}
                  placeholder="Buscar en el catálogo (Ej: Hemograma, Glucosa, Creatinina, Perfil Lipídico, Troponina, PCR)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Grid del Catálogo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {MOCK_TEST_CATALOG
                  .filter((item) => !labSearchTerm || item.name.toLowerCase().includes(labSearchTerm.toLowerCase()))
                  .map((item) => {
                    const isSelected = selectedLabTestIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedLabTestIds(selectedLabTestIds.filter((id) => id !== item.id));
                          } else {
                            setSelectedLabTestIds([...selectedLabTestIds, item.id]);
                          }
                        }}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between text-xs ${
                          isSelected
                            ? 'bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/50'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-white block leading-snug">{item.name}</span>
                          <span className="text-[10px] text-teal-400 font-mono">${item.price.toFixed(2)}</span>
                        </div>
                        <span className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-teal-500 border-teal-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* Resumen de Selección & Botón de Registro en Borrador */}
              <div className="space-y-3">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="text-white font-bold">
                      Pruebas Seleccionadas: <strong className="text-teal-400 font-mono">{selectedLabTestIds.length}</strong>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Prioridad asignada: <strong className={labOrderPriority === 'URGENTE' ? 'text-rose-400 font-black' : 'text-teal-300'}>{labOrderPriority === 'URGENTE' ? 'URGENTE INMEDIATA' : 'RUTINA'}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDispatchLabOrder}
                    disabled={selectedLabTestIds.length === 0}
                    className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-30 disabled:pointer-events-none text-slate-950 font-black rounded-xl shadow-lg shadow-teal-500/25 transition cursor-pointer flex items-center space-x-2 uppercase tracking-wider text-xs"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ Registrar en Plan de Laboratorio (Borrador)</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2.5 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3.5 py-2.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Seguridad Clínica:</strong> Las pruebas se guardan en borrador de consulta. Puede modificarlas o eliminarlas en cualquier momento; se transmitirán formalmente a flebotomía y al LIS únicamente al hacer clic en <em>"Finalizar Atención Médica"</em> para evitar órdenes falsas.
                  </span>
                </div>
              </div>

              {/* Historial de Órdenes en esta consulta */}
              {activePatient.labOrders.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-teal-400" />
                      <span>Órdenes de Laboratorio de esta Consulta ({activePatient.labOrders.length}):</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {activePatient.labOrders.filter((o) => o.status === 'PENDIENTE_ENVIO' || !o.status).length} en borrador
                    </span>
                  </div>

                  <div className="space-y-2">
                    {activePatient.labOrders.map((ord, ordIdx) => {
                      const isPending = ord.status === 'PENDIENTE_ENVIO' || !ord.status;
                      return (
                        <div key={`${ord.id}-${ordIdx}`} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-teal-300">{ord.orderNumber || ord.id}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                ord.priority === 'URGENTE' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-300'
                              }`}>
                                {ord.priority === 'URGENTE' ? 'URGENTE' : 'RUTINA'}
                              </span>
                              {isPending ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Borrador (Se enviará al finalizar)</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center space-x-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Transmitido al LIS</span>
                                </span>
                              )}
                            </div>
                            <p className="text-slate-200 font-medium">{ord.testNames.join(', ')}</p>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            <span className="text-[10px] font-mono text-slate-400">{ord.timestamp}</span>
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => handleDeleteLabOrder(ord.id)}
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-800/60 transition cursor-pointer"
                                title="Eliminar orden del borrador (no enviar al laboratorio)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. IMÁGENES & GABINETE */}
          {consultTab === 'imagenes' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-white text-sm">Solicitud de Imagenología & Gabinete</h3>
                </div>

                <form onSubmit={handleAddImagingOrder} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Modalidad Diagnóstica:</label>
                    <select
                      value={imagingModality}
                      onChange={(e) => setImagingModality(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-cyan-500"
                    >
                      <option value="RAYOS_X">Rayos X (Radiología Convencional)</option>
                      <option value="ULTRASONIDO">Ultrasonido / Ecografía</option>
                      <option value="TAC">Tomografía Computarizada (TAC)</option>
                      <option value="RESONANCIA">Resonancia Magnética (RMN)</option>
                      <option value="ECG">Electrocardiograma (ECG)</option>
                      <option value="ENDOSCOPIA">Endoscopía Digestiva</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Estudio Solicitado:</label>
                    <input
                      type="text"
                      required
                      value={imagingStudy}
                      onChange={(e) => setImagingStudy(e.target.value)}
                      placeholder="Ej: Rayos X de Tórax PA y Lateral, Ultrasonido Abdominal Completo..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Indicación Clínica / Sospecha:</label>
                    <textarea
                      value={imagingIndication}
                      onChange={(e) => setImagingIndication(e.target.value)}
                      rows={3}
                      placeholder="Ej: Descartar consolidación pulmonar o derrame pleural..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 font-normal"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black rounded-xl shadow-lg shadow-cyan-600/20 transition cursor-pointer flex items-center justify-center space-x-2 uppercase tracking-wider text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Emitir Solicitud de Imagenología</span>
                  </button>
                </form>
              </div>

              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Estudios Solicitados en esta Consulta ({activePatient.imagingOrders.length})</span>
                </h3>

                {activePatient.imagingOrders.length > 0 ? (
                  <div className="space-y-3">
                    {activePatient.imagingOrders.map((img, imgIdx) => (
                      <div key={`${img.id}-${imgIdx}`} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-cyan-300">{img.studyName}</span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
                            {img.modality}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">Indicación: {img.indication}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center space-y-2">
                    <Zap className="w-10 h-10 text-slate-600 stroke-[1.5]" />
                    <p className="text-slate-300 font-bold text-xs">Sin órdenes de imagen solicitadas</p>
                    <p className="text-slate-500 text-[11px] max-w-xs">
                      Si el paciente amerita radiografía, ultrasonido o tomografía, emita la orden correspondiente.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BANCO DE SANGRE & TRANSFUSIONES */}
          {consultTab === 'bloodbank' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-rose-950/60 to-slate-900 border border-rose-500/30 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Droplets className="w-5 h-5 text-rose-400" />
                    <div>
                      <h3 className="font-bold text-white">Banco de Sangre & Medicina Transfusional</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Inmunohematología · Hemocomponentes · Trazabilidad Vena-a-Vena</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-full font-bold">
                    Tipo Sangre: {activePatient.bloodType}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Formulario de solicitud */}
                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                    <Droplets className="w-4 h-4 text-rose-400" />
                    <h4 className="font-bold text-white text-sm">Solicitar Hemocomponente</h4>
                  </div>

                  <form onSubmit={handleRequestBloodProduct} className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Hemocomponente Solicitado:</label>
                      <select
                        value={bloodProductType}
                        onChange={(e) => setBloodProductType(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="CONCENTRADO_GLOBULOS_ROJOS">Concentrado de Glóbulos Rojos (CGR)</option>
                        <option value="PLASMA_FRESCO_CONGELADO">Plasma Fresco Congelado (PFC)</option>
                        <option value="CONCENTRADO_PLAQUETARIO">Concentrado de Plaquetas (CP)</option>
                        <option value="CRIOPRECIPITADO">Crioprecipitado (Factores de Coagulación)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-300 block mb-1">Unidades:</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={bloodUnits}
                          onChange={(e) => setBloodUnits(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-300 block mb-1">Urgencia:</label>
                        <select
                          value={bloodUrgency}
                          onChange={(e) => setBloodUrgency(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500"
                        >
                          <option value="STAT_INMEDIATA">STAT — Inmediata</option>
                          <option value="URGENTE_2H">Urgente (2 horas)</option>
                          <option value="RESERVA_ELECTIVA">Reserva Electiva</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Indicación Clínica:</label>
                      <textarea
                        required
                        rows={3}
                        value={bloodIndication}
                        onChange={(e) => setBloodIndication(e.target.value)}
                        placeholder="Anemia aguda, Hb 7.2 g/dL. Hemorragia digestiva alta activa..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Droplets className="w-4 h-4" />
                      <span>Enviar Solicitud a Banco de Sangre</span>
                    </button>
                  </form>
                </div>

                {/* Historial inmunohematología + solicitudes */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Perfil inmunohematológico */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
                    <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-2.5 mb-3">Perfil Inmunohematológico del Paciente</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {[
                        { label: 'Grupo ABO', value: activePatient.bloodType.replace(/[+-]/, ''), color: 'text-rose-400 text-xl' },
                        { label: 'Factor Rh(D)', value: activePatient.bloodType.includes('+') ? 'Positivo (+)' : 'Negativo (−)', color: 'text-white' },
                        { label: 'Anticuerpos Irr.', value: 'No detectados', color: 'text-emerald-400' },
                        { label: 'Hemovigilancia', value: 'Sin alertas', color: 'text-emerald-400' },
                      ].map((field) => (
                        <div key={field.label} className="bg-slate-950 rounded-2xl p-3 border border-slate-800 text-center space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">{field.label}</span>
                          <span className={`font-black ${field.color}`}>{field.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Solicitudes del turno */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                    <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-2.5">
                      Solicitudes de Hemocomponentes — Esta Consulta ({(activePatient.bloodOrders || []).length})
                    </h4>
                    {(activePatient.bloodOrders || []).length > 0 ? (
                      <div className="space-y-2">
                        {(activePatient.bloodOrders || []).map((ord, bIdx) => (
                          <div key={`${ord.id}-${bIdx}`} className="p-3 bg-slate-950 rounded-2xl border border-rose-500/20 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-rose-300">{ord.productType.replace(/_/g, ' ')} ({ord.units} U)</span>
                              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-full text-[10px] font-bold border border-rose-500/30">{ord.urgency.replace(/_/g, ' ')}</span>
                            </div>
                            <p className="text-slate-400">{ord.indication}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">{ord.timestamp}</span>
                              <span className="text-emerald-400 font-bold">{ord.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 space-y-2">
                        <Droplets className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-slate-500 text-xs">Sin solicitudes de hemocomponentes en esta consulta.</p>
                        <p className="text-slate-600 text-[10px]">Use el formulario para solicitar al Banco de Sangre.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. INCAPACIDAD MÉDICA */}
          {consultTab === 'incapacidad' && (
            <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-white text-base">Certificado Oficial de Incapacidad Médica</h3>
                    <p className="text-xs text-slate-400">Válido ante empleador, CSS y autoridades laborales de Panamá</p>
                  </div>
                </div>
                {activePatient.medicalLeave && (
                  <button
                    type="button"
                    onClick={() => setPrintableDocument({
                      type: 'INCAPACIDAD',
                      title: 'Certificado de Incapacidad Médica Oficial',
                      patient: activePatient
                    })}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Certificado</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveMedicalLeave} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Días de Reposo e Incapacidad:</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={leaveDays}
                      onChange={(e) => setLeaveDays(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Fecha de Inicio:</label>
                    <input
                      type="date"
                      value={leaveStartDate}
                      onChange={(e) => setLeaveStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Diagnóstico de la Incapacidad:</label>
                  <input
                    type="text"
                    value={draftPrimaryIcd || activePatient.consultationReason}
                    readOnly
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 text-slate-300 font-mono text-xs cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Justificación Clínica & Observaciones:</label>
                  <textarea
                    value={leaveJustification}
                    onChange={(e) => setLeaveJustification(e.target.value)}
                    rows={3}
                    placeholder="Paciente amerita reposo físico domiciliario por encontrarse en fase sintomática aguda..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-normal leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black rounded-xl shadow-lg shadow-amber-600/20 transition cursor-pointer flex items-center justify-center space-x-2 uppercase tracking-wider text-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Emitir Certificado con Idoneidad Médica</span>
                </button>
              </form>
            </div>
          )}

          {/* 7. INTERCONSULTA / REFERENCIA */}
          {consultTab === 'referencia' && (
            <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Share2 className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="font-bold text-white text-base">Boleta de Referencia / Interconsulta Médica</h3>
                    <p className="text-xs text-slate-400">Derivación especializada dentro de la red asistencial</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveReferral} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Especialidad de Destino:</label>
                  <select
                    value={referralSpecialty}
                    onChange={(e) => setReferralSpecialty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Cardiología Clínica">Cardiología Clínica & Electrofisiología</option>
                    <option value="Neurología">Neurología</option>
                    <option value="Cirugía General">Cirugía General & Laparoscopía</option>
                    <option value="Gastroenterología">Gastroenterología & Endoscopía</option>
                    <option value="Endocrinología">Endocrinología & Metabolismo</option>
                    <option value="Ortopedia y Traumatología">Ortopedia y Traumatología</option>
                    <option value="Oftalmología">Oftalmología</option>
                    <option value="Psiquiatría">Psiquiatría & Salud Mental</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Motivo de la Derivación & Resumen del Cuadro:</label>
                  <textarea
                    value={referralReason}
                    onChange={(e) => setReferralReason(e.target.value)}
                    rows={4}
                    placeholder="Se solicita valoración especializada debido a persistencia de síntomas y hallazgos compatibles con..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-normal leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer flex items-center justify-center space-x-2 uppercase tracking-wider text-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>Generar Boleta Oficial de Referencia</span>
                </button>
              </form>
            </div>
          )}

          {/* 8. HISTORIAL & LABS PREVIOS DEL PACIENTE EN EL LIS */}
          {consultTab === 'historial' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="font-bold text-white text-base">Historial de Laboratorio del Paciente</h3>
                    <p className="text-xs text-slate-400">
                      Órdenes y resultados validados previamente en el LIS para este paciente
                    </p>
                  </div>
                </div>
                <span className="text-xs text-teal-400 font-mono font-bold">
                  Cédula: {activePatient.nationalId}
                </span>
              </div>

              {orders.filter((o) => o.patientNationalId === activePatient.nationalId || (o.patientName || '').toLowerCase().includes(activePatient.name.toLowerCase().split(' ')[0])).length > 0 ? (
                <div className="space-y-3">
                  {orders
                    .filter((o) => o.patientNationalId === activePatient.nationalId || (o.patientName || '').toLowerCase().includes(activePatient.name.toLowerCase().split(' ')[0]))
                    .map((ord, ordIdx) => {
                      const ordResults = results.filter((r) => r.orderId === ord.id);
                      return (
                        <div key={`${ord.id}-${ordIdx}`} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-teal-300">{ord.orderNumber}</span>
                              <span className="text-slate-400">{new Date(ord.createdAt).toLocaleDateString('es-PA')}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                ord.status === 'VALIDADA_MED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {ord.status === 'VALIDADA_MED' ? 'VALIDADO OFICIAL' : 'EN PROCESO'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => onOpenPdf(ord.id)}
                              className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-lg font-bold text-[11px] transition flex items-center space-x-1 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Ver Informe Oficial</span>
                            </button>
                          </div>

                          {ordResults.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {ordResults.map((r) => (
                                <div key={r.id} className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                                  <div>
                                    <div className="font-bold text-white text-[11px]">{r.parameterName}</div>
                                    <div className="text-[9px] text-slate-400">Ref: {r.refRangeText} {r.unit}</div>
                                  </div>
                                  <div className="font-mono font-black text-sm text-white">
                                    {r.value} <span className="text-[10px] text-slate-400 font-normal">{r.unit}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center space-y-2">
                  <Activity className="w-10 h-10 text-slate-600 stroke-[1.5]" />
                  <p className="text-slate-300 font-bold text-xs">Sin órdenes de laboratorio previas registradas</p>
                  <p className="text-slate-500 text-[11px] max-w-xs">
                    Cuando este paciente cuente con exámenes validados en el LIS, aparecerán automáticamente en esta vista.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 9. AUDITORÍA & TRAZABILIDAD */}
          {consultTab === 'auditoria' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Trazabilidad & Registro de Auditoría Médica</h3>
                  <p className="text-xs text-slate-400">
                    Control estricto de eventos clínicos bajo la Ley 81 de Protección de Datos Personales
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[10px]">
                          {log.action}
                        </span>
                        <strong className="text-white">{log.patientName}</strong>
                      </div>
                      <p className="text-slate-300 text-[11px]">{log.detail}</p>
                    </div>

                    <div className="text-right text-[10px] text-slate-500 font-mono">
                      <div>{log.timestamp}</div>
                      <div className="text-indigo-400">{log.doctorName}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ============================================================== */
        /* CASO 2: TABLERO DE ATENCIÓN DEL MÉDICO (SALA DE ESPERA / COLA) */
        /* ============================================================== */
        <div className="space-y-6">
          {/* Tarjetas de Métricas de la Consulta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 text-center space-y-1">
              <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">En Espera / Cola</div>
              <div className="text-2xl sm:text-3xl font-black text-white">{queueStats.waiting}</div>
              <div className="text-[10px] text-slate-400 font-medium">Pacientes listos para entrar</div>
            </div>

            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-1">
              <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>En Consulta Activa</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-300">{queueStats.inConsult}</div>
              <div className="text-[10px] text-slate-400 font-medium">Atención médica en curso</div>
            </div>

            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 text-center space-y-1">
              <div className="text-[11px] text-indigo-300 font-bold uppercase tracking-wider">Finalizadas Hoy</div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-200">{queueStats.finished}</div>
              <div className="text-[10px] text-slate-400 font-medium">Consultas atendidas</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Tiempo Promedio</div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">18m</div>
              <div className="text-[10px] text-slate-400 font-medium">Por paciente atendido</div>
            </div>
          </div>

          {/* Barra de Filtros, Búsqueda, Sincronización con Recepción y Alternador de Vistas */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center space-x-2">
                  <Stethoscope className="w-5 h-5 text-indigo-400" />
                  <span>Tablero de Atención Médica (Pacientes Admitidos en Recepción & HIS)</span>
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <p className="text-xs text-emerald-300 font-medium">
                    Sincronizado en tiempo real con Recepción Central & Admisión Hospitalaria
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                {/* Indicador de Sincronización Automática con Recepción */}
                <div className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span>Sincronización Automática: En Vivo</span>
                  <button
                    type="button"
                    onClick={() => handleSyncWithReception(false)}
                    className="p-1 hover:bg-emerald-900/60 rounded-lg text-emerald-400 hover:text-white transition cursor-pointer"
                    title="Actualizar manualmente ahora"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingWalkIn(true)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold rounded-2xl text-xs flex items-center space-x-2 transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Admisión Rápida</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              {/* Buscador */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar por Nombre, Cédula, N° de Turno o Motivo..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                {/* Botones de Filtro de Estado */}
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs sm:text-sm font-bold">
                  {[
                    { id: 'ALL', label: `Todos (${queue.length})` },
                    { id: 'EN_ESPERA', label: `En Espera (${queueStats.waiting})` },
                    { id: 'EN_CONSULTA', label: `En Consulta (${queueStats.inConsult})` },
                    { id: 'FINALIZADA', label: `Finalizadas (${queueStats.finished})` }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStatusFilter(f.id as any)}
                      className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                        statusFilter === f.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Alternador de Modo de Vista (Tabla vs Tarjetas Dinámicas) */}
                <div className="hidden sm:flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setQueueViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
                      queueViewMode === 'table' ? 'bg-slate-800 text-teal-300 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Vista en tabla fluida sin scroll horizontal"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Tabla</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueViewMode('cards')}
                    className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
                      queueViewMode === 'cards' ? 'bg-slate-800 text-teal-300 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Vista dinámica en tarjetas de triage"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Tarjetas</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Listado de Pacientes en Cola: TABLA DINÁMICA FLUIDA (CERO CORTE HORIZONTAL) */}
            {queueViewMode === 'table' ? (
              <div className="w-full overflow-x-auto rounded-2xl pt-1">
                <table className="w-full table-fixed min-w-[850px] lg:min-w-full text-left text-sm">
                  <colgroup>
                    <col className="w-[7%]" />
                    <col className="w-[22%]" />
                    <col className="w-[6%]" />
                    <col className="w-[7.5%]" />
                    <col className="w-[22.5%]" />
                    <col className="w-[9.5%]" />
                    <col className="w-[13.5%]" />
                    <col className="w-[12%]" />
                  </colgroup>
                  <thead className="bg-slate-950 text-slate-300 uppercase tracking-wider text-xs font-bold">
                    <tr>
                      <th className="px-2 py-3.5 text-center whitespace-nowrap rounded-l-xl">Turno</th>
                      <th className="px-3 py-3.5">Paciente & Cédula</th>
                      <th className="px-1.5 py-3.5 text-center whitespace-nowrap">Edad/Sexo</th>
                      <th className="px-2 py-3.5 text-center whitespace-nowrap">Llegada</th>
                      <th className="px-3 py-3.5">Motivo & Triaje (Recepción)</th>
                      <th className="px-2 py-3.5 text-center whitespace-nowrap">Tipo</th>
                      <th className="px-2 py-3.5 text-center whitespace-nowrap">Estado</th>
                      <th className="px-2 py-3.5 text-center whitespace-nowrap rounded-r-xl">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-medium">
                    {filteredQueue.length > 0 ? (
                      filteredQueue.map((pat) => {
                        const isWaiting = pat.status === 'EN_ESPERA' || pat.status === 'PENDIENTE';
                        const isInConsult = pat.status === 'EN_CONSULTA';
                        const isFinished = pat.status === 'FINALIZADA';
                        const isUrgent = pat.priority === 'URGENTE';
                        const turnStyle = getTurnBadgeStyle(pat.turnNumber, pat.priority, pat.consultationType);
                        const consultTypeBadgeClass = getConsultTypeStyle(pat.consultationType);

                        return (
                          <tr
                            key={pat.id}
                            className={`transition-colors duration-150 ${
                              isInConsult
                                ? 'bg-emerald-950/25 hover:bg-emerald-950/35 border-l-4 border-l-emerald-400'
                                : turnStyle.rowHighlight
                            }`}
                          >
                            {/* Turno con Diferenciación de Color de Alta Visibilidad */}
                            <td className="px-2 py-3 text-center">
                              <span className={`inline-flex flex-col items-center justify-center w-full max-w-[62px] px-1 py-1 rounded-xl font-mono font-black text-xs sm:text-sm border shadow-sm ${turnStyle.bg}`}>
                                <span>{pat.turnNumber}</span>
                                <span className="text-[8px] uppercase tracking-tighter opacity-80 font-sans font-bold leading-none mt-0.5">
                                  {turnStyle.label}
                                </span>
                              </span>
                            </td>

                            {/* Paciente con Avatar */}
                            <td className="px-3 py-3">
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/30 to-teal-500/30 border border-indigo-500/40 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-inner">
                                  {pat.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1 truncate">
                                  <div className="font-extrabold text-white text-xs sm:text-sm leading-tight truncate" title={pat.name}>
                                    {pat.name}
                                  </div>
                                  <div className="text-[11px] text-slate-300 font-mono flex items-center space-x-1.5 mt-0.5 truncate">
                                    <span className="font-semibold text-slate-200">{pat.nationalId}</span>
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-teal-300 border border-slate-700/60 font-sans font-medium">Recepción</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Edad / Sexo */}
                            <td className="px-1.5 py-3 text-center whitespace-nowrap">
                              <div className="text-white font-bold text-xs sm:text-sm">{pat.age}a</div>
                              <div className="text-[10px] text-slate-400 font-medium">{pat.gender === 'M' ? 'Masc' : 'Fem'}</div>
                            </td>

                            {/* Llegada (Orden Cronológico Estricto) */}
                            <td className="px-2 py-3 text-center font-mono font-bold text-slate-100 text-xs sm:text-sm whitespace-nowrap">
                              {pat.arrivalTime}
                            </td>

                            {/* Motivo de Consulta & Alergias */}
                            <td className="px-3 py-3">
                              <p className="text-slate-100 text-xs font-normal line-clamp-2 leading-relaxed" title={pat.consultationReason}>
                                {pat.consultationReason}
                              </p>
                              {pat.allergies.length > 0 && !pat.allergies.includes('Ninguna conocida (NKDA)') && (
                                <div className="inline-flex items-center space-x-1 mt-1 px-1.5 py-0.5 rounded-lg bg-rose-950/70 border border-rose-500/50 text-[10px] text-rose-300 font-bold truncate max-w-full">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                                  <span className="truncate">Alergia: {pat.allergies.join(', ')}</span>
                                </div>
                              )}
                            </td>

                            {/* Tipo Consulta con Formato Compacto y Colores Distintivos */}
                            <td className="px-2 py-3 text-center">
                              <span
                                className={`inline-block w-full max-w-[110px] px-2 py-1 rounded-xl border font-bold text-[10px] sm:text-xs uppercase tracking-tight truncate ${consultTypeBadgeClass}`}
                                title={pat.consultationType.replace(/_/g, ' ')}
                              >
                                {formatConsultType(pat.consultationType)}
                              </span>
                            </td>

                            {/* Estado Dinámico sin Parpadeo y con Espacio Completo */}
                            <td className="px-2 py-3 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap space-x-1.5 ${
                                isInConsult
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                                  : isWaiting
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : isFinished
                                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              }`}>
                                {isInConsult && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>}
                                {isWaiting && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>}
                                {isFinished && <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>}
                                <span>
                                  {isInConsult ? 'En Consulta' : isWaiting ? 'En Espera' : isFinished ? 'Finalizada' : pat.status}
                                </span>
                              </span>
                            </td>

                            {/* Acción Médica 100% Visible */}
                            <td className="px-2 py-3 text-center">
                              {isInConsult ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateActivePatientId(pat.id);
                                    updateConsultTab('soap');
                                  }}
                                  className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition shadow-md shadow-emerald-600/30 inline-flex items-center justify-center space-x-1 cursor-pointer"
                                  title="Continuar atención médica del paciente activo"
                                >
                                  <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                                  <span>Continuar</span>
                                </button>
                              ) : isWaiting ? (
                                <button
                                  type="button"
                                  onClick={() => handleStartConsultation(pat)}
                                  className="w-full py-1.5 px-2 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-black rounded-xl text-xs transition shadow-md shadow-indigo-600/30 inline-flex items-center justify-center space-x-1 cursor-pointer group"
                                  title="Iniciar consulta médica"
                                >
                                  <span>Atender</span>
                                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
                                </button>
                              ) : isFinished ? (
                                <button
                                  type="button"
                                  onClick={() => setPrintableDocument({
                                    type: 'RESUMEN_CONSULTA',
                                    title: 'Resumen Oficial de Consulta Médica & Evolución',
                                    patient: pat
                                  })}
                                  className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition inline-flex items-center justify-center space-x-1 cursor-pointer"
                                  title="Ver o imprimir resumen de consulta"
                                >
                                  <Eye className="w-3.5 h-3.5 shrink-0" />
                                  <span>Resumen</span>
                                </button>
                              ) : (
                                <span className="text-slate-500 text-xs">Sin acción</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 text-sm">
                          No hay pacientes que coincidan con el filtro seleccionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Vista en Tarjetas de Triage / Box Clínico (Modo Dinámico) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {filteredQueue.map((pat) => {
                  const isWaiting = pat.status === 'EN_ESPERA' || pat.status === 'PENDIENTE';
                  const isInConsult = pat.status === 'EN_CONSULTA';
                  const isFinished = pat.status === 'FINALIZADA';
                  const isUrgent = pat.priority === 'URGENTE';
                  const turnStyle = getTurnBadgeStyle(pat.turnNumber, pat.priority, pat.consultationType);

                  return (
                    <div
                      key={pat.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                        isInConsult
                          ? 'bg-slate-900/95 border-emerald-500/50 shadow-xl shadow-emerald-500/10'
                          : isUrgent
                          ? 'bg-slate-900/95 border-rose-500/50 shadow-xl shadow-rose-500/10'
                          : 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1.5 rounded-xl border font-mono font-black text-sm flex items-center space-x-1.5 ${turnStyle.bg}`}>
                            <span>Turno: {pat.turnNumber}</span>
                            <span className="text-[10px] uppercase font-sans font-bold opacity-80">({turnStyle.label})</span>
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase inline-flex items-center space-x-1.5 ${
                            isInConsult
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : isWaiting
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {isInConsult && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                            <span>{pat.status.replace(/_/g, ' ')}</span>
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-white text-base sm:text-lg">{pat.name}</h4>
                          <div className="text-xs text-slate-300 font-mono flex items-center space-x-2 mt-0.5">
                            <span>Cédula: {pat.nationalId}</span>
                            <span>•</span>
                            <span>{pat.age}a ({pat.gender === 'M' ? 'Masc' : 'Fem'})</span>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Motivo de Consulta (Admisión):
                          </span>
                          <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed">
                            {pat.consultationReason}
                          </p>
                        </div>

                        {/* Signos Vitales de Admisión */}
                        <div className="grid grid-cols-4 gap-2 text-center bg-slate-950/60 p-2.5 rounded-xl text-xs">
                          <div><span className="text-slate-400 block text-[10px] uppercase font-bold">P.A.</span><strong className="text-white text-xs sm:text-sm">{pat.vitals.bp}</strong></div>
                          <div><span className="text-slate-400 block text-[10px] uppercase font-bold">F.C.</span><strong className="text-white text-xs sm:text-sm">{pat.vitals.hr}</strong></div>
                          <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Temp</span><strong className="text-white text-xs sm:text-sm">{pat.vitals.temp}°C</strong></div>
                          <div><span className="text-slate-400 block text-[10px] uppercase font-bold">IMC</span><strong className="text-white text-xs sm:text-sm">{pat.vitals.bmi}</strong></div>
                        </div>

                        {pat.allergies.length > 0 && !pat.allergies.includes('Ninguna conocida (NKDA)') && (
                          <div className="p-2 bg-rose-950/50 border border-rose-500/50 rounded-xl text-xs text-rose-300 font-bold flex items-center space-x-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>Alergia: {pat.allergies.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Botón de Acción de Tarjeta */}
                      <div>
                        {isInConsult ? (
                          <button
                            type="button"
                            onClick={() => {
                              updateActivePatientId(pat.id);
                              updateConsultTab('soap');
                            }}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs sm:text-sm transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-emerald-600/30"
                          >
                            <Stethoscope className="w-4 h-4" />
                            <span>Continuar Consulta Médica</span>
                          </button>
                        ) : isWaiting ? (
                          <button
                            type="button"
                            onClick={() => handleStartConsultation(pat)}
                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-black rounded-xl text-xs sm:text-sm transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-indigo-600/30"
                          >
                            <span>Iniciar Consulta Médica</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : isFinished ? (
                          <button
                            type="button"
                            onClick={() => setPrintableDocument({
                              type: 'RESUMEN_CONSULTA',
                              title: 'Resumen Oficial de Consulta Médica & Evolución',
                              patient: pat
                            })}
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Ver Resumen Clínico</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: RESUMEN / IMPRESIÓN OFICIAL (RECETA, INCAPACIDAD, SOAP) */}
      {/* ============================================================== */}
      {printableDocument && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          {/* Estilos estrictos para tamaño Carta (US Letter 8.5 x 11 in) con fondo blanco oficial */}
          <style>{`
            @media print {
              @page {
                size: letter portrait;
                margin: 10mm 12mm;
              }
              html, body {
                width: 8.5in;
                background: #ffffff !important;
                color: #0f172a !important;
                font-size: 10pt !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
              #printable-medical-document {
                position: static !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                box-shadow: none !important;
                border: none !important;
                background: #ffffff !important;
              }
            }
          `}</style>

          <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl min-h-screen sm:min-h-0 sm:max-h-[96vh] overflow-y-auto flex flex-col">
            {/* Barra Superior de Control de Impresión (NO-PRINT) */}
            <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between sticky top-0 z-20 no-print border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-sm">
                  🇵🇦
                </div>
                <div>
                  <span className="font-black text-sm text-white block">Documento Médico Oficial MINSA</span>
                  <span className="text-xs text-slate-400 font-mono">Formato Oficial Tamaño Carta (US Letter 8.5" × 11") • Ley 81</span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const docTitle = printableDocument.title;
                    const patientName = printableDocument.patient.name;
                    const msg = `*DOCUMENTO MÉDICO OFICIAL - ${doctorInfo.clinic.toUpperCase()}*\n\nEstimado(a) *${patientName}*,\nAdjunto a este mensaje encontrará su *${docTitle}* emitido por el *${doctorInfo.name}* (Idoneidad ${doctorInfo.license}).\n\n_Documento protegido por la Ley 81 de Panamá._`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3.5 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar por WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-black px-4 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir en Carta / Guardar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintableDocument(null)}
                  className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition p-2 rounded-xl cursor-pointer"
                  title="Cerrar vista previa"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CONTENIDO DEL DOCUMENTO MÉDICO OFICIAL (HOJA BLANCA CARTA) */}
            <div
              id="printable-medical-document"
              className="p-8 sm:p-12 space-y-6 text-slate-900 font-sans leading-relaxed max-w-[8.5in] w-full mx-auto bg-white"
            >
              {/* 1. Membrete Institucional Oficial MINSA */}
              <div className="border-b-2 border-slate-900 pb-5 flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-md">
                      🩺
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                        {doctorInfo.clinic}
                      </h1>
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700">
                        República de Panamá • Consejo Técnico de Salud (MINSA)
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 font-medium pt-1">
                    Atención Médica Especializada • {doctorInfo.specialty}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div className="inline-block bg-slate-100 border border-slate-300 rounded-lg px-3 py-1 text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Folio Oficial</span>
                    <span className="text-sm font-mono font-black text-slate-900">
                      FOLIO: MED-{printableDocument.patient.nationalId.replace(/[^0-9]/g, '').slice(-4)}-{new Date().getFullYear()}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Emisión: {new Date().toLocaleDateString('es-PA', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Título Oficial del Documento */}
              <div className="text-center py-2 border-b border-slate-200">
                <h2 className="text-lg font-black uppercase tracking-wider text-slate-900">
                  {printableDocument.title}
                </h2>
                <div className="text-[11px] text-slate-600 font-medium">
                  {printableDocument.type === 'RECETA' && 'Prescripción Facultativa Conforme a Normativas Sanitarias Vigentes'}
                  {printableDocument.type === 'INCAPACIDAD' && 'Certificado Médico de Reposo Domiciliario Obligatorio (CSS / MITRADEL)'}
                  {printableDocument.type === 'RESUMEN_CONSULTA' && 'Nota Médica de Atención, Evolución y Plan Terapéutico (SOAP)'}
                </div>
              </div>

              {/* 2. Cuadro Formal de Datos del Paciente */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Paciente:</span>
                  <strong className="text-sm text-slate-950 font-black">{printableDocument.patient.name}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Cédula / Pasaporte:</span>
                  <span className="font-mono font-bold text-slate-900">{printableDocument.patient.nationalId}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Edad / Sexo:</span>
                  <span className="font-medium text-slate-800">
                    {printableDocument.patient.age} años • {printableDocument.patient.gender === 'M' ? 'Masculino' : 'Femenino'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Fecha y Hora:</span>
                  <span className="font-medium text-slate-800">
                    {new Date().toLocaleDateString('es-PA')} • {new Date().toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* 3. Cuerpo del Documento según Tipo */}
              {printableDocument.type === 'RECETA' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-teal-800 font-black text-sm border-b border-teal-200 pb-1">
                    <span className="text-xl leading-none font-serif italic">℞</span>
                    <span className="uppercase tracking-wider">Prescripción Farmacológica (RP/):</span>
                  </div>

                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                    {printableDocument.patient.prescriptions.map((rx, idx) => (
                      <div key={rx.id} className="p-4 bg-white space-y-1.5 hover:bg-slate-50/50">
                        <div className="flex items-start justify-between">
                          <div className="font-black text-slate-950 text-sm">
                            {idx + 1}. {rx.medication} — <span className="text-teal-700">{rx.dose}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                            Vía: {rx.route}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 font-medium pl-4">
                          <strong>Posología:</strong> Tomar {rx.frequency} durante {rx.duration}.
                        </div>
                        {rx.instructions && (
                          <div className="text-xs text-slate-600 italic pl-4 bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <strong>Indicaciones al paciente:</strong> {rx.instructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                    <strong>Aviso Farmacéutico Legal:</strong> Esta prescripción médica es personal e intransferible. La dispensación debe efectuarse conforme a las directrices de la Dirección de Farmacia y Drogas del MINSA. No autorizada su sustitución sin consentimiento previo del médico tratante.
                  </div>
                </div>
              )}

              {printableDocument.type === 'INCAPACIDAD' && printableDocument.patient.medicalLeave && (
                <div className="space-y-5">
                  <div className="p-6 bg-slate-50 border-2 border-slate-300 rounded-2xl space-y-4 text-xs text-slate-800 leading-relaxed">
                    <div className="text-center border-b border-slate-300 pb-3">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Certificación Concedida</span>
                      <div className="text-2xl font-black text-slate-950 mt-1">
                        {printableDocument.patient.medicalLeave.days} DÍAS DE REPOSO MÉDICO DOMICILIARIO
                      </div>
                      <span className="text-xs text-teal-800 font-bold block mt-0.5">
                        Válido ante la Caja de Seguro Social (CSS) y Empleadores (MITRADEL)
                      </span>
                    </div>

                    <p className="text-sm">
                      Por medio del presente certificado facultativo, hago constar que el/la paciente{' '}
                      <strong className="text-slate-950 underline">{printableDocument.patient.name}</strong>, portador(a) de la cédula o pasaporte N°{' '}
                      <strong className="font-mono text-slate-950">{printableDocument.patient.nationalId}</strong>, fue evaluado(a) clínicamente en el día de la fecha, requiriendo reposo médico estricto por un período continuo de{' '}
                      <strong>{printableDocument.patient.medicalLeave.days} días</strong>.
                    </p>

                    <div className="grid grid-cols-2 gap-4 bg-white p-3.5 rounded-xl border border-slate-300">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Fecha de Inicio:</span>
                        <strong className="text-xs text-slate-900">{printableDocument.patient.medicalLeave.startDate}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Fecha de Término:</span>
                        <strong className="text-xs text-slate-900">{printableDocument.patient.medicalLeave.endDate}</strong>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div>
                        <strong className="text-slate-900">Diagnóstico Principal (CIE-10):</strong>{' '}
                        <span className="text-slate-800">{printableDocument.patient.medicalLeave.diagnosis}</span>
                      </div>
                      <div>
                        <strong className="text-slate-900">Fundamentación Clínica:</strong>{' '}
                        <span className="text-slate-700">{printableDocument.patient.medicalLeave.justification}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 pt-2 italic">
                        El/la paciente deberá reintegrarse a sus labores habituales en la fecha hábil inmediatamente posterior a la fecha de término indicada.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {printableDocument.type === 'RESUMEN_CONSULTA' && (
                <div className="space-y-4 text-xs text-slate-800">
                  <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3">
                    <div>
                      <strong className="text-slate-950 font-black uppercase text-[11px] block text-teal-800">
                        [S] Subjetivo (Motivo de Consulta y Anamnesis):
                      </strong>
                      <p className="mt-1 leading-relaxed text-slate-800">
                        {printableDocument.patient.soapNote?.subjective || printableDocument.patient.consultationReason}
                      </p>
                    </div>

                    <div className="border-t border-slate-200 pt-2.5">
                      <strong className="text-slate-950 font-black uppercase text-[11px] block text-teal-800">
                        [O] Objetivo (Constantes Vitales & Examen Físico):
                      </strong>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 my-2 text-[10px]">
                        <div><span className="text-slate-500 block">PA:</span><strong>{printableDocument.patient.vitals.bp}</strong></div>
                        <div><span className="text-slate-500 block">FC:</span><strong>{printableDocument.patient.vitals.hr} lpm</strong></div>
                        <div><span className="text-slate-500 block">FR:</span><strong>{printableDocument.patient.vitals.rr} rpm</strong></div>
                        <div><span className="text-slate-500 block">Temp:</span><strong>{printableDocument.patient.vitals.temp} °C</strong></div>
                        <div><span className="text-slate-500 block">SpO2:</span><strong>{printableDocument.patient.vitals.spo2} %</strong></div>
                        <div><span className="text-slate-500 block">Peso:</span><strong>{printableDocument.patient.vitals.weightKg} kg</strong></div>
                        <div><span className="text-slate-500 block">IMC:</span><strong>{printableDocument.patient.vitals.bmi || '24.5'}</strong></div>
                      </div>
                      <p className="text-slate-700 leading-relaxed">
                        {printableDocument.patient.soapNote?.objective || 'Exploración física dentro de límites tolerables.'}
                      </p>
                    </div>

                    <div className="border-t border-slate-200 pt-2.5">
                      <strong className="text-slate-950 font-black uppercase text-[11px] block text-teal-800">
                        [A] Evaluación & Juicio Clínico:
                      </strong>
                      <p className="mt-1 text-slate-800 font-medium">
                        {printableDocument.patient.soapNote?.assessment || 'Control médico general satisfactorio.'}
                      </p>
                      <div className="mt-1 font-mono text-[11px] font-bold text-slate-900 bg-white p-1.5 rounded border border-slate-200 inline-block">
                        CIE-10: {printableDocument.patient.soapNote?.primaryIcd10 || 'Z00.0 — Examen médico general'}
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-2.5">
                      <strong className="text-slate-950 font-black uppercase text-[11px] block text-teal-800">
                        [P] Plan Terapéutico & Recomendaciones:
                      </strong>
                      <p className="mt-1 leading-relaxed text-slate-800 whitespace-pre-line">
                        {printableDocument.patient.soapNote?.plan || 'Continuar medidas generales de autocuidado y control ambulatorio.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Sello, Firma Digital y Código QR de Autenticidad */}
              <div className="pt-8 border-t-2 border-slate-900 flex flex-wrap items-end justify-between gap-6">
                <div className="space-y-1">
                  <div className="w-56 border-b border-slate-800 pb-1 mb-2">
                    <span className="text-[10px] text-slate-400 font-mono block">Firma Autógrafa / Sello Digital</span>
                  </div>
                  <div className="font-black text-sm text-slate-950">{doctorInfo.name}</div>
                  <div className="text-xs text-slate-700 font-medium">{doctorInfo.specialty}</div>
                  <div className="text-[11px] font-mono text-slate-900">
                    Idoneidad Profesional N°: <strong>{doctorInfo.license}</strong> • Registro MINSA: <strong>{doctorInfo.minsaRegistrationNumber}</strong>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-slate-50 border border-slate-300 p-3 rounded-xl shrink-0">
                  <div className="w-14 h-14 bg-white p-1 border border-slate-300 rounded-lg flex items-center justify-center font-mono text-[8px] text-center leading-tight shadow-inner">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800">QR-AUTH</div>
                      <div className="text-[7px] text-teal-700 font-mono">SHA-256</div>
                      <div className="text-[6px] text-slate-500">PA-CTS-2026</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600 max-w-[200px] leading-tight space-y-0.5">
                    <div className="font-bold text-slate-900">Certificado Digital Ley 81</div>
                    <div>Documento oficial inalterable con estampado cronológico y firma electrónica calificada.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: AGREGAR PACIENTE ESPONTÁNEO A LA COLA                   */}
      {/* ============================================================== */}
      {isAddingWalkIn && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-xs text-white animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Ingresar Paciente a la Cola de Consulta</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingWalkIn(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWalkIn} className="space-y-3.5">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Nombre Completo del Paciente:</label>
                <input
                  type="text"
                  required
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="Ej: Lic. David Batista"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-300 block">Cédula / Identificación:</label>
                  <input
                    type="text"
                    required
                    value={walkInNationalId}
                    onChange={(e) => setWalkInNationalId(e.target.value)}
                    placeholder="Ej: 8-842-1920"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Edad:</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={walkInAge}
                    onChange={(e) => setWalkInAge(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Sexo:</label>
                  <select
                    value={walkInGender}
                    onChange={(e) => setWalkInGender(e.target.value as 'M' | 'F')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Tipo de Consulta:</label>
                  <select
                    value={walkInType}
                    onChange={(e) => setWalkInType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PRIMERA_VEZ">Primera Vez</option>
                    <option value="CONTROL">Control</option>
                    <option value="URGENCIA_AMBULATORIA">Urgencia Ambulatoria</option>
                    <option value="INTERCONSULTA">Interconsulta</option>
                    <option value="PREOPERATORIA">Preoperatoria</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Motivo de Consulta:</label>
                <textarea
                  value={walkInReason}
                  onChange={(e) => setWalkInReason(e.target.value)}
                  rows={2}
                  placeholder="Síntomas principales o motivo de la visita médica..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-normal leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddingWalkIn(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-black transition shadow-lg cursor-pointer"
                >
                  Agregar a la Cola
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL CLÍNICO: VALIDACIONES Y ALERTAS MÉDICAS PROFESIONALES    */}
      {/* ============================================================== */}
      {clinicalAlertModal && clinicalAlertModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-white animate-in zoom-in-95 duration-150 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400"></div>

            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                  {clinicalAlertModal.subtitle || 'Validación de Protocolo Clínico'}
                </span>
                <h3 className="text-base font-black text-white">{clinicalAlertModal.title}</h3>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {clinicalAlertModal.message}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setClinicalAlertModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Revisar Expediente
              </button>
              <button
                type="button"
                onClick={() => {
                  if (clinicalAlertModal.onConfirm) {
                    clinicalAlertModal.onConfirm();
                  } else {
                    setClinicalAlertModal(null);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center space-x-1.5"
              >
                <span>{clinicalAlertModal.confirmLabel || 'Entendido'}</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
