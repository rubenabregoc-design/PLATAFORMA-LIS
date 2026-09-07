import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Truck,
  Package,
  Plus,
  Search,
  ChevronRight,
  FileText,
  CheckCircle2,
  Clock,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const SupplierPurchasingManager: React.FC = () => {
  const [pos, setPOs] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [poData, supData] = await Promise.all([
        SupabaseService.purchasing.getPOs(),
        SupabaseService.purchasing.getSuppliers()
      ]);
      setPOs(poData);
      setSuppliers(supData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <ShoppingBag className="text-amber-400" size={32} />
              <h1 className="text-3xl font-black tracking-tight">Gestión de Compras y Suministros</h1>
            </div>
            <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
              Control centralizado de órdenes de compra (OC), gestión de proveedores y recepción de mercancía.
            </p>
          </div>
          <div className="flex gap-4">
            <button className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20">
              <Plus size={18} />
              NUEVA ORDEN DE COMPRA
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Suppliers Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest px-2">Proveedores Homologados</h3>
          {suppliers.map(sup => (
            <div key={sup.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                  <Truck size={20} />
                </div>
                <div>
                  <p className="font-black text-slate-800 text-sm">{sup.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{sup.category}</p>
                </div>
              </div>
            </div>
          ))}
          <button className="w-full py-3 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-200">
            <Plus size={16} className="inline mr-2" /> Agregar Proveedor
          </button>
        </div>

        {/* PO Table */}
        <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-800">Historial de Órdenes de Compra</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input placeholder="Buscar por OC..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs w-64" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">OC N°</th>
                  <th className="px-6 py-4">Proveedor</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4 text-right">Monto Total</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pos.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-black text-xs text-slate-700">{po.order_number}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{po.suppliers?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(po.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">${parseFloat(po.total_amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                        po.status === 'RECEIVED' ? 'bg-green-100 text-green-700' :
                        po.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {pos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">No hay órdenes de compra registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierPurchasingManager;
