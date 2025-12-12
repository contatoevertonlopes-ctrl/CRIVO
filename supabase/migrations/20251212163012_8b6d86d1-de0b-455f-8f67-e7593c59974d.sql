-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage on cron schema to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule the update-transaction-status function to run daily at 6:00 AM BRT (9:00 UTC)
SELECT cron.schedule(
  'update-transaction-status-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url:='https://litddesjceoaqqvorupe.supabase.co/functions/v1/update-transaction-status',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.settings.cron_secret', true)
    ),
    body:='{}'::jsonb
  ) AS request_id;
  $$
);