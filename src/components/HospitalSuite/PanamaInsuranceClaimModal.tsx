import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  Printer,
  X,
  FileText,
  Building2,
  Stethoscope,
  DollarSign,
  User,
  CheckCircle2,
  Calendar,
  CreditCard
} from 'lucide-react';
import { Patient, Order, Tenant } from '../../types';
import { buildPrintFileName, printDocument } from '../../utils/printDocument';

interface PanamaInsuranceClaimModalProps {
  patient: Patient;
  order?: Order;
  tenant: Tenant;
  onClose: () => void;
}

export const PanamaInsuranceClaimModal: React.FC<PanamaInsuranceClaimModalProps> = ({
  patient,
  order,
  tenant,
  onClose
}) => {
  const [insurer, setInsurer] = useState<string>('ASSA Compañía de Seguros');
  const [policyNumber, setPolicyNumber] = useState<string>('POL-99201-PA');
  const [certNumber, setCertNumber] = useState<string>('01');
  const [claimType, setClaimType] = useState<'AMBULATORIO' | 'HOSPITALIZACION' | 'URGENCIA'>('AMBULATORIO');
  const [primaryIcd10, setPrimaryIcd10] = useState<string>('E11.9 - Diabetes mellitus tipo 2 sin mención de complicación');
  const [secondaryIcd10, setSecondaryIcd10] = useState<string>('I10 - Hipertensión esencial (primaria)');
  const [treatingDoctor, setTreatingDoctor] = useState<string>(order?.doctorName || 'Dr. Fernando Arosemena Boyd');
  const [doctorLicense, setDoctorLicense] = useState<string>('MED-8812-PA');
  const [copayAmount, setCopayAmount] = useState<number>(order ? (order.totalAmount || 65.00) * 0.20 : 15.00);
  const [totalCharged, setTotalCharged] = useState<number>(order?.totalAmount || 75.00);

  const insurersList = [
    'ASSA Compañía de Seguros',
    'Blue Cross & Blue Shield de Panamá',
    'Mapfre Panamá',
    'Pan American Life Insurance Group (PALIG)',
    'Seguros Fedpa',
    'Vivir Seguros Panamá',
    'Internacional de Seguros (IS)',
    'Banesco Seguros Panamá'
  ];

  const handlePrint = () => {
    window.print();
  };

  const claimId = `REC-PA-${new Date().getFullYear()}-${order?.orderNumber ? order.orderNumber.replace(/[^0-9]/g, '').slice(-5) : '88201'}`;

  return typeof document !== 'undefined' ? createPortal(
    <div
      id="insurance-claim-modal-container"
      data-printable-portal="true"
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto printable-modal-overlay print:static print:block print:p-0 print:m-0 print:bg-white print:w-full print:h-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:inset-auto"
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden print:static print:block print:p-0 print:m-0 print:w-full print:max-w-full print:h-auto print:min-h-0 print:max-h-none print:overflow-visible print:border-none print:shadow-none print:rounded-none">
        
        {/* Top Header Controls (Hidden on Print) */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center space-x-2">
                <span>Formulario Oficial de Reclamo de Seguros Médicos (Panamá)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Homologado para tramitación directa y reembolso ante aseguradoras privadas de la República de Panamá.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Formulario (Carta)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editable Pre-flight Toolbar (Hidden on Print) */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Aseguradora Privada</label>
            <select
              value={insurer}
              onChange={(e) => setInsurer(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
            >
              {insurersList.map((ins) => (
                <option key={ins} value={ins}>{ins}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">N° de Póliza / Certificado</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="Póliza"
                className="w-2/3 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono font-bold"
              />
              <input
                type="text"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                placeholder="Cert."
                className="w-1/3 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Tipo de Atención</label>
            <select
              value={claimType}
              onChange={(e) => setClaimType(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
            >
              <option value="AMBULATORIO">Ambulatorio / Laboratorio Clínico</option>
              <option value="URGENCIA">Urgencia Hospitalaria</option>
              <option value="HOSPITALIZACION">Hospitalización / Cirugía</option>
            </select>
          </div>
        </div>

        {/* Printable Form Container in US Letter (8.5" x 11") */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-800/40 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <div
            id="printable-claim-form"
            data-printable="true"
            className="w-full max-w-[8.5in] bg-white text-slate-900 shadow-2xl p-4 sm:p-6 rounded-2xl print:shadow-none print:rounded-none print:p-0 print:w-full font-sans text-xs space-y-2.5 print:space-y-1.5 border border-slate-200 print:border-none printable-document-page single-page-letter"
          >
            
            {/* 1. Header Oficial de Reclamación */}
            <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between gap-3">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold block">
                  REPÚBLICA DE PANAMÁ • SUPERINTENDENCIA DE SEGUROS Y REASEGUROS
                </span>
                <h1 className="text-base font-black text-slate-950 uppercase tracking-tight">
                  FORMULARIO ÚNICO DE RECLAMACIÓN DE GASTOS MÉDICOS
                </h1>
                <div className="text-[11px] font-bold text-indigo-900 mt-0.5">
                  Compañía Aseguradora: <strong className="text-slate-950 font-black">{insurer}</strong>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] font-mono font-bold text-slate-600">Reclamo N°:</div>
                <div className="text-xs font-mono font-black text-slate-950">{claimId}</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                  Fecha: {new Date().toLocaleDateString('es-PA')}
                </div>
              </div>
            </div>

            {/* 2. Sección I: Datos del Asegurado / Paciente */}
            <div className="space-y-1">
              <div className="bg-slate-900 text-white px-2.5 py-0.5 font-black text-[10px] uppercase tracking-wider rounded">
                SECCIÓN I: DATOS DEL ASEGURADO Y PACIENTE
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block uppercase leading-none">Nombre Completo</span>
                  <strong className="text-slate-900 block text-xs mt-0.5 truncate">{patient.firstName} {patient.lastName}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block uppercase leading-none">Cédula / Pasaporte</span>
                  <strong className="text-slate-900 block text-xs font-mono mt-0.5">{patient.nationalId}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block uppercase leading-none">N° Póliza</span>
                  <strong className="text-indigo-900 block text-xs font-mono mt-0.5">{policyNumber}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block uppercase leading-none">Certificado</span>
                  <strong className="text-slate-900 block text-xs font-mono mt-0.5">{certNumber}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block uppercase leading-none">Nacimiento</span>
                  <span className="text-slate-800 font-medium text-[11px] block mt-0.5">{patient.dob || '1985-05-12'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block uppercase leading-none">Sexo Biológico</span>
                  <span className="text-slate-800 font-medium text-[11px] block mt-0.5">{patient.gender === 'M' ? 'Masculino' : 'Femenino'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block uppercase leading-none">Teléfono</span>
                  <span className="text-slate-800 font-mono text-[11px] block mt-0.5">{patient.phone || '+507 6366-8296'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block uppercase leading-none">Cobertura</span>
                  <span className="text-slate-800 font-bold text-[11px] block mt-0.5">{claimType}</span>
                </div>
              </div>
            </div>

            {/* 3. Sección II: Informe del Médico Tratante & Diagnósticos CIE-10 */}
            <div className="space-y-1">
              <div className="bg-slate-900 text-white px-2.5 py-0.5 font-black text-[10px] uppercase tracking-wider rounded">
                SECCIÓN II: INFORME MÉDICO Y DIAGNÓSTICO CLÍNICO (CIE-10)
              </div>
              <div className="space-y-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block uppercase leading-none">Médico Tratante</span>
                    <strong className="text-slate-900 text-xs block mt-0.5">{treatingDoctor}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block uppercase leading-none">Idoneidad Consejo Técnico MINSA</span>
                    <strong className="text-indigo-900 text-xs font-mono block mt-0.5">{doctorLicense}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-slate-200">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block uppercase leading-none">Diagnóstico Principal (CIE-10)</span>
                    <div className="font-mono text-[11px] font-bold text-slate-900 bg-white p-1 rounded border border-slate-300 mt-0.5 truncate">
                      {primaryIcd10}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block uppercase leading-none">Diagnóstico Secundario</span>
                    <div className="font-mono text-[11px] font-medium text-slate-700 bg-white p-1 rounded border border-slate-300 mt-0.5 truncate">
                      {secondaryIcd10}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Sección III: Desglose de Gastos de Laboratorio & Procedimientos */}
            <div className="space-y-1">
              <div className="bg-slate-900 text-white px-2.5 py-0.5 font-black text-[10px] uppercase tracking-wider rounded flex justify-between items-center">
                <span>SECCIÓN III: DETALLE DE PROCEDIMIENTOS Y GASTOS CLÍNICOS</span>
                <span className="text-[9px] font-mono">PROVEEDOR: {tenant.name.toUpperCase()} (RUC: {tenant.ruc}-{tenant.dv})</span>
              </div>
              <table className="w-full text-left border border-slate-300 text-xs">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[9px] text-slate-700">
                  <tr>
                    <th className="p-1.5">Código / Descripción del Procedimiento</th>
                    <th className="p-1.5 text-center">Cantidad</th>
                    <th className="p-1.5 text-right">Precio Unitario</th>
                    <th className="p-1.5 text-right">Total (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-1.5 font-medium">Análisis Clínicos de Laboratorio Ambulatorio (Orden {order?.orderNumber || 'LIS-2026-0812'})</td>
                    <td className="p-1.5 text-center font-mono">1</td>
                    <td className="p-1.5 text-right font-mono">${(totalCharged).toFixed(2)}</td>
                    <td className="p-1.5 text-right font-mono font-bold">${(totalCharged).toFixed(2)}</td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs">
                  <tr>
                    <td colSpan={3} className="p-1.5 text-right uppercase text-[10px]">Total Facturado al Seguro:</td>
                    <td className="p-1.5 text-right font-mono font-black text-slate-950">${totalCharged.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="p-1.5 text-right uppercase text-[10px] text-slate-600">Copago / Deducible Pagado:</td>
                    <td className="p-1.5 text-right font-mono text-xs text-indigo-900 font-bold">-${copayAmount.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-indigo-50/70">
                    <td colSpan={3} className="p-1.5 text-right uppercase text-[10px] font-black text-indigo-950">Monto Neto a Reembolsar por Aseguradora:</td>
                    <td className="p-1.5 text-right font-mono font-black text-indigo-900">${(totalCharged - copayAmount).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 5. Firmas y Sellos Autorizados */}
            <div className="pt-2 border-t-2 border-slate-300 grid grid-cols-3 gap-3 items-end text-center text-xs avoid-break signature-block mt-1">
              <div className="space-y-0.5">
                <div className="border-b border-slate-400 pb-0.5 h-8 flex items-end justify-center font-serif italic text-slate-700 text-xs">
                  {patient.firstName} {patient.lastName}
                </div>
                <strong className="block text-[10px]">Firma del Asegurado / Paciente</strong>
                <span className="text-[9px] text-slate-500 font-mono block">Cédula: {patient.nationalId}</span>
              </div>

              <div className="space-y-0.5">
                <div className="border-b border-slate-400 pb-0.5 h-8 flex items-end justify-center font-serif italic text-indigo-900 text-xs">
                  {treatingDoctor}
                </div>
                <strong className="block text-[10px]">Firma y Sello del Médico Tratante</strong>
                <span className="text-[9px] text-indigo-800 font-mono block">Idoneidad MINSA: {doctorLicense}</span>
              </div>

              <div className="space-y-0.5">
                <div className="border-b border-slate-400 pb-0.5 h-8 flex items-end justify-center font-serif italic text-teal-900 text-xs">
                  {tenant.name}
                </div>
                <strong className="block text-[10px]">Sello del Proveedor Médico / LIS</strong>
                <span className="text-[9px] text-slate-500 font-mono block">RUC: {tenant.ruc}-{tenant.dv}</span>
              </div>
            </div>

            {/* Footer Legal */}
            <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center text-[8px] text-slate-400 font-mono avoid-break mt-0.5">
              <span>Declaración bajo la gravedad de juramento conforme a póliza.</span>
              <span>Página 1 de 1 • Plataforma Clínica AbregoTech Panamá</span>
            </div>

          </div>
        </div>

      </div>
    </div>,
    document.body
  ) : null;
};
