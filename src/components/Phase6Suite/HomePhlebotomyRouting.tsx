import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Truck,
  Navigation,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Thermometer,
  QrCode,
  Calendar,
  Plus,
  RotateCw,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  Check,
  Send,
  PenTool,
  Info,
  Map,
  Compass,
  Crosshair,
  Radio,
  Wifi,
  Battery,
  Maximize2,
  Zap,
  LocateFixed,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface PhlebotomyAppointment {
  id: string;
  orderNumber: string;
  patientName: string;
  patientPhone: string;
  address: string;
  zone: string; // e.g. "Costa del Este", "San Francisco", "David Centro"
  phlebotomistName: string;
  scheduledTime: string;
  status: 'PROGRAMADO' | 'EN_CAMINO' | 'MUESTRA_TOMADA' | 'EN_TRANSPORTE' | 'ENTREGADO_LAB';
  coldChainTemp: number; // e.g. 4.2°C
  tubesScanned: string[];
  digitalSignatureCaptured: boolean;
  notes?: string;
  lat: number;
  lng: number;
}

export interface PhlebotomistTracking {
  id: string;
  name: string;
  vehicleType: 'Motorizado (Moto 01)' | 'Motorizado (Moto 02)' | 'Unidad Móvil SUV';
  zone: string;
  currentLat: number;
  currentLng: number;
  speedKmH: number;
  batteryLevel: number;
  coldBoxTemp: number;
  signalQuality: 'Excelente (5G)' | 'Buena (4G)';
  assignedOrders: number;
  completedOrders: number;
  nextPatientName: string;
  nextEtaMinutes: number;
  lastGpsPing: string;
  status: 'EN_RUTA' | 'EN_PACIENTE' | 'REGRESANDO_LAB' | 'DISPONIBLE';
}

const INITIAL_TRACKING: PhlebotomistTracking[] = [
  {
    id: 'phl-driver-01',
    name: 'Carlos Villalaz',
    vehicleType: 'Motorizado (Moto 01)',
    zone: 'Panamá Centro - Costa del Este',
    currentLat: 9.0125,
    currentLng: -79.4682,
    speedKmH: 38,
    batteryLevel: 92,
    coldBoxTemp: 4.2,
    signalQuality: 'Excelente (5G)',
    assignedOrders: 4,
    completedOrders: 2,
    nextPatientName: 'Dra. Gabriela Solís (Calle 50)',
    nextEtaMinutes: 7,
    lastGpsPing: 'Hace 3 seg',
    status: 'EN_RUTA'
  },
  {
    id: 'phl-driver-02',
    name: 'Jorge Guardia',
    vehicleType: 'Motorizado (Moto 02)',
    zone: 'San Francisco - Bella Vista',
    currentLat: 8.9910,
    currentLng: -79.5150,
    speedKmH: 0,
    batteryLevel: 85,
    coldBoxTemp: 3.9,
    signalQuality: 'Excelente (5G)',
    assignedOrders: 3,
    completedOrders: 1,
    nextPatientName: 'Lic. Javier Moreno (Calle 73 Este)',
    nextEtaMinutes: 12,
    lastGpsPing: 'Hace 1 seg',
    status: 'EN_PACIENTE'
  },
  {
    id: 'phl-driver-03',
    name: 'Yarisel Castillo',
    vehicleType: 'Unidad Móvil SUV',
    zone: 'Chiriquí (David Centro)',
    currentLat: 8.4270,
    currentLng: -82.4310,
    speedKmH: 45,
    batteryLevel: 98,
    coldBoxTemp: 4.0,
    signalQuality: 'Buena (4G)',
    assignedOrders: 5,
    completedOrders: 5,
    nextPatientName: 'Sede David (Entrega Final)',
    nextEtaMinutes: 4,
    lastGpsPing: 'Hace 5 seg',
    status: 'REGRESANDO_LAB'
  }
];

const INITIAL_APPOINTMENTS: PhlebotomyAppointment[] = [
  {
    id: 'phl-201',
    orderNumber: 'ORD-2026-9041',
    patientName: 'Sr. Fernando Abrego',
    patientPhone: '+507 6612-9988',
    address: 'P.H. Titanium, Apt 14B, Costa del Este',
    zone: 'Costa del Este',
    phlebotomistName: 'Carlos Villalaz',
    scheduledTime: '07:30 AM',
    status: 'EN_TRANSPORTE',
    coldChainTemp: 4.5,
    tubesScanned: ['EDTA-8812', 'SST-8813'],
    digitalSignatureCaptured: true,
    notes: 'Paciente en ayunas. Dificultad venosa leve - Mariposa 23G utilizada.',
    lat: 9.0180,
    lng: -79.4620
  },
  {
    id: 'phl-202',
    orderNumber: 'ORD-2026-9045',
    patientName: 'Dra. Gabriela Solís',
    patientPhone: '+507 6231-0022',
    address: 'Calle 50, P.H. Tower 50, Apt 8A',
    zone: 'Bella Vista',
    phlebotomistName: 'Carlos Villalaz',
    scheduledTime: '08:15 AM',
    status: 'EN_CAMINO',
    coldChainTemp: 3.8,
    tubesScanned: [],
    digitalSignatureCaptured: false,
    notes: 'Timbrar al citófono 8A. Perfil Lipídico y TSH.',
    lat: 8.9880,
    lng: -79.5210
  },
  {
    id: 'phl-203',
    orderNumber: 'ORD-2026-9050',
    patientName: 'Lic. Javier Moreno',
    patientPhone: '+507 6789-4411',
    address: 'Calle 73 Este, Casa 42, San Francisco',
    zone: 'San Francisco',
    phlebotomistName: 'Jorge Guardia',
    scheduledTime: '09:00 AM',
    status: 'PROGRAMADO',
    coldChainTemp: 4.0,
    tubesScanned: [],
    digitalSignatureCaptured: false,
    notes: 'Hemoglobina Glicada HbA1c y Microalbúmina.',
    lat: 8.9950,
    lng: -79.4980
  },
  {
    id: 'phl-204',
    orderNumber: 'ORD-2026-9012',
    patientName: 'Sra. Carmen Castillo',
    patientPhone: '+507 775-8822',
    address: 'Urbanización Obaldía, Casa 112, David',
    zone: 'Chiriquí (David)',
    phlebotomistName: 'Yarisel Castillo',
    scheduledTime: '07:00 AM',
    status: 'ENTREGADO_LAB',
    coldChainTemp: 4.1,
    tubesScanned: ['CITRATO-9901', 'SST-9902'],
    digitalSignatureCaptured: true,
    notes: 'Muestra entregada en recepción Sede David 08:10 AM.',
    lat: 8.4310,
    lng: -82.4350
  }
];

export const HomePhlebotomyRouting: React.FC = () => {
  const [appointments, setAppointments] = useState<PhlebotomyAppointment[]>(INITIAL_APPOINTMENTS);
  const [trackers, setTrackers] = useState<PhlebotomistTracking[]>(INITIAL_TRACKING);
  const [selectedDriver, setSelectedDriver] = useState<PhlebotomistTracking>(INITIAL_TRACKING[0]);
  const [activeViewMode, setActiveViewMode] = useState<'LIST' | 'MAP_TRACKING'>('MAP_TRACKING');
  const [selectedZone, setSelectedZone] = useState<string>('TODAS');
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);

  // Auto-simulate live GPS movement pings
  useEffect(() => {
    const interval = setInterval(() => {
      setTrackers(prev => prev.map(t => {
        if (t.status === 'EN_RUTA') {
          return {
            ...t,
            speedKmH: Math.floor(30 + Math.random() * 20),
            currentLat: t.currentLat + (Math.random() - 0.5) * 0.001,
            currentLng: t.currentLng + (Math.random() - 0.5) * 0.001,
            nextEtaMinutes: Math.max(1, t.nextEtaMinutes - (Math.random() > 0.7 ? 1 : 0)),
            lastGpsPing: 'Hace 1 seg'
          };
        }
        return t;
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // New Appointment Fields
  const [formPatientName, setFormPatientName] = useState<string>('Sra. Elena de Icaza');
  const [formPhone, setFormPhone] = useState<string>('+507 6400-1122');
  const [formAddress, setFormAddress] = useState<string>('P.H. Grand Tower, Apt 22C, Punta Pacífica');
  const [formZone, setFormZone] = useState<string>('San Francisco');
  const [formPhlebotomist, setFormPhlebotomist] = useState<string>('Carlos Villalaz');
  const [formTime, setFormTime] = useState<string>('09:30 AM');
  const [formNotes, setFormNotes] = useState<string>('Toma de muestra pediátrica en ayunas.');

  const filteredAppointments = appointments.filter(a => {
    if (selectedZone !== 'TODAS' && a.zone !== selectedZone) return false;
    return true;
  });

  const handleUpdateStatus = (id: string, newStatus: PhlebotomyAppointment['status']) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: newStatus,
          digitalSignatureCaptured: newStatus === 'MUESTRA_TOMADA' || newStatus === 'EN_TRANSPORTE' ? true : a.digitalSignatureCaptured
        };
      }
      return a;
    }));
  };

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const newApp: PhlebotomyAppointment = {
      id: `phl-${Date.now()}`,
      orderNumber: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: formPatientName,
      patientPhone: formPhone,
      address: formAddress,
      zone: formZone,
      phlebotomistName: formPhlebotomist,
      scheduledTime: formTime,
      status: 'PROGRAMADO',
      coldChainTemp: 4.0,
      tubesScanned: [],
      digitalSignatureCaptured: false,
      notes: formNotes,
      lat: 8.9980,
      lng: -79.5050
    };

    setAppointments(prev => [newApp, ...prev]);
    setIsNewModalOpen(false);
    alert('¡Cita de Flebotomía Domiciliaria programada y asignada al mapa de ruteo GPS!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-950 border border-teal-500/30 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-teal-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center space-x-2">
              <Truck className="w-4 h-4 text-teal-400 animate-pulse" />
              <span>Flebotomía Domiciliaria & Logística de Transporte • ISO 15189 Cláusula 5.4</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Live Route Tracking & Ruteo GPS
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Rastreo en tiempo real de flebotomistas en campo, geolocalización de pacientes, telemetría IoT de temperatura en neveras térmicas (2°C - 8°C) y gestión de visitas a domicilio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Switcher */}
            <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center space-x-1">
              <button
                onClick={() => setActiveViewMode('MAP_TRACKING')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                  activeViewMode === 'MAP_TRACKING'
                    ? 'bg-teal-500 text-slate-950 shadow-lg font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Map className="w-4 h-4" />
                <span>Rastreo en Vivo (Mapa GPS)</span>
              </button>
              <button
                onClick={() => setActiveViewMode('LIST')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                  activeViewMode === 'LIST'
                    ? 'bg-teal-500 text-slate-950 shadow-lg font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Lista & Citas</span>
              </button>
            </div>

            <button
              onClick={() => setIsNewModalOpen(true)}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs transition shadow-xl flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Programar Muestra</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Flebotomistas Activos</div>
            <div className="text-2xl font-black font-mono text-teal-300">{trackers.length} Unidades GPS</div>
            <div className="text-[10px] text-teal-400 font-bold">Ruta Panamá & Chiriquí</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">En Transporte Activo</div>
            <div className="text-2xl font-black font-mono text-amber-400">
              {appointments.filter(a => a.status === 'EN_TRANSPORTE').length} Cajas Térmicas
            </div>
            <div className="text-[10px] text-amber-400 font-bold">Nevera GPS Conectada</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temperatura Promedio</div>
            <div className="text-2xl font-black font-mono text-emerald-400">4.1 °C</div>
            <div className="text-[10px] text-emerald-400 font-bold">Rango Óptimo 2.0°C - 8.0°C</div>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entregadas en Lab</div>
            <div className="text-2xl font-black font-mono text-indigo-300">
              {appointments.filter(a => a.status === 'ENTREGADO_LAB').length} Muestras
            </div>
            <div className="text-[10px] text-indigo-400 font-bold">Ingresadas al Centrifugado</div>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: LIVE ROUTE TRACKING MAP INTERFACE */}
      {activeViewMode === 'MAP_TRACKING' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Active Drivers Panel */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-teal-400 animate-pulse" />
                  <span>Flebotomistas en Campo ({trackers.length})</span>
                </h3>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  GPS Activo 5G
                </span>
              </div>

              <div className="space-y-3">
                {trackers.map((driver) => {
                  const isSelected = selectedDriver.id === driver.id;
                  return (
                    <div
                      key={driver.id}
                      onClick={() => setSelectedDriver(driver)}
                      className={`p-4 rounded-2xl border transition cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'bg-slate-950 border-teal-500 ring-2 ring-teal-500/20 shadow-lg'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected ? 'bg-teal-500 text-slate-950 font-black' : 'bg-slate-800 text-teal-300'
                          }`}>
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{driver.name}</div>
                            <div className="text-[10px] text-slate-400">{driver.vehicleType}</div>
                          </div>
                        </div>

                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                          driver.status === 'EN_RUTA'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : driver.status === 'EN_PACIENTE'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        }`}>
                          {driver.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Driver Live Telemetry */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-xl text-[11px] font-mono border border-slate-800/80">
                        <div>
                          <span className="text-[9px] text-slate-500 block font-sans font-bold uppercase">Velocidad</span>
                          <span className="text-teal-300 font-bold">{driver.speedKmH} km/h</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block font-sans font-bold uppercase">Nevera IoT</span>
                          <span className="text-emerald-400 font-bold">{driver.coldBoxTemp} °C</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block font-sans font-bold uppercase">ETA Siguiente</span>
                          <span className="text-amber-300 font-bold">{driver.nextEtaMinutes} min</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span className="truncate max-w-[200px]">📍 {driver.nextPatientName}</span>
                        <span className="text-slate-500 font-mono">{driver.lastGpsPing}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Driver Detailed Control Card */}
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3 shadow-xl text-xs">
              <div className="font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
                <span>Controles de Telemetría ({selectedDriver.name})</span>
                <span className="text-teal-400 font-mono text-[10px]">{selectedDriver.signalQuality}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Batería Unidad GPS / Móvil:</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedDriver.batteryLevel}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full" style={{ width: `${selectedDriver.batteryLevel}%` }}></div>
                </div>

                <div className="flex justify-between text-slate-300 pt-1">
                  <span>Coordenadas GPS Actuales:</span>
                  <span className="font-mono text-teal-300">{selectedDriver.currentLat.toFixed(4)}, {selectedDriver.currentLng.toFixed(4)}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => alert(`📞 Conectando llamada encriptada con el motorizado ${selectedDriver.name}...`)}
                  className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-2 rounded-xl text-center text-[11px] cursor-pointer"
                >
                  Llamar Motorizado
                </button>
                <button
                  onClick={() => alert(`🗺️ Recalculando ruta óptima para ${selectedDriver.name} por tráfico en Vía España...`)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 rounded-xl text-center text-[11px] cursor-pointer"
                >
                  Optimizar Ruta
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Simulated Vector Map Interface */}
          <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Compass className="w-5 h-5 text-teal-400 animate-spin" />
                <div>
                  <h3 className="font-bold text-white text-base">Mapa Vectorial GPS de Flebotomía en Vivo</h3>
                  <p className="text-xs text-slate-400">Geolocalización en tiempo real de la ruta activa en Panamá / Chiriquí</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-slate-950 text-slate-300 font-mono px-3 py-1 rounded-xl border border-slate-800 flex items-center space-x-1.5">
                  <LocateFixed className="w-3.5 h-3.5 text-teal-400" />
                  <span>Sector: {selectedDriver.zone}</span>
                </span>
              </div>
            </div>

            {/* Map Canvas Visualizer */}
            <div className="relative w-full h-[480px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex flex-col justify-between p-6">
              
              {/* Simulated Map Background Grid & Street Lines */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

              {/* Decorative Street Vectors */}
              <svg className="absolute inset-0 w-full h-full stroke-slate-800/80 pointer-events-none" strokeWidth="2">
                <line x1="10%" y1="20%" x2="90%" y2="20%" strokeDasharray="4 4" />
                <line x1="20%" y1="10%" x2="20%" y2="90%" />
                <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="#1e293b" strokeWidth="4" />
                <line x1="10%" y1="60%" x2="90%" y2="60%" stroke="#1e293b" strokeWidth="4" />
                <path d="M 100 200 Q 300 100 600 300 T 800 400" fill="none" stroke="#2dd4bf" strokeWidth="3" opacity="0.4" />
              </svg>

              {/* Patient Pins on Map */}
              {appointments.map((app, index) => {
                const posX = 20 + (index * 22) + (index % 2 === 0 ? 5 : -5);
                const posY = 25 + (index * 18);
                return (
                  <div
                    key={app.id}
                    style={{ left: `${posX}%`, top: `${posY}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                  >
                    <div className="relative flex flex-col items-center">
                      <div className="bg-slate-900 border-2 border-amber-400 text-amber-300 font-bold font-mono text-[10px] px-2 py-0.5 rounded-lg shadow-xl mb-1 flex items-center space-x-1 whitespace-nowrap">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        <span>{app.patientName.split(' ')[1] || app.patientName}</span>
                      </div>
                      <div className="w-3 h-3 bg-amber-400 rounded-full animate-ping absolute bottom-0"></div>
                    </div>
                  </div>
                );
              })}

              {/* Active Phlebotomist GPS Moving Marker */}
              <div
                style={{ left: '52%', top: '58%' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-1000"
              >
                <div className="relative flex flex-col items-center">
                  <div className="bg-teal-500 text-slate-950 font-black font-mono text-xs px-3 py-1 rounded-full shadow-2xl flex items-center space-x-1.5 ring-4 ring-teal-500/30 animate-bounce">
                    <Truck className="w-4 h-4" />
                    <span>{selectedDriver.name} ({selectedDriver.speedKmH} km/h)</span>
                  </div>
                  <div className="w-6 h-6 bg-teal-400/30 rounded-full animate-ping absolute -bottom-2"></div>
                </div>
              </div>

              {/* Map Controls Floating Overlay */}
              <div className="relative z-30 flex items-center justify-between bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl">
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-teal-500"></span>
                    <span className="text-slate-300 font-bold">Unidad Motorizada en Ruta</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span className="text-slate-300 font-bold">Paciente Pendiente de Muestra</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                    <span className="text-slate-300 font-bold">Muestra Mantenida (2-8°C)</span>
                  </div>
                </div>

                <button
                  onClick={() => alert('🔍 Centrando mapa en la posición exacta del motorizado...')}
                  className="bg-slate-800 hover:bg-slate-700 text-teal-300 font-mono font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  <Crosshair className="w-3.5 h-3.5 text-teal-400" />
                  <span>Centrar GPS</span>
                </button>
              </div>

              {/* Bottom Route Progress Timeline Bar */}
              <div className="relative z-30 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Ruta en Progreso: {selectedDriver.name}</span>
                  </span>
                  <span className="font-mono text-teal-300 font-bold">Llegada Estimada en {selectedDriver.nextEtaMinutes} min</span>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-400 h-full w-[40%]"></div>
                  <div className="bg-amber-400 h-full w-[35%] animate-pulse"></div>
                  <div className="bg-slate-800 h-full w-[25%]"></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VIEW MODE 2: LIST & APPOINTMENT MANAGEMENT */}
      {activeViewMode === 'LIST' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Route Cards */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-teal-400" />
                <span>Lista de Pacientes & Estado de Muestra en Campo</span>
              </h3>

              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl px-3 py-1.5"
              >
                <option value="TODAS">Todas las Zonas</option>
                <option value="Costa del Este">Costa del Este</option>
                <option value="Bella Vista">Bella Vista</option>
                <option value="San Francisco">San Francisco</option>
                <option value="Chiriquí (David)">Chiriquí (David)</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredAppointments.map((app) => (
                <div
                  key={app.id}
                  className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-lg hover:border-teal-500/40 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-teal-400 font-extrabold text-xs">{app.orderNumber}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-white font-black">{app.patientName}</span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>{app.address}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        🕒 {app.scheduledTime}
                      </span>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${
                        app.status === 'ENTREGADO_LAB'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : app.status === 'EN_TRANSPORTE'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-slate-500 uppercase font-black">Flebotomista:</div>
                      <div className="font-bold text-slate-200">{app.phlebotomistName}</div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[10px] text-slate-500 uppercase font-black">Cadena de Frío:</div>
                      <div className="font-mono font-bold text-emerald-400 flex items-center space-x-1">
                        <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{app.coldChainTemp} °C (Óptimo)</span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[10px] text-slate-500 uppercase font-black">Tubos Escaneados:</div>
                      <div className="font-mono text-teal-300 font-bold">
                        {app.tubesScanned.length > 0 ? app.tubesScanned.join(', ') : 'Pendiente Escaneo'}
                      </div>
                    </div>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-slate-400 italic">
                      {app.notes}
                    </div>

                    <div className="flex items-center space-x-2">
                      {app.status === 'PROGRAMADO' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'EN_CAMINO')}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          Iniciar Ruta GPS
                        </button>
                      )}
                      {app.status === 'EN_CAMINO' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'MUESTRA_TOMADA')}
                          className="bg-teal-500 hover:bg-teal-400 text-slate-950 text-[10px] font-black px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          Registrar Toma & Firma
                        </button>
                      )}
                      {app.status === 'MUESTRA_TOMADA' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'EN_TRANSPORTE')}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          Ingresar a Nevera Térmica
                        </button>
                      )}
                      {app.status === 'EN_TRANSPORTE' && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'ENTREGADO_LAB')}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          Confirmar Entrega Lab
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GPS Live Telemetry Panel */}
          <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <Thermometer className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Telemetría de Neveras Térmicas IoT</span>
            </h3>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Nevera Móvil #01 (Panamá Centro):</span>
                <span className="font-mono font-bold text-emerald-400">4.2 °C</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[45%]"></div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Nevera Móvil #02 (Chiriquí):</span>
                <span className="font-mono font-bold text-emerald-400">3.9 °C</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[40%]"></div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="font-bold text-white mb-1">Requisitos de Cadena de Frío ISO 15189:</div>
              <div className="text-slate-400 flex items-center space-x-1">
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span>Sensor IoT transmitiendo cada 60s.</span>
              </div>
              <div className="text-slate-400 flex items-center space-x-1">
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span>Alarma acústica si T° excede 8.0°C.</span>
              </div>
              <div className="text-slate-400 flex items-center space-x-1">
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span>Verificación biológica de sueros anticoagulados.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Appointment Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-black text-white text-lg flex items-center space-x-2">
                <Truck className="w-5 h-5 text-teal-400" />
                <span>Programar Cita Domiciliaria</span>
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold p-1 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveAppointment} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Nombre Completo del Paciente:</label>
                <input
                  type="text"
                  value={formPatientName}
                  onChange={(e) => setFormPatientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Teléfono Móvil:</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Zona / Sector:</label>
                  <select
                    value={formZone}
                    onChange={(e) => setFormZone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                  >
                    <option value="Costa del Este">Costa del Este</option>
                    <option value="Bella Vista">Bella Vista</option>
                    <option value="San Francisco">San Francisco</option>
                    <option value="Punta Pacífica">Punta Pacífica</option>
                    <option value="Chiriquí (David)">Chiriquí (David)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Dirección Exacta:</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Flebotomista Asignado:</label>
                  <input
                    type="text"
                    value={formPhlebotomist}
                    onChange={(e) => setFormPhlebotomist(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Hora Solicitada:</label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Notas Clínicas:</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white h-20"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black cursor-pointer">Programar Cita</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
