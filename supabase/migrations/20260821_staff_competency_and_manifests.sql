-- 🎓 PLATAFORMA-LIS Staff Competency & Professional Manifests

-- 1. Staff Training & Competencies (ISO 15189 §5.1)
CREATE TABLE IF NOT EXISTS staff_competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  competency_name TEXT NOT NULL, -- e.g., 'VENIPUNCTURE', 'BIOCHEMISTRY_VALIDATION', 'QC_INTERPRETATION'
  level TEXT DEFAULT 'TRAINEE', -- TRAINEE, COMPETENT, EXPERT, EVALUATOR
  evaluated_at DATE,
  expires_at DATE,
  evaluated_by UUID REFERENCES profiles(id),
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Training Courses / Continuous Education
CREATE TABLE IF NOT EXISTS staff_training_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  provider TEXT,
  hours_credits NUMERIC,
  completion_date DATE,
  status TEXT DEFAULT 'COMPLETED',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE staff_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_training_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Competencies Tenant Isolation" ON staff_competencies FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Training Logs Tenant Isolation" ON staff_training_logs FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 3. Enhance Biohazard Pickups for PDF Manifests
ALTER TABLE biohazard_pickups
ADD COLUMN IF NOT EXISTS transport_company_ruc TEXT,
ADD COLUMN IF NOT EXISTS vehicle_plate TEXT,
ADD COLUMN IF NOT EXISTS driver_name TEXT,
ADD COLUMN IF NOT EXISTS disposal_method TEXT DEFAULT 'AUTOCLAVE_INCINERATION';
