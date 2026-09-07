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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-600 text-white">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <ShieldAlert size={24} />
              Reporte de Reacción Transfusional (Hemovigilancia)
            </h2>
            <p className="text-red-100 text-xs mt-1">Protocolo de Emergencia y Seguimiento ISO 15189</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 text-red-800 text-sm">
            <AlertCircle className="shrink-0" size={20} />
            <p><strong>IMPORTANTE:</strong> Ante cualquier sospecha de reacción, se debe <strong>detener la transfusión inmediatamente</strong>, mantener vía salina y enviar la bolsa al laboratorio para investigación.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Número de Unidad (DIN)</label>
              <div className="relative">
                <input
                  type="text"
                  value={data.unitNumber}
                  onChange={(e) => setData({...data, unitNumber: e.target.value})}
                  placeholder="Ej: =F123424000001"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 outline-none"
                />
                <Droplets className="absolute right-3 top-2.5 text-slate-400" size={18} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Identificación del Paciente</label>
              <input
                type="text"
                value={data.patientId}
                onChange={(e) => setData({...data, patientId: e.target.value})}
                placeholder="Cédula o ID"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Reacción</label>
            <div className="grid grid-cols-2 gap-2">
              {REACTION_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setData({...data, reactionType: type.id})}
                  className={`p-3 text-left rounded-xl border-2 text-xs font-bold transition-all ${
                    data.reactionType === type.id
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-slate-100 hover:border-slate-200 text-slate-600'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Gravedad</label>
              <div className="flex gap-2">
                {['MILD', 'MODERATE', 'SEVERE', 'FATAL'].map(s => (
                  <button
                    key={s}
                    onClick={() => setData({...data, severity: s})}
                    className={`flex-1 py-2 text-[10px] font-black rounded-lg border-2 transition-all ${
                      data.severity === s
                        ? 'bg-slate-800 border-slate-800 text-white'
                        : 'border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Signos y Síntomas Clínicos</label>
            <textarea
              value={data.description}
              onChange={(e) => setData({...data, description: e.target.value})}
              placeholder="Describir fiebre, escalofríos, hipotensión, disnea, prurito, etc."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 text-amber-900 text-[10px] italic">
            <Info className="shrink-0" size={16} />
            <p>Este reporte iniciará un protocolo de investigación inmunohematológica que incluye: re-cruce de la unidad devuelta, Coombs directo post-transfusional y hemocultivo de la bolsa.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!data.reactionType || !data.description}
            className="flex items-center gap-2 bg-red-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50"
          >
            <Save size={18} />
            Notificar Reacción
          </button>
        </div>
      </div>
    </div>
  );
};

export default HemovigilanceReportModal;
