import React, { useState } from 'react';
import { UserPlus, Heart, Thermometer, Activity, Scale, ShieldCheck, X, Save } from 'lucide-react';
import { SupabaseService } from '../../../services/SupabaseService';
import { ISBT128 } from '../../../utils/isbt128Generator';

interface DonorScreeningFormProps {
  onClose: () => void;
  onComplete: () => void;
}

const DonorScreeningForm: React.FC<DonorScreeningFormProps> = ({ onClose, onComplete }) => {
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="text-red-600" size={24} />
            Entrevista y Tamizaje de Donante
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {step === 1 ? (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 border-b pb-2">Datos Demográficos</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="Nombre(s)"
                  className="p-2 border rounded-lg text-sm"
                  onChange={e => setDonorData({...donorData, firstName: e.target.value})}
                />
                <input
                  placeholder="Apellido(s)"
                  className="p-2 border rounded-lg text-sm"
                  onChange={e => setDonorData({...donorData, lastName: e.target.value})}
                />
                <input
                  placeholder="Identificación / Cédula"
                  className="p-2 border rounded-lg text-sm"
                  onChange={e => setDonorData({...donorData, nationalId: e.target.value})}
                />
                <div className="flex gap-2">
                  <select
                    className="flex-1 p-2 border rounded-lg text-sm"
                    onChange={e => setDonorData({...donorData, bloodType: e.target.value as any})}
                  >
                    <option value="O">Tipo O</option>
                    <option value="A">Tipo A</option>
                    <option value="B">Tipo B</option>
                    <option value="AB">Tipo AB</option>
                  </select>
                  <select
                    className="flex-1 p-2 border rounded-lg text-sm"
                    onChange={e => setDonorData({...donorData, rhFactor: e.target.value as any})}
                  >
                    <option value="POS">Rh+</option>
                    <option value="NEG">Rh-</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold mt-4"
              >
                Continuar a Evaluación Física
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 border-b pb-2">Signos Vitales y Hemoglobina</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                    <Scale size={14} /> Peso (kg)
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg"
                    placeholder="Min 50kg"
                    onChange={e => setDonorData({...donorData, weight: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                    <Heart size={14} /> Hemoglobina (g/dL)
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg"
                    placeholder="Min 12.5"
                    onChange={e => setDonorData({...donorData, hemoglobin: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                    <Thermometer size={14} /> Temperatura (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-2 border rounded-lg"
                    defaultValue={36.5}
                    onChange={e => setDonorData({...donorData, temperature: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                    <Activity size={14} /> Presión Arterial
                  </label>
                  <input
                    className="w-full p-2 border rounded-lg"
                    placeholder="120/80"
                    onChange={e => setDonorData({...donorData, pressure: e.target.value})}
                  />
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl border bg-slate-50">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={donorData.isEligible}
                    onChange={e => setDonorData({...donorData, isEligible: e.target.checked})}
                    className="w-5 h-5 text-green-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-800">Criterio de Elegibilidad Cumplido</span>
                    <p className="text-[10px] text-slate-500">Confirma que el donante ha pasado la entrevista de salud.</p>
                  </div>
                </label>
                {!donorData.isEligible && (
                  <textarea
                    className="w-full mt-3 p-2 border rounded-lg text-sm h-20"
                    placeholder="Razón del diferimiento..."
                    onChange={e => setDonorData({...donorData, deferralReason: e.target.value})}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t flex justify-between">
          {step === 2 && (
            <button onClick={() => setStep(1)} className="text-slate-500 font-bold">Atrás</button>
          )}
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose} className="px-6 py-2 text-slate-600 font-bold">Cancelar</button>
            {step === 2 && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-red-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-red-700 shadow-lg shadow-red-200"
              >
                <Save size={18} />
                Finalizar y Colectar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorScreeningForm;
