import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Apple,
  Dumbbell,
  Zap,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface NutritionTarget {
  target: number;
  min?: number;
  max?: number;
  current: number;
  unit: string;
}

interface DayTargets {
  calories: NutritionTarget;
  protein: NutritionTarget;
  carbs: NutritionTarget;
  fats: NutritionTarget;
  isFastedDay: boolean;
  workoutDay: string;
  workoutCompleted: boolean;
}

interface WeeklyData {
  workoutsCompleted: number;
  avgRecovery: number;
  avgSleep: number;
  weightChange: number;
}

export const UnifiedDailyTracker: React.FC = () => {
  const [todayData, setTodayData] = useState<DayTargets>({
    calories: { target: 2400, current: 0, unit: 'kcal' },
    protein: { target: 240, min: 230, max: 250, current: 0, unit: 'g' },
    carbs: { target: 165, min: 150, max: 180, current: 0, unit: 'g' },
    fats: { target: 65, min: 60, max: 70, current: 0, unit: 'g' },
    isFastedDay: false,
    workoutDay: 'A',
    workoutCompleted: false
  });

  const [weeklyData, setWeeklyData] = useState<WeeklyData>({
    workoutsCompleted: 3,
    avgRecovery: 68,
    avgSleep: 7.2,
    weightChange: -1.2
  });

  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadDayData();
  }, [selectedDate]);

  const loadDayData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Load food logs for the day
      const { data: foodLogs, error } = await supabase
        .from('user_food_logs')
        .select('calories, protein, carbs, fats')
        .eq('user_id', user.id)
        .eq('date', dateStr);

      if (error) throw error;

      // Calculate totals
      const totals = foodLogs?.reduce((acc, log) => ({
        calories: acc.calories + log.calories,
        protein: acc.protein + log.protein,
        carbs: acc.carbs + log.carbs,
        fats: acc.fats + log.fats,
      }), { calories: 0, protein: 0, carbs: 0, fats: 0 }) || { calories: 0, protein: 0, carbs: 0, fats: 0 };

      // Check if it's a fasted day (Wed/Sat)
      const dayOfWeek = selectedDate.getDay();
      const isFastedDay = dayOfWeek === 3 || dayOfWeek === 6;

      setTodayData(prev => ({
        ...prev,
        calories: { ...prev.calories, current: totals.calories },
        protein: { ...prev.protein, current: totals.protein },
        carbs: { 
          ...prev.carbs, 
          current: totals.carbs,
          target: isFastedDay ? 135 : 165,
          min: isFastedDay ? 120 : 150,
          max: isFastedDay ? 150 : 180
        },
        fats: { ...prev.fats, current: totals.fats },
        isFastedDay
      }));

    } catch (error) {
      console.error('Error loading day data:', error);
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressVariant = (current: number, min?: number, max?: number, target?: number) => {
    const compareValue = target || max || min || 0;
    const percentage = (current / compareValue) * 100;
    
    if (min && max) {
      // For ranges (like protein 230-250g), green if in range
      if (current >= min && current <= max) return "success";
      if (current >= min * 0.8 && current <= max * 1.2) return "warning";
      return "danger";
    }
    
    // For single targets (like calories), use percentage
    if (percentage >= 80) return "success";
    if (percentage >= 50) return "warning";
    return "danger";
  };

  const getStatusColor = (current: number, min?: number, max?: number, target?: number) => {
    const compareValue = target || max || min || 0;
    const percentage = (current / compareValue) * 100;
    
    if (min && max) {
      if (current >= min && current <= max) return "text-green-600";
      if (current >= min * 0.8 && current <= max * 1.2) return "text-yellow-600";
      return "text-red-600";
    }
    
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const NutritionRow: React.FC<{ 
    label: string; 
    data: NutritionTarget; 
    icon?: React.ReactNode;
  }> = ({ label, data, icon }) => {
    const targetDisplay = data.min && data.max 
      ? `${data.min}-${data.max}${data.unit}`
      : `${data.target}${data.unit}`;
    
    const statusColor = getStatusColor(data.current, data.min, data.max, data.target);
    const progressValue = getProgressPercentage(data.current, data.target);
    const progressVariant = getProgressVariant(data.current, data.min, data.max, data.target);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{label}</span>
          </div>
          <div className="text-right">
            <div className={`text-sm font-semibold ${statusColor}`}>
              {data.current}{data.unit}
            </div>
            <div className="text-xs text-muted-foreground">
              of {targetDisplay}
            </div>
          </div>
        </div>
        <Progress value={progressValue} variant={progressVariant} className="h-2" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Daily Tracker Card */}
      <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Daily Targets & Progress
            </CardTitle>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {format(selectedDate, 'MMM d, yyyy')}
              </span>
              {todayData.isFastedDay && (
                <Badge variant="outline" className="text-xs">
                  Fasted Day
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nutrition Progress */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Nutrition Progress
            </h4>
            
            <div className="grid gap-4">
              <NutritionRow 
                label="Calories" 
                data={todayData.calories}
                icon={<Zap className="h-4 w-4 text-orange-500" />}
              />
              <NutritionRow 
                label="Protein" 
                data={todayData.protein}
                icon={<Apple className="h-4 w-4 text-blue-500" />}
              />
              <NutritionRow 
                label="Carbs" 
                data={todayData.carbs}
                icon={<div className="h-4 w-4 bg-green-500 rounded-full" />}
              />
              <NutritionRow 
                label="Fats" 
                data={todayData.fats}
                icon={<div className="h-4 w-4 bg-yellow-500 rounded-full" />}
              />
            </div>
          </div>

          {/* Workout Progress */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Training Progress
              </h4>
              <div className="flex items-center gap-2">
                {todayData.workoutCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={`text-sm font-medium ${
                  todayData.workoutCompleted ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                  Workout {todayData.workoutDay}
                </span>
              </div>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Today's Session:</div>
              <div className="text-sm">
                {todayData.workoutDay === 'A' && 'Squat, Leg Press, Leg Ext, Hanging Leg Raise'}
                {todayData.workoutDay === 'B' && 'Barbell Row, Pullups, Face Pull, Curl'}
                {todayData.workoutDay === 'C' && 'Deadlift, Leg Press, Leg Ext, Ab Wheel'}
                {todayData.workoutDay === 'D' && 'Incline Bench, Lat Raise, Skullcrusher, OHP'}
                {todayData.workoutDay === 'E' && 'Pulldown, Row, Upright Row, Hammer Curl'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {weeklyData.workoutsCompleted}/5
              </div>
              <div className="text-sm text-muted-foreground">Workouts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {weeklyData.avgRecovery}%
              </div>
              <div className="text-sm text-muted-foreground">Recovery</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {weeklyData.avgSleep}h
              </div>
              <div className="text-sm text-muted-foreground">Sleep</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {weeklyData.weightChange}lb
              </div>
              <div className="text-sm text-muted-foreground">Change</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};