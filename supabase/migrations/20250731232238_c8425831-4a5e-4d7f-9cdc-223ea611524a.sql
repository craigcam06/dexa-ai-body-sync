-- Create food_items table for caching searched foods
CREATE TABLE public.food_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL, -- API-specific ID (USDA ndbno, FatSecret food_id)
  api_source TEXT NOT NULL CHECK (api_source IN ('usda', 'fatsecret')), -- Which API this came from
  name TEXT NOT NULL,
  brand TEXT, -- For branded items
  barcode TEXT, -- UPC/EAN for barcode scanning
  calories_per_100g NUMERIC NOT NULL,
  protein_per_100g NUMERIC NOT NULL DEFAULT 0,
  carbs_per_100g NUMERIC NOT NULL DEFAULT 0,
  fats_per_100g NUMERIC NOT NULL DEFAULT 0,
  fiber_per_100g NUMERIC DEFAULT 0,
  sugar_per_100g NUMERIC DEFAULT 0,
  sodium_per_100g NUMERIC DEFAULT 0,
  serving_size_g NUMERIC DEFAULT 100, -- Default serving size in grams
  serving_description TEXT, -- "1 cup", "1 medium apple", etc.
  search_terms TEXT[], -- For better search indexing
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better search performance
CREATE INDEX idx_food_items_name ON public.food_items USING gin(to_tsvector('english', name));
CREATE INDEX idx_food_items_barcode ON public.food_items (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_food_items_external_id ON public.food_items (external_id, api_source);
CREATE INDEX idx_food_items_search_terms ON public.food_items USING gin(search_terms);

-- Enable Row Level Security
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

-- Food items are publicly readable (cached from APIs)
CREATE POLICY "Food items are publicly readable" 
ON public.food_items 
FOR SELECT 
USING (true);

-- Only allow system/admin to insert/update food items (via edge functions)
CREATE POLICY "System can manage food items" 
ON public.food_items 
FOR ALL
USING (false)
WITH CHECK (false);

-- Create user_food_logs table for tracking what users actually eat
CREATE TABLE public.user_food_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  food_item_id UUID REFERENCES public.food_items(id),
  custom_food_name TEXT, -- For manually entered foods
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  serving_amount NUMERIC NOT NULL DEFAULT 1, -- How many servings
  serving_unit TEXT DEFAULT 'serving', -- "servings", "grams", "cups", etc.
  
  -- Nutritional values (calculated or manually entered)
  calories INTEGER NOT NULL,
  protein INTEGER NOT NULL DEFAULT 0,
  carbs INTEGER NOT NULL DEFAULT 0,
  fats INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for user food logs
ALTER TABLE public.user_food_logs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own food logs
CREATE POLICY "Users can view their own food logs" 
ON public.user_food_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own food logs" 
ON public.user_food_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food logs" 
ON public.user_food_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food logs" 
ON public.user_food_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_food_items_updated_at
BEFORE UPDATE ON public.food_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_food_logs_updated_at
BEFORE UPDATE ON public.user_food_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();