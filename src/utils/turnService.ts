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

const STORAGE_TURNS_KEY = 'LISCORE_RECEPTION_TURNS_V2';
const STORAGE_COUNTERS_KEY = 'LISCORE_RECEPTION_COUNTERS_V2';

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
    name: 'Urgencias Médicas / STAT',
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

const DEFAULT_INITIAL_TICKETS: QueueTicket[] = [
  {
    id: 'tkt-001',
    ticketNumber: 'URG-003',
    category: 'URGENCIA_STAT',
    priority: 'STAT_URGENTE',
    patientName: 'Montero, Fernando',
    patientNationalId: '8-812-4412',
    patientGender: 'M',
    patientAge: 54,
    notes: 'Pre-quirúrgico inmediato de apendicectomía. STAT.',
    status: 'ESPERANDO',
    createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    estimatedWaitMinutes: 2,
    isFasting: true
  },
  {
    id: 'tkt-002',
    ticketNumber: 'PREF-008',
    category: 'PREFERENCIAL',
    priority: 'PREFERENCIAL',
    patientName: 'De León, Carmen Rosa',
    patientNationalId: '4-120-994',
    patientGender: 'F',
    patientAge: 73,
    notes: 'Ley 42: Adulto Mayor. Control de diabetes y lípidos.',
    status: 'ESPERANDO',
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    estimatedWaitMinutes: 5,
    isFasting: true
  },
  {
    id: 'tkt-003',
    ticketNumber: 'PED-004',
    category: 'PEDIATRIA',
    priority: 'PREFERENCIAL',
    patientName: 'Morales Abrego, Mateo (Bebé)',
    patientNationalId: '8-1092-231',
    patientGender: 'M',
    patientAge: 3,
    notes: 'Bebé de 3 años. Frotis y hemograma pediátrico.',
    status: 'ESPERANDO',
    createdAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    estimatedWaitMinutes: 8,
    isFasting: false
  },
  {
    id: 'tkt-004',
    ticketNumber: 'LAB-021',
    category: 'GENERAL',
    priority: 'NORMAL',
    patientName: 'Castillo, Ricardo',
    patientNationalId: '8-765-4321',
    patientGender: 'M',
    patientAge: 38,
    notes: 'Chequeo general anual de laboratorio.',
    status: 'ESPERANDO',
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    estimatedWaitMinutes: 12,
    isFasting: true
  },
  {
    id: 'tkt-005',
    ticketNumber: 'ESP-002',
    category: 'ESPECIALES',
    priority: 'NORMAL',
    patientName: 'Vega, Katherine',
    patientNationalId: '8-890-1234',
    patientGender: 'F',
    patientAge: 29,
    notes: 'Curva de Tolerancia a la Glucosa (75g) - 1ra toma.',
    status: 'ESPERANDO',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    estimatedWaitMinutes: 15,
    isFasting: true
  },
  {
    id: 'tkt-006',
    ticketNumber: 'LAB-020',
    category: 'GENERAL',
    priority: 'NORMAL',
    patientName: 'Navarro, Javier',
    patientNationalId: '8-912-3456',
    patientGender: 'M',
    patientAge: 42,
    notes: 'Perfil lipídico y enzimas hepáticas.',
    status: 'EN_ATENCION',
    counterName: 'Módulo Flebotomía Box 1',
    assignedStaff: 'Lic. Valentina Soto',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    calledAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    attendedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    estimatedWaitMinutes: 0,
    isFasting: true
  }
];

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

  private constructor() {
    if (typeof window !== 'undefined') {
      this.loadState();
    }
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
    } catch (e) {
      console.warn('Error loading turn data, fallback to initial', e);
      this.tickets = DEFAULT_INITIAL_TICKETS;
      this.counters = DEFAULT_RECEPTION_COUNTERS;
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
    }
  }

  public getTickets(): QueueTicket[] {
    return [...this.tickets];
  }

  public getCounters(): ReceptionCounter[] {
    return [...this.counters];
  }

  public getLastCalledTicket(): QueueTicket | null {
    return this.lastCalledTicket;
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
    const updatedTicket: QueueTicket = {
      ...ticket,
      status: 'LLAMANDO',
      calledAt: nowIso,
      counterName: counterName || ticket.counterName || 'Ventanilla 1'
    };

    this.tickets = this.tickets.map(t => t.id === ticketId ? updatedTicket : t);
    this.lastCalledTicket = updatedTicket;
    this.saveTickets();
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
    const updatedTicket: QueueTicket = {
      ...ticket,
      status: 'EN_ATENCION',
      attendedAt: nowIso,
      counterName: counterName || ticket.counterName || 'Ventanilla 1',
      assignedStaff: staffName || ticket.assignedStaff || 'Recepción LIS'
    };

    this.tickets = this.tickets.map(t => t.id === ticketId ? updatedTicket : t);
    this.saveTickets();
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
   * Marks a ticket as No Show (Paciente ausente)
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

    // 2. Synthesize voice announcement in Spanish
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Cancel previous announcements
        const text = `Turno ${ticket.ticketNumber.replace('-', ' ')}. Paciente ${ticket.patientName}, favor acudir a ${ticket.counterName || 'Ventanilla de Atención'}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-PA';
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      // Speech synthesis optional
    }
  }

  public resetDailyQueue() {
    this.tickets = DEFAULT_INITIAL_TICKETS;
    this.saveTickets();
    this.notify();
  }
}

export const turnService = TurnManagementService.getInstance();
