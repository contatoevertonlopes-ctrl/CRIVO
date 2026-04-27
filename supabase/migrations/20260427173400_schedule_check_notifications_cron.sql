-- Schedule check-notifications edge function to run daily at 08:00 BRT (11:00 UTC).
-- This function was never scheduled — it existed but was never automatically triggered.

DO $$
BEGIN
  IF current_setting('app.settings.cron_secret', true) IS NULL
    OR current_setting('app.settings.cron_secret', true) = ''
  THEN
    RAISE EXCEPTION
      'app.settings.cron_secret não está configurado. '
      'Execute: ALTER DATABASE postgres SET "app.settings.cron_secret" = ''<valor>''; '
      'O valor deve ser idêntico ao secret CRON_SECRET das Edge Functions.';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-notifications-daily') THEN
    PERFORM cron.unschedule('check-notifications-daily');
  END IF;
END $$;

-- Diariamente às 08:00 BRT (11:00 UTC)
SELECT cron.schedule(
  'check-notifications-daily',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url:='https://litddesjceoaqqvorupe.supabase.co/functions/v1/check-notifications',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.settings.cron_secret', true)
    ),
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
