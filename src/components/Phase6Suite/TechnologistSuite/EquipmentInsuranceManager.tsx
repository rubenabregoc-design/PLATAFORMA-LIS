import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Plus,
  Calendar,
  History,
  AlertTriangle,
  CheckCircle2,
  Settings,
  FileText,
  Zap,
  ArrowRight,
  Download,
  CreditCard,
  Briefcase,
  Activity,
  ChevronRight
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const EquipmentInsuranceManager: React.FC = () => {
  const [insurances, setInsurances] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'insurances' | 'warranties'>('insurances');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [insData, warData] = await Promise.all([
        SupabaseService.equipmentSafety.getInsurances(),
        SupabaseService.equipmentSafety.getWarranties()
      ]);
      setInsurances(insData);
      setWarranties(warData);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic text-white">Seguros & Garantías de Equipos</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Gestión de pólizas de cobertura y garantías de fábrica para analizadores y activos críticos. Protección de la inversión analítica.
          </p>
        </div>
        <div className="flex gap-4 relative z-10">
           <button
             onClick={() => setActiveView('insurances')}
             className={`px-6 py-3 rounded-2xl font-black text-sm uppercase transition-all ${activeView === 'insurances' ? 'bg-teal-500 text-slate-950' : 'bg-white/5 text-slate-400 border border-white/10'}`}
           >
              Pólizas de Seguro
           </button>
           <button
             onClick={() => setActiveView('warranties')}
             className={`px-6 py-3 rounded-2xl font-black text-sm uppercase transition-all ${activeView === 'warranties' ? 'bg-teal-500 text-slate-950' : 'bg-white/5 text-slate-400 border border-white/10'}`}
           >
              Garantías Fábrica
           </button>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Main Records Table */}
        <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
           <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800">
                {activeView === 'insurances' ? 'Listado de Pólizas Activas' : 'Vigencia de Garantías de Equipos'}
              </h3>
              <button className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">
                 Registrar {activeView === 'insurances' ? 'Póliza' : 'Garantía'}
              </button>
           </div>

           <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                       <th className="px-6 py-4">Equipo / Analizador</th>
                       <th className="px-6 py-4">{activeView === 'insurances' ? 'Compañía / Póliza' : 'Proveedor'}</th>
                       <th className="px-6 py-4">Vencimiento</th>
                       <th className="px-6 py-4">Estado</th>
                       <th className="px-6 py-4 text-right">Detalle</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {(activeView === 'insurances' ? insurances : warranties).map(item => (
                       <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
                                   <Activity size={16} />
                                </div>
                                <span className="font-black text-slate-800 text-xs uppercase">{item.analyzers?.name}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <p className="font-black text-slate-800 text-xs uppercase">{activeView === 'insurances' ? item.insurance_company : item.provider_name}</p>
                             {activeView === 'insurances' && <p className="text-[10px] text-slate-400 font-bold uppercase">{item.policy_number}</p>}
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                                <Calendar size={12} className={new Date(item.expiry_date) < new Date() ? 'text-red-500' : 'text-slate-300'} />
                                {new Date(item.expiry_date).toLocaleDateString()}
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                                item.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                             }`}>
                                {item.status}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button className="p-2 text-slate-400 hover:text-slate-900 transition-all">
                                <ChevronRight size={18} />
                             </button>
                          </td>
                       </tr>
                    ))}
                    {(activeView === 'insurances' ? insurances : warranties).length === 0 && (
                       <tr>
                          <td colSpan={5} className="px-6 py-20 text-center text-slate-300 font-black uppercase text-xs">Sin registros de {activeView}</td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center text-center">
              <CreditCard className="text-blue-500 mb-4" size={32} />
              <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest">Inversión Protegida</h4>
              <p className="text-3xl font-black text-slate-900 mt-2">$450,000</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Valor Asegurado Total</p>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
              <Zap className="text-yellow-400 mb-4" size={32} />
              <h4 className="font-black text-sm uppercase tracking-widest">Reclamos Digitales</h4>
              <p className="text-slate-400 text-[10px] leading-relaxed mt-3 font-medium">
                 En caso de fallo técnico, el sistema genera automáticamente el reporte de incidente (Módulo 20) vinculado a la póliza vigente para el reclamo de garantía.
              </p>
              <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Generar Reporte de Siniestro</button>
           </div>

           <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
              <AlertTriangle className="text-amber-500" size={24} />
              <p className="text-[9px] font-black text-amber-800 uppercase">La garantía del equipo <span className="text-rose-600">SYSMEX XN-550</span> vence en 30 días.</p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default EquipmentInsuranceManager;
