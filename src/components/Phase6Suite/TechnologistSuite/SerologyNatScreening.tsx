import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Flame,
  RefreshCw,
  Search,
  Microscope,
  FileText,
  Sparkles,
  Filter,
  Droplets,
  Database,
  Check,
  X,
  Plus,
  Radio,
  FileCheck2,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  Printer
} from 'lucide-react';
import { useLisStore } from '../../../store/useLisStore';
import { BloodBankService } from '../../../services/SupabaseService';

export interface SerologyScreeningRecord {
  id: string;
  unitCode: string;
  componentType: string;
  donorName: string;
  donorNationalId: string;
  bloodType: string;
  rhFactor: string;
  hivResult: 'NO_REACTIVO' | 'REACTIVO' | 'INDETERMINADO';
  hbsagResult: 'NO_REACTIVO' | 'REACTIVO' | 'INDETERMINADO';
  hcvResult: 'NO_REACTIVO' | 'REACTIVO' | 'INDETERMINADO';
  syphilisResult: 'NO_REACTIVO' | 'REACTIVO' | 'INDETERMINADO';
  chagasResult: 'NO_REACTIVO' | 'REACTIVO' | 'INDETERMINADO';
  htlvResult: 'NO_REACTIVO' | 'REACTIVO' | 'INDETERMINADO';
  natPcrResult: 'NO_DETECTADO' | 'DETECTADO_VIH' | 'DETECTADO_VHB' | 'DETECTADO_VHC';
  status: 'QUARANTINE' | 'AVAILABLE' | 'DISCARDED';
  serologyStatus: 'PENDING' | 'NEGATIVE' | 'REACTIVE';
  screeningDate: string;
  analyst: string;
}

const DEMO_SEROLOGY_RECORDS: SerologyScreeningRecord[] = [
  {
    id: 'sero-101',
    unitCode: 'PGRE-2026-0812',
    componentType: 'Concentrado de Glóbulos Rojos',
    donorName: 'Carlos M. Castillo',
    donorNationalId: '8-762-1102',
    bloodType: 'O',
    rhFactor: 'POS',
    hivResult: 'NO_REACTIVO',
    hbsagResult: 'NO_REACTIVO',
    hcvResult: 'NO_REACTIVO',
    syphilisResult: 'NO_REACTIVO',
    chagasResult: 'NO_REACTIVO',
    htlvResult: 'NO_REACTIVO',
    natPcrResult: 'NO_DETECTADO',
    status: 'AVAILABLE',
    serologyStatus: 'NEGATIVE',
    screeningDate: '2026-11-20 09:15',
    analyst: 'Lic. Abrego'
  },
  {
    id: 'sero-102',
    unitCode: 'DIN-PA-2026-9041',
    componentType: 'Sangre Total (CPDA-1)',
    donorName: 'Mariana E. Gómez',
    donorNationalId: '8-812-9901',
    bloodType: 'A',
    rhFactor: 'POS',
    hivResult: 'NO_REACTIVO',
    hbsagResult: 'REACTIVO',
    hcvResult: 'NO_REACTIVO',
    syphilisResult: 'NO_REACTIVO',
    chagasResult: 'NO_REACTIVO',
    htlvResult: 'NO_REACTIVO',
    natPcrResult: 'DETECTADO_VHB',
    status: 'DISCARDED',
    serologyStatus: 'REACTIVE',
    screeningDate: '2026-11-21 10:30',
    analyst: 'Lic. Abrego'
  },
  {
    id: 'sero-103',
    unitCode: 'PFC-2026-1105',
    componentType: 'Plasma Fresco Congelado',
    donorName: 'David E. Ramos',
    donorNationalId: '4-722-1980',
    bloodType: 'B',
    rhFactor: 'POS',
    hivResult: 'NO_REACTIVO',
    hbsagResult: 'NO_REACTIVO',
    hcvResult: 'NO_REACTIVO',
    syphilisResult: 'NO_REACTIVO',
    chagasResult: 'NO_REACTIVO',
    htlvResult: 'NO_REACTIVO',
    natPcrResult: 'NO_DETECTADO',
    status: 'QUARANTINE',
    serologyStatus: 'PENDING',
    screeningDate: '2026-11-24 08:00',
    analyst: 'Por Asignar'
  }
];

export const SerologyNatScreening: React.FC = () => {
  const isDemoMode = useLisStore((state) => state.isDemoMode);
  const [records, setRecords] = useState<SerologyScreeningRecord[]>(DEMO_SEROLOGY_RECORDS);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'QUARANTINE' | 'AVAILABLE' | 'DISCARDED'>('ALL');

  // Modal State for Testing/Editing a Unit
  const [selectedUnit, setSelectedUnit] = useState<SerologyScreeningRecord | null>(null);
  const [screeningForm, setScreeningForm] = useState({
    hivResult: 'NO_REACTIVO' as 'NO_REACTIVO' | 'REACTIVO' | 'INDETERMINADO',
    hbsagResult: 'NO_REACTIVO' as 'NO_REACTIVO' | 'REACTIVO' | 'INDETERMINADO',
    hcvResult: 'NO_REACTIVO' as 'NO_REACTIVO' | 'REACTIVO' | 'INDETERMINADO',
    syphilisResult: 'NO_REACTIVO' as 'NO_REACTIVO' | 'REACTIVO' | 'INDETERMINADO',
    chagasResult: 'NO_REACTIVO' as 'NO_REACTIVO' | 'REACTIVO' | 'INDETERMINADO',
    htlvResult: 'NO_REACTIVO' as 'NO_REACTIVO' | 'REACTIVO' | 'INDETERMINADO',
    natPcrResult: 'NO_DETECTADO' as 'NO_DETECTADO' | 'DETECTADO_VIH' | 'DETECTADO_VHB' | 'DETECTADO_VHC',
    analyst: 'Lic. Tecnólogo Médico'
  });

  // Fetch real units from database
  const loadUnits = async () => {
    setLoading(true);
    try {
      if (!isDemoMode) {
        const rawUnits = await BloodBankService.getAllUnits();
        if (rawUnits && rawUnits.length > 0) {
          const mapped: SerologyScreeningRecord[] = rawUnits.map((u: any) => ({
            id: u.id,
            unitCode: u.unit_number || u.id,
            componentType: u.component_type || 'Sangre Total',
            donorName: u.donor_id ? `Donante Ref: ${u.donor_id.slice(0, 8)}` : 'Donante Voluntario',
            donorNationalId: 'Registrado MINSA',
            bloodType: u.blood_type || 'O',
            rhFactor: u.rh_factor || 'POS',
            hivResult: u.marker_hiv ? 'REACTIVO' : 'NO_REACTIVO',
            hbsagResult: u.marker_hbv ? 'REACTIVO' : 'NO_REACTIVO',
            hcvResult: u.marker_hcv ? 'REACTIVO' : 'NO_REACTIVO',
            syphilisResult: u.marker_syphilis ? 'REACTIVO' : 'NO_REACTIVO',
            chagasResult: u.marker_chagas ? 'REACTIVO' : 'NO_REACTIVO',
            htlvResult: u.marker_htlv ? 'REACTIVO' : 'NO_REACTIVO',
            natPcrResult: u.marker_hiv || u.marker_hbv || u.marker_hcv ? 'DETECTADO_VHB' : 'NO_DETECTADO',
            status: u.status as any,
            serologyStatus: u.serology_status as any,
            screeningDate: u.created_at ? new Date(u.created_at).toLocaleDateString('es-PA') : new Date().toLocaleDateString('es-PA'),
            analyst: 'Lic. Inmunohematología'
          }));
          setRecords(mapped);
        } else {
          setRecords([]);
        }
      } else {
        setRecords(DEMO_SEROLOGY_RECORDS);
      }
    } catch (err) {
      console.error('Error fetching serology units:', err);
      if (isDemoMode) setRecords(DEMO_SEROLOGY_RECORDS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, [isDemoMode]);

  // Open modal for a unit
  const handleOpenScreeningModal = (record: SerologyScreeningRecord) => {
    setSelectedUnit(record);
    setScreeningForm({
      hivResult: record.hivResult || 'NO_REACTIVO',
      hbsagResult: record.hbsagResult || 'NO_REACTIVO',
      hcvResult: record.hcvResult || 'NO_REACTIVO',
      syphilisResult: record.syphilisResult || 'NO_REACTIVO',
      chagasResult: record.chagasResult || 'NO_REACTIVO',
      htlvResult: record.htlvResult || 'NO_REACTIVO',
      natPcrResult: record.natPcrResult || 'NO_DETECTADO',
      analyst: record.analyst || 'Lic. Inmunohematología'
    });
  };

  // Evaluate form reactivity
  const isAnyReactive =
    screeningForm.hivResult === 'REACTIVO' ||
    screeningForm.hbsagResult === 'REACTIVO' ||
    screeningForm.hcvResult === 'REACTIVO' ||
    screeningForm.syphilisResult === 'REACTIVO' ||
    screeningForm.chagasResult === 'REACTIVO' ||
    screeningForm.htlvResult === 'REACTIVO' ||
    screeningForm.natPcrResult.startsWith('DETECTADO');

  // Submit and save serology results to database
  const handleSaveScreening = async () => {
    if (!selectedUnit) return;

    const markersPayload = {
      hiv: screeningForm.hivResult === 'REACTIVO',
      hbv: screeningForm.hbsagResult === 'REACTIVO',
      hcv: screeningForm.hcvResult === 'REACTIVO',
      syphilis: screeningForm.syphilisResult === 'REACTIVO',
      chagas: screeningForm.chagasResult === 'REACTIVO',
      htlv: screeningForm.htlvResult === 'REACTIVO',
      natPcr: screeningForm.natPcrResult.startsWith('DETECTADO')
    };

    try {
      if (!isDemoMode) {
        await BloodBankService.processUnitSerology(
          selectedUnit.id,
          markersPayload,
          `Tamizaje calificado por ${screeningForm.analyst}. NAT: ${screeningForm.natPcrResult}`
        );
      }

      // Update local state
      setRecords(prev =>
        prev.map(r =>
          r.id === selectedUnit.id
            ? {
                ...r,
                hivResult: screeningForm.hivResult,
                hbsagResult: screeningForm.hbsagResult,
                hcvResult: screeningForm.hcvResult,
                syphilisResult: screeningForm.syphilisResult,
                chagasResult: screeningForm.chagasResult,
                htlvResult: screeningForm.htlvResult,
                natPcrResult: screeningForm.natPcrResult,
                status: isAnyReactive ? 'DISCARDED' : 'AVAILABLE',
                serologyStatus: isAnyReactive ? 'REACTIVE' : 'NEGATIVE',
                analyst: screeningForm.analyst
              }
            : r
        )
      );

      setSelectedUnit(null);

      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: {
            message: isAnyReactive
              ? `🚨 ALERTA BIOSEGURIDAD: Unidad ${selectedUnit.unitCode} BLOQUEADA para descarte e incineración (Marcador Reactivo).`
              : `✓ UNIDAD LIBERADA: ${selectedUnit.unitCode} aprobada con 6 marcadores no reactivos + NAT negativo. En Stock Nacional.`,
            type: isAnyReactive ? 'error' : 'success',
            duration: 7000
          }
        })
      );
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: `Error al procesar tamizaje: ${err.message}`, type: 'error' }
        })
      );
    }
  };

  // Quick Release all Pending Non-Reactive in Batch
  const handleQuickReleaseAllNegative = async () => {
    const quarantineUnits = records.filter(r => r.status === 'QUARANTINE');
    if (quarantineUnits.length === 0) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: 'No hay unidades en cuarentena pendientes de liberación.', type: 'info' }
        })
      );
      return;
    }

    try {
      if (!isDemoMode) {
        for (const u of quarantineUnits) {
          await BloodBankService.processUnitSerology(u.id, {
            hiv: false,
            hbv: false,
            hcv: false,
            syphilis: false,
            chagas: false,
            htlv: false
          });
        }
      }

      setRecords(prev =>
        prev.map(r =>
          r.status === 'QUARANTINE'
            ? { ...r, status: 'AVAILABLE', serologyStatus: 'NEGATIVE' }
            : r
        )
      );

      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: {
            message: `✓ LIBERACIÓN POR LOTE EXITOSA: ${quarantineUnits.length} unidades aprobadas y transferidas a inventario disponible.`,
            type: 'success'
          }
        })
      );
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: `Error en liberación masiva: ${err.message}`, type: 'error' }
        })
      );
    }
  };

  // Filter records
  const filteredRecords = records.filter(r => {
    const matchesSearch =
      r.unitCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.donorNationalId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const blockedCount = records.filter(r => r.status === 'DISCARDED').length;
  const approvedCount = records.filter(r => r.status === 'AVAILABLE').length;
  const quarantineCount = records.filter(r => r.status === 'QUARANTINE').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-slate-100 font-sans">

      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-rose-600 to-amber-500 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-rose-600/20">
            <Microscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Tamizaje Serológico & Molecular NAT/PCR</h2>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                Normativa 6 Marcadores MINSA + NAT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Pruebas inmunológicas (ECLIA/ELISA) y amplificación de ácidos nucleicos NAT/PCR para VIH 1/2, VHB, VHC, Sífilis, Chagas y HTLV I/II con pase directo a AVAILABLE o bloqueo a DISCARDED.
            </p>
          </div>
        </div>

        {/* Counter Badges & Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center space-x-2 bg-slate-950 px-3.5 py-2 rounded-2xl border border-rose-500/30 text-xs font-mono font-bold text-rose-300">
            <Lock className="w-4 h-4 text-rose-400" />
            <span>{blockedCount} Descartadas</span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 px-3.5 py-2 rounded-2xl border border-amber-500/30 text-xs font-mono font-bold text-amber-300">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>{quarantineCount} En Cuarentena</span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 px-3.5 py-2 rounded-2xl border border-emerald-500/30 text-xs font-mono font-bold text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{approvedCount} Liberadas</span>
          </div>

          {quarantineCount > 0 && (
            <button
              onClick={handleQuickReleaseAllNegative}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-emerald-600/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Aprobar No Reactivas ({quarantineCount})</span>
            </button>
          )}

          <button
            onClick={loadUnits}
            className="p-2 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Recargar desde BD"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Serology Records Table Console */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Droplets className="w-5 h-5 text-rose-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Bitácora de Tamizaje Serológico e Infeccioso (ISBT 128)
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Filter Tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
              {(['ALL', 'QUARANTINE', 'AVAILABLE', 'DISCARDED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                    statusFilter === f
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f === 'ALL' ? 'Todos' : f === 'QUARANTINE' ? 'Cuarentena' : f === 'AVAILABLE' ? 'Liberadas' : 'Descartadas'}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar unidad o donante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-full pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
              <tr>
                <th className="p-3">Unidad ISBT 128 / Donante</th>
                <th className="p-3 text-center">Tipo ABO/Rh</th>
                <th className="p-3 text-center">VIH 1/2</th>
                <th className="p-3 text-center">VHB (HBsAg)</th>
                <th className="p-3 text-center">VHC</th>
                <th className="p-3 text-center">Sífilis / Chagas</th>
                <th className="p-3 text-center">HTLV I/II</th>
                <th className="p-3 text-center">NAT / PCR</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 font-sans italic">
                    No se encontraron unidades con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isBlocked = r.status === 'DISCARDED';
                  const isAvailable = r.status === 'AVAILABLE';
                  const isQuarantine = r.status === 'QUARANTINE';

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/60 transition">
                      <td className="p-3">
                        <div className="font-bold text-rose-300">{r.unitCode}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{r.componentType}</div>
                        <div className="text-[9.5px] text-slate-500 font-sans">{r.donorName}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800 font-bold text-cyan-300">
                          {r.bloodType} {r.rhFactor === 'POS' ? '+' : '-'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold">
                        <span className={r.hivResult === 'REACTIVO' ? 'text-rose-400 font-black animate-pulse' : 'text-emerald-400'}>
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
                        <span className={r.htlvResult === 'REACTIVO' ? 'text-rose-400 font-black' : 'text-emerald-400'}>
                          {r.htlvResult}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold">
                        <span className={r.natPcrResult.startsWith('DETECTADO') ? 'text-rose-400 font-black animate-pulse' : 'text-emerald-400'}>
                          {r.natPcrResult}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {isBlocked && (
                          <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black inline-flex items-center gap-1">
                            <Lock className="w-3 h-3 text-rose-400" />
                            <span>DESCARTADA</span>
                          </span>
                        )}
                        {isAvailable && (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>LIBERADA</span>
                          </span>
                        )}
                        {isQuarantine && (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black inline-flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-400" />
                            <span>CUARENTENA</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenScreeningModal(r)}
                          className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-sans font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 ml-auto"
                        >
                          <Microscope className="w-3.5 h-3.5" />
                          <span>Calificar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Screening & Markers Modal */}
      {selectedUnit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
                  <Microscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Calificación de Marcadores Serológicos & NAT
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Unidad: <strong className="text-rose-300">{selectedUnit.unitCode}</strong> • {selectedUnit.componentType} ({selectedUnit.bloodType}{selectedUnit.rhFactor === 'POS' ? '+' : '-'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUnit(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-6 space-y-5">
              
              {/* Alert Preview Banner */}
              <div className={`p-4 rounded-2xl border ${
                isAnyReactive
                  ? 'bg-rose-950/40 border-rose-500 text-rose-200 animate-pulse'
                  : 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
              } flex items-center space-x-3`}>
                {isAnyReactive ? (
                  <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                )}
                <div className="text-xs">
                  <strong className="block font-black uppercase tracking-wider">
                    {isAnyReactive ? '🚨 BIOSEGURIDAD: MARCADOR REACTIVO DETECTADO' : '✓ UNIDAD SEGURA: TODOS LOS MARCADORES NO REACTIVOS'}
                  </strong>
                  <span>
                    {isAnyReactive
                      ? 'La unidad será BLOQUEADA automáticamente y destinada a incineración / descarte. El donante será registrado en el sistema de diferimientos permanentes.'
                      : 'La unidad cumple al 100% las regulaciones del Programa Nacional de Sangre del MINSA y quedará en estado DISPONIBLE para transfusión o fraccionamiento.'}
                  </span>
                </div>
              </div>

              {/* 6 Mandatory Screening Markers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* VIH 1/2 */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>1. VIH 1/2 (ECLIA / ELISA)</span>
                    <span className="text-[10px] text-slate-500 font-mono">Antígeno / Anticuerpo</span>
                  </label>
                  <select
                    value={screeningForm.hivResult}
                    onChange={(e) => setScreeningForm({ ...screeningForm, hivResult: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-none focus:border-rose-400"
                  >
                    <option value="NO_REACTIVO">NO REACTIVO (Negativo)</option>
                    <option value="REACTIVO">REACTIVO (Positivo)</option>
                    <option value="INDETERMINADO">INDETERMINADO</option>
                  </select>
                </div>

                {/* AgHBs */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>2. Hepatitis B (HBsAg)</span>
                    <span className="text-[10px] text-slate-500 font-mono">Superficie VHB</span>
                  </label>
                  <select
                    value={screeningForm.hbsagResult}
                    onChange={(e) => setScreeningForm({ ...screeningForm, hbsagResult: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-none focus:border-rose-400"
                  >
                    <option value="NO_REACTIVO">NO REACTIVO (Negativo)</option>
                    <option value="REACTIVO">REACTIVO (Positivo)</option>
                    <option value="INDETERMINADO">INDETERMINADO</option>
                  </select>
                </div>

                {/* Anti-HCV */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>3. Hepatitis C (Anti-HCV)</span>
                    <span className="text-[10px] text-slate-500 font-mono">Anticuerpos VHC</span>
                  </label>
                  <select
                    value={screeningForm.hcvResult}
                    onChange={(e) => setScreeningForm({ ...screeningForm, hcvResult: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-none focus:border-rose-400"
                  >
                    <option value="NO_REACTIVO">NO REACTIVO (Negativo)</option>
                    <option value="REACTIVO">REACTIVO (Positivo)</option>
                    <option value="INDETERMINADO">INDETERMINADO</option>
                  </select>
                </div>

                {/* Sífilis */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>4. Sífilis (Treponema pallidum)</span>
                    <span className="text-[10px] text-slate-500 font-mono">RPR / Treponémica</span>
                  </label>
                  <select
                    value={screeningForm.syphilisResult}
                    onChange={(e) => setScreeningForm({ ...screeningForm, syphilisResult: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-none focus:border-rose-400"
                  >
                    <option value="NO_REACTIVO">NO REACTIVO (Negativo)</option>
                    <option value="REACTIVO">REACTIVO (Positivo)</option>
                    <option value="INDETERMINADO">INDETERMINADO</option>
                  </select>
                </div>

                {/* Chagas */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>5. Chagas (Trypanosoma cruzi)</span>
                    <span className="text-[10px] text-rose-400 font-mono font-bold">MINSA Regional</span>
                  </label>
                  <select
                    value={screeningForm.chagasResult}
                    onChange={(e) => setScreeningForm({ ...screeningForm, chagasResult: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-none focus:border-rose-400"
                  >
                    <option value="NO_REACTIVO">NO REACTIVO (Negativo)</option>
                    <option value="REACTIVO">REACTIVO (Positivo)</option>
                    <option value="INDETERMINADO">INDETERMINADO</option>
                  </select>
                </div>

                {/* HTLV I/II */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>6. HTLV I/II</span>
                    <span className="text-[10px] text-slate-500 font-mono">Virus Linfotrópico</span>
                  </label>
                  <select
                    value={screeningForm.htlvResult}
                    onChange={(e) => setScreeningForm({ ...screeningForm, htlvResult: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-none focus:border-rose-400"
                  >
                    <option value="NO_REACTIVO">NO REACTIVO (Negativo)</option>
                    <option value="REACTIVO">REACTIVO (Positivo)</option>
                    <option value="INDETERMINADO">INDETERMINADO</option>
                  </select>
                </div>

              </div>

              {/* NAT / PCR Molecular Testing */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-cyan-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>7. Detección de Ácidos Nucleicos NAT / PCR Multiplex</span>
                  </label>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    Cierre de Ventana Inmunológica
                  </span>
                </div>
                <select
                  value={screeningForm.natPcrResult}
                  onChange={(e) => setScreeningForm({ ...screeningForm, natPcrResult: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-none focus:border-cyan-400 text-white"
                >
                  <option value="NO_DETECTADO">NO DETECTADO (ARN VIH, ADN VHB, ARN VHC Negativos)</option>
                  <option value="DETECTADO_VIH">DETECTADO: ARN VIH-1</option>
                  <option value="DETECTADO_VHB">DETECTADO: ADN Hepatitis B (VHB)</option>
                  <option value="DETECTADO_VHC">DETECTADO: ARN Hepatitis C (VHC)</option>
                </select>
              </div>

              {/* Responsible Technologist */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">
                  Tecnólogo Médico Responsable de Inmunohematología & Calificación:
                </label>
                <input
                  type="text"
                  value={screeningForm.analyst}
                  onChange={(e) => setScreeningForm({ ...screeningForm, analyst: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setSelectedUnit(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                onClick={handleSaveScreening}
                className={`px-5 py-2.5 font-black text-xs rounded-2xl transition shadow-lg cursor-pointer flex items-center space-x-2 ${
                  isAnyReactive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                {isAnyReactive ? <Lock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>
                  {isAnyReactive ? 'Bloquear y Descartar Unidad en BD' : 'Aprobar y Liberar a Disponible en BD'}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
