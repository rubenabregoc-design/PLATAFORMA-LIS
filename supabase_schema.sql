-- ============================================================================
-- ESQUEMA DE BASE DE DATOS CLINICA LIS (PostgreSQL / Supabase)
-- ============================================================================

-- 1. TABLA DE PACIENTES
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    national_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    birth_date DATE NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE ORDENES DE LABORATORIO
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    sample_barcode VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(30) DEFAULT 'INGRESADA', -- INGRESADA, EN_PROCESO, VALIDADA, REPORTADA
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE ANALIZADORES EQUIPOS
CREATE TABLE IF NOT EXISTS analyzers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    protocol VARCHAR(50) NOT NULL, -- ASTM_E1381, HL7_V2
    connection_type VARCHAR(20) NOT NULL, -- TCP_IP, SERIAL_COM
    ip_address VARCHAR(50),
    port INT,
    status VARCHAR(20) DEFAULT 'ONLINE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE RESULTADOS DE EXÁMENES (ESTRICTO)
CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    analyzer_id UUID REFERENCES analyzers(id),
    parameter_code VARCHAR(50) NOT NULL,
    parameter_name VARCHAR(150) NOT NULL,
    raw_value VARCHAR(100) NOT NULL,
    numeric_value NUMERIC(10, 4),
    unit VARCHAR(50),
    reference_range VARCHAR(100),
    flag VARCHAR(30) DEFAULT 'NORMAL', -- NORMAL, ALTO, BAJO, CRITICO_ALTO, CRITICO_BAJO
    status VARCHAR(30) DEFAULT 'PENDIENTE_VALIDACION', -- PENDIENTE_VALIDACION, VALIDADO, RECHAZADO
    validated_by VARCHAR(100),
    validated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE TRAZABILIDAD (AUDIT TRAIL ESTRICTO ISO 15189)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, VALIDATE, REJECT
    performed_by VARCHAR(100) NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar tiempo real (Realtime) en la tabla de resultados para los dashboards
ALTER PUBLICATION supabase_realtime ADD TABLE test_results;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
