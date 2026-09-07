-- 🖥️ PLATAFORMA-LIS IT Hardware & Lot Stability Extension

-- 1. IT Infrastructure Assets (Servers, Switches, UPS)
CREATE TABLE IF NOT EXISTS it_hardware_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hardware_type TEXT NOT NULL, -- SERVER, SWITCH, UPS, TERMINAL
  ip_address TEXT,
  serial_number TEXT,
  location TEXT,
  status TEXT DEFAULT 'ONLINE', -- ONLINE, OFFLINE, MAINTENANCE
  last_reboot TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. IT Maintenance Logs
CREATE TABLE IF NOT EXISTS it_maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES it_hardware_assets(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  description TEXT,
  performed_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'COMPLETED',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Lot Stability & Vial Comparison View
-- Comparing CV% and Mean shift between different vials (runs) of the same lot
CREATE OR REPLACE VIEW lot_vial_stability_view AS
SELECT
    c.analyte_name,
    c.lot_number,
    r.technician_id,
    count(r.id) as total_runs,
    avg(r.value) as actual_mean,
    stddev(r.value) as actual_sd,
    (stddev(r.value) / avg(r.value)) * 100 as cv_percentage
FROM qc_runs r
JOIN qc_configurations c ON r.config_id = c.id
GROUP BY c.analyte_name, c.lot_number, r.technician_id;

-- RLS Policies
ALTER TABLE it_hardware_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "IT Hardware Tenant Isolation" ON it_hardware_assets FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "IT Maint Logs Tenant Isolation" ON it_maintenance_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM it_hardware_assets a WHERE a.id = it_maintenance_logs.asset_id AND a.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
);
