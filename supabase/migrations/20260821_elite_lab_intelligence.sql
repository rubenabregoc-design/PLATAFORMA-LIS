-- 🧬 PLATAFORMA-LIS Elite Lab Intelligence & Analytics Engine (ISO 15189 Compliant)

-- 1. VIEW: General Operational KPIs
CREATE OR REPLACE VIEW lab_operational_kpis_view AS
SELECT
    tenant_id,
    COUNT(DISTINCT id) as total_orders,
    COUNT(DISTINCT patient_id) as total_patients,
    (SELECT COUNT(*) FROM test_results tr WHERE tr.tenant_id = o.tenant_id) as total_tests,
    (SELECT COUNT(*) FROM test_results tr WHERE tr.tenant_id = o.tenant_id AND tr.status = 'PENDIENTE') as pending_tests,
    (SELECT COUNT(*) FROM test_results tr WHERE tr.tenant_id = o.tenant_id AND tr.status = 'VALIDADO') as validated_tests,
    (SELECT COUNT(*) FROM test_results tr WHERE tr.tenant_id = o.tenant_id AND tr.is_critical = true) as critical_results,
    -- TAT calculation: Avg time from order creation to validation in minutes
    AVG(CASE
        WHEN EXISTS (SELECT 1 FROM test_results tr WHERE tr.order_id = o.id AND tr.status = 'VALIDADO')
        THEN EXTRACT(EPOCH FROM ((SELECT MAX(updated_at) FROM test_results tr WHERE tr.order_id = o.id) - o.created_at))/60
        ELSE NULL
    END) as avg_tat_minutes
FROM orders o
GROUP BY tenant_id;

-- 2. VIEW: TAT Detailed Breakdown (Stage by Stage)
CREATE OR REPLACE VIEW lab_tat_stages_view AS
SELECT
    o.tenant_id,
    o.id as order_id,
    o.order_number,
    o.created_at as order_time,
    -- Time to Sample (Assuming first sample log or created_at for now)
    EXTRACT(EPOCH FROM (o.created_at - o.created_at))/60 as time_to_sample,
    -- Time to Validation (Last validation)
    EXTRACT(EPOCH FROM ((SELECT MAX(updated_at) FROM test_results tr WHERE tr.order_id = o.id AND tr.status = 'VALIDADO') - o.created_at))/60 as total_tat
FROM orders o;

-- 3. VIEW: Demographic & Epidemiological Intelligence
CREATE OR REPLACE VIEW patient_demographics_view AS
SELECT
    p.tenant_id,
    p.gender,
    p.insurance_status,
    p.provenance_province, -- e.g., 'PANAMÁ', 'COLÓN'
    CASE
        WHEN EXTRACT(YEAR FROM age(p.date_of_birth)) < 1 THEN 'INFANTE'
        WHEN EXTRACT(YEAR FROM age(p.date_of_birth)) BETWEEN 1 AND 12 THEN 'PEDIÁTRICO'
        WHEN EXTRACT(YEAR FROM age(p.date_of_birth)) BETWEEN 13 AND 17 THEN 'ADOLESCENTE'
        WHEN EXTRACT(YEAR FROM age(p.date_of_birth)) BETWEEN 18 AND 59 THEN 'ADULTO'
        ELSE 'ADULTO_MAYOR'
    END as age_group,
    COUNT(p.id) as patient_count
FROM patients p
GROUP BY p.tenant_id, p.gender, p.insurance_status, p.provenance_province, age_group;

-- 4. VIEW: Analyzer Throughput & Performance
CREATE OR REPLACE VIEW analyzer_performance_view AS
SELECT
    a.tenant_id,
    a.id as analyzer_id,
    a.name as analyzer_name,
    COUNT(tr.id) as tests_processed,
    (SELECT COUNT(*) FROM test_results tr2 WHERE tr2.analyzer_id = a.id AND tr2.origin = 'INTERFACE') as automated_results,
    (SELECT COUNT(*) FROM test_results tr3 WHERE tr3.analyzer_id = a.id AND tr3.status = 'VALIDADO') as validated_results,
    a.status
FROM analyzers a
LEFT JOIN test_results tr ON a.id = tr.analyzer_id
GROUP BY a.tenant_id, a.id, a.name, a.status;

-- 5. VIEW: Technologist Action Audit (ISO 15189 Productivity)
CREATE OR REPLACE VIEW tech_productivity_view AS
SELECT
    al.tenant_id,
    p.name as tech_name,
    p.id as profile_id,
    COUNT(CASE WHEN al.action = 'RESULT_INPUT' THEN 1 END) as results_entered,
    COUNT(CASE WHEN al.action = 'RESULT_VALIDATION' THEN 1 END) as results_validated,
    COUNT(CASE WHEN al.action = 'RESULT_CORRECTION' THEN 1 END) as results_corrected,
    COUNT(CASE WHEN al.action = 'RESULT_INVALIDATION' THEN 1 END) as results_invalidated
FROM result_audit_logs al
JOIN profiles p ON al.performed_by = p.id
GROUP BY al.tenant_id, p.id, p.name;
