import React, { useState } from 'react';
import { Order, TestResult, Patient } from '../../types';
import { UserCheck, FileText, Download, Search, CheckCircle2, Plus, Stethoscope, ShieldAlert, Award } from 'lucide-react';

interface DoctorPortalProps {
  orders: Order[];
  results: TestResult[];
  onOpenPdf: (orderId: string) => void;
  onCreateOrder?: (newOrder: Order) => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  orders,
  results,
  onOpenPdf,
  onCreateOrder
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'requisition'>('orders');
  const [patientCedula, setPatientCedula] = useState('8-812-4432');
  const [patientName, setPatientName] = useState('María Elena González');
  const [icdCode, setIcdCode] = useState('E11.9 (Diabetes Mellitus Tipo 2)');
  const [selectedTests, setSelectedTests] = useState(['Hemograma Completo', 'Glucosa en Ayunas', 'Perfil Lipídico']);
  const [doctorNotes, setDoctorNotes] = useState('Evaluación médica de control trimestral. Ayuno 10 horas.');

  const handleCreateRequisition = () => {
    const newOrder: Order = {
      id: `ord-doc-${Date.now()}`,
      tenantId: 'lab-san-jose',
      branchId: 'branch-via-espana',
      orderNumber: `REQ-DOC-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: 'pat-1',
      patientName,
      patientNationalId: patientCedula,
      patientGender: 'F',
      patientAge: 32,
      doctorId: 'doc-icaza',
      doctorName: 'Dr. Roberto Icaza (MED-10492-PA)',
      priority: 'RUTINA',
      status: 'REGISTRADA',
      createdAt: new Date().toISOString(),
      totalAmount: 65.00,
      paymentStatus: 'PENDIENTE',
      specimens: [],
      testIds: ['test-hemograma', 'test-glucosa', 'test-perfil-lipidico']
    };

    if (onCreateOrder) {
      onCreateOrder(newOrder);
    }
    alert(`¡Requisición Electrónica ${newOrder.orderNumber} enviada al Laboratorio Clínico San José con éxito!`);
    setActiveTab('orders');
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-400 to-indigo-600"></div>
        <div>
          <div className="text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center space-x-2">
            <Stethoscope className="w-4 h-4 text-indigo-600" />
            <span>Portal Médico Referente Externo — Sistema de Salud Panamá</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Dr. Roberto Icaza (Idoneidad: MED-10492-PA)
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl font-medium">
            Consultorio Consultorios Médicos Paitilla — Requisiciones electrónicas de laboratorio y recepción inmediata de resultados validados.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-xs space-y-1 shrink-0">
          <div className="text-slate-900 font-bold flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Pacientes en Seguimiento: {orders.length}</span>
          </div>
          <div className="text-emerald-700 font-semibold">● Firma Digital SHA-256 Habilitada</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border border-slate-200/80 bg-white rounded-2xl p-1.5 shadow-sm space-x-2 w-fit">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Órdenes & Informes Médicos de Resultados</span>
        </button>

        <button
          onClick={() => setActiveTab('requisition')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'requisition' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Crear Requisición Médica Electrónica (CIE-10)</span>
        </button>
      </div>

      {/* TAB 1: ORDERS LIST & PDF */}
      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-12 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Exámenes Solicitados para sus Pacientes Referidos</span>
              </h3>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                Sincronizado en Tiempo Real
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">N° Orden</th>
                    <th className="p-3">Paciente</th>
                    <th className="p-3">Cédula</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Estado LIS</th>
                    <th className="p-3 text-right">Informe PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-indigo-900">{ord.orderNumber}</td>
                      <td className="p-3 font-bold text-slate-800">{ord.patientName}</td>
                      <td className="p-3 text-slate-500 font-mono">{ord.patientNationalId}</td>
                      <td className="p-3 text-slate-500">{new Date(ord.createdAt).toLocaleDateString('es-PA')}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          ord.status === 'VALIDADA_MED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.status === 'VALIDADA_MED' ? 'VALIDADO / DISPONIBLE' : 'EN PROCESO TÉCNICO'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onOpenPdf(ord.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-sm flex items-center space-x-1.5 ml-auto"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ELECTRONIC REQUISITION FORM */}
      {activeTab === 'requisition' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-12 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Emisión de Orden / Requisición Electrónica de Laboratorio</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Envío directo al LIS del Laboratorio San José con indicación diagnóstica CIE-10 para agilizar la admisión en recepción.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Cédula del Paciente (Panamá):</label>
                <input
                  type="text"
                  value={patientCedula}
                  onChange={(e) => setPatientCedula(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nombre Completo del Paciente:</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Código Diagnóstico CIE-10 / Indicación:</label>
                <input
                  type="text"
                  value={icdCode}
                  onChange={(e) => setIcdCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Observaciones / Indicaciones Especiales:</label>
                <input
                  type="text"
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-700 block text-xs">Exámenes Seleccionados para la Orden:</label>
              <div className="flex flex-wrap gap-2 text-xs">
                {selectedTests.map((t, idx) => (
                  <span key={idx} className="bg-indigo-50 border border-indigo-200 text-indigo-900 px-3.5 py-1.5 rounded-xl font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{t}</span>
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateRequisition}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl text-xs transition shadow-md flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Transmitir Requisición Electrónica Firmada al LIS</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
