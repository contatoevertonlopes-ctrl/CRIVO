-- Move phone numbers out of public.profiles to avoid leaking to household members via row-level SELECT policies.

-- 1) Create private table
CREATE TABLE IF NOT EXISTS public.profiles_private (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles_private ENABLE ROW LEVEL SECURITY;

-- Only the owner can read/write their private profile.
DROP POLICY IF EXISTS "Users can view their own private profile" ON public.profiles_private;
CREATE POLICY "Users can view their own private profile"
ON public.profiles_private
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own private profile" ON public.profiles_private;
CREATE POLICY "Users can insert their own private profile"
ON public.profiles_private
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own private profile" ON public.profiles_private;
CREATE POLICY "Users can update their own private profile"
ON public.profiles_private
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own private profile" ON public.profiles_private;
CREATE POLICY "Users can delete their own private profile"
ON public.profiles_private
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Keep updated_at consistent if the trigger function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'update_updated_at_column'
  ) THEN
    DROP TRIGGER IF EXISTS update_profiles_private_updated_at ON public.profiles_private;
    CREATE TRIGGER update_profiles_private_updated_at
    BEFORE UPDATE ON public.profiles_private
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END;
$$;

-- 2) Backfill existing phones from public.profiles
INSERT INTO public.profiles_private (user_id, phone)
SELECT user_id, phone
FROM public.profiles
WHERE phone IS NOT NULL AND phone <> ''
ON CONFLICT (user_id)
DO UPDATE SET
  phone = EXCLUDED.phone,
  updated_at = now();

-- 3) Index for WhatsApp lookups
CREATE INDEX IF NOT EXISTS idx_profiles_private_phone ON public.profiles_private(phone);

-- 4) Update signup trigger to write phone into profiles_private (if provided)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_household_id uuid;
BEGIN
  -- Create household for new user
  INSERT INTO public.households (name, created_by)
  VALUES ('Minha Casa', new.id)
  RETURNING id INTO new_household_id;

  -- Create profile with household
  INSERT INTO public.profiles (user_id, full_name, household_id)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', new_household_id);

  -- Create private profile (phone is optional)
  INSERT INTO public.profiles_private (user_id, phone)
  VALUES (new.id, new.raw_user_meta_data ->> 'phone')
  ON CONFLICT (user_id) DO NOTHING;

  -- Create subscription
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (new.id, 'free', 'active');

  -- Update existing transactions to belong to this household
  UPDATE public.transactions
  SET household_id = new_household_id
  WHERE user_id = new.id AND household_id IS NULL;

  RETURN new;
END;
$function$;

-- 5) Remove phone from public.profiles (prevents exposure through household policies)
DROP INDEX IF EXISTS public.idx_profiles_phone;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;
