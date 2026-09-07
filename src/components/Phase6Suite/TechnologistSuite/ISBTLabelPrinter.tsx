import React from 'react';
import { Printer, X, ShieldAlert } from 'lucide-react';

interface ISBTLabelPrinterProps {
  unit: any;
  onClose: () => void;
}

const ISBTLabelPrinter: React.FC<ISBTLabelPrinterProps> = ({ unit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Printer size={18} />
            Impresión de Etiqueta ISBT 128
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 flex justify-center">
          {/* Label Mockup (ISBT 128 Layout) */}
          <div className="w-[300px] h-[300px] border-2 border-slate-800 p-2 flex flex-col gap-2 font-mono text-black relative">

            {/* Upper Left: DIN */}
            <div className="border border-black p-1 h-1/4">
              <div className="text-[8px] font-bold">DONATION ID</div>
              <div className="text-lg font-bold tracking-tighter">{unit.unit_number}</div>
              <div className="mt-1 bg-black h-4 w-full"></div> {/* Placeholder for Barcode */}
            </div>

            {/* Upper Right: Blood Group */}
            <div className="absolute top-2 right-2 border-2 border-black w-20 h-20 flex flex-col items-center justify-center bg-white">
              <div className="text-4xl font-black">{unit.blood_type}</div>
              <div className="text-xl font-bold">{unit.rh_factor === 'POS' ? 'Rh POSITIVO' : 'Rh NEGATIVO'}</div>
            </div>

            {/* Middle: Component Type */}
            <div className="border border-black p-1 flex-1">
              <div className="text-[8px] font-bold">PRODUCT CODE / NAME</div>
              <div className="text-sm font-bold mt-1">{unit.component_type}</div>
              <div className="text-[10px] mt-1 italic">CPD/ADSOL - 450mL</div>
              <div className="mt-2 bg-black h-4 w-3/4"></div>
            </div>

            {/* Bottom: Expiry & Serology */}
            <div className="flex gap-2 h-1/4">
              <div className="border border-black p-1 flex-1">
                <div className="text-[8px] font-bold">EXPIRATION DATE</div>
                <div className="text-sm font-bold">{new Date(unit.expiry_date).toLocaleDateString().replace(/\//g, '-')}</div>
              </div>
              <div className="border border-black p-1 flex-1 bg-green-50">
                <div className="text-[8px] font-bold text-green-700">TESTED FOR</div>
                <div className="text-[8px] font-bold text-green-700">HIV, HCV, HBV, SYP, CHAGAS</div>
                <div className="text-center font-bold text-green-700 mt-1">NEGATIVO</div>
              </div>
            </div>

            <div className="absolute -rotate-90 -right-8 top-1/2 text-[8px] text-slate-400 font-sans">
              PLATAFORMA-LIS • AABB COMPLIANT
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <div className="flex-1 flex items-center gap-2 text-xs text-amber-700 font-medium">
            <ShieldAlert size={16} />
            Verificar integridad de la bolsa antes de imprimir.
          </div>
          <button
            onClick={() => window.print()}
            className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-700 transition-colors shadow-lg"
          >
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ISBTLabelPrinter;
