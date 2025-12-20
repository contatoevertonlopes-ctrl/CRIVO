-- Function to leave household and create new individual one
CREATE OR REPLACE FUNCTION public.leave_household()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_old_household_id uuid;
  v_new_household_id uuid;
  v_member_count int;
BEGIN
  v_user_id := auth.uid();
  
  -- Get current household
  SELECT household_id INTO v_old_household_id
  FROM public.profiles
  WHERE user_id = v_user_id;
  
  IF v_old_household_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Você não está em um espaço compartilhado');
  END IF;
  
  -- Check how many members in household
  SELECT COUNT(*) INTO v_member_count
  FROM public.profiles
  WHERE household_id = v_old_household_id;
  
  IF v_member_count <= 1 THEN
    RETURN json_build_object('success', false, 'error', 'Você é o único membro deste espaço');
  END IF;
  
  -- Create new household for user
  INSERT INTO public.households (name, created_by)
  VALUES ('Minha Casa', v_user_id)
  RETURNING id INTO v_new_household_id;
  
  -- Update user's profile to new household
  UPDATE public.profiles
  SET household_id = v_new_household_id
  WHERE user_id = v_user_id;
  
  -- Move ONLY user's own transactions to new household
  UPDATE public.transactions
  SET household_id = v_new_household_id
  WHERE user_id = v_user_id;
  
  RETURN json_build_object('success', true);
END;
$$;