import React, { useState } from 'react';
import { Patient, Order, TestCatalogItem } from '../../types';
import { UserPlus, Search, ShieldCheck, FileText, Plus, CheckCircle2, DollarSign, AlertCircle, QrCode } from 'lucide-react';

interface ReceptionDashboardProps {
  patients: Patient[];
  testCatalog: TestCatalogItem[];
  orders: Order[];
  onCreateOrder: (newOrder: Order, newPatient?: Patient) => void;
}

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
  patients,
  testCatalog,
  orders,
  onCreateOrder
}) => {
  const [searchId, setSearchId] = useState<string>('8-812-4432');
  const [foundPatient, setFoundPatient] = useState<Patient | null>(patients[0]);

  // Form states for new patient or new order
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>(['test-hemograma', 'test-glucosa']);
  const [isStat, setIsStat] = useState<boolean>(false);
  const [ley81Consent, setLey81Consent] = useState<boolean>(true);

  const handleSearchPatient = () => {
    const match = patients.find((p) => p.nationalId.trim().toLowerCase() === searchId.trim().toLowerCase());
    if (match) {
      setFoundPatient(match);
    } else {
      setFoundPatient(null);
    }
  };

  const handleCreateOrderSubmit = () => {
    if (!foundPatient) {
      alert('Primero registre o busque el paciente verificado.');
      return;
    }

    if (!ley81Consent) {
      alert('Debe aceptar el consentimiento informado de Protección de Datos (Ley 81 de Panamá).');
      return;
    }

    const selectedTests = testCatalog.filter((t) => selectedTestIds.includes(t.id));
    const totalAmount = selectedTests.reduce((sum, t) => sum + t.price, 0);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      tenantId: 'lab-san-jose',
      branchId: 'branch-via-espana',
      orderNumber: `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      patientId: foundPatient.id,
      patientName: `${foundPatient.firstName} ${foundPatient.lastName}`,
      patientNationalId: foundPatient.nationalId,
      patientGender: foundPatient.gender,
      patientAge: 32,
      priority: isStat ? 'STAT' : 'RUTINA',
      status: 'TOMADA',
      createdAt: new Date().toISOString(),
      totalAmount,
      paymentStatus: 'PAGADO',
      specimens: [
        {
          id: `sp-${Date.now()}-1`,
          orderId: `ord-${Date.now()}`,
          barcode: `BC-${Math.floor(800000 + Math.random() * 100000)}`,
          tubeType: 'EDTA_MORADO',
          status: 'PENDIENTE'
        }
      ],
      testIds: selectedTestIds
    };

    onCreateOrder(newOrder);
    alert(`¡Orden ${newOrder.orderNumber} creada e impresa con éxito! Cód. Barras generado.`);
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-600"></div>
        <div>
          <div className="text-purple-700 text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-purple-600" />
            <span>Dashboard — Recepción, Atención & Admisión de Pacientes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Registro de Pacientes, Órdenes y Facturación POS
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl font-medium">
            Búsqueda e integración con Padrón Panameño (Deduplicación por Cédula/Pasaporte) y generación de etiquetas con código de barras.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-xs shrink-0 space-y-0.5">
          <div className="text-slate-900 font-bold">Ana Lucía Morales</div>
          <div className="text-purple-700 font-semibold">Caja N° 1 — Sede Vía España</div>
        </div>
      </div>

      {/* Bento Grid Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bento Cell 1: Patient Search & Deduplication (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Search className="w-4 h-4 text-purple-600" />
                <span>Búsqueda de Paciente (Padrón Cédula)</span>
              </h3>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full">
                Panamá LIS
              </span>
            </div>

            <div className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Número de Cédula o Pasaporte:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej. 8-812-4432"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold w-full focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSearchPatient}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm shrink-0"
                  >
                    Buscar
                  </button>
                </div>
              </div>

              {foundPatient ? (
                <div className="bg-purple-50/80 border border-purple-200 p-4 rounded-2xl text-xs space-y-2.5 mt-4">
                  <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
                    <span>{foundPatient.firstName} {foundPatient.lastName}</span>
                    <span className="text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      Verificado
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-600 text-[11px]">
                    <div>Cédula: <strong className="font-mono text-slate-900">{foundPatient.nationalId}</strong></div>
                    <div>Teléfono: <strong className="text-slate-900">{foundPatient.phone}</strong></div>
                    <div>Email: <strong className="text-slate-900">{foundPatient.email}</strong></div>
                    <div className="pt-1 border-t border-purple-200/60 text-emerald-800 font-semibold flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Consentimiento Ley 81 Registrado</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Paciente no encontrado. Complete los datos para nuevo ingreso en el LIS.</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100">
            Deduplicación automática activada previniendo dobles registros.
          </div>
        </div>

        {/* Bento Cell 2: Order Creation & Test Selector (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Plus className="w-4 h-4 text-purple-600" />
              <span>Nueva Orden Médica & Facturación Electrónica POS</span>
            </h3>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
              Cód. Barras Auto-Generado
            </span>
          </div>

          {/* Test Selector Grid */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Seleccionar Exámenes del Catálogo Oficial:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {testCatalog.map((t) => {
                const isSelected = selectedTestIds.includes(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTestIds(selectedTestIds.filter((id) => id !== t.id));
                      } else {
                        setSelectedTestIds([...selectedTestIds, t.id]);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-purple-50/90 border-purple-600 font-bold text-purple-950 shadow-sm ring-1 ring-purple-500/20'
                        : 'bg-slate-50/80 border-slate-200/80 text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{t.name} ({t.code})</div>
                      <div className="text-[10px] text-slate-500 font-normal">Tubo: {t.tubeType}</div>
                    </div>
                    <div className="font-mono text-sm font-black text-slate-900">${t.price.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority & Ley 81 Compliance Options */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isStat}
                  onChange={(e) => setIsStat(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span className={isStat ? 'text-rose-700 font-extrabold' : ''}>Prioridad STAT / Urgente (Muestra Prioritaria)</span>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-200/80">
              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ley81Consent}
                  onChange={(e) => setLey81Consent(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span>
                  <strong>Ley 81 de Panamá:</strong> El paciente autoriza el tratamiento de sus datos clínicos exclusivamente para su diagnóstico de laboratorio.
                </span>
              </label>
            </div>
          </div>

          {/* Total & Submit */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <div>
              <span className="text-xs text-slate-500 block">Monto Total a Cobrar:</span>
              <div className="text-2xl font-black text-slate-900 font-mono">
                ${testCatalog.filter((t) => selectedTestIds.includes(t.id)).reduce((s, t) => s + t.price, 0).toFixed(2)} USD
              </div>
            </div>

            <button
              onClick={handleCreateOrderSubmit}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-2xl text-xs transition shadow-md flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Generar Orden, Cobrar e Imprimir Etiquetas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
