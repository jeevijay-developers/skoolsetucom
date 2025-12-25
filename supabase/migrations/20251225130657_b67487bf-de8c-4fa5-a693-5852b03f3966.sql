-- Allow authenticated users to create schools during registration
CREATE POLICY "Users can create schools during registration" 
ON public.schools 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Allow users to create their own role during registration
CREATE POLICY "Users can create their own role during registration"
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow school owners to create initial subscription
CREATE POLICY "School owners can create initial subscription"
ON public.subscriptions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.schools 
    WHERE schools.id = school_id 
    AND schools.created_by = auth.uid()
  )
);