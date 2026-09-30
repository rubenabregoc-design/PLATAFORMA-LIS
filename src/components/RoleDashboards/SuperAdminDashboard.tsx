import React, { useState, useEffect, useMemo } from 'react';
import { Tenant, Analyzer, MiddlewareMessageLog, User, Role, Branch } from '../../types';
import { useLisStore } from '../../store/useLisStore';
import { MOCK_USERS, MOCK_TEST_CATALOG } from '../../data/mockData';
import { validateEthicalPin, generateSecurePin } from '../../utils/securityHarden';
import {
  Shield, Building2, Cpu, Activity, Plus, Server, CheckCircle2,
  AlertTriangle, Layers, Award, Globe, ExternalLink, Copy, Check, QrCode,
  Stethoscope, Users, UserPlus, Key, Lock, Mail, ShieldCheck, Database,
  CheckCheck, Trash2, Edit3, HeartPulse, Droplets, Thermometer, TestTube,
  Microscope, Sliders, Settings, Filter, Search, RefreshCw, Radio, Phone,
  MapPin, Clock, ArrowRight, Sparkles, FileText, ChevronRight, X,
  Upload, Download, FileSpreadsheet
} from 'lucide-react';

interface SuperAdminDashboardProps {
  tenants: Tenant[];
  analyzers: Analyzer[];
  logs: MiddlewareMessageLog[];
  onProvisionTenant: (name: string, ruc: string, dv: string, plan: Tenant['plan']) => void;
  onUpdateTenants?: (tenants: Tenant[]) => void;
}

// Interfaces para Configuración Integral LIS, HIS y Banco de Sangre
interface CustomReferenceTest {
  id: string;
  code: string;
  loincCode: string;
  name: string;
  department: string;
  unit: string;
  tubeType: string;
  minMale: number;
  maxMale: number;
  minFemale: number;
  maxFemale: number;
  minGeneral?: number;
  maxGeneral?: number;
  panicLow?: number;
  panicHigh?: number;
  panicAction?: string;
}

interface HisBedItem {
  id: string;
  code: string;
  roomNumber: string;
  department: 'Urgencias' | 'UCI Adultos' | 'UCI Pediátrica' | 'Cirugía' | 'Maternidad' | 'Hospitalización';
  bedType: string;
  floor: string;
  status: 'DISPONIBLE' | 'OCUPADA' | 'DESINFECCION' | 'MANTENIMIENTO';
  patientName?: string;
}

interface BloodComponentRule {
  id: string;
  name: string;
  code: string;
  shelfLifeDays: number;
  tempRange: string;
  minStockThreshold: number;
  currentStock: number;
  agitationRequired: boolean;
}

interface BloodIotFreezer {
  id: string;
  name: string;
  serialNumber: string;
  currentTemp: number;
  setpointTemp: number;
  minAlarmTemp: number;
  maxAlarmTemp: number;
  status: 'NORMAL' | 'ALERTA' | 'CRITICO';
}

const ROLE_METADATA: Record<string, { label: string; color: string; icon: string }> = {
  owner: { label: 'Directora / Gerencia', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: '👑' },
  lab_chief: { label: 'Jefe de Laboratorio', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', icon: '🔬' },
  tech_med: { label: 'Tecnólogo Médico', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: '🧪' },
  lab_tech: { label: 'Técnico Flebotomista', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40', icon: '💉' },
  receptionist: { label: 'Recepción & Admisión', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: '📋' },
  ext_doctor: { label: 'Médico Externo / Remitente', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', icon: '🩺' },
  patient: { label: 'Portal Paciente', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: '👤' },
  abregotech_admin: { label: 'Súper-Admin General', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', icon: '⚡' },
};

const DEFAULT_REFERENCE_TESTS: CustomReferenceTest[] = [
  {
    "id": "test-hb",
    "code": "HEM-001-HB",
    "loincCode": "718-7",
    "name": "Hemoglobina (Hb)",
    "department": "Hematología",
    "unit": "g/dL",
    "tubeType": "Tubo Lila K2-EDTA",
    "minMale": 13.5,
    "maxMale": 17.5,
    "minFemale": 12,
    "maxFemale": 15.5,
    "panicLow": 6.5,
    "panicHigh": 20,
    "panicAction": "Notificación de urgencia crítica + Verificación de coágulo en tubo"
  },
  {
    "id": "test-hct",
    "code": "HEM-002-HCT",
    "loincCode": "4544-3",
    "name": "Hematocrito (Hct)",
    "department": "Hematología",
    "unit": "%",
    "tubeType": "Tubo Lila K2-EDTA",
    "minMale": 41,
    "maxMale": 50,
    "minFemale": 36,
    "maxFemale": 45,
    "panicLow": 20,
    "panicHigh": 60,
    "panicAction": "Alerta de choque hipovolémico severo o policitemia absoluta"
  },
  {
    "id": "test-leuco",
    "code": "HEM-003-WBC",
    "loincCode": "6690-2",
    "name": "Leucocitos Totales (WBC)",
    "department": "Hematología",
    "unit": "x10³/µL",
    "tubeType": "Tubo Lila K2-EDTA",
    "minMale": 4.5,
    "maxMale": 11,
    "minFemale": 4.5,
    "maxFemale": 11,
    "panicLow": 2,
    "panicHigh": 30,
    "panicAction": "Alerta de neutropenia febril o reacción leucemoide / blastos"
  },
  {
    "id": "test-plaq",
    "code": "HEM-004-PLT",
    "loincCode": "777-3",
    "name": "Recuento de Plaquetas (PLT)",
    "department": "Hematología",
    "unit": "x10³/µL",
    "tubeType": "Tubo Lila K2-EDTA",
    "minMale": 150,
    "maxMale": 450,
    "minFemale": 150,
    "maxFemale": 450,
    "panicLow": 20,
    "panicHigh": 1000,
    "panicAction": "Riesgo inminente de hemorragia espontánea. Notificar a banco de sangre"
  },
  {
    "id": "test-vcm",
    "code": "HEM-005-VCM",
    "loincCode": "787-2",
    "name": "Volumen Corpuscular Medio (VCM)",
    "department": "Hematología",
    "unit": "fL",
    "tubeType": "Tubo Lila K2-EDTA",
    "minMale": 80,
    "maxMale": 98,
    "minFemale": 80,
    "maxFemale": 98,
    "panicLow": 60,
    "panicHigh": 120,
    "panicAction": "Revisión morfológica obligatoria en frotis de sangre periférica"
  },
  {
    "id": "test-neut",
    "code": "HEM-006-NEUT",
    "loincCode": "751-8",
    "name": "Neutrófilos Absolutos (ANC)",
    "department": "Hematología",
    "unit": "x10³/µL",
    "tubeType": "Tubo Lila K2-EDTA",
    "minMale": 1.8,
    "maxMale": 7.5,
    "minFemale": 1.8,
    "maxFemale": 7.5,
    "panicLow": 0.5,
    "panicHigh": 20,
    "panicAction": "CRÍTICO: Neutropenia severa / Activar aislamiento protector de inmediato"
  },
  {
    "id": "test-vsg",
    "code": "HEM-007-VSG",
    "loincCode": "30341-2",
    "name": "Velocidad de Sedimentación Globular (VSG)",
    "department": "Hematología",
    "unit": "mm/h",
    "tubeType": "Tubo Negro Citrato 4:1 / EDTA",
    "minMale": 0,
    "maxMale": 15,
    "minFemale": 0,
    "maxFemale": 20,
    "panicLow": 0,
    "panicHigh": 100,
    "panicAction": "Sospecha de arteritis de células gigantes, mieloma múltiple o sepsis"
  },
  {
    "id": "test-tp",
    "code": "COA-001-TP",
    "loincCode": "5902-2",
    "name": "Tiempo de Protrombina (TP)",
    "department": "Coagulación",
    "unit": "seg",
    "tubeType": "Tubo Celeste Citrato 3.2%",
    "minMale": 11,
    "maxMale": 13.5,
    "minFemale": 11,
    "maxFemale": 13.5,
    "panicLow": 9,
    "panicHigh": 35,
    "panicAction": "Riesgo hemorrágico severo. Verificar estado de anticoagulación oral"
  },
  {
    "id": "test-inr",
    "code": "COA-002-INR",
    "loincCode": "6301-6",
    "name": "Razón Internacional Normalizada (INR)",
    "department": "Coagulación",
    "unit": "INR",
    "tubeType": "Tubo Celeste Citrato 3.2%",
    "minMale": 0.8,
    "maxMale": 1.2,
    "minFemale": 0.8,
    "maxFemale": 1.2,
    "panicLow": 0.5,
    "panicHigh": 5,
    "panicAction": "Alerta de sobreanticoagulación con warfarina. Valorar vitamina K / PFC"
  },
  {
    "id": "test-tpt",
    "code": "COA-003-TPT",
    "loincCode": "3173-2",
    "name": "Tiempo de Tromboplastina Parcial Activada (TTPa)",
    "department": "Coagulación",
    "unit": "seg",
    "tubeType": "Tubo Celeste Citrato 3.2%",
    "minMale": 25,
    "maxMale": 35,
    "minFemale": 25,
    "maxFemale": 35,
    "panicLow": 18,
    "panicHigh": 80,
    "panicAction": "Prolongación crítica: riesgo quirúrgico alto o sobredosis de heparina"
  },
  {
    "id": "test-fib",
    "code": "COA-004-FIB",
    "loincCode": "3255-7",
    "name": "Fibrinógeno Derivado (Clauss)",
    "department": "Coagulación",
    "unit": "mg/dL",
    "tubeType": "Tubo Celeste Citrato 3.2%",
    "minMale": 200,
    "maxMale": 400,
    "minFemale": 200,
    "maxFemale": 400,
    "panicLow": 100,
    "panicHigh": 700,
    "panicAction": "Sospecha inminente de Coagulación Intravascular Diseminada (CID)"
  },
  {
    "id": "test-dd",
    "code": "COA-005-DD",
    "loincCode": "48065-7",
    "name": "Dímero D Cuantitativo",
    "department": "Coagulación",
    "unit": "ng/mL FEU",
    "tubeType": "Tubo Celeste Citrato 3.2%",
    "minMale": 0,
    "maxMale": 500,
    "minFemale": 0,
    "maxFemale": 500,
    "panicLow": 0,
    "panicHigh": 2000,
    "panicAction": "Sospecha de Tromboembolismo Pulmonar (TEP) o Trombosis Venosa Profunda"
  },
  {
    "id": "test-glu",
    "code": "QCL-001-GLU",
    "loincCode": "1558-6",
    "name": "Glucosa Sérica en Ayunas",
    "department": "Química Clínica",
    "unit": "mg/dL",
    "tubeType": "Suero Gel Oro / SST Amarillo",
    "minMale": 70,
    "maxMale": 99,
    "minFemale": 70,
    "maxFemale": 99,
    "panicLow": 45,
    "panicHigh": 400,
    "panicAction": "Crisis hipoglucémica o Cetoacidosis. Aviso inmediato al médico en < 5 min"
  },
  {
    "id": "test-hba1c",
    "code": "QCL-002-HBA1C",
    "loincCode": "4548-4",
    "name": "Hemoglobina Glicosilada (HbA1c)",
    "department": "Química Clínica",
    "unit": "%",
    "tubeType": "Tubo Lila K2-EDTA",
    "minMale": 4,
    "maxMale": 5.6,
    "minFemale": 4,
    "maxFemale": 5.6,
    "panicLow": 3.5,
    "panicHigh": 14,
    "panicAction": "Descontrol glucémico extremo. Valorar ingreso endocrinológico"
  },
  {
    "id": "test-crea",
    "code": "QCL-003-CREA",
    "loincCode": "2160-0",
    "name": "Creatinina Sérica (Jaffé IDMS)",
    "department": "Química Clínica",
    "unit": "mg/dL",
    "tubeType": "Suero Gel Oro / Heparina",
    "minMale": 0.7,
    "maxMale": 1.3,
    "minFemale": 0.5,
    "maxFemale": 1.1,
    "panicLow": 0.3,
    "panicHigh": 5,
    "panicAction": "Injuria Renal Aguda KDIGO 3. Notificar a nefrología inmediatamente"
  },
  {
    "id": "test-bun",
    "code": "QCL-004-BUN",
    "loincCode": "3094-0",
    "name": "Nitrógeno Ureico en Sangre (BUN)",
    "department": "Química Clínica",
    "unit": "mg/dL",
    "tubeType": "Suero Gel Oro / SST Amarillo",
    "minMale": 7,
    "maxMale": 20,
    "minFemale": 7,
    "maxFemale": 20,
    "panicLow": 3,
    "panicHigh": 80,
    "panicAction": "Uremia severa o sospecha de hemorragia digestiva alta masiva"
  },
  {
    "id": "test-acu",
    "code": "QCL-005-ACU",
    "loincCode": "3084-1",
    "name": "Ácido Úrico Sérico",
    "department": "Química Clínica",
    "unit": "mg/dL",
    "tubeType": "Suero Gel Oro / SST Amarillo",
    "minMale": 3.5,
    "maxMale": 7.2,
    "minFemale": 2.6,
    "maxFemale": 6,
    "panicLow": 1.5,
    "panicHigh": 12,
    "panicAction": "Riesgo de nefropatía por cristales de urato o síndrome de lisis tumoral"
  },
  {
    "id": "test-pt",
    "code": "QCL-006-PT",
    "loincCode": "2885-2",
    "name": "Proteínas Totales Séricas",
    "department": "Química Clínica",
    "unit": "g/dL",
    "tubeType": "Suero Gel Oro / SST Amarillo",
    "minMale": 6.4,
    "maxMale": 8.3,
    "minFemale": 6.4,
    "maxFemale": 8.3,
    "panicLow": 4,
    "panicHigh": 11,
    "panicAction": "Desnutrición extrema, síndrome nefrótico o sospecha de mieloma múltiple"
  },
  {
    "id": "test-bt",
    "code": "HEP-001-BT",
    "loincCode": "1975-2",
    "name": "Bilirrubina Total",
    "department": "Perfil Hepático",
    "unit": "mg/dL",
    "tubeType": "Suero Protegido de la Luz",
    "minMale": 0.2,
    "maxMale": 1.2,
    "minFemale": 0.2,
    "maxFemale": 1.2,
    "panicLow": 0.1,
    "panicHigh": 15,
    "panicAction": "Hiperbilirrubinemia severa / Ictericia obstructiva o hemolítica masiva"
  },
  {
    "id": "test-bd",
    "code": "HEP-002-BD",
    "loincCode": "1968-7",
    "name": "Bilirrubina Directa (Conjugada)",
    "department": "Perfil Hepático",
    "unit": "mg/dL",
    "tubeType": "Suero Protegido de la Luz",
    "minMale": 0,
    "maxMale": 0.3,
    "minFemale": 0,
    "maxFemale": 0.3,
    "panicLow": 0,
    "panicHigh": 8,
    "panicAction": "Colestasis intrahepática o extrahepática grave. Evaluar vía biliar"
  },
  {
    "id": "test-ast",
    "code": "HEP-003-AST",
    "loincCode": "1920-8",
    "name": "AST / Aspartato Aminotransferasa (TGO)",
    "department": "Perfil Hepático",
    "unit": "U/L",
    "tubeType": "Suero Libre de Hemólisis",
    "minMale": 10,
    "maxMale": 40,
    "minFemale": 9,
    "maxFemale": 32,
    "panicLow": 5,
    "panicHigh": 500,
    "panicAction": "Falla hepática fulminante o hepatitis tóxica/isquémica aguda"
  },
  {
    "id": "test-alt",
    "code": "HEP-004-ALT",
    "loincCode": "1742-6",
    "name": "ALT / Alanina Aminotransferasa (TGP)",
    "department": "Perfil Hepático",
    "unit": "U/L",
    "tubeType": "Suero Libre de Hemólisis",
    "minMale": 10,
    "maxMale": 45,
    "minFemale": 7,
    "maxFemale": 35,
    "panicLow": 5,
    "panicHigh": 500,
    "panicAction": "Citólisis hepática severa. Contactar urgentemente con hepatología"
  },
  {
    "id": "test-alp",
    "code": "HEP-005-ALP",
    "loincCode": "6768-6",
    "name": "Fosfatasa Alcalina (ALP)",
    "department": "Perfil Hepático",
    "unit": "U/L",
    "tubeType": "Suero Gel Oro / SST Amarillo",
    "minMale": 40,
    "maxMale": 130,
    "minFemale": 35,
    "maxFemale": 105,
    "panicLow": 20,
    "panicHigh": 600,
    "panicAction": "Obstrucción biliar aguda o patología ósea de alto recambio"
  },
  {
    "id": "test-ggt",
    "code": "HEP-006-GGT",
    "loincCode": "2324-2",
    "name": "Gamma-Glutamil Transferasa (GGT)",
    "department": "Perfil Hepático",
    "unit": "U/L",
    "tubeType": "Suero Gel Oro / SST Amarillo",
    "minMale": 10,
    "maxMale": 55,
    "minFemale": 8,
    "maxFemale": 38,
    "panicLow": 5,
    "panicHigh": 400,
    "panicAction": "Afectación colestásica profunda o toxicidad alcohólica aguda"
  },
  {
    "id": "test-alb",
    "code": "HEP-007-ALB",
    "loincCode": "1751-7",
    "name": "Albúmina Sérica",
    "department": "Perfil Hepático",
    "unit": "g/dL",
    "tubeType": "Suero Gel Oro / SST Amarillo",
    "minMale": 3.5,
    "maxMale": 5,
    "minFemale": 3.5,
    "maxFemale": 5,
    "panicLow": 1.8,
    "panicHigh": 6,
    "panicAction": "Hipoalbuminemia crítica: riesgo de edema pulmonar y tercer espacio"
  },
  {
    "id": "test-col",
    "code": "LIP-001-COL",
    "loincCode": "2093-3",
    "name": "Colesterol Total",
    "department": "Perfil Lipídico",
    "unit": "mg/dL",
    "tubeType": "Suero Gel Oro en Ayunas",
    "minMale": 120,
    "maxMale": 200,
    "minFemale": 120,
    "maxFemale": 200,
    "panicLow": 80,
    "panicHigh": 400,
    "panicAction": "Dislipidemia severa o sospecha de hipercolesterolemia familiar"
  },
  {
    "id": "test-trig",
    "code": "LIP-002-TRIG",
    "loincCode": "2571-8",
    "name": "Triglicéridos Séricos",
    "department": "Perfil Lipídico",
    "unit": "mg/dL",
    "tubeType": "Suero Gel Oro en Ayunas",
    "minMale": 40,
    "maxMale": 150,
    "minFemale": 35,
    "maxFemale": 140,
    "panicLow": 30,
    "panicHigh": 1000,
    "panicAction": "RIESGO INMINENTE DE PANCREATITIS AGUDA INDUCIDA POR HIPERTRIGLICERIDEMIA"
  },
  {
    "id": "test-hdl",
    "code": "LIP-003-HDL",
    "loincCode": "2085-9",
    "name": "Colesterol HDL (Alta Densidad)",
    "department": "Perfil Lipídico",
    "unit": "mg/dL",
    "tubeType": "Suero Gel Oro",
    "minMale": 40,
    "maxMale": 60,
    "minFemale": 50,
    "maxFemale": 70,
    "panicLow": 15,
    "panicHigh": 110,
    "panicAction": "Riesgo cardiovascular aterogénico elevado"
  },
  {
    "id": "test-ldl",
    "code": "LIP-004-LDL",
    "loincCode": "13457-7",
    "name": "Colesterol LDL Calculado (Friedewald)",
    "department": "Perfil Lipídico",
    "unit": "mg/dL",
    "tubeType": "Suero Gel Oro",
    "minMale": 60,
    "maxMale": 130,
    "minFemale": 60,
    "maxFemale": 130,
    "panicLow": 30,
    "panicHigh": 250,
    "panicAction": "Aterogénesis avanzada: recomendación de estatinas de alta potencia"
  },
  {
    "id": "test-vldl",
    "code": "LIP-005-VLDL",
    "loincCode": "13458-5",
    "name": "Colesterol VLDL",
    "department": "Perfil Lipídico",
    "unit": "mg/dL",
    "tubeType": "Suero Gel Oro",
    "minMale": 5,
    "maxMale": 30,
    "minFemale": 5,
    "maxFemale": 30,
    "panicLow": 2,
    "panicHigh": 80,
    "panicAction": "Alteración severa del metabolismo de partículas aterogénicas ricas en triglicéridos"
  },
  {
    "id": "test-na",
    "code": "ELE-001-NA",
    "loincCode": "2951-2",
    "name": "Sodio Sérico (Na+)",
    "department": "Electrolitos",
    "unit": "mmol/L",
    "tubeType": "Suero Libre de Hemólisis",
    "minMale": 135,
    "maxMale": 145,
    "minFemale": 135,
    "maxFemale": 145,
    "panicLow": 120,
    "panicHigh": 160,
    "panicAction": "Emergencia neurológica crítica: riesgo inminente de edema cerebral o mielinólisis"
  },
  {
    "id": "test-k",
    "code": "ELE-002-K",
    "loincCode": "2823-3",
    "name": "Potasio Sérico (K+)",
    "department": "Electrolitos",
    "unit": "mmol/L",
    "tubeType": "Suero Libre de Hemólisis",
    "minMale": 3.5,
    "maxMale": 5.1,
    "minFemale": 3.5,
    "maxFemale": 5.1,
    "panicLow": 2.8,
    "panicHigh": 6.2,
    "panicAction": "RIESGO INMINENTE DE PARO CARDÍACO POR ARRITMIA / FIBRILACIÓN VENTRICULAR"
  },
  {
    "id": "test-cl",
    "code": "ELE-003-CL",
    "loincCode": "2075-0",
    "name": "Cloro Sérico (Cl-)",
    "department": "Electrolitos",
    "unit": "mmol/L",
    "tubeType": "Suero Gel Oro",
    "minMale": 98,
    "maxMale": 107,
    "minFemale": 98,
    "maxFemale": 107,
    "panicLow": 80,
    "panicHigh": 125,
    "panicAction": "Trastorno ácido-base severo o deshidratación hipernatrémica grave"
  },
  {
    "id": "test-ca",
    "code": "ELE-004-CA",
    "loincCode": "17861-6",
    "name": "Calcio Total Sérico",
    "department": "Electrolitos",
    "unit": "mg/dL",
    "tubeType": "Suero Gel Oro",
    "minMale": 8.5,
    "maxMale": 10.2,
    "minFemale": 8.5,
    "maxFemale": 10.2,
    "panicLow": 6.5,
    "panicHigh": 13,
    "panicAction": "Riesgo de tetania, laringoespasmo o crisis hipercalcémica con coma"
  },
  {
    "id": "test-mg",
    "code": "ELE-005-MG",
    "loincCode": "2601-3",
    "name": "Magnesio Sérico (Mg++)",
    "department": "Electrolitos",
    "unit": "mg/dL",
    "tubeType": "Suero Libre de Hemólisis",
    "minMale": 1.7,
    "maxMale": 2.4,
    "minFemale": 1.7,
    "maxFemale": 2.4,
    "panicLow": 1,
    "panicHigh": 4.5,
    "panicAction": "Riesgo de arritmias ventriculares (Torsades de Pointes) o bloqueo cardíaco"
  },
  {
    "id": "test-p",
    "code": "ELE-006-P",
    "loincCode": "2777-1",
    "name": "Fósforo Inorgánico",
    "department": "Electrolitos",
    "unit": "mg/dL",
    "tubeType": "Suero Gel Oro en Ayunas",
    "minMale": 2.5,
    "maxMale": 4.5,
    "minFemale": 2.5,
    "maxFemale": 4.5,
    "panicLow": 1,
    "panicHigh": 7.5,
    "panicAction": "Síndrome de realimentación aguda o insuficiencia renal terminal avanzada"
  },
  {
    "id": "test-troponin",
    "code": "CARD-001-TNI",
    "loincCode": "42757-5",
    "name": "Troponina I de Alta Sensibilidad (hs-cTnI)",
    "department": "Marcadores Cardíacos",
    "unit": "ng/L",
    "tubeType": "Plasma Heparina / Suero",
    "minMale": 0,
    "maxMale": 34,
    "minFemale": 0,
    "maxFemale": 16,
    "panicLow": 0,
    "panicHigh": 100,
    "panicAction": "PROTOCOLO CÓDIGO INFARTO: Notificación prioritaria < 3 min a cardiología / urgencias"
  },
  {
    "id": "test-ckmb",
    "code": "CARD-002-CKMB",
    "loincCode": "13969-1",
    "name": "CK-MB Masa Cuantitativa",
    "department": "Marcadores Cardíacos",
    "unit": "ng/mL",
    "tubeType": "Suero / Plasma Heparina",
    "minMale": 0,
    "maxMale": 5,
    "minFemale": 0,
    "maxFemale": 3.8,
    "panicLow": 0,
    "panicHigh": 25,
    "panicAction": "Marcador de reinfarto agudo de miocardio o daño miocárdico en evolución"
  },
  {
    "id": "test-bnp",
    "code": "CARD-003-BNP",
    "loincCode": "33762-6",
    "name": "NT-proBNP Péptido Natriurético",
    "department": "Marcadores Cardíacos",
    "unit": "pg/mL",
    "tubeType": "Suero / Plasma EDTA",
    "minMale": 0,
    "maxMale": 125,
    "minFemale": 0,
    "maxFemale": 125,
    "panicLow": 0,
    "panicHigh": 1800,
    "panicAction": "Insuficiencia Cardíaca Congestiva Aguda Descompensada"
  },
  {
    "id": "test-pct",
    "code": "CARD-004-PCT",
    "loincCode": "33959-8",
    "name": "Procalcitonina Cuantitativa (PCT)",
    "department": "Marcadores Cardíacos",
    "unit": "ng/mL",
    "tubeType": "Suero Gel Oro",
    "minMale": 0,
    "maxMale": 0.05,
    "minFemale": 0,
    "maxFemale": 0.05,
    "panicLow": 0,
    "panicHigh": 2,
    "panicAction": "Alerta de Sepsis / Choque Séptico bacteriano y riesgo de fallo multiorgánico"
  },
  {
    "id": "test-pcrus",
    "code": "CARD-005-PCRUS",
    "loincCode": "30522-7",
    "name": "Proteína C Reactiva Ultrasensible (hs-CRP)",
    "department": "Marcadores Cardíacos",
    "unit": "mg/L",
    "tubeType": "Suero Gel Oro",
    "minMale": 0,
    "maxMale": 3,
    "minFemale": 0,
    "maxFemale": 3,
    "panicLow": 0,
    "panicHigh": 50,
    "panicAction": "Proceso inflamatorio sistémico hiperagudo o bacteriemia invasiva"
  },
  {
    "id": "test-tsh",
    "code": "ENDO-001-TSH",
    "loincCode": "3016-3",
    "name": "TSH Ultrasensible 3ra Gen",
    "department": "Endocrinología",
    "unit": "µUI/mL",
    "tubeType": "Suero Gel Oro / SST Amarillo",
    "minMale": 0.4,
    "maxMale": 4.2,
    "minFemale": 0.4,
    "maxFemale": 4.2,
    "panicLow": 0.01,
    "panicHigh": 25,
    "panicAction": "Sospecha crítica de Tormenta Tiroidea o Coma Mixedematoso"
  },
  {
    "id": "test-t4l",
    "code": "ENDO-002-T4L",
    "loincCode": "3024-7",
    "name": "Tiroxina Libre (T4 Libre)",
    "department": "Endocrinología",
    "unit": "ng/dL",
    "tubeType": "Suero Gel Oro / SST Amarillo",
    "minMale": 0.89,
    "maxMale": 1.76,
    "minFemale": 0.89,
    "maxFemale": 1.76,
    "panicLow": 0.3,
    "panicHigh": 4,
    "panicAction": "Disfunción tiroidea periférica crítica. Evaluar sintomatología cardiovascular"
  },
  {
    "id": "test-cort",
    "code": "ENDO-003-CORT",
    "loincCode": "2143-6",
    "name": "Cortisol Sérico Basal (8:00 AM)",
    "department": "Endocrinología",
    "unit": "µg/dL",
    "tubeType": "Suero en Ayunas (8 AM)",
    "minMale": 6,
    "maxMale": 23,
    "minFemale": 6,
    "maxFemale": 23,
    "panicLow": 2,
    "panicHigh": 45,
    "panicAction": "Sospecha de Crisis Suprarrenal Aguda (Addison) o hipercortisolismo severo"
  },
  {
    "id": "test-ins",
    "code": "ENDO-004-INS",
    "loincCode": "2472-8",
    "name": "Insulina en Ayunas",
    "department": "Endocrinología",
    "unit": "µUI/mL",
    "tubeType": "Suero Gel Oro en Ayunas",
    "minMale": 2.6,
    "maxMale": 24.9,
    "minFemale": 2.6,
    "maxFemale": 24.9,
    "panicLow": 1,
    "panicHigh": 150,
    "panicAction": "Sospecha de Insulinoma activo o resistencia extrema a la insulina"
  },
  {
    "id": "test-ferr",
    "code": "ENDO-005-FERR",
    "loincCode": "2276-4",
    "name": "Ferritina Sérica",
    "department": "Endocrinología",
    "unit": "ng/mL",
    "tubeType": "Suero Gel Oro",
    "minMale": 30,
    "maxMale": 400,
    "minFemale": 15,
    "maxFemale": 150,
    "panicLow": 5,
    "panicHigh": 1500,
    "panicAction": "Sospecha de Síndrome de Activación Macrofágica o hemocromatosis grave"
  },
  {
    "id": "test-vitd",
    "code": "ENDO-006-VITD",
    "loincCode": "14635-7",
    "name": "Vitamina D 25-Hidroxi (25-OH)",
    "department": "Endocrinología",
    "unit": "ng/mL",
    "tubeType": "Suero Protegido de la Luz",
    "minMale": 30,
    "maxMale": 100,
    "minFemale": 30,
    "maxFemale": 100,
    "panicLow": 10,
    "panicHigh": 150,
    "panicAction": "Déficit severo con osteomalacia o riesgo de intoxicación hipercalcémica"
  },
  {
    "id": "test-ego",
    "code": "URO-001-EGO",
    "loincCode": "24356-8",
    "name": "Examen General de Orina Fisicoquímico",
    "department": "Uroanálisis",
    "unit": "pH / U",
    "tubeType": "Orina Frasco Estéril",
    "minMale": 5,
    "maxMale": 7.5,
    "minFemale": 5,
    "maxFemale": 7.5,
    "panicLow": 4.5,
    "panicHigh": 8.5,
    "panicAction": "Leucocituria masiva, hematuria franca o presencia de cilindros patológicos"
  },
  {
    "id": "test-mau",
    "code": "URO-002-MAU",
    "loincCode": "14957-5",
    "name": "Microalbuminuria en Orina Ocasional",
    "department": "Uroanálisis",
    "unit": "mg/L",
    "tubeType": "Orina Primera de la Mañana",
    "minMale": 0,
    "maxMale": 20,
    "minFemale": 0,
    "maxFemale": 20,
    "panicLow": 0,
    "panicHigh": 300,
    "panicAction": "Marcador de daño glomerular avanzado / Nefropatía diabética grado III"
  },
  {
    "id": "test-dep",
    "code": "URO-003-DEP",
    "loincCode": "2164-2",
    "name": "Depuración de Creatinina en Orina 24h",
    "department": "Uroanálisis",
    "unit": "mL/min",
    "tubeType": "Orina de 24 Horas + Suero",
    "minMale": 90,
    "maxMale": 140,
    "minFemale": 80,
    "maxFemale": 125,
    "panicLow": 15,
    "panicHigh": 200,
    "panicAction": "Tasa de Filtración Glomerular terminal: valorar terapia de sustitución renal"
  },
  {
    "id": "test-vih",
    "code": "INM-001-VIH",
    "loincCode": "56888-1",
    "name": "VIH 1/2 Ag p24 + Anticuerpos (4ta Gen)",
    "department": "Serología & Inmunología",
    "unit": "S/CO",
    "tubeType": "Suero Gel Oro",
    "minMale": 0,
    "maxMale": 0.99,
    "minFemale": 0,
    "maxFemale": 0.99,
    "panicLow": 0,
    "panicHigh": 1,
    "panicAction": "RESULTADO REACTIVO: Requiere algoritmo confirmatorio Western Blot / Carga Viral"
  },
  {
    "id": "test-vdrl",
    "code": "INM-002-VDRL",
    "loincCode": "20507-0",
    "name": "VDRL / RPR Cualitativo (Sífilis)",
    "department": "Serología & Inmunología",
    "unit": "Diluciones",
    "tubeType": "Suero Libre de Hemólisis",
    "minMale": 0,
    "maxMale": 0,
    "minFemale": 0,
    "maxFemale": 0,
    "panicLow": 0,
    "panicHigh": 8,
    "panicAction": "Título reactivo > 1:8 dils: Notificación inmediata a Epidemiología y control prenatal"
  },
  {
    "id": "test-hbsag",
    "code": "INM-003-HBSAG",
    "loincCode": "5196-1",
    "name": "Hepatitis B Antígeno de Superficie (HBsAg)",
    "department": "Serología & Inmunología",
    "unit": "S/CO",
    "tubeType": "Suero Gel Oro",
    "minMale": 0,
    "maxMale": 0.99,
    "minFemale": 0,
    "maxFemale": 0.99,
    "panicLow": 0,
    "panicHigh": 1,
    "panicAction": "Alerta de infección activa por Virus Hepatitis B. Protocolo de bioseguridad"
  },
  {
    "id": "test-deng",
    "code": "INM-004-DENG",
    "loincCode": "75378-0",
    "name": "Dengue Dúo (Antígeno NS1 + IgM / IgG)",
    "department": "Serología & Inmunología",
    "unit": "Index",
    "tubeType": "Suero Gel Oro",
    "minMale": 0,
    "maxMale": 0.99,
    "minFemale": 0,
    "maxFemale": 0.99,
    "panicLow": 0,
    "panicHigh": 1,
    "panicAction": "ALERTA EPIDEMIOLÓGICA: Dengue con signos de alarma / Monitorear plaquetas"
  },
  {
    "id": "test-egh",
    "code": "COP-001-EGH",
    "loincCode": "10701-1",
    "name": "Examen General de Heces Coprológico",
    "department": "Coprología & Parasitología",
    "unit": "Semik",
    "tubeType": "Heces Frasco Hermético",
    "minMale": 0,
    "maxMale": 0,
    "minFemale": 0,
    "maxFemale": 0,
    "panicLow": 0,
    "panicHigh": 1,
    "panicAction": "Presencia de trofozoítos de Entamoeba histolytica o Giardia lamblia"
  },
  {
    "id": "test-soh",
    "code": "COP-002-SOH",
    "loincCode": "27926-5",
    "name": "Sangre Oculta en Heces Inmunológica (FOBT)",
    "department": "Coprología & Parasitología",
    "unit": "ng/mL",
    "tubeType": "Heces Frasco Hermético",
    "minMale": 0,
    "maxMale": 50,
    "minFemale": 0,
    "maxFemale": 50,
    "panicLow": 0,
    "panicHigh": 200,
    "panicAction": "Hemorragia digestiva oculta / Criterio de prioridad para colonoscopia"
  }
];

const DEFAULT_HIS_BEDS: HisBedItem[] = [
  { id: 'bed-1', code: 'UCI-101', roomNumber: '101', department: 'UCI Adultos', bedType: 'Cama Crítica con Monitor Mindray & Ventilador', floor: 'Piso 1', status: 'OCUPADA', patientName: 'Carlos M. Mendoza (Céd. 8-712-991)' },
  { id: 'bed-2', code: 'UCI-102', roomNumber: '102', department: 'UCI Adultos', bedType: 'Cama Crítica con Monitor Mindray & Ventilador', floor: 'Piso 1', status: 'DISPONIBLE' },
  { id: 'bed-3', code: 'URG-CAM-01', roomNumber: 'Sala Trauma', department: 'Urgencias', bedType: 'Camilla Trauma Shock Hill-Rom', floor: 'Planta Baja', status: 'DISPONIBLE' },
  { id: 'bed-4', code: 'URG-CAM-02', roomNumber: 'Observación A', department: 'Urgencias', bedType: 'Camilla de Observación Clínica', floor: 'Planta Baja', status: 'OCUPADA', patientName: 'Elena Ramos (Céd. 4-118-241)' },
  { id: 'bed-5', code: 'CIR-QUI-01', roomNumber: 'Quirófano Central 1', department: 'Cirugía', bedType: 'Mesa Quirúrgica Universal LED', floor: 'Piso 2', status: 'DESINFECCION' },
  { id: 'bed-6', code: 'MAT-HAB-201', roomNumber: 'Habitación 201', department: 'Maternidad', bedType: 'Cama Obstétrica LDR + Cuna Neonatal', floor: 'Piso 2', status: 'DISPONIBLE' },
  { id: 'bed-7', code: 'HOSP-HAB-301', roomNumber: 'Habitación 301-A', department: 'Hospitalización', bedType: 'Cama Eléctrica Hospitalaria 4 Mov.', floor: 'Piso 3', status: 'DISPONIBLE' },
  { id: 'bed-8', code: 'HOSP-HAB-302', roomNumber: 'Habitación 302-B', department: 'Hospitalización', bedType: 'Cama Eléctrica Hospitalaria 4 Mov.', floor: 'Piso 3', status: 'MANTENIMIENTO' }
];

const DEFAULT_BLOOD_RULES: BloodComponentRule[] = [
  { id: 'cgr', name: 'Concentrado de Glóbulos Rojos (CGR)', code: 'E0001V00', shelfLifeDays: 42, tempRange: '2°C a 6°C', minStockThreshold: 15, currentStock: 28, agitationRequired: false },
  { id: 'pfc', name: 'Plasma Fresco Congelado (PFC)', code: 'E0002V00', shelfLifeDays: 365, tempRange: '≤ -18°C', minStockThreshold: 10, currentStock: 19, agitationRequired: false },
  { id: 'cp', name: 'Concentrado de Plaquetas (Pool / Aféresis)', code: 'E0003V00', shelfLifeDays: 5, tempRange: '20°C a 24°C', minStockThreshold: 8, currentStock: 12, agitationRequired: true },
  { id: 'crio', name: 'Crioprecipitado Factor VIII / Fibrinógeno', code: 'E0004V00', shelfLifeDays: 365, tempRange: '≤ -18°C', minStockThreshold: 6, currentStock: 9, agitationRequired: false },
  { id: 'st', name: 'Sangre Total Reconstituida', code: 'E0005V00', shelfLifeDays: 21, tempRange: '2°C a 6°C', minStockThreshold: 4, currentStock: 5, agitationRequired: false }
];

const DEFAULT_BLOOD_FREEZERS: BloodIotFreezer[] = [
  { id: 'f-1', name: 'Refrigerador de Sangre #1 (Hematología)', serialNumber: 'THERMO-REVCO-8812', currentTemp: 4.1, setpointTemp: 4.0, minAlarmTemp: 2.0, maxAlarmTemp: 6.0, status: 'NORMAL' },
  { id: 'f-2', name: 'Ultra-Congelador Plasma -80°C #1', serialNumber: 'PANASONIC-VIP-PLUS-900', currentTemp: -78.6, setpointTemp: -80.0, minAlarmTemp: -85.0, maxAlarmTemp: -70.0, status: 'NORMAL' },
  { id: 'f-3', name: 'Congelador de Plasma Clínico #2', serialNumber: 'FORMA-SCIENTIFIC-402', currentTemp: -24.2, setpointTemp: -25.0, minAlarmTemp: -30.0, maxAlarmTemp: -18.0, status: 'NORMAL' },
  { id: 'f-4', name: 'Incubador y Agitador de Plaquetas #1', serialNumber: 'HELMER-PC100-AGIT', currentTemp: 22.3, setpointTemp: 22.0, minAlarmTemp: 20.0, maxAlarmTemp: 24.0, status: 'NORMAL' }
];

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  tenants,
  analyzers,
  logs,
  onProvisionTenant,
  onUpdateTenants
}) => {
  const { setActiveTab, language } = useLisStore();
  const isEn = language === 'EN';

  // Sub-pestaña de la Consola Súper-Admin
  const [adminTab, setAdminTab] = useState<'TENANTS_BRANCHES' | 'LIS_CATALOG' | 'HIS_BEDS' | 'BLOOD_BANK' | 'USERS' | 'PORTS'>('TENANTS_BRANCHES');

  // Multi-Tenant & Multisede State
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.id || 'lab-san-jose');
  const [newLabName, setNewLabName] = useState<string>('');
  const [newRuc, setNewRuc] = useState<string>('');
  const [newDv, setNewDv] = useState<string>('');
  const [newPlan, setNewPlan] = useState<Tenant['plan']>('Pro');
  const [initialBranchName, setInitialBranchName] = useState<string>('Sede Principal');
  const [initialBranchCode, setInitialBranchCode] = useState<string>('SP-01');

  // Formulario para Agregar Nueva Sede al Cliente Seleccionado
  const [newBranchName, setNewBranchName] = useState<string>('');
  const [newBranchCode, setNewBranchCode] = useState<string>('');
  const [newBranchAddress, setNewBranchAddress] = useState<string>('');
  const [newBranchPhone, setNewBranchPhone] = useState<string>('+507 ');
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Catálogo LIS & Valores de Referencia State
  const [customTests, setCustomTests] = useState<CustomReferenceTest[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lis_custom_test_ranges');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length >= DEFAULT_REFERENCE_TESTS.length) {
            return parsed;
          }
        }
      } catch (e) {}
    }
    return DEFAULT_REFERENCE_TESTS;
  });
  const [testSearch, setTestSearch] = useState<string>('');
  const [testDeptFilter, setTestDeptFilter] = useState<string>('TODOS');
  const [editingTest, setEditingTest] = useState<CustomReferenceTest | null>(null);

  // Formulario de Nueva Prueba
  const [newTestCode, setNewTestCode] = useState<string>('');
  const [newTestLoinc, setNewTestLoinc] = useState<string>('');
  const [newTestName, setNewTestName] = useState<string>('');
  const [newTestDept, setNewTestDept] = useState<string>('Química Clínica');
  const [newTestUnit, setNewTestUnit] = useState<string>('mg/dL');
  const [newTestTube, setNewTestTube] = useState<string>('Suero Gel Oro / SST Amarillo');
  const [newTestMinM, setNewTestMinM] = useState<number>(70);
  const [newTestMaxM, setNewTestMaxM] = useState<number>(100);
  const [newTestMinF, setNewTestMinF] = useState<number>(70);
  const [newTestMaxF, setNewTestMaxF] = useState<number>(100);
  const [newTestPanicL, setNewTestPanicL] = useState<number>(40);
  const [newTestPanicH, setNewTestPanicH] = useState<number>(400);
  const [newTestPanicAction, setNewTestPanicAction] = useState<string>('Llamada inmediata a médico + Repetición por duplicado');
  const [isCreatingTest, setIsCreatingTest] = useState<boolean>(false);

  // Configuración Suite Hospitalaria HIS (Camas)
  const [hisBeds, setHisBeds] = useState<HisBedItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lis_his_beds');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return DEFAULT_HIS_BEDS;
  });
  const [bedDeptFilter, setBedDeptFilter] = useState<string>('TODOS');
  const [newBedCode, setNewBedCode] = useState<string>('');
  const [newBedRoom, setNewBedRoom] = useState<string>('');
  const [newBedDept, setNewBedDept] = useState<HisBedItem['department']>('Urgencias');
  const [newBedType, setNewBedType] = useState<string>('Camilla de Observación Clínica');
  const [newBedFloor, setNewBedFloor] = useState<string>('Planta Baja');

  // Configuración Banco de Sangre
  const [bloodRules, setBloodRules] = useState<BloodComponentRule[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lis_blood_rules');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return DEFAULT_BLOOD_RULES;
  });
  const [bloodFreezers, setBloodFreezers] = useState<BloodIotFreezer[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lis_blood_freezers');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return DEFAULT_BLOOD_FREEZERS;
  });
  const [mandatorySerology, setMandatorySerology] = useState<Record<string, boolean>>({
    hiv: true,
    hbv: true,
    hcv: true,
    chagas: true,
    syphilis: true,
    htlv: true,
    malaria: true,
    natRequired: true
  });

  // Usuarios Reales State
  const [realUsers, setRealUsers] = useState<User[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lis_real_users');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            let modified = false;
            const updated = parsed.map((u: User) => {
              if (
                (u.id === 'usr-developer-1' || u.email === 'developer@abregotech.com') &&
                u.name === 'Ing. Rubén Ábrego'
              ) {
                modified = true;
                return { ...u, name: 'Equipo de Desarrollo / Lead Dev' };
              }
              return u;
            });
            if (modified) {
              localStorage.setItem('lis_real_users', JSON.stringify(updated));
            }
            return updated;
          }
        }
      } catch (e) {}
    }
    return MOCK_USERS;
  });
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserUsername, setNewUserUsername] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserPassword, setNewUserPassword] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<Role>('tech_med');
  const [newUserLicense, setNewUserLicense] = useState<string>('');
  const [newUserTenant, setNewUserTenant] = useState<string>(tenants[0]?.id || 'lab-san-jose');
  const [newUserBranch, setNewUserBranch] = useState<string>(tenants[0]?.branches[0]?.id || '');
  const [newUserPin, setNewUserPin] = useState<string>('');
  const [userCreatedSuccess, setUserCreatedSuccess] = useState<string | null>(null);

  // Búsqueda y Filtros de Usuarios en Tiempo Real
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userTenantFilter, setUserTenantFilter] = useState<string>('ALL');

  // Filtro Inteligente de Usuarios por Nombre de Usuario (@username), Nombre, Email, Rol, Idoneidad, Sede o Cliente
  const filteredUsers = useMemo(() => {
    const q = userSearchTerm.toLowerCase().trim().replace(/^@/, '');
    const roleSpanishLabels: Record<string, string> = {
      owner: 'directora gerencia administrador',
      lab_chief: 'jefe de laboratorio director tecnico medico doctor',
      tech_med: 'tecnólogo médico tecnologo analista tm',
      technologist: 'tecnólogo médico tecnologo analista tm',
      lab_tech: 'técnico flebotomía flebotomista toma de muestra',
      phlebotomist: 'flebotomista flebotomía toma de muestra',
      receptionist: 'recepción admisión recepcionista cajero caja',
      ext_doctor: 'médico externo doctor remitente clinica',
      doctor: 'médico doctor remitente clinica',
      billing: 'facturación caja contabilidad',
      abregotech_admin: 'super admin administrador programador soporte dev lead lead dev'
    };

    return realUsers.filter((u) => {
      const uTenant = tenants.find((t) => t.id === u.tenantId);
      const uBranch = uTenant?.branches.find((b) => b.id === u.branchId) || uTenant?.branches[0];
      const emailUser = u.email.split('@')[0].toLowerCase();
      const userAlias = (u.username || emailUser).toLowerCase();

      const matchesSearch =
        !q ||
        userAlias.includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.licenseNumber && u.licenseNumber.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q) ||
        (roleSpanishLabels[u.role] && roleSpanishLabels[u.role].toLowerCase().includes(q)) ||
        (uTenant && uTenant.name.toLowerCase().includes(q)) ||
        (uBranch && uBranch.name.toLowerCase().includes(q));

      const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
      const matchesTenant = userTenantFilter === 'ALL' || u.tenantId === userTenantFilter;
      return matchesSearch && matchesRole && matchesTenant;
    });
  }, [realUsers, userSearchTerm, userRoleFilter, userTenantFilter, tenants]);

  // Modal para editar Rol, Cliente y Sede de un usuario existente
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editUserRole, setEditUserRole] = useState<Role>('tech_med');
  const [editUserTenant, setEditUserTenant] = useState<string>('');
  const [editUserBranch, setEditUserBranch] = useState<string>('');

  // Estados para Restablecimiento Administrativo de Credenciales (Contraseña y PIN si olvidó ambos)
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [adminResetPassword, setAdminResetPassword] = useState<string>('');
  const [adminResetPin, setAdminResetPin] = useState<string>('');
  const [adminResetSuccess, setAdminResetSuccess] = useState<string | null>(null);

  // Puertos y Copiado
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const activeTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];

  // Helper para persistir Tenants
  const saveTenants = (updated: Tenant[]) => {
    if (onUpdateTenants) {
      onUpdateTenants(updated);
    } else {
      try {
        localStorage.setItem('lis_tenants', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('lis_tenants_updated'));
      } catch (e) {}
    }
  };

  // 1. Crear nuevo Tenant
  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabName.trim() || !newRuc.trim()) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: 'Por favor complete el Nombre del Laboratorio y el RUC.', type: 'warning' }
        })
      );
      return;
    }

    const newId = `lab-${Date.now()}`;
    const initialBranch: Branch = {
      id: `br-${Date.now()}-1`,
      tenantId: newId,
      name: initialBranchName.trim() || 'Sede Principal',
      code: initialBranchCode.trim() || 'SP-01',
      address: 'Ciudad de Panamá',
      phone: '+507 200-0000'
    };

    const newTenant: Tenant = {
      id: newId,
      name: newLabName.trim(),
      ruc: newRuc.trim(),
      dv: newDv.trim() || '00',
      plan: newPlan,
      branches: [initialBranch]
    };

    const updated = [...tenants, newTenant];
    saveTenants(updated);
    setSelectedTenantId(newId);

    setNewLabName('');
    setNewRuc('');
    setNewDv('');
    setInitialBranchName('Sede Principal');
    setInitialBranchCode('SP-01');

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          message: `¡Cliente "${newTenant.name}" creado con éxito con su sede inicial "${initialBranch.name}"!`,
          type: 'success'
        }
      })
    );
  };

  // 2. Agregar Sede a un Tenant
  const handleAddBranchToTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || !newBranchCode.trim()) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: 'Ingrese el nombre y código de la nueva sede.', type: 'warning' }
        })
      );
      return;
    }

    const newBranch: Branch = {
      id: `branch-${Date.now()}`,
      tenantId: activeTenant.id,
      name: newBranchName.trim(),
      code: newBranchCode.trim().toUpperCase(),
      address: newBranchAddress.trim() || 'Panamá',
      phone: newBranchPhone.trim() || '+507 200-0000'
    };

    const updatedTenants = tenants.map((t) => {
      if (t.id === activeTenant.id) {
        return {
          ...t,
          branches: [...t.branches, newBranch]
        };
      }
      return t;
    });

    saveTenants(updatedTenants);

    setNewBranchName('');
    setNewBranchCode('');
    setNewBranchAddress('');
    setNewBranchPhone('+507 ');

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          message: `¡Sede "${newBranch.name}" agregada con éxito a ${activeTenant.name}! Ya está disponible en el Login.`,
          type: 'success'
        }
      })
    );
  };

  // 3. Editar Sede
  const handleUpdateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    const updatedTenants = tenants.map((t) => {
      if (t.id === editingBranch.tenantId) {
        return {
          ...t,
          branches: t.branches.map((b) => (b.id === editingBranch.id ? editingBranch : b))
        };
      }
      return t;
    });

    saveTenants(updatedTenants);
    setEditingBranch(null);

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `Sede "${editingBranch.name}" actualizada con éxito.`, type: 'success' }
      })
    );
  };

  // 4. Eliminar Sede
  const handleDeleteBranch = (tenantId: string, branchId: string) => {
    const targetTenant = tenants.find((t) => t.id === tenantId);
    if (!targetTenant) return;

    if (targetTenant.branches.length <= 1) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: 'No puede eliminar la única sede del cliente. Debe tener al menos una.', type: 'error' }
        })
      );
      return;
    }

    const updatedTenants = tenants.map((t) => {
      if (t.id === tenantId) {
        return {
          ...t,
          branches: t.branches.filter((b) => b.id !== branchId)
        };
      }
      return t;
    });

    saveTenants(updatedTenants);

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: 'Sede eliminada del sistema.', type: 'info' }
      })
    );
  };

  // 5. Guardar Modificación de Valores de Referencia LIS
  const handleSaveReferenceTest = (test: CustomReferenceTest) => {
    const updated = customTests.map((t) => (t.id === test.id ? test : t));
    setCustomTests(updated);
    try {
      localStorage.setItem('lis_custom_test_ranges', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lis_catalog_updated'));
    } catch (e) {}

    setEditingTest(null);
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `Valores de referencia de "${test.name}" actualizados y vigentes.`, type: 'success' }
      })
    );
  };

  // 6. Crear Nueva Prueba LIS en Catálogo
  const handleCreateNewTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestCode.trim() || !newTestName.trim()) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: 'Ingrese el código y nombre del examen.', type: 'warning' }
        })
      );
      return;
    }

    const newTest: CustomReferenceTest = {
      id: `test-custom-${Date.now()}`,
      code: newTestCode.trim().toUpperCase(),
      loincCode: newTestLoinc.trim() || '99999-0',
      name: newTestName.trim(),
      department: newTestDept,
      unit: newTestUnit.trim(),
      tubeType: newTestTube,
      minMale: Number(newTestMinM),
      maxMale: Number(newTestMaxM),
      minFemale: Number(newTestMinF),
      maxFemale: Number(newTestMaxF),
      panicLow: newTestPanicL ? Number(newTestPanicL) : undefined,
      panicHigh: newTestPanicH ? Number(newTestPanicH) : undefined,
      panicAction: newTestPanicAction.trim()
    };

    const updated = [newTest, ...customTests];
    setCustomTests(updated);
    try {
      localStorage.setItem('lis_custom_test_ranges', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lis_catalog_updated'));
    } catch (e) {}

    setIsCreatingTest(false);
    setNewTestCode('');
    setNewTestLoinc('');
    setNewTestName('');

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `¡Examen "${newTest.name}" incorporado al catálogo LIS!`, type: 'success' }
      })
    );
  };

  // 7. Configuración HIS - Camas
  const handleAddBed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBedCode.trim() || !newBedRoom.trim()) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: 'Ingrese el código de cama y la sala.', type: 'warning' }
        })
      );
      return;
    }

    const newBed: HisBedItem = {
      id: `bed-${Date.now()}`,
      code: newBedCode.trim().toUpperCase(),
      roomNumber: newBedRoom.trim(),
      department: newBedDept,
      bedType: newBedType.trim(),
      floor: newBedFloor.trim(),
      status: 'DISPONIBLE'
    };

    const updated = [...hisBeds, newBed];
    setHisBeds(updated);
    try {
      localStorage.setItem('lis_his_beds', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lis_his_beds_updated'));
    } catch (e) {}

    setNewBedCode('');
    setNewBedRoom('');

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `Cama "${newBed.code}" registrada en ${newBed.department}.`, type: 'success' }
      })
    );
  };

  const handleToggleBedStatus = (bedId: string) => {
    const nextStatusMap: Record<HisBedItem['status'], HisBedItem['status']> = {
      DISPONIBLE: 'OCUPADA',
      OCUPADA: 'DESINFECCION',
      DESINFECCION: 'MANTENIMIENTO',
      MANTENIMIENTO: 'DISPONIBLE'
    };

    const updated = hisBeds.map((b) => {
      if (b.id === bedId) {
        return {
          ...b,
          status: nextStatusMap[b.status]
        };
      }
      return b;
    });

    setHisBeds(updated);
    try {
      localStorage.setItem('lis_his_beds', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lis_his_beds_updated'));
    } catch (e) {}
  };

  const handleDeleteBed = (bedId: string) => {
    const updated = hisBeds.filter((b) => b.id !== bedId);
    setHisBeds(updated);
    try {
      localStorage.setItem('lis_his_beds', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lis_his_beds_updated'));
    } catch (e) {}
  };

  // 8. Banco de Sangre Rules
  const handleUpdateBloodRule = (ruleId: string, days: number, stock: number) => {
    const updated = bloodRules.map((r) => (r.id === ruleId ? { ...r, shelfLifeDays: days, minStockThreshold: stock } : r));
    setBloodRules(updated);
    try {
      localStorage.setItem('lis_blood_rules', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lis_blood_rules_updated'));
    } catch (e) {}
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: 'Regla de hemocomponente actualizada.', type: 'info' }
      })
    );
  };

  // 9. Crear Usuario Real
  const handleCreateRealUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      window.dispatchEvent(
        new CustomEvent('lis-global-toast', {
          detail: { message: 'Complete nombre, correo y contraseña del usuario.', type: 'warning' }
        })
      );
      return;
    }

    const targetTenant = tenants.find((t) => t.id === newUserTenant) || tenants[0];
    const targetBranch = newUserBranch || targetTenant?.branches[0]?.id || 'branch-via-espana';

    const cleanPin = newUserPin.trim();
    if (cleanPin) {
      const pinCheck = validateEthicalPin(cleanPin);
      if (!pinCheck.isValid) {
        window.dispatchEvent(
          new CustomEvent('lis-global-toast', {
            detail: { message: pinCheck.error || 'PIN denegado por seguridad ética.', type: 'error' }
          })
        );
        return;
      }
    }
    const cleanUsername = newUserUsername.trim().toLowerCase().replace(/\s+/g, '') || newUserEmail.trim().split('@')[0].toLowerCase();
    const newUser: User = {
      id: `usr-${Date.now()}`,
      tenantId: newUserTenant,
      branchId: targetBranch,
      name: newUserName.trim(),
      username: cleanUsername,
      email: newUserEmail.trim(),
      role: newUserRole,
      password: newUserPassword.trim(),
      passwordHash: btoa(`abregotech_salt_${newUserPassword.trim()}`),
      pinCode: cleanPin || undefined,
      licenseNumber: newUserLicense.trim() || undefined,
      twoFactorEnabled: Boolean(cleanPin)
    };

    const updated = [newUser, ...realUsers];
    setRealUsers(updated);
    try {
      // Protección Ley 81 / ISO 15189: Nunca almacenar contraseñas en texto claro en LocalStorage
      const sanitizedForStorage = updated.map(u => ({
        ...u,
        password: undefined,
        passwordHash: u.passwordHash || (u.password ? btoa(`abregotech_salt_${u.password}`) : undefined)
      }));
      localStorage.setItem('lis_real_users', JSON.stringify(sanitizedForStorage));
      window.dispatchEvent(new CustomEvent('lis_users_updated'));
    } catch (e) {
      console.error(e);
    }

    setUserCreatedSuccess(`Usuario "${newUser.name}" (@${newUser.username}) registrado exitosamente.`);
    setTimeout(() => setUserCreatedSuccess(null), 4000);

    setNewUserName('');
    setNewUserUsername('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserLicense('');
    setNewUserPin('');

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `¡Usuario real creado! Ya puede ingresar con ${newUser.email}.`, type: 'success' }
      })
    );
  };

  const handleDeleteRealUser = (userId: string) => {
    const updated = realUsers.filter((u) => u.id !== userId);
    setRealUsers(updated);
    try {
      localStorage.setItem('lis_real_users', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lis_users_updated'));
    } catch (e) {}

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: 'Usuario eliminado.', type: 'info' }
      })
    );
  };

  // 10. Descargar Plantilla CSV para Importación Masiva en Excel
  const handleDownloadTemplate = () => {
    const headers = 'Nombre Completo,Usuario (@login),Correo Electrónico,Rol,Contraseña,PIN,Idoneidad MINSA,Cliente ID,Sede ID\n';
    const examples = [
      'Lic. Carlos Mendoza,cmendoza,carlos.mendoza@labsanjose.com,tech_med,Clave2026*,6140,TM-4821-PA,lab-san-jose,br-via-espana',
      'Dra. Marcela Guardia,mguardia,marcela.guardia@labsanjose.com,lab_chief,Clave2026*,1120,TM-1120-PA,lab-san-jose,br-costa-del-este',
      'Ana Cristina Boyd,aboyd,ana.boyd@labsanjose.com,receptionist,Clave2026*,8329,,lab-san-jose,br-via-espana',
      'Dr. Rodrigo De León,rdeleon,rodrigo.deleon@clinica.com,ext_doctor,Clave2026*,9812,MD-9812-PA,lab-san-jose,br-via-espana'
    ].join('\n');

    const notes = '\n\n# NOTAS PARA EXCEL:\n# Roles permitidos: owner, lab_chief, tech_med, lab_tech, receptionist, ext_doctor, abregotech_admin\n# Clientes disponibles: ' + tenants.map(t => `${t.id} (${t.name})`).join(' | ') + '\n# Sedes disponibles: ' + tenants.flatMap(t => t.branches.map(b => `${b.id} (${b.name})`)).join(' | ');

    const blob = new Blob(['\uFEFF' + headers + examples + notes], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_usuarios_abregotech_lis.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 11. Importación Masiva en Lote desde Excel / CSV
  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
        if (lines.length <= 1) {
          window.dispatchEvent(new CustomEvent('lis-global-toast', { detail: { message: 'El archivo CSV no contiene filas de datos.', type: 'warning' } }));
          return;
        }

        const dataRows = lines.slice(1);
        const newUsersList: User[] = [];
        let importedCount = 0;

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          if (!row || row.startsWith('#')) continue;

          const cols = row.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length < 3) continue;

          let name = '';
          let username = '';
          let email = '';
          let role = '';
          let password = '';
          let pin = '';
          let license = '';
          let tenantId = '';
          let branchId = '';

          // Soporte tanto para formato de 9 columnas (con usuario) como de 8 columnas (sin usuario)
          if (cols.length >= 9) {
            [name, username, email, role, password, pin, license, tenantId, branchId] = cols;
          } else {
            [name, email, role, password, pin, license, tenantId, branchId] = cols;
          }

          if (!name || !email) continue;

          const validUsername = (username || email.split('@')[0]).toLowerCase().replace(/\s+/g, '');
          const validRole: Role = (['owner', 'lab_chief', 'tech_med', 'lab_tech', 'receptionist', 'ext_doctor', 'abregotech_admin'].includes(role) ? role : 'tech_med') as Role;
          const validTenant = tenants.find(t => t.id === tenantId)?.id || tenants[0]?.id || 'lab-san-jose';
          const targetTenantObj = tenants.find(t => t.id === validTenant);
          const validBranch = targetTenantObj?.branches.find(b => b.id === branchId)?.id || targetTenantObj?.branches[0]?.id || 'branch-via-espana';
          const pwd = password || 'Clave2026*';
          const candidatePin = pin ? pin.replace(/\D/g, '').slice(0, 4) : '';
          const pinCheck = candidatePin ? validateEthicalPin(candidatePin) : { isValid: false };
          const cleanPin = pinCheck.isValid ? candidatePin : generateSecurePin();

          newUsersList.push({
            id: `usr-${Date.now()}-${i}`,
            tenantId: validTenant,
            branchId: validBranch,
            name: name.trim(),
            username: validUsername,
            email: email.trim(),
            role: validRole,
            password: pwd,
            passwordHash: btoa(`abregotech_salt_${pwd}`),
            pinCode: cleanPin,
            licenseNumber: license ? license.trim() : undefined,
            twoFactorEnabled: true
          });
          importedCount++;
        }

        if (importedCount === 0) {
          window.dispatchEvent(new CustomEvent('lis-global-toast', { detail: { message: 'No se encontraron filas válidas para importar.', type: 'error' } }));
          return;
        }

        const existingEmails = new Set(realUsers.map(u => u.email.toLowerCase()));
        const filteredNew = newUsersList.filter(u => !existingEmails.has(u.email.toLowerCase()));
        const duplicatesCount = newUsersList.length - filteredNew.length;

        const merged = [...filteredNew, ...realUsers];
        setRealUsers(merged);

        try {
          const sanitized = merged.map(u => ({
            ...u,
            password: undefined,
            passwordHash: u.passwordHash || (u.password ? btoa(`abregotech_salt_${u.password}`) : undefined)
          }));
          localStorage.setItem('lis_real_users', JSON.stringify(sanitized));
          window.dispatchEvent(new CustomEvent('lis_users_updated'));
        } catch (err) {
          console.error(err);
        }

        setUserCreatedSuccess(`✓ Importación masiva exitosa: ${filteredNew.length} usuarios registrados.${duplicatesCount > 0 ? ` (${duplicatesCount} omitidos por correo duplicado)` : ''}`);
        setTimeout(() => setUserCreatedSuccess(null), 5000);
      } catch (err) {
        console.error('Error al importar CSV:', err);
        window.dispatchEvent(new CustomEvent('lis-global-toast', { detail: { message: 'Error al procesar el archivo CSV.', type: 'error' } }));
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  // 12. Exportar Lista Actual a Excel / CSV
  const handleExportCurrentUsers = () => {
    const headers = 'Nombre Completo,Usuario (@login),Correo Electrónico,Rol,Idoneidad MINSA,Cliente / Tenant,Sede / Sucursal\n';
    const rows = realUsers.map(u => {
      const tName = tenants.find(t => t.id === u.tenantId)?.name || u.tenantId;
      const bName = tenants.find(t => t.id === u.tenantId)?.branches.find(b => b.id === u.branchId)?.name || u.branchId || 'Sede Principal';
      const uLogin = u.username || u.email.split('@')[0];
      return `"${u.name}","@${uLogin}","${u.email}","${u.role}","${u.licenseNumber || ''}","${tName}","${bName}"`;
    }).join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_activos_lis_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 13. Guardar Edición de Rol, Cliente y Sede
  const handleSaveEditUser = () => {
    if (!userToEdit) return;
    const updated = realUsers.map(u => {
      if (u.id === userToEdit.id) {
        return {
          ...u,
          role: editUserRole,
          tenantId: editUserTenant,
          branchId: editUserBranch
        };
      }
      return u;
    });

    setRealUsers(updated);
    try {
      const sanitized = updated.map(u => ({
        ...u,
        password: undefined,
        passwordHash: u.passwordHash || (u.password ? btoa(`abregotech_salt_${u.password}`) : undefined)
      }));
      localStorage.setItem('lis_real_users', JSON.stringify(sanitized));
      window.dispatchEvent(new CustomEvent('lis_users_updated'));
    } catch (e) {
      console.error(e);
    }

    setUserCreatedSuccess(`Usuario "${userToEdit.name}" actualizado exitosamente.`);
    setTimeout(() => setUserCreatedSuccess(null), 4000);
    setUserToEdit(null);
  };

  const handleAdminResetCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToReset) return;

    const trimmedPass = adminResetPassword.trim();
    const trimmedPin = adminResetPin.trim();

    if (!trimmedPass && !trimmedPin) {
      alert('Debe ingresar al menos una nueva contraseña o un nuevo PIN de firma.');
      return;
    }

    if (trimmedPass && trimmedPass.length < 5) {
      alert('La nueva contraseña debe tener al menos 5 caracteres.');
      return;
    }

    if (trimmedPin && (trimmedPin.length !== 4 || !/^\d{4}$/.test(trimmedPin))) {
      alert('El PIN de firma electrónica debe ser de exactamente 4 dígitos numéricos.');
      return;
    }

    const updated = realUsers.map((u) => {
      if (u.id === userToReset.id) {
        return {
          ...u,
          password: trimmedPass || u.password,
          passwordHash: trimmedPass ? btoa(`abregotech_salt_${trimmedPass}`) : u.passwordHash,
          pinCode: trimmedPin || u.pinCode,
          twoFactorEnabled: trimmedPin ? true : u.twoFactorEnabled
        };
      }
      return u;
    });

    setRealUsers(updated);
    try {
      const sanitizedForStorage = updated.map((u) => ({
        ...u,
        password: undefined,
        passwordHash: u.passwordHash || (u.password ? btoa(`abregotech_salt_${u.password}`) : undefined)
      }));
      localStorage.setItem('lis_real_users', JSON.stringify(sanitizedForStorage));
      window.dispatchEvent(new CustomEvent('lis_users_updated'));
    } catch (err) {
      console.error(err);
    }

    setAdminResetSuccess(`Credenciales de "${userToReset.name}" actualizadas correctamente.`);
    setTimeout(() => {
      setAdminResetSuccess(null);
      setUserToReset(null);
      setAdminResetPassword('');
      setAdminResetPin('');
    }, 1500);

    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: {
          message: `Credenciales de ${userToReset.name} restablecidas con éxito.`,
          type: 'success'
        }
      })
    );
  };

  const handleCopyLink = (url: string, name: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(name);
    setTimeout(() => setCopiedLink(null), 2000);
    window.dispatchEvent(
      new CustomEvent('lis-global-toast', {
        detail: { message: `Enlace de ${name} copiado: ${url}`, type: 'info' }
      })
    );
  };

  const currentHost = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
  const patientPortalUrl = `http://${currentHost}:3001`;
  const doctorPortalUrl = `http://${currentHost}:3002`;
  const superAdminUrl = `http://${currentHost}:3003`;

  const [testCurrentPage, setTestCurrentPage] = useState<number>(1);
  const [testsPerPage, setTestsPerPage] = useState<number>(10);

  const filteredTests = useMemo(() => {
    return customTests.filter((t) => {
      const q = testSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.loincCode.toLowerCase().includes(q);
      const matchesDept = testDeptFilter === 'TODOS' || t.department === testDeptFilter;
      return matchesSearch && matchesDept;
    });
  }, [customTests, testSearch, testDeptFilter]);

  const totalTestPages = Math.max(1, Math.ceil(filteredTests.length / testsPerPage));
  const paginatedTests = useMemo(() => {
    const start = (testCurrentPage - 1) * testsPerPage;
    return filteredTests.slice(start, start + testsPerPage);
  }, [filteredTests, testCurrentPage, testsPerPage]);

  const filteredBeds = hisBeds.filter((b) => bedDeptFilter === 'TODOS' || b.department === bedDeptFilter);

  const totalBranches = tenants.reduce((acc, t) => acc + t.branches.length, 0);

  return (
    <div className="space-y-6 text-slate-100 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">

      {/* Encabezado Ejecutivo LISCORE Theme */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 border border-cyan-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500"></div>
        <div>
          <div className="text-cyan-400 text-xs font-black uppercase tracking-widest mb-1.5 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>{isEn ? 'Master Super-Admin Platform — Ing. Rubén Abrego / AbregoTech Systems' : 'Plataforma Súper-Admin Maestro — Ing. Rubén Abrego / AbregoTech Systems'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isEn ? 'Master Control for Clients, Multi-Branch, LIS, HIS & Blood Bank' : 'Control Maestro de Clientes, Multisede, LIS, HIS & Banco de Sangre'}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl font-medium leading-relaxed">
            {isEn
              ? 'Central medical & technology governance console: real-time hospital clients & branches creation, analytical test catalog with reference ranges & panic limits, HIS beds, and hemovigilance.'
              : 'Consola central de gobernanza médica y tecnológica: creación y modificación de clientes hospitalarios, sucursales en tiempo real, catálogo analítico con valores de referencia y límites de pánico, camas HIS y hemovigilancia.'}
          </p>
        </div>

        {/* Métricas Rápidas en Tiempo Real */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/80 border border-cyan-500/30 p-3.5 rounded-2xl text-xs shrink-0">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-black">{isEn ? 'Clients / Labs' : 'Clientes / Labs'}</span>
            <div className="text-base font-black text-white">{tenants.length}</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-cyan-400 uppercase font-black">{isEn ? 'Active Branches' : 'Sedes Activas'}</span>
            <div className="text-base font-black text-cyan-300">{totalBranches}</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-emerald-400 uppercase font-black">{isEn ? 'LIS Tests' : 'Pruebas LIS'}</span>
            <div className="text-base font-black text-emerald-300">{customTests.length}</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-amber-400 uppercase font-black">{isEn ? 'HIS Beds' : 'Camas HIS'}</span>
            <div className="text-base font-black text-amber-300">{hisBeds.length}</div>
          </div>
        </div>
      </div>

      {/* Barra de Pestañas de Control Maestro */}
      <div className="flex items-center space-x-2 bg-slate-950/90 p-2 rounded-2xl border border-slate-800 overflow-x-auto shadow-xl">
        <button
          onClick={() => setAdminTab('TENANTS_BRANCHES')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            adminTab === 'TENANTS_BRANCHES'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>🏢 {isEn ? `Clients & Multi-Branch (${totalBranches} Branches)` : `Clientes & Multisede (${totalBranches} Sedes)`}</span>
        </button>

        <button
          onClick={() => setAdminTab('LIS_CATALOG')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            adminTab === 'LIS_CATALOG'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <TestTube className="w-4 h-4" />
          <span>🧪 {isEn ? 'LIS Catalog & Reference Ranges' : 'Catálogo LIS & Valores de Referencia'}</span>
        </button>

        <button
          onClick={() => setAdminTab('HIS_BEDS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            adminTab === 'HIS_BEDS'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>🏥 {isEn ? 'Hospital HIS Suite & Beds' : 'Suite Hospitalaria HIS & Camas'}</span>
        </button>

        <button
          onClick={() => setAdminTab('BLOOD_BANK')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            adminTab === 'BLOOD_BANK'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Droplets className="w-4 h-4" />
          <span>🩸 {isEn ? 'Blood Bank Configuration' : 'Configuración Banco de Sangre'}</span>
        </button>

        <button
          onClick={() => setAdminTab('USERS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            adminTab === 'USERS'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>👥 {isEn ? `Users & Security (${realUsers.length})` : `Usuarios & Seguridad (${realUsers.length})`}</span>
        </button>

        <button
          onClick={() => setAdminTab('PORTS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            adminTab === 'PORTS'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>🌐 {isEn ? 'Dedicated Ports & Network' : 'Puertos & Red Dedicada'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 🏢 TAB 1: CLIENTES & MULTISEDE                                            */}
      {/* ========================================================================= */}
      {adminTab === 'TENANTS_BRANCHES' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Formulario 1A: Crear Nuevo Cliente / Hospital */}
            <form onSubmit={handleCreateTenant} className="lg:col-span-4 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>Aprovisionar Nuevo Cliente</span>
                </h3>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded-full">
                  Nuevo Tenant
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Razón Social / Nombre del Hospital o Lab:</label>
                  <input
                    type="text"
                    placeholder="Ej. Centro Médico Punta Pacífica"
                    value={newLabName}
                    onChange={(e) => setNewLabName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="font-bold text-slate-300 block">RUC Panameño:</label>
                    <input
                      type="text"
                      placeholder="1556983-1-82001"
                      value={newRuc}
                      onChange={(e) => setNewRuc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">DV:</label>
                    <input
                      type="text"
                      placeholder="42"
                      value={newDv}
                      onChange={(e) => setNewDv(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Plan de Suscripción LIS:</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as Tenant['plan'])}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Basic">Plan Básico ($150/mes)</option>
                    <option value="Pro">Plan Pro Multisede ($350/mes)</option>
                    <option value="Enterprise">Plan Enterprise Hospitalario ($750/mes)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Sede Inicial:</label>
                    <input
                      type="text"
                      value={initialBranchName}
                      onChange={(e) => setInitialBranchName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Código Sede:</label>
                    <input
                      type="text"
                      value={initialBranchCode}
                      onChange={(e) => setInitialBranchCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20"
              >
                <Building2 className="w-4 h-4" />
                <span>Crear Cliente & Aprovisionar</span>
              </button>
            </form>

            {/* Formulario 1B & Gestión de Sedes del Cliente Seleccionado */}
            <div className="lg:col-span-8 space-y-6">

              {/* Selector del Cliente a Administrar */}
              <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Seleccionar Cliente para Administrar Sedes:</span>
                  </span>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white font-black focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — RUC: {t.ruc}-{t.dv} ({t.branches.length} sedes)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 font-bold">
                    ✓ Multisede Activa en Login
                  </span>
                </div>
              </div>

              {/* Formulario para Agregar Sede */}
              <form onSubmit={handleAddBranchToTenant} className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-black text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>Agregar Nueva Sede / Sucursal a "{activeTenant.name}"</span>
                  </h4>
                  <span className="text-[10px] text-cyan-300 font-mono">Alta en 0ms</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Nombre de la Sede:</label>
                    <input
                      type="text"
                      placeholder="Ej. Sede Costa del Este"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Código Sede:</label>
                    <input
                      type="text"
                      placeholder="Ej. CE-03"
                      value={newBranchCode}
                      onChange={(e) => setNewBranchCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Dirección:</label>
                    <input
                      type="text"
                      placeholder="Ej. Av. Balboa, Plaza Real"
                      value={newBranchAddress}
                      onChange={(e) => setNewBranchAddress(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Teléfono:</label>
                    <input
                      type="text"
                      placeholder="+507 264-0000"
                      value={newBranchPhone}
                      onChange={(e) => setNewBranchPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center space-x-2 shadow-md shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Guardar Sede y Desplegar en Login</span>
                </button>
              </form>

              {/* Lista de Sedes Existentes del Cliente */}
              <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                <h4 className="font-black text-white text-xs uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>Sedes Operativas de "{activeTenant.name}" ({activeTenant.branches.length})</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTenant.branches.map((branch) => (
                    <div
                      key={branch.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all space-y-2.5 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="text-cyan-400 font-mono font-bold text-xs bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            {branch.code}
                          </span>
                          <span className="font-black text-white text-sm truncate">{branch.name}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingBranch(branch)}
                            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition cursor-pointer"
                            title="Editar Sede"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBranch(activeTenant.id, branch.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                            title="Eliminar Sede"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 flex items-start space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{branch.address}</span>
                      </div>

                      <div className="text-xs text-amber-300 font-mono flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{branch.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Modal para Editar Sede */}
          {editingBranch && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <form
                onSubmit={handleUpdateBranch}
                className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-black text-white text-sm flex items-center space-x-2">
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                    <span>Modificar Datos de la Sede</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingBranch(null)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Nombre de la Sede:</label>
                    <input
                      type="text"
                      value={editingBranch.name}
                      onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Código:</label>
                    <input
                      type="text"
                      value={editingBranch.code}
                      onChange={(e) => setEditingBranch({ ...editingBranch, code: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-cyan-300 font-mono font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Dirección:</label>
                    <input
                      type="text"
                      value={editingBranch.address}
                      onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Teléfono:</label>
                    <input
                      type="text"
                      value={editingBranch.phone}
                      onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-amber-300 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingBranch(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🧪 TAB 2: CATÁLOGO LIS & VALORES DE REFERENCIA                             */}
      {/* ========================================================================= */}
      {adminTab === 'LIS_CATALOG' && (
        <div className="space-y-6">

          {/* Banner de Acceso al Catálogo Extendido LOINC 2.82 */}
          <div className="bg-gradient-to-r from-teal-950/80 via-slate-900 to-slate-950 p-6 rounded-3xl border border-teal-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-teal-400 font-mono text-xs font-black uppercase flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Motor de Mapeo Clínico • Estándar CLSI EP28-A3 & LOINC 2.82</span>
              </div>
              <h3 className="text-xl font-black text-white">Catálogo de Pruebas, Analitos & Valores de Referencia</h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Configure los rangos de referencia normales para hombres y mujeres, unidades de reporte UCUM, tubos y recipientes, y límites de pánico que disparan alertas críticas al médico.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => setIsCreatingTest(true)}
                className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center space-x-2 shadow-lg shadow-teal-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Nueva Prueba</span>
              </button>
              <button
                onClick={() => setActiveTab('test_catalog')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center space-x-2 border border-slate-700"
              >
                <span>Abrir Catálogo Maestro Completo (1,420 Líneas)</span>
                <ChevronRight className="w-4 h-4 text-teal-400" />
              </button>
            </div>
          </div>

          {/* Buscador y Filtros */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar por código, LOINC o examen..."
                value={testSearch}
                onChange={(e) => { setTestSearch(e.target.value); setTestCurrentPage(1); }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={testDeptFilter}
                onChange={(e) => { setTestDeptFilter(e.target.value); setTestCurrentPage(1); }}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="TODOS">Todas las Especialidades ({customTests.length})</option>
                <option value="Hematología">Hematología</option>
                <option value="Coagulación">Coagulación</option>
                <option value="Química Clínica">Química Clínica</option>
                <option value="Perfil Hepático">Perfil Hepático</option>
                <option value="Perfil Lipídico">Perfil Lipídico</option>
                <option value="Electrolitos">Electrolitos</option>
                <option value="Marcadores Cardíacos">Marcadores Cardíacos</option>
                <option value="Endocrinología">Endocrinología</option>
                <option value="Uroanálisis">Uroanálisis</option>
                <option value="Serología & Inmunología">Serología & Inmunología</option>
                <option value="Coprología & Parasitología">Coprología & Parasitología</option>
              </select>
            </div>
          </div>

          {/* Tabla Interactiva de Pruebas y Rangos */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-4">Código / LOINC</th>
                    <th className="p-4">Nombre del Examen</th>
                    <th className="p-4">Especialidad</th>
                    <th className="p-4">Unidad</th>
                    <th className="p-4">Rango Hombres (M)</th>
                    <th className="p-4">Rango Mujeres (F)</th>
                    <th className="p-4">Límites Pánico (Crítico)</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {paginatedTests.map((test) => (
                    <tr key={test.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-mono font-bold">
                        <span className="text-cyan-300 block">{test.code}</span>
                        <span className="text-[10px] text-slate-500">{test.loincCode}</span>
                      </td>
                      <td className="p-4">
                        <div className="font-black text-white">{test.name}</div>
                        <div className="text-[10px] text-slate-400">{test.tubeType}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap inline-block">
                          {test.department}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-amber-300">{test.unit}</td>
                      <td className="p-4 font-mono">
                        <span className="text-cyan-400 font-bold">{test.minMale} - {test.maxMale}</span>
                      </td>
                      <td className="p-4 font-mono">
                        <span className="text-pink-400 font-bold">{test.minFemale} - {test.maxFemale}</span>
                      </td>
                      <td className="p-4 font-mono text-[11px]">
                        {test.panicLow !== undefined && test.panicHigh !== undefined ? (
                          <div className="text-rose-400 font-bold flex items-center space-x-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>&lt; {test.panicLow} / &gt; {test.panicHigh}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setEditingTest(test)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 font-bold text-xs transition cursor-pointer border border-cyan-500/30"
                        >
                          Editar Valores
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación Clínica del Catálogo */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400 font-medium">
                Mostrando <span className="text-white font-bold">{filteredTests.length === 0 ? 0 : (testCurrentPage - 1) * testsPerPage + 1}</span> a <span className="text-white font-bold">{Math.min(testCurrentPage * testsPerPage, filteredTests.length)}</span> de <span className="text-cyan-300 font-bold">{filteredTests.length}</span> pruebas clínicas
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span>Por página:</span>
                  <select
                    value={testsPerPage}
                    onChange={(e) => {
                      setTestsPerPage(Number(e.target.value));
                      setTestCurrentPage(1);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setTestCurrentPage(1)}
                    disabled={testCurrentPage === 1}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    « Primero
                  </button>
                  <button
                    onClick={() => setTestCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={testCurrentPage === 1}
                    className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    ‹ Anterior
                  </button>
                  <span className="px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold">
                    {testCurrentPage} / {totalTestPages}
                  </span>
                  <button
                    onClick={() => setTestCurrentPage((prev) => Math.min(prev + 1, totalTestPages))}
                    disabled={testCurrentPage >= totalTestPages}
                    className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Siguiente ›
                  </button>
                  <button
                    onClick={() => setTestCurrentPage(totalTestPages)}
                    disabled={testCurrentPage >= totalTestPages}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Último »
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Modal para Editar Prueba / Valores de Referencia */}
          {editingTest && (
            <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
              <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-xl w-full shadow-2xl max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden ring-1 ring-cyan-500/30">
                <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 shrink-0 bg-slate-950/60">
                  <h3 className="font-black text-white text-sm flex items-center space-x-2">
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                    <span>Valores de Referencia: {editingTest.name}</span>
                  </h3>
                  <button onClick={() => setEditingTest(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs custom-scroll">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1">
                      <label className="font-bold text-slate-300 block">Nombre del Examen:</label>
                      <input
                        type="text"
                        value={editingTest.name}
                        onChange={(e) => setEditingTest({ ...editingTest, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 block">Unidad de Medida (UCUM):</label>
                      <input
                        type="text"
                        value={editingTest.unit}
                        onChange={(e) => setEditingTest({ ...editingTest, unit: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 block">Tubo / Recipiente:</label>
                      <input
                        type="text"
                        value={editingTest.tubeType}
                        onChange={(e) => setEditingTest({ ...editingTest, tubeType: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                      />
                    </div>

                    {/* Rangos Hombres */}
                    <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 space-y-2">
                      <div className="font-bold text-cyan-300">Rango Hombres (M):</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400">Mínimo:</span>
                          <input
                            type="number"
                            step="any"
                            value={editingTest.minMale}
                            onChange={(e) => setEditingTest({ ...editingTest, minMale: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-cyan-300 font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Máximo:</span>
                          <input
                            type="number"
                            step="any"
                            value={editingTest.maxMale}
                            onChange={(e) => setEditingTest({ ...editingTest, maxMale: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-cyan-300 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Rangos Mujeres */}
                    <div className="p-3 rounded-xl bg-pink-950/30 border border-pink-500/20 space-y-2">
                      <div className="font-bold text-pink-300">Rango Mujeres (F):</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400">Mínimo:</span>
                          <input
                            type="number"
                            step="any"
                            value={editingTest.minFemale}
                            onChange={(e) => setEditingTest({ ...editingTest, minFemale: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-pink-300 font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Máximo:</span>
                          <input
                            type="number"
                            step="any"
                            value={editingTest.maxFemale}
                            onChange={(e) => setEditingTest({ ...editingTest, maxFemale: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-pink-300 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Límites Críticos de Pánico */}
                    <div className="col-span-2 p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 space-y-2">
                      <div className="font-bold text-rose-300 flex items-center space-x-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Límites de Alerta de Pánico (Disparo de Alarma Inmediata):</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400">Pánico Bajo (&lt;):</span>
                          <input
                            type="number"
                            step="any"
                            value={editingTest.panicLow ?? ''}
                            onChange={(e) => setEditingTest({ ...editingTest, panicLow: e.target.value ? parseFloat(e.target.value) : undefined })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-rose-300 font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Pánico Alto (&gt;):</span>
                          <input
                            type="number"
                            step="any"
                            value={editingTest.panicHigh ?? ''}
                            onChange={(e) => setEditingTest({ ...editingTest, panicHigh: e.target.value ? parseFloat(e.target.value) : undefined })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-rose-300 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Fijo */}
                <div className="flex items-center justify-end space-x-3 p-4 border-t border-slate-800 shrink-0 bg-slate-950/90">
                  <button onClick={() => setEditingTest(null)} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer">
                    Cancelar
                  </button>
                  <button onClick={() => handleSaveReferenceTest(editingTest)} className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-teal-500/20 transition cursor-pointer">
                    Guardar Valores
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal para Crear Nueva Prueba */}
          {isCreatingTest && (
            <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
              <form onSubmit={handleCreateNewTest} className="bg-slate-900 border border-teal-500/40 rounded-3xl max-w-xl w-full shadow-2xl max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden ring-1 ring-teal-500/30">
                <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 shrink-0 bg-slate-950/60">
                  <h3 className="font-black text-white text-sm flex items-center space-x-2">
                    <Plus className="w-4 h-4 text-teal-400" />
                    <span>Incorporar Nuevo Examen al Catálogo</span>
                  </h3>
                  <button type="button" onClick={() => setIsCreatingTest(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs custom-scroll">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 block">Código Interno:</label>
                      <input
                        type="text"
                        placeholder="Ej. QCL-050"
                        value={newTestCode}
                        onChange={(e) => setNewTestCode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-cyan-300 font-mono font-bold"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 block">Código LOINC:</label>
                      <input
                        type="text"
                        placeholder="Ej. 1751-7"
                        value={newTestLoinc}
                        onChange={(e) => setNewTestLoinc(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold"
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="font-bold text-slate-300 block">Nombre Completo del Examen:</label>
                      <input
                        type="text"
                        placeholder="Ej. Albúmina Sérica"
                        value={newTestName}
                        onChange={(e) => setNewTestName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 block">Especialidad / Sección:</label>
                      <select
                        value={newTestDept}
                        onChange={(e) => setNewTestDept(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold cursor-pointer"
                      >
                        <option value="Hematología">Hematología</option>
                        <option value="Coagulación">Coagulación</option>
                        <option value="Química Clínica">Química Clínica</option>
                        <option value="Perfil Hepático">Perfil Hepático</option>
                        <option value="Perfil Lipídico">Perfil Lipídico</option>
                        <option value="Electrolitos">Electrolitos</option>
                        <option value="Marcadores Cardíacos">Marcadores Cardíacos</option>
                        <option value="Endocrinología">Endocrinología</option>
                        <option value="Uroanálisis">Uroanálisis</option>
                        <option value="Serología & Inmunología">Serología & Inmunología</option>
                        <option value="Coprología & Parasitología">Coprología & Parasitología</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 block">Unidad (UCUM):</label>
                      <input
                        type="text"
                        placeholder="Ej. g/dL"
                        value={newTestUnit}
                        onChange={(e) => setNewTestUnit(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-amber-300 font-mono font-bold"
                        required
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="font-bold text-slate-300 block">Tubo / Anticoagulante:</label>
                      <input
                        type="text"
                        value={newTestTube}
                        onChange={(e) => setNewTestTube(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                      />
                    </div>

                    {/* Rangos Hombres */}
                    <div className="space-y-1">
                      <label className="font-bold text-cyan-300 block">Hombres (Mín - Máx):</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" step="any" value={newTestMinM} onChange={(e) => setNewTestMinM(parseFloat(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono" />
                        <input type="number" step="any" value={newTestMaxM} onChange={(e) => setNewTestMaxM(parseFloat(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono" />
                      </div>
                    </div>

                    {/* Rangos Mujeres */}
                    <div className="space-y-1">
                      <label className="font-bold text-pink-300 block">Mujeres (Mín - Máx):</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" step="any" value={newTestMinF} onChange={(e) => setNewTestMinF(parseFloat(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-pink-300 font-mono" />
                        <input type="number" step="any" value={newTestMaxF} onChange={(e) => setNewTestMaxF(parseFloat(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-pink-300 font-mono" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 p-4 border-t border-slate-800 shrink-0 bg-slate-950/90">
                  <button type="button" onClick={() => setIsCreatingTest(false)} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer">
                    Cancelar
                  </button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-teal-500/20 transition cursor-pointer">
                    Registrar Examen
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏥 TAB 3: SUITE HOSPITALARIA HIS & CENSO DE CAMAS                         */}
      {/* ========================================================================= */}
      {adminTab === 'HIS_BEDS' && (
        <div className="space-y-6">

          {/* Formulario de Alta de Camas Hospitalarias */}
          <form onSubmit={handleAddBed} className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                <HeartPulse className="w-4 h-4 text-cyan-400" />
                <span>Gestor Maestro de Camas & Habitaciones Hospitalarias (ADT)</span>
              </h3>
              <span className="text-[10px] text-cyan-300 font-mono">Censo Dinámico HL7 ADT-A01</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Código de Cama:</label>
                <input
                  type="text"
                  placeholder="Ej. UCI-103"
                  value={newBedCode}
                  onChange={(e) => setNewBedCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Sala / Habitación:</label>
                <input
                  type="text"
                  placeholder="Ej. Habitación 103"
                  value={newBedRoom}
                  onChange={(e) => setNewBedRoom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Servicio / Ward:</label>
                <select
                  value={newBedDept}
                  onChange={(e) => setNewBedDept(e.target.value as HisBedItem['department'])}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="Urgencias">Urgencias</option>
                  <option value="UCI Adultos">UCI Adultos</option>
                  <option value="UCI Pediátrica">UCI Pediátrica</option>
                  <option value="Cirugía">Cirugía</option>
                  <option value="Maternidad">Maternidad</option>
                  <option value="Hospitalización">Hospitalización</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Piso / Ubicación:</label>
                <input
                  type="text"
                  placeholder="Ej. Piso 2"
                  value={newBedFloor}
                  onChange={(e) => setNewBedFloor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Tipo de Cama:</label>
                <input
                  type="text"
                  value={newBedType}
                  onChange={(e) => setNewBedType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center space-x-2 shadow-md shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Cama al Censo Hospitalario</span>
            </button>
          </form>

          {/* Filtro y Lista de Camas */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-3">
              <h4 className="font-black text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>Censo Hospitalario Activo ({filteredBeds.length} Camas)</span>
              </h4>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Filtrar Servicio:</span>
                <select
                  value={bedDeptFilter}
                  onChange={(e) => setBedDeptFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold cursor-pointer"
                >
                  <option value="TODOS">Todos los Servicios</option>
                  <option value="Urgencias">Urgencias</option>
                  <option value="UCI Adultos">UCI Adultos</option>
                  <option value="Cirugía">Cirugía</option>
                  <option value="Maternidad">Maternidad</option>
                  <option value="Hospitalización">Hospitalización</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredBeds.map((bed) => {
                const statusStyles = {
                  DISPONIBLE: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
                  OCUPADA: 'bg-blue-500/10 border-blue-500/40 text-blue-300',
                  DESINFECCION: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
                  MANTENIMIENTO: 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                };

                return (
                  <div
                    key={bed.id}
                    className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition space-y-3 shadow-md flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-white text-sm">{bed.code}</span>
                        <button
                          onClick={() => handleToggleBedStatus(bed.id)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider cursor-pointer ${statusStyles[bed.status]}`}
                          title="Click para alternar estado"
                        >
                          {bed.status}
                        </button>
                      </div>

                      <div className="text-xs font-bold text-cyan-300">{bed.department} • {bed.floor}</div>
                      <div className="text-[11px] text-slate-400">{bed.roomNumber}</div>
                      <div className="text-[10px] text-slate-500 leading-snug">{bed.bedType}</div>

                      {bed.patientName && (
                        <div className="mt-2 p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-white font-medium">
                          👤 {bed.patientName}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                      <span className="text-[10px] text-slate-500">Click estado para rotar</span>
                      <button
                        onClick={() => handleDeleteBed(bed.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        title="Eliminar Cama"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🩸 TAB 4: CONFIGURACIÓN BANCO DE SANGRE                                   */}
      {/* ========================================================================= */}
      {adminTab === 'BLOOD_BANK' && (
        <div className="space-y-6">

          {/* Reglas de Hemocomponentes */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-rose-400" />
                <span>Vida Media, Conservación & Parámetros ISBT 128 de Hemocomponentes</span>
              </h3>
              <span className="text-[10px] font-mono text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                Reglamentación MINSA Panamá
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bloodRules.map((comp) => (
                <div key={comp.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white text-xs truncate max-w-[180px]">{comp.name}</span>
                    <span className="font-mono text-[10px] text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded">
                      {comp.code}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Vida Media (Caducidad):</span>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={comp.shelfLifeDays}
                          onChange={(e) => handleUpdateBloodRule(comp.id, parseInt(e.target.value) || 0, comp.minStockThreshold)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center font-mono font-bold text-white text-xs"
                        />
                        <span className="text-slate-400">días</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Temperatura Exigida:</span>
                      <span className="font-mono font-bold text-cyan-300">{comp.tempRange}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Umbral Stock Mínimo:</span>
                      <input
                        type="number"
                        value={comp.minStockThreshold}
                        onChange={(e) => handleUpdateBloodRule(comp.id, comp.shelfLifeDays, parseInt(e.target.value) || 0)}
                        className="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center font-mono font-bold text-amber-300 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Protocolo de Tamizaje Serológico Obligatorio MINSA */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-black text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Panel de Serología Obligatoria y Tamizaje Infeccioso (Bloqueo Inmediato 0ms)</span>
              </h4>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                Ley Nacional de Sangre
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { id: 'hiv', label: 'VIH-1/2 (Ag p24 + Ac)', desc: 'Tamizaje Combo 4ta Gen' },
                { id: 'hbv', label: 'Hepatitis B (HBsAg + Anti-HBc)', desc: 'Core + Superficie' },
                { id: 'hcv', label: 'Hepatitis C (Anti-HCV)', desc: 'Anticuerpos Totales' },
                { id: 'chagas', label: 'Chagas (T. cruzi)', desc: 'Antígenos Recombinantes' },
                { id: 'syphilis', label: 'Sífilis (Treponema / VDRL)', desc: 'Reagínica & Treponémica' },
                { id: 'htlv', label: 'HTLV-I/II', desc: 'Virus Linfotrópico' },
                { id: 'malaria', label: 'Malária (Plasmodium)', desc: 'Frotis / Inmunoensayo' },
                { id: 'natRequired', label: 'NAT (PCR Ácidos Nucleicos)', desc: 'Obligatorio en Unidades' }
              ].map((marker) => (
                <div
                  key={marker.id}
                  onClick={() => setMandatorySerology({ ...mandatorySerology, [marker.id]: !mandatorySerology[marker.id] })}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-1 ${
                    mandatorySerology[marker.id]
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{marker.label}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${mandatorySerology[marker.id] ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                  </div>
                  <div className="text-[10px] text-slate-400">{marker.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cadena de Frío IoT y Sensores */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <h4 className="font-black text-white text-xs uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              <span>Monitoreo Térmico IoT de Congeladores & Agitadores</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {bloodFreezers.map((freezer) => (
                <div key={freezer.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs truncate max-w-[170px]">{freezer.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                      {freezer.status}
                    </span>
                  </div>
                  <div className="text-2xl font-mono font-black text-cyan-300">{freezer.currentTemp.toFixed(1)}°C</div>
                  <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                    <div>Setpoint: <strong className="text-white">{freezer.setpointTemp}°C</strong></div>
                    <div>Alarma: <strong className="text-amber-300">{freezer.minAlarmTemp}°C a {freezer.maxAlarmTemp}°C</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 👥 TAB 5: USUARIOS & SEGURIDAD SUPABASE                                   */}
      {/* ========================================================================= */}
      {adminTab === 'USERS' && (
        <div className="space-y-6">
          {userCreatedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2">
              <CheckCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{userCreatedSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Formulario de Creación de Usuario */}
            <form onSubmit={handleCreateRealUser} className="lg:col-span-5 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  <span>Nuevo Usuario Clínico</span>
                </h4>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
                  Alta Inmediata
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Nombre Completo del Profesional:</label>
                  <input
                    type="text"
                    placeholder="ej. Lic. Andrea Villalobos"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Usuario / Login (@):</label>
                    <input
                      type="text"
                      placeholder="ej. andrea.v"
                      value={newUserUsername}
                      onChange={(e) => setNewUserUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Correo Electrónico:</label>
                    <input
                      type="email"
                      placeholder="andrea.villalobos@labsanjose.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Contraseña:</label>
                    <input
                      type="password"
                      placeholder="Mínimo 5 caracteres"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">PIN Firma (4D):</label>
                    <input
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      autoComplete="new-password"
                      placeholder="••••"
                      value={'•'.repeat(newUserPin.length)}
                      onChange={(e) => {
                        const rawVal = e.target.value;
                        const prevLen = newUserPin.length;
                        if (rawVal.length < prevLen) {
                          setNewUserPin(newUserPin.slice(0, rawVal.length));
                        } else {
                          const added = rawVal.replace(/•/g, '').replace(/\D/g, '');
                          if (added) {
                            setNewUserPin((prev) => (prev + added).slice(0, 4));
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                          e.preventDefault();
                          setNewUserPin((prev) => prev.slice(0, -1));
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                        if (pasted) {
                          setNewUserPin(pasted);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono font-black text-center focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Rol Clínico:</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as Role)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                    >
                      <option value="owner">Directora / Gerencia</option>
                      <option value="lab_chief">Jefe de Laboratorio</option>
                      <option value="tech_med">Tecnólogo Médico</option>
                      <option value="lab_tech">Técnico / Flebotomía</option>
                      <option value="receptionist">Recepción & Admisión</option>
                      <option value="ext_doctor">Médico Externo</option>
                      <option value="abregotech_admin">Programador Senior / Súper-Admin (Acceso Total)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Idoneidad MINSA:</label>
                    <input
                      type="text"
                      placeholder="TM-7214-PA"
                      value={newUserLicense}
                      onChange={(e) => setNewUserLicense(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Cliente / Laboratorio:</label>
                    <select
                      value={newUserTenant}
                      onChange={(e) => {
                        const tId = e.target.value;
                        setNewUserTenant(tId);
                        const tObj = tenants.find((t) => t.id === tId);
                        setNewUserBranch(tObj?.branches[0]?.id || '');
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Sede / Sucursal:</label>
                    <select
                      value={newUserBranch}
                      onChange={(e) => setNewUserBranch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      {((tenants.find((t) => t.id === newUserTenant) || tenants[0])?.branches || []).map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20"
              >
                <UserPlus className="w-4 h-4" />
                <span>Registrar Usuario Clínico</span>
              </button>
            </form>

            {/* Lista de Usuarios Registrados con Búsqueda, Filtros e Importación Masiva */}
            <div className="lg:col-span-7 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              {/* Header con Acciones Masivas Excel / CSV */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>
                      Usuarios ({filteredUsers.length} de {realUsers.length})
                    </span>
                  </h4>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Acceso multisede con Cifrado SHA-256 / JWT
                  </div>
                </div>

                {/* Botones de Importar / Exportar Excel */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-[11px] font-bold border border-slate-700 transition flex items-center space-x-1 shadow-sm cursor-pointer"
                    title="Descargar plantilla CSV con formato para abrir en Excel"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Plantilla Excel</span>
                  </button>

                  <label
                    className="px-2.5 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 shadow-sm cursor-pointer"
                    title="Importar archivo Excel / CSV para crear usuarios en lote"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Importar Lote</span>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleImportCsv}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleExportCurrentUsers}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 shadow-sm cursor-pointer"
                    title="Exportar todos los usuarios a Excel / CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Exportar</span>
                  </button>
                </div>
              </div>

              {/* Barra de Búsqueda Rápida & Filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-xs">
                <div className="sm:col-span-6 relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por usuario (@usuario), nombre, correo, rol, sede..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl pl-9 pr-8 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                  />
                  {userSearchTerm && (
                    <button
                      onClick={() => setUserSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-2 text-slate-300 text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="ALL">Todos los Roles</option>
                    <option value="owner">Directora / Gerencia</option>
                    <option value="lab_chief">Jefe de Laboratorio</option>
                    <option value="tech_med">Tecnólogo Médico</option>
                    <option value="lab_tech">Técnico / Flebotomía</option>
                    <option value="receptionist">Recepción & Admisión</option>
                    <option value="ext_doctor">Médico Externo</option>
                    <option value="abregotech_admin">Súper-Admin</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={userTenantFilter}
                    onChange={(e) => setUserTenantFilter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-2 text-slate-300 text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="ALL">Todos los Clientes</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lista Filtrada de Usuarios */}
              <div className="max-h-[440px] overflow-y-auto space-y-2 pr-1">
                {filteredUsers.map((u) => {
                  const uTenant = tenants.find((t) => t.id === u.tenantId);
                  const uBranch = uTenant?.branches.find((b) => b.id === u.branchId) || uTenant?.branches[0];
                  const roleMeta = ROLE_METADATA[u.role] || {
                    label: u.role,
                    color: 'bg-slate-800 text-slate-300 border-slate-700',
                    icon: '👤'
                  };

                  return (
                    <div
                      key={u.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        {/* Avatar con Inicial y Estado Activo */}
                        <div className="relative shrink-0 mt-0.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-slate-700 flex items-center justify-center font-black text-cyan-400 text-xs shadow-inner">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950" title="Cuenta Activa" />
                        </div>

                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="font-black text-white truncate text-sm">{u.name}</span>
                            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded">
                              @{u.username || u.email.split('@')[0]}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center space-x-1 ${roleMeta.color}`}>
                              <span>{roleMeta.icon}</span>
                              <span>{roleMeta.label}</span>
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono truncate">
                            <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{u.email}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {/* Tenant / Cliente Badge */}
                            <span className="text-[10px] bg-slate-900 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <Building2 className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span>{uTenant ? uTenant.name : u.tenantId}</span>
                            </span>

                            {/* Sede / Sucursal Badge */}
                            <span className="text-[10px] bg-slate-900 text-cyan-300 border border-slate-800 px-2 py-0.5 rounded-md flex items-center space-x-1 font-mono">
                              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{uBranch ? uBranch.name : (u.branchId || 'Sede Principal')}</span>
                            </span>

                            {u.licenseNumber && (
                              <span className="text-[10px] text-amber-300 bg-amber-950/30 border border-amber-800/40 px-2 py-0.5 rounded-md font-mono flex items-center space-x-1">
                                <span>🎖️</span>
                                <span>Idoneidad Médica: <strong>{u.licenseNumber}</strong></span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          {/* Botón Reasignar Sede / Rol */}
                          <button
                            onClick={() => {
                              setUserToEdit(u);
                              setEditUserRole(u.role);
                              setEditUserTenant(u.tenantId || tenants[0]?.id || 'lab-san-jose');
                              setEditUserBranch(u.branchId || '');
                            }}
                            className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-xl transition cursor-pointer"
                            title="Reasignar Rol, Cliente o Sede"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Botón Restablecer Clave */}
                          <button
                            onClick={() => {
                              setUserToReset(u);
                              setAdminResetPassword('');
                              setAdminResetPin('');
                              setAdminResetSuccess(null);
                            }}
                            className="p-2 text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl transition cursor-pointer"
                            title="Restablecer Contraseña y PIN (Si olvidó ambos)"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          {/* Botón Eliminar */}
                          <button
                            onClick={() => handleDeleteRealUser(u.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

          </div>

          {/* Modal de Restablecimiento Administrativo de Credenciales (Si olvidó ambos) */}
          {userToReset && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
              <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 ring-1 ring-cyan-500/30">
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">
                        Restablecer Credenciales
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {userToReset.name} • Rol: <span className="font-mono text-cyan-300 font-bold">{userToReset.role}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUserToReset(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-[11px] text-slate-300 bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <div className="text-slate-400 font-mono">
                    Usuario / Correo: <strong className="text-white">{userToReset.email}</strong>
                  </div>
                  {userToReset.licenseNumber && (
                    <div className="text-slate-400 font-mono">
                      Idoneidad: <strong className="text-amber-300">{userToReset.licenseNumber}</strong>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 pt-1 leading-relaxed">
                    Si el profesional olvidó tanto su contraseña como su PIN de firma de 4 dígitos, como Súper-Admin puede asignar nuevas claves inmediatamente para restablecer su acceso clínico.
                  </p>
                </div>

                <form onSubmit={handleAdminResetCredentials} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">
                      Nueva Contraseña:
                    </label>
                    <input
                      type="password"
                      placeholder="Mínimo 5 caracteres (dejar en blanco para no cambiar)"
                      value={adminResetPassword}
                      onChange={(e) => setAdminResetPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-amber-300 flex items-center justify-between">
                      <span>Nuevo PIN de Firma (4D):</span>
                      <span className="text-[10px] font-mono text-slate-400">4 dígitos numéricos</span>
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      placeholder="•••• (dejar en blanco para no cambiar)"
                      value={adminResetPin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setAdminResetPin(val);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-amber-300 font-mono font-black text-center tracking-[0.3em] focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {adminResetSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2">
                      <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{adminResetSuccess}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setUserToReset(null)}
                      className="w-1/3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <Key className="w-4 h-4" />
                      <span>Guardar Credenciales</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal para Reasignar Rol, Cliente y Sede */}
          {userToEdit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
              <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 ring-1 ring-cyan-500/30">
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      <Edit3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">
                        Reasignar Cliente y Sede
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {userToEdit.name} • <span className="font-mono text-cyan-300">@{userToEdit.username || userToEdit.email.split('@')[0]}</span> • <span className="text-slate-500">{userToEdit.email}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUserToEdit(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Rol Clínico:</label>
                    <select
                      value={editUserRole}
                      onChange={(e) => setEditUserRole(e.target.value as Role)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="owner">Directora / Gerencia</option>
                      <option value="lab_chief">Jefe de Laboratorio</option>
                      <option value="tech_med">Tecnólogo Médico</option>
                      <option value="lab_tech">Técnico / Flebotomía</option>
                      <option value="receptionist">Recepción & Admisión</option>
                      <option value="ext_doctor">Médico Externo</option>
                      <option value="abregotech_admin">Súper-Admin (Acceso Total)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Cliente / Laboratorio (Tenant):</label>
                    <select
                      value={editUserTenant}
                      onChange={(e) => {
                        const tId = e.target.value;
                        setEditUserTenant(tId);
                        const tObj = tenants.find((t) => t.id === tId);
                        setEditUserBranch(tObj?.branches[0]?.id || '');
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Sede / Sucursal Asignada:</label>
                    <select
                      value={editUserBranch}
                      onChange={(e) => setEditUserBranch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      {((tenants.find((t) => t.id === editUserTenant) || tenants[0])?.branches || []).map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setUserToEdit(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditUser}
                    className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌐 TAB 6: PUERTOS & ENRUTADOR DEDICADO                                    */}
      {/* ========================================================================= */}
      {adminTab === 'PORTS' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Portales Públicos con Puerto Dedicado Independiente
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cada portal cuenta con su puerto de red específico para acceso público, intranet o redirección de firewall
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                ✓ Enrutador Multi-Puerto Activo (3000, 3001, 3002, 3003)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Puerto 3001: Pacientes */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/30 hover:border-cyan-400 space-y-4 transition flex flex-col justify-between shadow-xl">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-black bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-500/40">
                      PUERTO 3001
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Portal Público de Pacientes</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Descarga de resultados en PDF con firma digital Ley 81, consulta por Cédula/Orden y envío a WhatsApp.
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-cyan-300 break-all border border-slate-800 flex items-center justify-between">
                    <span>{patientPortalUrl}</span>
                    <button
                      onClick={() => handleCopyLink(patientPortalUrl, 'Portal de Pacientes')}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
                    >
                      {copiedLink === 'Portal de Pacientes' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href={patientPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 shadow-md shadow-cyan-500/20"
                  >
                    <span>Puerto 3001 (Dedicado)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Puerto 3002: Médicos */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-500/30 hover:border-indigo-400 space-y-4 transition flex flex-col justify-between shadow-xl">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-black bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-500/40">
                      PUERTO 3002
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Portal de Médicos Referentes</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Expedientes de pacientes remitidos, firma electrónica médica, descarga masiva y trazabilidad acumulativa.
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-indigo-300 break-all border border-slate-800 flex items-center justify-between">
                    <span>{doctorPortalUrl}</span>
                    <button
                      onClick={() => handleCopyLink(doctorPortalUrl, 'Portal de Médicos')}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
                    >
                      {copiedLink === 'Portal de Médicos' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href={doctorPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/20"
                  >
                    <span>Puerto 3002 (Dedicado)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Puerto 3003: Súper Admin */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/30 hover:border-emerald-400 space-y-4 transition flex flex-col justify-between shadow-xl">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                      PUERTO 3003
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Consola Súper-Admin SaaS</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Gestión de laboratorios clientes, multisede, catálogo LIS, valores de referencia, HIS y banco de sangre.
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-emerald-300 break-all border border-slate-800 flex items-center justify-between">
                    <span>{superAdminUrl}</span>
                    <button
                      onClick={() => handleCopyLink(superAdminUrl, 'Consola SuperAdmin')}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
                    >
                      {copiedLink === 'Consola SuperAdmin' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href={superAdminUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20"
                  >
                    <span>Puerto 3003 (Dedicado)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
