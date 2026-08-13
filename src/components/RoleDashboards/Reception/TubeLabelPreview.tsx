import React from 'react';
import { Specimen, Order, TestCatalogItem } from '../../../types';
import { Barcode, User, FlaskConical } from 'lucide-react';

interface TubeLabelPreviewProps {
  specimen: Specimen;
  order: Order;
  testsInTube: TestCatalogItem[];
}

export const TubeLabelPreview: React.FC<TubeLabelPreviewProps> = ({ specimen, order, testsInTube }) => {
  const getTubeColor = (type: string) => {
    switch (type) {
      case 'EDTA_MORADO': return 'border-l-purple-600 bg-purple-500/5';
      case 'SUERO_ROJO': return 'border-l-rose-600 bg-rose-500/5';
      case 'CITRATO_AZUL': return 'border-l-blue-600 bg-blue-500/5';
      case 'HEPARINA_VERDE': return 'border-l-emerald-600 bg-emerald-500/5';
      case 'ORINA': return 'border-l-amber-500 bg-amber-500/5';
      default: return 'border-l-slate-400 bg-slate-500/5';
    }
  };

  return (
    <div className={`border-2 border-slate-800 ${getTubeColor(specimen.tubeType)} border-l-[12px] rounded-3xl p-4 space-y-4 shadow-2xl relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 p-2 opacity-10">
         <FlaskConical className="w-12 h-12 text-white" />
      </div>

      <div className="space-y-1 relative z-10">
         <div className="flex items-center space-x-2">
            <User className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate">{order.patientName}</span>
         </div>
         <div className="text-[9px] font-mono text-slate-500 font-bold">{order.patientNationalId} • {order.patientAge}A • {order.patientGender}</div>
      </div>

      <div className="bg-white p-3 rounded-xl flex flex-col items-center justify-center space-y-1">
         <div className="text-[14px] font-black text-slate-950 font-mono tracking-[0.3em]">{specimen.barcode}</div>
         <div className="w-full h-8 bg-slate-950 flex items-center justify-center rounded overflow-hidden">
            {/* Simulated Barcode Lines */}
            <div className="flex items-center space-x-[1px] opacity-80">
               {[1,2,4,1,2,3,1,1,2,4,2,1,3,1,4,1,2,2,1,3,1,2,4].map((w, i) => (
                 <div key={i} className="bg-white" style={{ width: `${w}px`, height: '24px' }}></div>
               ))}
            </div>
         </div>
         <div className="text-[8px] font-black text-slate-900 uppercase">{specimen.tubeType.replace('_', ' ')}</div>
      </div>

      <div className="space-y-1 pt-1 border-t border-white/5 relative z-10">
         <div className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Contenido del Tubo:</div>
         <div className="flex flex-wrap gap-1">
            {testsInTube.map(t => (
              <span key={t.id} className="text-[7px] font-black bg-slate-950 text-teal-400 px-1.5 py-0.5 rounded border border-white/5 uppercase">
                {t.code}
              </span>
            ))}
         </div>
      </div>

      <div className="absolute bottom-2 right-4 text-[10px] font-black text-slate-800 italic opacity-20">
         {order.orderNumber}
      </div>
    </div>
  );
};
