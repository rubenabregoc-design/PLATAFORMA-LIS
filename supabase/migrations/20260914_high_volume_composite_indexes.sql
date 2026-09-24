-- ============================================================================
-- MIGRACIÓN POSTGRESQL / SUPABASE: ÍNDICES COMPUESTOS PARA ALTO RENDIMIENTO
-- ============================================================================
-- Diseñado para laboratorios con >500 órdenes diarias, redes multi-sede
-- y centros de referencia con alto tráfico de validación analítica y middleware.
-- ============================================================================

-- 1. ÍNDICE COMPUESTO: Órdenes por Tenant, Sede, Estado y Fecha de Creación
-- Optimiza: Carga masiva de bandejas de trabajo, filtros de recepción y cálculo de métricas en tiempo real.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'tenant_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_orders_tenant_branch_status_date 
        ON orders (tenant_id, branch_id, status, created_at DESC);
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        CREATE INDEX IF NOT EXISTS idx_orders_status_created_date 
        ON orders (status, created_at DESC);
    END IF;
END $$;

-- 2. ÍNDICE COMPUESTO: Resultados para Delta-Check, Validación Rápida y Trazabilidad
-- Optimiza: Búsqueda de histórico del paciente, comparación de deltas por parámetro y validación masiva.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_results') THEN
        CREATE INDEX IF NOT EXISTS idx_results_order_status_perf 
        ON test_results (order_id, status, created_at DESC);
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'test_results' AND column_name = 'test_code'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_results_test_code_delta 
            ON test_results (test_code, status, created_at DESC);
        END IF;
    END IF;
END $$;

-- 3. ÍNDICE COMPUESTO: Búsqueda Inmediata de Muestras y Código de Barras
-- Optimiza: Lecturas láser ASTM de códigos de tubos sin bloqueo de tabla completa.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'sample_barcode'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_orders_sample_barcode_perf 
        ON orders (sample_barcode);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'specimens') THEN
        CREATE INDEX IF NOT EXISTS idx_specimens_barcode_status 
        ON specimens (barcode, status);
    END IF;
END $$;

COMMENT ON INDEX idx_orders_status_created_date IS 'AbregoTech LIS: Optimización >500 órdenes/día - Filtro de bandejas';
