import React, { useState } from 'react';
import { ShieldCheck, Beaker, Thermometer, FlaskConical, AlertCircle, Save, X, CheckCircle2 } from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

interface CrossmatchWorkflowProps {
  request: any;
  availableUnits: any[];
  onClose: () => void;
  onComplete: () => void;
}

const CrossmatchWorkflow: React.FC<CrossmatchWorkflowProps> = ({ request, availableUnits, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
  const [results, setResults] = useState({
    saline: 'NEG',
    albumin: 'NEG',
    coombs: 'NEG',
    method: 'GEL',
    notes: ''
  });

  const isCompatible = results.saline === 'NEG' && results.albumin === 'NEG' && results.coombs === 'NEG';

  const handleSave = async () => {
    if (!selectedUnit) return;

    try {
      const { data: profile } = await SupabaseService.auth.getCurrentProfile() as any;

      await SupabaseService.bloodBank.performCrossmatch({
        request_id: request.id,
        unit_id: selectedUnit.id,
        technologist_id: profile?.id,
        method: results.method,
        saline_phase: results.saline,
        albumin_phase: results.albumin,
        coombs_phase: results.coombs,
        result: isCompatible ? 'COMPATIBLE' : 'INCOMPATIBLE',
        incompatibility_notes: results.notes
      });

      // Update request status
      await SupabaseService.bloodBank.updateRequestStatus(request.id, isCompatible ? 'READY' : 'CANCELLED');

      onComplete();
    } catch (error) {
      console.error("Error saving crossmatch", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Beaker className="text-blue-600" size={24} />
              Protocolo de Compatibilidad Pre-transfusional
            </h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
              Paciente: {request.patients.first_name} {request.patients.last_name} ({request.patients.national_id})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Step 1: Unit Selection */}
            <div className={`space-y-4 ${step !== 1 && 'opacity-50 pointer-events-none'}`}>
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
                Selección de Hemocomponente
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {availableUnits.filter(u => u.component_type === request.component_requested).map(unit => (
                  <div
                    key={unit.id}
                    onClick={() => setSelectedUnit(unit)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedUnit?.id === unit.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span className="font-mono text-sm">{unit.unit_number}</span>
                      <span className="text-red-600">{unit.blood_type}{unit.rh_factor === 'POS' ? '+' : '-'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Vence: {new Date(unit.expiry_date).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
              {selectedUnit && (
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
                >
                  Continuar a Fases
                </button>
              )}
            </div>

            {/* Step 2: Testing Phases */}
            <div className={`lg:col-span-2 space-y-6 ${step !== 2 && 'opacity-50 pointer-events-none'}`}>
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
                Ejecución de Fases Analíticas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-sm">
                    <FlaskConical size={18} className="text-blue-500" />
                    Fase Salina
                  </div>
                  <select
                    value={results.saline}
                    onChange={(e) => setResults({...results, saline: e.target.value})}
                    className="w-full p-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="NEG">NEGATIVO (0)</option>
                    <option value="1+">1+</option>
                    <option value="2+">2+</option>
                    <option value="3+">3+</option>
                    <option value="4+">4+</option>
                  </select>
                  <p className="text-[9px] text-slate-400 mt-2">Centrifugación inmediata (Spin)</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-sm">
                    <Thermometer size={18} className="text-orange-500" />
                    Fase Albúmina
                  </div>
                  <select
                    value={results.albumin}
                    onChange={(e) => setResults({...results, albumin: e.target.value})}
                    className="w-full p-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="NEG">NEGATIVO (0)</option>
                    <option value="1+">1+</option>
                    <option value="2+">2+</option>
                    <option value="3+">3+</option>
                    <option value="4+">4+</option>
                  </select>
                  <p className="text-[9px] text-slate-400 mt-2">Incubación 37°C / 15-30 min</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-sm">
                    <ShieldCheck size={18} className="text-green-500" />
                    Fase Coombs
                  </div>
                  <select
                    value={results.coombs}
                    onChange={(e) => setResults({...results, coombs: e.target.value})}
                    className="w-full p-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="NEG">NEGATIVO (0)</option>
                    <option value="1+">1+</option>
                    <option value="2+">2+</option>
                    <option value="3+">3+</option>
                    <option value="4+">4+</option>
                  </select>
                  <p className="text-[9px] text-slate-400 mt-2">Prueba Antiglobulina Indirecta</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Método Utilizado</label>
                  <div className="flex gap-4">
                    {['GEL', 'TUBO', 'FASE_SOLIDA'].map(m => (
                      <label key={m} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input
                          type="radio"
                          name="method"
                          checked={results.method === m}
                          onChange={() => setResults({...results, method: m})}
                          className="text-blue-600"
                        />
                        {m}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Observaciones / Incompatibilidades</label>
                  <textarea
                    value={results.notes}
                    onChange={(e) => setResults({...results, notes: e.target.value})}
                    placeholder="Detallar si hubo hemólisis, efecto rouleaux, etc."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Status Indicator */}
              <div className={`p-4 rounded-xl border-2 flex items-center gap-4 ${
                isCompatible ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {isCompatible ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                <div>
                  <h4 className="font-black text-lg">RESULTADO: {isCompatible ? 'COMPATIBLE' : 'INCOMPATIBLE'}</h4>
                  <p className="text-xs opacity-80">
                    {isCompatible
                      ? "La unidad puede ser reservada y transfundida bajo supervisión."
                      : "ALERTA: No transfundir esta unidad. Seleccionar un nuevo lote."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <button
            onClick={() => setStep(1)}
            className="text-slate-500 font-bold hover:text-slate-700"
            disabled={step === 1}
          >
            Atrás
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedUnit}
              className="flex items-center gap-2 bg-slate-800 text-white px-8 py-2 rounded-lg font-bold hover:bg-slate-700 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
            >
              <Save size={18} />
              Finalizar y Registrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrossmatchWorkflow;
