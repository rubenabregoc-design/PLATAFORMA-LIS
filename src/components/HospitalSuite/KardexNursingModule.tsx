import React, { useState } from 'react';
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  BedDouble,
  Search,
  Filter,
  Calendar,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { useHisStore } from '../../store/useHisStore';
import { KardexAdministrationRecord } from '../../types';

export const KardexNursingModule: React.FC = () => {
  const {
    kardexRecords,
    medicationOrders,
    admissions,
    beds,
    recordMedicationAdministration
  } = useHisStore();

  const [selectedShift, setSelectedShift] = useState<'TODOS' | 'PROGRAMADA' | 'ADMINISTRADA'>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [nurseSignature, setNurseSignature] = useState<string>('Enf. Roberto Díaz (Reg. 6420)');

  // Modal administer
  const [selectedRecordForAdmin, setSelectedRecordForAdmin] = useState<KardexAdministrationRecord | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');

  const filteredRecords = kardexRecords.filter((rec) => {
    const med = medicationOrders.find((m) => m.id === rec.medicationOrderId);
    const adm = admissions.find((a) => a.id === rec.admissionId);
    const matchesShift = selectedShift === 'TODOS' || rec.status === selectedShift;
    const matchesSearch =
      (med?.drugName && med.drugName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (adm?.patientName && adm.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (adm?.patientNationalId && adm.patientNationalId.includes(searchTerm));
    return matchesShift && matchesSearch;
  });

  const handleAdministerDose = () => {
    if (!selectedRecordForAdmin) return;
    recordMedicationAdministration(
      selectedRecordForAdmin.id,
      nurseSignature,
      'ADMINISTRADA',
      adminNotes || 'Dosis administrada sin complicaciones.'
    );
    alert('Dosis registrada como administrada en el Kardex.');
    setSelectedRecordForAdmin(null);
    setAdminNotes('');
  };

  const handleOmitDose = (recId: string) => {
    const reason = prompt('Motivo de omisión o suspensión de la dosis:');
    if (reason) {
      recordMedicationAdministration(recId, nurseSignature, 'OMITIDA', reason);
      alert('Dosis marcada como omitida.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-teal-400 text-xs font-black uppercase tracking-widest mb-1.5">
              <Pill className="w-4 h-4" />
              <span>HIS • Kardex de Enfermería & Hoja eMAR de Administración</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Kardex Clínico & Dosis Unitaria
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Control riguroso de administración de fármacos por horario y cama hospitalaria, registro de doble verificación y tolerancia del paciente.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700 px-4 py-3 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Dosis Programadas</span>
              <span className="text-xl font-black text-amber-400">
                {kardexRecords.filter((k) => k.status === 'PROGRAMADA').length}
              </span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 px-4 py-3 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Administradas Hoy</span>
              <span className="text-xl font-black text-emerald-400">
                {kardexRecords.filter((k) => k.status === 'ADMINISTRADA').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          {(['TODOS', 'PROGRAMADA', 'ADMINISTRADA'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedShift(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedShift === s
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {s === 'TODOS' ? 'Todas las Dosis' : s === 'PROGRAMADA' ? 'Pendientes de Aplicar' : 'Ya Administradas'}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar medicamento o paciente..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="text-xs text-slate-400 shrink-0">
            Enfermero/a en turno: <strong className="text-white">{nurseSignature}</strong>
          </div>
        </div>
      </div>

      {/* Kardex List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center justify-between">
          <span>Hoja de Registro de Medicamentos eMAR ({filteredRecords.length})</span>
          <span className="text-xs font-mono text-teal-400">Seguridad del Paciente • 5 Correctos</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3 rounded-l-xl">Cama & Paciente</th>
                <th className="p-3">Medicamento & Dosis</th>
                <th className="p-3">Vía & Frecuencia</th>
                <th className="p-3">Horario Programado</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Registro de Aplicación</th>
                <th className="p-3 rounded-r-xl text-right">Acción de Enfermería</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {filteredRecords.map((rec) => {
                const med = medicationOrders.find((m) => m.id === rec.medicationOrderId);
                const adm = admissions.find((a) => a.id === rec.admissionId);
                const bed = beds.find((b) => b.id === adm?.bedId);

                return (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <div className="font-bold text-white">{adm?.patientName}</div>
                      <div className="text-[10px] text-teal-300 font-mono">
                        {adm?.ward} • Cama {bed?.bedNumber || 'S/A'}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-amber-300">{med?.drugName}</div>
                      <div className="text-[11px] text-slate-300 font-bold">{med?.dose}</div>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold bg-slate-800 px-2 py-0.5 rounded-md text-slate-300">
                        {med?.route}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">{med?.frequency}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-300">
                      {new Date(rec.scheduledTime).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          rec.status === 'ADMINISTRADA'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : rec.status === 'OMITIDA'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-400">
                      {rec.status === 'ADMINISTRADA' ? (
                        <div>
                          <div className="text-white font-semibold">{rec.administeredBy}</div>
                          <div className="text-[10px] text-slate-500">
                            {rec.administeredTime ? new Date(rec.administeredTime).toLocaleTimeString('es-PA') : ''}
                          </div>
                          {rec.notes && <div className="text-[10px] italic text-emerald-300/80">"{rec.notes}"</div>}
                        </div>
                      ) : rec.status === 'OMITIDA' ? (
                        <div className="text-rose-300 italic text-[10px]">Motivo: {rec.notes}</div>
                      ) : (
                        <span className="text-slate-500 italic">Pendiente por enfermería</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {rec.status === 'PROGRAMADA' && (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setSelectedRecordForAdmin(rec)}
                            className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-[10px] font-black transition cursor-pointer shadow-md shadow-teal-500/20 flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Aplicar</span>
                          </button>
                          <button
                            onClick={() => handleOmitDose(rec.id)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-xl text-[10px] font-bold transition cursor-pointer"
                          >
                            Omitir
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Administrar Dosis */}
      {selectedRecordForAdmin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center border border-teal-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">Confirmación de Administración</h3>
                <p className="text-xs text-slate-400">Verificación de Dosis y Paciente</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="text-slate-400">
                Medicamento: <strong className="text-amber-300 font-bold">{medicationOrders.find((m) => m.id === selectedRecordForAdmin.medicationOrderId)?.drugName}</strong>
              </div>
              <div className="text-slate-400">
                Dosis y Vía: <strong className="text-white font-bold">{medicationOrders.find((m) => m.id === selectedRecordForAdmin.medicationOrderId)?.dose} ({medicationOrders.find((m) => m.id === selectedRecordForAdmin.medicationOrderId)?.route})</strong>
              </div>
              <div className="text-slate-400">
                Paciente: <strong className="text-white font-bold">{admissions.find((a) => a.id === selectedRecordForAdmin.admissionId)?.patientName}</strong>
              </div>
            </div>

            <div className="text-xs space-y-2">
              <label className="font-bold text-slate-300 block">Observaciones / Tolerancia</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Buena tolerancia, sin dolor local, infusión en bomba continua..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedRecordForAdmin(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdministerDose}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-teal-500/20 transition cursor-pointer"
              >
                Registrar Administración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
