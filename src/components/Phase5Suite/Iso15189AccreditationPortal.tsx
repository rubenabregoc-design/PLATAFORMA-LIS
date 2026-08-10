import React, { useState } from 'react';
import { Tenant, Branch } from '../../types';
import {
  Award,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  AlertCircle,
  Download,
  BarChart2,
  BookmarkCheck,
  Scale
} from 'lucide-react';

interface Iso15189AccreditationPortalProps {
  tenant: Tenant;
  branch: Branch;
}

export interface IsoRequirement {
  id: string;
  clause: string;
  title: string;
  category: 'GESTIÓN_CALIDAD' | 'TÉCNICO_ANALÍTICO' | 'LEGAL_PANAMÁ' | 'SEGURIDAD_INFORMACIÓN';
  complianceStatus: 'CUMPLIMIENTO_TOTAL' | 'CUMPLIMIENTO_PARCIAL' | 'EN_REVISIÓN';
  scorePercent: number;
  evidenceNotes: string;
}

export const Iso15189AccreditationPortal: React.FC<Iso15189AccreditationPortalProps> = ({
  tenant,
  branch
}) => {
  const [requirements, setRequirements] = useState<IsoRequirement[]>([
    {
      id: 'iso-01',
      clause: '4.1.2',
      title: 'Idoneidad de Personal & Firma Técnica (Leyes Consejo Técnico de Salud Panamá)',
      category: 'LEGAL_PANAMÁ',
      complianceStatus: 'CUMPLIMIENTO_TOTAL',
      scorePercent: 100,
      evidenceNotes: 'Idoneidades de Tecnólogos Médicos registradas con número de registro del Consejo Técnico de Salud.'
    },
    {
      id: 'iso-02',
      clause: '5.3.1',
      title: 'Trazabilidad Metrológica & Control de Calidad Interno (Reglas de Westgard)',
      category: 'TÉCNICO_ANALÍTICO',
      complianceStatus: 'CUMPLIMIENTO_TOTAL',
      scorePercent: 98,
      evidenceNotes: 'Gráficas Levey-Jennings automatizadas con detección inmediata de violaciones 1_3s y 2_2s.'
    },
    {
      id: 'iso-03',
      clause: '4.13',
      title: 'Protección de Datos Sensibles del Paciente (Ley 81 de 2019 de Panamá)',
      category: 'SEGURIDAD_INFORMACIÓN',
      complianceStatus: 'CUMPLIMIENTO_TOTAL',
      scorePercent: 100,
      evidenceNotes: 'Cifrado de datos en reposo, firmas de consentimiento informado y bitácora de auditoría SHA-256.'
    },
    {
      id: 'iso-04',
      clause: '5.5.2',
      title: 'Protocolo de Comunicación de Valores Críticos (Read-Back Obligatorio)',
      category: 'TÉCNICO_ANALÍTICO',
      complianceStatus: 'CUMPLIMIENTO_TOTAL',
      scorePercent: 96,
      evidenceNotes: 'Notificación telefónica/WhatsApp con confirmación de lectura repetida grabada en el LIS.'
    },
    {
      id: 'iso-05',
      clause: '4.14.1',
      title: 'Facturación Electrónica & Cumplimiento DGI Panamá (Decreto Ley 256)',
      category: 'LEGAL_PANAMÁ',
      complianceStatus: 'CUMPLIMIENTO_TOTAL',
      scorePercent: 100,
      evidenceNotes: 'Integración POS con firma de código CUFE, código QR DGI e impositiva Ley 6 para jubilados.'
    }
  ]);

  const overallScore = Math.round(
    requirements.reduce((acc, r) => acc + r.scorePercent, 0) / requirements.length
  );

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-emerald-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1 flex items-center space-x-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Fase 5 — Portal de Acreditación de Calidad ISO 15189 & Auditoría MINSA / DGI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Laboratorios Clínicos Calificados — Nivel Acreditación Internacional
          </h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
            Sede: <strong className="text-white">{branch.name}</strong> | Puntuación global de cumplimiento técnico, bioseguridad y normativas de Panamá.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/40 p-5 rounded-2xl text-center space-y-1 shrink-0">
          <div className="text-3xl font-black text-emerald-400 font-mono">{overallScore}%</div>
          <div className="text-[11px] font-bold text-slate-200">Acreditado ISO 15189:2022</div>
        </div>
      </div>

      {/* Compliance Checklist Cards */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <span>Matriz de Autoevaluación & Cláusulas de Calidad</span>
          </h3>

          <button
            onClick={() => alert('Generando Informe Completo para Consejo Técnico de Salud y Ente Nacional de Acreditación (CNC)...')}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Expediente Acreditación PDF</span>
          </button>
        </div>

        <div className="space-y-3">
          {requirements.map((req) => (
            <div key={req.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-black text-slate-900 text-xs bg-slate-200 px-2 py-0.5 rounded">
                    Cláusula {req.clause}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{req.title}</span>
                </div>

                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{req.scorePercent}% Cumplido</span>
                </span>
              </div>

              <div className="text-xs text-slate-600 font-sans">
                <strong>Evidencia en LIS:</strong> {req.evidenceNotes}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
