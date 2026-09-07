-- 📊 PLATAFORMA-LIS Financial Budgeting & Monthly Performance

CREATE TABLE IF NOT EXISTS financial_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  projected_revenue NUMERIC NOT NULL DEFAULT 0,
  projected_expenses NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, month, year)
);

ALTER TABLE financial_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Budgets Tenant Isolation" ON financial_budgets FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Insert some mock budget data for the current year
-- (In a real system, the owner would set this)
INSERT INTO financial_budgets (tenant_id, month, year, projected_revenue, projected_expenses)
SELECT
  id as tenant_id,
  8 as month,
  2026 as year,
  25000 as projected_revenue,
  8000 as projected_expenses
FROM tenants
ON CONFLICT DO NOTHING;
