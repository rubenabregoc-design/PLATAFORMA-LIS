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
  Search
} from 'lucide-react';

interface MultiBranchRoutingProps {
  tenant: Tenant;
  branches: Branch[];
}

export interface SpecimenTransferShipment {
  id: string;
  shipmentNumber: string;
  originBranch: string;
  destinationBranch: string;
  courierName: string;
  courierPhone: string;
  specimenCount: number;
  temperatureReading: string; // e.g. "4.2 °C (Cadena de Frío Requerida)"
  departureTime: string;
  estimatedArrival: string;
  status: 'PREPARANDO_EN_SEDE' | 'EN_TRANSITO_MENSAJERO' | 'RECIBIDO_HUB_CENTRAL';
  sampleBarcodes: string[];
}

export const MultiBranchRouting: React.FC<MultiBranchRoutingProps> = ({
  tenant,
  branches
}) => {
  const [shipments, setShipments] = useState<SpecimenTransferShipment[]>([
    {
      id: 'ship-01',
      shipmentNumber: 'TRF-2026-0081',
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
      originBranch: 'Sede Colón',
      destinationBranch: 'Sede Vía España (Hub Central)',
      courierName: 'Chofer Interno San José (Carlos M.)',
      courierPhone: '+507 6511-3344',
      specimenCount: 12,
      temperatureReading: '4.5 °C (Refrigerado)',
      departureTime: '10/08/2026 09:15 AM',
      estimatedArrival: '10/08/2026 10:45 AM',
      status: 'RECIBIDO_HUB_CENTRAL',
      sampleBarcodes: ['MUA-7701-01', 'MUA-7701-02']
    }
  ]);

  const [scanBarcode, setScanBarcode] = useState('');

  const handleReceiveShipment = (shipmentId: string) => {
    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipmentId ? { ...s, status: 'RECIBIDO_HUB_CENTRAL' } : s
      )
    );
    alert('¡Manifiesto de Muestras Escaneado y Recibido con éxito en la Sede Vía España! Muestras ingresadas a la cola de los analizadores ASTM.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-6 rounded-2xl shadow-xl border border-emerald-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1 flex items-center space-x-2">
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>Fase 4 — Cadena de Custodia & Logística Inter-Sedes Panamá</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Ruteo de Muestras & Laboratorio de Referencia
          </h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
            Control en tiempo real de valijas de transporte térmico con sensores de temperatura desde sedes satélites al Hub Central de Procesamiento.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/40 p-4 rounded-xl text-xs space-y-1">
          <div className="text-emerald-300 font-bold flex items-center space-x-1">
            <ThermometerSnowflake className="w-4 h-4 text-cyan-400" />
            <span>Sensores Térmicos IoT en RUTA: 2°C - 8°C OK</span>
          </div>
          <div className="text-slate-300">Monitoreo GPS Activo</div>
        </div>
      </div>

      {/* Barcode Quick Scan Acceptance */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
          <QrCode className="w-5 h-5 text-emerald-600" />
          <span>Escanear Código de Barras de Valija de Transporte (Recepción Rápida)</span>
        </h3>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Escanear número de manifiesto (ej. TRF-2026-0081)..."
            value={scanBarcode}
            onChange={(e) => setScanBarcode(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-mono font-bold"
          />
          <button
            onClick={() => {
              if (!scanBarcode) return;
              const found = shipments.find((s) => s.shipmentNumber === scanBarcode);
              if (found) {
                handleReceiveShipment(found.id);
                setScanBarcode('');
              } else {
                alert('Número de manifiesto no encontrado.');
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow flex items-center space-x-2"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Confirmar Ingreso a Hub</span>
          </button>
        </div>
      </div>

      {/* Shipments List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Manifiestos de Traslado de Muestras en Curso</h3>

        <div className="space-y-4">
          {shipments.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 hover:border-emerald-300 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-black text-slate-900 text-sm">{s.shipmentNumber}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    s.status === 'EN_TRANSITO_MENSAJERO'
                      ? 'bg-amber-100 text-amber-800 animate-pulse'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {s.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-xs font-mono text-cyan-800 font-bold bg-cyan-50 px-3 py-1 rounded-lg border border-cyan-200 flex items-center space-x-1.5">
                  <ThermometerSnowflake className="w-4 h-4 text-cyan-600" />
                  <span>Sonda de Temperatura: {s.temperatureReading}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Ruta de Transporte:</span>
                  <strong className="text-slate-800 flex items-center space-x-1.5 pt-0.5">
                    <span>{s.originBranch}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-emerald-700">{s.destinationBranch}</span>
                  </strong>
                </div>

                <div>
                  <span className="text-slate-500 block">Mensajero Responsable:</span>
                  <strong className="text-slate-800">{s.courierName} ({s.courierPhone})</strong>
                </div>

                <div>
                  <span className="text-slate-500 block">Muestras Transportadas:</span>
                  <strong className="text-slate-900 font-mono">{s.specimenCount} tubos etiquetados</strong>
                </div>
              </div>

              {s.status === 'EN_TRANSITO_MENSAJERO' && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleReceiveShipment(s.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Recibir y Verificar Cadena de Frío en Sede Central</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
