import { useEffect } from 'react';

/**
 * Chrome / Edge usan `document.title` como nombre sugerido del archivo al
 * "Guardar como PDF". Estas utilidades reemplazan temporalmente el título
 * de la pestaña por un nombre descriptivo del documento, p. ej.:
 *
 *   "Receta Medica - Juan Perez - 8-123-456 - 2026-10-05.pdf"
 */

const sanitizeSegment = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes (compatibilidad de nombres de archivo)
    .replace(/[\\/:*?"<>|#%&{}$!'@`=+]/g, '') // caracteres no válidos en Windows/macOS
    .replace(/\s+/g, ' ')
    .trim();

/** Construye un nombre de archivo limpio a partir de varias partes. */
export const buildPrintFileName = (
  ...parts: Array<string | number | null | undefined | false>
): string => {
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const clean = parts
    .filter((p): p is string | number => p !== null && p !== undefined && p !== false && String(p).trim() !== '')
    .map((p) => sanitizeSegment(String(p)))
    .filter(Boolean);
  clean.push(date);
  return clean.join(' - ').slice(0, 180);
};

/**
 * Imprime / guarda como PDF usando `fileName` como nombre sugerido.
 * Restaura el título original al cerrar el diálogo de impresión.
 */
export const printDocument = (fileName: string): void => {
  if (typeof window === 'undefined') return;
  const originalTitle = document.title;
  document.title = fileName;

  const restore = () => {
    document.title = originalTitle;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);

  window.print();

  // Respaldo para navegadores que no disparan `afterprint`.
  setTimeout(() => {
    if (document.title === fileName) restore();
  }, 3000);
};

/**
 * Mientras `active` sea verdadero, la pestaña usa `fileName` como título.
 * Así incluso Ctrl+P sugiere el nombre correcto del documento.
 */
export const usePrintFileName = (fileName: string | null | undefined, active: boolean = true): void => {
  useEffect(() => {
    if (!active || !fileName || typeof document === 'undefined') return;
    const originalTitle = document.title;
    document.title = fileName;
    return () => {
      document.title = originalTitle;
    };
  }, [fileName, active]);
};
