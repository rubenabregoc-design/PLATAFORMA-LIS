-- ============================================================================
-- 🚀 ABREGOTECH LISCORE — ESQUEMA CONSOLIDADO SUPABASE CLOUD (82 TABLAS)
-- ============================================================================
-- Contiene: 39 migraciones clínicas, índices compuestos de alto rendimiento,
-- disparadores de auditoría ISO 15189 y seguridad RLS multi-tenant.
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

--
-- PostgreSQL database dump
--



-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: audit_test_result_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_test_result_changes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: fn_monitor_blood_unit_safety(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_monitor_blood_unit_safety() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Bloqueo automático si está vencida
    IF NEW.expiry_date < NOW() AND NEW.status != 'DISCARDED' THEN
        NEW.status := 'DISCARDED';
        NEW.location_storage := 'EXPIRED_BIN';
    END IF;

    -- Validar que no se reserve una unidad en cuarentena o reactiva
    IF NEW.status = 'RESERVED' AND (OLD.serology_status = 'REACTIVE' OR OLD.serology_status = 'PENDING') THEN
        RAISE EXCEPTION 'No se puede reservar una unidad que no sea Seronegativa.';
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: fn_prevent_audit_tampering(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_prevent_audit_tampering() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  RAISE EXCEPTION 'Acceso Denegado (ISO 15189): Los registros de trazabilidad y auditoría son inmutables y no pueden ser modificados ni eliminados.';
END;
$$;


--
-- Name: fn_prevent_profile_tampering(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_prevent_profile_tampering() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- If not abregotech_admin or owner, forbid changing role or tenant_id
  IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.tenant_id IS DISTINCT FROM NEW.tenant_id) THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'abregotech_admin')
    ) THEN
      RAISE EXCEPTION 'Acceso Denegado: No tiene permisos para modificar el rol o el tenant asignado.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fn_validate_test_result(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_validate_test_result() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
    IF NEW.status = 'VALIDADO' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'VALIDADO') THEN
        -- Solo validar si la operación es realizada por un usuario autenticado
        IF auth.uid() IS NOT NULL THEN
            SELECT license_number INTO v_license FROM profiles WHERE id = auth.uid();
            IF v_license IS NULL OR v_license = '' THEN
                RAISE EXCEPTION 'No puede validar resultados sin un número de licencia profesional.';
            END IF;
        END IF;
    END IF;

    -- 6. Control de Versiones
    IF TG_OP = 'UPDATE' AND OLD.status = 'VALIDADO' AND (OLD.value IS DISTINCT FROM NEW.value) THEN
        NEW.version := OLD.version + 1;
        NEW.status := 'PENDIENTE'; -- Requiere re-validación si se cambió
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: get_auth_tenant_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$;


--
-- Name: get_auth_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analyzer_calibrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analyzer_calibrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    analyzer_id uuid,
    analyte_name text NOT NULL,
    calibrator_lot text NOT NULL,
    calibration_date timestamp with time zone DEFAULT now(),
    expiration_date date NOT NULL,
    status text DEFAULT 'SUCCESS'::text,
    k_factor numeric,
    offset_value numeric,
    performed_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    calibration_method text DEFAULT 'DIRECT_COMPARISON'::text,
    uncertainty_value numeric,
    temperature_ambient numeric,
    humidity_ambient numeric
);


--
-- Name: analyzer_maintenance_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analyzer_maintenance_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    schedule_id uuid,
    analyzer_id uuid,
    task_name text NOT NULL,
    performed_by uuid,
    notes text,
    parameter_value text,
    status text DEFAULT 'COMPLETED'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: analyzer_maintenance_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analyzer_maintenance_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    analyzer_id uuid,
    task_name text NOT NULL,
    frequency text NOT NULL,
    description text,
    last_done_at timestamp with time zone,
    next_due_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: analyzers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analyzers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    model character varying(100),
    protocol character varying(50) NOT NULL,
    connection_type character varying(20) NOT NULL,
    ip_address character varying(50),
    port integer,
    status character varying(20) DEFAULT 'ONLINE'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: appointment_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointment_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    branch_id uuid,
    slot_start timestamp with time zone NOT NULL,
    slot_end timestamp with time zone NOT NULL,
    is_booked boolean DEFAULT false,
    capacity integer DEFAULT 1
);


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    patient_id uuid,
    branch_id uuid,
    scheduled_at timestamp with time zone NOT NULL,
    service_type text,
    status text DEFAULT 'PENDING'::text,
    notes text,
    patient_name_manual text,
    patient_phone text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: asset_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name text NOT NULL,
    depreciation_years integer DEFAULT 5,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_name character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    action character varying(50) NOT NULL,
    performed_by character varying(100) NOT NULL,
    previous_state jsonb,
    new_state jsonb,
    "timestamp" timestamp with time zone DEFAULT now()
);


--
-- Name: automated_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automated_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    channel text NOT NULL,
    recipient_contact text NOT NULL,
    message_body text NOT NULL,
    notification_type text NOT NULL,
    status text DEFAULT 'PENDING'::text,
    error_log text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: billing_cash_closings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_cash_closings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    branch_id uuid,
    closed_at timestamp with time zone DEFAULT now(),
    closed_by uuid,
    total_expected numeric NOT NULL,
    total_actual numeric NOT NULL,
    difference numeric DEFAULT 0,
    cash_amount numeric DEFAULT 0,
    card_amount numeric DEFAULT 0,
    yappy_amount numeric DEFAULT 0,
    insurance_amount numeric DEFAULT 0,
    notes text,
    status text DEFAULT 'COMPLETED'::text
);


--
-- Name: billing_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    order_id uuid,
    invoice_number text,
    subtotal numeric NOT NULL,
    tax_itbms numeric DEFAULT 0,
    discount numeric DEFAULT 0,
    total numeric NOT NULL,
    payment_method text,
    insurance_id uuid,
    co_pay_amount numeric DEFAULT 0,
    fiscal_status text DEFAULT 'DRAFT'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: biohazard_pickups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.biohazard_pickups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    company_name text NOT NULL,
    manifest_number text NOT NULL,
    total_weight_kg numeric NOT NULL,
    pickup_date timestamp with time zone DEFAULT now(),
    authorized_by uuid,
    certificate_url text,
    transport_company_ruc text,
    vehicle_plate text,
    driver_name text,
    disposal_method text DEFAULT 'AUTOCLAVE_INCINERATION'::text
);


--
-- Name: biohazard_waste_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.biohazard_waste_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    category_id uuid,
    branch_id uuid,
    weight_kg numeric NOT NULL,
    volume_liters numeric,
    generated_by uuid,
    notes text,
    status text DEFAULT 'IN_STORAGE'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: blood_crossmatches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blood_crossmatches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid,
    unit_id uuid,
    technologist_id uuid,
    method text,
    saline_phase text,
    albumin_phase text,
    coombs_phase text,
    result text NOT NULL,
    incompatibility_notes text,
    performed_at timestamp with time zone DEFAULT now()
);


--
-- Name: blood_donors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blood_donors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    patient_id uuid,
    blood_type text,
    rh_factor text,
    phenotype text,
    last_donation_date date,
    eligibility_status text DEFAULT 'ELIGIBLE'::text,
    deferral_reason text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: blood_drive_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blood_drive_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name text NOT NULL,
    location_name text NOT NULL,
    gps_coordinates text,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    goal_units integer DEFAULT 50,
    collected_units integer DEFAULT 0,
    status text DEFAULT 'PLANNED'::text,
    lead_tech_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: blood_drive_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blood_drive_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid,
    donor_id uuid,
    patient_id uuid,
    check_in_time timestamp with time zone DEFAULT now(),
    screening_status text DEFAULT 'PENDING'::text,
    vital_signs jsonb,
    collected_unit_id uuid,
    notes text
);


--
-- Name: blood_hemovigilance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blood_hemovigilance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    unit_id uuid,
    patient_id uuid,
    reaction_type text,
    severity text,
    description text,
    investigation_notes text,
    reported_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: blood_units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blood_units (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    donor_id uuid,
    unit_number text NOT NULL,
    component_type text NOT NULL,
    blood_type text NOT NULL,
    rh_factor text NOT NULL,
    volume_ml numeric,
    collection_date timestamp with time zone NOT NULL,
    expiry_date timestamp with time zone NOT NULL,
    status text DEFAULT 'QUARANTINE'::text,
    location_storage text,
    serology_status text DEFAULT 'PENDING'::text,
    marker_hiv boolean DEFAULT false,
    marker_hbv boolean DEFAULT false,
    marker_hcv boolean DEFAULT false,
    marker_syphilis boolean DEFAULT false,
    marker_chagas boolean DEFAULT false,
    marker_htlv boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: blood_inventory_alerts; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.blood_inventory_alerts AS
 SELECT blood_type,
    rh_factor,
    component_type,
    count(*) AS total_units
   FROM public.blood_units
  WHERE (status = 'AVAILABLE'::text)
  GROUP BY blood_type, rh_factor, component_type
 HAVING (count(*) < 3);


--
-- Name: blood_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blood_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    unit_id uuid,
    donor_id uuid,
    report_type text NOT NULL,
    status text DEFAULT 'PENDING'::text,
    serial_number text,
    notes text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid
);


--
-- Name: blood_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blood_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    patient_id uuid,
    component_requested text NOT NULL,
    quantity_units integer DEFAULT 1,
    urgency text DEFAULT 'ROUTINE'::text,
    diagnosis text,
    transfusion_history boolean DEFAULT false,
    status text DEFAULT 'PENDING'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: blood_transfer_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blood_transfer_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transfer_id uuid,
    unit_id uuid
);


--
-- Name: blood_unit_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blood_unit_transfers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    origin_location text NOT NULL,
    destination_location text NOT NULL,
    transfer_date timestamp with time zone DEFAULT now(),
    status text DEFAULT 'IN_TRANSIT'::text,
    courier_name text,
    container_id text,
    min_temp_recorded numeric,
    max_temp_recorded numeric,
    received_at timestamp with time zone,
    received_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name text NOT NULL,
    code text NOT NULL,
    address text,
    phone text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: business_opportunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_opportunities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    title text NOT NULL,
    description text,
    opportunity_type text,
    estimated_value numeric,
    priority integer DEFAULT 2,
    kanban_column text DEFAULT 'BACKLOG'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: chemical_waste_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chemical_waste_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    analyzer_id uuid,
    waste_name text NOT NULL,
    quantity_liters numeric NOT NULL,
    container_type text,
    status text DEFAULT 'IN_STORAGE'::text,
    generated_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: clinical_critical_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_critical_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    order_id uuid,
    result_id uuid,
    analyte text NOT NULL,
    value text NOT NULL,
    detected_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'PENDING_CALL'::text,
    receiver_name text,
    receiver_role text,
    read_back_confirmed boolean DEFAULT false,
    notified_at timestamp with time zone,
    notified_by uuid,
    tat_minutes integer,
    notes text
);


--
-- Name: cold_chain_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cold_chain_devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    branch_id uuid,
    name text NOT NULL,
    location_details text,
    min_temp_limit numeric NOT NULL,
    max_temp_limit numeric NOT NULL,
    last_reading_temp numeric,
    status text DEFAULT 'ONLINE'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: cold_chain_readings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cold_chain_readings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    device_id uuid,
    temperature numeric NOT NULL,
    humidity numeric,
    recorded_at timestamp with time zone DEFAULT now()
);


--
-- Name: donor_deferral_reasons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.donor_deferral_reasons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    reason_code text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: donor_deferral_stats_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.donor_deferral_stats_view AS
 SELECT tenant_id,
    deferral_reason AS reason,
    count(*) AS total_cases,
    round((((count(*))::numeric / (( SELECT count(*) AS count
           FROM public.blood_donors
          WHERE ((blood_donors.eligibility_status <> 'ELIGIBLE'::text) AND (blood_donors.tenant_id = d.tenant_id))))::numeric) * (100)::numeric), 2) AS percentage
   FROM public.blood_donors d
  WHERE (eligibility_status <> 'ELIGIBLE'::text)
  GROUP BY tenant_id, deferral_reason;


--
-- Name: epidemiological_markers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.epidemiological_markers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    test_code text NOT NULL,
    disease_name text NOT NULL,
    minsa_code text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: epidemiological_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.epidemiological_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    report_number text,
    report_date date DEFAULT CURRENT_DATE,
    status text DEFAULT 'DRAFT'::text,
    content jsonb,
    total_cases integer DEFAULT 0,
    submitted_by uuid,
    submitted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: equipment_insurances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment_insurances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    analyzer_id uuid,
    policy_number text NOT NULL,
    insurance_company text NOT NULL,
    start_date date NOT NULL,
    expiry_date date NOT NULL,
    coverage_amount numeric,
    status text DEFAULT 'ACTIVE'::text,
    terms_url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: equipment_warranties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment_warranties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    analyzer_id uuid,
    provider_name text NOT NULL,
    expiry_date date NOT NULL,
    coverage_details text,
    status text DEFAULT 'ACTIVE'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: external_audit_findings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_audit_findings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    audit_id uuid,
    clause_reference text,
    description text NOT NULL,
    severity text DEFAULT 'MINOR'::text,
    action_plan text,
    due_date date,
    status text DEFAULT 'OPEN'::text,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: external_audits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_audits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    entity_name text NOT NULL,
    audit_type text NOT NULL,
    start_date date NOT NULL,
    end_date date,
    lead_auditor text,
    scope text,
    status text DEFAULT 'PLANNED'::text,
    result_summary text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: external_qc_programs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_qc_programs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    provider_name text NOT NULL,
    program_name text NOT NULL,
    cycle_number text,
    sample_id text NOT NULL,
    test_name text NOT NULL,
    target_value numeric,
    reported_value numeric,
    unit text,
    sdi_score numeric,
    bias_percent numeric,
    status text DEFAULT 'PENDING'::text,
    result_document_url text,
    evaluated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: financial_budgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_budgets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    month integer NOT NULL,
    year integer NOT NULL,
    projected_revenue numeric DEFAULT 0 NOT NULL,
    projected_expenses numeric DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: fixed_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fixed_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    category_id uuid,
    analyzer_id uuid,
    internal_code text NOT NULL,
    description text NOT NULL,
    brand text,
    model text,
    serial_number text,
    purchase_date date NOT NULL,
    purchase_value numeric NOT NULL,
    residual_value numeric DEFAULT 0,
    location_id uuid,
    status text DEFAULT 'ACTIVE'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: formula_execution_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.formula_execution_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    order_id uuid,
    target_test_code text,
    input_values jsonb,
    calculated_value text,
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: his_endpoints; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.his_endpoints (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name text NOT NULL,
    protocol text DEFAULT 'HL7_V2'::text,
    connection_type text DEFAULT 'MLLP_TCP'::text,
    ip_address text,
    port integer,
    api_key text,
    is_active boolean DEFAULT true,
    last_heartbeat timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: his_message_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.his_message_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    endpoint_id uuid,
    direction text NOT NULL,
    message_type text,
    raw_content text,
    status text DEFAULT 'PENDING'::text,
    error_details text,
    order_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: his_test_mappings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.his_test_mappings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    endpoint_id uuid,
    his_test_code text NOT NULL,
    lis_test_code text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: insurance_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insurance_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name text NOT NULL,
    plan_details text,
    contact_person text,
    is_active boolean DEFAULT true
);


--
-- Name: intangible_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intangible_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name text NOT NULL,
    category text NOT NULL,
    provider text,
    cost numeric DEFAULT 0,
    billing_cycle text DEFAULT 'ANNUAL'::text,
    expiry_date date,
    auto_renew boolean DEFAULT true,
    status text DEFAULT 'ACTIVE'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: inventory_reagents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_reagents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name text NOT NULL,
    catalog_number text,
    lot_number text NOT NULL,
    manufacturer text,
    expiry_date date NOT NULL,
    current_stock numeric DEFAULT 0,
    unit text DEFAULT 'KITS'::text,
    min_threshold numeric DEFAULT 5,
    storage_condition text,
    opened_at timestamp with time zone,
    opened_by uuid,
    status text DEFAULT 'IN_STOCK'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: iso_audit_findings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.iso_audit_findings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    clause_id uuid,
    status text DEFAULT 'COMPLIANT'::text,
    evidence_description text,
    related_module_id text,
    audited_by uuid,
    audited_at timestamp with time zone DEFAULT now(),
    next_audit_date date,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: iso_clauses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.iso_clauses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clause_number text NOT NULL,
    title text NOT NULL,
    description text,
    category text DEFAULT 'MANAGEMENT'::text,
    importance text DEFAULT 'CRITICAL'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: it_hardware_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.it_hardware_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name text NOT NULL,
    hardware_type text NOT NULL,
    ip_address text,
    serial_number text,
    location text,
    status text DEFAULT 'ONLINE'::text,
    last_reboot timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: it_maintenance_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.it_maintenance_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_id uuid,
    task_name text NOT NULL,
    description text,
    performed_by uuid,
    status text DEFAULT 'COMPLETED'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: qc_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qc_configurations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    analyzer_id uuid,
    analyte_name text NOT NULL,
    level text NOT NULL,
    lot_number text NOT NULL,
    expiration_date date NOT NULL,
    target_mean numeric NOT NULL,
    target_sd numeric NOT NULL,
    unit text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: qc_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qc_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    config_id uuid,
    value numeric NOT NULL,
    sd_score numeric,
    violation text,
    technician_id uuid,
    corrective_action text,
    root_cause text,
    is_validated boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: lot_vial_stability_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.lot_vial_stability_view AS
 SELECT c.analyte_name,
    c.lot_number,
    r.technician_id,
    count(r.id) AS total_runs,
    avg(r.value) AS actual_mean,
    stddev(r.value) AS actual_sd,
    ((stddev(r.value) / avg(r.value)) * (100)::numeric) AS cv_percentage
   FROM (public.qc_runs r
     JOIN public.qc_configurations c ON ((r.config_id = c.id)))
  GROUP BY c.analyte_name, c.lot_number, r.technician_id;


--
-- Name: medical_supplies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medical_supplies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name text NOT NULL,
    description text,
    sku text,
    current_stock numeric DEFAULT 0,
    unit text DEFAULT 'UNIDADES'::text,
    min_threshold numeric DEFAULT 10,
    category text DEFAULT 'CONSUMABLES'::text,
    location_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: middleware_raw_frames; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.middleware_raw_frames (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    analyzer_id uuid,
    protocol text,
    direction text,
    raw_payload text,
    processed boolean DEFAULT false,
    error_notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number character varying(50) NOT NULL,
    patient_id uuid,
    sample_barcode character varying(100) NOT NULL,
    status character varying(30) DEFAULT 'INGRESADA'::character varying,
    created_by character varying(100),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: patient_access_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_access_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    patient_id uuid,
    order_id uuid,
    access_code text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: patient_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    patient_id uuid,
    order_id uuid,
    type text NOT NULL,
    category text,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'PENDING'::text,
    resolution_notes text,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    national_id character varying(50) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    gender character varying(20) NOT NULL,
    birth_date date NOT NULL,
    phone character varying(30),
    email character varying(150),
    created_at timestamp with time zone DEFAULT now(),
    insurance_status text DEFAULT 'PARTICULAR'::text,
    provenance_province text,
    provenance_district text,
    provenance_corregimiento text,
    patient_type text DEFAULT 'AMBULATORIO'::text,
    nationality text DEFAULT 'PANAMEÑA'::text,
    height_cm numeric,
    weight_kg numeric,
    national_id_hash character varying(64),
    is_encrypted boolean DEFAULT false
);


--
-- Name: COLUMN patients.national_id_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.national_id_hash IS 'HMAC-SHA256 Blind Index de la cédula para búsqueda instantánea Ley 81';


--
-- Name: COLUMN patients.is_encrypted; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patients.is_encrypted IS 'Indica si los datos PII del paciente están cifrados con AES-256-GCM';


--
-- Name: payroll_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    profile_id uuid,
    month integer NOT NULL,
    year integer NOT NULL,
    tests_processed integer DEFAULT 0,
    base_pay numeric NOT NULL,
    incentive_pay numeric DEFAULT 0,
    total_pay numeric NOT NULL,
    status text DEFAULT 'PENDING'::text,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    tenant_id uuid,
    branch_id uuid,
    name text NOT NULL,
    role text DEFAULT 'lab_tech'::text NOT NULL,
    license_number text,
    pin_code text,
    created_at timestamp with time zone DEFAULT now(),
    base_salary numeric DEFAULT 0,
    commission_per_test numeric DEFAULT 0
);


--
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    po_id uuid,
    item_description text NOT NULL,
    quantity numeric NOT NULL,
    unit_price numeric NOT NULL,
    total_price numeric NOT NULL
);


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    supplier_id uuid,
    order_number text NOT NULL,
    status text DEFAULT 'DRAFT'::text,
    total_amount numeric DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    received_at timestamp with time zone
);


--
-- Name: quality_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quality_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    code text NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    version text DEFAULT '1.0'::text,
    status text DEFAULT 'PUBLISHED'::text,
    file_url text,
    last_review_at date,
    next_review_at date,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: quality_incidents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quality_incidents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    title text NOT NULL,
    description text NOT NULL,
    category text,
    severity text DEFAULT 'MEDIUM'::text,
    root_cause text,
    corrective_action text,
    preventive_action text,
    status text DEFAULT 'OPEN'::text,
    reported_by uuid,
    assigned_to uuid,
    created_at timestamp with time zone DEFAULT now(),
    closed_at timestamp with time zone
);


--
-- Name: quality_risks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quality_risks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    process_area text NOT NULL,
    risk_description text NOT NULL,
    likelihood integer DEFAULT 1,
    severity integer DEFAULT 1,
    risk_score integer GENERATED ALWAYS AS ((likelihood * severity)) STORED,
    mitigation_plan text,
    status text DEFAULT 'IDENTIFIED'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: reference_ranges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reference_ranges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    test_code text NOT NULL,
    test_name text NOT NULL,
    gender text,
    age_min integer DEFAULT 0,
    age_max integer DEFAULT 120,
    min_value numeric,
    max_value numeric,
    unit text,
    is_critical boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: result_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.result_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    result_id uuid,
    action text NOT NULL,
    author text NOT NULL,
    previous_value text,
    new_value text,
    reason text,
    "timestamp" timestamp with time zone DEFAULT now()
);


--
-- Name: security_audit_trail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_audit_trail (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    user_id uuid,
    action_type text NOT NULL,
    resource_affected text,
    ip_address text,
    status text DEFAULT 'SUCCESS'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: shift_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    color_code text DEFAULT '#3b82f6'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: staff_competencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_competencies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    profile_id uuid,
    competency_name text NOT NULL,
    level text DEFAULT 'TRAINEE'::text,
    evaluated_at date,
    expires_at date,
    evaluated_by uuid,
    certificate_url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: staff_professional_insurances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_professional_insurances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    profile_id uuid,
    policy_number text NOT NULL,
    insurance_company text NOT NULL,
    start_date date NOT NULL,
    expiry_date date NOT NULL,
    coverage_limit numeric NOT NULL,
    status text DEFAULT 'ACTIVE'::text,
    certificate_url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: staff_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    profile_id uuid,
    template_id uuid,
    work_date date NOT NULL,
    start_actual timestamp with time zone,
    end_actual timestamp with time zone,
    status text DEFAULT 'SCHEDULED'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: staff_training_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_training_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    profile_id uuid,
    course_name text NOT NULL,
    provider text,
    hours_credits numeric,
    completion_date date,
    status text DEFAULT 'COMPLETED'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: supplier_evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_evaluations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    supplier_id uuid,
    evaluation_date date DEFAULT CURRENT_DATE,
    criterion_quality integer DEFAULT 5,
    criterion_delivery integer DEFAULT 5,
    criterion_price integer DEFAULT 5,
    criterion_support integer DEFAULT 5,
    final_score numeric GENERATED ALWAYS AS (((((criterion_quality + criterion_delivery) + criterion_price) + criterion_support) * 5)) STORED,
    comments text,
    evaluated_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name text NOT NULL,
    ruc text,
    contact_name text,
    email text,
    phone text,
    category text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    evaluation_score numeric DEFAULT 0,
    last_evaluation_date date,
    certification_status text DEFAULT 'PENDING'::text
);


--
-- Name: supply_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supply_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    supply_id uuid,
    type text NOT NULL,
    quantity numeric NOT NULL,
    performed_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    ruc text NOT NULL,
    dv text NOT NULL,
    plan text DEFAULT 'Basic'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: test_formulas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_formulas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    target_test_code text NOT NULL,
    formula_name text NOT NULL,
    expression text NOT NULL,
    required_variables jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: test_profile_components; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_profile_components (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid,
    test_code text NOT NULL,
    sort_order integer DEFAULT 0
);


--
-- Name: test_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: test_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    analyzer_id uuid,
    parameter_code character varying(50) NOT NULL,
    parameter_name character varying(150) NOT NULL,
    raw_value character varying(100) NOT NULL,
    numeric_value numeric(10,4),
    unit character varying(50),
    reference_range character varying(100),
    flag character varying(30) DEFAULT 'NORMAL'::character varying,
    status character varying(30) DEFAULT 'PENDIENTE_VALIDACION'::character varying,
    validated_by character varying(100),
    validated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    is_confidential boolean DEFAULT false,
    confidential_notes text
);


--
-- Name: COLUMN test_results.is_confidential; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.test_results.is_confidential IS 'Marca de secreto médico reforzado para diagnósticos estigmatizantes';


--
-- Name: waste_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.waste_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name text NOT NULL,
    color_code text,
    storage_rules text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: analyzer_calibrations analyzer_calibrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyzer_calibrations
    ADD CONSTRAINT analyzer_calibrations_pkey PRIMARY KEY (id);


--
-- Name: analyzer_maintenance_logs analyzer_maintenance_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyzer_maintenance_logs
    ADD CONSTRAINT analyzer_maintenance_logs_pkey PRIMARY KEY (id);


--
-- Name: analyzer_maintenance_schedules analyzer_maintenance_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyzer_maintenance_schedules
    ADD CONSTRAINT analyzer_maintenance_schedules_pkey PRIMARY KEY (id);


--
-- Name: analyzers analyzers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyzers
    ADD CONSTRAINT analyzers_pkey PRIMARY KEY (id);


--
-- Name: appointment_slots appointment_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_slots
    ADD CONSTRAINT appointment_slots_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: asset_categories asset_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_categories
    ADD CONSTRAINT asset_categories_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: automated_notifications automated_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automated_notifications
    ADD CONSTRAINT automated_notifications_pkey PRIMARY KEY (id);


--
-- Name: billing_cash_closings billing_cash_closings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_cash_closings
    ADD CONSTRAINT billing_cash_closings_pkey PRIMARY KEY (id);


--
-- Name: billing_invoices billing_invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT billing_invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: billing_invoices billing_invoices_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT billing_invoices_order_id_key UNIQUE (order_id);


--
-- Name: billing_invoices billing_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT billing_invoices_pkey PRIMARY KEY (id);


--
-- Name: biohazard_pickups biohazard_pickups_manifest_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.biohazard_pickups
    ADD CONSTRAINT biohazard_pickups_manifest_number_key UNIQUE (manifest_number);


--
-- Name: biohazard_pickups biohazard_pickups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.biohazard_pickups
    ADD CONSTRAINT biohazard_pickups_pkey PRIMARY KEY (id);


--
-- Name: biohazard_waste_logs biohazard_waste_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.biohazard_waste_logs
    ADD CONSTRAINT biohazard_waste_logs_pkey PRIMARY KEY (id);


--
-- Name: blood_crossmatches blood_crossmatches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_crossmatches
    ADD CONSTRAINT blood_crossmatches_pkey PRIMARY KEY (id);


--
-- Name: blood_donors blood_donors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_donors
    ADD CONSTRAINT blood_donors_pkey PRIMARY KEY (id);


--
-- Name: blood_drive_events blood_drive_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_drive_events
    ADD CONSTRAINT blood_drive_events_pkey PRIMARY KEY (id);


--
-- Name: blood_drive_registrations blood_drive_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_drive_registrations
    ADD CONSTRAINT blood_drive_registrations_pkey PRIMARY KEY (id);


--
-- Name: blood_hemovigilance blood_hemovigilance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_hemovigilance
    ADD CONSTRAINT blood_hemovigilance_pkey PRIMARY KEY (id);


--
-- Name: blood_notifications blood_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_notifications
    ADD CONSTRAINT blood_notifications_pkey PRIMARY KEY (id);


--
-- Name: blood_requests blood_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_requests
    ADD CONSTRAINT blood_requests_pkey PRIMARY KEY (id);


--
-- Name: blood_transfer_items blood_transfer_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_transfer_items
    ADD CONSTRAINT blood_transfer_items_pkey PRIMARY KEY (id);


--
-- Name: blood_unit_transfers blood_unit_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_unit_transfers
    ADD CONSTRAINT blood_unit_transfers_pkey PRIMARY KEY (id);


--
-- Name: blood_units blood_units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_units
    ADD CONSTRAINT blood_units_pkey PRIMARY KEY (id);


--
-- Name: blood_units blood_units_unit_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_units
    ADD CONSTRAINT blood_units_unit_number_key UNIQUE (unit_number);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: business_opportunities business_opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_opportunities
    ADD CONSTRAINT business_opportunities_pkey PRIMARY KEY (id);


--
-- Name: chemical_waste_logs chemical_waste_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chemical_waste_logs
    ADD CONSTRAINT chemical_waste_logs_pkey PRIMARY KEY (id);


--
-- Name: clinical_critical_alerts clinical_critical_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_critical_alerts
    ADD CONSTRAINT clinical_critical_alerts_pkey PRIMARY KEY (id);


--
-- Name: cold_chain_devices cold_chain_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cold_chain_devices
    ADD CONSTRAINT cold_chain_devices_pkey PRIMARY KEY (id);


--
-- Name: cold_chain_readings cold_chain_readings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cold_chain_readings
    ADD CONSTRAINT cold_chain_readings_pkey PRIMARY KEY (id);


--
-- Name: donor_deferral_reasons donor_deferral_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donor_deferral_reasons
    ADD CONSTRAINT donor_deferral_reasons_pkey PRIMARY KEY (id);


--
-- Name: epidemiological_markers epidemiological_markers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.epidemiological_markers
    ADD CONSTRAINT epidemiological_markers_pkey PRIMARY KEY (id);


--
-- Name: epidemiological_reports epidemiological_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.epidemiological_reports
    ADD CONSTRAINT epidemiological_reports_pkey PRIMARY KEY (id);


--
-- Name: epidemiological_reports epidemiological_reports_report_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.epidemiological_reports
    ADD CONSTRAINT epidemiological_reports_report_number_key UNIQUE (report_number);


--
-- Name: equipment_insurances equipment_insurances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_insurances
    ADD CONSTRAINT equipment_insurances_pkey PRIMARY KEY (id);


--
-- Name: equipment_warranties equipment_warranties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_warranties
    ADD CONSTRAINT equipment_warranties_pkey PRIMARY KEY (id);


--
-- Name: external_audit_findings external_audit_findings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_audit_findings
    ADD CONSTRAINT external_audit_findings_pkey PRIMARY KEY (id);


--
-- Name: external_audits external_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_audits
    ADD CONSTRAINT external_audits_pkey PRIMARY KEY (id);


--
-- Name: external_qc_programs external_qc_programs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_qc_programs
    ADD CONSTRAINT external_qc_programs_pkey PRIMARY KEY (id);


--
-- Name: financial_budgets financial_budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_budgets
    ADD CONSTRAINT financial_budgets_pkey PRIMARY KEY (id);


--
-- Name: financial_budgets financial_budgets_tenant_id_month_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_budgets
    ADD CONSTRAINT financial_budgets_tenant_id_month_year_key UNIQUE (tenant_id, month, year);


--
-- Name: fixed_assets fixed_assets_internal_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fixed_assets
    ADD CONSTRAINT fixed_assets_internal_code_key UNIQUE (internal_code);


--
-- Name: fixed_assets fixed_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fixed_assets
    ADD CONSTRAINT fixed_assets_pkey PRIMARY KEY (id);


--
-- Name: formula_execution_logs formula_execution_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formula_execution_logs
    ADD CONSTRAINT formula_execution_logs_pkey PRIMARY KEY (id);


--
-- Name: his_endpoints his_endpoints_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.his_endpoints
    ADD CONSTRAINT his_endpoints_pkey PRIMARY KEY (id);


--
-- Name: his_message_log his_message_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.his_message_log
    ADD CONSTRAINT his_message_log_pkey PRIMARY KEY (id);


--
-- Name: his_test_mappings his_test_mappings_endpoint_id_his_test_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.his_test_mappings
    ADD CONSTRAINT his_test_mappings_endpoint_id_his_test_code_key UNIQUE (endpoint_id, his_test_code);


--
-- Name: his_test_mappings his_test_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.his_test_mappings
    ADD CONSTRAINT his_test_mappings_pkey PRIMARY KEY (id);


--
-- Name: insurance_providers insurance_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_providers
    ADD CONSTRAINT insurance_providers_pkey PRIMARY KEY (id);


--
-- Name: intangible_assets intangible_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intangible_assets
    ADD CONSTRAINT intangible_assets_pkey PRIMARY KEY (id);


--
-- Name: inventory_reagents inventory_reagents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_reagents
    ADD CONSTRAINT inventory_reagents_pkey PRIMARY KEY (id);


--
-- Name: iso_audit_findings iso_audit_findings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iso_audit_findings
    ADD CONSTRAINT iso_audit_findings_pkey PRIMARY KEY (id);


--
-- Name: iso_clauses iso_clauses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iso_clauses
    ADD CONSTRAINT iso_clauses_pkey PRIMARY KEY (id);


--
-- Name: it_hardware_assets it_hardware_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.it_hardware_assets
    ADD CONSTRAINT it_hardware_assets_pkey PRIMARY KEY (id);


--
-- Name: it_maintenance_logs it_maintenance_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.it_maintenance_logs
    ADD CONSTRAINT it_maintenance_logs_pkey PRIMARY KEY (id);


--
-- Name: medical_supplies medical_supplies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_supplies
    ADD CONSTRAINT medical_supplies_pkey PRIMARY KEY (id);


--
-- Name: medical_supplies medical_supplies_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_supplies
    ADD CONSTRAINT medical_supplies_sku_key UNIQUE (sku);


--
-- Name: middleware_raw_frames middleware_raw_frames_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.middleware_raw_frames
    ADD CONSTRAINT middleware_raw_frames_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: orders orders_sample_barcode_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_sample_barcode_key UNIQUE (sample_barcode);


--
-- Name: patient_access_tokens patient_access_tokens_access_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_access_tokens
    ADD CONSTRAINT patient_access_tokens_access_code_key UNIQUE (access_code);


--
-- Name: patient_access_tokens patient_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_access_tokens
    ADD CONSTRAINT patient_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: patient_feedback patient_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_feedback
    ADD CONSTRAINT patient_feedback_pkey PRIMARY KEY (id);


--
-- Name: patients patients_national_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_national_id_key UNIQUE (national_id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: payroll_runs payroll_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_runs
    ADD CONSTRAINT payroll_runs_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_order_number_key UNIQUE (order_number);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: qc_configurations qc_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qc_configurations
    ADD CONSTRAINT qc_configurations_pkey PRIMARY KEY (id);


--
-- Name: qc_runs qc_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qc_runs
    ADD CONSTRAINT qc_runs_pkey PRIMARY KEY (id);


--
-- Name: quality_documents quality_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quality_documents
    ADD CONSTRAINT quality_documents_pkey PRIMARY KEY (id);


--
-- Name: quality_incidents quality_incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quality_incidents
    ADD CONSTRAINT quality_incidents_pkey PRIMARY KEY (id);


--
-- Name: quality_risks quality_risks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quality_risks
    ADD CONSTRAINT quality_risks_pkey PRIMARY KEY (id);


--
-- Name: reference_ranges reference_ranges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_ranges
    ADD CONSTRAINT reference_ranges_pkey PRIMARY KEY (id);


--
-- Name: result_audit_logs result_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.result_audit_logs
    ADD CONSTRAINT result_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: security_audit_trail security_audit_trail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_audit_trail
    ADD CONSTRAINT security_audit_trail_pkey PRIMARY KEY (id);


--
-- Name: shift_templates shift_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_templates
    ADD CONSTRAINT shift_templates_pkey PRIMARY KEY (id);


--
-- Name: staff_competencies staff_competencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_competencies
    ADD CONSTRAINT staff_competencies_pkey PRIMARY KEY (id);


--
-- Name: staff_professional_insurances staff_professional_insurances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_professional_insurances
    ADD CONSTRAINT staff_professional_insurances_pkey PRIMARY KEY (id);


--
-- Name: staff_schedules staff_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_schedules
    ADD CONSTRAINT staff_schedules_pkey PRIMARY KEY (id);


--
-- Name: staff_training_logs staff_training_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_training_logs
    ADD CONSTRAINT staff_training_logs_pkey PRIMARY KEY (id);


--
-- Name: supplier_evaluations supplier_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_evaluations
    ADD CONSTRAINT supplier_evaluations_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: supply_transactions supply_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supply_transactions
    ADD CONSTRAINT supply_transactions_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_ruc_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_ruc_key UNIQUE (ruc);


--
-- Name: test_formulas test_formulas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_formulas
    ADD CONSTRAINT test_formulas_pkey PRIMARY KEY (id);


--
-- Name: test_profile_components test_profile_components_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_profile_components
    ADD CONSTRAINT test_profile_components_pkey PRIMARY KEY (id);


--
-- Name: test_profiles test_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_profiles
    ADD CONSTRAINT test_profiles_pkey PRIMARY KEY (id);


--
-- Name: test_results test_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_pkey PRIMARY KEY (id);


--
-- Name: waste_categories waste_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waste_categories
    ADD CONSTRAINT waste_categories_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_logs_result_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_result_id ON public.result_audit_logs USING btree (result_id);


--
-- Name: idx_blood_notifications_unit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blood_notifications_unit ON public.blood_notifications USING btree (unit_id);


--
-- Name: idx_blood_requests_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blood_requests_patient ON public.blood_requests USING btree (patient_id);


--
-- Name: idx_blood_units_expiry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blood_units_expiry ON public.blood_units USING btree (expiry_date);


--
-- Name: idx_blood_units_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blood_units_status ON public.blood_units USING btree (status);


--
-- Name: idx_calibrations_analyzer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calibrations_analyzer ON public.analyzer_calibrations USING btree (analyzer_id);


--
-- Name: idx_calibrations_expiry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calibrations_expiry ON public.analyzer_calibrations USING btree (expiration_date);


--
-- Name: idx_eqc_test; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eqc_test ON public.external_qc_programs USING btree (test_name);


--
-- Name: idx_feedback_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedback_status ON public.patient_feedback USING btree (status);


--
-- Name: idx_feedback_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedback_type ON public.patient_feedback USING btree (type);


--
-- Name: idx_his_log_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_his_log_order ON public.his_message_log USING btree (order_id);


--
-- Name: idx_his_log_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_his_log_status ON public.his_message_log USING btree (status);


--
-- Name: idx_maint_logs_analyzer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maint_logs_analyzer ON public.analyzer_maintenance_logs USING btree (analyzer_id);


--
-- Name: idx_maint_schedules_due; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maint_schedules_due ON public.analyzer_maintenance_schedules USING btree (next_due_at);


--
-- Name: idx_orders_order_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_order_number ON public.orders USING btree (order_number);


--
-- Name: idx_orders_sample_barcode_perf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_sample_barcode_perf ON public.orders USING btree (sample_barcode);


--
-- Name: idx_orders_status_created_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status_created_date ON public.orders USING btree (status, created_at DESC);


--
-- Name: INDEX idx_orders_status_created_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_orders_status_created_date IS 'AbregoTech LIS: Optimización >500 órdenes/día - Filtro de bandejas';


--
-- Name: idx_patients_national_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_national_id ON public.patients USING btree (national_id);


--
-- Name: idx_patients_national_id_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_national_id_hash ON public.patients USING btree (national_id_hash);


--
-- Name: idx_profiles_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_branch_id ON public.profiles USING btree (branch_id);


--
-- Name: idx_profiles_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_tenant_id ON public.profiles USING btree (tenant_id);


--
-- Name: idx_qc_runs_config; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qc_runs_config ON public.qc_runs USING btree (config_id);


--
-- Name: idx_quality_docs_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quality_docs_code ON public.quality_documents USING btree (code);


--
-- Name: idx_quality_docs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quality_docs_status ON public.quality_documents USING btree (status);


--
-- Name: idx_reagents_expiry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reagents_expiry ON public.inventory_reagents USING btree (expiry_date);


--
-- Name: idx_reagents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reagents_status ON public.inventory_reagents USING btree (status);


--
-- Name: idx_ref_ranges_test_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ref_ranges_test_code ON public.reference_ranges USING btree (test_code);


--
-- Name: idx_results_order_status_perf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_results_order_status_perf ON public.test_results USING btree (order_id, status, created_at DESC);


--
-- Name: idx_staff_ins_expiry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_ins_expiry ON public.staff_professional_insurances USING btree (expiry_date);


--
-- Name: idx_staff_schedule_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_schedule_date ON public.staff_schedules USING btree (work_date);


--
-- Name: idx_staff_schedule_profile; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_schedule_profile ON public.staff_schedules USING btree (profile_id);


--
-- Name: idx_temp_readings_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_temp_readings_date ON public.cold_chain_readings USING btree (recorded_at);


--
-- Name: idx_temp_readings_device; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_temp_readings_device ON public.cold_chain_readings USING btree (device_id);


--
-- Name: idx_test_results_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_results_order_id ON public.test_results USING btree (order_id);


--
-- Name: test_results on_result_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_result_change AFTER UPDATE ON public.test_results FOR EACH ROW EXECUTE FUNCTION public.audit_test_result_changes();


--
-- Name: test_results set_test_results_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_test_results_updated_at BEFORE UPDATE ON public.test_results FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: result_audit_logs tr_audit_logs_immutable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_audit_logs_immutable BEFORE DELETE OR UPDATE ON public.result_audit_logs FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_audit_tampering();


--
-- Name: blood_units tr_blood_unit_safety; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_blood_unit_safety BEFORE INSERT OR UPDATE ON public.blood_units FOR EACH ROW EXECUTE FUNCTION public.fn_monitor_blood_unit_safety();


--
-- Name: profiles tr_prevent_profile_tampering; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_prevent_profile_tampering BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_profile_tampering();


--
-- Name: test_results tr_process_test_result; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_process_test_result BEFORE INSERT OR UPDATE ON public.test_results FOR EACH ROW EXECUTE FUNCTION public.fn_validate_test_result();


--
-- Name: security_audit_trail tr_security_audit_immutable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_security_audit_immutable BEFORE DELETE OR UPDATE ON public.security_audit_trail FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_audit_tampering();


--
-- Name: analyzer_calibrations analyzer_calibrations_analyzer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyzer_calibrations
    ADD CONSTRAINT analyzer_calibrations_analyzer_id_fkey FOREIGN KEY (analyzer_id) REFERENCES public.analyzers(id) ON DELETE CASCADE;


--
-- Name: analyzer_calibrations analyzer_calibrations_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyzer_calibrations
    ADD CONSTRAINT analyzer_calibrations_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.profiles(id);


--
-- Name: analyzer_calibrations analyzer_calibrations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyzer_calibrations
    ADD CONSTRAINT analyzer_calibrations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: analyzer_maintenance_logs analyzer_maintenance_logs_analyzer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyzer_maintenance_logs
    ADD CONSTRAINT analyzer_maintenance_logs_analyzer_id_fkey FOREIGN KEY (analyzer_id) REFERENCES public.analyzers(id) ON DELETE CASCADE;


--
-- Name: analyzer_maintenance_logs analyzer_maintenance_logs_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyzer_maintenance_logs
    ADD CONSTRAINT analyzer_maintenance_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.profiles(id);


--
-- Name: analyzer_maintenance_logs analyzer_maintenance_logs_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyzer_maintenance_logs
    ADD CONSTRAINT analyzer_maintenance_logs_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.analyzer_maintenance_schedules(id) ON DELETE SET NULL;


--
-- Name: analyzer_maintenance_logs analyzer_maintenance_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyzer_maintenance_logs
    ADD CONSTRAINT analyzer_maintenance_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: analyzer_maintenance_schedules analyzer_maintenance_schedules_analyzer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyzer_maintenance_schedules
    ADD CONSTRAINT analyzer_maintenance_schedules_analyzer_id_fkey FOREIGN KEY (analyzer_id) REFERENCES public.analyzers(id) ON DELETE CASCADE;


--
-- Name: analyzer_maintenance_schedules analyzer_maintenance_schedules_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyzer_maintenance_schedules
    ADD CONSTRAINT analyzer_maintenance_schedules_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: appointment_slots appointment_slots_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_slots
    ADD CONSTRAINT appointment_slots_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: appointment_slots appointment_slots_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_slots
    ADD CONSTRAINT appointment_slots_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: asset_categories asset_categories_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_categories
    ADD CONSTRAINT asset_categories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: automated_notifications automated_notifications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automated_notifications
    ADD CONSTRAINT automated_notifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: billing_cash_closings billing_cash_closings_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_cash_closings
    ADD CONSTRAINT billing_cash_closings_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: billing_cash_closings billing_cash_closings_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_cash_closings
    ADD CONSTRAINT billing_cash_closings_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES auth.users(id);


--
-- Name: billing_cash_closings billing_cash_closings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_cash_closings
    ADD CONSTRAINT billing_cash_closings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: billing_invoices billing_invoices_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT billing_invoices_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: billing_invoices billing_invoices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT billing_invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: biohazard_pickups biohazard_pickups_authorized_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.biohazard_pickups
    ADD CONSTRAINT biohazard_pickups_authorized_by_fkey FOREIGN KEY (authorized_by) REFERENCES auth.users(id);


--
-- Name: biohazard_pickups biohazard_pickups_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.biohazard_pickups
    ADD CONSTRAINT biohazard_pickups_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: biohazard_waste_logs biohazard_waste_logs_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.biohazard_waste_logs
    ADD CONSTRAINT biohazard_waste_logs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: biohazard_waste_logs biohazard_waste_logs_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.biohazard_waste_logs
    ADD CONSTRAINT biohazard_waste_logs_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.waste_categories(id) ON DELETE SET NULL;


--
-- Name: biohazard_waste_logs biohazard_waste_logs_generated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.biohazard_waste_logs
    ADD CONSTRAINT biohazard_waste_logs_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES auth.users(id);


--
-- Name: biohazard_waste_logs biohazard_waste_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.biohazard_waste_logs
    ADD CONSTRAINT biohazard_waste_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: blood_crossmatches blood_crossmatches_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_crossmatches
    ADD CONSTRAINT blood_crossmatches_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.blood_requests(id) ON DELETE CASCADE;


--
-- Name: blood_crossmatches blood_crossmatches_technologist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_crossmatches
    ADD CONSTRAINT blood_crossmatches_technologist_id_fkey FOREIGN KEY (technologist_id) REFERENCES public.profiles(id);


--
-- Name: blood_crossmatches blood_crossmatches_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_crossmatches
    ADD CONSTRAINT blood_crossmatches_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.blood_units(id) ON DELETE CASCADE;


--
-- Name: blood_donors blood_donors_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_donors
    ADD CONSTRAINT blood_donors_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: blood_donors blood_donors_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_donors
    ADD CONSTRAINT blood_donors_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: blood_drive_events blood_drive_events_lead_tech_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_drive_events
    ADD CONSTRAINT blood_drive_events_lead_tech_id_fkey FOREIGN KEY (lead_tech_id) REFERENCES public.profiles(id);


--
-- Name: blood_drive_events blood_drive_events_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_drive_events
    ADD CONSTRAINT blood_drive_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: blood_drive_registrations blood_drive_registrations_collected_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_drive_registrations
    ADD CONSTRAINT blood_drive_registrations_collected_unit_id_fkey FOREIGN KEY (collected_unit_id) REFERENCES public.blood_units(id);


--
-- Name: blood_drive_registrations blood_drive_registrations_donor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_drive_registrations
    ADD CONSTRAINT blood_drive_registrations_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES public.blood_donors(id) ON DELETE SET NULL;


--
-- Name: blood_drive_registrations blood_drive_registrations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_drive_registrations
    ADD CONSTRAINT blood_drive_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.blood_drive_events(id) ON DELETE CASCADE;


--
-- Name: blood_drive_registrations blood_drive_registrations_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_drive_registrations
    ADD CONSTRAINT blood_drive_registrations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: blood_hemovigilance blood_hemovigilance_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_hemovigilance
    ADD CONSTRAINT blood_hemovigilance_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: blood_hemovigilance blood_hemovigilance_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_hemovigilance
    ADD CONSTRAINT blood_hemovigilance_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.profiles(id);


--
-- Name: blood_hemovigilance blood_hemovigilance_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_hemovigilance
    ADD CONSTRAINT blood_hemovigilance_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.blood_units(id);


--
-- Name: blood_notifications blood_notifications_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_notifications
    ADD CONSTRAINT blood_notifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: blood_notifications blood_notifications_donor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_notifications
    ADD CONSTRAINT blood_notifications_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES public.blood_donors(id) ON DELETE CASCADE;


--
-- Name: blood_notifications blood_notifications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_notifications
    ADD CONSTRAINT blood_notifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: blood_notifications blood_notifications_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_notifications
    ADD CONSTRAINT blood_notifications_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.blood_units(id) ON DELETE CASCADE;


--
-- Name: blood_requests blood_requests_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_requests
    ADD CONSTRAINT blood_requests_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: blood_requests blood_requests_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_requests
    ADD CONSTRAINT blood_requests_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: blood_transfer_items blood_transfer_items_transfer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_transfer_items
    ADD CONSTRAINT blood_transfer_items_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.blood_unit_transfers(id) ON DELETE CASCADE;


--
-- Name: blood_transfer_items blood_transfer_items_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_transfer_items
    ADD CONSTRAINT blood_transfer_items_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.blood_units(id) ON DELETE CASCADE;


--
-- Name: blood_unit_transfers blood_unit_transfers_received_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_unit_transfers
    ADD CONSTRAINT blood_unit_transfers_received_by_fkey FOREIGN KEY (received_by) REFERENCES public.profiles(id);


--
-- Name: blood_unit_transfers blood_unit_transfers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_unit_transfers
    ADD CONSTRAINT blood_unit_transfers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: blood_units blood_units_donor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_units
    ADD CONSTRAINT blood_units_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES public.blood_donors(id);


--
-- Name: blood_units blood_units_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blood_units
    ADD CONSTRAINT blood_units_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: branches branches_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: business_opportunities business_opportunities_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_opportunities
    ADD CONSTRAINT business_opportunities_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: chemical_waste_logs chemical_waste_logs_analyzer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chemical_waste_logs
    ADD CONSTRAINT chemical_waste_logs_analyzer_id_fkey FOREIGN KEY (analyzer_id) REFERENCES public.analyzers(id) ON DELETE SET NULL;


--
-- Name: chemical_waste_logs chemical_waste_logs_generated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chemical_waste_logs
    ADD CONSTRAINT chemical_waste_logs_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES auth.users(id);


--
-- Name: chemical_waste_logs chemical_waste_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chemical_waste_logs
    ADD CONSTRAINT chemical_waste_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: clinical_critical_alerts clinical_critical_alerts_notified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_critical_alerts
    ADD CONSTRAINT clinical_critical_alerts_notified_by_fkey FOREIGN KEY (notified_by) REFERENCES auth.users(id);


--
-- Name: clinical_critical_alerts clinical_critical_alerts_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_critical_alerts
    ADD CONSTRAINT clinical_critical_alerts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: clinical_critical_alerts clinical_critical_alerts_result_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_critical_alerts
    ADD CONSTRAINT clinical_critical_alerts_result_id_fkey FOREIGN KEY (result_id) REFERENCES public.test_results(id);


--
-- Name: clinical_critical_alerts clinical_critical_alerts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_critical_alerts
    ADD CONSTRAINT clinical_critical_alerts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: cold_chain_devices cold_chain_devices_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cold_chain_devices
    ADD CONSTRAINT cold_chain_devices_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: cold_chain_devices cold_chain_devices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cold_chain_devices
    ADD CONSTRAINT cold_chain_devices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: cold_chain_readings cold_chain_readings_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cold_chain_readings
    ADD CONSTRAINT cold_chain_readings_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.cold_chain_devices(id) ON DELETE CASCADE;


--
-- Name: donor_deferral_reasons donor_deferral_reasons_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donor_deferral_reasons
    ADD CONSTRAINT donor_deferral_reasons_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: epidemiological_markers epidemiological_markers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.epidemiological_markers
    ADD CONSTRAINT epidemiological_markers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: epidemiological_reports epidemiological_reports_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.epidemiological_reports
    ADD CONSTRAINT epidemiological_reports_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id);


--
-- Name: epidemiological_reports epidemiological_reports_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.epidemiological_reports
    ADD CONSTRAINT epidemiological_reports_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: equipment_insurances equipment_insurances_analyzer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_insurances
    ADD CONSTRAINT equipment_insurances_analyzer_id_fkey FOREIGN KEY (analyzer_id) REFERENCES public.analyzers(id) ON DELETE CASCADE;


--
-- Name: equipment_insurances equipment_insurances_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_insurances
    ADD CONSTRAINT equipment_insurances_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: equipment_warranties equipment_warranties_analyzer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_warranties
    ADD CONSTRAINT equipment_warranties_analyzer_id_fkey FOREIGN KEY (analyzer_id) REFERENCES public.analyzers(id) ON DELETE CASCADE;


--
-- Name: equipment_warranties equipment_warranties_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_warranties
    ADD CONSTRAINT equipment_warranties_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: external_audit_findings external_audit_findings_audit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_audit_findings
    ADD CONSTRAINT external_audit_findings_audit_id_fkey FOREIGN KEY (audit_id) REFERENCES public.external_audits(id) ON DELETE CASCADE;


--
-- Name: external_audits external_audits_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_audits
    ADD CONSTRAINT external_audits_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: external_qc_programs external_qc_programs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_qc_programs
    ADD CONSTRAINT external_qc_programs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: financial_budgets financial_budgets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_budgets
    ADD CONSTRAINT financial_budgets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: fixed_assets fixed_assets_analyzer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fixed_assets
    ADD CONSTRAINT fixed_assets_analyzer_id_fkey FOREIGN KEY (analyzer_id) REFERENCES public.analyzers(id) ON DELETE SET NULL;


--
-- Name: fixed_assets fixed_assets_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fixed_assets
    ADD CONSTRAINT fixed_assets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.asset_categories(id) ON DELETE SET NULL;


--
-- Name: fixed_assets fixed_assets_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fixed_assets
    ADD CONSTRAINT fixed_assets_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: fixed_assets fixed_assets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fixed_assets
    ADD CONSTRAINT fixed_assets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: profiles fk_profiles_branch; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT fk_profiles_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: profiles fk_profiles_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT fk_profiles_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: formula_execution_logs formula_execution_logs_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formula_execution_logs
    ADD CONSTRAINT formula_execution_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: formula_execution_logs formula_execution_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formula_execution_logs
    ADD CONSTRAINT formula_execution_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: his_endpoints his_endpoints_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.his_endpoints
    ADD CONSTRAINT his_endpoints_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: his_message_log his_message_log_endpoint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.his_message_log
    ADD CONSTRAINT his_message_log_endpoint_id_fkey FOREIGN KEY (endpoint_id) REFERENCES public.his_endpoints(id) ON DELETE SET NULL;


--
-- Name: his_message_log his_message_log_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.his_message_log
    ADD CONSTRAINT his_message_log_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: his_message_log his_message_log_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.his_message_log
    ADD CONSTRAINT his_message_log_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: his_test_mappings his_test_mappings_endpoint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.his_test_mappings
    ADD CONSTRAINT his_test_mappings_endpoint_id_fkey FOREIGN KEY (endpoint_id) REFERENCES public.his_endpoints(id) ON DELETE CASCADE;


--
-- Name: his_test_mappings his_test_mappings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.his_test_mappings
    ADD CONSTRAINT his_test_mappings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: insurance_providers insurance_providers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_providers
    ADD CONSTRAINT insurance_providers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: intangible_assets intangible_assets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intangible_assets
    ADD CONSTRAINT intangible_assets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: inventory_reagents inventory_reagents_opened_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_reagents
    ADD CONSTRAINT inventory_reagents_opened_by_fkey FOREIGN KEY (opened_by) REFERENCES auth.users(id);


--
-- Name: inventory_reagents inventory_reagents_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_reagents
    ADD CONSTRAINT inventory_reagents_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: iso_audit_findings iso_audit_findings_audited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iso_audit_findings
    ADD CONSTRAINT iso_audit_findings_audited_by_fkey FOREIGN KEY (audited_by) REFERENCES auth.users(id);


--
-- Name: iso_audit_findings iso_audit_findings_clause_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iso_audit_findings
    ADD CONSTRAINT iso_audit_findings_clause_id_fkey FOREIGN KEY (clause_id) REFERENCES public.iso_clauses(id) ON DELETE CASCADE;


--
-- Name: iso_audit_findings iso_audit_findings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iso_audit_findings
    ADD CONSTRAINT iso_audit_findings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: it_hardware_assets it_hardware_assets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.it_hardware_assets
    ADD CONSTRAINT it_hardware_assets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: it_maintenance_logs it_maintenance_logs_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.it_maintenance_logs
    ADD CONSTRAINT it_maintenance_logs_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.it_hardware_assets(id) ON DELETE CASCADE;


--
-- Name: it_maintenance_logs it_maintenance_logs_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.it_maintenance_logs
    ADD CONSTRAINT it_maintenance_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES auth.users(id);


--
-- Name: medical_supplies medical_supplies_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_supplies
    ADD CONSTRAINT medical_supplies_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: medical_supplies medical_supplies_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_supplies
    ADD CONSTRAINT medical_supplies_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: middleware_raw_frames middleware_raw_frames_analyzer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.middleware_raw_frames
    ADD CONSTRAINT middleware_raw_frames_analyzer_id_fkey FOREIGN KEY (analyzer_id) REFERENCES public.analyzers(id);


--
-- Name: middleware_raw_frames middleware_raw_frames_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.middleware_raw_frames
    ADD CONSTRAINT middleware_raw_frames_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: orders orders_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patient_access_tokens patient_access_tokens_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_access_tokens
    ADD CONSTRAINT patient_access_tokens_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: patient_access_tokens patient_access_tokens_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_access_tokens
    ADD CONSTRAINT patient_access_tokens_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patient_access_tokens patient_access_tokens_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_access_tokens
    ADD CONSTRAINT patient_access_tokens_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: patient_feedback patient_feedback_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_feedback
    ADD CONSTRAINT patient_feedback_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: patient_feedback patient_feedback_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_feedback
    ADD CONSTRAINT patient_feedback_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;


--
-- Name: patient_feedback patient_feedback_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_feedback
    ADD CONSTRAINT patient_feedback_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id);


--
-- Name: patient_feedback patient_feedback_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_feedback
    ADD CONSTRAINT patient_feedback_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: payroll_runs payroll_runs_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_runs
    ADD CONSTRAINT payroll_runs_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: payroll_runs payroll_runs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_runs
    ADD CONSTRAINT payroll_runs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: purchase_order_items purchase_order_items_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: qc_configurations qc_configurations_analyzer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qc_configurations
    ADD CONSTRAINT qc_configurations_analyzer_id_fkey FOREIGN KEY (analyzer_id) REFERENCES public.analyzers(id) ON DELETE CASCADE;


--
-- Name: qc_configurations qc_configurations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qc_configurations
    ADD CONSTRAINT qc_configurations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: qc_runs qc_runs_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qc_runs
    ADD CONSTRAINT qc_runs_config_id_fkey FOREIGN KEY (config_id) REFERENCES public.qc_configurations(id) ON DELETE CASCADE;


--
-- Name: qc_runs qc_runs_technician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qc_runs
    ADD CONSTRAINT qc_runs_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.profiles(id);


--
-- Name: qc_runs qc_runs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qc_runs
    ADD CONSTRAINT qc_runs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: quality_documents quality_documents_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quality_documents
    ADD CONSTRAINT quality_documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: quality_documents quality_documents_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quality_documents
    ADD CONSTRAINT quality_documents_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: quality_incidents quality_incidents_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quality_incidents
    ADD CONSTRAINT quality_incidents_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id);


--
-- Name: quality_incidents quality_incidents_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quality_incidents
    ADD CONSTRAINT quality_incidents_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES auth.users(id);


--
-- Name: quality_incidents quality_incidents_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quality_incidents
    ADD CONSTRAINT quality_incidents_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: quality_risks quality_risks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quality_risks
    ADD CONSTRAINT quality_risks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: reference_ranges reference_ranges_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_ranges
    ADD CONSTRAINT reference_ranges_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: result_audit_logs result_audit_logs_result_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.result_audit_logs
    ADD CONSTRAINT result_audit_logs_result_id_fkey FOREIGN KEY (result_id) REFERENCES public.test_results(id) ON DELETE CASCADE;


--
-- Name: security_audit_trail security_audit_trail_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_audit_trail
    ADD CONSTRAINT security_audit_trail_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: security_audit_trail security_audit_trail_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_audit_trail
    ADD CONSTRAINT security_audit_trail_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: shift_templates shift_templates_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_templates
    ADD CONSTRAINT shift_templates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: staff_competencies staff_competencies_evaluated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_competencies
    ADD CONSTRAINT staff_competencies_evaluated_by_fkey FOREIGN KEY (evaluated_by) REFERENCES public.profiles(id);


--
-- Name: staff_competencies staff_competencies_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_competencies
    ADD CONSTRAINT staff_competencies_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: staff_competencies staff_competencies_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_competencies
    ADD CONSTRAINT staff_competencies_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: staff_professional_insurances staff_professional_insurances_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_professional_insurances
    ADD CONSTRAINT staff_professional_insurances_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: staff_professional_insurances staff_professional_insurances_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_professional_insurances
    ADD CONSTRAINT staff_professional_insurances_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: staff_schedules staff_schedules_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_schedules
    ADD CONSTRAINT staff_schedules_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: staff_schedules staff_schedules_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_schedules
    ADD CONSTRAINT staff_schedules_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.shift_templates(id) ON DELETE SET NULL;


--
-- Name: staff_schedules staff_schedules_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_schedules
    ADD CONSTRAINT staff_schedules_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: staff_training_logs staff_training_logs_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_training_logs
    ADD CONSTRAINT staff_training_logs_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: staff_training_logs staff_training_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_training_logs
    ADD CONSTRAINT staff_training_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: supplier_evaluations supplier_evaluations_evaluated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_evaluations
    ADD CONSTRAINT supplier_evaluations_evaluated_by_fkey FOREIGN KEY (evaluated_by) REFERENCES auth.users(id);


--
-- Name: supplier_evaluations supplier_evaluations_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_evaluations
    ADD CONSTRAINT supplier_evaluations_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;


--
-- Name: supplier_evaluations supplier_evaluations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_evaluations
    ADD CONSTRAINT supplier_evaluations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: suppliers suppliers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: supply_transactions supply_transactions_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supply_transactions
    ADD CONSTRAINT supply_transactions_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES auth.users(id);


--
-- Name: supply_transactions supply_transactions_supply_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supply_transactions
    ADD CONSTRAINT supply_transactions_supply_id_fkey FOREIGN KEY (supply_id) REFERENCES public.medical_supplies(id) ON DELETE CASCADE;


--
-- Name: test_formulas test_formulas_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_formulas
    ADD CONSTRAINT test_formulas_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: test_profile_components test_profile_components_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_profile_components
    ADD CONSTRAINT test_profile_components_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.test_profiles(id) ON DELETE CASCADE;


--
-- Name: test_profiles test_profiles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_profiles
    ADD CONSTRAINT test_profiles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: test_results test_results_analyzer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_analyzer_id_fkey FOREIGN KEY (analyzer_id) REFERENCES public.analyzers(id);


--
-- Name: test_results test_results_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: waste_categories waste_categories_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waste_categories
    ADD CONSTRAINT waste_categories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: appointments Appointments Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Appointments Tenant Isolation" ON public.appointments USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: asset_categories Asset Categories Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Asset Categories Tenant Isolation" ON public.asset_categories USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: external_audit_findings Audit Findings Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Audit Findings Tenant Isolation" ON public.external_audit_findings USING ((EXISTS ( SELECT 1
   FROM public.external_audits a
  WHERE ((a.id = external_audit_findings.audit_id) AND (a.tenant_id = ( SELECT profiles.tenant_id
           FROM public.profiles
          WHERE (profiles.id = auth.uid())))))));


--
-- Name: billing_invoices Billing Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Billing Tenant Isolation" ON public.billing_invoices USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: blood_donors Blood Bank Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Blood Bank Tenant Isolation" ON public.blood_donors USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: blood_drive_events Blood Drives Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Blood Drives Tenant Isolation" ON public.blood_drive_events USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: blood_units Blood Units Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Blood Units Tenant Isolation" ON public.blood_units USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: branches Branches Tenant Isolation - DELETE; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Branches Tenant Isolation - DELETE" ON public.branches FOR DELETE USING (((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))) AND (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = ANY (ARRAY['owner'::text, 'abregotech_admin'::text]))));


--
-- Name: branches Branches Tenant Isolation - INSERT; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Branches Tenant Isolation - INSERT" ON public.branches FOR INSERT WITH CHECK (((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))) AND (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = ANY (ARRAY['owner'::text, 'abregotech_admin'::text]))));


--
-- Name: branches Branches Tenant Isolation - SELECT; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Branches Tenant Isolation - SELECT" ON public.branches FOR SELECT USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: branches Branches Tenant Isolation - UPDATE; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Branches Tenant Isolation - UPDATE" ON public.branches FOR UPDATE USING (((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))) AND (( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = ANY (ARRAY['owner'::text, 'abregotech_admin'::text])))) WITH CHECK ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: financial_budgets Budgets Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Budgets Tenant Isolation" ON public.financial_budgets USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: analyzer_calibrations Calibration Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Calibration Tenant Isolation" ON public.analyzer_calibrations USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: chemical_waste_logs Chemical Waste Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chemical Waste Tenant Isolation" ON public.chemical_waste_logs USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: billing_cash_closings Closings Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Closings Tenant Isolation" ON public.billing_cash_closings USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: cold_chain_devices Cold Chain Devices Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cold Chain Devices Isolation" ON public.cold_chain_devices USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: cold_chain_readings Cold Chain Readings Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cold Chain Readings Isolation" ON public.cold_chain_readings USING ((EXISTS ( SELECT 1
   FROM public.cold_chain_devices d
  WHERE ((d.id = cold_chain_readings.device_id) AND (d.tenant_id = ( SELECT profiles.tenant_id
           FROM public.profiles
          WHERE (profiles.id = auth.uid())))))));


--
-- Name: staff_competencies Competencies Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Competencies Tenant Isolation" ON public.staff_competencies USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: test_profile_components Components Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Components Tenant Isolation" ON public.test_profile_components USING ((EXISTS ( SELECT 1
   FROM public.test_profiles p
  WHERE ((p.id = test_profile_components.profile_id) AND (p.tenant_id = ( SELECT profiles.tenant_id
           FROM public.profiles
          WHERE (profiles.id = auth.uid())))))));


--
-- Name: clinical_critical_alerts Critical Alerts Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Critical Alerts Tenant Isolation" ON public.clinical_critical_alerts USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: donor_deferral_reasons Deferral Reasons Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deferral Reasons Tenant Isolation" ON public.donor_deferral_reasons USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: blood_drive_registrations Drive Reg Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drive Reg Tenant Isolation" ON public.blood_drive_registrations USING ((EXISTS ( SELECT 1
   FROM public.blood_drive_events e
  WHERE ((e.id = blood_drive_registrations.event_id) AND (e.tenant_id = ( SELECT profiles.tenant_id
           FROM public.profiles
          WHERE (profiles.id = auth.uid())))))));


--
-- Name: epidemiological_markers Epi Markers Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Epi Markers Tenant Isolation" ON public.epidemiological_markers USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: epidemiological_reports Epi Reports Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Epi Reports Tenant Isolation" ON public.epidemiological_reports USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: equipment_insurances Equipment Insurances Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Equipment Insurances Isolation" ON public.equipment_insurances USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: equipment_warranties Equipment Warranties Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Equipment Warranties Isolation" ON public.equipment_warranties USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: external_audits External Audits Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "External Audits Tenant Isolation" ON public.external_audits USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: external_qc_programs External QC Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "External QC Tenant Isolation" ON public.external_qc_programs USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: patient_feedback Feedback Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Feedback Tenant Isolation" ON public.patient_feedback USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: fixed_assets Fixed Assets Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Fixed Assets Tenant Isolation" ON public.fixed_assets USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: formula_execution_logs Formula Logs Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Formula Logs Tenant Isolation" ON public.formula_execution_logs USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: test_formulas Formulas Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Formulas Tenant Isolation" ON public.test_formulas USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: his_endpoints HIS Endpoints Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "HIS Endpoints Isolation" ON public.his_endpoints USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: his_test_mappings HIS Mappings Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "HIS Mappings Isolation" ON public.his_test_mappings USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: his_message_log HIS Messages Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "HIS Messages Isolation" ON public.his_message_log USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: iso_audit_findings ISO Audit Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "ISO Audit Tenant Isolation" ON public.iso_audit_findings USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: iso_clauses ISO Clauses Public Read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "ISO Clauses Public Read" ON public.iso_clauses FOR SELECT USING (true);


--
-- Name: it_hardware_assets IT Hardware Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "IT Hardware Tenant Isolation" ON public.it_hardware_assets USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: it_maintenance_logs IT Maint Logs Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "IT Maint Logs Tenant Isolation" ON public.it_maintenance_logs USING ((EXISTS ( SELECT 1
   FROM public.it_hardware_assets a
  WHERE ((a.id = it_maintenance_logs.asset_id) AND (a.tenant_id = ( SELECT profiles.tenant_id
           FROM public.profiles
          WHERE (profiles.id = auth.uid())))))));


--
-- Name: quality_incidents Incidents Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Incidents Tenant Isolation" ON public.quality_incidents USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: insurance_providers Insurance Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Insurance Tenant Isolation" ON public.insurance_providers USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: intangible_assets Intangible Assets Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Intangible Assets Isolation" ON public.intangible_assets USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: analyzer_maintenance_logs Maint Log Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Maint Log Tenant Isolation" ON public.analyzer_maintenance_logs USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: analyzer_maintenance_schedules Maint Schedule Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Maint Schedule Tenant Isolation" ON public.analyzer_maintenance_schedules USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: middleware_raw_frames Middleware Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Middleware Tenant Isolation" ON public.middleware_raw_frames USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: automated_notifications Notifications Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Notifications Tenant Isolation" ON public.automated_notifications USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: blood_notifications Notifications Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Notifications Tenant Isolation" ON public.blood_notifications USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: business_opportunities Opportunities Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Opportunities Tenant Isolation" ON public.business_opportunities USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: purchase_order_items PO Items Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "PO Items Tenant Isolation" ON public.purchase_order_items USING ((EXISTS ( SELECT 1
   FROM public.purchase_orders po
  WHERE ((po.id = purchase_order_items.po_id) AND (po.tenant_id = ( SELECT profiles.tenant_id
           FROM public.profiles
          WHERE (profiles.id = auth.uid())))))));


--
-- Name: purchase_orders PO Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "PO Tenant Isolation" ON public.purchase_orders USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: patient_access_tokens Patient Access Token Access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patient Access Token Access" ON public.patient_access_tokens FOR SELECT USING (((is_active = true) AND (expires_at > now())));


--
-- Name: patient_feedback Patient Feedback Insertion; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patient Feedback Insertion" ON public.patient_feedback FOR INSERT WITH CHECK (true);


--
-- Name: payroll_runs Payroll Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Payroll Tenant Isolation" ON public.payroll_runs USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: biohazard_pickups Pickups Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Pickups Tenant Isolation" ON public.biohazard_pickups USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: staff_professional_insurances Prof Insurance Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Prof Insurance Tenant Isolation" ON public.staff_professional_insurances USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: profiles Profiles - Admin UPDATE; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles - Admin UPDATE" ON public.profiles FOR UPDATE USING (
  public.get_auth_role() = ANY (ARRAY['owner'::text, 'abregotech_admin'::text])
  AND
  tenant_id = public.get_auth_tenant_id()
);


--
-- Name: profiles Profiles - INSERT on signup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles - INSERT on signup" ON public.profiles FOR INSERT WITH CHECK ((id = auth.uid()));


--
-- Name: profiles Profiles - SELECT Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles - SELECT Isolation" ON public.profiles FOR SELECT USING (
  (id = auth.uid())
  OR
  (
    tenant_id = public.get_auth_tenant_id()
    AND
    public.get_auth_role() = ANY (ARRAY['owner'::text, 'lab_chief'::text, 'abregotech_admin'::text])
  )
);


--
-- Name: profiles Profiles - Self UPDATE Restricted; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles - Self UPDATE Restricted" ON public.profiles FOR UPDATE USING (
  id = auth.uid()
) WITH CHECK (
  id = auth.uid()
  AND
  tenant_id = public.get_auth_tenant_id()
  AND
  role = public.get_auth_role()
);


--
-- Name: test_profiles Profiles Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles Tenant Isolation" ON public.test_profiles USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: qc_configurations QC Config Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "QC Config Tenant Isolation" ON public.qc_configurations USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: qc_runs QC Runs Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "QC Runs Tenant Isolation" ON public.qc_runs USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: quality_documents Quality Docs Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Quality Docs Tenant Isolation" ON public.quality_documents USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: inventory_reagents Reagents Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Reagents Tenant Isolation" ON public.inventory_reagents USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: reference_ranges Ref Ranges Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ref Ranges Tenant Isolation" ON public.reference_ranges USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: quality_risks Risks Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Risks Tenant Isolation" ON public.quality_risks USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: staff_schedules Schedules Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Schedules Tenant Isolation" ON public.staff_schedules USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: security_audit_trail Security Audit Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Security Audit Tenant Isolation" ON public.security_audit_trail USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: shift_templates Shifts Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Shifts Tenant Isolation" ON public.shift_templates USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: appointment_slots Slots Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Slots Tenant Isolation" ON public.appointment_slots USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: supplier_evaluations Supplier Eval Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Supplier Eval Tenant Isolation" ON public.supplier_evaluations USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: suppliers Suppliers Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Suppliers Tenant Isolation" ON public.suppliers USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: medical_supplies Supplies Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Supplies Tenant Isolation" ON public.medical_supplies USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: supply_transactions Supply Trans Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Supply Trans Isolation" ON public.supply_transactions USING ((EXISTS ( SELECT 1
   FROM public.medical_supplies s
  WHERE ((s.id = supply_transactions.supply_id) AND (s.tenant_id = ( SELECT profiles.tenant_id
           FROM public.profiles
          WHERE (profiles.id = auth.uid())))))));


--
-- Name: staff_training_logs Training Logs Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Training Logs Tenant Isolation" ON public.staff_training_logs USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: blood_transfer_items Transfer Items Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Transfer Items Tenant Isolation" ON public.blood_transfer_items USING ((EXISTS ( SELECT 1
   FROM public.blood_unit_transfers t
  WHERE ((t.id = blood_transfer_items.transfer_id) AND (t.tenant_id = ( SELECT profiles.tenant_id
           FROM public.profiles
          WHERE (profiles.id = auth.uid())))))));


--
-- Name: blood_unit_transfers Transfers Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Transfers Tenant Isolation" ON public.blood_unit_transfers USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: tenants Users can see their own tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can see their own tenant" ON public.tenants FOR SELECT USING ((id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: waste_categories Waste Categories Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Waste Categories Tenant Isolation" ON public.waste_categories USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: biohazard_waste_logs Waste Logs Tenant Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Waste Logs Tenant Isolation" ON public.biohazard_waste_logs USING ((tenant_id = ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: analyzer_calibrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analyzer_calibrations ENABLE ROW LEVEL SECURITY;

--
-- Name: analyzer_maintenance_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analyzer_maintenance_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: analyzer_maintenance_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analyzer_maintenance_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: analyzers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analyzers ENABLE ROW LEVEL SECURITY;

--
-- Name: appointment_slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: appointments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

--
-- Name: asset_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: automated_notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.automated_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: billing_cash_closings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.billing_cash_closings ENABLE ROW LEVEL SECURITY;

--
-- Name: billing_invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: biohazard_pickups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.biohazard_pickups ENABLE ROW LEVEL SECURITY;

--
-- Name: biohazard_waste_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.biohazard_waste_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: blood_crossmatches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blood_crossmatches ENABLE ROW LEVEL SECURITY;

--
-- Name: blood_donors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;

--
-- Name: blood_drive_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blood_drive_events ENABLE ROW LEVEL SECURITY;

--
-- Name: blood_drive_registrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blood_drive_registrations ENABLE ROW LEVEL SECURITY;

--
-- Name: blood_hemovigilance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blood_hemovigilance ENABLE ROW LEVEL SECURITY;

--
-- Name: blood_notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blood_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: blood_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: blood_transfer_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blood_transfer_items ENABLE ROW LEVEL SECURITY;

--
-- Name: blood_unit_transfers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blood_unit_transfers ENABLE ROW LEVEL SECURITY;

--
-- Name: blood_units; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blood_units ENABLE ROW LEVEL SECURITY;

--
-- Name: branches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

--
-- Name: business_opportunities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_opportunities ENABLE ROW LEVEL SECURITY;

--
-- Name: chemical_waste_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chemical_waste_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: clinical_critical_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinical_critical_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: cold_chain_devices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cold_chain_devices ENABLE ROW LEVEL SECURITY;

--
-- Name: cold_chain_readings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cold_chain_readings ENABLE ROW LEVEL SECURITY;

--
-- Name: donor_deferral_reasons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.donor_deferral_reasons ENABLE ROW LEVEL SECURITY;

--
-- Name: epidemiological_markers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.epidemiological_markers ENABLE ROW LEVEL SECURITY;

--
-- Name: epidemiological_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.epidemiological_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: equipment_insurances; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.equipment_insurances ENABLE ROW LEVEL SECURITY;

--
-- Name: equipment_warranties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.equipment_warranties ENABLE ROW LEVEL SECURITY;

--
-- Name: external_audit_findings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.external_audit_findings ENABLE ROW LEVEL SECURITY;

--
-- Name: external_audits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.external_audits ENABLE ROW LEVEL SECURITY;

--
-- Name: external_qc_programs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.external_qc_programs ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_budgets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financial_budgets ENABLE ROW LEVEL SECURITY;

--
-- Name: fixed_assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: formula_execution_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.formula_execution_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: his_endpoints; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.his_endpoints ENABLE ROW LEVEL SECURITY;

--
-- Name: his_message_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.his_message_log ENABLE ROW LEVEL SECURITY;

--
-- Name: his_test_mappings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.his_test_mappings ENABLE ROW LEVEL SECURITY;

--
-- Name: insurance_providers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: intangible_assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.intangible_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_reagents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory_reagents ENABLE ROW LEVEL SECURITY;

--
-- Name: iso_audit_findings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.iso_audit_findings ENABLE ROW LEVEL SECURITY;

--
-- Name: iso_clauses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.iso_clauses ENABLE ROW LEVEL SECURITY;

--
-- Name: it_hardware_assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.it_hardware_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: it_maintenance_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.it_maintenance_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: medical_supplies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.medical_supplies ENABLE ROW LEVEL SECURITY;

--
-- Name: middleware_raw_frames; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.middleware_raw_frames ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_access_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_access_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_feedback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: patients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

--
-- Name: payroll_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: qc_configurations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.qc_configurations ENABLE ROW LEVEL SECURITY;

--
-- Name: qc_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.qc_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: quality_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quality_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: quality_incidents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quality_incidents ENABLE ROW LEVEL SECURITY;

--
-- Name: quality_risks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quality_risks ENABLE ROW LEVEL SECURITY;

--
-- Name: reference_ranges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reference_ranges ENABLE ROW LEVEL SECURITY;

--
-- Name: result_audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.result_audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: security_audit_trail; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.security_audit_trail ENABLE ROW LEVEL SECURITY;

--
-- Name: shift_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_competencies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.staff_competencies ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_professional_insurances; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.staff_professional_insurances ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_training_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.staff_training_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: supplier_evaluations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supplier_evaluations ENABLE ROW LEVEL SECURITY;

--
-- Name: suppliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

--
-- Name: supply_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supply_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

--
-- Name: test_formulas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_formulas ENABLE ROW LEVEL SECURITY;

--
-- Name: test_profile_components; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_profile_components ENABLE ROW LEVEL SECURITY;

--
-- Name: test_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: test_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

--
-- Name: waste_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.waste_categories ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--
