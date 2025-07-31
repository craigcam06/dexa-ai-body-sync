import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FavoriteMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export function NutritionLogger() {
  const [isOpen, setIsOpen] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: ""
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
        fats: parseInt(formData.fats) || 0
      });

    if (!error) {
      toast({ title: "Meal saved to favorites" });
      loadFavorites();
    }
  };

  const logMeal = (mealData = formData) => {
    toast({
      title: "Meal logged", 
      description: `${typeof mealData.name === 'string' ? mealData.name : 'Meal'}: ${typeof mealData.calories === 'string' ? mealData.calories : mealData.calories} cal`
    });
    setFormData({ name: "", calories: "", protein: "", carbs: "", fats: "" });
    setIsOpen(false);
  };

  const useFavorite = (favorite: FavoriteMeal) => {
    const favoriteAsFormData = {
      name: favorite.name,
      calories: favorite.calories.toString(),
      protein: favorite.protein.toString(),
      carbs: favorite.carbs.toString(),
      fats: favorite.fats.toString()
    };
    logMeal(favoriteAsFormData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Nutrition
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Log Meal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log Meal</DialogTitle>
              </DialogHeader>
              
              {favorites.length > 0 && (
                <div className="space-y-2">
                  <Label>Favorites</Label>
                  <div className="grid gap-2 max-h-32 overflow-y-auto">
                    {favorites.map((favorite) => (
                      <div
                        key={favorite.id}
                        className="flex items-center justify-between p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                        onClick={() => useFavorite(favorite)}
                      >
                        <div>
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

              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Meal Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Chicken & rice"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="calories">Calories</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={formData.calories}
                      onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                      placeholder="500"
                    />
                  </div>
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
                </div>

                <div className="grid grid-cols-2 gap-2">
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
                    onClick={() => logMeal()}
                    disabled={!formData.calories}
                    className="flex-1"
                  >
                    Log
                  </Button>
                  {formData.name && formData.calories && (
                    <Button 
                      variant="outline"
                      onClick={saveFavorite}
                    >
                      <Star className="w-4 h-4" />
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
          Quick meal logging with favorites for your go-to meals.
        </p>
      </CardContent>
    </Card>
  );
}