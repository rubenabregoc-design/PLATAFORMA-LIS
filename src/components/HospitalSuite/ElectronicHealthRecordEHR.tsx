import React, { useState } from 'react';
import {
  FileText,
  User,
  Activity,
  Stethoscope,
  Plus,
  Send,
  Microscope,
  Pill,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Download,
  Flame,
  ShieldAlert,
  ChevronRight,
  BedDouble
} from 'lucide-react';
import { useHisStore } from '../../store/useHisStore';
import { useLisStore } from '../../store/useLisStore';
import { SoapNote, Order, MedicationOrder, Priority } from '../../types';
import { MOCK_TEST_CATALOG } from '../../data/mockData';

interface EhrProps {
  onOpenPdf?: (orderId: string) => void;
}

export const ElectronicHealthRecordEHR: React.FC<EhrProps> = ({ onOpenPdf }) => {
  const {
    admissions,
    selectedAdmissionId,
    setSelectedAdmissionId,
    beds,
    soapNotes,
    addSoapNote,
    medicationOrders,
    addMedicationOrder
  } = useHisStore();

  const { orders, results, addOrder, currentUser } = useLisStore();

  // Active admission
  const activeAdmission = admissions.find((a) => a.id === selectedAdmissionId) || admissions[0];
  const activeBed = beds.find((b) => b.id === activeAdmission?.bedId);

  // Sub-tabs in EHR
  const [subTab, setSubTab] = useState<'soap' | 'lab' | 'meds'>('soap');

  // New SOAP note state
  const [subjective, setSubjective] = useState<string>('');
  const [objective, setObjective] = useState<string>('');
  const [assessment, setAssessment] = useState<string>('');
  const [plan, setPlan] = useState<string>('');

  // New Lab Order state
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>(['test-hemograma']);
  const [orderPriority, setOrderPriority] = useState<Priority>('STAT');
  const [labNotes, setLabNotes] = useState<string>('Evaluación urgente de cabecera.');

  // New Med Order state
  const [drugName, setDrugName] = useState<string>('');
  const [dose, setDose] = useState<string>('');
  const [route, setRoute] = useState<MedicationOrder['route']>('INTRAVENOSA');
  const [frequency, setFrequency] = useState<MedicationOrder['frequency']>('CADA_8H');

  // Filtered lists for this admission
  const patientSoapNotes = soapNotes.filter((s) => s.admissionId === activeAdmission?.id);
  const patientLabOrders = orders.filter((o) => o.patientNationalId === activeAdmission?.patientNationalId || o.patientId === activeAdmission?.patientId);
  const patientMeds = medicationOrders.filter((m) => m.admissionId === activeAdmission?.id);

  const handleCreateSoap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdmission || !subjective || !assessment) {
      alert('Por favor complete los campos obligatorios de la nota SOAP.');
      return;
    }

    const newNote: SoapNote = {
      id: `soap-${Date.now()}`,
      admissionId: activeAdmission.id,
      patientId: activeAdmission.patientId,
      doctorId: currentUser?.id || 'doc-icaza',
      doctorName: currentUser?.name || 'Dr. Alejandro Icaza',
      doctorLicense: currentUser?.licenseNumber || 'MP-6612-PA',
      timestamp: new Date().toISOString(),
      subjective,
      objective,
      assessment,
      plan
    };

    addSoapNote(newNote);
    setSubjective('');
    setObjective('');
    setAssessment('');
    setPlan('');
    alert('Nota médica SOAP registrada en el expediente clínico.');
  };

  const handleDispatchLabOrder = () => {
    if (!activeAdmission || selectedTestIds.length === 0) return;

    const newOrder: Order = {
      id: `ord-his-${Date.now()}`,
      tenantId: activeAdmission.tenantId,
      branchId: activeAdmission.branchId,
      orderNumber: `HOSP-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: activeAdmission.patientId,
      patientName: activeAdmission.patientName,
      patientNationalId: activeAdmission.patientNationalId,
      patientGender: 'M',
      patientAge: 40,
      doctorId: currentUser?.id || 'doc-hosp',
      doctorName: activeAdmission.admittingDoctorName,
      priority: orderPriority,
      status: 'REGISTRADA',
      createdAt: new Date().toISOString(),
      totalAmount: 45.00,
      paymentStatus: 'ASEGURADORA',
      serviceOrigin: `${activeAdmission.ward} - Cama ${activeBed?.bedNumber || '01'}`,
      specimens: selectedTestIds.map((tId, idx) => ({
        id: `spc-${Date.now()}-${idx}`,
        orderId: `ord-his-${Date.now()}`,
        barcode: `BC-HOSP-${Math.floor(10000 + Math.random() * 90000)}`,
        tubeType: 'SUERO_ROJO',
        status: 'PENDIENTE'
      })),
      testIds: selectedTestIds
    };

    addOrder(newOrder);
    alert(`¡Orden ${newOrder.orderNumber} enviada al LIS con éxito desde Cama ${activeBed?.bedNumber}!`);
  };

  const handleCreateMedOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdmission || !drugName || !dose) return;

    const newMed: MedicationOrder = {
      id: `med-${Date.now()}`,
      admissionId: activeAdmission.id,
      patientId: activeAdmission.patientId,
      drugName,
      dose,
      route,
      frequency,
      startDate: new Date().toISOString(),
      orderedBy: activeAdmission.admittingDoctorName,
      status: 'ACTIVA'
    };

    addMedicationOrder(newMed);
    setDrugName('');
    setDose('');
    alert(`Medicamento ${newMed.drugName} prescrito e ingresado al Kardex.`);
  };

  if (!activeAdmission) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <h3 className="font-bold text-white">No hay admisiones hospitalarias activas</h3>
        <p className="text-xs text-slate-400 mt-1">Realice un ingreso desde el módulo de Triage de Urgencias.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient 360 Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Patient Details */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                {activeAdmission.ward} • Cama {activeBed?.bedNumber || 'S/A'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Cédula: <strong className="text-white">{activeAdmission.patientNationalId}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activeAdmission.patientName}
            </h1>

            <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3">
              <span>Médico Tratante: <strong className="text-indigo-300">{activeAdmission.admittingDoctorName}</strong></span>
              <span>• Ingreso: <strong>{new Date(activeAdmission.admissionDate).toLocaleDateString('es-PA')}</strong></span>
            </div>

            {/* Diagnosis & Allergies */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] bg-slate-800 text-slate-200 px-3 py-1 rounded-xl border border-slate-700">
                DX: <strong>{activeAdmission.primaryDiagnosisIcd10}</strong>
              </span>
              {activeAdmission.allergies.map((allg, idx) => (
                <span key={idx} className="text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-xl font-bold flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Alergia: {allg}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Patient Selector for Doctors */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl shrink-0 space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 block">Cambiar Paciente Hospitalizado</label>
            <select
              value={activeAdmission.id}
              onChange={(e) => setSelectedAdmissionId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              {admissions.map((adm) => (
                <option key={adm.id} value={adm.id}>
                  [{adm.ward}] {adm.patientName} ({adm.patientNationalId})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border border-slate-800 bg-slate-900 rounded-2xl p-1.5 shadow-lg space-x-2 w-fit">
        <button
          onClick={() => setSubTab('soap')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'soap' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Evolución Médica (Notas SOAP)</span>
        </button>

        <button
          onClick={() => setSubTab('lab')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'lab' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Microscope className="w-4 h-4 text-teal-400" />
          <span>Laboratorio LIS • Órdenes & Resultados</span>
        </button>

        <button
          onClick={() => setSubTab('meds')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'meds' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Pill className="w-4 h-4 text-amber-400" />
          <span>Prescripción & Farmacia Hospitalaria</span>
        </button>
      </div>

      {/* SUB-TAB 1: NOTAS SOAP */}
      {subTab === 'soap' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form: Nueva Nota SOAP */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Plus className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">Nueva Nota de Evolución Diaria (Pase de Visita)</h3>
            </div>

            <form onSubmit={handleCreateSoap} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  [S] Subjetivo (Síntomas referidos por el paciente)
                </label>
                <textarea
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  placeholder="Paciente refiere alivio del dolor, tolerancia oral..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  [O] Objetivo (Examen físico, constantes vitales y hallazgos)
                </label>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="PA 120/80, afebril, campos pulmonares limpios, abdomen blando..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  [A] Análisis (Juicio clínico y evolución del cuadro)
                </label>
                <textarea
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  placeholder="Evolución clínica satisfactoria en respuesta a antibioterapia..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  [P] Plan (Conducta terapéutica, ajustes y exámenes solicitados)
                </label>
                <textarea
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  placeholder="1. Continuar antibiótico. 2. Solicitar hemograma de control. 3. Dieta blanda..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
              >
                Firmar y Guardar Nota SOAP
              </button>
            </form>
          </div>

          {/* Historial de Notas SOAP */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Historial de Evolución Médica ({patientSoapNotes.length})</span>
            </h3>

            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {patientSoapNotes.map((note) => (
                <div key={note.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-900 pb-2">
                    <span className="font-bold text-indigo-300">{note.doctorName} ({note.doctorLicense})</span>
                    <span>{new Date(note.timestamp).toLocaleString('es-PA')}</span>
                  </div>

                  <div className="space-y-1.5 text-slate-300">
                    <p><strong className="text-white">[S]:</strong> {note.subjective}</p>
                    <p><strong className="text-white">[O]:</strong> {note.objective}</p>
                    <p><strong className="text-white">[A]:</strong> {note.assessment}</p>
                    <p><strong className="text-white">[P]:</strong> {note.plan}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: INTEGRACIÓN LIS */}
      {subTab === 'lab' && (
        <div className="space-y-6">
          {/* Dispatcher Card */}
          <div className="bg-slate-900 border border-teal-500/30 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Microscope className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-sm">Solicitud Directa de Exámenes de Laboratorio al LIS</h3>
              </div>
              <span className="text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-full font-bold">
                Interoperabilidad Nativa HIS $\leftrightarrow$ LIS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Exámenes del Catálogo LIS</label>
                <select
                  multiple
                  value={selectedTestIds}
                  onChange={(e) => setSelectedTestIds(Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white h-28 focus:outline-none focus:border-teal-500"
                >
                  {MOCK_TEST_CATALOG.map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.category}] {item.name} (${item.price.toFixed(2)})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 block mt-1">Presione Ctrl para seleccionar varios exámenes.</span>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Prioridad de Procesamiento</label>
                <div className="space-y-1.5">
                  {(['STAT', 'URGENTE', 'RUTINA'] as const).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setOrderPriority(p)}
                      className={`w-full p-2 rounded-xl text-left font-bold transition cursor-pointer border ${
                        orderPriority === p
                          ? p === 'STAT'
                            ? 'bg-rose-500 text-white border-rose-600'
                            : 'bg-teal-500 text-slate-950 border-teal-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {p === 'STAT' ? '⚡ STAT (Inmediata / Cuidados Críticos)' : p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Procedencia Clínica Pre-asignada</label>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 font-mono">
                    {activeAdmission.ward} - Cama {activeBed?.bedNumber || '01'}
                  </div>
                </div>

                <button
                  onClick={handleDispatchLabOrder}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl shadow-lg shadow-teal-500/20 transition cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Emitir Orden al LIS en Tiempo Real</span>
                </button>
              </div>
            </div>
          </div>

          {/* Laboratory Results Table in EHR */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Órdenes & Resultados de Laboratorio de este Paciente ({patientLabOrders.length})</span>
              <span className="text-[10px] text-teal-400 font-bold">Sincronización Automática</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 rounded-l-xl">N° Orden LIS</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Prioridad</th>
                    <th className="p-3">Estado LIS</th>
                    <th className="p-3">Resultados Analíticos Validados</th>
                    <th className="p-3 rounded-r-xl text-right">Informe Oficial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {patientLabOrders.map((ord) => {
                    const ordResults = results.filter((r) => r.orderId === ord.id);
                    return (
                      <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-mono font-bold text-teal-300">{ord.orderNumber}</td>
                        <td className="p-3 text-slate-400">{new Date(ord.createdAt).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            ord.priority === 'STAT' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {ord.priority}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            ord.status === 'VALIDADA_MED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {ordResults.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {ordResults.map((res) => (
                                <span
                                  key={res.id}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                                    res.flag === 'CRITICO_ALTO' || res.flag === 'CRITICO_BAJO'
                                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                                      : res.flag === 'ALTO' || res.flag === 'BAJO'
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                      : 'bg-slate-800 text-slate-300 border-slate-700'
                                  }`}
                                >
                                  {res.parameterName}: {res.value} {res.unit}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">Procesando en analizador...</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onOpenPdf && onOpenPdf(ord.id)}
                            className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-[10px] font-bold transition cursor-pointer"
                          >
                            Ver PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PRESCRIPCIÓN MÉDICA */}
      {subTab === 'meds' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center space-x-2">
              <Pill className="w-4 h-4 text-amber-400" />
              <span>Prescribir Nuevo Medicamento</span>
            </h3>

            <form onSubmit={handleCreateMedOrder} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Fármaco / Principio Activo</label>
                <input
                  type="text"
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  placeholder="Ej: Ceftriaxona, Enoxaparina, Furosemida"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Dosis</label>
                  <input
                    type="text"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    placeholder="Ej: 1 g, 40 mg"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Vía de Administración</label>
                  <select
                    value={route}
                    onChange={(e) => setRoute(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="INTRAVENOSA">Intravenosa (IV)</option>
                    <option value="ORAL">Oral (VO)</option>
                    <option value="SUBCUTANEA">Subcutánea (SC)</option>
                    <option value="INTRAMUSCULAR">Intramuscular (IM)</option>
                    <option value="INHALATORIA">Inhalatoria</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Frecuencia de Dosificación</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="CADA_6H">Cada 6 Horas</option>
                  <option value="CADA_8H">Cada 8 Horas</option>
                  <option value="CADA_12H">Cada 12 Horas</option>
                  <option value="CADA_24H">Cada 24 Horas</option>
                  <option value="STAT_UNICA">STAT Dosis Única</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                Agregar a Indicaciones y Kardex
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center space-x-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Medicamentos Activos en Hoja de Indicaciones ({patientMeds.length})</span>
            </h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {patientMeds.map((med) => (
                <div key={med.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-white text-sm">{med.drugName} ({med.dose})</div>
                    <div className="text-[11px] text-amber-300">Vía: {med.route} • Frecuencia: {med.frequency}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Prescrito por: {med.orderedBy}</div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black">
                    ACTIVO
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
