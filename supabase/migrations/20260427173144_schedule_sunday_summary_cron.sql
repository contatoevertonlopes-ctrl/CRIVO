-- Schedule send-sunday-summary edge function every Sunday at 08:00 BRT (11:00 UTC).
-- PRÉ-REQUISITO: app.settings.cron_secret deve estar configurado no banco com o mesmo
-- valor do secret CRON_SECRET das Edge Functions.

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

-- Remove job anterior se existir (idempotente)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-sunday-summary-weekly') THEN
    PERFORM cron.unschedule('send-sunday-summary-weekly');
  END IF;
END $$;

-- Toda domingo às 08:00 BRT (11:00 UTC)
SELECT cron.schedule(
  'send-sunday-summary-weekly',
  '0 11 * * 0',
  $$
  SELECT net.http_post(
    url:='https://litddesjceoaqqvorupe.supabase.co/functions/v1/send-sunday-summary',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.settings.cron_secret', true)
    ),
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
