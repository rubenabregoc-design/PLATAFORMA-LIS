-- 📅 PLATAFORMA-LIS Online Appointments & Asset Audit Lifecycle

-- 1. Online Appointments Management
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  service_type TEXT, -- e.g., 'HOME_COLLECTION', 'LAB_VISIT', 'SPECIAL_STUDY'
  status TEXT DEFAULT 'PENDING', -- PENDING, CONFIRMED, CANCELLED, COMPLETED
  notes TEXT,
  patient_name_manual TEXT, -- If not a registered patient yet
  patient_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Appointment Availability Slots (Optional but professional)
CREATE TABLE IF NOT EXISTS appointment_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  slot_start TIMESTAMPTZ NOT NULL,
  slot_end TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  capacity INTEGER DEFAULT 1
);

-- 3. RLS Policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Appointments Tenant Isolation" ON appointments FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Slots Tenant Isolation" ON appointment_slots FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 4. Audit View for Asset Lifecycle (SQL Join for frontend)
CREATE OR REPLACE VIEW asset_audit_lifecycle_view AS
SELECT
    fa.id as asset_id,
    fa.internal_code,
    fa.description as asset_description,
    fa.purchase_date,
    fa.purchase_value,
    anz.name as analyzer_name,
    ml.task_name as maintenance_task,
    ml.created_at as maintenance_date,
    ml.status as maintenance_status,
    ml.performed_by as technician_name
FROM fixed_assets fa
LEFT JOIN analyzers anz ON fa.analyzer_id = anz.id
LEFT JOIN analyzer_maintenance_logs ml ON anz.id = ml.analyzer_id;
