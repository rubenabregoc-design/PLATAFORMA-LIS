import React, { useState } from 'react';
import {
  CheckSquare,
  Activity,
  AlertOctagon,
  Microscope,
  FlaskConical,
  Sparkles,
  LayoutDashboard,
  FileBarChart,
  DollarSign,
  Cpu,
  Briefcase,
  ShoppingBag,
  Box,
  Calendar,
  Flame,
  GraduationCap,
  Leaf,
  ThermometerSnowflake,
  ShieldAlert,
  Zap,
  Server,
  Layers,
  Globe,
  Package,
  Users,
  Fingerprint,
  PieChart,
  FileText,
  MessageSquare,
  ShieldCheck,
  Building2,
  Calculator,
  Cloud,
  BarChart3,
  Map,
  Trash2,
  Truck,
  ClipboardCheck,
  Scale,
  Gauge,
  Droplets,
  UserX,
  Wrench
} from 'lucide-react';
import { AnalyticalValidationWorkstation } from './AnalyticalValidationWorkstation';
import { InternalQualityControlQC } from './InternalQualityControlQC';
import { CriticalPanicManagement } from './CriticalPanicManagement';
import { ReagentsHilPreanalytics } from './ReagentsHilPreanalytics';
import BloodBankCenter from './BloodBankCenter';
import ReagentInventoryManager from './ReagentInventoryManager';
import ExternalQualityControl from './ExternalQualityControl';
import AnalyzerMaintenanceManager from './AnalyzerMaintenanceManager';
import MonthlyQualityManagementReport from './MonthlyQualityManagementReport';
import BillingFinancialCenter from './BillingFinancialCenter';
import MiddlewareDashboard from './MiddlewareDashboard';
import PayrollManager from './PayrollManager';
import SupplierPurchasingManager from './SupplierPurchasingManager';
import FixedAssetsManager from './FixedAssetsManager';
import AppointmentCalendarManager from './AppointmentCalendarManager';
import CalibrationManager from './CalibrationManager';
import SupplierEvaluationManager from './SupplierEvaluationManager';
import BiohazardWasteManager from './BiohazardWasteManager';
import ChemicalWasteManager from './ChemicalWasteManager';
import BiohazardDashboard from './BiohazardDashboard';
import ColdChainMonitor from './ColdChainMonitor';
import StaffCompetencyManager from './StaffCompetencyManager';
import StaffSchedulingManager from './StaffSchedulingManager';
import StaffPunchClock from './StaffPunchClock';
import StaffProfessionalInsuranceManager from './StaffProfessionalInsuranceManager';
import HRAnalyticsDashboard from './HRAnalyticsDashboard';
import QualityDocsManager from './QualityDocsManager';
import PatientFeedbackManager from './PatientFeedbackManager';
import RiskManagementDashboard from './RiskManagementDashboard';
import BranchSalesDashboard from './BranchSalesDashboard';
import TestProfitabilityDashboard from './TestProfitabilityDashboard';
import IntangibleAssetsManager from './IntangibleAssetsManager';
import EliteLabIntelligence from './EliteLabIntelligence';
import EpidemiologyBulletinManager from './EpidemiologyBulletinManager';
import EpiHeatmapDashboard from './EpiHeatmapDashboard';
import EquipmentInsuranceManager from './EquipmentInsuranceManager';
import ISOAuditDashboard from './ISOAuditDashboard';
import IncidentCAPAManager from './IncidentCAPAManager';
import SectionWorkloadDashboard from './SectionWorkloadDashboard';
import OpportunitiesBoard from './OpportunitiesBoard';
import LotStabilityDashboard from './LotStabilityDashboard';
import ITHardwareManager from './ITHardwareManager';
import HISIntegrationConsole from './HISIntegrationConsole';
import MedicalSuppliesManager from './MedicalSuppliesManager';
import ReagentEfficiencyDashboard from './ReagentEfficiencyDashboard';
import ExternalAuditManager from './ExternalAuditManager';
import TestProfileManager from './TestProfileManager';
import ExtramuralBloodDriveManager from './ExtramuralBloodDriveManager';
import DonorDeferralDashboard from './DonorDeferralDashboard';
import BloodLogisticsManager from './BloodLogisticsManager';
import SpecializedLaboratorySections from './SpecializedLaboratorySections';
import FormulaEngineManager from './FormulaEngineManager';

export const TechnologistMasterSuite: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'validation' | 'qc' | 'critical' | 'sections' | 'reagents' | 'bloodbank' | 'blood_drive' | 'donor_deferral' | 'blood_logistics' | 'reagentinv' | 'externalqc' | 'maintenance' | 'calibration' | 'billing' | 'middleware' | 'payroll' | 'purchasing' | 'suppliers' | 'test_profiles' | 'assets' | 'appointments' | 'waste' | 'chemical_waste' | 'waste_stats' | 'reagent_efficiency' | 'coldchain' | 'staff' | 'staff_sched' | 'staff_punch' | 'hr_analytics' | 'docs' | 'feedback' | 'risks' | 'sales' | 'profitability' | 'intangibles' | 'elite_intel' | 'epidemiology' | 'epi_heatmap' | 'equipment_safety' | 'iso_audit' | 'external_audit' | 'formulas' | 'staff_insurance' | 'incidents' | 'workload' | 'opps' | 'ithardware' | 'stability' | 'his' | 'supplies'>('validation');
  const [showQualityReport, setShowQualityReport] = useState(false);

  const tabs = [
    {
      id: 'validation' as const,
      label: 'Validación Analítica & Delta Check',
      shortLabel: '1. Validación & Delta',
      icon: CheckSquare,
      badge: '6 Calc Clínicas'
    },
    {
      id: 'qc' as const,
      label: 'Control de Calidad (QC) & Westgard',
      shortLabel: '2. QC & Westgard',
      icon: Activity,
      badge: 'Levey-Jennings'
    },
    {
      id: 'critical' as const,
      label: 'Valores Críticos & Read-Back',
      shortLabel: '3. Valores Críticos',
      icon: AlertOctagon,
      badge: 'SLA 15min'
    },
    {
      id: 'sections' as const,
      label: 'Módulos Especializados',
      shortLabel: '4. Hema / Micro / Orina',
      icon: Microscope,
      badge: 'Contador + CLSI'
    },
    {
      id: 'reagents' as const,
      label: 'Índices HIL & Preanalítica',
      shortLabel: '5. Preanalítica & HIL',
      icon: FlaskConical,
      badge: 'Calidad Muestra'
    },
    {
      id: 'bloodbank' as const,
      label: 'Banco de Sangre & Cruces',
      shortLabel: '6. Banco de Sangre',
      icon: Droplets,
      badge: 'ISBT 128'
    },
    {
      id: 'blood_drive' as const,
      label: 'Colectas Extramurales',
      shortLabel: '49. Colectas',
      icon: Truck,
      badge: 'Móvil'
    },
    {
      id: 'donor_deferral' as const,
      label: 'Estadísticas de Diferimiento',
      shortLabel: '50. Diferidos',
      icon: UserX,
      badge: 'BI Donante'
    },
    {
      id: 'blood_logistics' as const,
      label: 'Traslados & Logística',
      shortLabel: '51. Logística Sangre',
      icon: Truck,
      badge: 'Cadena Frío'
    },
    {
      id: 'reagentinv' as const,
      label: 'Gestión de Reactivos',
      shortLabel: '7. Inventario',
      icon: LayoutDashboard,
      badge: 'Stock & Trazabilidad'
    },
    {
      id: 'externalqc' as const,
      label: 'Calidad Externa (EQA)',
      shortLabel: '8. Control Externo',
      icon: Sparkles,
      badge: 'Exactitud PT'
    },
    {
      id: 'maintenance' as const,
      label: 'Mantenimiento de Equipos',
      shortLabel: '9. Ingeniería',
      icon: Wrench,
      badge: 'Hoja de Vida'
    },
    {
      id: 'calibration' as const,
      label: 'Calibración Analítica',
      shortLabel: '23. Metrología',
      icon: Zap,
      badge: 'Factores K'
    },
    {
      id: 'billing' as const,
      label: 'Facturación & Seguros',
      shortLabel: '10. Finanzas',
      icon: DollarSign,
      badge: 'DGI & Liquidación'
    },
    {
      id: 'middleware' as const,
      label: 'Conectividad Instrumental',
      shortLabel: '11. Middleware',
      icon: Cpu,
      badge: 'ASTM / HL7'
    },
    {
      id: 'payroll' as const,
      label: 'Liquidación de Nómina',
      shortLabel: '12. Nómina',
      icon: Briefcase,
      badge: 'Producción TM'
    },
    {
      id: 'purchasing' as const,
      label: 'Compras y Suministros',
      shortLabel: '13. Compras',
      icon: ShoppingBag,
      badge: 'Gestión OC'
    },
    {
      id: 'suppliers' as const,
      label: 'Gestión de Proveedores (ISO)',
      shortLabel: '42. Proveedores',
      icon: Truck,
      badge: 'Evaluación'
    },
    {
      id: 'test_profiles' as const,
      label: 'Perfiles y Paquetes',
      shortLabel: '48. Perfiles',
      icon: Layers,
      badge: 'BHC/Química'
    },
    {
      id: 'assets' as const,
      label: 'Control de Activos Fijos',
      shortLabel: '14. Activos',
      icon: Box,
      badge: 'Patrimonio'
    },
    {
      id: 'appointments' as const,
      label: 'Gestión de Citas & Domicilios',
      shortLabel: '15. Citas',
      icon: Calendar,
      badge: 'Online'
    },
    {
      id: 'waste' as const,
      label: 'Gestión de Residuos Bio-peligrosos',
      shortLabel: '16. Descartes',
      icon: Flame,
      badge: 'Bioseguridad'
    },
    {
      id: 'chemical_waste' as const,
      label: 'Gestión de Residuos Químicos',
      shortLabel: '41. Química Amb',
      icon: Trash2,
      badge: 'ISO 14001'
    },
    {
      id: 'reagent_efficiency' as const,
      label: 'Eficiencia de Reactivos',
      shortLabel: '46. Rendimiento',
      icon: Gauge,
      badge: 'Analytical'
    },
    {
      id: 'waste_stats' as const,
      label: 'Indicadores de Bioseguridad',
      shortLabel: '18. Eco-Métricas',
      icon: Leaf,
      badge: 'Sostenibilidad'
    },
    {
      id: 'coldchain' as const,
      label: 'Monitoreo de Cadena de Frío',
      shortLabel: '19. Cold Chain',
      icon: ThermometerSnowflake,
      badge: 'IoT Dataloggers'
    },
    {
      id: 'staff' as const,
      label: 'Competencia y Capacitación',
      shortLabel: '17. Personal',
      icon: GraduationCap,
      badge: 'ISO 15189'
    },
    {
      id: 'staff_sched' as const,
      label: 'Gestión de Turnos y Roles',
      shortLabel: '28. Horarios',
      icon: Users,
      badge: 'Rol Guardia'
    },
    {
      id: 'staff_punch' as const,
      label: 'Reloj de Marcación Digital',
      shortLabel: '29. Marcación',
      icon: Fingerprint,
      badge: 'Punch Clock'
    },
    {
      id: 'staff_insurance' as const,
      label: 'Seguros Responsabilidad Civil',
      shortLabel: '45. Seguros Prof',
      icon: Scale,
      badge: 'Legal TM'
    },
    {
      id: 'hr_analytics' as const,
      label: 'Analítica de Personal & Horas Extras',
      shortLabel: '30. HR Analytics',
      icon: PieChart,
      badge: 'Productividad'
    },
    {
      id: 'docs' as const,
      label: 'Gestión Documental de Calidad',
      shortLabel: '31. Docs ISO',
      icon: FileText,
      badge: 'SOPs / Manuales'
    },
    {
      id: 'feedback' as const,
      label: 'Quejas y Sugerencias del Paciente',
      shortLabel: '32. Feedback',
      icon: MessageSquare,
      badge: 'ISO §8.6'
    },
    {
      id: 'risks' as const,
      label: 'Gestión de Riesgos de Calidad',
      shortLabel: '33. Riesgos',
      icon: ShieldCheck,
      badge: 'ISO §8.5'
    },
    {
      id: 'sales' as const,
      label: 'Ventas por Sucursal & Tendencias',
      shortLabel: '34. Sucursales',
      icon: Building2,
      badge: 'Finanzas'
    },
    {
      id: 'profitability' as const,
      label: 'Rentabilidad por Prueba (BI)',
      shortLabel: '35. Margen',
      icon: Calculator,
      badge: 'BI Intel'
    },
    {
      id: 'intangibles' as const,
      label: 'Activos Intangibles (TI)',
      shortLabel: '36. Licencias',
      icon: Cloud,
      badge: 'Software / Dom'
    },
    {
      id: 'elite_intel' as const,
      label: 'Elite Intelligence (BI)',
      shortLabel: '37. Analytics',
      icon: BarChart3,
      badge: 'KPIs / ISO'
    },
    {
      id: 'epidemiology' as const,
      label: 'Vigilancia Epidemiológica (MINSA)',
      shortLabel: '38. Epidemiología',
      icon: ShieldAlert,
      badge: 'Notificación'
    },
    {
      id: 'epi_heatmap' as const,
      label: 'Mapa de Calor Epidemiológico',
      shortLabel: '39. Mapa Brotes',
      icon: Map,
      badge: 'GIS Analytics'
    },
    {
      id: 'equipment_safety' as const,
      label: 'Seguros y Garantías de Equipos',
      shortLabel: '40. Siniestros',
      icon: ShieldCheck,
      badge: 'Pólizas'
    },
    {
      id: 'iso_audit' as const,
      label: 'Auditoría Interna ISO 15189',
      shortLabel: '43. Auditoría',
      icon: ClipboardCheck,
      badge: 'Compliance'
    },
    {
      id: 'external_audit' as const,
      label: 'Auditorías Externas & Entes',
      shortLabel: '47. Inspección',
      icon: Globe,
      badge: 'Accreditation'
    },
    {
      id: 'formulas' as const,
      label: 'Motor de Cálculos Automáticos',
      shortLabel: '44. Fórmulas',
      icon: Calculator,
      badge: 'Derived'
    },
    {
      id: 'incidents' as const,
      label: 'Gestión de Incidentes & CAPA',
      shortLabel: '20. No Conformidades',
      icon: ShieldAlert,
      badge: 'ISO §8.7'
    },
    {
      id: 'workload' as const,
      label: 'Monitor de Carga de Trabajo',
      shortLabel: '21. Workload',
      icon: Activity,
      badge: 'Real-time'
    },
    {
      id: 'opps' as const,
      label: 'Tablero de Oportunidades',
      shortLabel: '22. Oportunidades',
      icon: Sparkles,
      badge: 'Crecimiento'
    },
    {
      id: 'stability' as const,
      label: 'Estabilidad de Lotes',
      shortLabel: '24. Lotes',
      icon: Layers,
      badge: 'CV% Inter-Vial'
    },
    {
      id: 'ithardware' as const,
      label: 'Infraestructura de IT',
      shortLabel: '25. Servidores',
      icon: Server,
      badge: 'Redes / UPS'
    },
    {
      id: 'his' as const,
      label: 'Interoperabilidad HIS / EMR',
      shortLabel: '26. HIS Bridge',
      icon: Globe,
      badge: 'HL7 / FHIR'
    },
    {
      id: 'supplies' as const,
      label: 'Inventario de Insumos Médicos',
      shortLabel: '27. Insumos',
      icon: Package,
      badge: 'Consumibles'
    }
  ];

  return (
    <div className="space-y-6" id="technologist-master-suite">
      {/* Top Main Navigation Bar for the 9 Modules */}
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-3xl p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 rounded-2xl transition-all duration-300 flex items-center space-x-3 shrink-0 cursor-pointer text-left border ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/10 border-teal-400 text-white shadow-lg shadow-teal-500/10'
                    : 'bg-slate-950/50 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className={`p-2 rounded-xl transition ${
                  isActive ? 'bg-teal-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black tracking-wide flex items-center space-x-2">
                    <span>{tab.shortLabel}</span>
                  </div>
                  <span className="text-[10px] text-teal-300/80 font-mono">
                    {tab.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Executive Report Trigger */}
        <div className="border-l border-slate-800 ml-2 pl-2 hidden sm:block">
          <button
            onClick={() => setShowQualityReport(true)}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-2xl transition-all flex items-center gap-3 border border-slate-700 group"
          >
            <div className="p-2 bg-slate-900 rounded-xl group-hover:bg-teal-500 group-hover:text-slate-950 transition-all">
              <FileBarChart size={16} />
            </div>
            <div className="text-left">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reporte Ejecutivo</div>
              <div className="text-xs font-black text-white">Calidad Mensual</div>
            </div>
          </button>
        </div>
      </div>

      {/* Render Active Sub-Suite */}
      <div className="transition-all duration-300">
        {activeTab === 'validation' && <AnalyticalValidationWorkstation />}
        {activeTab === 'qc' && <InternalQualityControlQC />}
        {activeTab === 'critical' && <CriticalPanicManagement />}
        {activeTab === 'sections' && <SpecializedLaboratorySections />}
        {activeTab === 'reagents' && <ReagentsHilPreanalytics />}
        {activeTab === 'bloodbank' && <BloodBankCenter />}
        {activeTab === 'blood_drive' && <ExtramuralBloodDriveManager />}
        {activeTab === 'donor_deferral' && <DonorDeferralDashboard />}
        {activeTab === 'blood_logistics' && <BloodLogisticsManager />}
        {activeTab === 'reagentinv' && <ReagentInventoryManager />}
        {activeTab === 'externalqc' && <ExternalQualityControl />}
        {activeTab === 'maintenance' && <AnalyzerMaintenanceManager />}
        {activeTab === 'calibration' && <CalibrationManager />}
        {activeTab === 'billing' && <BillingFinancialCenter />}
        {activeTab === 'middleware' && <MiddlewareDashboard />}
        {activeTab === 'payroll' && <PayrollManager />}
        {activeTab === 'purchasing' && <SupplierPurchasingManager />}
        {activeTab === 'suppliers' && <SupplierEvaluationManager />}
        {activeTab === 'test_profiles' && <TestProfileManager />}
        {activeTab === 'assets' && <FixedAssetsManager />}
        {activeTab === 'appointments' && <AppointmentCalendarManager />}
        {activeTab === 'waste' && <BiohazardWasteManager />}
        {activeTab === 'chemical_waste' && <ChemicalWasteManager />}
        {activeTab === 'reagent_efficiency' && <ReagentEfficiencyDashboard />}
        {activeTab === 'waste_stats' && <BiohazardDashboard />}
        {activeTab === 'coldchain' && <ColdChainMonitor />}
        {activeTab === 'staff' && <StaffCompetencyManager />}
        {activeTab === 'staff_sched' && <StaffSchedulingManager />}
        {activeTab === 'staff_punch' && <StaffPunchClock />}
        {activeTab === 'staff_insurance' && <StaffProfessionalInsuranceManager />}
        {activeTab === 'hr_analytics' && <HRAnalyticsDashboard />}
        {activeTab === 'docs' && <QualityDocsManager />}
        {activeTab === 'feedback' && <PatientFeedbackManager />}
        {activeTab === 'risks' && <RiskManagementDashboard />}
        {activeTab === 'sales' && <BranchSalesDashboard />}
        {activeTab === 'profitability' && <TestProfitabilityDashboard />}
        {activeTab === 'intangibles' && <IntangibleAssetsManager />}
        {activeTab === 'elite_intel' && <EliteLabIntelligence />}
        {activeTab === 'epidemiology' && <EpidemiologyBulletinManager />}
        {activeTab === 'epi_heatmap' && <EpiHeatmapDashboard />}
        {activeTab === 'equipment_safety' && <EquipmentInsuranceManager />}
        {activeTab === 'iso_audit' && <ISOAuditDashboard />}
        {activeTab === 'external_audit' && <ExternalAuditManager />}
        {activeTab === 'formulas' && <FormulaEngineManager />}
        {activeTab === 'incidents' && <IncidentCAPAManager />}
        {activeTab === 'workload' && <SectionWorkloadDashboard />}
        {activeTab === 'opps' && <OpportunitiesBoard />}
        {activeTab === 'stability' && <LotStabilityDashboard />}
        {activeTab === 'ithardware' && <ITHardwareManager />}
        {activeTab === 'his' && <HISIntegrationConsole />}
        {activeTab === 'supplies' && <MedicalSuppliesManager />}
      </div>

      {showQualityReport && (
        <MonthlyQualityManagementReport
          onClose={() => setShowQualityReport(false)}
        />
      )}
    </div>
  );
};
