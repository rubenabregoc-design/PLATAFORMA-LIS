import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export interface ProcessedSignatureResult {
  url: string;
  storageMode: 'SUPABASE_STORAGE' | 'LOCAL_POSTGRES_DATAURL';
  sizeKb: number;
}

/**
 * Procesa una imagen de firma (PNG/JPG):
 * - Redimensiona a máx. 420x160 px manteniendo proporción
 * - Opcionalmente vuelve transparente el fondo blanco/claro (ideal para firmas escaneadas)
 * - Exporta como PNG liviano (~10-25 KB)
 */
export async function processSignatureImage(
  file: File,
  removeWhiteBg: boolean = true
): Promise<{ blob: Blob; dataUrl: string; sizeKb: number }> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('El archivo no es una imagen válida (PNG/JPG).'));
    el.src = rawDataUrl;
  });

  const maxW = 420;
  const maxH = 160;
  const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar el lienzo de procesamiento.');
  }

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  if (removeWhiteBg) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Píxeles casi blancos -> transparentes; bordes suaves -> semitransparentes
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luminance > 235) {
        data[i + 3] = 0;
      } else if (luminance > 200) {
        const factor = (235 - luminance) / 35;
        data[i + 3] = Math.round(data[i + 3] * factor);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Error al exportar la firma en PNG.'));
    }, 'image/png');
  });

  return {
    blob,
    dataUrl,
    sizeKb: Math.max(1, Math.round(blob.size / 1024))
  };
}

/**
 * Sube la firma al bucket `signatures` de Supabase Storage cuando hay conexión.
 * Si no hay internet o el bucket no existe, guarda automáticamente como PNG Data URL
 * (compatible con PostgreSQL local y modo offline).
 */
export async function uploadUserSignature(
  file: File,
  tenantId: string,
  userId: string,
  removeWhiteBg: boolean = true
): Promise<ProcessedSignatureResult> {
  const { blob, dataUrl, sizeKb } = await processSignatureImage(file, removeWhiteBg);

  if (isSupabaseConfigured && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const safeTenant = (tenantId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeUser = (userId || `usr_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filePath = `${safeTenant}/${safeUser}.png`;

      const { error } = await supabase.storage
        .from('signatures')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (!error) {
        const { data: pubData } = supabase.storage.from('signatures').getPublicUrl(filePath);
        if (pubData?.publicUrl) {
          return {
            url: `${pubData.publicUrl}?t=${Date.now()}`,
            storageMode: 'SUPABASE_STORAGE',
            sizeKb
          };
        }
      }
    } catch (err) {
      console.warn('Supabase Storage no disponible para firma, usando respaldo local PNG:', err);
    }
  }

  // Respaldo automático offline / PostgreSQL local
  return {
    url: dataUrl,
    storageMode: 'LOCAL_POSTGRES_DATAURL',
    sizeKb
  };
}
