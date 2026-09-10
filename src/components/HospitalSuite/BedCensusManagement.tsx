import React, { useState } from 'react';
import {
  BedDouble,
  Building2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  ArrowRightLeft,
  FileText,
  UserPlus,
  Search,
  Sparkles,
  ShieldCheck,
  Clock,
  Layers,
  Activity
} from 'lucide-react';
import { useHisStore } from '../../store/useHisStore';
import { useLisStore } from '../../store/useLisStore';
import { BedStatus, HospitalBed } from '../../types';
type HospitalWard = HospitalBed['ward'];

interface BedCensusProps {
  onNavigateToEhr?: (admissionId: string) => void;
}

export const BedCensusManagement: React.FC<BedCensusProps> = ({ onNavigateToEhr }) => {
  const {
    beds,
    admissions,
    setBedStatus,
    transferPatientBed,
    dischargePatient,
    setSelectedAdmissionId
  } = useHisStore();
  const { patients } = useLisStore();

  const [selectedWard, setSelectedWard] = useState<HospitalWard | 'TODAS'>('TODAS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal states
  const [transferModalBed, setTransferModalBed] = useState<HospitalBed | null>(null);
  const [targetTransferBedId, setTargetTransferBedId] = useState<string>('');
  const [dischargeModalBed, setDischargeModalBed] = useState<HospitalBed | null>(null);

  const filteredBeds = beds.filter((bed) => {
    const matchesWard = selectedWard === 'TODAS' || bed.ward === selectedWard;
    const matchesSearch =
      bed.bedNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bed.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bed.currentPatientName && bed.currentPatientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bed.currentPatientCedula && bed.currentPatientCedula.includes(searchTerm));
    return matchesWard && matchesSearch;
  });

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === 'OCUPADA').length;
  const availableBeds = beds.filter((b) => b.status === 'DISPONIBLE').length;
  const disinfectionBeds = beds.filter((b) => b.status === 'DESINFECCION').length;
  const maintenanceBeds = beds.filter((b) => b.status === 'MANTENIMIENTO').length;
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

  const handleOpenTransfer = (bed: HospitalBed) => {
    setTransferModalBed(bed);
    const firstAvailable = beds.find((b) => b.status === 'DISPONIBLE' && b.id !== bed.id);
    setTargetTransferBedId(firstAvailable?.id || '');
  };

  const handleConfirmTransfer = () => {
    if (!transferModalBed || !targetTransferBedId || !transferModalBed.admissionId) return;
    transferPatientBed(transferModalBed.admissionId, transferModalBed.id, targetTransferBedId);
    alert(`Paciente trasladado exitosamente a la cama seleccionada.`);
    setTransferModalBed(null);
  };

  const handleConfirmDischarge = () => {
    if (!dischargeModalBed || !dischargeModalBed.admissionId) return;
    dischargePatient(dischargeModalBed.admissionId, dischargeModalBed.id);
    alert(`Alta hospitalaria registrada para ${dischargeModalBed.currentPatientName}. Cama pasa a desinfección.`);
    setDischargeModalBed(null);
  };

  const handleViewEhr = (admissionId: string) => {
    setSelectedAdmissionId(admissionId);
    if (onNavigateToEhr) {
      onNavigateToEhr(admissionId);
    }
  };

  const getStatusBadge = (status: BedStatus) => {
    switch (status) {
      case 'DISPONIBLE':
        return { label: 'Disponible', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
      case 'OCUPADA':
        return { label: 'Ocupada', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' };
      case 'DESINFECCION':
        return { label: 'En Desinfección', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      case 'MANTENIMIENTO':
        return { label: 'Mantenimiento', color: 'bg-slate-700/60 text-slate-300 border-slate-600' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Hospital Metrics */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-black uppercase tracking-widest mb-1.5">
              <Building2 className="w-4 h-4" />
              <span>HIS • Censo Hospitalario y Gestión de Camas en Tiempo Real</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Censo de Camas & Pabellones Clínicos
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Monitoreo visual del censo de hospitalización, traslados inter-salas, control de aislamientos y altas hospitalarias.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Ocupación Global</span>
              <span className="text-xl font-black text-white">{occupancyRate}%</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/25 px-4 py-2.5 rounded-2xl text-center">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">Disponibles</span>
              <span className="text-xl font-black text-emerald-300">{availableBeds}</span>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/25 px-4 py-2.5 rounded-2xl text-center">
              <span className="text-[10px] text-blue-400 uppercase font-bold block">Ocupadas</span>
              <span className="text-xl font-black text-blue-300">{occupiedBeds}</span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 rounded-2xl text-center">
              <span className="text-[10px] text-amber-400 uppercase font-bold block">En Limpieza</span>
              <span className="text-xl font-black text-amber-300">{disinfectionBeds}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ward Filter Bar & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
        {/* Ward Tabs */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {(['TODAS', 'URGENCIAS', 'HOSPITALIZACION', 'UCI', 'CIRUGIA', 'PEDIATRIA'] as const).map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWard(w)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedWard === w
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {w === 'TODAS' ? 'Todas las Salas' : w}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cama, paciente o cédula..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Bed Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredBeds.map((bed) => {
          const badge = getStatusBadge(bed.status);
          const admission = admissions.find((a) => a.id === bed.admissionId);

          return (
            <div
              key={bed.id}
              className={`bg-slate-900 border rounded-3xl p-5 shadow-xl transition flex flex-col justify-between relative overflow-hidden ${
                bed.status === 'OCUPADA'
                  ? 'border-blue-500/40 bg-gradient-to-b from-slate-900 to-blue-950/20'
                  : bed.status === 'DISPONIBLE'
                  ? 'border-emerald-500/30 hover:border-emerald-500/60'
                  : bed.status === 'DESINFECCION'
                  ? 'border-amber-500/30'
                  : 'border-slate-800'
              }`}
            >
              {/* Header Card */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                      <BedDouble className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-sm tracking-tight">{bed.bedNumber}</h4>
                      <span className="text-[10px] text-slate-400 block">{bed.roomNumber}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Ward Tag */}
                <div className="mb-3">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                    {bed.ward}
                  </span>
                </div>

                {/* Patient Information if Occupied */}
                {bed.status === 'OCUPADA' ? (
                  <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 space-y-2 mb-3">
                    <div className="font-bold text-white text-xs leading-snug">{bed.currentPatientName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Cédula: {bed.currentPatientCedula}</div>

                    {admission && (
                      <div className="text-[10px] text-indigo-300 bg-indigo-950/50 p-2 rounded-xl border border-indigo-500/20">
                        <span className="font-semibold block text-slate-400">Diagnóstico CIE-10:</span>
                        {admission.primaryDiagnosisIcd10}
                      </div>
                    )}

                    <div className="text-[9px] text-slate-500 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Ingreso: {admission ? new Date(admission.admissionDate).toLocaleDateString('es-PA') : 'Reciente'}</span>
                    </div>
                  </div>
                ) : bed.status === 'DESINFECCION' ? (
                  <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-3 text-center mb-3">
                    <Sparkles className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <span className="text-[11px] font-bold text-amber-300 block">Protocolo de Limpieza</span>
                    <span className="text-[9px] text-slate-400">Desinfección terminal en curso</span>
                  </div>
                ) : (
                  <div className="bg-slate-950/40 border border-slate-800/50 rounded-2xl p-4 text-center mb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <span className="text-xs font-bold text-emerald-300 block">Cama Lista</span>
                    <span className="text-[10px] text-slate-500">Apta para asignación inmediata</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                {bed.status === 'OCUPADA' ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {bed.admissionId && (
                      <button
                        onClick={() => handleViewEhr(bed.admissionId!)}
                        className="col-span-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black transition cursor-pointer flex items-center justify-center space-x-1 shadow-md shadow-indigo-600/20"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ver Expediente EHR</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenTransfer(bed)}
                      className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold transition cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>Trasladar</span>
                    </button>
                    <button
                      onClick={() => setDischargeModalBed(bed)}
                      className="py-1.5 bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-[10px] font-bold transition cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Dar Alta</span>
                    </button>
                  </div>
                ) : bed.status === 'DESINFECCION' ? (
                  <button
                    onClick={() => setBedStatus(bed.id, 'DISPONIBLE')}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1 shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Liberar / Cama Desinfectada</span>
                  </button>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setBedStatus(bed.id, 'MANTENIMIENTO')}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-[10px] font-bold transition cursor-pointer"
                    >
                      Mantenimiento
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL TRASLADO DE CAMA */}
      {transferModalBed && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">Traslado de Cama Hospitalaria</h3>
                <p className="text-xs text-slate-400">{transferModalBed.currentPatientName}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-400">
                Cama actual: <strong className="text-white">{transferModalBed.bedNumber} ({transferModalBed.ward})</strong>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Seleccionar Cama Destino</label>
                <select
                  value={targetTransferBedId}
                  onChange={(e) => setTargetTransferBedId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  {beds
                    .filter((b) => b.status === 'DISPONIBLE')
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        [{b.ward}] Cama {b.bedNumber} - {b.roomNumber}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setTransferModalBed(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmTransfer}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition cursor-pointer"
              >
                Ejecutar Traslado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALTA MÉDICA */}
      {dischargeModalBed && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center border border-rose-500/30">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">Confirmar Alta Hospitalaria</h3>
                <p className="text-xs text-slate-400">{dischargeModalBed.currentPatientName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Está seguro de emitir el alta para el paciente <strong className="text-white">{dischargeModalBed.currentPatientName}</strong>?
              La cama <strong className="text-indigo-300">{dischargeModalBed.bedNumber}</strong> pasará automáticamente a estado de <strong>Desinfección</strong>.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDischargeModalBed(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDischarge}
                className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-xs font-black transition cursor-pointer"
              >
                Confirmar Alta Médica
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
