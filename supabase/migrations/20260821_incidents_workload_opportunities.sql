-- 🛡️ PLATAFORMA-LIS Incidents, Workload & Opportunities Extension

-- 1. Incidents & Non-Conformities (ISO 15189 §8.7)
CREATE TABLE IF NOT EXISTS quality_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT, -- PRE-ANALYTICAL, ANALYTICAL, POST-ANALYTICAL, ADMINISTRATIVE
  severity TEXT DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
  root_cause TEXT,
  corrective_action TEXT,
  preventive_action TEXT,
  status TEXT DEFAULT 'OPEN', -- OPEN, UNDER_INVESTIGATION, CLOSED, VERIFIED
  reported_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- 2. Business & Quality Opportunities Board (Kanban style)
CREATE TABLE IF NOT EXISTS business_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  opportunity_type TEXT, -- SALES_LEAD, TAT_IMPROVEMENT, COST_REDUCTION, NEW_TEST
  estimated_value NUMERIC, -- Potential revenue or saving
  priority INTEGER DEFAULT 2, -- 1-High, 2-Med, 3-Low
  kanban_column TEXT DEFAULT 'BACKLOG', -- BACKLOG, DISCOVERY, IN_PROGRESS, VALIDATING, DONE
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS Policies
ALTER TABLE quality_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Incidents Tenant Isolation" ON quality_incidents FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Opportunities Tenant Isolation" ON business_opportunities FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 4. Dynamic Workload View
-- Counts pending samples per section in real-time
CREATE OR REPLACE VIEW section_workload_view AS
SELECT
    o.tenant_id,
    tr.test_code as section_code, -- Assuming test_code or a category field
    count(*) as pending_count,
    avg(EXTRACT(EPOCH FROM (now() - o.created_at))/3600) as avg_wait_hours
FROM test_results tr
JOIN orders o ON tr.order_id = o.id
WHERE tr.status = 'PENDIENTE'
GROUP BY o.tenant_id, tr.test_code;
