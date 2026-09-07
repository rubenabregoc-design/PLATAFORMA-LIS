-- ⚖️ PLATAFORMA-LIS Analyzer Calibration Management (ISO 15189)

-- 1. Calibration Records
CREATE TABLE IF NOT EXISTS analyzer_calibrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  analyzer_id UUID REFERENCES analyzers(id) ON DELETE CASCADE,
  analyte_name TEXT NOT NULL,
  calibrator_lot TEXT NOT NULL,
  calibration_date TIMESTAMPTZ DEFAULT now(),
  expiration_date DATE NOT NULL,
  status TEXT DEFAULT 'SUCCESS', -- SUCCESS, FAILED, WARNING
  k_factor NUMERIC, -- Slope/Intercept or K-factor
  offset_value NUMERIC,
  performed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE analyzer_calibrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Calibration Tenant Isolation" ON analyzer_calibrations FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX idx_calibrations_analyzer ON analyzer_calibrations(analyzer_id);
CREATE INDEX idx_calibrations_expiry ON analyzer_calibrations(expiration_date);
