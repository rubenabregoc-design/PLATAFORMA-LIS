import React, { useState, useEffect } from 'react';
import { Beaker, ShieldCheck, AlertOctagon, X, Search, CheckCircle2, FlaskConical, FileText } from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';
import EpidemiologicalReportModal from './EpidemiologicalReportModal';

interface UnitProcessingWorkspaceProps {
  onClose: () => void;
  onRefresh: () => void;
}

const UnitProcessingWorkspace: React.FC<UnitProcessingWorkspaceProps> = ({ onClose, onRefresh }) => {
  const [quarantineUnits, setQuarantineUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [showReport, setShowReport] = useState<any | null>(null);
  const [markers, setMarkers] = useState({
    hiv: false, hbv: false, hcv: false,
    syphilis: false, chagas: false, htlv: false
  });

  useEffect(() => {
    fetchQuarantine();
  }, []);

  const fetchQuarantine = async () => {
    try {
      const units = await SupabaseService.bloodBank.getAvailableUnits();
      setQuarantineUnits(units.filter(u => u.status === 'QUARANTINE'));
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
        // Prepare report data
        const reportData = { ...unit, ...markers };
        setShowReport(reportData);
      }

      setSelectedUnitId(null);
      fetchQuarantine();
      onRefresh();
    } catch (error) {
      console.error("Error processing unit", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-950 text-white">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Beaker className="text-blue-400" size={24} />
              Área de Procesamiento y Tamizaje de Unidades
            </h2>
            <p className="text-slate-400 text-xs mt-1">Liberación de Unidades en Cuarentena • ISO 15189</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
                  <th className="px-6 py-3">DIN (Unidad)</th>
                  <th className="px-6 py-3">Tipo Sangre</th>
                  <th className="px-6 py-3">Fecha Colecta</th>
                  <th className="px-6 py-3">Estado Serológico</th>
                  <th className="px-6 py-3 text-right">Acciones de Liberación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quarantineUnits.map(unit => (
                  <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{unit.unit_number}</td>
                    <td className="px-6 py-4 font-black text-red-600">{unit.blood_type}{unit.rh_factor === 'POS' ? '+' : '-'}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(unit.collection_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase">
                        <FlaskConical size={12} /> {unit.serology_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedUnitId(unit.id)}
                        className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors shadow-lg shadow-slate-100"
                      >
                        Ingresar Resultados MINSA
                      </button>
                    </td>
                  </tr>
                ))}
                {quarantineUnits.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                      No hay unidades pendientes de procesamiento en el área de cuarentena.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {selectedUnitId && (
            <div className="mt-8 p-6 bg-white rounded-2xl border-2 border-slate-200 shadow-xl animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="text-green-600" size={24} />
                  Panel de Marcadores Obligatorios (Panamá)
                </h3>
                <button onClick={() => setSelectedUnitId(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {Object.keys(markers).map(key => (
                  <div key={key} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{key}</span>
                      <p className="font-bold text-slate-700">{key.toUpperCase()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMarkers({...markers, [key as keyof typeof markers]: false})}
                        className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${
                          !markers[key as keyof typeof markers] ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        NEG
                      </button>
                      <button
                        onClick={() => setMarkers({...markers, [key as keyof typeof markers]: true})}
                        className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${
                          markers[key as keyof typeof markers] ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        REACT
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedUnitId(null)}
                  className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={processUnit}
                  className="bg-slate-900 text-white px-10 py-2 rounded-lg font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
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
