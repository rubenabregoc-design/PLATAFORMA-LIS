import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Smartphone,
  Shield,
  Receipt,
  Printer,
  CheckCircle2,
  User,
  QrCode,
  Tag,
  Building2,
  Sparkles,
  AlertTriangle,
  X,
  Package
} from 'lucide-react';
import { REAL_PATIENTS_DIR } from '../../data/realClinicalData';

export interface RetailMedicationItem {
  id: string;
  name: string;
  genericName: string;
  category: 'ANTIBIOTICOS' | 'ANALGESICOS' | 'CARDIOVASCULAR' | 'METABOLICO' | 'GASTRO' | 'RESPIRATORIO' | 'ALERGIAS';
  presentation: string; // e.g. "Caja x 20 Comprimidos"
  minsaRegister: string; // e.g. "Reg. San. 88129-PA"
  barcode: string;
  unitPrice: number;
  stock: number;
  shelfLocation: string; // e.g. "Gaveta B-04"
  requiresPrescription: boolean;
}

export interface RetailCartItem {
  medication: RetailMedicationItem;
  quantity: number;
}

export interface RetailInvoiceRecord {
  id: string;
  invoiceNumber: string;
  cufe: string;
  timestamp: string;
  customerName: string;
  customerNationalId: string;
  isJubilado: boolean;
  items: { name: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  discountLey6: number;
  itbms: number;
  total: number;
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'YAPPY' | 'ASEGURADORA';
  insuranceName?: string;
  cashReceived?: number;
  cashChange?: number;
}

const RETAIL_CATALOG: RetailMedicationItem[] = [
  {
    id: 'med-1',
    name: 'Augmentin 875/125mg',
    genericName: 'Amoxicilina + Ácido Clavulánico',
    category: 'ANTIBIOTICOS',
    presentation: 'Caja x 14 Comprimidos Recubiertos',
    minsaRegister: 'Reg. San. 42109-PA',
    barcode: '745100293810',
    unitPrice: 19.50,
    stock: 45,
    shelfLocation: 'Gaveta A-02',
    requiresPrescription: true
  },
  {
    id: 'med-2',
    name: 'Panadol Extra 500mg',
    genericName: 'Acetaminofén + Cafeína',
    category: 'ANALGESICOS',
    presentation: 'Caja x 24 Tabletas',
    minsaRegister: 'Reg. San. 12903-PA',
    barcode: '745100449120',
    unitPrice: 4.80,
    stock: 120,
    shelfLocation: 'Estante 1 - Frontal',
    requiresPrescription: false
  },
  {
    id: 'med-3',
    name: 'Motrin 600mg',
    genericName: 'Ibuprofeno',
    category: 'ANALGESICOS',
    presentation: 'Caja x 20 Grageas',
    minsaRegister: 'Reg. San. 33108-PA',
    barcode: '745100882190',
    unitPrice: 6.90,
    stock: 64,
    shelfLocation: 'Gaveta A-05',
    requiresPrescription: false
  },
  {
    id: 'med-4',
    name: 'Zithromax 500mg',
    genericName: 'Azitromicina Dihidrato',
    category: 'ANTIBIOTICOS',
    presentation: 'Caja x 3 Tabletas',
    minsaRegister: 'Reg. San. 77201-PA',
    barcode: '745100551020',
    unitPrice: 15.25,
    stock: 32,
    shelfLocation: 'Gaveta A-03',
    requiresPrescription: true
  },
  {
    id: 'med-5',
    name: 'Cozaar 50mg',
    genericName: 'Losartán Potásico',
    category: 'CARDIOVASCULAR',
    presentation: 'Caja x 30 Tabletas',
    minsaRegister: 'Reg. San. 66019-PA',
    barcode: '745100993040',
    unitPrice: 14.50,
    stock: 58,
    shelfLocation: 'Gaveta C-01',
    requiresPrescription: true
  },
  {
    id: 'med-6',
    name: 'Glucophage 850mg',
    genericName: 'Metformina Clorhidrato',
    category: 'METABOLICO',
    presentation: 'Caja x 30 Tabletas',
    minsaRegister: 'Reg. San. 55104-PA',
    barcode: '745100771120',
    unitPrice: 11.20,
    stock: 75,
    shelfLocation: 'Gaveta C-03',
    requiresPrescription: true
  },
  {
    id: 'med-7',
    name: 'Ventolin Inhalador 100mcg',
    genericName: 'Salbutamol Sulfato Aerosol',
    category: 'RESPIRATORIO',
    presentation: 'Frasco 200 Dosis con Inhalador',
    minsaRegister: 'Reg. San. 20194-PA',
    barcode: '745100334050',
    unitPrice: 12.80,
    stock: 28,
    shelfLocation: 'Gaveta D-02',
    requiresPrescription: true
  },
  {
    id: 'med-8',
    name: 'Losec Mups 20mg',
    genericName: 'Omeprazol Magnésico',
    category: 'GASTRO',
    presentation: 'Caja x 14 Comprimidos',
    minsaRegister: 'Reg. San. 49021-PA',
    barcode: '745100662910',
    unitPrice: 9.90,
    stock: 82,
    shelfLocation: 'Gaveta B-01',
    requiresPrescription: false
  },
  {
    id: 'med-9',
    name: 'Clarityne 10mg',
    genericName: 'Loratadina Micronizada',
    category: 'ALERGIAS',
    presentation: 'Caja x 10 Tabletas',
    minsaRegister: 'Reg. San. 38210-PA',
    barcode: '745100118830',
    unitPrice: 6.25,
    stock: 90,
    shelfLocation: 'Estante 2 - Frontal',
    requiresPrescription: false
  }
];

export const PharmacyRetailPosWorkspace: React.FC = () => {
  const [catalog, setCatalog] = useState<RetailMedicationItem[]>(RETAIL_CATALOG);
  const [cart, setCart] = useState<RetailCartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Customer Demographics & Ley 6 Discount
  const [selectedPatientId, setSelectedPatientId] = useState<string>('PARTICULAR');
  const [customCustomerName, setCustomCustomerName] = useState<string>('Cliente de Mostrador');
  const [customCustomerNationalId, setCustomCustomerNationalId] = useState<string>('00-0000-0000');
  const [isLey6Jubilado, setIsLey6Jubilado] = useState<boolean>(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'YAPPY' | 'ASEGURADORA'>('EFECTIVO');
  const [selectedInsurance, setSelectedInsurance] = useState<string>('ASSA Compañía de Seguros');
  const [cashAmountReceived, setCashAmountReceived] = useState<string>('');

  // Invoice Receipt Modal State
  const [completedInvoice, setCompletedInvoice] = useState<RetailInvoiceRecord | null>(null);

  // Filter Catalog
  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.genericName.toLowerCase().includes(q) ||
        item.barcode.includes(q) ||
        item.minsaRegister.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [catalog, searchTerm, selectedCategory]);

  // Cart Operations
  const handleAddToCart = (med: RetailMedicationItem) => {
    if (med.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(i => i.medication.id === med.id);
      if (existing) {
        if (existing.quantity >= med.stock) return prev;
        return prev.map(i => (i.medication.id === med.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { medication: med, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (medId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => {
          if (i.medication.id === medId) {
            const nextQty = i.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > i.medication.stock) return i;
            return { ...i, quantity: nextQty };
          }
          return i;
        })
        .filter(Boolean) as RetailCartItem[]
    );
  };

  const handleRemoveFromCart = (medId: string) => {
    setCart(prev => prev.filter(i => i.medication.id !== medId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Financial Calculations (Ley 6 de Panamá: 20% descuento en medicamentos para jubilados; ITBMS 0% en medicinas)
  const financialTotals = useMemo(() => {
    const rawSubtotal = cart.reduce((acc, item) => acc + item.medication.unitPrice * item.quantity, 0);
    const discountAmount = isLey6Jubilado ? rawSubtotal * 0.20 : 0;
    const itbms = 0; // Exento según código fiscal de Panamá para medicamentos con registro sanitario
    const totalToPay = Math.max(0, rawSubtotal - discountAmount);

    const cashNum = parseFloat(cashAmountReceived) || 0;
    const changeDue = Math.max(0, cashNum - totalToPay);

    return {
      subtotal: rawSubtotal,
      discountLey6: discountAmount,
      itbms,
      total: totalToPay,
      cashChange: changeDue
    };
  }, [cart, isLey6Jubilado, cashAmountReceived]);

  // Checkout and emit DGI e-Invoice
  const handleProcessCheckout = () => {
    if (cart.length === 0) return;

    let customerName = customCustomerName;
    let customerId = customCustomerNationalId;

    if (selectedPatientId !== 'PARTICULAR') {
      const realP = REAL_PATIENTS_DIR[selectedPatientId];
      if (realP) {
        customerName = `${realP.firstName} ${realP.lastName}`;
        customerId = realP.nationalId;
      }
    }

    const folioNum = `FAC-FAR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const cufeHash = `CUFE-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}-DGI-PA`;

    const invoice: RetailInvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoiceNumber: folioNum,
      cufe: cufeHash,
      timestamp: new Date().toLocaleString('es-PA'),
      customerName,
      customerNationalId: customerId,
      isJubilado: isLey6Jubilado,
      items: cart.map(i => ({
        name: `${i.medication.name} (${i.medication.genericName})`,
        quantity: i.quantity,
        unitPrice: i.medication.unitPrice,
        total: parseFloat((i.quantity * i.medication.unitPrice).toFixed(2))
      })),
      subtotal: parseFloat(financialTotals.subtotal.toFixed(2)),
      discountLey6: parseFloat(financialTotals.discountLey6.toFixed(2)),
      itbms: 0,
      total: parseFloat(financialTotals.total.toFixed(2)),
      paymentMethod,
      insuranceName: paymentMethod === 'ASEGURADORA' ? selectedInsurance : undefined,
      cashReceived: paymentMethod === 'EFECTIVO' ? parseFloat(cashAmountReceived) || financialTotals.total : undefined,
      cashChange: paymentMethod === 'EFECTIVO' ? parseFloat(financialTotals.cashChange.toFixed(2)) : undefined
    };

    // Deduct stock from local catalog
    setCatalog(prev =>
      prev.map(item => {
        const cartItem = cart.find(ci => ci.medication.id === item.id);
        if (cartItem) {
          return { ...item, stock: Math.max(0, item.stock - cartItem.quantity) };
        }
        return item;
      })
    );

    setCompletedInvoice(invoice);
    setCart([]);
    setCashAmountReceived('');

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          title: 'Factura Electrónica Emitida (DGI)',
          message: `Venta #${folioNum} registrada y firmada con CUFE fiscal. Stock actualizado.`,
          type: 'success'
        }
      })
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      
      {/* 1. POS BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 p-6 sm:p-7 rounded-3xl text-white shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mb-2">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Farmacia Ambulatoria • Ventanilla & Caja POS Fiscal DGI</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Venta Mostrador, Facturación Fiscal & Recetas Externas
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Dispensación comercial con lector de código de barras, exención automática de ITBMS por ley farmacéutica y cálculo del 20% de descuento para jubilados (Ley 6).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-2xl flex items-center space-x-3 text-xs">
            <Building2 className="w-7 h-7 text-teal-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Caja Principal</span>
              <span className="font-bold text-white">Ventanilla Mostrador #1</span>
            </div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-2xl flex items-center space-x-3 text-xs">
            <Receipt className="w-7 h-7 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Emisión Fiscal</span>
              <span className="font-bold text-emerald-400">PAC DGI Conectado</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TWO-COLUMN WORKSTATION: CATALOG (LEFT, COL 7) + POS CART & CHECKOUT (RIGHT, COL 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: MEDICATION CATALOG */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Search & Category Filter */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por Nombre Comercial, Principio Activo, Registro MINSA o Código de Barras..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none font-sans"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px]">
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'ANTIBIOTICOS', label: 'Antibióticos' },
                { id: 'ANALGESICOS', label: 'Analgésicos' },
                { id: 'CARDIOVASCULAR', label: 'Cardiovascular' },
                { id: 'METABOLICO', label: 'Metabólico / Diabetes' },
                { id: 'GASTRO', label: 'Gastroenterología' },
                { id: 'RESPIRATORIO', label: 'Respiratorio' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold uppercase transition cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredCatalog.map(item => {
              const inCart = cart.find(ci => ci.medication.id === item.id);

              return (
                <div
                  key={item.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl transition shadow-lg flex flex-col justify-between space-y-3 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-emerald-300 transition leading-snug">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-teal-400 font-medium">{item.genericName}</p>
                      </div>
                      <span className="text-sm font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg shrink-0">
                        ${item.unitPrice.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-1">{item.presentation}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800 text-[10px]">
                    <div className="flex items-center justify-between font-mono text-slate-400">
                      <span>{item.minsaRegister}</span>
                      <span className="text-slate-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {item.shelfLocation}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`font-mono font-bold ${item.stock > 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        Stock: {item.stock} Cajas
                      </span>

                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={item.stock <= 0}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{inCart ? `Agregar (${inCart.quantity})` : 'Agregar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* RIGHT COLUMN: POS CART & CHECKOUT TERMINAL */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-2xl space-y-5 sticky top-4">
          
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Bandeja de Venta ({cart.reduce((a, b) => a + b.quantity, 0)} Artículos)
              </h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-xs text-rose-400 hover:underline cursor-pointer font-bold"
              >
                Vaciar
              </button>
            )}
          </div>

          {/* Customer / Patient Demographics Selector */}
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-2.5 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cliente / Paciente para Facturación:</span>
            </span>

            <select
              value={selectedPatientId}
              onChange={e => {
                const val = e.target.value;
                setSelectedPatientId(val);
                if (val !== 'PARTICULAR' && REAL_PATIENTS_DIR[val]) {
                  const p = REAL_PATIENTS_DIR[val];
                  setCustomCustomerName(`${p.firstName} ${p.lastName}`);
                  setCustomCustomerNationalId(p.nationalId);
                } else {
                  setCustomCustomerName('Cliente de Mostrador');
                  setCustomCustomerNationalId('00-0000-0000');
                }
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="PARTICULAR">Cliente Particular de Mostrador (Venta Libre)</option>
              {Object.entries(REAL_PATIENTS_DIR).map(([id, p]) => (
                <option key={id} value={id}>
                  {p.firstName} {p.lastName} — Cédula: {p.nationalId}
                </option>
              ))}
            </select>

            {/* Ley 6 Panama: Jubilados 20% discount checkbox */}
            <label className="flex items-center space-x-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isLey6Jubilado}
                onChange={e => setIsLey6Jubilado(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Aplicar Descuento Ley 6 (Jubilado / 3ra Edad - 20%)</span>
              </span>
            </label>
          </div>

          {/* Cart Item List */}
          <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-1">
                <Package className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">El carrito está vacío.</p>
                <p className="text-[10px]">Haga clic en &quot;+ Agregar&quot; en los medicamentos a dispensar.</p>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.medication.id}
                  className="bg-slate-950 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white truncate">{item.medication.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      ${item.medication.unitPrice.toFixed(2)} c/u • Total: ${(item.medication.unitPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleUpdateQuantity(item.medication.id, -1)}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold text-white min-w-[16px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.medication.id, 1)}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleRemoveFromCart(item.medication.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Método de Pago:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'EFECTIVO', label: 'Efectivo', icon: DollarSign },
                { id: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
                { id: 'YAPPY', label: 'Yappy', icon: Smartphone },
                { id: 'ASEGURADORA', label: 'Seguro', icon: Shield }
              ].map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                      paymentMethod === m.id
                        ? 'bg-emerald-600/30 border-emerald-500 text-white shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Cash Input & Change */}
            {paymentMethod === 'EFECTIVO' && (
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl space-y-2 text-xs mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Monto Recibido ($):</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={`$${financialTotals.total.toFixed(2)}`}
                    value={cashAmountReceived}
                    onChange={e => setCashAmountReceived(e.target.value)}
                    className="w-28 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold text-right outline-none focus:border-emerald-500"
                  />
                </div>
                {parseFloat(cashAmountReceived) > 0 && (
                  <div className="flex items-center justify-between text-emerald-400 font-mono font-bold pt-1 border-t border-slate-800">
                    <span>Cambio / Vuelto:</span>
                    <span>${financialTotals.cashChange.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Insurance Provider Selector */}
            {paymentMethod === 'ASEGURADORA' && (
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl space-y-2 text-xs mt-2">
                <label className="text-slate-300 font-medium block">Póliza de Aseguradora Privada:</label>
                <select
                  value={selectedInsurance}
                  onChange={e => setSelectedInsurance(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium outline-none"
                >
                  <option value="ASSA Compañía de Seguros">ASSA Compañía de Seguros (Copago 20%)</option>
                  <option value="Blue Cross & Blue Shield Panamá">Blue Cross & Blue Shield Panamá (Copago 10%)</option>
                  <option value="Mapfre Panamá">Mapfre Panamá (Copago 20%)</option>
                  <option value="Pan-American Life Insurance (PALIG)">Pan-American Life (PALIG) (Copago 15%)</option>
                </select>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal Medicamentos:</span>
              <span>${financialTotals.subtotal.toFixed(2)}</span>
            </div>

            {isLey6Jubilado && (
              <div className="flex justify-between text-amber-400 font-bold">
                <span>Descuento Ley 6 (Jubilado -20%):</span>
                <span>-${financialTotals.discountLey6.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-400">
              <span>ITBMS (0% Exento Medicinas DGI):</span>
              <span className="text-emerald-400">$0.00</span>
            </div>

            <div className="flex justify-between text-sm sm:text-base font-black text-white pt-2 border-t border-slate-800">
              <span className="font-sans">TOTAL A PAGAR:</span>
              <span className="text-emerald-400">${financialTotals.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleProcessCheckout}
            disabled={cart.length === 0}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm rounded-2xl transition shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          >
            <Receipt className="w-4 h-4 stroke-[2.5]" />
            <span>Cobrar & Emitir Factura Electrónica DGI</span>
          </button>

        </div>

      </div>

      {/* 3. MODAL: DGI FISCAL INVOICE RECEIPT */}
      {completedInvoice && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setCompletedInvoice(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center space-y-1 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto mb-2">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white">Factura Electrónica de Farmacia</h3>
              <p className="text-xs text-slate-400">Autorización DGI Panamá • Régimen General</p>
              <p className="text-xs font-mono font-bold text-emerald-400">{completedInvoice.invoiceNumber}</p>
            </div>

            {/* Customer Details */}
            <div className="bg-slate-950 p-3 rounded-2xl text-xs space-y-1 font-mono text-slate-300">
              <p><strong className="text-slate-400">Cliente:</strong> {completedInvoice.customerName}</p>
              <p><strong className="text-slate-400">RUC/Cédula:</strong> {completedInvoice.customerNationalId}</p>
              <p><strong className="text-slate-400">Fecha/Hora:</strong> {completedInvoice.timestamp}</p>
              <p><strong className="text-slate-400">Pago:</strong> {completedInvoice.paymentMethod}</p>
            </div>

            {/* Itemized list */}
            <div className="space-y-1.5 text-xs font-mono max-h-40 overflow-y-auto">
              {completedInvoice.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-slate-300 border-b border-slate-800/40 pb-1">
                  <span>{it.quantity}x {it.name.slice(0, 24)}</span>
                  <span className="font-bold text-white">${it.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="bg-slate-950 p-3.5 rounded-2xl space-y-1 text-xs font-mono border border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>${completedInvoice.subtotal.toFixed(2)}</span>
              </div>
              {completedInvoice.isJubilado && (
                <div className="flex justify-between text-amber-400">
                  <span>Desc. Ley 6 (-20%):</span>
                  <span>-${completedInvoice.discountLey6.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>ITBMS (0% Exento):</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-sm font-black text-emerald-400 pt-1 border-t border-slate-800">
                <span>TOTAL PAGADO:</span>
                <span>${completedInvoice.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Fiscal Footer & CUFE */}
            <div className="text-center space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-center space-x-2 text-[10px] font-mono text-slate-500">
                <QrCode className="w-5 h-5 text-slate-400" />
                <span className="truncate max-w-[240px]">{completedInvoice.cufe}</span>
              </div>
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket de Venta</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PharmacyRetailPosWorkspace;
