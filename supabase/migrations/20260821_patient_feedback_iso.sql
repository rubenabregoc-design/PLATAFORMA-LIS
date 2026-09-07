-- 🗣️ PLATAFORMA-LIS Patient Complaints & Suggestions (ISO 15189 §8.6)

CREATE TABLE IF NOT EXISTS patient_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- COMPLAINT, SUGGESTION, INQUIRY
  category TEXT, -- TAT, ATTENTION, BILLING, TECHNICAL, PORTAL
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING', -- PENDING, INVESTIGATING, RESOLVED, CLOSED
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE patient_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feedback Tenant Isolation" ON patient_feedback FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
-- Public/Patient policy to allow insertion from the portal without auth
CREATE POLICY "Patient Feedback Insertion" ON patient_feedback FOR INSERT WITH CHECK (true);

CREATE INDEX idx_feedback_status ON patient_feedback(status);
CREATE INDEX idx_feedback_type ON patient_feedback(type);
