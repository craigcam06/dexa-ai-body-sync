-- Create table for Apple Health data
CREATE TABLE public.apple_health_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data_type TEXT NOT NULL, -- e.g., 'steps', 'heart_rate', 'sleep', 'workouts'
  value NUMERIC,
  unit TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  source_name TEXT,
  source_bundle_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.apple_health_data ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own Apple Health data" 
ON public.apple_health_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Apple Health data" 
ON public.apple_health_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Apple Health data" 
ON public.apple_health_data 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Apple Health data" 
ON public.apple_health_data 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_apple_health_user_id ON public.apple_health_data(user_id);
CREATE INDEX idx_apple_health_data_type ON public.apple_health_data(data_type);
CREATE INDEX idx_apple_health_start_date ON public.apple_health_data(start_date);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_apple_health_data_updated_at
  BEFORE UPDATE ON public.apple_health_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();