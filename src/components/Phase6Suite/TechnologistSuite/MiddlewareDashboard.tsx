import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  Terminal,
  Settings,
  RefreshCcw,
  AlertOctagon,
  CheckCircle2,
  ArrowDownCircle,
  ArrowUpCircle,
  FlaskConical,
  Database,
  Plus
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const MiddlewareDashboard: React.FC = () => {
  const [frames, setFrames] = useState<any[]>([]);
  const [analyzers, setAnalyzers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLog, setActiveLog] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(simulateIncomingData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [anzData, frmData] = await Promise.all([
        SupabaseService.analyzers.getAll(),
        SupabaseService.middleware.getPendingFrames()
      ]);
      setAnalyzers(anzData);
      setFrames(frmData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const simulateIncomingData = () => {
    const protocols = ['ASTM', 'HL7'];
    const proto = protocols[Math.floor(Math.random() * protocols.length)];
    const time = new Date().toLocaleTimeString();
    const msg = `[${time}] ${proto} INBOUND: <STX>1H|\\^&|||SYSMEX XN-1000^1.2.3|||||||P|1<CR><ETX>`;
    setActiveLog(prev => [msg, ...prev].slice(0, 10));
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="text-teal-400" size={32} />
              <h1 className="text-3xl font-black tracking-tight text-white">LIS Middleware & Instrument Control</h1>
            </div>
            <p className="text-slate-400 font-medium leading-relaxed">
              Consola de comunicación bidireccional ASTM/HL7. Monitoreo de puertos seriales y TCP/IP en tiempo real.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-teal-500/10 border border-teal-500/20 px-6 py-4 rounded-3xl backdrop-blur-md">
              <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-1">Status Servidor</p>
              <h4 className="text-2xl font-black text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-ping"></div>
                ONLINE
              </h4>
            </div>
            <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl backdrop-blur-md">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Frames Hoy</p>
              <h4 className="text-2xl font-black text-white">2,481</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest px-2">Nodos de Red (Analizadores)</h3>
          {analyzers.map(anz => (
            <div key={anz.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-teal-400 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="font-black text-slate-800 text-sm">{anz.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold">ASTM E1381 • TCP:9100</p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${anz.status === 'ACTIVE' ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'bg-slate-300'}`}></div>
            </div>
          ))}
          <button className="w-full py-3 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-200">
            <Plus size={16} className="inline mr-2" /> Agregar Instrumento
          </button>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden h-[450px] flex flex-col">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-teal-400" />
                <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Real-time RAW Communication Log</span>
              </div>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
            </div>
            <div className="flex-1 p-6 font-mono text-[11px] overflow-y-auto space-y-2 text-slate-300">
              {activeLog.map((log, i) => (
                <div key={i} className={`p-2 rounded border-l-2 ${log.includes('INBOUND') ? 'border-teal-500 bg-teal-500/5' : 'border-blue-500 bg-blue-500/5'}`}>
                  {log}
                </div>
              ))}
              <div className="animate-pulse">_</div>
            </div>
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-3">Filter: All Transactions</span>
              <button className="text-[9px] font-black text-teal-400 uppercase hover:underline">Clear Terminal</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <ArrowDownCircle size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Órdenes a Analizador</p>
                <h4 className="text-xl font-black text-slate-800">412 <span className="text-xs text-slate-400">Pend</span></h4>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
                <ArrowUpCircle size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Resultados Recibidos</p>
                <h4 className="text-xl font-black text-slate-800">1,942 <span className="text-xs text-slate-400">Total</span></h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiddlewareDashboard;
