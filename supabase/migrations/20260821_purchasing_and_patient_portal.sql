-- 📦 PLATAFORMA-LIS Purchasing & Patient Portal Professional Extension

-- 1. Supplier Management
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ruc TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  category TEXT, -- REAGENTS, CONSUMABLES, EQUIPMENT, SERVICE
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'DRAFT', -- DRAFT, SENT, RECEIVED, CANCELLED
  total_amount NUMERIC DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  received_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_description TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL
);

-- 3. Patient Portal Access Tokens (Secured access without full account for quick results)
CREATE TABLE IF NOT EXISTS patient_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  access_code TEXT NOT NULL UNIQUE, -- Short code for patient login
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers Tenant Isolation" ON suppliers FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "PO Tenant Isolation" ON purchase_orders FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "PO Items Tenant Isolation" ON purchase_order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id = purchase_order_items.po_id AND po.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
);
-- Patient tokens are readable by the patient using the access_code (Public-ish but scoped)
CREATE POLICY "Patient Access Token Access" ON patient_access_tokens FOR SELECT USING (is_active = true AND expires_at > now());
