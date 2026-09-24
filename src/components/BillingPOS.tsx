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
  FileText,
  DollarSign,
  UserCheck,
  AlertCircle,
  Mail,
  MessageSquare,
  Share2,
  Settings,
  Copy,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Layers,
  FlaskConical,
  Clock,
  PhoneCall
} from 'lucide-react';
import { SmtpConfigModal } from './SmtpConfigModal';
import { EmailInvoiceModal } from './EmailInvoiceModal';
import { NotificationService } from '../services/SupabaseService';
import { PanamaInsuranceClaimModal } from './HospitalSuite/PanamaInsuranceClaimModal';

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
  patientPhone?: string;
  patientEmail?: string;
  subtotal: number;
  discountLey6: number;
  discountPercent: number;
  itbmsTax: number;
  total: number;
  paymentMethod: 'EFECTIVO' | 'PUNTO_VENTA_POS' | 'ASEGURADORA' | 'ACH_TRANSFERENCIA';
  posProvider?: string;
  insuranceName?: string;
  policyNumber?: string;
  authorizationCode?: string;
  createdAt: string;
}

// Aseguradoras Médicas de Panamá (Plaza Local)
const PANAMA_INSURANCES = [
  { id: 'ASSA', name: 'ASSA Compañía de Seguros, S.A.', defaultCopay: 20 },
  { id: 'MAPFRE', name: 'MAPFRE Panamá', defaultCopay: 20 },
  { id: 'IS', name: 'Cía. Internacional de Seguros, S.A. (IS)', defaultCopay: 20 },
  { id: 'ANCON', name: 'Aseguradora Ancón, S.A.', defaultCopay: 20 },
  { id: 'PALIG', name: 'Pan American Life Insurance (PALIG)', defaultCopay: 20 },
  { id: 'BUPA', name: 'BUPA Panamá, S.A.', defaultCopay: 15 },
  { id: 'BANESCO', name: 'Banesco Seguros Panamá', defaultCopay: 20 },
  { id: 'MERCANTIL', name: 'Mercantil Seguros y Reaseguros, S.A.', defaultCopay: 20 },
  { id: 'SANTA_FE', name: 'Hospital Santa Fe / PMSF', defaultCopay: 10 },
  { id: 'CORRETAJE', name: 'Corretaje de Seguros de Vida, S.A.', defaultCopay: 20 }
];

// Combos y Perfiles Clínicos Panameños Inteligentes (LIS / HIS / Banco de Sangre)
const CLINICAL_COMBOS = [
  {
    id: 'combo-control-anual',
    name: 'Perfil Control Anual / Preventivo',
    code: 'VZ505',
    description: 'Hemograma Completo + Glucosa + Perfil Lipídico Integral + Creatinina + Ácido Úrico + Urianálisis EGO',
    price: 45.00,
    tubes: ['Tubo Lila (EDTA)', 'Tubo Oro/Rojo (Suero con Gel)', 'Envase Orina'],
    category: 'QUÍMICA & HEMATOLOGÍA'
  },
  {
    id: 'combo-preoperatorio',
    name: 'Perfil Preoperatorio Quirúrgico',
    code: 'VZ508',
    description: 'Hemograma + TP/INR + TTPa + Glucosa + Creatinina + Tipificación ABO/Rh + Urianálisis',
    price: 52.00,
    tubes: ['Tubo Lila (EDTA)', 'Tubo Celeste (Citrato 3.2%)', 'Tubo Rojo (Suero)', 'Envase Orina'],
    category: 'QUIRÚRGICO & COAGULACIÓN'
  },
  {
    id: 'combo-banco-sangre',
    name: 'Tamizaje Donante Banco de Sangre MINSA',
    code: 'VZ509',
    description: 'Tipificación ABO/Rh + Panel 6 Marcadores MINSA (VIH, HBsAg, Anti-HBc, Anti-HCV, Chagas, Sífilis) + HTLV I/II + RAI Coombs',
    price: 75.00,
    tubes: ['Tubo Lila (EDTA)', 'Tubo Rojo (Suero Donante x2)'],
    category: 'BANCO DE SANGRE'
  },
  {
    id: 'combo-urgencias-stat',
    name: 'Panel STAT Cuidados Críticos & Cardíaco (HIS)',
    code: 'VZ510',
    description: 'Troponina I hs + Dímero D Cuantitativo + Procalcitonina + Gasometría Arterial con Lactato + Electrolitos',
    price: 110.00,
    tubes: ['Tubo Rojo (Suero)', 'Tubo Celeste (Citrato)', 'Jeringa Verde Heparinizada'],
    category: 'URGENCIAS & STAT'
  },
  {
    id: 'combo-prenatal',
    name: 'Perfil Prenatal & Nupcial MINSA',
    code: 'VZ511',
    description: 'Hemograma + Falcemia/Drepanocitos + VDRL/RPR + VIH 4ta Gen + Tipificación ABO/Rh + Urianálisis EGO + Glucosa',
    price: 48.00,
    tubes: ['Tubo Lila (EDTA)', 'Tubo Rojo (Suero)', 'Envase Orina'],
    category: 'SEROLOGÍA & PRENATAL'
  },
  {
    id: 'combo-dengue',
    name: 'Dengue Dúo + Hemograma Completo',
    code: 'VZ514',
    description: 'Antígeno NS1 + Anticuerpos IgM/IgG + Biometría Hemática con Recuento de Plaquetas',
    price: 35.00,
    tubes: ['Tubo Lila (EDTA)', 'Tubo Rojo (Suero)'],
    category: 'SEROLOGÍA & HEMATOLOGÍA'
  },
  {
    id: 'combo-fiebre',
    name: 'Combo Síndrome Febril Agudo',
    code: 'VZ506',
    description: 'Hemograma Completo + VSG + Examen General de Orina (EGO)',
    price: 28.00,
    tubes: ['Tubo Lila (EDTA)', 'Envase Estéril de Orina'],
    category: 'DIAGNÓSTICO INFECCIOSO'
  },
  {
    id: 'combo-gastro',
    name: 'Combo Gastrointestinal Integral',
    code: 'VZ502',
    description: 'Coprológico General + Sangre Oculta Inmunoquímica (FIT) + Rotavirus / Adenovirus',
    price: 38.00,
    tubes: ['Envase Coprológico Hermético'],
    category: 'COPROLOGÍA & PARASITOLOGÍA'
  },
  {
    id: 'combo-renal',
    name: 'Perfil Renal & Metabólico Avanzado',
    code: 'VZ512',
    description: 'BUN + Creatinina + Ácido Úrico + Depuración de Creatinina 24h + Microalbuminuria RAC + Electrolitos',
    price: 58.00,
    tubes: ['Tubo Rojo (Suero)', 'Galón Orina 24h', 'Frasco Orina Mañana'],
    category: 'NEFROLOGÍA & QUÍMICA'
  },
  {
    id: 'combo-hepatico',
    name: 'Perfil Hepático Integral & Coagulación',
    code: 'VZ513',
    description: 'AST + ALT + GGT + ALP + Bilirrubinas T/D/I + Albúmina + Proteínas + TP/INR + TTPa',
    price: 60.00,
    tubes: ['Tubo Rojo (Suero)', 'Tubo Celeste (Citrato 3.2%)'],
    category: 'HEPATOLOGÍA'
  }
];

export const BillingPOS: React.FC<BillingPOSProps> = ({
  orders,
  patients,
  testCatalog,
  tenant,
  branch,
  onOrderPaid
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [isJubiladoLey6, setIsJubiladoLey6] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'PUNTO_VENTA_POS' | 'ASEGURADORA' | 'ACH_TRANSFERENCIA'>('PUNTO_VENTA_POS');
  const [posProvider, setPosProvider] = useState<string>('BAC Credomatic (POS-01)');
  const [insuranceName, setInsuranceName] = useState<string>('ASSA Compañía de Seguros, S.A.');
  const [copayPercent, setCopayPercent] = useState<number>(20); // 20% copay, 80% covered
  const [policyNumber, setPolicyNumber] = useState<string>('POL-99210-PA');
  const [authCode, setAuthCode] = useState<string>('AUTH-ASSA-88219');
  const [selectedComboId, setSelectedComboId] = useState<string>('');
  const [issuedInvoice, setIssuedInvoice] = useState<InvoiceRecord | null>(null);

  // Modals & Notifications state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState<boolean>(false);
  const [whatsAppSent, setWhatsAppSent] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState<boolean>(false);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0] || null;
  const selectedPatient = patients.find((p) => p.id === selectedOrder?.patientId) || patients[0] || null;

  // Selected combo (if any)
  const activeCombo = CLINICAL_COMBOS.find((c) => c.id === selectedComboId);

  // Selected order tests or active combo tests
  const orderTests = testCatalog.filter((t) => selectedOrder?.testIds?.includes(t.id));
  const rawSubtotal = activeCombo ? activeCombo.price : orderTests.reduce((sum, t) => sum + t.price, 0);
  const baseSubtotal = rawSubtotal > 0 ? rawSubtotal : (selectedOrder ? (selectedOrder.totalAmount || 0.00) : 0.00);

  // Panama Ley 6 de 1987 (20% discount on laboratory services for Jubilados / Pensionados)
  const ley6DiscountAmount = isJubiladoLey6 ? baseSubtotal * 0.20 : 0;
  const subtotalAfterDiscount = baseSubtotal - ley6DiscountAmount;

  // Medical laboratory services are exempt from ITBMS (0%)
  const itbmsTax = 0.00;

  let patientPayAmount = subtotalAfterDiscount;
  let insurancePayAmount = 0;

  if (paymentMethod === 'ASEGURADORA') {
    patientPayAmount = subtotalAfterDiscount * (copayPercent / 100);
    insurancePayAmount = subtotalAfterDiscount * ((100 - copayPercent) / 100);
  }

  const handleIssueInvoice = () => {
    if (!selectedOrder) return;

    const randomCufe = `FE-01-2026-${tenant.ruc}-${tenant.dv}-${Math.floor(100000000 + Math.random() * 900000000)}`;
    const randomInvNum = `FAC-001-${Math.floor(10000 + Math.random() * 90000)}`;

    const newInvoice: InvoiceRecord = {
      invoiceNumber: randomInvNum,
      cufe: randomCufe,
      orderNumber: selectedOrder.orderNumber || 'ORD-N/A',
      patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : (selectedOrder.patientName || 'Paciente'),
      patientNationalId: selectedPatient?.nationalId || selectedOrder.patientNationalId || 'N/A',
      patientPhone: selectedPatient?.phone || '+507 6366-8296',
      patientEmail: selectedPatient?.email || 'cesar_16-_@hotmail.com',
      subtotal: baseSubtotal,
      discountLey6: ley6DiscountAmount,
      discountPercent: isJubiladoLey6 ? 20 : 0,
      itbmsTax,
      total: patientPayAmount,
      paymentMethod,
      posProvider: paymentMethod === 'PUNTO_VENTA_POS' ? posProvider : undefined,
      insuranceName: paymentMethod === 'ASEGURADORA' ? insuranceName : undefined,
      policyNumber: paymentMethod === 'ASEGURADORA' ? policyNumber : undefined,
      authorizationCode: paymentMethod === 'ASEGURADORA' ? authCode : undefined,
      createdAt: new Date().toISOString()
    };

    setIssuedInvoice(newInvoice);
    if (onOrderPaid) {
      onOrderPaid(selectedOrder.id, newInvoice);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!selectedOrder) return;
    const patientPhone = selectedPatient?.phone || '+507 6366-8296';
    const cleanPhone = patientPhone.replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone.startsWith('507') ? cleanPhone : `507${cleanPhone}`;

    const invNum = issuedInvoice?.invoiceNumber || `FAC-001-${selectedOrder.orderNumber.slice(-4)}`;
    const portalUrl = `https://${window.location.host}/portal/resultados?order=${encodeURIComponent(selectedOrder.orderNumber)}`;

    const message = 
`🏥 *${tenant.name.toUpperCase()}*
📋 *Comprobante de Facturación Electrónica DGI*

Estimado(a) *${selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : selectedOrder.patientName}*,
Le confirmamos el registro de su orden médica y emisión fiscal:

🔖 *Orden LIS:* ${selectedOrder.orderNumber}
🧾 *Factura DGI:* ${invNum}
${issuedInvoice ? `🔐 *CUFE:* ${issuedInvoice.cufe}\n` : ''}
💰 *Total Pagado:* $${patientPayAmount.toFixed(2)} USD
${paymentMethod === 'ASEGURADORA' ? `🛡️ *Aseguradora:* ${insuranceName} (Copago ${copayPercent}%)\n` : ''}${isJubiladoLey6 ? `👵 *Beneficio:* Descuento Ley 6 (20% Jubilados) aplicado\n` : ''}
🧪 *Procedimientos Solicitados:*
${orderTests.map(t => `• ${t.name}`).join('\n') || (activeCombo ? `• ${activeCombo.name}` : '• Análisis Clínicos de Laboratorio')}

📲 *Consulte sus Resultados en Línea:*
${portalUrl}

_Recibirá una notificación automática cuando sus resultados hayan sido validados por el Tecnólogo Médico._ 🩺`;

    try {
      await NotificationService.sendWhatsApp(finalPhone, message, 'FACTURA_Y_ORDEN_LIS');
    } catch (e) {
      console.warn('Registro local de WhatsApp guardado.');
    }

    const waUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    setWhatsAppSent(true);
    setTimeout(() => setWhatsAppSent(false), 3500);
  };

  const handleCopyPortalLink = () => {
    if (!selectedOrder) return;
    const portalUrl = `https://${window.location.host}/portal/resultados?order=${encodeURIComponent(selectedOrder.orderNumber)}`;
    navigator.clipboard.writeText(portalUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions Toolbar */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-teal-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-teal-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center space-x-2">
            <Receipt className="w-4 h-4" />
            <span>Admisión Clínica, POS & Facturación Multicanal (DGI Panamá)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Facturación, Caja & Comunicaciones
          </h1>
          <p className="text-teal-100 text-sm mt-1 max-w-xl">
            Gestión de pagos con descuento de Ley 6 (Jubilados 20%), co-pagos de aseguradoras en Panamá y despacho directo de comprobantes por <strong>Correo (SMTP)</strong> y <strong>WhatsApp 1-Clic</strong>.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSmtpModalOpen(true)}
            className="p-2.5 bg-slate-900/80 hover:bg-slate-850 text-teal-300 hover:text-white rounded-xl text-xs font-bold transition border border-teal-500/30 flex items-center space-x-1.5 shadow-md cursor-pointer"
            title="Configurar servidor SMTP del laboratorio"
          >
            <Settings className="w-4 h-4" />
            <span>Configurar SMTP</span>
          </button>

          <button
            type="button"
            onClick={handleCopyPortalLink}
            disabled={!selectedOrder}
            className={`p-2.5 bg-slate-900/80 hover:bg-slate-850 text-cyan-300 hover:text-white rounded-xl text-xs font-bold transition border border-cyan-500/30 flex items-center space-x-1.5 shadow-md ${
              !selectedOrder ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            title="Copiar enlace del portal web del paciente"
          >
            <Copy className="w-4 h-4" />
            <span>{linkCopied ? '¡Enlace Copiado!' : 'Copiar Link Portal'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEmailModalOpen(true)}
            disabled={!selectedOrder}
            className={`px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-black transition shadow-lg shadow-blue-500/20 flex items-center space-x-1.5 ${
              !selectedOrder ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Enviar Correo (SMTP)</span>
          </button>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            disabled={!selectedOrder}
            className={`px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-black transition shadow-lg shadow-emerald-500/25 flex items-center space-x-1.5 ${
              !selectedOrder ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{whatsAppSent ? '¡Abriendo WhatsApp!' : 'Enviar WhatsApp'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Order Selection, Clinical Combos & Payment Setup */}
        <div className="lg:col-span-7 space-y-6">
          {/* Order Selection */}
          <div className="bg-slate-900/95 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-teal-400" />
                <span>1. Seleccionar Orden Médica para Facturación</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {orders.length} órdenes registradas
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {orders.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                  <Receipt className="w-10 h-10 text-slate-600 mx-auto" />
                  <div className="text-sm font-bold text-slate-300">No hay órdenes pendientes de cobro</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Las órdenes registradas en Recepción o Flebotomía aparecerán aquí automáticamente para cobro en caja y facturación electrónica DGI.
                  </p>
                </div>
              ) : (
                orders.map((ord) => {
                  const isSelected = ord.id === selectedOrderId;
                  return (
                    <div
                      key={ord.id}
                      onClick={() => setSelectedOrderId(ord.id)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-teal-500/15 border-teal-500 ring-2 ring-teal-500/30 text-white shadow-lg'
                          : 'bg-slate-950/80 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white text-sm flex items-center space-x-2">
                          <span>{ord.orderNumber} — {ord.patientName}</span>
                          {ord.insuranceName && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-sans">
                              {ord.insuranceName}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                          <span>Cédula: <strong className="font-mono text-cyan-300">{ord.patientNationalId}</strong></span>
                          <span>•</span>
                          <span>Tel: <strong className="font-mono text-emerald-400">{selectedPatient?.phone || '+507 6366-8296'}</strong></span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-emerald-400 text-base font-mono">${(ord.totalAmount || 0).toFixed(2)}</div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          ord.paymentStatus === 'PAGADO' 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {ord.paymentStatus || 'PENDIENTE'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Clinical Combos & Profiles (Estilo Odoo pero con Desglose LIS) */}
          <div className="bg-slate-900/95 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <FlaskConical className="w-5 h-5 text-cyan-400" />
                <span>2. Combos & Perfiles de Laboratorio (Panamá)</span>
              </h3>
              <span className="text-[10px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-bold">
                Desglose Analítico Automatizado
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CLINICAL_COMBOS.map((combo) => {
                const isSelected = selectedComboId === combo.id;
                return (
                  <div
                    key={combo.id}
                    onClick={() => setSelectedComboId(isSelected ? '' : combo.id)}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500 ring-2 ring-cyan-500/30 text-white shadow-lg'
                        : 'bg-slate-950/80 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-white text-xs flex items-center space-x-1.5">
                          <span>{combo.name}</span>
                          <span className="text-[9px] font-mono text-slate-400">({combo.code})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {combo.description}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black font-mono text-emerald-400 text-sm">${combo.price.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Tubes required */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {combo.tubes.map((tube, i) => (
                        <span key={i} className="text-[9px] bg-slate-900 text-cyan-300 border border-slate-700 px-2 py-0.5 rounded-md font-mono">
                          {tube}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panama Ley 6 Discount Toggle */}
          <div className="bg-slate-900/95 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <Percent className="w-5 h-5 text-amber-400" />
              <span>3. Beneficios de Ley 6 de 1987 (Panamá)</span>
            </h3>

            <div className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-xl flex items-start space-x-3 text-xs text-amber-200">
              <input
                type="checkbox"
                id="ley6Check"
                checked={isJubiladoLey6}
                onChange={(e) => setIsJubiladoLey6(e.target.checked)}
                className="mt-1 rounded border-amber-500/50 text-amber-500 focus:ring-amber-500 bg-slate-950 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="ley6Check" className="cursor-pointer space-y-1">
                <span className="font-bold text-amber-300 block text-sm">
                  Aplicar 20% de Descuento por Ley de Jubilados / Pensionados / Tercera Edad
                </span>
                <p className="text-amber-300/80 text-[11px]">
                  Aplica a varones mayores de 62 años, damas mayores de 57 años y personas con discapacidad según Ley 6 de la República de Panamá.
                </p>
              </label>
            </div>
          </div>

          {/* Payment Method Selector & Insurance Provider Details */}
          <div className="bg-slate-900/95 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-teal-400" />
              <span>4. Método de Pago & Co-Pagos de Aseguradoras</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'PUNTO_VENTA_POS', label: 'Tarjeta / POS', desc: 'BAC / Banistmo' },
                { id: 'EFECTIVO', label: 'Efectivo', desc: 'Caja Recaudadora' },
                { id: 'ASEGURADORA', label: 'Aseguradora', desc: 'ASSA / MAPFRE / IS' },
                { id: 'ACH_TRANSFERENCIA', label: 'ACH / Yappy', desc: 'Banco General' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    paymentMethod === m.id
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/25 font-black'
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{m.label}</div>
                  <div className={`text-[10px] ${paymentMethod === m.id ? 'text-slate-950 font-bold opacity-80' : 'text-slate-500'}`}>
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Sub-options for POS */}
            {paymentMethod === 'PUNTO_VENTA_POS' && (
              <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                <label className="font-bold text-slate-300 block">Terminal POS Seleccionada:</label>
                <select
                  value={posProvider}
                  onChange={(e) => setPosProvider(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 font-semibold text-xs focus:outline-none focus:border-teal-400 cursor-pointer"
                >
                  <option value="BAC Credomatic (POS-01)">BAC Credomatic — Terminal Vía España #01</option>
                  <option value="St. Georges Bank (POS-02)">St. Georges Bank — Terminal Vía España #02</option>
                  <option value="Banistmo (POS-03)">Banistmo — Terminal Vía España #03</option>
                  <option value="Punto Pago POS">Punto Pago POS Integrado</option>
                </select>
              </div>
            )}

            {/* Sub-options for ASEGURADORAS DE PANAMÁ */}
            {paymentMethod === 'ASEGURADORA' && (
              <div className="bg-blue-950/40 p-4 rounded-xl border border-blue-500/30 text-xs space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-blue-200 block mb-1">Aseguradora Médica (Panamá):</label>
                    <select
                      value={insuranceName}
                      onChange={(e) => {
                        setInsuranceName(e.target.value);
                        const match = PANAMA_INSURANCES.find((i) => i.name === e.target.value);
                        if (match) setCopayPercent(match.defaultCopay);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 font-semibold text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      {PANAMA_INSURANCES.map((ins) => (
                        <option key={ins.id} value={ins.name}>
                          {ins.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-blue-200 block mb-1">Co-Pago del Paciente (%):</label>
                    <select
                      value={copayPercent}
                      onChange={(e) => setCopayPercent(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 font-semibold text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value={0}>0% Co-Pago (Cobertura 100% Seguro)</option>
                      <option value={10}>10% Co-Pago Paciente</option>
                      <option value={15}>15% Co-Pago Paciente</option>
                      <option value={20}>20% Co-Pago Paciente (Estándar Panamá)</option>
                      <option value={30}>30% Co-Pago Paciente</option>
                      <option value={50}>50% Co-Pago Paciente</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-blue-200 block mb-1">N° de Póliza / Carnet:</label>
                    <input
                      type="text"
                      value={policyNumber}
                      onChange={(e) => setPolicyNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 font-mono text-xs font-bold focus:outline-none focus:border-cyan-400"
                      placeholder="Ej. POL-99210-PA"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-blue-200 block mb-1">Código de Autorización / Reclamo:</label>
                    <input
                      type="text"
                      value={authCode}
                      onChange={(e) => setAuthCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 font-mono text-xs font-bold focus:outline-none focus:border-cyan-400"
                      placeholder="Ej. AUTH-ASSA-88219"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-500/20 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(true)}
                    className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>📄 Generar Formulario de Reclamo Oficial (Carta)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Financial Breakdown & Issued Ticket */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                Desglose Financiero DGI
              </span>
              <span className="text-xs text-slate-400 font-mono">{selectedOrder?.orderNumber || 'SIN ORDEN'}</span>
            </div>

            {/* Breakdown lines */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal Análisis Clínicos:</span>
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
                  <span>Cobertura {100 - copayPercent}% Seguro ({insuranceName.split(' ')[0]}):</span>
                  <span className="font-mono">-${insurancePayAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2">
                <span>ITBMS (Servicios Médicos Exentos):</span>
                <span className="font-mono">$0.00</span>
              </div>

              <div className="flex justify-between items-baseline border-t border-slate-800 pt-3 text-base">
                <span className="font-bold text-white">Total a Pagar Paciente:</span>
                <span className="font-black text-2xl text-emerald-400 font-mono">${patientPayAmount.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              onClick={handleIssueInvoice}
              disabled={!selectedOrder}
              className={`w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black py-3.5 rounded-xl text-sm transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 ${
                !selectedOrder ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{selectedOrder ? 'Emitir Factura Electrónica DGI & Registrar Cobro' : 'Seleccione una orden para facturar'}</span>
            </button>
          </div>

          {/* Render Issued DGI E-Invoice Ticket */}
          {issuedInvoice && (
            <div className="bg-slate-950 rounded-2xl p-6 border-2 border-emerald-500/70 shadow-2xl space-y-4 text-xs font-mono text-slate-200 animate-in fade-in duration-300">
              <div className="text-center border-b border-slate-800 pb-3 space-y-1">
                <div className="font-black text-white text-sm font-sans">{tenant.name}</div>
                <div className="text-slate-400 font-sans">{branch.name} — RUC: {tenant.ruc} DV: {tenant.dv}</div>
                <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-sans text-[11px] px-3 py-1 rounded-full inline-block mt-1">
                  Factura Electrónica DGI Aprobada
                </div>
              </div>

              <div className="space-y-1 text-slate-300 text-[11px]">
                <div>Factura N°: <strong className="text-emerald-400 font-mono">{issuedInvoice.invoiceNumber}</strong></div>
                <div>Orden LIS: <span className="text-white">{issuedInvoice.orderNumber}</span></div>
                <div>Fecha/Hora: {new Date(issuedInvoice.createdAt).toLocaleString('es-PA')}</div>
                <div>Cliente: <span className="text-white font-bold">{issuedInvoice.patientName}</span></div>
                <div>Cédula/RUC: <span className="text-cyan-300">{issuedInvoice.patientNationalId}</span></div>
                <div>Forma de Pago: <span className="text-amber-300">{issuedInvoice.paymentMethod}</span></div>
                {issuedInvoice.insuranceName && (
                  <div>Aseguradora: <span className="text-blue-300">{issuedInvoice.insuranceName}</span> (Aut: {issuedInvoice.authorizationCode})</div>
                )}
              </div>

              {/* Action Buttons inside Ticket */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(true)}
                  className="p-2.5 bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-500/30 rounded-xl font-sans font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Enviar Correo (SMTP)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="p-2.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 rounded-xl font-sans font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Enviar WhatsApp</span>
                </button>
              </div>

              {/* CUFE & QR DGI Code */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-[10px] space-y-2">
                <div className="flex items-center space-x-2">
                  <QrCode className="w-10 h-10 text-teal-400 shrink-0" />
                  <div className="break-all font-mono text-[9px] text-slate-400">
                    <strong className="text-slate-300">CUFE DGI:</strong>
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
                className="w-full bg-slate-900 hover:bg-slate-850 text-white font-sans font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-2 border border-slate-700 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>Imprimir Ticket Fiscal DGI</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SMTP Server Configuration Modal */}
      <SmtpConfigModal
        isOpen={isSmtpModalOpen}
        onClose={() => setIsSmtpModalOpen(false)}
      />

      {/* Email Invoice Dispatch Modal with Live HTML Preview */}
      {issuedInvoice && (
        <EmailInvoiceModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          invoice={issuedInvoice}
          tenant={tenant}
          branch={branch}
          recipientEmail={selectedPatient?.email || 'cesar_16-_@hotmail.com'}
          items={
            activeCombo
              ? [{ name: activeCombo.name, price: activeCombo.price }]
              : orderTests.map((t) => ({ name: t.name, price: t.price }))
          }
        />
      )}

      {isClaimModalOpen && selectedPatient && (
        <PanamaInsuranceClaimModal
          patient={selectedPatient}
          order={selectedOrder || undefined}
          tenant={tenant}
          onClose={() => setIsClaimModalOpen(false)}
        />
      )}
    </div>
  );
};
