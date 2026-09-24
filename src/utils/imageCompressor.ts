/**
 * ===============================================================================
 * PLATAFORMA LIS - OPTIMIZADOR AUTOMÁTICO DE IMÁGENES & RECETAS MÉDICAS
 * ===============================================================================
 * Comprime imágenes en el navegador del cliente (recepcionista / flebotomista)
 * antes de transmitirlas a la nube o almacenarlas.
 * 
 * Convierte fotos pesadas de celulares (de 5MB - 12MB) a formato WebP/JPEG optimizado
 * (~100KB - 180KB) preservando la total legibilidad de la firma y prescripción médica.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 a 1.0 (0.8 es el estándar óptimo para documentos)
  format?: 'image/webp' | 'image/jpeg';
}

export interface CompressionResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  compressionRatioPercent: number; // e.g. 96.5% de ahorro
  dimensions: { width: number; height: number };
}

export class ImageCompressor {
  /**
   * Comprime un archivo de imagen en el navegador del usuario en milisegundos.
   */
  public static async compressImage(
    file: File | Blob,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const {
      maxWidth = 1600,
      maxHeight = 2200,
      quality = 0.8,
      format = 'image/webp'
    } = options;

    const originalSizeBytes = file.size;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'));
      reader.onload = (e) => {
        const img = new Image();

        img.onerror = () => reject(new Error('Error al decodificar la imagen. Formato no compatible.'));
        img.onload = () => {
          let { width, height } = img;

          // Calcular escalado proporcional manteniendo el ratio de aspecto
          if (width > maxWidth || height > maxHeight) {
            const widthRatio = maxWidth / width;
            const heightRatio = maxHeight / height;
            const bestRatio = Math.min(widthRatio, heightRatio);

            width = Math.round(width * bestRatio);
            height = Math.round(height * bestRatio);
          }

          // Crear canvas en memoria
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('No se pudo inicializar el contexto 2D del Canvas.'));
          }

          // Filtro bicúbico de alta calidad para nitidez de texto manuscrito
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Fondo blanco para evitar transparencias accidentales en PNGs
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // Dibujar la imagen escalada
          ctx.drawImage(img, 0, 0, width, height);

          // Exportar a WebP de alta eficiencia
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error('Error al generar el Blob comprimido de la imagen.'));
              }

              const fileName = file instanceof File 
                ? file.name.replace(/\.[^/.]+$/, '') + (format === 'image/webp' ? '.webp' : '.jpg')
                : `receta_medica_${Date.now()}.${format === 'image/webp' ? 'webp' : 'jpg'}`;

              const compressedFile = new File([blob], fileName, {
                type: format,
                lastModified: Date.now()
              });

              const compressedSizeBytes = blob.size;
              const savedBytes = Math.max(0, originalSizeBytes - compressedSizeBytes);
              const compressionRatioPercent = originalSizeBytes > 0
                ? Number(((savedBytes / originalSizeBytes) * 100).toFixed(1))
                : 0;

              const dataUrl = canvas.toDataURL(format, quality);

              resolve({
                file: compressedFile,
                blob,
                dataUrl,
                originalSizeBytes,
                compressedSizeBytes,
                compressionRatioPercent,
                dimensions: { width, height }
              });
            },
            format,
            quality
          );
        };

        img.src = e.target?.result as string;
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Formatea el tamaño en bytes a un formato legible (ej. "8.4 MB" -> "142 KB")
   */
  public static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
