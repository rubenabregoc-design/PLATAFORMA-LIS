import React, { useState } from 'react';
import { Order, TestResult, Patient } from '../../types';
import {
  ShieldAlert,
  MapPin,
  FileCheck2,
  Download,
  Activity,
  Send,
  Building,
  CheckCircle2,
  AlertCircle,
  BarChart3
} from 'lucide-react';

interface MinsaEpidemiologyProps {
  orders: Order[];
  results: TestResult[];
  patients: Patient[];
}

export interface EpiNotificationRecord {
  id: string;
  patientName: string;
  patientNationalId: string;
  patientAge: number;
  patientGender: string;
  province: string;
  district: string;
  diseaseName: string;
  icd10Code: string;
  labConfirmation: string;
  confirmationDate: string;
  minsaStatus: 'PENDIENTE_ENVIO' | 'NOTIFICADO_MINSA' | 'VALIDADO_DEPS';
  epiFormNumber: string;
}

export const MinsaEpidemiology: React.FC<MinsaEpidemiologyProps> = ({
  orders,
  results,
  patients
}) => {
  const [epiRecords, setEpiRecords] = useState<EpiNotificationRecord[]>([
    {
      id: 'epi-01',
      patientName: 'Juan Carlos Pérez',
      patientNationalId: '8-765-4321',
      patientAge: 45,
      patientGender: 'M',
      province: 'Panamá Metro',
      district: 'Bella Vista',
      diseaseName: 'Dengue Serotipo DENV-2 (NS1 Positivo)',
      icd10Code: 'A90 (Fiebre del Dengue)',
      labConfirmation: 'Prueba Rápida Dengue NS1 Ag & IgM Positivo',
      confirmationDate: '10/08/2026',
      minsaStatus: 'PENDIENTE_ENVIO',
      epiFormNumber: 'EPI-1-2026-0812'
    },
    {
      id: 'epi-02',
      patientName: 'Ana María Rodríguez',
      patientNationalId: '4-123-9988',
      patientAge: 29,
      patientGender: 'F',
      province: 'Chiriquí',
      district: 'David',
      diseaseName: 'Malaria por Plasmodium vivax',
      icd10Code: 'B51',
      labConfirmation: 'Gota Gruesa — Parásitos detectados 12,000/uL',
      confirmationDate: '09/08/2026',
      minsaStatus: 'NOTIFICADO_MINSA',
      epiFormNumber: 'EPI-1-2026-0799'
    },
    {
      id: 'epi-03',
      patientName: 'Roberto Gómez',
      patientNationalId: '3-88-1200',
      patientAge: 52,
      patientGender: 'M',
      province: 'Colón',
      district: 'Cristóbal',
      diseaseName: 'Tuberculosis Pulmonar (Baciloscopia +)',
      icd10Code: 'A15.0',
      labConfirmation: 'Baciloscopia de Esputo (BK 3+)',
      confirmationDate: '08/08/2026',
      minsaStatus: 'VALIDADO_DEPS',
      epiFormNumber: 'EPI-1-2026-0710'
    }
  ]);

  const [selectedProvince, setSelectedProvince] = useState<string>('TODAS');

  const provincesPanama = [
    { name: 'Panamá Metro', cases: 14 },
    { name: 'Chiriquí', cases: 8 },
    { name: 'Colón', cases: 6 },
    { name: 'Panamá Oeste', cases: 11 },
    { name: 'Veraguas', cases: 3 },
    { name: 'San Miguelito', cases: 9 }
  ];

  const handleTransmitMinsa = (recordId: string) => {
    setEpiRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, minsaStatus: 'NOTIFICADO_MINSA' } : r))
    );
    alert('¡Formulario EPI-1 transmitido vía HL7 FHIR al Portal de Vigilancia Epidemiológica del MINSA Panamá!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-emerald-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-teal-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-teal-300 text-xs font-bold uppercase tracking-wider mb-1 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-teal-400" />
            <span>Fase 3 — Vigilancia Epidemiológica MINSA & CSS Panamá</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Notificación Obligatoria de Enfermedades (Formulario EPI-1)
          </h1>
          <p className="text-teal-100 text-sm mt-1 max-w-xl">
            Automatización de reportes epidemiológicos según norma del Departamento de Epidemiología del Ministerio de Salud (MINSA).
          </p>
        </div>

        <div className="bg-slate-950/80 border border-teal-500/40 p-4 rounded-xl text-xs space-y-1">
          <div className="text-teal-300 font-bold flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Conexión Servidor FHIR MINSA: Activa</span>
          </div>
          <div className="text-slate-300">Normativa Decreto Ejecutivo N° 1617</div>
        </div>
      </div>

      {/* Map & Province Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Province Heatmap Stats */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            <span>Distribución de Casos Positivos por Región de Salud</span>
          </h3>

          <div className="space-y-3">
            {provincesPanama.map((prov, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>{prov.name}</span>
                  <span className="text-teal-700 font-mono">{prov.cases} casos activos</span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(prov.cases / 15) * 100}%` }}
                    className="bg-teal-600 h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: EPI-1 Notification Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <FileCheck2 className="w-5 h-5 text-teal-600" />
              <span>Registros de Notificación Inmediata (MINSA EPI-1)</span>
            </h3>

            <button
              onClick={() => alert('Generando paquete ZIP comprimido con formularios EPI-1 en formato JSON FHIR...')}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Paquete FHIR</span>
            </button>
          </div>

          <div className="space-y-3">
            {epiRecords.map((rec) => (
              <div key={rec.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{rec.diseaseName}</span>
                    <span className="text-xs text-slate-500 font-mono ml-2">[{rec.icd10Code}]</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    rec.minsaStatus === 'PENDIENTE_ENVIO'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {rec.minsaStatus}
                  </span>
                </div>

                <div className="text-xs text-slate-700">
                  Paciente: <strong>{rec.patientName}</strong> (Cédula: {rec.patientNationalId}) | {rec.patientAge} años ({rec.patientGender})
                </div>

                <div className="text-[11px] text-slate-500 flex justify-between items-center border-t border-slate-200 pt-2">
                  <span>Región: {rec.province} ({rec.district})</span>
                  <span>Formulario: {rec.epiFormNumber}</span>
                  {rec.minsaStatus === 'PENDIENTE_ENVIO' && (
                    <button
                      onClick={() => handleTransmitMinsa(rec.id)}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1 rounded text-xs transition shadow"
                    >
                      Transmitir al MINSA
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
