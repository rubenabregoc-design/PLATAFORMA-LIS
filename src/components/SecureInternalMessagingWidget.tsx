import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Paperclip, ShieldCheck, Wifi, WifiOff,
  Building2, AlertTriangle, CheckCheck, Search, X, Maximize2,
  Minimize2, Image, Tag, PhoneCall, Volume2, VolumeX, Sparkles,
  FileText, Check, RefreshCw, UserCheck, ChevronDown, Lock,
  PlusCircle, Sparkle
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderBranch: string;
  senderAvatar?: string;
  timestamp: string;
  content: string;
  channelId: string;
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
  embeddedMode?: boolean; // If true, renders inside a panel rather than floating modal
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

export const BRANCHES_LIST = [
  { id: 'branch-via-espana', name: 'Sede Vía España (Lab Central)', code: 'VE-01', onlineCount: 6 },
  { id: 'branch-costa-este', name: 'Sede Costa del Este', code: 'CDE-02', onlineCount: 4 },
  { id: 'branch-transistmica', name: 'Sede Transístmica', code: 'TRA-03', onlineCount: 3 },
  { id: 'branch-david', name: 'Sede David (Chiriquí)', code: 'DAV-04', onlineCount: 2 },
];

export const CHANNELS_LIST = [
  { id: 'ch-hemolizadas', name: 'consultas-muestra-hemolizada', label: '🩸 Muestras Hemolizadas / HIL', description: 'Consultas sobre rechazo, re-muestreo o procesamiento con nota técnica' },
  { id: 'ch-dudosos', name: 'resultados-dudosos-criticos', label: '⚠️ Resultados Dudosos & Críticos', description: 'Confirmación de valores pánico, deltas atípicos y diluciones' },
  { id: 'ch-banco-sangre', name: 'banco-sangre-urgente', label: '🩸 Banco de Sangre & Transfusión', description: 'Coordinación de unidades O-, anticuerpos irregulares y fenotipos' },
  { id: 'ch-general', name: 'coordinacion-inter-sedes', label: '🏢 Coordinación General Inter-Sedes', description: 'Avisos de derivación de muestras, reactivos y logística' },
];

export const SecureInternalMessagingWidget: React.FC<SecureInternalMessagingWidgetProps> = ({
  initialOpen = false,
  embeddedMode = false,
  activeSampleContext,
  onClose
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [activeChannelId, setActiveChannelId] = useState<string>('ch-hemolizadas');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');
  const [messageInput, setMessageInput] = useState<string>('');
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [attachedSample, setAttachedSample] = useState<SecureInternalMessagingWidgetProps['activeSampleContext'] | null>(activeSampleContext || null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; url: string } | null>(null);

  // WebSocket Connection Simulator
  const [wsConnected, setWsConnected] = useState<boolean>(true);
  const [wsLatency, setWsLatency] = useState<number>(14);
  const [isTypingOther, setIsTypingOther] = useState<string | null>(null);

  // Unread Counter
  const [unreadCount, setUnreadCount] = useState<number>(2);

  // Chat History State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-101',
      senderId: 'usr-302',
      senderName: 'Lic. Camilo S.',
      senderRole: 'Tecnólogo Jefe',
      senderBranch: 'Sede Costa del Este',
      timestamp: '09:12 AM',
      content: 'Estimados en Sede Vía España Central: Recibimos el tubo #BAR-CARD-01 para Troponina I con índice de Hemólisis HIL 3+. ¿Recomiendan solicitar nueva toma o procesamos con advertencia en informe ISO?',
      channelId: 'ch-hemolizadas',
      sampleContext: {
        barcode: 'BAR-CARD-01',
        orderNumber: 'ORD-2026-9001',
        patientName: 'Ríos, Gonzalo A.',
        testName: 'Troponina I Ultrasensible',
        value: 'HIL Hemólisis 3+',
        status: 'HEMOLIZADA'
      },
      isEncrypted: true,
      status: 'READ'
    },
    {
      id: 'msg-102',
      senderId: 'usr-101',
      senderName: 'Lic. Valentina Soto',
      senderRole: 'TM Especialista Inmuno',
      senderBranch: 'Sede Vía España (Lab Central)',
      timestamp: '09:15 AM',
      content: 'Hola Camilo. Troponina I Ultrasensible en este analizador no sufre interferencia negativa por Hemólisis hasta HIL < 500 mg/dL. Si la muestra no presenta microcoágulos, se puede procesar agregando la nota técnica codificada NT-HIL-02.',
      channelId: 'ch-hemolizadas',
      sampleContext: {
        barcode: 'BAR-CARD-01',
        orderNumber: 'ORD-2026-9001',
        patientName: 'Ríos, Gonzalo A.',
        testName: 'Troponina I Ultrasensible',
        status: 'HEMOLIZADA'
      },
      isEncrypted: true,
      status: 'READ'
    },
    {
      id: 'msg-103',
      senderId: 'usr-405',
      senderName: 'Dra. María Elena D.',
      senderRole: 'Hematóloga Consultora',
      senderBranch: 'Sede David (Chiriquí)',
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
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeSampleContext) {
      setAttachedSample(activeSampleContext);
    }
  }, [activeSampleContext]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeChannelId]);

  // Latency pulse simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setWsLatency(Math.floor(12 + Math.random() * 8));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() && !attachedSample && !attachedFile) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'usr-4091',
      senderName: 'Lic. Valentina Soto',
      senderRole: 'Tecnólogo Médico Senior',
      senderBranch: 'Sede Vía España (Lab Central)',
      timestamp: timeStr,
      content: messageInput.trim(),
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
    if (unreadCount > 0) setUnreadCount(0);

    // Simulate response after 2.5 seconds
    setIsTypingOther('Dra. María Elena D. (Sede David)');
    setTimeout(() => {
      setIsTypingOther(null);
      const autoResp: ChatMessage = {
        id: `msg-resp-${Date.now()}`,
        senderId: 'usr-405',
        senderName: 'Dra. María Elena D.',
        senderRole: 'Hematóloga Consultora',
        senderBranch: 'Sede David (Chiriquí)',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `Recibido consulta inter-sede sobre #${newMsg.sampleContext?.barcode || 'Muestra'}. Verificado en LIS central: recomendación autorizada bajo protocolo ISO 15189.`,
        channelId: activeChannelId,
        isEncrypted: true,
        status: 'READ'
      };
      setMessages(prev => [...prev, autoResp]);
    }, 2800);
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
  };

  const currentChannel = CHANNELS_LIST.find(c => c.id === activeChannelId) || CHANNELS_LIST[0];
  const channelMessages = messages.filter(m => m.channelId === activeChannelId);

  // If floating collapsed trigger button
  if (!isOpen && !embeddedMode) {
    return (
      <button
        onClick={() => { setIsOpen(true); setUnreadCount(0); }}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white p-3.5 rounded-full shadow-2xl border-2 border-indigo-400/40 flex items-center space-x-3 transition-all transform hover:scale-105 cursor-pointer group"
      >
        <div className="relative">
          <MessageSquare className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-indigo-900"></span>
        </div>
        <div className="text-left hidden sm:block pr-1">
          <div className="text-xs font-black tracking-wide flex items-center space-x-1.5">
            <span>Mensajería Inter-Sedes</span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] px-1.5 py-0.2 rounded font-mono">WSS</span>
          </div>
          <div className="text-[10px] text-indigo-200 font-mono">Consultas Técnicas & Muestras</div>
        </div>
        {unreadCount > 0 && (
          <span className="bg-rose-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow border border-white/20">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  // CONTAINER LAYOUT
  const containerClasses = embeddedMode
    ? 'w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[650px]'
    : `fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[540px] md:w-[620px] bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-all ${
        isMinimized ? 'h-16' : 'h-[620px]'
      }`;

  return (
    <div className={containerClasses}>
      {/* HEADER BAR */}
      <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <span className="p-2 bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 rounded-2xl relative">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-950"></span>
          </span>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black text-white">Consultas Inter-Sedes en Tiempo Real</h3>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>WSS WSS/AES-256</span>
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center space-x-2">
              <span className="text-emerald-400">● Conectado</span>
              <span>• Latencia: {wsLatency}ms</span>
              <span>• 4 Sedes Activas</span>
            </div>
          </div>
        </div>

        {/* HEADER CONTROLS */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title={isSoundEnabled ? 'Sonido activado' : 'Silenciado'}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {!embeddedMode && (
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
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
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* LEFT SIDEBAR: CHANNELS & BRANCH STATUS */}
          <div className="w-full md:w-56 bg-slate-950/80 border-b md:border-b-0 md:border-r border-slate-800 p-3 flex flex-col shrink-0 space-y-4 overflow-y-auto">
            {/* CHANNELS LIST */}
            <div className="space-y-1">
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
                Canales de Consulta:
              </div>
              {CHANNELS_LIST.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannelId(channel.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    activeChannelId === channel.id
                      ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 shadow'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="truncate">{channel.label}</span>
                  {messages.filter(m => m.channelId === channel.id).length > 0 && (
                    <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-1.5 py-0.2 rounded-full">
                      {messages.filter(m => m.channelId === channel.id).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* BRANCHES ONLINE STATUS */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center justify-between">
                <span>Sedes Conectadas:</span>
                <span className="text-emerald-400 font-bold">4/4</span>
              </div>
              <div className="space-y-1.5 px-1">
                {BRANCHES_LIST.map((b) => (
                  <div key={b.id} className="text-[11px] flex items-center justify-between text-slate-300 font-mono">
                    <div className="flex items-center space-x-1.5 truncate max-w-[130px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                      <span className="truncate">{b.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{b.onlineCount} online</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PRESET CONSULTATION QUICK LAUNCHERS */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider px-2">
                ⚡ Presets Rápidos:
              </div>
              <button
                onClick={() => handleAttachPreset('🩸 Muestra Hemolizada (HIL 3+). ¿Solicitamos nueva toma a sede origen o procesamos con nota técnica ISO?', 'HEMOLIZADA')}
                className="w-full text-left p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-[10px] text-amber-300 font-mono transition cursor-pointer"
              >
                + Muestra Hemolizada (HIL 3+)
              </button>
              <button
                onClick={() => handleAttachPreset('⚠️ Resultado Dudoso (Troponina I 14,250 pg/mL fuera de rango). ¿Confirmas dilución 1:5?', 'DUDOSA')}
                className="w-full text-left p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-[10px] text-amber-300 font-mono transition cursor-pointer"
              >
                + Resultado Dudoso / Dilución
              </button>
            </div>
          </div>

          {/* MAIN CHAT MESSAGES AREA */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
            {/* CHANNEL HEADER */}
            <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="font-black text-white flex items-center space-x-2">
                  <span>{currentChannel.label}</span>
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
                    #{currentChannel.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{currentChannel.description}</p>
              </div>
            </div>

            {/* MESSAGES LIST */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {channelMessages.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">No hay mensajes recientes en esta sala.</p>
                  <p className="text-[11px] text-slate-500">Inicia una consulta inter-sede para este canal.</p>
                </div>
              ) : (
                channelMessages.map((msg) => {
                  const isMe = msg.senderId === 'usr-4091';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col space-y-1 ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      {/* SENDER INFO HEADER */}
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400 px-1">
                        <span className="font-bold text-white">{msg.senderName}</span>
                        <span className="text-indigo-400">({msg.senderRole})</span>
                        <span>• {msg.senderBranch}</span>
                        <span>• {msg.timestamp}</span>
                      </div>

                      {/* MESSAGE BUBBLE */}
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs space-y-2 shadow-lg border ${
                          isMe
                            ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none'
                            : 'bg-slate-950 text-slate-200 border-slate-800 rounded-tl-none'
                        }`}
                      >
                        {/* ATTACHED SAMPLE CARD IF PRESENT */}
                        {msg.sampleContext && (
                          <div className={`p-2.5 rounded-xl border text-[11px] font-mono space-y-1 ${
                            isMe ? 'bg-indigo-900/60 border-indigo-400/40 text-indigo-100' : 'bg-slate-900 border-slate-700 text-slate-200'
                          }`}>
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-amber-300">🩸 Muestra: #{msg.sampleContext.barcode}</span>
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                                {msg.sampleContext.status || 'CONSULTA'}
                              </span>
                            </div>
                            <div>Paciente: <strong>{msg.sampleContext.patientName}</strong> ({msg.sampleContext.orderNumber})</div>
                            <div>Ensayo: <strong>{msg.sampleContext.testName}</strong></div>
                            {msg.sampleContext.value && (
                              <div className="text-rose-300 font-bold">Valor: {msg.sampleContext.value}</div>
                            )}
                          </div>
                        )}

                        {/* MESSAGE CONTENT */}
                        <p className="leading-relaxed font-sans">{msg.content}</p>

                        {/* ATTACHMENT */}
                        {msg.attachmentName && (
                          <div className="flex items-center space-x-2 text-[11px] font-mono bg-black/20 p-2 rounded-lg border border-white/10">
                            <Paperclip className="w-3.5 h-3.5 text-amber-300" />
                            <span className="underline">{msg.attachmentName}</span>
                          </div>
                        )}

                        {/* ENCRYPTION FOOTER */}
                        <div className="flex items-center justify-between text-[9px] font-mono opacity-75 pt-1 border-t border-white/10">
                          <span className="flex items-center space-x-1 text-emerald-300">
                            <Lock className="w-2.5 h-2.5" />
                            <span>AES-256 Encrypted</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <CheckCheck className="w-3 h-3 text-emerald-300" />
                            <span>Entregado</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* TYPING INDICATOR */}
              {isTypingOther && (
                <div className="flex items-center space-x-2 text-[11px] font-mono text-amber-400 bg-amber-500/10 p-2 rounded-xl border border-amber-500/30 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>{isTypingOther} está escribiendo...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ATTACHED SAMPLE BANNER BEFORE INPUT */}
            {attachedSample && (
              <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-amber-300">
                <div className="flex items-center space-x-2 truncate">
                  <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">
                    Muestra Adjunta: <strong>#{attachedSample.barcode}</strong> ({attachedSample.patientName} - {attachedSample.testName})
                  </span>
                </div>
                <button
                  onClick={() => setAttachedSample(null)}
                  className="p-1 hover:text-white text-slate-400 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* INPUT COMPOSER */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setAttachedFile({ name: 'Foto_Tubo_Hemolizado_HIL3.jpg', url: '#' })}
                  className="p-2.5 text-slate-400 hover:text-amber-400 bg-slate-900 border border-slate-800 rounded-xl transition cursor-pointer"
                  title="Adjuntar Imagen/Frotis"
                >
                  <Image className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Escribe tu consulta técnica inter-sede..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                />

                <button
                  type="submit"
                  disabled={!messageInput.trim() && !attachedSample && !attachedFile}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
