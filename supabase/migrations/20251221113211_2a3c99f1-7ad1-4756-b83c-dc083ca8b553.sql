-- Allow household members to view each other's profiles
CREATE POLICY "Household members can view each other's profiles" 
ON public.profiles 
FOR SELECT 
USING (
  household_id IS NOT NULL 
  AND household_id = user_household_id(auth.uid())
);