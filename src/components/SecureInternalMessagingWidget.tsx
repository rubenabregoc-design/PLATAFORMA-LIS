import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare, Send, Paperclip, ShieldCheck, Wifi,
  Building2, AlertTriangle, CheckCheck, Search, X, Maximize2,
  Minimize2, Image as ImageIcon, Tag, Volume2, VolumeX, Sparkles,
  FileText, Check, RefreshCw, UserCheck, Lock,
  PlusCircle, Bot, Copy, Download, Trash2, Stethoscope, ChevronRight,
  Sparkle, Reply, CheckCircle2, Clock, Calendar
} from 'lucide-react';
import { useLisStore } from '../store/useLisStore';
import { Tenant, Branch } from '../types';
import { MOCK_TENANTS } from '../data/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

// Helper para normalizar cualquier hora a formato 12 horas (AM/PM)
export const formatTime12h = (timeOrDate?: string | Date): string => {
  if (!timeOrDate) {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  if (timeOrDate instanceof Date) {
    return timeOrDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  const cleanStr = String(timeOrDate).trim();
  if (/\b(am|pm)\b/i.test(cleanStr)) {
    return cleanStr;
  }
  const match24 = cleanStr.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    let hours = parseInt(match24[1], 10);
    const minutes = match24[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  const parsed = new Date(cleanStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  return cleanStr;
};

// Helper para formatear fecha completa y hora en formato 12 horas (AM/PM)
export const formatMessageDateTime = (dateStr?: string, timeStr?: string, createdAt?: string): { date: string; time: string; full: string } => {
  const now = new Date();
  let msgDate: Date = now;
  if (createdAt) {
    const parsed = new Date(createdAt);
    if (!isNaN(parsed.getTime())) msgDate = parsed;
  }

  const formattedTime = formatTime12h(timeStr || (createdAt ? msgDate : undefined));

  let formattedDate = dateStr;
  if (!formattedDate) {
    const isToday = msgDate.toDateString() === now.toDateString();
    if (isToday) {
      formattedDate = 'Hoy';
    } else {
      formattedDate = msgDate.toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }

  return {
    date: formattedDate,
    time: formattedTime,
    full: `${formattedDate} • ${formattedTime}`
  };
};

export interface ChatMessage {
  id: string;
  tenantId: string; // 🛡️ AISLAMIENTO MULTI-TENANT: Cada cliente tiene su propia base de mensajes
  senderId: string;
  senderName: string;
  senderRole: string;
  senderBranch: string;
  senderAvatar?: string;
  timestamp: string; // Formato 12 horas ej. "11:12 PM"
  date?: string; // Formato fecha legible ej. "23 nov 2026" o "Hoy"
  createdAt?: string; // ISO string para ordenación exacta
  content: string;
  channelId: string;
  isAi?: boolean;
  sampleContext?: {
    barcode: string;
    orderNumber: string;
    patientName: string;
    testName: string;
    value?: string;
    status?: 'HEMOLIZADA' | 'DUDOSA' | 'CRITICA' | 'VALIDADA';
  };
  // Trazabilidad de Respuesta vinculada a una consulta previa
  replyTo?: {
    id: string;
    senderName: string;
    senderRole: string;
    questionText: string;
    questionDate: string;
    questionTime: string;
    sampleBarcode?: string;
  };
  // Decisión clínica registrada (para consultas preanalíticas / valores críticos)
  resolution?: {
    decision: 'NUEVA_TOMA' | 'NOTA_TECNICA' | 'REPETIR_DUPLICADO' | 'DILUCION' | 'LIBERAR';
    decisionLabel: string;
    resolvedBy: string;
    resolvedRole: string;
    resolvedBranch: string;
    resolvedDate: string;
    resolvedTime: string;
    note?: string;
  };
  attachmentUrl?: string;
  attachmentName?: string;
  isEncrypted: boolean;
  status: 'SENT' | 'DELIVERED' | 'READ';
}

export interface SecureInternalMessagingWidgetProps {
  initialOpen?: boolean;
  embeddedMode?: boolean; // Si es true se incrusta en el workbench del tecnólogo
  activeSampleContext?: {
    barcode: string;
    orderNumber: string;
    patientName: string;
    testName: string;
    value?: string;
    status?: 'HEMOLIZADA' | 'DUDOSA' | 'CRITICA' | 'VALIDADA';
  };
  onClose?: () => void;
}

export const CHANNELS_LIST = [
  {
    id: 'ch-hemolizadas',
    name: 'consultas-muestra-hemolizada',
    label: '🩸 Muestras & Índices HIL',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    description: 'Criterios de rechazo, hemólisis HIL 3+, lipemia y notas técnicas codificadas'
  },
  {
    id: 'ch-dudosos',
    name: 'resultados-dudosos-criticos',
    label: '⚠️ Valores Pánico & Deltas',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    description: 'Confirmación cruzada de valores críticos, repeticiones por duplicado y diluciones'
  },
  {
    id: 'ch-banco-sangre',
    name: 'banco-sangre-urgente',
    label: '🧪 Banco de Sangre Urgencias',
    badgeColor: 'text-red-400 bg-red-500/10 border-red-500/30',
    description: 'Pruebas cruzadas urgentes, fenotipos eritrocitarios y reserva de CGR O-Negativo'
  },
  {
    id: 'ch-general',
    name: 'coordinacion-inter-sedes',
    label: '🏢 Logística & Derivaciones',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    description: 'Avisos de mensajería, valijas en tránsito, alícuotas y disponibilidad de reactivos'
  },
  {
    id: 'ch-copilot',
    name: 'abregotech-clinical-copilot',
    label: '🤖 AbregoTech Copilot IA',
    badgeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    description: 'Consulta en vivo de órdenes, pacientes, muestras, analitos y protocolos CLSI'
  },
];

// Helper para inicializar mensajes clínicos institucionales aislados por cliente
const getInitialMessagesForTenant = (tenant: Tenant): ChatMessage[] => {
  const tenantId = tenant.id;
  const tenantName = tenant.name;
  const branch1 = tenant.branches?.[0]?.name || 'Sede Principal';

  return [
    {
      id: `msg-sys-pinned-${tenantId}-1`,
      tenantId,
      senderId: 'usr-system',
      senderName: 'Dirección Médica & Gestión de Calidad',
      senderRole: 'SISTEMA ISO 15189',
      senderBranch: branch1,
      timestamp: '07:00 AM',
      content: `🔒 Canal Seguro Inter-Sedes para ${tenantName}. Red médica de interconsulta técnica en tiempo real para criterios de rechazo preanalítico, verificación cruzada de valores críticos y trazabilidad según norma ISO 15189 §7.3 y Ley 81.`,
      channelId: 'ch-general',
      isEncrypted: true,
      status: 'READ'
    },
    {
      id: `msg-sys-pinned-${tenantId}-hemolisis`,
      tenantId,
      senderId: 'usr-system',
      senderName: 'Jefatura de Fase Preanalítica',
      senderRole: 'PROTOCOLO CLSI GP44-A4',
      senderBranch: branch1,
      timestamp: '07:00 AM',
      content: `🩸 Protocolo de Hemólisis e Índices HIL activo para ${tenantName}: Muestras con HIL 3+ (>300 mg/dL Hb libre) en analitos interferidos (K+, DHL, AST) requieren interconsulta técnica o solicitud de nueva toma sin torniquete prolongado según manual de procedimientos.`,
      channelId: 'ch-hemolizadas',
      isEncrypted: true,
      status: 'READ'
    },
    {
      id: `msg-sys-pinned-${tenantId}-dudosos`,
      tenantId,
      senderId: 'usr-system',
      senderName: 'Comité de Calidad Analítica',
      senderRole: 'GESTIÓN DE RIESGO ISO 15189',
      senderBranch: branch1,
      timestamp: '07:00 AM',
      content: `⚠️ Verificación Cruzada de Valores Pánico: Todo resultado en rango crítico debe ser repetido por duplicado, correlacionado con delta check del historial del paciente y comunicado en <15 min con registro en bitácora.`,
      channelId: 'ch-dudosos',
      isEncrypted: true,
      status: 'READ'
    },
    {
      id: `msg-sys-pinned-${tenantId}-banco`,
      tenantId,
      senderId: 'usr-system',
      senderName: 'Servicio de Transfusión y Hemoderivados',
      senderRole: 'URGENCIAS STAT',
      senderBranch: branch1,
      timestamp: '07:00 AM',
      content: `🧪 Coordinación Transfusional STAT: Para solicitud de unidades O-Negativo de emergencia sin pruebas cruzadas completas, verificar firma de médico tratante y registrar código de alícuota en bitácora.`,
      channelId: 'ch-banco-sangre',
      isEncrypted: true,
      status: 'READ'
    },
    {
      id: `msg-sys-pinned-${tenantId}-2`,
      tenantId,
      senderId: 'usr-copilot',
      senderName: 'AbregoTech Copilot IA',
      senderRole: 'Motor Clínico LIS (Datos en Vivo)',
      senderBranch: 'AbregoTech Medical Intelligence',
      timestamp: '07:00 AM',
      content: `🤖 Asistente de Órdenes y Laboratorio en Vivo para ${tenantName}. Conectado a la base de datos del sistema: puedes consultarme en cualquier momento por el número de cualquier orden (ej: "orden 26101290001"), por paciente ("Rubén Ábrego"), por analito ("troponina de Samudio"), por tubo o por el estado global de órdenes pendientes y críticas.`,
      channelId: 'ch-copilot',
      isAi: true,
      isEncrypted: true,
      status: 'READ'
    }
  ];
};

// Helper de síntesis de audio clínico (sin archivos externos)
const playClinicalAudioChime = (type: 'send' | 'receive' = 'send') => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'send') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(987.77, ctx.currentTime + 0.12); // B5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.14); // E6
      gain.gain.setValueAtTime(0.16, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.19);
    }
  } catch {
    // Audio no soportado o bloqueado
  }
};

export const SecureInternalMessagingWidget: React.FC<SecureInternalMessagingWidgetProps> = ({
  initialOpen = false,
  embeddedMode = false,
  activeSampleContext,
  onClose
}) => {
  const { currentUser, currentTenant: storeTenant, currentBranch: storeBranch, orders, results, patients, activeOrderId, language, activeTab } = useLisStore();
  const isWorkstationTab = activeTab === 'validation' || activeTab === 'lis_workstation';
  const isEn = language === 'EN';

  // 1. Detección Reactiva del Cliente (Tenant) Activo con Sincronización en Tiempo Real
  const [currentTenantId, setCurrentTenantId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lis_current_tenant_id') || storeTenant?.id || 'lab-san-jose';
    }
    return storeTenant?.id || 'lab-san-jose';
  });

  const [tenantsList, setTenantsList] = useState<Tenant[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lis_tenants');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return MOCK_TENANTS;
  });

  // Escuchar cambios de cliente/sedes en vivo mediante eventos (sin ciclos de polling periódicos)
  useEffect(() => {
    let lastTenantsJson = '';
    const handleTenantSync = () => {
      try {
        const storedId = localStorage.getItem('lis_current_tenant_id');
        if (storedId && storedId !== currentTenantId) {
          setCurrentTenantId(storedId);
        }
        const storedTenants = localStorage.getItem('lis_tenants');
        if (storedTenants && storedTenants !== lastTenantsJson) {
          lastTenantsJson = storedTenants;
          setTenantsList(JSON.parse(storedTenants));
        }
      } catch {}
    };

    window.addEventListener('lis_tenants_updated', handleTenantSync);
    window.addEventListener('storage', handleTenantSync);

    return () => {
      window.removeEventListener('lis_tenants_updated', handleTenantSync);
      window.removeEventListener('storage', handleTenantSync);
    };
  }, [currentTenantId]);

  useEffect(() => {
    if (storeTenant?.id && storeTenant.id !== currentTenantId) {
      setCurrentTenantId(storeTenant.id);
    }
  }, [storeTenant?.id, currentTenantId]);

  // Listener global para invocar el Intercom desde la barra de navegación o cabecera
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(prev => !prev);
      setIsMinimized(false);
      setUnreadCount(0);
    };
    window.addEventListener('lis_toggle_intercom', handleToggle);
    return () => window.removeEventListener('lis_toggle_intercom', handleToggle);
  }, []);

  // Cliente (Tenant) Activo
  const activeTenant: Tenant = useMemo(() => {
    const found = tenantsList.find(t => t.id === currentTenantId);
    if (found) return found;
    if (storeTenant) return storeTenant;
    return tenantsList[0] || MOCK_TENANTS[0];
  }, [tenantsList, currentTenantId, storeTenant]);

  // Sedes Pertenecientes Exclusivamente al Cliente Activo
  const activeBranches: Branch[] = useMemo(() => {
    if (activeTenant.branches && activeTenant.branches.length > 0) {
      return activeTenant.branches;
    }
    return [{
      id: `branch-main-${activeTenant.id}`,
      tenantId: activeTenant.id,
      name: 'Sede Principal',
      code: 'SP-01',
      address: '',
      phone: ''
    }];
  }, [activeTenant]);

  const activeBranchesCount = activeBranches.length;

  // 2. Historial de Mensajes AISLADO POR CLIENTE (Multi-Tenant E2E)
  const tenantStorageKey = `lis_inter_branch_chat_${activeTenant.id}`;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initialPinned = getInitialMessagesForTenant(activeTenant);
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`lis_inter_branch_chat_${activeTenant.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Garantizar que cada canal tenga sus protocolos institucionales anclados
            const merged = [...parsed];
            for (const pinned of initialPinned) {
              if (!merged.some(m => m.channelId === pinned.channelId)) {
                merged.unshift(pinned);
              }
            }
            return merged;
          }
        }
      } catch {}
    }
    return initialPinned;
  });

  // Al cambiar de cliente, recargar inmediatamente su bandeja aislada
  useEffect(() => {
    const initialPinned = getInitialMessagesForTenant(activeTenant);
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`lis_inter_branch_chat_${activeTenant.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const merged = [...parsed];
            for (const pinned of initialPinned) {
              if (!merged.some(m => m.channelId === pinned.channelId)) {
                merged.unshift(pinned);
              }
            }
            setMessages(merged);
            return;
          }
        }
      } catch {}
    }
    setMessages(initialPinned);
  }, [activeTenant.id]);

  // Persistir en el almacenamiento del cliente activo
  useEffect(() => {
    try {
      localStorage.setItem(`lis_inter_branch_chat_${activeTenant.id}`, JSON.stringify(messages));
    } catch {}
  }, [messages, activeTenant.id]);

  // 3. Estados de UI
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [activeChannelId, setActiveChannelId] = useState<string>('ch-hemolizadas');
  const [messageInput, setMessageInput] = useState<string>('');
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [showSampleSelector, setShowSampleSelector] = useState<boolean>(false);
  const [attachedSample, setAttachedSample] = useState<SecureInternalMessagingWidgetProps['activeSampleContext'] | null>(activeSampleContext || null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; url: string; type?: string; size?: string } | null>(null);
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Estado de conexión e interacción en tiempo real
  const [isTypingOther, setIsTypingOther] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Listener global para recibir notificaciones enviadas desde otros módulos (Productividad, Calidad, Alertas)
  useEffect(() => {
    const handleIncomingSystemNotification = (ev: Event) => {
      const detail = (ev as CustomEvent<{
        channelId?: string;
        content: string;
        senderName?: string;
        senderRole?: string;
        senderBranch?: string;
        openChat?: boolean;
      }>).detail;
      if (!detail || !detail.content) return;

      const targetChannel = detail.channelId || 'ch-hemolizadas';
      const sysNow = new Date();
      const newMsg: ChatMessage = {
        id: `msg-sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tenantId: activeTenant.id,
        senderId: currentUser?.id || 'system-quality',
        senderName: detail.senderName || currentUser?.name || 'Coordinación de Calidad LIS',
        senderRole: detail.senderRole || 'Gestión & Calidad ISO 15189',
        senderBranch: detail.senderBranch || storeBranch?.name || 'Sede Principal',
        timestamp: formatTime12h(sysNow),
        date: sysNow.toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' }),
        createdAt: sysNow.toISOString(),
        content: detail.content,
        channelId: targetChannel,
        isEncrypted: true,
        status: 'DELIVERED'
      };

      setMessages((prev) => [...prev, newMsg]);
      if (detail.openChat) {
        setActiveChannelId(targetChannel);
        setIsOpen(true);
        setIsMinimized(false);
        setUnreadCount(0);
      } else {
        setUnreadCount((prev) => prev + 1);
      }
    };

    window.addEventListener('lis_send_intercom_notification', handleIncomingSystemNotification);
    return () => window.removeEventListener('lis_send_intercom_notification', handleIncomingSystemNotification);
  }, [activeTenant.id, currentUser, storeBranch]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeSampleContext) {
      setAttachedSample(activeSampleContext);
    }
  }, [activeSampleContext]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, activeChannelId]);

  // 📡 SINCRONIZACIÓN REAL ENTRE PESTAÑAS Y VENTANAS (BroadcastChannel)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return;
    const channelName = `lis_intercom_${activeTenant.id}`;
    const bc = new BroadcastChannel(channelName);

    bc.onmessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'NEW_MESSAGE') {
        const incomingMsg: ChatMessage = data.payload;
        setMessages((prev) => {
          if (prev.some((m) => m.id === incomingMsg.id)) return prev;
          return [...prev, incomingMsg];
        });
        if (isSoundEnabled) playClinicalAudioChime('receive');
        if (!isOpen || activeChannelId !== incomingMsg.channelId) {
          setUnreadCount((c) => c + 1);
        }
      } else if (data.type === 'DELETE_MESSAGE') {
        const deletedId: string = data.payload;
        setMessages((prev) => prev.filter((m) => m.id !== deletedId));
      }
    };

    return () => {
      bc.close();
    };
  }, [activeTenant.id, isOpen, activeChannelId, isSoundEnabled]);

  // ☁️ SINCRONIZACIÓN EN LA NUBE (Supabase Realtime si está configurado)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const room = supabase.channel(`intercom-${activeTenant.id}`);
    room
      .on('broadcast', { event: 'new-message' }, ({ payload }) => {
        if (!payload) return;
        const incomingMsg = payload as ChatMessage;
        setMessages((prev) => {
          if (prev.some((m) => m.id === incomingMsg.id)) return prev;
          return [...prev, incomingMsg];
        });
        if (isSoundEnabled) playClinicalAudioChime('receive');
        if (!isOpen || activeChannelId !== incomingMsg.channelId) {
          setUnreadCount((c) => c + 1);
        }
      })
      .on('broadcast', { event: 'delete-message' }, ({ payload }) => {
        if (!payload?.id) return;
        setMessages((prev) => prev.filter((m) => m.id !== payload.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(room);
    };
  }, [activeTenant.id, isOpen, activeChannelId, isSoundEnabled]);

  // Carga real de archivos e imágenes desde disco
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('El archivo no debe exceder 8 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const url = loadEvent.target?.result as string;
      setAttachedFile({
        name: file.name,
        url,
        type: file.type,
        size: `${(file.size / 1024).toFixed(0)} KB`
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeleteMessage = (msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    // Propagar borrado a otras pestañas
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const bc = new BroadcastChannel(`lis_intercom_${activeTenant.id}`);
        bc.postMessage({ type: 'DELETE_MESSAGE', payload: msgId });
        bc.close();
      }
    } catch {}
    if (isSupabaseConfigured && supabase) {
      try {
        supabase.channel(`intercom-${activeTenant.id}`).send({
          type: 'broadcast',
          event: 'delete-message',
          payload: { id: msgId }
        });
      } catch {}
    }
  };

  // Órdenes del cliente activo para el selector de muestras y vinculación real
  const tenantOrders = useMemo(() => {
    return (orders || []).filter(o => !o.tenantId || o.tenantId === activeTenant.id);
  }, [orders, activeTenant.id]);

  // Orden activa del sistema para vincular datos reales automáticamente
  const activeSystemOrder = useMemo(() => {
    if (!orders || !activeOrderId) return null;
    return orders.find(o => o.id === activeOrderId && (!o.tenantId || o.tenantId === activeTenant.id)) || null;
  }, [orders, activeOrderId, activeTenant.id]);

  // Motor Determinístico de Consulta Clínica LIS (100% Sin IA / Datos Exactos en Vivo)
  const generateClinicalOrderResponse = (query: string, sample?: SecureInternalMessagingWidgetProps['activeSampleContext'] | null): string => {
    const rawQ = query.trim();
    const q = rawQ.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 1. Extraer o identificar orden objetivo
    let targetOrder: (typeof tenantOrders)[0] | null = null;

    // A) Búsqueda directa por número exacto de orden o ID
    const exactNumMatch = tenantOrders.find(o => 
      q.includes(o.orderNumber.toLowerCase()) || 
      (o.id && q.includes(o.id.toLowerCase()))
    );
    if (exactNumMatch) targetOrder = exactNumMatch;

    // B) Búsqueda por ordinales o número corto (ej. "orden 1", "orden #3", "orden 2")
    if (!targetOrder) {
      const ordinalMatch = q.match(/(?:orden|order)\s*(?:#|n[o°]?)?\s*(\d+)/i);
      if (ordinalMatch) {
        const val = ordinalMatch[1];
        targetOrder = tenantOrders.find(o => o.orderNumber.endsWith(val) || o.orderNumber === val) || null;
        if (!targetOrder) {
          const idx = parseInt(val, 10);
          if (idx > 0 && idx <= tenantOrders.length) {
            targetOrder = tenantOrders[idx - 1];
          }
        }
      }
    }

    // C) Búsqueda por código de barras de muestra o tubo (ej: BC-90001, LILA, etc.)
    if (!targetOrder) {
      for (const ord of tenantOrders) {
        if (ord.specimens && ord.specimens.some(s => q.includes(s.barcode.toLowerCase()) || (s.type && q.includes(s.type.toLowerCase())))) {
          targetOrder = ord;
          break;
        }
      }
    }

    // D) Búsqueda por Paciente (Nombre, Apellido o Cédula)
    if (!targetOrder) {
      targetOrder = tenantOrders.find(o => {
        const pName = (o.patientName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const pNatId = (o.patientNationalId || '').toLowerCase().replace(/[-]/g, '');
        const cleanQ = q.replace(/[-]/g, '');
        
        const nameParts = pName.split(/\s+/).filter(part => part.length >= 3);
        const matchesNamePart = nameParts.some(part => q.includes(part));

        return (pNatId && cleanQ.includes(pNatId)) || matchesNamePart || (pName && q.includes(pName));
      }) || null;
    }

    // E) Búsqueda por orden activa / actual o contexto adjunto
    if (!targetOrder && (q.includes('orden activa') || q.includes('esta orden') || q.includes('orden actual') || q.includes('muestra activa'))) {
      targetOrder = activeSystemOrder || (sample ? tenantOrders.find(o => o.orderNumber === sample.orderNumber) : null);
    }

    // Analitos comunes para búsqueda específica
    const commonAnalytes = [
      { key: 'troponina', label: 'Troponina I Ultrasensible' },
      { key: 'leucocito', label: 'Leucocitos Totales (WBC)' },
      { key: 'wbc', label: 'Leucocitos Totales (WBC)' },
      { key: 'hemoglobina', label: 'Hemoglobina (HGB)' },
      { key: 'hgb', label: 'Hemoglobina (HGB)' },
      { key: 'colesterol', label: 'Colesterol Total' },
      { key: 'triglicerido', label: 'Triglicéridos' },
      { key: 'glucosa', label: 'Glucosa Basal' },
      { key: 'creatinina', label: 'Creatinina Sérica' },
      { key: 'bun', label: 'Nitrógeno de Urea (BUN)' },
      { key: 'urea', label: 'Nitrógeno de Urea (BUN)' },
      { key: 'sodio', label: 'Sodio (Na+)' },
      { key: 'potasio', label: 'Potasio (K+)' },
      { key: 'cloro', label: 'Cloro (Cl-)' },
      { key: 'alt', label: 'TGP / Alanina Aminotransferasa (ALT)' },
      { key: 'tgp', label: 'TGP / Alanina Aminotransferasa (ALT)' },
      { key: 'tsh', label: 'Hormona Estimulante de Tiroides (TSH)' },
      { key: 'plaqueta', label: 'Plaquetas (PLT)' },
      { key: 'plt', label: 'Plaquetas (PLT)' },
      { key: 'hematocrito', label: 'Hematocrito (HCT)' },
      { key: 'hct', label: 'Hematocrito (HCT)' }
    ];
    const queriedAnalyte = commonAnalytes.find(a => q.includes(a.key));

    // CASO 1: Si se encontró una orden específica
    if (targetOrder) {
      const ordResults = (results || []).filter(r => r.orderId === targetOrder.id || r.orderId === targetOrder.orderNumber);

      // Si preguntó por un analito específico dentro de la orden
      if (queriedAnalyte) {
        const specificRes = ordResults.find(r => 
          r.parameterName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(queriedAnalyte.key) ||
          (r.parameterCode && r.parameterCode.toLowerCase().includes(queriedAnalyte.key))
        );

        if (specificRes) {
          const isCrit = specificRes.flag === 'CRITICO_ALTO' || specificRes.flag === 'CRITICO_BAJO';
          const isHigh = specificRes.flag === 'ALTO';
          const isLow = specificRes.flag === 'BAJO';
          const flagLabel = isCrit ? '🚨 CRÍTICO (Valor Pánico)' : isHigh ? '▲ ALTO' : isLow ? '▼ BAJO' : '✅ NORMAL';

          return `🔬 DETALLE ANALÍTICO — ORDEN N° ${targetOrder.orderNumber}\n` +
                 `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                 `• Parámetro: ${specificRes.parameterName}\n` +
                 `• Paciente: ${targetOrder.patientName || 'Paciente'} (Cédula: ${targetOrder.patientNationalId || 'N/A'})\n` +
                 `• Resultado Medido: ${specificRes.value} ${specificRes.unit}\n` +
                 `• Rango de Referencia: ${specificRes.refRangeText} ${specificRes.unit}\n` +
                 `• Estado Clínico: ${flagLabel}\n` +
                 `• Analizador / Equipo: ${specificRes.analyzerName || specificRes.source || 'Automatizado Central'}\n` +
                 `• Estado de Validación: ${specificRes.status || 'VALIDADO'}` +
                 (specificRes.technicalValidatedBy ? ` por ${specificRes.technicalValidatedBy}` : '') + `\n` +
                 `• Prioridad de la Orden: ${targetOrder.priority === 'URGENCIA' || targetOrder.priority === 'STAT' ? '🚨 URGENCIA' : '🔵 RUTINA'}\n` +
                 `• Sede: ${targetOrder.branchName || activeTenant.name}`;
        }
      }

      // Si preguntó sobre los tubos o muestras de la orden
      if (q.includes('tubo') || q.includes('muestra') || q.includes('specimen') || q.includes('codigo de barra')) {
        let tubeInfo = `🧪 TUBOS Y MUESTRAS — ORDEN N° ${targetOrder.orderNumber}\n` +
                       `• Paciente: ${targetOrder.patientName || 'Paciente'}\n` +
                       `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        if (targetOrder.specimens && targetOrder.specimens.length > 0) {
          targetOrder.specimens.forEach((s, idx) => {
            tubeInfo += `${idx + 1}. [${s.barcode}] Tubo ${s.tubeType || 'Estándar'}\n` +
                        `   • Tipo: ${s.type || 'Muestra Clínica'}\n` +
                        `   • Estado: ${s.status || 'RECIBIDA'}\n` +
                        `   • Toma: ${s.collectedAt ? new Date(s.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Registrada'}\n`;
          });
        } else {
          tubeInfo += `• No hay muestras desglosadas registradas para esta orden.\n`;
        }
        return tubeInfo;
      }

      // Desglose completo de la orden
      const criticalCount = ordResults.filter(r => r.flag === 'CRITICO_ALTO' || r.flag === 'CRITICO_BAJO').length;
      const highCount = ordResults.filter(r => r.flag === 'ALTO').length;
      const lowCount = ordResults.filter(r => r.flag === 'BAJO').length;
      const normalCount = ordResults.length - criticalCount - highCount - lowCount;

      let sheet = `📋 FICHA TÉCNICA DE LA ORDEN N° ${targetOrder.orderNumber}\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `• Paciente: ${targetOrder.patientName || 'Paciente LIS'}\n` +
                  `• Cédula: ${targetOrder.patientNationalId || 'N/A'} | Edad: ${targetOrder.patientAge || '—'} años | Sexo: ${targetOrder.patientGender === 'F' ? 'Femenino' : 'Masculino'}\n` +
                  `• Prioridad: ${targetOrder.priority === 'URGENCIA' || targetOrder.priority === 'STAT' ? '🚨 URGENCIA' : '🔵 RUTINA'}\n` +
                  `• Procedencia / Origen: ${targetOrder.origin || 'Consulta Externa'}\n` +
                  `• Médico Tratante: ${targetOrder.doctorName || 'Dr(a). Tratante'}\n` +
                  `• Fecha de Ingreso: ${targetOrder.createdAt ? new Date(targetOrder.createdAt).toLocaleString('es-PA') : 'Registrada'}\n` +
                  `• Estado Oficial: ${targetOrder.status === 'VALIDADA_MED' ? '✅ VALIDADO OFICIAL' : targetOrder.status === 'VALIDADA_TEC' ? '🔬 VALIDADO TÉCNICO' : '⏳ EN PROCESO'}\n` +
                  `• Sede: ${targetOrder.branchName || activeTenant.name}\n\n`;

      if (targetOrder.specimens && targetOrder.specimens.length > 0) {
        sheet += `🧪 Muestras (${targetOrder.specimens.length}): ` +
                 targetOrder.specimens.map(s => `${s.barcode} (${s.tubeType || s.type})`).join(', ') + `\n\n`;
      }

      if (ordResults.length > 0) {
        sheet += `🔬 RESULTADOS DE LABORATORIO (${ordResults.length} parámetros):\n`;
        ordResults.forEach((r, idx) => {
          const flag = r.flag === 'CRITICO_ALTO' || r.flag === 'CRITICO_BAJO'
            ? '🚨 CRÍTICO'
            : r.flag === 'ALTO' ? '▲ ALTO'
            : r.flag === 'BAJO' ? '▼ BAJO'
            : '✅ Normal';
          sheet += `  ${idx + 1}. ${r.parameterName}: ${r.value} ${r.unit} (Ref: ${r.refRangeText}) [${flag}]\n`;
        });
        sheet += `\n📊 Balance: ${criticalCount > 0 ? `🚨 ${criticalCount} Críticos | ` : ''}${highCount > 0 ? `▲ ${highCount} Altos | ` : ''}✅ ${normalCount} Normales`;
      } else {
        sheet += `ℹ️ Pruebas en curso: ${targetOrder.testIds?.join(', ') || 'Pendientes de procesamiento analítico'}`;
      }

      return sheet;
    }

    // CASO 2: Consulta General de Órdenes (censo, cuántas hay, listas, urgencias, críticas, pendientes)
    if (q.includes('cuantas orden') || q.includes('lista de orden') || q.includes('censo') || q.includes('resumen de orden') || q.includes('ordenes criticas') || q.includes('ordenes urgentes') || q.includes('ordenes pendientes') || q.includes('que ordenes')) {
      const total = tenantOrders.length;
      const urgentes = tenantOrders.filter(o => o.priority === 'URGENCIA' || o.priority === 'STAT');
      const validadas = tenantOrders.filter(o => o.status === 'VALIDADA_MED' || o.status === 'VALIDADA_TEC');
      const pendientes = tenantOrders.filter(o => o.status !== 'VALIDADA_MED' && o.status !== 'VALIDADA_TEC');

      let summary = `📊 CENSO Y ESTADO DE ÓRDENES EN EL SISTEMA (${total} órdenes registradas):\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `• 🚨 Prioridad URGENCIA: ${urgentes.length} ${urgentes.length === 1 ? 'orden' : 'órdenes'}\n` +
                    `• ✅ Validadas Oficiales: ${validadas.length} órdenes\n` +
                    `• ⏳ En Proceso / Pendientes: ${pendientes.length} órdenes\n\n` +
                    `📋 DETALLE DE ÓRDENES ACTIVAS:\n`;
      tenantOrders.forEach((o, i) => {
        const ordRes = (results || []).filter(r => r.orderId === o.id || r.orderId === o.orderNumber);
        const hasCrit = ordRes.some(r => r.flag === 'CRITICO_ALTO' || r.flag === 'CRITICO_BAJO');
        const prioTag = o.priority === 'URGENCIA' || o.priority === 'STAT' ? '🚨 URGENCIA' : '🔵 RUTINA';
        const critTag = hasCrit ? ' | 🚨 CONTIENE VALOR CRÍTICO' : '';
        summary += `${i + 1}. N° ${o.orderNumber}: ${o.patientName || 'Paciente'} (${prioTag} | ${ordRes.length} analitos | ${o.status || 'REGISTRADA'}${critTag})\n`;
      });
      summary += `\n💡 Escribe el número de cualquier orden (ej: "26101290001" o "orden 3") o el nombre del paciente para ver sus analitos.`;
      return summary;
    }

    // CASO 3: Rangos de referencia generales (si preguntan por un analito sin orden)
    if (queriedAnalyte && (q.includes('rango') || q.includes('referencia') || q.includes('valor normal') || q.includes('limite'))) {
      const matchParam = (results || []).find(r => 
        r.parameterName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(queriedAnalyte.key) ||
        (r.parameterCode && r.parameterCode.toLowerCase().includes(queriedAnalyte.key))
      );
      if (matchParam) {
        return `📖 RANGO DE REFERENCIA CLÍNICO (CLSI EP28-A3):\n` +
               `• Parámetro: ${matchParam.parameterName}\n` +
               `• Rango Deseable: ${matchParam.refRangeText} ${matchParam.unit}\n` +
               `• Analizador Habitual: ${matchParam.analyzerName || 'Línea Automatizada'}\n` +
               `• Metodología: ${matchParam.source || 'Automatizada'}`;
      }
    }

    // CASO 4: Protocolos preanalíticos CLSI
    if (q.includes('hemolisis') || q.includes('hemolizada') || q.includes('hil')) {
      return '🩸 Guía Preanalítica HIL (CLSI GP44-A4): La hemólisis (HIL 3+ o >300 mg/dL de hemoglobina libre) genera interferencia biológica directa elevando falsamente Potasio (K+), DHL, AST y Fosfatasa Ácida por liberación eritrocitaria. En Troponina I Ultrasensible no suele haber interferencia negativa severa salvo lisis extrema. Recomendación: Solicitar tubo nuevo sin torniquete prolongado o reportar con nota técnica NT-HIL.';
    }
    if (q.includes('plaqueta') || q.includes('edta') || q.includes('grumo')) {
      return '🔬 Pseudotrombocitopenia por EDTA: Ocurre en ~0.1% de pacientes por aglutininas dependientes de EDTA. Procedimiento obligatorio: Tomar muestra simultánea en Tubo de Citrato de Sodio (3.2%), procesar en <1 hora, multiplicar el recuento por 1.1 y verificar frotis periférico en 100x.';
    }
    if (q.includes('dilucion') || q.includes('linealidad') || q.includes('fuera de escala')) {
      return '⚠️ Dilución de Muestras: Para analizadores de Química e Inmuno, utilice diluyente de la plataforma (Salina estéril 0.9% o Diluyente de Matriz). En Troponina o HCG, una dilución 1:5 o 1:10 es estándar. Ingrese el factor en la consola del analizador para que el LIS reciba el resultado corregido automáticamente.';
    }

    // CASO 5: Menú de ayuda / Fallback inteligente determinístico
    return `🤖 AbregoTech Copilot LIS (Conexión Directa a Base de Datos LIS):\n` +
           `Tengo indexadas en tiempo real las ${tenantOrders.length} órdenes del laboratorio. Puedes pedirme cualquier dato clínico sin usar IA:\n\n` +
           `📌 Consultas soportadas al instante:\n` +
           `• Por N° de Orden: "orden 26101290001", "orden 26101290003" o "orden 2"\n` +
           `• Por Paciente o Cédula: "paciente Rubén Ábrego" o "cédula 8-415-2281"\n` +
           `• Por Analito: "troponina de Samudio", "glucosa de la orden 1" o "leucocitos"\n` +
           `• Por Muestra / Tubo: "tubos de la orden 1" o "muestra BC-90001-LILA"\n` +
           `• Estado Global: "¿cuántas órdenes hay?", "órdenes críticas" o "órdenes pendientes"\n` +
           `• Normativas: "protocolo de hemólisis", "dilución de muestras"`;
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = messageInput.trim();
    if (!trimmed && !attachedSample && !attachedFile) return;

    const finalContent = trimmed || (
      attachedSample
        ? `[Consulta de Muestra #${attachedSample.barcode} — ${attachedSample.testName}]`
        : `[Archivo Adjunto: ${attachedFile?.name}]`
    );

    const now = new Date();
    const timeStr = formatTime12h(now);
    const dateStr = now.toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' });
    const createdAt = now.toISOString();

    const senderName = currentUser?.name || 'Lic. Rubén Ábrego';
    const senderRole = currentUser?.role ? currentUser.role.toUpperCase() : 'TECNÓLOGO MÉDICO';
    const senderBranch = storeBranch?.name || activeBranches[0]?.name || 'Sede Central';

    const originDateTime = replyingTo ? formatMessageDateTime(replyingTo.date, replyingTo.timestamp, replyingTo.createdAt) : null;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tenantId: activeTenant.id,
      senderId: currentUser?.id || 'usr-current',
      senderName,
      senderRole,
      senderBranch,
      timestamp: timeStr,
      date: dateStr,
      createdAt,
      content: finalContent,
      channelId: activeChannelId,
      sampleContext: attachedSample || undefined,
      replyTo: replyingTo && originDateTime ? {
        id: replyingTo.id,
        senderName: replyingTo.senderName,
        senderRole: replyingTo.senderRole,
        questionText: replyingTo.content,
        questionDate: originDateTime.date,
        questionTime: originDateTime.time,
        sampleBarcode: replyingTo.sampleContext?.barcode
      } : undefined,
      attachmentName: attachedFile?.name,
      attachmentUrl: attachedFile?.url,
      isEncrypted: true,
      status: 'DELIVERED'
    };

    setMessages((prev) => [...prev, newMsg]);
    setMessageInput('');
    setAttachedFile(null);
    setAttachedSample(null);
    setReplyingTo(null);
    if (unreadCount > 0) setUnreadCount(0);

    if (isSoundEnabled) {
      playClinicalAudioChime('send');
    }

    // 📡 Notificar en tiempo real a otras pestañas/estaciones de trabajo
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const bc = new BroadcastChannel(`lis_intercom_${activeTenant.id}`);
        bc.postMessage({ type: 'NEW_MESSAGE', payload: newMsg });
        bc.close();
      }
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        supabase.channel(`intercom-${activeTenant.id}`).send({
          type: 'broadcast',
          event: 'new-message',
          payload: newMsg
        });
      } catch {}
    }

    // Asistente Clínico Inteligente: ÚNICAMENTE en el canal de Copilot IA
    if (activeChannelId === 'ch-copilot') {
      setIsTypingOther('AbregoTech Copilot IA');
      setTimeout(() => {
        setIsTypingOther(null);
        const aiNow = new Date();
        const aiReply: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          tenantId: activeTenant.id,
          senderId: 'usr-copilot',
          senderName: 'AbregoTech Copilot IA',
          senderRole: 'Motor Clínico LIS (Datos en Vivo)',
          senderBranch: `${activeTenant.name} • Base de Datos Central`,
          timestamp: formatTime12h(aiNow),
          date: aiNow.toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' }),
          createdAt: aiNow.toISOString(),
          content: generateClinicalOrderResponse(finalContent, attachedSample),
          channelId: 'ch-copilot',
          isAi: true,
          isEncrypted: true,
          status: 'READ'
        };
        setMessages((prev) => [...prev, aiReply]);
        if (isSoundEnabled) playClinicalAudioChime('receive');
      }, 400);
    }
  };

  const handleStartReply = (msg: ChatMessage) => {
    setReplyingTo(msg);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleQuickResolve = (targetMsg: ChatMessage, decisionType: 'NUEVA_TOMA' | 'NOTA_TECNICA' | 'REPETIR_DUPLICADO') => {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeFormatted = formatTime12h(now);

    const decisionLabel =
      decisionType === 'NUEVA_TOMA'
        ? 'Solicitar Nueva Toma (Rechazo Preanalítico - Muestra Hemolizada)'
        : decisionType === 'NOTA_TECNICA'
        ? 'Procesar con Nota Técnica NT-HIL-02 (Interferencia advertida)'
        : 'Repetir por Duplicado & Confirmar Valor Crítico';

    const resolutionData = {
      decision: decisionType,
      decisionLabel,
      resolvedBy: currentUser?.name || 'Lic. Rubén Ábrego',
      resolvedRole: currentUser?.role ? currentUser.role.toUpperCase() : 'COORDINADOR DE CALIDAD',
      resolvedBranch: storeBranch?.name || activeBranches[0]?.name || 'Sede Central',
      resolvedDate: dateFormatted,
      resolvedTime: timeFormatted,
      note: 'Resolución técnica registrada bajo trazabilidad ISO 15189 §7.3.'
    };

    // 1. Actualizar el mensaje original con la resolución registrada
    setMessages(prev => prev.map(m => m.id === targetMsg.id ? { ...m, resolution: resolutionData } : m));

    // 2. Generar mensaje de respuesta formal vinculado en el canal
    const originDateTime = formatMessageDateTime(targetMsg.date, targetMsg.timestamp, targetMsg.createdAt);
    const responseMsg: ChatMessage = {
      id: `msg-res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId: activeTenant.id,
      senderId: currentUser?.id || 'usr-current',
      senderName: currentUser?.name || 'Lic. Rubén Ábrego',
      senderRole: currentUser?.role ? currentUser.role.toUpperCase() : 'COORDINADOR DE CALIDAD',
      senderBranch: storeBranch?.name || activeBranches[0]?.name || 'Sede Central',
      timestamp: timeFormatted,
      date: dateFormatted,
      createdAt: now.toISOString(),
      content: `✅ DECISIÓN TÉCNICA REGISTRADA:\n${decisionLabel}.\n\nSe registra resolución en bitácora para la muestra #${targetMsg.sampleContext?.barcode || 'N/A'}${targetMsg.sampleContext?.patientName ? ` (${targetMsg.sampleContext.patientName})` : ''}.`,
      channelId: targetMsg.channelId,
      replyTo: {
        id: targetMsg.id,
        senderName: targetMsg.senderName,
        senderRole: targetMsg.senderRole,
        questionText: targetMsg.content,
        questionDate: originDateTime.date,
        questionTime: originDateTime.time,
        sampleBarcode: targetMsg.sampleContext?.barcode
      },
      isEncrypted: true,
      status: 'DELIVERED'
    };

    setMessages(prev => [...prev, responseMsg]);
    if (isSoundEnabled) playClinicalAudioChime('send');

    // Notificar en tiempo real a otras pestañas
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const bc = new BroadcastChannel(`lis_intercom_${activeTenant.id}`);
        bc.postMessage({ type: 'RESOLVE_MESSAGE', originalId: targetMsg.id, resolution: resolutionData, responseMsg });
        bc.close();
      }
    } catch {}
  };

  const handleAttachPreset = (text: string, sampleStatus?: 'HEMOLIZADA' | 'DUDOSA' | 'CRITICA' | 'VALIDADA') => {
    setMessageInput(text);
    if (activeSampleContext) {
      setAttachedSample({ ...activeSampleContext, status: sampleStatus || activeSampleContext.status });
    } else if (attachedSample) {
      setAttachedSample({ ...attachedSample, status: sampleStatus || attachedSample.status });
    } else if (activeSystemOrder) {
      const realBarcode = activeSystemOrder.specimens?.[0]?.barcode || activeSystemOrder.orderNumber;
      setAttachedSample({
        barcode: realBarcode,
        orderNumber: activeSystemOrder.orderNumber,
        patientName: activeSystemOrder.patientName || 'Paciente LIS',
        testName: activeSystemOrder.testIds?.[0] || 'Prueba Clínica de Laboratorio',
        value: sampleStatus === 'HEMOLIZADA' ? 'Índice HIL 3+ detectado' : sampleStatus === 'CRITICA' ? 'Resultado Fuera de Rango / Valor Pánico' : 'Resultado Atípico',
        status: sampleStatus || 'HEMOLIZADA'
      });
    } else {
      // Cero simulación: Nunca usar mock hardcodeado ("Ríos, Gonzalo A.").
      // Dejamos en null y abrimos el selector si hay órdenes reales para que elija al paciente real.
      setAttachedSample(null);
      if (tenantOrders && tenantOrders.length > 0) {
        setShowSampleSelector(true);
      }
    }
    inputRef.current?.focus();
  };

  const handleCopyBarcode = (barcode: string) => {
    navigator.clipboard.writeText(barcode);
    setCopiedBarcode(barcode);
    setTimeout(() => setCopiedBarcode(null), 2000);
  };

  const handleExportTranscript = () => {
    const channelName = currentChannel.label;
    const dateStr = new Date().toLocaleDateString('es-PA', { year: 'numeric', month: 'long', day: 'numeric' });
    let text = `========================================================================\n`;
    text += `📋 ABREGOTECH LIS — ACTA DE CONSULTAS INTER-SEDES (ISO 15189 / LEY 81)\n`;
    text += `Organización / Cliente: ${activeTenant.name} (RUC: ${activeTenant.ruc || 'N/A'}-${activeTenant.dv || ''})\n`;
    text += `Canal: ${channelName} (#${currentChannel.name})\n`;
    text += `Fecha de Emisión: ${dateStr}\n`;
    text += `Sedes Involucradas: ${activeBranches.map(b => `${b.name} [${b.code}]`).join(' | ')}\n`;
    text += `========================================================================\n\n`;

    filteredMessages.forEach((m) => {
      text += `[${m.timestamp}] ${m.senderName} (${m.senderRole} - ${m.senderBranch}):\n`;
      if (m.sampleContext) {
        text += `  🩸 MUESTRA ADJUNTA: #${m.sampleContext.barcode} | Paciente: ${m.sampleContext.patientName} | Orden: ${m.sampleContext.orderNumber}\n`;
        text += `  Prueba: ${m.sampleContext.testName} | Estado: ${m.sampleContext.status || 'NORMAL'}\n`;
      }
      text += `  Mensaje: ${m.content}\n\n`;
    });

    const blob = new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acta_intercom_${activeTenant.id}_${currentChannel.id}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentChannel = CHANNELS_LIST.find(c => c.id === activeChannelId) || CHANNELS_LIST[0];

  const channelMessages = useMemo(() => {
    return messages.filter(m => m.channelId === activeChannelId);
  }, [messages, activeChannelId]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return channelMessages;
    const q = searchQuery.toLowerCase().trim();
    return channelMessages.filter(m =>
      m.content.toLowerCase().includes(q) ||
      m.senderName.toLowerCase().includes(q) ||
      m.sampleContext?.barcode.toLowerCase().includes(q) ||
      m.sampleContext?.patientName.toLowerCase().includes(q) ||
      m.sampleContext?.testName.toLowerCase().includes(q)
    );
  }, [channelMessages, searchQuery]);

  // (tenantOrders and activeSystemOrder defined above)

  // =========================================================================
  // 🔘 TRIGGER FLOTANTE (Oculto en módulo de validación para evitar sobreposiciones)
  // =========================================================================
  if (!isOpen && !embeddedMode) {
    if (isWorkstationTab) {
      // En la consola de validación se invoca limpiamente desde el subheader/header
      return null;
    }

    return (
      <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 flex items-center">
        <button
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);
          }}
          title={isEn
            ? `Clinical Intercom • ${activeTenant.name} (${activeBranchesCount} active ${activeBranchesCount === 1 ? 'branch' : 'branches'})`
            : `Intercom Clínico • ${activeTenant.name} (${activeBranchesCount} ${activeBranchesCount === 1 ? 'Sede' : 'Sedes'} Activas)`
          }
          className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-600 text-white shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.9),0_0_28px_rgba(6,182,212,0.6)] border border-cyan-400/50 hover:border-cyan-300 backdrop-blur-2xl transition-all duration-300 cursor-pointer group hover:scale-110 active:scale-95 ring-2 ring-cyan-500/30 hover:ring-cyan-400/60"
          aria-label="Abrir Intercom Clínico"
        >
          {/* Ícono de Mensajería */}
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform" />

          {/* Indicador de conexión en línea (punto verde) */}
          <span className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 shadow-[0_0_8px_#34d399]" />

          {/* Badge de No Leídos con Glow en esquina superior derecha */}
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-[0_0_12px_rgba(244,63,94,0.7)] border-2 border-slate-950 tracking-tight animate-in zoom-in duration-200">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  // =========================================================================
  // 🏢 MODAL PRINCIPAL: AISLADO AL CLIENTE ACTIVO
  // =========================================================================
  if (isMinimized && !embeddedMode) {
    return (
      <div className="fixed bottom-3 sm:bottom-4 right-3 sm:right-4 z-50 flex items-center bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-2xl ring-1 ring-cyan-500/30 px-3 py-1.5 space-x-3 animate-in fade-in duration-150">
        <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shrink-0">
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-slate-950 shadow-[0_0_6px_#34d399]" />
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-white">
            {isEn ? 'Clinical Intercom' : 'Intercom Clínico'}
          </span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60 max-w-[120px] truncate hidden sm:inline">
            {activeTenant.name}
          </span>
        </div>

        <div className="flex items-center space-x-1 pl-1 border-l border-slate-800">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title={isEn ? 'Maximize' : 'Maximizar'}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (onClose) onClose();
              else {
                setIsOpen(false);
                setIsMinimized(false);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title={isEn ? 'Close Intercom' : 'Cerrar Intercom'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const containerClasses = embeddedMode
    ? 'w-full bg-slate-950/95 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[700px] backdrop-blur-2xl'
    : `fixed ${isWorkstationTab ? 'top-16 sm:top-20' : 'bottom-3 sm:bottom-5'} right-3 sm:right-5 z-50 w-[calc(100vw-1.5rem)] sm:w-[640px] md:w-[800px] lg:w-[880px] max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-5rem)] bg-slate-950/95 border border-slate-800 rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col transition-all backdrop-blur-3xl ring-1 ring-cyan-500/25 h-[min(660px,85vh)]`;

  return (
    <div className={containerClasses}>
      {/* 🌟 ENCABEZADO CON IDENTIDAD CLÍNICA DEL CLIENTE */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2.5 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 text-cyan-400 rounded-2xl relative shadow-inner shrink-0">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-950 shadow-[0_0_6px_#34d399]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3 className="text-sm font-black text-white truncate">
                Intercom Clínico Inter-Sedes
              </h3>
              {/* Badge de Cliente / Laboratorio */}
              <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shrink-0">
                <Building2 className="w-3 h-3 text-cyan-400" />
                <span className="max-w-[160px] truncate">{activeTenant.name}</span>
              </span>
              <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 shrink-0">
                <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>WSS AES-256</span>
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center space-x-2 truncate mt-0.5">
              <span className="text-cyan-300 font-bold">📍 {storeBranch?.name || activeBranches[0]?.name || 'Sede Central'}</span>
              <span>•</span>
              <span className="text-slate-300 font-medium">{currentUser?.name || 'Usuario Activo'}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">{activeBranchesCount} {activeBranchesCount === 1 ? 'Sede' : 'Sedes'}</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                <span>En Línea</span>
              </span>
            </div>
          </div>
        </div>

        {/* CONTROLES DE CABECERA */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isSearchOpen ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Buscar en la conversación"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            title={isSoundEnabled ? 'Sonido clínico activado' : 'Silenciado'}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={handleExportTranscript}
            className="p-2 text-slate-400 hover:text-cyan-300 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            title={`Descargar acta de consultas para auditoría ISO 15189 de ${activeTenant.name}`}
          >
            <Download className="w-4 h-4" />
          </button>

          {!embeddedMode && (
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title={isMinimized ? 'Maximizar' : 'Minimizar'}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          )}

          {(!embeddedMode || onClose) && (
            <button
              onClick={() => {
                if (onClose) onClose();
                else setIsOpen(false);
              }}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Cerrar Intercom"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* ========================================================================= */}
          {/* 📂 BARRA LATERAL MODERNA: CANALES Y ESTADO DE RED                          */}
          {/* ========================================================================= */}
          <div className="w-full md:w-64 bg-slate-950/95 border-b md:border-b-0 md:border-r border-slate-800/80 p-3 flex flex-col shrink-0 space-y-4 overflow-y-auto">
            {/* CANALES CLÍNICOS */}
            <div className="space-y-1">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider px-2 pb-1 flex items-center justify-between">
                <span>Salas Especializadas:</span>
                <span className="text-cyan-400 font-mono font-bold">{CHANNELS_LIST.length}</span>
              </div>
              {CHANNELS_LIST.map((channel) => {
                const count = messages.filter(m => m.channelId === channel.id).length;
                const isActive = activeChannelId === channel.id;
                return (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setActiveChannelId(channel.id);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between cursor-pointer group ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-transparent border-l-2 border-cyan-400 text-cyan-200 font-bold shadow-sm'
                        : 'text-slate-400 hover:bg-slate-900/80 hover:text-white border-l-2 border-transparent'
                    }`}
                  >
                    <span className="truncate pr-1">{channel.label}</span>
                    {count > 0 && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                        isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-850 text-slate-400 group-hover:text-slate-200'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* RED DE SEDES */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider px-2 flex items-center justify-between">
                <span>Sedes en Red:</span>
                <span className="text-emerald-400 font-bold">{activeBranchesCount} Online</span>
              </div>
              <div className="space-y-1 px-1">
                {activeBranches.map((b, idx) => (
                  <div key={b.id} className="text-[11px] flex items-center justify-between text-slate-300 font-mono p-1 rounded-lg hover:bg-slate-900/50">
                    <div className="flex items-center space-x-1.5 truncate max-w-[140px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] shrink-0" />
                      <span className="truncate">{b.name}</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-bold shrink-0 font-mono">
                      {b.code || `SED-${idx + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ACCIONES RÁPIDAS DE PROTOCOLO */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider px-2 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Protocolos Rápidos:</span>
              </div>
              <button
                type="button"
                onClick={() => handleAttachPreset('🩸 Muestra Hemolizada (HIL 3+). ¿Solicitamos nueva toma sin torniquete o procesamos con nota técnica NT-HIL-02?', 'HEMOLIZADA')}
                className="w-full text-left p-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-rose-500/50 text-[11px] text-rose-300 font-mono transition cursor-pointer flex items-center justify-between group"
              >
                <span className="truncate">+ Hemólisis (HIL 3+)</span>
                <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-rose-400 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => handleAttachPreset('⚠️ Troponina I fuera de rango (>14,000 pg/mL). ¿Confirmas dilución 1:5 con salina estéril?', 'DUDOSA')}
                className="w-full text-left p-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 text-[11px] text-amber-300 font-mono transition cursor-pointer flex items-center justify-between group"
              >
                <span className="truncate">+ Dilución Troponina</span>
                <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => handleAttachPreset('🚨 Valor Pánico detectado y confirmado por duplicado. Notificado a médico tratante.', 'CRITICA')}
                className="w-full text-left p-2 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-rose-500/50 text-[11px] text-rose-300 font-mono transition cursor-pointer flex items-center justify-between group"
              >
                <span className="truncate">+ Alerta Valor Pánico</span>
                <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-rose-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 💬 ÁREA PRINCIPAL: BANDEJA DE MENSAJES MODERNA                             */}
          {/* ========================================================================= */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-900/60">
            {/* CABECERA DEL CANAL ACTIVO */}
            <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs shrink-0">
              <div className="space-y-0.5 min-w-0">
                <div className="font-bold text-white flex items-center space-x-2 truncate">
                  <span>{currentChannel.label}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${currentChannel.badgeColor}`}>
                    #{currentChannel.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{currentChannel.description}</p>
              </div>

              {channelMessages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const remaining = messages.filter(m => m.channelId !== activeChannelId);
                    setMessages(remaining);
                  }}
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
                  title="Limpiar mensajes de este canal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* BARRA DE BÚSQUEDA */}
            {isSearchOpen && (
              <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex items-center space-x-2 animate-in slide-in-from-top-2">
                <Search className="w-4 h-4 text-cyan-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Buscar mensajes en #${currentChannel.name}...`}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* LISTA DE MENSAJES CON BANNER DE BIENVENIDA NO RECORTADO */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {/* TARJETA DE INICIO DEL CANAL (Estilo Slack/Discord - Nunca se recorta) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 shadow-md space-y-2.5">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-lg shrink-0 shadow-inner">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h4 className="text-xs font-black text-white">
                        #{currentChannel.name}
                      </h4>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${currentChannel.badgeColor}`}>
                        Canal Oficial
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {currentChannel.description}. Sala segura con trazabilidad legal bajo norma ISO 15189 §7.3 y Ley 81.
                    </p>
                  </div>
                </div>

                {/* Accesos rápidos de protocolo alineados horizontalmente */}
                <div className="pt-1.5 flex flex-wrap gap-1.5 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => handleAttachPreset('🩸 Muestra Hemolizada (HIL 3+). ¿Solicitamos nueva toma sin torniquete o procesamos con nota técnica NT-HIL-02?', 'HEMOLIZADA')}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-rose-500/30 hover:border-rose-400 text-[10px] text-rose-300 font-mono transition flex items-center space-x-1 cursor-pointer hover:bg-rose-950/20"
                  >
                    <span>🩸 Hemólisis HIL 3+</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAttachPreset('🚨 Alerta STAT: Valor Pánico detectado y confirmado por duplicado. Notificando a sede receptora.', 'CRITICA')}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-amber-500/30 hover:border-amber-400 text-[10px] text-amber-300 font-mono transition flex items-center space-x-1 cursor-pointer hover:bg-amber-950/20"
                  >
                    <span>⚠️ Valor Pánico STAT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSampleSelector(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-[10px] text-cyan-300 font-mono transition flex items-center space-x-1 cursor-pointer hover:bg-cyan-950/20"
                  >
                    <Tag className="w-3 h-3 text-cyan-400" />
                    <span>Adjuntar Muestra Activa</span>
                  </button>
                </div>
              </div>

              {/* LISTA DE MENSAJES */}
              {filteredMessages.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  {searchQuery ? 'No hay mensajes que coincidan con la búsqueda.' : 'No hay interconsultas adicionales en este canal. Escribe un mensaje para comenzar.'}
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isMe = msg.senderId === (currentUser?.id || 'usr-current');
                  const isAi = msg.isAi;
                  const isSystem = msg.senderId === 'usr-system';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col space-y-1 ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      {/* INFORMACIÓN DEL REMITENTE */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-mono text-slate-400 px-1 max-w-full">
                        {isAi ? (
                          <span className="font-bold text-violet-300 flex items-center space-x-1">
                            <Bot className="w-3 h-3 text-violet-400" />
                            <span>{msg.senderName}</span>
                          </span>
                        ) : isSystem ? (
                          <span className="font-bold text-amber-300 flex items-center space-x-1">
                            <ShieldCheck className="w-3 h-3 text-amber-400" />
                            <span>{msg.senderName}</span>
                          </span>
                        ) : (
                          <span className="font-bold text-white">{isMe ? 'Tú' : msg.senderName}</span>
                        )}
                        <span className="text-cyan-400">({msg.senderRole})</span>
                        <span className="truncate max-w-[150px]">• {msg.senderBranch}</span>
                        <span className="shrink-0 text-slate-300 font-bold">• {formatMessageDateTime(msg.date, msg.timestamp, msg.createdAt).full}</span>

                        {/* Botón de responder rápido */}
                        <button
                          type="button"
                          onClick={() => handleStartReply(msg)}
                          className="text-slate-500 hover:text-cyan-400 p-0.5 ml-1 transition cursor-pointer"
                          title="Responder a este mensaje"
                        >
                          <Reply className="w-3 h-3" />
                        </button>

                        {/* Botón de eliminación */}
                        {isMe && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="text-slate-600 hover:text-rose-400 p-0.5 ml-0.5 transition cursor-pointer"
                            title="Eliminar mensaje"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* BURBUJA DEL MENSAJE */}
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs space-y-2 shadow-xl border ${
                          isMe
                            ? 'bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 text-white border-cyan-400/50 rounded-tr-none'
                            : isAi
                            ? 'bg-gradient-to-br from-slate-950 via-indigo-950/70 to-slate-900 text-indigo-100 border-indigo-500/40 rounded-tl-none ring-1 ring-indigo-500/20'
                            : isSystem
                            ? 'bg-slate-950/90 text-slate-200 border-amber-500/30 rounded-tl-none'
                            : 'bg-slate-950 text-slate-200 border-slate-800 rounded-tl-none'
                        }`}
                      >
                        {/* CITA DE MENSAJE O PREGUNTA ORIGINAL VINCULADA */}
                        {msg.replyTo && (
                          <div className={`p-2 rounded-xl text-[10px] font-mono space-y-1 border-l-2 ${
                            isMe
                              ? 'bg-black/25 border-cyan-300 text-cyan-100'
                              : 'bg-black/40 border-cyan-400 text-slate-300'
                          }`}>
                            <div className="flex items-center space-x-1.5 text-cyan-300 font-bold">
                              <Reply className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="truncate">En respuesta a: {msg.replyTo.senderName} ({msg.replyTo.senderRole})</span>
                              <span className="text-slate-400 text-[9px] shrink-0">• {msg.replyTo.questionDate} • {msg.replyTo.questionTime}</span>
                            </div>
                            <p className="line-clamp-2 text-slate-200/90 italic pl-4 font-sans">
                              "{msg.replyTo.questionText}"
                            </p>
                          </div>
                        )}

                        {/* TARJETA DE MUESTRA CLÍNICA ADJUNTA */}
                        {msg.sampleContext && (
                          <div className={`p-2.5 rounded-xl border text-[11px] font-mono space-y-1 ${
                            isMe
                              ? 'bg-cyan-950/80 border-cyan-400/40 text-cyan-100'
                              : 'bg-slate-900 border-slate-750 text-slate-200'
                          }`}>
                            <div className="flex items-center justify-between font-bold">
                              <div className="flex items-center space-x-1.5 text-amber-300">
                                <span>🩸 Muestra: #{msg.sampleContext.barcode}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyBarcode(msg.sampleContext!.barcode)}
                                  className="p-1 hover:text-white text-amber-400 transition"
                                  title="Copiar código de muestra"
                                >
                                  {copiedBarcode === msg.sampleContext.barcode ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${
                                msg.sampleContext.status === 'CRITICA'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                                  : msg.sampleContext.status === 'HEMOLIZADA'
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}>
                                {msg.sampleContext.status || 'CONSULTA'}
                              </span>
                            </div>

                            <div className="text-[10px] space-y-0.5 opacity-90">
                              <div>Paciente: <strong>{msg.sampleContext.patientName}</strong> ({msg.sampleContext.orderNumber})</div>
                              <div>Análisis: <strong>{msg.sampleContext.testName}</strong></div>
                              {msg.sampleContext.value && (
                                <div className="text-amber-300 font-bold">Hallazgo: {msg.sampleContext.value}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* CONTENIDO DEL MENSAJE */}
                        <p className="leading-relaxed font-sans text-xs whitespace-pre-wrap">{msg.content}</p>

                        {/* BADGE DE RESOLUCIÓN CLÍNICA TRAZABLE */}
                        {msg.resolution && (
                          <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-[11px] font-mono text-emerald-200 space-y-1 my-1">
                            <div className="flex items-center space-x-1.5 font-bold text-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Resolución Clínica Aprobada</span>
                            </div>
                            <div className="text-[11px] font-bold text-white font-sans">
                              {msg.resolution.decisionLabel}
                            </div>
                            <div className="text-[9px] text-emerald-400/90 flex flex-wrap items-center justify-between gap-1 border-t border-emerald-500/20 pt-1">
                              <span>Por: {msg.resolution.resolvedBy} ({msg.resolution.resolvedRole})</span>
                              <span>{msg.resolution.resolvedDate} • {msg.resolution.resolvedTime}</span>
                            </div>
                          </div>
                        )}

                        {/* ACCIONES CLÍNICAS RÁPIDAS Y RESOLUCIÓN DIRECTA */}
                        {!msg.resolution && (msg.sampleContext || msg.content.includes('?') || msg.content.includes('¿')) && (
                          <div className="pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickResolve(msg, 'NUEVA_TOMA')}
                              className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-[10px] font-mono transition flex items-center space-x-1 cursor-pointer"
                              title="Indicar que se rechaza la muestra y se solicita nueva punción"
                            >
                              <span>🔄 Solicitar Nueva Toma</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickResolve(msg, 'NOTA_TECNICA')}
                              className="px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-[10px] font-mono transition flex items-center space-x-1 cursor-pointer"
                              title="Autorizar procesamiento con nota técnica NT-HIL-02"
                            >
                              <span>📋 Nota Técnica NT-HIL-02</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartReply(msg)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-[10px] font-mono transition flex items-center space-x-1 cursor-pointer"
                              title="Escribir respuesta vinculada a esta consulta"
                            >
                              <Reply className="w-3 h-3 text-cyan-400" />
                              <span>Responder</span>
                            </button>
                          </div>
                        )}

                        {/* ARCHIVO O IMAGEN ADJUNTA REAL */}
                        {msg.attachmentUrl && (
                          <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
                            {msg.attachmentUrl.startsWith('data:image/') || msg.attachmentName?.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                              <div className="space-y-1.5 p-2">
                                <img
                                  src={msg.attachmentUrl}
                                  alt={msg.attachmentName || 'Imagen adjunta'}
                                  className="max-h-56 max-w-full rounded-lg object-contain cursor-pointer hover:opacity-95 transition bg-slate-900/50 mx-auto"
                                  onClick={() => window.open(msg.attachmentUrl, '_blank')}
                                />
                                <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 font-mono">
                                  <span className="truncate max-w-[200px]">{msg.attachmentName}</span>
                                  <span className="text-cyan-400">Clic para ampliar</span>
                                </div>
                              </div>
                            ) : (
                              <a
                                href={msg.attachmentUrl}
                                download={msg.attachmentName}
                                className="flex items-center space-x-2 text-[11px] font-mono p-2.5 hover:bg-white/5 transition"
                              >
                                <Paperclip className="w-4 h-4 text-amber-400 shrink-0" />
                                <span className="underline truncate">{msg.attachmentName}</span>
                              </a>
                            )}
                          </div>
                        )}

                        {/* PIE DE SEGURIDAD & AISLAMIENTO CLIENTE */}
                        <div className="flex items-center justify-between text-[9px] font-mono opacity-80 pt-1.5 border-t border-white/10">
                          <span className="flex items-center space-x-1 text-emerald-300">
                            <Lock className="w-2.5 h-2.5" />
                            <span>AES-256 E2E • {activeTenant.id}</span>
                          </span>
                          <span className="flex items-center space-x-1 text-cyan-300">
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Entregado en Red</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* INDICADOR DE ESCRITURA */}
              {isTypingOther && (
                <div className="flex items-center space-x-2 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 p-2.5 rounded-2xl border border-cyan-500/30 animate-pulse w-fit">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>{isTypingOther} está analizando...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* BANNER DE MUESTRA ADJUNTA */}
            {attachedSample && (
              <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-amber-300">
                <div className="flex items-center space-x-2 truncate">
                  <Tag className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">
                    Muestra Adjunta: <strong>#{attachedSample.barcode}</strong> ({attachedSample.patientName} — {attachedSample.testName})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedSample(null)}
                  className="p-1 hover:text-white text-slate-400 cursor-pointer"
                  title="Quitar muestra"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* SELECTOR DE MUESTRAS DEL CLIENTE ACTIVO */}
            {showSampleSelector && (
              <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2 animate-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <Stethoscope className="w-4 h-4 text-cyan-400" />
                    <span>Muestras de {activeTenant.name}:</span>
                  </span>
                  <button type="button" onClick={() => setShowSampleSelector(false)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {tenantOrders.slice(0, 8).map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => {
                        const realBarcode = ord.specimens?.[0]?.barcode || ord.orderNumber;
                        setAttachedSample({
                          barcode: realBarcode,
                          orderNumber: ord.orderNumber,
                          patientName: ord.patientName || (ord.patient?.firstName ? `${ord.patient.firstName} ${ord.patient.lastName}` : 'Paciente LIS'),
                          testName: ord.testIds?.[0] || 'Prueba Clínica Urgencia',
                          status: 'DUDOSA'
                        });
                        setShowSampleSelector(false);
                      }}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 text-left text-[11px] font-mono transition cursor-pointer"
                    >
                      <div className="text-cyan-300 font-bold truncate">#{ord.orderNumber}</div>
                      <div className="text-slate-300 truncate">{ord.patientName || 'Paciente LIS'}</div>
                    </button>
                  ))}
                  {tenantOrders.length === 0 && (
                    <div className="text-slate-500 text-xs py-2 col-span-2 text-center">
                      No hay órdenes recientes registradas para este cliente.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BANNER DE RESPUESTA EN CURSO */}
            {replyingTo && (
              <div className="px-4 py-2 bg-slate-900/95 border-t border-cyan-500/40 flex items-center justify-between text-xs font-mono text-cyan-300">
                <div className="flex items-center space-x-2 truncate">
                  <Reply className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">
                    Respondiendo a <strong>{replyingTo.senderName}</strong>: <span className="italic text-slate-300 opacity-80">"{replyingTo.content.slice(0, 45)}..."</span>
                    <span className="text-[10px] text-slate-400 ml-1">({formatMessageDateTime(replyingTo.date, replyingTo.timestamp, replyingTo.createdAt).full})</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="p-1 hover:text-white text-slate-400 cursor-pointer"
                  title="Cancelar respuesta"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* COMPOSITOR DE MENSAJE MODERNO */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
              {/* INPUT DE ARCHIVO OCULTO */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* CHIP DE ARCHIVO ADJUNTO */}
              {attachedFile && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-cyan-950/70 border border-cyan-500/40 rounded-xl text-xs font-mono text-cyan-200 animate-in fade-in">
                  <div className="flex items-center space-x-2 truncate">
                    <Paperclip className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{attachedFile.name}</span>
                    {attachedFile.size && (
                      <span className="text-[10px] text-cyan-400/70 font-sans">({attachedFile.size})</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="p-1 hover:text-white text-cyan-400 transition cursor-pointer"
                    title="Quitar archivo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSampleSelector(!showSampleSelector)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    attachedSample ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-900 text-slate-400 hover:text-cyan-300 border-slate-800'
                  }`}
                  title="Adjuntar Muestra Activa"
                >
                  <Tag className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    attachedFile ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-400 hover:text-cyan-300 border-slate-800'
                  }`}
                  title="Subir Frotis / Imagen / PDF"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={
                    activeChannelId === 'ch-copilot'
                      ? 'Escribe una consulta técnica a Copilot IA...'
                      : `Escribe un mensaje en #${currentChannel.name}...`
                  }
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none font-sans"
                />

                <button
                  type="submit"
                  disabled={!messageInput.trim() && !attachedSample && !attachedFile}
                  className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-xs transition flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
                <span>Canal: #{currentChannel.name} • Sede: {storeBranch?.name || activeBranches[0]?.name || 'Central'}</span>
                <span>Enter para enviar • Encriptado E2E</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
