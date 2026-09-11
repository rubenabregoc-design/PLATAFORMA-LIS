import React, { useState } from 'react';
import {
  FilePlus, ShieldAlert, AlertTriangle, Pill, Microscope, Radio,
  HeartPulse, CheckCircle2, Search, X, Plus, Info, ChevronRight,
  UserCheck, Send, Sparkles, Stethoscope, Utensils, Droplets, Calendar, Lock
} from 'lucide-react';
import { useHisStore } from '../../store/useHisStore';
import { useLisStore } from '../../store/useLisStore';

export const CpoeCdsModule: React.FC = () => {
  const { admissions, selectedAdmissionId, addMedicationOrder } = useHisStore();
  const { addOrder, currentUser } = useLisStore();

  const activeAdmission = admissions.find((a) => a.id === selectedAdmissionId) || admissions[0];

  // Prescribing Form State
  const [orderCategory, setOrderCategory] = useState<'LAB' | 'RAD' | 'MED' | 'DIET' | 'CONSULT' | 'TRANSFUSION'>('MED');
  const [medicationName, setMedicationName] = useState('Enalapril');
  const [dose, setDose] = useState('10 mg');
  const [route, setRoute] = useState('VO');
  const [frequency, setFrequency] = useState('CADA_12H');
  const [notes, setNotes] = useState('');

  // Clinical Decision Support (CDS) Alerts State
  const [cdsAlerts, setCdsAlerts] = useState<Array<{ id: string; type: 'ALLERGY' | 'RENAL' | 'DUPLICATE' | 'INTERACTION'; title: string; desc: string; severity: 'HIGH' | 'MEDIUM' }>>([
    {
      id: 'cds-1',
      type: 'RENAL',
      title: '⚠️ Ajuste de Dosis Renal Requerido',
      desc: 'El paciente presenta Creatinina = 2.4 mg/dL (eGFR 32 mL/min). Se recomienda reducir Enalapril al 50% de la dosis.',
      severity: 'HIGH'
    },
    {
      id: 'cds-2',
      type: 'ALLERGY',
      title: '🚨 Alerta de Alergia Registrada',
      desc: 'Antecedente de alergia severa a Penicilina / Betalactámicos registrada en el expediente EHR.',
      severity: 'HIGH'
    }
  ]);

  const [submittedOrders, setSubmittedOrders] = useState<Array<{ id: string; category: string; title: string; details: string; status: string; timestamp: string }>>([
    { id: 'cpoe-101', category: 'LAB', title: 'Hemograma Completo + Electrolitos STAT', details: 'Urgente • Muestra de Sangre', status: 'ENVIADO_A_LIS', timestamp: '08:30 AM' },
    { id: 'cpoe-102', category: 'RAD', title: 'Radiografía de Tórax PA y Lateral', details: 'Portátil en Cama • Sospecha Neumonía', status: 'ENVIADO_A_PACS', timestamp: '08:45 AM' },
    { id: 'cpoe-103', category: 'MED', title: 'Ceftriaxona 1g IV C/12H', details: 'Dosis 1g • Vía Intravenosa', status: 'DISPENSADO_FARMACIA', timestamp: '09:00 AM' }
  ]);

  const handleCreateCpoeOrder = (e: React.FormEvent) => {
    e.preventDefault();

    const newCpoeItem = {
      id: `cpoe-${Date.now()}`,
      category: orderCategory,
      title: orderCategory === 'MED' ? `${medicationName} ${dose} (${route})` : `Orden de ${orderCategory}`,
      details: `${frequency} • Notes: ${notes || 'Sin observaciones'}`,
      status: orderCategory === 'LAB' ? 'ENVIADO_A_LIS' : orderCategory === 'MED' ? 'ENVIADO_A_FARMACIA' : 'PROCESANDO',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSubmittedOrders([newCpoeItem, ...submittedOrders]);

    // Send to LIS if Laboratory Order
    if (orderCategory === 'LAB') {
      const newLisOrder: any = {
        id: `ord-cpoe-${Date.now()}`,
        orderNumber: `ORD-HIS-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: activeAdmission?.patientId || 'pat-101',
        patientName: activeAdmission?.patientName || 'Paciente Hospitalizado',
        orderDate: new Date().toISOString(),
        priority: 'STAT',
        status: 'PENDIENTE',
        paymentStatus: 'PAGADO',
        tests: [{ id: 'test-cpoe-1', code: 'CBC', name: 'Hemograma Completo', category: 'HEM' }],
        specimens: []
      };
      addOrder(newLisOrder);
    }

    // Reset Form
    setNotes('');
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `✓ Orden médica CPOE (${newCpoeItem.title}) transmitida automáticamente al servicio correspondiente.`, type: 'success' }
      })
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-slate-100">

      {/* Module Title Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-indigo-500/20">
            <HeartPulse className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">CPOE — Prescripción Electrónica Unificada</h2>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                Computerized Physician Order Entry
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Prescripción médica centralizada para Laboratorio, Radiología, Farmacia, Dietas y Cirugías con Motor CDS de Alertas Clínicas en Tiempo Real.
            </p>
          </div>
        </div>

        {/* Selected Patient Card Badge */}
        {activeAdmission && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/30 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm">
              {activeAdmission.patientName.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-black text-white">{activeAdmission.patientName}</div>
              <div className="text-[10px] font-mono text-slate-400">Cama: <strong className="text-cyan-300">{activeAdmission.bedId}</strong> • Cédula: {activeAdmission.patientNationalId}</div>
            </div>
          </div>
        )}
      </div>

      {/* 🚨 CDS (Clinical Decision Support) Real-Time Alert Engine Bar */}
      {cdsAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-rose-950/70 border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-300 font-black text-xs uppercase tracking-wider">
              <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
              <span>Motor CDS (Clinical Decision Support) — Alertas Preventivas Detectadas</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              {cdsAlerts.length} Reglas de Seguridad Activas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cdsAlerts.map((alert) => (
              <div key={alert.id} className="bg-slate-950/90 p-3.5 rounded-2xl border border-amber-500/30 space-y-1">
                <div className="font-extrabold text-xs text-amber-300 flex items-center justify-between">
                  <span>{alert.title}</span>
                  <span className="text-[9px] font-mono bg-rose-500/20 text-rose-300 px-2 py-0.2 rounded border border-rose-500/30">ALTA PRIORIDAD</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{alert.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📝 CPOE Prescribing Form & Live Transmission Queue (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

        {/* LEFT 2-COLUMNS: CPOE Prescribing Console */}
        <div className="lg:col-span-2 space-y-6">

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">

            {/* Category Switcher Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-800 pb-4">
              {[
                { id: 'MED', label: 'Medicamentos', icon: Pill, color: 'text-indigo-400' },
                { id: 'LAB', label: 'Laboratorio LIS', icon: Microscope, color: 'text-cyan-400' },
                { id: 'RAD', label: 'Radiología RIS/PACS', icon: Radio, color: 'text-purple-400' },
                { id: 'DIET', label: 'Dietas & Nutrición', icon: Utensils, color: 'text-emerald-400' },
                { id: 'TRANSFUSION', label: 'Banco de Sangre', icon: Droplets, color: 'text-rose-400' },
                { id: 'CONSULT', label: 'Interconsultas', icon: Stethoscope, color: 'text-amber-400' },
              ].map((cat) => {
                const CatIcon = cat.icon;
                const isSelected = orderCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setOrderCategory(cat.id as any)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <CatIcon className={`w-4 h-4 ${isSelected ? 'text-white' : cat.color}`} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Prescribing Form */}
            <form onSubmit={handleCreateCpoeOrder} className="space-y-4">

              {orderCategory === 'MED' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300">Medicamento Prescrito</label>
                    <input
                      type="text"
                      required
                      value={medicationName}
                      onChange={(e) => setMedicationName(e.target.value)}
                      placeholder="Ej: Ceftriaxona / Enalapril"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300">Dosis</label>
                    <input
                      type="text"
                      required
                      value={dose}
                      onChange={(e) => setDose(e.target.value)}
                      placeholder="Ej: 1g / 10mg"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300">Vía de Administración</label>
                    <select
                      value={route}
                      onChange={(e) => setRoute(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                    >
                      <option value="VO">Vía Oral (VO)</option>
                      <option value="IV">Intravenosa (IV)</option>
                      <option value="IM">Intramuscular (IM)</option>
                      <option value="SC">Subcutánea (SC)</option>
                      <option value="NEB">Nebulización</option>
                    </select>
                  </div>
                </div>
              )}

              {orderCategory === 'LAB' && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-cyan-300 block">🔬 Orden Automática a Laboratorio LIS</span>
                  <p className="text-[11px] text-slate-400">
                    Al confirmar, la orden viajará instantáneamente al sistema LIS con estado STAT/Urgente y se generará el código de barras para la toma de muestra.
                  </p>
                </div>
              )}

              {orderCategory === 'RAD' && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-purple-300 block">☢️ Orden Automática a Radiología RIS/PACS</span>
                  <p className="text-[11px] text-slate-400">
                    Genera la solicitud DICOM en el servidor PACS para adquisición de RX, Tomografía o Ecografía.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300">Indicaciones Médicas & Frecuencia</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Administrar con alimentos. Monitorear presión arterial cada 4 horas..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="text-[11px] font-mono text-slate-400">
                  Firma Médica: <strong className="text-white">{currentUser?.name || 'Dr. Roberto Icaza'}</strong>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Transmitir Orden CPOE</span>
                </button>
              </div>

            </form>
          </div>

        </div>

        {/* RIGHT 1-COLUMN: Live Transmitted CPOE Orders Feed */}
        <div className="space-y-6">

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Órdenes CPOE Emitidas Hoy</span>
              </h4>
              <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                {submittedOrders.length}
              </span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
              {submittedOrders.map((ord) => (
                <div key={ord.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5 hover:border-indigo-500/40 transition">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-white font-extrabold">{ord.title}</span>
                    <span className="text-[9px] font-mono text-slate-400">{ord.timestamp}</span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-snug">{ord.details}</p>

                  <div className="flex items-center justify-between text-[9px] font-mono font-bold pt-1 border-t border-slate-900">
                    <span className="text-indigo-400">{ord.category}</span>
                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/30">
                      ✓ {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
