-- 🛡️ PLATAFORMA-LIS Risk Management (ISO 15189 §8.5) & Branch Sales Trends

-- 1. Analytical & Quality Risk Matrix
CREATE TABLE IF NOT EXISTS quality_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  process_area TEXT NOT NULL, -- e.g., 'PRE-ANALYTICAL', 'HEMATOLOGY', 'IT'
  risk_description TEXT NOT NULL,
  likelihood INTEGER DEFAULT 1, -- 1 to 5
  severity INTEGER DEFAULT 1, -- 1 to 5
  risk_score INTEGER GENERATED ALWAYS AS (likelihood * severity) STORED,
  mitigation_plan TEXT,
  status TEXT DEFAULT 'IDENTIFIED', -- IDENTIFIED, MITIGATED, RESIDUAL
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. RLS Policies for Risks
ALTER TABLE quality_risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Risks Tenant Isolation" ON quality_risks FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 3. Sales Trends View by Branch
CREATE OR REPLACE VIEW branch_sales_trends_view AS
SELECT
    i.tenant_id,
    b.id as branch_id,
    b.name as branch_name,
    DATE(i.created_at) as sale_date,
    SUM(i.total) as daily_revenue,
    COUNT(i.id) as invoice_count
FROM billing_invoices i
JOIN orders o ON i.order_id = o.id
JOIN branches b ON o.branch_id = b.id
GROUP BY i.tenant_id, b.id, b.name, DATE(i.created_at);

-- 4. Initial Risk Data (Mock for ISO compliance demo)
INSERT INTO quality_risks (tenant_id, process_area, risk_description, likelihood, severity, mitigation_plan)
SELECT
  id as tenant_id,
  'PRE-ANALÍTICA',
  'Error en identificación de paciente por homonimia',
  2, 5,
  'Implementación obligatoria de doble identificador y código de barras.'
FROM tenants
ON CONFLICT DO NOTHING;
