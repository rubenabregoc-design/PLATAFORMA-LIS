import React, { useState, useEffect } from 'react';
import { Thermometer, Snowflake, AlertTriangle, CheckCircle2, Wifi, Zap } from 'lucide-react';

interface FridgeSensor {
  id: string;
  name: string;
  temp: number;
  min: number;
  max: number;
  status: 'OPTIMO' | 'ADVERTENCIA' | 'CRITICO';
  battery: number;
  lastUpdate: string;
}

export const IotColdChainMonitor: React.FC = () => {
  const [sensors, setSensors] = useState<FridgeSensor[]>([
    { id: 'S1', name: 'Nevera Reactivos (Hematología)', temp: 4.2, min: 2, max: 8, status: 'OPTIMO', battery: 85, lastUpdate: 'En vivo' },
    { id: 'S2', name: 'Freezer -20°C (Inmunología)', temp: -18.5, min: -25, max: -15, status: 'OPTIMO', battery: 92, lastUpdate: 'En vivo' },
    { id: 'S3', name: 'Nevera Muestras (Recepción)', temp: 7.8, min: 2, max: 8, status: 'ADVERTENCIA', battery: 12, lastUpdate: 'Hace 2 min' },
  ]);

  // Simulate real-time fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors(prev => prev.map(s => {
        const fluctuation = (Math.random() - 0.5) * 0.2;
        const newTemp = parseFloat((s.temp + fluctuation).toFixed(1));
        let newStatus = s.status;

        if (newTemp > s.max || newTemp < s.min) newStatus = 'CRITICO';
        else if (newTemp > s.max - 1 || newTemp < s.min + 1) newStatus = 'ADVERTENCIA';
        else newStatus = 'OPTIMO';

        return { ...s, temp: newTemp, status: newStatus as any };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Monitoreo IoT Cadena de Frío</h3>
          <p className="text-[10px] text-slate-500 mt-1 font-bold">Sensores Activos ISO 15189</p>
        </div>
        <div className="flex items-center space-x-2 bg-teal-500/10 px-3 py-1.5 rounded-full border border-teal-500/20">
           <Wifi className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
           <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest">Gateway Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sensors.map(s => (
          <div key={s.id} className={`p-6 rounded-[2rem] border transition-all duration-500 ${
            s.status === 'CRITICO' ? 'bg-rose-500/10 border-rose-500/30' :
            s.status === 'ADVERTENCIA' ? 'bg-amber-500/10 border-amber-500/30' :
            'bg-slate-950 border-white/5'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${
                s.status === 'CRITICO' ? 'bg-rose-500 text-white' :
                s.status === 'ADVERTENCIA' ? 'bg-amber-500 text-slate-950' :
                'bg-slate-800 text-teal-400'
              }`}>
                {s.temp < 0 ? <Snowflake className="w-5 h-5" /> : <Thermometer className="w-5 h-5" />}
              </div>
              <div className="flex items-center space-x-1.5">
                <Zap className={`w-3 h-3 ${s.battery < 20 ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                <span className="text-[9px] font-black text-slate-500">{s.battery}%</span>
              </div>
            </div>

            <div>
               <div className="text-3xl font-black text-white tracking-tighter mb-1">{s.temp}°C</div>
               <div className="text-[10px] font-black text-white uppercase tracking-tight line-clamp-1">{s.name}</div>
               <div className="flex items-center justify-between mt-4">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                    s.status === 'OPTIMO' ? 'bg-emerald-500/20 text-emerald-400' :
                    s.status === 'ADVERTENCIA' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    {s.status}
                  </span>
                  <span className="text-[7px] font-mono text-slate-600 uppercase font-bold">{s.lastUpdate}</span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {sensors.some(s => s.status === 'CRITICO') && (
        <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-center space-x-4 animate-bounce">
           <AlertTriangle className="w-6 h-6 text-rose-400" />
           <div>
              <div className="text-[11px] font-black text-white uppercase tracking-widest">Alerta Crítica de Temperatura</div>
              <p className="text-[9px] text-rose-200 uppercase font-bold">Riesgo de degradación de reactivos en curso.</p>
           </div>
        </div>
      )}
    </div>
  );
};
