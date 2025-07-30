-- Create fitness plans table to store structured plans like Craig Campbell's
CREATE TABLE public.fitness_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_name TEXT NOT NULL,
  plan_type TEXT NOT NULL, -- 'cut', 'bulk', 'recomp', etc.
  start_date DATE NOT NULL,
  end_date DATE,
  goals JSONB NOT NULL, -- weight loss target, timeframe, etc.
  macros JSONB NOT NULL, -- protein, carbs, fats, calories
  schedule JSONB NOT NULL, -- daily schedule, meal times, etc.
  workout_structure JSONB NOT NULL, -- workout days A/B/C/D/E
  tracking_metrics JSONB NOT NULL, -- what to track daily/weekly
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plan progress table for daily tracking
CREATE TABLE public.plan_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.fitness_plans(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC,
  calories_consumed INTEGER,
  protein_consumed INTEGER,
  carbs_consumed INTEGER,
  fats_consumed INTEGER,
  workout_completed BOOLEAN DEFAULT false,
  workout_type TEXT, -- 'Day A', 'Day B', etc.
  fasted_training BOOLEAN DEFAULT false,
  meal_cutoff_time TIME,
  notes TEXT,
  adherence_score INTEGER CHECK (adherence_score >= 0 AND adherence_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_id, date)
);

-- Create plan modifications table for AI suggestions
CREATE TABLE public.plan_modifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.fitness_plans(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  modification_type TEXT NOT NULL, -- 'calorie_adjustment', 'training_modification', 'rest_day', etc.
  original_value JSONB,
  suggested_value JSONB,
  reasoning TEXT NOT NULL,
  whoop_data JSONB, -- relevant WHOOP metrics that triggered the suggestion
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fitness_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_modifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for fitness_plans
CREATE POLICY "Users can view their own fitness plans" 
ON public.fitness_plans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fitness plans" 
ON public.fitness_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fitness plans" 
ON public.fitness_plans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fitness plans" 
ON public.fitness_plans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for plan_progress
CREATE POLICY "Users can view their own plan progress" 
ON public.plan_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plan progress" 
ON public.plan_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan progress" 
ON public.plan_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plan progress" 
ON public.plan_progress 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for plan_modifications
CREATE POLICY "Users can view their own plan modifications" 
ON public.plan_modifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plan modifications" 
ON public.plan_modifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan modifications" 
ON public.plan_modifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plan modifications" 
ON public.plan_modifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_fitness_plans_updated_at
  BEFORE UPDATE ON public.fitness_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plan_progress_updated_at
  BEFORE UPDATE ON public.plan_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plan_modifications_updated_at
  BEFORE UPDATE ON public.plan_modifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_fitness_plans_user_id ON public.fitness_plans(user_id);
CREATE INDEX idx_fitness_plans_active ON public.fitness_plans(user_id, is_active);
CREATE INDEX idx_plan_progress_user_date ON public.plan_progress(user_id, date);
CREATE INDEX idx_plan_progress_plan_id ON public.plan_progress(plan_id, date);
CREATE INDEX idx_plan_modifications_user_status ON public.plan_modifications(user_id, status);