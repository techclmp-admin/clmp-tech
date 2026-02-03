-- Drop the old unique constraint
ALTER TABLE public.rejoin_requests 
DROP CONSTRAINT IF EXISTS rejoin_requests_project_id_user_id_status_key;

-- Add a partial unique constraint for only pending requests
-- This allows users to have multiple approved/rejected requests but only one pending request per project
CREATE UNIQUE INDEX rejoin_requests_project_user_pending_idx 
ON public.rejoin_requests(project_id, user_id) 
WHERE status = 'pending';