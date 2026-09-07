-- ============================================================
-- Migration: 20260820_branches_rls.sql
-- Adds missing RLS policies for branches table
-- ============================================================

-- Branches: SELECT — users can only see branches from their own tenant
CREATE POLICY "Branches Tenant Isolation - SELECT" ON branches
FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

-- Branches: INSERT — only owner/lab_chief can create branches
CREATE POLICY "Branches Tenant Isolation - INSERT" ON branches
FOR INSERT WITH CHECK (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'abregotech_admin')
);

-- Branches: UPDATE — only owner can update branch info
CREATE POLICY "Branches Tenant Isolation - UPDATE" ON branches
FOR UPDATE USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'abregotech_admin')
) WITH CHECK (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

-- Branches: DELETE — only owner
CREATE POLICY "Branches Tenant Isolation - DELETE" ON branches
FOR DELETE USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'abregotech_admin')
);

-- ============================================================
-- Bonus: Harden profiles policy — allow INSERT for new users
-- (needed for the auth trigger that creates profiles on signup)
-- ============================================================
CREATE POLICY "Profiles - Allow own INSERT" ON profiles
FOR INSERT WITH CHECK (id = auth.uid());

-- Allow UPDATE of own profile
CREATE POLICY "Profiles - Allow own UPDATE" ON profiles
FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============================================================
-- Bonus: Audit Logs — allow INSERT from triggers (system-level)
-- The existing SELECT policy isolates reads per tenant.
-- ============================================================
CREATE POLICY "Audit Logs - System INSERT" ON result_audit_logs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM test_results tr
    JOIN orders o ON tr.order_id = o.id
    WHERE tr.id = result_audit_logs.result_id
    AND o.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  )
);
