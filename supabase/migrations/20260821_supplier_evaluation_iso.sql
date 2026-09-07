-- 🏭 PLATAFORMA-LIS Supplier Management & Performance Evaluation (ISO 15189 §5.3)

-- 1. Enhance Suppliers Table (If not already complete)
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS evaluation_score NUMERIC DEFAULT 0, -- 0 to 100
ADD COLUMN IF NOT EXISTS last_evaluation_date DATE,
ADD COLUMN IF NOT EXISTS certification_status TEXT DEFAULT 'PENDING'; -- PENDING, CERTIFIED, REJECTED

-- 2. Supplier Performance Evaluations (Historical Audit)
CREATE TABLE IF NOT EXISTS supplier_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  evaluation_date DATE DEFAULT CURRENT_DATE,
  criterion_quality INTEGER DEFAULT 5, -- 1 to 5
  criterion_delivery INTEGER DEFAULT 5,
  criterion_price INTEGER DEFAULT 5,
  criterion_support INTEGER DEFAULT 5,
  final_score NUMERIC GENERATED ALWAYS AS ((criterion_quality + criterion_delivery + criterion_price + criterion_support) * 5) STORED,
  comments TEXT,
  evaluated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS Policies
ALTER TABLE supplier_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supplier Eval Tenant Isolation" ON supplier_evaluations FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 4. Initial Demo Data
INSERT INTO suppliers (tenant_id, name, ruc, category, is_active, certification_status)
SELECT id, 'ROCHE DIAGNOSTICS PANAMA', '8-123-456', 'ANALIZADORES/REACTIVOS', true, 'CERTIFIED' FROM tenants
ON CONFLICT DO NOTHING;

INSERT INTO suppliers (tenant_id, name, ruc, category, is_active, certification_status)
SELECT id, 'DISTRIBUIDORA MEDICA S.A.', '9-999-000', 'INSUMOS MEDICOS', true, 'PENDING' FROM tenants
ON CONFLICT DO NOTHING;
