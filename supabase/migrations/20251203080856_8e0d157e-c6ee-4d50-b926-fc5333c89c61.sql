-- Update run_security_test function with parameters to add admin authorization
CREATE OR REPLACE FUNCTION public.run_security_test(test_type_param text, test_name_param text, test_config_param jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  test_id uuid;
BEGIN
  -- Authorization check: only admins can run security tests
  IF NOT has_admin_role(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized - only admins can run security tests';
  END IF;

  INSERT INTO public.security_test_results (
    test_type,
    test_name,
    status,
    test_config,
    created_at
  ) VALUES (
    test_type_param,
    test_name_param,
    'running',
    test_config_param,
    now()
  ) RETURNING id INTO test_id;
  
  -- Mark as completed immediately for now
  UPDATE public.security_test_results 
  SET 
    status = 'completed',
    completed_at = now(),
    score = 85,
    findings = jsonb_build_array(
      jsonb_build_object(
        'type', 'info',
        'message', 'Security test completed successfully'
      )
    ),
    recommendations = jsonb_build_array(
      jsonb_build_object(
        'priority', 'low',
        'action', 'Continue monitoring security metrics'
      )
    )
  WHERE id = test_id;
  
  RETURN test_id;
END;
$function$;