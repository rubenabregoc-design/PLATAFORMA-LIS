import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Award,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  History,
  Plus,
  Search,
  User,
  Clock,
  TrendingUp,
  AlertCircle,
  FileBadge,
  Calendar
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const StaffCompetencyManager: React.FC = () => {
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [trainingLogs, setTrainingLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    try {
      const [compData, trainData] = await Promise.all([
        SupabaseService.staff.getCompetencies(),
        SupabaseService.staff.getTrainingLogs()
      ]);
      setCompetencies(compData);
      setTrainingLogs(trainData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'EXPERT': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'COMPETENT': return 'bg-green-100 text-green-700 border-green-200';
      case 'EVALUATOR': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap className="text-teal-400" size={32} />
              <h1 className="text-3xl font-black tracking-tight">Capacitación y Competencia Técnica</h1>
            </div>
            <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
              Gestión del capital humano, registro de educación continua y verificación de competencias conforme a ISO 15189 §5.1.
            </p>
          </div>
          <div className="flex gap-4">
            <button className="bg-teal-500 hover:bg-teal-600 text-slate-950 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-xl shadow-teal-500/20">
              <Plus size={18} />
              NUEVA EVALUACIÓN
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Competencies Matrix */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800">Matriz de Competencias del Personal</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input placeholder="Filtrar personal..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs w-48" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">Tecnólogo Médico</th>
                    <th className="px-6 py-4">Competencia / Área</th>
                    <th className="px-6 py-4">Nivel</th>
                    <th className="px-6 py-4">Evaluado Por</th>
                    <th className="px-6 py-4">Vencimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {competencies.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-[10px] uppercase">{c.profiles?.name?.charAt(0)}</div>
                          <span className="font-black text-slate-800 text-xs uppercase">{c.profiles?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-700 text-xs">{c.competency_name.replace('_', ' ')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${getLevelColor(c.level)}`}>
                          {c.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">{c.profiles?.name || 'Director Técnico'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400">
                          <Clock size={14} className={new Date(c.expires_at) < new Date() ? 'text-red-500' : 'text-slate-300'} />
                          {new Date(c.expires_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {competencies.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">No hay registros de competencias validadas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Continuous Education Log */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <BookOpen size={20} className="text-blue-500" />
                Bitácora de Educación Continua
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {trainingLogs.map(log => (
                <div key={log.id} className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-teal-400 transition-all group">
                  <div className="p-3 bg-white rounded-xl h-fit shadow-sm group-hover:text-teal-600 transition-colors">
                    <FileBadge size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h5 className="font-black text-slate-800 text-sm">{log.course_name}</h5>
                      <span className="text-[9px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full uppercase">{log.hours_credits} Créditos</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{log.provider}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase">
                        <User size={12} /> {log.profiles?.name || 'TM-8823'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase">
                        <Calendar size={12} /> {new Date(log.completion_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Stats & Compliance */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6">Métricas de Competencia</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nivel de Especialización</p>
                  <h4 className="text-3xl font-black text-slate-800">84%</h4>
                </div>
                <div className="text-green-500 flex items-center gap-1 text-[10px] font-bold pb-1">
                  <TrendingUp size={14} /> +4% YoY
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 w-[84%]"></div>
              </div>
            </div>

            <div className="mt-8 space-y-4 pt-8 border-t border-slate-100">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-500">Créditos Totales Mes:</span>
                <span className="font-black text-slate-800">145h</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-500">Evaluaciones Pendientes:</span>
                <span className="font-black text-rose-500">2</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <Award className="text-white/20 absolute -right-4 -top-4 w-32 h-32" />
            <h4 className="font-black text-xl leading-tight relative z-10">Mantenimiento de Idoneidad</h4>
            <p className="text-blue-100 text-[10px] mt-4 leading-relaxed font-medium relative z-10">
              De acuerdo a la normativa nacional, todo personal técnico debe completar al menos 20 horas de educación continua al año para mantener su competencia analítica vigente.
            </p>
            <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/20 backdrop-blur-md">
              Configurar Requerimientos
            </button>
          </div>

          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
             <div className="flex items-center gap-3 text-amber-600 mb-2">
                <AlertCircle size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Alerta de Expiración</span>
             </div>
             <p className="text-[10px] text-slate-500 leading-relaxed font-medium">La certificación de "Validación de Resultados de Química" de la Lic. Soto vence en 15 días.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StaffCompetencyManager;
