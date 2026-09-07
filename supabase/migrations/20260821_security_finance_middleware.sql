-- 🛡️ PLATAFORMA-LIS Security, Finance & Middleware Professional Extension

-- 1. Digital Signature & Security Audit
-- (Profiles already has pin_code from initial schema)
CREATE TABLE IF NOT EXISTS security_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL, -- 'PIN_VERIFICATION', 'SENSITIVE_VALIDATION', 'LOGIN'
  resource_affected TEXT, -- e.g., 'RESULT_ID-8823', 'BLOOD_UNIT-9921'
  ip_address TEXT,
  status TEXT DEFAULT 'SUCCESS',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Automated Notifications Log
CREATE TABLE IF NOT EXISTS automated_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  channel TEXT NOT NULL, -- 'WHATSAPP', 'EMAIL', 'PUSH'
  recipient_contact TEXT NOT NULL,
  message_body TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'PANIC_VALUE', 'MINSA_REPORT', 'ORDER_READY'
  status TEXT DEFAULT 'PENDING', -- PENDING, SENT, FAILED
  error_log TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.1 Clinical Critical Alerts (SLA Management)
CREATE TABLE IF NOT EXISTS clinical_critical_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  order_id UUID REFERENCES orders(id),
  result_id UUID REFERENCES test_results(id),
  analyte TEXT NOT NULL,
  value TEXT NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'PENDING_CALL', -- PENDING_CALL, NOTIFIED, FAILED
  receiver_name TEXT,
  receiver_role TEXT,
  read_back_confirmed BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  notified_by UUID REFERENCES auth.users(id),
  tat_minutes INTEGER,
  notes TEXT
);

ALTER TABLE clinical_critical_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Critical Alerts Tenant Isolation" ON clinical_critical_alerts FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 3. Financial & Billing (Panama Fiscal Compliance)
CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  order_id UUID REFERENCES orders(id) UNIQUE,
  invoice_number TEXT UNIQUE, -- Correlativo Fiscal
  subtotal NUMERIC NOT NULL,
  tax_itbms NUMERIC DEFAULT 0, -- 7% in Panama
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_method TEXT, -- CASH, CREDIT_CARD, YAPPY, INSURANCE
  insurance_id UUID, -- If applicable
  co_pay_amount NUMERIC DEFAULT 0,
  fiscal_status TEXT DEFAULT 'DRAFT', -- DRAFT, ISSUED, VOID
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.1 Daily Cash Closings
CREATE TABLE IF NOT EXISTS billing_cash_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  branch_id UUID REFERENCES branches(id),
  closed_at TIMESTAMPTZ DEFAULT now(),
  closed_by UUID REFERENCES auth.users(id),
  total_expected NUMERIC NOT NULL,
  total_actual NUMERIC NOT NULL,
  difference NUMERIC DEFAULT 0,
  cash_amount NUMERIC DEFAULT 0,
  card_amount NUMERIC DEFAULT 0,
  yappy_amount NUMERIC DEFAULT 0,
  insurance_amount NUMERIC DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'COMPLETED' -- COMPLETED, DISCREPANCY
);

ALTER TABLE billing_cash_closings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Closings Tenant Isolation" ON billing_cash_closings FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS insurance_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  name TEXT NOT NULL,
  plan_details TEXT,
  contact_person TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 4. Middleware & Instrument Connectivity
CREATE TABLE IF NOT EXISTS middleware_raw_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  analyzer_id UUID REFERENCES analyzers(id),
  protocol TEXT, -- ASTM, HL7
  direction TEXT, -- INBOUND, OUTBOUND
  raw_payload TEXT,
  processed BOOLEAN DEFAULT false,
  error_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE security_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE middleware_raw_frames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Security Audit Tenant Isolation" ON security_audit_trail FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Notifications Tenant Isolation" ON automated_notifications FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Billing Tenant Isolation" ON billing_invoices FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Insurance Tenant Isolation" ON insurance_providers FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Middleware Tenant Isolation" ON middleware_raw_frames FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
