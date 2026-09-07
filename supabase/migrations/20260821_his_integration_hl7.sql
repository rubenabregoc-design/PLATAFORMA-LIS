-- 🏥 PLATAFORMA-LIS HIS (Hospital Information System) Integration - HL7 V2 / FHIR

-- 1. HIS Endpoints Configuration
CREATE TABLE IF NOT EXISTS his_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., 'Hospital Santo Tomas HIS', 'CSS EMR'
  protocol TEXT DEFAULT 'HL7_V2', -- HL7_V2, HL7_V3, FHIR
  connection_type TEXT DEFAULT 'MLLP_TCP', -- MLLP_TCP, HTTP_REST
  ip_address TEXT,
  port INTEGER,
  api_key TEXT, -- For FHIR/REST
  is_active BOOLEAN DEFAULT true,
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. HL7/FHIR Message Log (Electronic Health Record Bridge)
CREATE TABLE IF NOT EXISTS his_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  endpoint_id UUID REFERENCES his_endpoints(id) ON DELETE SET NULL,
  direction TEXT NOT NULL, -- INBOUND (Orders), OUTBOUND (Results)
  message_type TEXT, -- ADT, ORM, ORU (HL7) or Observation/DiagnosticReport (FHIR)
  raw_content TEXT, -- The actual HL7 string or JSON
  status TEXT DEFAULT 'PENDING', -- PENDING, PROCESSED, ERROR, ACKNOWLEDGED
  error_details TEXT,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Test Code Mapping (HIS Code -> LIS Code)
CREATE TABLE IF NOT EXISTS his_test_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  endpoint_id UUID REFERENCES his_endpoints(id) ON DELETE CASCADE,
  his_test_code TEXT NOT NULL, -- e.g., 'GLU-100'
  lis_test_code TEXT NOT NULL, -- e.g., 'GLU'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(endpoint_id, his_test_code)
);

-- RLS Policies
ALTER TABLE his_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE his_message_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE his_test_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HIS Endpoints Isolation" ON his_endpoints FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "HIS Messages Isolation" ON his_message_log FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "HIS Mappings Isolation" ON his_test_mappings FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX idx_his_log_order ON his_message_log(order_id);
CREATE INDEX idx_his_log_status ON his_message_log(status);
