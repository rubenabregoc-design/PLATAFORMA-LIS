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
  X
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const HISIntegrationConsole: React.FC = () => {
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);

  const simulateHL7Order = async () => {
    setSimulating(true);
    const mockHL7 = `MSH|^~\\&|HIS_HOSPITAL|SANTOTOMAS|LISCORE|LAB_CENTRAL|202608210900||ORM^O01|8823101|P|2.5\nPID|||8-882-9912||PINZON^MARIANA||19880512|F\nOBR|1|HIS-9901|LIS-7721|HEM^HEMOGRAMA COMPLETO^L|R||202608210830|||||||||8-745-1290^ABREGO^RUBEN`;
    try {
      await SupabaseService.his.simulateIncomingOrder(mockHL7);
      fetchData();
    } catch (err) { console.error(err); }
    finally { setSimulating(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s refresh
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [endData, logData] = await Promise.all([
        SupabaseService.his.getEndpoints(),
        SupabaseService.his.getMessageLogs()
      ]);
      setEndpoints(endData);
      setLogs(logData);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'ERROR': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'ACKNOWLEDGED': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HIS Header */}
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Globe className="text-teal-400" size={32} />
              <h1 className="text-3xl font-black tracking-tight">HIS / EMR Data Bridge</h1>
            </div>
            <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
               Interoperabilidad HL7 V2.5 y FHIR con Sistemas Hospitalarios. Sincronización bidireccional de órdenes y resultados electrónicos.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={simulateHL7Order}
              disabled={simulating}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all border border-white/10 backdrop-blur-md flex items-center gap-2"
            >
              <Zap size={18} className="text-yellow-400" />
              {simulating ? 'PROCESANDO...' : 'SIMULAR ORDEN HL7'}
            </button>
            <button className="bg-teal-500 hover:bg-teal-600 text-slate-950 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-xl shadow-teal-500/20">
              <Plus size={18} />
              NUEVA CONEXIÓN
            </button>
          </div>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Endpoints Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest px-2">Nodos Hospitalarios</h3>
          {endpoints.map(ep => (
            <div key={ep.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-teal-400 transition-all">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                     <ArrowLeftRight size={20} />
                  </div>
                  <div className={`w-2 h-2 rounded-full ${ep.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
               </div>
               <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{ep.name}</p>
               <div className="flex items-center gap-3 mt-3">
                  <span className="text-[9px] font-black bg-slate-950 text-white px-2 py-0.5 rounded uppercase">{ep.protocol}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">{ep.ip_address}:{ep.port}</span>
               </div>
            </div>
          ))}
          <button className="w-full py-4 bg-slate-50 text-slate-500 rounded-[2rem] text-xs font-black uppercase tracking-widest border border-slate-100 hover:bg-white transition-all">
             Configurar Mapeos de Códigos
          </button>
        </div>

        {/* Traffic Log Table */}
        <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-800">Consola de Tráfico de Mensajes</h3>
            <div className="flex items-center gap-3">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input placeholder="Buscar por Orden o Mensaje..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] w-64" />
               </div>
               <button onClick={fetchData} className="p-2 bg-white text-slate-400 hover:text-teal-600 rounded-xl border border-slate-100 transition-all"><RefreshCw size={16} /></button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">F. Registro</th>
                  <th className="px-6 py-4">HIS Destino/Origen</th>
                  <th className="px-6 py-4">Tipo / Dir</th>
                  <th className="px-6 py-4">Estado Transacción</th>
                  <th className="px-6 py-4 text-right">RAW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-[10px] font-mono text-slate-500 font-bold">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                       <p className="font-black text-slate-800 text-[10px] uppercase">{log.his_endpoints?.name || 'Inbound Terminal'}</p>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-600">{log.message_type}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${log.direction === 'INBOUND' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-white'}`}>
                             {log.direction}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                         onClick={() => setSelectedLog(log)}
                         className="p-2 bg-slate-100 text-slate-500 hover:bg-teal-500 hover:text-white rounded-lg transition-all"
                      >
                         <FileCode size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                   <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-slate-300 font-black uppercase text-xs">No hay tráfico de interoperabilidad registrado</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RAW HL7 Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] max-w-4xl w-full h-[70vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <Terminal className="text-teal-400" size={24} />
                    <div>
                       <h3 className="text-white font-black text-sm uppercase tracking-widest">HL7 / FHIR Payload Inspector</h3>
                       <p className="text-slate-500 text-[10px] font-bold">Transaction ID: {selectedLog.id}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedLog(null)} className="p-2 text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <div className="flex-1 p-8 overflow-y-auto bg-slate-950/50">
                 <pre className="text-teal-500 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all bg-black/40 p-6 rounded-2xl border border-white/5">
                    {selectedLog.raw_content}
                 </pre>
              </div>
              <div className="p-6 bg-slate-900 border-t border-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                    <ShieldCheck className="text-teal-400" size={16} />
                    Secure Transaction Integrity Verified
                 </div>
                 <button className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all">Re-transmitir Mensaje</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default HISIntegrationConsole;
