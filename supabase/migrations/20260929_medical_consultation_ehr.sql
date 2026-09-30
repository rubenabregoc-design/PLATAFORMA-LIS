-- ============================================================
-- PLATAFORMA-LIS — Módulo HIS: Portal del Doctor / EHR
-- Migración: 20260929_medical_consultation_ehr.sql
-- Cumple: ISO 15189, HIPAA, MINSA Panamá
-- ============================================================

-- ─────────────────────────────────────────────────
-- 1. CONSULTAS MÉDICAS (encabezado de cada visita)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_consultations (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL,

  -- Paciente y médico
  patient_id        UUID        REFERENCES patients(id) ON DELETE RESTRICT,
  patient_national_id TEXT      NOT NULL,         -- cédula/ID denormalizado para búsqueda rápida
  patient_name      TEXT        NOT NULL,
  doctor_id         TEXT        NOT NULL,          -- código/licencia del médico
  doctor_name       TEXT        NOT NULL,
  doctor_license    TEXT,

  -- Turno y estado
  turn_number       INT         NOT NULL DEFAULT 0,
  chief_complaint   TEXT,
  status            TEXT        NOT NULL DEFAULT 'EN_ESPERA'
                                CHECK (status IN ('EN_ESPERA','EN_CONSULTA','PAUSADA','FINALIZADA','CANCELADA')),

  -- Timestamps de ciclo de vida
  admitted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),   -- llegó a recepción
  started_at        TIMESTAMPTZ,                          -- médico inició atención
  paused_at         TIMESTAMPTZ,
  finished_at       TIMESTAMPTZ,

  -- Metadata
  branch_id         UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_tenant       ON medical_consultations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mc_patient      ON medical_consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_mc_national_id  ON medical_consultations(patient_national_id);
CREATE INDEX IF NOT EXISTS idx_mc_status       ON medical_consultations(status);
CREATE INDEX IF NOT EXISTS idx_mc_started_at   ON medical_consultations(started_at DESC);

COMMENT ON TABLE medical_consultations IS
  'Registro maestro de cada visita médica. Una por turno/cita del paciente.';

-- ─────────────────────────────────────────────────
-- 2. SIGNOS VITALES
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consultation_vitals (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id     UUID        NOT NULL REFERENCES medical_consultations(id) ON DELETE CASCADE,
  bp                  TEXT,                   -- "120/80"
  hr                  INT,                    -- lpm
  rr                  INT,                    -- rpm
  temp                NUMERIC(4,1),           -- °C
  spo2                INT,                    -- %
  weight_kg           NUMERIC(5,1),
  height_cm           NUMERIC(5,1),
  bmi                 NUMERIC(4,1),
  recorded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by         TEXT
);

CREATE INDEX IF NOT EXISTS idx_cv_consultation ON consultation_vitals(consultation_id);

COMMENT ON TABLE consultation_vitals IS
  'Signos vitales tomados durante la consulta (puede haber varios registros por serie temporal).';

-- ─────────────────────────────────────────────────
-- 3. NOTA SOAP (evolución médica)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS soap_notes (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id     UUID        NOT NULL UNIQUE REFERENCES medical_consultations(id) ON DELETE CASCADE,
  subjective          TEXT,        -- [S] Motivo / Subjetivo
  objective           TEXT,        -- [O] Examen físico / Objetivo
  assessment          TEXT,        -- [A] Diagnóstico / Evaluación
  plan                TEXT,        -- [P] Plan
  primary_icd10       TEXT,        -- Código CIE-10 principal
  secondary_icd10     TEXT[],      -- Códigos secundarios
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_soap_consultation ON soap_notes(consultation_id);

COMMENT ON TABLE soap_notes IS
  'Nota SOAP oficial de evolución médica por consulta (1:1 con medical_consultations).';

-- ─────────────────────────────────────────────────
-- 4. ÓRDENES MÉDICAS (lab, imagen, sangre, Rx, referencia)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_orders (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id     UUID        NOT NULL REFERENCES medical_consultations(id) ON DELETE CASCADE,
  order_type          TEXT        NOT NULL
                                  CHECK (order_type IN ('LAB','IMAGING','BLOOD','RX','REFERRAL','INCAPACIDAD')),

  -- Datos comunes
  description         TEXT,
  priority            TEXT        NOT NULL DEFAULT 'URGENTE'
                                  CHECK (priority IN ('STAT_INMEDIATA','URGENTE','RUTINA','RESERVA_ELECTIVA','URGENTE_2H')),
  status              TEXT        NOT NULL DEFAULT 'PENDIENTE_ENVIO'
                                  CHECK (status IN ('PENDIENTE_ENVIO','ENVIADA','PROCESANDO','COMPLETADA','CANCELADA')),
  transmitted_at      TIMESTAMPTZ,           -- cuando se envió al sistema destino (LIS, Banco, Farmacia)

  -- Datos específicos en JSONB (flexible según tipo)
  payload             JSONB       NOT NULL DEFAULT '{}',
  -- LAB:      { test_ids: [], lab_note: "" }
  -- IMAGING:  { study_type: "", body_region: "", indication: "" }
  -- BLOOD:    { product_type: "", units: 1, urgency: "", indication: "" }
  -- RX:       { drug: "", dose: "", route: "", frequency: "", duration: "" }
  -- REFERRAL: { specialty: "", reason: "" }
  -- INCAPACIDAD: { days: 0, diagnosis: "", start_date: "" }

  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mo_consultation  ON medical_orders(consultation_id);
CREATE INDEX IF NOT EXISTS idx_mo_type          ON medical_orders(order_type);
CREATE INDEX IF NOT EXISTS idx_mo_status        ON medical_orders(status);

COMMENT ON TABLE medical_orders IS
  'Todas las órdenes emitidas por el médico durante la consulta. Multi-tipo (lab, imagen, sangre, Rx, referencia).';

-- ─────────────────────────────────────────────────
-- 5. DIAGNÓSTICOS ICD-10 (detalle)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consultation_diagnoses (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id     UUID        NOT NULL REFERENCES medical_consultations(id) ON DELETE CASCADE,
  icd10_code          TEXT        NOT NULL,
  icd10_description   TEXT,
  is_primary          BOOLEAN     NOT NULL DEFAULT false,
  certainty           TEXT        DEFAULT 'DEFINITIVO'
                                  CHECK (certainty IN ('DEFINITIVO','PROBABLE','DESCARTADO','DIFERENCIAL')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cd_consultation ON consultation_diagnoses(consultation_id);

-- ─────────────────────────────────────────────────
-- 6. AUDITORÍA / TRAZABILIDAD DE LA CONSULTA
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consultation_audit_log (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id     UUID        NOT NULL REFERENCES medical_consultations(id) ON DELETE CASCADE,
  action              TEXT        NOT NULL,   -- INICIO_CONSULTA, PAUSA, FIN, ORDEN_LAB, etc.
  description         TEXT,
  actor               TEXT,                  -- nombre del médico
  metadata            JSONB       DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cal_consultation ON consultation_audit_log(consultation_id);
CREATE INDEX IF NOT EXISTS idx_cal_created      ON consultation_audit_log(created_at DESC);

-- ─────────────────────────────────────────────────
-- 7. updated_at automático via trigger
-- ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_mc_updated_at') THEN
    CREATE TRIGGER trg_mc_updated_at
      BEFORE UPDATE ON medical_consultations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_soap_updated_at') THEN
    CREATE TRIGGER trg_soap_updated_at
      BEFORE UPDATE ON soap_notes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_mo_updated_at') THEN
    CREATE TRIGGER trg_mo_updated_at
      BEFORE UPDATE ON medical_orders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ─────────────────────────────────────────────────
-- 8. ROW LEVEL SECURITY (misma política que el resto del sistema)
-- ─────────────────────────────────────────────────
ALTER TABLE medical_consultations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_vitals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE soap_notes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_diagnoses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_audit_log  ENABLE ROW LEVEL SECURITY;

-- Política: acceso completo para rol service_role (backend), lectura autenticada por tenant
CREATE POLICY mc_service_all   ON medical_consultations FOR ALL TO service_role USING (true);
CREATE POLICY cv_service_all   ON consultation_vitals   FOR ALL TO service_role USING (true);
CREATE POLICY soap_service_all ON soap_notes            FOR ALL TO service_role USING (true);
CREATE POLICY mo_service_all   ON medical_orders        FOR ALL TO service_role USING (true);
CREATE POLICY cd_service_all   ON consultation_diagnoses FOR ALL TO service_role USING (true);
CREATE POLICY cal_service_all  ON consultation_audit_log FOR ALL TO service_role USING (true);

-- Política anon/authenticated: solo lectura del propio tenant (se refinará con auth.jwt())
CREATE POLICY mc_auth_read ON medical_consultations FOR SELECT TO authenticated
  USING (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));
