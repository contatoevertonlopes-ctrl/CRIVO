-- Add new columns to goal_items for blueprint functionality
ALTER TABLE public.goal_items 
ADD COLUMN IF NOT EXISTS supplier TEXT,
ADD COLUMN IF NOT EXISTS pix_key TEXT,
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';

-- Add template_type to goals for identifying blueprint goals
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS template_type TEXT DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS car_value NUMERIC,
ADD COLUMN IF NOT EXISTS event_date DATE;