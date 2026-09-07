-- 🧪 PLATAFORMA-LIS Reagent Efficiency & External Audit Preparation

-- 1. VIEW: Reagent Efficiency (Patient Tests vs. Calibrations/QC)
-- This measures "Analytical Yield": How many patient results we get per mL/Test of reagent used,
-- accounting for the "analytical tax" (QC and Calibrations).
CREATE OR REPLACE VIEW reagent_efficiency_view AS
SELECT
    tr.tenant_id,
    tr.test_code,
    COUNT(tr.id) as patient_tests_count,
    (SELECT COUNT(*) FROM qc_runs qr JOIN qc_configurations qc ON qr.config_id = qc.id WHERE qc.analyte_name = tr.test_code AND qr.tenant_id = tr.tenant_id) as qc_runs_count,
    (SELECT COUNT(*) FROM analyzer_calibrations ac WHERE ac.analyte_name = tr.test_code AND ac.tenant_id = tr.tenant_id) as calibrations_count,
    -- Efficiency Ratio: Patient Tests / Total Analytical Events
    CASE
        WHEN (COUNT(tr.id) +
             (SELECT COUNT(*) FROM qc_runs qr JOIN qc_configurations qc ON qr.config_id = qc.id WHERE qc.analyte_name = tr.test_code AND qr.tenant_id = tr.tenant_id) +
             (SELECT COUNT(*) FROM analyzer_calibrations ac WHERE ac.analyte_name = tr.test_code AND ac.tenant_id = tr.tenant_id)) > 0
        THEN (COUNT(tr.id)::numeric / (COUNT(tr.id) +
             (SELECT COUNT(*) FROM qc_runs qr JOIN qc_configurations qc ON qr.config_id = qc.id WHERE qc.analyte_name = tr.test_code AND qr.tenant_id = tr.tenant_id) +
             (SELECT COUNT(*) FROM analyzer_calibrations ac WHERE ac.analyte_name = tr.test_code AND ac.tenant_id = tr.tenant_id)) * 100)
        ELSE 0
    END as efficiency_percentage
FROM test_results tr
WHERE tr.status = 'VALIDADO'
GROUP BY tr.tenant_id, tr.test_code;

-- 2. External Audit Registry (ISO 15189 §8.8)
CREATE TABLE IF NOT EXISTS external_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  entity_name TEXT NOT NULL, -- e.g., 'MINSA', 'Gorgas', 'ISO Accreditor'
  audit_type TEXT NOT NULL, -- REGULATORY, ACCREDITATION, SURVEILLANCE
  start_date DATE NOT NULL,
  end_date DATE,
  lead_auditor TEXT,
  scope TEXT,
  status TEXT DEFAULT 'PLANNED', -- PLANNED, IN_PROGRESS, COMPLETED, CLOSED
  result_summary TEXT, -- e.g., 'Recommended for Accreditation'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. External Audit Findings (Findings from external bodies)
CREATE TABLE IF NOT EXISTS external_audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES external_audits(id) ON DELETE CASCADE,
  clause_reference TEXT,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'MINOR', -- MINOR, MAJOR, OBSERVATION
  action_plan TEXT,
  due_date DATE,
  status TEXT DEFAULT 'OPEN', -- OPEN, CLOSED
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE external_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_audit_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "External Audits Tenant Isolation" ON external_audits FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Audit Findings Tenant Isolation" ON external_audit_findings FOR ALL USING (
  EXISTS (SELECT 1 FROM external_audits a WHERE a.id = external_audit_findings.audit_id AND a.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
);
