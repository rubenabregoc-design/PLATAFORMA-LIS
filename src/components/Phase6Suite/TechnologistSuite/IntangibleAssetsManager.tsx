import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Settings,
  Globe,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  Clock,
  History,
  CreditCard,
  FileBadge,
  Zap,
  ArrowRight,
  Monitor
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const IntangibleAssetsManager: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const data = await SupabaseService.intangibles.getAll();
      setAssets(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'SOFTWARE': return <Monitor size={20} />;
      case 'DOMAIN': return <Globe size={20} />;
      case 'CERTIFICATE': return <ShieldCheck size={20} />;
      default: return <FileBadge size={20} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Cloud className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic text-white">Activos Intangibles & Licenciamiento</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Gestión de licencias de software, dominios web, certificados de seguridad y propiedad intelectual del laboratorio.
          </p>
        </div>
        <button className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-teal-500/20">
          <Plus size={18} className="inline mr-2" /> Agregar Activo
        </button>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Assets List */}
        <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-800">Catálogo de Activos Digitales</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                placeholder="Filtrar por nombre o proveedor..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Activo / Categoría</th>
                  <th className="px-6 py-4">Proveedor</th>
                  <th className="px-6 py-4">Costo / Ciclo</th>
                  <th className="px-6 py-4 text-center">Expiración</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {assets.filter(a => a.name.toLowerCase().includes(filter.toLowerCase())).map(asset => (
                  <tr key={asset.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
                             {getCategoryIcon(asset.category)}
                          </div>
                          <div>
                             <p className="font-black text-slate-800 text-xs uppercase tracking-tight">{asset.name}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase">{asset.category}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-[10px] font-black text-slate-600 uppercase">{asset.provider || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                       <div className="text-[10px] font-black text-slate-700">${parseFloat(asset.cost).toLocaleString()}</div>
                       <div className="text-[8px] text-slate-400 font-bold uppercase">{asset.billing_cycle}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                          <Clock size={12} className={new Date(asset.expiry_date) < new Date() ? 'text-red-500' : 'text-slate-300'} />
                          {asset.expiry_date ? new Date(asset.expiry_date).toLocaleDateString() : 'N/A'}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                          asset.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                       }`}>
                          {asset.status}
                       </span>
                    </td>
                  </tr>
                ))}
                {assets.length === 0 && (
                   <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-slate-300 font-black uppercase text-xs">No hay activos registrados</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center text-center">
              <CreditCard className="text-blue-500 mb-4" size={32} />
              <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest">Gasto en Licenciamiento</h4>
              <p className="text-3xl font-black text-slate-900 mt-2">$2,450</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Anualizado Estimado</p>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
              <Zap className="text-yellow-400 mb-4" size={32} />
              <h4 className="font-black text-sm uppercase tracking-widest">Auto-Renovación</h4>
              <p className="text-slate-400 text-[10px] leading-relaxed mt-3 font-medium">
                 El sistema gestiona la renovación automática de dominios para evitar la interrupción del Portal del Paciente y el LIS Cloud.
              </p>
              <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Ver Políticas IT</button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default IntangibleAssetsManager;
