-- Add unique constraint to apple_health_data table for proper upserts
-- This allows us to handle duplicate data gracefully
ALTER TABLE public.apple_health_data 
ADD CONSTRAINT apple_health_data_unique_key 
UNIQUE (user_id, data_type, start_date);