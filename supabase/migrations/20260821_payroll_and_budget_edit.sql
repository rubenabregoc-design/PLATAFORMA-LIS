-- 💰 PLATAFORMA-LIS Payroll & Budget Management Professional Extension

-- 1. Technologist Payment Configuration (Incentives)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS base_salary NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_per_test NUMERIC DEFAULT 0;

-- 2. Payroll Runs Table
CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  tests_processed INTEGER DEFAULT 0,
  base_pay NUMERIC NOT NULL,
  incentive_pay NUMERIC DEFAULT 0,
  total_pay NUMERIC NOT NULL,
  status TEXT DEFAULT 'PENDING', -- PENDING, PAID
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payroll Tenant Isolation" ON payroll_runs FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 3. Trigger to calculate processed tests count (Simplified for now)
-- In a real system, this would be a monthly scheduled job or view
CREATE OR REPLACE VIEW technologist_production_view AS
SELECT
  p.id as profile_id,
  p.name,
  EXTRACT(MONTH FROM tr.updated_at) as month,
  EXTRACT(YEAR FROM tr.updated_at) as year,
  count(tr.id) as total_tests
FROM profiles p
JOIN test_results tr ON p.name = tr.technical_validated_by -- Based on name for now, should be ID
WHERE tr.status = 'VALIDADO'
GROUP BY p.id, p.name, month, year;
