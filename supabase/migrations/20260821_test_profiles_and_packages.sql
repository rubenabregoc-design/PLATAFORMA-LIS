-- 🧬 PLATAFORMA-LIS Test Profiles & Packages (BHC, Chem Panels, etc.)

-- 1. Profile Definitions (The "Commercial" names)
CREATE TABLE IF NOT EXISTS test_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'BHC COMPLETO', 'PERFIL LIPIDICO'
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profile Components (Mapping Profile -> Analytes)
CREATE TABLE IF NOT EXISTS test_profile_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES test_profiles(id) ON DELETE CASCADE,
  test_code TEXT NOT NULL, -- Links to reference_ranges.test_code
  sort_order INTEGER DEFAULT 0
);

-- RLS Policies
ALTER TABLE test_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_profile_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles Tenant Isolation" ON test_profiles FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Components Tenant Isolation" ON test_profile_components FOR ALL USING (
  EXISTS (SELECT 1 FROM test_profiles p WHERE p.id = test_profile_components.profile_id AND p.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
);

-- 3. Initial Demo Profiles for Panama
-- BHC NORMAL
WITH new_profile AS (
  INSERT INTO test_profiles (tenant_id, name, description)
  SELECT id, 'BHC NORMAL', 'Biometría Hematológica Completa (22 parámetros)' FROM tenants LIMIT 1
  RETURNING id
)
INSERT INTO test_profile_components (profile_id, test_code, sort_order)
SELECT id, 'WBC', 1 FROM new_profile UNION ALL
SELECT id, 'HGB', 2 FROM new_profile UNION ALL
SELECT id, 'HCT', 3 FROM new_profile UNION ALL
SELECT id, 'PLT', 4 FROM new_profile;

-- BHC + RETICULOCITOS
WITH new_profile_retic AS (
  INSERT INTO test_profiles (tenant_id, name, description)
  SELECT id, 'BHC + RETICULOCITOS', 'BHC Completo con recuento de reticulocitos' FROM tenants LIMIT 1
  RETURNING id
)
INSERT INTO test_profile_components (profile_id, test_code, sort_order)
SELECT id, 'WBC', 1 FROM new_profile_retic UNION ALL
SELECT id, 'HGB', 2 FROM new_profile_retic UNION ALL
SELECT id, 'RETIC_ABS', 3 FROM new_profile_retic UNION ALL
SELECT id, 'RETIC_PERC', 4 FROM new_profile_retic;

-- VES INDEPENDIENTE
WITH new_profile_ves AS (
  INSERT INTO test_profiles (tenant_id, name, description)
  SELECT id, 'VES', 'Velocidad de Eritrosedimentación' FROM tenants LIMIT 1
  RETURNING id
)
INSERT INTO test_profile_components (profile_id, test_code, sort_order)
SELECT id, 'VES', 1 FROM new_profile_ves;
