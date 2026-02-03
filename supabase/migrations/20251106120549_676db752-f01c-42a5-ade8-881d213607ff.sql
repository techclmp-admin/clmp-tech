-- Add missing bot_score column to bot_detection_logs table
ALTER TABLE public.bot_detection_logs 
ADD COLUMN IF NOT EXISTS bot_score INTEGER DEFAULT 0;