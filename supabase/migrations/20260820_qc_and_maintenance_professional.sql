-- 🛡️ PLATAFORMA-LIS Professional QC & Maintenance Schema

-- 1. Internal QC Configurations (Levels, Targets)
CREATE TABLE IF NOT EXISTS qc_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  analyzer_id UUID REFERENCES analyzers(id) ON DELETE CASCADE,
  analyte_name TEXT NOT NULL, -- e.g., Glucose, Troponin
  level TEXT NOT NULL, -- N1, N2, N3
  lot_number TEXT NOT NULL,
  expiration_date DATE NOT NULL,
  target_mean NUMERIC NOT NULL,
  target_sd NUMERIC NOT NULL,
  unit TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Internal QC Runs (Points)
CREATE TABLE IF NOT EXISTS qc_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  config_id UUID REFERENCES qc_configurations(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  sd_score NUMERIC, -- z-score
  violation TEXT, -- 1_2s, 1_3s, etc.
  technician_id UUID REFERENCES profiles(id),
  corrective_action TEXT,
  root_cause TEXT,
  is_validated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Analyzer Maintenance Schedules
CREATE TABLE IF NOT EXISTS analyzer_maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  analyzer_id UUID REFERENCES analyzers(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  frequency TEXT NOT NULL, -- DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
  description TEXT,
  last_done_at TIMESTAMPTZ,
  next_due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Analyzer Maintenance Logs
CREATE TABLE IF NOT EXISTS analyzer_maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES analyzer_maintenance_schedules(id) ON DELETE SET NULL,
  analyzer_id UUID REFERENCES analyzers(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  performed_by UUID REFERENCES profiles(id),
  notes TEXT,
  parameter_value TEXT, -- e.g., "37.1 C", "Vacuum: -0.06 MPa"
  status TEXT DEFAULT 'COMPLETED', -- COMPLETED, FAILED, PENDING_PARTS
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE qc_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyzer_maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyzer_maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "QC Config Tenant Isolation" ON qc_configurations FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "QC Runs Tenant Isolation" ON qc_runs FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Maint Schedule Tenant Isolation" ON analyzer_maintenance_schedules FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Maint Log Tenant Isolation" ON analyzer_maintenance_logs FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Indexes
CREATE INDEX idx_qc_runs_config ON qc_runs(config_id);
CREATE INDEX idx_maint_logs_analyzer ON analyzer_maintenance_logs(analyzer_id);
CREATE INDEX idx_maint_schedules_due ON analyzer_maintenance_schedules(next_due_at);
