import React, { useState } from 'react';
import {
  ShoppingBag,
  Truck,
  Package,
  Plus,
  Search,
  ChevronRight,
  FileText,
  CheckCircle2,
  Clock,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Building2,
  Printer,
  ShieldCheck,
  ThermometerSnowflake,
  ExternalLink,
  Trash2,
  Send,
  Calendar,
  Check,
  X,
  FileCheck2,
  Flame,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface PurchaseOrderItem {
  id: string;
  itemCode: string;
  description: string;
  quantity: number;
  unit: string; // e.g. 'Kits (500 det)', 'Cajas x 100', 'Frascos 2L', 'Viales'
  unitPrice: number;
  totalPrice: number;
  tempCondition: '2_8_C' | 'MINUS_20_C' | 'AMBIENTE_15_25_C';
  lotNumber?: string;
  expirationDate?: string;
}

export type PurchaseOrderStatus = 
  | 'BORRADOR'
  | 'APROBADA'
  | 'ENVIADA_PROVEEDOR'
  | 'EN_TRANSITO'
  | 'RECEPCIONADA'
  | 'CANCELADA';

export interface PurchaseOrder {
  id: string;
  orderNumber: string; // e.g. 'OC-2026-0041'
  supplierId: string;
  supplierName: string;
  supplierRuc: string;
  supplierContact: string;
  supplierEmail: string;
  createdAt: string;
  estimatedDeliveryDate: string;
  status: PurchaseOrderStatus;
  requestedBy: string;
  approvedBy?: string;
  clinicalJustification: string;
  paymentTerms: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  items: PurchaseOrderItem[];
  receptionNotes?: string;
  receivedAt?: string;
  receivedBy?: string;
  supplierInvoiceNumber?: string;
}

export interface Supplier {
  id: string;
  name: string;
  ruc: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  leadTimeDays: number;
  isoAccredited: boolean;
  complianceRating: number; // 0 to 100%
}

// Initial realistic suppliers in Panama
const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-01',
    name: 'Roche Diagnostics Panamá S.A.',
    ruc: '12890-41-55092 DV 81',
    category: 'Química Clínica & Inmunoensayos',
    contactName: 'Lic. Mariana Batista',
    phone: '+507 205-8800',
    email: 'pedidos.panama@roche.com',
    address: 'Costa del Este, Financial Park, Piso 18, Panamá',
    leadTimeDays: 3,
    isoAccredited: true,
    complianceRating: 98
  },
  {
    id: 'sup-02',
    name: 'Sysmex América Latina / Intermédica',
    ruc: '89012-12-44129 DV 14',
    category: 'Hematología & Coagulación',
    contactName: 'Ing. Carlos Mendoza',
    phone: '+507 269-3310',
    email: 'ventas@intermedicapa.com',
    address: 'Vía Transístmica, Edificio Intermédica, Panamá',
    leadTimeDays: 2,
    isoAccredited: true,
    complianceRating: 99
  },
  {
    id: 'sup-03',
    name: 'Bio-Rad Laboratories Inc.',
    ruc: '44019-90-12884 DV 22',
    category: 'Control de Calidad & Banco de Sangre',
    contactName: 'Licda. Katherine Ríos',
    phone: '+507 301-4450',
    email: 'pedidos@bio-rad.com.pa',
    address: 'Plaza Credicorp Bank, Calle 50, Panamá',
    leadTimeDays: 4,
    isoAccredited: true,
    complianceRating: 97
  },
  {
    id: 'sup-04',
    name: 'Becton Dickinson (BD Vacutainer)',
    ruc: '77120-15-88190 DV 09',
    category: 'Flebotomía & Bioseguridad',
    contactName: 'Lic. Fernando Arango',
    phone: '+507 214-9900',
    email: 'clientes.panama@bd.com',
    address: 'Clayton, Ciudad del Saber, Edif. 231, Panamá',
    leadTimeDays: 2,
    isoAccredited: true,
    complianceRating: 96
  },
  {
    id: 'sup-05',
    name: 'Werfen / Instrumentation Laboratory',
    ruc: '55192-33-77102 DV 45',
    category: 'Hemostasia & Gases Arteriales',
    contactName: 'Dra. Gabriela Boyd',
    phone: '+507 223-1188',
    email: 'info.panama@werfen.com',
    address: 'Obarrio, Calle 54 Este, PH SL55, Panamá',
    leadTimeDays: 3,
    isoAccredited: true,
    complianceRating: 95
  }
];

// Initial realistic purchase orders
const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-001',
    orderNumber: 'OC-2026-0041',
    supplierId: 'sup-01',
    supplierName: 'Roche Diagnostics Panamá S.A.',
    supplierRuc: '12890-41-55092 DV 81',
    supplierContact: 'Lic. Mariana Batista',
    supplierEmail: 'pedidos.panama@roche.com',
    createdAt: '2026-09-06T10:30:00Z',
    estimatedDeliveryDate: '2026-09-09',
    status: 'EN_TRANSITO',
    requestedBy: 'Lic. Sofía Guardia (TM-4091)',
    approvedBy: 'Dr. Roberto Icaza (Director Médico)',
    clinicalJustification: 'Reposición preventiva de reactivos críticos para área de Urgencias y UCI (Troponina I y Glucosa HK).',
    paymentTerms: 'Crédito a 30 días factura comercial',
    subtotal: 1775.00,
    taxAmount: 0.00, // Insumos médicos exentos de ITBMS según ley fiscal panameña
    totalAmount: 1775.00,
    items: [
      {
        id: 'poi-1',
        itemCode: 'REA-GLU-001',
        description: 'Kit de Glucosa HK Cobas 5600/6000 (Cassette 500 det)',
        quantity: 4,
        unit: 'Kits (500 det)',
        unitPrice: 185.00,
        totalPrice: 740.00,
        tempCondition: '2_8_C'
      },
      {
        id: 'poi-2',
        itemCode: 'REA-TROP-002',
        description: 'Troponina I de Alta Sensibilidad hs-cTnI Elecsys (100 det)',
        quantity: 2,
        unit: 'Kits (100 det)',
        unitPrice: 420.00,
        totalPrice: 840.00,
        tempCondition: '2_8_C'
      },
      {
        id: 'poi-3',
        itemCode: 'SOL-CLN-003',
        description: 'Solución Lavadora y Desproteinizante Cobas Clean Cell 2L',
        quantity: 3,
        unit: 'Frascos 2L',
        unitPrice: 65.00,
        totalPrice: 195.00,
        tempCondition: 'AMBIENTE_15_25_C'
      }
    ]
  },
  {
    id: 'po-002',
    orderNumber: 'OC-2026-0042',
    supplierId: 'sup-02',
    supplierName: 'Sysmex América Latina / Intermédica',
    supplierRuc: '89012-12-44129 DV 14',
    supplierContact: 'Ing. Carlos Mendoza',
    supplierEmail: 'ventas@intermedicapa.com',
    createdAt: '2026-09-04T08:15:00Z',
    estimatedDeliveryDate: '2026-09-06',
    status: 'RECEPCIONADA',
    requestedBy: 'Lic. Javier Gómez (TM-3890)',
    approvedBy: 'Dr. Roberto Icaza (Director Médico)',
    clinicalJustification: 'Reposición mensual de reactivos para analizador hematológico Sysmex XN-1000.',
    paymentTerms: 'Crédito a 30 días',
    subtotal: 1680.00,
    taxAmount: 0.00,
    totalAmount: 1680.00,
    receivedAt: '2026-09-06T14:20:00Z',
    receivedBy: 'Lic. Sofía Guardia (TM-4091)',
    supplierInvoiceNumber: 'FAC-INT-88912',
    receptionNotes: 'Mercancía recibida en óptimas condiciones. Cadena de frío verificada con datalogger a 4.2 °C. Lotes registrados en Kardex.',
    items: [
      {
        id: 'poi-4',
        itemCode: 'DIL-SYS-001',
        description: 'Cellpack DCL Diluyente Hematológico Sysmex 20L',
        quantity: 6,
        unit: 'Cajas 20L',
        unitPrice: 95.00,
        totalPrice: 570.00,
        tempCondition: 'AMBIENTE_15_25_C',
        lotNumber: 'LOT-2026-DCL44',
        expirationDate: '2027-08-30'
      },
      {
        id: 'poi-5',
        itemCode: 'REA-WDF-002',
        description: 'Fluorocell WDF Reactivo Diferencial de 5 Poblaciones',
        quantity: 2,
        unit: 'Kits',
        unitPrice: 310.00,
        totalPrice: 620.00,
        tempCondition: '2_8_C',
        lotNumber: 'LOT-2026-WDF19',
        expirationDate: '2027-03-15'
      },
      {
        id: 'poi-6',
        itemCode: 'REA-WNR-003',
        description: 'Lysercell WNR Reactivo Recuento Eritroblastos y Basófilos',
        quantity: 2,
        unit: 'Kits',
        unitPrice: 245.00,
        totalPrice: 490.00,
        tempCondition: '2_8_C',
        lotNumber: 'LOT-2026-WNR88',
        expirationDate: '2027-04-10'
      }
    ]
  },
  {
    id: 'po-003',
    orderNumber: 'OC-2026-0043',
    supplierId: 'sup-04',
    supplierName: 'Becton Dickinson (BD Vacutainer)',
    supplierRuc: '77120-15-88190 DV 09',
    supplierContact: 'Lic. Fernando Arango',
    supplierEmail: 'clientes.panama@bd.com',
    createdAt: '2026-09-07T11:00:00Z',
    estimatedDeliveryDate: '2026-09-10',
    status: 'ENVIADA_PROVEEDOR',
    requestedBy: 'Lic. Karen Ortega (Flebotomista Jefe)',
    approvedBy: 'Dr. Roberto Icaza (Director Médico)',
    clinicalJustification: 'Insumos de flebotomía y tubos de toma de muestra para abastecimiento quincenal de todas las sedes.',
    paymentTerms: 'Contado contra entrega con cheque',
    subtotal: 1392.00,
    taxAmount: 0.00,
    totalAmount: 1392.00,
    items: [
      {
        id: 'poi-7',
        itemCode: 'TUB-RED-001',
        description: 'Tubos BD Vacutainer Tapa Roja con Activador Clot 4.0 mL (Caja x 100)',
        quantity: 10,
        unit: 'Cajas x 100',
        unitPrice: 38.00,
        totalPrice: 380.00,
        tempCondition: 'AMBIENTE_15_25_C'
      },
      {
        id: 'poi-8',
        itemCode: 'TUB-LAV-002',
        description: 'Tubos BD Vacutainer Plus K2-EDTA Tapa Lila 3.0 mL (Caja x 100)',
        quantity: 12,
        unit: 'Cajas x 100',
        unitPrice: 41.00,
        totalPrice: 492.00,
        tempCondition: 'AMBIENTE_15_25_C'
      },
      {
        id: 'poi-9',
        itemCode: 'TUB-BLU-003',
        description: 'Tubos BD Vacutainer Citrato de Sodio 3.2% Tapa Celeste 2.7 mL (Caja x 100)',
        quantity: 6,
        unit: 'Cajas x 100',
        unitPrice: 44.00,
        totalPrice: 264.00,
        tempCondition: 'AMBIENTE_15_25_C'
      },
      {
        id: 'poi-10',
        itemCode: 'AGU-ECL-004',
        description: 'Agujas Múltiples de Seguridad BD Eclipse 21G x 1.25" (Caja x 48)',
        quantity: 8,
        unit: 'Cajas x 48',
        unitPrice: 32.00,
        totalPrice: 256.00,
        tempCondition: 'AMBIENTE_15_25_C'
      }
    ]
  },
  {
    id: 'po-004',
    orderNumber: 'OC-2026-0044',
    supplierId: 'sup-03',
    supplierName: 'Bio-Rad Laboratories Inc.',
    supplierRuc: '44019-90-12884 DV 22',
    supplierContact: 'Licda. Katherine Ríos',
    supplierEmail: 'pedidos@bio-rad.com.pa',
    createdAt: '2026-09-08T09:40:00Z',
    estimatedDeliveryDate: '2026-09-12',
    status: 'BORRADOR',
    requestedBy: 'Lic. Sofía Guardia (TM-4091)',
    clinicalJustification: 'Controles de calidad externos y tarjetas de gel para pruebas cruzadas en Banco de Sangre.',
    paymentTerms: 'Crédito a 30 días',
    subtotal: 1920.00,
    taxAmount: 0.00,
    totalAmount: 1920.00,
    items: [
      {
        id: 'poi-11',
        itemCode: 'QC-BIO-001',
        description: 'Control de Calidad Multiquímica Lyphochek Nivel 1 & 2 (Pack 12 x 5 mL)',
        quantity: 2,
        unit: 'Cajas (12 viales)',
        unitPrice: 540.00,
        totalPrice: 1080.00,
        tempCondition: '2_8_C'
      },
      {
        id: 'poi-12',
        itemCode: 'GEL-BIO-002',
        description: 'Tarjetas en Gel Coombs / Antiglobulina Humana Grifols/Bio-Rad (Caja x 50)',
        quantity: 3,
        unit: 'Cajas x 50',
        unitPrice: 280.00,
        totalPrice: 840.00,
        tempCondition: '2_8_C'
      }
    ]
  }
];

export const SupplierPurchasingManager: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [suppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('TODAS');
  
  // Modals state
  const [selectedPoForView, setSelectedPoForView] = useState<PurchaseOrder | null>(null);
  const [isNewPoModalOpen, setIsNewPoModalOpen] = useState<boolean>(false);
  const [poForReception, setPoForReception] = useState<PurchaseOrder | null>(null);

  // New PO Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0].id);
  const [clinicalJustification, setClinicalJustification] = useState<string>('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newPoItems, setNewPoItems] = useState<Array<{
    description: string;
    itemCode: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    tempCondition: '2_8_C' | 'MINUS_20_C' | 'AMBIENTE_15_25_C';
  }>>([
    {
      description: 'Kit de Glucosa HK Cobas 5600',
      itemCode: 'REA-GLU-001',
      quantity: 2,
      unit: 'Kits',
      unitPrice: 185.00,
      tempCondition: '2_8_C'
    }
  ]);

  // Reception Form state
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [lotNumber, setLotNumber] = useState<string>('');
  const [receptionNotes, setReceptionNotes] = useState<string>('Mercancía verificada, empaques íntegros y temperatura en rango.');

  // Filtered list
  const filteredOrders = purchaseOrders.filter((po) => {
    const matchesSearch = 
      po.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.items.some(i => i.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'TODAS' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Financial summary metrics
  const totalPurchasesAmount = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
  const inTransitCount = purchaseOrders.filter(po => po.status === 'EN_TRANSITO').length;
  const pendingReceptionCount = purchaseOrders.filter(po => po.status === 'ENVIADA_PROVEEDOR' || po.status === 'EN_TRANSITO').length;
  const receivedCount = purchaseOrders.filter(po => po.status === 'RECEPCIONADA').length;

  const handleAddItemToNewPo = () => {
    setNewPoItems([
      ...newPoItems,
      {
        description: '',
        itemCode: `ITEM-${Date.now().toString().slice(-4)}`,
        quantity: 1,
        unit: 'Kits',
        unitPrice: 50.00,
        tempCondition: '2_8_C'
      }
    ]);
  };

  const handleRemoveItemFromNewPo = (idx: number) => {
    if (newPoItems.length === 1) return;
    setNewPoItems(newPoItems.filter((_, i) => i !== idx));
  };

  const handleCreateNewPo = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSupplier = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];
    
    const calculatedItems: PurchaseOrderItem[] = newPoItems.map((item, idx) => ({
      id: `poi-${Date.now()}-${idx}`,
      itemCode: item.itemCode || `ITM-${idx + 1}`,
      description: item.description || 'Insumo de Laboratorio',
      quantity: Number(item.quantity) || 1,
      unit: item.unit,
      unitPrice: Number(item.unitPrice) || 0,
      totalPrice: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
      tempCondition: item.tempCondition
    }));

    const subtotal = calculatedItems.reduce((acc, cur) => acc + cur.totalPrice, 0);
    const orderNum = `OC-2026-00${purchaseOrders.length + 42}`;

    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      orderNumber: orderNum,
      supplierId: targetSupplier.id,
      supplierName: targetSupplier.name,
      supplierRuc: targetSupplier.ruc,
      supplierContact: targetSupplier.contactName,
      supplierEmail: targetSupplier.email,
      createdAt: new Date().toISOString(),
      estimatedDeliveryDate,
      status: 'APROBADA',
      requestedBy: 'Lic. Sofía Guardia (TM)',
      approvedBy: 'Dr. Roberto Icaza (Director Médico)',
      clinicalJustification: clinicalJustification || 'Reposición para continuidad operativa.',
      paymentTerms: 'Crédito a 30 días',
      subtotal,
      taxAmount: 0.00,
      totalAmount: subtotal,
      items: calculatedItems
    };

    setPurchaseOrders([newPo, ...purchaseOrders]);
    setIsNewPoModalOpen(false);
    setClinicalJustification('');
  };

  const handleAdvanceStatus = (orderId: string, newStatus: PurchaseOrderStatus) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === orderId) {
        return {
          ...po,
          status: newStatus,
          approvedBy: newStatus === 'APROBADA' || newStatus === 'ENVIADA_PROVEEDOR' ? 'Dr. Roberto Icaza (Director Médico)' : po.approvedBy
        };
      }
      return po;
    }));
  };

  const handleConfirmReception = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poForReception) return;

    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poForReception.id) {
        return {
          ...po,
          status: 'RECEPCIONADA',
          receivedAt: new Date().toISOString(),
          receivedBy: 'Lic. Sofía Guardia (TM-4091)',
          supplierInvoiceNumber: invoiceNumber || 'FAC-CONFIRMADA',
          receptionNotes: receptionNotes || 'Mercancía ingresada y lotes homologados en Kardex.',
          items: po.items.map(item => ({
            ...item,
            lotNumber: lotNumber || `LOT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }))
        };
      }
      return po;
    }));

    setPoForReception(null);
    setInvoiceNumber('');
    setLotNumber('');
  };

  return (
    <div className="space-y-6 text-slate-100 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase px-3 py-1 rounded-full flex items-center space-x-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Supply Chain & Procurement LIS / HIS</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Módulo Oficial de Órdenes de Compra
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-3">
              <span>Órdenes de Compra, Reactivos & Proveedores</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Gestión centralizada del ciclo de adquisiciones: emisión de órdenes de compra (OC), control de cadena de frío (2°C a 8°C), homologación de proveedores y recepción directa hacia el inventario FEFO.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsNewPoModalOpen(true)}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Orden de Compra</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center justify-between">
            <span>Presupuesto Comprometido</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </span>
          <span className="text-xl sm:text-2xl font-black text-white font-mono">
            ${totalPurchasesAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-emerald-400 block font-medium">{purchaseOrders.length} órdenes registradas</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center justify-between">
            <span>En Tránsito / Despachadas</span>
            <Truck className="w-4 h-4 text-cyan-400" />
          </span>
          <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">{inTransitCount}</span>
          <span className="text-[10px] text-slate-400 block">Con monitor de cadena de frío</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center justify-between">
            <span>Pendientes de Recepción</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono">{pendingReceptionCount}</span>
          <span className="text-[10px] text-amber-300/80 block">En espera de entrega a bodega</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center justify-between">
            <span>Recepcionadas en Kardex</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </span>
          <span className="text-xl sm:text-2xl font-black text-teal-300 font-mono">{receivedCount}</span>
          <span className="text-[10px] text-teal-400 block font-medium">Lotes integrados al stock</span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Homologated Suppliers Directory */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>Proveedores Homologados ({suppliers.length})</span>
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                ISO 15189 OK
              </span>
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {suppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="p-3.5 bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl transition space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{sup.name}</span>
                    <span className="text-[10px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                      {sup.complianceRating}% Cumplimiento
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">RUC: {sup.ruc}</div>
                  <div className="text-[11px] text-slate-300 font-medium">{sup.category}</div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900">
                    <span>Contacto: {sup.contactName}</span>
                    <span className="text-teal-400">Entrega: {sup.leadTimeDays} días</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Purchase Orders List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por N° OC (ej. OC-2026-0041), proveedor o reactivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
                {(['TODAS', 'BORRADOR', 'ENVIADA_PROVEEDOR', 'EN_TRANSITO', 'RECEPCIONADA'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer shrink-0 ${
                      statusFilter === st
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {st === 'TODAS' ? 'Todas' : st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Table of Orders */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 rounded-l-xl">N° Orden</th>
                    <th className="p-3">Proveedor Homologado</th>
                    <th className="p-3">Ítems Solicitados</th>
                    <th className="p-3">Monto Total</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 rounded-r-xl text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {filteredOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3">
                        <div className="font-mono font-bold text-amber-300">{po.orderNumber}</div>
                        <div className="text-[10px] text-slate-500">{new Date(po.createdAt).toLocaleDateString('es-PA')}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-white">{po.supplierName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">RUC: {po.supplierRuc}</div>
                      </td>

                      <td className="p-3">
                        <div className="text-slate-300 font-bold">{po.items.length} líneas de reactivos</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs">
                          {po.items.map(i => i.description).join(', ')}
                        </div>
                      </td>

                      <td className="p-3 font-mono font-bold text-emerald-400 text-sm">
                        ${po.totalAmount.toFixed(2)}
                      </td>

                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center space-x-1 ${
                          po.status === 'RECEPCIONADA'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : po.status === 'EN_TRANSITO'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse'
                            : po.status === 'ENVIADA_PROVEEDOR'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          <span>{po.status.replace('_', ' ')}</span>
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setSelectedPoForView(po)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                            title="Ver Orden de Compra Oficial"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {po.status === 'BORRADOR' && (
                            <button
                              onClick={() => handleAdvanceStatus(po.id, 'ENVIADA_PROVEEDOR')}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] transition cursor-pointer flex items-center space-x-1"
                              title="Aprobar y Enviar al Proveedor"
                            >
                              <Send className="w-3 h-3" />
                              <span>Enviar</span>
                            </button>
                          )}

                          {po.status === 'ENVIADA_PROVEEDOR' && (
                            <button
                              onClick={() => handleAdvanceStatus(po.id, 'EN_TRANSITO')}
                              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-[10px] transition cursor-pointer flex items-center space-x-1"
                              title="Marcar como Despachada / En Tránsito"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Despacho</span>
                            </button>
                          )}

                          {po.status === 'EN_TRANSITO' && (
                            <button
                              onClick={() => setPoForReception(po)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] transition cursor-pointer flex items-center space-x-1 shadow-md shadow-emerald-600/30"
                              title="Recepcionar en Bodega de Laboratorio"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Recepcionar</span>
                            </button>
                          )}

                          {po.status === 'RECEPCIONADA' && (
                            <span className="text-[10px] text-teal-400 font-bold flex items-center space-x-1">
                              <Check className="w-3 h-3" />
                              <span>En Stock</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: NUEVA ORDEN DE COMPRA */}
      {isNewPoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <span>Creación de Nueva Orden de Compra (OC)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Emisión oficial de pedido a proveedor homologado para abastecimiento del laboratorio
                </p>
              </div>
              <button
                onClick={() => setIsNewPoModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewPo} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Proveedor Homologado</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Fecha Estimada de Entrega</label>
                  <input
                    type="date"
                    value={estimatedDeliveryDate}
                    onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Justificación Clínica / Motivo de Compra</label>
                <input
                  type="text"
                  placeholder="Ej: Reposición de reactivos críticos con stock bajo umbral en área de Química."
                  value={clinicalJustification}
                  onChange={(e) => setClinicalJustification(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* Items Line Editor */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <label className="font-black uppercase tracking-wider text-slate-300 text-[11px]">
                    Ítems / Reactivos Solicitados ({newPoItems.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemToNewPo}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[10px] cursor-pointer flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar Ítem</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {newPoItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <label className="text-[10px] text-slate-400 block">Descripción del Reactivo / Insumo</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...newPoItems];
                            updated[idx].description = e.target.value;
                            setNewPoItems(updated);
                          }}
                          placeholder="Ej: Kit Troponina I Elecsys 100 det"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 block">Cantidad</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...newPoItems];
                            updated[idx].quantity = Number(e.target.value);
                            setNewPoItems(updated);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-mono text-center"
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 block">Precio Unit ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const updated = [...newPoItems];
                            updated[idx].unitPrice = Number(e.target.value);
                            setNewPoItems(updated);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-mono text-right"
                          required
                        />
                      </div>

                      <div className="col-span-2 text-right">
                        <label className="text-[10px] text-slate-400 block">Subtotal</label>
                        <span className="font-mono font-bold text-emerald-400 text-xs">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </span>
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemFromNewPo(idx)}
                          className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                          disabled={newPoItems.length === 1}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl flex items-center justify-between text-xs font-bold border border-slate-800 mt-2">
                  <span className="text-slate-300">Total General Estimado de la Orden:</span>
                  <span className="text-lg font-mono font-black text-emerald-400">
                    ${newPoItems.reduce((acc, cur) => acc + (cur.quantity * cur.unitPrice), 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewPoModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  Generar y Aprobar Orden de Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECEPCIÓN DE MERCANCÍA */}
      {poForReception && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Recepción de Mercancía • {poForReception.orderNumber}</h3>
              </div>
              <button
                onClick={() => setPoForReception(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReception} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-white">{poForReception.supplierName}</div>
                <div className="text-[11px] text-slate-400">{poForReception.items.length} productos en orden • Total: ${poForReception.totalAmount.toFixed(2)}</div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">N° de Factura / Remisión del Proveedor</label>
                <input
                  type="text"
                  placeholder="Ej: FAC-ROCHE-2026-9901"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">N° de Lote Principal Recibido</label>
                <input
                  type="text"
                  placeholder="Ej: LOT-2026-ROC881"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Observaciones de Inspección y Cadena de Frío</label>
                <textarea
                  rows={2}
                  value={receptionNotes}
                  onChange={(e) => setReceptionNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white resize-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPoForReception(null)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Ingresar a Inventario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER / IMPRIMIR ORDEN DE COMPRA OFICIAL */}
      {selectedPoForView && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto text-slate-900">
            {/* Printable Sheet */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              {/* Header Company & PO Title */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-4 gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">PLATAFORMA-LIS • CLÍNICA & LABORATORIO SAN JOSÉ</h2>
                  <p className="text-xs text-slate-500 font-mono">RUC: 15569201-2-2024 DV 44 • Ciudad de Panamá</p>
                  <p className="text-xs text-slate-500">Almacén Central de Laboratorio & Farmacia Hospitalaria</p>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase font-black text-slate-400 block">ORDEN DE COMPRA OFICIAL</span>
                  <span className="text-2xl font-mono font-black text-indigo-700 block">{selectedPoForView.orderNumber}</span>
                  <span className="text-xs text-slate-500">Fecha: {new Date(selectedPoForView.createdAt).toLocaleDateString('es-PA')}</span>
                </div>
              </div>

              {/* Supplier & Delivery Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block">PROVEEDOR:</span>
                  <div className="font-black text-slate-900 text-sm">{selectedPoForView.supplierName}</div>
                  <div className="text-slate-600 font-mono">RUC: {selectedPoForView.supplierRuc}</div>
                  <div className="text-slate-600">Contacto: {selectedPoForView.supplierContact} ({selectedPoForView.supplierEmail})</div>
                </div>

                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block">CONDICIONES DE ENTREGA:</span>
                  <div>Términos de Pago: <strong className="text-slate-900">{selectedPoForView.paymentTerms}</strong></div>
                  <div>Fecha Estimada: <strong className="text-slate-900">{selectedPoForView.estimatedDeliveryDate}</strong></div>
                  <div>Lugar: <strong className="text-slate-900">Recepción Bodega San José, Vía España</strong></div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-black border-y border-slate-200">
                    <tr>
                      <th className="p-2.5">Código</th>
                      <th className="p-2.5">Descripción del Insumo / Reactivo</th>
                      <th className="p-2.5 text-center">Condición Frío</th>
                      <th className="p-2.5 text-center">Cant.</th>
                      <th className="p-2.5 text-right">Precio Unit.</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {selectedPoForView.items.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2.5 font-mono font-bold text-indigo-700">{it.itemCode}</td>
                        <td className="p-2.5 font-bold text-slate-900">{it.description}</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-100 text-blue-800">
                            {it.tempCondition.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-bold font-mono">{it.quantity}</td>
                        <td className="p-2.5 text-right font-mono">${it.unitPrice.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono font-black text-slate-900">${it.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation */}
              <div className="flex justify-end pt-2 border-t border-slate-200">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Exento ITBMS:</span>
                    <span className="font-mono font-bold">${selectedPoForView.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Impuestos (ITBMS 7% Insumos Médicos):</span>
                    <span className="font-mono">$0.00</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-300">
                    <span>TOTAL A PAGAR:</span>
                    <span className="font-mono text-indigo-700 text-base">${selectedPoForView.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs text-slate-500 border-t border-slate-200">
                <div className="space-y-1">
                  <div className="border-b border-slate-300 w-48 mx-auto h-8"></div>
                  <p className="font-bold text-slate-800">Solicitado por</p>
                  <p className="text-[10px]">{selectedPoForView.requestedBy}</p>
                </div>
                <div className="space-y-1">
                  <div className="border-b border-slate-300 w-48 mx-auto h-8"></div>
                  <p className="font-bold text-slate-800">Aprobado por Dirección Médica</p>
                  <p className="text-[10px]">{selectedPoForView.approvedBy || 'Dr. Roberto Icaza (MP-3912)'}</p>
                </div>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex items-center justify-between text-xs">
              <button
                onClick={() => setSelectedPoForView(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl font-bold cursor-pointer"
              >
                Cerrar
              </button>

              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center space-x-2 transition cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Descargar Orden de Compra</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierPurchasingManager;
