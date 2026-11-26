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
  FlaskConical,
  X,
  Save,
  QrCode
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

const ExtramuralBloodDriveManager: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRegQuery, setSearchRegQuery] = useState('');

  // Modales
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEventData, setNewEventData] = useState({
    name: '',
    location_name: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    goal_units: 50,
    status: 'ACTIVE' as const
  });

  const [showRegisterDonorModal, setShowRegisterDonorModal] = useState(false);
  const [newRegData, setNewRegData] = useState({
    firstName: '',
    lastName: '',
    documentId: '',
    screeningStatus: 'PASSED' as 'PASSED' | 'DEFERRED' | 'PENDING'
  });

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(() => {
      fetchEvents();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await SupabaseService.extramuralBlood.getEvents();
      if (data && data.length > 0) {
        setEvents(data);
        if (!selectedEvent) handleSelectEvent(data[0]);
      } else {
        // Fallback demo inicial si está vacío
        const fallback = [
          {
            id: 'ev-demo-1',
            name: 'Jornada Móvil Universidad de Panamá',
            location_name: 'Campus Central Octavio Méndez Pereira',
            collected_units: 34,
            goal_units: 50,
            status: 'ACTIVE',
            start_date: '2026-08-20'
          },
          {
            id: 'ev-demo-2',
            name: 'Campaña Corporativa Ciudad del Saber',
            location_name: 'Edificio 104 Clayton',
            collected_units: 50,
            goal_units: 50,
            status: 'COMPLETED',
            start_date: '2026-08-15'
          }
        ];
        setEvents(fallback);
        if (!selectedEvent) setSelectedEvent(fallback[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = async (event: any) => {
    setSelectedEvent(event);
    try {
      const data = await SupabaseService.extramuralBlood.getRegistrations(event.id);
      if (data && data.length > 0) {
        setRegistrations(data);
      } else {
        setRegistrations([
          {
            id: 'reg-demo-1',
            screening_status: 'PASSED',
            check_in_time: new Date().toISOString(),
            patients: { first_name: 'Carlos', last_name: 'Mendoza', document_id: '8-802-1199' }
          },
          {
            id: 'reg-demo-2',
            screening_status: 'PASSED',
            check_in_time: new Date(Date.now() - 15 * 60000).toISOString(),
            patients: { first_name: 'Elena', last_name: 'Gómez', document_id: '4-788-1200' }
          }
        ]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEventData.name || !newEventData.location_name) return;
    try {
      const created = await SupabaseService.extramuralBlood.createEvent?.(newEventData);
      if (created) {
        setEvents(prev => [created, ...prev]);
        setSelectedEvent(created);
      } else {
        const dummy = {
          id: `ev-${Date.now()}`,
          ...newEventData,
          collected_units: 0
        };
        setEvents(prev => [dummy, ...prev]);
        setSelectedEvent(dummy);
      }
      setShowNewEventModal(false);
      setNewEventData({
        name: '',
        location_name: '',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
        goal_units: 50,
        status: 'ACTIVE'
      });
    } catch (err) {
      console.error('Error creating extramural event:', err);
    }
  };

  const handleRegisterDonor = async () => {
    if (!selectedEvent || !newRegData.firstName || !newRegData.documentId) return;
    try {
      const newReg = {
        id: `reg-${Date.now()}`,
        screening_status: newRegData.screeningStatus,
        check_in_time: new Date().toISOString(),
        patients: {
          first_name: newRegData.firstName,
          last_name: newRegData.lastName,
          document_id: newRegData.documentId
        }
      };
      setRegistrations(prev => [newReg, ...prev]);
      setShowRegisterDonorModal(false);
      setNewRegData({
        firstName: '',
        lastName: '',
        documentId: '',
        screeningStatus: 'PASSED'
      });
    } catch (err) {
      console.error('Error registering donor in extramural queue:', err);
    }
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
           <div className="flex items-center justify-between px-2">
             <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Campañas Activas/Próximas</h3>
             <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{events.length}</span>
           </div>

           <div className="relative">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input
               type="text"
               placeholder="Buscar campaña..."
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 shadow-sm"
             />
           </div>

           <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
             {events.filter(e => !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.location_name.toLowerCase().includes(searchQuery.toLowerCase())).map(ev => (
                <div
                  key={ev.id}
                  onClick={() => handleSelectEvent(ev)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 group ${
                    selectedEvent?.id === ev.id ? 'bg-slate-900 border-teal-500 shadow-xl' : 'bg-white border-slate-200 hover:border-teal-400'
                  }`}
                >
                   <div className="flex justify-between items-start">
                      <div className={`p-2 rounded-xl ${selectedEvent?.id === ev.id ? 'bg-teal-500/10 text-teal-400' : 'bg-slate-100 text-slate-400'}`}>
                         <MapPin size={18} />
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${getStatusColor(ev.status)}`}></div>
                   </div>
                   <div>
                      <p className={`font-black text-xs uppercase tracking-tight ${selectedEvent?.id === ev.id ? 'text-white' : 'text-slate-800'}`}>{ev.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{ev.location_name}</p>
                   </div>
                   <div className="flex items-center justify-between pt-1 text-[9px] font-bold">
                      <span className="text-teal-600 font-black">{ev.collected_units} / {ev.goal_units} Unidades</span>
                      <span className="text-slate-400 font-mono">{ev.start_date}</span>
                   </div>
                </div>
             ))}
           </div>

           <button
             onClick={() => setShowNewEventModal(true)}
             className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
           >
              <Plus size={16} />
              <span>Nueva Colecta</span>
           </button>
        </div>

        {/* Mobile Registration Queue */}
        <div className="lg:col-span-3 space-y-6">
           {selectedEvent ? (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full animate-in slide-in-from-right-4">
                 <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                    <div>
                      <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                        <span>Cola de Donantes en Sitio: {selectedEvent.name}</span>
                        <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                          {registrations.length} Registrados
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{selectedEvent.location_name}</p>
                    </div>

                    <div className="flex items-center gap-2">
                       <button
                         onClick={() => setShowRegisterDonorModal(true)}
                         className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                       >
                         <QrCode size={14} className="text-teal-400" />
                         <span>Registrar Donante QR</span>
                       </button>
                    </div>
                 </div>

                 <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto max-h-[460px]">
                    {registrations.map((reg, idx) => (
                       <div key={reg.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-teal-400 transition-all shadow-sm">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-xs text-slate-600 group-hover:text-teal-600 transition-colors border border-slate-100">
                                {idx + 1}
                             </div>
                             <div>
                                <p className="font-black text-slate-800 text-xs uppercase tracking-tight">{reg.patients?.first_name} {reg.patients?.last_name}</p>
                                <p className="text-[10px] text-cyan-600 font-mono font-bold mt-0.5">{reg.patients?.document_id || 'Sin Documento'}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                reg.screening_status === 'PASSED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                reg.screening_status === 'DEFERRED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                             }`}>
                                {reg.screening_status === 'PASSED' ? 'Apto' : reg.screening_status === 'DEFERRED' ? 'Diferido' : 'Pendiente'}
                             </span>
                             <p className="text-[9px] text-slate-400 font-mono mt-1">{new Date(reg.check_in_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                          </div>
                       </div>
                    ))}
                    {registrations.length === 0 && (
                       <div className="col-span-2 py-16 text-center text-slate-400 text-xs italic">
                         No hay donantes registrados en esta jornada todavía. Utilice el botón "Registrar Donante QR" para agregar donantes a la cola.
                       </div>
                    )}
                 </div>

                 <div className="mt-auto p-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/50">
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                       <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Smartphone size={18} /></div>
                       <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">App Donante</p>
                          <p className="text-xs font-black text-slate-800">Cita Online Sincronizada</p>
                       </div>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                       <div className="p-2 bg-teal-50 text-teal-600 rounded-xl"><UserCheck size={18} /></div>
                       <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Screening Móvil</p>
                          <p className="text-xs font-black text-slate-800">Cuestionario MINSA F-DON-01</p>
                       </div>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                       <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><Droplets size={18} /></div>
                       <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Colección & Trazabilidad</p>
                          <p className="text-xs font-black text-slate-800">Etiquetado ISBT-128 In Situ</p>
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

      {/* MODAL: NUEVA COLECTA EXTRAMUROS */}
      {showNewEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <Truck size={20} />
                </div>
                <h3 className="font-black text-slate-900 text-base">Crear Nueva Campaña Extramural</h3>
              </div>
              <button
                onClick={() => setShowNewEventModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">Nombre de la Campaña *</label>
                <input
                  type="text"
                  placeholder="Ej: Jornada Móvil Metro Mall"
                  value={newEventData.name}
                  onChange={e => setNewEventData({ ...newEventData, name: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">Ubicación / Sede *</label>
                <input
                  type="text"
                  placeholder="Ej: Plaza Central, Nivel 1"
                  value={newEventData.location_name}
                  onChange={e => setNewEventData({ ...newEventData, location_name: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">Meta de Unidades *</label>
                  <input
                    type="number"
                    value={newEventData.goal_units}
                    onChange={e => setNewEventData({ ...newEventData, goal_units: Number(e.target.value) || 50 })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-teal-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">Fecha de Inicio *</label>
                  <input
                    type="date"
                    value={newEventData.start_date}
                    onChange={e => setNewEventData({ ...newEventData, start_date: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-teal-500 shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowNewEventModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={!newEventData.name || !newEventData.location_name}
                className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition shadow-lg shadow-teal-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Save size={16} />
                <span>Crear Jornada</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR DONANTE QR EN SITIO */}
      {showRegisterDonorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-900 text-white">
                  <QrCode size={20} className="text-teal-400" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Registrar Donante en Sitio</h3>
                  <p className="text-[11px] text-slate-500">Campaña: {selectedEvent?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRegisterDonorModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">Nombre *</label>
                  <input
                    type="text"
                    placeholder="Ej: Marcos"
                    value={newRegData.firstName}
                    onChange={e => setNewRegData({ ...newRegData, firstName: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">Apellido *</label>
                  <input
                    type="text"
                    placeholder="Ej: De León"
                    value={newRegData.lastName}
                    onChange={e => setNewRegData({ ...newRegData, lastName: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">Cédula de Identidad (CIP) *</label>
                <input
                  type="text"
                  placeholder="Ej: 8-842-1920"
                  value={newRegData.documentId}
                  onChange={e => setNewRegData({ ...newRegData, documentId: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 shadow-sm font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">Resultado de Screening In Situ *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'PASSED', label: 'Apto (Pasa)' },
                    { id: 'PENDING', label: 'En Evaluación' },
                    { id: 'DEFERRED', label: 'Diferido' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setNewRegData({ ...newRegData, screeningStatus: opt.id as any })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        newRegData.screeningStatus === opt.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowRegisterDonorModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterDonor}
                disabled={!newRegData.firstName || !newRegData.documentId}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition shadow-lg disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Save size={16} />
                <span>Agregar a Cola</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtramuralBloodDriveManager;
