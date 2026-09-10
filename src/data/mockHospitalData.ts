import {
  HospitalBed,
  TriageRecord,
  HospitalAdmission,
  SoapNote,
  MedicationOrder,
  KardexAdministrationRecord
} from '../types';

export const MOCK_HOSPITAL_BEDS: HospitalBed[] = [
  // --- SALA DE URGENCIAS / OBSERVACIÓN ---
  {
    id: 'bed-urg-01',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    ward: 'URGENCIAS',
    roomNumber: 'Box Trauma',
    bedNumber: 'URG-01',
    status: 'OCUPADA',
    patientId: 'pat-002',
    admissionId: 'adm-001',
    currentPatientName: 'Ricardo Arosemena Boyd',
    currentPatientCedula: '8-745-1290',
    lastSanitizedAt: '2026-09-07T08:00:00Z'
  },
  {
    id: 'bed-urg-02',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    ward: 'URGENCIAS',
    roomNumber: 'Box Observación A',
    bedNumber: 'URG-02',
    status: 'DISPONIBLE',
    lastSanitizedAt: '2026-09-07T14:30:00Z'
  },
  {
    id: 'bed-urg-03',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    ward: 'URGENCIAS',
    roomNumber: 'Box Observación B',
    bedNumber: 'URG-03',
    status: 'DESINFECCION',
    lastSanitizedAt: '2026-09-07T19:00:00Z'
  },

  // --- SALA DE HOSPITALIZACIÓN (MEDICINA INTERNA) ---
  {
    id: 'bed-hosp-201',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    ward: 'HOSPITALIZACION',
    roomNumber: 'Habitación 201',
    bedNumber: 'HOSP-201A',
    status: 'OCUPADA',
    patientId: 'pat-001',
    admissionId: 'adm-002',
    currentPatientName: 'Gabriela Pinzón Varela',
    currentPatientCedula: '8-812-4432',
    lastSanitizedAt: '2026-09-05T10:00:00Z'
  },
  {
    id: 'bed-hosp-202',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    ward: 'HOSPITALIZACION',
    roomNumber: 'Habitación 202',
    bedNumber: 'HOSP-202A',
    status: 'DISPONIBLE',
    lastSanitizedAt: '2026-09-07T11:00:00Z'
  },
  {
    id: 'bed-hosp-203',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    ward: 'HOSPITALIZACION',
    roomNumber: 'Habitación 203',
    bedNumber: 'HOSP-203A',
    status: 'OCUPADA',
    patientId: 'pat-004',
    admissionId: 'adm-003',
    currentPatientName: 'Valeria Morales Rios',
    currentPatientCedula: '8-910-3341',
    lastSanitizedAt: '2026-09-06T15:00:00Z'
  },

  // --- UNIDAD DE CUIDADOS INTENSIVOS (UCI) ---
  {
    id: 'bed-uci-301',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    ward: 'UCI',
    roomNumber: 'Box Aislamiento UCI-1',
    bedNumber: 'UCI-301',
    status: 'OCUPADA',
    patientId: 'pat-003',
    admissionId: 'adm-004',
    currentPatientName: 'Esteban Castillo Vega',
    currentPatientCedula: '4-721-9088',
    lastSanitizedAt: '2026-09-06T08:00:00Z'
  },
  {
    id: 'bed-uci-302',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    ward: 'UCI',
    roomNumber: 'Box UCI-2',
    bedNumber: 'UCI-302',
    status: 'DISPONIBLE',
    lastSanitizedAt: '2026-09-07T16:00:00Z'
  },

  // --- CIRUGÍA & RECUPERACIÓN ---
  {
    id: 'bed-cir-101',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    ward: 'CIRUGIA',
    roomNumber: 'Pabellón Quirúrgico 1',
    bedNumber: 'CIR-101',
    status: 'DISPONIBLE',
    lastSanitizedAt: '2026-09-07T12:00:00Z'
  },
  {
    id: 'bed-cir-102',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    ward: 'CIRUGIA',
    roomNumber: 'Pabellón Quirúrgico 2',
    bedNumber: 'CIR-102',
    status: 'MANTENIMIENTO',
    lastSanitizedAt: '2026-09-04T10:00:00Z'
  },

  // --- PEDIATRÍA ---
  {
    id: 'bed-ped-401',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    ward: 'PEDIATRIA',
    roomNumber: 'Sala Pediatría 1',
    bedNumber: 'PED-401',
    status: 'DISPONIBLE',
    lastSanitizedAt: '2026-09-07T09:00:00Z'
  }
];

export const MOCK_TRIAGE_RECORDS: TriageRecord[] = [
  {
    id: 'trg-001',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    patientId: 'pat-002',
    patientName: 'Ricardo Arosemena Boyd',
    patientNationalId: '8-745-1290',
    priority: 'NIVEL_2_NARANJA',
    chiefComplaint: 'Dolor torácico opresivo de 45 min de evolución irradiado a mandíbula y diaforesis profusa.',
    vitalSigns: {
      systolicBp: 165,
      diastolicBp: 100,
      heartRate: 110,
      respiratoryRate: 22,
      temperature: 36.8,
      oxygenSaturation: 94,
      glasgowScale: 15,
      capillaryGlucose: 142
    },
    allergies: ['Penicilina', 'Sulfa'],
    assessedBy: 'Lic. Karen Ortega (Enfermera Triage)',
    assessedAt: '2026-09-07T18:15:00Z',
    assignedBedId: 'bed-urg-01',
    status: 'INGRESADO'
  },
  {
    id: 'trg-002',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    patientId: 'pat-001',
    patientName: 'Gabriela Pinzón Varela',
    patientNationalId: '8-812-4432',
    priority: 'NIVEL_3_AMARILLO',
    chiefComplaint: 'Fiebre persistente de 38.9 °C, dolor en flanco derecho y disuria de 3 días de evolución.',
    vitalSigns: {
      systolicBp: 115,
      diastolicBp: 75,
      heartRate: 88,
      respiratoryRate: 18,
      temperature: 38.9,
      oxygenSaturation: 98,
      glasgowScale: 15,
      capillaryGlucose: 98
    },
    allergies: ['Ninguna conocida'],
    assessedBy: 'Lic. Karen Ortega (Enfermera Triage)',
    assessedAt: '2026-09-07T15:20:00Z',
    assignedBedId: 'bed-hosp-201',
    status: 'INGRESADO'
  },
  {
    id: 'trg-003',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    patientId: 'pat-005',
    patientName: 'Carlos Andrés Villarreal',
    patientNationalId: '8-552-1102',
    priority: 'NIVEL_4_VERDE',
    chiefComplaint: 'Traumatismo leve en tobillo derecho tras caída de propia altura con edema moderado.',
    vitalSigns: {
      systolicBp: 120,
      diastolicBp: 80,
      heartRate: 74,
      respiratoryRate: 16,
      temperature: 36.5,
      oxygenSaturation: 99,
      glasgowScale: 15
    },
    allergies: ['Ninguna'],
    assessedBy: 'Lic. Javier Gómez (Triage)',
    assessedAt: '2026-09-07T19:40:00Z',
    status: 'EN_ESPERA'
  }
];

export const MOCK_HOSPITAL_ADMISSIONS: HospitalAdmission[] = [
  {
    id: 'adm-001',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    patientId: 'pat-002',
    patientName: 'Ricardo Arosemena Boyd',
    patientNationalId: '8-745-1290',
    bedId: 'bed-urg-01',
    ward: 'URGENCIAS',
    admittingDoctorName: 'Dr. Alejandro Icaza (Idoneidad MP-6612-PA)',
    admittingDoctorLicense: 'MP-6612-PA',
    admissionDate: '2026-09-07T18:30:00Z',
    primaryDiagnosisIcd10: 'I21.0 - Infarto Agudo del Miocardio con Elevación del ST (IAMCEST)',
    allergies: ['Penicilina', 'Sulfa'],
    status: 'ACTIVA'
  },
  {
    id: 'adm-002',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    patientId: 'pat-001',
    patientName: 'Gabriela Pinzón Varela',
    patientNationalId: '8-812-4432',
    bedId: 'bed-hosp-201',
    ward: 'HOSPITALIZACION',
    admittingDoctorName: 'Dra. Patricia Boyd (Idoneidad MP-7401-PA)',
    admittingDoctorLicense: 'MP-7401-PA',
    admissionDate: '2026-09-05T11:00:00Z',
    primaryDiagnosisIcd10: 'N10 - Pielonefritis Aguda Complicada',
    allergies: ['Ninguna conocida'],
    status: 'ACTIVA'
  },
  {
    id: 'adm-003',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    patientId: 'pat-004',
    patientName: 'Valeria Morales Rios',
    patientNationalId: '8-910-3341',
    bedId: 'bed-hosp-203',
    ward: 'HOSPITALIZACION',
    admittingDoctorName: 'Dr. Alejandro Icaza (Idoneidad MP-6612-PA)',
    admittingDoctorLicense: 'MP-6612-PA',
    admissionDate: '2026-09-06T16:00:00Z',
    primaryDiagnosisIcd10: 'K35.8 - Apendicitis Aguda Post-Operatoria',
    allergies: ['Aspirina'],
    status: 'ACTIVA'
  },
  {
    id: 'adm-004',
    tenantId: 'lab-san-jose',
    branchId: 'branch-via-espana',
    patientId: 'pat-003',
    patientName: 'Esteban Castillo Vega',
    patientNationalId: '4-721-9088',
    bedId: 'bed-uci-301',
    ward: 'UCI',
    admittingDoctorName: 'Dr. Fernando Lasso (Intensivista MP-3390-PA)',
    admittingDoctorLicense: 'MP-3390-PA',
    admissionDate: '2026-09-06T09:00:00Z',
    primaryDiagnosisIcd10: 'J96.0 - Insuficiencia Respiratoria Aguda / Neumonía Grave',
    allergies: ['Ciprofloxacina'],
    status: 'ACTIVA'
  }
];

export const MOCK_SOAP_NOTES: SoapNote[] = [
  {
    id: 'soap-001',
    admissionId: 'adm-001',
    patientId: 'pat-002',
    doctorId: 'doc-icaza',
    doctorName: 'Dr. Alejandro Icaza',
    doctorLicense: 'MP-6612-PA',
    timestamp: '2026-09-07T19:00:00Z',
    subjective: 'Paciente masculino de 41 años refiere persistencia de opresión precordial 7/10 a pesar de primera dosis de nitroglicerina sublingual. Disnea asociada.',
    objective: 'PA 160/95 mmHg, FC 102 lpm, SpO2 93% aire ambiente. Diaforético, ruidos cardíacos rítmicos sin soplos agregados, murmullo vesicular conservado sin estertores.',
    assessment: 'Síndrome Coronario Agudo en curso. Alto riesgo isquémico. Necesidad de monitorización enzimática seriada urgente (Troponina I de alta sensibilidad, CK-MB).',
    plan: '1. Oxígeno por cánula nasal a 3 L/min. 2. Doble antiagregación con AAS 300mg + Ticagrelor 180mg VO. 3. Anticoagulación parenteral con Enoxaparina 80mg SC. 4. Solicitar PERFIL CARDIACO STAT al LIS. 5. Traslado a hemodinamia.',
    vitalSigns: {
      systolicBp: 160,
      diastolicBp: 95,
      heartRate: 102,
      respiratoryRate: 20,
      temperature: 36.7,
      oxygenSaturation: 93,
      glasgowScale: 15
    }
  },
  {
    id: 'soap-002',
    admissionId: 'adm-002',
    patientId: 'pat-001',
    doctorId: 'doc-boyd',
    doctorName: 'Dra. Patricia Boyd',
    doctorLicense: 'MP-7401-PA',
    timestamp: '2026-09-07T08:30:00Z',
    subjective: 'Paciente femenina en su segundo día de hospitalización. Refiere mejoría del dolor lumbar y cese de picos febriles en las últimas 18 horas.',
    objective: 'Afebril (36.6 °C), PA 118/72 mmHg, FC 76 lpm. Abdomen blando, puñopercusión renal derecha levemente positiva, sin signos peritoneales.',
    assessment: 'Pielonefritis aguda con respuesta clínica favorable a Ceftriaxona IV.',
    plan: 'Continuar Ceftriaxona 1g IV c/24h. Mantener hidratación parenteral con Cloruro de Sodio al 0.9% a 80 cc/h. Control de hemograma y PCR de control en 24h. Posible pase a vía oral mañana.',
    vitalSigns: {
      systolicBp: 118,
      diastolicBp: 72,
      heartRate: 76,
      respiratoryRate: 16,
      temperature: 36.6,
      oxygenSaturation: 98,
      glasgowScale: 15
    }
  }
];

export const MOCK_MEDICATION_ORDERS: MedicationOrder[] = [
  {
    id: 'med-001',
    admissionId: 'adm-001',
    patientId: 'pat-002',
    drugName: 'Enoxaparina Sódica',
    dose: '80 mg',
    route: 'SUBCUTANEA',
    frequency: 'CADA_12H',
    startDate: '2026-09-07T18:45:00Z',
    orderedBy: 'Dr. Alejandro Icaza (MP-6612-PA)',
    notes: 'Aplicar en cuadrante inferior de pared abdominal alternando sitios.',
    status: 'ACTIVA'
  },
  {
    id: 'med-002',
    admissionId: 'adm-001',
    patientId: 'pat-002',
    drugName: 'Nitroglicerina Solución IV',
    dose: '10 mcg/min en infusión continua',
    route: 'INTRAVENOSA',
    frequency: 'STAT_UNICA',
    startDate: '2026-09-07T18:50:00Z',
    orderedBy: 'Dr. Alejandro Icaza (MP-6612-PA)',
    notes: 'Titular según cifras de presión arterial sistólica > 100 mmHg.',
    status: 'ACTIVA'
  },
  {
    id: 'med-003',
    admissionId: 'adm-002',
    patientId: 'pat-001',
    drugName: 'Ceftriaxona Sódica',
    dose: '1 g',
    route: 'INTRAVENOSA',
    frequency: 'CADA_24H',
    startDate: '2026-09-05T12:00:00Z',
    orderedBy: 'Dra. Patricia Boyd (MP-7401-PA)',
    notes: 'Diluir en 100cc de Solución Salina e infundir en 30 minutos.',
    status: 'ACTIVA'
  },
  {
    id: 'med-004',
    admissionId: 'adm-002',
    patientId: 'pat-001',
    drugName: 'Omeprazol',
    dose: '40 mg',
    route: 'INTRAVENOSA',
    frequency: 'CADA_24H',
    startDate: '2026-09-05T12:00:00Z',
    orderedBy: 'Dra. Patricia Boyd (MP-7401-PA)',
    notes: 'Gastroprotección matutina.',
    status: 'ACTIVA'
  }
];

export const MOCK_KARDEX_RECORDS: KardexAdministrationRecord[] = [
  {
    id: 'kardex-001',
    medicationOrderId: 'med-001',
    admissionId: 'adm-001',
    patientId: 'pat-002',
    scheduledTime: '2026-09-07T19:00:00Z',
    administeredTime: '2026-09-07T19:05:00Z',
    administeredBy: 'Enf. María Santos (Reg. 8812)',
    status: 'ADMINISTRADA',
    notes: 'Dosis inicial administrada sin complicaciones locales.'
  },
  {
    id: 'kardex-002',
    medicationOrderId: 'med-001',
    admissionId: 'adm-001',
    patientId: 'pat-002',
    scheduledTime: '2026-09-08T07:00:00Z',
    status: 'PROGRAMADA'
  },
  {
    id: 'kardex-003',
    medicationOrderId: 'med-003',
    admissionId: 'adm-002',
    patientId: 'pat-001',
    scheduledTime: '2026-09-07T12:00:00Z',
    administeredTime: '2026-09-07T12:10:00Z',
    administeredBy: 'Enf. Roberto Díaz (Reg. 6420)',
    status: 'ADMINISTRADA',
    notes: 'Buena tolerancia, sin reacciones alérgicas o flebitis.'
  },
  {
    id: 'kardex-004',
    medicationOrderId: 'med-004',
    admissionId: 'adm-002',
    patientId: 'pat-001',
    scheduledTime: '2026-09-07T08:00:00Z',
    administeredTime: '2026-09-07T08:05:00Z',
    administeredBy: 'Enf. Roberto Díaz (Reg. 6420)',
    status: 'ADMINISTRADA'
  }
];
