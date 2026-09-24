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
  Truck,
  Lock,
  FileText,
  Printer,
  ShieldAlert,
  UserCheck,
  Plus
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

export interface NarcoticLogEntry {
  id: string;
  folioNumber: string;
  timestamp: string;
  drugName: string;
  type: 'DISPENSACION_PACIENTE' | 'INGRESO_BOVEDA' | 'MERMA_ROTURA';
  patientName: string;
  patientNationalId: string;
  bedLocation: string;
  doctorName: string;
  doctorLicense: string; // e.g. "MED-7821-PA"
  nurseName: string;
  pharmacistName: string;
  quantity: number;
  remainingBalance: number;
  lotNumber: string;
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

const INITIAL_NARCOTICS_LOG: NarcoticLogEntry[] = [
  {
    id: 'narc-1',
    folioNumber: 'FOL-MINSA-2026-0182',
    timestamp: '2026-09-24 07:45',
    drugName: 'Fentanilo 0.5mg / 10mL Ampollas',
    type: 'DISPENSACION_PACIENTE',
    patientName: 'Abrego Castillo, Fernando',
    patientNationalId: '8-812-4432',
    bedLocation: 'UCI - Cama 02',
    doctorName: 'Dr. Alejandro Icaza Villalaz',
    doctorLicense: 'MED-1840-PA',
    nurseName: 'Enf. María Valdés (INF-592)',
    pharmacistName: 'Lic. Javier Samudio (FAR-2091-PA)',
    quantity: 2,
    remainingBalance: 48,
    lotNumber: 'LOT-FEN-9912'
  },
  {
    id: 'narc-2',
    folioNumber: 'FOL-MINSA-2026-0181',
    timestamp: '2026-09-24 06:30',
    drugName: 'Morfina Clorhidrato 10mg / 1mL',
    type: 'DISPENSACION_PACIENTE',
    patientName: 'Ríos, Gonzalo A.',
    patientNationalId: '8-745-1290',
    bedLocation: 'Piso 4 - Cama 412',
    doctorName: 'Dr. Roberto Eisenmann',
    doctorLicense: 'MED-3390-PA',
    nurseName: 'Enf. Carlos Herrera (INF-811)',
    pharmacistName: 'Lic. Javier Samudio (FAR-2091-PA)',
    quantity: 1,
    remainingBalance: 24,
    lotNumber: 'LOT-MOR-4401'
  },
  {
    id: 'narc-3',
    folioNumber: 'FOL-MINSA-2026-0180',
    timestamp: '2026-09-23 18:20',
    drugName: 'Midazolam 15mg / 3mL Inyectable',
    type: 'DISPENSACION_PACIENTE',
    patientName: 'Castillo, Sofía Elena',
    patientNationalId: '8-901-4412',
    bedLocation: 'Quirófano 2 (Pre-anestesia)',
    doctorName: 'Dra. Carmen Boyd',
    doctorLicense: 'MED-4910-PA',
    nurseName: 'Enf. Laura Gómez (INF-404)',
    pharmacistName: 'Lic. Javier Samudio (FAR-2091-PA)',
    quantity: 1,
    remainingBalance: 39,
    lotNumber: 'LOT-MID-7720'
  }
];

export const HospitalPharmacyDispensing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DISPENSING' | 'NARCOTICS'>('DISPENSING');
  const [prescriptions, setPrescriptions] = useState<PrescriptionOrder[]>(INITIAL_PRESCRIPTIONS);
  const [narcoticsLog, setNarcoticsLog] = useState<NarcoticLogEntry[]>(INITIAL_NARCOTICS_LOG);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedNarcoticFilter, setSelectedNarcoticFilter] = useState('ALL');

  const handleDispenseDose = (id: string) => {
    setPrescriptions(prev =>
      prev.map(p =>
        p.id === id ? { ...p, status: 'DISPENSADO_EN_DOSIS' } : p
      )
    );
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: '✓ Dosis Unitaria validada por Farmacia y enviada al Kardex de Enfermería (eMAR).', type: 'success' }
      })
    );
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    const matchesSearch =
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientNationalId.includes(searchTerm) ||
      p.drugName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatusFilter === 'ALL' || p.status === selectedStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredNarcotics = narcoticsLog.filter(n => {
    const matchesSearch =
      n.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.patientNationalId.includes(searchTerm) ||
      n.drugName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.doctorLicense.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDrug = selectedNarcoticFilter === 'ALL' || n.drugName.includes(selectedNarcoticFilter);
    return matchesSearch && matchesDrug;
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
            Gestión de Farmacia & Control de Medicamentos
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Validación de prescripciones eMAR, rotación FEFO y Libro Oficial de Control de Narcóticos / Psicotrópicos fiscalizado por el MINSA.
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

      {/* Tab Switcher */}
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('DISPENSING')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'DISPENSING'
              ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Dispensación Dosis Unitaria eMAR</span>
        </button>

        <button
          onClick={() => setActiveTab('NARCOTICS')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'NARCOTICS'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Lock className="w-4 h-4 text-rose-400" />
          <span>Libro Oficial de Narcóticos & Psicotrópicos (MINSA)</span>
        </button>
      </div>

      {activeTab === 'DISPENSING' ? (
        <>
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
        </>
      ) : (
        /* PESTAÑA: LIBRO OFICIAL DE CONTROL DE NARCÓTICOS Y PSICOTRÓPICOS MINSA */
        <div className="space-y-6">
          {/* Top Legal Notice */}
          <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border border-rose-500/40 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/40">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-rose-300 tracking-widest block">
                  MINISTERIO DE SALUD • DIRECCIÓN NACIONAL DE FARMACIA Y DROGAS
                </span>
                <h3 className="text-lg font-black text-white">
                  Libro Foliado Electrónico de Sustancias Controladas & Narcóticos
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Conforme al Decreto Ejecutivo de Control de Estupefacientes. Cada movimiento descuenta del saldo en bóveda con doble firma (Médico Idóneo y Farmacéutico).
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-rose-500/40 text-rose-300 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Folio Oficial (Carta)</span>
              </button>
            </div>
          </div>

          {/* Controlled Substances Quick Stock Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'Fentanilo 0.5mg/10mL', stock: 48, unit: 'Ampollas', color: 'text-rose-400' },
              { name: 'Morfina 10mg/mL', stock: 24, unit: 'Ampollas', color: 'text-amber-400' },
              { name: 'Midazolam 15mg/3mL', stock: 39, unit: 'Ampollas', color: 'text-cyan-400' },
              { name: 'Tramadol 100mg/2mL', stock: 65, unit: 'Ampollas', color: 'text-emerald-400' }
            ].map(med => (
              <div key={med.name} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
                <div className="text-[11px] font-bold text-slate-400 truncate">{med.name}</div>
                <div className={`text-2xl font-black font-mono mt-1 ${med.color}`}>{med.stock}</div>
                <div className="text-[10px] text-slate-500 font-medium">Bóveda: {med.unit} disponibles</div>
              </div>
            ))}
          </div>

          {/* Narcotics Audit Ledger Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por paciente, cédula o idoneidad..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="text-xs font-mono text-slate-400">
                Libro Foliado N°: <strong className="text-white">MINSA-FAR-2026-F08</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">N° Folio / Fecha</th>
                    <th className="p-3">Medicamento Controlado</th>
                    <th className="p-3">Paciente & Cédula</th>
                    <th className="p-3">Médico Prescriptor (MINSA)</th>
                    <th className="p-3 text-center">Cant.</th>
                    <th className="p-3 text-center">Saldo Bóveda</th>
                    <th className="p-3">Responsables Entrega</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-mono">
                  {filteredNarcotics.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-800/30">
                      <td className="p-3">
                        <span className="font-bold text-rose-300 block">{entry.folioNumber}</span>
                        <span className="text-[10px] text-slate-500 font-sans">{entry.timestamp}</span>
                      </td>
                      <td className="p-3 font-sans font-bold text-white">
                        {entry.drugName}
                        <span className="block text-[10px] font-mono text-amber-400 font-normal">Lote: {entry.lotNumber}</span>
                      </td>
                      <td className="p-3 font-sans">
                        <strong className="text-slate-100 block">{entry.patientName}</strong>
                        <span className="text-slate-400 font-mono text-[11px]">{entry.patientNationalId} • {entry.bedLocation}</span>
                      </td>
                      <td className="p-3 font-sans">
                        <span className="text-slate-200 block font-bold">{entry.doctorName}</span>
                        <span className="text-cyan-400 font-mono text-[11px] font-bold">Idoneidad: {entry.doctorLicense}</span>
                      </td>
                      <td className="p-3 text-center font-bold text-rose-400 text-sm">
                        -{entry.quantity}
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-400 text-sm">
                        {entry.remainingBalance}
                      </td>
                      <td className="p-3 font-sans text-[11px] text-slate-400">
                        <div>Farmacéutico: <strong className="text-slate-200">{entry.pharmacistName}</strong></div>
                        <div>Recibe Enfermería: <strong className="text-slate-200">{entry.nurseName}</strong></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalPharmacyDispensing;
