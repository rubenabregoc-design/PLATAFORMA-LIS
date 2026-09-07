-- 📈 PLATAFORMA-LIS Test Profitability & Intangible Assets

-- 1. Intangible Assets (Software Licenses, Domains, Certifications)
CREATE TABLE IF NOT EXISTS intangible_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'LIS Cloud License', 'lab-domain.com'
  category TEXT NOT NULL, -- SOFTWARE, DOMAIN, CERTIFICATE, IP
  provider TEXT,
  cost NUMERIC DEFAULT 0,
  billing_cycle TEXT DEFAULT 'ANNUAL', -- MONTHLY, ANNUAL, ONE_TIME
  expiry_date DATE,
  auto_renew BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, CANCELLED
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Test Profitability Analytics View
-- Logic: Revenue (Invoices) - Estimated Cost (Reagents assigned to that test)
CREATE OR REPLACE VIEW test_profitability_view AS
SELECT
    tr.tenant_id,
    tr.test_code,
    COUNT(tr.id) as volume,
    AVG(i.total / (SELECT COUNT(*) FROM test_results WHERE order_id = i.order_id)) as avg_revenue_per_test, -- Rough split of invoice total
    SUM(i.total / (SELECT COUNT(*) FROM test_results WHERE order_id = i.order_id)) as total_revenue,
    -- Simple mock cost logic: assuming $2 reagent cost + $1 overhead if not specified
    SUM(3.50) as estimated_total_cost,
    SUM((i.total / (SELECT COUNT(*) FROM test_results WHERE order_id = i.order_id)) - 3.50) as net_profit
FROM test_results tr
JOIN orders o ON tr.order_id = o.id
JOIN billing_invoices i ON o.id = i.order_id
WHERE tr.status = 'VALIDADO'
GROUP BY tr.tenant_id, tr.test_code;

-- RLS Policies
ALTER TABLE intangible_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Intangible Assets Isolation" ON intangible_assets FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
