import React, { useState, useEffect } from 'react';
import {
  Droplets, Users, Package, Activity, AlertTriangle, Search, Plus,
  CheckCircle2, Clock, ShieldCheck, FlaskConical, Beaker, Thermometer,
  QrCode, FileText, Send, Lock, Eye, ArrowRight, RefreshCw, Filter,
  Building2, UserCheck, Flame, ChevronRight, Stethoscope, HeartPulse,
  UserX, Calendar, ShieldAlert, X, Award, Sparkles
} from 'lucide-react';
import { useLisStore } from '../../store/useLisStore';
import { SupabaseService } from '../../services/SupabaseService';
import { ISBT128 } from '../../utils/isbt128Generator';

// Subcomponentes especializados ya existentes
import BloodBankCenter from './TechnologistSuite/BloodBankCenter';
import DonorScreeningForm from './TechnologistSuite/DonorScreeningForm';
import DonorDeferralDashboard from './TechnologistSuite/DonorDeferralDashboard';
import ApheresisDonationModule from './TechnologistSuite/ApheresisDonationModule';
import ExtramuralBloodDriveManager from './TechnologistSuite/ExtramuralBloodDriveManager';
import { SerologyNatScreening } from './TechnologistSuite/SerologyNatScreening';
import UnitProcessingWorkspace from './TechnologistSuite/UnitProcessingWorkspace';
import ColdChainMonitor from './TechnologistSuite/ColdChainMonitor';
import CrossmatchWorkflow from './TechnologistSuite/CrossmatchWorkflow';
import { SmartBedsideTransfusion } from './TechnologistSuite/SmartBedsideTransfusion';
import { TransfusionEvolutionManager } from './TechnologistSuite/TransfusionEvolutionManager';
import HemovigilanceAnalytics from './TechnologistSuite/HemovigilanceAnalytics';
import HemovigilanceReportModal from './TechnologistSuite/HemovigilanceReportModal';
import BloodLogisticsManager from './TechnologistSuite/BloodLogisticsManager';
import ISBTLabelPrinter from './TechnologistSuite/ISBTLabelPrinter';
import { DonorDigitalCardModal } from './TechnologistSuite/DonorDigitalCardModal';
import { OfficialBloodBankFormsPDF, OfficialFormType } from './TechnologistSuite/OfficialBloodBankFormsPDF';
import { BloodBankAuditLogsModal } from './TechnologistSuite/BloodBankAuditLogsModal';

export type BloodBankTab =
  | 'DASHBOARD'
  | 'DONORS'
  | 'COLLECTIONS'
  | 'LAB_SEROLOGY'
  | 'PROCESSING'
  | 'INVENTORY'
  | 'CROSSMATCH'
  | 'TRANSFUSION'
  | 'EVOLUTION'
  | 'HEMOVIGILANCE'
  | 'LOGISTICS'
  | 'AUDIT_QUALITY';

interface BloodBankMasterWorkspaceProps {
  initialTab?: BloodBankTab;
}

export const BloodBankMasterWorkspace: React.FC<BloodBankMasterWorkspaceProps> = ({
  initialTab = 'DASHBOARD'
}) => {
  const { isDemoMode, setDemoMode, currentUser } = useLisStore();
  const [activeTab, setActiveTab] = useState<BloodBankTab>(initialTab);

  // Modales secundarios de acción directa
  const [showDonorModal, setShowDonorModal] = useState<boolean>(false);
  const [showHemovigilanceModal, setShowHemovigilanceModal] = useState<boolean>(false);
  const [showProcessingModal, setShowProcessingModal] = useState<boolean>(false);
  const [showLabelPrinterModal, setShowLabelPrinterModal] = useState<boolean>(false);
  const [selectedUnitForLabel, setSelectedUnitForLabel] = useState<any>(null);
  const [showDigitalCardModal, setShowDigitalCardModal] = useState<boolean>(false);
  const [selectedDonorForCard, setSelectedDonorForCard] = useState<any>(null);
  const [showOfficialFormsModal, setShowOfficialFormsModal] = useState<boolean>(false);
  const [activeOfficialForm, setActiveOfficialForm] = useState<OfficialFormType>('F-TRANS-02');
  const [showAuditLogsModal, setShowAuditLogsModal] = useState<boolean>(false);

  // Estados de pestaña DONANTES
  const [donorSubView, setDonorSubView] = useState<'DIRECTORY' | 'DEFERRALS'>('DIRECTORY');
  const [donorSearchQuery, setDonorSearchQuery] = useState<string>('');
  const [donorStatusFilter, setDonorStatusFilter] = useState<'ALL' | 'ELIGIBLE' | 'TEMPORARY_DEFERRAL' | 'PERMANENT_DEFERRAL'>('ALL');
  const [donorBloodTypeFilter, setDonorBloodTypeFilter] = useState<string>('ALL');
  const [deferralBlockedDonor, setDeferralBlockedDonor] = useState<any>(null);

  // Estados de datos reales
  const [units, setUnits] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cargar datos reales o modo demostración según configuración
  const loadWorkspaceData = async () => {
    setIsLoading(true);
    try {
      const [unitsData, donorsData, requestsData] = await Promise.all([
        SupabaseService.bloodBank.getAllUnits(),
        SupabaseService.bloodBank.getDonors(),
        SupabaseService.bloodBank.getPendingRequests()
      ]);

      if (unitsData && unitsData.length > 0) {
        setUnits(unitsData);
      } else if (isDemoMode) {
        // En Modo Demo comercial, inyectar dataset inicial
        setUnits([
          { id: 'u-1', unit_number: '=F88232600101', donor_id: 'DON-PA-2026-8841', blood_type: 'O', rh_factor: 'POS', component_type: 'RBC', volume_ml: 325, status: 'AVAILABLE', expiry_date: new Date(Date.now() + 21 * 86400000).toISOString() },
          { id: 'u-2', unit_number: '=F88232600102', donor_id: 'DON-PA-2026-8843', blood_type: 'O', rh_factor: 'NEG', component_type: 'RBC', volume_ml: 310, status: 'AVAILABLE', expiry_date: new Date(Date.now() + 28 * 86400000).toISOString() },
          { id: 'u-3', unit_number: '=F88232600103', donor_id: 'DON-PA-2026-8841', blood_type: 'A', rh_factor: 'POS', component_type: 'PLASMA', volume_ml: 250, status: 'AVAILABLE', expiry_date: new Date(Date.now() + 180 * 86400000).toISOString() },
          { id: 'u-4', unit_number: '=F88232600104', donor_id: 'DON-PA-2026-8845', blood_type: 'B', rh_factor: 'POS', component_type: 'PLATELETS', volume_ml: 60, status: 'QUARANTINE', expiry_date: new Date(Date.now() + 5 * 86400000).toISOString() },
        ]);
      } else {
        setUnits([]);
      }

      if (donorsData && donorsData.length > 0) {
        setDonors(donorsData);
      } else if (isDemoMode) {
        // En Modo Demo comercial, dataset sintético de donantes con datos clínicos MINSA
        setDonors([
          {
            id: 'DON-PA-2026-8841',
            blood_type: 'O',
            rh_factor: 'POS',
            phenotype: 'C+ c+ E- e+ K- (Kell Neg)',
            eligibility_status: 'ELIGIBLE',
            last_donation_date: '2026-05-10',
            total_donations: 6,
            created_at: '2026-01-15T08:00:00Z',
            patients: {
              first_name: 'Roberto Carlos',
              last_name: 'Mendoza Samudio',
              national_id: '8-765-4321',
              gender: 'M',
              phone: '+507 6234-5678',
              email: 'roberto.mendoza@email.pa'
            }
          },
          {
            id: 'DON-PA-2026-8842',
            blood_type: 'A',
            rh_factor: 'POS',
            phenotype: 'D+ C+ c- E- e+ K-',
            eligibility_status: 'TEMPORARY_DEFERRAL',
            deferral_reason: 'Tatuaje / Piercing realizado hace < 6 meses (Resolución Técnica MINSA)',
            last_donation_date: '2025-11-20',
            total_donations: 2,
            created_at: '2026-02-10T10:30:00Z',
            patients: {
              first_name: 'Ana Patricia',
              last_name: 'Gómez Vergara',
              national_id: '4-789-1234',
              gender: 'F',
              phone: '+507 6890-1122',
              email: 'ana.gomez@email.pa'
            }
          },
          {
            id: 'DON-PA-2026-8843',
            blood_type: 'O',
            rh_factor: 'NEG',
            phenotype: 'D- C- c+ E- e+ K- (Donante Universal O-)',
            eligibility_status: 'ELIGIBLE',
            last_donation_date: '2026-04-18',
            total_donations: 11,
            created_at: '2026-03-05T09:15:00Z',
            patients: {
              first_name: 'Demetrio',
              last_name: 'Santander Batista',
              national_id: '9-712-456',
              gender: 'M',
              phone: '+507 6555-8901',
              email: 'demetrio.santander@email.pa'
            }
          },
          {
            id: 'DON-PA-2026-8844',
            blood_type: 'B',
            rh_factor: 'POS',
            phenotype: 'D+ C- c+ E+ e+ K-',
            eligibility_status: 'PERMANENT_DEFERRAL',
            deferral_reason: 'Confirmación reactiva de anticuerpos Anti-HCV por técnica de Quimioluminiscencia',
            last_donation_date: '2025-08-14',
            total_donations: 1,
            created_at: '2025-08-14T11:00:00Z',
            patients: {
              first_name: 'Carlos Alberto',
              last_name: 'Castillo Pineda',
              national_id: '8-802-998',
              gender: 'M',
              phone: '+507 6123-9900',
              email: 'carlos.castillo@email.pa'
            }
          },
          {
            id: 'DON-PA-2026-8845',
            blood_type: 'AB',
            rh_factor: 'POS',
            phenotype: 'D+ C+ c+ E+ e+ K-',
            eligibility_status: 'ELIGIBLE',
            last_donation_date: '2026-03-01',
            total_donations: 4,
            created_at: '2026-02-28T14:20:00Z',
            patients: {
              first_name: 'Yaritza Elena',
              last_name: 'Navarro Morales',
              national_id: '3-740-1982',
              gender: 'F',
              phone: '+507 6444-2311',
              email: 'yaritza.navarro@email.pa'
            }
          }
        ]);
      } else {
        setDonors([]);
      }

      if (requestsData && requestsData.length > 0) {
        setPendingRequests(requestsData);
      } else if (isDemoMode) {
        setPendingRequests([
          { id: 'req-1', component_requested: 'RED_CELLS', urgency: 'URGENT', status: 'PENDING', patients: { first_name: 'Fernando', last_name: 'Ábrego', national_id: '8-745-1922' } }
        ]);
      } else {
        setPendingRequests([]);
      }
    } catch (err) {
      console.error('Error cargando datos de banco de sangre:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
    const interval = setInterval(() => {
      loadWorkspaceData();
    }, 10000);
    return () => clearInterval(interval);
  }, [isDemoMode]);

  const availableCount = units.filter(u => u.status === 'AVAILABLE').length;
  const quarantineCount = units.filter(u => u.status === 'QUARANTINE').length;
  const reservedCount = units.filter(u => u.status === 'RESERVED').length;

  // Métricas y filtrado de Donantes
  const totalDonorsCount = donors.length;
  const eligibleDonorsCount = donors.filter(d => d.eligibility_status === 'ELIGIBLE').length;
  const tempDeferralCount = donors.filter(d => d.eligibility_status === 'TEMPORARY_DEFERRAL').length;
  const permDeferralCount = donors.filter(d => d.eligibility_status === 'PERMANENT_DEFERRAL').length;

  const filteredDonors = donors.filter(donor => {
    if (donorSearchQuery.trim()) {
      const q = donorSearchQuery.toLowerCase().trim();
      const firstName = donor.patients?.first_name?.toLowerCase() || '';
      const lastName = donor.patients?.last_name?.toLowerCase() || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const nationalId = (donor.patients?.national_id || donor.national_id || '').toLowerCase();
      const donorId = (donor.id || '').toLowerCase();
      if (!fullName.includes(q) && !nationalId.includes(q) && !donorId.includes(q)) {
        return false;
      }
    }

    if (donorStatusFilter !== 'ALL' && donor.eligibility_status !== donorStatusFilter) {
      return false;
    }

    if (donorBloodTypeFilter !== 'ALL') {
      const combined = `${donor.blood_type || ''}_${donor.rh_factor || ''}`.toUpperCase();
      if (combined !== donorBloodTypeFilter) {
        return false;
      }
    }

    return true;
  });

  const getDonationIntervalInfo = (lastDonationDate: string | null) => {
    if (!lastDonationDate) {
      return { days: null, canDonate: true, message: 'Sin donación previa (Apto)' };
    }
    const last = new Date(lastDonationDate).getTime();
    if (isNaN(last)) return { days: null, canDonate: true, message: 'Fecha no registrada' };
    const diffDays = Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
    const minDays = 56; // 8 semanas estándar MINSA para sangre total
    if (diffDays >= minDays) {
      return {
        days: diffDays,
        canDonate: true,
        message: `Intervalo cumplido (${diffDays}d)`
      };
    } else {
      const remaining = minDays - diffDays;
      return {
        days: diffDays,
        canDonate: false,
        message: `Faltan ${remaining}d (${diffDays}d transcurridos)`
      };
    }
  };

  return (
    <div className="bg-[#020617] min-h-screen text-slate-100 p-4 sm:p-6 space-y-6">

      {/* CABECERA SUPERIOR & IDENTIDAD DEL MÓDULO */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-rose-600 to-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-600/30 shrink-0">
            <Droplets className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Consola Maestra de Banco de Sangre & Medicina Transfusional
              </h1>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                ISBT 128 • MINSA / CSS Panamá
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ciclo integral de trazabilidad vena a vena: Captación, Fraccionamiento, Cruces serológicos/e-Crossmatch, Cadena de Frío y Hemovigilancia hospitalaria.
            </p>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN RÁPIDA */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setShowDonorModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-xs hover:from-rose-500 hover:to-red-500 transition shadow-lg shadow-rose-600/20 flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Donante</span>
          </button>

          <button
            onClick={() => {
              setActiveOfficialForm('F-TRANS-02');
              setShowOfficialFormsModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-rose-500/40 text-rose-300 hover:text-white hover:bg-slate-800 font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <span>Formatos MINSA (PDF)</span>
          </button>

          <button
            onClick={() => setShowProcessingModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-indigo-300 hover:text-white hover:bg-slate-800 font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <FlaskConical className="w-4 h-4 text-indigo-400" />
            <span>Procesar Cuarentena ({quarantineCount})</span>
          </button>
        </div>
      </div>

      {/* BARRA DE NAVEGACIÓN MAESTRA DE PROCESOS (32 SECCIONES AGRUPADAS) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
        {[
          { id: 'DASHBOARD', label: '1. Centro de Mando', icon: Activity, badge: `${availableCount} Disp` },
          { id: 'DONORS', label: '2. Donantes & Admisión', icon: Users, badge: `${donors.length}` },
          { id: 'COLLECTIONS', label: '3. Extracciones & Aféresis', icon: Droplets },
          { id: 'LAB_SEROLOGY', label: '4. Tamizaje Serológico / NAT', icon: ShieldCheck },
          { id: 'PROCESSING', label: '5. Fraccionamiento ISBT 128', icon: Beaker, badge: quarantineCount > 0 ? `${quarantineCount} Pend` : undefined },
          { id: 'INVENTORY', label: '6. Inventario & Cadena de Frío', icon: Thermometer },
          { id: 'CROSSMATCH', label: '7. Pruebas Cruzadas & e-Crossmatch', icon: FlaskConical, badge: pendingRequests.length > 0 ? `${pendingRequests.length} Sol` : undefined },
          { id: 'TRANSFUSION', label: '8. Transfusión a Pie de Cama', icon: HeartPulse },
          { id: 'EVOLUTION', label: '9. Evolución Vena a Vena (9 Etapas)', icon: ArrowRight },
          { id: 'HEMOVIGILANCE', label: '10. Hemovigilancia & Reacciones', icon: AlertTriangle },
          { id: 'LOGISTICS', label: '11. Custodia & Valijas Térmicas', icon: Send },
          { id: 'AUDIT_QUALITY', label: '12. Auditoría & Calidad ISO 15189', icon: Lock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as BloodBankTab)}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer border ${
                isActive
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-lg shadow-rose-500/10'
                  : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black ${
                  isActive ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* CONTENIDO DEL PROCESO SELECCIONADO */}
      <div className="bg-slate-950/60 rounded-3xl border border-slate-800/80 p-4 sm:p-6 shadow-xl">
        {/* TAB 1: CENTRO DE MANDO & KPIS */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            <BloodBankCenter onNavigateTab={(tab) => setActiveTab(tab as any)} />
          </div>
        )}

        {/* TAB 2: DONANTES & ADMISIÓN */}
        {activeTab === 'DONORS' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Users className="w-5 h-5 text-rose-400" />
                  <span>Padrón Clínico de Donantes y Admisión Rápida</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Control de elegibilidad, exclusiones transitorias y definitivas bajo normativa MINSA / CSS Panamá.
                </p>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedDonorForCard(null);
                    setShowDigitalCardModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-slate-800 font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow"
                >
                  <QrCode className="w-4 h-4 text-cyan-400" />
                  <span>Carnet Digital QR</span>
                </button>

                <button
                  onClick={() => {
                    setActiveOfficialForm('F-DON-01');
                    setShowOfficialFormsModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-rose-400" />
                  <span>F-DON-01 Consentimiento</span>
                </button>

                <button
                  onClick={() => setShowDonorModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Donante</span>
                </button>
              </div>
            </div>

            {/* SUB-VIEW SWITCHER: DIRECTORIO VS ANÁLISIS DE DIFERIMIENTOS */}
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <button
                onClick={() => setDonorSubView('DIRECTORY')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                  donorSubView === 'DIRECTORY'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Directorio y Admisión Rápida</span>
                <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-white">
                  {totalDonorsCount}
                </span>
              </button>

              <button
                onClick={() => setDonorSubView('DEFERRALS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                  donorSubView === 'DEFERRALS'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <UserX className="w-4 h-4" />
                <span>Análisis de Diferimientos (Gráficos MINSA)</span>
                <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                  {tempDeferralCount + permDeferralCount} Casos
                </span>
              </button>
            </div>

            {donorSubView === 'DIRECTORY' ? (
              <div className="space-y-6">
                {/* 4 KPI METRICS CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
                      <span>Total en Padrón</span>
                      <Users className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-2xl font-black text-white">{totalDonorsCount}</div>
                    <p className="text-[10px] text-slate-500 mt-1">Donantes registrados en base de datos</p>
                  </div>

                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-emerald-400 text-xs mb-1 font-semibold">
                      <span>Aptos / Elegibles</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-emerald-300">{eligibleDonorsCount}</div>
                    <p className="text-[10px] text-emerald-400/70 mt-1">Habilitados para colecta o aféresis</p>
                  </div>

                  <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-amber-400 text-xs mb-1 font-semibold">
                      <span>Diferimiento Temporal</span>
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-amber-300">{tempDeferralCount}</div>
                    <p className="text-[10px] text-amber-400/70 mt-1">Período de ventana o condición transitoria</p>
                  </div>

                  <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-rose-400 text-xs mb-1 font-semibold">
                      <span>Diferimiento Permanente</span>
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-2xl font-black text-rose-300">{permDeferralCount}</div>
                    <p className="text-[10px] text-rose-400/70 mt-1">Exclusión definitiva bajo norma de bioseguridad</p>
                  </div>
                </div>

                {/* FILTROS Y BÚSQUEDA INTERACTIVA */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por cédula (CIP), nombre completo o código DIN..."
                      value={donorSearchQuery}
                      onChange={(e) => setDonorSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    />
                    {donorSearchQuery && (
                      <button
                        onClick={() => setDonorSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                      value={donorStatusFilter}
                      onChange={(e) => setDonorStatusFilter(e.target.value as any)}
                      className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                    >
                      <option value="ALL">Todos los Estados</option>
                      <option value="ELIGIBLE">Aptos / Elegibles</option>
                      <option value="TEMPORARY_DEFERRAL">Diferimiento Temporal</option>
                      <option value="PERMANENT_DEFERRAL">Diferimiento Permanente</option>
                    </select>

                    <select
                      value={donorBloodTypeFilter}
                      onChange={(e) => setDonorBloodTypeFilter(e.target.value)}
                      className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                    >
                      <option value="ALL">Todos los Grupos</option>
                      <option value="O_POS">O Positivo (O+)</option>
                      <option value="O_NEG">O Negativo (O- Universal)</option>
                      <option value="A_POS">A Positivo (A+)</option>
                      <option value="A_NEG">A Negativo (A-)</option>
                      <option value="B_POS">B Positivo (B+)</option>
                      <option value="B_NEG">B Negativo (B-)</option>
                      <option value="AB_POS">AB Positivo (AB+)</option>
                      <option value="AB_NEG">AB Negativo (AB-)</option>
                    </select>

                    {(donorSearchQuery || donorStatusFilter !== 'ALL' || donorBloodTypeFilter !== 'ALL') && (
                      <button
                        onClick={() => {
                          setDonorSearchQuery('');
                          setDonorStatusFilter('ALL');
                          setDonorBloodTypeFilter('ALL');
                        }}
                        className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold whitespace-nowrap transition cursor-pointer"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>

                {/* TABLA DE DONANTES */}
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Donante & Cédula (CIP)</th>
                        <th className="py-3 px-4">Grupo ABO/Rh & Fenotipo</th>
                        <th className="py-3 px-4">Elegibilidad MINSA</th>
                        <th className="py-3 px-4">Última Donación & Intervalo</th>
                        <th className="py-3 px-4">Historial</th>
                        <th className="py-3 px-4 text-right">Acciones Clínicas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredDonors.map((donor) => {
                        const firstName = donor.patients?.first_name || '';
                        const lastName = donor.patients?.last_name || '';
                        const fullName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (donor.full_name || `Donante #${donor.id.slice(0, 8)}`);
                        const nationalId = donor.patients?.national_id || donor.national_id || 'Sin Cédula';
                        const initials = `${firstName.charAt(0) || 'D'}${lastName.charAt(0) || 'N'}`.toUpperCase();
                        const intervalInfo = getDonationIntervalInfo(donor.last_donation_date);
                        const totalDonations = donor.total_donations || (units.filter(u => u.donor_id === donor.id).length || 1);

                        // Blood styling
                        const isONeg = donor.blood_type === 'O' && donor.rh_factor === 'NEG';
                        const isOPos = donor.blood_type === 'O' && donor.rh_factor === 'POS';
                        const isABPos = donor.blood_type === 'AB' && donor.rh_factor === 'POS';

                        return (
                          <tr key={donor.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-rose-950/60 border border-slate-700 flex items-center justify-center font-black text-rose-400 text-xs shrink-0">
                                  {initials}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-sm flex items-center space-x-1.5">
                                    <span>{fullName}</span>
                                    {donor.patients?.gender && (
                                      <span className="text-[10px] text-slate-500 font-normal">
                                        ({donor.patients.gender === 'M' ? 'Masc.' : 'Fem.'})
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-slate-400">
                                    <span className="font-mono text-cyan-400 font-semibold">{nationalId}</span>
                                    <span className="text-slate-600">•</span>
                                    <span className="font-mono text-slate-500 text-[10px]">{donor.id.slice(0, 14)}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-1.5">
                                  <span className={`px-2 py-0.5 rounded-lg font-black text-xs font-mono ${
                                    isONeg
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-500/20'
                                      : isOPos
                                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                      : isABPos
                                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                  }`}>
                                    {donor.blood_type || 'O'} {donor.rh_factor === 'POS' ? '+' : '-'}
                                  </span>
                                  {isONeg && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                                      Universal
                                    </span>
                                  )}
                                  {isABPos && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                                      Receptor Univ.
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {donor.phenotype || 'D+ C+ c+ E- e+ K-'}
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {donor.eligibility_status === 'ELIGIBLE' && (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    <span>APTO / ELEGIBLE</span>
                                  </span>
                                  <div className="text-[10px] text-slate-500">Conforme norma MINSA</div>
                                </div>
                              )}
                              {donor.eligibility_status === 'TEMPORARY_DEFERRAL' && (
                                <div className="space-y-0.5 max-w-xs">
                                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold text-[10px]">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    <span>DIFERIDO TEMPORAL</span>
                                  </span>
                                  <p className="text-[10px] text-amber-300/80 leading-tight">
                                    {donor.deferral_reason || 'Período de ventana en curso'}
                                  </p>
                                </div>
                              )}
                              {donor.eligibility_status === 'PERMANENT_DEFERRAL' && (
                                <div className="space-y-0.5 max-w-xs">
                                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold text-[10px]">
                                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                                    <span>DIFERIDO PERMANENTE</span>
                                  </span>
                                  <p className="text-[10px] text-rose-300/80 leading-tight">
                                    {donor.deferral_reason || 'Criterio de exclusión definitiva'}
                                  </p>
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <div className="text-xs font-mono font-bold text-slate-300">
                                  {donor.last_donation_date ? new Date(donor.last_donation_date).toLocaleDateString('es-PA') : 'Ninguna registrada'}
                                </div>
                                <div className={`text-[10px] font-medium ${
                                  intervalInfo.canDonate ? 'text-emerald-400' : 'text-amber-400'
                                }`}>
                                  {intervalInfo.message}
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <div className="font-bold text-white text-xs">
                                  {totalDonations} {totalDonations === 1 ? 'donación' : 'donaciones'}
                                </div>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  totalDonations >= 5
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : totalDonations >= 2
                                    ? 'bg-slate-700 text-slate-200'
                                    : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {totalDonations >= 5 ? '⭐ Donante Frecuente' : totalDonations >= 2 ? 'Donante Recurrente' : 'Primera Donación'}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedDonorForCard({
                                      id: donor.id,
                                      fullName: fullName,
                                      nationalId: nationalId,
                                      bloodType: donor.blood_type || 'O',
                                      rhFactor: donor.rh_factor || 'POS',
                                      phenotype: donor.phenotype || 'D+ C+ c+ E- e+ K-',
                                      gender: (donor.patients?.gender as any) || 'M',
                                      eligibilityStatus: donor.eligibility_status,
                                      deferralReason: donor.deferral_reason,
                                      lastDonationDate: donor.last_donation_date,
                                      totalDonations: totalDonations,
                                      institution: 'Banco de Sangre LIS • MINSA Panamá'
                                    });
                                    setShowDigitalCardModal(true);
                                  }}
                                  title="Ver Carnet Digital QR"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition cursor-pointer"
                                >
                                  <QrCode className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveOfficialForm('F-DON-01');
                                    setShowOfficialFormsModal(true);
                                  }}
                                  title="F-DON-01 Consentimiento Informado"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                                >
                                  <FileText className="w-4 h-4 text-rose-400" />
                                </button>

                                <button
                                  onClick={() => {
                                    if (donor.eligibility_status !== 'ELIGIBLE') {
                                      setDeferralBlockedDonor({
                                        donor,
                                        fullName,
                                        nationalId
                                      });
                                    } else {
                                      setShowDonorModal(true);
                                    }
                                  }}
                                  title={donor.eligibility_status === 'ELIGIBLE' ? 'Iniciar Nueva Extracción' : 'Bloqueado por Diferimiento'}
                                  className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition flex items-center space-x-1 cursor-pointer ${
                                    donor.eligibility_status === 'ELIGIBLE'
                                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30'
                                      : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-rose-950/40 hover:text-rose-300'
                                  }`}
                                >
                                  <Droplets className="w-3.5 h-3.5" />
                                  <span>{donor.eligibility_status === 'ELIGIBLE' ? 'Extraer' : 'Bloqueado'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredDonors.length === 0 && donors.length > 0 && (
                    <div className="p-8 text-center space-y-3">
                      <Search className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-sm font-semibold text-slate-400">
                        No se encontraron donantes que coincidan con los criterios de búsqueda.
                      </p>
                      <button
                        onClick={() => {
                          setDonorSearchQuery('');
                          setDonorStatusFilter('ALL');
                          setDonorBloodTypeFilter('ALL');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-xs text-rose-400 font-bold hover:bg-slate-700 transition cursor-pointer"
                      >
                        Restablecer Filtros
                      </button>
                    </div>
                  )}

                  {donors.length === 0 && !isLoading && (
                    <div className="p-10 text-center space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-white">No hay donantes registrados en la base de datos</h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          Inicie el registro del primer donante con el cuestionario MINSA o active el Modo Demostración para cargar casos sintéticos de prueba.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => setShowDonorModal(true)}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-rose-600/30"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Registrar Primer Donante</span>
                        </button>
                        {!isDemoMode && (
                          <button
                            onClick={() => setDemoMode(true)}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs transition cursor-pointer"
                          >
                            Activar Modo Demo
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <DonorDeferralDashboard />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EXTRACCIONES, FLEBOTOMÍA & AFÉRESIS */}
        {activeTab === 'COLLECTIONS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Droplets className="w-5 h-5 text-red-400" />
                  <span>Procedimientos de Colecta, Flebotomía & Aféresis</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Gestión de plaquetoaféresis con monitorización de ACD-A y jornadas extramuros.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ApheresisDonationModule />
              <ExtramuralBloodDriveManager />
            </div>
          </div>
        )}

        {/* TAB 4: TAMIZAJE SEROLÓGICO & NAT */}
        {activeTab === 'LAB_SEROLOGY' && (
          <div className="space-y-6">
            <SerologyNatScreening />
          </div>
        )}

        {/* TAB 5: FRACCIONAMIENTO & DERIVACIÓN ISBT 128 */}
        {activeTab === 'PROCESSING' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Beaker className="w-5 h-5 text-indigo-400" />
                  <span>Área de Fraccionamiento & Derivación de Hemocomponentes</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Separación de Sangre Total a Glóbulos Rojos, Plasma Fresco, Plaquetas y Crioprecipitados con árbol de genealogía ISBT 128.
                </p>
              </div>
              <button
                onClick={() => setShowProcessingModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <FlaskConical className="w-4 h-4" />
                <span>Abrir Mesa de Cuarentena</span>
              </button>
            </div>
            <UnitProcessingWorkspace onClose={() => setActiveTab('DASHBOARD')} onRefresh={loadWorkspaceData} />
          </div>
        )}

        {/* TAB 6: INVENTARIO & CADENA DE FRÍO */}
        {activeTab === 'INVENTORY' && (
          <div className="space-y-6">
            <ColdChainMonitor />
          </div>
        )}

        {/* TAB 7: PRUEBAS CRUZADAS & E-CROSSMATCH */}
        {activeTab === 'CROSSMATCH' && (
          <div className="space-y-6">
            <CrossmatchWorkflow availableUnits={units.filter(u => u.status === 'AVAILABLE')} />
          </div>
        )}

        {/* TAB 8: TRANSFUSIÓN A PIE DE CAMA */}
        {activeTab === 'TRANSFUSION' && (
          <div className="space-y-6">
            <SmartBedsideTransfusion />
          </div>
        )}

        {/* TAB 9: EVOLUCIÓN VENA A VENA (9 ETAPAS) */}
        {activeTab === 'EVOLUTION' && (
          <div className="space-y-6">
            <TransfusionEvolutionManager />
          </div>
        )}

        {/* TAB 10: HEMOVIGILANCIA & REACCIONES */}
        {activeTab === 'HEMOVIGILANCE' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>Comité de Hemovigilancia & Registro de Reacciones Transfusionales</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Notificación obligatoria y reporte clínico MINSA bajo trazabilidad estricta.
                </p>
              </div>
              <button
                onClick={() => setShowHemovigilanceModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Reportar Evento Adverso</span>
              </button>
            </div>
            <HemovigilanceAnalytics />
          </div>
        )}

        {/* TAB 11: CUSTODIA & VALIJAS TÉRMICAS */}
        {activeTab === 'LOGISTICS' && (
          <div className="space-y-6">
            <BloodLogisticsManager />
          </div>
        )}

        {/* TAB 12: AUDITORÍA & CALIDAD ISO 15189 */}
        {activeTab === 'AUDIT_QUALITY' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Gobernanza de Calidad, Auditoría e Inmutabilidad</h3>
                    <p className="text-xs text-slate-400">
                      Cumplimiento estricto de la norma ISO 15189 §7.3, Ley 81 de Protección de Datos y Resolución Técnica MINSA.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAuditLogsModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs transition flex items-center space-x-2 shadow-lg shadow-rose-600/30 cursor-pointer shrink-0"
                >
                  <History className="w-4 h-4" />
                  <span>Ver Pistas de Auditoría Completas</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 font-bold">Unidades Registradas</span>
                  <div className="text-2xl font-black text-white">{units.length}</div>
                  <span className="text-[10px] text-emerald-400 font-mono">100% Trazadas ISBT 128</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 font-bold">Donantes con Ficha</span>
                  <div className="text-2xl font-black text-white">{donors.length}</div>
                  <span className="text-[10px] text-cyan-400 font-mono">Diferimientos Registrados</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 font-bold">Registro de Cambios</span>
                  <div className="text-2xl font-black text-white">Inmutable</div>
                  <span className="text-[10px] text-amber-400 font-mono">Sin sobrescritura silenciosa (Hash SHA-256)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALES FLOTANTES */}
      {showDonorModal && (
        <DonorScreeningForm
          onClose={() => setShowDonorModal(false)}
          onComplete={() => {
            setShowDonorModal(false);
            loadWorkspaceData();
          }}
        />
      )}

      {showProcessingModal && (
        <UnitProcessingWorkspace
          onClose={() => setShowProcessingModal(false)}
          onRefresh={loadWorkspaceData}
        />
      )}

      {showHemovigilanceModal && (
        <HemovigilanceReportModal
          onClose={() => setShowHemovigilanceModal(false)}
          onSuccess={() => {
            setShowHemovigilanceModal(false);
            loadWorkspaceData();
          }}
        />
      )}

      {showLabelPrinterModal && (
        <ISBTLabelPrinter
          unit={selectedUnitForLabel || units[0]}
          onClose={() => setShowLabelPrinterModal(false)}
        />
      )}

      {showDigitalCardModal && (
        <DonorDigitalCardModal
          donor={selectedDonorForCard || (donors.length > 0 ? {
            id: donors[0].id,
            bloodType: donors[0].blood_type,
            rhFactor: donors[0].rh_factor,
            eligibilityStatus: donors[0].eligibility_status,
            lastDonationDate: donors[0].last_donation_date,
            deferralReason: donors[0].deferral_reason
          } : undefined)}
          onClose={() => setShowDigitalCardModal(false)}
        />
      )}

      {showOfficialFormsModal && (
        <OfficialBloodBankFormsPDF
          initialForm={activeOfficialForm}
          onClose={() => setShowOfficialFormsModal(false)}
        />
      )}

      {/* MODAL DE ADVERTENCIA: DONANTE BLOQUEADO POR DIFERIMIENTO */}
      {deferralBlockedDonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">Interlock Clínico Transfusional</h3>
                <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider">
                  Bloqueo de Extracción por Diferimiento Activo
                </span>
              </div>
              <button
                onClick={() => setDeferralBlockedDonor(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-xs text-slate-400">Donante Seleccionado:</div>
                <div className="font-bold text-white text-sm">{deferralBlockedDonor.fullName}</div>
                <div className="text-xs font-mono text-cyan-400">CIP: {deferralBlockedDonor.nationalId}</div>
              </div>

              <div className={`p-4 rounded-2xl border ${
                deferralBlockedDonor.donor.eligibility_status === 'PERMANENT_DEFERRAL'
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
              } space-y-2`}>
                <div className="flex items-center space-x-2 text-xs font-bold">
                  {deferralBlockedDonor.donor.eligibility_status === 'PERMANENT_DEFERRAL' ? (
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400" />
                  )}
                  <span>
                    {deferralBlockedDonor.donor.eligibility_status === 'PERMANENT_DEFERRAL'
                      ? 'Diferimiento Permanente (Exclusión Definitiva)'
                      : 'Diferimiento Temporal (Período de Ventana Activo)'}
                  </span>
                </div>
                <p className="text-xs font-medium leading-relaxed">
                  <strong>Motivo Registrado:</strong>{' '}
                  {deferralBlockedDonor.donor.deferral_reason || 'Condición clínica incompatible con donación.'}
                </p>
                <p className="text-[11px] opacity-80">
                  Conforme a los Manuales Técnicos del Banco de Sangre (MINSA / CSS Panamá), no está permitido realizar flebotomías ni aféresis a donantes con exclusión vigente para proteger la salud del receptor y del donante.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeferralBlockedDonor(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Entendido / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuditLogsModal && (
        <BloodBankAuditLogsModal
          onClose={() => setShowAuditLogsModal(false)}
        />
      )}
    </div>
  );
};

export default BloodBankMasterWorkspace;
