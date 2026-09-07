import React, { useState, useEffect } from 'react';
import {
  Zap,
  RotateCw,
  Settings,
  Plus,
  Calendar,
  History,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Activity,
  User,
  FlaskConical,
  Cpu
} from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';
import CalibrationCertificatePDF from './CalibrationCertificatePDF';

const CalibrationManager: React.FC = () => {
  const [analyzers, setAnalyzers] = useState<any[]>([]);
  const [calibrations, setCalibrations] = useState<any[]>([]);
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCalibration, setSelectedCalibration] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [anzData, calData] = await Promise.all([
        SupabaseService.analyzers.getAll(),
        SupabaseService.maintenance.getCalibrations()
      ]);
      setAnalyzers(anzData);
      setCalibrations(calData);
      if (anzData.length > 0) setSelectedAnalyzerId(anzData[0].id);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const getAnalyzerCalibrations = (id: string) => calibrations.filter(c => c.analyzer_id === id);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Zap className="text-yellow-400" size={32} />
              <h1 className="text-3xl font-black tracking-tight">Gestión de Calibraciones Analíticas</h1>
            </div>
            <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
              Control de curvas de calibración, factores K y trazabilidad de lotes de calibradores (Metrología Química ISO 17025/15189).
            </p>
          </div>
          <button className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-xl shadow-yellow-500/20">
            <Plus size={18} />
            REGISTRAR CALIBRACIÓN
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Instrument List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest px-2">Instrumentos</h3>
          {analyzers.map(anz => (
            <button
              key={anz.id}
              onClick={() => setSelectedAnalyzerId(anz.id)}
              className={`w-full p-4 rounded-2xl border transition-all text-left flex flex-col gap-2 ${
                selectedAnalyzerId === anz.id
                  ? 'bg-slate-900 border-yellow-500 shadow-lg shadow-yellow-500/10'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded-lg ${selectedAnalyzerId === anz.id ? 'bg-yellow-500 text-slate-900' : 'bg-slate-100 text-slate-500'}`}>
                  <Activity size={16} />
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                  getAnalyzerCalibrations(anz.id).some(c => new Date(c.expiration_date) < new Date()) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {getAnalyzerCalibrations(anz.id).some(c => new Date(c.expiration_date) < new Date()) ? 'RE-CAL PENDIENTE' : 'CAL OK'}
                </span>
              </div>
              <p className={`font-black text-sm ${selectedAnalyzerId === anz.id ? 'text-white' : 'text-slate-800'}`}>{anz.name}</p>
            </button>
          ))}
        </div>

        {/* Main: Calibrations History */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                 <History className="text-blue-500" size={20} />
                 Historial de Curvas y Factores
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">Analito / Parámetro</th>
                    <th className="px-6 py-4">Lote Calibrador</th>
                    <th className="px-6 py-4">Factor K / Offset</th>
                    <th className="px-6 py-4">Fecha Cal</th>
                    <th className="px-6 py-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {getAnalyzerCalibrations(selectedAnalyzerId || '').map(cal => (
                    <tr
                      key={cal.id}
                      onClick={() => setSelectedCalibration(cal)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><FlaskConical size={16} /></div>
                          <span className="font-black text-slate-800 text-xs uppercase">{cal.analyte_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-[10px] font-bold text-slate-500">{cal.calibrator_lot}</td>
                      <td className="px-6 py-4">
                        <div className="text-[10px] font-black text-slate-700">K: {cal.k_factor || '1.000'}</div>
                        <div className="text-[8px] text-slate-400 font-bold">OFF: {cal.offset_value || '0.00'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-slate-600">{new Date(cal.calibration_date).toLocaleDateString()}</div>
                        <p className="text-[9px] text-slate-400">Vence: {new Date(cal.expiration_date).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                          cal.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {cal.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {getAnalyzerCalibrations(selectedAnalyzerId || '').length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">No hay calibraciones registradas para este instrumento.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                <ShieldCheck className="text-teal-400 mb-4" size={32} />
                <h4 className="font-black text-lg">Metrología Legal</h4>
                <p className="text-slate-400 text-xs mt-3 leading-relaxed">
                   Todos los calibradores utilizados deben contar con trazabilidad NIST/SI certificada por el fabricante. Este módulo bloquea automáticamente los resultados si la calibración ha expirado.
                </p>
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                   <AlertTriangle className="text-amber-500" size={24} />
                   <h4 className="font-black text-slate-800 text-sm uppercase">Alertas de Metrología</h4>
                </div>
                <div className="space-y-4">
                   <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-[9px] font-black text-red-800 uppercase tracking-widest">Expiración Crítica</p>
                      <p className="text-[10px] text-red-700 mt-1">La curva de Creatinina (Cobas c501) vence en 48 horas.</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {selectedCalibration && (
        <CalibrationCertificatePDF
          calibration={selectedCalibration}
          onClose={() => setSelectedCalibration(null)}
        />
      )}
    </div>
  );
};

export default CalibrationManager;
