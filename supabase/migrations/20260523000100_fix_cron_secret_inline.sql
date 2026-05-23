-- The previous cron job read the secret via current_setting('app.settings.cron_secret'),
-- which requires ALTER DATABASE — a permission Supabase restricts to superuser only.
-- Solution: embed the secret inline in the cron body. The value in the DB is only
-- visible to roles with access to cron.job, and the Edge Function still validates it.

SELECT cron.unschedule('update-transaction-status-daily');

SELECT cron.schedule(
  'update-transaction-status-daily',
  '1 3 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://litddesjceoaqqvorupe.supabase.co/functions/v1/update-transaction-status',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "9995a8a4eab90a336e6b5d54fe850608129563ae69cc88ce01d5d6c71a7220df"}'::jsonb,
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
