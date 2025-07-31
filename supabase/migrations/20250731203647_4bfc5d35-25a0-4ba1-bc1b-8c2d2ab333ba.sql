-- Create table for storing uploaded WHOOP CSV data
CREATE TABLE public.whoop_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('recovery', 'sleep', 'workout', 'daily', 'journal')),
  date DATE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.whoop_data ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own WHOOP data" 
ON public.whoop_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own WHOOP data" 
ON public.whoop_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WHOOP data" 
ON public.whoop_data 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WHOOP data" 
ON public.whoop_data 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_whoop_data_updated_at
BEFORE UPDATE ON public.whoop_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_whoop_data_user_date ON public.whoop_data(user_id, date DESC);
CREATE INDEX idx_whoop_data_type_date ON public.whoop_data(user_id, data_type, date DESC);