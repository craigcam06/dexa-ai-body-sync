import { useState, useEffect } from 'react';
import { Plus, Utensils, Save, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FoodSearch } from './FoodSearch';

interface FoodItem {
  id?: string;
  external_id: string;
  api_source: 'usda' | 'fatsecret';
  name: string;
  brand?: string;
  barcode?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
  sodium_per_100g?: number;
  serving_size_g: number;
  serving_description?: string;
  search_terms?: string[];
}

interface FavoriteMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meal_type?: string;
}

interface MealEntry {
  food?: FoodItem;
  customName?: string;
  servingAmount: number;
  servingUnit: string;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export const EnhancedNutritionLogger = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [activeTab, setActiveTab] = useState('search');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [mealEntry, setMealEntry] = useState<MealEntry>({
    servingAmount: 1,
    servingUnit: 'serving',
    mealType: 'breakfast',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  });
  const [customFood, setCustomFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadFavorites();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedFood) {
      calculateNutrition();
    }
  }, [selectedFood, mealEntry.servingAmount]);

  const loadFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorite_meals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const calculateNutrition = () => {
    if (!selectedFood) return;

    const multiplier = (mealEntry.servingAmount * selectedFood.serving_size_g) / 100;
    
    setMealEntry(prev => ({
      ...prev,
      calories: Math.round(selectedFood.calories_per_100g * multiplier),
      protein: Math.round(selectedFood.protein_per_100g * multiplier),
      carbs: Math.round(selectedFood.carbs_per_100g * multiplier),
      fats: Math.round(selectedFood.fats_per_100g * multiplier)
    }));
  };

  const handleFoodSelect = (food: FoodItem) => {
    setSelectedFood(food);
    setMealEntry(prev => ({
      ...prev,
      food,
      servingAmount: 1,
      servingUnit: food.serving_description || 'serving'
    }));
    setActiveTab('log');
  };

  const handleCustomFood = () => {
    setSelectedFood(null);
    setMealEntry(prev => ({
      ...prev,
      food: undefined,
      customName: '',
      servingAmount: 1,
      servingUnit: 'serving',
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0
    }));
    setCustomFood({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fats: ''
    });
    setActiveTab('custom');
  };

  const logMeal = async () => {
    try {
      const logData = {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        food_item_id: null, // We don't store FatSecret items in food_items table
        custom_food_name: selectedFood 
          ? (selectedFood.brand ? `${selectedFood.brand} ${selectedFood.name}` : selectedFood.name)
          : customFood.name,
        date: new Date().toISOString().split('T')[0],
        meal_type: mealEntry.mealType,
        serving_amount: mealEntry.servingAmount,
        serving_unit: mealEntry.servingUnit,
        calories: selectedFood ? mealEntry.calories : parseInt(customFood.calories) || 0,
        protein: selectedFood ? mealEntry.protein : parseInt(customFood.protein) || 0,
        carbs: selectedFood ? mealEntry.carbs : parseInt(customFood.carbs) || 0,
        fats: selectedFood ? mealEntry.fats : parseInt(customFood.fats) || 0
      };

      const { error } = await supabase
        .from('user_food_logs')
        .insert([logData]);

      if (error) throw error;

      toast({
        title: "Meal Logged!",
        description: `${selectedFood?.name || customFood.name} added to ${mealEntry.mealType}`,
      });

      // Reset form
      setSelectedFood(null);
      setCustomFood({ name: '', calories: '', protein: '', carbs: '', fats: '' });
      setIsOpen(false);
      setActiveTab('search');

    } catch (error) {
      console.error('Error logging meal:', error);
      toast({
        title: "Error",
        description: "Failed to log meal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveFavorite = async () => {
    try {
      const favoriteData = {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        name: selectedFood?.name || customFood.name,
        calories: selectedFood ? mealEntry.calories : parseInt(customFood.calories) || 0,
        protein: selectedFood ? mealEntry.protein : parseInt(customFood.protein) || 0,
        carbs: selectedFood ? mealEntry.carbs : parseInt(customFood.carbs) || 0,
        fats: selectedFood ? mealEntry.fats : parseInt(customFood.fats) || 0,
        meal_type: mealEntry.mealType
      };

      const { error } = await supabase
        .from('favorite_meals')
        .insert([favoriteData]);

      if (error) throw error;

      toast({
        title: "Favorite Saved!",
        description: "Meal saved to your favorites",
      });

      loadFavorites();
    } catch (error) {
      console.error('Error saving favorite:', error);
      toast({
        title: "Error",
        description: "Failed to save favorite. Please try again.",
        variant: "destructive",
      });
    }
  };

  const useFavorite = async (favorite: FavoriteMeal) => {
    const logData = {
      user_id: (await supabase.auth.getUser()).data.user?.id,
      custom_food_name: favorite.name,
      date: new Date().toISOString().split('T')[0],
      meal_type: favorite.meal_type || 'breakfast',
      serving_amount: 1,
      serving_unit: 'serving',
      calories: favorite.calories,
      protein: favorite.protein,
      carbs: favorite.carbs,
      fats: favorite.fats
    };

    try {
      const { error } = await supabase
        .from('user_food_logs')
        .insert([logData]);

      if (error) throw error;

      toast({
        title: "Meal Logged!",
        description: `${favorite.name} added from favorites`,
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Error logging favorite:', error);
      toast({
        title: "Error",
        description: "Failed to log meal. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Plus className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Log Food</h3>
              <p className="text-sm text-muted-foreground">Search foods or scan barcodes</p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Enhanced Nutrition Logger
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search">Search Foods</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="log">Log Meal</TabsTrigger>
            <TabsTrigger value="custom">Custom Food</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-4">
            <FoodSearch 
              onSelectFood={handleFoodSelect}
              onAddCustom={handleCustomFood}
            />
          </TabsContent>

          <TabsContent value="favorites" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Favorite Meals
                </CardTitle>
                <CardDescription>
                  Quick log your saved favorite meals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {favorites.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No favorite meals yet. Save some from the search or custom tabs!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {favorites.map((favorite) => (
                      <Card key={favorite.id} className="cursor-pointer hover:bg-accent transition-colors">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{favorite.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {favorite.calories}cal • {favorite.protein}p • {favorite.carbs}c • {favorite.fats}f
                              </p>
                            </div>
                            <Button onClick={() => useFavorite(favorite)}>
                              <Clock className="h-4 w-4 mr-1" />
                              Quick Log
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="log" className="mt-4">
            {selectedFood ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedFood.name}</CardTitle>
                  {selectedFood.brand && (
                    <CardDescription>{selectedFood.brand}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="serving-amount">Serving Amount</Label>
                      <Input
                        id="serving-amount"
                        type="number"
                        step="0.1"
                        value={mealEntry.servingAmount}
                        onChange={(e) => setMealEntry(prev => ({ ...prev, servingAmount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="meal-type">Meal Type</Label>
                      <Select value={mealEntry.mealType} onValueChange={(value) => setMealEntry(prev => ({ ...prev, mealType: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breakfast">Breakfast</SelectItem>
                          <SelectItem value="lunch">Lunch</SelectItem>
                          <SelectItem value="dinner">Dinner</SelectItem>
                          <SelectItem value="snack">Snack</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{mealEntry.calories}</div>
                      <div className="text-sm text-muted-foreground">Calories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{mealEntry.protein}g</div>
                      <div className="text-sm text-muted-foreground">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{mealEntry.carbs}g</div>
                      <div className="text-sm text-muted-foreground">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{mealEntry.fats}g</div>
                      <div className="text-sm text-muted-foreground">Fats</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={logMeal} className="flex-1">
                      Log Meal
                    </Button>
                    <Button variant="outline" onClick={saveFavorite}>
                      <Save className="h-4 w-4 mr-1" />
                      Save Favorite
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Please select a food from the search tab first</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Custom Food</CardTitle>
                <CardDescription>
                  Manually enter nutritional information for foods not in our database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="custom-name">Food Name</Label>
                  <Input
                    id="custom-name"
                    value={customFood.name}
                    onChange={(e) => setCustomFood(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter food name..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="custom-calories">Calories</Label>
                    <Input
                      id="custom-calories"
                      type="number"
                      value={customFood.calories}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, calories: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="meal-type-custom">Meal Type</Label>
                    <Select value={mealEntry.mealType} onValueChange={(value) => setMealEntry(prev => ({ ...prev, mealType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snack">Snack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="custom-protein">Protein (g)</Label>
                    <Input
                      id="custom-protein"
                      type="number"
                      value={customFood.protein}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, protein: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom-carbs">Carbs (g)</Label>
                    <Input
                      id="custom-carbs"
                      type="number"
                      value={customFood.carbs}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, carbs: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom-fats">Fats (g)</Label>
                    <Input
                      id="custom-fats"
                      type="number"
                      value={customFood.fats}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, fats: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={logMeal} 
                    className="flex-1"
                    disabled={!customFood.name || !customFood.calories}
                  >
                    Log Custom Food
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={saveFavorite}
                    disabled={!customFood.name || !customFood.calories}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save as Favorite
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};