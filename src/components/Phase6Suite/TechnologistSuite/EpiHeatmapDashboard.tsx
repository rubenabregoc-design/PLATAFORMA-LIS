import React, { useState, useEffect } from 'react';
import {
  Map,
  MapPin,
  AlertTriangle,
  TrendingUp,
  Search,
  Activity,
  ShieldAlert,
  Globe,
  RefreshCw,
  Info,
  ChevronRight,
  Flame,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const PANAMA_PROVINCES = [
  'BOCAS DEL TORO', 'COCLÉ', 'COLÓN', 'CHIRIQUÍ', 'DARIÉN', 'HERRERA', 'LOS SANTOS', 'PANAMÁ', 'VERAGUAS', 'PANAMÁ OESTE'
];

const EpiHeatmapDashboard: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  useEffect(() => {
    fetchHeatmap();
  }, []);

  const fetchHeatmap = async () => {
    try {
      const stats = await SupabaseService.epidemiology.getHeatmapData();
      setData(stats);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const getIntensityColor = (count: number) => {
    if (count >= 10) return 'bg-rose-500 text-white';
    if (count >= 5) return 'bg-orange-500 text-white';
    if (count >= 1) return 'bg-yellow-400 text-slate-900';
    return 'bg-slate-100 text-slate-400';
  };

  const getProvinceStats = (province: string) => data.filter(d => d.provenance_province === province);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic text-white">Mapa de Calor Epidemiológico</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Visualización geográfica de brotes infecciosos por provincia en la República de Panamá. Inteligencia de Vigilancia Sanitaria.
          </p>
        </div>
        <div className="flex gap-4 relative z-10">
           <div className="bg-rose-500/10 border border-rose-500/20 px-8 py-6 rounded-3xl backdrop-blur-md text-center">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Alertas Activas</p>
              <h4 className="text-2xl font-black text-white">{data.reduce((acc, d) => acc + d.case_count, 0)}</h4>
           </div>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Heatmap Matrix / List */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
           <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-tight">
              <Map className="text-blue-500" size={20} />
              Intensidad de Casos por Provincia
           </h3>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PANAMA_PROVINCES.map(province => {
                const stats = getProvinceStats(province);
                const totalCases = stats.reduce((acc, s) => acc + s.case_count, 0);

                return (
                  <div
                    key={province}
                    onClick={() => setSelectedProvince(province)}
                    className={`p-5 rounded-[2rem] border transition-all cursor-pointer flex items-center justify-between group ${
                      selectedProvince === province ? 'bg-slate-900 border-teal-500 shadow-xl' : 'bg-slate-50 border-slate-100 hover:border-teal-400'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-2xl ${getIntensityColor(totalCases)}`}>
                          <MapPin size={20} />
                       </div>
                       <div>
                          <p className={`font-black text-xs uppercase tracking-tight ${selectedProvince === province ? 'text-white' : 'text-slate-800'}`}>{province}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{stats.length} enfermedades detectadas</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <h4 className={`text-xl font-black ${selectedProvince === province ? 'text-teal-400' : 'text-slate-900'}`}>{totalCases}</h4>
                       <p className="text-[8px] font-black text-slate-400 uppercase">Casos</p>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* Province Detail Sidebar */}
        <div className="space-y-6">
           {selectedProvince ? (
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-full animate-in slide-in-from-right-4">
                 <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Activity className="text-rose-500" size={16} />
                    Detalle: {selectedProvince}
                 </h3>
                 <div className="space-y-4">
                    {getProvinceStats(selectedProvince).map((s, idx) => (
                       <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                          <div>
                             <p className="font-black text-slate-800 text-xs uppercase">{s.disease_name}</p>
                             <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Notificación Obligatoria</p>
                          </div>
                          <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-black">{s.case_count}</span>
                       </div>
                    ))}
                    {getProvinceStats(selectedProvince).length === 0 && (
                       <div className="py-10 text-center opacity-40">
                          <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                          <p className="text-[10px] font-black uppercase text-slate-500">Sin hallazgos epidemiológicos</p>
                       </div>
                    )}
                 </div>

                 <div className="mt-auto pt-8 border-t border-slate-50">
                    <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex gap-3 text-rose-900 text-[10px] font-medium leading-relaxed italic">
                       <AlertTriangle size={18} className="shrink-0 text-rose-500" />
                       <p>Alerta: Los datos mostrados corresponden a resultados validados en las últimas 72 horas analíticas.</p>
                    </div>
                 </div>
              </div>
           ) : (
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col items-center justify-center text-center">
                 <Flame className="text-teal-400 mb-6 animate-pulse" size={48} />
                 <h4 className="font-black text-sm uppercase tracking-widest">Inteligencia de Brotes</h4>
                 <p className="text-slate-400 text-[10px] leading-relaxed mt-4 font-medium italic">
                    "Seleccione una provincia para ver el desglose por patógeno y el nivel de alerta sanitaria institucional."
                 </p>
              </div>
           )}

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <Zap className="text-yellow-400 mb-4" size={32} />
              <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest">MINSA Connect</h4>
              <p className="text-slate-500 text-[10px] leading-relaxed mt-2 font-medium">
                 Este mapa se actualiza automáticamente con cada resultado <span className="text-rose-500 font-black">REACTIVO</span> validado en el LIS.
              </p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default EpiHeatmapDashboard;
