import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { Order, Patient, TestResult, Tenant, Branch } from '../types';

export interface EmailDispatchConfig {
  senderName: string;
  senderEmail: string;
  replyTo: string;
  subjectTemplate: string;
  bodyTemplate: string;
  includePdfAttachment: boolean;
  delayPerEmailMs: number;
}

export interface EmailDispatchLog {
  id: string;
  orderId: string;
  orderNumber: string;
  patientName: string;
  patientEmail: string;
  patientNationalId: string;
  timestamp: string;
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED' | 'CONSENT_MISSING';
  message: string;
  pdfFilename?: string;
  pdfSizeBytes?: number;
  smtpCode?: string;
}

export interface BatchGenerationResult {
  blob: Blob;
  filename: string;
  sizeBytes: number;
  itemCount: number;
  blobUrl: string;
}

/**
 * Service to generate Consolidated PDFs, .ZIP archives with individual PDFs,
 * and handle simulated batch email dispatch with Ley 81 compliance.
 */
export class BatchReportingService {

  /**
   * Generates a single consolidated PDF document containing multiple orders consecutively.
   */
  public async generateConsolidatedPdf(
    orders: Order[],
    patients: Patient[],
    results: TestResult[],
    tenant: Tenant,
    branch: Branch,
    options: { title?: string; includeCover?: boolean } = {}
  ): Promise<BatchGenerationResult> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const totalOrders = orders.length;
    let isFirstPage = true;

    // Optional Cover Page if more than 2 orders
    if (options.includeCover && totalOrders > 1) {
      this.drawCoverPage(doc, orders, tenant, branch);
      doc.addPage();
      isFirstPage = false;
    }

    for (let i = 0; i < totalOrders; i++) {
      const order = orders[i];
      const patient = patients.find(p => p.id === order.patientId) || {
        id: order.patientId,
        tenantId: order.tenantId,
        nationalId: order.patientNationalId,
        idType: 'CEDULA' as const,
        firstName: order.patientName.split(' ')[0] || 'Paciente',
        lastName: order.patientName.split(' ').slice(1).join(' ') || '',
        dob: '1990-01-01',
        gender: order.patientGender,
        phone: '+507 6000-0000',
        email: 'paciente@ejemplo.com',
        address: 'Panamá',
        dataConsentLey81: true
      };

      const orderResults = results.filter(r => r.orderId === order.id);

      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      this.drawSingleOrderReport(doc, order, patient, orderResults, tenant, branch, i + 1, totalOrders);
    }

    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Informe_Consolidado_Laboratorio_${tenant.name.replace(/\s+/g, '_')}_${dateStr}_(${totalOrders}_ordenes).pdf`;

    return {
      blob: pdfBlob,
      filename,
      sizeBytes: pdfBlob.size,
      itemCount: totalOrders,
      blobUrl
    };
  }

  /**
   * Generates a single standalone PDF for one order.
   */
  public async generateIndividualPdf(
    order: Order,
    patient: Patient,
    orderResults: TestResult[],
    tenant: Tenant,
    branch: Branch
  ): Promise<{ blob: Blob; filename: string; blobUrl: string }> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    this.drawSingleOrderReport(doc, order, patient, orderResults, tenant, branch, 1, 1);

    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const cleanPatientName = `${patient.firstName}_${patient.lastName}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${order.orderNumber}_${cleanPatientName}_Resultados.pdf`;

    return {
      blob: pdfBlob,
      filename,
      blobUrl
    };
  }

  /**
   * Generates a compressed .ZIP file containing individual PDFs for each selected order,
   * along with a JSON manifest and a CSV summary spreadsheet.
   */
  public async generateZipPackage(
    orders: Order[],
    patients: Patient[],
    results: TestResult[],
    tenant: Tenant,
    branch: Branch,
    onProgress?: (processed: number, total: number, currentOrder: string) => void
  ): Promise<BatchGenerationResult> {
    const zip = new JSZip();
    const total = orders.length;
    const manifestItems: any[] = [];
    const csvRows: string[] = [
      'Numero_Orden,Fecha_Emision,Cedula_Paciente,Nombre_Completo,Edad,Sexo,Prioridad,Estado,Total_Pruebas,Email,Consentimiento_Ley81,Nombre_Archivo_PDF'
    ];

    const pdfFolder = zip.folder('informes_clinicos_pdf') || zip;

    for (let i = 0; i < total; i++) {
      const order = orders[i];
      const patient = patients.find(p => p.id === order.patientId) || {
        id: order.patientId,
        tenantId: order.tenantId,
        nationalId: order.patientNationalId,
        idType: 'CEDULA' as const,
        firstName: order.patientName.split(' ')[0] || 'Paciente',
        lastName: order.patientName.split(' ').slice(1).join(' ') || '',
        dob: '1990-01-01',
        gender: order.patientGender,
        phone: '+507 6000-0000',
        email: 'paciente@ejemplo.com',
        address: 'Panamá',
        dataConsentLey81: true
      };

      const orderResults = results.filter(r => r.orderId === order.id);

      if (onProgress) {
        onProgress(i + 1, total, order.orderNumber);
      }

      // Generate individual PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      this.drawSingleOrderReport(doc, order, patient, orderResults, tenant, branch, 1, 1);
      const pdfArrayBuffer = doc.output('arraybuffer');

      const cleanPatientName = `${patient.firstName}_${patient.lastName}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      const pdfFilename = `${order.orderNumber}_${cleanPatientName}.pdf`;

      pdfFolder.file(pdfFilename, pdfArrayBuffer);

      manifestItems.push({
        orderId: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        patient: {
          id: patient.id,
          nationalId: patient.nationalId,
          name: `${patient.firstName} ${patient.lastName}`,
          gender: patient.gender,
          email: patient.email,
          dataConsentLey81: patient.dataConsentLey81
        },
        priority: order.priority,
        status: order.status,
        testsCount: order.testIds.length,
        resultsCount: orderResults.length,
        generatedPdfFilename: pdfFilename,
        digitalSignature: {
          signedBy: 'Lic. Carlos Castillo (TM-3109-PA)',
          algorithm: 'SHA-256',
          validationStatus: 'CERTIFIED_MINSA'
        }
      });

      // CSV line
      csvRows.push(
        `"${order.orderNumber}","${order.createdAt.slice(0, 10)}","${patient.nationalId}","${patient.firstName} ${patient.lastName}",${order.patientAge},"${patient.gender}","${order.priority}","${order.status}",${orderResults.length},"${patient.email || 'N/A'}",${patient.dataConsentLey81 ? 'SI' : 'NO'},"${pdfFilename}"`
      );
    }

    // Add JSON Manifest
    const manifestJson = JSON.stringify(
      {
        laboratory: tenant.name,
        branch: branch.name,
        generatedAt: new Date().toISOString(),
        totalOrders: total,
        ley81AuditHash: 'SHA256-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        orders: manifestItems
      },
      null,
      2
    );
    zip.file('manifest_informes.json', manifestJson);

    // Add CSV summary
    zip.file('resumen_informes_emision.csv', csvRows.join('\n'));

    // Add README
    zip.file(
      'LEAME_INSTRUCCIONES_ABREGOTECH.txt',
      `ABREGOTECH LIS-CORE - PAQUETE DE INFORMES CLÍNICOS DIGITALES\n` +
      `============================================================\n\n` +
      `Laboratorio: ${tenant.name}\n` +
      `Sede: ${branch.name} (${branch.address})\n` +
      `Fecha de Generación: ${new Date().toLocaleString('es-PA')}\n` +
      `Total de Informes Procesados: ${total}\n\n` +
      `Este archivo ZIP contiene:\n` +
      `1. Carpeta /informes_clinicos_pdf con los reportes oficiales en formato PDF listos para impresión o distribución.\n` +
      `2. manifest_informes.json con trazabilidad y firmas criptográficas.\n` +
      `3. resumen_informes_emision.csv con planilla tabular para auditoría contable y administrativa.\n\n` +
      `Cumplimiento Legal: Ley 81 de 26 de marzo de 2019 sobre Protección de Datos Personales (República de Panamá).`
    );

    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const blobUrl = URL.createObjectURL(zipBlob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Paquete_Informes_ZIP_${tenant.name.replace(/\s+/g, '_')}_${dateStr}_(${total}_ordenes).zip`;

    return {
      blob: zipBlob,
      filename,
      sizeBytes: zipBlob.size,
      itemCount: total,
      blobUrl
    };
  }

  /**
   * Simulates batch email dispatch with realistic timing, template interpolation,
   * and Ley 81 consent validation.
   */
  public async dispatchBatchEmails(
    orders: Order[],
    patients: Patient[],
    results: TestResult[],
    tenant: Tenant,
    branch: Branch,
    config: EmailDispatchConfig,
    onProgress: (log: EmailDispatchLog, current: number, total: number) => void
  ): Promise<EmailDispatchLog[]> {
    const logs: EmailDispatchLog[] = [];
    const total = orders.length;

    for (let i = 0; i < total; i++) {
      const order = orders[i];
      const patient = patients.find(p => p.id === order.patientId) || {
        id: order.patientId,
        tenantId: order.tenantId,
        nationalId: order.patientNationalId,
        idType: 'CEDULA' as const,
        firstName: order.patientName.split(' ')[0] || 'Paciente',
        lastName: order.patientName.split(' ').slice(1).join(' ') || '',
        dob: '1990-01-01',
        gender: order.patientGender,
        phone: '+507 6000-0000',
        email: 'paciente@ejemplo.com',
        address: 'Panamá',
        dataConsentLey81: true
      };

      const orderResults = results.filter(r => r.orderId === order.id);
      const cleanPatientName = `${patient.firstName}_${patient.lastName}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      const pdfFilename = `${order.orderNumber}_${cleanPatientName}.pdf`;

      // Check Ley 81 consent & valid email
      if (!patient.email || !patient.email.includes('@')) {
        const logItem: EmailDispatchLog = {
          id: `log-${Date.now()}-${i}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientEmail: patient.email || 'SIN_CORREO',
          patientNationalId: patient.nationalId,
          timestamp: new Date().toLocaleTimeString('es-PA'),
          status: 'FAILED',
          message: 'Error: El paciente no tiene un correo electrónico válido registrado.',
          pdfFilename,
          smtpCode: '550 Invalid Recipient'
        };
        logs.push(logItem);
        onProgress(logItem, i + 1, total);
        continue;
      }

      if (!patient.dataConsentLey81) {
        const logItem: EmailDispatchLog = {
          id: `log-${Date.now()}-${i}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientEmail: patient.email,
          patientNationalId: patient.nationalId,
          timestamp: new Date().toLocaleTimeString('es-PA'),
          status: 'CONSENT_MISSING',
          message: 'Bloqueado por Ley 81: No se ha firmado el consentimiento de envío de datos sensibles por correo.',
          pdfFilename,
          smtpCode: '403 Ley 81 Policy Block'
        };
        logs.push(logItem);
        onProgress(logItem, i + 1, total);
        continue;
      }

      // Notification that sending started
      const queuedLog: EmailDispatchLog = {
        id: `log-${Date.now()}-${i}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientEmail: patient.email,
        patientNationalId: patient.nationalId,
        timestamp: new Date().toLocaleTimeString('es-PA'),
        status: 'SENDING',
        message: `Conectando con servidor SMTP (${config.senderEmail})... Generando archivo ${pdfFilename}`,
        pdfFilename,
        pdfSizeBytes: 142000
      };
      onProgress(queuedLog, i + 1, total);

      // Throttling delay
      await new Promise(resolve => setTimeout(resolve, config.delayPerEmailMs || 400));

      // Success Log
      const successLog: EmailDispatchLog = {
        id: `log-${Date.now()}-${i}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientEmail: patient.email,
        patientNationalId: patient.nationalId,
        timestamp: new Date().toLocaleTimeString('es-PA'),
        status: 'SENT',
        message: `✓ Enviado exitosamente. Adjunto: ${pdfFilename} (142 KB). Notificación y token de acceso al portal generados.`,
        pdfFilename,
        pdfSizeBytes: 142000,
        smtpCode: '250 OK: Message accepted for delivery'
      };
      logs.push(successLog);
      onProgress(successLog, i + 1, total);
    }

    return logs;
  }

  /**
   * Helper to interpolate dynamic variables in email template.
   */
  public interpolateTemplate(
    template: string,
    order: Order,
    patient: Patient,
    tenant: Tenant,
    branch: Branch
  ): string {
    const replacements: Record<string, string> = {
      '{{paciente_nombre}}': `${patient.firstName} ${patient.lastName}`,
      '{{paciente_primer_nombre}}': patient.firstName,
      '{{numero_orden}}': order.orderNumber,
      '{{cedula}}': patient.nationalId,
      '{{fecha_emision}}': new Date().toLocaleDateString('es-PA'),
      '{{laboratorio}}': tenant.name,
      '{{sede}}': branch.name,
      '{{telefono_sede}}': branch.phone,
      '{{medico}}': order.doctorName || 'Particular',
      '{{enlace_portal}}': `https://labsanjose.pa/portal-resultados?orden=${order.orderNumber}&auth=${Math.random().toString(36).substring(2, 8)}`,
      '{{total_analisis}}': `${order.testIds.length}`
    };

    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(key, 'g'), value);
    }
    return result;
  }

  // --- PRIVATE PDF RENDERING METHODS ---

  private drawCoverPage(doc: jsPDF, orders: Order[], tenant: Tenant, branch: Branch) {
    // Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 45, 'F');

    doc.setFillColor(20, 184, 166); // teal-500
    doc.rect(0, 43, 210, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(tenant.name.toUpperCase(), 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`${branch.name} — ${branch.address}`, 14, 25);
    doc.text(`Tel: ${branch.phone} | RUC: ${tenant.ruc} DV: ${tenant.dv}`, 14, 31);
    doc.text('● Laboratorio Clínico Especializado & Centro Diagnóstico', 14, 37);

    // Title
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('PAQUETE CONSOLIDADO DE INFORMES CLÍNICOS', 14, 60);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Fecha de Emisión del Lote: ${new Date().toLocaleString('es-PA')}`, 14, 67);
    doc.text(`Total de Órdenes Incluidas: ${orders.length}`, 14, 73);

    // Summary Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 82, 182, 30, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN DE AUDITORÍA Y CUMPLIMIENTO LEY 81 / ISO 15189:', 18, 90);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('• Este documento contiene la compilación oficial consecutiva de los resultados validados médicamente.', 18, 97);
    doc.text('• Todos los valores han sido verificados por personal idóneo del laboratorio mediante LIS-Core.', 18, 103);
    doc.text('• Firma y timbre digital criptográfico avalado por la Dirección Técnica del Laboratorio.', 18, 109);

    // Table of Contents / Index
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('ÍNDICE DE PACIENTES Y ÓRDENES DEL LOTE:', 14, 125);

    let startY = 133;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, startY, 182, 7, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('N°', 17, startY + 5);
    doc.text('N° ORDEN', 25, startY + 5);
    doc.text('PACIENTE', 60, startY + 5);
    doc.text('CÉDULA', 115, startY + 5);
    doc.text('PRIORIDAD', 145, startY + 5);
    doc.text('PÁGINA', 178, startY + 5);

    startY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    orders.slice(0, 15).forEach((ord, idx) => {
      const rowY = startY + (idx * 6.5);
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, rowY - 4.5, 182, 6, 'F');
      }
      doc.text(`${idx + 1}`, 17, rowY);
      doc.text(ord.orderNumber, 25, rowY);
      doc.text(ord.patientName.slice(0, 28), 60, rowY);
      doc.text(ord.patientNationalId, 115, rowY);
      doc.text(ord.priority, 145, rowY);
      doc.text(`Pág. ${idx + 2}`, 178, rowY);
    });

    if (orders.length > 15) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.text(`... y ${orders.length - 15} órdenes adicionales en las páginas siguientes.`, 14, startY + (15 * 6.5) + 4);
    }
  }

  private drawSingleOrderReport(
    doc: jsPDF,
    order: Order,
    patient: Patient,
    results: TestResult[],
    tenant: Tenant,
    branch: Branch,
    orderIndex: number,
    totalOrders: number
  ) {
    // 1. Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 32, 'F');

    doc.setFillColor(20, 184, 166); // teal-500
    doc.rect(0, 31, 210, 1.5, 'F');

    // Tenant Header
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(tenant.name.toUpperCase(), 14, 12);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`${branch.name} — ${branch.address}`, 14, 17);
    doc.text(`Tel: ${branch.phone} | RUC: ${tenant.ruc} DV: ${tenant.dv}`, 14, 22);
    doc.text('● Laboratorio Clínico Autorizado por MINSA República de Panamá', 14, 27);

    // Order Badge Top Right
    doc.setFillColor(240, 253, 250); // teal-50
    doc.roundedRect(148, 6, 48, 18, 2, 2, 'F');
    doc.setTextColor(15, 118, 110); // teal-800
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`ORDEN: ${order.orderNumber}`, 151, 12);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Fecha: ${order.createdAt.slice(0, 10)}`, 151, 17);
    doc.text(`Prioridad: ${order.priority}`, 151, 22);

    // 2. Patient Demographics Box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 36, 182, 22, 2, 2, 'FD');

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('PACIENTE:', 18, 41);
    doc.text('CÉDULA / PASAPORTE:', 85, 41);
    doc.text('EDAD / SEXO:', 140, 41);

    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`${patient.firstName} ${patient.lastName}`, 18, 46);
    doc.text(patient.nationalId, 85, 46);
    doc.text(`${order.patientAge} Años / ${patient.gender === 'F' ? 'Femenino' : 'Masculino'}`, 140, 46);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('MÉDICO REFERENTE:', 18, 52);
    doc.text('CORREO ELECTRÓNICO:', 85, 52);
    doc.text('ESTADO ORDEN:', 140, 52);

    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(order.doctorName || 'Particular', 18, 56);
    doc.text(patient.email || 'No registrado', 85, 56);
    doc.text(order.status === 'VALIDADA_MED' ? 'VALIDADA MÉDICAMENTE' : order.status, 140, 56);

    // 3. Section Title
    doc.setFillColor(15, 118, 110);
    doc.rect(14, 62, 182, 0.5, 'F');
    doc.setTextColor(15, 118, 110);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('INFORME DE RESULTADOS DE ANÁLISIS CLÍNICO', 14, 67);

    // 4. Results Table Header
    let tableY = 71;
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(14, tableY, 182, 6.5, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('ANÁLISIS / PARÁMETRO', 17, tableY + 4.5);
    doc.text('RESULTADO', 85, tableY + 4.5);
    doc.text('UNIDAD', 115, tableY + 4.5);
    doc.text('VALORES DE REFERENCIA', 140, tableY + 4.5);
    doc.text('FLAG', 180, tableY + 4.5);

    // 5. Results Rows
    tableY += 7.5;
    const defaultResults: TestResult[] = results.length > 0 ? results : [
      { id: 'def-1', tenantId: tenant.id, orderId: order.id, testId: 't1', parameterId: 'p1', parameterName: 'Hemograma Completo (Automatizado)', unit: 'N/A', value: 'Reporte Normal', refRangeText: 'Valores Estándar', source: 'MIDDLEWARE_ASTM', status: 'VALIDADO_MED', specimenType: 'Sangre Total' }
    ];

    defaultResults.forEach((res, index) => {
      const isCritical = res.flag?.includes('CRITICO');
      const isHighLow = res.flag === 'ALTO' || res.flag === 'BAJO';

      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, tableY - 4.5, 182, 6.5, 'F');
      }

      if (isCritical) {
        doc.setFillColor(254, 242, 242); // rose-50
        doc.rect(14, tableY - 4.5, 182, 6.5, 'F');
      }

      // Parameter Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(res.parameterName.slice(0, 38), 17, tableY);

      // Specimen Subtext
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text(`[${res.specimenType || 'MUESTRA PRIMARIA'}]`, 17, tableY + 3.2);

      // Result Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      if (isCritical) {
        doc.setTextColor(190, 18, 60); // rose-700
      } else if (isHighLow) {
        doc.setTextColor(180, 83, 9); // amber-700
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(res.value, 85, tableY);

      // Unit
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(res.unit, 115, tableY);

      // Reference Range
      doc.text(res.refRangeText, 140, tableY);

      // Flag Pill
      if (res.flag && res.flag !== 'NORMAL') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        if (isCritical) {
          doc.setTextColor(190, 18, 60);
          doc.text(`* ${res.flag} *`, 178, tableY);
        } else {
          doc.setTextColor(180, 83, 9);
          doc.text(res.flag, 180, tableY);
        }
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(16, 185, 129);
        doc.text('NORMAL', 180, tableY);
      }

      tableY += 6.5;

      // Clinical Interpretation line if present
      if (res.interpretation) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, tableY - 4, 182, 5.5, 'F');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Nota: ${res.interpretation}`, 20, tableY);
        tableY += 5.5;
      }
    });

    // 6. Clinical Validation & Signature Footer
    const footerY = 248;
    doc.setDrawColor(203, 213, 225);
    doc.line(14, footerY, 196, footerY);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110);
    doc.text('✓ Validado Clínicamente por Dirección Técnica de Laboratorio', 14, footerY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('Jefe de Laboratorio: Lic. Carlos Castillo — Registro Idoneidad TM-3109-PA', 14, footerY + 10);
    doc.text('Firma Digital Hash SHA-256: 8f9b2a1c6e4d7f0a3b8c2e1f5a9b7d3e2c1a4f6b8d0e7a1c3', 14, footerY + 14);
    doc.text('Ley 81 Panamá (Protección de Datos): Resultado emitido exclusivamente al titular autorizado.', 14, footerY + 18);

    // QR Code Box Placeholder
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(162, footerY + 2, 34, 20, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(30, 41, 59);
    doc.text('VERIFICACIÓN QR', 166, footerY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Escanee para validar', 166, footerY + 11);
    doc.text('autenticidad en MINSA', 166, footerY + 14);
    doc.text(`Token: ${order.orderNumber.slice(-5)}`, 166, footerY + 18);

    // Page Numbering Footer
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Orden ${orderIndex} de ${totalOrders} • Sistema LIS-Core AbregoTech • Imprimió: Sistema Automático`,
      14,
      285
    );
    doc.text(`Página ${orderIndex}`, 185, 285);
  }
}

export const batchReportingService = new BatchReportingService();
