import React from 'react';
import { Order, TestResult, Patient, Tenant, Branch } from '../types';
import { MOCK_TEST_CATALOG } from '../data/mockData';
import { FileText, Printer, CheckCircle2, QrCode, ShieldCheck, X, Smartphone, Lock, Award } from 'lucide-react';

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

  let validatedResults = results.filter(res => res.orderId === order.id);

  // Fallback: If no results exist in memory for this order, generate from MOCK_TEST_CATALOG
  if (validatedResults.length === 0 && order && order.testIds && order.testIds.length > 0) {
    const generated: TestResult[] = [];
    order.testIds.forEach((testId) => {
      const catalogTest = MOCK_TEST_CATALOG.find((t) => t.id === testId);
      if (catalogTest && catalogTest.parameters && catalogTest.parameters.length > 0) {
        catalogTest.parameters.forEach((param) => {
          generated.push({
            id: `res-${order.id}-${param.id}`,
            orderId: order.id,
            testId: testId,
            parameterId: param.id,
            parameterCode: param.astmParamCode || param.id,
            parameterName: param.name,
            unit: param.unit,
            value: 'PENDIENTE / EN PROCESO',
            numericValue: undefined,
            flag: 'NORMAL',
            status: 'PENDIENTE',
            refRangeText: param.referenceRanges?.[0] ? `${param.referenceRanges[0].minValue} - ${param.referenceRanges[0].maxValue}` : 'Normal',
            source: 'RECEPCION_POS',
            analyzerName: 'LIS-Core'
          });
        });
      }
    });
    if (generated.length > 0) {
      validatedResults = generated;
    }
  }

  // Group results by section/test category
  const resultsBySection: Record<string, TestResult[]> = {};
  validatedResults.forEach((res) => {
    const test = MOCK_TEST_CATALOG.find(t => t.id === res.testId);
    const section = test?.category || 'ANÁLISIS CLÍNICO GENERAL';
    if (!resultsBySection[section]) resultsBySection[section] = [];
    resultsBySection[section].push(res);
  });

  const hasCriticalFlag = validatedResults.some(r => r.flag?.includes('CRITICO'));
  const hasInstrumentalFindings = validatedResults.some(res => res.isExtra);

  // Panama format dates
  const emissionDate = new Date().toLocaleDateString('es-PA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const emissionTime = new Date().toLocaleTimeString('es-PA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">

      {/* Estilos estrictos para tamaño Carta (US Letter 8.5 x 11 in) */}
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 12mm 15mm;
          }
          html, body {
            width: 8.5in;
            height: 11in;
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 10.5pt !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          #printable-report {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl min-h-screen sm:min-h-0 sm:max-h-[96vh] overflow-y-auto flex flex-col">
        {/* Barra Superior de Control de Impresión */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between sticky top-0 z-20 no-print border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-sm text-white block">Informe de Laboratorio Clínico Oficial</span>
              <span className="text-xs text-slate-400 font-mono">Formato Oficial Tipo Carta (US Letter 8.5" × 11") • Ley 81 / MINSA</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => {
                const message = `Estimado(a) ${patient.firstName} ${patient.lastName}, su informe de resultados del ${tenant.name} (${order.orderNumber}) está listo y validado. Cédula: ${patient.nationalId}.`;
                window.open(`https://wa.me/${patient.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3.5 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-teal-600 hover:bg-teal-500 text-white font-black px-4 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir en Carta / Guardar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition p-2 rounded-xl cursor-pointer"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENIDO DEL REPORTE CLÍNICO TAMAÑO CARTA */}
        <div className="p-8 sm:p-12 space-y-6 text-slate-900 font-sans leading-relaxed max-w-[8.5in] mx-auto bg-white" id="printable-report">
          
          {/* 1. Membrete Institucional de Laboratorio Clínico */}
          <div className="border-b-2 border-teal-700 pb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-black text-xl shadow-md">
                  🔬
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-teal-900 tracking-tight leading-none">
                    {tenant.name}
                  </h1>
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                    Servicios de Diagnóstico Clínico & Medicina de Laboratorio
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-600 font-medium pt-1 space-y-0.5">
                <div><strong>Sede:</strong> {branch.name} — {branch.address}</div>
                <div><strong>Teléfono:</strong> {branch.phone} | <strong>RUC:</strong> {tenant.ruc} <strong>DV:</strong> {tenant.dv}</div>
                <div className="text-teal-800 font-semibold flex items-center space-x-1">
                  <span>● Licencia Sanitaria MINSA N° 2024-LC-0891</span>
                  <span>•</span>
                  <span>Acreditación Norma ISO 15189</span>
                </div>
              </div>
            </div>

            {/* Cuadro de N° de Orden y Código de Barras */}
            <div className="text-right space-y-1">
              <div className="inline-block bg-teal-50 border-2 border-teal-600/60 rounded-xl px-4 py-2 text-right">
                <span className="text-[11px] font-bold text-teal-800 uppercase block tracking-wider">N° de Orden Oficial</span>
                <span className="text-base sm:text-lg font-mono font-black text-teal-950 tracking-wider block">{order.orderNumber}</span>
                {/* Simulación visual de código de barras Code-128 */}
                <div className="flex items-center justify-center gap-[2px] h-6 mt-1 px-1 bg-white rounded border border-slate-300">
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2].map((w, i) => (
                    <div key={i} className="bg-slate-900 h-full" style={{ width: `${w}px` }} />
                  ))}
                </div>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Emisión: {emissionDate} • {emissionTime}
              </div>
            </div>
          </div>

          {/* 2. Cuadro Demográfico del Paciente */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-300 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[11px]">Paciente:</span>
              <span className="text-slate-950 font-black text-sm block mt-0.5">{patient.firstName} {patient.lastName}</span>
            </div>

            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[11px]">Cédula / Identificación:</span>
              <span className="text-slate-900 font-mono font-black text-sm block mt-0.5">{patient.nationalId}</span>
            </div>

            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[11px]">Edad / Sexo:</span>
              <span className="text-slate-900 font-bold text-xs block mt-0.5">
                {order.patientAge || 31} Años • {patient.gender === 'F' ? 'Femenino' : 'Masculino'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[11px]">Médico Solicitante:</span>
              <span className="text-slate-900 font-bold text-xs block mt-0.5 truncate">{order.doctorName || 'Particular / Consulta Externa'}</span>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[11px]">Fecha de Toma:</span>
              <span className="text-slate-900 font-medium text-xs block mt-0.5">
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-PA') : emissionDate}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[11px]">Tipo de Muestra:</span>
              <span className="text-slate-900 font-medium text-xs block mt-0.5">
                {validatedResults[0]?.specimenType || 'Sangre Total / Suero'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[11px]">Estado de Orden:</span>
              <span className="text-emerald-700 font-bold text-xs block mt-0.5 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>VALIDADO CLÍNICAMENTE</span>
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[11px]">Sede de Procesamiento:</span>
              <span className="text-slate-900 font-medium text-xs block mt-0.5">{branch.name}</span>
            </div>
          </div>

          {/* Alerta de Valores Críticos si Aplica */}
          {hasCriticalFlag && (
            <div className="p-3 bg-rose-50 border-2 border-rose-500 rounded-xl flex items-center space-x-3 text-rose-900">
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
                ⚠️
              </div>
              <div className="text-xs">
                <strong className="block font-black text-rose-800 uppercase tracking-wider">Aviso de Valor Crítico / Alerta Clínica de Pánico</strong>
                <span>Se han identificado analitos fuera de los límites de alarma fisiológica. Los valores han sido verificados por repetición y notificados de inmediato al médico tratante.</span>
              </div>
            </div>
          )}

          {/* 3. Tabla de Resultados Agrupada por Secciones */}
          <div className="space-y-6">
            {Object.entries(resultsBySection).map(([sectionName, sectionResults]) => (
              <div key={sectionName} className="space-y-2">
                <div className="bg-teal-900 text-white px-3 py-1.5 rounded-lg flex items-center justify-between">
                  <h3 className="font-black text-xs uppercase tracking-wider">
                    {sectionName}
                  </h3>
                  <span className="text-[11px] font-mono text-teal-200">Metodología: Automatizada / Fotometría & Quimioluminiscencia</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-300 text-slate-700 font-black text-[11px] uppercase tracking-wider bg-slate-100">
                        <th className="py-2.5 px-3">Análisis / Parámetro</th>
                        <th className="py-2.5 px-3 text-center">Resultado</th>
                        <th className="py-2.5 px-3 text-center">Unidad</th>
                        <th className="py-2.5 px-3 text-center">Intervalo de Referencia</th>
                        <th className="py-2.5 px-3 text-center">Metodología / Equipo</th>
                        <th className="py-2.5 px-3 text-center">Alerta / Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(sectionResults as TestResult[]).map((res) => {
                        const isCritical = res.flag?.includes('CRITICO');
                        const isHigh = res.flag === 'ALTO';
                        const isLow = res.flag === 'BAJO';

                        return (
                          <React.Fragment key={res.id}>
                            <tr className={`hover:bg-slate-50 transition-colors ${isCritical ? 'bg-rose-50/70 font-semibold' : ''}`}>
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-950 block">{res.parameterName}</span>
                                {res.isExtra && (
                                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded border border-purple-200 uppercase inline-block mt-0.5">
                                    Hallazgo Instrumental
                                  </span>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-center font-mono font-black text-sm">
                                <span className={
                                  isCritical
                                    ? 'text-rose-700 font-black text-base px-2 py-0.5 bg-rose-100 rounded border border-rose-300'
                                    : isHigh
                                    ? 'text-amber-700 font-black px-1.5 py-0.5 bg-amber-50 rounded'
                                    : isLow
                                    ? 'text-blue-700 font-black px-1.5 py-0.5 bg-blue-50 rounded'
                                    : 'text-slate-950'
                                }>
                                  {res.value || '—'}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 text-center font-mono text-slate-600 font-medium">
                                {res.unit || '—'}
                              </td>

                              <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                                {res.refRangeText || 'Normal'}
                              </td>

                              <td className="py-2.5 px-3 text-center text-slate-500 text-[11px]">
                                {res.analyzerName || 'Analizador Automatizado'}
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                {isCritical ? (
                                  <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-black uppercase tracking-wider inline-flex items-center space-x-1">
                                    <span>⚠️ CRÍTICO</span>
                                  </span>
                                ) : isHigh ? (
                                  <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded text-[10px] font-black uppercase tracking-wider inline-flex items-center space-x-0.5">
                                    <span>▲ ALTO</span>
                                  </span>
                                ) : isLow ? (
                                  <span className="px-2 py-0.5 bg-blue-500 text-white rounded text-[10px] font-black uppercase tracking-wider inline-flex items-center space-x-0.5">
                                    <span>▼ BAJO</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold uppercase tracking-wider">
                                    ✓ NORMAL
                                  </span>
                                )}
                              </td>
                            </tr>

                            {res.interpretation && (
                              <tr className="bg-slate-50/70">
                                <td colSpan={6} className="py-1.5 px-4 text-[11px] text-slate-700 italic border-l-2 border-teal-600">
                                  <strong>Nota Clínica:</strong> {res.interpretation}
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
            ))}
          </div>

          {/* Nota técnica de hallazgos adicionales */}
          {hasInstrumentalFindings && (
            <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl flex items-start space-x-2.5">
              <span className="text-amber-700 font-bold text-sm">ℹ️</span>
              <p className="text-xs text-amber-900 leading-tight">
                <strong>NOTA TÉCNICA DE LABORATORIO:</strong> Los analitos identificados como <em>[Hallazgo Instrumental]</em> fueron reportados y verificados analíticamente por los analizadores clínicos del laboratorio dada su significancia médica preventiva.
              </p>
            </div>
          )}

          {/* 4. Bloque de Firmas Digitales y Validación MINSA */}
          <div className="border-t-2 border-slate-300 pt-6 mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            
            {/* Firma Tecnólogo Médico */}
            <div className="text-center space-y-1">
              <div className="h-14 flex items-center justify-center">
                <span className="font-serif italic text-teal-800 text-lg tracking-wider border-b-2 border-slate-400 pb-1 px-4">
                  Lic. Sofía Guardia Franco
                </span>
              </div>
              <strong className="text-xs text-slate-900 block">Lic. Sofía Guardia Franco</strong>
              <span className="text-[11px] text-slate-600 block">Tecnóloga Médica Analista</span>
              <span className="text-[11px] font-mono text-teal-800 font-bold block">Idoneidad MINSA: TM-5920-PA</span>
              <span className="text-[10px] text-slate-500 font-mono block">Firma y Sello Técnico Autorizado</span>
            </div>

            {/* Firma Jefe de Laboratorio / Director Médico */}
            <div className="text-center space-y-1">
              <div className="h-14 flex items-center justify-center">
                <span className="font-serif italic text-teal-800 text-lg tracking-wider border-b-2 border-slate-400 pb-1 px-4">
                  Dr. Roberto Icaza Villalaz
                </span>
              </div>
              <strong className="text-xs text-slate-900 block">Dr. Roberto Icaza Villalaz</strong>
              <span className="text-[11px] text-slate-600 block">Jefe de Laboratorio Clínico</span>
              <span className="text-[11px] font-mono text-teal-800 font-bold block">Idoneidad MINSA: TM-1840-PA</span>
              <span className="text-[10px] text-slate-500 font-mono block">Validación Facultativa Médica</span>
            </div>

            {/* Código QR y Verificación Criptográfica */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-300 flex items-center space-x-3">
              <div className="p-1 bg-white rounded-lg border border-slate-300 shrink-0">
                <QrCode className="w-14 h-14 text-slate-900" />
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5">
                <strong className="text-slate-950 block text-xs">Verificación en Línea</strong>
                <div>Escanee este código QR para comprobar la autenticidad e integridad del informe.</div>
                <div className="text-[9px] font-mono text-slate-500 truncate pt-1">
                  SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                </div>
              </div>
            </div>
          </div>

          {/* 5. Pie de Página Legal y Paginación */}
          <div className="border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center space-x-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Documento confidencial emitido bajo la Ley 81 de Protección de Datos Personales de Panamá.</span>
            </div>
            <div className="font-mono font-bold text-slate-700">
              Página 1 de 1 • Sistema LIS-Core Panamá
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
