import React from 'react';
import { Order, TestResult, Patient, Tenant, Branch } from '../types';
import { FileText, Printer, Download, CheckCircle2, QrCode, ShieldCheck, X } from 'lucide-react';

interface PdfReportPreviewProps {
  order: Order;
  patient: Patient;
  results: TestResult[];
  tenant: Tenant;
  branch: Branch;
  onClose: () => void;
}

export const PdfReportPreview: React.FC<PdfReportPreviewProps> = ({
  order,
  patient,
  results,
  tenant,
  branch,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-sm">Vista Previa de Informe Clínico Oficial (PDF Report)</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition flex items-center space-x-1.5 shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Exportar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official PDF Document Layout */}
        <div className="p-4 sm:p-8 md:p-10 space-y-6 sm:space-y-8 text-slate-900 font-sans leading-relaxed" id="printable-report">
          {/* Header Letterhead */}
          <div className="border-b-2 border-teal-600 pb-4 sm:pb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-lg sm:text-xl font-extrabold text-teal-800 tracking-tight">{tenant.name}</div>
              <div className="text-[10px] sm:text-xs text-slate-600 font-medium mt-1">{branch.name} — {branch.address}</div>
              <div className="text-[10px] sm:text-xs text-slate-500">Tel: {branch.phone} | RUC: {tenant.ruc} DV: {tenant.dv}</div>
              <div className="text-[10px] sm:text-xs text-emerald-700 font-bold mt-1">● Laboratorio Clínico Autorizado</div>
            </div>

            <div className="text-left sm:text-right">
              <div className="bg-teal-50 border border-teal-200 text-teal-900 font-mono font-bold px-2 py-1 rounded-lg text-[11px] sm:text-sm">
                N° Orden: {order.orderNumber}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-1">Emitido: {new Date().toLocaleDateString('es-PA')}</div>
            </div>
          </div>

          {/* Patient Demographic Information Block */}
          <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-[10px] sm:text-xs">
            <div>
              <span className="text-slate-500 block">Paciente:</span>
              <strong className="text-slate-900 text-[11px] sm:text-sm">{patient.firstName} {patient.lastName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Cédula / Pasaporte:</span>
              <strong className="text-slate-900">{patient.nationalId}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Edad / Sexo:</span>
              <strong className="text-slate-900">{order.patientAge}A / {patient.gender}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Médico:</span>
              <strong className="text-slate-900 truncate block">{order.doctorName || 'Particular'}</strong>
            </div>
          </div>

          {/* Results Table */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b pb-2 uppercase tracking-wide text-teal-800">
              Resultados de Análisis Clínico
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3">Examen / Parámetro</th>
                    <th className="p-3">Resultado</th>
                    <th className="p-3">Unidad</th>
                    <th className="p-3">Valores de Referencia</th>
                    <th className="p-3 text-center">Estado / Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {results.map((res) => {
                    const isCritical = res.flag?.includes('CRITICO');
                    const isHighLow = res.flag === 'ALTO' || res.flag === 'BAJO';

                    return (
                      <React.Fragment key={res.id}>
                        <tr className={isCritical ? 'bg-rose-50/80 font-bold' : ''}>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{res.parameterName}</div>
                            <div className="text-[9px] text-slate-500 font-bold uppercase">Muestra: {res.specimenType || 'SANGRE TOTAL'}</div>
                          </td>
                          <td className="p-3 font-mono text-sm">
                            <span className={isCritical ? 'text-rose-700 font-extrabold' : isHighLow ? 'text-amber-700 font-bold' : 'text-slate-900'}>
                              {res.value}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 font-mono">{res.unit}</td>
                          <td className="p-3 text-slate-600">{res.refRangeText}</td>
                          <td className="p-3 text-center">
                            {res.flag && res.flag !== 'NORMAL' ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                isCritical ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                              }`}>
                                {res.flag}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                                NORMAL
                              </span>
                            )}
                          </td>
                        </tr>
                        {res.interpretation && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={5} className="p-3 pt-0 text-[10px] text-slate-600 italic">
                              <strong>Interpretación:</strong> {res.interpretation}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Validation & Digital Signature Footer */}
          <div className="border-t-2 border-slate-200 pt-6 flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Validado Clínicamente por Dirección de Laboratorio</span>
              </div>
              <div className="text-xs text-slate-600">
                Jefe de Laboratorio: <strong>Lic. Carlos Castillo (TM-3109-PA)</strong>
              </div>
              <div className="font-mono text-[10px] text-slate-400 max-w-md break-all">
                Firma Digital Hash SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
              </div>
            </div>

            {/* Verification QR Code */}
            <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <QrCode className="w-12 h-12 text-slate-800 shrink-0" />
              <div className="text-[11px] text-slate-600">
                <div className="font-bold text-slate-900">Verificación Oficial</div>
                <div>Escanee para validar autenticidad de resultados en Panamá Ley 81 portal.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
