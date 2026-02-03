-- Update monitor_role_changes to handle bootstrap case where auth.uid() is null
CREATE OR REPLACE FUNCTION public.monitor_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    previous_roles text[];
    new_roles text[];
    risk_score integer := 0;
    requires_review boolean := false;
BEGIN
    -- Get previous roles
    SELECT array_agg(r.tag::text)
    INTO previous_roles
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = COALESCE(OLD.user_id, NEW.user_id)
    AND ur.status = 'active'
    AND (TG_OP = 'UPDATE' OR TG_OP = 'DELETE');
    
    -- Get new roles
    SELECT array_agg(r.tag::text)
    INTO new_roles
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND ur.status = 'active'
    AND (TG_OP = 'INSERT' OR TG_OP = 'UPDATE');
    
    -- Calculate risk score
    IF 'admin_sysops' = ANY(new_roles) OR 'admin_security' = ANY(new_roles) THEN
        risk_score := risk_score + 50;
        requires_review := true;
    END IF;
    
    -- Insert monitoring record
    -- Use target user as changed_by during bootstrap when auth.uid() is null
    INSERT INTO public.role_change_monitoring (
      user_id,
      previous_roles,
      new_roles,
      changed_by,
      risk_score,
      requires_review
    ) VALUES (
      COALESCE(NEW.user_id, OLD.user_id),
      previous_roles,
      new_roles,
      COALESCE(auth.uid(), COALESCE(NEW.user_id, OLD.user_id)),
      risk_score,
      requires_review
    );
    
    RETURN NEW;
END;
$function$;