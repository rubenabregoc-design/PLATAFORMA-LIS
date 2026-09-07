-- 👶 PLATAFORMA-LIS Pediatric Vitals & Specialized Formulas

-- 1. Add Height/Weight to Patients for Formulas (Schwartz, BSA, etc)
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS height_cm NUMERIC,
ADD COLUMN IF NOT EXISTS weight_kg NUMERIC;

-- 2. Register Schwartz Formula for Pediatrics
INSERT INTO test_formulas (tenant_id, target_test_code, formula_name, expression, required_variables)
SELECT id, 'TFG_PEDIATRIC', 'Ecuación de Schwartz (Niños)', '0.413 * ([HEIGHT] / [CREAT])', '["CREAT", "HEIGHT", "AGE"]' FROM tenants
ON CONFLICT DO NOTHING;

-- 3. Trigger simulation notes:
-- In a real production environment, a database trigger or edge function
-- would choose between TFG_EPI and TFG_PEDIATRIC based on the age calculated.
