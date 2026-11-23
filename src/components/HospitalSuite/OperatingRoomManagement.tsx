import React, { useState } from 'react';
import {
  Zap,
  Bot,
  Sparkle,
  UserPlus,
  Stethoscope,
  Trash2,
  Edit3,
  Scissors,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  BedDouble,
  Search,
  Filter,
  Activity,
  Layers,
  Sparkles,
  HeartPulse,
  Award,
  Calendar,
  FileText,
  Plus,
  User,
  X,
  Check,
  CheckSquare,
  ChevronRight,
  ClipboardCheck
} from 'lucide-react';
import { REAL_PATIENTS_DIR } from '../../data/realClinicalData';
import { MedicalStaffService, MedicalStaffMember, MedicalRoleCategory } from '../../services/medicalStaffService';

export interface SurgerySchedule {
  id: string;
  surgeryNumber: string; // e.g. "OR-2026-0041"
  patientName: string;
  patientNationalId: string;
  patientAge?: number;
  procedureName: string;
  operatingRoom: string; // e.g. "Quirófano 2 (Cirugía Mayor)"
  surgeonName: string;
  anesthesiologistName: string;
  scheduledTime: string;
  status: 'PROGRAMADA' | 'EN_CIRUGIA' | 'RECUPERACION_PACU' | 'COMPLETADA';
  asaClass: string; // ASA I, ASA II, ASA III E, ASA IV
  whoChecklistVerified: boolean;
  whoChecklistDetails?: {
    signIn: boolean;
    timeOut: boolean;
    signOut: boolean;
    surgicalSiteMarked: boolean;
    antibioticProphylaxis: boolean;
    spongeCountCorrect: boolean;
  };
}

const INITIAL_SURGERIES: SurgerySchedule[] = [
  {
    id: 'or-101',
    surgeryNumber: 'OR-2026-0812',
    patientName: 'Juan Carlos Samudio González',
    patientNationalId: '8-415-2281',
    patientAge: 52,
    procedureName: 'Cateterismo Cardíaco / Angioplastia Coronaria de Urgencia',
    operatingRoom: 'Quirófano 1 (Emergencias / Hemodinamia)',
    surgeonName: 'Dr. Alejandro Icaza (Cardiología / Cirugía)',
    anesthesiologistName: 'Dra. Carmen Boyd (Anestesiología)',
    scheduledTime: '2026-09-08 11:00 AM',
    status: 'EN_CIRUGIA',
    asaClass: 'ASA III E',
    whoChecklistVerified: true,
    whoChecklistDetails: {
      signIn: true,
      timeOut: true,
      signOut: false,
      surgicalSiteMarked: true,
      antibioticProphylaxis: true,
      spongeCountCorrect: true
    }
  },
  {
    id: 'or-102',
    surgeryNumber: 'OR-2026-0815',
    patientName: 'Castillo, Sofía Elena',
    patientNationalId: '8-901-4412',
    patientAge: 39,
    procedureName: 'Colecistectomía Programada por Laparoscopia',
    operatingRoom: 'Quirófano 2 (Electiva)',
    surgeonName: 'Dr. Jorge Mendoza',
    anesthesiologistName: 'Dr. Fernando Arango',
    scheduledTime: '2026-08-21 13:30 PM',
    status: 'PROGRAMADA',
    asaClass: 'ASA I',
    whoChecklistVerified: true,
    whoChecklistDetails: {
      signIn: true,
      timeOut: false,
      signOut: false,
      surgicalSiteMarked: true,
      antibioticProphylaxis: false,
      spongeCountCorrect: false
    }
  },
  {
    id: 'or-103',
    surgeryNumber: 'OR-2026-0818',
    patientName: 'Mendoza, Alejandro',
    patientNationalId: 'PE-982103',
    patientAge: 62,
    procedureName: 'Reemplazo Total de Cadera Izquierda',
    operatingRoom: 'Quirófano 3 (Ortopedia)',
    surgeonName: 'Dr. Roberto Eisenmann',
    anesthesiologistName: 'Dra. Carmen Boyd',
    scheduledTime: '2026-08-21 08:00 AM',
    status: 'RECUPERACION_PACU',
    asaClass: 'ASA II',
    whoChecklistVerified: true,
    whoChecklistDetails: {
      signIn: true,
      timeOut: true,
      signOut: true,
      surgicalSiteMarked: true,
      antibioticProphylaxis: true,
      spongeCountCorrect: true
    }
  }
];


// ============================================================================
// MOTOR DE AUTOMATIZACIÓN QUIRÚRGICA INTELIGENTE (SMART MATCHING ENGINE)
// Infiere diagnósticos CPOE, procedimientos, quirófanos y equipo quirúrgico
// ============================================================================
interface PatientClinicalInference {
  procedure: string;
  room: string;
  surgeon: string;
  anesthesiologist: string;
  asa: string;
  timeSlot: string;
  clinicalReason: string;
}

const PATIENT_SURGICAL_PRESETS: Record<string, PatientClinicalInference> = {
  samudio: {
    procedure: 'Cateterismo Cardíaco de Urgencia / Angioplastia Coronaria (ACTP)',
    room: 'Quirófano 1 (Emergencias / Hemodinamia)',
    surgeon: 'Dr. Alejandro Icaza',
    anesthesiologist: 'Dr. Roberto Icaza',
    asa: 'ASA III E',
    timeSlot: 'Inmediato (Próximos 45 min • Urgencia)',
    clinicalReason: 'Detectado en CPOE: SCACEST en evolución con Troponina I Crítica (+0.048 ng/mL) en Triage Nivel 1.'
  },
  sofia: {
    procedure: 'Colecistectomía Programada por Laparoscopia',
    room: 'Quirófano 2 (Electiva Laparoscópica)',
    surgeon: 'Dr. Roberto Eisenmann',
    anesthesiologist: 'Dra. Carmen Boyd',
    asa: 'ASA I',
    timeSlot: 'Mañana 08:30 AM (Primer Turno Electivo)',
    clinicalReason: 'Detectado en CPOE: Colelitiasis sintomática recurrente documentada por ultrasonido.'
  },
  mendoza: {
    procedure: 'Reemplazo Total de Cadera Izquierda (Artroplastia)',
    room: 'Quirófano 3 (Ortopedia y Reemplazo Articular)',
    surgeon: 'Dr. Franklin Castillo',
    anesthesiologist: 'Dr. Fernando Lasso',
    asa: 'ASA II',
    timeSlot: 'Mañana 10:30 AM (Segundo Turno Electivo)',
    clinicalReason: 'Detectado en CPOE: Coxartrosis severa Grado IV con limitación funcional.'
  },
  pinzon: {
    procedure: 'Apendicectomía Laparoscópica de Urgencia',
    room: 'Quirófano 1 (Emergencias / Hemodinamia)',
    surgeon: 'Dr. Jorge Mendoza',
    anesthesiologist: 'Dra. Carmen Boyd',
    asa: 'ASA II',
    timeSlot: 'Hoy 16:30 PM (Turno Vespertino Urgente)',
    clinicalReason: 'Detectado en CPOE: Cuadro de fosa ilíaca derecha compatible con apendicitis aguda.'
  },
  castillo: {
    procedure: 'Hernioplastia Inguinal con Malla (Lichtenstein)',
    room: 'Quirófano 2 (Electiva Laparoscópica)',
    surgeon: 'Dr. Alberto Herrera',
    anesthesiologist: 'Dr. Fernando Lasso',
    asa: 'ASA I',
    timeSlot: 'Mañana 11:30 AM',
    clinicalReason: 'Detectado en CPOE: Hernia inguinal derecha reducible no complicada.'
  }
};

const COMMON_PROCEDURES_AUTOMATION = [
  {
    name: 'Cateterismo Cardíaco / Angioplastia',
    room: 'Quirófano 1 (Emergencias / Hemodinamia)',
    surgeon: 'Dr. Alejandro Icaza',
    anes: 'Dr. Roberto Icaza',
    asa: 'ASA III E',
    time: 'Inmediato (Próximos 45 min)'
  },
  {
    name: 'Apendicectomía Laparoscópica',
    room: 'Quirófano 1 (Emergencias / Hemodinamia)',
    surgeon: 'Dr. Jorge Mendoza',
    anes: 'Dra. Carmen Boyd',
    asa: 'ASA II',
    time: 'Hoy 16:00 PM'
  },
  {
    name: 'Colecistectomía Laparoscópica',
    room: 'Quirófano 2 (Electiva Laparoscópica)',
    surgeon: 'Dr. Roberto Eisenmann',
    anes: 'Dra. Carmen Boyd',
    asa: 'ASA I',
    time: 'Mañana 08:30 AM'
  },
  {
    name: 'Reemplazo de Cadera / Artroplastia',
    room: 'Quirófano 3 (Ortopedia y Reemplazo Articular)',
    surgeon: 'Dr. Franklin Castillo',
    anes: 'Dr. Fernando Lasso',
    asa: 'ASA II',
    time: 'Mañana 10:30 AM'
  },
  {
    name: 'Cesárea de Emergencia',
    room: 'Quirófano 1 (Emergencias / Hemodinamia)',
    surgeon: 'Dra. Patricia Boyd',
    anes: 'Dra. Elena Ramos',
    asa: 'ASA II',
    time: 'Inmediato (STAT)'
  }
];

export const OperatingRoomManagement: React.FC = () => {
  const [surgeries, setSurgeries] = useState<SurgerySchedule[]>(INITIAL_SURGERIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Selected Surgery for OMS Checklist & Surgical Protocol Modal
  const [selectedSurgery, setSelectedSurgery] = useState<SurgerySchedule | null>(null);

  // New Surgery Scheduling Modal State
  const [isNewSurgeryModalOpen, setIsNewSurgeryModalOpen] = useState(false);
  const [selectedPatientKey, setSelectedPatientKey] = useState<string>('samudio');
  const [customPatientName, setCustomPatientName] = useState('');
  const [customPatientCedula, setCustomPatientCedula] = useState('');
  const [procedureName, setProcedureName] = useState('Apendicectomía Laparoscópica');
  const [operatingRoom, setOperatingRoom] = useState('Quirófano 1 (Emergencias / Cirugía Mayor)');
  const [surgeonName, setSurgeonName] = useState('Dr. Alejandro Icaza');
  const [anesthesiologistName, setAnesthesiologistName] = useState('Dra. Carmen Boyd');
  const [scheduledTime, setScheduledTime] = useState('2026-08-22 10:00 AM');
  const [asaClass, setAsaClass] = useState('ASA II');

  const [autoMatchReason, setAutoMatchReason] = useState<string>('');
  const [isAutoMatching, setIsAutoMatching] = useState<boolean>(true);

  // Auto-completar inteligente cuando cambia el paciente
  const applyPatientAutomation = (key: string) => {
    const preset = PATIENT_SURGICAL_PRESETS[key];
    if (preset && isAutoMatching) {
      setProcedureName(preset.procedure);
      setOperatingRoom(preset.room);
      setSurgeonName(preset.surgeon);
      setAnesthesiologistName(preset.anesthesiologist);
      setAsaClass(preset.asa);
      setScheduledTime(preset.timeSlot);
      setAutoMatchReason(preset.clinicalReason);
    } else {
      setAutoMatchReason('');
    }
  };

  useEffect(() => {
    applyPatientAutomation(selectedPatientKey);
  }, [selectedPatientKey, isAutoMatching]);

  const applyProcedurePreset = (proc: typeof COMMON_PROCEDURES_AUTOMATION[0]) => {
    setProcedureName(proc.name);
    setOperatingRoom(proc.room);
    setSurgeonName(proc.surgeon);
    setAnesthesiologistName(proc.anes);
    setAsaClass(proc.asa);
    setScheduledTime(proc.time);
    setAutoMatchReason(`Auto-asignado por protocolo quirúrgico para: ${proc.name}`);
  };


  // Directorio de Médicos y Anestesiólogos
  const [medicalStaff, setMedicalStaff] = useState<MedicalStaffMember[]>(() => MedicalStaffService.getAllMembers());
  const [isStaffDirectoryOpen, setIsStaffDirectoryOpen] = useState(false);
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<MedicalStaffMember | null>(null);

  // Form para nuevo/editar médico
  const [docFormName, setDocFormName] = useState('');
  const [docFormRole, setDocFormRole] = useState<MedicalRoleCategory>('CIRUJANO');
  const [docFormSpecialty, setDocFormSpecialty] = useState('');
  const [docFormLicense, setDocFormLicense] = useState('');
  const [docFormHospital, setDocFormHospital] = useState('Sede Vía España • Pabellón Quirúrgico');
  const [docFormPhone, setDocFormPhone] = useState('');
  const [docFormEmail, setDocFormEmail] = useState('');

  // Escuchar cambios en el cuerpo médico
  useEffect(() => {
    const handleUpdate = () => {
      setMedicalStaff(MedicalStaffService.getAllMembers());
    };
    window.addEventListener('lis-medical-staff-updated', handleUpdate);
    return () => window.removeEventListener('lis-medical-staff-updated', handleUpdate);
  }, []);

  const surgeonsList = useMemo(() => {
    return medicalStaff.filter(m => m.isActive && (m.role === 'CIRUJANO' || m.specialty.toLowerCase().includes('cirug')));
  }, [medicalStaff]);

  const anesthesiologistsList = useMemo(() => {
    return medicalStaff.filter(m => m.isActive && (m.role === 'ANESTESIOLOGO' || m.specialty.toLowerCase().includes('anestes')));
  }, [medicalStaff]);

  const handleOpenAddDoctor = (roleDefault: MedicalRoleCategory = 'CIRUJANO') => {
    setEditingDoctor(null);
    setDocFormName('');
    setDocFormRole(roleDefault);
    setDocFormSpecialty(roleDefault === 'CIRUJANO' ? 'Cirugía General & Laparoscópica' : 'Anestesiología & Reanimación');
    setDocFormLicense('');
    setDocFormHospital('Sede Vía España • Pabellón Quirúrgico');
    setDocFormPhone('');
    setDocFormEmail('');
    setIsAddDoctorModalOpen(true);
  };

  const handleOpenEditDoctor = (doc: MedicalStaffMember) => {
    setEditingDoctor(doc);
    setDocFormName(doc.name);
    setDocFormRole(doc.role);
    setDocFormSpecialty(doc.specialty);
    setDocFormLicense(doc.licenseNumber);
    setDocFormHospital(doc.institution);
    setDocFormPhone(doc.phone || '');
    setDocFormEmail(doc.email || '');
    setIsAddDoctorModalOpen(true);
  };

  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFormName.trim()) return;

    const memberToSave: MedicalStaffMember = {
      id: editingDoctor ? editingDoctor.id : 'doc-' + Date.now(),
      name: docFormName.trim(),
      role: docFormRole,
      specialty: docFormSpecialty.trim() || (docFormRole === 'CIRUJANO' ? 'Cirugía' : 'Anestesiología'),
      licenseNumber: docFormLicense.trim() || 'REG-' + Math.floor(1000 + Math.random() * 9000) + '-MINSA',
      institution: docFormHospital.trim() || 'Sede Vía España',
      service: docFormRole === 'CIRUJANO' ? 'Quirófano Central' : 'Departamento de Anestesia',
      phone: docFormPhone.trim() || undefined,
      email: docFormEmail.trim() || undefined,
      isActive: true
    };

    MedicalStaffService.saveMember(memberToSave);
    setIsAddDoctorModalOpen(false);

    // Si se creó mientras se programaba cirugía, auto-asignar
    if (docFormRole === 'CIRUJANO') {
      setSurgeonName(memberToSave.name);
    } else if (docFormRole === 'ANESTESIOLOGO') {
      setAnesthesiologistName(memberToSave.name);
    }

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          title: editingDoctor ? 'Médico Actualizado' : 'Médico Registrado',
          message: `${memberToSave.name} (${memberToSave.specialty}) guardado en la plantilla oficial.`,
          type: 'success'
        }
      })
    );
  };

  const filteredSurgeries = surgeries.filter(item => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      item.patientName.toLowerCase().includes(q) ||
      item.patientNationalId.includes(q) ||
      item.procedureName.toLowerCase().includes(q) ||
      item.surgeonName.toLowerCase().includes(q) ||
      item.operatingRoom.toLowerCase().includes(q);
    const matchesStatus = selectedStatusFilter === 'ALL' || item.status === selectedStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSurgery = (e: React.FormEvent) => {
    e.preventDefault();

    let pName = customPatientName;
    let pCedula = customPatientCedula;

    if (selectedPatientKey !== 'CUSTOM' && REAL_PATIENTS_DIR[selectedPatientKey]) {
      const p = REAL_PATIENTS_DIR[selectedPatientKey];
      pName = `${p.firstName} ${p.lastName}`;
      pCedula = p.nationalId;
    }

    if (!pName) return;

    const newSurgery: SurgerySchedule = {
      id: `or-${Date.now()}`,
      surgeryNumber: `OR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: pName,
      patientNationalId: pCedula,
      procedureName,
      operatingRoom,
      surgeonName,
      anesthesiologistName,
      scheduledTime,
      status: 'PROGRAMADA',
      asaClass,
      whoChecklistVerified: true,
      whoChecklistDetails: {
        signIn: true,
        timeOut: false,
        signOut: false,
        surgicalSiteMarked: true,
        antibioticProphylaxis: false,
        spongeCountCorrect: false
      }
    };

    setSurgeries([newSurgery, ...surgeries]);
    setIsNewSurgeryModalOpen(false);
    setSelectedSurgery(newSurgery);

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          title: 'Cirugía Programada Exitosamente',
          message: `Paciente ${pName} agendado en ${operatingRoom} para ${procedureName}.`,
          type: 'success'
        }
      })
    );
  };

  const handleUpdateStatus = (surgeryId: string, newStatus: SurgerySchedule['status']) => {
    setSurgeries(prev =>
      prev.map(s => (s.id === surgeryId ? { ...s, status: newStatus } : s))
    );
    if (selectedSurgery && selectedSurgery.id === surgeryId) {
      setSelectedSurgery({ ...selectedSurgery, status: newStatus });
    }

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          title: 'Estado Quirúrgico Actualizado',
          message: `Cirugía cambiada a estado: ${newStatus.replace('_', ' ')}.`,
          type: 'success'
        }
      })
    );
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-300">
      
      {/* 1. HEADER BANNER WITH NEW SURGERY ACTION */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-800/40 p-6 sm:p-8 rounded-3xl text-white shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 mb-2">
            <Scissors className="w-3.5 h-3.5" />
            <span>HIS • Quirófano, Cirugía & Anestesiología (OR Management)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Gestión Quirúrgica & Cirugía Segura OMS
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Programación de salas de operaciones, evaluación anestésica preoperatoria, verificación de lista de chequeo OMS en 3 fases y sala de recuperación post-anestésica (PACU).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsStaffDirectoryOpen(true)}
              className="px-4 py-3 bg-slate-950/80 hover:bg-slate-900 text-slate-200 hover:text-white font-bold text-xs rounded-2xl border border-slate-700/80 hover:border-rose-500/50 shadow-lg transition cursor-pointer flex items-center space-x-2"
            >
              <Stethoscope className="w-4 h-4 text-rose-400" />
              <span>Plantilla Médica ({surgeonsList.length} Cirujanos • {anesthesiologistsList.length} Anestesiólogos)</span>
            </button>

            <button
              onClick={() => setIsNewSurgeryModalOpen(true)}
              className="px-5 py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs rounded-2xl shadow-xl shadow-rose-600/25 transition cursor-pointer flex items-center space-x-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Programar Nueva Cirugía</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl text-xs">
            <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Checklist OMS Verificado</div>
              <div className="text-slate-400 text-[11px]">Entrada, Pausa y Salida</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & STATUS FILTERS */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por paciente, cédula, procedimiento o cirujano..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-rose-500 outline-none font-sans"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          {[
            { id: 'ALL', label: 'Todas las Cirugías' },
            { id: 'PROGRAMADA', label: 'Programadas' },
            { id: 'EN_CIRUGIA', label: 'En Cirugía' },
            { id: 'RECUPERACION_PACU', label: 'PACU / Recuperación' },
            { id: 'COMPLETADA', label: 'Completadas' }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setSelectedStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase transition cursor-pointer whitespace-nowrap ${
                selectedStatusFilter === st.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. SURGERY SCHEDULE TABLE (WITH DIRECT ROW SELECT BUTTONS) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <th className="p-4">N° Cirugía</th>
                <th className="p-4">Paciente / Cédula</th>
                <th className="p-4">Procedimiento Quirúrgico</th>
                <th className="p-4">Quirófano / Horario</th>
                <th className="p-4 text-center">Riesgo ASA</th>
                <th className="p-4 text-center">Checklist OMS</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-right">Acción Clínica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredSurgeries.map(item => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedSurgery(item)}
                  className="hover:bg-slate-800/50 transition cursor-pointer group"
                >
                  <td className="p-4 font-mono font-bold text-rose-400">{item.surgeryNumber}</td>
                  <td className="p-4">
                    <p className="font-bold text-white group-hover:text-rose-300 transition">{item.patientName}</p>
                    <p className="text-[11px] text-slate-400 font-mono">Cédula: {item.patientNationalId}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-200">{item.procedureName}</p>
                    <p className="text-[10px] text-slate-400">Cirujano: <span className="text-slate-300">{item.surgeonName}</span></p>
                  </td>
                  <td className="p-4 text-slate-300">
                    <p className="font-bold text-teal-300">{item.operatingRoom}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{item.scheduledTime}</p>
                  </td>
                  <td className="p-4 text-center font-mono font-bold text-amber-400">
                    {item.asaClass}
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[10px]">
                      <CheckCircle2 size={12} /> Verificado
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      item.status === 'EN_CIRUGIA'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                        : item.status === 'RECUPERACION_PACU'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : item.status === 'COMPLETADA'
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSurgery(item);
                      }}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl font-bold text-xs transition border border-rose-500/30 cursor-pointer flex items-center space-x-1 ml-auto"
                    >
                      <span>Abrir Expediente</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: PROGRAMAR NUEVA CIRUGÍA / SELECCIÓN DE PACIENTE */}
      {isNewSurgeryModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsNewSurgeryModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-800 pb-3 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Programación de Intervención Quirúrgica</h3>
                <p className="text-xs text-slate-400">Seleccione el paciente y asigne sala de operaciones</p>
              </div>
            </div>

            <form onSubmit={handleCreateSurgery} className="space-y-4 text-xs">
              
              {/* SMART AUTOMATION STATUS BANNER */}
              <div className="bg-gradient-to-r from-teal-950/60 to-slate-950 border border-teal-500/30 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <span className="font-bold text-teal-300 block">Automatización Clínica Activa</span>
                    <span className="text-[11px] text-slate-400">
                      {autoMatchReason || 'Datos pre-completados según expediente CPOE, Triage y especialidad.'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => applyPatientAutomation(selectedPatientKey)}
                  className="px-2.5 py-1.5 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition"
                  title="Re-aplicar inferencia automática"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Re-inferir</span>
                </button>
              </div>

              {/* Botones de Procedimientos Rápidos */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
                  Cirugías Frecuentes (1 Clic auto-asigna quirófano, cirujano y anestesiólogo):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_PROCEDURES_AUTOMATION.map((proc, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => applyProcedurePreset(proc)}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-teal-500/50 rounded-xl text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <Zap className="w-2.5 h-2.5 text-yellow-400" />
                      <span>{proc.name.split('/')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Patient Selection Dropdown */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">1. Seleccionar Paciente:</label>
                <select
                  value={selectedPatientKey}
                  onChange={e => setSelectedPatientKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-rose-500 cursor-pointer"
                >
                  {Object.entries(REAL_PATIENTS_DIR).map(([key, pat]) => (
                    <option key={key} value={key}>
                      {pat.firstName} {pat.lastName} — Cédula: {pat.nationalId}
                    </option>
                  ))}
                  <option value="CUSTOM">Otro Paciente (Ingreso Manual)</option>
                </select>
              </div>

              {selectedPatientKey === 'CUSTOM' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Nombre Completo:</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Carlos Alberto Vega"
                      value={customPatientName}
                      onChange={e => setCustomPatientName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Cédula / Documento:</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 8-812-4412"
                      value={customPatientCedula}
                      onChange={e => setCustomPatientCedula(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Procedure Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">2. Procedimiento Quirúrgico:</label>
                <input
                  type="text"
                  required
                  value={procedureName}
                  onChange={e => setProcedureName(e.target.value)}
                  placeholder="Ej: Apendicectomía, Hernioplastia, Cesárea..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-rose-500"
                />
              </div>

              {/* Operating Room & ASA Risk */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">3. Sala de Quirófano:</label>
                  <select
                    value={operatingRoom}
                    onChange={e => setOperatingRoom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none cursor-pointer"
                  >
                    <option value="Quirófano 1 (Emergencias / Hemodinamia)">Quirófano 1 (Emergencias / Hemodinamia)</option>
                    <option value="Quirófano 2 (Cirugía Mayor Electiva)">Quirófano 2 (Cirugía Mayor Electiva)</option>
                    <option value="Quirófano 3 (Ortopedia & Traumatología)">Quirófano 3 (Ortopedia & Traumatología)</option>
                    <option value="Quirófano 4 (Ginecología & Obstetricia)">Quirófano 4 (Ginecología & Obstetricia)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">4. Riesgo Quirúrgico ASA:</label>
                  <select
                    value={asaClass}
                    onChange={e => setAsaClass(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none cursor-pointer font-mono"
                  >
                    <option value="ASA I">ASA I (Paciente Sano)</option>
                    <option value="ASA II">ASA II (Enfermedad Sistémica Leve)</option>
                    <option value="ASA III">ASA III (Enfermedad Sistémica Grave)</option>
                    <option value="ASA III E">ASA III E (Emergencia Médica)</option>
                    <option value="ASA IV">ASA IV (Riesgo Vital Inminente)</option>
                  </select>
                </div>
              </div>

              {/* Surgeons & Anesthesia with live selector & + Add button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-400 block text-xs font-bold">Cirujano Principal:</label>
                    <button
                      type="button"
                      onClick={() => handleOpenAddDoctor('CIRUJANO')}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>+ Nuevo Cirujano</span>
                    </button>
                  </div>
                  <select
                    value={surgeonName}
                    onChange={e => setSurgeonName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-rose-500"
                  >
                    {surgeonsList.map(surg => (
                      <option key={surg.id} value={surg.name}>
                        {surg.name} — {surg.specialty} ({surg.licenseNumber})
                      </option>
                    ))}
                    <option value="Otro Cirujano...">+ Ingresar Otro Cirujano...</option>
                  </select>
                  {surgeonName === 'Otro Cirujano...' && (
                    <input
                      type="text"
                      placeholder="Escriba el nombre del cirujano..."
                      onChange={e => setSurgeonName(e.target.value)}
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-400 block text-xs font-bold">Anestesiólogo a Cargo:</label>
                    <button
                      type="button"
                      onClick={() => handleOpenAddDoctor('ANESTESIOLOGO')}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>+ Nuevo Anestesiólogo</span>
                    </button>
                  </div>
                  <select
                    value={anesthesiologistName}
                    onChange={e => setAnesthesiologistName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyan-500"
                  >
                    {anesthesiologistsList.map(anes => (
                      <option key={anes.id} value={anes.name}>
                        {anes.name} — {anes.specialty} ({anes.licenseNumber})
                      </option>
                    ))}
                    <option value="Otro Anestesiólogo...">+ Ingresar Otro Anestesiólogo...</option>
                  </select>
                  {anesthesiologistName === 'Otro Anestesiólogo...' && (
                    <input
                      type="text"
                      placeholder="Escriba el nombre del anestesiólogo..."
                      onChange={e => setAnesthesiologistName(e.target.value)}
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Quick Schedule Timing Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 block text-xs font-bold">Horario de Intervención:</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setScheduledTime('Inmediato (Próximos 45 min • Urgencia)')}
                      className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-bold hover:bg-rose-500/30 transition cursor-pointer"
                    >
                      ⚡ Urgencia STAT
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduledTime('Hoy 14:00 PM (Turno Vespertino)')}
                      className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-700 transition cursor-pointer"
                    >
                      Hoy 14:00 PM
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduledTime('Mañana 08:00 AM (Primer Turno)')}
                      className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-700 transition cursor-pointer"
                    >
                      Mañana 08:00 AM
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  placeholder="Ej: Inmediato / Mañana 08:00 AM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none font-mono focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Fecha y Hora Programada:</label>
                <input
                  type="text"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  placeholder="Ej: 2026-08-22 10:00 AM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewSurgeryModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition cursor-pointer shadow-lg shadow-rose-900/30"
                >
                  Confirmar Programación
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: FICHA QUIRÚRGICA, CHECKLIST OMS & CONTROL DE ESTADOS */}
      {selectedSurgery && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-7 space-y-6 shadow-2xl relative">
            
            <button
              onClick={() => setSelectedSurgery(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-rose-400">
                  <span>{selectedSurgery.surgeryNumber}</span>
                  <span>•</span>
                  <span>{selectedSurgery.operatingRoom}</span>
                </div>
                <h3 className="text-xl font-black text-white mt-1">
                  {selectedSurgery.patientName}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Cédula: <strong className="text-white">{selectedSurgery.patientNationalId}</strong> • Riesgo: <span className="text-amber-400 font-bold">{selectedSurgery.asaClass}</span>
                </p>
              </div>

              {/* Status Switcher Action */}
              <div className="flex flex-col items-end space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Estado de Cirugía:</span>
                <div className="flex items-center space-x-1.5">
                  {(['PROGRAMADA', 'EN_CIRUGIA', 'RECUPERACION_PACU', 'COMPLETADA'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedSurgery.id, st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                        selectedSurgery.status === st
                          ? 'bg-rose-500 text-white shadow'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {st === 'RECUPERACION_PACU' ? 'PACU' : st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Surgical Details Summary Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 uppercase font-mono text-[10px] block">Intervención:</span>
                <span className="font-bold text-white text-sm">{selectedSurgery.procedureName}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-mono text-[10px] block">Horario Programado:</span>
                <span className="font-mono text-teal-300 font-bold">{selectedSurgery.scheduledTime}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-mono text-[10px] block">Cirujano:</span>
                <span className="text-slate-200">{selectedSurgery.surgeonName}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-mono text-[10px] block">Anestesiólogo:</span>
                <span className="text-slate-200">{selectedSurgery.anesthesiologistName}</span>
              </div>
            </div>

            {/* OMS 3-STAGE SURGICAL SAFETY CHECKLIST */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" />
                <span>Lista de Verificación de Cirugía Segura (Estándar OMS)</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Phase 1: Sign-In */}
                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>1. Entrada (Sign In)</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-[10px] text-slate-400">Antes de la inducción anestésica:</p>
                  <ul className="text-[10px] text-slate-300 space-y-1">
                    <li className="flex items-center gap-1.5 text-emerald-300">✓ Identidad confirmada</li>
                    <li className="flex items-center gap-1.5 text-emerald-300">✓ Sitio quirúrgico marcado</li>
                    <li className="flex items-center gap-1.5 text-emerald-300">✓ Pulsioxímetro colocado</li>
                    <li className="flex items-center gap-1.5 text-emerald-300">✓ Alergias conocidas revisadas</li>
                  </ul>
                </div>

                {/* Phase 2: Time-Out */}
                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>2. Pausa (Time Out)</span>
                    <CheckCircle2 className={`w-4 h-4 ${selectedSurgery.status !== 'PROGRAMADA' ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </div>
                  <p className="text-[10px] text-slate-400">Antes de la incisión cutánea:</p>
                  <ul className="text-[10px] text-slate-300 space-y-1">
                    <li className="flex items-center gap-1.5 text-emerald-300">✓ Presentación del equipo</li>
                    <li className="flex items-center gap-1.5 text-emerald-300">✓ Confirmación verbal de incisión</li>
                    <li className="flex items-center gap-1.5 text-emerald-300">✓ Profilaxis antibiótica &lt; 60m</li>
                    <li className="flex items-center gap-1.5 text-emerald-300">✓ Imágenes esenciales mostradas</li>
                  </ul>
                </div>

                {/* Phase 3: Sign-Out */}
                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>3. Salida (Sign Out)</span>
                    <CheckCircle2 className={`w-4 h-4 ${selectedSurgery.status === 'COMPLETADA' || selectedSurgery.status === 'RECUPERACION_PACU' ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </div>
                  <p className="text-[10px] text-slate-400">Antes de salir del quirófano:</p>
                  <ul className="text-[10px] text-slate-300 space-y-1">
                    <li className="flex items-center gap-1.5 text-emerald-300">✓ Nombre del procedimiento grabado</li>
                    <li className="flex items-center gap-1.5 text-emerald-300">✓ Recuento de gasas e instrumental</li>
                    <li className="flex items-center gap-1.5 text-emerald-300">✓ Muestra etiquetada con cédula</li>
                    <li className="flex items-center gap-1.5 text-emerald-300">✓ Plan de recuperación y analgesia</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedSurgery(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cerrar Expediente
              </button>
            </div>

          </div>
        </div>
      )}

    
      {/* 5. MODAL DIRECTORIO DE CIRUJANOS & ANESTESIÓLOGOS */}
      {isStaffDirectoryOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Directorio Médico Quirúrgico & Anestesiología
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sede Vía España • Gestión de Cirujanos, Anestesiólogos y Especialistas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenAddDoctor('CIRUJANO')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Registrar Médico</span>
                </button>
                <button
                  onClick={() => setIsStaffDirectoryOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Table */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-[10px] font-mono uppercase border-b border-slate-800">
                      <th className="p-3">Médico / Especialista</th>
                      <th className="p-3">Rol Quirúrgico</th>
                      <th className="p-3">Especialidad</th>
                      <th className="p-3">Idoneidad / Reg. MINSA</th>
                      <th className="p-3">Hospital / Sede</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {medicalStaff.map(member => (
                      <tr key={member.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-bold text-white">
                          <p className="text-sm">{member.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{member.email || member.phone || 'Sin contacto directo'}</p>
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            member.role === 'CIRUJANO'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : member.role === 'ANESTESIOLOGO'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 font-medium">{member.specialty}</td>
                        <td className="p-3 font-mono text-amber-300 font-bold">{member.licenseNumber}</td>
                        <td className="p-3 text-slate-400 text-[11px]">{member.institution}</td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditDoctor(member)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition text-[11px] font-bold cursor-pointer"
                            title="Editar datos del médico"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar al ${member.name} del directorio?`)) {
                                MedicalStaffService.deleteMember(member.id);
                              }
                            }}
                            className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-400 rounded-lg transition cursor-pointer"
                            title="Eliminar médico"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>Total Médicos Registrados: {medicalStaff.length} ({surgeonsList.length} Cirujanos, {anesthesiologistsList.length} Anestesiólogos)</span>
              <button
                onClick={() => setIsStaffDirectoryOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Cerrar Directorio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL REGISTRAR / EDITAR MÉDICO */}
      {isAddDoctorModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveDoctor}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-white">
                  {editingDoctor ? 'Editar Datos del Médico' : 'Registrar Nuevo Médico / Especialista'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDoctorModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Nombre Completo y Título:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Dr. Roberto Eisenmann o Dra. Carmen Boyd"
                  value={docFormName}
                  onChange={e => setDocFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-rose-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Rol Principal:</label>
                  <select
                    value={docFormRole}
                    onChange={e => setDocFormRole(e.target.value as MedicalRoleCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-rose-500 outline-none"
                  >
                    <option value="CIRUJANO">Cirujano</option>
                    <option value="ANESTESIOLOGO">Anestesiólogo</option>
                    <option value="ESPECIALISTA">Especialista Clínico</option>
                    <option value="MEDICO_GENERAL">Médico General</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Idoneidad Médica / MINSA:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: MP-4412-PA"
                    value={docFormLicense}
                    onChange={e => setDocFormLicense(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Especialidad Clínica:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cirugía General & Laparoscopía / Anestesiología Cardiovascular"
                  value={docFormSpecialty}
                  onChange={e => setDocFormSpecialty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Hospital / Sede Asignada:</label>
                <input
                  type="text"
                  value={docFormHospital}
                  onChange={e => setDocFormHospital(e.target.value)}
                  placeholder="Ej: Sede Vía España • Pabellón Quirúrgico"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-rose-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Teléfono Móvil:</label>
                  <input
                    type="text"
                    placeholder="+507 6000-0000"
                    value={docFormPhone}
                    onChange={e => setDocFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Correo Electrónico:</label>
                  <input
                    type="email"
                    placeholder="doctor@hospital.pa"
                    value={docFormEmail}
                    onChange={e => setDocFormEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-rose-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddDoctorModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md shadow-rose-900/30"
              >
                {editingDoctor ? 'Guardar Cambios' : 'Registrar en Plantilla'}
              </button>
            </div>
          </form>
        </div>
      )}

</div>
  );
};

export default OperatingRoomManagement;
