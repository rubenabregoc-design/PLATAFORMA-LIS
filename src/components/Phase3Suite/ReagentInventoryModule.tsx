import React, { useState, useMemo } from 'react';
import { ReagentInventory, Tenant, Branch } from '../../types';
import {
  Package,
  AlertTriangle,
  Calendar,
  Plus,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  ThermometerSnowflake,
  Clock,
  Search,
  Filter,
  Layers,
  AlertCircle,
  Tag,
  Flame,
  XCircle,
  Edit3,
  Trash2,
  MinusCircle,
  Building,
  Check,
  X,
  Zap,
  Info
} from 'lucide-react';

interface ReagentInventoryModuleProps {
  tenant: Tenant;
  branch: Branch;
}

// Initial Mock Reagents with varying expiration dates
const INITIAL_REAGENTS: ReagentInventory[] = [
  {
    id: 'reag-01',
    tenantId: 'tenant-01',
    name: 'Kit de Glucosa HK (Roche Vitros 5600)',
    code: 'REA-GLU-001',
    lotNumber: 'LOT-2026-9901',
    expirationDate: '2026-11-15',
    quantityRemaining: 450,
    unit: 'Determinaciones',
    testsPerUnit: 500,
    minAlertThreshold: 100,
    associatedTest: 'Química — Glucosa',
    manufacturer: 'Roche Diagnostics',
    storageTemp: '2°C - 8°C'
  },
  {
    id: 'reag-02',
    tenantId: 'tenant-01',
    name: 'Reactivo Hemograma Sysmex Cellpack DCL',
    code: 'REA-HEM-002',
    lotNumber: 'LOT-2026-4412',
    expirationDate: '2026-08-28', // Expiring in ~16 days (from Aug 12 2026)
    quantityRemaining: 80,
    unit: 'Litros',
    testsPerUnit: 1000,
    minAlertThreshold: 150,
    associatedTest: 'Hemograma Completo',
    manufacturer: 'Sysmex Corporation',
    storageTemp: '15°C - 25°C'
  },
  {
    id: 'reag-03',
    tenantId: 'tenant-01',
    name: 'Calibrador de Química Multicontrol Nivel 1 & 2',
    code: 'CAL-QC-003',
    lotNumber: 'LOT-2026-0031',
    expirationDate: '2027-02-10',
    quantityRemaining: 1200,
    unit: 'Viales',
    testsPerUnit: 100,
    minAlertThreshold: 200,
    associatedTest: 'Control de Calidad Westgard',
    manufacturer: 'Bio-Rad Laboratories',
    storageTemp: '2°C - 8°C'
  },
  {
    id: 'reag-04',
    tenantId: 'tenant-01',
    name: 'Tiras Reactivas Uroanálisis Combiscreen 11',
    code: 'REA-URO-004',
    lotNumber: 'LOT-2026-1890',
    expirationDate: '2026-09-02', // Expiring in ~21 days
    quantityRemaining: 210,
    unit: 'Tiras',
    testsPerUnit: 300,
    minAlertThreshold: 100,
    associatedTest: 'General de Orina',
    manufacturer: 'Analyticon Biotechnologies',
    storageTemp: '2°C - 30°C'
  },
  {
    id: 'reag-05',
    tenantId: 'tenant-01',
    name: 'Reactivo de Tiempos de Coagulación TP / TTPa',
    code: 'REA-COA-005',
    lotNumber: 'LOT-2026-0088',
    expirationDate: '2026-08-05', // Already Expired (-7 days)
    quantityRemaining: 35,
    unit: 'Determinaciones',
    testsPerUnit: 250,
    minAlertThreshold: 50,
    associatedTest: 'Tiempos de Coagulación',
    manufacturer: 'Stago Diagnostics',
    storageTemp: '2°C - 8°C'
  },
  {
    id: 'reag-06',
    tenantId: 'tenant-01',
    name: 'Kit de Troponina I de Alta Sensibilidad (hs-cTnI)',
    code: 'REA-CAR-006',
    lotNumber: 'LOT-2026-7733',
    expirationDate: '2026-09-08', // Expiring in ~27 days
    quantityRemaining: 120,
    unit: 'Cartuchos',
    testsPerUnit: 200,
    minAlertThreshold: 60,
    associatedTest: 'Perfil Cardíaco',
    manufacturer: 'Abbott Diagnostics',
    storageTemp: '2°C - 8°C'
  }
];

export const ReagentInventoryModule: React.FC<ReagentInventoryModuleProps> = ({
  tenant,
  branch
}) => {
  const [reagents, setReagents] = useState<ReagentInventory[]>(INITIAL_REAGENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'EXPIRING' | 'EXPIRED' | 'LOW_STOCK'>('ALL');

  // New Lot Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLot, setNewLot] = useState('');
  const [newExp, setNewExp] = useState('');
  const [newQty, setNewQty] = useState<number>(500);
  const [newUnit, setNewUnit] = useState('Determinaciones');
  const [newMinThreshold, setNewMinThreshold] = useState<number>(100);
  const [newManufacturer, setNewManufacturer] = useState('Roche Diagnostics');
  const [newTestArea, setNewTestArea] = useState('Química Clínica');
  const [newTemp, setNewTemp] = useState('2°C - 8°C');

  // Edit Modal State
  const [editingReagent, setEditingReagent] = useState<ReagentInventory | null>(null);

  // Consume Modal State
  const [consumingReagent, setConsumingReagent] = useState<ReagentInventory | null>(null);
  const [consumeAmount, setConsumeAmount] = useState<number>(10);

  // Helper date calculation (assumes current reference date Aug 12, 2026 or real date)
  const getDaysUntilExpiration = (expirationDateStr: string) => {
    const expDate = new Date(expirationDateStr);
    const today = new Date('2026-08-12'); // Fixed reference or current
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 3600 * 24));
  };

  // Filtered Reagents list
  const filteredReagents = useMemo(() => {
    return reagents.filter((r) => {
      const daysToExp = getDaysUntilExpiration(r.expirationDate);
      const isExpired = daysToExp < 0;
      const isExpiringSoon = daysToExp >= 0 && daysToExp <= 30;
      const isLowStock = r.quantityRemaining < r.minAlertThreshold;

      // Status tab filter
      if (filterTab === 'EXPIRING' && !isExpiringSoon) return false;
      if (filterTab === 'EXPIRED' && !isExpired) return false;
      if (filterTab === 'LOW_STOCK' && !isLowStock) return false;

      // Search query filter
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchName = r.name.toLowerCase().includes(query);
        const matchLot = r.lotNumber.toLowerCase().includes(query);
        const matchManufacturer = (r.manufacturer || '').toLowerCase().includes(query);
        const matchTest = r.associatedTest.toLowerCase().includes(query);
        return matchName || matchLot || matchManufacturer || matchTest;
      }

      return true;
    });
  }, [reagents, filterTab, searchTerm]);

  // Aggregate Counts for Badges & Top Alerts
  const counts = useMemo(() => {
    let total = reagents.length;
    let expiringSoon = 0;
    let expired = 0;
    let lowStock = 0;

    reagents.forEach((r) => {
      const days = getDaysUntilExpiration(r.expirationDate);
      if (days < 0) expired++;
      else if (days <= 30) expiringSoon++;

      if (r.quantityRemaining < r.minAlertThreshold) lowStock++;
    });

    return { total, expiringSoon, expired, lowStock };
  }, [reagents]);

  // Handle Add New Reagent
  const handleAddReagent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newLot || !newExp) {
      alert('Por favor complete los campos requeridos: Nombre del reactivo, Número de lote y Fecha de caducidad.');
      return;
    }

    const newReagent: ReagentInventory = {
      id: `reag-${Date.now()}`,
      tenantId: tenant.id,
      name: newName,
      code: `REA-${Math.floor(1000 + Math.random() * 9000)}`,
      lotNumber: newLot.toUpperCase().trim(),
      expirationDate: newExp,
      quantityRemaining: Number(newQty),
      unit: newUnit,
      testsPerUnit: Number(newQty),
      minAlertThreshold: Number(newMinThreshold),
      associatedTest: newTestArea,
      manufacturer: newManufacturer,
      storageTemp: newTemp
    };

    setReagents([newReagent, ...reagents]);
    setShowAddModal(false);

    // Reset Form
    setNewName('');
    setNewLot('');
    setNewExp('');
    setNewQty(500);
  };

  // Handle Consume Stock
  const handleConfirmConsume = () => {
    if (!consumingReagent) return;
    const amount = Number(consumeAmount);
    if (isNaN(amount) || amount <= 0) return;

    setReagents((prev) =>
      prev.map((r) =>
        r.id === consumingReagent.id
          ? { ...r, quantityRemaining: Math.max(0, r.quantityRemaining - amount) }
          : r
      )
    );
    setConsumingReagent(null);
    setConsumeAmount(10);
  };

  // Handle Edit Reagent
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReagent) return;

    setReagents((prev) =>
      prev.map((r) => (r.id === editingReagent.id ? editingReagent : r))
    );
    setEditingReagent(null);
  };

  // Handle Delete Reagent
  const handleDeleteReagent = (id: string) => {
    if (window.confirm('¿Está seguro de que desea dar de baja este lote de reactivo?')) {
      setReagents((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner with Temperature & Traceability Indicator */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="text-blue-400 text-xs font-black uppercase tracking-widest mb-1.5 flex items-center space-x-2">
              <ThermometerSnowflake className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Control de Cadena de Frío, Lotes & Trazabilidad LIS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Gestión de Reactivos & Alertas de Caducidad
            </h1>
            <p className="text-blue-200/80 text-xs sm:text-sm mt-1 max-w-2xl">
              Sede: <strong className="text-white font-bold">{branch.name}</strong> — Registro de números de lote, fechas de expiración con alerta automática de 30 días y control de insumos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs transition-all shadow-lg shadow-teal-500/20 flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Registrar Nuevo Lote</span>
            </button>
          </div>
        </div>

        {/* Top Summary Alert Banner if there are expiring/expired lots */}
        {(counts.expiringSoon > 0 || counts.expired > 0) && (
          <div className="mt-6 pt-5 border-t border-blue-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-amber-300 block text-sm">
                  Alerta de Caducidad Próxima Detectada
                </span>
                <span className="text-amber-200/80">
                  {counts.expired > 0 && <strong className="text-rose-300 mr-1">{counts.expired} lote(s) VENCIDO(S)</strong>}
                  {counts.expiringSoon > 0 && <strong className="text-amber-300">{counts.expiringSoon} lote(s) vencen en los próximos 30 días.</strong>}
                </span>
              </div>
            </div>

            <button
              onClick={() => setFilterTab('EXPIRING')}
              className="bg-amber-400 text-slate-950 hover:bg-amber-300 px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer shrink-0 shadow-md"
            >
              Ver Lotes Afectados
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Lots */}
        <button
          onClick={() => setFilterTab('ALL')}
          className={`p-5 rounded-2xl border transition-all text-left cursor-pointer ${
            filterTab === 'ALL'
              ? 'bg-slate-900 text-white border-teal-500 shadow-xl'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold mb-1 opacity-80">
            <span>Total Lotes en Stock</span>
            <Package className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black font-mono">{counts.total}</div>
          <span className="text-[10px] opacity-70 mt-1 block">Registrados en {branch.name}</span>
        </button>

        {/* Expiring Soon (<=30 Days) */}
        <button
          onClick={() => setFilterTab('EXPIRING')}
          className={`p-5 rounded-2xl border transition-all text-left cursor-pointer ${
            filterTab === 'EXPIRING'
              ? 'bg-amber-950 text-amber-200 border-amber-500 shadow-xl'
              : counts.expiringSoon > 0
              ? 'bg-amber-50 text-amber-900 border-amber-300 hover:border-amber-400'
              : 'bg-white text-slate-900 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold mb-1 text-amber-600">
            <span>Próximos a Vencer (≤30d)</span>
            <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-600">{counts.expiringSoon}</div>
          <span className="text-[10px] text-amber-700 font-semibold mt-1 block">Requiere rotación o reemplazo</span>
        </button>

        {/* Expired (< 0 Days) */}
        <button
          onClick={() => setFilterTab('EXPIRED')}
          className={`p-5 rounded-2xl border transition-all text-left cursor-pointer ${
            filterTab === 'EXPIRED'
              ? 'bg-rose-950 text-rose-200 border-rose-500 shadow-xl'
              : counts.expired > 0
              ? 'bg-rose-50 text-rose-900 border-rose-300 hover:border-rose-400'
              : 'bg-white text-slate-900 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold mb-1 text-rose-600">
            <span>Lotes Vencidos</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-600">{counts.expired}</div>
          <span className="text-[10px] text-rose-700 font-semibold mt-1 block">Dar de baja inmediatamente</span>
        </button>

        {/* Low Stock */}
        <button
          onClick={() => setFilterTab('LOW_STOCK')}
          className={`p-5 rounded-2xl border transition-all text-left cursor-pointer ${
            filterTab === 'LOW_STOCK'
              ? 'bg-indigo-950 text-indigo-200 border-indigo-500 shadow-xl'
              : counts.lowStock > 0
              ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
              : 'bg-white text-slate-900 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold mb-1 text-indigo-600">
            <span>Stock Bajo Umbral</span>
            <Flame className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black font-mono text-indigo-600">{counts.lowStock}</div>
          <span className="text-[10px] text-indigo-700 font-semibold mt-1 block">Generar orden de compra</span>
        </button>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por reactivo, N° de Lote (ej. LOT-2026), fabricante o prueba..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-teal-500 focus:bg-white transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterTab === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({counts.total})
          </button>

          <button
            onClick={() => setFilterTab('EXPIRING')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
              filterTab === 'EXPIRING'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                : 'text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Por Vencer ({counts.expiringSoon})</span>
          </button>

          <button
            onClick={() => setFilterTab('EXPIRED')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
              filterTab === 'EXPIRED'
                ? 'bg-rose-600 text-white font-extrabold shadow-sm'
                : 'text-rose-700 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Vencidos ({counts.expired})</span>
          </button>

          <button
            onClick={() => setFilterTab('LOW_STOCK')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterTab === 'LOW_STOCK' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            Stock Bajo ({counts.lowStock})
          </button>
        </div>
      </div>

      {/* Reagent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredReagents.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-bold text-sm">No se encontraron lotes de reactivos con los criterios especificados.</p>
            <button
              onClick={() => { setSearchTerm(''); setFilterTab('ALL'); }}
              className="text-teal-600 hover:text-teal-700 text-xs font-bold underline"
            >
              Restablecer filtros de búsqueda
            </button>
          </div>
        ) : (
          filteredReagents.map((r) => {
            const daysToExp = getDaysUntilExpiration(r.expirationDate);
            const isExpired = daysToExp < 0;
            const isExpiringSoon = daysToExp >= 0 && daysToExp <= 30;
            const isLowStock = r.quantityRemaining < r.minAlertThreshold;
            const percentageLeft = Math.min(100, Math.round((r.quantityRemaining / r.testsPerUnit) * 100));

            return (
              <div
                key={r.id}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-sm hover:shadow-md relative overflow-hidden flex flex-col justify-between space-y-4 ${
                  isExpired
                    ? 'border-rose-400 bg-rose-50/40'
                    : isExpiringSoon
                    ? 'border-amber-400 bg-amber-50/30 ring-2 ring-amber-400/20'
                    : isLowStock
                    ? 'border-indigo-300 bg-indigo-50/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Card Header & Badges */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        {r.manufacturer || 'Fabricante LIS'}
                      </span>
                      <h3 className={`font-black text-sm text-slate-900 leading-snug ${isExpired ? 'line-through text-slate-500' : ''}`}>
                        {r.name}
                      </h3>
                    </div>

                    {/* Expiration Status Badge */}
                    {isExpired ? (
                      <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1 shrink-0 shadow-md shadow-rose-600/20 animate-pulse">
                        <XCircle className="w-3 h-3" />
                        <span>VENCIDO</span>
                      </span>
                    ) : isExpiringSoon ? (
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1 shrink-0 shadow-md shadow-amber-500/20 animate-bounce">
                        <Clock className="w-3 h-3" />
                        <span>VENCE EN {daysToExp}d</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                        ✓ Vigente ({daysToExp}d)
                      </span>
                    )}
                  </div>

                  {/* Lot Number Box */}
                  <div className="bg-slate-100/90 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-slate-500 font-bold">N° de Lote:</span>
                      <strong className="font-mono font-black text-slate-900 tracking-wider">{r.lotNumber}</strong>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {r.storageTemp || '2°C - 8°C'}
                    </span>
                  </div>
                </div>

                {/* Body Details: Expiration & Test Association */}
                <div className="space-y-2 text-xs text-slate-700 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Caducidad:</span>
                    <strong className={`font-mono ${isExpired ? 'text-rose-600 font-black' : isExpiringSoon ? 'text-amber-700 font-black' : 'text-slate-900 font-bold'}`}>
                      {r.expirationDate} {isExpired ? '(CADUCADO)' : `(${daysToExp} días restantes)`}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Asociado a:</span>
                    <span className="font-bold text-slate-800 text-[11px] truncate max-w-[170px]">{r.associatedTest}</span>
                  </div>

                  {/* Stock Quantity Progress */}
                  <div className="pt-2 border-t border-slate-200/60 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-600">Stock Restante:</span>
                      <strong className={`font-mono ${isLowStock ? 'text-rose-600 font-black' : 'text-slate-900 font-bold'}`}>
                        {r.quantityRemaining} / {r.testsPerUnit} {r.unit}
                      </strong>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percentageLeft}%` }}
                        className={`h-full transition-all ${
                          isExpired
                            ? 'bg-rose-500'
                            : isLowStock
                            ? 'bg-rose-500'
                            : isExpiringSoon
                            ? 'bg-amber-500'
                            : 'bg-teal-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => { setConsumingReagent(r); setConsumeAmount(10); }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-1.5 px-3 rounded-xl text-xs transition flex items-center justify-center space-x-1 cursor-pointer"
                    title="Registrar consumo de reactivo"
                  >
                    <MinusCircle className="w-3.5 h-3.5 text-teal-600" />
                    <span>Consumir</span>
                  </button>

                  <button
                    onClick={() => setEditingReagent(r)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                    title="Editar datos de lote"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteReagent(r.id)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                    title="Dar de baja este lote"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add New Lot */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0 sticky top-0 bg-white z-10">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-lg">Registrar Nuevo Lote de Reactivo</h2>
                  <p className="text-slate-500 text-xs">Captura de trazabilidad y alerta de expiración en LIS</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddReagent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Nombre del Reactivo / Kit *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Kit de Perfil Lipídico Vitros Roche"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Número de Lote (Fabricante) *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. LOT-2026-8800"
                    value={newLot}
                    onChange={(e) => setNewLot(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold uppercase focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Fecha de Caducidad *</label>
                  <input
                    type="date"
                    required
                    value={newExp}
                    onChange={(e) => setNewExp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Fabricante / Marca</label>
                  <select
                    value={newManufacturer}
                    onChange={(e) => setNewManufacturer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold"
                  >
                    <option value="Roche Diagnostics">Roche Diagnostics</option>
                    <option value="Sysmex Corporation">Sysmex Corporation</option>
                    <option value="Abbott Diagnostics">Abbott Diagnostics</option>
                    <option value="Siemens Healthineers">Siemens Healthineers</option>
                    <option value="Bio-Rad Laboratories">Bio-Rad Laboratories</option>
                    <option value="Stago Diagnostics">Stago Diagnostics</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Sección / Prueba Asociada</label>
                  <input
                    type="text"
                    placeholder="ej. Química — Perfil Lipídico"
                    value={newTestArea}
                    onChange={(e) => setNewTestArea(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Cantidad Total</label>
                  <input
                    type="number"
                    min="1"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Unidad</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-xs font-medium"
                  >
                    <option value="Determinaciones">Determinaciones</option>
                    <option value="Litros">Litros</option>
                    <option value="Viales">Viales</option>
                    <option value="Tiras">Tiras</option>
                    <option value="Cartuchos">Cartuchos</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Temp. Almacén</label>
                  <select
                    value={newTemp}
                    onChange={(e) => setNewTemp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-xs font-medium"
                  >
                    <option value="2°C - 8°C">2°C - 8°C (Refrigerado)</option>
                    <option value="-20°C">-20°C (Congelado)</option>
                    <option value="15°C - 25°C">15°C - 25°C (Ambiente)</option>
                  </select>
                </div>
              </div>

              {/* Expiration Days Live Preview */}
              {newExp && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs">
                  <span className="text-blue-800 font-semibold flex items-center space-x-1.5">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>Cálculo automático de vigencia:</span>
                  </span>
                  <strong className="font-mono font-black text-blue-900">
                    {getDaysUntilExpiration(newExp)} días hasta vencimiento
                  </strong>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar y Notificar LIS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Consume Quantity */}
      {consumingReagent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Registrar Consumo de Reactivo</h3>
              <button onClick={() => setConsumingReagent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">{consumingReagent.name}</span>
                <span className="text-slate-500 font-mono">Lote: {consumingReagent.lotNumber}</span>
                <div className="mt-1 font-bold text-teal-700">
                  Stock actual: {consumingReagent.quantityRemaining} {consumingReagent.unit}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700">Cantidad a descontar ({consumingReagent.unit}):</label>
                <input
                  type="number"
                  min="1"
                  max={consumingReagent.quantityRemaining}
                  value={consumeAmount}
                  onChange={(e) => setConsumeAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono font-bold text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setConsumingReagent(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirmConsume}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
              >
                Confirmar Descuento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Lot Details */}
      {editingReagent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Editar Lote de Reactivo</h3>
              <button onClick={() => setEditingReagent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Nombre</label>
                <input
                  type="text"
                  value={editingReagent.name}
                  onChange={(e) => setEditingReagent({ ...editingReagent, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">N° de Lote</label>
                  <input
                    type="text"
                    value={editingReagent.lotNumber}
                    onChange={(e) => setEditingReagent({ ...editingReagent, lotNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Fecha de Caducidad</label>
                  <input
                    type="date"
                    value={editingReagent.expirationDate}
                    onChange={(e) => setEditingReagent({ ...editingReagent, expirationDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Cantidad Restante</label>
                  <input
                    type="number"
                    value={editingReagent.quantityRemaining}
                    onChange={(e) => setEditingReagent({ ...editingReagent, quantityRemaining: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Umbral Alerta Mínima</label>
                  <input
                    type="number"
                    value={editingReagent.minAlertThreshold}
                    onChange={(e) => setEditingReagent({ ...editingReagent, minAlertThreshold: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingReagent(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
