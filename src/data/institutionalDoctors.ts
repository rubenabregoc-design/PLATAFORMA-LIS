// ============================================================================
// DIRECTORIO OFICIAL DE MÉDICOS INSTITUCIONALES (HIS / MINSA / CSS PANAMÁ)
// Trazabilidad ISO 15189 y Validación de Órdenes Médicas
// ============================================================================

export interface InstitutionalDoctor {
  id: string;
  name: string;
  specialty: string;
  licenseNumber: string; // Idoneidad médica oficial
  institution: string;   // Hospital / Centro de salud de origen
  service: string;       // Servicio o departamento
  email?: string;
  phone?: string;
  isInstitutional: boolean;
}

export const INSTITUTIONAL_HIS_DOCTORS: InstitutionalDoctor[] = [
  {
    id: 'doc-001',
    name: 'Dr. Fernando Arosemena Boyd',
    specialty: 'Medicina General',
    licenseNumber: 'M-9812-MINSA',
    institution: 'Hospital Santo Tomás (MINSA)',
    service: 'Consulta Externa',
    email: 'dr.arosemena@hospitalclinico.pa',
    phone: '+507 207-7500',
    isInstitutional: true
  },
  {
    id: 'doc-002',
    name: 'Dr. Alejandro Icaza',
    specialty: 'Medicina Interna',
    licenseNumber: 'MP-6612-PA',
    institution: 'CSS Complejo Hospitalario Metropolitano',
    service: 'Medicina Interna / Sala 3',
    email: 'a.icaza@css.gob.pa',
    phone: '+507 503-0000',
    isInstitutional: true
  },
  {
    id: 'doc-003',
    name: 'Dra. Patricia Boyd',
    specialty: 'Ginecología / Obstetricia',
    licenseNumber: 'MP-7401-PA',
    institution: 'Hospital Santo Tomás (MINSA)',
    service: 'Maternidad & Ginecología',
    email: 'p.boyd@minsa.gob.pa',
    phone: '+507 207-7500',
    isInstitutional: true
  },
  {
    id: 'doc-004',
    name: 'Dr. Franklin Castillo',
    specialty: 'Cardiología',
    licenseNumber: 'MP-9032-PA',
    institution: 'Instituto Cardiovascular / CSS',
    service: 'Cardiología No Invasiva',
    email: 'fcastillo@cardiopanama.com',
    phone: '+507 264-9000',
    isInstitutional: true
  },
  {
    id: 'doc-005',
    name: 'Dra. Carmen Boyd',
    specialty: 'Endocrinología',
    licenseNumber: 'MP-5120-PA',
    institution: 'Clínica Especializada San José',
    service: 'Endocrinología & Metabolismo',
    email: 'cboyd@labclinico.pa',
    phone: '+507 223-4500',
    isInstitutional: true
  },
  {
    id: 'doc-006',
    name: 'Dr. Fernando Lasso',
    specialty: 'Medicina Interna',
    licenseNumber: 'MP-3390-PA',
    institution: 'Hospital Santo Tomás - UCI',
    service: 'Cuidados Intensivos (UCI)',
    email: 'flasso@minsa.gob.pa',
    phone: '+507 207-7520',
    isInstitutional: true
  },
  {
    id: 'doc-007',
    name: 'Dr. Roberto Icaza',
    specialty: 'Medicina Interna',
    licenseNumber: 'MED-10492-PA',
    institution: 'Hospital Santo Tomás (MINSA)',
    service: 'Urgencias Médicas',
    email: 'ricaza@minsa.gob.pa',
    phone: '+507 207-7500',
    isInstitutional: true
  },
  {
    id: 'doc-008',
    name: 'Dr. Alberto Herrera',
    specialty: 'Urología',
    licenseNumber: 'MP-8144-PA',
    institution: 'CSS Complejo Hospitalario Metropolitano',
    service: 'Urología Quirúrgica',
    email: 'aherrera@css.gob.pa',
    phone: '+507 503-0100',
    isInstitutional: true
  },
  {
    id: 'doc-009',
    name: 'Dr. Jorge Mendoza',
    specialty: 'Salud Ocupacional',
    licenseNumber: 'MP-4029-PA',
    institution: 'Dirección Nacional de Salud Ocupacional',
    service: 'Salud Ocupacional e Higiene',
    email: 'jmendoza@css.gob.pa',
    phone: '+507 503-0250',
    isInstitutional: true
  },
  {
    id: 'doc-010',
    name: 'Dra. Julia Lasso',
    specialty: 'Reumatología',
    licenseNumber: 'MP-7721-PA',
    institution: 'Clínica Especializada San José',
    service: 'Reumatología & Inmunología',
    email: 'jlasso@labclinico.pa',
    phone: '+507 223-4500',
    isInstitutional: true
  },
  {
    id: 'doc-011',
    name: 'Dra. Elena Ramos',
    specialty: 'Pediatría',
    licenseNumber: 'MP-3918-PA',
    institution: 'Hospital del Niño Dr. José Renán Esquivel',
    service: 'Pediatría General',
    email: 'eramos@hn.sld.pa',
    phone: '+507 512-9800',
    isInstitutional: true
  },
  {
    id: 'doc-012',
    name: 'Dr. Carlos Varela',
    specialty: 'Medicina General',
    licenseNumber: 'MP-5890-PA',
    institution: 'Policlínica Manuel María Valdés (CSS)',
    service: 'Consulta Externa Adultos',
    email: 'cvarela@css.gob.pa',
    phone: '+507 503-3400',
    isInstitutional: true
  }
];
