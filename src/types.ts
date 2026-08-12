export type Role = 
  | 'owner'            // Dueño / Gerente de laboratorio
  | 'lab_chief'        // Jefe de laboratorio
  | 'tech_med'         // Tecnólogo médico
  | 'lab_tech'         // Técnico de laboratorio
  | 'receptionist'     // Recepcionista
  | 'ext_doctor'       // Médico referente
  | 'patient'          // Cliente / Paciente
  | 'abregotech_admin';// Súper-Admin AbregoTech

export interface Tenant {
  id: string;
  name: string;
  ruc: string;
  dv: string;
  plan: 'Basic' | 'Pro' | 'Enterprise';
  branches: Branch[];
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address: string;
  phone: string;
}

export interface User {
  id: string;
  tenantId: string;
  branchId?: string;
  name: string;
  email: string;
  role: Role;
  licenseNumber?: string; // Idoneidad médica / tecnólogo
  signatureUrl?: string;
  password?: string;
  pinCode?: string;
  twoFactorEnabled?: boolean;
}

export interface Patient {
  id: string;
  tenantId: string;
  nationalId: string; // Cédula (ej. 8-123-4567) o Pasaporte
  idType: 'CEDULA' | 'PASAPORTE' | 'CARNET';
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'M' | 'F';
  phone: string;
  email: string;
  address: string;
  nationality?: string;
  insuranceProvider?: string;
  weight?: string;
  height?: string;
  bloodType?: string;
  dataConsentLey81: boolean; // Consentimiento Ley 81 de Panamá
  consentDate?: string;
}

export interface Doctor {
  id: string;
  tenantId: string;
  name: string;
  specialty: string;
  licenseNumber: string; // Idoneidad
  clinic: string;
  email: string;
}

export type Priority = 'RUTINA' | 'STAT' | 'URGENTE';
export type OrderStatus = 'REGISTRADA' | 'TOMADA' | 'EN_PROCESO' | 'VALIDADA_TEC' | 'VALIDADA_MED' | 'COMPLETADA' | 'CANCELADA';

export interface TestCatalogItem {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  category: 'HEMATOLOGIA' | 'QUIMICA' | 'INMUNOLOGIA' | 'URINALISIS' | 'MICROBIOLOGIA' | 'COAGULACION';
  tubeType: 'EDTA_MORADO' | 'SUERO_ROJO' | 'CITRATO_AZUL' | 'ORINA' | 'HEPARINA_VERDE';
  price: number;
  specimenType: string;
  tatHours: number;
  astmMappingCode?: string; // Código de mapeo en el analizador (ej. "GLU_101")
  hl7MappingCode?: string;
  parameters: TestParameter[];
}

export interface TestParameter {
  id: string;
  testId: string;
  name: string;
  unit: string;
  astmParamCode: string; // e.g., "WBC", "RBC", "GLU"
  refMinMale?: number;
  refMaxMale?: number;
  refMinFemale?: number;
  refMaxFemale?: number;
  criticalMin?: number;
  criticalMax?: number;
}

export interface Order {
  id: string;
  tenantId: string;
  branchId: string;
  orderNumber: string; // e.g. ORD-2026-00102
  patientId: string;
  patientName: string;
  patientNationalId: string;
  patientGender: 'M' | 'F';
  patientAge: number;
  doctorId?: string;
  doctorName?: string;
  priority: Priority;
  status: OrderStatus;
  createdAt: string;
  totalAmount: number;
  paymentStatus: 'PAGADO' | 'PENDIENTE' | 'ASEGURADORA';
  insuranceName?: string;
  specimens: Specimen[];
  testIds: string[];
}

export interface Specimen {
  id: string;
  orderId: string;
  barcode: string; // e.g. BC-8823101
  tubeType: string;
  collectedAt?: string;
  collectedBy?: string;
  status: 'PENDIENTE' | 'RECEPTADA' | 'EN_ANALIZADOR' | 'DESECHADA';
}

export interface TestResult {
  id: string;
  tenantId: string;
  orderId: string;
  testId: string;
  parameterId: string;
  parameterName: string;
  unit: string;
  value: string;
  numericValue?: number;
  flag?: 'NORMAL' | 'ALTO' | 'BAJO' | 'CRITICO_ALTO' | 'CRITICO_BAJO';
  refRangeText: string;
  source: 'MANUAL' | 'MIDDLEWARE_ASTM' | 'MIDDLEWARE_HL7';
  analyzerName?: string;
  technicalValidatedBy?: string;
  technicalValidatedAt?: string;
  medicalValidatedBy?: string;
  medicalValidatedAt?: string;
  status: 'PENDIENTE' | 'INGRESADO' | 'VALIDADO_TEC' | 'VALIDADO_MED' | 'DESVALIDADO';
  interpretation?: string; // Comentario clínico o interpretación
  specimenType?: string;   // Tipo de muestra (Sangre, Orina, etc)
}

export interface Analyzer {
  id: string;
  tenantId: string;
  branchId: string;
  name: string; // e.g. "Sysmex XN-1000", "Vitros 4600"
  model: string;
  protocol: 'ASTM_E1381' | 'HL7_V2';
  connectionType: 'TCP_IP' | 'RS232_SERIAL';
  ipAddress?: string;
  port?: number;
  comPort?: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR' | 'PROCESSING';
  lastPing: string;
  driverId: string; // e.g. "sysmex-xn", "vitros-4600", "mindray-bc5000"
}

export interface MiddlewareMessageLog {
  id: string;
  tenantId: string;
  analyzerId: string;
  analyzerName: string;
  protocol: string;
  direction: 'INBOUND' | 'OUTBOUND';
  rawPayload: string; // Frame ASTM o HL7
  parsedData?: any;
  status: 'PROCESADO' | 'ERROR_PARSER' | 'ORDEN_NO_ENCONTRADA' | 'PENDIENTE';
  errorMessage?: string;
  timestamp: string;
}

export interface WestgardQCControl {
  id: string;
  tenantId: string;
  analyzerId: string;
  testName: string;
  lotNumber: string;
  targetMean: number;
  standardDeviation: number;
  runs: {
    id: string;
    date: string;
    value: number;
    violation?: string; // e.g., "1-2s", "1-3s", "2-2s", "R-4s"
    status: 'PASS' | 'WARN' | 'FAIL';
  }[];
}

export interface ReagentInventory {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  lotNumber: string;
  expirationDate: string;
  quantityRemaining: number;
  unit: string;
  testsPerUnit: number;
  minAlertThreshold: number;
  associatedTest: string;
  manufacturer?: string;
  storageTemp?: string;
}

export interface ReferenceRange {
  id: string;
  gender: 'Ambos' | 'Masculino' | 'Femenino';
  minAgeYears?: number;
  maxAgeYears?: number;
  minValue: number;
  maxValue: number;
  panicLowValue?: number;
  panicHighValue?: number;
  unit: string;
  interpretation?: string; // ej. "Adultos Sanos", "Pediátrico"
}

export interface AnalyzerTestMapping {
  id: string;
  tenantId: string;
  analyzerId: string;
  analyzerName: string;
  lisTestCode: string;           // Código de prueba LIS (ej. "GLU", "HEM", "CREA")
  lisTestName: string;           // Nombre descriptivo (ej. "Glucosa en Ayunas")
  astmAnalyzerCode: string;      // Código exacto según manual ASTM/HL7 (ej. "Glu-Hexo-123")
  sampleType: string;            // Tipo de muestra (ej. "Suero", "Sangre Total EDTA")
  multiplierFactor: number;      // Factor de conversión (ej. 1.0)
  unit: string;                  // Unidad (ej. "mg/dL")
  referenceRanges?: ReferenceRange[]; // Límites de referencia por sexo/edad
  isActive: boolean;
  notes?: string;
  updatedAt: string;
  updatedBy: string;
}
