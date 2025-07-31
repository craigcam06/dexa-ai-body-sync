-- Create favorite meals table for quick nutrition logging
CREATE TABLE public.favorite_meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein INTEGER NOT NULL DEFAULT 0,
  carbs INTEGER NOT NULL DEFAULT 0,
  fats INTEGER NOT NULL DEFAULT 0,
  meal_type TEXT, -- breakfast, lunch, dinner, snack
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.favorite_meals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own favorite meals" 
ON public.favorite_meals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorite meals" 
ON public.favorite_meals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite meals" 
ON public.favorite_meals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite meals" 
ON public.favorite_meals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for timestamps
CREATE TRIGGER update_favorite_meals_updated_at
BEFORE UPDATE ON public.favorite_meals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();