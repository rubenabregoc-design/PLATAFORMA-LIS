/**
 * Patient Turn & Queue Management Service (Gestión de Turnos de Atención LISCore)
 * Manages patient flow at Reception and Phlebotomy, organizing queues by specialty,
 * arrival order (FIFO), and clinical/legal priority (Ley 42 de Panamá, STAT, Pediatría).
 */

export type TurnCategory =
  | 'GENERAL'               // Toma de Muestra General (Prefijo: LAB)
  | 'PREFERENCIAL'          // Ley 42: Adulto Mayor, Embarazadas, Discapacidad (Prefijo: PREF)
  | 'PEDIATRIA'             // Pacientes Pediátricos y Neonatales (Prefijo: PED)
  | 'URGENCIA_STAT'         // Urgencias Médicas & Pre-Quirúrgicos Inmediatos (Prefijo: URG)
  | 'ESPECIALES'            // Curvas de Glucosa, Gasometría, Pruebas Dinámicas (Prefijo: ESP)
  | 'ENTREGA_RESULTADOS';   // Entrega de Informes y Asesoría (Prefijo: ENT)

export type TurnPriority = 'NORMAL' | 'PREFERENCIAL' | 'STAT_URGENTE';

export type TurnStatus = 'ESPERANDO' | 'LLAMANDO' | 'EN_ATENCION' | 'ATENDIDO' | 'NO_PRESENTO' | 'CANCELADO';

export interface QueueTicket {
  id: string;
  ticketNumber: string; // ej. LAB-024, PREF-007, URG-003, PED-012, ESP-005, ENT-031
  category: TurnCategory;
  priority: TurnPriority;
  patientName: string;
  patientNationalId?: string;
  patientGender?: 'M' | 'F';
  patientAge?: number;
  phone?: string;
  notes?: string;
  status: TurnStatus;
  createdAt: string;
  calledAt?: string;
  attendedAt?: string;
  completedAt?: string;
  counterName?: string; // ej. "Ventanilla 1", "Box Flebotomía 1", "Box Pediátrico"
  assignedStaff?: string;
  orderId?: string;
  orderNumber?: string;
  estimatedWaitMinutes: number;
  isFasting?: boolean;
}

export interface ReceptionCounter {
  id: string;
  name: string;
  type: 'VENTANILLA_RECEPCION' | 'BOX_FLEBOTOMIA' | 'BOX_PEDIATRICO' | 'ENTREGA_RESULTADOS';
  currentTicketId?: string;
  currentTicketNumber?: string;
  assignedStaff: string;
  status: 'ACTIVA' | 'EN_PAUSA' | 'CERRADA';
}

const STORAGE_TURNS_KEY = 'LISCORE_RECEPTION_TURNS_V3';
const STORAGE_COUNTERS_KEY = 'LISCORE_RECEPTION_COUNTERS_V3';
const STORAGE_LAST_CALLED_KEY = 'LISCORE_LAST_CALLED_TURN_V3';

export const CATEGORY_DETAILS: Record<TurnCategory, {
  name: string;
  shortCode: string;
  prefix: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeColor: string;
  iconName: string;
  desc: string;
  defaultPriority: TurnPriority;
}> = {
  GENERAL: {
    name: 'Muestra General',
    shortCode: 'LAB',
    prefix: 'LAB',
    color: 'text-teal-400',
    bgColor: 'bg-teal-950/40',
    borderColor: 'border-teal-500/30',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    iconName: 'UserCheck',
    desc: 'Análisis clínicos de rutina, química, hematología y orina.',
    defaultPriority: 'NORMAL'
  },
  PREFERENCIAL: {
    name: 'Atención Preferencial',
    shortCode: 'PREF',
    prefix: 'PREF',
    color: 'text-amber-300',
    bgColor: 'bg-amber-950/40',
    borderColor: 'border-amber-500/40',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    iconName: 'HeartHandshake',
    desc: 'Ley 42 de Panamá: Tercera edad (+60), embarazadas y personas con discapacidad.',
    defaultPriority: 'PREFERENCIAL'
  },
  PEDIATRIA: {
    name: 'Pediátrico & Neonatal',
    shortCode: 'PED',
    prefix: 'PED',
    color: 'text-sky-300',
    bgColor: 'bg-sky-950/40',
    borderColor: 'border-sky-500/40',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    iconName: 'Baby',
    desc: 'Lactantes, niños y extracciones con micro-métodos.',
    defaultPriority: 'PREFERENCIAL'
  },
  URGENCIA_STAT: {
    name: 'Urgencias Médicas',
    shortCode: 'URG',
    prefix: 'URG',
    color: 'text-rose-300',
    bgColor: 'bg-rose-950/50',
    borderColor: 'border-rose-500/50',
    badgeColor: 'bg-rose-500/30 text-rose-200 border-rose-500/60 animate-pulse',
    iconName: 'Zap',
    desc: 'Pacientes en estado crítico, pre-quirúrgicos y emergencias.',
    defaultPriority: 'STAT_URGENTE'
  },
  ESPECIALES: {
    name: 'Pruebas Especiales',
    shortCode: 'ESP',
    prefix: 'ESP',
    color: 'text-purple-300',
    bgColor: 'bg-purple-950/40',
    borderColor: 'border-purple-500/40',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    iconName: 'Timer',
    desc: 'Curvas de glucosa, test de tolerancia, gasometría y perfiles hormonales seriados.',
    defaultPriority: 'NORMAL'
  },
  ENTREGA_RESULTADOS: {
    name: 'Entrega de Resultados',
    shortCode: 'ENT',
    prefix: 'ENT',
    color: 'text-emerald-300',
    bgColor: 'bg-emerald-950/40',
    borderColor: 'border-emerald-500/40',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    iconName: 'FileCheck',
    desc: 'Retiro de informes impresos, validación de resultados y consultas.',
    defaultPriority: 'NORMAL'
  }
};

const DEFAULT_INITIAL_TICKETS: QueueTicket[] = [];

export const DEFAULT_RECEPTION_COUNTERS: ReceptionCounter[] = [
  {
    id: 'cnt-01',
    name: 'Ventanilla 1 (Admisión)',
    type: 'VENTANILLA_RECEPCION',
    assignedStaff: 'Recepción Central',
    status: 'ACTIVA'
  },
  {
    id: 'cnt-02',
    name: 'Módulo Flebotomía Box 1',
    type: 'BOX_FLEBOTOMIA',
    currentTicketNumber: 'LAB-020',
    assignedStaff: 'Lic. Valentina Soto (TM-LIS)',
    status: 'ACTIVA'
  },
  {
    id: 'cnt-03',
    name: 'Box 2 (Pediátrico & Especiales)',
    type: 'BOX_PEDIATRICO',
    assignedStaff: 'Lic. Roberto Chen',
    status: 'ACTIVA'
  },
  {
    id: 'cnt-04',
    name: 'Ventanilla 2 (Entrega)',
    type: 'ENTREGA_RESULTADOS',
    assignedStaff: 'Atención al Paciente',
    status: 'ACTIVA'
  }
];

export class TurnManagementService {
  private static instance: TurnManagementService;
  private tickets: QueueTicket[] = [];
  private counters: ReceptionCounter[] = [];
  private listeners: Array<() => void> = [];
  private lastCalledTicket: QueueTicket | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private broadcastChannel: BroadcastChannel | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.loadState();
      this.initVoices();
      this.initBroadcastSync();
    }
  }

  private initBroadcastSync() {
    if (typeof window === 'undefined') return;

    try {
      if ('BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('lis_turns_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'SYNC') {
            this.loadState();
            this.listeners.forEach(l => l());
          }
        };
      }
    } catch {
      // BroadcastChannel optional
    }

    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_TURNS_KEY || e.key === STORAGE_COUNTERS_KEY || e.key === STORAGE_LAST_CALLED_KEY) {
        this.loadState();
        this.listeners.forEach(l => l());
      }
    });
  }

  private initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const load = () => {
        try {
          this.availableVoices = window.speechSynthesis.getVoices();
        } catch {
          // ignore
        }
      };
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }
  }

  private getBestNaturalSpanishVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = this.availableVoices.length > 0 ? this.availableVoices : window.speechSynthesis.getVoices();
    const spanishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('es'));
    if (spanishVoices.length === 0) return null;

    // Filter out European Spain (es-ES / Spain / España) and marked accents (es-AR, es-CL) to maintain neutral Latin American / Panamanian Spanish
    const isPeninsularOrMarked = (v: SpeechSynthesisVoice) => {
      const l = v.lang.toLowerCase();
      const n = v.name.toLowerCase();
      return l === 'es-es' || n.includes('spain') || n.includes('españa') || l.includes('es-ar') || l.includes('es-cl') || n.includes('argentina') || n.includes('chile');
    };

    // 1. Explicit Panama voice (e.g. "Microsoft Salome Online (Natural) - Spanish (Panama)" in Windows/Edge)
    const panamaVoice = spanishVoices.find(v => {
      const l = v.lang.toLowerCase();
      const n = v.name.toLowerCase();
      return (l === 'es-pa' || l.includes('-pa') || n.includes('panama') || n.includes('panamá')) &&
        (n.includes('natural') || n.includes('neural') || n.includes('online'));
    }) || spanishVoices.find(v => v.lang.toLowerCase() === 'es-pa' || v.name.toLowerCase().includes('panama') || v.name.toLowerCase().includes('panamá'));

    if (panamaVoice) return panamaVoice;

    // 2. Neutral Latin American Natural/Neural voices (es-419, es-US, es-MX, es-CO e.g. Dalia/Jorge Natural, Google español de Estados Unidos)
    const latamNatural = spanishVoices.find(v => {
      if (isPeninsularOrMarked(v)) return false;
      const n = v.name.toLowerCase();
      return n.includes('natural') || n.includes('neural') || n.includes('online');
    });
    if (latamNatural) return latamNatural;

    // 3. Google Latin American Cloud Voice (Chrome: "Google español de Estados Unidos" / es-419)
    const googleLatam = spanishVoices.find(v => {
      if (isPeninsularOrMarked(v)) return false;
      const n = v.name.toLowerCase();
      const l = v.lang.toLowerCase();
      return n.includes('google') && (n.includes('estados unidos') || l === 'es-us' || l.includes('419') || n.includes('mexico') || n.includes('méxico'));
    });
    if (googleLatam) return googleLatam;

    // 4. Any neutral Latin American non-desktop voice
    const anyNeutralLatam = spanishVoices.find(v => !isPeninsularOrMarked(v) && !v.name.toLowerCase().includes('desktop'));
    if (anyNeutralLatam) return anyNeutralLatam;

    // 5. Fallback to any non-Spain voice
    const fallbackNonSpain = spanishVoices.find(v => !isPeninsularOrMarked(v));
    return fallbackNonSpain || spanishVoices[0];
  }

  public static getInstance(): TurnManagementService {
    if (!TurnManagementService.instance) {
      TurnManagementService.instance = new TurnManagementService();
    }
    return TurnManagementService.instance;
  }

  private loadState() {
    try {
      const storedTickets = localStorage.getItem(STORAGE_TURNS_KEY);
      if (storedTickets) {
        this.tickets = JSON.parse(storedTickets);
      } else {
        this.tickets = DEFAULT_INITIAL_TICKETS;
        this.saveTickets();
      }

      const storedCounters = localStorage.getItem(STORAGE_COUNTERS_KEY);
      if (storedCounters) {
        this.counters = JSON.parse(storedCounters);
      } else {
        this.counters = DEFAULT_RECEPTION_COUNTERS;
        this.saveCounters();
      }

      const storedLastCalled = localStorage.getItem(STORAGE_LAST_CALLED_KEY);
      if (storedLastCalled) {
        this.lastCalledTicket = JSON.parse(storedLastCalled);
      } else {
        this.lastCalledTicket = this.computeFallbackLastCalled();
      }
    } catch (e) {
      console.warn('Error loading turn data, fallback to initial', e);
      this.tickets = DEFAULT_INITIAL_TICKETS;
      this.counters = DEFAULT_RECEPTION_COUNTERS;
      this.lastCalledTicket = null;
    }
  }

  private saveTickets() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_TURNS_KEY, JSON.stringify(this.tickets));
      } catch (e) {
        console.error('Failed to save tickets', e);
      }
    }
  }

  private saveCounters() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_COUNTERS_KEY, JSON.stringify(this.counters));
      } catch (e) {
        console.error('Failed to save counters', e);
      }
    }
  }

  private saveLastCalled(ticket: QueueTicket | null) {
    if (typeof window !== 'undefined') {
      try {
        if (ticket) {
          localStorage.setItem(STORAGE_LAST_CALLED_KEY, JSON.stringify(ticket));
        } else {
          localStorage.removeItem(STORAGE_LAST_CALLED_KEY);
        }
      } catch (e) {
        console.error('Failed to save last called ticket', e);
      }
    }
  }

  public computeFallbackLastCalled(): QueueTicket | null {
    const calling = this.tickets.filter(t => t.status === 'LLAMANDO');
    if (calling.length > 0) {
      return [...calling].sort((a, b) => new Date(b.calledAt || b.createdAt).getTime() - new Date(a.calledAt || a.createdAt).getTime())[0];
    }
    const attending = this.tickets.filter(t => t.status === 'EN_ATENCION');
    if (attending.length > 0) {
      return [...attending].sort((a, b) => new Date(b.attendedAt || b.calledAt || b.createdAt).getTime() - new Date(a.attendedAt || a.calledAt || a.createdAt).getTime())[0];
    }
    return null;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lis:turn-service-updated'));
      try {
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage({ type: 'SYNC' });
        }
      } catch {
        // ignore
      }
    }
  }

  public getTickets(): QueueTicket[] {
    return [...this.tickets];
  }

  public getCounters(): ReceptionCounter[] {
    return [...this.counters];
  }

  public setCounterStatus(counterId: string, status: 'ACTIVA' | 'EN_PAUSA' | 'CERRADA'): ReceptionCounter | null {
    const counter = this.counters.find(c => c.id === counterId);
    if (!counter) return null;

    counter.status = status;
    this.saveCounters();
    this.notify();
    return counter;
  }

  public addCounter(name: string, type: ReceptionCounter['type'], assignedStaff?: string): ReceptionCounter {
    const newCounter: ReceptionCounter = {
      id: `cnt-${Date.now()}`,
      name,
      type,
      assignedStaff: assignedStaff || 'Personal de Turno',
      status: 'ACTIVA'
    };
    this.counters.push(newCounter);
    this.saveCounters();
    this.notify();
    return newCounter;
  }

  public updateCounter(counterId: string, updates: Partial<ReceptionCounter>): ReceptionCounter | null {
    const idx = this.counters.findIndex(c => c.id === counterId);
    if (idx === -1) return null;

    const oldName = this.counters[idx].name;
    this.counters[idx] = { ...this.counters[idx], ...updates };

    // If counter name changed, cascade update to active tickets and lastCalledTicket
    if (updates.name && updates.name !== oldName) {
      let ticketsUpdated = false;
      this.tickets = this.tickets.map(t => {
        if (t.counterName === oldName) {
          ticketsUpdated = true;
          return { ...t, counterName: updates.name };
        }
        return t;
      });
      if (ticketsUpdated) {
        this.saveTickets();
      }

      if (this.lastCalledTicket && this.lastCalledTicket.counterName === oldName) {
        this.lastCalledTicket = { ...this.lastCalledTicket, counterName: updates.name };
        this.saveLastCalled(this.lastCalledTicket);
      }
    }

    this.saveCounters();
    this.notify();
    return this.counters[idx];
  }

  public deleteCounter(counterId: string): boolean {
    const idx = this.counters.findIndex(c => c.id === counterId);
    if (idx === -1) return false;

    this.counters = this.counters.filter(c => c.id !== counterId);
    this.saveCounters();
    this.notify();
    return true;
  }

  public getLastCalledTicket(): QueueTicket | null {
    if (this.lastCalledTicket) {
      const existing = this.tickets.find(t => t.id === this.lastCalledTicket?.id);
      if (existing) {
        return existing;
      }
    }
    return this.computeFallbackLastCalled();
  }

  /**
   * Sorts waiting tickets by clinical and legal priority:
   * 1. STAT_URGENTE (Urgencias / Pre-quirúrgicos)
   * 2. PREFERENCIAL (Ley 42: Adulto Mayor, Embarazadas, Pediatría)
   * 3. NORMAL (General, FIFO por hora de llegada)
   */
  public getSortedWaitingQueue(categoryFilter?: TurnCategory | 'ALL'): QueueTicket[] {
    const priorityWeight: Record<TurnPriority, number> = {
      STAT_URGENTE: 3,
      PREFERENCIAL: 2,
      NORMAL: 1
    };

    return this.tickets
      .filter(t => t.status === 'ESPERANDO' || t.status === 'LLAMANDO')
      .filter(t => !categoryFilter || categoryFilter === 'ALL' || t.category === categoryFilter)
      .sort((a, b) => {
        const weightDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (weightDiff !== 0) return weightDiff;
        // Same priority: sort by arrival time (FIFO)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  /**
   * Generates a new sequential ticket number for the specified category
   */
  private generateNextTicketNumber(category: TurnCategory): string {
    const prefix = CATEGORY_DETAILS[category].prefix;
    const sameCategoryTickets = this.tickets.filter(t => t.category === category);
    const nextSeq = sameCategoryTickets.length + 1;
    return `${prefix}-${String(nextSeq).padStart(3, '0')}`;
  }

  /**
   * Creates a new Turn Ticket in the reception queue
   */
  public createTicket(params: {
    category: TurnCategory;
    patientName: string;
    patientNationalId?: string;
    patientGender?: 'M' | 'F';
    patientAge?: number;
    phone?: string;
    notes?: string;
    isFasting?: boolean;
    customPriority?: TurnPriority;
  }): QueueTicket {
    const category = params.category;
    const priority = params.customPriority || CATEGORY_DETAILS[category].defaultPriority;
    const ticketNumber = this.generateNextTicketNumber(category);
    
    // Estimate wait time based on position in queue
    const waitingCount = this.getSortedWaitingQueue().length;
    const estimatedWaitMinutes = Math.max(3, (waitingCount + 1) * 4);

    const newTicket: QueueTicket = {
      id: `tkt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ticketNumber,
      category,
      priority,
      patientName: params.patientName.trim() || 'Paciente sin Registrar',
      patientNationalId: params.patientNationalId?.trim(),
      patientGender: params.patientGender,
      patientAge: params.patientAge,
      phone: params.phone?.trim(),
      notes: params.notes?.trim(),
      status: 'ESPERANDO',
      createdAt: new Date().toISOString(),
      estimatedWaitMinutes,
      isFasting: params.isFasting ?? true
    };

    this.tickets.unshift(newTicket);
    this.saveTickets();
    this.notify();

    return newTicket;
  }

  /**
   * Calls the highest-priority ticket next in line and assigns it to a counter
   */
  public callNextTicket(counterName: string = 'Ventanilla 1', staffName: string = 'Recepción LIS'): QueueTicket | null {
    const queue = this.getSortedWaitingQueue();
    if (queue.length === 0) return null;

    const nextTicket = queue[0];
    const nowIso = new Date().toISOString();

    this.tickets = this.tickets.map(t => {
      if (t.id === nextTicket.id) {
        return {
          ...t,
          status: 'LLAMANDO',
          calledAt: nowIso,
          counterName,
          assignedStaff: staffName
        };
      }
      return t;
    });

    // Update counter
    this.counters = this.counters.map(c => {
      if (c.name === counterName) {
        return {
          ...c,
          currentTicketId: nextTicket.id,
          currentTicketNumber: nextTicket.ticketNumber,
          assignedStaff: staffName
        };
      }
      return c;
    });

    this.lastCalledTicket = {
      ...nextTicket,
      status: 'LLAMANDO',
      calledAt: nowIso,
      counterName,
      assignedStaff: staffName
    };

    this.saveTickets();
    this.saveCounters();
    this.saveLastCalled(this.lastCalledTicket);
    this.notify();

    // Trigger acoustic and voice announcement
    this.playTurnAlert(this.lastCalledTicket);

    return this.lastCalledTicket;
  }

  /**
   * Re-calls a specific ticket with sound alert
   */
  public recallTicket(ticketId: string, counterName?: string): QueueTicket | null {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) return null;

    const nowIso = new Date().toISOString();
    const finalCounter = counterName || ticket.counterName || 'Ventanilla 1';
    const updatedTicket: QueueTicket = {
      ...ticket,
      status: 'LLAMANDO',
      calledAt: nowIso,
      counterName: finalCounter
    };

    this.tickets = this.tickets.map(t => t.id === ticketId ? updatedTicket : t);
    this.lastCalledTicket = updatedTicket;

    // Update counter current ticket
    this.counters = this.counters.map(c => {
      if (c.name === finalCounter) {
        return {
          ...c,
          currentTicketId: updatedTicket.id,
          currentTicketNumber: updatedTicket.ticketNumber
        };
      }
      return c;
    });

    this.saveTickets();
    this.saveCounters();
    this.saveLastCalled(updatedTicket);
    this.notify();

    this.playTurnAlert(updatedTicket);
    return updatedTicket;
  }

  /**
   * Sets a ticket to EN_ATENCION (Patient is seated in phlebotomy/reception)
   */
  public startAttention(ticketId: string, counterName?: string, staffName?: string): QueueTicket | null {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) return null;

    const nowIso = new Date().toISOString();
    const finalCounter = counterName || ticket.counterName || 'Ventanilla 1';
    const updatedTicket: QueueTicket = {
      ...ticket,
      status: 'EN_ATENCION',
      attendedAt: nowIso,
      counterName: finalCounter,
      assignedStaff: staffName || ticket.assignedStaff || 'Recepción LIS'
    };

    this.tickets = this.tickets.map(t => t.id === ticketId ? updatedTicket : t);
    this.lastCalledTicket = updatedTicket;

    // Update counter current ticket
    this.counters = this.counters.map(c => {
      if (c.name === finalCounter) {
        return {
          ...c,
          currentTicketId: updatedTicket.id,
          currentTicketNumber: updatedTicket.ticketNumber,
          assignedStaff: staffName || c.assignedStaff
        };
      }
      return c;
    });

    this.saveTickets();
    this.saveCounters();
    this.saveLastCalled(updatedTicket);
    this.notify();
    return updatedTicket;
  }

  /**
   * Completes the turn attention and links the generated Order ID
   */
  public completeAttention(ticketId: string, orderId?: string, orderNumber?: string): QueueTicket | null {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) return null;

    const nowIso = new Date().toISOString();
    const updatedTicket: QueueTicket = {
      ...ticket,
      status: 'ATENDIDO',
      completedAt: nowIso,
      orderId: orderId || ticket.orderId,
      orderNumber: orderNumber || ticket.orderNumber
    };

    this.tickets = this.tickets.map(t => t.id === ticketId ? updatedTicket : t);
    this.saveTickets();
    this.notify();
    return updatedTicket;
  }

  /**
   * Marks a ticket as No Show (Paciente ausente / se fue)
   */
  public markNoShow(ticketId: string): QueueTicket | null {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) return null;

    const updatedTicket: QueueTicket = {
      ...ticket,
      status: 'NO_PRESENTO'
    };

    this.tickets = this.tickets.map(t => t.id === ticketId ? updatedTicket : t);
    this.saveTickets();
    this.notify();
    return updatedTicket;
  }

  /**
   * Re-queues a ticket back to waiting line (if patient returned from restroom/cafeteria)
   */
  public requeueTicket(ticketId: string): QueueTicket | null {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) return null;

    const updatedTicket: QueueTicket = {
      ...ticket,
      status: 'ESPERANDO',
      calledAt: undefined,
      attendedAt: undefined,
      counterName: undefined
    };

    this.tickets = this.tickets.map(t => t.id === ticketId ? updatedTicket : t);
    this.saveTickets();
    this.notify();
    return updatedTicket;
  }

  /**
   * Translates ticket prefixes (URG, PREF, LAB, PED, ESP, ENT) to natural spoken Spanish words
   * so the speech synthesizer says e.g. "Urgencia 3" instead of spelling "U - R - G"
   */
  private formatTicketForSpeech(ticketNumber: string): string {
    const parts = ticketNumber.split('-');
    const prefix = (parts[0] || '').toUpperCase();
    const rawNum = parts[1] ? parseInt(parts[1], 10) : '';

    let categorySpoken = '';
    switch (prefix) {
      case 'URG':
        categorySpoken = 'Urgencia';
        break;
      case 'PREF':
        categorySpoken = 'Preferencial';
        break;
      case 'PED':
        categorySpoken = 'Pediatría';
        break;
      case 'LAB':
        categorySpoken = 'Laboratorio';
        break;
      case 'ESP':
        categorySpoken = 'Especiales';
        break;
      case 'ENT':
        categorySpoken = 'Entrega de Resultados';
        break;
      default:
        categorySpoken = prefix.toLowerCase();
    }

    const numSpoken = rawNum ? `${rawNum}` : '';
    return `${categorySpoken} ${numSpoken}`.trim();
  }

  /**
   * Formats counter/box names cleanly for speech without parentheses or confusing jargon
   * e.g. "Ventanilla 1 (Admisión)" -> "Ventanilla 1"
   * e.g. "Módulo Flebotomía Box 1" -> "Módulo 1 de Flebotomía"
   */
  private formatCounterForSpeech(counterName?: string): string {
    if (!counterName) return 'Ventanilla de Atención';
    let clean = counterName.trim();
    // Remove parentheses e.g. (Admisión) -> Ventanilla 1
    clean = clean.replace(/\s*\([^)]*\)/g, '').trim();
    // Transform "Módulo Flebotomía Box 1" -> "Box 1 de Flebotomía"
    if (clean.toLowerCase().includes('flebotom') && clean.toLowerCase().includes('box')) {
      const matchBox = clean.match(/box\s*(\d+)/i);
      if (matchBox) {
        return `Box ${matchBox[1]} de Flebotomía`;
      }
    }
    return clean || 'Ventanilla de Atención';
  }

  /**
   * Plays a pleasant dual-tone acoustic chime followed by speech announcement
   */
  public playTurnAlert(ticket: QueueTicket) {
    if (typeof window === 'undefined') return;

    // 1. Play chime with Web Audio API
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        // Note 1: E5 (659 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.frequency.setValueAtTime(659.25, now);
        gain1.gain.setValueAtTime(0.12, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // Note 2: B5 (987.7 Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.frequency.setValueAtTime(987.77, now + 0.18);
        gain2.gain.setValueAtTime(0.14, now + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.18);
        osc2.stop(now + 0.6);
      }
    } catch (e) {
      // Audio might be constrained
    }

    // 2. Synthesize voice announcement in natural Spanish
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Cancel previous announcements
        const spokenTicket = this.formatTicketForSpeech(ticket.ticketNumber);
        const spokenCounter = this.formatCounterForSpeech(ticket.counterName);
        const cleanPatient = (ticket.patientName || '').replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ' ').trim();
        const text = `Atención por favor. Turno ${spokenTicket}. Paciente ${cleanPatient}, favor pasar a ${spokenCounter}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        const bestNaturalVoice = this.getBestNaturalSpanishVoice();
        if (bestNaturalVoice) {
          utterance.voice = bestNaturalVoice;
          utterance.lang = bestNaturalVoice.lang || 'es-PA';
        } else {
          utterance.lang = 'es-PA';
        }

        utterance.rate = 0.92; // Natural cadence, calm and clear
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      // Speech synthesis optional
    }
  }

  public clearAllTickets() {
    this.tickets = [];
    this.lastCalledTicket = null;
    this.saveTickets();
    this.saveLastCalled(null);
    this.notify();
  }

  public resetDailyQueue() {
    this.tickets = [];
    this.lastCalledTicket = null;
    this.saveTickets();
    this.saveLastCalled(null);
    this.notify();
  }
}

export const turnService = TurnManagementService.getInstance();
