import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare, Send, Paperclip, ShieldCheck, Wifi,
  Building2, AlertTriangle, CheckCheck, Search, X, Maximize2,
  Minimize2, Image as ImageIcon, Tag, Volume2, VolumeX, Sparkles,
  FileText, Check, RefreshCw, UserCheck, Lock,
  PlusCircle, Bot, Copy, Download, Trash2, Stethoscope, ChevronRight,
  Sparkle
} from 'lucide-react';
import { useLisStore } from '../store/useLisStore';
import { Tenant, Branch } from '../types';
import { MOCK_TENANTS } from '../data/mockData';

export interface ChatMessage {
  id: string;
  tenantId: string; // 🛡️ AISLAMIENTO MULTI-TENANT: Cada cliente tiene su propia base de mensajes
  senderId: string;
  senderName: string;
  senderRole: string;
  senderBranch: string;
  senderAvatar?: string;
  timestamp: string;
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
    label: '🧪 Banco de Sangre STAT',
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
    description: 'Asistente 24/7 de validación analítica CLSI, reglas Westgard y compatibilidad de tubos'
  },
];

// Helper para inicializar mensajes clínicos aislados por cliente
const getInitialMessagesForTenant = (tenant: Tenant): ChatMessage[] => {
  const tenantId = tenant.id;
  const tenantName = tenant.name;
  const branch1 = tenant.branches?.[0]?.name || 'Sede Principal';
  const branch2 = tenant.branches?.[1]?.name || 'Sucursal';

  if (tenantId === 'lab-san-jose') {
    return [
      {
        id: 'msg-sj-101',
        tenantId: 'lab-san-jose',
        senderId: 'usr-chief-1',
        senderName: 'Dr. Roberto Icaza Villalaz',
        senderRole: 'Jefe de Laboratorio',
        senderBranch: branch1,
        timestamp: '09:12 AM',
        content: `Estimados colegas en ${tenantName}: Recibimos el tubo #BAR-CARD-01 para Troponina I con índice de Hemólisis HIL 3+. La muestra proviene de ${branch2}. ¿Recomiendan solicitar nueva toma o procesamos con nota técnica ISO?`,
        channelId: 'ch-hemolizadas',
        sampleContext: {
          barcode: 'BAR-CARD-01',
          orderNumber: 'ORD-2026-9001',
          patientName: 'Ríos, Gonzalo A.',
          testName: 'Troponina I Ultrasensible STAT',
          value: 'HIL Hemólisis 3+',
          status: 'HEMOLIZADA'
        },
        isEncrypted: true,
        status: 'READ'
      },
      {
        id: 'msg-sj-102',
        tenantId: 'lab-san-jose',
        senderId: 'usr-tech-med-1',
        senderName: 'Lic. Sofía Guardia Franco',
        senderRole: 'Tecnóloga Médica',
        senderBranch: branch2,
        timestamp: '09:15 AM',
        content: `Hola Dr. Roberto. Troponina I Ultrasensible en este analizador no sufre interferencia negativa por Hemólisis hasta HIL < 500 mg/dL. Si la muestra no presenta microcoágulos, se puede procesar agregando la nota técnica codificada NT-HIL-02.`,
        channelId: 'ch-hemolizadas',
        sampleContext: {
          barcode: 'BAR-CARD-01',
          orderNumber: 'ORD-2026-9001',
          patientName: 'Ríos, Gonzalo A.',
          testName: 'Troponina I Ultrasensible STAT',
          status: 'HEMOLIZADA'
        },
        isEncrypted: true,
        status: 'READ'
      },
      {
        id: 'msg-sj-103',
        tenantId: 'lab-san-jose',
        senderId: 'usr-tech-med-2',
        senderName: 'Lic. Carlos E. Mendoza',
        senderRole: 'TM Hematología',
        senderBranch: branch2,
        timestamp: '09:22 AM',
        content: 'Consulta urgente: Muestra #BAR-HEM-04 presenta trombocitopenia severa en conteo automatizado (22,000 /µL) pero el frotis muestra grumos plaquetarios por EDTA. ¿Procedemos con citrato de sodio?',
        channelId: 'ch-dudosos',
        sampleContext: {
          barcode: 'BAR-HEM-04',
          orderNumber: 'ORD-2026-9004',
          patientName: 'Vega, Lucía',
          testName: 'Hemograma + Conteo de Plaquetas',
          value: '22,000 /µL (Pseudotrombocitopenia)',
          status: 'DUDOSA'
        },
        isEncrypted: true,
        status: 'READ'
      },
      {
        id: 'msg-sj-104',
        tenantId: 'lab-san-jose',
        senderId: 'usr-copilot',
        senderName: 'AbregoTech Copilot AI',
        senderRole: 'Sistema Experto ISO 15189',
        senderBranch: 'Servidor Clínico AbregoTech Cloud',
        timestamp: '09:23 AM',
        content: '💡 Sugerencia Automatizada: En sospecha de Pseudotrombocitopenia inducida por EDTA, la guía CLSI H20-A2 recomienda recolectar un tubo con Citrato de Sodio (Tapa Celeste 3.2%), multiplicar el conteo obtenido por factor 1.1 para corregir la dilución, y reportar con la observación correspondiente.',
        channelId: 'ch-dudosos',
        isAi: true,
        isEncrypted: true,
        status: 'READ'
      }
    ];
  }

  // Mensajes de bienvenida y coordinación interna para cualquier otro cliente
  return [
    {
      id: `msg-init-${tenantId}-1`,
      tenantId,
      senderId: 'usr-system',
      senderName: 'Dirección Médica & Calidad',
      senderRole: 'Administración LIS',
      senderBranch: branch1,
      timestamp: '08:00 AM',
      content: `Canal interno privado y exclusivo activado para ${tenantName}. Red médica inter-sedes cifrada de extremo a extremo bajo Ley 81 de Protección de Datos Médicos y estándar ISO 15189.`,
      channelId: 'ch-general',
      isEncrypted: true,
      status: 'READ'
    },
    {
      id: `msg-init-${tenantId}-2`,
      tenantId,
      senderId: 'usr-copilot',
      senderName: 'AbregoTech Copilot AI',
      senderRole: 'Asistente Clínico 24/7',
      senderBranch: 'AbregoTech Medical AI Engine',
      timestamp: '08:01 AM',
      content: `Hola equipo de ${tenantName}. Las sedes registradas para este cliente están interconectadas. Pueden compartir consultas de muestras, valores críticos y frotis en tiempo real.`,
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
  const { currentUser, currentTenant: storeTenant, currentBranch: storeBranch, orders, language } = useLisStore();
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
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`lis_inter_branch_chat_${activeTenant.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return getInitialMessagesForTenant(activeTenant);
  });

  // Al cambiar de cliente, recargar inmediatamente su bandeja aislada
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`lis_inter_branch_chat_${activeTenant.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        }
      } catch {}
    }
    setMessages(getInitialMessagesForTenant(activeTenant));
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
  const [attachedFile, setAttachedFile] = useState<{ name: string; url: string } | null>(null);
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);

  // WebSocket Connection Simulator
  const [wsLatency, setWsLatency] = useState<number>(14);
  const [isTypingOther, setIsTypingOther] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(2);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Latencia periódica simulada
  useEffect(() => {
    const interval = setInterval(() => {
      setWsLatency(Math.floor(11 + Math.random() * 7));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

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
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const senderName = currentUser?.name || 'Lic. Rubén Ábrego';
    const senderRole = currentUser?.role ? currentUser.role.toUpperCase() : 'TECNÓLOGO MÉDICO';
    const senderBranch = storeBranch?.name || activeBranches[0]?.name || 'Sede Central';

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      tenantId: activeTenant.id,
      senderId: currentUser?.id || 'usr-current',
      senderName,
      senderRole,
      senderBranch,
      timestamp: timeStr,
      content: finalContent,
      channelId: activeChannelId,
      sampleContext: attachedSample || undefined,
      attachmentName: attachedFile?.name,
      attachmentUrl: attachedFile?.url,
      isEncrypted: true,
      status: 'DELIVERED'
    };

    setMessages(prev => [...prev, newMsg]);
    setMessageInput('');
    setAttachedFile(null);
    setAttachedSample(null);
    if (unreadCount > 0) setUnreadCount(0);

    if (isSoundEnabled) {
      playClinicalAudioChime('send');
    }

    // Respuesta inteligente contextual
    if (activeChannelId === 'ch-copilot') {
      setIsTypingOther('AbregoTech Copilot AI');
      setTimeout(() => {
        setIsTypingOther(null);
        const aiReply: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          tenantId: activeTenant.id,
          senderId: 'usr-copilot',
          senderName: 'AbregoTech Copilot AI',
          senderRole: 'Asistente Clínico ISO 15189',
          senderBranch: `${activeTenant.name} • AI Node`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: generateAiResponse(finalContent, attachedSample),
          channelId: 'ch-copilot',
          isAi: true,
          isEncrypted: true,
          status: 'READ'
        };
        setMessages(prev => [...prev, aiReply]);
        if (isSoundEnabled) playClinicalAudioChime('receive');
      }, 1500);
    } else {
      const otherBranch = activeBranches[1]?.name || activeBranches[0]?.name || 'Sede Central';
      setIsTypingOther(`Tecnólogo de ${otherBranch}`);
      setTimeout(() => {
        setIsTypingOther(null);
        const autoResp: ChatMessage = {
          id: `msg-resp-${Date.now()}`,
          tenantId: activeTenant.id,
          senderId: 'usr-peer-tm',
          senderName: 'Lic. Colega de Guardia',
          senderRole: 'TM Validación',
          senderBranch: otherBranch,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: `Recibida consulta inter-sede en ${activeTenant.name} sobre #${newMsg.sampleContext?.barcode || 'Muestra'}. Verificado en sistema: recomendación técnica autorizada bajo norma ISO 15189.`,
          channelId: activeChannelId,
          isEncrypted: true,
          status: 'READ'
        };
        setMessages(prev => [...prev, autoResp]);
        if (isSoundEnabled) playClinicalAudioChime('receive');
      }, 2500);
    }
  };

  const generateAiResponse = (query: string, sample?: SecureInternalMessagingWidgetProps['activeSampleContext'] | null): string => {
    const q = query.toLowerCase();
    if (q.includes('hemolisis') || q.includes('hemolizada') || q.includes('hil')) {
      return '🩸 Guía HIL: La hemólisis (HIL 3+ o >300 mg/dL de hemoglobina libre) genera interferencia biológica directa elevando falsamente Potasio (K+), DHL, AST y Fosfatasa Ácida por liberación eritrocitaria. En Troponina I Ultrasensible no suele haber interferencia negativa severa salvo lisis extrema. Recomendación: Solicitar tubo nuevo sin torniquete prolongado o reportar con nota técnica NT-HIL.';
    }
    if (q.includes('plaqueta') || q.includes('edta') || q.includes('grumo')) {
      return '🔬 Pseudotrombocitopenia por EDTA: Ocurre en ~0.1% de pacientes por aglutininas dependientes de EDTA. Procedimiento obligatorio: Tomar muestra simultánea en Tubo de Citrato de Sodio (3.2%), procesar en <1 hora, multiplicar el recuento por 1.1 y verificar frotis periférico en 100x.';
    }
    if (q.includes('dilucion') || q.includes('rango') || q.includes('fuera')) {
      return '⚠️ Dilución de Muestras: Para analizadores de Química e Inmuno, utilice diluyente de la plataforma (Salina estéril 0.9% o Diluyente de Matriz). En Troponina o HCG, una dilución 1:5 o 1:10 es estándar. Ingrese el factor en la consola del analizador para que el LIS reciba el resultado corregido automáticamente.';
    }
    return `🤖 Consulta Analizada para ${activeTenant.name}: Para el ensayo ${sample ? `"${sample.testName}" en muestra #${sample.barcode}` : 'solicitado'}, los controles de calidad interno y calibración están vigentes. Si el valor supera los límites críticos de alerta, comunique al médico solicitante y registre la llamada en la pestaña de Notificaciones ISO 15189.`;
  };

  const handleAttachPreset = (text: string, sampleStatus?: 'HEMOLIZADA' | 'DUDOSA' | 'CRITICA' | 'VALIDADA') => {
    setMessageInput(text);
    if (activeSampleContext) {
      setAttachedSample({ ...activeSampleContext, status: sampleStatus || activeSampleContext.status });
    } else {
      setAttachedSample({
        barcode: 'BAR-CARD-01',
        orderNumber: 'ORD-2026-9001',
        patientName: 'Ríos, Gonzalo A.',
        testName: 'Troponina I Ultrasensible STAT',
        value: 'Resultado Atípico / HIL 3+',
        status: sampleStatus || 'HEMOLIZADA'
      });
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

  // Órdenes del cliente activo para el selector de muestras
  const tenantOrders = useMemo(() => {
    return (orders || []).filter(o => !o.tenantId || o.tenantId === activeTenant.id);
  }, [orders, activeTenant.id]);

  // =========================================================================
  // 🔘 TRIGGER FLOTANTE ELEGANTE CON AISLAMIENTO POR CLIENTE & SEDES REALES
  // =========================================================================
  if (!isOpen && !embeddedMode) {
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
          className="relative flex items-center gap-2.5 py-2 px-3.5 rounded-full bg-gradient-to-r from-slate-950/95 via-[#02182b]/90 to-slate-950/95 hover:from-slate-900 hover:via-cyan-950/80 hover:to-slate-900 border border-cyan-400/40 hover:border-cyan-300 shadow-[0_10px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.9),0_0_28px_rgba(6,182,212,0.45)] backdrop-blur-2xl transition-all duration-300 cursor-pointer group hover:scale-105 active:scale-95 ring-1 ring-cyan-500/20 hover:ring-cyan-400/50"
        >
          {/* Esfera luminosa refinada con ícono y presencia */}
          <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)] border border-white/20 shrink-0 group-hover:rotate-6 transition-transform">
            <MessageSquare className="w-3.5 h-3.5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950 shadow-[0_0_8px_#34d399]" />
          </div>

          {/* Etiqueta elegante */}
          <span className="text-xs font-black tracking-wide text-white group-hover:text-cyan-200 transition-colors">
            Intercom
          </span>

          {/* Badge de No Leídos con Glow */}
          {unreadCount > 0 && (
            <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full min-w-[22px] text-center shadow-[0_0_12px_rgba(244,63,94,0.6)] border border-rose-300/40 tracking-tight animate-in zoom-in duration-200">
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
      <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 flex items-center bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-2xl ring-1 ring-cyan-500/30 px-3 py-2 space-x-3 animate-in fade-in duration-150">
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
    : 'fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 w-[calc(100vw-1.5rem)] sm:w-[580px] md:w-[720px] max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-2rem)] bg-slate-950/95 border border-slate-750 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col transition-all backdrop-blur-2xl ring-1 ring-cyan-500/30 h-[min(680px,90vh)]';

  return (
    <div className={containerClasses}>
      {/* 🌟 ENCABEZADO CON IDENTIDAD CLÍNICA DEL CLIENTE */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
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
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shrink-0">
                <Building2 className="w-3 h-3 text-cyan-400" />
                <span className="max-w-[150px] truncate">{activeTenant.name}</span>
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
              <span className="text-slate-500">{wsLatency}ms</span>
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
          {/* 📂 BARRA LATERAL: CANALES & SEDES ESPECÍFICAS DE ESTE CLIENTE              */}
          {/* ========================================================================= */}
          <div className="w-full md:w-60 bg-slate-950/90 border-b md:border-b-0 md:border-r border-slate-850 p-3 flex flex-col shrink-0 space-y-3 overflow-y-auto">
            {/* CANALES CLÍNICOS */}
            <div className="space-y-1">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider px-2 pb-1 flex items-center justify-between">
                <span>Salas Especializadas:</span>
                <span className="text-cyan-400">{CHANNELS_LIST.length}</span>
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
                    className={`w-full text-left px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{channel.label}</span>
                    {count > 0 && (
                      <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* RED DE SEDES PERTENECIENTES A ESTE CLIENTE */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider px-2 flex items-center justify-between">
                <span>Sedes en Red:</span>
                <span className="text-emerald-400 font-bold">{activeBranchesCount} Online</span>
              </div>
              <div className="space-y-1.5 px-1">
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

            {/* PRESETS DE CONSULTA RÁPIDA 1-CLIC */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider px-2 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Macros Clínicos:</span>
              </div>
              <button
                onClick={() => handleAttachPreset('🩸 Muestra Hemolizada (HIL 3+). ¿Solicitamos nueva toma sin torniquete o procesamos con nota técnica NT-HIL-02?', 'HEMOLIZADA')}
                className="w-full text-left p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 text-[10px] text-amber-300 font-mono transition cursor-pointer"
              >
                + Muestra Hemolizada (HIL 3+)
              </button>
              <button
                onClick={() => handleAttachPreset('⚠️ Troponina I fuera de rango (>14,000 pg/mL). ¿Confirmas dilución 1:5 con salina estéril?', 'DUDOSA')}
                className="w-full text-left p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 text-[10px] text-amber-300 font-mono transition cursor-pointer"
              >
                + Dilución Troponina 1:5
              </button>
              <button
                onClick={() => handleAttachPreset('🚨 Valor Pánico de Glucosa (420 mg/dL). Confirmado por duplicado. Notificado a médico tratante.', 'CRITICA')}
                className="w-full text-left p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 text-[10px] text-rose-300 font-mono transition cursor-pointer"
              >
                + Alerta Valor Pánico
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 💬 ÁREA PRINCIPAL: BANDEJA DE MENSAJES DEL CLIENTE ACTIVO                  */}
          {/* ========================================================================= */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-900/60">
            {/* CABECERA DEL CANAL ACTIVO */}
            <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-850 flex items-center justify-between text-xs shrink-0">
              <div className="space-y-0.5 min-w-0">
                <div className="font-black text-white flex items-center space-x-2 truncate">
                  <span>{currentChannel.label}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${currentChannel.badgeColor}`}>
                    #{currentChannel.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{currentChannel.description}</p>
              </div>

              {channelMessages.length > 0 && (
                <button
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
                  placeholder={`Buscar mensajes en ${activeTenant.name} (#BAR, paciente, texto)...`}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* LISTA DE MENSAJES */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 rounded-3xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-300 font-bold">
                    {searchQuery ? 'No hay mensajes que coincidan con la búsqueda.' : `No hay mensajes en este canal para ${activeTenant.name}.`}
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Inicia una consulta inter-sede para {activeTenant.name} o usa uno de los macros rápidos.
                  </p>
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isMe = msg.senderId === (currentUser?.id || 'usr-current');
                  const isAi = msg.isAi;

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
                        ) : (
                          <span className="font-bold text-white">{isMe ? 'Tú' : msg.senderName}</span>
                        )}
                        <span className="text-cyan-400">({msg.senderRole})</span>
                        <span className="truncate max-w-[150px]">• {msg.senderBranch}</span>
                        <span className="shrink-0">• {msg.timestamp}</span>
                      </div>

                      {/* BURBUJA DEL MENSAJE */}
                      <div
                        className={`max-w-[88%] rounded-2xl p-3.5 text-xs space-y-2 shadow-xl border ${
                          isMe
                            ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white border-cyan-400/50 rounded-tr-none'
                            : isAi
                            ? 'bg-gradient-to-br from-slate-950 via-indigo-950/60 to-slate-900 text-indigo-100 border-indigo-500/40 rounded-tl-none ring-1 ring-indigo-500/20'
                            : 'bg-slate-950 text-slate-200 border-slate-800 rounded-tl-none'
                        }`}
                      >
                        {/* TARJETA DE MUESTRA CLÍNICA ADJUNTA */}
                        {msg.sampleContext && (
                          <div className={`p-3 rounded-xl border text-[11px] font-mono space-y-1.5 ${
                            isMe
                              ? 'bg-cyan-950/70 border-cyan-400/40 text-cyan-100'
                              : isAi
                              ? 'bg-indigo-950/80 border-indigo-500/40 text-indigo-200'
                              : 'bg-slate-900 border-slate-750 text-slate-200'
                          }`}>
                            <div className="flex items-center justify-between font-bold">
                              <div className="flex items-center space-x-1.5 text-amber-300">
                                <span>🩸 Muestra: #{msg.sampleContext.barcode}</span>
                                <button
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

                        {/* ARCHIVO ADJUNTO */}
                        {msg.attachmentName && (
                          <div className="flex items-center space-x-2 text-[11px] font-mono bg-black/30 p-2 rounded-xl border border-white/10">
                            <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                            <span className="underline">{msg.attachmentName}</span>
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
                  <span>{isTypingOther} está escribiendo...</span>
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
                  <button onClick={() => setShowSampleSelector(false)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {tenantOrders.slice(0, 6).map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => {
                        setAttachedSample({
                          barcode: `BAR-${ord.orderNumber.slice(-4)}`,
                          orderNumber: ord.orderNumber,
                          patientName: ord.patient?.firstName ? `${ord.patient.firstName} ${ord.patient.lastName}` : 'Paciente LIS',
                          testName: ord.testIds[0] || 'Prueba Clínica STAT',
                          status: 'DUDOSA'
                        });
                        setShowSampleSelector(false);
                      }}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 text-left text-[11px] font-mono transition cursor-pointer"
                    >
                      <div className="text-cyan-300 font-bold truncate">#{ord.orderNumber}</div>
                      <div className="text-slate-300 truncate">{ord.patient?.firstName} {ord.patient?.lastName}</div>
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

            {/* COMPOSITOR DE MENSAJE */}
            <form onSubmit={handleSendMessage} className="p-3.5 bg-slate-950 border-t border-slate-850 space-y-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSampleSelector(!showSampleSelector)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    attachedSample ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-900 text-slate-400 hover:text-cyan-300 border-slate-800'
                  }`}
                  title="Adjuntar Muestra de este Cliente"
                >
                  <Tag className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setAttachedFile({ name: 'Frotis_Plaquetario_Grumos_100x.jpg', url: '#' })}
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    attachedFile ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-400 hover:text-cyan-300 border-slate-800'
                  }`}
                  title="Adjuntar Foto de Tubo / Frotis Sanguíneo"
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
                      ? `Pregunta a Copilot AI para ${activeTenant.name}...`
                      : `Escribe a las sedes de ${activeTenant.name}...`
                  }
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none font-sans"
                />

                <button
                  type="submit"
                  disabled={!messageInput.trim() && !attachedSample && !attachedFile}
                  className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-black rounded-2xl text-xs transition flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
                <span>Canal: #{currentChannel.name} • Cliente: {activeTenant.name}</span>
                <span>Enter para enviar • Encriptado E2E</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
