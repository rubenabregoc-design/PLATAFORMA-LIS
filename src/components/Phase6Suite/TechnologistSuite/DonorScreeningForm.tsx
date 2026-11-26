import React, { useState } from 'react';
import { UserPlus, Heart, Thermometer, Activity, Scale, ShieldCheck, X, Save } from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';
import { ISBT128 } from '../../../utils/isbt128Generator';

interface DonorScreeningFormProps {
  onClose?: () => void;
  onComplete?: () => void;
}

const DonorScreeningForm: React.FC<DonorScreeningFormProps> = ({ onClose = () => {}, onComplete = () => {} }) => {
  const [step, setStep] = useState(1);
  const [donorData, setDonorData] = useState({
    firstName: '',
    lastName: '',
    nationalId: '',
    bloodType: 'O' as any,
    rhFactor: 'POS' as any,
    weight: 0,
    hemoglobin: 0,
    temperature: 36.5,
    pressure: '120/80',
    isEligible: true,
    deferralReason: ''
  });

  const handleSave = async () => {
    try {
      // 1. Register Donor
      const donor = await SupabaseService.bloodBank.registerDonor({
        patient_id: null,
        blood_type: donorData.bloodType,
        rh_factor: donorData.rhFactor,
        phenotype: null,
        last_donation_date: new Date().toISOString().split('T')[0],
        eligibility_status: donorData.isEligible ? 'ELIGIBLE' : 'TEMPORARY_DEFERRAL',
        deferral_reason: donorData.deferralReason || null
      });

      if (donorData.isEligible) {
        // 2. Create Blood Unit (In Quarantine)
        const unitNumber = ISBT128.generateDIN('F8823', Math.floor(Math.random() * 100000));
        await SupabaseService.bloodBank.addBloodUnit({
          donor_id: donor.id,
          unit_number: unitNumber,
          component_type: 'WHOLE_BLOOD',
          blood_type: donorData.bloodType,
          rh_factor: donorData.rhFactor,
          volume_ml: 450,
          collection_date: new Date().toISOString(),
          expiry_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days for CPDA-1
          status: 'QUARANTINE',
          location_storage: 'QUARANTINE_FRIDGE',
          serology_status: 'PENDING'
        });
      }

      onComplete();
    } catch (error) {
      console.error("Error saving donor screening", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-800 text-white">
        
        {/* Cabecera Oscura */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Entrevista y Tamizaje de Donante
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Cuestionario clínico y calificación física obligatoria MINSA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Cerrar formulario"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto bg-slate-900">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-white text-sm">Paso 1: Datos Demográficos y Tipificación</h3>
                <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                  F-DON-01
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">Nombre(s) *</label>
                  <input
                    type="text"
                    placeholder="Ej: Roberto Carlos"
                    value={donorData.firstName}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder:text-slate-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none shadow-inner"
                    onChange={e => setDonorData({...donorData, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">Apellido(s) *</label>
                  <input
                    type="text"
                    placeholder="Ej: Mendoza Samudio"
                    value={donorData.lastName}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder:text-slate-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none shadow-inner"
                    onChange={e => setDonorData({...donorData, lastName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">Cédula de Identidad (CIP) *</label>
                  <input
                    type="text"
                    placeholder="Ej: 8-765-4321"
                    value={donorData.nationalId}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder:text-slate-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none shadow-inner"
                    onChange={e => setDonorData({...donorData, nationalId: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">Grupo ABO y Factor Rh *</label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none shadow-inner cursor-pointer"
                      value={donorData.bloodType}
                      onChange={e => setDonorData({...donorData, bloodType: e.target.value as any})}
                    >
                      <option value="O" className="bg-slate-950 text-white">Tipo O</option>
                      <option value="A" className="bg-slate-950 text-white">Tipo A</option>
                      <option value="B" className="bg-slate-950 text-white">Tipo B</option>
                      <option value="AB" className="bg-slate-950 text-white">Tipo AB</option>
                    </select>
                    <select
                      className="flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none shadow-inner cursor-pointer"
                      value={donorData.rhFactor}
                      onChange={e => setDonorData({...donorData, rhFactor: e.target.value as any})}
                    >
                      <option value="POS" className="bg-slate-950 text-white">Rh Positivo (+)</option>
                      <option value="NEG" className="bg-slate-950 text-white">Rh Negativo (-)</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!donorData.firstName || !donorData.lastName || !donorData.nationalId}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl font-bold text-sm mt-4 transition shadow-lg shadow-rose-900/30 cursor-pointer disabled:opacity-50"
              >
                Continuar a Evaluación Física y Signos Vitales →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-white text-sm">Paso 2: Signos Vitales y Parámetros Clínicos</h3>
                <span className="text-xs text-slate-400 font-medium">MINSA: Peso &ge; 50kg, Hb &ge; 12.5 g/dL</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <Scale size={14} className="text-slate-400" /> Peso Corporal (kg) *
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder:text-slate-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none shadow-inner"
                    placeholder="Mínimo 50 kg"
                    value={donorData.weight || ''}
                    onChange={e => setDonorData({...donorData, weight: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <Heart size={14} className="text-rose-400" /> Hemoglobina (g/dL) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder:text-slate-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none shadow-inner"
                    placeholder="Mínimo 12.5 g/dL"
                    value={donorData.hemoglobin || ''}
                    onChange={e => setDonorData({...donorData, hemoglobin: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <Thermometer size={14} className="text-amber-400" /> Temperatura (°C) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder:text-slate-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none shadow-inner"
                    defaultValue={36.5}
                    onChange={e => setDonorData({...donorData, temperature: parseFloat(e.target.value) || 36.5})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <Activity size={14} className="text-cyan-400" /> Presión Arterial *
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder:text-slate-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none shadow-inner"
                    placeholder="Ej: 120/80 mmHg"
                    value={donorData.pressure}
                    onChange={e => setDonorData({...donorData, pressure: e.target.value})}
                  />
                </div>
              </div>

              {/* Caja de Elegibilidad MINSA */}
              <div className="mt-4 p-4 rounded-2xl border border-slate-800 bg-slate-950 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={donorData.isEligible}
                    onChange={e => setDonorData({...donorData, isEligible: e.target.checked})}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-white text-sm">Criterio de Elegibilidad Cumplido (Apto)</span>
                    <p className="text-xs text-slate-400 mt-0.5">Confirma que el donante ha superado la entrevista médica y evaluación física.</p>
                  </div>
                </label>

                {!donorData.isEligible && (
                  <div className="pt-3 border-t border-slate-800 space-y-1.5">
                    <label className="block text-xs font-bold text-rose-400 uppercase tracking-wide">
                      Motivo de Diferimiento Clínico *
                    </label>
                    <textarea
                      className="w-full p-3 bg-slate-900 border border-rose-500/40 rounded-xl text-sm font-medium text-white placeholder:text-slate-500 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none min-h-[80px]"
                      placeholder="Indique la causa del diferimiento temporal o permanente (ej. Tatuaje reciente < 6 meses, medicación, etc.)..."
                      value={donorData.deferralReason}
                      onChange={e => setDonorData({...donorData, deferralReason: e.target.value})}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Oscuro */}
        <div className="p-4 sm:p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-slate-400 hover:text-white font-bold text-sm transition cursor-pointer"
            >
              ← Volver al Paso 1
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-sm transition cursor-pointer shadow-sm"
            >
              Cancelar
            </button>
            {step === 2 && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-lg shadow-rose-600/30 cursor-pointer active:scale-95"
              >
                <Save size={16} />
                <span>Finalizar y Registrar Donante</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DonorScreeningForm;
