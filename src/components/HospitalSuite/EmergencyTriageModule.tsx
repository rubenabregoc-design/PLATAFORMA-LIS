import React, { useState } from 'react';
import {
  Activity,
  HeartPulse,
  Thermometer,
  Wind,
  Gauge,
  AlertOctagon,
  CheckCircle2,
  Clock,
  UserPlus,
  BedDouble,
  FileHeart,
  Search,
  ShieldAlert,
  ArrowRight,
  Flame,
  AlertTriangle
} from 'lucide-react';
import { useHisStore } from '../../store/useHisStore';
import { useLisStore } from '../../store/useLisStore';
import { TriagePriority, TriageRecord, VitalSigns } from '../../types';

export const EmergencyTriageModule: React.FC = () => {
  const { triageRecords, addTriageRecord, beds, admitPatientToBed } = useHisStore();
  const { patients } = useLisStore();

  // New Triage State
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [patientName, setPatientName] = useState<string>(patients[0] ? `${patients[0].firstName} ${patients[0].lastName}` : '');
  const [patientCedula, setPatientCedula] = useState<string>(patients[0]?.nationalId || '');
  const [chiefComplaint, setChiefComplaint] = useState<string>('');
  const [allergiesInput, setAllergiesInput] = useState<string>('Ninguna conocida');
  const [priority, setPriority] = useState<TriagePriority>('NIVEL_3_AMARILLO');

  // Vital Signs
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [heartRate, setHeartRate] = useState<number>(78);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(18);
  const [temperature, setTemperature] = useState<number>(36.7);
  const [spo2, setSpo2] = useState<number>(98);
  const [glasgow, setGlasgow] = useState<number>(15);
  const [glucose, setGlucose] = useState<number>(95);

  // Quick admission modal state
  const [selectedTriageForAdmission, setSelectedTriageForAdmission] = useState<TriageRecord | null>(null);
  const [targetBedId, setTargetBedId] = useState<string>(beds.find((b) => b.status === 'DISPONIBLE')?.id || '');
  const [admittingDoctor, setAdmittingDoctor] = useState<string>('Dr. Alejandro Icaza');
  const [doctorLicense, setDoctorLicense] = useState<string>('MP-6612-PA');
  const [admissionDiagnosis, setAdmissionDiagnosis] = useState<string>('Evaluación y Monitoreo en Urgencias');

  const handlePatientSelect = (patId: string) => {
    setSelectedPatientId(patId);
    const pat = patients.find((p) => p.id === patId);
    if (pat) {
      setPatientName(`${pat.firstName} ${pat.lastName}`);
      setPatientCedula(pat.nationalId);
    }
  };

  const handleCreateTriage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !chiefComplaint) {
      alert('Por favor ingrese el nombre del paciente y el motivo de consulta.');
      return;
    }

    const vitals: VitalSigns = {
      systolicBp: systolic,
      diastolicBp: diastolic,
      heartRate,
      respiratoryRate,
      temperature,
      oxygenSaturation: spo2,
      glasgowScale: glasgow,
      capillaryGlucose: glucose
    };

    const newRecord: TriageRecord = {
      id: `trg-${Date.now()}`,
      tenantId: 'lab-san-jose',
      branchId: 'branch-via-espana',
      patientId: selectedPatientId || `pat-${Date.now()}`,
      patientName,
      patientNationalId: patientCedula,
      priority,
      chiefComplaint,
      vitalSigns: vitals,
      allergies: allergiesInput.split(',').map((s) => s.trim()),
      assessedBy: 'Lic. Karen Ortega (Enfermera Triage)',
      assessedAt: new Date().toISOString(),
      status: 'EN_ESPERA'
    };

    addTriageRecord(newRecord);
    setChiefComplaint('');
    alert(`Paciente ${patientName} clasificado con éxito en Triage.`);
  };

  const handleAdmitToBed = () => {
    if (!selectedTriageForAdmission || !targetBedId) return;

    admitPatientToBed(
      selectedTriageForAdmission.id,
      selectedTriageForAdmission.patientId,
      selectedTriageForAdmission.patientName,
      selectedTriageForAdmission.patientNationalId,
      targetBedId,
      admittingDoctor,
      doctorLicense,
      admissionDiagnosis,
      selectedTriageForAdmission.allergies
    );

    alert(`Paciente ${selectedTriageForAdmission.patientName} ingresado a la cama ${beds.find((b) => b.id === targetBedId)?.bedNumber}.`);
    setSelectedTriageForAdmission(null);
  };

  const getPriorityBadge = (lvl: TriagePriority) => {
    switch (lvl) {
      case 'NIVEL_1_ROJO':
        return { label: 'Nivel 1 • Resucitación (Inmediato)', color: 'bg-rose-500 text-white border-rose-600 shadow-rose-500/30' };
      case 'NIVEL_2_NARANJA':
        return { label: 'Nivel 2 • Emergencia (10-15 min)', color: 'bg-amber-500 text-slate-950 border-amber-600 shadow-amber-500/30' };
      case 'NIVEL_3_AMARILLO':
        return { label: 'Nivel 3 • Urgencia (60 min)', color: 'bg-yellow-400 text-slate-950 border-yellow-500 shadow-yellow-400/20' };
      case 'NIVEL_4_VERDE':
        return { label: 'Nivel 4 • Menor (120 min)', color: 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20' };
      case 'NIVEL_5_AZUL':
        return { label: 'Nivel 5 • No Urgente (240 min)', color: 'bg-blue-500 text-white border-blue-600 shadow-blue-500/20' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-rose-400 text-xs font-black uppercase tracking-widest mb-1.5">
              <HeartPulse className="w-4 h-4 animate-pulse" />
              <span>HIS • Servicio de Urgencias y Triage Clínico (Protocolo Manchester)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Triage & Admisión Hospitalaria Inmediata
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Estratificación clínica en tiempo real, registro estandarizado de signos vitales basales y asignación directa a camas de observación y salas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-3 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">En Espera Urgencias</span>
              <span className="text-xl font-black text-amber-400">
                {triageRecords.filter((t) => t.status === 'EN_ESPERA').length}
              </span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-3 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Críticos Nivel 1 y 2</span>
              <span className="text-xl font-black text-rose-400">
                {triageRecords.filter((t) => t.priority === 'NIVEL_1_ROJO' || t.priority === 'NIVEL_2_NARANJA').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FORM: NUEVO TRIAGE */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Activity className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-white text-base">Evaluación y Clasificación del Paciente</h3>
          </div>

          <form onSubmit={handleCreateTriage} className="space-y-4">
            {/* Selección de Paciente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Cédula / Paciente Registrado</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => handlePatientSelect(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="">-- Ingreso Manual o Nuevo --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nationalId} • {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Ej: Carlos Vega"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>
            </div>

            {/* Motivo de Consulta */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Motivo de Consulta y Síntomas Principales</label>
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Describa el motivo de consulta, tiempo de inicio y escala de dolor..."
                rows={2}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            {/* Signos Vitales */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <span className="text-[11px] font-black uppercase text-slate-400 flex items-center space-x-1.5">
                <Gauge className="w-3.5 h-3.5 text-rose-400" />
                <span>Signos Vitales y Constantes Basales</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">P.A. Sistólica (mmHg)</span>
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(Number(e.target.value))}
                    className={`w-full bg-slate-800 border rounded-lg px-2.5 py-1.5 font-bold ${
                      systolic >= 140 || systolic <= 90 ? 'border-amber-500 text-amber-300' : 'border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">P.A. Diastólica (mmHg)</span>
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(Number(e.target.value))}
                    className={`w-full bg-slate-800 border rounded-lg px-2.5 py-1.5 font-bold ${
                      diastolic >= 90 ? 'border-amber-500 text-amber-300' : 'border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Frec. Cardíaca (lpm)</span>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(Number(e.target.value))}
                    className={`w-full bg-slate-800 border rounded-lg px-2.5 py-1.5 font-bold ${
                      heartRate >= 100 || heartRate <= 55 ? 'border-rose-500 text-rose-300' : 'border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Frec. Respiratoria (rpm)</span>
                  <input
                    type="number"
                    value={respiratoryRate}
                    onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                    className={`w-full bg-slate-800 border rounded-lg px-2.5 py-1.5 font-bold ${
                      respiratoryRate >= 22 ? 'border-amber-500 text-amber-300' : 'border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Temperatura (°C)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className={`w-full bg-slate-800 border rounded-lg px-2.5 py-1.5 font-bold ${
                      temperature >= 38.0 ? 'border-rose-500 text-rose-300' : 'border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Sat. SpO2 (%)</span>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(Number(e.target.value))}
                    className={`w-full bg-slate-800 border rounded-lg px-2.5 py-1.5 font-bold ${
                      spo2 < 95 ? 'border-rose-500 text-rose-300' : 'border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Glasgow (3-15)</span>
                  <input
                    type="number"
                    min="3"
                    max="15"
                    value={glasgow}
                    onChange={(e) => setGlasgow(Number(e.target.value))}
                    className={`w-full bg-slate-800 border rounded-lg px-2.5 py-1.5 font-bold ${
                      glasgow < 15 ? 'border-amber-500 text-amber-300' : 'border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Glucemia (mg/dL)</span>
                  <input
                    type="number"
                    value={glucose}
                    onChange={(e) => setGlucose(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 font-bold text-white"
                  />
                </div>
              </div>
            </div>

            {/* Clasificación Protocolo Manchester */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">Clasificación de Prioridad (Protocolo Manchester)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'NIVEL_1_ROJO', label: 'Nivel 1 • Rojo (Inmediato)', desc: 'Paro, shock, inconsciencia', bg: 'hover:border-rose-500' },
                  { id: 'NIVEL_2_NARANJA', label: 'Nivel 2 • Naranja (10-15 min)', desc: 'Dolor torácico severo, disnea', bg: 'hover:border-amber-500' },
                  { id: 'NIVEL_3_AMARILLO', label: 'Nivel 3 • Amarillo (60 min)', desc: 'Fiebre alta, dolor moderado', bg: 'hover:border-yellow-400' },
                  { id: 'NIVEL_4_VERDE', label: 'Nivel 4 • Verde (120 min)', desc: 'Traumatismos leves, vómitos', bg: 'hover:border-emerald-500' },
                  { id: 'NIVEL_5_AZUL', label: 'Nivel 5 • Azul (240 min)', desc: 'Trámites, recetas, no urgente', bg: 'hover:border-blue-500' }
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setPriority(item.id as TriagePriority)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                      priority === item.id
                        ? 'bg-white/10 border-rose-500 text-white shadow-lg'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold">{item.label}</div>
                    <div className="text-[10px] text-slate-500">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/25 transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Paciente en Triage</span>
            </button>
          </form>
        </div>

        {/* LISTA / COLA DE ESPERA DE TRIAGE */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Cola Activa de Urgencias ({triageRecords.length})</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Prioridad Clínica</span>
            </div>

            <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {triageRecords.map((t) => {
                const badge = getPriorityBadge(t.priority);
                return (
                  <div
                    key={t.id}
                    className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-white text-xs">{t.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Cédula: {t.patientNationalId}</div>
                      </div>
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${badge.color}`}>
                        {badge.label.split('•')[0]}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed italic">
                      "{t.chiefComplaint}"
                    </p>

                    {/* Vitals Summary Pill */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-900/80 p-2 rounded-xl">
                      <span>PA: <strong className="text-white">{t.vitalSigns.systolicBp}/{t.vitalSigns.diastolicBp}</strong></span>
                      <span>• FC: <strong className="text-white">{t.vitalSigns.heartRate}</strong></span>
                      <span>• SpO2: <strong className={t.vitalSigns.oxygenSaturation < 95 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{t.vitalSigns.oxygenSaturation}%</strong></span>
                      <span>• Temp: <strong className="text-white">{t.vitalSigns.temperature}°C</strong></span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {new Date(t.assessedAt).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })} • {t.status}
                      </span>

                      {t.status !== 'INGRESADO' && (
                        <button
                          onClick={() => setSelectedTriageForAdmission(t)}
                          className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-[10px] font-black transition cursor-pointer flex items-center space-x-1"
                        >
                          <BedDouble className="w-3 h-3" />
                          <span>Asignar Cama</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ASIGNACIÓN A CAMA */}
      {selectedTriageForAdmission && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center border border-rose-500/30">
                <BedDouble className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">Asignar Paciente a Cama Hospitalaria</h3>
                <p className="text-xs text-slate-400">{selectedTriageForAdmission.patientName}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Seleccionar Cama Disponible</label>
                <select
                  value={targetBedId}
                  onChange={(e) => setTargetBedId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500"
                >
                  {beds
                    .filter((b) => b.status === 'DISPONIBLE')
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        [{b.ward}] Cama {b.bedNumber} - {b.roomNumber}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Médico Tratante / Responsable</label>
                <input
                  type="text"
                  value={admittingDoctor}
                  onChange={(e) => setAdmittingDoctor(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Diagnóstico Inicial de Ingreso (CIE-10)</label>
                <input
                  type="text"
                  value={admissionDiagnosis}
                  onChange={(e) => setAdmissionDiagnosis(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedTriageForAdmission(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdmitToBed}
                className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-500/30 transition cursor-pointer"
              >
                Confirmar Ingreso a Cama
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
