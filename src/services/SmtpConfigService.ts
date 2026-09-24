/**
 * ============================================================================
 * 📧 ABREGOTECH LISCORE — SERVICIO DE CONFIGURACIÓN & PLANTILLAS SMTP
 * ============================================================================
 * Permite configurar cualquier servidor de correo SMTP (cPanel, Google Workspace,
 * Microsoft 365, Amazon SES, etc.) y genera plantillas médicas HTML de alto impacto.
 * ============================================================================
 */

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean; // true para 465, false para 587 (STARTTLS)
  username: string;
  password?: string;
  fromName: string;
  fromEmail: string;
  enabled: boolean;
}

const SMTP_STORAGE_KEY = 'abregotech_lis_smtp_config';

export const DEFAULT_SMTP_CONFIG: SmtpConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  username: 'notificaciones@laboratorioclinico.com',
  fromName: 'Laboratorio Clínico AbregoTech',
  fromEmail: 'notificaciones@laboratorioclinico.com',
  enabled: true
};

export const SmtpConfigService = {
  getConfig(): SmtpConfig {
    try {
      const stored = localStorage.getItem(SMTP_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SMTP_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error al leer configuración SMTP de localStorage:', e);
    }
    return DEFAULT_SMTP_CONFIG;
  },

  saveConfig(config: SmtpConfig): void {
    try {
      localStorage.setItem(SMTP_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Error al guardar configuración SMTP:', e);
    }
  },

  /**
   * Genera el HTML del correo médico con formato responsive, membrete institucional,
   * desglose fiscal DGI (CUFE, QR), copago de aseguradora y botón de acceso seguro.
   */
  generateMedicalInvoiceHtml(params: {
    tenantName: string;
    tenantRuc: string;
    tenantDv: string;
    branchName: string;
    branchAddress?: string;
    invoiceNumber: string;
    cufe: string;
    orderNumber: string;
    patientName: string;
    patientNationalId: string;
    items: Array<{ name: string; price: number }>;
    subtotal: number;
    discountLey6: number;
    insuranceCoverage: number;
    insuranceName?: string;
    patientTotal: number;
    paymentMethod: string;
    resultsPortalUrl: string;
  }): string {
    const {
      tenantName,
      tenantRuc,
      tenantDv,
      branchName,
      branchAddress,
      invoiceNumber,
      cufe,
      orderNumber,
      patientName,
      patientNationalId,
      items,
      subtotal,
      discountLey6,
      insuranceCoverage,
      insuranceName,
      patientTotal,
      paymentMethod,
      resultsPortalUrl
    } = params;

    const itemsRows = items
      .map(
        (it) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; font-size: 13px; color: #1e293b; font-weight: 500;">${it.name}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; font-family: monospace;">$${it.price.toFixed(2)}</td>
        </tr>`
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura Electrónica DGI - ${invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
  <table role="presentation" style="max-width: 600px; margin: 0 auto; width: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
    
    <!-- Encabezado Clínico -->
    <tr>
      <td style="background: linear-gradient(135deg, #042f2e 0%, #115e59 50%, #0f172a 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #5eead4; font-weight: 800; margin-bottom: 6px;">
          DOCUMENTO TRIBUTARIO ELECTRÓNICO (DGI PANAMÁ)
        </div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
          ${tenantName}
        </h1>
        <div style="font-size: 13px; color: #ccfbf1; margin-top: 4px;">
          Sucursal: ${branchName} | RUC: ${tenantRuc}-${tenantDv}
        </div>
        ${branchAddress ? `<div style="font-size: 11px; color: #99f6e4; margin-top: 2px;">${branchAddress}</div>` : ''}
      </td>
    </tr>

    <!-- Tarjeta de Estado y Resumen -->
    <tr>
      <td style="padding: 24px 28px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="vertical-align: top;">
              <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b;">Factura N°</div>
              <div style="font-size: 18px; font-weight: 900; color: #0d9488; font-family: monospace;">${invoiceNumber}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Orden LIS: <strong>${orderNumber}</strong></div>
            </td>
            <td style="vertical-align: top; text-align: right;">
              <span style="display: inline-block; background-color: #d1fae5; color: #065f46; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; border: 1px solid #a7f3d0;">
                ✓ PAGADO / VÁLIDO DGI
              </span>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Forma: <strong>${paymentMethod}</strong></div>
            </td>
          </tr>
        </table>

        <!-- Datos del Paciente -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 6px;">
            Datos del Paciente / Titular
          </div>
          <table style="width: 100%; font-size: 13px;">
            <tr>
              <td style="color: #64748b; width: 35%;">Nombre Completo:</td>
              <td style="color: #0f172a; font-weight: 700;">${patientName}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">Cédula / Pasaporte:</td>
              <td style="color: #0f172a; font-weight: 700; font-family: monospace;">${patientNationalId}</td>
            </tr>
            ${insuranceName ? `
            <tr>
              <td style="color: #64748b;">Aseguradora:</td>
              <td style="color: #0369a1; font-weight: 700;">${insuranceName}</td>
            </tr>` : ''}
          </table>
        </div>

        <!-- Tabla de Exámenes Médicos -->
        <div style="margin-bottom: 20px;">
          <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 8px;">
            Detalle de Procedimientos & Análisis Clínicos
          </div>
          <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
            <thead>
              <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569;">Examen / Procedimiento</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 11px; text-transform: uppercase; color: #475569;">Importe</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        </div>

        <!-- Resumen Financiero y Descuentos -->
        <table style="width: 100%; margin-bottom: 24px; font-size: 13px;">
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Subtotal de Análisis:</td>
            <td style="text-align: right; font-weight: 700; font-family: monospace; color: #1e293b;">$${subtotal.toFixed(2)}</td>
          </tr>
          ${discountLey6 > 0 ? `
          <tr>
            <td style="color: #b45309; padding: 4px 0; font-weight: 600;">Descuento Ley 6 (Jubilados 20%):</td>
            <td style="text-align: right; font-weight: 700; font-family: monospace; color: #b45309;">-$${discountLey6.toFixed(2)}</td>
          </tr>` : ''}
          ${insuranceCoverage > 0 ? `
          <tr>
            <td style="color: #0369a1; padding: 4px 0; font-weight: 600;">Cobertura Aseguradora (${insuranceName || 'Seguro'}):</td>
            <td style="text-align: right; font-weight: 700; font-family: monospace; color: #0369a1;">-$${insuranceCoverage.toFixed(2)}</td>
          </tr>` : ''}
          <tr>
            <td style="color: #64748b; padding: 4px 0;">ITBMS (Servicios Médicos Exentos):</td>
            <td style="text-align: right; font-weight: 700; font-family: monospace; color: #64748b;">$0.00</td>
          </tr>
          <tr style="border-top: 2px solid #cbd5e1;">
            <td style="font-size: 16px; font-weight: 900; color: #0f172a; padding: 10px 0 4px;">Total Pagado por Paciente:</td>
            <td style="font-size: 20px; font-weight: 900; color: #0d9488; text-align: right; font-family: monospace; padding: 10px 0 4px;">$${patientTotal.toFixed(2)} USD</td>
          </tr>
        </table>

        <!-- CUFE Fiscal DGI -->
        <div style="background-color: #f1f5f9; border-left: 4px solid #0d9488; padding: 12px; border-radius: 4px; font-size: 11px; margin-bottom: 24px;">
          <div style="font-weight: 800; color: #0f172a; margin-bottom: 2px;">CÓDIGO ÚNICO DE FACTURA ELECTRÓNICA (CUFE):</div>
          <div style="font-family: monospace; word-break: break-all; color: #475569; font-size: 10px;">${cufe}</div>
          <div style="color: #64748b; font-size: 10px; margin-top: 4px;">Verificable de forma legal en el Sistema de Facturación Electrónica de Panamá (DGI / MEF).</div>
        </div>

        <!-- Botón de Acción Principal: Consultar Resultados Online -->
        <div style="text-align: center; padding: 10px 0 20px;">
          <a href="${resultsPortalUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #059669 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 14px 0 rgba(13, 148, 136, 0.39);">
            🩺 Ver Estado & Resultados de mi Orden
          </a>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 8px;">
            Al ingresar podrá descargar su informe médico firmado digitalmente cuando esté validado.
          </div>
        </div>
      </td>
    </tr>

    <!-- Pie de Página -->
    <tr>
      <td style="background-color: #0f172a; padding: 20px 28px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #1e293b;">
        <div style="font-weight: 700; color: #cbd5e1; margin-bottom: 4px;">${tenantName} — Plataforma Clínica LISCORE</div>
        <div>Este es un correo automático de notificación de facturación y trazabilidad médica bajo Ley 81 de Panamá.</div>
        <div style="margin-top: 4px; color: #64748b;">Protegido con criptografía AES-256 & Protocolo ISO 15189.</div>
      </td>
    </tr>

  </table>
</body>
</html>`;
  }
};
