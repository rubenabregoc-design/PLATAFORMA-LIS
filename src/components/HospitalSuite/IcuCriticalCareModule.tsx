import React, { useState, useRef, useMemo } from 'react';
import {
  Activity,
  HeartPulse,
  Flame,
  AlertTriangle,
  ShieldCheck,
  Thermometer,
  Zap,
  Clock,
  FileText,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Wind,
  Droplets,
  RefreshCw,
  Search,
  X,
  LayoutGrid,
  BedDouble,
  User,
  Filter
} from 'lucide-react';
import { useHisStore } from '../../store/useHisStore';

export const IcuCriticalCareModule: React.FC = () => {
  const { beds, admissions } = useHisStore();

  // Search & Filter state for 100+ Bed Scale
  const [bedSearchTerm, setBedSearchTerm] = useState<string>('');
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('ALL');
  const [onlyOccupiedFilter, setOnlyOccupiedFilter] = useState<boolean>(false);
  const [isFullDirectoryOpen, setIsFullDirectoryOpen] = useState<boolean>(false);

  // Filtered beds based on search, ward, and occupancy
  const filteredBeds = useMemo(() => {
    return beds.filter(bed => {
      const q = bedSearchTerm.trim().toLowerCase();
      const patientName = (bed.currentPatientName || '').toLowerCase();
      const cedula = (bed.currentPatientCedula || '').toLowerCase();
      const bedNum = (bed.bedNumber || bed.id).toLowerCase();
      const roomNum = (bed.roomNumber || '').toLowerCase();

      const matchesSearch = !q ||
        bedNum.includes(q) ||
        roomNum.includes(q) ||
        patientName.includes(q) ||
        cedula.includes(q);

      const matchesWard = selectedWardFilter === 'ALL' || bed.ward === selectedWardFilter;
      const matchesOccupied = !onlyOccupiedFilter || bed.status === 'OCUPADA';

      return matchesSearch && matchesWard && matchesOccupied;
    });
  }, [beds, bedSearchTerm, selectedWardFilter, onlyOccupiedFilter]);

  const [selectedIcuBedId, setSelectedIcuBedId] = useState<string>(beds[0]?.id || 'bed-urg-01');

  // Currently Selected Bed Object and Patient Admission
  const activeBed = useMemo(() => {
    return beds.find(b => b.id === selectedIcuBedId) || filteredBeds[0] || beds[0];
  }, [beds, selectedIcuBedId, filteredBeds]);

  const activeAdmission = useMemo(() => {
    if (!activeBed) return null;
    return admissions.find(a => a.assignedBedId === activeBed.id || a.bedId === activeBed.id);
  }, [admissions, activeBed]);

  // Carousel Scroll Ref for smooth left/right scroll
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -280, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 280, behavior: 'smooth' });
  };

  // Telemetry Parameter States
  const [mechanicalVentilator, setMechanicalVentilator] = useState({
    mode: 'PRVC / VCV',
    fio2: 45, // %
    peep: 8, // cmH2O
    respRate: 16, // bpm
    tidalVolume: 420 // mL
  });

  const [vasopressors, setVasopressors] = useState([
    { name: 'Norepinefrina', rate: '0.08 mcg/kg/min', status: 'INFUNDIENDO' },
    { name: 'Sedación Propofol 1%', rate: '25 mg/h', status: 'INFUNDIENDO' }
  ]);

  // Ward counts for filter badges
  const uciCount = beds.filter(b => b.ward === 'UCI').length;
  const urgCount = beds.filter(b => b.ward === 'URGENCIAS').length;
  const hospCount = beds.filter(b => b.ward === 'HOSPITALIZACION').length;
  const occupiedCount = beds.filter(b => b.status === 'OCUPADA').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-slate-100 font-sans">

      {/* 1. TITLE HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-rose-600 to-amber-500 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-rose-600/30 shrink-0">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Unidad de Cuidados Intensivos (UCI / ICU)</h2>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                Monitorización Crítica ISO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Monitoreo hemodinámico en tiempo real, ventilación mecánica, perfusión de vasopresores, escala Glasgow/RASS y censo unificado de camas críticas.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsFullDirectoryOpen(true)}
            className="px-4 py-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-white rounded-2xl font-bold text-xs transition cursor-pointer flex items-center space-x-2 shadow-lg"
            title="Abrir mapa censal de 100+ camas"
          >
            <LayoutGrid className="w-4 h-4 text-teal-400" />
            <span>Ver Directorio Censal ({beds.length} Camas)</span>
          </button>

          <div className="flex items-center space-x-2 bg-slate-950 px-4 py-2.5 rounded-2xl border border-rose-500/30 text-xs font-mono font-bold text-rose-300">
            <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>{occupiedCount} Camas Ocupadas ({beds.length} Totales)</span>
          </div>
        </div>
      </div>

      {/* 2. SCALE NAVIGATION & SEARCH BAR FOR 100+ BEDS */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl space-y-3">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Real-time Bed/Patient Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar cama (ej. HOSP-201, UCI-01) o paciente (ej. Samudio)..."
              value={bedSearchTerm}
              onChange={e => setBedSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-rose-500 outline-none font-sans"
            />
            {bedSearchTerm && (
              <button
                onClick={() => setBedSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Chips by Ward */}
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
            {[
              { id: 'ALL', label: 'Todas las Camas', count: beds.length },
              { id: 'UCI', label: 'UCI', count: uciCount },
              { id: 'URGENCIAS', label: 'Urgencias', count: urgCount },
              { id: 'HOSPITALIZACION', label: 'Hospitalización', count: hospCount }
            ].map(w => (
              <button
                key={w.id}
                onClick={() => setSelectedWardFilter(w.id)}
                className={`px-3 py-1.5 rounded-xl font-bold uppercase transition cursor-pointer whitespace-nowrap text-[11px] ${
                  selectedWardFilter === w.id
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{w.label}</span>
                <span className="ml-1 opacity-70">({w.count})</span>
              </button>
            ))}

            <button
              onClick={() => setOnlyOccupiedFilter(!onlyOccupiedFilter)}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap text-[11px] flex items-center space-x-1 ${
                onlyOccupiedFilter
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>Solo Ocupadas</span>
              <span className="font-mono">({occupiedCount})</span>
            </button>
          </div>
        </div>

        {/* 3. SMOOTH SCROLL CAROUSEL OF BEDS WITH NAVIGATION ARROWS */}
        <div className="relative pt-1">
          {/* Scroll Navigation Arrows */}
          <button
            onClick={scrollLeft}
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-950/90 border border-slate-700 text-slate-300 hover:text-white hover:border-rose-500 flex items-center justify-center shadow-xl cursor-pointer"
            title="Desplazar camas a la izquierda"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={scrollRight}
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-950/90 border border-slate-700 text-slate-300 hover:text-white hover:border-rose-500 flex items-center justify-center shadow-xl cursor-pointer"
            title="Desplazar camas a la derecha"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Bed Cards Horizontal Track */}
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-3 overflow-x-auto custom-scrollbar px-6 py-2 select-none scroll-smooth"
          >
            {filteredBeds.length === 0 ? (
              <div className="w-full text-center py-4 text-xs text-slate-500">
                No se encontraron camas con el filtro seleccionado.
              </div>
            ) : (
              filteredBeds.map(bed => {
                const isSelected = activeBed?.id === bed.id;
                const isOccupied = bed.status === 'OCUPADA';

                return (
                  <button
                    key={bed.id}
                    onClick={() => setSelectedIcuBedId(bed.id)}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition text-left cursor-pointer flex items-center space-x-3 shrink-0 min-w-[210px] max-w-[260px] ${
                      isSelected
                        ? 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 border-rose-500 shadow-xl shadow-rose-600/25 ring-1 ring-rose-500/50'
                        : 'bg-slate-950/90 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        isOccupied ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">{bed.bedNumber || bed.id}</span>
                        <span className="text-[9px] font-mono text-slate-500 uppercase">{bed.ward}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                        {bed.currentPatientName || 'Cama Disponible'}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Carousel indicator footer */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 px-2 pt-1 border-t border-slate-800/60 font-mono">
          <span>Mostrando {filteredBeds.length} de {beds.length} camas censadas</span>
          <span className="text-slate-400">Use las flechas ◀ ▶ o el scroll del ratón para explorar</span>
        </div>
      </div>

      {/* 4. ACTIVE PATIENT & BED TELEMETRY BANNER */}
      {activeBed && (
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white font-sans text-sm">{activeBed.bedNumber || activeBed.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  activeBed.status === 'OCUPADA' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {activeBed.status}
                </span>
                <span className="text-slate-500">Pabellón: {activeBed.ward} • Hab. {activeBed.roomNumber || '01'}</span>
              </div>
              <p className="text-slate-300 font-sans mt-0.5">
                Paciente Activo: <strong className="text-white">{activeBed.currentPatientName || 'Sin paciente asignado'}</strong>
                {activeBed.currentPatientCedula && <span className="text-slate-400 ml-2">({activeBed.currentPatientCedula})</span>}
                {activeAdmission && <span className="text-teal-400 ml-2">— Dx: {activeAdmission.admissionDiagnosis}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-slate-400 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Telemetría en Vivo (HL7 Vital Signs)</span>
          </div>
        </div>
      )}

      {/* 5. ICU VITAL PARAMETERS & MECHANICAL VENTILATOR GRID (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

        {/* LEFT 2-COLUMNS: Hemodynamic & Ventilator Workstation */}
        <div className="lg:col-span-2 space-y-6">

          {/* Hemodynamic Telemetry Gauges */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-400 animate-pulse" />
                <span>Telemetría Hemodinámica Continuada</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                124 bpm • Sin arritmia
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-center">
              <div className="bg-slate-950 p-4 rounded-2xl border border-rose-500/30 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Presión Arterial (PAM)</span>
                <strong className="text-2xl font-black text-rose-400 block">115/70 <span className="text-xs text-slate-400 font-normal">(85)</span></strong>
                <span className="text-[9px] text-emerald-400 block">Normotenso</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/30 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Saturación SpO2</span>
                <strong className="text-2xl font-black text-cyan-300 block">97%</strong>
                <span className="text-[9px] text-cyan-400 block">FiO2 45% PRVC</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/30 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Escala Glasgow / RASS</span>
                <strong className="text-2xl font-black text-indigo-300 block">GCS 10t / -2</strong>
                <span className="text-[9px] text-slate-400 block">Sedación Moderada</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Temperatura Central</span>
                <strong className="text-2xl font-black text-amber-300 block">37.2 °C</strong>
                <span className="text-[9px] text-emerald-400 block">Afebril</span>
              </div>
            </div>
          </div>

          {/* Mechanical Ventilation Control Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Wind className="w-5 h-5 text-cyan-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Parámetros de Ventilación Mecánica Asistida
                </h4>
              </div>
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full font-bold">
                Modo: {mechanicalVentilator.mode}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">FiO2 Ajustado</span>
                <strong className="text-lg font-black text-cyan-300">{mechanicalVentilator.fio2}%</strong>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">PEEP</span>
                <strong className="text-lg font-black text-indigo-300">{mechanicalVentilator.peep} cmH2O</strong>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Volumen Corriente (Vt)</span>
                <strong className="text-lg font-black text-emerald-400">{mechanicalVentilator.tidalVolume} mL</strong>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Frecuencia Resp.</span>
                <strong className="text-lg font-black text-amber-300">{mechanicalVentilator.respRate} rpm</strong>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Vasopressors & Infusions */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Droplets className="w-4 h-4 text-indigo-400" />
                <span>Vasopresores & Perfusiones Continuas</span>
              </h4>
            </div>

            <div className="space-y-3">
              {vasopressors.map((vaso, idx) => (
                <div key={idx} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{vaso.name}</span>
                    <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                      {vaso.status}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-cyan-300">{vaso.rate}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 6. MODAL: DIRECTORIO COMPLETO CENSAL DE 100+ CAMAS EN CUADRÍCULA */}
      {isFullDirectoryOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsFullDirectoryOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-800 pb-3 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Directorio Censal Hospitalario ({beds.length} Camas)</h3>
                <p className="text-xs text-slate-400">Haga clic en cualquier cama para cargar inmediatamente su telemetría e informe clínico</p>
              </div>
            </div>

            {/* Quick Search inside Modal */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filtrar por paciente, cédula o número de cama..."
                value={bedSearchTerm}
                onChange={e => setBedSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-teal-500 outline-none"
              />
            </div>

            {/* Full 100-Bed Grid View */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[460px] overflow-y-auto custom-scrollbar p-1">
              {filteredBeds.map(bed => {
                const isSelected = activeBed?.id === bed.id;
                const isOccupied = bed.status === 'OCUPADA';

                return (
                  <button
                    key={bed.id}
                    onClick={() => {
                      setSelectedIcuBedId(bed.id);
                      setIsFullDirectoryOpen(false);
                    }}
                    className={`p-3 rounded-2xl border transition text-left cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-rose-950/60 border-rose-500 shadow-md ring-1 ring-rose-500/50'
                        : isOccupied
                        ? 'bg-slate-950 border-rose-500/30 hover:border-rose-400'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-white">{bed.bedNumber || bed.id}</span>
                      <span className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                    </div>

                    <div className="text-[10px] text-slate-300 font-medium truncate">
                      {bed.currentPatientName || 'Disponible'}
                    </div>

                    <span className="text-[9px] font-mono text-slate-500 uppercase">
                      {bed.ward}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsFullDirectoryOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar Directorio
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default IcuCriticalCareModule;
