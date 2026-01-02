-- Harden household invites

-- 1) Increase invite_code entropy for newly created invites
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.household_invites
ALTER COLUMN invite_code SET DEFAULT encode(gen_random_bytes(8), 'hex');

-- 2) Allow household members to update invites (e.g., revoke/expire within their household)
DROP POLICY IF EXISTS "Household members can update invites" ON public.household_invites;
CREATE POLICY "Household members can update invites"
ON public.household_invites
FOR UPDATE
TO authenticated
USING (household_id = public.user_household_id(auth.uid()))
WITH CHECK (household_id = public.user_household_id(auth.uid()));

-- 3) Ensure invite redemption can mark invites as used even with strict RLS
CREATE OR REPLACE FUNCTION public.accept_household_invite(p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, row_security = off
AS $$
DECLARE
  v_invite record;
  v_old_household_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  SELECT * INTO v_invite
  FROM public.household_invites
  WHERE invite_code = p_invite_code
    AND used_at IS NULL
    AND expires_at > now();

  IF v_invite IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Convite inválido ou expirado');
  END IF;

  SELECT household_id INTO v_old_household_id
  FROM public.profiles
  WHERE user_id = v_user_id;

  UPDATE public.profiles
  SET household_id = v_invite.household_id
  WHERE user_id = v_user_id;

  UPDATE public.transactions
  SET household_id = v_invite.household_id
  WHERE user_id = v_user_id;

  UPDATE public.household_invites
  SET used_at = now(), used_by = v_user_id
  WHERE id = v_invite.id;

  DELETE FROM public.households
  WHERE id = v_old_household_id
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE household_id = v_old_household_id
    );

  RETURN json_build_object('success', true);
END;
$$;
