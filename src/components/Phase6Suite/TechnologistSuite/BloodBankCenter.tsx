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
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Droplets className="text-red-600 h-8 w-8" />
            Centro de Inmunohematología y Banco de Sangre
          </h1>
          <p className="text-slate-500 mt-1">Gestión de Hemocomponentes, Trazabilidad Vena a Vena y Hemovigilancia</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAnalytics(true)}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Activity size={18} />
            Estadísticas
          </button>
          <button
            onClick={() => setShowProcessing(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <FlaskConical size={18} />
            Procesar Serología
          </button>
          <button
            onClick={() => setShowHemovigilance(true)}
            className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors shadow-md shadow-amber-100"
          >
            <AlertTriangle size={18} />
            Reportar Reacción
          </button>
          <button
            onClick={() => setShowDonorForm(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Users size={18} />
            Registrar Donante
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Inventory Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                  <Package size={24} />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Al Día</span>
              </div>
              <p className="text-sm text-slate-500 font-medium">Stock Total</p>
              <h3 className="text-2xl font-bold text-slate-800">{inventory.length} Unidades</h3>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Clock size={24} />
                </div>
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Próx. Vencer</span>
              </div>
              <p className="text-sm text-slate-500 font-medium">Unidades en Cuarentena</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {inventory.filter(u => u.status === 'QUARANTINE').length} Unidades
              </h3>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Activity size={24} />
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">En Proceso</span>
              </div>
              <p className="text-sm text-slate-500 font-medium">Cruces Pendientes</p>
              <h3 className="text-2xl font-bold text-slate-800">{requests.length} Solicitudes</h3>
            </div>
          </div>

          {/* Charts Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Activity size={20} className="text-slate-400" />
              Distribución de Stock por Grupo Sanguíneo
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getInventoryStats()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Unidades Disponibles (ISBT 128)</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar unidad..."
                  className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="px-6 py-3">N° Unidad</th>
                    <th className="px-6 py-3">Componente</th>
                    <th className="px-6 py-3">Grupo/Rh</th>
                    <th className="px-6 py-3">Vencimiento</th>
                    <th className="px-6 py-3">Serología</th>
                    <th className="px-6 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map((unit) => (
                    <tr
                      key={unit.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedUnit(unit)}
                    >
                      <td className="px-6 py-4 font-mono text-sm font-bold text-slate-700">{unit.unit_number}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          {unit.component_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 font-bold text-red-700">
                          <Droplets size={14} />
                          {unit.blood_type}{unit.rh_factor === 'POS' ? '+' : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(unit.expiry_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                          <ShieldCheck size={14} />
                          {unit.serology_status}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {unit.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {inventory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">
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
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />
              Solicitudes de Transfusión
            </h3>
            <div className="space-y-4 text-sm">
              {requests.map((req) => (
                <div key={req.id} className="p-4 rounded-lg border border-slate-100 bg-slate-50 hover:border-red-200 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      req.urgency === 'EXTREME_URGENCY' ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {req.urgency}
                    </span>
                    <span className="text-slate-400 text-[10px]">{new Date(req.created_at).toLocaleTimeString()}</span>
                  </div>
                  <h4 className="font-bold text-slate-800">{req.patients.first_name} {req.patients.last_name}</h4>
                  <p className="text-xs text-slate-500 mb-3">{req.component_requested} • {req.quantity_units} Unidades</p>
                  <button
                    onClick={() => setActiveRequest(req)}
                    className="w-full py-2 bg-slate-800 text-white rounded-md text-xs font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Activity size={14} />
                    Iniciar Cruce
                  </button>
                </div>
              ))}
              {requests.length === 0 && (
                <div className="text-center py-6 text-slate-400">
                  <CheckCircle2 size={32} className="mx-auto mb-2 opacity-20" />
                  <p>No hay solicitudes pendientes</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl text-white shadow-lg">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="text-green-400" size={20} />
              Protocolo de Seguridad
            </h3>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex gap-2 items-start">
                <span className="h-4 w-4 bg-slate-700 rounded-full flex items-center justify-center text-[10px] shrink-0">1</span>
                Verificación de doble identidad del paciente antes de la extracción.
              </li>
              <li className="flex gap-2 items-start">
                <span className="h-4 w-4 bg-slate-700 rounded-full flex items-center justify-center text-[10px] shrink-0">2</span>
                Mantenimiento de cadena de frío estricta (2°C - 6°C para eritrocitos).
              </li>
              <li className="flex gap-2 items-start">
                <span className="h-4 w-4 bg-slate-700 rounded-full flex items-center justify-center text-[10px] shrink-0">3</span>
                Reporte inmediato de cualquier incidente transfusional (Hemovigilancia).
              </li>
            </ul>
            <button className="w-full mt-6 py-2 border border-slate-600 rounded-md text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
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
    </div>
  );
};

export default BloodBankCenter;
