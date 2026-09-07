import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  ThermometerSnowflake,
  Clock,
  Plus,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Search,
  History,
  Zap,
  ShieldCheck,
  Package,
  Activity,
  User,
  ArrowRight,
  Monitor
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const BloodLogisticsManager: React.FC = () => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      const data = await SupabaseService.bloodLogistics.getTransfers();
      setTransfers(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECTED_TEMP_EXCURSION': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Logistics Header */}
      <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic text-white">Logística de Hemocomponentes</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Control de traslados inter-hospitalarios y entre sedes. Monitoreo de cadena de frío y validación de recepción técnica.
          </p>
        </div>
        <button className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-teal-500/20">
          <Plus size={18} className="inline mr-2" /> Programar Traslado
        </button>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Main Transfers Table */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-800">Bitácora de Movimiento de Unidades</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input placeholder="Buscar traslado..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] w-64" />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Fecha / ID</th>
                  <th className="px-6 py-4">Origen ➔ Destino</th>
                  <th className="px-6 py-4">Control Temp (°C)</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transfers.map(tr => (
                  <tr key={tr.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-[10px] font-mono text-slate-500 font-bold">
                       <p className="text-slate-800">{new Date(tr.transfer_date).toLocaleDateString()}</p>
                       <p className="text-[8px] uppercase">{tr.id.slice(0,8)}</p>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
                             <Package size={16} />
                          </div>
                          <div>
                             <p className="font-black text-slate-800 text-[10px] uppercase tracking-tight">{tr.origin_location}</p>
                             <div className="flex items-center gap-1 text-[8px] text-slate-400 font-black uppercase">
                                <ArrowRight size={10} /> {tr.destination_location}
                             </div>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <ThermometerSnowflake size={14} className={tr.max_temp_recorded > 6 ? 'text-rose-500' : 'text-blue-500'} />
                          <span className="text-[10px] font-black text-slate-700">{tr.min_temp_recorded}° - {tr.max_temp_recorded}°</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${getStatusColor(tr.status)}`}>
                        {tr.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="p-2 text-slate-300 hover:text-slate-900 transition-all">
                          <ChevronRight size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
                {transfers.length === 0 && (
                   <tr>
                      <td colSpan={5} className="px-6 py-20 text-center opacity-30 italic text-xs font-black uppercase">No hay traslados registrados</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-full">
              <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Monitor className="text-blue-500" size={18} />
                 Telemetría en Tránsito
              </h3>
              <div className="space-y-4">
                 <div className="p-5 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
                    <p className="text-[8px] font-black uppercase text-slate-400">Contenedor Activo: BX-882</p>
                    <h4 className="text-2xl font-black mt-1">4.2 <span className="text-xs">°C</span></h4>
                    <div className="mt-4 flex items-center gap-2 text-emerald-400 text-[9px] font-black uppercase">
                       <Activity size={12} className="animate-pulse" /> Sincronizado vía GPS
                    </div>
                 </div>

                 <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                       <AlertTriangle size={14} />
                       <span className="text-[9px] font-black uppercase">Validación de Recepción</span>
                    </div>
                    <p className="text-[9px] text-amber-900 leading-relaxed font-medium italic">
                       "Al recibir una unidad, el tecnólogo debe verificar el sello de seguridad y la temperatura del datalogger antes de aceptar el ingreso al stock."
                    </p>
                 </div>
              </div>

              <div className="mt-auto pt-8 border-t border-slate-50">
                 <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                    <ShieldCheck className="text-emerald-500" size={24} />
                    <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Protocolo de Cadena de Frío OK</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default BloodLogisticsManager;
