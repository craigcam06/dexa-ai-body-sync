import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingDown, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Apple,
  Clock,
  Dumbbell,
  Brain
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ParsedWhoopData } from '@/types/whoopData';

interface PlanDashboardProps {
  whoopData?: ParsedWhoopData;
}

interface FitnessPlan {
  id: string;
  plan_name: string;
  plan_type: string;
  start_date: string;
  goals: any;
  macros: any;
  schedule: any;
  workout_structure: any;
}

interface TodayProgress {
  weight?: number;
  calories_consumed?: number;
  protein_consumed?: number;
  workout_completed: boolean;
  workout_type?: string;
  fasted_training: boolean;
  adherence_score?: number;
}

export function PlanDashboard({ whoopData }: PlanDashboardProps) {
  const [plan, setPlan] = useState<FitnessPlan | null>(null);
  const [todayProgress, setTodayProgress] = useState<TodayProgress>({
    workout_completed: false,
    fasted_training: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPlanAndProgress();
  }, []);

  const loadPlanAndProgress = async () => {
    setIsLoading(true);
    try {
      // Load active plan
      const { data: planData, error: planError } = await supabase
        .from('fitness_plans')
        .select('*')
        .eq('is_active', true)
        .single();

      if (planError && planError.code !== 'PGRST116') throw planError;
      setPlan(planData);

      if (planData) {
        // Load today's progress
        const today = new Date().toISOString().split('T')[0];
        const { data: progressData, error: progressError } = await supabase
          .from('plan_progress')
          .select('*')
          .eq('plan_id', planData.id)
          .eq('date', today)
          .single();

        if (progressError && progressError.code !== 'PGRST116') throw progressError;
        
        if (progressData) {
          setTodayProgress({
            weight: progressData.weight,
            calories_consumed: progressData.calories_consumed,
            protein_consumed: progressData.protein_consumed,
            workout_completed: progressData.workout_completed,
            workout_type: progressData.workout_type,
            fasted_training: progressData.fasted_training,
            adherence_score: progressData.adherence_score
          });
        }
      }
    } catch (error) {
      console.error('Error loading plan data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTodayProgress = async () => {
    if (!plan) return;
    
    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('plan_progress')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          plan_id: plan.id,
          date: today,
          ...todayProgress
        });

      if (error) throw error;

      toast({
        title: "Progress Saved ✅",
        description: "Today's progress has been updated",
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Error",
        description: "Failed to save progress",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getDayOfWeek = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const getTodayWorkoutType = () => {
    const workoutPattern = ['Day A', 'Day B', 'Day C', 'Day D', 'Day E'];
    const startDate = new Date(plan?.start_date || new Date());
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return workoutPattern[daysSinceStart % 5];
  };

  const getWhoopInsights = () => {
    if (!whoopData?.recovery || whoopData.recovery.length === 0) return null;
    
    const latestRecovery = whoopData.recovery[whoopData.recovery.length - 1];
    const latestSleep = whoopData.sleep?.[whoopData.sleep.length - 1];
    
    return {
      recovery: latestRecovery.recovery_score,
      sleepHours: latestSleep ? (latestSleep.total_sleep_time_milli / (1000 * 60 * 60)).toFixed(1) : null,
      shouldTrainFasted: getDayOfWeek() === 'Wednesday' || getDayOfWeek() === 'Saturday'
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return null; // Plan setup component will show instead
  }

  const whoopInsights = getWhoopInsights();
  const todayWorkout = getTodayWorkoutType();
  const proteinProgress = todayProgress.protein_consumed ? (todayProgress.protein_consumed / plan.macros.protein_grams) * 100 : 0;
  const calorieProgress = todayProgress.calories_consumed ? (todayProgress.calories_consumed / plan.macros.calories_target) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Simplified Plan Header */}
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <span className="font-display">{plan.plan_name}</span>
            </div>
            <Badge variant="secondary" className="text-xs">{plan.plan_type.toUpperCase()}</Badge>
          </CardTitle>
          <CardDescription className="text-sm">
            Day {Math.floor((new Date().getTime() - new Date(plan.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} • Started {new Date(plan.start_date).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Streamlined WHOOP Integration */}
      {whoopInsights && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                <Brain className="h-3 w-3 text-primary" />
              </div>
              <span>Smart Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-muted/20 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    whoopInsights.recovery >= 70 ? 'bg-green-500' : 
                    whoopInsights.recovery >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="font-medium">Recovery {whoopInsights.recovery}%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {whoopInsights.recovery >= 70 ? 'Full intensity ready' : 
                   whoopInsights.recovery >= 50 ? 'Moderate intensity' : 'Active recovery'}
                </p>
              </div>
              
              {whoopInsights.sleepHours && (
                <div className="bg-muted/20 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">Sleep {whoopInsights.sleepHours}h</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {parseFloat(whoopInsights.sleepHours) >= 7 ? 'Optimal recovery' : 'May impact performance'}
                  </p>
                </div>
              )}

              <div className="bg-muted/20 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">Today: {todayWorkout}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {whoopInsights.shouldTrainFasted ? 'Fasted training' : 'Regular window'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nutrition Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Protein Goal</Label>
                <span className="text-sm font-medium">
                  {todayProgress.protein_consumed || 0}g / {plan.macros.protein_grams}g
                </span>
              </div>
              <Progress value={proteinProgress} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Calories</Label>
                <span className="text-sm font-medium">
                  {todayProgress.calories_consumed || 0} / {plan.macros.calories_target}
                </span>
              </div>
              <Progress value={calorieProgress} className="h-2" />
            </div>
          </div>

          {/* Auto-tracked via integrations - no manual inputs needed */}
          <div className="bg-muted/10 rounded-lg p-3 border border-dashed">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Auto-syncing from integrations</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Weight & workouts from Apple Health/Whoop • Nutrition from food logging
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Macro Targets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Apple className="h-4 w-4" />
            Today's Targets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <p className="font-medium">{plan.macros.protein_grams}g</p>
              <p className="text-xs text-muted-foreground">Protein</p>
            </div>
            <div className="text-center">
              <p className="font-medium">{plan.macros.carbs_grams}g</p>
              <p className="text-xs text-muted-foreground">Carbs {whoopInsights?.shouldTrainFasted ? '(30g fasted)' : ''}</p>
            </div>
            <div className="text-center">
              <p className="font-medium">{plan.macros.calories_target}</p>
              <p className="text-xs text-muted-foreground">Calories</p>
            </div>
            <div className="text-center">
              <p className="font-medium">19:30</p>
              <p className="text-xs text-muted-foreground">Final Meal</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}