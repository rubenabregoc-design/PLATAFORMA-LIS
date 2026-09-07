/**
 * 🇵🇦 Panama Automatic Discount Rules (Ley 6 de 1987)
 * Handles "Tercera Edad", Jubilados and Pensionados discounts.
 */

export interface DiscountResult {
  hasDiscount: boolean;
  discountType: 'NONE' | 'TERCERA_EDAD' | 'JUBILADO' | 'PENSIONADO';
  percentage: number;
  reason: string;
}

export const PanamaDiscountRules = {
  /**
   * Evaluates if a patient qualifies for mandatory discounts in laboratory services.
   * Statutory: 20% discount on laboratory tests.
   */
  evaluatePatient: (age: number, gender: 'M' | 'F', isPensioner: boolean = false): DiscountResult => {
    // Law 6: Women 55+, Men 60+
    const isTerceraEdad = (gender === 'F' && age >= 55) || (gender === 'M' && age >= 60);

    if (isTerceraEdad) {
      return {
        hasDiscount: true,
        discountType: 'TERCERA_EDAD',
        percentage: 0.20,
        reason: 'Descuento Ley 6 (Tercera Edad)'
      };
    }

    if (isPensioner) {
      return {
        hasDiscount: true,
        discountType: 'JUBILADO',
        percentage: 0.20,
        reason: 'Descuento Ley 6 (Jubilado/Pensionado)'
      };
    }

    return {
      hasDiscount: false,
      discountType: 'NONE',
      percentage: 0,
      reason: ''
    };
  },

  calculateFinalAmount: (subtotal: number, discount: DiscountResult) => {
    const discountAmount = subtotal * discount.percentage;
    const totalAfterDiscount = subtotal - discountAmount;
    const itbms = totalAfterDiscount * 0.07; // 7% in Panama
    return {
      discountAmount,
      taxAmount: itbms,
      total: totalAfterDiscount + itbms
    };
  }
};
