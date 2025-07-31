import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Star, StarOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FavoriteMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meal_type?: string;
}

export function NutritionLogger() {
  const [isOpen, setIsOpen] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    meal_type: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const { data, error } = await supabase
      .from('favorite_meals')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setFavorites(data);
    }
  };

  const saveFavorite = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from('favorite_meals')
      .insert({
        user_id: userData.user.id,
        name: formData.name,
        calories: parseInt(formData.calories),
        protein: parseInt(formData.protein) || 0,
        carbs: parseInt(formData.carbs) || 0,
        fats: parseInt(formData.fats) || 0,
        meal_type: formData.meal_type || null
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save favorite meal",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Meal saved to favorites"
      });
      loadFavorites();
    }
  };

  const logNutrition = async (mealData = formData) => {
    // For now, we'll just show a success toast since nutrition_logs table will be created next
    toast({
      title: "Success", 
      description: `Logged: ${typeof mealData.name === 'string' ? mealData.name : 'Meal'} - ${typeof mealData.calories === 'string' ? mealData.calories : mealData.calories} calories`
    });
    setFormData({ name: "", calories: "", protein: "", carbs: "", fats: "", meal_type: "" });
    setIsOpen(false);
  };

  const useFavorite = (favorite: FavoriteMeal) => {
    const favoriteAsFormData = {
      name: favorite.name,
      calories: favorite.calories.toString(),
      protein: favorite.protein.toString(),
      carbs: favorite.carbs.toString(),
      fats: favorite.fats.toString(),
      meal_type: favorite.meal_type || ""
    };
    logNutrition(favoriteAsFormData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Nutrition Logging
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Log Meal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log Nutrition</DialogTitle>
              </DialogHeader>
              
              {favorites.length > 0 && (
                <div className="space-y-2">
                  <Label>Quick Add Favorites</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                    {favorites.map((favorite) => (
                      <div
                        key={favorite.id}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                        onClick={() => useFavorite(favorite)}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{favorite.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {favorite.calories} cal • P{favorite.protein} C{favorite.carbs} F{favorite.fats}
                          </p>
                        </div>
                        <Star className="w-4 h-4 text-primary" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Meal Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Chicken breast with rice"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="calories">Calories *</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={formData.calories}
                      onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="meal_type">Meal Type</Label>
                    <Select value={formData.meal_type} onValueChange={(value) => setFormData(prev => ({ ...prev, meal_type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Optional" />
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

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      value={formData.protein}
                      onChange={(e) => setFormData(prev => ({ ...prev, protein: e.target.value }))}
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="carbs">Carbs (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      value={formData.carbs}
                      onChange={(e) => setFormData(prev => ({ ...prev, carbs: e.target.value }))}
                      placeholder="45"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fats">Fats (g)</Label>
                    <Input
                      id="fats"
                      type="number"
                      value={formData.fats}
                      onChange={(e) => setFormData(prev => ({ ...prev, fats: e.target.value }))}
                      placeholder="15"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => logNutrition()}
                    disabled={!formData.calories}
                    className="flex-1"
                  >
                    Log Meal
                  </Button>
                  {formData.name && formData.calories && (
                    <Button 
                      variant="outline"
                      onClick={saveFavorite}
                      className="flex items-center"
                    >
                      <StarOff className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Track your daily nutrition intake. Save frequently eaten meals as favorites for quick logging.
        </p>
      </CardContent>
    </Card>
  );
}