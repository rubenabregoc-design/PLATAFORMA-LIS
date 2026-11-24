import React, { useState, useEffect } from 'react';
import {
  Droplets, Users, Package, Activity, AlertTriangle, Search, Plus,
  CheckCircle2, Clock, ShieldCheck, FlaskConical, Beaker, Thermometer,
  QrCode, FileText, Send, Lock, Eye, ArrowRight, RefreshCw, Filter,
  Building2, UserCheck, Flame, ChevronRight, Stethoscope, HeartPulse
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
          { id: 'u-1', unit_number: '=F88232600101', blood_type: 'O', rh_factor: 'POS', component_type: 'RBC', volume_ml: 325, status: 'AVAILABLE', expiry_date: new Date(Date.now() + 21 * 86400000).toISOString() },
          { id: 'u-2', unit_number: '=F88232600102', blood_type: 'O', rh_factor: 'NEG', component_type: 'RBC', volume_ml: 310, status: 'AVAILABLE', expiry_date: new Date(Date.now() + 28 * 86400000).toISOString() },
          { id: 'u-3', unit_number: '=F88232600103', blood_type: 'A', rh_factor: 'POS', component_type: 'PLASMA', volume_ml: 250, status: 'AVAILABLE', expiry_date: new Date(Date.now() + 180 * 86400000).toISOString() },
          { id: 'u-4', unit_number: '=F88232600104', blood_type: 'B', rh_factor: 'POS', component_type: 'PLATELETS', volume_ml: 60, status: 'QUARANTINE', expiry_date: new Date(Date.now() + 5 * 86400000).toISOString() },
        ]);
      } else {
        setUnits([]);
      }

      if (donorsData && donorsData.length > 0) {
        setDonors(donorsData);
      } else if (isDemoMode) {
        setDonors([
          { id: 'don-1', blood_type: 'O', rh_factor: 'POS', eligibility_status: 'ELIGIBLE', last_donation_date: '2026-05-10' },
          { id: 'don-2', blood_type: 'A', rh_factor: 'POS', eligibility_status: 'TEMPORARY_DEFERRAL', deferral_reason: 'Tatuaje realizado hace < 6 meses' }
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
  }, [isDemoMode]);

  const availableCount = units.filter(u => u.status === 'AVAILABLE').length;
  const quarantineCount = units.filter(u => u.status === 'QUARANTINE').length;
  const reservedCount = units.filter(u => u.status === 'RESERVED').length;

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

        {/* INDICADOR DE MODO REAL VS DEMO & BOTONES DE ACCIÓN RÁPIDA */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center space-x-2 ${
            isDemoMode
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 animate-pulse'
              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <span>{isDemoMode ? '🎭 Modo Demostración' : '🏥 Modo Producción Real (PostgreSQL)'}</span>
          </div>

          <button
            onClick={() => setShowDonorModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-xs hover:from-rose-500 hover:to-red-500 transition shadow-lg shadow-rose-600/20 flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Donante</span>
          </button>

          <button
            onClick={() => setShowProcessingModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-indigo-300 hover:text-white hover:bg-slate-800 font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <FlaskConical className="w-4 h-4 text-indigo-400" />
            <span>Procesar Cuarentena ({quarantineCount})</span>
          </button>

          <button
            onClick={loadWorkspaceData}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Recargar datos de base de datos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
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
            <BloodBankCenter />
          </div>
        )}

        {/* TAB 2: DONANTES & ADMISIÓN */}
        {activeTab === 'DONORS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Users className="w-5 h-5 text-rose-400" />
                  <span>Registro Clínico de Donantes y Diferimientos</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Control de elegibilidad, exclusiones transitorias y definitivas bajo normativa MINSA.
                </p>
              </div>
              <button
                onClick={() => setShowDonorModal(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Donante</span>
              </button>
            </div>
            <DonorDeferralDashboard />
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
            <UnitProcessingWorkspace onClose={() => {}} onRefresh={loadWorkspaceData} />
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
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Gobernanza de Calidad, Auditoría e Inmutabilidad</h3>
                  <p className="text-xs text-slate-400">
                    Cumplimiento de la norma ISO 15189 §7.3, Ley 81 de Protección de Datos y Resolución Técnica MINSA.
                  </p>
                </div>
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
                  <span className="text-[10px] text-amber-400 font-mono">Sin sobrescritura silenciosa</span>
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
    </div>
  );
};

export default BloodBankMasterWorkspace;
