/**
 * Order Utils — Centralized Order Number Formatting & Generation
 *
 * New Standard Format: YYMMDDXXXXX (11 digits purely numeric)
 * Example: 26101278900
 *   - 26: Year (2-digit, e.g. 2026)
 *   - 10: Month (2-digit, e.g. October)
 *   - 12: Day (2-digit, e.g. 12th)
 *   - 78900: Sequence / Order Counter (5-digit)
 */

export function generateOrderNumber(date: Date = new Date(), sequence?: number | string): string {
  const yy = String(date.getFullYear()).slice(-2);
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

  return `${yy}${mm}${dd}${seqStr}`;
}

export function formatOrderNumber(orderNum?: string, fallbackDate: Date = new Date()): string {
  if (!orderNum) {
    return generateOrderNumber(fallbackDate);
  }

  const clean = orderNum.trim();

  // If already numeric 11-digit or numeric format, return clean
  if (/^\d+$/.test(clean)) {
    return clean;
  }

  // Handle ORD-YYYY-XXXXX or ORD-2026-90001
  const match = clean.match(/ORD-(\d{4})-(\d+)/i);
  if (match) {
    const yearStr = match[1]; // e.g. "2026"
    const seqStr = match[2];  // e.g. "90001" or "00101"
    const yy = yearStr.slice(-2);
    const mm = String(fallbackDate.getMonth() + 1).padStart(2, '0');
    const dd = String(fallbackDate.getDate()).padStart(2, '0');
    const seqPadded = seqStr.padStart(5, '0').slice(-5);
    return `${yy}${mm}${dd}${seqPadded}`;
  }

  // Fallback for other ORD- formats
  const digits = clean.replace(/\D/g, '');
  if (digits.length >= 5) {
    return generateOrderNumber(fallbackDate, digits.slice(-5));
  }

  return generateOrderNumber(fallbackDate);
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
