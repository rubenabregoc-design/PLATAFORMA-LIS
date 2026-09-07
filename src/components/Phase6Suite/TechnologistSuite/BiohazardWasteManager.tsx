import React, { useState, useEffect } from 'react';
import {
  Flame,
  Trash2,
  AlertOctagon,
  ShieldAlert,
  FileText,
  Truck,
  Plus,
  Scale,
  Search,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';
import DisposalManifestPDF from './DisposalManifestPDF';

const BiohazardWasteManager: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [pickups, setPickups] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPickup, setSelectedPickup] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logData, pckData, catData] = await Promise.all([
        SupabaseService.waste.getLogs(),
        SupabaseService.waste.getPickups(),
        SupabaseService.waste.getCategories()
      ]);
      setLogs(logData);
      setPickups(pckData);
      setCategories(catData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (color: string) => {
    switch (color) {
      case 'RED': return 'bg-red-500 text-white';
      case 'RED_RIGID': return 'bg-rose-700 text-white border-2 border-rose-900';
      case 'YELLOW': return 'bg-yellow-400 text-slate-900';
      default: return 'bg-slate-500 text-white';
    }
  };

  const totalInStorage = logs.filter(l => l.status === 'IN_STORAGE').reduce((acc, l) => acc + parseFloat(l.weight_kg), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Flame className="text-red-500 animate-pulse" size={32} />
              <h1 className="text-3xl font-black tracking-tight">Gestión de Residuos Bio-peligrosos</h1>
            </div>
            <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
              Control de bioseguridad, bitácora de descartes y trazabilidad de recolección externa (Gestión Ambiental ISO 14001).
            </p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 px-8 py-6 rounded-3xl backdrop-blur-md text-center">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Carga Actual en Almacén</p>
            <h4 className="text-4xl font-black text-red-500">{totalInStorage.toFixed(1)} <span className="text-sm">kg</span></h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Daily Generation Log */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-800">Bitácora de Descarte Diario</h3>
            <button className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-slate-800 transition-all">
              <Plus size={16} />
              REGISTRAR DESCARTE
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Categoría de Residuo</th>
                  <th className="px-6 py-4 text-center">Peso (kg)</th>
                  <th className="px-6 py-4">Generado Por</th>
                  <th className="px-6 py-4">Fecha/Hora</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(log.waste_categories?.color_code)}`}></div>
                        <span className="font-bold text-slate-800 text-xs uppercase tracking-tight">{log.waste_categories?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-black text-slate-900">{log.weight_kg}</td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">{log.generated_by?.slice(0,8)}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                        log.status === 'IN_STORAGE' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {log.status === 'IN_STORAGE' ? 'EN ALMACÉN' : 'RECOLECTADO'}
                      </span>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic font-medium">No hay registros de descartes recientes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: External Pickups & Safety */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
              <Truck className="text-blue-500" size={18} />
              Manifiestos de Recolección
            </h3>
            <div className="space-y-4">
              {pickups.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPickup(p)}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-blue-400 transition-all"
                >
                  <div>
                    <p className="font-black text-slate-800 text-xs leading-none">{p.manifest_number}</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{p.company_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 text-xs">{p.total_weight_kg} kg</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase">{new Date(p.pickup_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                REGISTRAR RECOLECCIÓN
              </button>
            </div>
          </div>

          <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-200 shadow-sm relative overflow-hidden">
            <ShieldAlert className="text-amber-500 mb-4" size={32} />
            <h4 className="font-black text-slate-800 text-lg leading-tight">Protocolo de Emergencia (Derrame)</h4>
            <p className="text-amber-900 text-[10px] mt-2 leading-relaxed font-medium">
              1. Restringir el área inmediatamente.<br/>
              2. Aplicar kit de neutralización/absorción.<br/>
              3. Notificar al Oficial de Bioseguridad TM-4091.
            </p>
            <div className="mt-6 p-4 bg-white/50 rounded-2xl border border-amber-100 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-amber-600" />
              <span className="text-[9px] font-black text-amber-800 uppercase">Kit de Derrames Verificado: HOY</span>
            </div>
          </div>
        </div>

      </div>

      {selectedPickup && (
        <DisposalManifestPDF
          pickup={selectedPickup}
          onClose={() => setSelectedPickup(null)}
        />
      )}
    </div>
  );
};

export default BiohazardWasteManager;
