-- ============================================================================
-- 🛡️ ABREGOTECH LISCORE — FIX RECURSIÓN RLS EN PROFILES (SUPABASE CLOUD)
-- ============================================================================
-- Elimina el error 42P17 (infinite recursion detected in policy for relation "profiles")
-- mediante funciones SECURITY DEFINER de alta velocidad y cero bucles.
-- ============================================================================

-- 1. Funciones auxiliares de sesión protegidas (omiten RLS de forma segura)
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Eliminar políticas recursivas previas de profiles
DROP POLICY IF EXISTS "Profiles - SELECT Isolation" ON public.profiles;
DROP POLICY IF EXISTS "Profiles - Admin UPDATE" ON public.profiles;
DROP POLICY IF EXISTS "Profiles - Self UPDATE Restricted" ON public.profiles;

-- 3. Recrear políticas de Profiles con evaluación no recursiva
CREATE POLICY "Profiles - SELECT Isolation" ON public.profiles
FOR SELECT USING (
  (id = auth.uid())
  OR
  (
    tenant_id = public.get_auth_tenant_id()
    AND
    public.get_auth_role() = ANY (ARRAY['owner'::text, 'lab_chief'::text, 'abregotech_admin'::text])
  )
);

CREATE POLICY "Profiles - Admin UPDATE" ON public.profiles
FOR UPDATE USING (
  public.get_auth_role() = ANY (ARRAY['owner'::text, 'abregotech_admin'::text])
  AND
  tenant_id = public.get_auth_tenant_id()
);

CREATE POLICY "Profiles - Self UPDATE Restricted" ON public.profiles
FOR UPDATE USING (
  id = auth.uid()
)
WITH CHECK (
  id = auth.uid()
  AND
  tenant_id = public.get_auth_tenant_id()
  AND
  role = public.get_auth_role()
);
