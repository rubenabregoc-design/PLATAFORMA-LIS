-- 🛡️ PLATAFORMA-LIS ISO 15189:2022 Internal Audit Engine

-- 1. ISO Clauses & Requirements
CREATE TABLE IF NOT EXISTS iso_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clause_number TEXT NOT NULL, -- e.g., '5.1', '7.3.7'
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'MANAGEMENT', -- MANAGEMENT, TECHNICAL
  importance TEXT DEFAULT 'CRITICAL',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Audit Findings & Evidence
CREATE TABLE IF NOT EXISTS iso_audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  clause_id UUID REFERENCES iso_clauses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'COMPLIANT', -- COMPLIANT, NON_CONFORMITY, OPPORTUNITY_IMPROVEMENT
  evidence_description TEXT, -- e.g., 'Validated by Module 2 (Westgard Interlock)'
  related_module_id TEXT, -- Logical reference to UI tab
  audited_by UUID REFERENCES auth.users(id),
  audited_at TIMESTAMPTZ DEFAULT now(),
  next_audit_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE iso_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE iso_audit_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ISO Clauses Public Read" ON iso_clauses FOR SELECT USING (true);
CREATE POLICY "ISO Audit Tenant Isolation" ON iso_audit_findings FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 3. Seed Major ISO 15189 Clauses
INSERT INTO iso_clauses (clause_number, title, category, description) VALUES
('4.0', 'Requisitos Generales (Imparcialidad/Confidencialidad)', 'MANAGEMENT', 'Asegurar la protección de datos del paciente conforme a Ley 81.'),
('5.1', 'Personal y Competencia', 'TECHNICAL', 'Verificación de idoneidad, títulos y capacitación continua.'),
('5.3', 'Proveedores y Suministros Externos', 'MANAGEMENT', 'Evaluación de reactivos e insumos críticos.'),
('6.0', 'Recursos Estructurales y Equipos', 'TECHNICAL', 'Mantenimiento preventivo, calibración y trazabilidad metrológica.'),
('7.2', 'Procesos Pre-analíticos', 'TECHNICAL', 'Identificación de pacientes, integridad de muestras y transporte.'),
('7.3', 'Procesos Analíticos (QC)', 'TECHNICAL', 'Control de calidad interno (Westgard) e incertidumbre de medida.'),
('7.3.7', 'Aseguramiento de la Validez', 'TECHNICAL', 'Interlock operativo y bloqueo de resultados por fallo de QC.'),
('7.4', 'Procesos Post-analíticos', 'TECHNICAL', 'Validación médica, informes y notificación de valores críticos.'),
('8.0', 'Sistema de Gestión', 'MANAGEMENT', 'Gestión de riesgos, no conformidades y mejora continua.'),
('8.6', 'Quejas y Sugerencias', 'MANAGEMENT', 'Voz del cliente y resolución de conflictos.');
