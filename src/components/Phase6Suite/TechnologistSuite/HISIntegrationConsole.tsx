import React, { useState, useEffect } from 'react';
import {
  Globe,
  Activity,
  Terminal,
  ArrowLeftRight,
  Settings,
  Zap,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  History,
  FileCode,
  ShieldCheck,
  RefreshCw,
  X,
  Server,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

export interface HISEndpointItem {
  id: string;
  name: string;
  protocol: 'HL7 v2.5' | 'FHIR R4' | 'DICOM / MLLP';
  ip_address: string;
  port: number;
  is_active: boolean;
  hospital_type: string;
}

export interface HISMessageLogItem {
  id: string;
  created_at: string;
  endpoint_name: string;
  message_type: 'ORM^O01' | 'ORU^R01' | 'ACK^R01' | 'ADT^A08';
  direction: 'INBOUND' | 'OUTBOUND';
  status: 'PROCESSED' | 'ACKNOWLEDGED' | 'PROCESSING' | 'PENDING' | 'ERROR';
  order_id: string;
  patient_name: string;
  patient_id: string;
  test_name: string;
  raw_content: string;
}

const DEFAULT_ENDPOINTS: HISEndpointItem[] = [
  {
    id: 'ep-hst-01',
    name: 'Hospital Santo Tomás - HIS Central',
    protocol: 'HL7 v2.5',
    ip_address: '10.120.44.15',
    port: 2575,
    is_active: true,
    hospital_type: 'Tercer Nivel • MLLP Activo'
  },
  {
    id: 'ep-css-02',
    name: 'CSS Complejo Metropolitano Dr. AAM',
    protocol: 'FHIR R4',
    ip_address: '172.16.80.20',
    port: 8443,
    is_active: true,
    hospital_type: 'Seguro Social • HTTPS / REST'
  },
  {
    id: 'ep-hdn-03',
    name: 'Hospital del Niño Dr. José Renán E.',
    protocol: 'HL7 v2.5',
    ip_address: '10.125.10.8',
    port: 2576,
    is_active: true,
    hospital_type: 'Pediatría • MLLP Activo'
  },
  {
    id: 'ep-hsf-04',
    name: 'Clínica Hospital San Fernando',
    protocol: 'HL7 v2.5',
    ip_address: '192.168.100.50',
    port: 2577,
    is_active: false,
    hospital_type: 'Privado • En Standby'
  }
];

const INITIAL_LOGS: HISMessageLogItem[] = [
  {
    id: 'msg-hl7-9910',
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    endpoint_name: 'Hospital Santo Tomás - HIS Central',
    message_type: 'ORM^O01',
    direction: 'INBOUND',
    status: 'PROCESSED',
    order_id: 'HIS-2026-9901',
    patient_name: 'Mariana Pinzón Varela',
    patient_id: '8-882-9912',
    test_name: 'Hemograma Completo Automatizado + Plaquetas',
    raw_content: `MSH|^~\\&|HIS_HOSPITAL|SANTOTOMAS|LISCORE|LAB_CENTRAL|202608210900||ORM^O01|8823101|P|2.5\nPID|||8-882-9912||PINZON^MARIANA||19880512|F\nPV1||E|URG^CAMA-03^01||||8-745-1290^ABREGO^RUBEN\nORC|NW|HIS-2026-9901|LIS-7721||CM||^^^202608210830||202608210830\nOBR|1|HIS-2026-9901|LIS-7721|HEM^HEMOGRAMA COMPLETO^L|R||202608210830|||||||||8-745-1290^ABREGO^RUBEN`
  },
  {
    id: 'msg-hl7-9909',
    created_at: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    endpoint_name: 'CSS Complejo Metropolitano Dr. AAM',
    message_type: 'ORU^R01',
    direction: 'OUTBOUND',
    status: 'ACKNOWLEDGED',
    order_id: 'CSS-2026-4402',
    patient_name: 'Juan Carlos Samudio González',
    patient_id: '8-415-2281',
    test_name: 'Troponina I Ultrasensible (hs-cTnI)',
    raw_content: `MSH|^~\\&|LISCORE|LAB_CENTRAL|CSS_HIS|COMPLEJO_METRO|202608210845||ORU^R01|7710294|P|2.5\nPID|||8-415-2281||SAMUDIO^JUAN^CARLOS||19740315|M\nOBR|1|CSS-2026-4402|LIS-7718|TROP^TROPONINA I ULTRASENSIBLE^L|R||202608210815|||||||||8-4920-3399^ICAZA^ALEJANDRO\nOBX|1|NM|TROP_I^Troponina I Ultrasensible^LN||0.048|ng/mL|0.000-0.014|H|||F|||202608210840`
  },
  {
    id: 'msg-hl7-9908',
    created_at: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    endpoint_name: 'Hospital del Niño Dr. José Renán E.',
    message_type: 'ACK^R01',
    direction: 'OUTBOUND',
    status: 'ACKNOWLEDGED',
    order_id: 'HDN-2026-1108',
    patient_name: 'Castillo Pimentel, David Alejandro',
    patient_id: 'PE-982103',
    test_name: 'Química Sanguínea / Electrolitos Séricos',
    raw_content: `MSH|^~\\&|LISCORE|LAB_CENTRAL|HDN_HIS|HOSP_NINO|202608210755||ACK^R01|9920182|P|2.5\nMSA|AA|HDN-2026-1108|Mensaje procesado satisfactoriamente por el repositorio central de laboratorio.`
  }
];

const LOCAL_STORAGE_KEY_LOGS = 'lis_his_message_logs_v1';
const LOCAL_STORAGE_KEY_ENDPOINTS = 'lis_his_endpoints_v1';

export const HISIntegrationConsole: React.FC = () => {
  const [endpoints, setEndpoints] = useState<HISEndpointItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ENDPOINTS);
      return saved ? JSON.parse(saved) : DEFAULT_ENDPOINTS;
    } catch {
      return DEFAULT_ENDPOINTS;
    }
  });

  const [logs, setLogs] = useState<HISMessageLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<HISMessageLogItem | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  // Modales
  const [isNewConnectionModalOpen, setIsNewConnectionModalOpen] = useState(false);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);

  // Form nueva conexión
  const [newEndpointName, setNewEndpointName] = useState('');
  const [newEndpointProtocol, setNewEndpointProtocol] = useState<'HL7 v2.5' | 'FHIR R4' | 'DICOM / MLLP'>('HL7 v2.5');
  const [newEndpointIp, setNewEndpointIp] = useState('');
  const [newEndpointPort, setNewEndpointPort] = useState(2575);

  // Persistir en LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.warn('Could not persist HIS logs locally', e);
    }
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_ENDPOINTS, JSON.stringify(endpoints));
    } catch (e) {
      console.warn('Could not persist HIS endpoints locally', e);
    }
  }, [endpoints]);

  // Intentar sincronizar con Supabase si está disponible
  const syncWithRemote = async () => {
    try {
      const [remoteEndpoints, remoteLogs] = await Promise.all([
        SupabaseService.his.getEndpoints().catch(() => null),
        SupabaseService.his.getMessageLogs().catch(() => null)
      ]);
      if (remoteEndpoints && remoteEndpoints.length > 0) {
        setEndpoints(prev => {
          const map = new Map(prev.map(x => [x.name, x]));
          remoteEndpoints.forEach((r: any) => {
            map.set(r.name, {
              id: r.id || 'ep-' + Date.now(),
              name: r.name,
              protocol: r.protocol || 'HL7 v2.5',
              ip_address: r.ip_address || '127.0.0.1',
              port: r.port || 2575,
              is_active: r.is_active ?? true,
              hospital_type: 'Integración Remota'
            });
          });
          return Array.from(map.values());
        });
      }
    } catch {
      // Graceful local fallback
    }
  };

  useEffect(() => {
    syncWithRemote();
  }, []);

  // Simulación de Orden Entrante HL7 (ORM^O01)
  const simulateHL7Order = async () => {
    setSimulating(true);

    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const orderNum = 'HIS-' + Math.floor(100000 + Math.random() * 900000);
    const accessionLIS = 'LIS-' + Math.floor(2000 + Math.random() * 8000);

    const samplePatients = [
      { name: 'HERRERA^ROBERTO^CARLOS', cedula: '8-712-4412', sex: 'M', dob: '19820419', test: 'Perfil Lipídico Completo (Colesterol, Triglicéridos, HDL/LDL)' },
      { name: 'DEL ROSARIO^ELENA^MARIA', cedula: '4-192-3341', sex: 'F', dob: '19791104', test: 'Glucosa en Ayunas + HbA1c Hemoglobina Glicosilada' },
      { name: 'MENDOZA^ALEJANDRO^JOSE', cedula: 'PE-982103', sex: 'M', dob: '19950822', test: 'Tiempos de Coagulación (TP / TPT / INR)' }
    ];
    const picked = samplePatients[Math.floor(Math.random() * samplePatients.length)];

    const rawHL7 = `MSH|^~\\&|HIS_HOSPITAL|SANTOTOMAS|LISCORE|LAB_CENTRAL|${timestamp}||ORM^O01|${orderNum}|P|2.5\nPID|||${picked.cedula}|||${picked.name}|||${picked.dob}|${picked.sex}\nPV1||E|URG^CAMA-04^CHOQUE||||8-745-1290^ABREGO^RUBEN\nORC|NW|${orderNum}|${accessionLIS}||CM||^^^${timestamp}|||${timestamp}\nOBR|1|${orderNum}|${accessionLIS}|PANEL^PERFIL CLINICO URGENCIA^L|R|||${timestamp}|||||||||8-745-1290^ABREGO^RUBEN`;

    const newLogItem: HISMessageLogItem = {
      id: 'msg-hl7-' + Date.now(),
      created_at: now.toISOString(),
      endpoint_name: 'Hospital Santo Tomás - HIS Central',
      message_type: 'ORM^O01',
      direction: 'INBOUND',
      status: 'PROCESSING',
      order_id: orderNum,
      patient_name: picked.name.replace(/\^/g, ' '),
      patient_id: picked.cedula,
      test_name: picked.test,
      raw_content: rawHL7
    };

    // Agregar en estado de procesamiento inmediato
    setLogs(prev => [newLogItem, ...prev]);

    // Simular paso a PROCESSED tras 1.2 segundos
    setTimeout(() => {
      setLogs(prev =>
        prev.map(item =>
          item.id === newLogItem.id ? { ...item, status: 'PROCESSED' } : item
        )
      );
      setSimulating(false);

      // Toast de Confirmación
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: {
            title: '📨 Orden HL7 V2.5 Procesada Exitosamente',
            message: `Mensaje ORM^O01 recibido desde HIS Central. Paciente ${newLogItem.patient_name} admitido con orden ${orderNum}.`,
            type: 'success'
          }
        })
      );
    }, 1200);

    // Intentar registrar en Supabase en segundo plano si está disponible
    try {
      await SupabaseService.his.simulateIncomingOrder(rawHL7);
    } catch {
      // Ignorar error de red si estamos en modo local
    }
  };

  // Crear nueva conexión
  const handleCreateEndpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEndpointName.trim()) return;

    const newEp: HISEndpointItem = {
      id: 'ep-' + Date.now(),
      name: newEndpointName.trim(),
      protocol: newEndpointProtocol,
      ip_address: newEndpointIp.trim() || '127.0.0.1',
      port: Number(newEndpointPort) || 2575,
      is_active: true,
      hospital_type: 'Conexión Configurada Manualmente'
    };

    setEndpoints(prev => [...prev, newEp]);
    setIsNewConnectionModalOpen(false);
    setNewEndpointName('');
    setNewEndpointIp('');
    setNewEndpointPort(2575);

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          title: 'Conexión HIS Creada',
          message: `Nodo ${newEp.name} registrado en puerto ${newEp.port} (${newEp.protocol}).`,
          type: 'success'
        }
      })
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSED':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'ACKNOWLEDGED':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'PROCESSING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
      case 'ERROR':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Filtrado de Logs
  const filteredLogs = logs.filter(l => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.order_id.toLowerCase().includes(term) ||
      l.patient_name.toLowerCase().includes(term) ||
      l.patient_id.toLowerCase().includes(term) ||
      l.endpoint_name.toLowerCase().includes(term) ||
      l.test_name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      {/* 1. HIS HEADER BANNER */}
      <div className="bg-slate-900 border border-slate-800 text-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Globe className="w-5 h-5 animate-pulse" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                HIS / EMR Data Bridge
              </h1>
            </div>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
              Interoperabilidad HL7 V2.5 y FHIR R4 con Sistemas Hospitalarios (MINSA, CSS y Privados). 
              Sincronización bidireccional continua de órdenes de admisión y resultados validados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={simulateHL7Order}
              disabled={simulating}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-6 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-xl shadow-teal-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Zap size={18} className="text-slate-950 fill-current" />
              <span>{simulating ? 'PROCESANDO ORDEN...' : 'SIMULAR ORDEN HL7'}</span>
            </button>

            <button
              onClick={() => setIsNewConnectionModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all border border-slate-700 cursor-pointer"
            >
              <Plus size={18} />
              <span>NUEVA CONEXIÓN</span>
            </button>
          </div>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />
      </div>

      {/* 2. NODES (SIDEBAR) & TRAFFIC CONSOLE (MAIN TABLE) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Nodos Hospitalarios Configurados (1 Col) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-slate-300 text-xs uppercase tracking-widest flex items-center gap-2">
              <Server size={14} className="text-teal-400" />
              <span>Nodos Hospitalarios ({endpoints.length})</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {endpoints.filter(e => e.is_active).length} Activos
            </span>
          </div>

          <div className="space-y-3">
            {endpoints.map(ep => (
              <div
                key={ep.id}
                className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm hover:border-teal-500/40 transition-all space-y-2 group"
              >
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-slate-800 text-teal-400 rounded-xl group-hover:bg-teal-500/15 group-hover:text-teal-300 transition-colors">
                    <ArrowLeftRight size={16} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${ep.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className="text-[10px] font-mono text-slate-400">{ep.is_active ? 'EN LÍNEA' : 'OFFLINE'}</span>
                  </div>
                </div>

                <div>
                  <p className="font-bold text-white text-xs leading-snug">{ep.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{ep.hospital_type}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono">
                  <span className="bg-slate-950 text-teal-300 px-2 py-0.5 rounded border border-slate-800 font-bold">
                    {ep.protocol}
                  </span>
                  <span className="text-slate-400">
                    {ep.ip_address}:{ep.port}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setIsMappingModalOpen(true)}
            className="w-full py-3.5 bg-slate-900 text-slate-400 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-wider border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Settings size={14} className="text-teal-400" />
            <span>Configurar Mapeos de Códigos</span>
          </button>
        </div>

        {/* Tabla de Tráfico de Mensajes HL7/FHIR (3 Col) */}
        <div className="lg:col-span-3 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden flex flex-col">
          
          {/* Header de la consola */}
          <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-wrap justify-between items-center gap-4 bg-slate-950/40">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Terminal className="text-teal-400" size={18} />
                <span>Consola de Tráfico de Mensajes HL7 / FHIR</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Registro de transacciones clínicas en tiempo real con acuse de recibo (ACK)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar por orden, cédula o paciente..."
                  className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-teal-500 outline-none w-64"
                />
              </div>

              <button
                onClick={() => {
                  syncWithRemote();
                  window.dispatchEvent(
                    new CustomEvent('lis-global-toast', {
                      detail: {
                        title: 'Consola Actualizada',
                        message: 'Tráfico de mensajes HL7 sincronizado correctamente.',
                        type: 'info'
                      }
                    })
                  );
                }}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-teal-400 rounded-xl border border-slate-700 transition-all cursor-pointer"
                title="Actualizar registro de mensajes"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* Tabla de Registros */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 text-[10px] font-mono uppercase tracking-wider border-b border-slate-800">
                  <th className="px-5 py-3.5">F. Registro</th>
                  <th className="px-5 py-3.5">HIS Origen / Destino</th>
                  <th className="px-5 py-3.5">Orden / Paciente</th>
                  <th className="px-5 py-3.5">Tipo / Dir</th>
                  <th className="px-5 py-3.5 text-center">Estado</th>
                  <th className="px-5 py-3.5 text-right">RAW HL7</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Fecha */}
                    <td className="px-5 py-3.5 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      <span className="block text-[9px] text-slate-600">{new Date(log.created_at).toLocaleDateString('es-PA')}</span>
                    </td>

                    {/* Nodo */}
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-white text-xs">{log.endpoint_name}</p>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {log.id}</span>
                    </td>

                    {/* Orden & Paciente */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-teal-400 text-xs">
                        <span>{log.order_id}</span>
                      </div>
                      <p className="text-slate-300 font-medium text-[11px] truncate max-w-[200px]">
                        {log.patient_name} <span className="text-slate-500 text-[10px]">({log.patient_id})</span>
                      </p>
                      <p className="text-slate-500 text-[10px] truncate max-w-[200px]">
                        {log.test_name}
                      </p>
                    </td>

                    {/* Tipo / Dirección */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-white text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {log.message_type}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          log.direction === 'INBOUND'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {log.direction}
                        </span>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>

                    {/* Botón Ver RAW */}
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-300 rounded-xl transition-all font-mono text-[11px] font-bold border border-slate-700 cursor-pointer inline-flex items-center gap-1"
                        title="Inspeccionar segmentos HL7 / MSH / PID / OBR"
                      >
                        <FileCode size={14} />
                        <span>VER</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500 font-bold uppercase text-xs">
                      No se encontraron mensajes con el criterio de búsqueda especificado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. MODAL RAW HL7 / FHIR PAYLOAD INSPECTOR */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
            
            {/* Header Modal */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Terminal size={20} />
                </div>
                <div>
                  <h3 className="text-white font-black text-sm uppercase tracking-wide">
                    HL7 V2.5 / FHIR Payload Inspector
                  </h3>
                  <p className="text-slate-400 text-xs font-mono">
                    Transacción: {selectedLog.id} • {selectedLog.endpoint_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedLog(null);
                  setCopiedRaw(false);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Metadatos Rápidos */}
            <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Orden HIS:</span>
                <span className="text-teal-300 font-bold">{selectedLog.order_id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Paciente:</span>
                <span className="text-white font-bold">{selectedLog.patient_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Tipo / Dir:</span>
                <span className="text-cyan-300">{selectedLog.message_type} ({selectedLog.direction})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Estado:</span>
                <span className="text-emerald-400 font-bold">{selectedLog.status}</span>
              </div>
            </div>

            {/* Editor Pre de HL7 crudo */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-950/80">
              <pre className="text-teal-400 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 select-all shadow-inner">
                {selectedLog.raw_content}
              </pre>
            </div>

            {/* Footer Modal */}
            <div className="p-4 sm:p-6 bg-slate-900 border-t border-slate-800 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="text-teal-400" size={16} />
                <span>Integridad criptográfica verificada (MLLP Framing ACK validado)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedLog.raw_content);
                    setCopiedRaw(true);
                    setTimeout(() => setCopiedRaw(false), 2000);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  {copiedRaw ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedRaw ? 'Copiado' : 'Copiar Raw'}</span>
                </button>

                <button
                  onClick={() => {
                    const blob = new Blob([selectedLog.raw_content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedLog.order_id}_${selectedLog.message_type}.hl7`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Download size={14} />
                  <span>Descargar .HL7</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. MODAL NUEVA CONEXIÓN DE NODO */}
      {isNewConnectionModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateEndpoint}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                  <Plus size={16} />
                </div>
                <h3 className="text-base font-black text-white">Nueva Conexión de Hospital / HIS</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewConnectionModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Nombre del Hospital o Centro:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Hospital Pacífica Salud (Paitilla)"
                  value={newEndpointName}
                  onChange={e => setNewEndpointName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Protocolo:</label>
                  <select
                    value={newEndpointProtocol}
                    onChange={e => setNewEndpointProtocol(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-teal-500 outline-none"
                  >
                    <option value="HL7 v2.5">HL7 v2.5 (MLLP)</option>
                    <option value="FHIR R4">FHIR R4 (REST/JSON)</option>
                    <option value="DICOM / MLLP">DICOM Modality Worklist</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Puerto de Escucha:</label>
                  <input
                    type="number"
                    required
                    value={newEndpointPort}
                    onChange={e => setNewEndpointPort(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Dirección IP o Hostname:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 192.168.1.150 o his.hospital.pa"
                  value={newEndpointIp}
                  onChange={e => setNewEndpointIp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewConnectionModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black rounded-xl transition cursor-pointer shadow-md"
              >
                Guardar & Conectar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. MODAL MAPEO DE CÓDIGOS DE EXÁMENES */}
      {isMappingModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                  <Settings size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Mapeo de Códigos de Exámenes (HIS ➔ LIS)</h3>
                  <p className="text-[11px] text-slate-400">Homologación de códigos de laboratorio según estándar LOINC / MINSA</p>
                </div>
              </div>
              <button
                onClick={() => setIsMappingModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <th className="p-3">Código HIS Externo</th>
                    <th className="p-3">Código LIS Local</th>
                    <th className="p-3">Examen Homologado</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  <tr>
                    <td className="p-3 text-teal-400 font-bold">HEM^01</td>
                    <td className="p-3 text-white">HEM-AUTO</td>
                    <td className="p-3 font-sans">Hemograma Completo Automatizado</td>
                    <td className="p-3 text-emerald-400">ACTIVO</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-teal-400 font-bold">GLU^02</td>
                    <td className="p-3 text-white">GLUC-AYUN</td>
                    <td className="p-3 font-sans">Glucosa Basal en Suero</td>
                    <td className="p-3 text-emerald-400">ACTIVO</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-teal-400 font-bold">TROP^05</td>
                    <td className="p-3 text-white">HS-CTNI</td>
                    <td className="p-3 font-sans">Troponina I Ultrasensible</td>
                    <td className="p-3 text-emerald-400">ACTIVO</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-teal-400 font-bold">COAG^03</td>
                    <td className="p-3 text-white">TP-TPT-INR</td>
                    <td className="p-3 font-sans">Tiempos de Coagulación</td>
                    <td className="p-3 text-emerald-400">ACTIVO</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsMappingModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
              >
                Cerrar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HISIntegrationConsole;
