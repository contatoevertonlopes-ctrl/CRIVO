-- Migrate existing users: create households for users that don't have one
DO $$
DECLARE
  profile_record record;
  new_household_id uuid;
BEGIN
  -- For each profile without a household
  FOR profile_record IN 
    SELECT user_id FROM public.profiles WHERE household_id IS NULL
  LOOP
    -- Create a new household
    INSERT INTO public.households (name, created_by)
    VALUES ('Minha Casa', profile_record.user_id)
    RETURNING id INTO new_household_id;
    
    -- Update the profile with the household_id
    UPDATE public.profiles 
    SET household_id = new_household_id 
    WHERE user_id = profile_record.user_id;
    
    -- Update all transactions from this user to belong to the household
    UPDATE public.transactions 
    SET household_id = new_household_id 
    WHERE user_id = profile_record.user_id;
  END LOOP;
END $$;