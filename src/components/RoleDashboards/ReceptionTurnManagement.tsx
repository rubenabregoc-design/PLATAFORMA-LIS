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
  X,
  Radio
} from 'lucide-react';

interface ReceptionTurnManagementProps {
  onSelectPatientForAdmission: (patientData: {
    firstName: string;
    lastName: string;
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

export const ReceptionTurnManagement: React.FC<ReceptionTurnManagementProps> = ({
  onSelectPatientForAdmission,
  activeTicketId
}) => {
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
  const [lastPrintedTicket, setLastPrintedTicket] = useState<QueueTicket | null>(null);

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

    // Split name into first and last
    const nameParts = ticket.patientName.split(' ');
    const firstName = nameParts[0] || 'Paciente';
    const lastName = nameParts.slice(1).join(' ') || 'General';

    onSelectPatientForAdmission({
      firstName,
      lastName,
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

  const lastCalled = turnService.getLastCalledTicket() || tickets.find(t => t.status === 'LLAMANDO' || t.status === 'EN_ATENCION');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* TOP STATS & QUICK CALL TOOLBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Quick Call Action Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900/90 to-teal-950/40 border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Despachador de Turnos</h3>
                  <p className="text-[10px] text-slate-400">Algoritmo de Prioridad: STAT &gt; Ley 42 &gt; FIFO</p>
                </div>
              </div>

              <select
                value={activeCounterName}
                onChange={(e) => setActiveCounterName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-[10px] font-bold text-teal-300 outline-none focus:border-teal-500 cursor-pointer"
              >
                {counters.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
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
                      {lastCalled.priority === 'STAT_URGENTE' ? '🚨 STAT' : ''}
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
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-4 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">En Espera</span>
              <Users className="w-4 h-4 text-teal-400" />
            </div>
            <div className="my-1">
              <div className="text-3xl font-black text-white font-mono">{stats.totalWaiting}</div>
              <div className="text-[9px] text-slate-400 font-medium">Pacientes en sala</div>
            </div>
            <div className="flex items-center space-x-1 pt-1 text-[9px] font-bold">
              <span className="text-rose-400 font-mono">{stats.statCount} STAT</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-mono">{stats.prefCount} PREF</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-4 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">TAT Espera</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="my-1">
              <div className="text-3xl font-black text-amber-300 font-mono">{stats.avgWait}m</div>
              <div className="text-[9px] text-slate-400 font-medium">Tiempo promedio</div>
            </div>
            <div className="text-[9px] text-emerald-400 font-bold">✓ Meta &lt; 15 min</div>
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-4 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Atendidos Hoy</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="my-1">
              <div className="text-3xl font-black text-emerald-400 font-mono">{stats.attendedToday}</div>
              <div className="text-[9px] text-slate-400 font-medium">Órdenes generadas</div>
            </div>
            <div className="text-[9px] text-slate-400 font-bold">100% Trazabilidad</div>
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-4 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Sala TV</span>
              <Tv className="w-4 h-4 text-sky-400" />
            </div>
            <div className="my-1">
              <div className="text-sm font-black text-white leading-tight">Pantalla de Espera</div>
              <div className="text-[9px] text-slate-400">Totem multimedia</div>
            </div>
            <button
              onClick={() => setIsTvDisplayModalOpen(true)}
              className="w-full py-1.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 rounded-xl text-[10px] font-black uppercase transition flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Abrir TV Mode</span>
            </button>
          </div>

        </div>

      </div>

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

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por Turno (LAB-001), Paciente o Cédula..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-teal-500 transition"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTickets.length === 0 ? (
          <div className="col-span-full bg-slate-900/40 border border-white/5 rounded-3xl p-12 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-600" />
            <h4 className="text-base font-bold text-white">No hay turnos registrados en esta vista</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Utilice el botón "Emitir Turno (Tótem)" para generar un ticket de atención al paciente o cambie los filtros.
            </p>
            <button
              onClick={() => setIsDispenserModalOpen(true)}
              className="px-5 py-2.5 bg-teal-500 text-slate-950 font-black text-xs rounded-2xl inline-flex items-center space-x-2 cursor-pointer shadow-lg shadow-teal-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Emitir Primer Turno</span>
            </button>
          </div>
        ) : (
          filteredTickets.map(ticket => {
            const cat = CATEGORY_DETAILS[ticket.category];
            const isWaiting = ticket.status === 'ESPERANDO';
            const isCalling = ticket.status === 'LLAMANDO';
            const isInProgress = ticket.status === 'EN_ATENCION';
            const isAttended = ticket.status === 'ATENDIDO';
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
                        <div className="text-[9px] font-mono text-slate-500">
                          {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                          : ticket.priority === 'STAT_URGENTE'
                          ? '🚨 URGENTE STAT'
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
                      <span>Completado a las {new Date(ticket.completedAt || ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {ticket.orderNumber && (
                        <span className="font-mono text-teal-300 font-bold">{ticket.orderNumber}</span>
                      )}
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRecall(ticket)}
                        title="Llamar o Re-llamar al paciente por altavoz"
                        className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-teal-300 hover:text-white rounded-2xl text-xs font-bold transition flex items-center justify-center cursor-pointer"
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
                        onClick={() => turnService.markNoShow(ticket.id)}
                        title="Marcar como Paciente Ausente / No se presentó"
                        className="p-2.5 bg-slate-950 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-500/40 text-slate-500 hover:text-rose-400 rounded-2xl transition flex items-center justify-center cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* DISPENSER MODAL (TÓTEM DIGITAL DE EMISIÓN DE TURNOS) */}
      {isDispenserModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-teal-500/40 rounded-[2.5rem] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100 relative overflow-hidden">
            
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    Dispensador Inteligente
                  </span>
                  <span className="text-[10px] text-slate-400">ISO 15189 / Ley 42 Panamá</span>
                </div>
                <h3 className="text-xl font-black text-white mt-1 flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-teal-400" />
                  <span>Emisión de Turno de Atención</span>
                </h3>
              </div>

              <button
                onClick={() => setIsDispenserModalOpen(false)}
                className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-5">
              
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

              <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-3">
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

      {/* PUBLIC TV DISPLAY MODE (SALA DE ESPERA / PANTALLA TOTEM) */}
      {isTvDisplayModalOpen && (
        <div className="fixed inset-0 bg-slate-950 z-[250] flex flex-col p-6 sm:p-10 text-white animate-in fade-in duration-300 overflow-y-auto">
          
          {/* TV Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
                LC
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">SALA DE ESPERA • LABORATORIO CLÍNICO</h1>
                <p className="text-xs text-slate-400 font-mono">SISTEMA INTEGRADO DE LLAMADO DE TURNOS ISO 15189</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-mono font-black text-teal-400">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-[10px] text-slate-400 uppercase">Tiempo Real</div>
              </div>

              <button
                onClick={() => setIsTvDisplayModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                Cerrar TV Mode
              </button>
            </div>
          </div>

          {/* TV Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-8">
            
            {/* BIG CALLED TICKET DISPLAY */}
            <div className="lg:col-span-8 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 border-2 border-teal-500/50 rounded-[3rem] p-8 sm:p-12 shadow-[0_0_100px_rgba(20,184,166,0.15)] flex flex-col justify-between text-center relative overflow-hidden">
              <div className="space-y-4">
                <span className="px-5 py-1.5 rounded-full text-xs font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40 inline-flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 animate-bounce" />
                  <span>TURNO LLAMADO ACTUALMENTE</span>
                </span>

                {lastCalled ? (
                  <>
                    <div className="text-7xl sm:text-9xl font-black font-mono tracking-tighter text-white drop-shadow-2xl my-4">
                      {lastCalled.ticketNumber}
                    </div>

                    <div className="text-3xl sm:text-4xl font-black text-teal-300 uppercase tracking-tight">
                      {lastCalled.patientName}
                    </div>

                    <div className="text-xl sm:text-2xl font-bold text-amber-400 flex items-center justify-center space-x-2 pt-2">
                      <span>DIRÍJASE A:</span>
                      <strong className="underline uppercase">{lastCalled.counterName || 'Ventanilla 1'}</strong>
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-slate-500 text-xl font-bold">
                    Esperando próximo llamado de turno...
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-white/10 text-xs text-slate-400">
                Favor presentar su documento de identidad y orden médica en el box de atención.
              </div>
            </div>

            {/* RECENT CALLS HISTORY */}
            <div className="lg:col-span-4 bg-slate-900/60 border border-white/10 rounded-[3rem] p-6 sm:p-8 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider mb-4 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span>Últimos Turnos Llamados</span>
                </h3>

                <div className="space-y-3">
                  {tickets
                    .filter(t => t.status === 'LLAMANDO' || t.status === 'EN_ATENCION' || t.status === 'ATENDIDO')
                    .slice(0, 5)
                    .map(t => (
                      <div
                        key={t.id}
                        className="p-3.5 bg-slate-950/80 border border-white/5 rounded-2xl flex items-center justify-between"
                      >
                        <div>
                          <div className="text-base font-black font-mono text-teal-300">{t.ticketNumber}</div>
                          <div className="text-xs text-white font-bold truncate max-w-[140px]">{t.patientName}</div>
                        </div>
                        <div className="text-right text-[11px] font-bold text-amber-300">
                          {t.counterName || 'Box Flebotomía'}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Informative Footer Ticker */}
              <div className="p-4 bg-teal-950/40 border border-teal-500/30 rounded-2xl text-center space-y-1">
                <div className="text-xs font-black text-teal-300 uppercase">Atención Preferencial Ley 42</div>
                <div className="text-[10px] text-slate-400">Prioridad garantizada a adultos mayores, embarazadas y personas con discapacidad.</div>
              </div>
            </div>

          </div>

          {/* TV Footer */}
          <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs text-slate-500">
            <span>LISCore Healthcare Systems • Multi-Tenant Reception Queue</span>
            <span>Garantía de Confidencialidad y Custodia de Datos Ley 81 de Panamá</span>
          </div>

        </div>
      )}

    </div>
  );
};
