-- 🔬 PLATAFORMA-LIS Reagents & External QC Schema

-- 1. Reagent Inventory Management
CREATE TABLE IF NOT EXISTS inventory_reagents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  catalog_number TEXT,
  lot_number TEXT NOT NULL,
  manufacturer TEXT,
  expiry_date DATE NOT NULL,
  current_stock NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'KITS', -- KITS, VIALS, TESTS
  min_threshold NUMERIC DEFAULT 5,
  storage_condition TEXT, -- 2-8C, -20C, AMBIENT
  opened_at TIMESTAMPTZ,
  opened_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'IN_STOCK', -- IN_STOCK, OPENED, DEPLETED, EXPIRED
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. External Quality Control (EQA / PT)
CREATE TABLE IF NOT EXISTS external_qc_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL, -- e.g., RIQAS, CAP, BIO-RAD EQAS
  program_name TEXT NOT NULL, -- e.g., Clinical Chemistry, Hematology
  cycle_number TEXT,
  sample_id TEXT NOT NULL,
  test_name TEXT NOT NULL,
  target_value NUMERIC,
  reported_value NUMERIC,
  unit TEXT,
  sdi_score NUMERIC, -- Standard Deviation Index
  bias_percent NUMERIC,
  status TEXT DEFAULT 'PENDING', -- PENDING, REPORTED, EVALUATED_PASS, EVALUATED_FAIL
  result_document_url TEXT,
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE inventory_reagents ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_qc_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reagents Tenant Isolation" ON inventory_reagents FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "External QC Tenant Isolation" ON external_qc_programs FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Indexes
CREATE INDEX idx_reagents_expiry ON inventory_reagents(expiry_date);
CREATE INDEX idx_reagents_status ON inventory_reagents(status);
CREATE INDEX idx_eqc_test ON external_qc_programs(test_name);
