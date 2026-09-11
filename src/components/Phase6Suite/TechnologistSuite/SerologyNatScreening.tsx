import React, { useState } from 'react';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, Lock, Flame, RefreshCw,
  Search, Microscope, FileText, Sparkles, Filter, Droplets, Database
} from 'lucide-react';

export interface SerologyScreeningRecord {
  id: string;
  unitCode: string;
  donorName: string;
  donorNationalId: string;
  hivResult: 'NO_REACTIVO' | 'REACTIVO' | 'INDETERMINADO';
  hbsagResult: 'NO_REACTIVO' | 'REACTIVO' | 'INDETERMINADO';
  hcvResult: 'NO_REACTIVO' | 'REACTIVO' | 'INDETERMINADO';
  syphilisResult: 'NO_REACTIVO' | 'REACTIVO' | 'INDETERMINADO';
  chagasResult: 'NO_REACTIVO' | 'REACTIVO' | 'INDETERMINADO';
  natPcrResult: 'NO_DETECTADO' | 'DETECTADO_VIH' | 'DETECTADO_VHB' | 'DETECTADO_VHC';
  status: 'LIBERADA_APROBADA' | 'BLOQUEADA_DESCARTE' | 'PENDIENTE_REPETICION';
  screeningDate: string;
}

const INITIAL_SEROLOGY_RECORDS: SerologyScreeningRecord[] = [
  {
    id: 'sero-101',
    unitCode: 'PGRE-2026-0812',
    donorName: 'Carlos M. Castillo',
    donorNationalId: '8-762-1102',
    hivResult: 'NO_REACTIVO',
    hbsagResult: 'NO_REACTIVO',
    hcvResult: 'NO_REACTIVO',
    syphilisResult: 'NO_REACTIVO',
    chagasResult: 'NO_REACTIVO',
    natPcrResult: 'NO_DETECTADO',
    status: 'LIBERADA_APROBADA',
    screeningDate: '2026-08-14 09:15 AM'
  },
  {
    id: 'sero-102',
    unitCode: 'PFC-2026-0901',
    donorName: 'Mariana E. Gómez',
    donorNationalId: '8-812-9901',
    hivResult: 'NO_REACTIVO',
    hbsagResult: 'REACTIVO',
    hcvResult: 'NO_REACTIVO',
    syphilisResult: 'NO_REACTIVO',
    chagasResult: 'NO_REACTIVO',
    natPcrResult: 'DETECTADO_VHB',
    status: 'BLOQUEADA_DESCARTE',
    screeningDate: '2026-08-14 10:30 AM'
  }
];

export const SerologyNatScreening: React.FC = () => {
  const [records, setRecords] = useState<SerologyScreeningRecord[]>(INITIAL_SEROLOGY_RECORDS);
  const [searchTerm, setSearchQuery] = useState('');

  const blockedCount = records.filter(r => r.status === 'BLOQUEADA_DESCARTE').length;
  const approvedCount = records.filter(r => r.status === 'LIBERADA_APROBADA').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-slate-100">

      {/* Title Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-rose-600 to-amber-500 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-rose-600/20">
            <Microscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Tamizaje Serológico & Molecular NAT/PCR</h2>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                e-Delphyn Superior Interlock
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Pruebas inmunológicas (ECLIA/ELISA) y amplificación de ácidos nucleicos NAT/PCR para VIH, VHB, VHC, Sífilis y Chagas con bloqueo automático de unidad en 0ms.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950 px-4 py-2.5 rounded-2xl border border-rose-500/30 text-xs font-mono font-bold text-rose-300">
          <Lock className="w-4 h-4 text-rose-400" />
          <span>{blockedCount} Unidades Bloqueadas por Seguridad</span>
        </div>
      </div>

      {/* Serology Records Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Droplets className="w-5 h-5 text-rose-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Bitácora de Tamizaje Serológico e Infeccioso
            </h3>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar unidad o donante..."
              value={searchTerm}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-full pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
              <tr>
                <th className="p-3">Unidad ISBT 128 / Donante</th>
                <th className="p-3 text-center">VIH 1/2</th>
                <th className="p-3 text-center">VHB HBsAg</th>
                <th className="p-3 text-center">VHC</th>
                <th className="p-3 text-center">Sífilis / Chagas</th>
                <th className="p-3 text-center">NAT / PCR Molecular</th>
                <th className="p-3 text-right">Estado / Interlock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {records.map((r) => {
                const isBlocked = r.status === 'BLOQUEADA_DESCARTE';

                return (
                  <tr key={r.id} className="hover:bg-slate-800/60 transition">
                    <td className="p-3">
                      <div className="font-bold text-rose-300">{r.unitCode}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{r.donorName} ({r.donorNationalId})</div>
                    </td>
                    <td className="p-3 text-center font-bold">
                      <span className={r.hivResult === 'REACTIVO' ? 'text-rose-400 font-black' : 'text-emerald-400'}>
                        {r.hivResult}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold">
                      <span className={r.hbsagResult === 'REACTIVO' ? 'text-rose-400 font-black animate-pulse' : 'text-emerald-400'}>
                        {r.hbsagResult}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold">
                      <span className={r.hcvResult === 'REACTIVO' ? 'text-rose-400 font-black' : 'text-emerald-400'}>
                        {r.hcvResult}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-300">
                      {r.syphilisResult} / {r.chagasResult}
                    </td>
                    <td className="p-3 text-center font-bold">
                      <span className={r.natPcrResult.includes('DETECTADO') ? 'text-rose-400 font-black' : 'text-emerald-400'}>
                        {r.natPcrResult}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {isBlocked ? (
                        <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black inline-flex items-center gap-1 animate-pulse">
                          <Lock className="w-3 h-3 text-rose-400" />
                          <span>BLOQUEADA (Descarte)</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>LIBERADA (Aprobada)</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
