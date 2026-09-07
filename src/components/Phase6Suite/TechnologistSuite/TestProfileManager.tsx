import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Plus,
  ChevronRight,
  CheckCircle2,
  FlaskConical,
  Settings,
  Zap,
  ArrowRight,
  Database,
  Activity,
  History,
  ShieldCheck,
  MoreVertical,
  FlaskRound
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const TestProfileManager: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [details, setDetails] = useState<any[]>([]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const data = await SupabaseService.testProfiles.getProfiles();
      setProfiles(data);
      if (data.length > 0) handleSelectProfile(data[0].id);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSelectProfile = async (id: string) => {
    setSelectedProfileId(id);
    try {
      const detData = await SupabaseService.testProfiles.getProfileDetails(id);
      setDetails(detData);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic text-white">Configuración de Perfiles y Paquetes</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Gestión de agrupaciones lógicas de analitos (BHC, Perfiles Químicos, Paneles Virales). Optimización de la entrada de órdenes.
          </p>
        </div>
        <button className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-teal-500/20">
          <Plus size={18} className="inline mr-2" /> Nuevo Perfil
        </button>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Profile List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
           <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest px-2">Catálogo de Perfiles</h3>
           {profiles.map(p => (
              <div
                key={p.id}
                onClick={() => handleSelectProfile(p.id)}
                className={`p-5 rounded-[2rem] border transition-all cursor-pointer flex flex-col gap-3 group ${
                  selectedProfileId === p.id ? 'bg-slate-900 border-teal-500 shadow-xl' : 'bg-white border-slate-200 hover:border-teal-400'
                }`}
              >
                 <div className="flex justify-between items-start">
                    <div className={`p-2 bg-slate-100 rounded-xl group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors ${selectedProfileId === p.id ? 'text-teal-500 bg-teal-500/10' : 'text-slate-400'}`}>
                       <FlaskConical size={20} />
                    </div>
                    <div className={`w-2 h-2 rounded-full ${p.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                 </div>
                 <div>
                    <p className={`font-black text-sm uppercase tracking-tight ${selectedProfileId === p.id ? 'text-white' : 'text-slate-800'}`}>{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{p.description}</p>
                 </div>
              </div>
           ))}
        </div>

        {/* Profile Components Main Area */}
        <div className="lg:col-span-2 space-y-6">
           {selectedProfileId ? (
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-full animate-in slide-in-from-right-4">
                 <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-50">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Estructura del Perfil</h3>
                    <div className="flex gap-2">
                       <button className="p-2 bg-slate-50 text-slate-400 border border-slate-100 rounded-xl hover:text-teal-600 transition-all"><Settings size={18} /></button>
                       <button className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Editar Componentes</button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    {details.map((comp, idx) => (
                       <div key={comp.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-teal-400 transition-all">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-xs text-slate-400 group-hover:text-teal-500 transition-colors">{idx + 1}</div>
                             <div>
                                <p className="font-black text-slate-800 text-xs uppercase tracking-tight">{comp.test_code}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{comp.reference_ranges?.test_name || 'Cargando...'}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className="text-[9px] font-black text-slate-400 uppercase">{comp.reference_ranges?.unit || '--'}</span>
                          </div>
                       </div>
                    ))}
                 </div>

                 <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
                       <ShieldCheck className="text-teal-400 mb-2" size={24} />
                       <h5 className="text-sm font-black uppercase">Validación en Cascada</h5>
                       <p className="text-[9px] text-slate-400 font-medium leading-relaxed mt-2">Al validar los componentes analíticos, el perfil se marca automáticamente como completado en el reporte final.</p>
                    </div>
                    <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                       <Zap className="text-emerald-600 mb-2" size={24} />
                       <h5 className="text-sm font-black text-emerald-900 uppercase">Costo Optimizados</h5>
                       <p className="text-[9px] text-emerald-700 font-medium leading-relaxed mt-2">Este perfil ahorra un 15% en el tiempo de procesamiento mediante la agrupación de muestras.</p>
                    </div>
                 </div>
              </div>
           ) : (
              <div className="bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center">
                 <FlaskRound size={64} className="text-slate-200 mb-6" />
                 <h4 className="font-black text-slate-400 uppercase tracking-widest">Seleccione un Perfil</h4>
              </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default TestProfileManager;
