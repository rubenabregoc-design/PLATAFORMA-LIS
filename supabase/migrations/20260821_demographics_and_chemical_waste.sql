-- 👥 PLATAFORMA-LIS Advanced Demographics & Chemical Waste Management

-- 1. Enhance Patient Demographics for Epidemiology & Analytics
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS insurance_status TEXT DEFAULT 'PARTICULAR', -- ASEGURADO, NO_ASEGURADO, PARTICULAR
ADD COLUMN IF NOT EXISTS provenance_province TEXT,
ADD COLUMN IF NOT EXISTS provenance_district TEXT,
ADD COLUMN IF NOT EXISTS provenance_corregimiento TEXT,
ADD COLUMN IF NOT EXISTS patient_type TEXT DEFAULT 'AMBULATORIO', -- AMBULATORIO, HOSPITALIZADO, URGENCIAS
ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'PANAMEÑA';

-- 2. Special Chemical Waste Management (ISO 14001 / MINSA)
-- Tracking liquid/solid waste specifically from analyzers (e.g., toxic reagents)
CREATE TABLE IF NOT EXISTS chemical_waste_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  analyzer_id UUID REFERENCES analyzers(id) ON DELETE SET NULL,
  waste_name TEXT NOT NULL, -- e.g., 'Liquid Waste - Hematology', 'Toxic Wash Buffer'
  quantity_liters NUMERIC NOT NULL,
  container_type TEXT, -- BIDÓN, GALÓN, CANISTER
  status TEXT DEFAULT 'IN_STORAGE', -- IN_STORAGE, NEUTRALIZED, PICKED_UP
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chemical_waste_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chemical Waste Tenant Isolation" ON chemical_waste_logs FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 3. Enhance Calibration for ISO Traceability Certificate
ALTER TABLE analyzer_calibrations
ADD COLUMN IF NOT EXISTS calibration_method TEXT DEFAULT 'DIRECT_COMPARISON',
ADD COLUMN IF NOT EXISTS uncertainty_value NUMERIC,
ADD COLUMN IF NOT EXISTS temperature_ambient NUMERIC,
ADD COLUMN IF NOT EXISTS humidity_ambient NUMERIC;
