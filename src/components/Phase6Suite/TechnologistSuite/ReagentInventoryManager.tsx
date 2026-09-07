import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  Calendar,
  Plus,
  TrendingDown,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  ThermometerSnowflake,
  Search,
  FlaskConical
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';
import { motion } from 'framer-motion';

const ReagentInventoryManager: React.FC = () => {
  const [reagents, setReagents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchReagents();
  }, []);

  const fetchReagents = async () => {
    try {
      const data = await SupabaseService.reagents.getAll();
      setReagents(data);
    } catch (error) {
      console.error("Error fetching reagents", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, stock: number, threshold: number) => {
    if (status === 'EXPIRED') return 'bg-red-100 text-red-700 border-red-200';
    if (stock <= 0) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (stock <= threshold) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (status === 'OPENED') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const filtered = reagents.filter(r =>
    r.name.toLowerCase().includes(filter.toLowerCase()) ||
    r.lot_number.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl w-fit mb-4">
            <Package size={24} />
          </div>
          <p className="text-slate-500 text-xs font-black uppercase">Reactivos Totales</p>
          <h3 className="text-2xl font-black text-slate-800">{reagents.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="p-2 bg-red-50 text-red-600 rounded-xl w-fit mb-4">
            <AlertTriangle size={24} />
          </div>
          <p className="text-slate-500 text-xs font-black uppercase">Por Vencer (30d)</p>
          <h3 className="text-2xl font-black text-slate-800">
            {reagents.filter(r => new Date(r.expiry_date) <= new Date(Date.now() + 30*24*60*60*1000)).length}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl w-fit mb-4">
            <TrendingDown size={24} />
          </div>
          <p className="text-slate-500 text-xs font-black uppercase">Stock Crítico</p>
          <h3 className="text-2xl font-black text-slate-800">
            {reagents.filter(r => r.current_stock <= r.min_threshold).length}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="p-2 bg-green-50 text-green-600 rounded-xl w-fit mb-4">
            <CheckCircle2 size={24} />
          </div>
          <p className="text-slate-500 text-xs font-black uppercase">En Uso (Abiertos)</p>
          <h3 className="text-2xl font-black text-slate-800">
            {reagents.filter(r => r.status === 'OPENED').length}
          </h3>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Inventario de Reactivos e Insumos</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Reagent Lifecycle & Chain of Custody</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por nombre o lote..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-950/10 w-64"
              />
            </div>
            <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
              <Plus size={16} />
              NUEVO REACTIVO
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Reactivo / Fabricante</th>
                <th className="px-6 py-4">Lote / Catálogo</th>
                <th className="px-6 py-4 text-center">Stock Actual</th>
                <th className="px-6 py-4">Expiración</th>
                <th className="px-6 py-4">Condición</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((reagent) => (
                <tr key={reagent.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                        <FlaskConical size={18} />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm leading-tight">{reagent.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{reagent.manufacturer || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">
                    <div>L: {reagent.lot_number}</div>
                    <div className="text-[9px] opacity-60">CAT: {reagent.catalog_number}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-sm font-black ${reagent.current_stock <= reagent.min_threshold ? 'text-red-600' : 'text-slate-800'}`}>
                      {reagent.current_stock}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1 font-bold">{reagent.unit}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(reagent.expiry_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <ThermometerSnowflake size={14} className="text-blue-400" />
                      {reagent.storage_condition || 'Ambiente'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${getStatusColor(reagent.status, reagent.current_stock, reagent.min_threshold)}`}>
                      {reagent.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg shadow-sm">
                        <Edit3 size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg shadow-sm">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReagentInventoryManager;
