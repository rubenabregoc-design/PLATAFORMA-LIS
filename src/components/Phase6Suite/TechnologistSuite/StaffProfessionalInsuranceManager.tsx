import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Plus,
  Calendar,
  History,
  AlertTriangle,
  CheckCircle2,
  User,
  Award,
  FileText,
  Zap,
  ArrowRight,
  Download,
  Scale,
  Briefcase,
  Activity
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const StaffProfessionalInsuranceManager: React.FC = () => {
  const [insurances, setInsurances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsurances();
  }, []);

  const fetchInsurances = async () => {
    try {
      const data = await SupabaseService.professionalInsurance.getAll();
      setInsurances(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'EXPIRED': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic text-white">Seguros de Responsabilidad Civil Profesional</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Gestión de pólizas de mala praxis para tecnólogos médicos y personal facultativo. Protección legal institucional y técnica.
          </p>
        </div>
        <button className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-teal-500/20">
          <Plus size={18} className="inline mr-2" /> Registrar Póliza
        </button>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Main List */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
           <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800">Directorio de Coberturas Médicas</h3>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input placeholder="Buscar por tecnólogo..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] w-64" />
              </div>
           </div>

           <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                       <th className="px-6 py-4">Tecnólogo Médico / Idoneidad</th>
                       <th className="px-6 py-4">Aseguradora / Póliza</th>
                       <th className="px-6 py-4 text-center">Límite Cobertura</th>
                       <th className="px-6 py-4">Vencimiento</th>
                       <th className="px-6 py-4">Estado</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {insurances.map(ins => (
                       <tr key={ins.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
                                   <User size={16} />
                                </div>
                                <div>
                                   <p className="font-black text-slate-800 text-xs uppercase tracking-tight">{ins.profiles?.name}</p>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase">{ins.profiles?.license_number || 'TM-PENDIENTE'}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <p className="font-black text-slate-800 text-xs uppercase">{ins.insurance_company}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase">{ins.policy_number}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className="font-black text-sm text-slate-900">${parseFloat(ins.coverage_limit).toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <Calendar size={12} className={new Date(ins.expiry_date) < new Date() ? 'text-red-500' : 'text-slate-300'} />
                                {new Date(ins.expiry_date).toLocaleDateString()}
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${getStatusStyle(ins.status)}`}>
                                {ins.status}
                             </span>
                          </td>
                       </tr>
                    ))}
                    {insurances.length === 0 && (
                       <tr>
                          <td colSpan={5} className="px-6 py-20 text-center text-slate-300 font-black uppercase text-xs">No hay pólizas registradas</td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Sidebar Intel */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center text-center">
              <ShieldCheck className="text-blue-500 mb-4" size={32} />
              <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest">Total Responsabilidad</h4>
              <p className="text-3xl font-black text-slate-900 mt-2">$2.5M</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Cobertura Agregada</p>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
              <Zap className="text-yellow-400 mb-4" size={32} />
              <h4 className="font-black text-sm uppercase tracking-widest">Defensa Legal</h4>
              <p className="text-slate-400 text-[10px] leading-relaxed mt-3 font-medium text-justify">
                 "Toda póliza debe incluir cobertura para defensa en procesos ante el Consejo Técnico de Salud y auditorías de fiscalía en caso de hallazgos críticos no notificados."
              </p>
              <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Ver Manual de Protocolos</button>
           </div>

           <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3">
              <AlertTriangle className="text-rose-500" size={24} />
              <p className="text-[9px] font-black text-rose-800 uppercase">La póliza del Lic. Carlos Salas vence en 15 días.</p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default StaffProfessionalInsuranceManager;
