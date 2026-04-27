-- Fix: close-card-bills cron was using a hardcoded anon key for auth.
-- The function enforces x-cron-secret, so every cron invocation was returning 401.
-- Reschedule using the same pattern as update-transaction-status-daily.

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

-- Remove o job com auth errada
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'close-card-bills-daily') THEN
    PERFORM cron.unschedule('close-card-bills-daily');
  END IF;
END $$;

-- Recria com x-cron-secret — diariamente às 03:05 BRT (06:05 UTC)
SELECT cron.schedule(
  'close-card-bills-daily',
  '5 6 * * *',
  $$
  SELECT net.http_post(
    url:='https://litddesjceoaqqvorupe.supabase.co/functions/v1/close-card-bills',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.settings.cron_secret', true)
    ),
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
