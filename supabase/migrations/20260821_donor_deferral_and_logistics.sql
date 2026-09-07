-- 🩸 PLATAFORMA-LIS Donor Deferral Analytics & Blood Logistics

-- 1. Donor Deferral Reasons (Standardized for Panama MINSA/Gorgas)
CREATE TABLE IF NOT EXISTS donor_deferral_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  reason_code TEXT NOT NULL, -- e.g., 'LOW_HB', 'TATTOO', 'TRAVEL', 'MEDICATION'
  category TEXT NOT NULL, -- TEMPORARY, PERMANENT
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Blood Unit Transfers (Inter-hospital or Branch logistics)
CREATE TABLE IF NOT EXISTS blood_unit_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  origin_location TEXT NOT NULL,
  destination_location TEXT NOT NULL,
  transfer_date TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'IN_TRANSIT', -- IN_TRANSIT, DELIVERED, REJECTED_TEMP_EXCURSION
  courier_name TEXT,
  container_id TEXT, -- Cold box ID
  min_temp_recorded NUMERIC,
  max_temp_recorded NUMERIC,
  received_at TIMESTAMPTZ,
  received_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Junction for Units in a Transfer
CREATE TABLE IF NOT EXISTS blood_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID REFERENCES blood_unit_transfers(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES blood_units(id) ON DELETE CASCADE
);

-- 4. VIEW: Deferral Statistics
CREATE OR REPLACE VIEW donor_deferral_stats_view AS
SELECT
    tenant_id,
    deferral_reason as reason,
    COUNT(*) as total_cases,
    ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM blood_donors WHERE eligibility_status != 'ELIGIBLE' AND tenant_id = d.tenant_id) * 100, 2) as percentage
FROM blood_donors d
WHERE eligibility_status != 'ELIGIBLE'
GROUP BY tenant_id, deferral_reason;

-- RLS Policies
ALTER TABLE donor_deferral_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_unit_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_transfer_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deferral Reasons Tenant Isolation" ON donor_deferral_reasons FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Transfers Tenant Isolation" ON blood_unit_transfers FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Transfer Items Tenant Isolation" ON blood_transfer_items FOR ALL USING (
  EXISTS (SELECT 1 FROM blood_unit_transfers t WHERE t.id = blood_transfer_items.transfer_id AND t.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
);

-- Initial Panama Deferral Reasons
INSERT INTO donor_deferral_reasons (tenant_id, reason_code, category, description)
SELECT id, 'LOW_HB', 'TEMPORARY', 'Hemoglobina por debajo del límite legal (12.5 g/dL mujeres, 13.5 g/dL hombres).' FROM tenants ON CONFLICT DO NOTHING;

INSERT INTO donor_deferral_reasons (tenant_id, reason_code, category, description)
SELECT id, 'TATTOO', 'TEMPORARY', 'Tatuaje o piercing realizado en los últimos 6 meses.' FROM tenants ON CONFLICT DO NOTHING;

INSERT INTO donor_deferral_reasons (tenant_id, reason_code, category, description)
SELECT id, 'CHAGAS_HISTORY', 'PERMANENT', 'Antecedente positivo o sospecha de Enfermedad de Chagas.' FROM tenants ON CONFLICT DO NOTHING;
