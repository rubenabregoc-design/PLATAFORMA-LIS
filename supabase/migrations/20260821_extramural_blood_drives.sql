-- 🩸 PLATAFORMA-LIS Extramural Blood Drives & Mobile Collection (Blood Bank Extension)

-- 1. Blood Drive Events (Mobile collection campaigns)
CREATE TABLE IF NOT EXISTS blood_drive_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'Jornada Nacional de Donación - Vía España'
  location_name TEXT NOT NULL, -- Address or Organization
  gps_coordinates TEXT, -- For mobile map tracking
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  goal_units INTEGER DEFAULT 50,
  collected_units INTEGER DEFAULT 0,
  status TEXT DEFAULT 'PLANNED', -- PLANNED, ACTIVE, COMPLETED, CANCELLED
  lead_tech_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Mobile Donor Registration (Queue management for the drive)
CREATE TABLE IF NOT EXISTS blood_drive_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES blood_drive_events(id) ON DELETE CASCADE,
  donor_id UUID REFERENCES blood_donors(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES patients(id), -- For new donors
  check_in_time TIMESTAMPTZ DEFAULT now(),
  screening_status TEXT DEFAULT 'PENDING', -- PENDING, SCREENING, PASSED, DEFERRED
  vital_signs JSONB, -- Temp, BP, Hb level
  collected_unit_id UUID REFERENCES blood_units(id),
  notes TEXT
);

-- RLS Policies
ALTER TABLE blood_drive_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_drive_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blood Drives Tenant Isolation" ON blood_drive_events FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Drive Reg Tenant Isolation" ON blood_drive_registrations FOR ALL USING (
  EXISTS (SELECT 1 FROM blood_drive_events e WHERE e.id = blood_drive_registrations.event_id AND e.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
);

-- 3. Initial Demo Data
INSERT INTO blood_drive_events (tenant_id, name, location_name, status, start_date)
SELECT id, 'COLECTA EXTERNA - PARQUE OMAR', 'San Francisco, Ciudad de Panamá', 'ACTIVE', now() FROM tenants LIMIT 1
ON CONFLICT DO NOTHING;
