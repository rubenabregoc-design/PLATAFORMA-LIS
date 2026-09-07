-- 💉 PLATAFORMA-LIS Blood Bank Module (ISBT 128 & AABB Inspired)

-- 1. Donors Table
CREATE TABLE IF NOT EXISTS blood_donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id), -- Vinculado si ya es paciente
  blood_type TEXT, -- A, B, AB, O
  rh_factor TEXT, -- POS, NEG
  phenotype TEXT, -- C, c, E, e, K, etc.
  last_donation_date DATE,
  eligibility_status TEXT DEFAULT 'ELIGIBLE', -- ELIGIBLE, TEMPORARY_DEFERRAL, PERMANENT_DEFERRAL
  deferral_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Blood Units (Inventory)
CREATE TABLE IF NOT EXISTS blood_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  donor_id UUID REFERENCES blood_donors(id),
  unit_number TEXT NOT NULL UNIQUE, -- ISBT 128 Format
  component_type TEXT NOT NULL, -- RBC, PLASMA, PLATELETS, CRYO, WHOLE_BLOOD
  blood_type TEXT NOT NULL,
  rh_factor TEXT NOT NULL,
  volume_ml NUMERIC,
  collection_date TIMESTAMPTZ NOT NULL,
  expiry_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'QUARANTINE', -- QUARANTINE, AVAILABLE, RESERVED, TRANSFUSED, DISCARDED
  location_storage TEXT, -- Fridge ID, Shelf
  serology_status TEXT DEFAULT 'PENDING', -- PENDING, NEGATIVE, REACTIVE

  -- Panama Specific Mandatory Markers (MINSA/CSS)
  marker_hiv BOOLEAN DEFAULT false,
  marker_hbv BOOLEAN DEFAULT false,
  marker_hcv BOOLEAN DEFAULT false,
  marker_syphilis BOOLEAN DEFAULT false,
  marker_chagas BOOLEAN DEFAULT false, -- Mandatory in Panama
  marker_htlv BOOLEAN DEFAULT false,   -- Mandatory in Panama

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Transfusion Requests
CREATE TABLE IF NOT EXISTS blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  component_requested TEXT NOT NULL,
  quantity_units INTEGER DEFAULT 1,
  urgency TEXT DEFAULT 'ROUTINE', -- ROUTINE, URGENT, EXTREME_URGENCY
  diagnosis TEXT,
  transfusion_history BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Cross-matching & Compatibility (ISO 15189)
CREATE TABLE IF NOT EXISTS blood_crossmatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES blood_requests(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES blood_units(id) ON DELETE CASCADE,
  technologist_id UUID REFERENCES profiles(id),
  method TEXT, -- Gel, Tube, Solid Phase
  saline_phase TEXT,
  albumin_phase TEXT,
  coombs_phase TEXT, -- Indirect Antiglobulin Test
  result TEXT NOT NULL, -- COMPATIBLE, INCOMPATIBLE
  incompatibility_notes TEXT,
  performed_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Hemovigilance (Adverse Reactions)
CREATE TABLE IF NOT EXISTS blood_hemovigilance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES blood_units(id),
  patient_id UUID REFERENCES patients(id),
  reaction_type TEXT, -- FEBRILE, ALLERGIC, TRALI, HEMOLYTIC, etc.
  severity TEXT, -- MILD, MODERATE, SEVERE, FATAL
  description TEXT,
  investigation_notes TEXT,
  reported_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_blood_units_status ON blood_units(status);
CREATE INDEX idx_blood_units_expiry ON blood_units(expiry_date);
CREATE INDEX idx_blood_requests_patient ON blood_requests(patient_id);

-- RLS Policies
ALTER TABLE blood_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_crossmatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_hemovigilance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blood Bank Tenant Isolation" ON blood_donors FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Blood Units Tenant Isolation" ON blood_units FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Blood Requests Tenant Isolation" ON blood_requests FOR ALL USING (EXISTS (SELECT 1 FROM patients p WHERE p.id = blood_requests.patient_id AND p.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())));

-- 6. Safety Triggers & Automations

-- A. Auto-Expiry & Lockdown
CREATE OR REPLACE FUNCTION fn_monitor_blood_unit_safety()
RETURNS TRIGGER AS $$
BEGIN
    -- Bloqueo automático si está vencida
    IF NEW.expiry_date < NOW() AND NEW.status != 'DISCARDED' THEN
        NEW.status := 'DISCARDED';
        NEW.location_storage := 'EXPIRED_BIN';
    END IF;

    -- Validar que no se reserve una unidad en cuarentena o reactiva
    IF NEW.status = 'RESERVED' AND (OLD.serology_status = 'REACTIVE' OR OLD.serology_status = 'PENDING') THEN
        RAISE EXCEPTION 'No se puede reservar una unidad que no sea Seronegativa.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_blood_unit_safety
  BEFORE UPDATE OR INSERT ON blood_units
  FOR EACH ROW
  EXECUTE FUNCTION fn_monitor_blood_unit_safety();

-- B. Notification on Critical Stock (Mock logic for edge function/cron)
CREATE OR REPLACE VIEW blood_inventory_alerts AS
SELECT
    blood_type,
    rh_factor,
    component_type,
    count(*) as total_units
FROM blood_units
WHERE status = 'AVAILABLE'
GROUP BY blood_type, rh_factor, component_type
HAVING count(*) < 3; -- Alerta si hay menos de 3 unidades de cualquier tipo

-- 8. Epidemiological Notification (MINSA Panama Compliance)
CREATE TABLE IF NOT EXISTS blood_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES blood_units(id) ON DELETE CASCADE,
  donor_id UUID REFERENCES blood_donors(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL, -- 'CHAGAS', 'HTLV', 'HIV', etc.
  status TEXT DEFAULT 'PENDING', -- PENDING, SENT, ARCHIVED
  serial_number TEXT, -- Correlativo MINSA
  notes TEXT,
  metadata JSONB, -- PII details at time of report
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE blood_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notifications Tenant Isolation" ON blood_notifications FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX idx_blood_notifications_unit ON blood_notifications(unit_id);
