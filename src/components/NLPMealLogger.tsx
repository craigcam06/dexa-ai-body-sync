import { useState } from 'react';
import { MessageSquare, Sparkles, Clock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ParsedFood {
  external_id: string;
  api_source: 'usda' | 'fatsecret';
  name: string;
  brand?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
  sodium_per_100g?: number;
  serving_size_g: number;
  serving_description?: string;
}

export const NLPMealLogger = () => {
  const [input, setInput] = useState('');
  const [parsedFoods, setParsedFoods] = useState<ParsedFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [mealType, setMealType] = useState('breakfast');
  const { toast } = useToast();

  const examplePrompts = [
    "For breakfast I had 2 scrambled eggs, 2 slices of toast with butter, and a cup of coffee",
    "I ate a turkey sandwich with cheese, lettuce and mayo, plus an apple and some chips",
    "Had a chicken Caesar salad with croutons and a bottle of water for lunch",
    "Dinner was grilled salmon, steamed broccoli, and brown rice with a glass of wine"
  ];

  const parseNaturalLanguage = async () => {
    if (!input.trim()) return;

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('food-search', {
        body: { 
          query: input.trim(),
          nlp_mode: true,
          cache: true
        }
      });

      if (error) {
        console.error('NLP parsing error:', error);
        toast({
          title: "Parsing Error",
          description: "Failed to parse your meal description. Try being more specific about the foods.",
          variant: "destructive",
        });
        return;
      }

      setParsedFoods(data.foods || []);
      
      if (data.foods?.length === 0) {
        toast({
          title: "No foods detected",
          description: "NLP requires FatSecret Premier subscription. Try the regular food search instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Meal parsed successfully!",
          description: `Detected ${data.foods.length} food items`,
        });
      }

    } catch (error) {
      console.error('Parse error:', error);
      toast({
        title: "Error",
        description: "Failed to parse meal description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logAllFoods = async () => {
    if (parsedFoods.length === 0) return;

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        toast({
          title: "Error",
          description: "Please sign in to log meals",
          variant: "destructive",
        });
        return;
      }

      const logEntries = parsedFoods.map(food => ({
        user_id: user.data.user.id,
        food_item_id: food.external_id ? food.external_id : null,
        custom_food_name: food.name,
        date: new Date().toISOString().split('T')[0],
        meal_type: mealType,
        serving_amount: 1,
        serving_unit: food.serving_description || 'serving',
        calories: Math.round(food.calories_per_100g * (food.serving_size_g / 100)),
        protein: Math.round(food.protein_per_100g * (food.serving_size_g / 100)),
        carbs: Math.round(food.carbs_per_100g * (food.serving_size_g / 100)),
        fats: Math.round(food.fats_per_100g * (food.serving_size_g / 100))
      }));

      const { error } = await supabase
        .from('user_food_logs')
        .insert(logEntries);

      if (error) throw error;

      const totalCalories = logEntries.reduce((sum, entry) => sum + entry.calories, 0);

      toast({
        title: "Meal logged successfully!",
        description: `Added ${parsedFoods.length} foods (${totalCalories} calories) to ${mealType}`,
      });

      // Reset form
      setInput('');
      setParsedFoods([]);

    } catch (error) {
      console.error('Error logging meal:', error);
      toast({
        title: "Error",
        description: "Failed to log meal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTotalNutrition = () => {
    return parsedFoods.reduce((total, food) => {
      const multiplier = food.serving_size_g / 100;
      return {
        calories: total.calories + (food.calories_per_100g * multiplier),
        protein: total.protein + (food.protein_per_100g * multiplier),
        carbs: total.carbs + (food.carbs_per_100g * multiplier),
        fats: total.fats + (food.fats_per_100g * multiplier)
      };
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  };

  const nutrition = getTotalNutrition();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Smart Meal Logger
          <Badge variant="secondary" className="ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </CardTitle>
        <CardDescription>
          Describe your meal in natural language and let AI parse the foods and nutrition
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Describe what you ate... (e.g., 'For lunch I had a turkey sandwich, an apple, and a bag of chips')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[100px]"
          />
          
          <div className="flex gap-2">
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={parseNaturalLanguage} 
              disabled={loading || !input.trim()}
              className="flex-1"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {loading ? 'Parsing...' : 'Parse Meal'}
            </Button>
          </div>
        </div>

        {/* Example prompts */}
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Try these examples:
          </div>
          <div className="flex flex-wrap gap-1">
            {examplePrompts.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setInput(example)}
                className="h-auto text-xs py-1 px-2 whitespace-normal text-left"
              >
                {example}
              </Button>
            ))}
          </div>
        </div>

        {/* Parsed results */}
        {parsedFoods.length > 0 && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/50">
              <h3 className="font-semibold mb-3">Detected Foods ({parsedFoods.length})</h3>
              <div className="space-y-2">
                {parsedFoods.map((food, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-background rounded border">
                    <div>
                      <div className="font-medium">{food.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {food.serving_description || `${food.serving_size_g}g serving`}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">
                        {Math.round(food.calories_per_100g * (food.serving_size_g / 100))} cal
                      </div>
                      <div className="text-muted-foreground">
                        {Math.round(food.protein_per_100g * (food.serving_size_g / 100))}p • 
                        {Math.round(food.carbs_per_100g * (food.serving_size_g / 100))}c • 
                        {Math.round(food.fats_per_100g * (food.serving_size_g / 100))}f
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition totals */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{Math.round(nutrition.calories)}</div>
                <div className="text-sm text-muted-foreground">Calories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{Math.round(nutrition.protein)}g</div>
                <div className="text-sm text-muted-foreground">Protein</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{Math.round(nutrition.carbs)}g</div>
                <div className="text-sm text-muted-foreground">Carbs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{Math.round(nutrition.fats)}g</div>
                <div className="text-sm text-muted-foreground">Fats</div>
              </div>
            </div>

            <Button onClick={logAllFoods} className="w-full" size="lg">
              <Save className="h-4 w-4 mr-2" />
              Log All Foods to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};