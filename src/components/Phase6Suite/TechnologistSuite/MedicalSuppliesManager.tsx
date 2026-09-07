import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Minus,
  Search,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  History,
  Truck,
  Layers,
  Thermometer,
  ShieldCheck,
  Zap,
  Clock,
  MapPin
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const MedicalSuppliesManager: React.FC = () => {
  const [supplies, setSupplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchSupplies();
  }, []);

  const fetchSupplies = async () => {
    try {
      const data = await SupabaseService.supplies.getAll();
      setSupplies(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const filtered = supplies.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Package className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic">Almacén de Insumos Médicos</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Control de stock de jeringas, tubos vacutainer, algodón y equipo de protección personal (EPP).
          </p>
        </div>
        <div className="flex gap-4">
           <button className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-teal-500/20">
              <Plus size={18} className="inline mr-2" /> Nuevo Insumo
           </button>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Statistics Row */}
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Items en Stock</p>
              <h3 className="text-2xl font-black text-slate-800">{supplies.length}</h3>
           </div>
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Agotados</p>
              <h3 className="text-2xl font-black text-rose-600">{supplies.filter(s => s.current_stock <= 0).length}</h3>
           </div>
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bajo el Mínimo</p>
              <h3 className="text-2xl font-black text-amber-600">{supplies.filter(s => s.current_stock > 0 && s.current_stock <= s.min_threshold).length}</h3>
           </div>
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rotación de Inventario</p>
              <h3 className="text-2xl font-black text-emerald-600">ALTA</h3>
           </div>
        </div>

        {/* Main Supplies Table */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-800">Catálogo de Consumibles</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                placeholder="Filtrar insumos..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Insumo / Descripción</th>
                  <th className="px-6 py-4 text-center">Stock Actual</th>
                  <th className="px-6 py-4 text-center">Umbral Mín</th>
                  <th className="px-6 py-4">Ubicación</th>
                  <th className="px-6 py-4 text-right">Ajustar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 text-slate-500 rounded-xl">
                             <Layers size={16} />
                          </div>
                          <div>
                             <p className="font-black text-slate-800 text-xs uppercase tracking-tight">{s.name}</p>
                             <p className="text-[10px] text-slate-400 font-bold">{s.sku || 'N/A'}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={`font-black text-sm ${s.current_stock <= s.min_threshold ? 'text-red-600' : 'text-slate-900'}`}>{s.current_stock}</span>
                       <span className="text-[9px] text-slate-400 font-bold ml-1 uppercase">{s.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-400 italic">{s.min_threshold}</td>
                    <td className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                       <div className="flex items-center gap-1.5"><MapPin size={12} className="text-teal-500" /> {s.location_id || 'ALMACÉN CENTRAL'}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Minus size={14} /></button>
                          <button className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><Plus size={14} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Truck className="text-blue-500" size={18} />
                 Reabastecimiento
              </h3>
              <div className="space-y-3">
                 <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                       <AlertTriangle size={14} />
                       <span className="text-[9px] font-black uppercase">Pedido Sugerido</span>
                    </div>
                    <p className="text-[10px] text-amber-900 font-medium">Quedan menos de 20 cajas de <span className="font-black">Tubos EDTA</span>. Generar OC.</p>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
              <ShieldCheck className="text-teal-400 mb-4" size={32} />
              <h4 className="font-black text-sm uppercase tracking-widest">Bioseguridad de Insumos</h4>
              <p className="text-slate-400 text-[10px] leading-relaxed mt-3 font-medium">
                 Todos los insumos que entren en contacto con muestras biológicas deben contar con certificación de esterilidad vigente y lote trazable.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalSuppliesManager;
