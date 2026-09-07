/**
 * 🗄️ PLATAFORMA-LIS — Supabase Database Types
 * Generated from: supabase/migrations/20260810_initial_schema.sql
 * ISO 15189 Compliant | Multi-Tenant | Ley 81 (Panamá)
 *
 * To regenerate: npx supabase gen types typescript --local > src/database.types.ts
 */

// ---------------------------------------------------------------------------
// ENUMS — aligned to DB trigger logic & CHECK constraints
// ---------------------------------------------------------------------------

export type DbRole =
  | 'owner'
  | 'lab_chief'
  | 'tech_med'
  | 'lab_tech'
  | 'receptionist'
  | 'ext_doctor'
  | 'patient'
  | 'abregotech_admin';

export type DbPlan = 'Basic' | 'Pro' | 'Enterprise';

export type DbGender = 'M' | 'F' | 'BOTH';

export type DbIdType = 'CEDULA' | 'PASAPORTE' | 'CARNET';

export type DbPriority = 'RUTINA' | 'STAT' | 'URGENTE';

export type DbOrderStatus =
  | 'REGISTRADA'
  | 'TOMADA'
  | 'EN_PROCESO'
  | 'VALIDADA_TEC'
  | 'VALIDADA_MED'
  | 'COMPLETADA'
  | 'CANCELADA';

export type DbPaymentStatus = 'PAGADO' | 'PENDIENTE' | 'ASEGURADORA';

export type DbAnalyzerStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

/**
 * Result flags — aligned to fn_validate_test_result() trigger logic:
 * CRIT_L / CRIT_H come from is_critical=true reference ranges
 * L / H = out of range, N = normal
 */
export type DbResultFlag = 'N' | 'L' | 'H' | 'CRIT_L' | 'CRIT_H';

/**
 * Result status lifecycle (ISO 15189 two-step validation):
 * PENDIENTE → PRE-VALIDADO → VALIDADO
 * If a VALIDADO result is edited, trigger resets to PENDIENTE (version++)
 */
export type DbResultStatus = 'PENDIENTE' | 'PRE-VALIDADO' | 'VALIDADO';

export type DbAuditAction =
  | 'EDICION'
  | 'ESTADO_PENDIENTE'
  | 'ESTADO_PRE-VALIDADO'
  | 'ESTADO_VALIDADO'
  | 'VALIDACION'
  | 'DESVALIDACION'
  | 'REPETICION';

// ---------------------------------------------------------------------------
// ROW TYPES — exact column mapping from schema
// ---------------------------------------------------------------------------

export interface DbProfile {
  id: string;                   // UUID → auth.users(id)
  tenant_id: string | null;
  branch_id: string | null;
  name: string;
  role: DbRole;
  license_number: string | null; // Required for VALIDADO status (ISO 15189)
  pin_code: string | null;
  base_salary: number;
  commission_per_test: number;
  created_at: string;
}

export interface DbTenant {
  id: string;
  name: string;
  ruc: string;                   // RUC único (Panamá)
  dv: string;                    // Dígito verificador
  plan: DbPlan;
  created_at: string;
}

export interface DbBranch {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  created_at: string;
}

export interface DbAnalyzer {
  id: string;
  tenant_id: string;
  branch_id: string;
  name: string;
  model: string | null;
  manufacturer: string | null;
  serial_number: string | null;
  last_maintenance: string | null;
  status: DbAnalyzerStatus;
  created_at: string;
}

export interface DbReferenceRange {
  id: string;
  tenant_id: string;
  test_code: string;
  test_name: string;
  gender: DbGender | null;
  age_min: number;               // default 0
  age_max: number;               // default 120
  min_value: number | null;
  max_value: number | null;
  unit: string | null;
  is_critical: boolean;          // triggers CRIT_L / CRIT_H flags
  created_at: string;
}

export interface DbPatient {
  id: string;
  tenant_id: string;
  national_id: string;           // Cédula / Pasaporte / Carnet
  id_type: DbIdType;
  first_name: string;
  last_name: string;
  dob: string;                   // DATE — ISO 8601
  gender: 'M' | 'F';
  email: string | null;
  phone: string | null;
  address: string | null;
  data_consent: boolean;         // Ley 81 de Panamá
  consent_date: string | null;
  insurance_status: 'ASEGURADO' | 'NO_ASEGURADO' | 'PARTICULAR';
  provenance_province: string | null;
  provenance_district: string | null;
  provenance_corregimiento: string | null;
  patient_type: 'AMBULATORIO' | 'HOSPITALIZADO' | 'URGENCIAS';
  nationality: string;
  height_cm: number | null;
  weight_kg: number | null;
  created_at: string;
}

export interface DbGrowthStandard {
  id: string;
  gender: DbGender;
  age_months: number;
  measure_type: 'WEIGHT_FOR_AGE' | 'HEIGHT_FOR_AGE' | 'BMI_FOR_AGE';
  l: number | null;
  m: number | null;
  s: number | null;
  p3: number | null;
  p15: number | null;
  p50: number | null;
  p85: number | null;
  p97: number | null;
}

export interface DbStaffProfessionalInsurance {
  id: string;
  tenant_id: string;
  profile_id: string;
  policy_number: string;
  insurance_company: string;
  start_date: string;
  expiry_date: string;
  coverage_limit: number;
  status: 'ACTIVE' | 'EXPIRED' | 'RENEWING';
  certificate_url: string | null;
  created_at: string;
}

export interface DbOrder {
  id: string;
  tenant_id: string;
  branch_id: string;
  patient_id: string;
  order_number: string;          // Unique (e.g. ORD-2026-00102)
  priority: DbPriority;
  status: DbOrderStatus;
  payment_status: DbPaymentStatus;
  created_at: string;
  created_by: string | null;     // auth.users(id)
}

export interface DbTestResult {
  id: string;
  order_id: string;
  test_code: string;             // Links to reference_ranges.test_code
  parameter_name: string;
  value: string | null;
  numeric_value: number | null;
  unit: string | null;
  flag: DbResultFlag | null;     // Auto-set by fn_validate_test_result()
  ref_range: string | null;      // Human-readable text for reports
  status: DbResultStatus;
  version: number;               // Increments on edit after VALIDADO
  analyzer_name: string | null;
  interpretation: string | null; // Delta Check alerts appended here
  analyzer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbResultAuditLog {
  id: string;
  result_id: string;
  action: DbAuditAction;
  author: string;                // auth.jwt() email
  previous_value: string | null;
  new_value: string | null;
  reason: string | null;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// BLOOD BANK TYPES
// ---------------------------------------------------------------------------

export interface DbBloodDonor {
  id: string;
  tenant_id: string;
  patient_id: string | null;
  blood_type: string | null;
  rh_factor: string | null;
  phenotype: string | null;
  last_donation_date: string | null;
  eligibility_status: 'ELIGIBLE' | 'TEMPORARY_DEFERRAL' | 'PERMANENT_DEFERRAL';
  deferral_reason: string | null;
  created_at: string;
}

export interface DbBloodUnit {
  id: string;
  tenant_id: string;
  donor_id: string | null;
  unit_number: string;
  component_type: string;
  blood_type: string;
  rh_factor: string;
  volume_ml: number | null;
  collection_date: string;
  expiry_date: string;
  status: 'QUARANTINE' | 'AVAILABLE' | 'RESERVED' | 'TRANSFUSED' | 'DISCARDED';
  location_storage: string | null;
  serology_status: 'PENDING' | 'NEGATIVE' | 'REACTIVE';

  // Panama Specific
  marker_hiv: boolean;
  marker_hbv: boolean;
  marker_hcv: boolean;
  marker_syphilis: boolean;
  marker_chagas: boolean;
  marker_htlv: boolean;

  created_at: string;
}

export interface DbBloodRequest {
  id: string;
  order_id: string | null;
  patient_id: string;
  component_requested: string;
  quantity_units: number;
  urgency: 'ROUTINE' | 'URGENT' | 'EXTREME_URGENCY';
  diagnosis: string | null;
  transfusion_history: boolean;
  status: 'PENDING' | 'CROSSMATCHING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

export interface DbBloodCrossmatch {
  id: string;
  request_id: string;
  unit_id: string;
  technologist_id: string | null;
  method: string | null;
  saline_phase: string | null;
  albumin_phase: string | null;
  coombs_phase: string | null;
  result: 'COMPATIBLE' | 'INCOMPATIBLE';
  incompatibility_notes: string | null;
  performed_at: string;
}

export interface DbBloodHemovigilance {
  id: string;
  unit_id: string | null;
  patient_id: string | null;
  reaction_type: string | null;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'FATAL';
  description: string;
  investigation_notes: string | null;
  reported_by: string | null;
  created_at: string;
}

export interface DbBloodNotification {
  id: string;
  tenant_id: string;
  unit_id: string;
  donor_id: string;
  report_type: string;
  status: 'PENDING' | 'SENT' | 'ARCHIVED';
  serial_number: string | null;
  notes: string | null;
  metadata: any;
  created_at: string;
  created_by: string | null;
}

export interface DbInventoryReagent {
  id: string;
  tenant_id: string;
  name: string;
  catalog_number: string | null;
  lot_number: string;
  manufacturer: string | null;
  expiry_date: string;
  current_stock: number;
  unit: string;
  min_threshold: number;
  storage_condition: string | null;
  opened_at: string | null;
  opened_by: string | null;
  status: 'IN_STOCK' | 'OPENED' | 'DEPLETED' | 'EXPIRED';
  created_at: string;
}

export interface DbExternalQCProgram {
  id: string;
  tenant_id: string;
  provider_name: string;
  program_name: string;
  cycle_number: string | null;
  sample_id: string;
  test_name: string;
  target_value: number | null;
  reported_value: number | null;
  unit: string | null;
  sdi_score: number | null;
  bias_percent: number | null;
  status: 'PENDING' | 'REPORTED' | 'EVALUATED_PASS' | 'EVALUATED_FAIL';
  result_document_url: string | null;
  evaluated_at: string | null;
  created_at: string;
}

export interface DbQCConfiguration {
  id: string;
  tenant_id: string;
  analyzer_id: string;
  analyte_name: string;
  level: string;
  lot_number: string;
  expiration_date: string;
  target_mean: number;
  target_sd: number;
  unit: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DbQCRun {
  id: string;
  tenant_id: string;
  config_id: string;
  value: number;
  sd_score: number | null;
  violation: string | null;
  technician_id: string | null;
  corrective_action: string | null;
  root_cause: string | null;
  is_validated: boolean;
  created_at: string;
}

export interface DbAnalyzerMaintenanceSchedule {
  id: string;
  tenant_id: string;
  analyzer_id: string;
  task_name: string;
  frequency: string;
  description: string | null;
  last_done_at: string | null;
  next_due_at: string | null;
  created_at: string;
}

export interface DbAnalyzerMaintenanceLog {
  id: string;
  tenant_id: string;
  schedule_id: string | null;
  analyzer_id: string;
  task_name: string;
  performed_by: string | null;
  notes: string | null;
  parameter_value: string | null;
  status: string;
  created_at: string;
}

export interface DbSecurityAuditTrail {
  id: string;
  tenant_id: string;
  user_id: string;
  action_type: string;
  resource_affected: string | null;
  ip_address: string | null;
  status: string;
  created_at: string;
}

export interface DbAutomatedNotification {
  id: string;
  tenant_id: string;
  channel: 'WHATSAPP' | 'EMAIL' | 'PUSH';
  recipient_contact: string;
  message_body: string;
  notification_type: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  error_log: string | null;
  created_at: string;
}

export interface DbClinicalCriticalAlert {
  id: string;
  tenant_id: string;
  order_id: string;
  result_id: string;
  analyte: string;
  value: string;
  detected_at: string;
  status: 'PENDING_CALL' | 'NOTIFIED' | 'FAILED';
  receiver_name: string | null;
  receiver_role: string | null;
  read_back_confirmed: boolean;
  notified_at: string | null;
  notified_by: string | null;
  tat_minutes: number | null;
  notes: string | null;
}

export interface DbBillingInvoice {
  id: string;
  tenant_id: string;
  order_id: string;
  invoice_number: string | null;
  subtotal: number;
  tax_itbms: number;
  discount: number;
  total: number;
  payment_method: string | null;
  insurance_id: string | null;
  co_pay_amount: number;
  fiscal_status: 'DRAFT' | 'ISSUED' | 'VOID';
  created_at: string;
}

export interface DbITHardwareAsset {
  id: string;
  tenant_id: string;
  name: string;
  hardware_type: 'SERVER' | 'SWITCH' | 'UPS' | 'TERMINAL';
  ip_address: string | null;
  serial_number: string | null;
  location: string | null;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  last_reboot: string | null;
  created_at: string;
}

export interface DbHISEndpoint {
  id: string;
  tenant_id: string;
  name: string;
  protocol: 'HL7_V2' | 'HL7_V3' | 'FHIR';
  connection_type: 'MLLP_TCP' | 'HTTP_REST';
  ip_address: string | null;
  port: number | null;
  api_key: string | null;
  is_active: boolean;
  last_heartbeat: string | null;
  created_at: string;
}

export interface DbHISMessageLog {
  id: string;
  tenant_id: string;
  endpoint_id: string | null;
  direction: 'INBOUND' | 'OUTBOUND';
  message_type: string | null;
  raw_content: string | null;
  status: 'PENDING' | 'PROCESSED' | 'ERROR' | 'ACKNOWLEDGED';
  error_details: string | null;
  order_id: string | null;
  created_at: string;
}

export interface DbMedicalSupply {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  sku: string | null;
  current_stock: number;
  unit: string;
  min_threshold: number;
  category: string;
  location_id: string | null;
  created_at: string;
}

export interface DbSupplyTransaction {
  id: string;
  supply_id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  performed_by: string;
  notes: string | null;
  created_at: string;
}

export interface DbHISTestMapping {
  id: string;
  tenant_id: string;
  endpoint_id: string;
  his_test_code: string;
  lis_test_code: string;
  description: string | null;
}

export interface DbITMaintenanceLog {
  id: string;
  asset_id: string;
  task_name: string;
  description: string | null;
  performed_by: string;
  status: 'COMPLETED' | 'FAILED';
  created_at: string;
}

export interface DbBillingCashClosing {
  id: string;
  tenant_id: string;
  branch_id: string;
  closed_at: string;
  closed_by: string;
  total_expected: number;
  total_actual: number;
  difference: number;
  cash_amount: number;
  card_amount: number;
  yappy_amount: number;
  insurance_amount: number;
  notes: string | null;
  status: 'COMPLETED' | 'DISCREPANCY';
}

export interface DbFinancialBudget {
  id: string;
  tenant_id: string;
  month: number;
  year: number;
  projected_revenue: number;
  projected_expenses: number;
  notes: string | null;
  created_at: string;
}

export interface DbPayrollRun {
  id: string;
  tenant_id: string;
  profile_id: string;
  month: number;
  year: number;
  tests_processed: number;
  base_pay: number;
  incentive_pay: number;
  total_pay: number;
  status: 'PENDING' | 'PAID';
  paid_at: string | null;
  created_at: string;
}

export interface DbSupplier {
  id: string;
  tenant_id: string;
  name: string;
  ruc: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  category: string | null;
  is_active: boolean;
  evaluation_score: number;
  last_evaluation_date: string | null;
  certification_status: 'PENDING' | 'CERTIFIED' | 'REJECTED';
}

export interface DbIsoClause {
  id: string;
  clause_number: string;
  title: string;
  description: string | null;
  category: 'MANAGEMENT' | 'TECHNICAL';
  importance: 'CRITICAL' | 'MAJOR' | 'MINOR';
  created_at: string;
}

export interface DbTestFormula {
  id: string;
  tenant_id: string;
  target_test_code: string;
  formula_name: string;
  expression: string;
  required_variables: string[];
  is_active: boolean;
  created_at: string;
}

export interface DbFormulaExecutionLog {
  id: string;
  tenant_id: string;
  order_id: string;
  target_test_code: string;
  input_values: any;
  calculated_value: string | null;
  error_message: string | null;
  created_at: string;
}

export interface DbIsoAuditFinding {
  id: string;
  tenant_id: string;
  clause_id: string;
  status: 'COMPLIANT' | 'NON_CONFORMITY' | 'OPPORTUNITY_IMPROVEMENT';
  evidence_description: string | null;
  related_module_id: string | null;
  audited_by: string;
  audited_at: string;
  next_audit_date: string | null;
  created_at: string;
}

export interface DbSupplierEvaluation {
  id: string;
  tenant_id: string;
  supplier_id: string;
  evaluation_date: string;
  criterion_quality: number;
  criterion_delivery: number;
  criterion_price: number;
  criterion_support: number;
  final_score: number;
  comments: string | null;
  evaluated_by: string;
  created_at: string;
}

export interface DbPurchaseOrder {
  id: string;
  tenant_id: string;
  supplier_id: string;
  order_number: string;
  status: 'DRAFT' | 'SENT' | 'RECEIVED' | 'CANCELLED';
  total_amount: number;
  created_by: string;
  created_at: string;
  received_at: string | null;
}

export interface DbPatientAccessToken {
  id: string;
  tenant_id: string;
  patient_id: string;
  order_id: string;
  access_code: string;
  expires_at: string;
  is_active: boolean;
}

export interface DbAssetCategory {
  id: string;
  tenant_id: string;
  name: string;
  depreciation_years: number;
}

export interface DbFixedAsset {
  id: string;
  tenant_id: string;
  category_id: string | null;
  analyzer_id: string | null;
  internal_code: string;
  description: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string;
  purchase_value: number;
  residual_value: number;
  location_id: string | null;
  status: 'ACTIVE' | 'REPAIR' | 'DISPOSED' | 'SOLD';
  created_at: string;
}

export interface DbAppointment {
  id: string;
  tenant_id: string;
  patient_id: string | null;
  branch_id: string;
  scheduled_at: string;
  service_type: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes: string | null;
  patient_name_manual: string | null;
  patient_phone: string | null;
  created_at: string;
}

export interface DbWasteCategory {
  id: string;
  tenant_id: string;
  name: string;
  color_code: string | null;
  storage_rules: string | null;
}

export interface DbBiohazardWasteLog {
  id: string;
  tenant_id: string;
  category_id: string | null;
  branch_id: string;
  weight_kg: number;
  volume_liters: number | null;
  generated_by: string;
  notes: string | null;
  status: 'IN_STORAGE' | 'PICKED_UP' | 'DISPOSED';
  created_at: string;
}

export interface DbBiohazardPickup {
  id: string;
  tenant_id: string;
  company_name: string;
  manifest_number: string;
  total_weight_kg: number;
  pickup_date: string;
  authorized_by: string;
  certificate_url: string | null;
  transport_company_ruc: string | null;
  vehicle_plate: string | null;
  driver_name: string | null;
  disposal_method: string | null;
}

export interface DbColdChainDevice {
  id: string;
  tenant_id: string;
  branch_id: string;
  name: string;
  location_details: string | null;
  min_temp_limit: number;
  max_temp_limit: number;
  last_reading_temp: number | null;
  status: 'ONLINE' | 'OFFLINE' | 'ALARM';
  created_at: string;
}

export interface DbQualityIncident {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  category: 'PRE-ANALYTICAL' | 'ANALYTICAL' | 'POST-ANALYTICAL' | 'ADMINISTRATIVE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  root_cause: string | null;
  corrective_action: string | null;
  preventive_action: string | null;
  status: 'OPEN' | 'UNDER_INVESTIGATION' | 'CLOSED' | 'VERIFIED';
  reported_by: string;
  assigned_to: string | null;
  created_at: string;
  closed_at: string | null;
}

export interface DbBusinessOpportunity {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  opportunity_type: 'SALES_LEAD' | 'TAT_IMPROVEMENT' | 'COST_REDUCTION' | 'NEW_TEST';
  estimated_value: number | null;
  priority: number;
  kanban_column: 'BACKLOG' | 'DISCOVERY' | 'IN_PROGRESS' | 'VALIDATING' | 'DONE';
  created_at: string;
}

export interface DbColdChainReading {
  id: string;
  device_id: string;
  temperature: number;
  humidity: number | null;
  recorded_at: string;
}

export interface DbStaffCompetency {
  id: string;
  tenant_id: string;
  profile_id: string;
  competency_name: string;
  level: 'TRAINEE' | 'COMPETENT' | 'EXPERT' | 'EVALUATOR';
  evaluated_at: string | null;
  expires_at: string | null;
  evaluated_by: string | null;
  certificate_url: string | null;
  created_at: string;
}

export interface DbStaffTrainingLog {
  id: string;
  tenant_id: string;
  profile_id: string;
  course_name: string;
  provider: string | null;
  hours_credits: number | null;
  completion_date: string | null;
  status: string;
  created_at: string;
}

export interface DbAnalyzerCalibration {
  id: string;
  tenant_id: string;
  analyzer_id: string;
  analyte_name: string;
  calibrator_lot: string;
  calibration_date: string;
  expiration_date: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  k_factor: number | null;
  offset_value: number | null;
  calibration_method: string | null;
  uncertainty_value: number | null;
  temperature_ambient: number | null;
  humidity_ambient: number | null;
  performed_by: string;
  notes: string | null;
  created_at: string;
}

export interface DbChemicalWasteLog {
  id: string;
  tenant_id: string;
  analyzer_id: string | null;
  waste_name: string;
  quantity_liters: number;
  container_type: string | null;
  status: 'IN_STORAGE' | 'NEUTRALIZED' | 'PICKED_UP';
  generated_by: string;
  created_at: string;
}

export interface DbShiftTemplate {
  id: string;
  tenant_id: string;
  name: string;
  start_time: string;
  end_time: string;
  color_code: string | null;
  created_at: string;
}

export interface DbStaffSchedule {
  id: string;
  tenant_id: string;
  profile_id: string;
  template_id: string | null;
  work_date: string;
  start_actual: string | null;
  end_actual: string | null;
  status: 'SCHEDULED' | 'CLOCKED_IN' | 'COMPLETED' | 'ABSENT' | 'ON_LEAVE';
  notes: string | null;
  created_at: string;
}

export interface DbQualityDocument {
  id: string;
  tenant_id: string;
  code: string;
  title: string;
  category: 'SOP' | 'MANUAL' | 'POLICY' | 'FORM';
  version: string;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  file_url: string | null;
  last_review_at: string | null;
  next_review_at: string | null;
  created_by: string;
  created_at: string;
}

export interface DbPatientFeedback {
  id: string;
  tenant_id: string;
  patient_id: string | null;
  order_id: string | null;
  type: 'COMPLAINT' | 'SUGGESTION' | 'INQUIRY';
  category: 'TAT' | 'ATTENTION' | 'BILLING' | 'TECHNICAL' | 'PORTAL' | null;
  subject: string;
  message: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface DbQualityRisk {
  id: string;
  tenant_id: string;
  process_area: string;
  risk_description: string;
  likelihood: number;
  severity: number;
  risk_score: number;
  mitigation_plan: string | null;
  status: 'IDENTIFIED' | 'MITIGATED' | 'RESIDUAL';
  created_at: string;
}

export interface DbBranchSalesTrend {
  tenant_id: string;
  branch_id: string;
  branch_name: string;
  sale_date: string;
  daily_revenue: number;
  invoice_count: number;
}

export interface DbIntangibleAsset {
  id: string;
  tenant_id: string;
  name: string;
  category: 'SOFTWARE' | 'DOMAIN' | 'CERTIFICATE' | 'IP';
  provider: string | null;
  cost: number;
  billing_cycle: 'MONTHLY' | 'ANNUAL' | 'ONE_TIME';
  expiry_date: string | null;
  auto_renew: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  created_at: string;
}

export interface DbTestProfitability {
  tenant_id: string;
  test_code: string;
  volume: number;
  avg_revenue_per_test: number;
  total_revenue: number;
  estimated_total_cost: number;
  net_profit: number;
}

export interface DbReagentEfficiency {
  tenant_id: string;
  test_code: string;
  patient_tests_count: number;
  qc_runs_count: number;
  calibrations_count: number;
  efficiency_percentage: number;
}

export interface DbExternalAudit {
  id: string;
  tenant_id: string;
  entity_name: string;
  audit_type: 'REGULATORY' | 'ACCREDITATION' | 'SURVEILLANCE';
  start_date: string;
  end_date: string | null;
  lead_auditor: string | null;
  scope: string | null;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
  result_summary: string | null;
  created_at: string;
}

export interface DbExternalAuditFinding {
  id: string;
  audit_id: string;
  clause_reference: string | null;
  description: string;
  severity: 'MINOR' | 'MAJOR' | 'OBSERVATION';
  action_plan: string | null;
  due_date: string | null;
  status: 'OPEN' | 'CLOSED';
  verified_at: string | null;
  created_at: string;
}

export interface DbTestProfile {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DbTestProfileComponent {
  id: string;
  profile_id: string;
  test_code: string;
  sort_order: number;
}

export interface DbBloodDriveEvent {
  id: string;
  tenant_id: string;
  name: string;
  location_name: string;
  gps_coordinates: string | null;
  start_date: string;
  end_date: string | null;
  goal_units: number;
  collected_units: number;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  lead_tech_id: string | null;
  created_at: string;
}

export interface DbBloodDriveRegistration {
  id: string;
  event_id: string;
  donor_id: string | null;
  patient_id: string;
  check_in_time: string;
  screening_status: 'PENDING' | 'SCREENING' | 'PASSED' | 'DEFERRED';
  vital_signs: any;
  collected_unit_id: string | null;
  notes: string | null;
}

export interface DbDonorDeferralReason {
  id: string;
  tenant_id: string;
  reason_code: string;
  category: 'TEMPORARY' | 'PERMANENT';
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface DbBloodUnitTransfer {
  id: string;
  tenant_id: string;
  origin_location: string;
  destination_location: string;
  transfer_date: string;
  status: 'IN_TRANSIT' | 'DELIVERED' | 'REJECTED_TEMP_EXCURSION';
  courier_name: string | null;
  container_id: string | null;
  min_temp_recorded: number | null;
  max_temp_recorded: number | null;
  received_at: string | null;
  received_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface DbDonorDeferralStat {
  tenant_id: string;
  reason: string;
  total_cases: number;
  percentage: number;
}

export interface DbEpidemiologicalMarker {
  id: string;
  tenant_id: string;
  test_code: string;
  disease_name: string;
  minsa_code: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DbEpidemiologicalReport {
  id: string;
  tenant_id: string;
  report_number: string;
  report_date: string;
  status: 'DRAFT' | 'SENT' | 'ACKNOWLEDGED';
  content: any;
  total_cases: number;
  submitted_by: string | null;
  submitted_at: string | null;
  created_at: string;
}

export interface DbMinsaSurveillance {
  tenant_id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  document_id: string;
  provenance_province: string | null;
  disease_name: string;
  result_value: string;
  detection_date: string;
  result_id: string;
}

export interface DbEquipmentInsurance {
  id: string;
  tenant_id: string;
  analyzer_id: string;
  policy_number: string;
  insurance_company: string;
  start_date: string;
  expiry_date: string;
  coverage_amount: number | null;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  terms_url: string | null;
  created_at: string;
}

export interface DbEquipmentWarranty {
  id: string;
  tenant_id: string;
  analyzer_id: string;
  provider_name: string;
  expiry_date: string;
  coverage_details: string | null;
  status: 'ACTIVE' | 'EXPIRED';
  created_at: string;
}

export interface DbEpiHeatmapData {
  tenant_id: string;
  provenance_province: string;
  disease_name: string;
  case_count: number;
}

export interface DbInsuranceProvider {
  id: string;
  tenant_id: string;
  name: string;
  plan_details: string | null;
  contact_person: string | null;
  is_active: boolean;
}

export interface DbMiddlewareRawFrame {
  id: string;
  tenant_id: string;
  analyzer_id: string | null;
  protocol: string | null;
  direction: string | null;
  raw_payload: string | null;
  processed: boolean;
  error_notes: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// JOIN / QUERY RETURN TYPES (common Supabase select patterns)
// ---------------------------------------------------------------------------

/** orders.select('*, patients(*), test_results(*)') */
export interface DbOrderWithDetails extends DbOrder {
  patients: DbPatient;
  test_results: DbTestResult[];
}

/** test_results.select('*, result_audit_logs(*)') */
export interface DbResultWithAudit extends DbTestResult {
  result_audit_logs: DbResultAuditLog[];
}

/** orders.select('*, patients(*), test_results(*, result_audit_logs(*))') */
export interface DbOrderFull extends DbOrder {
  patients: DbPatient;
  test_results: DbResultWithAudit[];
}

// ---------------------------------------------------------------------------
// INSERT / UPDATE PAYLOAD TYPES
// ---------------------------------------------------------------------------

export type DbPatientInsert = Omit<DbPatient, 'id' | 'created_at'>;
export type DbPatientUpdate = Partial<Omit<DbPatient, 'id' | 'tenant_id' | 'created_at'>>;

export type DbOrderInsert = Omit<DbOrder, 'id' | 'created_at'>;
export type DbOrderUpdate = Partial<Pick<DbOrder, 'status' | 'payment_status' | 'priority'>>;

export type DbTestResultInsert = Omit<DbTestResult, 'id' | 'created_at' | 'updated_at' | 'flag' | 'ref_range' | 'version'>;
export type DbTestResultUpdate = Partial<Pick<DbTestResult, 'value' | 'numeric_value' | 'unit' | 'status' | 'interpretation' | 'analyzer_id' | 'analyzer_name'>>;

export type DbReferenceRangeInsert = Omit<DbReferenceRange, 'id' | 'created_at'>;

export type DbAnalyzerInsert = Omit<DbAnalyzer, 'id' | 'created_at'>;
export type DbAnalyzerUpdate = Partial<Pick<DbAnalyzer, 'name' | 'model' | 'status' | 'last_maintenance' | 'serial_number'>>;

// ---------------------------------------------------------------------------
// SUPABASE DATABASE SCHEMA ROOT TYPE
// (for typed createClient<Database>())
// ---------------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: DbProfile;
        Insert: Omit<DbProfile, 'created_at'>;
        Update: Partial<Omit<DbProfile, 'id' | 'created_at'>>;
        Relationships: [];
      };
      tenants: {
        Row: DbTenant;
        Insert: Omit<DbTenant, 'id' | 'created_at'>;
        Update: Partial<Omit<DbTenant, 'id' | 'created_at'>>;
        Relationships: [];
      };
      branches: {
        Row: DbBranch;
        Insert: Omit<DbBranch, 'id' | 'created_at'>;
        Update: Partial<Omit<DbBranch, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      analyzers: {
        Row: DbAnalyzer;
        Insert: DbAnalyzerInsert;
        Update: DbAnalyzerUpdate;
        Relationships: [];
      };
      reference_ranges: {
        Row: DbReferenceRange;
        Insert: DbReferenceRangeInsert;
        Update: Partial<DbReferenceRangeInsert>;
        Relationships: [];
      };
      patients: {
        Row: DbPatient;
        Insert: DbPatientInsert;
        Update: DbPatientUpdate;
        Relationships: [];
      };
      orders: {
        Row: DbOrder;
        Insert: DbOrderInsert;
        Update: DbOrderUpdate;
        Relationships: [];
      };
      test_results: {
        Row: DbTestResult;
        Insert: DbTestResultInsert;
        Update: DbTestResultUpdate;
        Relationships: [];
      };
      result_audit_logs: {
        Row: DbResultAuditLog;
        Insert: Omit<DbResultAuditLog, 'id' | 'timestamp'>;
        Update: never; // Audit logs are immutable
        Relationships: [];
      };
      blood_donors: {
        Row: DbBloodDonor;
        Insert: Omit<DbBloodDonor, 'id' | 'created_at'>;
        Update: Partial<Omit<DbBloodDonor, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      blood_units: {
        Row: DbBloodUnit;
        Insert: Omit<DbBloodUnit, 'id' | 'created_at' | 'marker_hiv' | 'marker_hbv' | 'marker_hcv' | 'marker_syphilis' | 'marker_chagas' | 'marker_htlv'>;
        Update: Partial<Omit<DbBloodUnit, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      blood_requests: {
        Row: DbBloodRequest;
        Insert: Omit<DbBloodRequest, 'id' | 'created_at'>;
        Update: Partial<Omit<DbBloodRequest, 'id' | 'created_at'>>;
        Relationships: [];
      };
      blood_crossmatches: {
        Row: DbBloodCrossmatch;
        Insert: Omit<DbBloodCrossmatch, 'id' | 'performed_at'>;
        Update: Partial<Omit<DbBloodCrossmatch, 'id' | 'performed_at'>>;
        Relationships: [];
      };
      blood_hemovigilance: {
        Row: DbBloodHemovigilance;
        Insert: Omit<DbBloodHemovigilance, 'id' | 'created_at'>;
        Update: Partial<Omit<DbBloodHemovigilance, 'id' | 'created_at'>>;
        Relationships: [];
      };
      blood_notifications: {
        Row: DbBloodNotification;
        Insert: Omit<DbBloodNotification, 'id' | 'created_at'>;
        Update: Partial<Omit<DbBloodNotification, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      chemical_waste_logs: {
        Row: DbChemicalWasteLog;
        Insert: Omit<DbChemicalWasteLog, 'id' | 'created_at'>;
        Update: Partial<Omit<DbChemicalWasteLog, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      inventory_reagents: {
        Row: DbInventoryReagent;
        Insert: Omit<DbInventoryReagent, 'id' | 'created_at' | 'opened_at' | 'opened_by'>;
        Update: Partial<Omit<DbInventoryReagent, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      external_qc_programs: {
        Row: DbExternalQCProgram;
        Insert: Omit<DbExternalQCProgram, 'id' | 'created_at' | 'evaluated_at'>;
        Update: Partial<Omit<DbExternalQCProgram, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      qc_configurations: {
        Row: DbQCConfiguration;
        Insert: Omit<DbQCConfiguration, 'id' | 'created_at'>;
        Update: Partial<Omit<DbQCConfiguration, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      qc_runs: {
        Row: DbQCRun;
        Insert: Omit<DbQCRun, 'id' | 'created_at'>;
        Update: Partial<Omit<DbQCRun, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      analyzer_maintenance_schedules: {
        Row: DbAnalyzerMaintenanceSchedule;
        Insert: Omit<DbAnalyzerMaintenanceSchedule, 'id' | 'created_at'>;
        Update: Partial<Omit<DbAnalyzerMaintenanceSchedule, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      analyzer_maintenance_logs: {
        Row: DbAnalyzerMaintenanceLog;
        Insert: Omit<DbAnalyzerMaintenanceLog, 'id' | 'created_at'>;
        Update: Partial<Omit<DbAnalyzerMaintenanceLog, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      analyzer_calibrations: {
        Row: DbAnalyzerCalibration;
        Insert: Omit<DbAnalyzerCalibration, 'id' | 'created_at' | 'calibration_date'>;
        Update: Partial<Omit<DbAnalyzerCalibration, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      security_audit_trail: {
        Row: DbSecurityAuditTrail;
        Insert: Omit<DbSecurityAuditTrail, 'id' | 'created_at'>;
        Update: Partial<Omit<DbSecurityAuditTrail, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      automated_notifications: {
        Row: DbAutomatedNotification;
        Insert: Omit<DbAutomatedNotification, 'id' | 'created_at'>;
        Update: Partial<Omit<DbAutomatedNotification, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      billing_invoices: {
        Row: DbBillingInvoice;
        Insert: Omit<DbBillingInvoice, 'id' | 'created_at'>;
        Update: Partial<Omit<DbBillingInvoice, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      it_hardware_assets: {
        Row: DbITHardwareAsset;
        Insert: Omit<DbITHardwareAsset, 'id' | 'created_at' | 'status'>;
        Update: Partial<Omit<DbITHardwareAsset, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      it_maintenance_logs: {
        Row: DbITMaintenanceLog;
        Insert: Omit<DbITMaintenanceLog, 'id' | 'created_at'>;
        Update: Partial<Omit<DbITMaintenanceLog, 'id' | 'created_at'>>;
        Relationships: [];
      };
      his_endpoints: {
        Row: DbHISEndpoint;
        Insert: Omit<DbHISEndpoint, 'id' | 'created_at' | 'last_heartbeat'>;
        Update: Partial<Omit<DbHISEndpoint, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      his_message_log: {
        Row: DbHISMessageLog;
        Insert: Omit<DbHISMessageLog, 'id' | 'created_at'>;
        Update: Partial<Omit<DbHISMessageLog, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      his_test_mappings: {
        Row: DbHISTestMapping;
        Insert: Omit<DbHISTestMapping, 'id'>;
        Update: Partial<Omit<DbHISTestMapping, 'id' | 'tenant_id'>>;
        Relationships: [];
      };
      medical_supplies: {
        Row: DbMedicalSupply;
        Insert: Omit<DbMedicalSupply, 'id' | 'created_at'>;
        Update: Partial<Omit<DbMedicalSupply, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      shift_templates: {
        Row: DbShiftTemplate;
        Insert: Omit<DbShiftTemplate, 'id' | 'created_at'>;
        Update: Partial<Omit<DbShiftTemplate, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      staff_schedules: {
        Row: DbStaffSchedule;
        Insert: Omit<DbStaffSchedule, 'id' | 'created_at' | 'start_actual' | 'end_actual'>;
        Update: Partial<Omit<DbStaffSchedule, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      quality_documents: {
        Row: DbQualityDocument;
        Insert: Omit<DbQualityDocument, 'id' | 'created_at'>;
        Update: Partial<Omit<DbQualityDocument, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      patient_feedback: {
        Row: DbPatientFeedback;
        Insert: Omit<DbPatientFeedback, 'id' | 'created_at' | 'resolved_at' | 'resolved_by'>;
        Update: Partial<Omit<DbPatientFeedback, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      quality_risks: {
        Row: DbQualityRisk;
        Insert: Omit<DbQualityRisk, 'id' | 'created_at' | 'risk_score'>;
        Update: Partial<Omit<DbQualityRisk, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      staff_professional_insurances: {
        Row: DbStaffProfessionalInsurance;
        Insert: Omit<DbStaffProfessionalInsurance, 'id' | 'created_at'>;
        Update: Partial<Omit<DbStaffProfessionalInsurance, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      growth_standards: {
        Row: DbGrowthStandard;
        Insert: DbGrowthStandard;
        Update: Partial<DbGrowthStandard>;
        Relationships: [];
      };
      intangible_assets: {
        Row: DbIntangibleAsset;
        Insert: Omit<DbIntangibleAsset, 'id' | 'created_at' | 'status'>;
        Update: Partial<Omit<DbIntangibleAsset, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      supply_transactions: {
        Row: DbSupplyTransaction;
        Insert: Omit<DbSupplyTransaction, 'id' | 'created_at'>;
        Update: Partial<Omit<DbSupplyTransaction, 'id' | 'created_at'>>;
        Relationships: [];
      };
      insurance_providers: {
        Row: DbInsuranceProvider;
        Insert: Omit<DbInsuranceProvider, 'id'>;
        Update: Partial<Omit<DbInsuranceProvider, 'id' | 'tenant_id'>>;
        Relationships: [];
      };
      billing_cash_closings: {
        Row: DbBillingCashClosing;
        Insert: Omit<DbBillingCashClosing, 'id' | 'closed_at'>;
        Update: Partial<Omit<DbBillingCashClosing, 'id' | 'tenant_id' | 'closed_at'>>;
        Relationships: [];
      };
      financial_budgets: {
        Row: DbFinancialBudget;
        Insert: Omit<DbFinancialBudget, 'id' | 'created_at'>;
        Update: Partial<Omit<DbFinancialBudget, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      payroll_runs: {
        Row: DbPayrollRun;
        Insert: Omit<DbPayrollRun, 'id' | 'created_at' | 'paid_at'>;
        Update: Partial<Omit<DbPayrollRun, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      suppliers: {
        Row: DbSupplier;
        Insert: Omit<DbSupplier, 'id' | 'evaluation_score' | 'last_evaluation_date' | 'certification_status'>;
        Update: Partial<Omit<DbSupplier, 'id' | 'tenant_id'>>;
        Relationships: [];
      };
      supplier_evaluations: {
        Row: DbSupplierEvaluation;
        Insert: Omit<DbSupplierEvaluation, 'id' | 'created_at' | 'final_score'>;
        Update: Partial<Omit<DbSupplierEvaluation, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      iso_clauses: {
        Row: DbIsoClause;
        Insert: Omit<DbIsoClause, 'id' | 'created_at'>;
        Update: Partial<Omit<DbIsoClause, 'id' | 'created_at'>>;
        Relationships: [];
      };
      test_formulas: {
        Row: DbTestFormula;
        Insert: Omit<DbTestFormula, 'id' | 'created_at'>;
        Update: Partial<Omit<DbTestFormula, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      external_audits: {
        Row: DbExternalAudit;
        Insert: Omit<DbExternalAudit, 'id' | 'created_at'>;
        Update: Partial<Omit<DbExternalAudit, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      external_audit_findings: {
        Row: DbExternalAuditFinding;
        Insert: Omit<DbExternalAuditFinding, 'id' | 'created_at' | 'verified_at'>;
        Update: Partial<Omit<DbExternalAuditFinding, 'id' | 'created_at'>>;
        Relationships: [];
      };
      test_profiles: {
        Row: DbTestProfile;
        Insert: Omit<DbTestProfile, 'id' | 'created_at'>;
        Update: Partial<Omit<DbTestProfile, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      test_profile_components: {
        Row: DbTestProfileComponent;
        Insert: Omit<DbTestProfileComponent, 'id'>;
        Update: Partial<Omit<DbTestProfileComponent, 'id'>>;
        Relationships: [];
      };
      blood_drive_events: {
        Row: DbBloodDriveEvent;
        Insert: Omit<DbBloodDriveEvent, 'id' | 'created_at' | 'collected_units'>;
        Update: Partial<Omit<DbBloodDriveEvent, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      blood_drive_registrations: {
        Row: DbBloodDriveRegistration;
        Insert: Omit<DbBloodDriveRegistration, 'id' | 'check_in_time'>;
        Update: Partial<Omit<DbBloodDriveRegistration, 'id'>>;
        Relationships: [];
      };
      donor_deferral_reasons: {
        Row: DbDonorDeferralReason;
        Insert: Omit<DbDonorDeferralReason, 'id' | 'created_at'>;
        Update: Partial<Omit<DbDonorDeferralReason, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      blood_unit_transfers: {
        Row: DbBloodUnitTransfer;
        Insert: Omit<DbBloodUnitTransfer, 'id' | 'created_at' | 'transfer_date'>;
        Update: Partial<Omit<DbBloodUnitTransfer, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      formula_execution_logs: {
        Row: DbFormulaExecutionLog;
        Insert: Omit<DbFormulaExecutionLog, 'id' | 'created_at'>;
        Update: never;
        Relationships: [];
      };
      iso_audit_findings: {
        Row: DbIsoAuditFinding;
        Insert: Omit<DbIsoAuditFinding, 'id' | 'created_at' | 'audited_at'>;
        Update: Partial<Omit<DbIsoAuditFinding, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      purchase_orders: {
        Row: DbPurchaseOrder;
        Insert: Omit<DbPurchaseOrder, 'id' | 'created_at' | 'received_at'>;
        Update: Partial<Omit<DbPurchaseOrder, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      patient_access_tokens: {
        Row: DbPatientAccessToken;
        Insert: Omit<DbPatientAccessToken, 'id'>;
        Update: Partial<Omit<DbPatientAccessToken, 'id' | 'tenant_id'>>;
        Relationships: [];
      };
      asset_categories: {
        Row: DbAssetCategory;
        Insert: Omit<DbAssetCategory, 'id'>;
        Update: Partial<Omit<DbAssetCategory, 'id' | 'tenant_id'>>;
        Relationships: [];
      };
      fixed_assets: {
        Row: DbFixedAsset;
        Insert: Omit<DbFixedAsset, 'id' | 'created_at'>;
        Update: Partial<Omit<DbFixedAsset, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      appointments: {
        Row: DbAppointment;
        Insert: Omit<DbAppointment, 'id' | 'created_at'>;
        Update: Partial<Omit<DbAppointment, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      waste_categories: {
        Row: DbWasteCategory;
        Insert: Omit<DbWasteCategory, 'id'>;
        Update: Partial<Omit<DbWasteCategory, 'id' | 'tenant_id'>>;
        Relationships: [];
      };
      biohazard_waste_logs: {
        Row: DbBiohazardWasteLog;
        Insert: Omit<DbBiohazardWasteLog, 'id' | 'created_at'>;
        Update: Partial<Omit<DbBiohazardWasteLog, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      biohazard_pickups: {
        Row: DbBiohazardPickup;
        Insert: Omit<DbBiohazardPickup, 'id' | 'pickup_date'>;
        Update: Partial<Omit<DbBiohazardPickup, 'id' | 'tenant_id' | 'pickup_date'>>;
        Relationships: [];
      };
      cold_chain_devices: {
        Row: DbColdChainDevice;
        Insert: Omit<DbColdChainDevice, 'id' | 'created_at' | 'last_reading_temp' | 'status'>;
        Update: Partial<Omit<DbColdChainDevice, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      cold_chain_readings: {
        Row: DbColdChainReading;
        Insert: Omit<DbColdChainReading, 'id' | 'recorded_at'>;
        Update: never;
        Relationships: [];
      };
      quality_incidents: {
        Row: DbQualityIncident;
        Insert: Omit<DbQualityIncident, 'id' | 'created_at' | 'closed_at'>;
        Update: Partial<Omit<DbQualityIncident, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      business_opportunities: {
        Row: DbBusinessOpportunity;
        Insert: Omit<DbBusinessOpportunity, 'id' | 'created_at'>;
        Update: Partial<Omit<DbBusinessOpportunity, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      epidemiological_markers: {
        Row: DbEpidemiologicalMarker;
        Insert: Omit<DbEpidemiologicalMarker, 'id' | 'created_at'>;
        Update: Partial<Omit<DbEpidemiologicalMarker, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      epidemiological_reports: {
        Row: DbEpidemiologicalReport;
        Insert: Omit<DbEpidemiologicalReport, 'id' | 'created_at' | 'submitted_at' | 'submitted_by'>;
        Update: Partial<Omit<DbEpidemiologicalReport, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      equipment_insurances: {
        Row: DbEquipmentInsurance;
        Insert: Omit<DbEquipmentInsurance, 'id' | 'created_at'>;
        Update: Partial<Omit<DbEquipmentInsurance, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      equipment_warranties: {
        Row: DbEquipmentWarranty;
        Insert: Omit<DbEquipmentWarranty, 'id' | 'created_at'>;
        Update: Partial<Omit<DbEquipmentWarranty, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      staff_competencies: {
        Row: DbStaffCompetency;
        Insert: Omit<DbStaffCompetency, 'id' | 'created_at'>;
        Update: Partial<Omit<DbStaffCompetency, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      staff_training_logs: {
        Row: DbStaffTrainingLog;
        Insert: Omit<DbStaffTrainingLog, 'id' | 'created_at'>;
        Update: Partial<Omit<DbStaffTrainingLog, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      middleware_raw_frames: {
        Row: DbMiddlewareRawFrame;
        Insert: Omit<DbMiddlewareRawFrame, 'id' | 'created_at'>;
        Update: Partial<Omit<DbMiddlewareRawFrame, 'id' | 'tenant_id' | 'created_at'>>;
        Relationships: [];
      };
      clinical_critical_alerts: {
        Row: DbClinicalCriticalAlert;
        Insert: Omit<DbClinicalCriticalAlert, 'id' | 'detected_at'>;
        Update: Partial<Omit<DbClinicalCriticalAlert, 'id' | 'tenant_id' | 'detected_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role: DbRole;
      plan: DbPlan;
      gender: DbGender;
      result_flag: DbResultFlag;
      result_status: DbResultStatus;
    };
  };
};
