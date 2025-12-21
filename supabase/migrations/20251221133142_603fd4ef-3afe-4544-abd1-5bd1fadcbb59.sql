-- Schedule the close-card-bills function to run daily at 6 AM UTC
SELECT cron.schedule(
  'close-card-bills-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url:='https://litddesjceoaqqvorupe.supabase.co/functions/v1/close-card-bills',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpdGRkZXNqY2VvYXFxdm9ydXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzQ2NzUsImV4cCI6MjA4MDQ1MDY3NX0.uudlueQQ-7AmL-W_2VrBvPdxbVoWr8gH2Ems_ZRqtAU"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);