-- 🧪 PLATAFORMA-LIS Derived Results & Formula Engine (ISO 15189)

-- 1. Formula Definitions
CREATE TABLE IF NOT EXISTS test_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  target_test_code TEXT NOT NULL, -- The test that will hold the result (e.g., 'eGFR')
  formula_name TEXT NOT NULL,
  expression TEXT NOT NULL, -- e.g., '141 * min([CREAT]/0.9, 1)^-0.411 * ...'
  required_variables JSONB NOT NULL, -- ['CREAT', 'AGE', 'GENDER']
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Calculation Logs (For troubleshooting formula logic)
CREATE TABLE IF NOT EXISTS formula_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  target_test_code TEXT,
  input_values JSONB,
  calculated_value TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE test_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE formula_execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Formulas Tenant Isolation" ON test_formulas FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Formula Logs Tenant Isolation" ON formula_execution_logs FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 3. Initial Common Formulas
INSERT INTO test_formulas (tenant_id, target_test_code, formula_name, expression, required_variables)
SELECT id, 'LDL_CALC', 'Fórmula de Friedewald', '([CHOL] - [HDL] - ([TRIG] / 5))', '["CHOL", "HDL", "TRIG"]' FROM tenants
ON CONFLICT DO NOTHING;

INSERT INTO test_formulas (tenant_id, target_test_code, formula_name, expression, required_variables)
SELECT id, 'TFG_EPI', 'CKD-EPI Creatinina (2021)', 'Cálculo multivariable basado en Creatinina, Edad y Sexo', '["CREAT", "AGE", "GENDER"]' FROM tenants
ON CONFLICT DO NOTHING;
