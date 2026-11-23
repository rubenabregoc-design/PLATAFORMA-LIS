/**
 * Order Utils — Centralized Order Number & Sample Barcode Formatting & Generation
 *
 * Strict Clinical Standard:
 * Format: YYYYMMDDXXXXX.S (e.g. 2026111664387.1 or 2026111664387.9)
 *   - YYYY: 4-digit Year (e.g. 2026)
 *   - MM: 2-digit Month (e.g. 11)
 *   - DD: 2-digit Day (e.g. 16)
 *   - XXXXX: 5-digit sequence / correlative (e.g. 64387 or 48048)
 *   - .S: dot + specimen / tube index (e.g. .1, .2, .9)
 */

export function generateOrderNumber(date: Date = new Date(), sequence?: number | string): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  let seqStr = '';
  if (sequence !== undefined && sequence !== null) {
    const cleanSeq = String(sequence).replace(/\D/g, '');
    seqStr = cleanSeq.slice(-5).padStart(5, '0');
  } else {
    // Generate random 5-digit sequence (10000 - 99999)
    seqStr = String(Math.floor(10000 + Math.random() * 90000));
  }

  // Pure numeric order number: YYYYMMDDXXXXX (e.g. 2026111638705)
  return `${yyyy}${mm}${dd}${seqStr}`;
}

export function formatOrderNumber(orderNum?: string, fallbackDate: Date = new Date()): string {
  if (!orderNum) {
    return generateOrderNumber(fallbackDate);
  }

  const clean = orderNum.trim();

  // If orderNum has a dot suffix like 2026111638705.1, extract ONLY the order part before dot
  const basePart = clean.split('.')[0].trim();
  const digits = basePart.replace(/\D/g, '');

  if (digits.length >= 10) {
    return digits;
  }

  // If in YYYYXXXXX format (e.g. 202648048)
  const yyyyMatch = clean.match(/^(\d{4})(\d{5})$/);
  if (yyyyMatch) {
    const yyyy = yyyyMatch[1];
    const seq = yyyyMatch[2];
    const mm = String(fallbackDate.getMonth() + 1).padStart(2, '0');
    const dd = String(fallbackDate.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}${seq}`;
  }

  return digits || clean;
}

/**
 * Generates a Sample / Specimen Barcode:
 * Format: YYYYMMDDXXXXX.S (e.g. 2026111638705.1 or 2026111638705.2)
 */
export function generateSampleBarcode(
  orderNumberOrSeq?: string,
  tubeIndex: number | string = 1,
  date: Date = new Date()
): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  let baseNum = '';
  if (orderNumberOrSeq) {
    // If order has a dot (e.g. 2026111638705.1), strip the dot and extract base order
    const parts = String(orderNumberOrSeq).split('.');
    const cleanDigits = parts[0].replace(/\D/g, '');
    if (cleanDigits.length >= 12) {
      baseNum = cleanDigits;
    } else {
      const seq = cleanDigits.slice(-5).padStart(5, '0');
      baseNum = `${yyyy}${mm}${dd}${seq}`;
    }
  } else {
    const seq = String(Math.floor(10000 + Math.random() * 90000));
    baseNum = `${yyyy}${mm}${dd}${seq}`;
  }

  const tube = String(tubeIndex).replace(/\D/g, '') || '1';
  return `${baseNum}.${tube}`;
}

/**
 * Normalizes any sample barcode to the standard YYYYMMDDXXXXX.S format
 */
export function formatSampleBarcode(
  sampleBarcode?: string,
  orderNumber?: string,
  tubeIndex: number | string = 1,
  fallbackDate: Date = new Date()
): string {
  if (!sampleBarcode) {
    return generateSampleBarcode(orderNumber, tubeIndex, fallbackDate);
  }

  const clean = sampleBarcode.trim();

  // If already in YYYYMMDDXXXXX.S format (e.g. 2026111645678.9)
  if (/^\d{8}\d+\.\d+$/.test(clean)) {
    return clean;
  }

  // If has hyphen format like 202664387-1 or BC-64387-1
  const parts = clean.split(/[-_.]/);
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    if (/^\d+$/.test(lastPart)) {
      return generateSampleBarcode(orderNumber || parts[0], lastPart, fallbackDate);
    }
  }

  return generateSampleBarcode(orderNumber || clean, tubeIndex, fallbackDate);
}

/**
 * Strict 12-hour format with AM/PM (e.g. "11:24:05 PM" or "11:24 PM")
 */
export function formatTime12h(date: Date | string | number = new Date(), includeSeconds: boolean = true): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
    hour12: true
  });
}
