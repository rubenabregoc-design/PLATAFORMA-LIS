-- 📈 PLATAFORMA-LIS WHO Growth Charts & Professional Liability Insurance

-- 1. WHO Growth Standards (Simplified Z-Score Data)
CREATE TABLE IF NOT EXISTS growth_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gender DbGender NOT NULL,
  age_months INTEGER NOT NULL,
  measure_type TEXT NOT NULL, -- WEIGHT_FOR_AGE, HEIGHT_FOR_AGE, BMI_FOR_AGE
  l NUMERIC, -- Box-Cox power
  m NUMERIC, -- Median
  s NUMERIC, -- Coefficient of variation
  p3 NUMERIC, p15 NUMERIC, p50 NUMERIC, p85 NUMERIC, p97 NUMERIC,
  UNIQUE(gender, age_months, measure_type)
);

-- 2. Professional Liability Insurance (Responsabilidad Civil Profesional)
CREATE TABLE IF NOT EXISTS staff_professional_insurances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  policy_number TEXT NOT NULL,
  insurance_company TEXT NOT NULL,
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  coverage_limit NUMERIC NOT NULL,
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, RENEWING
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE growth_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_professional_insurances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Growth Standards Public Read" ON growth_standards FOR SELECT USING (true);
CREATE POLICY "Prof Insurance Tenant Isolation" ON staff_professional_insurances FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Indexing for performance
CREATE INDEX idx_growth_age ON growth_standards(age_months);
CREATE INDEX idx_staff_ins_expiry ON staff_professional_insurances(expiry_date);
