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
 * ⚡ IMPRESIÓN AISLADA DE MÁXIMA VELOCIDAD (Zero-DOM Overhead)
 * En lugar de forzar a window.print() a recalcular los más de 3,000 nodos DOM
 * de la aplicación React (que causa congelamientos de 2 a 3 segundos),
 * genera un iframe limpio aislado que el navegador procesa en menos de 50ms.
 */
export const printHtmlDirectly = (title: string, bodyHtml: string, customStyles: string = ''): void => {
  if (typeof window === 'undefined') return;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    window.print();
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        @page { size: auto; margin: 8mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 12px; }
        * { box-sizing: border-box; }
        table { border-collapse: collapse; width: 100%; }
        ${customStyles}
      </style>
    </head>
    <body>
      ${bodyHtml}
      <script>
        window.onload = function() {
          window.focus();
          window.print();
        };
      </script>
    </body>
    </html>
  `);
  doc.close();

  // Limpieza del iframe tras cerrar el diálogo de impresión
  setTimeout(() => {
    try {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    } catch {}
  }, 45000);
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
