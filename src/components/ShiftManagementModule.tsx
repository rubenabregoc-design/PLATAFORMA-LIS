import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Users,
  Building2,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Printer,
  RotateCw,
  Search,
  Sparkles,
  ShieldCheck,
  Edit3,
  Trash2,
  ArrowRightLeft,
  Sun,
  Moon,
  Sunset,
  Zap,
  Coffee,
  Info,
  MapPin,
  Check,
  Award,
  FileSpreadsheet,
  Bell,
  ShieldAlert
} from 'lucide-react';
import { ShiftAlertConfig } from './ShiftAlertConfig';

export interface StaffMember {
  id: string;
  name: string;
  role: 'tech_med' | 'lab_chief' | 'lab_tech' | 'receptionist' | 'ext_doctor';
  roleTitle: string;
  licenseNumber?: string;
  avatarInitials: string;
  defaultBranchId: string;
  branchName: string;
  phone: string;
  email: string;
  contractHoursMonth: number;
  specialties: string[];
  status: 'ACTIVO' | 'VACACIONES' | 'LICENCIA_MEDICA' | 'INACTIVO';
}

export interface WorkShift {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  staffLicense?: string;
  branchId: string;
  branchName: string;
  date: string; // YYYY-MM-DD
  shiftType: 'MANANA' | 'TARDE' | 'NOCHE' | 'ON_CALL' | 'DESCANSO';
  shiftTypeName: string;
  startTime: string;
  endTime: string;
  section: string; // e.g., "Hematología", "Bioquímica", "Recepción & Muestras", "Guardia Urgencias"
  status: 'PROGRAMADO' | 'CONFIRMADO' | 'COMPLETADO' | 'INTERCAMBIADO' | 'CANCELADO';
  notes?: string;
  assignedBy: string;
  assignedAt: string;
}

// Initial Mock Staff Members
const MOCK_STAFF: StaffMember[] = [
  {
    id: 'st-01',
    name: 'Dra. María Elena Abrego',
    role: 'lab_chief',
    roleTitle: 'Jefe de Laboratorio / Patóloga',
    licenseNumber: 'TM-4821-PA',
    avatarInitials: 'MA',
    defaultBranchId: 'branch-via-espana',
    branchName: 'Sede Vía España',
    phone: '+507 6612-4410',
    email: 'maria.abrego@labsanjose.com',
    contractHoursMonth: 160,
    specialties: ['Dirección Médica', 'Validación Patológica', 'Hematología Especial'],
    status: 'ACTIVO'
  },
  {
    id: 'st-02',
    name: 'Lic. Sofía Guardia',
    role: 'tech_med',
    roleTitle: 'Tecnólogo Médico Senior',
    licenseNumber: 'TM-5920-PA',
    avatarInitials: 'SG',
    defaultBranchId: 'branch-via-espana',
    branchName: 'Sede Vía España',
    phone: '+507 6688-1122',
    email: 'sofia.guardia@labsanjose.com',
    contractHoursMonth: 160,
    specialties: ['Hematología Sysmex', 'Química Clínica Vitros', 'Coagulación'],
    status: 'ACTIVO'
  },
  {
    id: 'st-03',
    name: 'Lic. Roberto Abrego',
    role: 'tech_med',
    roleTitle: 'Tecnólogo Médico',
    licenseNumber: 'TM-2041-PA',
    avatarInitials: 'RA',
    defaultBranchId: 'branch-via-espana',
    branchName: 'Sede Vía España',
    phone: '+507 6701-3390',
    email: 'roberto.abrego@labsanjose.com',
    contractHoursMonth: 160,
    specialties: ['Microbiología', 'Uroanálisis', 'Inmunología'],
    status: 'ACTIVO'
  },
  {
    id: 'st-04',
    name: 'Lic. Manuel Rodríguez',
    role: 'tech_med',
    roleTitle: 'Tecnólogo Médico',
    licenseNumber: 'TM-1092-PA',
    avatarInitials: 'MR',
    defaultBranchId: 'branch-david',
    branchName: 'Sede Chiriquí (David)',
    phone: '+507 775-9011',
    email: 'manuel.rodriguez@labsanjose.com',
    contractHoursMonth: 160,
    specialties: ['Bioquímica', 'Toma de Muestras', 'Control de Calidad Westgard'],
    status: 'ACTIVO'
  },
  {
    id: 'st-05',
    name: 'Lic. Yarisel Castillo',
    role: 'tech_med',
    roleTitle: 'Tecnólogo Médico',
    licenseNumber: 'TM-7731-PA',
    avatarInitials: 'YC',
    defaultBranchId: 'branch-david',
    branchName: 'Sede Chiriquí (David)',
    phone: '+507 6912-3004',
    email: 'yarisel.castillo@labsanjose.com',
    contractHoursMonth: 160,
    specialties: ['Hematología', 'Inmunoensayo', 'Gasometría'],
    status: 'ACTIVO'
  },
  {
    id: 'st-06',
    name: 'Dr. Carlos Mendoza',
    role: 'ext_doctor',
    roleTitle: 'Médico Asesor / Patólogo',
    licenseNumber: 'MP-8812',
    avatarInitials: 'CM',
    defaultBranchId: 'branch-via-espana',
    branchName: 'Sede Vía España',
    phone: '+507 6554-1020',
    email: 'carlos.mendoza@labsanjose.com',
    contractHoursMonth: 80,
    specialties: ['Biopsias', 'Citología', 'Consultoría Clínica'],
    status: 'ACTIVO'
  },
  {
    id: 'st-07',
    name: 'Ana Lucía Morales',
    role: 'receptionist',
    roleTitle: 'Recepcionista & Facturación',
    avatarInitials: 'AM',
    defaultBranchId: 'branch-via-espana',
    branchName: 'Sede Vía España',
    phone: '+507 6223-9081',
    email: 'ana.morales@labsanjose.com',
    contractHoursMonth: 160,
    specialties: ['Admisión Pacientes', 'Cobros POS', 'Aseguradoras'],
    status: 'ACTIVO'
  },
  {
    id: 'st-08',
    name: 'Carlos Villalaz',
    role: 'lab_tech',
    roleTitle: 'Técnico Flebotomista',
    avatarInitials: 'CV',
    defaultBranchId: 'branch-via-espana',
    branchName: 'Sede Vía España',
    phone: '+507 6410-8822',
    email: 'carlos.villalaz@labsanjose.com',
    contractHoursMonth: 160,
    specialties: ['Toma de Muestra Pediátrica', 'Centrifugación', 'Embalaje Ruteo'],
    status: 'ACTIVO'
  }
];

// Generate Initial Mock Shifts for August 2026
const generateInitialShifts = (): WorkShift[] => {
  const shifts: WorkShift[] = [];
  const year = 2026;
  const month = 8; // August

  // Shift assignment patterns across August 1 to 31
  for (let day = 1; day <= 31; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateFormatted = `${year}-08-${dayStr}`;
    const dayOfWeek = new Date(year, month - 1, day).getDay(); // 0 = Sunday, 6 = Saturday

    // Sede Vía España Morning Shift (07:00 - 15:00)
    shifts.push({
      id: `sh-${day}-1`,
      staffId: day % 2 === 0 ? 'st-02' : 'st-03',
      staffName: day % 2 === 0 ? 'Lic. Sofía Guardia' : 'Lic. Roberto Abrego',
      staffRole: 'Tecnólogo Médico',
      staffLicense: day % 2 === 0 ? 'TM-5920-PA' : 'TM-2041-PA',
      branchId: 'branch-via-espana',
      branchName: 'Sede Vía España',
      date: dateFormatted,
      shiftType: 'MANANA',
      shiftTypeName: 'Mañana (07:00 - 15:00)',
      startTime: '07:00',
      endTime: '15:00',
      section: 'Hematología & Química',
      status: 'CONFIRMADO',
      assignedBy: 'Dra. María Elena Abrego',
      assignedAt: '2026-07-28 09:00'
    });

    // Sede Vía España Evening Shift (15:00 - 23:00)
    if (dayOfWeek !== 0) { // Not Sunday
      shifts.push({
        id: `sh-${day}-2`,
        staffId: day % 2 === 0 ? 'st-03' : 'st-02',
        staffName: day % 2 === 0 ? 'Lic. Roberto Abrego' : 'Lic. Sofía Guardia',
        staffRole: 'Tecnólogo Médico',
        staffLicense: day % 2 === 0 ? 'TM-2041-PA' : 'TM-5920-PA',
        branchId: 'branch-via-espana',
        branchName: 'Sede Vía España',
        date: dateFormatted,
        shiftType: 'TARDE',
        shiftTypeName: 'Tarde (15:00 - 23:00)',
        startTime: '15:00',
        endTime: '23:00',
        section: 'Procesamiento General',
        status: 'CONFIRMADO',
        assignedBy: 'Dra. María Elena Abrego',
        assignedAt: '2026-07-28 09:00'
      });
    }

    // Sede Chiriquí Morning Shift (07:00 - 15:00)
    shifts.push({
      id: `sh-${day}-3`,
      staffId: day % 2 === 0 ? 'st-04' : 'st-05',
      staffName: day % 2 === 0 ? 'Lic. Manuel Rodríguez' : 'Lic. Yarisel Castillo',
      staffRole: 'Tecnólogo Médico',
      staffLicense: day % 2 === 0 ? 'TM-1092-PA' : 'TM-7731-PA',
      branchId: 'branch-david',
      branchName: 'Sede Chiriquí (David)',
      date: dateFormatted,
      shiftType: 'MANANA',
      shiftTypeName: 'Mañana (07:00 - 15:00)',
      startTime: '07:00',
      endTime: '15:00',
      section: 'Laboratorio Integral Chiriquí',
      status: 'CONFIRMADO',
      assignedBy: 'Dra. María Elena Abrego',
      assignedAt: '2026-07-28 09:00'
    });

    // Night Guards (Urgent Care) on specific days (Wednesdays & Saturdays)
    if (dayOfWeek === 3 || dayOfWeek === 6) {
      shifts.push({
        id: `sh-${day}-4`,
        staffId: day % 2 === 0 ? 'st-02' : 'st-03',
        staffName: day % 2 === 0 ? 'Lic. Sofía Guardia' : 'Lic. Roberto Abrego',
        staffRole: 'Tecnólogo Médico',
        staffLicense: day % 2 === 0 ? 'TM-5920-PA' : 'TM-2041-PA',
        branchId: 'branch-via-espana',
        branchName: 'Sede Vía España',
        date: dateFormatted,
        shiftType: 'NOCHE',
        shiftTypeName: 'Noche / Guardia (23:00 - 07:00)',
        startTime: '23:00',
        endTime: '07:00',
        section: 'Guardia de Urgencias 24h',
        status: 'CONFIRMADO',
        notes: 'Disponibilidad prioritaria para Banco de Sangre y Troponinas STAT',
        assignedBy: 'Dra. María Elena Abrego',
        assignedAt: '2026-07-28 09:00'
      });
    }

    // Reception & Flebotomy Shifts
    if (dayOfWeek !== 0) {
      shifts.push({
        id: `sh-${day}-5`,
        staffId: 'st-07',
        staffName: 'Ana Lucía Morales',
        staffRole: 'Recepcionista',
        branchId: 'branch-via-espana',
        branchName: 'Sede Vía España',
        date: dateFormatted,
        shiftType: 'MANANA',
        shiftTypeName: 'Mañana (07:00 - 15:00)',
        startTime: '07:00',
        endTime: '15:00',
        section: 'Recepción & Caja',
        status: 'CONFIRMADO',
        assignedBy: 'Dra. María Elena Abrego',
        assignedAt: '2026-07-28 09:00'
      });

      shifts.push({
        id: `sh-${day}-6`,
        staffId: 'st-08',
        staffName: 'Carlos Villalaz',
        staffRole: 'Técnico Flebotomista',
        branchId: 'branch-via-espana',
        branchName: 'Sede Vía España',
        date: dateFormatted,
        shiftType: 'MANANA',
        shiftTypeName: 'Mañana (07:00 - 15:00)',
        startTime: '07:00',
        endTime: '15:00',
        section: 'Toma de Muestras & Centrifugación',
        status: 'CONFIRMADO',
        assignedBy: 'Dra. María Elena Abrego',
        assignedAt: '2026-07-28 09:00'
      });
    }
  }

  return shifts;
};

export const ShiftManagementModule: React.FC = () => {
  // Calendar Month State (Default to August 2026)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 1-indexed (8 = August)

  // Filters State
  const [selectedBranchId, setSelectedBranchId] = useState<string>('TODAS');
  const [selectedRole, setSelectedRole] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'CALENDARIO' | 'PERSONAL' | 'COBERTURA' | 'ALERTAS'>('CALENDARIO');

  // Staff and Shift State
  const [staffList, setStaffList] = useState<StaffMember[]>(MOCK_STAFF);
  const [shifts, setShifts] = useState<WorkShift[]>(generateInitialShifts());

  // Modal / Drawer States
  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const [selectedDateForNewShift, setSelectedDateForNewShift] = useState<string>('2026-08-12');

  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);
  const [swapShift1, setSwapShift1] = useState<WorkShift | null>(null);
  const [swapStaff2Id, setSwapStaff2Id] = useState<string>('');

  // Form Fields for Shift Creation/Editing
  const [formStaffId, setFormStaffId] = useState<string>('st-02');
  const [formBranchId, setFormBranchId] = useState<string>('branch-via-espana');
  const [formDate, setFormDate] = useState<string>('2026-08-12');
  const [formShiftType, setFormShiftType] = useState<'MANANA' | 'TARDE' | 'NOCHE' | 'ON_CALL' | 'DESCANSO'>('MANANA');
  const [formSection, setFormSection] = useState<string>('Hematología & Química');
  const [formNotes, setFormNotes] = useState<string>('');

  // Month Names in Spanish
  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Calendar Calculation Helpers
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 0).getDate();
  }, [currentYear, currentMonth]);

  // First day of month offset (0 = Sunday, 1 = Monday...)
  const firstDayOfWeekOffset = useMemo(() => {
    const jsDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    // Convert to Monday-first grid: Monday=0, Tuesday=1, ..., Sunday=6
    return jsDay === 0 ? 6 : jsDay - 1;
  }, [currentYear, currentMonth]);

  // Filtered Shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      // Branch filter
      if (selectedBranchId !== 'TODAS' && s.branchId !== selectedBranchId) return false;
      // Role filter
      if (selectedRole !== 'TODOS') {
        const staff = staffList.find(st => st.id === s.staffId);
        if (staff && staff.role !== selectedRole) return false;
      }
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = s.staffName.toLowerCase().includes(term);
        const matchesBranch = s.branchName.toLowerCase().includes(term);
        const matchesSection = s.section.toLowerCase().includes(term);
        if (!matchesName && !matchesBranch && !matchesSection) return false;
      }
      return true;
    });
  }, [shifts, selectedBranchId, selectedRole, searchTerm, staffList]);

  // Handle Month Navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(8);
  };

  // Open New Shift Modal for a specific date
  const handleOpenNewShiftModal = (dateStr: string) => {
    setEditingShift(null);
    setFormDate(dateStr);
    setFormStaffId('st-02');
    setFormBranchId(selectedBranchId !== 'TODAS' ? selectedBranchId : 'branch-via-espana');
    setFormShiftType('MANANA');
    setFormSection('Hematología & Química');
    setFormNotes('');
    setIsShiftModalOpen(true);
  };

  // Open Edit Shift Modal
  const handleOpenEditShiftModal = (shift: WorkShift) => {
    setEditingShift(shift);
    setFormDate(shift.date);
    setFormStaffId(shift.staffId);
    setFormBranchId(shift.branchId);
    setFormShiftType(shift.shiftType);
    setFormSection(shift.section);
    setFormNotes(shift.notes || '');
    setIsShiftModalOpen(true);
  };

  // Save Shift (Create or Update)
  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffList.find(st => st.id === formStaffId);
    const branchNames: Record<string, string> = {
      'branch-via-espana': 'Sede Vía España',
      'branch-david': 'Sede Chiriquí (David)',
      'branch-costa-este': 'Sede Costa del Este',
      'branch-transistmica': 'Sede Transístmica'
    };

    const shiftTypeDetails = {
      'MANANA': { name: 'Mañana (07:00 - 15:00)', start: '07:00', end: '15:00' },
      'TARDE': { name: 'Tarde (15:00 - 23:00)', start: '15:00', end: '23:00' },
      'NOCHE': { name: 'Noche / Guardia (23:00 - 07:00)', start: '23:00', end: '07:00' },
      'ON_CALL': { name: 'Guardia Pasiva / Sobre-Llamado', start: '00:00', end: '24:00' },
      'DESCANSO': { name: 'Descanso / Vacaciones', start: '-', end: '-' }
    };

    const details = shiftTypeDetails[formShiftType];

    if (editingShift) {
      // Update existing
      setShifts(prev => prev.map(s => {
        if (s.id === editingShift.id) {
          return {
            ...s,
            staffId: formStaffId,
            staffName: staff ? staff.name : s.staffName,
            staffRole: staff ? staff.roleTitle : s.staffRole,
            staffLicense: staff?.licenseNumber,
            branchId: formBranchId,
            branchName: branchNames[formBranchId] || 'Sede Vía España',
            date: formDate,
            shiftType: formShiftType,
            shiftTypeName: details.name,
            startTime: details.start,
            endTime: details.end,
            section: formSection,
            notes: formNotes
          };
        }
        return s;
      }));
      alert('¡Turno de trabajo actualizado con éxito!');
    } else {
      // Create new
      const newShift: WorkShift = {
        id: `sh-custom-${Date.now()}`,
        staffId: formStaffId,
        staffName: staff ? staff.name : 'Personal Asignado',
        staffRole: staff ? staff.roleTitle : 'Tecnólogo Médico',
        staffLicense: staff?.licenseNumber,
        branchId: formBranchId,
        branchName: branchNames[formBranchId] || 'Sede Vía España',
        date: formDate,
        shiftType: formShiftType,
        shiftTypeName: details.name,
        startTime: details.start,
        endTime: details.end,
        section: formSection,
        status: 'CONFIRMADO',
        notes: formNotes,
        assignedBy: 'Dra. María Elena Abrego',
        assignedAt: new Date().toLocaleString()
      };

      setShifts(prev => [newShift, ...prev]);
      alert('¡Nuevo turno de trabajo asignado en el Roster!');
    }

    setIsShiftModalOpen(false);
  };

  // Delete Shift
  const handleDeleteShift = (shiftId: string) => {
    if (confirm('¿Está seguro de eliminar esta asignación de turno?')) {
      setShifts(prev => prev.filter(s => s.id !== shiftId));
      setIsShiftModalOpen(false);
    }
  };

  // Execute Shift Swap
  const handleExecuteSwap = () => {
    if (!swapShift1 || !swapStaff2Id) return;

    const staff2 = staffList.find(s => s.id === swapStaff2Id);
    if (!staff2) return;

    setShifts(prev => prev.map(s => {
      if (s.id === swapShift1.id) {
        return {
          ...s,
          staffId: staff2.id,
          staffName: staff2.name,
          staffRole: staff2.roleTitle,
          staffLicense: staff2.licenseNumber,
          status: 'INTERCAMBIADO',
          notes: `Turno cedido/intercambiado con ${swapShift1.staffName}.`
        };
      }
      return s;
    }));

    alert(`¡Intercambio de turno registrado exitosamente con ${staff2.name}! Auditoría actualizada.`);
    setIsSwapModalOpen(false);
  };

  // Shift Badge Helper Styling
  const getShiftBadgeStyle = (type: string) => {
    switch (type) {
      case 'MANANA':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25';
      case 'TARDE':
        return 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/25';
      case 'NOCHE':
        return 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25';
      case 'ON_CALL':
        return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25';
      case 'DESCANSO':
        return 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  const getShiftIcon = (type: string) => {
    switch (type) {
      case 'MANANA':
        return <Sun className="w-3 h-3 text-amber-400 shrink-0" />;
      case 'TARDE':
        return <Sunset className="w-3 h-3 text-indigo-400 shrink-0" />;
      case 'NOCHE':
        return <Moon className="w-3 h-3 text-rose-400 shrink-0" />;
      case 'ON_CALL':
        return <Zap className="w-3 h-3 text-emerald-400 shrink-0" />;
      case 'DESCANSO':
        return <Coffee className="w-3 h-3 text-slate-400 shrink-0" />;
      default:
        return <Clock className="w-3 h-3 text-slate-400 shrink-0" />;
    }
  };

  // Calculate Monthly KPIs
  const totalMonthShifts = filteredShifts.length;
  const activeTechMedsCount = staffList.filter(s => s.role === 'tech_med' && s.status === 'ACTIVO').length;
  const nightGuardsCount = filteredShifts.filter(s => s.shiftType === 'NOCHE').length;
  const coverageRate = 98.4; // %

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 border border-indigo-500/30 text-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-teal-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-teal-400 animate-pulse" />
              <span>Módulo de Recursos Humanos & Roster LIS (MINSA / ISO 15189)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Gestión de Turnos & Disponibilidad de Personal
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Planificación mensual de guardias, rotaciones en analizadores, asignación por sede y aseguramiento de cobertura médica idónea 24/7.
            </p>
          </div>

          {/* Action Quick Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenNewShiftModal('2026-08-12')}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs transition-all shadow-xl shadow-teal-500/20 flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Asignar Nuevo Turno</span>
            </button>

            <button
              onClick={() => setActiveTab('ALERTAS')}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold px-4 py-3 rounded-2xl text-xs transition shadow flex items-center space-x-2 cursor-pointer"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Alertas de Marcaje (Push/Email)</span>
            </button>

            <button
              onClick={() => {
                const firstShift = shifts[0];
                if (firstShift) {
                  setSwapShift1(firstShift);
                  setSwapStaff2Id('st-03');
                  setIsSwapModalOpen(true);
                }
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-4 py-3 rounded-2xl text-xs transition shadow flex items-center space-x-2 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 text-amber-400" />
              <span>Intercambio de Guardia</span>
            </button>

            <button
              onClick={() => alert('Generando reporte Roster Mensual en formato PDF/Excel para inspección de calidad e idoneidad MINSA...')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold p-3 rounded-2xl text-xs transition shadow cursor-pointer"
              title="Exportar Roster Auditable"
            >
              <Printer className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Top KPIs Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10 relative z-10">
          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Turnos este Mes</span>
            </div>
            <div className="text-2xl font-black font-mono text-white">{totalMonthShifts}</div>
            <div className="text-[10px] text-teal-400 font-bold">Planificación Agosto 2026</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Cobertura de Sedes</span>
            </div>
            <div className="text-2xl font-black font-mono text-teal-300">{coverageRate}%</div>
            <div className="text-[10px] text-slate-400 font-medium">Cumplimiento Cobertura 24/7</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tecnólogos Médicos Activos</span>
            </div>
            <div className="text-2xl font-black font-mono text-indigo-300">{activeTechMedsCount}</div>
            <div className="text-[10px] text-slate-400 font-medium">Con Idoneidad MINSA Vigente</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-1.5">
              <Moon className="w-3.5 h-3.5 text-rose-400" />
              <span>Guardias Nocturnas</span>
            </div>
            <div className="text-2xl font-black font-mono text-rose-300">{nightGuardsCount}</div>
            <div className="text-[10px] text-slate-400 font-medium">Urgencias Hospitalarias STAT</div>
          </div>
        </div>
      </div>

      {/* Main Controls & Filters Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Sub-module View Switcher Tabs */}
          <div className="flex flex-wrap items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1">
            <button
              onClick={() => setActiveTab('CALENDARIO')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-2 ${
                activeTab === 'CALENDARIO'
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Calendario Mensual</span>
            </button>

            <button
              onClick={() => setActiveTab('PERSONAL')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-2 ${
                activeTab === 'PERSONAL'
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Roster de Personal</span>
            </button>

            <button
              onClick={() => setActiveTab('ALERTAS')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-2 ${
                activeTab === 'ALERTAS'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Alertas de Marcaje & Continuidad (Push/Email)</span>
            </button>
          </div>

          {/* Month & Year Navigator */}
          {activeTab === 'CALENDARIO' && (
            <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800 px-4 py-2 rounded-2xl">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                title="Mes Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center min-w-[140px]">
                <span className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  {MONTH_NAMES[currentMonth - 1]} {currentYear}
                </span>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                title="Mes Siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleToday}
                className="ml-2 text-[10px] font-black bg-slate-800 hover:bg-slate-700 text-teal-400 px-2.5 py-1 rounded-lg border border-teal-500/30 transition cursor-pointer"
              >
                Hoy
              </button>
            </div>
          )}
        </div>

        {/* Filter Dropdowns Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          {/* Branch / Sede Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-1">
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Filtrar por Sede:</span>
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-bold focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="TODAS">📍 Todas las Sedes</option>
              <option value="branch-via-espana">🏥 Sede Vía España (Matriz)</option>
              <option value="branch-david">🏥 Sede Chiriquí (David)</option>
              <option value="branch-costa-este">🏥 Sede Costa del Este</option>
              <option value="branch-transistmica">🏥 Sede Transístmica</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Filtrar por Rol de Personal:</span>
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-bold focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="TODOS">👥 Todos los Perfiles</option>
              <option value="tech_med">🔬 Tecnólogos Médicos</option>
              <option value="lab_chief">🩺 Jefes & Médicos Patólogos</option>
              <option value="lab_tech">🩸 Técnicos & Flebotomistas</option>
              <option value="receptionist">💼 Recepcionistas & Admisión</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-1">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Buscar Personal o Sección:</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ej. Sofía, Hematología..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 font-bold placeholder-slate-600 focus:ring-2 focus:ring-teal-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main View 1: CALENDARIO MENSUAL */}
      {activeTab === 'CALENDARIO' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 overflow-x-auto">
          {/* Day Names Grid Header */}
          <div className="grid grid-cols-7 gap-2 min-w-[800px]">
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((dayName, idx) => (
              <div
                key={dayName}
                className={`text-center py-2 text-xs font-black uppercase tracking-wider rounded-xl border ${
                  idx >= 5
                    ? 'bg-rose-950/20 text-rose-300 border-rose-500/20'
                    : 'bg-slate-950/80 text-slate-300 border-slate-800'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Days Matrix Grid */}
          <div className="grid grid-cols-7 gap-2 min-w-[800px]">
            {/* Blank leading cells before day 1 */}
            {Array.from({ length: firstDayOfWeekOffset }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="bg-slate-950/30 border border-slate-800/40 rounded-2xl min-h-[140px] opacity-30 pointer-events-none p-2"
              ></div>
            ))}

            {/* Days 1 to daysInMonth */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
              const monthStr = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
              const fullDateStr = `${currentYear}-${monthStr}-${dayStr}`;

              const isToday = currentYear === 2026 && currentMonth === 8 && dayNum === 12;

              // Get shifts on this day
              const dayShifts = filteredShifts.filter(s => s.date === fullDateStr);

              // Check coverage: Does it have at least 1 tech_med assigned for morning/evening?
              const hasTechMedMorning = dayShifts.some(s => s.shiftType === 'MANANA' && (s.staffRole.includes('Tecnólogo') || s.staffRole.includes('Jefe')));

              return (
                <div
                  key={fullDateStr}
                  className={`border rounded-2xl p-2.5 min-h-[150px] flex flex-col justify-between transition group hover:border-teal-500/50 ${
                    isToday
                      ? 'bg-slate-900 border-teal-500/80 ring-2 ring-teal-500/20'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  {/* Cell Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 mb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-xs font-black font-mono rounded-lg px-2 py-0.5 ${
                        isToday ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-300'
                      }`}>
                        {dayNum}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-black uppercase text-teal-400">
                          Hoy
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenNewShiftModal(fullDateStr)}
                      className="p-1 rounded-lg text-slate-500 hover:text-teal-400 hover:bg-slate-800 transition cursor-pointer opacity-80 group-hover:opacity-100"
                      title="Asignar Turno en esta fecha"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Cell Content: Shift Badges */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[110px] scrollbar-none">
                    {dayShifts.length === 0 ? (
                      <div className="text-[10px] text-slate-600 italic text-center py-4">
                        Sin turnos
                      </div>
                    ) : (
                      dayShifts.map((shift) => (
                        <div
                          key={shift.id}
                          onClick={() => handleOpenEditShiftModal(shift)}
                          className={`p-1.5 rounded-xl border text-[10px] font-bold transition cursor-pointer flex flex-col space-y-0.5 ${getShiftBadgeStyle(shift.shiftType)}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate text-slate-100 font-extrabold flex items-center space-x-1">
                              {getShiftIcon(shift.shiftType)}
                              <span className="truncate">{shift.staffName.split(' ')[1] || shift.staffName}</span>
                            </span>
                            <span className="text-[8px] font-mono opacity-80 shrink-0">
                              {shift.startTime}
                            </span>
                          </div>

                          <div className="text-[8px] opacity-80 truncate flex items-center justify-between">
                            <span className="truncate">{shift.section}</span>
                            <span className="font-mono text-teal-300 ml-1">
                              {shift.branchName.includes('Chiriquí') ? 'CH' : 'VE'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Cell Bottom: Coverage Indicator */}
                  {!hasTechMedMorning && dayShifts.length > 0 && (
                    <div className="mt-1 pt-1 border-t border-rose-500/20 text-[8px] font-black text-rose-400 flex items-center justify-center space-x-1 bg-rose-950/30 rounded py-0.5">
                      <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                      <span>Sin Tecnólogo Am</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main View 2: ROSTER DE PERSONAL & DISPONIBILIDAD */}
      {activeTab === 'PERSONAL' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <Users className="w-5 h-5 text-teal-400" />
                <span>Directorio de Personal del Laboratorio & Disponibilidad Horaria</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verificación de horas contratadas, idoneidad profesional y turnos acumulados durante el periodo.
              </p>
            </div>
            <button
              onClick={() => handleOpenNewShiftModal('2026-08-12')}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Asignar Turno</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((member) => {
              // Calculate assigned shifts for this member
              const memberShifts = shifts.filter(s => s.staffId === member.id);
              const totalHoursMonth = memberShifts.length * 8; // approx 8h per shift

              return (
                <div
                  key={member.id}
                  className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-lg hover:border-teal-500/40 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 bg-indigo-600/30 border border-indigo-500/40 rounded-2xl flex items-center justify-center font-black text-indigo-300 text-sm">
                        {member.avatarInitials}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{member.name}</h4>
                        <div className="text-xs text-teal-400 font-medium">{member.roleTitle}</div>
                        {member.licenseNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Licencia: <strong className="text-slate-300">{member.licenseNumber}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      {member.status}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sede Principal:</span>
                      <span className="font-bold text-white">{member.branchName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Turnos Asignados:</span>
                      <span className="font-bold font-mono text-amber-300">{memberShifts.length} turnos</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Carga Horaria Mensual:</span>
                      <span className="font-bold font-mono text-teal-300">{totalHoursMonth} / {member.contractHoursMonth} hrs</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Especialidades:</div>
                    <div className="flex flex-wrap gap-1">
                      {member.specialties.map((spec) => (
                        <span key={spec} className="bg-slate-800 text-slate-300 text-[9px] px-2 py-0.5 rounded-md font-medium">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex gap-2">
                    <button
                      onClick={() => {
                        setFormStaffId(member.id);
                        handleOpenNewShiftModal('2026-08-12');
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Programar Turno</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: ALERTAS DE CONTINUIDAD & NOTIFICACIONES DE MARCAJE (ShiftAlertConfig) */}
      {activeTab === 'ALERTAS' && (
        <ShiftAlertConfig
          staffList={staffList}
          shifts={shifts}
          onTriggerOnCallSwap={(shiftId, backupStaffId) => {
            const backupStaff = staffList.find(s => s.id === backupStaffId);
            if (backupStaff) {
              setShifts(prev => prev.map(s => s.id === shiftId ? {
                ...s,
                staffId: backupStaff.id,
                staffName: backupStaff.name,
                staffRole: backupStaff.roleTitle,
                notes: `Reemplazo On-Call por ausencia de marcaje del titular.`
              } : s));
              alert(`¡Reemplazo On-Call asignado a ${backupStaff.name}!`);
            }
          }}
        />
      )}

      {/* Modal 1: Creación & Edición de Turnos */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-black text-white text-lg flex items-center space-x-2">
                <Clock className="w-5 h-5 text-teal-400" />
                <span>{editingShift ? 'Editar Asignación de Turno' : 'Asignar Nuevo Turno de Trabajo'}</span>
              </h3>
              <button
                onClick={() => setIsShiftModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-4 text-xs">
              {/* Staff Member Selector */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Personal / Empleado:</label>
                <select
                  value={formStaffId}
                  onChange={(e) => setFormStaffId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 font-bold focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  {staffList.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} — {st.roleTitle} ({st.licenseNumber || 'Sin licencia'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Selector */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Sede de Asignación:</label>
                <select
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 font-bold focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="branch-via-espana">🏥 Sede Vía España (Matriz)</option>
                  <option value="branch-david">🏥 Sede Chiriquí (David)</option>
                  <option value="branch-costa-este">🏥 Sede Costa del Este</option>
                  <option value="branch-transistmica">🏥 Sede Transístmica</option>
                </select>
              </div>

              {/* Date & Shift Type Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Fecha del Turno:</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 font-mono font-bold focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Horario / Horas:</label>
                  <select
                    value={formShiftType}
                    onChange={(e) => setFormShiftType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 font-bold focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="MANANA">☀️ Mañana (07:00 - 15:00)</option>
                    <option value="TARDE">🌆 Tarde (15:00 - 23:00)</option>
                    <option value="NOCHE">🌙 Noche / Guardia (23:00 - 07:00)</option>
                    <option value="ON_CALL">⚡ Guardia Pasiva (On-Call)</option>
                    <option value="DESCANSO">🏖️ Descanso / Vacaciones</option>
                  </select>
                </div>
              </div>

              {/* Section / Area Assignment */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Sección / Área de Responsabilidad:</label>
                <select
                  value={formSection}
                  onChange={(e) => setFormSection(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 font-bold focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="Hematología & Química">Hematología & Química Clínica</option>
                  <option value="Procesamiento General">Procesamiento General & Urgencias STAT</option>
                  <option value="Microbiología & Inmuno">Microbiología, Parasitología e Inmunología</option>
                  <option value="Recepción & Muestras">Toma de Muestras & Admisión Pacientes</option>
                  <option value="Guardia Urgencias 24h">Guardia de Urgencias Hospitalarias 24h</option>
                  <option value="Validación Médica">Validación Médica & Consultoría Patológica</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Instrucciones u Observaciones Especiales:</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Ej. A cargo del control Westgard en Sysmex XN-1000..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                {editingShift && (
                  <button
                    type="button"
                    onClick={() => handleDeleteShift(editingShift.id)}
                    className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold px-4 py-3 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-3 rounded-xl transition shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  {editingShift ? 'Guardar Cambios' : 'Asignar Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Intercambio de Guardias (Shift Swap) */}
      {isSwapModalOpen && swapShift1 && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-black text-white text-base flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                <span>Intercambio de Guardia / Reemplazo</span>
              </h3>
              <button onClick={() => setIsSwapModalOpen(false)} className="text-slate-400 hover:text-white text-lg font-bold">
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="text-slate-400">Turno Original:</div>
              <div className="font-bold text-white text-sm">{swapShift1.staffName} ({swapShift1.staffRole})</div>
              <div className="text-amber-300 font-mono">{swapShift1.date} — {swapShift1.shiftTypeName}</div>
              <div className="text-slate-400">{swapShift1.branchName} ({swapShift1.section})</div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300 block">Transferir / Reemplazar por:</label>
              <select
                value={swapStaff2Id}
                onChange={(e) => setSwapStaff2Id(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 font-bold focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                {staffList.filter(st => st.id !== swapShift1.staffId).map(st => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.roleTitle})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsSwapModalOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteSwap}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Confirmar Reemplazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
