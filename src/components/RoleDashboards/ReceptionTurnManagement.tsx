import React, { useState, useEffect, useMemo } from 'react';
import {
  QueueTicket,
  TurnCategory,
  TurnPriority,
  CATEGORY_DETAILS,
  turnService,
  ReceptionCounter
} from '../../utils/turnService';
import {
  Users,
  Clock,
  Zap,
  HeartHandshake,
  Baby,
  Timer,
  FileCheck,
  Plus,
  Volume2,
  Tv,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  UserCheck,
  Printer,
  ChevronRight,
  QrCode,
  Layers,
  RotateCw,
  Eye,
  Shield,
  Activity,
  AlertCircle,
  Maximize2,
  Minimize2,
  X,
  Radio,
  Building2,
  SlidersHorizontal,
  List,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Check
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useLisStore } from '../../store/useLisStore';
import { Pagination } from '../Pagination';

interface ReceptionTurnManagementProps {
  onSelectPatientForAdmission: (patientData: {
    firstName: string;
    secondName?: string;
    lastName: string;
    secondLastName?: string;
    nationalId: string;
    gender?: 'M' | 'F';
    age?: number;
    ticketId: string;
    ticketNumber: string;
    isStat?: boolean;
    isFasting?: boolean;
    notes?: string;
  }) => void;
  activeTicketId?: string | null;
}

export function parseFullName(rawName: string) {
  if (!rawName) return { firstName: '', secondName: '', lastName: '', secondLastName: '' };

  const clean = rawName.trim();

  // Case 1: 'Apellidos, Nombres' (e.g. 'Castillo, Ricardo' or 'Castillo Rodríguez, Ricardo José')
  if (clean.includes(',')) {
    const [lastPart, firstPart] = clean.split(',').map(s => s.trim());
    const lastTokens = (lastPart || '').split(/\s+/).filter(Boolean);
    const firstTokens = (firstPart || '').split(/\s+/).filter(Boolean);

    return {
      firstName: firstTokens[0] || '',
      secondName: firstTokens.slice(1).join(' ') || '',
      lastName: lastTokens[0] || '',
      secondLastName: lastTokens.slice(1).join(' ') || ''
    };
  }

  // Case 2: 'Nombres Apellidos' (e.g. 'Ricardo Castillo' or 'Ricardo Jose Castillo Rodriguez')
  const tokens = clean.split(/\s+/).filter(Boolean);
  if (tokens.length <= 1) {
    return { firstName: tokens[0] || '', secondName: '', lastName: '', secondLastName: '' };
  }
  if (tokens.length === 2) {
    return { firstName: tokens[0], secondName: '', lastName: tokens[1], secondLastName: '' };
  }
  if (tokens.length === 3) {
    return { firstName: tokens[0], secondName: tokens[1], lastName: tokens[2], secondLastName: '' };
  }
  return {
    firstName: tokens[0],
    secondName: tokens[1],
    lastName: tokens[2],
    secondLastName: tokens.slice(3).join(' ')
  };
}

export const ReceptionTurnManagement: React.FC<ReceptionTurnManagementProps> = ({
  onSelectPatientForAdmission,
  activeTicketId
}) => {
  const currentTenant = useLisStore(state => state.currentTenant);
  const currentBranch = useLisStore(state => state.currentBranch);
  const [tickets, setTickets] = useState<QueueTicket[]>(turnService.getTickets());
  const [counters, setCounters] = useState<ReceptionCounter[]>(turnService.getCounters());
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<TurnCategory | 'ALL'>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ESPERANDO' | 'TODOS' | 'HISTORIAL'>('ESPERANDO');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Counter for Calling
  const [activeCounterName, setActiveCounterName] = useState<string>('Ventanilla 1 (Admisión)');
  
  // Modals
  const [isDispenserModalOpen, setIsDispenserModalOpen] = useState(false);
  const [isTvDisplayModalOpen, setIsTvDisplayModalOpen] = useState(false);
  const [isCountersModalOpen, setIsCountersModalOpen] = useState(false);
  const [newCounterName, setNewCounterName] = useState('');
  const [newCounterType, setNewCounterType] = useState<ReceptionCounter['type']>('VENTANILLA_RECEPCION');
  const [newCounterStaff, setNewCounterStaff] = useState('');
  const [isAddingCounter, setIsAddingCounter] = useState(false);
  const [editingCounterId, setEditingCounterId] = useState<string | null>(null);
  const [editCounterName, setEditCounterName] = useState('');
  const [editCounterStaff, setEditCounterStaff] = useState('');
  const [editCounterType, setEditCounterType] = useState<ReceptionCounter['type']>('VENTANILLA_RECEPCION');
  const [lastPrintedTicket, setLastPrintedTicket] = useState<QueueTicket | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // High-Density Ergonomic View Mode & Collapsible Header for Fast-Paced Queues
  const [viewDensity, setViewDensity] = useState<'COMPACT' | 'CARDS'>('COMPACT');
  const [isTelemetryCollapsed, setIsTelemetryCollapsed] = useState(false);

  // Pagination for Queue Tickets (Optimized for High-Volume 100+ Patient Queues)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const formatWaitTime = (createdAt: string) => {
    try {
      const diffMs = Date.now() - new Date(createdAt).getTime();
      const mins = Math.max(0, Math.floor(diffMs / 60000));
      if (mins < 1) return '< 1 min';
      if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
      return `${mins} min`;
    } catch {
      return '-';
    }
  };

  // 1-second interval live clock for TV Mode
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Lock body & html scroll completely when TV modal is open
  useEffect(() => {
    if (isTvDisplayModalOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isTvDisplayModalOpen]);

  // Fullscreen change listener & F11 keyboard handler
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTvDisplayModalOpen && e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTvDisplayModalOpen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleCloseTvModal = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setIsTvDisplayModalOpen(false);
  };

  // New Ticket Form State
  const [dispenserCategory, setDispenserCategory] = useState<TurnCategory>('GENERAL');
  const [dispenserPatientName, setDispenserPatientName] = useState('');
  const [dispenserNationalId, setDispenserNationalId] = useState('');
  const [dispenserGender, setDispenserGender] = useState<'M' | 'F'>('M');
  const [dispenserAge, setDispenserAge] = useState<string>('');
  const [dispenserNotes, setDispenserNotes] = useState('');
  const [dispenserIsFasting, setDispenserIsFasting] = useState(true);
  const [dispenserIsPreferential, setDispenserIsPreferential] = useState(false);

  // Subscription
  useEffect(() => {
    const updateState = () => {
      setTickets(turnService.getTickets());
      setCounters(turnService.getCounters());
    };

    const unsubscribe = turnService.subscribe(updateState);
    return () => unsubscribe();
  }, []);

  // Sorted Queue Calculation
  const waitingTickets = useMemo(() => {
    return turnService.getSortedWaitingQueue(selectedCategoryFilter === 'ALL' ? undefined : selectedCategoryFilter);
  }, [tickets, selectedCategoryFilter]);

  const filteredTickets = useMemo(() => {
    let result = tickets;

    if (selectedStatusFilter === 'ESPERANDO') {
      result = result.filter(t => t.status === 'ESPERANDO' || t.status === 'LLAMANDO' || t.status === 'EN_ATENCION');
    } else if (selectedStatusFilter === 'HISTORIAL') {
      result = result.filter(t => t.status === 'ATENDIDO' || t.status === 'NO_PRESENTO' || t.status === 'CANCELADO');
    }

    if (selectedCategoryFilter !== 'ALL') {
      result = result.filter(t => t.category === selectedCategoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.ticketNumber.toLowerCase().includes(q) ||
        t.patientName.toLowerCase().includes(q) ||
        (t.patientNationalId && t.patientNationalId.includes(q))
      );
    }

    return result;
  }, [tickets, selectedStatusFilter, selectedCategoryFilter, searchQuery]);

  // Reset to first page when filtering or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatusFilter, selectedCategoryFilter, searchQuery]);

  // Sliced tickets for active page
  const paginatedTickets = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  // Metrics
  const stats = useMemo(() => {
    const waiting = tickets.filter(t => t.status === 'ESPERANDO' || t.status === 'LLAMANDO');
    const statCount = waiting.filter(t => t.priority === 'STAT_URGENTE').length;
    const prefCount = waiting.filter(t => t.priority === 'PREFERENCIAL').length;
    const genCount = waiting.filter(t => t.priority === 'NORMAL').length;
    const attendedToday = tickets.filter(t => t.status === 'ATENDIDO').length;

    // Average wait time
    const avgWait = waiting.length > 0 ? Math.round(waiting.reduce((acc, t) => acc + t.estimatedWaitMinutes, 0) / waiting.length) : 0;

    return {
      totalWaiting: waiting.length,
      statCount,
      prefCount,
      genCount,
      attendedToday,
      avgWait
    };
  }, [tickets]);

  // Handlers
  const handleCallNext = () => {
    const called = turnService.callNextTicket(activeCounterName, 'Recepción LIS');
    if (!called) {
      alert('No hay pacientes en espera en la cola.');
    }
  };

  const handleRecall = (ticket: QueueTicket) => {
    turnService.recallTicket(ticket.id, activeCounterName);
  };

  const handleStartAdmissionFromTurn = (ticket: QueueTicket) => {
    turnService.startAttention(ticket.id, activeCounterName, 'Recepción LIS');

    // Parse full name intelligently (handling "Apellido, Nombre" and "Nombre Apellido")
    const parsed = parseFullName(ticket.patientName);

    onSelectPatientForAdmission({
      firstName: parsed.firstName || 'Paciente',
      secondName: parsed.secondName,
      lastName: parsed.lastName || 'General',
      secondLastName: parsed.secondLastName,
      nationalId: ticket.patientNationalId || '',
      gender: ticket.patientGender,
      age: ticket.patientAge,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      isStat: ticket.priority === 'STAT_URGENTE',
      isFasting: ticket.isFasting,
      notes: ticket.notes
    });
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalCategory = dispenserCategory;
    let customPriority: TurnPriority | undefined = undefined;

    if (dispenserIsPreferential && dispenserCategory === 'GENERAL') {
      finalCategory = 'PREFERENCIAL';
      customPriority = 'PREFERENCIAL';
    }

    const created = turnService.createTicket({
      category: finalCategory,
      patientName: dispenserPatientName.trim() || 'Paciente en Espera',
      patientNationalId: dispenserNationalId.trim(),
      patientGender: dispenserGender,
      patientAge: dispenserAge ? parseInt(dispenserAge, 10) : undefined,
      notes: dispenserNotes.trim(),
      isFasting: dispenserIsFasting,
      customPriority
    });

    setLastPrintedTicket(created);
    setIsDispenserModalOpen(false);

    // Reset Form
    setDispenserPatientName('');
    setDispenserNationalId('');
    setDispenserAge('');
    setDispenserNotes('');
    setDispenserIsPreferential(false);
  };

  const lastCalled = useMemo(() => {
    const serviceLast = turnService.getLastCalledTicket();
    if (serviceLast) return serviceLast;

    const calling = tickets.filter(t => t.status === 'LLAMANDO');
    if (calling.length > 0) {
      return [...calling].sort((a, b) => new Date(b.calledAt || b.createdAt).getTime() - new Date(a.calledAt || a.createdAt).getTime())[0];
    }

    const attending = tickets.filter(t => t.status === 'EN_ATENCION');
    if (attending.length > 0) {
      return [...attending].sort((a, b) => new Date(b.attendedAt || b.calledAt || b.createdAt).getTime() - new Date(a.attendedAt || a.calledAt || a.createdAt).getTime())[0];
    }

    return null;
  }, [tickets]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* TOP STATS & QUICK CALL TOOLBAR (COLLAPSIBLE FOR ZERO SCROLL EFFICIENCY) */}
      {isTelemetryCollapsed ? (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center space-x-3 min-w-0 flex-wrap gap-y-2">
            <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-white/5">
              <Volume2 className="w-4 h-4 text-teal-400 shrink-0" />
              <select
                value={activeCounterName}
                onChange={(e) => setActiveCounterName(e.target.value)}
                className="bg-transparent text-xs font-black text-teal-300 outline-none cursor-pointer"
                title="Puesto de atención que llama"
              >
                {counters.map(c => (
                  <option key={c.id} value={c.name} className="bg-slate-950 text-white">
                    {c.status === 'ACTIVA' ? '🟢 ' : c.status === 'EN_PAUSA' ? '🟡 ' : '🔴 '} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {lastCalled ? (
              <div className="flex items-center space-x-2 text-xs truncate bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Atendiendo:</span>
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono font-black">{lastCalled.ticketNumber}</span>
                <span className="font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">{lastCalled.patientName}</span>
                <button
                  onClick={() => handleRecall(lastCalled)}
                  className="p-1 hover:bg-slate-800 text-teal-300 rounded transition cursor-pointer"
                  title="Rellamar paciente"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic bg-slate-950/40 px-3 py-1.5 rounded-xl border border-white/5">Sin turno llamado</span>
            )}
          </div>

          {/* Center Metrics Pill */}
          <div className="flex items-center space-x-3 text-xs font-bold text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/5">
            <span>En Espera: <strong className="text-white font-mono">{stats.totalWaiting}</strong></span>
            <span className="text-slate-600">•</span>
            <span>TAT: <strong className="text-amber-300 font-mono">{stats.avgWait}m</strong></span>
            <span className="text-slate-600">•</span>
            <span>Atendidos: <strong className="text-emerald-400 font-mono">{stats.attendedToday}</strong></span>
          </div>

          {/* Actions Group */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCallNext}
              disabled={waitingTickets.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-40 disabled:grayscale text-slate-950 font-black text-xs rounded-xl transition flex items-center space-x-1.5 shadow cursor-pointer active:scale-95"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Llamar Siguiente ({waitingTickets.length})</span>
            </button>

            <button
              onClick={() => setIsDispenserModalOpen(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl transition flex items-center space-x-1 cursor-pointer"
              title="Emitir nuevo turno en tótem"
            >
              <Plus className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Tótem</span>
            </button>

            <button
              onClick={() => setIsTvDisplayModalOpen(true)}
              className="p-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-xl transition cursor-pointer"
              title="Abrir TV Mode"
            >
              <Tv className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsTelemetryCollapsed(false)}
              className="px-3 py-2 text-xs text-teal-200 hover:text-white bg-teal-500/20 hover:bg-teal-500/30 rounded-xl font-black transition cursor-pointer flex items-center space-x-1.5 border border-teal-500/40 shadow-sm active:scale-95"
              title="Expandir tarjetas de telemetría y despacho"
            >
              <ChevronDown className="w-3.5 h-3.5 text-teal-400" />
              <span>Expandir</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Quick Call Action Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900/90 to-teal-950/40 border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="space-y-3 relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 shrink-0">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider truncate">Despachador de Turnos</h3>
                    <p className="text-[10px] text-slate-400 truncate">Prioridad: URGENCIA &gt; Ley 42 &gt; FIFO</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
                  <select
                    value={activeCounterName}
                    onChange={(e) => setActiveCounterName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-[10px] font-bold text-teal-300 outline-none focus:border-teal-500 cursor-pointer w-auto max-w-full sm:max-w-none"
                    title="Seleccionar puesto de atención que llama al paciente"
                  >
                    {counters.map(c => (
                      <option key={c.id} value={c.name} className="bg-slate-950 text-white">
                        {c.status === 'ACTIVA' ? '🟢 ' : c.status === 'EN_PAUSA' ? '🟡 ' : '🔴 '}
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setIsCountersModalOpen(true)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl text-[10px] font-bold text-slate-300 hover:text-white transition flex items-center space-x-1 cursor-pointer whitespace-nowrap shadow-sm shrink-0"
                    title="Gestionar Estado de Ventanillas y Módulos"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-teal-400 shrink-0" />
                    <span>Ventanillas ({counters.filter(c => c.status === 'ACTIVA').length}/{counters.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTelemetryCollapsed(true)}
                    className="p-1 sm:px-2 sm:py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl text-[10px] font-bold text-slate-400 hover:text-teal-300 transition flex items-center space-x-1 cursor-pointer whitespace-nowrap shadow-sm shrink-0"
                    title="Minimizar cabecera para máxima visibilidad de fila"
                  >
                    <ChevronUp className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span className="hidden xl:inline">Minimizar</span>
                  </button>
                </div>
              </div>

              {/* Current Call Display */}
              <div className="bg-slate-950/70 border border-white/5 rounded-2xl p-3.5 flex items-center justify-between">
                {lastCalled ? (
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] font-mono uppercase font-bold text-slate-400">Turno en Atención:</span>
                      <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {lastCalled.ticketNumber}
                      </span>
                      <span className="text-[9px] font-black uppercase text-rose-400">
                        {lastCalled.priority === 'STAT_URGENTE' ? '🚨 URGENCIA' : ''}
                      </span>
                    </div>
                    <div className="text-sm font-black text-white truncate">{lastCalled.patientName}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {lastCalled.counterName} • {CATEGORY_DETAILS[lastCalled.category].name}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs py-1">
                    Ningún turno llamado activamente en este momento.
                  </div>
                )}

                {lastCalled && (
                  <button
                    onClick={() => handleRecall(lastCalled)}
                    title="Re-llamar con Alerta Sonora y Voz"
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-teal-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer shadow"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rellamar</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5 relative z-10">
              <button
                onClick={handleCallNext}
                disabled={waitingTickets.length === 0}
                className="py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-40 disabled:grayscale text-slate-950 font-black text-xs rounded-2xl transition flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/20 cursor-pointer active:scale-95"
              >
                <Volume2 className="w-4 h-4" />
                <span>Llamar Siguiente ({waitingTickets.length})</span>
              </button>

              <button
                onClick={() => setIsDispenserModalOpen(true)}
                className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-black text-xs rounded-2xl transition flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 text-teal-400" />
                <span>Emitir Turno (Tótem)</span>
              </button>
            </div>
          </div>

          {/* Telemetry KPI Cards */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">En Espera</span>
                <Users className="w-4 h-4 text-teal-400" />
              </div>
              <div className="my-2">
                <div className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">{stats.totalWaiting}</div>
                <div className="text-xs text-slate-300 font-semibold mt-0.5">Pacientes en sala</div>
              </div>
              <div className="flex items-center space-x-1.5 pt-1.5 text-xs font-black border-t border-white/5">
                <span className="text-rose-400 tabular-nums">{stats.statCount} URGENCIA</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400 tabular-nums">{stats.prefCount} PREF</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">TAT Espera</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="my-2">
                <div className="text-3xl sm:text-4xl font-black text-amber-300 tabular-nums tracking-tight">{stats.avgWait}m</div>
                <div className="text-xs text-slate-300 font-semibold mt-0.5">Tiempo promedio</div>
              </div>
              <div className="text-xs text-emerald-400 font-bold pt-1.5 border-t border-white/5">✓ Meta &lt; 15 min</div>
            </div>

            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Atendidos Hoy</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="my-2">
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 tabular-nums tracking-tight">{stats.attendedToday}</div>
                <div className="text-xs text-slate-300 font-semibold mt-0.5">Órdenes generadas</div>
              </div>
              <div className="text-xs text-teal-400 font-bold pt-1.5 border-t border-white/5">100% Trazabilidad</div>
            </div>

            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Sala TV</span>
                <Tv className="w-4 h-4 text-sky-400" />
              </div>
              <div className="my-2">
                <div className="text-base sm:text-lg font-black text-white leading-tight">Pantalla de Espera</div>
                <div className="text-xs text-slate-300 font-semibold mt-0.5">Tótem multimedia</div>
              </div>
              <button
                onClick={() => setIsTvDisplayModalOpen(true)}
                className="w-full py-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 rounded-xl text-xs font-black uppercase transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 shadow"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Abrir TV Mode</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* FILTER TABS & SEARCH BAR */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Status View Toggle */}
          <div className="flex items-center p-1 bg-slate-950 rounded-2xl border border-white/5">
            {[
              { id: 'ESPERANDO', label: `En Espera & Box (${stats.totalWaiting})` },
              { id: 'TODOS', label: `Todos los Turnos (${tickets.length})` },
              { id: 'HISTORIAL', label: `Atendidos Hoy (${stats.attendedToday})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatusFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                  selectedStatusFilter === tab.id
                    ? 'bg-teal-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input & View Density Toggle */}
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar Turno, Paciente o Cédula..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-teal-500 transition"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-500 hover:text-white cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Density Toggle: Compact List (Zero Scroll) vs Cards Grid */}
            <div className="flex items-center p-1 bg-slate-950 rounded-2xl border border-white/5 shrink-0">
              <button
                type="button"
                onClick={() => setViewDensity('COMPACT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center space-x-1.5 cursor-pointer ${
                  viewDensity === 'COMPACT'
                    ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vista Compacta de Alto Rendimiento: Toda la fila en una sola pantalla sin scroll"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compacto</span>
              </button>
              <button
                type="button"
                onClick={() => setViewDensity('CARDS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center space-x-1.5 cursor-pointer ${
                  viewDensity === 'CARDS'
                    ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vista de Tarjetas grandes"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tarjetas</span>
              </button>
            </div>
          </div>

        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition cursor-pointer border ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-teal-500 text-slate-950 border-teal-400'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            Todas las Especialidades
          </button>

          {(Object.keys(CATEGORY_DETAILS) as TurnCategory[]).map(catKey => {
            const cat = CATEGORY_DETAILS[catKey];
            const isSelected = selectedCategoryFilter === catKey;
            const countInCat = tickets.filter(t => (t.status === 'ESPERANDO' || t.status === 'LLAMANDO') && t.category === catKey).length;

            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategoryFilter(catKey)}
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition flex items-center space-x-1.5 cursor-pointer border ${
                  isSelected
                    ? `${cat.bgColor} ${cat.color} ${cat.borderColor} shadow`
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span>{cat.name}</span>
                {countInCat > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${cat.badgeColor}`}>
                    {countInCat}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* QUEUE TICKETS LIST / CARDS */}
      {filteredTickets.length === 0 ? (
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-10 text-center text-slate-400 space-y-3">
          <Users className="w-10 h-10 mx-auto text-slate-600" />
          <h4 className="text-base font-bold text-white">No hay turnos registrados en esta vista</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Utilice el botón "Emitir Turno (Tótem)" para generar un ticket de atención al paciente o ajuste los filtros.
          </p>
          <button
            onClick={() => setIsDispenserModalOpen(true)}
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-2xl inline-flex items-center space-x-2 cursor-pointer shadow-lg shadow-teal-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Primer Turno</span>
          </button>
        </div>
      ) : viewDensity === 'COMPACT' ? (
        /* VISTA COMPACTA DE ALTA EFICIENCIA (CERO SCROLL PARA FILAS LARGAS) */
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-950/90 border-b border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-3.5"># Turno</th>
                  <th className="py-2.5 px-3">Prioridad</th>
                  <th className="py-2.5 px-3.5">Paciente & Cédula</th>
                  <th className="py-2.5 px-3">Especialidad</th>
                  <th className="py-2.5 px-3">Espera</th>
                  <th className="py-2.5 px-3">Puesto Asignado</th>
                  <th className="py-2.5 px-3.5 text-right">Acción Rápida Inmediata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {paginatedTickets.map((ticket, idx) => {
                  const cat = CATEGORY_DETAILS[ticket.category];
                  const isWaiting = ticket.status === 'ESPERANDO';
                  const isCalling = ticket.status === 'LLAMANDO';
                  const isInProgress = ticket.status === 'EN_ATENCION';
                  const isAttended = ticket.status === 'ATENDIDO';
                  const isNoShow = ticket.status === 'NO_PRESENTO';
                  const isSelectedActive = activeTicketId === ticket.id;

                  return (
                    <tr
                      key={ticket.id}
                      className={`transition-colors group ${
                        isSelectedActive
                          ? 'bg-teal-500/15 border-l-4 border-l-teal-400'
                          : isCalling
                          ? 'bg-rose-950/30 border-l-4 border-l-rose-500 animate-pulse'
                          : isInProgress
                          ? 'bg-teal-950/20 border-l-4 border-l-teal-500/60'
                          : isNoShow
                          ? 'bg-slate-950/40 opacity-50'
                          : isAttended
                          ? 'opacity-60 bg-slate-950/20'
                          : idx % 2 === 0
                          ? 'bg-slate-900/30 hover:bg-slate-800/40'
                          : 'bg-transparent hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Ticket Number Badge */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-xl font-mono font-black text-xs border shadow-sm ${cat.bgColor} ${cat.color} ${cat.borderColor}`}>
                          {ticket.ticketNumber}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {ticket.priority === 'STAT_URGENTE' ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] shadow-sm shadow-rose-500/30 animate-pulse flex items-center gap-1 w-max">
                            <span>🚨</span> URGENCIA
                          </span>
                        ) : ticket.priority === 'PREFERENCIAL' ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-[10px] flex items-center gap-1 w-max" title="Ley 42 Panamá">
                            <span>★</span> LEY 42
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold text-[10px] uppercase">
                            Rutina
                          </span>
                        )}
                      </td>

                      {/* Patient & ID */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-white group-hover:text-teal-200 transition text-xs truncate max-w-[200px]">
                            {ticket.patientName}
                          </span>
                          {ticket.isFasting && (
                            <span className="px-1.5 py-0.2 rounded bg-teal-500/15 text-teal-300 font-bold text-[9px] border border-teal-500/30 whitespace-nowrap">
                              Ayunas
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                          <span>{ticket.patientNationalId || 'Sin documento'}</span>
                          {ticket.patientAge && <span>• {ticket.patientAge} años</span>}
                          {ticket.notes && <span className="text-slate-500 truncate max-w-[120px]" title={ticket.notes}>• {ticket.notes}</span>}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-xs font-semibold text-slate-300">
                          {cat.name}
                        </span>
                      </td>

                      {/* Wait Time */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-xs font-mono font-bold text-amber-300">
                          {formatWaitTime(ticket.createdAt)}
                        </span>
                      </td>

                      {/* Counter */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isCalling || isInProgress ? (
                          <span className="text-teal-300 font-black text-xs flex items-center space-x-1">
                            <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                            <span>{ticket.counterName || activeCounterName}</span>
                          </span>
                        ) : ticket.counterName ? (
                          <span className="text-slate-300 text-xs font-medium">{ticket.counterName}</span>
                        ) : (
                          <span className="text-slate-500 text-xs italic">En espera</span>
                        )}
                      </td>

                      {/* Fast Row Actions */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isAttended ? (
                            <span className="text-emerald-400 font-bold text-xs flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{ticket.orderNumber || 'Completado'}</span>
                            </span>
                          ) : isNoShow ? (
                            <button
                              type="button"
                              onClick={() => {
                                turnService.requeueTicket(ticket.id);
                                setTickets(turnService.getTickets());
                              }}
                              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white rounded-lg font-bold text-xs transition cursor-pointer flex items-center space-x-1 border border-amber-500/30 shadow-sm"
                              title="Reincorporar turno a la fila"
                            >
                              <RotateCw className="w-3 h-3" />
                              <span>Reincorporar</span>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRecall(ticket)}
                                title="Llamar con voz y timbre"
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white rounded-lg transition cursor-pointer shadow-sm border border-white/5"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStartAdmissionFromTurn(ticket)}
                                className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition flex items-center space-x-1 shadow-md shadow-teal-500/20 cursor-pointer active:scale-95"
                                title="Atender de inmediato y crear orden"
                              >
                                <span>Atender</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  turnService.markNoShow(ticket.id);
                                  setTickets(turnService.getTickets());
                                }}
                                title="Marcar paciente ausente / se retiró"
                                className="p-1.5 bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer border border-white/5"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredTickets.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredTickets.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageSizeChange={setPageSize}
              itemLabel="turnos"
            />
          )}
        </div>
      ) : (
        /* VISTA DE TARJETAS (MODO EXPANDIDO) */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedTickets.map(ticket => {
            const cat = CATEGORY_DETAILS[ticket.category];
            const isWaiting = ticket.status === 'ESPERANDO';
            const isCalling = ticket.status === 'LLAMANDO';
            const isInProgress = ticket.status === 'EN_ATENCION';
            const isAttended = ticket.status === 'ATENDIDO';
            const isNoShow = ticket.status === 'NO_PRESENTO';
            const isSelectedActive = activeTicketId === ticket.id;

            return (
              <div
                key={ticket.id}
                className={`bg-slate-900/80 backdrop-blur-xl border rounded-3xl p-5 shadow-xl transition-all space-y-4 relative overflow-hidden flex flex-col justify-between ${
                  isSelectedActive
                    ? 'border-teal-500 ring-2 ring-teal-500/30'
                    : isCalling
                    ? 'border-rose-500/60 bg-rose-950/20 animate-pulse'
                    : isInProgress
                    ? 'border-teal-500/40 bg-teal-950/20'
                    : isAttended
                    ? 'border-white/5 opacity-70'
                    : isNoShow
                    ? 'border-rose-500/20 bg-slate-950/60 opacity-60'
                    : 'border-white/5 hover:border-white/20'
                }`}
              >
                {/* Header of Ticket Card */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    
                    <div className="flex items-center space-x-2.5">
                      <div className={`px-3 py-1 rounded-2xl font-mono font-black text-base border shadow ${cat.bgColor} ${cat.color} ${cat.borderColor}`}>
                        {ticket.ticketNumber}
                      </div>

                      <div>
                        <div className="text-[10px] font-black uppercase text-slate-400">{cat.name}</div>
                        <div className="text-[10px] font-semibold text-slate-400 tabular-nums">
                          {new Date(ticket.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end space-y-1">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          isCalling
                            ? 'bg-rose-500 text-white border-rose-400 animate-bounce'
                            : isInProgress
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                            : isAttended
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isNoShow
                            ? 'bg-rose-950/40 text-rose-300 border-rose-500/40'
                            : ticket.priority === 'STAT_URGENTE'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                            : ticket.priority === 'PREFERENCIAL'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {isCalling
                          ? '🔊 LLAMANDO'
                          : isInProgress
                          ? 'EN ATENCIÓN'
                          : isAttended
                          ? '✓ ATENDIDO'
                          : isNoShow
                          ? '✕ NO SE PRESENTÓ'
                          : ticket.priority === 'STAT_URGENTE'
                          ? '🚨 URGENCIA'
                          : ticket.priority === 'PREFERENCIAL'
                          ? '★ PREFERENCIAL'
                          : 'EN ESPERA'}
                      </span>

                      {ticket.priority === 'PREFERENCIAL' && (
                        <span className="text-[8px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">
                          Ley 42 Panamá
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Patient Info */}
                  <div className="pt-2">
                    <h4 className="text-sm font-black text-white truncate">{ticket.patientName}</h4>
                    <div className="flex items-center space-x-3 text-[10px] text-slate-400 mt-0.5">
                      {ticket.patientNationalId ? (
                        <span>Cédula: <strong className="text-slate-300 font-mono">{ticket.patientNationalId}</strong></span>
                      ) : (
                        <span className="italic text-slate-500">Sin documento</span>
                      )}
                      {ticket.patientAge && (
                        <span>• {ticket.patientAge} años</span>
                      )}
                      {ticket.isFasting && (
                        <span className="text-teal-400 font-bold">• En Ayunas</span>
                      )}
                    </div>
                  </div>

                  {ticket.notes && (
                    <div className="p-2 bg-slate-950/60 border border-white/5 rounded-xl text-[10px] text-slate-300 leading-relaxed">
                      💬 {ticket.notes}
                    </div>
                  )}

                  {ticket.counterName && (
                    <div className="text-[10px] font-bold text-teal-300 flex items-center space-x-1">
                      <Radio className="w-3 h-3 text-teal-400 animate-pulse" />
                      <span>Asignado a: {ticket.counterName}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  
                  {isAttended ? (
                    <div className="w-full flex items-center justify-between text-[10px] text-slate-400">
                      <span>Completado a las {new Date(ticket.completedAt || ticket.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                      {ticket.orderNumber && (
                        <span className="font-mono text-teal-300 font-bold">{ticket.orderNumber}</span>
                      )}
                    </div>
                  ) : isNoShow ? (
                    <div className="w-full flex items-center justify-between text-[10px] pt-0.5">
                      <span className="text-rose-400 font-bold flex items-center space-x-1.5">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Paciente Ausente / Retirado</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          turnService.requeueTicket(ticket.id);
                          setTickets(turnService.getTickets());
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white rounded-xl font-bold text-[10px] transition cursor-pointer flex items-center space-x-1 border border-slate-700 hover:border-teal-500/50 shadow"
                        title="Reincorporar turno a la fila si el paciente regresó"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Reincorporar a Fila</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRecall(ticket)}
                        title="Llamar o Re-llamar al paciente por altavoz"
                        className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-teal-300 hover:text-white rounded-2xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleStartAdmissionFromTurn(ticket)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-2xl transition flex items-center justify-center space-x-1.5 shadow-md shadow-teal-500/20 cursor-pointer active:scale-95"
                      >
                        <span>Atender & Crear Orden</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          turnService.markNoShow(ticket.id);
                          setTickets(turnService.getTickets());
                        }}
                        title="Marcar como Paciente Ausente / Se fue o no se presentó"
                        className="p-2.5 bg-slate-950 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 rounded-2xl transition flex items-center justify-center cursor-pointer group shadow"
                      >
                        <XCircle className="w-4 h-4 text-slate-400 group-hover:text-rose-400 transition" />
                      </button>
                    </>
                  )}

                </div>

              </div>
            );
          })}
        </div>

        {filteredTickets.length > 0 && (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredTickets.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              pageSizeOptions={[9, 18, 36, 90]}
              onPageSizeChange={setPageSize}
              itemLabel="turnos"
            />
          </div>
        )}
      </div>
    )}

      {/* DISPENSER MODAL (TÓTEM DIGITAL DE EMISIÓN DE TURNOS) */}
      {isDispenserModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[150] flex items-center justify-center p-3 sm:p-5 overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-teal-500/40 rounded-[2rem] sm:rounded-[2.5rem] max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-4 sm:space-y-5 text-slate-100 relative my-auto max-h-[92vh] flex flex-col">
            
            <div className="flex items-start justify-between border-b border-white/10 pb-3 shrink-0">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    Dispensador Inteligente
                  </span>
                  <span className="text-[10px] text-slate-400">ISO 15189 / Ley 42 Panamá</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1 flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-teal-400" />
                  <span>Emisión de Turno de Atención</span>
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsDispenserModalOpen(false)}
                className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="flex-1 overflow-y-auto custom-scrollbar pr-1.5 space-y-4 min-h-0">
              
              {/* Category Selector Grid */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                  1. Seleccione la Especialidad / Tipo de Servicio:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(Object.keys(CATEGORY_DETAILS) as TurnCategory[]).map(catKey => {
                    const cat = CATEGORY_DETAILS[catKey];
                    const isSelected = dispenserCategory === catKey;

                    return (
                      <button
                        type="button"
                        key={catKey}
                        onClick={() => setDispenserCategory(catKey)}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between space-y-1 cursor-pointer ${
                          isSelected
                            ? `${cat.bgColor} ${cat.borderColor} ring-2 ring-teal-500/40 shadow-lg`
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${cat.badgeColor}`}>
                            {cat.shortCode}
                          </span>
                          {cat.defaultPriority === 'STAT_URGENTE' && (
                            <Zap className="w-3 h-3 text-rose-400 animate-pulse" />
                          )}
                        </div>
                        <div className={`text-xs font-black ${isSelected ? cat.color : 'text-white'}`}>
                          {cat.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ley 42 Preferential Toggle */}
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <HeartHandshake className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-xs font-black text-amber-200">Ley 42 Panamá: Trato Preferencial</div>
                    <div className="text-[10px] text-amber-300/80">Aplica a adultos mayores (+60), embarazadas y personas con movilidad reducida.</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDispenserIsPreferential(!dispenserIsPreferential)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    dispenserIsPreferential ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-all absolute top-1 ${
                      dispenserIsPreferential ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Patient Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    Nombre Completo del Paciente:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carmen Abrego"
                    value={dispenserPatientName}
                    onChange={(e) => setDispenserPatientName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    Cédula / Pasaporte (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 8-123-4567"
                    value={dispenserNationalId}
                    onChange={(e) => setDispenserNationalId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white font-mono outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    Edad Estimada:
                  </label>
                  <input
                    type="number"
                    placeholder="Ej. 34"
                    value={dispenserAge}
                    onChange={(e) => setDispenserAge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-5">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dispenserIsFasting}
                      onChange={(e) => setDispenserIsFasting(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-teal-500 focus:ring-0"
                    />
                    <span>Paciente en Ayunas</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Notas Clínicas / Observaciones de Ingreso:
                </label>
                <input
                  type="text"
                  placeholder="Ej. En silla de ruedas / Muestra pediátrica con técnica de micro-extracción"
                  value={dispenserNotes}
                  onChange={(e) => setDispenserNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs text-white outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDispenserModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-2xl transition flex items-center space-x-2 shadow-lg shadow-teal-500/25 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Emitir Ticket de Turno</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* COUNTERS & BOXES MANAGEMENT MODAL */}
      {isCountersModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white uppercase tracking-tight">Control de Ventanillas & Boxes</h2>
                  <p className="text-xs text-slate-400">Activa, pausa o agrega puestos de atención al paciente</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsCountersModalOpen(false); setIsAddingCounter(false); }}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Counter List */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
              {counters.map((c) => {
                const isActive = c.status === 'ACTIVA';
                const isPaused = c.status === 'EN_PAUSA';
                const isClosed = c.status === 'CERRADA';

                if (editingCounterId === c.id) {
                  return (
                    <div key={c.id} className="p-4 rounded-2xl border border-teal-500/50 bg-slate-950/90 space-y-3 shadow-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-teal-300 uppercase flex items-center space-x-1.5">
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Editar Ventanilla / Puesto</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingCounterId(null)}
                          className="text-slate-400 hover:text-white p-1"
                          title="Cerrar edición"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Nombre de la Ventanilla:</label>
                          <input
                            type="text"
                            value={editCounterName}
                            onChange={(e) => setEditCounterName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 focus:border-teal-400 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                            placeholder="Ej. Ventanilla 1 (Admisión)"
                            autoFocus
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Personal Asignado:</label>
                          <input
                            type="text"
                            value={editCounterStaff}
                            onChange={(e) => setEditCounterStaff(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 focus:border-teal-400 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                            placeholder="Ej. Lic. Roberto Chen"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Tipo de Área:</label>
                          <select
                            value={editCounterType}
                            onChange={(e) => setEditCounterType(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-700 focus:border-teal-400 rounded-xl px-3 py-1.5 text-xs text-teal-300 outline-none"
                          >
                            <option value="VENTANILLA_RECEPCION">Ventanilla Recepción / Admisión</option>
                            <option value="BOX_FLEBOTOMIA">Módulo / Box de Flebotomía</option>
                            <option value="BOX_PEDIATRICO">Box Pediátrico / Pruebas Especiales</option>
                            <option value="ENTREGA_RESULTADOS">Entrega de Resultados</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-1 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => setEditingCounterId(null)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!editCounterName.trim()) return;
                            const oldName = c.name;
                            turnService.updateCounter(c.id, {
                              name: editCounterName.trim(),
                              assignedStaff: editCounterStaff.trim() || undefined,
                              type: editCounterType
                            });
                            if (activeCounterName === oldName) {
                              setActiveCounterName(editCounterName.trim());
                            }
                            setCounters(turnService.getCounters());
                            setEditingCounterId(null);
                          }}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-1 shadow-md shadow-teal-500/20"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Guardar Cambios</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                      isActive
                        ? 'bg-teal-950/30 border-teal-500/30'
                        : isPaused
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-slate-950/60 border-white/5 opacity-60'
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-teal-400 animate-pulse' : isPaused ? 'bg-amber-400' : 'bg-slate-600'}`} />
                        <h4 className="text-sm font-black text-white truncate">{c.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          isActive
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                            : isPaused
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                        <span>Personal: <strong className="text-slate-300">{c.assignedStaff || 'Sin asignar'}</strong></span>
                        {c.currentTicketNumber && (
                          <>
                            <span>•</span>
                            <span className="text-teal-300 font-mono font-bold">Turno: {c.currentTicketNumber}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action & Status Toggle Buttons */}
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          turnService.setCounterStatus(c.id, 'ACTIVA');
                          setCounters(turnService.getCounters());
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black transition cursor-pointer ${
                          isActive
                            ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                        }`}
                        title="Activar Ventanilla"
                      >
                        Activa
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          turnService.setCounterStatus(c.id, 'EN_PAUSA');
                          setCounters(turnService.getCounters());
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black transition cursor-pointer ${
                          isPaused
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                        }`}
                        title="Poner en Pausa"
                      >
                        Pausa
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          turnService.setCounterStatus(c.id, 'CERRADA');
                          setCounters(turnService.getCounters());
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black transition cursor-pointer ${
                          isClosed
                            ? 'bg-rose-500/80 text-white shadow-md shadow-rose-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                        }`}
                        title="Cerrar Ventanilla"
                      >
                        Cerrar
                      </button>

                      {/* Edit Counter Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCounterId(c.id);
                          setEditCounterName(c.name);
                          setEditCounterStaff(c.assignedStaff || '');
                          setEditCounterType(c.type);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-teal-500/20 text-slate-400 hover:text-teal-300 rounded-xl transition cursor-pointer border border-white/5"
                        title="Editar nombre y configuración de ventanilla"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Counter Button */}
                      {counters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Desea eliminar la ventanilla "${c.name}"?`)) {
                              turnService.deleteCounter(c.id);
                              const updated = turnService.getCounters();
                              setCounters(updated);
                              if (activeCounterName === c.name && updated.length > 0) {
                                setActiveCounterName(updated[0].name);
                              }
                            }
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-xl transition cursor-pointer border border-white/5"
                          title="Eliminar ventanilla"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Counter Section */}
            {isAddingCounter ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newCounterName.trim()) return;
                  turnService.addCounter(newCounterName.trim(), newCounterType, newCounterStaff.trim() || undefined);
                  setCounters(turnService.getCounters());
                  setNewCounterName('');
                  setNewCounterStaff('');
                  setIsAddingCounter(false);
                }}
                className="p-4 bg-slate-950/80 border border-teal-500/30 rounded-2xl space-y-3 animate-in fade-in duration-200"
              >
                <div className="text-xs font-black text-teal-300 uppercase">Nueva Ventanilla o Box</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Nombre del Puesto:</label>
                    <input
                      type="text"
                      placeholder="Ej. Ventanilla 3 (Admisión)"
                      value={newCounterName}
                      onChange={(e) => setNewCounterName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-teal-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Tipo de Área:</label>
                    <select
                      value={newCounterType}
                      onChange={(e) => setNewCounterType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-teal-300 outline-none focus:border-teal-400"
                    >
                      <option value="VENTANILLA_RECEPCION">Ventanilla Recepción / Admisión</option>
                      <option value="BOX_FLEBOTOMIA">Box de Flebotomía</option>
                      <option value="BOX_PEDIATRICO">Box Pediátrico & Especiales</option>
                      <option value="ENTREGA_RESULTADOS">Entrega de Resultados</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Personal Asignado (Opcional):</label>
                  <input
                    type="text"
                    placeholder="Ej. Lic. Carlos Vega (TM-LIS)"
                    value={newCounterStaff}
                    onChange={(e) => setNewCounterStaff(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-teal-400"
                  />
                </div>
                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingCounter(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs rounded-xl font-black shadow cursor-pointer"
                  >
                    Guardar Ventanilla
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingCounter(true)}
                className="w-full py-2.5 border border-dashed border-teal-500/40 hover:border-teal-400/80 bg-teal-500/5 hover:bg-teal-500/10 rounded-2xl text-xs font-bold text-teal-300 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Nueva Ventanilla o Box</span>
              </button>
            )}

            {/* Modal Footer */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>{counters.filter(c => c.status === 'ACTIVA').length} de {counters.length} activas</span>
              <button
                type="button"
                onClick={() => { setIsCountersModalOpen(false); setIsAddingCounter(false); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLIC TV DISPLAY MODE (SALA DE ESPERA / PANTALLA TOTEM) */}
      {isTvDisplayModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 w-screen h-screen max-w-screen max-h-screen z-[999999] bg-slate-950 text-white flex flex-col p-4 sm:p-6 lg:p-7 select-none overflow-hidden"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            overflow: 'hidden',
            margin: 0,
            zIndex: 999999
          }}
        >
          {/* TV Header with Laboratory Name & Clinical Area */}
          <div className="shrink-0 flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-teal-500/20 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <h1 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white drop-shadow">
                    {currentTenant?.name || 'Laboratorio Clínico San José'}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono">
                    {currentBranch?.code || 'VE-01'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-teal-300/90 font-medium flex items-center space-x-1.5 pt-0.5">
                  <span className="font-bold text-white uppercase tracking-wider">Área:</span>
                  <span className="text-teal-200">Admisión, Toma de Muestras y Flebotomía</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 font-normal">{currentBranch?.name || 'Sede Vía España'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-black text-teal-400 tracking-tight tabular-nums drop-shadow">
                  {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest font-bold flex items-center justify-end space-x-1.5 pt-0.5">
                  <span>Tiempo Real • Panamá</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseTvModal}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-xl text-xs font-bold text-slate-300 transition cursor-pointer flex items-center space-x-1.5 active:scale-95 shadow"
                title="Cerrar TV Mode (Esc)"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cerrar TV Mode</span>
              </button>
            </div>
          </div>

          {/* TV Main Grid (Fits 100% viewport without any scrollbar) */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-5 py-2 lg:py-3">
            
            {/* BIG CALLED TICKET DISPLAY */}
            <div className="lg:col-span-8 h-full bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 border-2 border-teal-500/50 rounded-3xl p-5 lg:p-7 shadow-[0_0_80px_rgba(20,184,166,0.12)] flex flex-col justify-between text-center relative overflow-hidden">
              <div className="space-y-2 lg:space-y-3">
                <span className="px-4 py-1 rounded-full text-[11px] font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40 inline-flex items-center space-x-2">
                  <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                  <span>TURNO LLAMADO ACTUALMENTE</span>
                </span>

                {lastCalled ? (
                  <div className="space-y-1.5 lg:space-y-2">
                    <div className="text-6xl sm:text-7xl lg:text-8xl font-black font-mono tracking-tighter text-white drop-shadow-2xl my-1 sm:my-2">
                      {lastCalled.ticketNumber}
                    </div>

                    <div className="text-2xl sm:text-3xl font-black text-teal-300 uppercase tracking-tight truncate max-w-full px-3">
                      {lastCalled.patientName}
                    </div>

                    <div className="text-lg sm:text-2xl font-bold text-amber-400 flex items-center justify-center space-x-2.5 pt-1">
                      <span className="tracking-wide">FAVOR PASAR A:</span>
                      <strong className="underline uppercase tracking-wider">{lastCalled.counterName || 'Ventanilla 1 (Admisión)'}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 lg:py-16 text-slate-500 text-lg lg:text-xl font-bold">
                    Esperando próximo llamado de turno...
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/10 text-xs text-slate-400 flex items-center justify-center space-x-2">
                <span>Favor presentar su documento de identidad personal y orden médica al ingresar.</span>
              </div>
            </div>

            {/* RECENT CALLS HISTORY */}
            <div className="lg:col-span-4 h-full bg-slate-900/60 border border-white/10 rounded-3xl p-4 lg:p-5 flex flex-col justify-between overflow-hidden space-y-2.5">
              <div className="flex-1 min-h-0 flex flex-col">
                <h3 className="text-xs sm:text-sm font-black text-slate-300 uppercase tracking-wider mb-2.5 flex items-center space-x-2 shrink-0">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span>Últimos Turnos Llamados</span>
                </h3>

                <div className="flex-1 min-h-0 space-y-2 overflow-hidden">
                  {tickets
                    .filter(t => t.calledAt || t.status === 'LLAMANDO' || t.status === 'EN_ATENCION' || t.status === 'ATENDIDO')
                    .sort((a, b) => {
                      const timeA = new Date(a.calledAt || a.attendedAt || a.createdAt).getTime();
                      const timeB = new Date(b.calledAt || b.attendedAt || b.createdAt).getTime();
                      return timeB - timeA;
                    })
                    .slice(0, 4)
                    .map(t => (
                      <div
                        key={t.id}
                        className="p-2.5 bg-slate-950/80 border border-white/5 rounded-2xl flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-sm sm:text-base font-black font-mono text-teal-300">{t.ticketNumber}</div>
                          <div className="text-xs text-white font-bold truncate max-w-[140px]">{t.patientName}</div>
                        </div>
                        <div className="text-right text-[11px] font-bold text-amber-300 shrink-0">
                          {t.counterName || 'Box Flebotomía'}
                        </div>
                      </div>
                    ))}
                  {tickets.filter(t => t.status === 'LLAMANDO' || t.status === 'EN_ATENCION' || t.status === 'ATENDIDO').length === 0 && (
                    <div className="text-center py-6 text-slate-500 text-xs font-medium">
                      No hay turnos previos registrados en la sesión actual.
                    </div>
                  )}
                </div>
              </div>

              {/* Informative Footer Ticker */}
              <div className="shrink-0 p-2.5 bg-teal-950/40 border border-teal-500/30 rounded-2xl text-center space-y-0.5">
                <div className="text-xs font-black text-teal-300 uppercase">Atención Preferencial Ley 42</div>
                <div className="text-[10px] text-slate-400">Prioridad garantizada a adultos mayores (+60), embarazadas y personas con discapacidad.</div>
              </div>
            </div>

          </div>

          {/* TV Footer */}
          <div className="shrink-0 border-t border-white/10 pt-2.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>LISCore Healthcare Systems • Sala de Espera Pantalla Totem</span>
            <span>Garantía de Confidencialidad y Custodia de Datos Ley 81 de Panamá</span>
          </div>

        </div>,
        document.body
      )}

    </div>
  );
};
