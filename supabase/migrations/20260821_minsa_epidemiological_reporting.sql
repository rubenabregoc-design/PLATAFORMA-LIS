-- 🦠 PLATAFORMA-LIS MINSA Epidemiological Reporting & Disease Surveillance

-- 1. Notifiable Diseases Configuration
CREATE TABLE IF NOT EXISTS epidemiological_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  test_code TEXT NOT NULL, -- e.g., 'HIV', 'SYPH', 'DENG', 'CHAG'
  disease_name TEXT NOT NULL,
  minsa_code TEXT, -- Official MINSA classification code
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Epidemiological Reports (History of submissions to MINSA)
CREATE TABLE IF NOT EXISTS epidemiological_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  report_number TEXT UNIQUE, -- e.g., 'EPI-2026-001'
  report_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'DRAFT', -- DRAFT, SENT, ACKNOWLEDGED
  content JSONB, -- Consolidated stats for the period
  total_cases INTEGER DEFAULT 0,
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. VIEW: Case Detection for MINSA (Real-time surveillance)
-- Identifies validated results that match epidemiological markers
CREATE OR REPLACE VIEW minsa_surveillance_view AS
SELECT
    tr.tenant_id,
    p.id as patient_id,
    p.first_name,
    p.last_name,
    p.document_id,
    p.provenance_province,
    em.disease_name,
    tr.result_value,
    tr.updated_at as detection_date,
    tr.id as result_id
FROM test_results tr
JOIN orders o ON tr.order_id = o.id
JOIN patients p ON o.patient_id = p.id
JOIN epidemiological_markers em ON tr.test_code = em.test_code
WHERE tr.status = 'VALIDADO'
AND (tr.result_value ILIKE '%POSITIVO%' OR tr.result_value ILIKE '%REACTIVO%');

-- RLS Policies
ALTER TABLE epidemiological_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE epidemiological_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Epi Markers Tenant Isolation" ON epidemiological_markers FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Epi Reports Tenant Isolation" ON epidemiological_reports FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Initial Official Markers for Panama
INSERT INTO epidemiological_markers (tenant_id, test_code, disease_name, minsa_code)
SELECT id, 'HIV', 'VIH/SIDA', 'B20-B24' FROM tenants ON CONFLICT DO NOTHING;

INSERT INTO epidemiological_markers (tenant_id, test_code, disease_name, minsa_code)
SELECT id, 'SYPH', 'Sífilis', 'A50-A53' FROM tenants ON CONFLICT DO NOTHING;

INSERT INTO epidemiological_markers (tenant_id, test_code, disease_name, minsa_code)
SELECT id, 'DENG', 'Dengue', 'A90-A91' FROM tenants ON CONFLICT DO NOTHING;

INSERT INTO epidemiological_markers (tenant_id, test_code, disease_name, minsa_code)
SELECT id, 'MAL', 'Malaria', 'B50-B54' FROM tenants ON CONFLICT DO NOTHING;
