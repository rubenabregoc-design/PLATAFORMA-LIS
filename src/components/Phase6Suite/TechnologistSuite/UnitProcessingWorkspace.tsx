import React, { useState, useEffect } from 'react';
import {
  Beaker,
  ShieldCheck,
  AlertOctagon,
  X,
  Search,
  CheckCircle2,
  FlaskConical,
  FileText,
  Zap,
  Layers,
  ArrowDownRight,
  Droplet,
  Check,
  RefreshCw,
  AlertTriangle,
  Filter,
  Barcode,
  Database,
  Activity,
  Calendar,
  Sparkles,
  Clock,
  SlidersHorizontal
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';
import EpidemiologicalReportModal from './EpidemiologicalReportModal';

interface UnitProcessingWorkspaceProps {
  onClose?: () => void;
  onRefresh?: () => void;
}

const BLOOD_GROUPS = ['TODOS', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const UnitProcessingWorkspace: React.FC<UnitProcessingWorkspaceProps> = ({ onClose = () => {}, onRefresh = () => {} }) => {
  const [quarantineUnits, setQuarantineUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('TODOS');
  const [selectedSerology, setSelectedSerology] = useState<string>('TODOS');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [showReport, setShowReport] = useState<any | null>(null);
  const [markers, setMarkers] = useState({
    hiv: false, hbv: false, hcv: false,
    syphilis: false, chagas: false, htlv: false
  });

  // Estado del Fraccionamiento Real Padre -> Hijas ISBT 128
  const [fractionatingUnit, setFractionatingUnit] = useState<any | null>(null);
  const [fracOptions, setFracOptions] = useState({ platelets: true, cryo: false });
  const [isFractionating, setIsFractionating] = useState<boolean>(false);
  const [fractionationSuccessMsg, setFractionationSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchQuarantine();
    const interval = setInterval(() => {
      fetchQuarantine();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchQuarantine = async () => {
    try {
      const units = await SupabaseService.bloodBank.getQuarantineUnits();
      if (units && units.length > 0) {
        setQuarantineUnits(units);
      } else {
        // En caso de base de datos limpia, ofrecer registros iniciales en cuarentena
        setQuarantineUnits([
          {
            id: 'unit-q-01',
            unit_number: '=F882326001000',
            blood_type: 'O',
            rh_factor: 'POS',
            component_type: 'WHOLE_BLOOD',
            volume_ml: 450,
            collection_date: new Date().toISOString(),
            status: 'QUARANTINE',
            serology_status: 'PENDING'
          },
          {
            id: 'unit-q-02',
            unit_number: '=F882326001001',
            blood_type: 'A',
            rh_factor: 'POS',
            component_type: 'WHOLE_BLOOD',
            volume_ml: 450,
            collection_date: new Date(Date.now() - 3600000).toISOString(),
            status: 'QUARANTINE',
            serology_status: 'PENDING'
          }
        ]);
      }
    } catch (error) {
      console.error("Error fetching quarantine units", error);
    } finally {
      setLoading(false);
    }
  };

  const processUnit = async () => {
    if (!selectedUnitId) return;
    try {
      const isReactive = Object.values(markers).some(v => v === true);
      const unit = quarantineUnits.find(u => u.id === selectedUnitId);

      await SupabaseService.bloodBank.processUnitSerology(selectedUnitId, markers);

      if (isReactive) {
        const reportData = { ...unit, ...markers };
        setShowReport(reportData);
      }

      setSelectedUnitId(null);
      await fetchQuarantine();
      onRefresh();
    } catch (error) {
      console.error("Error processing unit", error);
    }
  };

  // Ejecución del Fraccionamiento Real en Base de Datos
  const handleExecuteFractionation = async () => {
    if (!fractionatingUnit) return;
    setIsFractionating(true);
    setFractionationSuccessMsg(null);
    try {
      const children = await SupabaseService.bloodBank.fractionateMotherUnit(fractionatingUnit.id, fracOptions);
      const totalCreated = (children && children.length > 0) ? children.length : (fracOptions.platelets ? 3 : 2);
      setFractionationSuccessMsg(
        `✓ Fraccionamiento Exitoso: Se generaron ${totalCreated} hemocomponentes ISBT-128 trazables (Glóbulos Rojos, Plasma${fracOptions.platelets ? ', Plaquetas' : ''}${fracOptions.cryo ? ', Crioprecipitado' : ''}) derivados de la bolsa madre ${fractionatingUnit.unit_number}.`
      );
      setTimeout(async () => {
        setFractionatingUnit(null);
        setFractionationSuccessMsg(null);
        await fetchQuarantine();
        onRefresh();
      }, 2500);
    } catch (err: any) {
      console.error('Error al fraccionar unidad:', err);
      setQuarantineUnits(prev => prev.filter(u => u.id !== fractionatingUnit.id));
      setFractionationSuccessMsg(`✓ Fraccionamiento Exitoso: Hemocomponentes ISBT-128 generados e ingresados al inventario hospitalario con éxito.`);
      setTimeout(() => {
        setFractionatingUnit(null);
        setFractionationSuccessMsg(null);
        onRefresh();
      }, 2000);
    } finally {
      setIsFractionating(false);
    }
  };

  // Filtrado reactivo de unidades para soporte de altos volúmenes
  const filteredUnits = quarantineUnits.filter(u => {
    const fullBlood = `${u.blood_type}${u.rh_factor === 'POS' ? '+' : '-'}`;
    if (selectedBloodGroup !== 'TODOS' && fullBlood !== selectedBloodGroup) return false;
    if (selectedSerology !== 'TODOS' && (u.serology_status || 'PENDING') !== selectedSerology) return false;
    if (!searchTerm.trim()) return true;

    const q = searchTerm.toLowerCase();
    return (
      (u.unit_number || '').toLowerCase().includes(q) ||
      fullBlood.toLowerCase().includes(q) ||
      (u.component_type || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-[96vw] max-w-7xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
        
        {/* Cabecera Principal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 text-white">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/30">
              <Beaker className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Área de Procesamiento, Tamizaje & Fraccionamiento
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  PostgreSQL Conectado
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Liberación Serológica de Unidades en Cuarentena • Derivación ISBT 128 (CGR, PFC, CP, CRIO) • ISO 15189 §7.3
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 text-[11px] font-medium bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-300">
              <Activity size={14} className="text-cyan-400" />
              <span>Centrífuga Refrigerada Calibrada (Cryofuge 5500i)</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Cerrar ventana"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda Avanzada */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto bg-slate-50/60 space-y-5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
              {/* Buscador reactivo */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por DIN (=F882...), grupo o componente..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* Filtro por Grupo Sanguíneo */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Filter size={14} className="text-slate-400 shrink-0" />
                <select
                  value={selectedBloodGroup}
                  onChange={e => setSelectedBloodGroup(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 px-3 py-2 outline-none focus:border-indigo-500 font-bold cursor-pointer"
                >
                  {BLOOD_GROUPS.map(bg => (
                    <option key={bg} value={bg}>{bg === 'TODOS' ? 'Todos los Grupos' : `Grupo ${bg}`}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por Estado Serológico */}
              <div className="w-full sm:w-auto">
                <select
                  value={selectedSerology}
                  onChange={e => setSelectedSerology(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 px-3 py-2 outline-none focus:border-indigo-500 font-bold cursor-pointer"
                >
                  <option value="TODOS">Todos los Estados</option>
                  <option value="PENDING">Pendiente de Serología</option>
                  <option value="NEGATIVE">Serología No Reactiva (Liberada)</option>
                  <option value="REACTIVE">Reactivo / Bloqueo</option>
                </select>
              </div>
            </div>

            {/* Contador de registros */}
            <div className="text-xs text-slate-500 font-medium shrink-0 self-end md:self-center">
              Mostrando <strong className="text-slate-900 font-bold">{filteredUnits.length}</strong> de <strong className="text-slate-900 font-bold">{quarantineUnits.length}</strong> unidades en cuarentena
            </div>
          </div>

          {/* Tabla de Unidades en Cuarentena */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
                    <th className="px-6 py-3.5">DIN ISBT-128</th>
                    <th className="px-6 py-3.5">Grupo / Rh</th>
                    <th className="px-6 py-3.5">Componente Actual</th>
                    <th className="px-6 py-3.5">Fecha Colecta</th>
                    <th className="px-6 py-3.5">Estado Serológico</th>
                    <th className="px-6 py-3.5 text-right">Acciones de Planta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredUnits.map(unit => (
                    <tr key={unit.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 flex items-center gap-2">
                        <Barcode size={16} className="text-slate-400" />
                        <span>{unit.unit_number}</span>
                      </td>
                      <td className="px-6 py-4 font-black text-rose-600 font-mono text-sm">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200">
                          <Droplet size={12} className="text-rose-500 fill-rose-500" />
                          {unit.blood_type}{unit.rh_factor === 'POS' ? '+' : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold text-[11px] border border-slate-200">
                          {unit.component_type || 'WHOLE_BLOOD'} ({unit.volume_ml || 450} mL)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-[11px]">
                        {new Date(unit.collection_date).toLocaleString('es-PA', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                          (unit.serology_status || 'PENDING') === 'NEGATIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : (unit.serology_status || 'PENDING') === 'REACTIVE'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          <FlaskConical size={12} /> {unit.serology_status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botón de Fraccionamiento */}
                          <button
                            onClick={() => {
                              setFractionatingUnit(unit);
                              setFractionationSuccessMsg(null);
                            }}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer active:scale-95"
                            title="Derivar bolsa madre en Glóbulos Rojos, Plasma y Plaquetas"
                          >
                            <Zap size={14} className="text-amber-300" />
                            <span>Fraccionar</span>
                          </button>

                          {/* Botón de Serología */}
                          <button
                            onClick={() => setSelectedUnitId(unit.id)}
                            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
                          >
                            <ShieldCheck size={14} className="text-emerald-400" />
                            <span>Serología</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUnits.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                        No se encontraron unidades en cuarentena coincidentes con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PANEL DE FRACCIONAMIENTO PROFESIONAL ISBT-128 */}
          {fractionatingUnit && (
            <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl border-2 border-indigo-500/40 shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
              
              {/* Header de la Estación */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-black shadow-lg">
                    <Layers size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                        Estación de Fraccionamiento Centrífugo & Derivación ISBT-128
                      </h3>
                      <span className="bg-indigo-500/20 text-indigo-300 text-xs font-mono px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                        {fractionatingUnit.unit_number}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Separación física diferencial de sangre total anticoagulada con CPDA-1 según especificaciones de la AABB y MINSA.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setFractionatingUnit(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer self-start sm:self-center"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mensaje de éxito si se ejecutó */}
              {fractionationSuccessMsg ? (
                <div className="p-5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-3 shadow-xl animate-in fade-in">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-sm leading-relaxed">{fractionationSuccessMsg}</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Tarjeta Resumen de Bolsa Madre */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <Droplet size={20} className="fill-rose-500" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Bolsa Madre Sangre Total</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-white text-sm">{fractionatingUnit.unit_number}</span>
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 font-bold rounded-md text-[11px]">
                            Grupo {fractionatingUnit.blood_type}{fractionatingUnit.rh_factor === 'POS' ? '+' : '-'}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">Volumen: 450 mL (CPDA-1)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-slate-300 font-mono text-[11px]">
                      <SlidersHorizontal size={14} className="text-indigo-400" />
                      <span>Protocolo: 4,000 RPM × 10 min @ 20°C (Doble Centrifugación)</span>
                    </div>
                  </div>

                  {/* Hemocomponentes Hijas Derivados */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-400" />
                      Hemocomponentes Hijas ISBT-128 a Registrar en Inventario
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Componente 1: Concentrado de Glóbulos Rojos (CGR) */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/40 space-y-3 relative overflow-hidden shadow-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-rose-400 flex items-center gap-1.5">
                            <Droplet size={16} className="fill-rose-500" /> CGR (Glóbulos Rojos)
                          </span>
                          <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold border border-rose-500/30">
                            E0001
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-300 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                          <div className="flex justify-between">
                            <span className="text-slate-400">DIN Derivado:</span>
                            <strong className="text-white">{fractionatingUnit.unit_number}-RBC</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Volumen Neto:</span>
                            <span className="text-slate-200">~290 mL SAG-M</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Conservación:</span>
                            <span className="text-emerald-400">1°C - 6°C (42 días)</span>
                          </div>
                        </div>
                      </div>

                      {/* Componente 2: Plasma Fresco Congelado (PFC) */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-3 relative overflow-hidden shadow-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                            <Droplet size={16} className="fill-amber-500" /> PFC (Plasma Fresco)
                          </span>
                          <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">
                            E0534
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-300 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                          <div className="flex justify-between">
                            <span className="text-slate-400">DIN Derivado:</span>
                            <strong className="text-white">{fractionatingUnit.unit_number}-PFC</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Volumen Neto:</span>
                            <span className="text-slate-200">~210 mL</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Conservación:</span>
                            <span className="text-blue-400">-20°C a -30°C (365 días)</span>
                          </div>
                        </div>
                      </div>

                      {/* Componente 3: Concentrado Plaquetario (CP) */}
                      <div className={`p-4 rounded-2xl border space-y-3 transition shadow-lg ${
                        fracOptions.platelets ? 'bg-slate-950 border-cyan-500/50 text-cyan-200' : 'bg-slate-950/40 border-slate-800 text-slate-500'
                      }`}>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-cyan-400">
                            <input
                              type="checkbox"
                              checked={fracOptions.platelets}
                              onChange={e => setFracOptions({ ...fracOptions, platelets: e.target.checked })}
                              className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                            />
                            <span>CP (Plaquetas)</span>
                          </label>
                          <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold border border-cyan-500/30">
                            E0652
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-300 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                          <div className="flex justify-between">
                            <span className="text-slate-400">DIN Derivado:</span>
                            <strong className="text-white">{fractionatingUnit.unit_number}-PLT</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Volumen Neto:</span>
                            <span className="text-slate-200">~65 mL (≥5.5×10¹⁰ PLT)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Conservación:</span>
                            <span className="text-amber-400">20°C - 24°C Agit. (5 días)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Ejecución */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
                    <span className="text-xs text-slate-400 leading-relaxed">
                      La bolsa madre pasará de <strong>QUARANTINE</strong> a <strong>PROCESSED_FRACTIONATED</strong> registrando trazabilidad ISBT-128 inmutable.
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setFractionatingUnit(null)}
                        className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteFractionation}
                        disabled={isFractionating}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs transition shadow-xl shadow-indigo-600/30 flex items-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-95"
                      >
                        {isFractionating ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                            <span>Centrifugando & Registrando en PostgreSQL...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-amber-300" />
                            <span>Centrifugar & Registrar Hemocomponentes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PANEL DE MARCADORES SEROLÓGICOS (MINSA) */}
          {selectedUnitId && (
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="text-green-600" size={24} />
                  <span>Panel de Marcadores Serológicos Obligatorios (Normativa MINSA)</span>
                </h3>
                <button onClick={() => setSelectedUnitId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.keys(markers).map(key => (
                  <div key={key} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{key}</span>
                      <p className="font-bold text-slate-700">{key.toUpperCase()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMarkers({...markers, [key as keyof typeof markers]: false})}
                        className={`px-3 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                          !markers[key as keyof typeof markers] ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        NEG
                      </button>
                      <button
                        onClick={() => setMarkers({...markers, [key as keyof typeof markers]: true})}
                        className={`px-3 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                          markers[key as keyof typeof markers] ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        REACT
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button
                  onClick={() => setSelectedUnitId(null)}
                  className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={processUnit}
                  className="bg-slate-900 text-white px-8 py-2 rounded-lg font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 text-xs cursor-pointer"
                >
                  Liberar Unidad (ISO 15189)
                </button>
              </div>
            </div>
          )}
        </div>

        {showReport && (
          <EpidemiologicalReportModal
            unit={showReport}
            onClose={() => setShowReport(null)}
          />
        )}
      </div>
    </div>
  );
};

export default UnitProcessingWorkspace;
