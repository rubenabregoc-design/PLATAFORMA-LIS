import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Activity,
  History,
  Scale,
  ChevronRight,
  ShieldAlert,
  Zap,
  Trash2,
  Container,
  FileBarChart
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const ChemicalWasteManager: React.FC = () => {
  const [wasteLogs, setWasteLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWaste();
  }, []);

  const fetchWaste = async () => {
    try {
      const data = await SupabaseService.waste.getChemicalWaste();
      setWasteLogs(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const totalVolume = wasteLogs.reduce((acc, l) => acc + parseFloat(l.quantity_liters), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Chemical Waste Header */}
      <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <FlaskConical className="text-amber-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic text-white">Gestión de Residuos Químicos</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Monitoreo de desechos líquidos y sólidos provenientes de analizadores automáticos. Cumplimiento de Normativa Ambiental ISO 14001.
          </p>
        </div>
        <div className="flex gap-4 relative z-10">
           <div className="bg-amber-500/10 border border-amber-500/20 px-8 py-6 rounded-3xl backdrop-blur-md text-center">
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Volumen Acumulado</p>
              <h4 className="text-2xl font-black text-white">{totalVolume.toFixed(1)} <span className="text-xs uppercase">Lts</span></h4>
           </div>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Waste Log Table */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
           <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800">Bitácora de Desechos de Analizadores</h3>
              <button className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Registrar Evacuación</button>
           </div>

           <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                       <th className="px-6 py-4">Fecha / Hora</th>
                       <th className="px-6 py-4">Analizador Origen</th>
                       <th className="px-6 py-4">Descripción del Residuo</th>
                       <th className="px-6 py-4 text-center">Cantidad (L)</th>
                       <th className="px-6 py-4">Estado</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {wasteLogs.map(log => (
                       <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 text-[10px] font-mono text-slate-500 font-bold">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 text-slate-500 rounded-lg"><Activity size={16} /></div>
                                <span className="font-black text-slate-800 text-xs uppercase">{log.analyzers?.name || 'VACIADO MANUAL'}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <p className="font-bold text-slate-700 text-[10px] uppercase">{log.waste_name}</p>
                             <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{log.container_type || 'BIDÓN ESTÁNDAR'}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className="font-black text-sm text-slate-900">{log.quantity_liters}</span>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                                log.status === 'PICKED_UP' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                             }`}>
                                {log.status === 'IN_STORAGE' ? 'EN ALMACÉN' : log.status}
                             </span>
                          </td>
                       </tr>
                    ))}
                    {wasteLogs.length === 0 && (
                       <tr>
                          <td colSpan={5} className="px-6 py-20 text-center text-slate-300 font-black uppercase text-xs">No hay registros de residuos químicos</td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Sidebar Analytics & Safety */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Container className="text-amber-500" size={18} />
                 Capacidad de Almacenamiento
              </h3>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                       <span className="text-slate-500">Bidones Llenos</span>
                       <span className="text-slate-900">4 / 10</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-500 w-[40%]"></div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
              <ShieldAlert className="text-rose-500 mb-4" size={32} />
              <h4 className="font-black text-sm uppercase tracking-widest text-white">Neutralización de Residuos</h4>
              <p className="text-slate-400 text-[10px] leading-relaxed mt-3 font-medium text-justify">
                 "Todo residuo líquido proveniente del analizador de Hematología debe ser tratado con hipoclorito de sodio al 1% antes de su disposición en el contenedor de recolección externa."
              </p>
              <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Ver Protocolo ISO 14001</button>
           </div>

           <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500" size={24} />
              <p className="text-[9px] font-black text-emerald-800 uppercase">Certificado Ambiental Vigente</p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ChemicalWasteManager;
