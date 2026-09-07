-- ❄️ PLATAFORMA-LIS Cold Chain Monitoring & Biohazard Indicators

-- 1. Cold Chain Devices (Dataloggers / IoT)
CREATE TABLE IF NOT EXISTS cold_chain_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'FRIDGE_HEMATOLOGY_01', 'FREEZER_BLOOD_BANK'
  location_details TEXT,
  min_temp_limit NUMERIC NOT NULL,
  max_temp_limit NUMERIC NOT NULL,
  last_reading_temp NUMERIC,
  status TEXT DEFAULT 'ONLINE', -- ONLINE, OFFLINE, ALARM
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Temperature Readings (Historical)
CREATE TABLE IF NOT EXISTS cold_chain_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES cold_chain_devices(id) ON DELETE CASCADE,
  temperature NUMERIC NOT NULL,
  humidity NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Biohazard Environmental Indicators (Views)
-- This view calculates kg of waste per 100 tests processed
CREATE OR REPLACE VIEW biohazard_efficiency_view AS
SELECT
    l.tenant_id,
    EXTRACT(MONTH FROM l.created_at) as month,
    EXTRACT(YEAR FROM l.created_at) as year,
    SUM(l.weight_kg) as total_waste_kg,
    (SELECT COUNT(*) FROM test_results tr
     WHERE tr.status = 'VALIDADO'
     AND EXTRACT(MONTH FROM tr.created_at) = EXTRACT(MONTH FROM l.created_at)
     AND EXTRACT(YEAR FROM tr.created_at) = EXTRACT(YEAR FROM l.created_at)) as total_tests,
    CASE
        WHEN (SELECT COUNT(*) FROM test_results tr2 WHERE tr2.status = 'VALIDADO') > 0
        THEN (SUM(l.weight_kg) / (SELECT COUNT(*) FROM test_results tr3 WHERE tr3.status = 'VALIDADO')) * 100
        ELSE 0
    END as kg_per_100_tests
FROM biohazard_waste_logs l
GROUP BY l.tenant_id, month, year;

-- RLS Policies
ALTER TABLE cold_chain_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_chain_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cold Chain Devices Isolation" ON cold_chain_devices FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Cold Chain Readings Isolation" ON cold_chain_readings FOR ALL USING (
  EXISTS (SELECT 1 FROM cold_chain_devices d WHERE d.id = cold_chain_readings.device_id AND d.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
);

-- Indexes
CREATE INDEX idx_temp_readings_device ON cold_chain_readings(device_id);
CREATE INDEX idx_temp_readings_date ON cold_chain_readings(recorded_at);
