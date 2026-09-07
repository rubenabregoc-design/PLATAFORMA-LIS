import React, { useState, useEffect } from 'react';
import {
  ThermometerSnowflake,
  ThermometerSun,
  Wind,
  BellRing,
  History,
  Settings,
  AlertCircle,
  TrendingUp,
  CloudLightning,
  RefreshCw,
  Clock
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const ColdChainMonitor: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const data = await SupabaseService.coldChain.getDevices();
      setDevices(data);
      if (data.length > 0 && !selectedDevice) setSelectedDevice(data[0]);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (selectedDevice) fetchReadings();
  }, [selectedDevice]);

  const fetchReadings = async () => {
    try {
      const data = await SupabaseService.coldChain.getHistoricalReadings(selectedDevice.id, 12);
      setReadings(data.map(r => ({
        time: new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        temp: parseFloat(r.temperature as any)
      })));
    } catch (error) { console.error(error); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ALARM': return 'bg-rose-500 shadow-rose-500/50';
      case 'ONLINE': return 'bg-emerald-500 shadow-emerald-500/50';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Real-time Telemetry Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {devices.map(device => (
          <div
            key={device.id}
            onClick={() => setSelectedDevice(device)}
            className={`p-6 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden ${
              selectedDevice?.id === device.id
                ? 'bg-slate-900 border-teal-500 shadow-2xl shadow-teal-500/10'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-xl ${selectedDevice?.id === device.id ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-100 text-slate-500'}`}>
                <ThermometerSnowflake size={20} />
              </div>
              <div className={`w-2 h-2 rounded-full animate-ping ${getStatusColor(device.status)}`}></div>
            </div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${selectedDevice?.id === device.id ? 'text-slate-400' : 'text-slate-500'}`}>
              {device.name.replace('_', ' ')}
            </p>
            <h3 className={`text-3xl font-black mt-1 ${selectedDevice?.id === device.id ? 'text-white' : 'text-slate-900'}`}>
              {device.last_reading_temp || '--'} <span className="text-sm font-bold">°C</span>
            </h3>
            <p className="text-[9px] text-slate-500 font-bold mt-2 uppercase">{device.location_details}</p>
          </div>
        ))}
      </div>

      {/* Main Analysis View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Historical Graph */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Estabilidad Térmica (Últimas 12h)</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Sensor: {selectedDevice?.name}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchReadings} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all border border-slate-100">
                <RefreshCw size={18} />
              </button>
              <button className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all border border-slate-100">
                <Settings size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={readings}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <ReferenceLine y={selectedDevice?.max_temp_limit} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Max', fill: '#ef4444', fontSize: 10 }} />
                <ReferenceLine y={selectedDevice?.min_temp_limit} stroke="#3b82f6" strokeDasharray="3 3" label={{ position: 'right', value: 'Min', fill: '#3b82f6', fontSize: 10 }} />
                <Area type="monotone" dataKey="temp" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts & Compliance Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <CloudLightning className="text-teal-400 mb-4" size={32} />
              <h4 className="text-xl font-black leading-tight tracking-tight">Reporte de Estabilidad</h4>
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase">Tiempo en Rango:</span>
                  <span className="font-black text-emerald-400">99.8%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 w-[99.8%]"></div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase">Excursiones Térmicas:</span>
                  <span className="font-black text-rose-400">0 detectadas</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-teal-500/10 rounded-full blur-[60px]"></div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
              <BellRing className="text-amber-500" size={18} />
              Bitácora de Alarmas
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="p-2 bg-white text-slate-400 rounded-xl h-fit shadow-sm"><Clock size={16} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight leading-none">Sensor Hematología 01</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">Puerta abierta detectada (4 min)</p>
                </div>
              </div>
              <div className="flex gap-4 p-3 bg-white opacity-50">
                <div className="p-2 bg-slate-50 text-slate-300 rounded-xl h-fit"><Clock size={16} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-tight leading-none">Sensor Banco Sangre</p>
                  <p className="text-[10px] text-slate-300 mt-1 font-bold">Resuelto: Temperatura estable</p>
                </div>
              </div>
              <button className="w-full py-3 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100">Ver Todas las Alarmas</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ColdChainMonitor;
