import React, { useState } from 'react';
import { Order, Patient, TestCatalogItem, Tenant, Branch } from '../types';
import {
  CreditCard,
  Printer,
  ShieldCheck,
  Percent,
  CheckCircle2,
  QrCode,
  Building,
  Receipt,
  FileCheck2,
  DollarSign,
  UserCheck,
  AlertCircle,
  FileDown,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useToast } from './Toast';

interface BillingPOSProps {
  orders: Order[];
  patients: Patient[];
  testCatalog: TestCatalogItem[];
  tenant: Tenant;
  branch: Branch;
  onOrderPaid?: (orderId: string, invoiceData: any) => void;
}

export interface InvoiceRecord {
  invoiceNumber: string;
  cufe: string;
  orderNumber: string;
  patientName: string;
  patientNationalId: string;
  subtotal: number;
  discountLey6: number;
  discountPercent: number;
  itbmsTax: number;
  total: number;
  paymentMethod: 'EFECTIVO' | 'PUNTO_VENTA_POS' | 'ASEGURADORA' | 'ACH_TRANSFERENCIA';
  posProvider?: string;
  insuranceName?: string;
  authorizationCode?: string;
  createdAt: string;
}

export const BillingPOS: React.FC<BillingPOSProps> = ({
  orders,
  patients,
  testCatalog,
  tenant,
  branch,
  onOrderPaid
}) => {
  const { toast } = useToast();
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [isJubiladoLey6, setIsJubiladoLey6] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'PUNTO_VENTA_POS' | 'ASEGURADORA' | 'ACH_TRANSFERENCIA'>('PUNTO_VENTA_POS');
  const [posProvider, setPosProvider] = useState<string>('BAC Credomatic (POS-01)');
  const [insuranceName, setInsuranceName] = useState<string>('ASSA Compañía de Seguros');
  const [copayPercent, setCopayPercent] = useState<number>(20); // 20% copay, 80% covered
  const [authCode, setAuthCode] = useState<string>('AUTH-ASSA-88219');
  const [issuedInvoice, setIssuedInvoice] = useState<InvoiceRecord | null>(null);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];
  const selectedPatient = patients.find((p) => p.id === selectedOrder?.patientId) || patients[0];

  // Selected order tests
  const orderTests = testCatalog.filter((t) => selectedOrder?.testIds.includes(t.id));
  const baseSubtotal = orderTests.reduce((sum, t) => sum + t.price, 0);

  // Panama Ley 6 de 1987 (20% discount on laboratory services for Jubilados / Pensionados)
  const ley6DiscountAmount = isJubiladoLey6 ? baseSubtotal * 0.20 : 0;
  const subtotalAfterDiscount = baseSubtotal - ley6DiscountAmount;

  // Medical laboratory services are usually exempt from ITBMS (0%), but we show line item breakdown
  const itbmsTax = 0.00;

  let patientPayAmount = subtotalAfterDiscount;
  let insurancePayAmount = 0;

  if (paymentMethod === 'ASEGURADORA') {
    patientPayAmount = subtotalAfterDiscount * (copayPercent / 100);
    insurancePayAmount = subtotalAfterDiscount * ((100 - copayPercent) / 100);
  }

  const handleIssueInvoice = () => {
    toast('Comunicando con PAC DGI...', 'info', 1500);

    setTimeout(() => {
      const randomCufe = `FE-01-2026-${tenant.ruc}-${tenant.dv}-${Math.floor(100000000 + Math.random() * 900000000)}`;
      const randomInvNum = `FAC-001-${Math.floor(10000 + Math.random() * 90000)}`;

      const newInvoice: InvoiceRecord = {
        invoiceNumber: randomInvNum,
        cufe: randomCufe,
        orderNumber: selectedOrder.orderNumber,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        patientNationalId: selectedPatient.nationalId,
        subtotal: baseSubtotal,
        discountLey6: ley6DiscountAmount,
        discountPercent: isJubiladoLey6 ? 20 : 0,
        itbmsTax,
        total: patientPayAmount,
        paymentMethod,
        posProvider: paymentMethod === 'PUNTO_VENTA_POS' ? posProvider : undefined,
        insuranceName: paymentMethod === 'ASEGURADORA' ? insuranceName : undefined,
        authorizationCode: paymentMethod === 'ASEGURADORA' ? authCode : undefined,
        createdAt: new Date().toISOString()
      };

      setIssuedInvoice(newInvoice);
      if (onOrderPaid) {
        onOrderPaid(selectedOrder.id, newInvoice);
      }
      toast('Factura Electrónica Emitida & Autorizada por DGI', 'success');
    }, 1600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-teal-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-teal-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center space-x-2">
            <Receipt className="w-4 h-4" />
            <span>Módulo de Facturación Electrónica DGI Panamá (Ley 6 & POS)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Facturación, Caja POS & Aseguradoras
          </h1>
          <p className="text-teal-100 text-sm mt-1 max-w-xl">
            Procesamiento de pagos con descuento legal de Ley 6 (Jubilados 20%), co-pagos de aseguradoras en Panamá y generación de CUFE para DGI.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-teal-500/30 p-4 rounded-xl text-xs space-y-1">
          <div className="text-teal-300 font-bold flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>RUC: {tenant.ruc} DV: {tenant.dv}</span>
          </div>
          <div className="text-slate-300">Emisor: {tenant.name} ({branch.name})</div>
          <div className="text-emerald-400 text-[11px] font-semibold">● Conexión PAC DGI Panamá: Activa</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Order Selection & Payment Setup */}
        <div className="lg:col-span-7 space-y-6">
          {/* Order Selection */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-teal-600" />
              <span>Seleccionar Orden Médica Pendiente de Cobro</span>
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {orders.map((ord) => {
                const isSelected = ord.id === selectedOrderId;
                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {ord.orderNumber} — {ord.patientName}
                      </div>
                      <div className="text-xs text-slate-500">
                        Cédula: <span className="font-mono">{ord.patientNationalId}</span> | Fecha: {new Date(ord.createdAt).toLocaleDateString('es-PA')}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-slate-900 text-base">${ord.totalAmount.toFixed(2)}</div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ord.paymentStatus === 'PAGADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.paymentStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panama Ley 6 Discount Toggle */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Percent className="w-5 h-5 text-amber-600" />
              <span>Aplicación de Ley 6 de 1987 (Panamá) — Beneficios de Ley</span>
            </h3>

            <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl flex items-start space-x-3 text-xs text-amber-900">
              <input
                type="checkbox"
                id="ley6Check"
                checked={isJubiladoLey6}
                onChange={(e) => setIsJubiladoLey6(e.target.checked)}
                className="mt-1 rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="ley6Check" className="cursor-pointer space-y-1">
                <span className="font-bold text-amber-950 block text-sm">
                  Aplicar 20% de Descuento por Ley de Jubilados / Pensionados / Tercera Edad
                </span>
                <p className="text-amber-800">
                  Aplica a varones mayores de 62 años, damas mayores de 57 años y personas con discapacidad según Ley 6 de la República de Panamá.
                </p>
              </label>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-teal-600" />
              <span>Método de Pago & Canal de Transacción</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'PUNTO_VENTA_POS', label: 'Tarjeta / POS', desc: 'BAC / Banistmo' },
                { id: 'EFECTIVO', label: 'Efectivo', desc: 'Caja Recaudadora' },
                { id: 'ASEGURADORA', label: 'Aseguradora', desc: 'ASSA / PALIG' },
                { id: 'ACH_TRANSFERENCIA', label: 'ACH Directo', desc: 'Banco General' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`p-3 rounded-xl border text-left transition ${
                    paymentMethod === m.id
                      ? 'bg-teal-600 text-white border-teal-700 shadow-md font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-bold">{m.label}</div>
                  <div className={`text-[10px] ${paymentMethod === m.id ? 'text-teal-100' : 'text-slate-500'}`}>
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Sub-options based on payment method */}
            {paymentMethod === 'PUNTO_VENTA_POS' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <label className="font-bold text-slate-700 block">Terminal POS Seleccionada:</label>
                <select
                  value={posProvider}
                  onChange={(e) => setPosProvider(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-xs"
                >
                  <option value="BAC Credomatic (POS-01)">BAC Credomatic — Terminal Vía España #01</option>
                  <option value="St. Georges Bank (POS-02)">St. Georges Bank — Terminal Vía España #02</option>
                  <option value="Banistmo (POS-03)">Banistmo — Terminal Vía España #03</option>
                  <option value="Punto Pago POS">Punto Pago POS Integrado</option>
                </select>
              </div>
            )}

            {paymentMethod === 'ASEGURADORA' && (
              <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200 text-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Aseguradora Médica en Panamá:</label>
                    <select
                      value={insuranceName}
                      onChange={(e) => setInsuranceName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-xs"
                    >
                      <option value="ASSA Compañía de Seguros">ASSA Compañía de Seguros</option>
                      <option value="Pan American Life (PALIG)">Pan American Life Insurance (PALIG)</option>
                      <option value="MAPFRE Panamá">MAPFRE Panamá</option>
                      <option value="Internacional de Seguros (IS)">Internacional de Seguros (IS)</option>
                      <option value="Banesco Seguros">Banesco Seguros Panamá</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Porcentaje Co-Pago del Paciente:</label>
                    <select
                      value={copayPercent}
                      onChange={(e) => setCopayPercent(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-xs"
                    >
                      <option value={0}>0% Co-Pago (Cobertura 100%)</option>
                      <option value={10}>10% Co-Pago Paciente</option>
                      <option value={20}>20% Co-Pago Paciente (Estándar)</option>
                      <option value={30}>30% Co-Pago Paciente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Código de Autorización / Reclamo:</label>
                  <input
                    type="text"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-xs font-bold"
                    placeholder="Ej. AUTH-ASSA-88219"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Financial Summary & DGI Electronic Invoice Ticket */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                Desglose Financiero DGI
              </span>
              <span className="text-xs text-slate-400 font-mono">{selectedOrder.orderNumber}</span>
            </div>

            {/* Breakdown lines */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal Exámenes ({orderTests.length} ítems):</span>
                <span className="font-mono text-white">${baseSubtotal.toFixed(2)}</span>
              </div>

              {isJubiladoLey6 && (
                <div className="flex justify-between text-amber-400 font-semibold">
                  <span>Descuento Ley 6 (Jubilados 20%):</span>
                  <span className="font-mono">-${ley6DiscountAmount.toFixed(2)}</span>
                </div>
              )}

              {paymentMethod === 'ASEGURADORA' && (
                <div className="flex justify-between text-blue-300 font-semibold">
                  <span>Cobertura {100 - copayPercent}% Aseguradora ({insuranceName}):</span>
                  <span className="font-mono">-${insurancePayAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2">
                <span>ITBMS Exento (Salud / Ley DGI):</span>
                <span className="font-mono">$0.00</span>
              </div>

              <div className="flex justify-between items-baseline border-t border-slate-800 pt-3 text-base">
                <span className="font-bold text-white">Total a Pagar Paciente:</span>
                <span className="font-black text-2xl text-emerald-400">${patientPayAmount.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              onClick={handleIssueInvoice}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-3.5 rounded-xl text-sm transition shadow-lg flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Emitir Factura Electrónica DGI & Registrar Cobro</span>
            </button>
          </div>

          {/* Render Issued DGI E-Invoice Ticket */}
          {issuedInvoice && (
            <div className="bg-white rounded-2xl p-6 border-2 border-emerald-500 shadow-lg space-y-4 text-xs font-mono">
              <div className="text-center border-b border-slate-200 pb-3 space-y-1">
                <div className="font-black text-slate-900 text-sm font-sans">{tenant.name}</div>
                <div className="text-slate-600 font-sans">{branch.name} — RUC: {tenant.ruc} DV: {tenant.dv}</div>
                <div className="bg-emerald-100 text-emerald-800 font-bold font-sans text-[11px] px-3 py-1 rounded-full inline-block mt-1">
                  Factura Electrónica DGI Aprobada
                </div>
              </div>

              <div className="space-y-1 text-slate-700">
                <div>Factura N°: <strong className="text-slate-900">{issuedInvoice.invoiceNumber}</strong></div>
                <div>Orden LIS: {issuedInvoice.orderNumber}</div>
                <div>Fecha/Hora: {new Date(issuedInvoice.createdAt).toLocaleString('es-PA')}</div>
                <div>Cliente: {issuedInvoice.patientName}</div>
                <div>Cédula/RUC: {issuedInvoice.patientNationalId}</div>
                <div>Forma de Pago: {issuedInvoice.paymentMethod}</div>
              </div>

              <div className="border-t border-b border-slate-200 py-2 space-y-1">
                {orderTests.map((t) => (
                  <div key={t.id} className="flex justify-between">
                    <span>{t.name}</span>
                    <span>${t.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right text-slate-900">
                <div>Subtotal: ${issuedInvoice.subtotal.toFixed(2)}</div>
                {issuedInvoice.discountLey6 > 0 && (
                  <div className="text-amber-700 font-bold">Desc. Ley 6 (20%): -${issuedInvoice.discountLey6.toFixed(2)}</div>
                )}
                <div className="font-black text-sm text-emerald-700">Total Cobrado: ${issuedInvoice.total.toFixed(2)} USD</div>
              </div>

              {/* CUFE & QR DGI Code */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10px] space-y-2">
                <div className="flex items-center space-x-2">
                  <QrCode className="w-10 h-10 text-slate-900 shrink-0" />
                  <div className="break-all font-mono text-[9px] text-slate-600">
                    <strong>CUFE DGI:</strong>
                    <br />
                    {issuedInvoice.cufe}
                  </div>
                </div>
                <div className="text-[9px] text-slate-500 font-sans text-center">
                  Verificable en el Portal de Facturación Electrónica de la DGI (MEF Panamá)
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold py-2 rounded-xl text-xs transition flex items-center justify-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket de Cierre de Caja</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
