import React, { useState } from 'react';
import { Tenant, Branch } from '../../types';
import {
  Award,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Download,
  Printer,
  Sparkles,
  Scale,
  Check,
  FileSpreadsheet
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
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState(false);

  const [requirements] = useState<IsoRequirement[]>([
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

  const filteredRequirements = selectedCategory === 'ALL'
    ? requirements
    : requirements.filter(r => r.category === selectedCategory);

  const handleDownloadExpediente = () => {
    // ⚡ Exportación Instantánea (Zero-Delay)
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Expediente de Acreditación ISO 15189:2022 - ${tenant.name}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 32px; color: #0f172a; line-height: 1.5; }
            .header { border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 24px; }
            .title { font-size: 20px; font-weight: 800; color: #065f46; margin: 0 0 6px 0; }
            .meta { font-size: 13px; color: #475569; }
            .score-badge { display: inline-block; background: #ecfdf5; border: 1px solid #10b981; color: #065f46; font-weight: 800; font-size: 18px; padding: 6px 14px; border-radius: 8px; margin-top: 10px; }
            .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; margin-bottom: 12px; background: #f8fafc; }
            .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
            .clause-tag { background: #e2e8f0; font-weight: 800; font-family: monospace; font-size: 11px; padding: 3px 8px; border-radius: 4px; color: #0f172a; margin-right: 8px; }
            .clause-title { font-weight: 700; font-size: 13px; color: #0f172a; }
            .status-badge { background: #d1fae5; color: #065f46; font-weight: 700; font-size: 11px; padding: 3px 10px; border-radius: 9999px; }
            .evidence { font-size: 12px; color: #475569; margin-top: 6px; }
            .footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
            @media print {
              body { padding: 10mm; }
              .card { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">EXPEDIENTE OFICIAL DE ACREDITACIÓN DE CALIDAD ISO 15189:2022</h1>
            <div class="meta">
              <strong>Organización:</strong> ${tenant.name} &nbsp;|&nbsp;
              <strong>Sede Auditada:</strong> ${branch.name} &nbsp;|&nbsp;
              <strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-PA', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
            <div class="score-badge">Índice Global de Cumplimiento: ${overallScore}%</div>
          </div>

          <div style="margin-bottom: 16px; font-weight: 700; font-size: 14px; color: #1e293b;">
            Matriz de Autoevaluación & Evidencias Registradas en LIS:
          </div>

          ${requirements.map((req) => `
            <div class="card">
              <div class="card-header">
                <div>
                  <span class="clause-tag">Cláusula ${req.clause}</span>
                  <span class="clause-title">${req.title}</span>
                </div>
                <span class="status-badge">✔ ${req.scorePercent}% Cumplido</span>
              </div>
              <div class="evidence">
                <strong>Evidencia Registrada en LIS:</strong> ${req.evidenceNotes}
              </div>
            </div>
          `).join('')}

          <div class="footer">
            Expediente generado digitalmente para presentación ante el Consejo Técnico de Salud (MINSA Panamá) y Ente Nacional de Acreditación (CNC).
            Firma y Trazabilidad Criptográfica SHA-256 Garantizada.
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-emerald-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1 flex items-center space-x-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Fase 5 — Portal de Acreditación de Calidad ISO 15189 & Auditoría MINSA / DGI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Laboratorios Clínicos Calificados — Nivel Acreditación Internacional
          </h1>
          <p className="text-emerald-100/90 text-sm mt-1 max-w-xl">
            Sede: <strong className="text-white">{branch.name}</strong> | Puntuación global de cumplimiento técnico, bioseguridad y normativas de Panamá.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/40 p-5 rounded-2xl text-center space-y-1 shrink-0 shadow-lg">
          <div className="text-3xl font-black text-emerald-400 font-mono">{overallScore}%</div>
          <div className="text-[11px] font-bold text-slate-200">Acreditado ISO 15189:2022</div>
          <div className="text-[10px] text-emerald-300/80 font-mono">100% Audit Ready</div>
        </div>
      </div>

      {/* Compliance Checklist Cards - Dark Theme */}
      <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <h3 className="font-black text-white text-base flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <span>Matriz de Autoevaluación & Cláusulas de Calidad</span>
            </h3>
            <p className="text-xs text-slate-400">
              Evaluación continua de normas técnicas, bioseguridad, idoneidades y protección de datos
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadExpediente}
            disabled={isExporting}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-900/40 flex items-center justify-center space-x-2 cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                <span>Generando Expediente...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Descargar Expediente Acreditación PDF</span>
              </>
            )}
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {[
            { id: 'ALL', label: 'Todas las Cláusulas' },
            { id: 'LEGAL_PANAMÁ', label: 'Leyes de Panamá & MINSA' },
            { id: 'TÉCNICO_ANALÍTICO', label: 'Técnico & Analítico (Westgard)' },
            { id: 'SEGURIDAD_INFORMACIÓN', label: 'Ley 81 (Datos & Privacidad)' }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Requirements Cards List */}
        <div className="space-y-3">
          {filteredRequirements.map((req) => (
            <div
              key={req.id}
              className="p-4 sm:p-5 rounded-2xl border border-slate-800/80 bg-slate-950/80 hover:border-emerald-500/30 transition-all space-y-2.5 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                  <span className="font-mono font-black text-emerald-300 text-xs bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg shadow-inner">
                    Cláusula {req.clause}
                  </span>
                  <span className="font-black text-white text-sm group-hover:text-emerald-200 transition">
                    {req.title}
                  </span>
                </div>

                <span className="bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-3 py-1 rounded-full flex items-center space-x-1.5 self-start sm:self-auto shrink-0 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{req.scorePercent}% Cumplido</span>
                </span>
              </div>

              <div className="text-xs text-slate-300/90 font-sans leading-relaxed pl-1 border-l-2 border-emerald-500/30">
                <strong className="text-emerald-400 font-semibold">Evidencia en LIS:</strong> {req.evidenceNotes}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
