-- Tighten RLS policies flagged by security scanners

-- 1) profiles: remove any overly-permissive SELECT policy and allow only:
--    - self
--    - same household (needed for shared household UI)
--    - admins (if you have admin role policies elsewhere)

DROP POLICY IF EXISTS "Allow authenticated select on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated select on profiles." ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated select" ON public.profiles;
DROP POLICY IF EXISTS "profiles.policy" ON public.profiles;

DROP POLICY IF EXISTS "Household members can view profiles" ON public.profiles;

CREATE POLICY "Household members can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  household_id IS NOT NULL
  AND household_id = public.user_household_id(auth.uid())
);

-- 2) household_invites: remove policy that allows discovery of active invite codes.
--    The app redeems invites via the SECURITY DEFINER function accept_household_invite(),
--    so clients do not need to query invite codes by themselves.

DROP POLICY IF EXISTS "Anyone can view invite by code" ON public.household_invites;
