import React, { useState } from 'react';
import { Order, TestResult, Patient } from '../../types';
import {
  AlertTriangle,
  Bell,
  PhoneCall,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  Activity,
  User
} from 'lucide-react';

interface DeltaPanicAlertsProps {
  orders: Order[];
  results: TestResult[];
  patients: Patient[];
}

export interface PanicAlertRecord {
  id: string;
  orderNumber: string;
  patientName: string;
  patientNationalId: string;
  testName: string;
  currentValue: string;
  previousValue?: string;
  unit: string;
  referenceRange: string;
  alertType: 'PANIC_HIGH' | 'PANIC_LOW' | 'DELTA_CHECK_FAIL';
  deltaPercentage?: number;
  doctorName: string;
  doctorPhone: string;
  status: 'PENDIENTE_NOTIFICACION' | 'NOTIFICADO_MÉDICO' | 'CONFIRMADO_LECTURA';
  notifiedAt?: string;
  notifiedBy?: string;
  notes?: string;
}

export const DeltaPanicAlerts: React.FC<DeltaPanicAlertsProps> = ({
  orders,
  results,
  patients
}) => {
  const [activeTab, setActiveTab] = useState<'panic' | 'delta'>('panic');

  // Simulated Panic & Delta Alert list
  const [alerts, setAlerts] = useState<PanicAlertRecord[]>([
    {
      id: 'alt-1',
      orderNumber: 'ORD-2026-0892',
      patientName: 'Juan Carlos Pérez',
      patientNationalId: '8-765-4321',
      testName: 'Química — Potasio en Suero (K+)',
      currentValue: '6.4',
      previousValue: '4.2',
      unit: 'mmol/L',
      referenceRange: '3.5 - 5.1 mmol/L',
      alertType: 'PANIC_HIGH',
      deltaPercentage: 52.3,
      doctorName: 'Dr. Roberto Icaza',
      doctorPhone: '+507 6612-9900',
      status: 'PENDIENTE_NOTIFICACION',
      notes: 'Valor crítico de riesgo para arritmia cardíaca. Notificación urgente requerida por norma MINSA.'
    },
    {
      id: 'alt-2',
      orderNumber: 'ORD-2026-0895',
      patientName: 'María Elena González',
      patientNationalId: '8-812-4432',
      testName: 'Hemograma — Plaquetas',
      currentValue: '18,000',
      previousValue: '145,000',
      unit: '10^3/uL',
      referenceRange: '150,000 - 450,000 /uL',
      alertType: 'PANIC_LOW',
      deltaPercentage: -87.5,
      doctorName: 'Dra. Carmen Rivera',
      doctorPhone: '+507 6788-1234',
      status: 'NOTIFICADO_MÉDICO',
      notifiedAt: '10/08/2026 10:15 AM',
      notifiedBy: 'Lic. Sofía Guardia (TM-3109)',
      notes: 'Notificado vía llamada telefónica. Dra. Rivera confirmó recepción y repetición de muestra.'
    },
    {
      id: 'alt-3',
      orderNumber: 'ORD-2026-0890',
      patientName: 'Carlos Alberto Rodríguez',
      patientNationalId: '4-721-9981',
      testName: 'Química — Glucosa en Ayunas',
      currentValue: '38',
      previousValue: '98',
      unit: 'mg/dL',
      referenceRange: '70 - 99 mg/dL',
      alertType: 'PANIC_LOW',
      deltaPercentage: -61.2,
      doctorName: 'Dr. Fernando Guardia',
      doctorPhone: '+507 6555-4321',
      status: 'CONFIRMADO_LECTURA',
      notifiedAt: '10/08/2026 09:40 AM',
      notifiedBy: 'Lic. Carlos Castillo',
      notes: 'Hipoglucemia severa. Paciente atendido en cuarto de urgencias.'
    }
  ]);

  const [selectedAlert, setSelectedAlert] = useState<PanicAlertRecord | null>(alerts[0]);
  const [callNotes, setCallNotes] = useState<string>('Se realizó llamada telefónica de lectura de retorno (Read-Back) según norma de calidad ISO 15189.');

  const handleNotifyDoctor = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'NOTIFICADO_MÉDICO',
              notifiedAt: new Date().toLocaleString('es-PA'),
              notifiedBy: 'Lic. Sofía Guardia (TM-3109)',
              notes: callNotes
            }
          : a
      )
    );
    alert('¡Llamada y notificación registradas en el registro de auditoría LIS Ley 81!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-950 via-rose-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-red-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-red-300 text-xs font-bold uppercase tracking-wider mb-1 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Fase 3 — Algoritmos Delta-Check & Alertas de Pánico Clínico</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Valores Críticos & Protocolo Read-Back ISO 15189
          </h1>
          <p className="text-red-100 text-sm mt-1 max-w-xl">
            Detección automática de desviaciones drásticas frente a históricos (Delta Check) y disparo de alertas prioritarias para el cuerpo médico.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-red-500/40 p-4 rounded-xl text-xs space-y-1">
          <div className="text-red-300 font-bold flex items-center space-x-1">
            <Bell className="w-4 h-4 text-red-400 animate-pulse" />
            <span>Alertas de Pánico Pendientes: {alerts.filter((a) => a.status === 'PENDIENTE_NOTIFICACION').length}</span>
          </div>
          <div className="text-slate-300">Norma MINSA Res. 1282 / Ley 81</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Alerts List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>Bandeja de Valores de Pánico & Delta Checks Fallidos</span>
              </h3>
              <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                Tiempo Máximo Notificación: 15 mins
              </span>
            </div>

            <div className="space-y-3">
              {alerts.map((alt) => {
                const isSelected = selectedAlert?.id === alt.id;
                return (
                  <div
                    key={alt.id}
                    onClick={() => setSelectedAlert(alt)}
                    className={`p-4 rounded-xl border transition cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-red-50/80 border-red-500 ring-2 ring-red-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{alt.patientName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        alt.status === 'PENDIENTE_NOTIFICACION'
                          ? 'bg-red-600 text-white animate-pulse'
                          : alt.status === 'NOTIFICADO_MÉDICO'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {alt.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 flex items-center justify-between">
                      <div>
                        <strong>{alt.testName}:</strong> <span className="text-red-700 font-mono font-black">{alt.currentValue} {alt.unit}</span> (Ref: {alt.referenceRange})
                      </div>
                      {alt.deltaPercentage && (
                        <span className="text-xs font-mono font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded">
                          Δ {alt.deltaPercentage > 0 ? `+${alt.deltaPercentage}%` : `${alt.deltaPercentage}%`}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>Médico: {alt.doctorName} ({alt.doctorPhone})</span>
                      <span>Orden: {alt.orderNumber}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Notification Panel & Protocol Action */}
        <div className="lg:col-span-5 space-y-4">
          {selectedAlert && (
            <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center space-x-1.5">
                  <PhoneCall className="w-4 h-4" />
                  <span>Protocolo de Comunicación Médica Urgentísima</span>
                </span>
                <span className="text-xs font-mono text-slate-400">{selectedAlert.orderNumber}</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div>Paciente: <strong className="text-white">{selectedAlert.patientName}</strong> ({selectedAlert.patientNationalId})</div>
                <div>Examen Crítico: <strong className="text-red-400">{selectedAlert.testName}</strong></div>
                <div className="text-base font-black font-mono text-amber-300">
                  Resultado Actual: {selectedAlert.currentValue} {selectedAlert.unit}
                </div>
                {selectedAlert.previousValue && (
                  <div className="text-slate-400 text-[11px]">
                    Histórico Previo: {selectedAlert.previousValue} {selectedAlert.unit} (Variación Significativa Delta)
                  </div>
                )}
                <div>Médico Responsable: <strong className="text-teal-300">{selectedAlert.doctorName}</strong></div>
                <div>Teléfono Contacto: <span className="font-mono text-emerald-400">{selectedAlert.doctorPhone}</span></div>
              </div>

              {/* Protocol Read-Back Action Form */}
              <div className="space-y-3 text-xs">
                <label className="font-bold text-slate-300 block">
                  Bitácora de Notificación & Confirmación Verbal (Read-Back):
                </label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 font-sans text-xs focus:ring-2 focus:ring-red-500"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => handleNotifyDoctor(selectedAlert.id)}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl text-xs transition shadow flex items-center justify-center space-x-2"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Registrar Llamada Médica</span>
                  </button>

                  <button
                    onClick={() => alert(`Mensaje WhatsApp expedido a ${selectedAlert.doctorPhone} con resumen de alerta!`)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-3 rounded-xl text-xs transition shadow flex items-center justify-center space-x-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              {selectedAlert.notifiedAt && (
                <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-xl text-[11px] text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Notificación Completada</span>
                  </div>
                  <div>Fecha/Hora: {selectedAlert.notifiedAt}</div>
                  <div>Registrado por: {selectedAlert.notifiedBy}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
