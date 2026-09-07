-- 📄 PLATAFORMA-LIS Quality Documentation & HR Analytics

-- 1. Quality Documents (SOPs, Manuals, Policies) - ISO 15189 §8.2
CREATE TABLE IF NOT EXISTS quality_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL, -- e.g., 'SOP-HEM-001'
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- SOP, MANUAL, POLICY, FORM
  version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'PUBLISHED', -- DRAFT, REVIEW, PUBLISHED, ARCHIVED
  file_url TEXT,
  last_review_at DATE,
  next_review_at DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. HR Overtime & Absenteeism View
-- Calculates hours worked vs. scheduled shift hours
CREATE OR REPLACE VIEW staff_attendance_analytics_view AS
SELECT
    s.tenant_id,
    p.id as profile_id,
    p.name,
    EXTRACT(MONTH FROM s.work_date) as month,
    EXTRACT(YEAR FROM s.work_date) as year,
    SUM(CASE WHEN s.status = 'COMPLETED' THEN EXTRACT(EPOCH FROM (s.end_actual - s.start_actual))/3600 ELSE 0 END) as total_hours_worked,
    COUNT(CASE WHEN s.status = 'ABSENT' THEN 1 END) as total_absences,
    SUM(CASE
        WHEN s.status = 'COMPLETED' AND EXTRACT(EPOCH FROM (s.end_actual - s.start_actual))/3600 > 8 -- Assuming 8h standard
        THEN (EXTRACT(EPOCH FROM (s.end_actual - s.start_actual))/3600) - 8
        ELSE 0
    END) as estimated_overtime
FROM staff_schedules s
JOIN profiles p ON s.profile_id = p.id
GROUP BY s.tenant_id, p.id, p.name, month, year;

-- RLS Policies
ALTER TABLE quality_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quality Docs Tenant Isolation" ON quality_documents FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX idx_quality_docs_code ON quality_documents(code);
CREATE INDEX idx_quality_docs_status ON quality_documents(status);
