-- Create traffic table (separate from other demos sharing this Supabase project)
CREATE TABLE IF NOT EXISTS public.wp_autopilot_traffic_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  path text NOT NULL,
  ip_address text,
  city text,
  region text,
  country text,
  user_agent text
);

ALTER TABLE public.wp_autopilot_traffic_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service Role Full Access"
ON public.wp_autopilot_traffic_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
