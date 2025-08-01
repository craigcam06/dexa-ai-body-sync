import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Utensils, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

interface FoodLogEntry {
  id: string;
  custom_food_name: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  serving_amount: number;
  serving_unit: string;
  meal_type: string | null;
  created_at: string;
  food_items?: {
    name: string;
    brand: string | null;
  } | null;
}

interface DailyFoodLogProps {
  selectedDate?: Date;
}

export const DailyFoodLog: React.FC<DailyFoodLogProps> = ({ 
  selectedDate = new Date() 
}) => {
  const [foodLogs, setFoodLogs] = useState<FoodLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFoodLogs();
  }, [selectedDate]);

  const loadFoodLogs = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('user_food_logs')
        .select(`
          *,
          food_items (
            name,
            brand
          )
        `)
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFoodLogs(data || []);
    } catch (error) {
      console.error('Error loading food logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedLogs = foodLogs.reduce((acc, log) => {
    const mealType = log.meal_type || 'Other';
    if (!acc[mealType]) acc[mealType] = [];
    acc[mealType].push(log);
    return acc;
  }, {} as Record<string, FoodLogEntry[]>);

  const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack', 'Other'];
  const sortedMealTypes = mealOrder.filter(meal => groupedLogs[meal]);

  const getTotalNutrition = () => {
    return foodLogs.reduce((totals, log) => ({
      calories: totals.calories + log.calories,
      protein: totals.protein + log.protein,
      carbs: totals.carbs + log.carbs,
      fats: totals.fats + log.fats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  };

  const totals = getTotalNutrition();

  const getFoodDisplayName = (log: FoodLogEntry) => {
    if (log.custom_food_name) return log.custom_food_name;
    if (log.food_items?.name) {
      return log.food_items.brand 
        ? `${log.food_items.brand} ${log.food_items.name}`
        : log.food_items.name;
    }
    return 'Unknown Food';
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Daily Food Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            Loading your food logs...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="h-5 w-5" />
          Daily Food Log
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily Totals */}
        <div className="bg-muted/20 rounded-lg p-3">
          <h4 className="font-medium mb-2">Daily Totals</h4>
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div className="text-center">
              <div className="font-semibold text-primary">{totals.calories}</div>
              <div className="text-muted-foreground">Calories</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">{totals.protein}g</div>
              <div className="text-muted-foreground">Protein</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">{totals.carbs}g</div>
              <div className="text-muted-foreground">Carbs</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-yellow-600">{totals.fats}g</div>
              <div className="text-muted-foreground">Fats</div>
            </div>
          </div>
        </div>

        {foodLogs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No food logged for this day
          </div>
        ) : (
          <div className="space-y-4">
            {sortedMealTypes.map((mealType) => (
              <div key={mealType} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getMealIcon(mealType)}</span>
                  <h4 className="font-medium capitalize">{mealType}</h4>
                  <Badge variant="outline" className="text-xs">
                    {groupedLogs[mealType].length} item{groupedLogs[mealType].length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="space-y-2 ml-6">
                  {groupedLogs[mealType].map((log) => (
                    <div key={log.id} className="bg-card border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-sm">
                            {getFoodDisplayName(log)}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(log.created_at), 'h:mm a')}
                            <span className="mx-1">•</span>
                            {log.serving_amount} {log.serving_unit}
                          </div>
                        </div>
                        <div className="text-xs text-right">
                          <div className="font-medium">{log.calories} cal</div>
                          <div className="text-muted-foreground">
                            P:{log.protein}g C:{log.carbs}g F:{log.fats}g
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {mealType !== sortedMealTypes[sortedMealTypes.length - 1] && (
                  <Separator className="my-3" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};