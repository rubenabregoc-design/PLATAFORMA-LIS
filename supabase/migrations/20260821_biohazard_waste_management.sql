-- ☣️ PLATAFORMA-LIS Bio-Hazardous Waste Management (ISO 15189 & Environmental Safety)

-- 1. Waste Categories
CREATE TABLE IF NOT EXISTS waste_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'BIOLOGICO_INFECCIOSO', 'PUNZOCORTANTES', 'QUIMICO_TOXICO'
  color_code TEXT, -- e.g., 'RED', 'YELLOW'
  storage_rules TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Daily Waste Logs
CREATE TABLE IF NOT EXISTS biohazard_waste_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES waste_categories(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  weight_kg NUMERIC NOT NULL,
  volume_liters NUMERIC,
  generated_by UUID REFERENCES auth.users(id),
  notes TEXT,
  status TEXT DEFAULT 'IN_STORAGE', -- IN_STORAGE, PICKED_UP, DISPOSED
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Disposal Pickups (Manifests)
CREATE TABLE IF NOT EXISTS biohazard_pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL, -- External disposal service
  manifest_number TEXT NOT NULL UNIQUE,
  total_weight_kg NUMERIC NOT NULL,
  pickup_date TIMESTAMPTZ DEFAULT now(),
  authorized_by UUID REFERENCES auth.users(id),
  certificate_url TEXT -- URL to the scanned disposal certificate
);

-- RLS Policies
ALTER TABLE waste_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE biohazard_waste_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE biohazard_pickups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Waste Categories Tenant Isolation" ON waste_categories FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Waste Logs Tenant Isolation" ON biohazard_waste_logs FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Pickups Tenant Isolation" ON biohazard_pickups FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Initial Categories (Standard Pan-American Colors)
INSERT INTO waste_categories (tenant_id, name, color_code, storage_rules)
SELECT id, 'BIOLÓGICO-INFECCIOSO (SANGRE)', 'RED', 'Bolsa roja, sellado hermético.' FROM tenants ON CONFLICT DO NOTHING;

INSERT INTO waste_categories (tenant_id, name, color_code, storage_rules)
SELECT id, 'OBJETOS PUNZOCORTANTES', 'RED_RIGID', 'Contenedor rígido de polipropileno.' FROM tenants ON CONFLICT DO NOTHING;

INSERT INTO waste_categories (tenant_id, name, color_code, storage_rules)
SELECT id, 'RESIDUOS QUÍMICOS TÓXICOS', 'YELLOW', 'Envase plástico ámbar/amarillo.' FROM tenants ON CONFLICT DO NOTHING;
