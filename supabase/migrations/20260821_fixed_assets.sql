-- 🏗️ PLATAFORMA-LIS Fixed Assets Management Schema

-- 1. Asset Categories
CREATE TABLE IF NOT EXISTS asset_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'LAB_EQUIPMENT', 'IT_INFRASTRUCTURE', 'FURNITURE', 'VEHICLES'
  depreciation_years INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Fixed Assets Registry
CREATE TABLE IF NOT EXISTS fixed_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES asset_categories(id) ON DELETE SET NULL,
  analyzer_id UUID REFERENCES analyzers(id) ON DELETE SET NULL, -- Link if it's a lab instrument
  internal_code TEXT NOT NULL UNIQUE, -- e.g., 'INV-HEM-001'
  description TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE NOT NULL,
  purchase_value NUMERIC NOT NULL,
  residual_value NUMERIC DEFAULT 0,
  location_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE, REPAIR, DISPOSED, SOLD
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Asset Categories Tenant Isolation" ON asset_categories FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Fixed Assets Tenant Isolation" ON fixed_assets FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Insert initial categories
INSERT INTO asset_categories (tenant_id, name, depreciation_years)
SELECT id, 'EQUIPO_LABORATORIO', 7 FROM tenants
ON CONFLICT DO NOTHING;

INSERT INTO asset_categories (tenant_id, name, depreciation_years)
SELECT id, 'INFRAESTRUCTURA_IT', 3 FROM tenants
ON CONFLICT DO NOTHING;
