-- 📅 PLATAFORMA-LIS Staff Scheduling & Shift Management

-- 1. Shifts Definitions (Templates)
CREATE TABLE IF NOT EXISTS shift_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'Turno Mañana', 'Turno Tarde', 'Guardia Nocturna'
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color_code TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Staff Schedule (Actual Assignments)
CREATE TABLE IF NOT EXISTS staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES shift_templates(id) ON DELETE SET NULL,
  work_date DATE NOT NULL,
  start_actual TIMESTAMPTZ,
  end_actual TIMESTAMPTZ,
  status TEXT DEFAULT 'SCHEDULED', -- SCHEDULED, CLOCKED_IN, COMPLETED, ABSENT, ON_LEAVE
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS Policies
ALTER TABLE shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shifts Tenant Isolation" ON shift_templates FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Schedules Tenant Isolation" ON staff_schedules FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX idx_staff_schedule_date ON staff_schedules(work_date);
CREATE INDEX idx_staff_schedule_profile ON staff_schedules(profile_id);

-- Initial Templates
INSERT INTO shift_templates (tenant_id, name, start_time, end_time, color_code)
SELECT id, 'MATUTINO (A)', '06:00:00', '14:00:00', '#10b981' FROM tenants ON CONFLICT DO NOTHING;

INSERT INTO shift_templates (tenant_id, name, start_time, end_time, color_code)
SELECT id, 'VESPERTINO (B)', '14:00:00', '22:00:00', '#3b82f6' FROM tenants ON CONFLICT DO NOTHING;

INSERT INTO shift_templates (tenant_id, name, start_time, end_time, color_code)
SELECT id, 'NOCTURNO (C)', '22:00:00', '06:00:00', '#6366f1' FROM tenants ON CONFLICT DO NOTHING;
