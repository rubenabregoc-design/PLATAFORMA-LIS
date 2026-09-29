/**
 * AbregoTech LIS / HIS — Módulo de Seguridad y Hacking Ético (OWASP / ISO 27001)
 * Protección estricta contra credenciales predecibles, fuerza bruta y diccionarios de claves.
 */

// Lista negra de PINs débiles, secuenciales y predecibles
export const FORBIDDEN_WEAK_PINS = new Set([
  '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
  '1234', '2345', '3456', '4567', '5678', '6789', '0123',
  '4321', '5432', '6543', '7654', '8765', '9876', '3210',
  '1212', '6969', '1313', '2580', '1122', '1221'
]);

/**
 * Validador de fortaleza de PIN de firma electrónica bajo principios de Hacking Ético
 */
export function validateEthicalPin(pin: string): { isValid: boolean; error?: string } {
  const clean = (pin || '').trim();

  if (!/^\d{4}$/.test(clean)) {
    return {
      isValid: false,
      error: 'El PIN debe contener exactamente 4 dígitos numéricos.'
    };
  }

  if (FORBIDDEN_WEAK_PINS.has(clean)) {
    return {
      isValid: false,
      error: '⚠️ PIN inseguro denegado por Hacking Ético (ISO 27001). No se permiten números secuenciales (ej. 1234), repetitivos (ej. 9999) ni patrones predecibles.'
    };
  }

  // Verificar si todos los dígitos son iguales
  if (/^(\d)\1{3}$/.test(clean)) {
    return {
      isValid: false,
      error: '⚠️ El PIN no puede tener 4 dígitos iguales.'
    };
  }

  return { isValid: true };
}

/**
 * Generador de PIN seguro y no predecible
 */
export function generateSecurePin(): string {
  let pin = '';
  do {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    pin = String(1000 + (array[0] % 9000));
  } while (FORBIDDEN_WEAK_PINS.has(pin) || /^(\d)\1{3}$/.test(pin));
  return pin;
}
