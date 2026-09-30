import React, { useState } from 'react';
import {
  Droplets,
  Heart,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Plus,
  Search,
  Filter,
  FileCheck2,
  Calendar,
  Sparkles,
  User,
  FlaskConical,
  TestTube,
  Clock,
  ArrowRight,
  ShieldAlert,
  Thermometer,
  QrCode,
  FileText,
  Send,
  Lock,
  Printer,
  ChevronRight,
  Check
} from 'lucide-react';
import { TransfusionCase, TransfusionStage } from '../../../types';

export const STAGES_LIST: { id: TransfusionStage; label: string; short: string; icon: any; color: string }[] = [
  { id: 'SOLICITUD', label: '1. Solicitud', short: 'Solicitud', icon: FileText, color: 'text-indigo-400' },
  { id: 'EVALUACION', label: '2. Evaluación', short: 'Evaluación', icon: FlaskConical, color: 'text-cyan-400' },
  { id: 'COMPATIBILIDAD', label: '3. Compatibilidad', short: 'Compatibilidad', icon: TestTube, color: 'text-blue-400' },
  { id: 'RESERVA', label: '4. Reserva', short: 'Reserva', icon: Lock, color: 'text-amber-400' },
  { id: 'ENTREGA', label: '5. Entrega', short: 'Entrega', icon: Send, color: 'text-orange-400' },
  { id: 'TRANSFUSION', label: '6. Transfusión', short: 'Transfusión', icon: Droplets, color: 'text-rose-400' },
  { id: 'SEGUIMIENTO', label: '7. Seguimiento', short: 'Seguimiento', icon: Activity, color: 'text-teal-400' },
  { id: 'REACCION', label: '8. Reacción', short: 'Reacción', icon: AlertTriangle, color: 'text-purple-400' },
  { id: 'CIERRE', label: '9. Cierre', short: 'Cierre', icon: ShieldCheck, color: 'text-emerald-400' }
];

export const INITIAL_TRANSFUSION_CASES: TransfusionCase[] = [
  {
    id: 'trx-101',
    caseNumber: 'TRX-2026-0089',
    patientId: 'pat-1',
    patientName: 'Fernando Ábrego',
    patientNationalId: '8-745-1922',
    patientAge: 48,
    patientGender: 'M',
    ward: 'SALA_3_HOSPITALIZACION',
    bedNumber: '12',
    prescribingDoctor: 'Dr. Alejandro Icaza',
    doctorLicense: 'MP-6612-PA',
    clinicalIndication: 'Hemorragia digestiva alta variceal sintomática con Hb 6.4 g/dL y taquicardia sostenida.',
    componentRequested: 'CONCENTRADO_HEMATIES',
    unitsRequested: 2,
    urgencyLevel: 'URGENTE',
    requestedAt: '2026-08-14 07:45 AM',

    // Evaluación
    aboGroup: 'O',
    rhFactor: 'POS',
    aboConfirmation: 'CORRECTA',
    irregularAntibodiesScreening: 'NEGATIVO',
    identifiedAntibodies: [],
    immunohematologist: 'Lic. Sofía Guardia (TM)',
    evaluatedAt: '2026-08-14 08:10 AM',

    // Compatibilidad
    assignedUnitCode: 'PGRE-2026-0812',
    assignedUnitGroup: 'O+',
    crossmatchMajor: 'COMPATIBLE',
    crossmatchMinor: 'COMPATIBLE',
    crossmatchMethod: 'GEL',
    coombsIndirect: 'NEGATIVO',
    crossmatchAt: '2026-08-14 08:35 AM',

    // Reserva
    reservedUnitId: 'PGRE-2026-0812',
    reservationExpiresAt: '2026-08-17 08:35 AM',
    fridgeLocation: 'Heladera de Reserva A-2 (4°C)',
    reservedAt: '2026-08-14 08:40 AM',

    // Entrega
    visualInspection: 'CONFORME_SIN_COAGULOS',
    transportTempOk: true,
    dispatchedToStaff: 'Enf. Patricia Lasso (Pabellón 3)',
    dispatchedAt: '2026-08-14 09:00 AM',

    // Transfusión
    bedsideDoubleCheckOk: true,
    transfusionFilterUsed: true,
    nurseAdmin: 'Enf. Patricia Lasso',
    nurseWitness: 'Enf. Carlos Herrera',
    transfusionStartedAt: '2026-08-14 09:15 AM',
    transfusionEndedAt: '2026-08-14 11:30 AM',
    vitalsBaseline: { bp: '100/60', hr: 98, temp: 36.6, spo2: 96 },
    vitals15Min: { bp: '105/65', hr: 92, temp: 36.7, spo2: 97 },
    vitals60Min: { bp: '115/70', hr: 84, temp: 36.6, spo2: 98 },
    vitalsFinal: { bp: '120/75', hr: 78, temp: 36.6, spo2: 99 },

    // Seguimiento
    postHbHctYield: 'Incremento esperado de Hb estimado en +1.2 g/dL (Control en 6h).',
    patientCondition: 'ESTABLE_SATISFACTORIA',
    evaluatedOutcomeAt: '2026-08-14 12:00 PM',

    // Reacción
    hasAdverseReaction: false,
    reactionType: 'NINGUNA',

    // Cierre
    finalStatus: 'COMPLETADA_EXITOSA',
    closedAt: '2026-08-14 12:30 PM',
    closingNotes: 'Transfusión concluida al 100% sin eventos adversos ni signos de hemólisis aguda. Estabilidad hemodinámica recuperada.',
    currentStage: 'CIERRE'
  },
  {
    id: 'trx-102',
    caseNumber: 'TRX-2026-0090',
    patientId: 'pat-2',
    patientName: 'Carmen Villalaz',
    patientNationalId: '4-128-984',
    patientAge: 62,
    patientGender: 'F',
    ward: 'URGENCIAS_SHOCK_ROOM',
    bedNumber: '02',
    prescribingDoctor: 'Dr. Roberto Icaza',
    doctorLicense: 'MED-10492-PA',
    clinicalIndication: 'Politraumatismo severo por accidente de tránsito con fractura pélvica inestable y anemia aguda severa.',
    componentRequested: 'CONCENTRADO_HEMATIES',
    unitsRequested: 3,
    urgencyLevel: 'EXTREMA_URGENCIA',
    requestedAt: '2026-08-14 11:15 AM',

    // Evaluación
    aboGroup: 'A',
    rhFactor: 'POS',
    aboConfirmation: 'CORRECTA',
    irregularAntibodiesScreening: 'NEGATIVO',
    identifiedAntibodies: [],
    immunohematologist: 'Licda. Laura Samaniego (TM)',
    evaluatedAt: '2026-08-14 11:28 AM',

    // Compatibilidad en proceso
    assignedUnitCode: 'PGRE-2026-0901',
    assignedUnitGroup: 'A+',
    crossmatchMajor: 'COMPATIBLE',
    crossmatchMinor: 'COMPATIBLE',
    crossmatchMethod: 'GEL',
    coombsIndirect: 'NEGATIVO',
    crossmatchAt: '2026-08-14 11:45 AM',

    // Reserva
    reservedUnitId: 'PGRE-2026-0901',
    reservationExpiresAt: '2026-08-17 11:45 AM',
    fridgeLocation: 'Heladera de Reserva A-1 (4°C)',
    reservedAt: '2026-08-14 11:50 AM',

    hasAdverseReaction: false,
    finalStatus: 'EN_PROCESO',
    currentStage: 'RESERVA'
  },
  {
    id: 'trx-103',
    caseNumber: 'TRX-2026-0091',
    patientId: 'pat-3',
    patientName: 'David Alejandro Castillo',
    patientNationalId: '3-705-1144',
    patientAge: 35,
    patientGender: 'M',
    ward: 'HEMATO_ONCOLOGIA',
    bedNumber: '08',
    prescribingDoctor: 'Dra. Vanessa Carrizo',
    doctorLicense: 'HEM-3321-PA',
    clinicalIndication: 'Trombocitopenia refractaria post-quimioterapia con plaquetas < 12,000/uL y petequias activas.',
    componentRequested: 'PLAQUETAS',
    unitsRequested: 1,
    urgencyLevel: 'URGENTE',
    requestedAt: '2026-08-14 09:30 AM',

    aboGroup: 'B',
    rhFactor: 'POS',
    aboConfirmation: 'CORRECTA',
    irregularAntibodiesScreening: 'NEGATIVO',
    identifiedAntibodies: [],
    immunohematologist: 'Lic. Sofía Guardia (TM)',
    evaluatedAt: '2026-08-14 09:55 AM',

    assignedUnitCode: 'PLA-2026-0419',
    assignedUnitGroup: 'B+',
    crossmatchMajor: 'COMPATIBLE',
    crossmatchMinor: 'COMPATIBLE',
    crossmatchMethod: 'GEL',
    coombsIndirect: 'NEGATIVO',
    crossmatchAt: '2026-08-14 10:15 AM',

    reservedUnitId: 'PLA-2026-0419',
    reservationExpiresAt: '2026-08-16 10:15 AM',
    fridgeLocation: 'Agitador e Incubadora de Plaquetas (22°C)',
    reservedAt: '2026-08-14 10:20 AM',

    visualInspection: 'CONFORME_SIN_COAGULOS',
    transportTempOk: true,
    dispatchedToStaff: 'Enf. Mario Batista',
    dispatchedAt: '2026-08-14 10:40 AM',

    bedsideDoubleCheckOk: true,
    transfusionFilterUsed: true,
    nurseAdmin: 'Enf. Mario Batista',
    nurseWitness: 'Enf. Laura Gómez',
    transfusionStartedAt: '2026-08-14 10:50 AM',
    transfusionEndedAt: '2026-08-14 11:40 AM',
    vitalsBaseline: { bp: '110/70', hr: 80, temp: 36.8, spo2: 98 },
    vitals15Min: { bp: '112/72', hr: 82, temp: 37.0, spo2: 98 },
    vitals60Min: { bp: '115/75', hr: 78, temp: 36.9, spo2: 98 },
    vitalsFinal: { bp: '115/70', hr: 76, temp: 36.8, spo2: 99 },

    postHbHctYield: 'Rendimiento plaquetario estimado: incremento de +35,000/uL.',
    patientCondition: 'ESTABLE_SATISFACTORIA',
    evaluatedOutcomeAt: '2026-08-14 12:00 PM',

    hasAdverseReaction: false,
    finalStatus: 'EN_PROCESO',
    currentStage: 'SEGUIMIENTO'
  },
  {
    id: 'trx-104',
    caseNumber: 'TRX-2026-0092',
    patientId: 'pat-4',
    patientName: 'Mariana Elena Gómez',
    patientNationalId: '8-812-9901',
    patientAge: 28,
    patientGender: 'F',
    ward: 'CIRUGIA_GENERAL',
    bedNumber: '05',
    prescribingDoctor: 'Dr. Alejandro Icaza',
    doctorLicense: 'MP-6612-PA',
    clinicalIndication: 'Anemia post-quirúrgica tras hemicolectomía derecha (Hb 6.8 g/dL).',
    componentRequested: 'CONCENTRADO_HEMATIES',
    unitsRequested: 1,
    urgencyLevel: 'URGENTE',
    requestedAt: '2026-08-14 06:15 AM',

    aboGroup: 'O',
    rhFactor: 'POS',
    aboConfirmation: 'CORRECTA',
    irregularAntibodiesScreening: 'NEGATIVO',
    identifiedAntibodies: [],
    immunohematologist: 'Lic. Sofía Guardia (TM)',
    evaluatedAt: '2026-08-14 06:45 AM',

    assignedUnitCode: 'PGRE-2026-0771',
    assignedUnitGroup: 'O+',
    crossmatchMajor: 'COMPATIBLE',
    crossmatchMinor: 'COMPATIBLE',
    crossmatchMethod: 'GEL',
    coombsIndirect: 'NEGATIVO',
    crossmatchAt: '2026-08-14 07:10 AM',

    reservedUnitId: 'PGRE-2026-0771',
    reservationExpiresAt: '2026-08-17 07:10 AM',
    fridgeLocation: 'Heladera de Reserva A-2 (4°C)',
    reservedAt: '2026-08-14 07:15 AM',

    visualInspection: 'CONFORME_SIN_COAGULOS',
    transportTempOk: true,
    dispatchedToStaff: 'Enf. Diana Quiroz',
    dispatchedAt: '2026-08-14 07:30 AM',

    bedsideDoubleCheckOk: true,
    transfusionFilterUsed: true,
    nurseAdmin: 'Enf. Diana Quiroz',
    nurseWitness: 'Enf. Juan Méndez',
    transfusionStartedAt: '2026-08-14 07:40 AM',
    transfusionEndedAt: '2026-08-14 08:15 AM',
    vitalsBaseline: { bp: '118/76', hr: 78, temp: 36.5, spo2: 98 },
    vitals15Min: { bp: '125/80', hr: 96, temp: 37.9, spo2: 97 },
    vitals60Min: { bp: '130/85', hr: 104, temp: 38.6, spo2: 96 },
    vitalsFinal: { bp: '120/80', hr: 90, temp: 37.5, spo2: 97 },

    postHbHctYield: 'Interrumpida a los 35 minutos debido a pico febril de 38.6°C y temblores.',
    patientCondition: 'COMPLICADA',
    evaluatedOutcomeAt: '2026-08-14 08:30 AM',

    hasAdverseReaction: true,
    reactionType: 'FEBRIL_NO_HEMOLITICA',
    reactionSymptoms: 'Fiebre de 38.6°C (+2.1°C sobre basal), escalofríos y taquicardia a los 35 min de goteo.',
    reactionSeverity: 'MODERADA',
    investigationSamplesTaken: true,
    investigationFindings: 'Coombs Directo post-transfusional: Negativo. Hemoglobina libre en suero/orina: Ausente. Cultivo de unidad: Estéril. Conclusión: Reacción Febril No Hemolítica por anticuerpos antileucocitarios.',
    hemovigilanceReported: true,

    finalStatus: 'INTERRUMPIDA_REACCION',
    closedAt: '2026-08-14 10:00 AM',
    closingNotes: 'Infusión detenida de inmediato. Tratada con antipiréticos con remisión completa del cuadro. Notificación oficial enviada al Programa Nacional de Hemovigilancia MINSA.',
    currentStage: 'CIERRE'
  },
  {
    id: 'trx-105',
    caseNumber: 'TRX-2026-0095',
    patientId: 'pat-002',
    patientName: 'Ricardo Arosemena Boyd',
    patientNationalId: '8-745-1290',
    patientAge: 54,
    patientGender: 'M',
    ward: 'URGENCIAS',
    bedNumber: 'URG-01',
    prescribingDoctor: 'Dr. Alejandro Icaza',
    doctorLicense: 'MP-6612-PA',
    clinicalIndication: 'Shock cardiogénico e isquemia aguda con hematocrito limítrofe en evaluación para angioplastia primaria.',
    componentRequested: 'CONCENTRADO_HEMATIES',
    unitsRequested: 2,
    urgencyLevel: 'URGENTE',
    requestedAt: '2026-09-07 18:45 PM',

    aboGroup: 'O',
    rhFactor: 'POS',
    aboConfirmation: 'CORRECTA',
    irregularAntibodiesScreening: 'NEGATIVO',
    identifiedAntibodies: [],
    immunohematologist: 'Lic. Sofía Guardia (TM)',
    evaluatedAt: '2026-09-07 19:10 PM',

    assignedUnitCode: 'PGRE-2026-1120',
    assignedUnitGroup: 'O+',
    crossmatchMajor: 'COMPATIBLE',
    crossmatchMinor: 'COMPATIBLE',
    crossmatchMethod: 'GEL',
    coombsIndirect: 'NEGATIVO',
    crossmatchAt: '2026-09-07 19:30 PM',

    reservedUnitId: 'PGRE-2026-1120',
    reservationExpiresAt: '2026-09-10 19:30 PM',
    fridgeLocation: 'Heladera de Reserva Urgencias Box Trauma (4°C)',
    reservedAt: '2026-09-07 19:35 PM',

    hasAdverseReaction: false,
    finalStatus: 'EN_PROCESO',
    currentStage: 'RESERVA'
  },
  {
    id: 'trx-106',
    caseNumber: 'TRX-2026-0096',
    patientId: 'pat-001',
    patientName: 'Gabriela Pinzón Varela',
    patientNationalId: '8-812-4432',
    patientAge: 34,
    patientGender: 'F',
    ward: 'HOSPITALIZACION',
    bedNumber: 'HOSP-201A',
    prescribingDoctor: 'Dra. Patricia Boyd',
    doctorLicense: 'MP-7401-PA',
    clinicalIndication: 'Pielonefritis aguda complicada con sepsis urológica y caída de Hb a 7.1 g/dL.',
    componentRequested: 'CONCENTRADO_HEMATIES',
    unitsRequested: 1,
    urgencyLevel: 'URGENTE',
    requestedAt: '2026-09-06 14:00 PM',

    aboGroup: 'A',
    rhFactor: 'POS',
    aboConfirmation: 'CORRECTA',
    irregularAntibodiesScreening: 'NEGATIVO',
    identifiedAntibodies: [],
    immunohematologist: 'Lic. Sofía Guardia (TM)',
    evaluatedAt: '2026-09-06 14:30 PM',

    assignedUnitCode: 'PGRE-2026-0815',
    assignedUnitGroup: 'A+',
    crossmatchMajor: 'COMPATIBLE',
    crossmatchMinor: 'COMPATIBLE',
    crossmatchMethod: 'GEL',
    coombsIndirect: 'NEGATIVO',
    crossmatchAt: '2026-09-06 15:00 PM',

    reservedUnitId: 'PGRE-2026-0815',
    reservationExpiresAt: '2026-09-09 15:00 PM',
    fridgeLocation: 'Heladera Reserva A-2 (4°C)',
    reservedAt: '2026-09-06 15:10 PM',

    visualInspection: 'CONFORME_SIN_COAGULOS',
    transportTempOk: true,
    dispatchedToStaff: 'Enf. Patricia Lasso',
    dispatchedAt: '2026-09-06 15:30 PM',

    bedsideDoubleCheckOk: true,
    transfusionFilterUsed: true,
    nurseAdmin: 'Enf. Patricia Lasso',
    nurseWitness: 'Enf. Carlos Herrera',
    transfusionStartedAt: '2026-09-06 15:45 PM',
    transfusionEndedAt: '2026-09-06 18:00 PM',
    vitalsBaseline: { bp: '110/70', hr: 84, temp: 36.8, spo2: 98 },
    vitals15Min: { bp: '112/72', hr: 82, temp: 36.9, spo2: 98 },
    vitals60Min: { bp: '115/75', hr: 80, temp: 36.8, spo2: 98 },
    vitalsFinal: { bp: '118/74', hr: 76, temp: 36.7, spo2: 99 },

    postHbHctYield: 'Incremento terapéutico de Hb post-transfusional verificado: +1.1 g/dL (Hb control 8.2 g/dL).',
    patientCondition: 'ESTABLE_SATISFACTORIA',
    evaluatedOutcomeAt: '2026-09-06 19:00 PM',

    hasAdverseReaction: false,
    finalStatus: 'COMPLETADA_EXITOSA',
    closedAt: '2026-09-06 19:30 PM',
    closingNotes: 'Transfusión de 1 U PGRE A+ finalizada con éxito sin complicaciones. Tolerancia excelente.',
    currentStage: 'CIERRE'
  }
];

export const TransfusionEvolutionManager: React.FC = () => {
  const [cases, setCases] = useState<TransfusionCase[]>(INITIAL_TRANSFUSION_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(INITIAL_TRANSFUSION_CASES[0].id);
  const [activeStageTab, setActiveStageTab] = useState<TransfusionStage>('SOLICITUD');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);

  // Form state for new requisition
  const [newPatientName, setNewPatientName] = useState('Rubén Ábrego');
  const [newNationalId, setNewNationalId] = useState('8-892-1209');
  const [newAge, setNewAge] = useState(38);
  const [newGender, setNewGender] = useState<'M' | 'F'>('M');
  const [newWard, setNewWard] = useState('CIRUGIA_GENERAL');
  const [newBed, setNewBed] = useState('04');
  const [newDoctor, setNewDoctor] = useState('Dr. Roberto Icaza');
  const [newDoctorLicense, setNewDoctorLicense] = useState('MED-10492-PA');
  const [newIndication, setNewIndication] = useState('Anemia preoperatoria para artroplastia total de cadera.');
  const [newComponent, setNewComponent] = useState<'CONCENTRADO_HEMATIES' | 'PLASMA_FRESCO' | 'PLAQUETAS' | 'CRIOPRECIPITADO'>('CONCENTRADO_HEMATIES');
  const [newUnits, setNewUnits] = useState(2);
  const [newUrgency, setNewUrgency] = useState<'EXTREMA_URGENCIA' | 'URGENTE' | 'PROGRAMADA'>('PROGRAMADA');

  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  // Helper to get index of stage
  const getStageIndex = (stage: TransfusionStage) => {
    return STAGES_LIST.findIndex((s) => s.id === stage);
  };

  const handleSelectCase = (c: TransfusionCase) => {
    setSelectedCaseId(c.id);
    setActiveStageTab(c.currentStage);
  };

  const handleAdvanceStage = () => {
    const currentIndex = getStageIndex(activeCase.currentStage);
    if (currentIndex < STAGES_LIST.length - 1) {
      const nextStage = STAGES_LIST[currentIndex + 1].id;
      setCases((prev) =>
        prev.map((c) => {
          if (c.id === activeCase.id) {
            return {
              ...c,
              currentStage: nextStage,
              finalStatus: nextStage === 'CIERRE' ? 'COMPLETADA_EXITOSA' : c.finalStatus
            };
          }
          return c;
        })
      );
      setActiveStageTab(nextStage);
    }
  };

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    const newCase: TransfusionCase = {
      id: `trx-${Date.now()}`,
      caseNumber: `TRX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: `pat-${Date.now()}`,
      patientName: newPatientName,
      patientNationalId: newNationalId,
      patientAge: Number(newAge),
      patientGender: newGender,
      ward: newWard,
      bedNumber: newBed,
      prescribingDoctor: newDoctor,
      doctorLicense: newDoctorLicense,
      clinicalIndication: newIndication,
      componentRequested: newComponent,
      unitsRequested: Number(newUnits),
      urgencyLevel: newUrgency,
      requestedAt: new Date().toLocaleString('es-PA'),
      hasAdverseReaction: false,
      finalStatus: 'EN_PROCESO',
      currentStage: 'SOLICITUD'
    };

    setCases((prev) => [newCase, ...prev]);
    setSelectedCaseId(newCase.id);
    setActiveStageTab('SOLICITUD');
    setIsNewModalOpen(false);
  };

  const filteredCases = cases.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.patientName.toLowerCase().includes(q) ||
      c.patientNationalId.toLowerCase().includes(q) ||
      c.caseNumber.toLowerCase().includes(q) ||
      (c.assignedUnitCode || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-950 border border-rose-500/30 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="text-rose-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Banco de Sangre & Inmunohematología Clínica • Vena a Vena</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Gestión Transfusional / Evolución Transfusional
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-3xl leading-relaxed">
              Ciclo cerrado y trazabilidad clínica estricta de hemocomponentes en 9 etapas obligatorias:
              <strong className="text-white"> Solicitud → Evaluación → Compatibilidad → Reserva → Entrega → Transfusión → Seguimiento → Reacción → Cierre</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="bg-rose-500 hover:bg-rose-400 text-white font-black px-5 py-3 rounded-2xl text-xs transition shadow-xl shadow-rose-500/20 flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nueva Solicitud Transfusional</span>
            </button>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10 text-xs">
          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Casos en Proceso</span>
            <span className="text-2xl font-black font-mono text-white">
              {cases.filter((c) => c.finalStatus === 'EN_PROCESO').length} Casos
            </span>
            <span className="text-[10px] text-teal-400 font-bold block mt-1">Con trazabilidad activa</span>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">En Sala / Transfusión</span>
            <span className="text-2xl font-black font-mono text-rose-400">
              {cases.filter((c) => c.currentStage === 'TRANSFUSION').length} Unidades
            </span>
            <span className="text-[10px] text-rose-300 font-bold block mt-1">Monitorización a pie de cama</span>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Reservas Vigentes</span>
            <span className="text-2xl font-black font-mono text-amber-400">
              {cases.filter((c) => c.currentStage === 'RESERVA').length} Cruzadas
            </span>
            <span className="text-[10px] text-amber-300 font-bold block mt-1">Límite estándar de 72h</span>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Hemovigilancia / Eventos</span>
            <span className="text-2xl font-black font-mono text-purple-400">
              {cases.filter((c) => c.hasAdverseReaction).length} Reportadas
            </span>
            <span className="text-[10px] text-purple-300 font-bold block mt-1">100% investigadas MINSA</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Cases List + Stage Stepper & Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cases Navigator (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-white text-sm flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-rose-400" />
                <span>Casos Transfusionales ({filteredCases.length})</span>
              </h3>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar paciente, cédula o unidad..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Cases Scrollable List */}
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredCases.map((c) => {
                const isSelected = c.id === activeCase.id;
                const stageObj = STAGES_LIST.find((s) => s.id === c.currentStage);

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCase(c)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-rose-500/10 border-rose-500/50 shadow-lg shadow-rose-500/5'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-rose-400">{c.caseNumber}</span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          c.urgencyLevel === 'EXTREMA_URGENCIA'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                            : c.urgencyLevel === 'URGENTE'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {c.urgencyLevel.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-xs">{c.patientName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Céd: {c.patientNationalId} • {c.ward}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/60">
                      <span className="text-slate-300 font-medium">
                        {c.componentRequested === 'CONCENTRADO_HEMATIES'
                          ? 'Hematíes'
                          : c.componentRequested === 'PLASMA_FRESCO'
                          ? 'Plasma'
                          : c.componentRequested === 'PLAQUETAS'
                          ? 'Plaquetas'
                          : 'Crioprecipitado'}{' '}
                        ({c.unitsRequested} U)
                      </span>
                      <span className="font-bold flex items-center space-x-1 text-slate-200">
                        <span>Etapa:</span>
                        <strong className={stageObj?.color}>{stageObj?.short}</strong>
                      </span>
                    </div>

                    {c.hasAdverseReaction && (
                      <div className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md font-bold flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>Reacción: {c.reactionType?.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: 9-Stage Evolution Interactive Stepper & Panels (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Case Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-3">
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    {activeCase.ward} • Cama {activeCase.bedNumber}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Caso: <strong className="text-white">{activeCase.caseNumber}</strong>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {activeCase.patientName} ({activeCase.patientAge} años, {activeCase.patientGender})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Médico Solicitante: <strong className="text-indigo-300">{activeCase.prescribingDoctor}</strong> ({activeCase.doctorLicense})
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
                  {activeCase.componentRequested.replace(/_/g, ' ')} ({activeCase.unitsRequested} U)
                </span>
                <button
                  onClick={handleAdvanceStage}
                  disabled={activeCase.currentStage === 'CIERRE'}
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition shadow-lg shadow-rose-500/20 flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Avanzar Etapa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 9-Stage Visual Pipeline Stepper */}
            <div className="overflow-x-auto pb-2">
              <div className="flex items-center min-w-[700px] justify-between gap-1.5">
                {STAGES_LIST.map((stage, idx) => {
                  const currentIdx = getStageIndex(activeCase.currentStage);
                  const isCompleted = idx < currentIdx;
                  const isCurrent = idx === currentIdx;
                  const isTabActive = activeStageTab === stage.id;
                  const Icon = stage.icon;

                  return (
                    <button
                      key={stage.id}
                      onClick={() => setActiveStageTab(stage.id)}
                      className={`flex-1 p-2 rounded-xl text-left border transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                        isTabActive
                          ? 'bg-rose-500/20 border-rose-500 text-white shadow-md'
                          : isCurrent
                          ? 'bg-slate-800 border-rose-400/50 text-white'
                          : isCompleted
                          ? 'bg-slate-950/80 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Icon className={`w-4 h-4 ${isCurrent ? 'text-rose-400' : 'text-slate-400'}`} />
                        )}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tight text-center leading-tight">
                        {stage.short}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DYNAMIC STAGE CONTENT CONTAINER */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            {/* ETAPA 1: SOLICITUD TRANSFUSIONAL */}
            {activeStageTab === 'SOLICITUD' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-white text-sm">Etapa 1: Solicitud Transfusional & Criterio Clínico</h3>
                  </div>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    Requisición Registrada
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Datos del Paciente</span>
                    <p><strong className="text-white">Nombre:</strong> {activeCase.patientName}</p>
                    <p><strong className="text-white">Cédula:</strong> {activeCase.patientNationalId}</p>
                    <p><strong className="text-white">Ubicación:</strong> {activeCase.ward} • Cama {activeCase.bedNumber}</p>
                    <p><strong className="text-white">Edad / Sexo:</strong> {activeCase.patientAge} años • {activeCase.patientGender === 'M' ? 'Masculino' : 'Femenino'}</p>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Médico Solicitante & Urgencia</span>
                    <p><strong className="text-white">Prescribe:</strong> {activeCase.prescribingDoctor}</p>
                    <p><strong className="text-white">Idoneidad MINSA:</strong> {activeCase.doctorLicense}</p>
                    <p><strong className="text-white">Prioridad:</strong> <span className="text-rose-400 font-bold">{activeCase.urgencyLevel}</span></p>
                    <p><strong className="text-white">Fecha/Hora:</strong> {activeCase.requestedAt}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Indicación Médica & Diagnóstico Transfusional</span>
                  <p className="text-slate-200 leading-relaxed italic">"{activeCase.clinicalIndication}"</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-3 py-1 rounded-xl font-bold">
                      Componente: {activeCase.componentRequested.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-3 py-1 rounded-xl font-bold">
                      Volumen Requerido: {activeCase.unitsRequested} Unidad(es)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 2: EVALUACIÓN & TIPIFICACIÓN */}
            {activeStageTab === 'EVALUACION' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <FlaskConical className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-white text-sm">Etapa 2: Evaluación Inmunohematológica & Tipificación</h3>
                  </div>
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    Prueba Globular & Sérica
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Grupo ABO Directo / Inverso</span>
                    <span className="text-3xl font-black text-rose-500">{activeCase.aboGroup || 'O'}</span>
                    <p className="text-[10px] text-teal-400 font-bold">
                      Confirmación: {activeCase.aboConfirmation || 'CORRECTA (Sin discrepancia)'}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Factor Rh(D) & Variante</span>
                    <span className="text-3xl font-black text-white">
                      {activeCase.rhFactor === 'POS' ? 'Positivo (+)' : 'Negativo (-)'}
                    </span>
                    <p className="text-[10px] text-slate-400">Prueba en microcolumna de gel</p>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Pesquisa Anticuerpos (PAI)</span>
                    <span className="text-xl font-black text-teal-400">
                      {activeCase.irregularAntibodiesScreening || 'NEGATIVO'}
                    </span>
                    <p className="text-[10px] text-slate-400">Panel I, II y III (Células selectoras)</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Evaluado por Inmunohematólogo: <strong className="text-white">{activeCase.immunohematologist || 'Lic. Sofía Guardia (TM)'}</strong></span>
                    <span>Fecha: <strong>{activeCase.evaluatedAt || 'Completado'}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 3: COMPATIBILIDAD & CROSSMATCH */}
            {activeStageTab === 'COMPATIBILIDAD' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <TestTube className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-white text-sm">Etapa 3: Compatibilidad & Pruebas Pretransfusionales</h3>
                  </div>
                  <span className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    Prueba Cruzada Mayor y Menor
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Unidad ISBT-128 Asignada</span>
                    <p className="font-mono text-base font-bold text-teal-400">{activeCase.assignedUnitCode || 'PGRE-2026-0812'}</p>
                    <p><strong className="text-white">Grupo de la Unidad:</strong> {activeCase.assignedUnitGroup || 'O Rhesus (+)'}</p>
                    <p><strong className="text-white">Metodología:</strong> Tarjeta de Gel Centrifugada LISS / Coombs</p>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Resultados de Compatibilidad</span>
                    <div className="flex items-center justify-between">
                      <span>Cruce Mayor (Hematíes Donante + Suero Paciente):</span>
                      <strong className="text-emerald-400 font-black">{activeCase.crossmatchMajor || 'COMPATIBLE'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Cruce Menor (Suero Donante + Hematíes Paciente):</span>
                      <strong className="text-emerald-400 font-black">{activeCase.crossmatchMinor || 'COMPATIBLE'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Coombs Indirecto (Fase Antiglobulina):</span>
                      <strong className="text-teal-400 font-black">{activeCase.coombsIndirect || 'NEGATIVO'}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center space-x-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Sin evidencia de aglutinación ni hemólisis en fase salina, albúmina 37°C ni antiglobulina humana. Unidad liberable.</span>
                </div>
              </div>
            )}

            {/* ETAPA 4: RESERVA */}
            {activeStageTab === 'RESERVA' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-white text-sm">Etapa 4: Reserva de Hemocomponente en Heladera</h3>
                  </div>
                  <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    Bloqueo Temporal Exclusivo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Ubicación Física</span>
                    <strong className="text-white text-sm block">{activeCase.fridgeLocation || 'Heladera de Reserva A-2'}</strong>
                    <span className="text-[10px] text-teal-400">Rango de T°: 2°C a 6°C validado</span>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Inicio de Reserva</span>
                    <strong className="text-white text-sm block">{activeCase.reservedAt || '08:40 AM'}</strong>
                    <span className="text-[10px] text-slate-400">Bloqueada para este paciente</span>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Expiración de Reserva</span>
                    <strong className="text-amber-400 text-sm block">{activeCase.reservationExpiresAt || '72 horas'}</strong>
                    <span className="text-[10px] text-amber-300 font-bold">Caduca tras 72h si no es transfundida</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Rótulo de Reserva Transfusional Cruzada</span>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 space-y-1">
                    <p>PACIENTE: {activeCase.patientName} | CÉD: {activeCase.patientNationalId}</p>
                    <p>UNIDAD ISBT-128: {activeCase.assignedUnitCode || 'PGRE-2026-0812'} | GRUPO: {activeCase.assignedUnitGroup || 'O+'}</p>
                    <p>COMPATIBILIDAD: CRUCE MAYOR NEGATIVO (APROBADO)</p>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 5: ENTREGA & DESPACHO */}
            {activeStageTab === 'ENTREGA' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Send className="w-5 h-5 text-orange-400" />
                    <h3 className="font-bold text-white text-sm">Etapa 5: Entrega & Despacho del Banco de Sangre</h3>
                  </div>
                  <span className="text-[10px] bg-orange-500/10 text-orange-300 border border-orange-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    Regla de los 30 Minutos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Inspección Física de Salida</span>
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                      <Check className="w-4 h-4" />
                      <span>Ausencia de coágulos anormales o turbidez</span>
                    </div>
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                      <Check className="w-4 h-4" />
                      <span>Integridad de puertos y sellos de esterilidad</span>
                    </div>
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                      <Check className="w-4 h-4" />
                      <span>Color hemoglobínico normal (sin hemólisis)</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Cadena de Frío & Receptor</span>
                    <p><strong className="text-white">Temperatura de Transporte:</strong> Validada 1°C a 10°C (Nevera térmica)</p>
                    <p><strong className="text-white">Personal que Retira:</strong> {activeCase.dispatchedToStaff || 'Personal Asignado'}</p>
                    <p><strong className="text-white">Hora de Despacho:</strong> {activeCase.dispatchedAt || '09:00 AM'}</p>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center space-x-2 text-xs text-amber-300">
                  <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                  <span><strong>Advertencia Crítica:</strong> La transfusión debe iniciarse antes de transcurridos 30 minutos de la salida de la heladera. De lo contrario, la unidad debe reintegrarse inmediatamente al banco.</span>
                </div>
              </div>
            )}

            {/* ETAPA 6: TRANSFUSIÓN A PIE DE CAMA */}
            {activeStageTab === 'TRANSFUSION' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Droplets className="w-5 h-5 text-rose-400" />
                    <h3 className="font-bold text-white text-sm">Etapa 6: Administración Transfusional a Pie de Cama</h3>
                  </div>
                  <span className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    Doble Verificación eMAR
                  </span>
                </div>

                {/* Double Nurse Verification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Enfermera Administradora</span>
                    <strong className="text-white text-sm block">{activeCase.nurseAdmin || 'Enf. Patricia Lasso'}</strong>
                    <span className="text-[10px] text-teal-400 font-bold">Cotejo de brazalete y boleta OK</span>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Enfermera Testigo (Doble Chequeo)</span>
                    <strong className="text-white text-sm block">{activeCase.nurseWitness || 'Enf. Carlos Herrera'}</strong>
                    <span className="text-[10px] text-teal-400 font-bold">Filtro de 170-260 µm verificado</span>
                  </div>
                </div>

                {/* 4-Phase Vital Signs Protocol */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Protocolo Mandatorio de 4 Fases de Constantes Vitales
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1 text-center">
                      <span className="text-[10px] font-bold text-slate-400 block">1. Basal</span>
                      <p className="font-mono text-white font-bold">{activeCase.vitalsBaseline?.bp || '100/60'}</p>
                      <p className="text-[10px] text-slate-400">{activeCase.vitalsBaseline?.hr || 98} bpm • {activeCase.vitalsBaseline?.temp || 36.6}°C</p>
                      <span className="text-[9px] text-teal-400">Pre-infusión</span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-rose-500/30 space-y-1 text-center">
                      <span className="text-[10px] font-bold text-rose-300 block">2. A los 15 Min</span>
                      <p className="font-mono text-white font-bold">{activeCase.vitals15Min?.bp || '105/65'}</p>
                      <p className="text-[10px] text-slate-400">{activeCase.vitals15Min?.hr || 92} bpm • {activeCase.vitals15Min?.temp || 36.7}°C</p>
                      <span className="text-[9px] text-rose-400 font-bold">Fase Crítica</span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1 text-center">
                      <span className="text-[10px] font-bold text-slate-400 block">3. A los 60 Min</span>
                      <p className="font-mono text-white font-bold">{activeCase.vitals60Min?.bp || '115/70'}</p>
                      <p className="text-[10px] text-slate-400">{activeCase.vitals60Min?.hr || 84} bpm • {activeCase.vitals60Min?.temp || 36.6}°C</p>
                      <span className="text-[9px] text-slate-400">Goteo regular</span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1 text-center">
                      <span className="text-[10px] font-bold text-slate-400 block">4. Finalización</span>
                      <p className="font-mono text-white font-bold">{activeCase.vitalsFinal?.bp || '120/75'}</p>
                      <p className="text-[10px] text-slate-400">{activeCase.vitalsFinal?.hr || 78} bpm • {activeCase.vitalsFinal?.temp || 36.6}°C</p>
                      <span className="text-[9px] text-emerald-400 font-bold">Post-infusión</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 7: SEGUIMIENTO POST-TRANSFUSIONAL */}
            {activeStageTab === 'SEGUIMIENTO' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-teal-400" />
                    <h3 className="font-bold text-white text-sm">Etapa 7: Seguimiento Clínico & Rendimiento Transfusional</h3>
                  </div>
                  <span className="text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    Eficacia Terapéutica
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Rendimiento Esperado vs Obtenido</span>
                    <p className="text-slate-200">{activeCase.postHbHctYield || 'Incremento de Hb esperado: +1.0 a +1.2 g/dL por cada unidad de hematíes.'}</p>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-teal-300 font-mono">
                      Delta Hematocrito: +3% estimado tras equilibrio intravascular.
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Estado del Paciente</span>
                    <p><strong className="text-white">Condición Clínica:</strong> <span className="text-emerald-400 font-bold">{activeCase.patientCondition || 'ESTABLE_SATISFACTORIA'}</span></p>
                    <p><strong className="text-white">Evaluación Finalizada:</strong> {activeCase.evaluatedOutcomeAt || '12:00 PM'}</p>
                    <p className="text-slate-400 text-[11px]">Paciente hemodinámicamente estable, afebril y sin signos de sangrado activo.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 8: REACCIÓN TRANSFUSIONAL & HEMOVIGILANCIA */}
            {activeStageTab === 'REACCION' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-white text-sm">Etapa 8: Hemovigilancia & Reacciones Transfusionales</h3>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                    activeCase.hasAdverseReaction
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {activeCase.hasAdverseReaction ? 'Reacción Adversa Notificada' : 'Sin Incidentes Adversos'}
                  </span>
                </div>

                {activeCase.hasAdverseReaction ? (
                  <div className="space-y-4 text-xs">
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-300">Tipo de Reacción: {activeCase.reactionType?.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded font-black">Severidad: {activeCase.reactionSeverity}</span>
                      </div>
                      <p className="text-slate-200"><strong>Síntomas:</strong> {activeCase.reactionSymptoms}</p>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Protocolo de Investigación de Laboratorio</span>
                      <p className="text-slate-300">{activeCase.investigationFindings}</p>
                      <div className="pt-2 flex items-center space-x-2 text-teal-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Notificación oficial remitida al Comité de Hemovigilancia y MINSA.</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
                    <h4 className="font-bold text-white text-sm">Transfusión Libre de Eventos Adversos</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      No se registraron reacciones febriles no hemolíticas, alérgicas, TRALI, TACO ni incompatibilidad ABO durante ni después del procedimiento.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ETAPA 9: CIERRE TRANSFUSIONAL */}
            {activeStageTab === 'CIERRE' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-white text-sm">Etapa 9: Cierre Transfusional & Dictamen Final</h3>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    Expediente Concluido
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Estado Final del Caso</span>
                    <strong className="text-emerald-400 text-base font-black block">
                      {activeCase.finalStatus.replace(/_/g, ' ')}
                    </strong>
                    <p className="text-slate-400 font-mono text-[11px]">Cerrado el: {activeCase.closedAt || 'En proceso'}</p>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Destino Final de la Unidad</span>
                    <p className="text-white font-bold">Transfundida en su totalidad a receptor</p>
                    <p className="text-slate-400 text-[11px]">Trazabilidad ISBT-128 archivada inmutablemente en el LIS/HIS.</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Observaciones y Resumen de Cierre</span>
                  <p className="text-slate-300 italic">{activeCase.closingNotes || 'Sin notas adicionales.'}</p>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-slate-300">Firma Digital: <strong>Dra. Carmen Rosas (Jefa Banco de Sangre)</strong></span>
                  </div>
                  <button
                    onClick={() => alert(`Generando Boleta Oficial de Transfusión ${activeCase.caseNumber} en formato PDF reglamentario MINSA...`)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Boleta Oficial Transfusional</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: NUEVA SOLICITUD TRANSFUSIONAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-rose-500" />
                  <span>Nueva Requisición Transfusional</span>
                </h3>
                <p className="text-xs text-slate-400">Emisión de solicitud médica para inicio de flujo transfusional.</p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Nombre Completo del Paciente</label>
                  <input
                    type="text"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Cédula / Documento Nacional</label>
                  <input
                    type="text"
                    value={newNationalId}
                    onChange={(e) => setNewNationalId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Edad (Años)</label>
                  <input
                    type="number"
                    value={newAge}
                    onChange={(e) => setNewAge(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Sexo Biológico</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Sala / Servicio</label>
                  <input
                    type="text"
                    value={newWard}
                    onChange={(e) => setNewWard(e.target.value)}
                    placeholder="Ej. UCI, URGENCIAS, SALA 3"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Cama</label>
                  <input
                    type="text"
                    value={newBed}
                    onChange={(e) => setNewBed(e.target.value)}
                    placeholder="Ej. 12"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Médico Prescriptor</label>
                  <input
                    type="text"
                    value={newDoctor}
                    onChange={(e) => setNewDoctor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Idoneidad Médica</label>
                  <input
                    type="text"
                    value={newDoctorLicense}
                    onChange={(e) => setNewDoctorLicense(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Hemocomponente Requerido</label>
                  <select
                    value={newComponent}
                    onChange={(e) => setNewComponent(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="CONCENTRADO_HEMATIES">Concentrado de Hematíes (PGRE)</option>
                    <option value="PLASMA_FRESCO">Plasma Fresco Congelado (PFC)</option>
                    <option value="PLAQUETAS">Plaquetas (Pool o Aféresis)</option>
                    <option value="CRIOPRECIPITADO">Crioprecipitado (CRIO)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Cantidad de Unidades</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newUnits}
                    onChange={(e) => setNewUnits(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-300 block mb-1">Nivel de Urgencia</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'EXTREMA_URGENCIA', label: '⚡ Extrema Urgencia' },
                      { id: 'URGENTE', label: 'Urgente (< 1h)' },
                      { id: 'PROGRAMADA', label: 'Programada / Rutina' }
                    ].map((urg) => (
                      <button
                        type="button"
                        key={urg.id}
                        onClick={() => setNewUrgency(urg.id as any)}
                        className={`p-2.5 rounded-xl font-bold border transition cursor-pointer text-center ${
                          newUrgency === urg.id
                            ? urg.id === 'EXTREMA_URGENCIA'
                              ? 'bg-rose-500 text-white border-rose-600'
                              : 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {urg.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-300 block mb-1">Indicación Clínica / Diagnóstico Transfusional</label>
                  <textarea
                    rows={2}
                    value={newIndication}
                    onChange={(e) => setNewIndication(e.target.value)}
                    placeholder="Detalle la causa clínica, valor de Hb/Hto o plaquetas y justificación..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-black shadow-lg shadow-rose-500/20 transition cursor-pointer"
                >
                  Ingresar al Flujo Transfusional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
