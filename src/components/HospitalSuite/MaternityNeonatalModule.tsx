import React, { useState } from 'react';
import {
  Baby,
  HeartPulse,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Award,
  Layers,
  Sparkles,
  Calendar,
  FileText,
  UserPlus
} from 'lucide-react';

export interface NeonatalRecord {
  id: string;
  nipCode: string; // e.g. "NIP-2026-8801"
  motherName: string;
  motherNationalId: string;
  babyGender: 'M' | 'F' | 'AMBIGUO';
  birthWeightGrams: number;
  birthHeightCm: number;
  apgar1Min: number;
  apgar5Min: number;
  gestationalWeeks: number;
  birthTimestamp: string;
  rhogamAdministered: boolean;
  neonatalScreeningStatus: 'COMPLETADO' | 'PENDIENTE';
}

const INITIAL_NEONATES: NeonatalRecord[] = [
  {
    id: 'neo-101',
    nipCode: 'NIP-2026-0812-RN1',
    motherName: 'Pinzón Varela, Gabriela',
    motherNationalId: '8-812-4432',
    babyGender: 'M',
    birthWeightGrams: 3250,
    birthHeightCm: 50,
    apgar1Min: 8,
    apgar5Min: 9,
    gestationalWeeks: 39,
    birthTimestamp: '2026-08-21 06:45 AM',
    rhogamAdministered: true,
    neonatalScreeningStatus: 'COMPLETADO'
  },
  {
    id: 'neo-102',
    nipCode: 'NIP-2026-0815-RN1',
    motherName: 'Morales, Valeria',
    motherNationalId: '8-902-1144',
    babyGender: 'F',
    birthWeightGrams: 2890,
    birthHeightCm: 48,
    apgar1Min: 9,
    apgar5Min: 10,
    gestationalWeeks: 38,
    birthTimestamp: '2026-08-20 18:20 PM',
    rhogamAdministered: false,
    neonatalScreeningStatus: 'PENDIENTE'
  }
];

export const MaternityNeonatalModule: React.FC = () => {
  const [neonates, setNeonates] = useState<NeonatalRecord[]>(INITIAL_NEONATES);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNeonates = neonates.filter(n =>
    n.motherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.motherNationalId.includes(searchTerm) ||
    n.nipCode.includes(searchTerm)
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-800/40 p-6 sm:p-8 rounded-3xl text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 mb-2">
            <Baby className="w-3.5 h-3.5" />
            <span>HIS • Maternidad, Neonatología & Pediatría (NIP MINSA)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Expediente Materno-Infantil & Tamiz Neonatal
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Control obstétrico prenatal, registro de parto/cesárea, puntuación de APGAR, asignación de NIP MINSA/CSS y tamizaje metabólico neonatal.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-xs">
          <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-white">Profilaxis RhoGAM Anti-D</div>
            <div className="text-slate-400 text-[11px]">Verificación de Incompatibilidad Materno-Fetal</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por madre, cédula o NIP del recién nacido..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-purple-500 outline-none font-sans"
          />
        </div>
      </div>

      {/* Neonates Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <th className="p-4">NIP MINSA (Neonato)</th>
              <th className="p-4">Madre / Cédula</th>
              <th className="p-4">Sexo & Peso</th>
              <th className="p-4 text-center">APGAR 1' / 5'</th>
              <th className="p-4 text-center">Profilaxis Anti-D</th>
              <th className="p-4 text-center">Tamiz Neonatal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredNeonates.map(item => (
              <tr key={item.id} className="hover:bg-slate-800/40 transition">
                <td className="p-4 font-mono font-bold text-purple-300">{item.nipCode}</td>
                <td className="p-4">
                  <p className="font-bold text-white">{item.motherName}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{item.motherNationalId}</p>
                </td>
                <td className="p-4 text-slate-300">
                  <p className="font-bold">{item.babyGender === 'M' ? 'Masculino ♂' : 'Femenino ♀'}</p>
                  <p className="text-[10px] text-teal-400 font-mono">{item.birthWeightGrams} g • {item.birthHeightCm} cm</p>
                </td>
                <td className="p-4 text-center font-mono font-bold text-emerald-400 text-sm">
                  {item.apgar1Min} / {item.apgar5Min}
                </td>
                <td className="p-4 text-center">
                  {item.rhogamAdministered ? (
                    <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold">
                      RhoGAM Aplicado
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px]">No Requerido</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    item.neonatalScreeningStatus === 'COMPLETADO'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {item.neonatalScreeningStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaternityNeonatalModule;
