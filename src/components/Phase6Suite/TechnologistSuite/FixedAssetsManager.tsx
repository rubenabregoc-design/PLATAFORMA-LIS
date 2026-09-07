import React, { useState, useEffect } from 'react';
import {
  Box,
  Settings,
  Calendar,
  TrendingDown,
  ShieldCheck,
  History,
  Plus,
  Search,
  ChevronRight,
  Cpu,
  Monitor,
  Printer,
  Trash2,
  AlertCircle,
  X,
  FileCheck
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const AssetAuditModal: React.FC<{ asset: any, onClose: () => void }> = ({ asset, onClose }) => {
  const [lifecycle, setLifecycle] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLifecycle = async () => {
      try {
        const data = await SupabaseService.fixedAssets.getAssetAuditLifecycle(asset.id);
        setLifecycle(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchLifecycle();
  }, [asset.id]);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <History className="text-teal-400" size={24} />
            <div>
              <h3 className="text-lg font-black tracking-tight uppercase">Historial de Vida del Activo</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{asset.internal_code} • {asset.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto bg-slate-50/50">
          <div className="relative border-l-4 border-slate-200 ml-4 space-y-12 pb-8">
            {/* Purchase Event */}
            <div className="relative pl-10">
              <div className="absolute -left-[14px] top-0 w-6 h-6 bg-slate-900 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
                <Box size={10} className="text-white" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adquisición Inicial</p>
              <h4 className="text-sm font-black text-slate-800 mt-1">{new Date(asset.purchase_date).toLocaleDateString()}</h4>
              <p className="text-xs text-slate-500 mt-1">Compra registrada por valor de <span className="font-bold text-slate-900">${parseFloat(asset.purchase_value).toLocaleString()}</span>.</p>
            </div>

            {/* Maintenance Events */}
            {lifecycle.map((event, idx) => (
              <div key={idx} className="relative pl-10">
                <div className="absolute -left-[14px] top-0 w-6 h-6 bg-teal-500 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
                  <ShieldCheck size={10} className="text-white" />
                </div>
                <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Evento Técnico: {event.maintenance_task}</p>
                <h4 className="text-sm font-black text-slate-800 mt-1">{new Date(event.maintenance_date).toLocaleDateString()}</h4>
                <div className="mt-2 p-3 bg-white border border-slate-100 rounded-xl space-y-1 shadow-sm">
                  <p className="text-xs text-slate-600 font-medium">Estado: <span className="font-bold text-green-600">{event.maintenance_status}</span></p>
                  <p className="text-[10px] text-slate-400">Verificado por: {event.technician_name || 'Ingeniería LIS'}</p>
                </div>
              </div>
            ))}

            {lifecycle.length === 0 && (
              <div className="relative pl-10">
                <div className="absolute -left-[14px] top-0 w-6 h-6 bg-amber-500 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
                  <AlertCircle size={10} className="text-white" />
                </div>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Sin Servicios Técnicos</p>
                <p className="text-xs text-slate-500 mt-1">No se han registrado mantenimientos o reparaciones para este activo.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t flex justify-end">
          <button className="flex items-center gap-2 bg-slate-900 text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">
            <FileCheck size={16} /> EXPORTAR HOJA DE VIDA
          </button>
        </div>
      </div>
    </div>
  );
};

const FixedAssetsManager: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForAudit, setSelectedForAudit] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [astData, catData] = await Promise.all([
        SupabaseService.fixedAssets.getAssets(),
        SupabaseService.fixedAssets.getCategories()
      ]);
      setAssets(astData);
      setCategories(catData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDepreciation = (purchaseValue: number, years: number, purchaseDate: string) => {
    const monthsOwned = (new Date().getFullYear() - new Date(purchaseDate).getFullYear()) * 12 + (new Date().getMonth() - new Date(purchaseDate).getMonth());
    const totalMonths = years * 12;
    const monthlyDep = purchaseValue / totalMonths;
    const accumulated = Math.min(purchaseValue, monthlyDep * monthsOwned);
    return {
      accumulated: accumulated,
      current: purchaseValue - accumulated
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Box className="text-teal-400" size={32} />
              <h1 className="text-3xl font-black tracking-tight">Control de Activos Fijos e Inventario</h1>
            </div>
            <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
              Registro patrimonial, depreciación contable y seguimiento de ubicación de equipos e infraestructura.
            </p>
          </div>
          <button className="bg-teal-500 hover:bg-teal-600 text-slate-950 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-xl shadow-teal-500/20">
            <Plus size={18} />
            REGISTRAR ACTIVO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-800">Inventario Patrimonial</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input placeholder="Buscar por código o descripción..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs w-64" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Código / Descripción</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">V. Compra</th>
                  <th className="px-6 py-4">V. Libro (Actual)</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {assets.map(asset => {
                  const dep = calculateDepreciation(parseFloat(asset.purchase_value), asset.asset_categories?.depreciation_years || 5, asset.purchase_date);
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                            {asset.asset_categories?.name.includes('EQUIPO') ? <Cpu size={18} /> : <Monitor size={18} />}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm leading-none">{asset.internal_code}</p>
                            <p className="text-[10px] text-slate-400 mt-1 font-bold">{asset.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase">{asset.asset_categories?.name.replace('_', ' ')}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">${parseFloat(asset.purchase_value).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <p className="font-black text-slate-900 text-sm">${dep.current.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-400">Dep: -${dep.accumulated.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          asset.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedForAudit(asset)}
                          className="p-2 text-slate-400 hover:text-teal-500 hover:bg-teal-50 rounded-xl transition-all"
                          title="Simulación de Auditoría"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          {/* ... sidebar ... */}
        </div>
      </div>

      {selectedForAudit && (
        <AssetAuditModal
          asset={selectedForAudit}
          onClose={() => setSelectedForAudit(null)}
        />
      )}
    </div>
  );
};

export default FixedAssetsManager;
