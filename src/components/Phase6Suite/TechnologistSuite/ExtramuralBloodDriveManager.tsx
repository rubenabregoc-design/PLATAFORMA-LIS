import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Users,
  Droplets,
  Calendar,
  ChevronRight,
  Plus,
  Search,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  ArrowRight,
  Target,
  UserCheck,
  ShieldCheck,
  Smartphone,
  FlaskConical
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const ExtramuralBloodDriveManager: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await SupabaseService.extramuralBlood.getEvents();
      setEvents(data);
      if (data.length > 0) handleSelectEvent(data[0]);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSelectEvent = async (event: any) => {
    setSelectedEvent(event);
    try {
      const data = await SupabaseService.extramuralBlood.getRegistrations(event.id);
      setRegistrations(data);
    } catch (error) { console.error(error); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500 shadow-emerald-500/20';
      case 'COMPLETED': return 'bg-blue-500';
      case 'CANCELLED': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Mobile Drive Header */}
      <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="text-teal-400" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase italic text-white">Colectas de Sangre Extramurales</h1>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
             Gestión de campañas de donación móvil y jornadas externas. Captación de donantes en sitio y trazabilidad de unidades recolectadas.
          </p>
        </div>
        <div className="flex gap-4 relative z-10">
           <div className="bg-rose-500/10 border border-rose-500/20 px-8 py-6 rounded-3xl backdrop-blur-md text-center">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Unidades Hoy</p>
              <h4 className="text-2xl font-black text-white">{events.filter(e => e.status === 'ACTIVE').reduce((acc, e) => acc + e.collected_units, 0)} <span className="text-xs">U</span></h4>
           </div>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Events Sidebar */}
        <div className="lg:col-span-1 space-y-4">
           <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest px-2">Campañas Activas/Próximas</h3>
           {events.map(ev => (
              <div
                key={ev.id}
                onClick={() => handleSelectEvent(ev)}
                className={`p-5 rounded-[2rem] border transition-all cursor-pointer flex flex-col gap-3 group ${
                  selectedEvent?.id === ev.id ? 'bg-slate-900 border-teal-500 shadow-xl' : 'bg-white border-slate-200 hover:border-teal-400'
                }`}
              >
                 <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-xl ${selectedEvent?.id === ev.id ? 'bg-teal-500/10 text-teal-400' : 'bg-slate-100 text-slate-400'}`}>
                       <MapPin size={20} />
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${getStatusColor(ev.status)}`}></div>
                 </div>
                 <div>
                    <p className={`font-black text-sm uppercase tracking-tight ${selectedEvent?.id === ev.id ? 'text-white' : 'text-slate-800'}`}>{ev.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{ev.location_name}</p>
                 </div>
                 <div className="flex items-center gap-3 pt-2">
                    <span className="text-[9px] font-black text-teal-600 uppercase">{ev.collected_units} / {ev.goal_units} Unidades</span>
                 </div>
              </div>
           ))}
           <button className="w-full py-4 bg-teal-500 text-slate-950 rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-teal-500/10 hover:bg-teal-400 transition-all">
              <Plus size={16} className="inline mr-2" /> Nueva Colecta
           </button>
        </div>

        {/* Mobile Registration Queue */}
        <div className="lg:col-span-3 space-y-6">
           {selectedEvent ? (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full animate-in slide-in-from-right-4">
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-black text-slate-800">Cola de Donantes en Sitio</h3>
                    <div className="flex gap-2">
                       <button className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Registrar Donante QR</button>
                    </div>
                 </div>

                 <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto max-h-[500px]">
                    {registrations.map((reg, idx) => (
                       <div key={reg.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-teal-400 transition-all">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-xs text-slate-400 group-hover:text-teal-500 transition-colors">
                                {idx + 1}
                             </div>
                             <div>
                                <p className="font-black text-slate-800 text-xs uppercase tracking-tight">{reg.patients?.first_name} {reg.patients?.last_name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{reg.patients?.document_id}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                reg.screening_status === 'PASSED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                reg.screening_status === 'DEFERRED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                             }`}>
                                {reg.screening_status}
                             </span>
                             <p className="text-[8px] text-slate-400 font-black mt-1 uppercase">{new Date(reg.check_in_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                          </div>
                       </div>
                    ))}
                    {registrations.length === 0 && (
                       <div className="col-span-2 py-20 text-center opacity-30 italic">No hay donantes registrados en esta jornada todavía.</div>
                    )}
                 </div>

                 <div className="mt-auto p-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/30">
                    <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                       <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Smartphone size={20} /></div>
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">App Donante</p>
                          <p className="text-xs font-black text-slate-800">Cita Online</p>
                       </div>
                    </div>
                    <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                       <div className="p-2 bg-teal-50 text-teal-600 rounded-xl"><UserCheck size={20} /></div>
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Screening</p>
                          <p className="text-xs font-black text-slate-800">Entrevista OK</p>
                       </div>
                    </div>
                    <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                       <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><Droplets size={20} /></div>
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Colección</p>
                          <p className="text-xs font-black text-slate-800">Trazabilidad Total</p>
                       </div>
                    </div>
                 </div>
              </div>
           ) : (
              <div className="bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center">
                 <Truck size={64} className="text-slate-200 mb-6" />
                 <h4 className="font-black text-slate-400 uppercase tracking-widest">Seleccione una Jornada</h4>
              </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default ExtramuralBloodDriveManager;
