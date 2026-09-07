import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  MapPin,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Home,
  BriefcaseMedical,
  Search,
  Filter,
  Check
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const AppointmentCalendarManager: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate] = useState(new Date());

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const data = await SupabaseService.appointments.getAppointments();
      setAppointments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <CalendarIcon className="text-teal-400" size={32} />
              <h1 className="text-3xl font-black tracking-tight">Gestión de Citas y Colectas a Domicilio</h1>
            </div>
            <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
              Planificación centralizada de tomas de muestra, visitas domiciliarias y estudios especiales con confirmación automática.
            </p>
          </div>
          <div className="flex gap-4">
            <button className="bg-teal-500 hover:bg-teal-600 text-slate-900 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20">
              <Plus size={18} />
              NUEVA CITA
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Sidebar Mini */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Calendario Operativo</h3>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-slate-100 rounded-lg"><ChevronLeft size={16} /></button>
                <button className="p-1 hover:bg-slate-100 rounded-lg"><ChevronRight size={16} /></button>
              </div>
            </div>
            {/* Simple Grid Calendar Mockup */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 mb-4 uppercase tracking-tighter">
              {['D','L','M','M','J','V','S'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({length: 31}).map((_, i) => (
                <div key={i} className={`h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${i + 1 === 21 ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'hover:bg-slate-50 text-slate-600'}`}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6">Resumen del Día</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <span className="text-xs font-bold text-blue-700">Domicilios</span>
                <span className="font-black text-blue-900">8</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-600">En Laboratorio</span>
                <span className="font-black text-slate-800">14</span>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Feed */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl w-fit">
              <button className="px-4 py-1.5 bg-white shadow-sm rounded-lg text-[10px] font-black uppercase text-slate-700 tracking-widest">Hoy</button>
              <button className="px-4 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Mañana</button>
              <button className="px-4 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Semana</button>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input placeholder="Filtrar por paciente..." className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs w-48" />
              </div>
              <button className="p-2 bg-slate-50 text-slate-500 rounded-xl border border-slate-100"><Filter size={16} /></button>
            </div>
          </div>

          <div className="space-y-3">
            {appointments.map(app => (
              <div key={app.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-teal-400 transition-all">
                <div className="flex items-center gap-5">
                  <div className="text-center shrink-0 w-16">
                    <p className="text-lg font-black text-slate-900 leading-none">{new Date(app.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Confirmada</p>
                  </div>
                  <div className="h-10 w-px bg-slate-100 hidden md:block"></div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-black text-slate-800 text-base">{app.patients?.first_name} {app.patients?.last_name} || {app.patient_name_manual}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${getStatusStyle(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5">
                        {app.service_type === 'HOME_COLLECTION' ? <Home size={12} className="text-blue-500" /> : <BriefcaseMedical size={12} className="text-teal-500" />}
                        {app.service_type?.replace('_', ' ')}
                      </span>
                      <span className="flex items-center gap-1.5"><Phone size={12} /> {app.patient_phone || app.patients?.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-red-500 transition-all"><XCircle size={20} /></button>
                  <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">
                    <CheckCircle2 size={16} />
                    ADMITIR LLEGADA
                  </button>
                </div>
              </div>
            ))}

            {appointments.length === 0 && (
              <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                <CalendarIcon className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No hay citas programadas para este periodo.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendarManager;
