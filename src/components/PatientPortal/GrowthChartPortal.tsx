import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { Baby, TrendingUp, Info, Activity, Scale, ChevronLeft, ChevronRight, Ruler } from 'lucide-react';
import { SupabaseService } from '../../services/SupabaseService';

interface GrowthChartPortalProps {
  patient: any;
  onClose: () => void;
}

const GrowthChartPortal: React.FC<GrowthChartPortalProps> = ({ patient, onClose }) => {
  const [standards, setStandards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [measureType, setMeasureType] = useState<'WEIGHT_FOR_AGE' | 'HEIGHT_FOR_AGE'>('WEIGHT_FOR_AGE');

  useEffect(() => {
    fetchStandards();
  }, [measureType]);

  const fetchStandards = async () => {
    setLoading(true);
    try {
      const data = await SupabaseService.growth.getStandards(patient.gender, measureType);
      setStandards(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const calculateAgeMonths = (dob: string) => {
    const birth = new Date(dob);
    const now = new Date();
    return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  };

  const ageMonths = calculateAgeMonths(patient.dob);
  const patientValue = measureType === 'WEIGHT_FOR_AGE' ? patient.weight_kg : patient.height_cm;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                 <Baby className="text-teal-400" size={24} />
                 <h2 className="text-xl font-black uppercase tracking-tight">Seguimiento de Crecimiento OMS</h2>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                 Paciente: {patient.first_name} {patient.last_name} • {ageMonths} meses
              </p>
           </div>
           <div className="flex gap-4 relative z-10">
              <button
                onClick={() => setMeasureType('WEIGHT_FOR_AGE')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${measureType === 'WEIGHT_FOR_AGE' ? 'bg-teal-500 text-slate-950 border-teal-500' : 'bg-white/5 text-slate-400 border-white/10'}`}
              >
                 Peso
              </button>
              <button
                onClick={() => setMeasureType('HEIGHT_FOR_AGE')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${measureType === 'HEIGHT_FOR_AGE' ? 'bg-teal-500 text-slate-950 border-teal-500' : 'bg-white/5 text-slate-400 border-white/10'}`}
              >
                 Talla
              </button>
           </div>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors relative z-10"><ChevronLeft size={32} /></button>
           <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto space-y-8">
           <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={standards}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="age_months" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} label={{ value: 'Edad (Meses)', position: 'bottom', fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} label={{ value: measureType === 'WEIGHT_FOR_AGE' ? 'Peso (kg)' : 'Talla (cm)', angle: -90, position: 'left', fontSize: 10, fontWeight: 'bold' }} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />

                    {/* WHO Standard Lines */}
                    <Line type="monotone" dataKey="p97" stroke="#fee2e2" strokeDasharray="5 5" dot={false} name="P97" />
                    <Line type="monotone" dataKey="p85" stroke="#fef3c7" strokeDasharray="5 5" dot={false} name="P85" />
                    <Line type="monotone" dataKey="p50" stroke="#10b981" strokeWidth={2} dot={false} name="Media (OMS)" />
                    <Line type="monotone" dataKey="p15" stroke="#fef3c7" strokeDasharray="5 5" dot={false} name="P15" />
                    <Line type="monotone" dataKey="p3" stroke="#fee2e2" strokeDasharray="5 5" dot={false} name="P3" />

                    {/* Patient Position */}
                    {patientValue && (
                       <ReferenceDot x={ageMonths} y={patientValue} r={6} fill="#0f172a" stroke="#fff" strokeWidth={2} label={{ position: 'top', value: 'Hoy', fill: '#0f172a', fontSize: 10, fontWeight: 'black' }} />
                    )}
                    <Legend verticalAlign="top" height={36}/>
                 </LineChart>
              </ResponsiveContainer>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
                 <div className="p-3 bg-white rounded-2xl shadow-sm text-teal-600"><TrendingUp size={24} /></div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Estatus Nutricional</p>
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Adecuado</h4>
                 </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
                 <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600"><Scale size={24} /></div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Peso Actual</p>
                    <h4 className="text-lg font-black text-slate-800">{patient.weight_kg || '--'} kg</h4>
                 </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
                 <div className="p-3 bg-white rounded-2xl shadow-sm text-purple-600"><Ruler size={24} /></div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Talla Actual</p>
                    <h4 className="text-lg font-black text-slate-800">{patient.height_cm || '--'} cm</h4>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
           <div className="flex items-center gap-2 text-slate-400">
              <Info size={18} />
              <span className="text-[10px] font-black uppercase">Basado en Estándares Mundiales de la OMS</span>
           </div>
           <button
             onClick={onClose}
             className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all"
           >
              CERRAR VISTA
           </button>
        </div>
      </div>
    </div>
  );
};

export default GrowthChartPortal;
