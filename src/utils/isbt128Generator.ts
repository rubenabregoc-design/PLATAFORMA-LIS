/**
 * 🧬 ISBT 128 Utility for Blood Bank Labeling
 * Standardized labeling for international compatibility.
 */

export const ISBT128 = {
  /**
   * Genera el DIN (Donation Identification Number)
   * Estructura: = [F] [FacilityID] [Year] [Sequence] [Checksum]
   */
  generateDIN: (facilityCode: string, sequence: number): string => {
    const year = new Date().getFullYear().toString().slice(-2);
    const seq = sequence.toString().padStart(6, '0');
    // En un sistema real, añadiríamos el checksum K y los flag characters
    return `=${facilityCode}${year}${seq}00`;
  },

  /**
   * Mapeo de códigos de componentes ISBT
   */
  getComponentCode: (type: string): string => {
    const codes: Record<string, string> = {
      'RBC': 'E0001',      // Red Blood Cells
      'PLASMA': 'E0534',   // Fresh Frozen Plasma
      'PLATELETS': 'E0652',// Platelets Pheresis
      'WHOLE_BLOOD': 'E0000'
    };
    return codes[type] || 'E9999';
  },

  /**
   * Formatea la fecha de expiración para ISBT (Julian Date format opcional)
   */
  formatExpiry: (date: Date): string => {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }
};
