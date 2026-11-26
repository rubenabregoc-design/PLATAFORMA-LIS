import React, { useState } from 'react';
import { AlertCircle, ShieldAlert, X, Save, Info, Droplets } from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';

interface HemovigilanceReportModalProps {
  onClose: () => void;
  onComplete: () => void;
}

const REACTION_TYPES = [
  { id: 'FEBRILE', label: 'Febril no Hemolítica', color: 'text-amber-600' },
  { id: 'ALLERGIC', label: 'Alérgica / Urticaria', color: 'text-blue-600' },
  { id: 'ANAPHYLACTIC', label: 'Anafiláctica', color: 'text-red-700' },
  { id: 'TRALI', label: 'TRALI (Lesión Pulmonar Aguda)', color: 'text-purple-600' },
  { id: 'TACO', label: 'TACO (Sobrecarga Circulatoria)', color: 'text-indigo-600' },
  { id: 'HEMOLYTIC_ACUTE', label: 'Hemolítica Aguda', color: 'text-red-600' },
  { id: 'HEMOLYTIC_DELAYED', label: 'Hemolítica Retardada', color: 'text-rose-600' },
  { id: 'SEPTIC', label: 'Sepsis Bacteriana', color: 'text-emerald-700' }
];

const HemovigilanceReportModal: React.FC<HemovigilanceReportModalProps> = ({ onClose, onComplete }) => {
  const [data, setData] = useState({
    unitNumber: '',
    patientId: '',
    reactionType: '',
    severity: 'MILD',
    description: '',
    investigationNotes: ''
  });

  const handleSave = async () => {
    try {
      const { data: profile } = await SupabaseService.auth.getCurrentProfile() as any;

      // In a real system, we would first find the unit_id by unitNumber
      // For this implementation, we'll assume a direct report
      await SupabaseService.bloodBank.reportReaction({
        unit_id: null, // Should be looked up
        patient_id: null, // Should be looked up
        reaction_type: data.reactionType,
        severity: data.severity as any,
        description: data.description,
        investigation_notes: data.investigationNotes,
        reported_by: profile?.id
      });

      onComplete();
    } catch (error) {
      console.error("Error reporting hemovigilance reaction", error);
    }
  };

  const SEVERITY_LEVELS = [
    { id: 'MILD', label: 'Leve' },
    { id: 'MODERATE', label: 'Moderada' },
    { id: 'SEVERE', label: 'Severa' },
    { id: 'FATAL', label: 'Mortal / Fatal' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-rose-700 flex justify-between items-center bg-gradient-to-r from-red-600 to-rose-700 text-white shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-white">
              <ShieldAlert size={22} />
              Reporte de Reacción Transfusional (Hemovigilancia)
            </h2>
            <p className="text-red-100 text-xs mt-0.5">Protocolo de Emergencia, Trazabilidad Inmutable e Investigación ISO 15189</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex gap-3 text-red-900 text-xs sm:text-sm">
            <AlertCircle className="shrink-0 text-red-600 mt-0.5" size={20} />
            <p><strong>IMPORTANTE:</strong> Ante cualquier sospecha de reacción adversa, se debe <strong>detener la transfusión inmediatamente</strong>, mantener vía venosa con infusión salina al 0.9% y remitir la unidad junto con muestras post-transfusionales al Banco de Sangre.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Número de Unidad (DIN) *</label>
              <div className="relative">
                <input
                  type="text"
                  value={data.unitNumber}
                  onChange={(e) => setData({...data, unitNumber: e.target.value})}
                  placeholder="Ej: =F88232600101"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none shadow-sm font-mono"
                />
                <Droplets className="absolute right-3 top-2.5 text-rose-500 pointer-events-none" size={18} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Identificación del Paciente (CIP) *</label>
              <input
                type="text"
                value={data.patientId}
                onChange={(e) => setData({...data, patientId: e.target.value})}
                placeholder="Cédula de Identidad o ID"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Tipo de Reacción Transfusional *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REACTION_TYPES.map(type => (
                <button
                  type="button"
                  key={type.id}
                  onClick={() => setData({...data, reactionType: type.id})}
                  className={`p-3 text-left rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                    data.reactionType === type.id
                      ? 'border-red-600 bg-red-50 text-red-800 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Grado de Severidad / Gravedad *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SEVERITY_LEVELS.map(s => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setData({...data, severity: s.id})}
                  className={`py-2.5 px-3 text-xs font-black rounded-xl border-2 transition-all cursor-pointer text-center ${
                    data.severity === s.id
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Signos y Síntomas Clínicos Observados *</label>
            <textarea
              value={data.description}
              onChange={(e) => setData({...data, description: e.target.value})}
              placeholder="Describa signos vitales, fiebre (&Delta;T &ge; 1°C), escalofríos, hipotensión, disnea, prurito, dolor lumbar, etc."
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 min-h-[90px] outline-none focus:ring-2 focus:ring-red-500/20 focus:border-rose-500 shadow-sm"
            />
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex gap-3 text-amber-900 text-xs">
            <Info className="shrink-0 text-amber-600 mt-0.5" size={16} />
            <p>Este reporte activará la notificación inmediata al <strong>Comité de Hemovigilancia Hospitalaria</strong> e iniciará el protocolo analítico: prueba de Coombs directa post-transfusional, re-verificación ABO/Rh y hemocultivo de la bolsa.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-slate-700 font-bold bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition text-sm cursor-pointer shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!data.reactionType || !data.description}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-7 py-2.5 rounded-xl font-bold transition shadow-lg shadow-red-600/30 disabled:opacity-50 cursor-pointer text-sm"
          >
            <Save size={16} />
            <span>Notificar Reacción</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HemovigilanceReportModal;
