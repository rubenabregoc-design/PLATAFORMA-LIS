// ============================================================================
// SERVICIO MAESTRO DEL CUERPO MÉDICO (CIRUJANOS, ANESTESIÓLOGOS Y ESPECIALISTAS)
// Trazabilidad Quirúrgica, Admisión y Órdenes Médicas Ley 81 / MINSA
// ============================================================================

export type MedicalRoleCategory = 'CIRUJANO' | 'ANESTESIOLOGO' | 'ESPECIALISTA' | 'MEDICO_GENERAL';

export interface MedicalStaffMember {
  id: string;
  name: string;
  role: MedicalRoleCategory;
  specialty: string;
  licenseNumber: string; // Idoneidad médica oficial Consejo Técnico de Salud
  institution: string;   // Hospital / Sede
  service: string;       // Quirófano, UCI, Consulta Externa, etc.
  phone?: string;
  email?: string;
  isActive: boolean;
}

export const INITIAL_STAFF_MEMBERS: MedicalStaffMember[] = [
  // CIRUJANOS
  {
    id: 'doc-surg-01',
    name: 'Dr. Alejandro Icaza',
    role: 'CIRUJANO',
    specialty: 'Cirugía Cardiovascular & Hemodinamia',
    licenseNumber: 'MP-6612-PA',
    institution: 'Sede Vía España • Quirófanos Centrales',
    service: 'Quirófano 1 (Emergencias / Hemodinamia)',
    email: 'a.icaza@hospitalclinico.pa',
    phone: '+507 6612-4401',
    isActive: true
  },
  {
    id: 'doc-surg-02',
    name: 'Dr. Roberto Eisenmann',
    role: 'CIRUJANO',
    specialty: 'Cirugía General & Laparoscópica',
    licenseNumber: 'MP-4412-PA',
    institution: 'Sede Vía España • Quirófanos Centrales',
    service: 'Quirófano 2 (Electiva Laparoscópica)',
    email: 'reisenmann@cirugiapanama.com',
    phone: '+507 6550-9921',
    isActive: true
  },
  {
    id: 'doc-surg-03',
    name: 'Dr. Franklin Castillo',
    role: 'CIRUJANO',
    specialty: 'Cirugía Ortopédica & Traumatología',
    licenseNumber: 'MP-9032-PA',
    institution: 'Sede Vía España • Pabellón Quirúrgico',
    service: 'Quirófano 3 (Ortopedia y Reemplazo Articular)',
    email: 'fcastillo@ortopedia.pa',
    phone: '+507 6710-3329',
    isActive: true
  },
  {
    id: 'doc-surg-04',
    name: 'Dr. Alberto Herrera',
    role: 'CIRUJANO',
    specialty: 'Urología Quirúrgica & Endourología',
    licenseNumber: 'MP-8144-PA',
    institution: 'Sede Vía España • Quirófanos',
    service: 'Quirófano 4 (Endourología)',
    email: 'aherrera@urologia.pa',
    phone: '+507 6822-9011',
    isActive: true
  },
  {
    id: 'doc-surg-05',
    name: 'Dra. Patricia Boyd',
    role: 'CIRUJANO',
    specialty: 'Cirugía Ginecológica & Obstetricia',
    licenseNumber: 'MP-7401-PA',
    institution: 'Hospital Materno / Sede Vía España',
    service: 'Quirófano Materno',
    email: 'p.boyd@minsa.gob.pa',
    phone: '+507 6419-7702',
    isActive: true
  },
  {
    id: 'doc-surg-06',
    name: 'Dr. Jorge Mendoza',
    role: 'CIRUJANO',
    specialty: 'Cirugía Laparoscópica & Digestiva',
    licenseNumber: 'MP-4029-PA',
    institution: 'Sede Vía España • Cirugía Mayor Ambulatoria',
    service: 'Quirófano 2 (Laparoscopía)',
    email: 'jmendoza@css.gob.pa',
    phone: '+507 6901-2244',
    isActive: true
  },

  // ANESTESIÓLOGOS
  {
    id: 'doc-anes-01',
    name: 'Dra. Carmen Boyd',
    role: 'ANESTESIOLOGO',
    specialty: 'Anestesiología & Reanimación Quirúrgica',
    licenseNumber: 'MP-5120-PA',
    institution: 'Sede Vía España • Departamento de Anestesia',
    service: 'Coordinación Quirúrgica & Anestesia General',
    email: 'cboyd@anestesiologia.pa',
    phone: '+507 6400-8812',
    isActive: true
  },
  {
    id: 'doc-anes-02',
    name: 'Dr. Roberto Icaza',
    role: 'ANESTESIOLOGO',
    specialty: 'Anestesiología Cardiovascular & Neuroanestesia',
    licenseNumber: 'MED-10492-PA',
    institution: 'Sede Vía España • Quirófanos de Alta Complejidad',
    service: 'Quirófano 1 (Hemodinamia & Cirugía Cardíaca)',
    email: 'ricaza@minsa.gob.pa',
    phone: '+507 6620-3391',
    isActive: true
  },
  {
    id: 'doc-anes-03',
    name: 'Dr. Fernando Lasso',
    role: 'ANESTESIOLOGO',
    specialty: 'Anestesiología & Cuidados Críticos (PACU/UCI)',
    licenseNumber: 'MP-3390-PA',
    institution: 'Sede Vía España • Recuperación Post-Anestésica',
    service: 'Sala PACU & Quirófanos',
    email: 'flasso@minsa.gob.pa',
    phone: '+507 6788-1120',
    isActive: true
  },
  {
    id: 'doc-anes-04',
    name: 'Dra. Elena Ramos',
    role: 'ANESTESIOLOGO',
    specialty: 'Anestesiología Pediátrica & Sedación Profunda',
    licenseNumber: 'MP-3918-PA',
    institution: 'Sede Vía España • Cirugía Infantil',
    service: 'Quirófano Pediátrico & Procedimientos',
    email: 'eramos@anestesia.pa',
    phone: '+507 6390-5541',
    isActive: true
  },

  // ESPECIALISTAS Y MÉDICOS INTERNOS
  {
    id: 'doc-esp-01',
    name: 'Dr. Fernando Arosemena Boyd',
    role: 'ESPECIALISTA',
    specialty: 'Medicina General & Salud Preventiva',
    licenseNumber: 'M-9812-MINSA',
    institution: 'Sede Vía España • Consulta Externa',
    service: 'Medicina General',
    email: 'dr.arosemena@hospitalclinico.pa',
    phone: '+507 6207-7500',
    isActive: true
  },
  {
    id: 'doc-esp-02',
    name: 'Dra. Julia Lasso',
    role: 'ESPECIALISTA',
    specialty: 'Reumatología & Inmunología Clínica',
    licenseNumber: 'MP-7721-PA',
    institution: 'Sede Vía España • Consulta Externa',
    service: 'Especialidades Médicas',
    email: 'jlasso@labclinico.pa',
    phone: '+507 6223-4500',
    isActive: true
  },
  {
    id: 'doc-esp-03',
    name: 'Dr. Fernando Arango',
    role: 'ESPECIALISTA',
    specialty: 'Radiología & Diagnóstico por Imágenes',
    licenseNumber: 'R-4410-PA',
    institution: 'Sede Vía España • Centro Radiológico RIS/PACS',
    service: 'Radiología e Imagenología',
    email: 'farango@radiologia.pa',
    phone: '+507 6912-8840',
    isActive: true
  }
];

const STORAGE_KEY = 'lis_medical_staff_directory_v2';

export const MedicalStaffService = {
  // Obtener todo el cuerpo médico
  getAllMembers(): MedicalStaffMember[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return INITIAL_STAFF_MEMBERS;
  },

  // Filtrar solo Cirujanos
  getSurgeons(): MedicalStaffMember[] {
    return this.getAllMembers().filter(m => m.isActive && (m.role === 'CIRUJANO' || m.specialty.toLowerCase().includes('cirug')));
  },

  // Filtrar solo Anestesiólogos
  getAnesthesiologists(): MedicalStaffMember[] {
    return this.getAllMembers().filter(m => m.isActive && (m.role === 'ANESTESIOLOGO' || m.specialty.toLowerCase().includes('anestes')));
  },

  // Guardar o Editar Médico
  saveMember(member: MedicalStaffMember): void {
    const list = this.getAllMembers();
    const idx = list.findIndex(m => m.id === member.id);
    let updated: MedicalStaffMember[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = member;
    } else {
      updated = [member, ...list];
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save medical member', e);
    }
    window.dispatchEvent(new CustomEvent('lis-medical-staff-updated'));
  },

  // Eliminar / Desactivar Médico
  deleteMember(id: string): void {
    const list = this.getAllMembers().filter(m => m.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Could not delete medical member', e);
    }
    window.dispatchEvent(new CustomEvent('lis-medical-staff-updated'));
  }
};
