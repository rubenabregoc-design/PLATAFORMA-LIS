import React, { useState } from 'react';
import { Tenant, Branch } from '../../types';
import {
  Truck,
  MapPin,
  QrCode,
  ThermometerSnowflake,
  PackageCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Plus,
  Search,
  Building2,
  Send,
  X,
  Sparkles
} from 'lucide-react';

interface MultiBranchRoutingProps {
  tenant: Tenant;
  branches: Branch[];
}

export interface SpecimenTransferShipment {
  id: string;
  shipmentNumber: string;
  type: 'INTER_SEDES' | 'REFERENCIA_EXTERNA';
  originBranch: string;
  destinationBranch: string;
  courierName: string;
  courierPhone: string;
  specimenCount: number;
  temperatureReading: string; // e.g. "3.8 °C (Refrigerado)"
  departureTime: string;
  estimatedArrival: string;
  status: 'PREPARANDO_EN_SEDE' | 'EN_TRANSITO_MENSAJERO' | 'RECIBIDO_HUB_CENTRAL';
  sampleBarcodes: string[];
}

export const MultiBranchRouting: React.FC<MultiBranchRoutingProps> = () => {
  const [shipments, setShipments] = useState<SpecimenTransferShipment[]>([
    {
      id: 'ship-01',
      shipmentNumber: 'TRF-2026-0081',
      type: 'INTER_SEDES',
      originBranch: 'Sede Chiriquí (David)',
      destinationBranch: 'Sede Vía España (Hub Central)',
      courierName: 'Mensajería Exprés Carga Fría (Lic. Pedro Navarro)',
      courierPhone: '+507 6900-1122',
      specimenCount: 18,
      temperatureReading: '3.8 °C (Refrigerado)',
      departureTime: '10/08/2026 08:30 AM',
      estimatedArrival: '10/08/2026 01:15 PM',
      status: 'EN_TRANSITO_MENSAJERO',
      sampleBarcodes: ['MUA-8812-01', 'MUA-8812-02', 'MUA-8815-01']
    },
    {
      id: 'ship-02',
      shipmentNumber: 'TRF-2026-0082',
      type: 'REFERENCIA_EXTERNA',
      originBranch: 'Sede Vía España (Hub Central)',
      destinationBranch: 'Instituto Conmemorativo Gorgas (Laboratorio de Referencia)',
      courierName: 'Transporte Especializado Gorgas (Lic. Carlos M.)',
      courierPhone: '+507 6511-3344',
      specimenCount: 5,
      temperatureReading: '2.1 °C (Refrigerado Strict)',
      departureTime: '10/08/2026 09:15 AM',
      estimatedArrival: '10/08/2026 10:45 AM',
      status: 'EN_TRANSITO_MENSAJERO',
      sampleBarcodes: ['MUA-9901-01', 'MUA-9901-02']
    },
    {
      id: 'ship-03',
      shipmentNumber: 'TRF-2026-0083',
      type: 'INTER_SEDES',
      originBranch: 'Sede Colón',
      destinationBranch: 'Sede Vía España (Hub Central)',
      courierName: 'Chofer Interno San José (Ramiro G.)',
      courierPhone: '+507 6700-4411',
      specimenCount: 12,
      temperatureReading: '4.5 °C (Refrigerado)',
      departureTime: '10/08/2026 07:00 AM',
      estimatedArrival: '10/08/2026 08:30 AM',
      status: 'RECIBIDO_HUB_CENTRAL',
      sampleBarcodes: ['MUA-7701-01', 'MUA-7701-02']
    }
  ]);

  const [scanBarcode, setScanBarcode] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INTER_SEDES' | 'REFERENCIA_EXTERNA'>('ALL');
  const [showNewShipmentModal, setShowNewShipmentModal] = useState(false);

  // New Shipment Form State
  const [newType, setNewType] = useState<'INTER_SEDES' | 'REFERENCIA_EXTERNA'>('INTER_SEDES');
  const [newOrigin, setNewOrigin] = useState('Sede Vía España (Hub Central)');
  const [newDestination, setNewDestination] = useState('Instituto Conmemorativo Gorgas');
  const [newCourier, setNewCourier] = useState('Mensajería Carga Fría LIS');
  const [newSpecimenCount, setNewSpecimenCount] = useState(6);
  const [newTemp, setNewTemp] = useState('3.5 °C (Refrigerado)');

  const handleReceiveShipment = (shipmentId: string) => {
    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipmentId ? { ...s, status: 'RECIBIDO_HUB_CENTRAL' } : s
      )
    );
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: '✓ Valija de Muestras ingresada y confirmada en Sede Central. Muestras listas para analizadores.', type: 'success' }
      })
    );
  };

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();

    const newShipmentItem: SpecimenTransferShipment = {
      id: `ship-${Date.now()}`,
      shipmentNumber: `TRF-2026-00${Math.floor(84 + Math.random() * 90)}`,
      type: newType,
      originBranch: newOrigin,
      destinationBranch: newDestination,
      courierName: newCourier,
      courierPhone: '+507 6900-5522',
      specimenCount: Number(newSpecimenCount),
      temperatureReading: newTemp,
      departureTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedArrival: 'En 45 min',
      status: 'EN_TRANSITO_MENSAJERO',
      sampleBarcodes: ['MUA-2026-01', 'MUA-2026-02']
    };

    setShipments([newShipmentItem, ...shipments]);
    setShowNewShipmentModal(false);

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `✓ Manifiesto de Remisión ${newShipmentItem.shipmentNumber} emitido con éxito.`, type: 'success' }
      })
    );
  };

  const filteredShipments = shipments.filter(s => filterType === 'ALL' || s.type === filterType);

  return (
    <div className="space-y-6 text-slate-100 animate-in fade-in duration-500">

      {/* Top Banner (Dark LISCORE Theme) */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-emerald-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-emerald-300 text-xs font-black uppercase tracking-widest mb-1.5 flex items-center space-x-2">
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>Cadena de Custodia & Logística de Muestras Panamá</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Remisión & Derivación de Muestras
          </h1>
          <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
            Control de remisiones en valijas térmicas con sensores IoT tanto <strong>Inter-Sedes</strong> (sucursales internas) como hacia <strong>Laboratorios de Referencia Externa</strong> (Instituto Gorgas, LNS, etc.).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="bg-slate-950/90 border border-emerald-500/40 p-4 rounded-2xl text-xs space-y-1">
            <div className="text-emerald-300 font-bold flex items-center space-x-1.5">
              <ThermometerSnowflake className="w-4 h-4 text-cyan-400" />
              <span>Sensores Térmicos IoT en RUTA: 2°C - 8°C OK</span>
            </div>
            <div className="text-slate-400 text-[11px] font-mono">Monitoreo GPS Activo en Tiempo Real</div>
          </div>

          <button
            onClick={() => setShowNewShipmentModal(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center space-x-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Remisión / Valija</span>
          </button>
        </div>
      </div>

      {/* Barcode Quick Scan Acceptance (Dark Glassmorphic) */}
      <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-3">
        <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
          <QrCode className="w-4 h-4 text-emerald-400" />
          <span>Escanear Código de Barras de Valija de Transporte (Recepción Rápida)</span>
        </h3>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Escanear número de manifiesto (ej. TRF-2026-0081)..."
            value={scanBarcode}
            onChange={(e) => setScanBarcode(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
          />
          <button
            onClick={() => {
              if (!scanBarcode) return;
              const found = shipments.find((s) => s.shipmentNumber === scanBarcode);
              if (found) {
                handleReceiveShipment(found.id);
                setScanBarcode('');
              } else {
                window.dispatchEvent(
                  new CustomEvent('lis-global-toast', {
                    detail: { message: '⚠️ Número de manifiesto no encontrado en el sistema.', type: 'warning' }
                  })
                );
              }
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs transition shadow cursor-pointer flex items-center space-x-2"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Confirmar Ingreso a Hub</span>
          </button>
        </div>
      </div>

      {/* Shipments List & Category Filters (Dark Glassmorphic Theme) */}
      <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <h3 className="font-black text-white text-sm">Manifiestos de Traslado & Remisión de Muestras</h3>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterType === 'ALL' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas ({shipments.length})
            </button>
            <button
              onClick={() => setFilterType('INTER_SEDES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterType === 'INTER_SEDES' ? 'bg-cyan-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Inter-Sedes Internas ({shipments.filter(s => s.type === 'INTER_SEDES').length})
            </button>
            <button
              onClick={() => setFilterType('REFERENCIA_EXTERNA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterType === 'REFERENCIA_EXTERNA' ? 'bg-purple-500 text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Referencia Externa (Gorgas/LNS) ({shipments.filter(s => s.type === 'REFERENCIA_EXTERNA').length})
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredShipments.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-950 space-y-3 hover:border-emerald-500/50 transition shadow-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-black text-white text-sm">{s.shipmentNumber}</span>

                  {/* Type Badge */}
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    s.type === 'REFERENCIA_EXTERNA'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  }`}>
                    {s.type === 'REFERENCIA_EXTERNA' ? '🏛️ REFERENCIA EXTERNA' : '🏢 TRASLADO INTER-SEDES'}
                  </span>

                  {/* Status Badge */}
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                    s.status === 'EN_TRANSITO_MENSAJERO'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {s.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="text-xs font-mono text-cyan-300 font-bold bg-slate-900 px-3 py-1 rounded-xl border border-cyan-500/30 flex items-center space-x-1.5">
                  <ThermometerSnowflake className="w-4 h-4 text-cyan-400" />
                  <span>Sonda de Temperatura: {s.temperatureReading}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                <div>
                  <span className="text-slate-400 block font-bold">Ruta de Remisión:</span>
                  <strong className="text-slate-200 flex items-center space-x-1.5 pt-0.5">
                    <span>{s.originBranch}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-bold">{s.destinationBranch}</span>
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block font-bold">Mensajero / Transportista:</span>
                  <strong className="text-slate-200">{s.courierName} ({s.courierPhone})</strong>
                </div>

                <div>
                  <span className="text-slate-400 block font-bold">Muestras Transportadas:</span>
                  <strong className="text-white font-mono">{s.specimenCount} tubos etiquetados con código</strong>
                </div>
              </div>

              {s.status === 'EN_TRANSITO_MENSAJERO' && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleReceiveShipment(s.id)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition shadow-md shadow-emerald-500/20 cursor-pointer flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Recibir y Verificar Cadena de Frío en Sede</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal: New Specimen Shipment Form */}
      {showNewShipmentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-white text-base">Emitir Manifiesto de Remisión de Muestras</h3>
              </div>
              <button onClick={() => setShowNewShipmentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300">Tipo de Remisión</label>
                <select
                  value={newType}
                  onChange={(e: any) => setNewType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-bold"
                >
                  <option value="INTER_SEDES">Traslado Inter-Sedes Interno (Entre Sucursales)</option>
                  <option value="REFERENCIA_EXTERNA">Laboratorio de Referencia Externa (Gorgas / LNS / Externa)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300">Sede Origen</label>
                  <input
                    type="text"
                    required
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300">Destino (Sede o Lab Referencia)</label>
                  <input
                    type="text"
                    required
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300">Cantidad de Muestras / Tubos</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newSpecimenCount}
                    onChange={(e) => setNewSpecimenCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300">Rango de Temperatura Requerido</label>
                  <select
                    value={newTemp}
                    onChange={(e) => setNewTemp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-bold"
                  >
                    <option value="3.5 °C (Refrigerado)">3.5 °C (Refrigerado 2°C - 8°C)</option>
                    <option value="-20 °C (Congelado)">-20 °C (Congelado)</option>
                    <option value="20 °C (Temperatura Ambiente)">20 °C (Temperatura Ambiente)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300">Mensajero / Transportista Autorizado</label>
                <input
                  type="text"
                  required
                  value={newCourier}
                  onChange={(e) => setNewCourier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewShipmentModal(false)}
                  className="px-4 py-2 rounded-2xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Emitir Manifiesto de Remisión</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
