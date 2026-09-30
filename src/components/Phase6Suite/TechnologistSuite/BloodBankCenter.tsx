import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Users,
  Package,
  Activity,
  AlertTriangle,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  History,
  ShieldCheck,
  FlaskConical
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SupabaseService } from '../../../services/SupabaseService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import ISBTLabelPrinter from './ISBTLabelPrinter';
import CrossmatchWorkflow from './CrossmatchWorkflow';
import HemovigilanceReportModal from './HemovigilanceReportModal';
import DonorScreeningForm from './DonorScreeningForm';
import HemovigilanceAnalytics from './HemovigilanceAnalytics';
import UnitProcessingWorkspace from './UnitProcessingWorkspace';
import { TransfusionEvolutionManager } from './TransfusionEvolutionManager';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COLORS = ['#ef4444', '#f87171', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#fca5a5', '#fee2e2'];

const BloodBankCenter: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [showHemovigilance, setShowHemovigilance] = useState(false);
  const [showDonorForm, setShowDonorForm] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [showTransfusionEvolution, setShowTransfusionEvolution] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invData, reqData] = await Promise.all([
        SupabaseService.bloodBank.getAvailableUnits(),
        SupabaseService.bloodBank.getPendingRequests()
      ]);
      setInventory(invData);
      setRequests(reqData);
    } catch (error) {
      console.error("Error fetching blood bank data", error);
    } finally {
      setLoading(false);
    }
  };

  const getInventoryStats = () => {
    const stats = BLOOD_TYPES.map(type => ({
      name: type,
      value: inventory.filter(u => `${u.blood_type}${u.rh_factor === 'POS' ? '+' : '-'}` === type).length
    }));
    return stats;
  };

  return (
    <div className="p-6 bg-[#020617] min-h-screen text-slate-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Droplets className="text-rose-500 h-8 w-8" />
            Centro de Inmunohematología y Banco de Sangre
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Gestión de Hemocomponentes, Trazabilidad Vena a Vena y Hemovigilancia</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setShowTransfusionEvolution(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 text-white px-4 py-2 rounded-xl hover:from-rose-500 hover:to-red-500 transition-all shadow-lg shadow-rose-600/30 font-black text-xs cursor-pointer"
          >
            <Droplets size={16} />
            <span>Gestión / Evolución Transfusional (9 Etapas)</span>
          </button>
          <button
            onClick={() => setShowAnalytics(true)}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-800 hover:text-white transition-colors shadow-sm text-xs font-bold cursor-pointer"
          >
            <Activity size={16} className="text-cyan-400" />
            Estadísticas
          </button>
          <button
            onClick={() => setShowProcessing(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-3.5 py-2 rounded-xl hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/30 text-xs font-bold cursor-pointer"
          >
            <FlaskConical size={16} />
            Procesar Serología
          </button>
          <button
            onClick={() => setShowHemovigilance(true)}
            className="flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3.5 py-2 rounded-xl hover:bg-amber-500/30 transition-colors shadow-sm text-xs font-bold cursor-pointer"
          >
            <AlertTriangle size={16} className="text-amber-400" />
            Reportar Reacción
          </button>
          <button
            onClick={() => setShowDonorForm(true)}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-sm text-xs font-bold cursor-pointer"
          >
            <Users size={16} className="text-rose-400" />
            Registrar Donante
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Inventory Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-rose-500/15 text-rose-400 rounded-xl border border-rose-500/30">
                  <Package size={22} />
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">Al Día</span>
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Stock Total</p>
              <h3 className="text-2xl font-black text-white mt-1">{inventory.length} Unidades</h3>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/30">
                  <Clock size={22} />
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">Próx. Vencer</span>
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Unidades en Cuarentena</p>
              <h3 className="text-2xl font-black text-white mt-1">
                {inventory.filter(u => u.status === 'QUARANTINE').length} Unidades
              </h3>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-cyan-500/15 text-cyan-400 rounded-xl border border-cyan-500/30">
                  <Activity size={22} />
                </div>
                <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">En Proceso</span>
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cruces Pendientes</p>
              <h3 className="text-2xl font-black text-white mt-1">{requests.length} Solicitudes</h3>
            </div>
          </div>

          {/* Charts Section */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <Activity size={18} className="text-cyan-400" />
              Distribución de Stock por Grupo Sanguíneo
            </h3>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getInventoryStats()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip
                    contentStyle={{backgroundColor: '#020617', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px'}}
                  />
                  <Bar dataKey="value" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Unidades Disponibles (ISBT 128)</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Buscar unidad..."
                  className="pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                    <th className="px-6 py-3">N° Unidad</th>
                    <th className="px-6 py-3">Componente</th>
                    <th className="px-6 py-3">Grupo/Rh</th>
                    <th className="px-6 py-3">Vencimiento</th>
                    <th className="px-6 py-3">Serología</th>
                    <th className="px-6 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {inventory.map((unit) => (
                    <tr
                      key={unit.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedUnit(unit)}
                    >
                      <td className="px-6 py-4 font-mono font-bold text-slate-200">{unit.unit_number}</td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-300 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                          {unit.component_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 font-bold text-rose-400 font-mono text-sm">
                          <Droplets size={14} />
                          {unit.blood_type}{unit.rh_factor === 'POS' ? '+' : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(unit.expiry_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                          <ShieldCheck size={14} />
                          {unit.serology_status}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {unit.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {inventory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-500 italic">
                        No hay unidades disponibles en el inventario actual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar / Pending Requests */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm">
              <AlertTriangle className="text-amber-400" size={18} />
              Solicitudes de Transfusión
            </h3>
            <div className="space-y-3 text-xs">
              {requests.map((req) => (
                <div key={req.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-rose-500/40 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      req.urgency === 'EXTREME_URGENCY' ? 'bg-rose-600 text-white shadow-sm' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {req.urgency}
                    </span>
                    <span className="text-slate-500 text-[10px] font-mono">{new Date(req.created_at).toLocaleTimeString()}</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{req.patients.first_name} {req.patients.last_name}</h4>
                  <p className="text-slate-400 mt-0.5 mb-3">{req.component_requested} • {req.quantity_units} Unidades</p>
                  <button
                    onClick={() => setActiveRequest(req)}
                    className="w-full py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Activity size={14} />
                    Iniciar Cruce
                  </button>
                </div>
              ))}
              {requests.length === 0 && (
                <div className="text-center py-6 text-slate-500">
                  <CheckCircle2 size={32} className="mx-auto mb-2 opacity-30 text-emerald-400" />
                  <p>No hay solicitudes pendientes</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-xl">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-sm text-white">
              <ShieldCheck className="text-emerald-400" size={18} />
              Protocolo de Seguridad
            </h3>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex gap-2.5 items-start">
                <span className="h-5 w-5 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold text-rose-400 shrink-0">1</span>
                <span>Verificación de doble identidad del paciente antes de la extracción.</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <span className="h-5 w-5 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold text-rose-400 shrink-0">2</span>
                <span>Mantenimiento de cadena de frío estricta (2°C - 6°C para eritrocitos).</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <span className="h-5 w-5 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold text-rose-400 shrink-0">3</span>
                <span>Reporte inmediato de cualquier incidente transfusional (Hemovigilancia).</span>
              </li>
            </ul>
            <button className="w-full mt-6 py-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <History size={14} />
              Ver Registro de Auditoría
            </button>
          </div>
        </div>

      </div>

      {selectedUnit && (
        <ISBTLabelPrinter
          unit={selectedUnit}
          onClose={() => setSelectedUnit(null)}
        />
      )}

      {activeRequest && (
        <CrossmatchWorkflow
          request={activeRequest}
          availableUnits={inventory}
          onClose={() => setActiveRequest(null)}
          onComplete={() => {
            setActiveRequest(null);
            fetchData();
          }}
        />
      )}

      {showHemovigilance && (
        <HemovigilanceReportModal
          onClose={() => setShowHemovigilance(false)}
          onComplete={() => {
            setShowHemovigilance(false);
            fetchData();
          }}
        />
      )}

      {showDonorForm && (
        <DonorScreeningForm
          onClose={() => setShowDonorForm(false)}
          onComplete={() => {
            setShowDonorForm(false);
            fetchData();
          }}
        />
      )}

      {showAnalytics && (
        <HemovigilanceAnalytics
          onClose={() => setShowAnalytics(null as any)}
        />
      )}

      {showProcessing && (
        <UnitProcessingWorkspace
          onClose={() => setShowProcessing(false)}
          onRefresh={fetchData}
        />
      )}

      {showTransfusionEvolution && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 rounded-3xl w-full max-w-7xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 border border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowTransfusionEvolution(false)}
              className="absolute top-6 right-6 z-10 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 cursor-pointer font-bold text-xs"
            >
              ✕ Cerrar Flujo
            </button>
            <TransfusionEvolutionManager />
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodBankCenter;
