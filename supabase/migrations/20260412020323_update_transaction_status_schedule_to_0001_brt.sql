-- Remove the existing cron job
SELECT cron.unschedule('update-transaction-status-daily');

-- Schedule the update-transaction-status function to run daily at 00:01 AM BRT (03:01 UTC)
SELECT cron.schedule(
  'update-transaction-status-daily',
  '1 3 * * *',
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