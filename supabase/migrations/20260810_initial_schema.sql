-- 🚀 PLATAFORMA-LIS Core Schema (ISO 15189 Compliant)
-- Este script define la base de datos profesional para Supabase.

-- 0. Profiles (Extensión de Auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID,
  branch_id UUID,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'lab_tech',
  license_number TEXT,
  pin_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1. Tenants & Branches
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ruc TEXT NOT NULL UNIQUE,
  dv TEXT NOT NULL,
  plan TEXT DEFAULT 'Basic',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ADD CONSTRAINT fk_profiles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ADD CONSTRAINT fk_profiles_branch FOREIGN KEY (branch_id) REFERENCES branches(id);

-- 1.2 Analyzers (Equipos de Laboratorio)
CREATE TABLE IF NOT EXISTS analyzers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model TEXT,
  manufacturer TEXT,
  serial_number TEXT,
  last_maintenance TIMESTAMPTZ,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.3 Reference Ranges (Catálogo de Pruebas y Rangos)
CREATE TABLE IF NOT EXISTS reference_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  test_code TEXT NOT NULL,
  test_name TEXT NOT NULL,
  gender TEXT, -- 'M', 'F', 'BOTH'
  age_min INTEGER DEFAULT 0,
  age_max INTEGER DEFAULT 120,
  min_value NUMERIC,
  max_value NUMERIC,
  unit TEXT,
  is_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Patients (Ley 81 Compliance)
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  national_id TEXT NOT NULL,
  id_type TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob DATE NOT NULL,
  gender TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  data_consent BOOLEAN DEFAULT false,
  consent_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  branch_id UUID REFERENCES branches(id),
  patient_id UUID REFERENCES patients(id),
  order_number TEXT NOT NULL UNIQUE,
  priority TEXT DEFAULT 'RUTINA',
  status TEXT DEFAULT 'REGISTRADA',
  payment_status TEXT DEFAULT 'PENDIENTE',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID -- Auth user
);

-- 4. Results & Versioning (ISO 15189)
CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  test_code TEXT NOT NULL, -- Agregado para vinculación exacta con rangos
  parameter_name TEXT NOT NULL,
  value TEXT,
  numeric_value NUMERIC,
  unit TEXT,
  flag TEXT, -- L, H, CRIT, N
  ref_range TEXT, -- Rango de referencia aplicado (texto para el reporte)
  status TEXT DEFAULT 'PENDIENTE', -- PENDING, PRE-VALIDATED, VALIDATED
  version INTEGER DEFAULT 1,
  analyzer_name TEXT,
  interpretation TEXT,
  analyzer_id UUID REFERENCES analyzers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Audit Log (Audit Trail)
CREATE TABLE IF NOT EXISTS result_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID REFERENCES test_results(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'EDICION', 'VALIDACION', etc
  author TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 6. Functions & Triggers (Automatización e ISO 15189)

-- A. Auto-Flagging & Range Validation
CREATE OR REPLACE FUNCTION fn_validate_test_result()
RETURNS TRIGGER AS $$
DECLARE
    v_patient_gender TEXT;
    v_patient_age INTEGER;
    v_patient_id UUID;
    v_range RECORD;
    v_license TEXT;
    v_prev_value NUMERIC;
    v_diff_percent NUMERIC;
BEGIN
    -- 1. Obtener datos del paciente para el rango y Delta Check
    SELECT p.gender, EXTRACT(YEAR FROM age(p.dob)), p.id
    INTO v_patient_gender, v_patient_age, v_patient_id
    FROM orders o JOIN patients p ON o.patient_id = p.id
    WHERE o.id = NEW.order_id;

    -- 2. Buscar Rango de Referencia
    SELECT * INTO v_range FROM reference_ranges
    WHERE test_code = NEW.test_code
    AND (gender = v_patient_gender OR gender = 'BOTH')
    AND v_patient_age BETWEEN age_min AND age_max
    LIMIT 1;

    -- 3. Aplicar Flag Automático si es numérico
    IF NEW.numeric_value IS NOT NULL AND v_range.id IS NOT NULL THEN
        NEW.ref_range := v_range.min_value || ' - ' || v_range.max_value || ' ' || v_range.unit;

        IF NEW.numeric_value < v_range.min_value THEN
            NEW.flag := CASE WHEN v_range.is_critical THEN 'CRIT_L' ELSE 'L' END;
        ELSIF NEW.numeric_value > v_range.max_value THEN
            NEW.flag := CASE WHEN v_range.is_critical THEN 'CRIT_H' ELSE 'H' END;
        ELSE
            NEW.flag := 'N'; -- Normal
        END IF;
    END IF;

    -- 4. Delta Check (ISO 15189 Requirement)
    IF NEW.numeric_value IS NOT NULL THEN
        SELECT tr.numeric_value INTO v_prev_value
        FROM test_results tr
        JOIN orders o ON tr.order_id = o.id
        WHERE o.patient_id = v_patient_id
        AND tr.test_code = NEW.test_code
        AND tr.status = 'VALIDADO'
        AND tr.id != NEW.id
        ORDER BY tr.created_at DESC
        LIMIT 1;

        IF v_prev_value IS NOT NULL AND v_prev_value != 0 THEN
            v_diff_percent := ABS((NEW.numeric_value - v_prev_value) / v_prev_value) * 100;
            IF v_diff_percent > 30 THEN
                NEW.interpretation := COALESCE(NEW.interpretation, '') ||
                    ' [ALERTA DELTA CHECK: Variación del ' || ROUND(v_diff_percent::numeric, 2) || '%]';
            END IF;
        END IF;
    END IF;

    -- 5. Lógica de Validación (Firma Electrónica)
    IF NEW.status = 'VALIDADO' AND (OLD.status IS NULL OR OLD.status != 'VALIDADO') THEN
        SELECT license_number INTO v_license FROM profiles WHERE id = auth.uid();
        IF v_license IS NULL OR v_license = '' THEN
            RAISE EXCEPTION 'No puede validar resultados sin un número de licencia profesional.';
        END IF;
    END IF;

    -- 6. Control de Versiones
    IF OLD.status = 'VALIDADO' AND (OLD.value IS DISTINCT FROM NEW.value) THEN
        NEW.version := OLD.version + 1;
        NEW.status := 'PENDIENTE'; -- Requiere re-validación si se cambió
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_process_test_result
  BEFORE UPDATE OR INSERT ON test_results
  FOR EACH ROW
  EXECUTE FUNCTION fn_validate_test_result();

-- Actualizar el timestamp de 'updated_at' automáticamente
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_test_results_updated_at
  BEFORE UPDATE ON test_results
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Auditoría automática de cambios en resultados
CREATE OR REPLACE FUNCTION audit_test_result_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.value IS DISTINCT FROM NEW.value OR OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO result_audit_logs (result_id, action, author, previous_value, new_value, reason)
    VALUES (
      NEW.id,
      CASE
        WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'ESTADO_' || NEW.status
        ELSE 'EDICION'
      END,
      COALESCE(auth.jwt() ->> 'email', 'system'), -- Captura el email del usuario
      OLD.value,
      NEW.value,
      'Cambio detectado por sistema'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_result_change
  AFTER UPDATE ON test_results
  FOR EACH ROW
  EXECUTE FUNCTION audit_test_result_changes();

-- 7. Performance Indexes (Búsquedas rápidas)
CREATE INDEX IF NOT EXISTS idx_patients_tenant_id ON patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patients(national_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_test_results_order_id ON test_results(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_result_id ON result_audit_logs(result_id);
CREATE INDEX IF NOT EXISTS idx_analyzers_tenant_id ON analyzers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ref_ranges_test_code ON reference_ranges(test_code);

-- RLS (Row Level Security) - Configuración Final
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyzers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Política para TENANTS, PROFILES y CATALOGS
CREATE POLICY "Users can see their own tenant" ON tenants
FOR SELECT USING (id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can see their own profile" ON profiles
FOR ALL USING (id = auth.uid());

CREATE POLICY "Analyzers Tenant Isolation" ON analyzers
FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Ref Ranges Tenant Isolation" ON reference_ranges
FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 2. Política para PATIENTS
CREATE POLICY "Patients Tenant Isolation" ON patients
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

-- 3. Política para ORDERS
CREATE POLICY "Orders Tenant Isolation" ON orders
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

-- 4. Política para TEST_RESULTS
CREATE POLICY "Results Tenant Isolation" ON test_results
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = test_results.order_id
    AND orders.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  )
);

-- 5. Política para AUDIT LOGS (Solo lectura para auditoría)
CREATE POLICY "Audit Logs Tenant Isolation" ON result_audit_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM test_results tr
    JOIN orders o ON tr.order_id = o.id
    WHERE tr.id = result_audit_logs.result_id
    AND o.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  )
);
