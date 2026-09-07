-- 🛡️ PLATAFORMA-LIS Equipment Insurances & Epidemiological Heatmap Support

-- 1. Equipment Insurances & Warranties
CREATE TABLE IF NOT EXISTS equipment_insurances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  analyzer_id UUID REFERENCES analyzers(id) ON DELETE CASCADE,
  policy_number TEXT NOT NULL,
  insurance_company TEXT NOT NULL,
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  coverage_amount NUMERIC,
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, CANCELLED
  terms_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS equipment_warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  analyzer_id UUID REFERENCES analyzers(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  coverage_details TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. VIEW: Epidemiological Aggregation by Province (For Heatmap)
CREATE OR REPLACE VIEW epidemiological_heatmap_view AS
SELECT
    tr.tenant_id,
    p.provenance_province, -- e.g., 'PANAMÁ', 'COLÓN', 'CHIRIQUÍ'
    em.disease_name,
    COUNT(*) as case_count
FROM test_results tr
JOIN orders o ON tr.order_id = o.id
JOIN patients p ON o.patient_id = p.id
JOIN epidemiological_markers em ON tr.test_code = em.test_code
WHERE tr.status = 'VALIDADO'
AND (tr.result_value ILIKE '%POSITIVO%' OR tr.result_value ILIKE '%REACTIVO%')
GROUP BY tr.tenant_id, p.provenance_province, em.disease_name;

-- RLS Policies
ALTER TABLE equipment_insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_warranties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Equipment Insurances Isolation" ON equipment_insurances FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Equipment Warranties Isolation" ON equipment_warranties FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
