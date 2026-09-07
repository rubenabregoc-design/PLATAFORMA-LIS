-- ============================================================
-- Migration: 20260907_security_hardening.sql
-- Hardens RLS policies, prevents privilege escalation and tenant hopping
-- Enforces ISO 15189 immutable audit trails
-- ============================================================

-- 1. REVOKE loose profiles policies
DROP POLICY IF EXISTS "Users can see their own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles - Allow own UPDATE" ON profiles;
DROP POLICY IF EXISTS "Profiles - Allow own INSERT" ON profiles;

-- 2. CREATE strict profiles policies
-- Reading profile: only own profile or admin/owner of same tenant
CREATE POLICY "Profiles - SELECT Isolation" ON profiles
FOR SELECT USING (
  id = auth.uid() OR
  (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'lab_chief', 'abregotech_admin')
  )
);

-- Insertion: only system/signup trigger for own UID
CREATE POLICY "Profiles - INSERT on signup" ON profiles
FOR INSERT WITH CHECK (id = auth.uid());

-- Updating profile: Users can only update their display name, phone, license, NOT their role or tenant_id
CREATE POLICY "Profiles - Self UPDATE Restricted" ON profiles
FOR UPDATE USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  -- Prevent tenant hopping or self-elevation
  AND tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND role = (SELECT role FROM profiles WHERE id = auth.uid())
);

-- Admin update for profiles (Tenant Owner or AbregoTech Admin can manage roles within tenant)
CREATE POLICY "Profiles - Admin UPDATE" ON profiles
FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'abregotech_admin')
  AND tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

-- 3. Trigger to strictly enforce immutability of role and tenant_id
CREATE OR REPLACE FUNCTION fn_prevent_profile_tampering()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_prevent_profile_tampering ON profiles;
CREATE TRIGGER tr_prevent_profile_tampering
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION fn_prevent_profile_tampering();

-- 4. ISO 15189 Immutable Audit Logs (Append-Only)
-- Prevent any UPDATE or DELETE on audit logs
CREATE OR REPLACE FUNCTION fn_prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Acceso Denegado (ISO 15189): Los registros de trazabilidad y auditoría son inmutables y no pueden ser modificados ni eliminados.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_audit_logs_immutable ON result_audit_logs;
CREATE TRIGGER tr_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON result_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION fn_prevent_audit_tampering();

DROP TRIGGER IF EXISTS tr_security_audit_immutable ON security_audit_trail;
CREATE TRIGGER tr_security_audit_immutable
  BEFORE UPDATE OR DELETE ON security_audit_trail
  FOR EACH ROW
  EXECUTE FUNCTION fn_prevent_audit_tampering();
