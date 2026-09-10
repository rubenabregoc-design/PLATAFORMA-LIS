import React, { useState } from 'react';
import {
  Pill,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Package,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
  Barcode,
  Truck
} from 'lucide-react';

export interface PrescriptionOrder {
  id: string;
  prescriptionNumber: string; // e.g. "RX-2026-8801"
  patientName: string;
  patientNationalId: string;
  bedLocation: string;
  doctorName: string;
  drugName: string;
  dosage: string;
  route: string;
  frequency: string;
  quantityUnits: number;
  lotNumber: string;
  fefoExpiryDate: string;
  status: 'PENDIENTE_VALIDACION' | 'DISPENSADO_EN_DOSIS' | 'RECHAZADO_FARMACIA';
  createdTime: string;
}

const INITIAL_PRESCRIPTIONS: PrescriptionOrder[] = [
  {
    id: 'rx-101',
    prescriptionNumber: 'RX-2026-0812',
    patientName: 'Ríos, Gonzalo A.',
    patientNationalId: '8-745-1290',
    bedLocation: 'Piso 4 - Cama 412 (UCI)',
    doctorName: 'Dr. Roberto Eisenmann',
    drugName: 'Ceftriaxona Sódica 1g Inyectable IV',
    dosage: '1g IV',
    route: 'Intravenosa',
    frequency: 'Cada 12 horas',
    quantityUnits: 2,
    lotNumber: 'LOT-CEF-8821',
    fefoExpiryDate: '2026-11-15',
    status: 'PENDIENTE_VALIDACION',
    createdTime: '2026-08-21 08:15'
  },
  {
    id: 'rx-102',
    prescriptionNumber: 'RX-2026-0813',
    patientName: 'Castillo, Sofía Elena',
    patientNationalId: '8-901-4412',
    bedLocation: 'Piso 3 - Cama 301',
    doctorName: 'Dra. Carmen Boyd',
    drugName: 'Omeprazol 40mg IV',
    dosage: '40mg IV',
    route: 'Intravenosa',
    frequency: 'Cada 24 horas',
    quantityUnits: 1,
    lotNumber: 'LOT-OMP-9902',
    fefoExpiryDate: '2027-02-28',
    status: 'DISPENSADO_EN_DOSIS',
    createdTime: '2026-08-21 07:30'
  },
  {
    id: 'rx-103',
    prescriptionNumber: 'RX-2026-0814',
    patientName: 'Pinzón Varela, Gabriela',
    patientNationalId: '8-812-4432',
    bedLocation: 'Piso 2 - Cama 205',
    doctorName: 'Dr. Alejandro Icaza',
    drugName: 'Paracetamol 1g Solución para Infusión IV',
    dosage: '1g IV',
    route: 'Intravenosa',
    frequency: 'Cada 8 horas (PRN)',
    quantityUnits: 3,
    lotNumber: 'LOT-PAR-4410',
    fefoExpiryDate: '2026-09-30',
    status: 'PENDIENTE_VALIDACION',
    createdTime: '2026-08-21 09:00'
  }
];

export const HospitalPharmacyDispensing: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionOrder[]>(INITIAL_PRESCRIPTIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  const handleDispenseDose = (id: string) => {
    setPrescriptions(prev =>
      prev.map(p =>
        p.id === id ? { ...p, status: 'DISPENSADO_EN_DOSIS' } : p
      )
    );
    alert('¡Dosis Unitaria validada por Farmacia y enviada al Kardex de Enfermería (eMAR)!');
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    const matchesSearch =
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientNationalId.includes(searchTerm) ||
      p.drugName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatusFilter === 'ALL' || p.status === selectedStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-teal-800/40 p-6 sm:p-8 rounded-3xl text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20 mb-2">
            <Pill className="w-3.5 h-3.5" />
            <span>HIS • Farmacia Hospitalaria & Dispensación eMAR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Gestión de Farmacia & Dosis Unitaria FEFO
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Validación farmacéutica de prescripciones médicas, despacho de dosis unitaria eMAR y control de vencimiento por lotes FEFO.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-xs">
          <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-white">Sugerencia FEFO Automática</div>
            <div className="text-slate-400 text-[11px]">Rotación Prioritaria de Lotes Próximos a Vencer</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar medicamento, paciente o cédula..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-teal-500 outline-none font-sans"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          {['ALL', 'PENDIENTE_VALIDACION', 'DISPENSADO_EN_DOSIS'].map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer whitespace-nowrap ${
                selectedStatusFilter === st
                  ? 'bg-teal-500 text-slate-950 shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'ALL' ? 'Todas las Prescripciones' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Prescriptions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <th className="p-4">N° Receta</th>
              <th className="p-4">Paciente / Ubicación</th>
              <th className="p-4">Medicamento & Dosis</th>
              <th className="p-4">Vía / Frecuencia</th>
              <th className="p-4 text-center">Lote FEFO</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4 text-right">Acción Farmacia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredPrescriptions.map(item => (
              <tr key={item.id} className="hover:bg-slate-800/40 transition">
                <td className="p-4 font-mono font-bold text-teal-300">{item.prescriptionNumber}</td>
                <td className="p-4">
                  <p className="font-bold text-white">{item.patientName}</p>
                  <p className="text-[11px] text-teal-400 font-medium">{item.bedLocation}</p>
                </td>
                <td className="p-4">
                  <p className="font-bold text-slate-200">{item.drugName}</p>
                  <p className="text-[10px] text-slate-400">Prescrito por: {item.doctorName}</p>
                </td>
                <td className="p-4 text-slate-300">
                  <p className="font-bold">{item.dosage}</p>
                  <p className="text-[10px] text-slate-500">{item.frequency}</p>
                </td>
                <td className="p-4 text-center font-mono">
                  <p className="text-amber-400 font-bold text-[11px]">{item.lotNumber}</p>
                  <p className="text-[9px] text-slate-500">Vence: {item.fefoExpiryDate}</p>
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    item.status === 'DISPENSADO_EN_DOSIS'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {item.status === 'PENDIENTE_VALIDACION' ? (
                    <button
                      onClick={() => handleDispenseDose(item.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-900/30 flex items-center gap-1.5 ml-auto"
                    >
                      <CheckCircle2 size={14} />
                      Dispensar Dosis Unitaria
                    </button>
                  ) : (
                    <span className="text-slate-500 text-[10px] italic">Enviado a Kardex</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HospitalPharmacyDispensing;
