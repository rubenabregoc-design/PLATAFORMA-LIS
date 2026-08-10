import React, { useState } from 'react';
import { Order, Specimen } from '../../types';
import { QrCode, TestTube, CheckCircle2, ArrowRight, Play, Award, Zap } from 'lucide-react';

interface LabTechDashboardProps {
  orders: Order[];
  onUpdateSpecimenStatus: (specimenId: string, status: Specimen['status']) => void;
}

export const LabTechDashboard: React.FC<LabTechDashboardProps> = ({ orders, onUpdateSpecimenStatus }) => {
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [lastScanned, setLastScanned] = useState<Specimen | null>(null);

  const allSpecimens = orders.flatMap((o) => o.specimens);

  const handleScanBarcode = () => {
    if (!scannedBarcode) return;
    const found = allSpecimens.find((s) => s.barcode.toLowerCase() === scannedBarcode.toLowerCase());

    if (found) {
      onUpdateSpecimenStatus(found.id, 'EN_ANALIZADOR');
      setLastScanned({ ...found, status: 'EN_ANALIZADOR' });
      setScannedBarcode('');
    } else {
      alert(`Código de tubo "${scannedBarcode}" no encontrado en el sistema.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-600"></div>
        <div>
          <div className="text-cyan-700 text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center space-x-2">
            <TestTube className="w-4 h-4 text-cyan-600" />
            <span>Dashboard — Técnico de Laboratorio / Muestras</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Recepción de Tubos & Cadena de Custodia LIS
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl font-medium">
            Escanear código de barras de tubos (EDTA, Suero, Citrato), verificar integridad de muestra y cargar a gradillas de analizador.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-xs space-y-1 shrink-0">
          <div className="text-slate-900 font-bold flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-cyan-600" />
            <span>Téc. Jorge Valdés</span>
          </div>
          <div className="text-slate-600 text-[11px]">Sede Vía España — Flebotomía</div>
        </div>
      </div>

      {/* Bento Grid Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bento Cell 1: Barcode Scanner Simulator (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <QrCode className="w-4 h-4 text-cyan-600" />
                <span>Escanear Código / QR</span>
              </h3>
              <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-2.5 py-0.5 rounded-full">
                Lector Láser
              </span>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Ingresar o Escanear Código Barcode:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej. BC-882001"
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold w-full focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                  <button
                    onClick={handleScanBarcode}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm shrink-0 flex items-center space-x-1"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Disparo</span>
                  </button>
                </div>
              </div>

              {lastScanned && (
                <div className="bg-emerald-50/80 border border-emerald-300 text-emerald-900 p-3.5 rounded-2xl text-xs space-y-1 mt-4">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tubo Receptado Exitosamente</span>
                  </div>
                  <div className="text-[11px]">
                    Barcode <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold">{lastScanned.barcode}</code> — Tipo: {lastScanned.tubeType}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                    Estado: EN ANALIZADOR
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100">
            Cadena de custodia rastreable por número de lote y posición de gradilla.
          </div>
        </div>

        {/* Bento Cell 2: Specimens Inventory Grid (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <TestTube className="w-4 h-4 text-teal-600" />
              <span>Estado de Gradilla y Muestras de la Jornada</span>
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {allSpecimens.length} Tubos Procesados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {allSpecimens.map((sp) => (
              <div key={sp.id} className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 space-y-2 hover:border-cyan-300 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-900">{sp.barcode}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    sp.status === 'EN_ANALIZADOR' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {sp.status}
                  </span>
                </div>
                <div className="text-xs text-slate-700 font-semibold">Tubo: {sp.tubeType}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Toma: {sp.collectedAt ? new Date(sp.collectedAt).toLocaleTimeString() : 'Pendiente'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
