-- 📦 PLATAFORMA-LIS Medical Supplies & Consumables (Non-Analytical)

-- 1. Medical Supplies Table
CREATE TABLE IF NOT EXISTS medical_supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'Jeringa 5cc', 'Algodón en torunda', 'Tubo Vacutainer EDTA'
  description TEXT,
  sku TEXT UNIQUE,
  current_stock NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'UNIDADES', -- UNIDADES, CAJAS, PAQUETES
  min_threshold NUMERIC DEFAULT 10,
  category TEXT DEFAULT 'CONSUMABLES', -- CONSUMABLES, PPE, OFFICE
  location_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Supply Transactions (Stock In/Out)
CREATE TABLE IF NOT EXISTS supply_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_id UUID REFERENCES medical_supplies(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'IN' (Purchase/Restock), 'OUT' (Usage/Disposal)
  quantity NUMERIC NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE medical_supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supplies Tenant Isolation" ON medical_supplies FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Supply Trans Isolation" ON supply_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM medical_supplies s WHERE s.id = supply_transactions.supply_id AND s.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
);
