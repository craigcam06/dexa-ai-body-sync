import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Target, TrendingUp, Zap, CheckCircle, Clock } from "lucide-react";

// Your specific targets from the plan
const TARGETS = {
  protein: { min: 230, max: 250 },
  carbs: { min: 150, max: 180, fastedDays: { min: 120, max: 150 } },
  fats: { min: 60, max: 70 },
  calories: { target: 2400, cutTarget: 2200 }, // 2,400 kcal on training days
  weight: { goal: "Lose 1.5-2.0 lbs/week" },
  sleep: { target: 7 }
};

const WORKOUT_SCHEDULE = {
  'A': 'Squat, Leg Press, Leg Ext, Hanging Leg Raise',
  'B': 'Barbell Row, Pullups, Superset: Face Pull, Curl, Superset: Pulldown, Incline Curl', 
  'C': 'Deadlift, Leg Press, Leg Ext, Ab Wheel',
  'D': 'Incline Bench, Superset: Lat Raise, Rear Delt Fly, Superset: Skullcrusher, DB Curl, OHP',
  'E': 'Pulldown, Row, Superset: Upright Row, Face Pull, Superset: Hammer, Rope Curl, Chinups'
};

export function ProgressTracker() {
  const [currentDay, setCurrentDay] = useState(new Date().getDay());
  const [weeklyData, setWeeklyData] = useState({
    workoutsCompleted: 3,
    avgRecovery: 68,
    avgSleep: 7.2,
    weightChange: -1.2
  });

  // Mock today's progress - in real app this would come from nutrition logs
  const todayProgress = {
    calories: 1950, // Current intake vs 2,400 target
    protein: 180,
    carbs: 125,
    fats: 45,
    workoutCompleted: true,
    workoutType: 'A',
    isFastedDay: currentDay === 3 || currentDay === 6 // Wed/Sat
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (current: number, min: number, max: number) => {
    if (current >= min && current <= max) return "bg-green-500";
    if (current >= min * 0.8 && current <= max * 1.2) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="w-5 h-5" />
          <span>Progress Tracking</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Daily</span>
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Weekly</span>
            </TabsTrigger>
          </TabsList>

          {/* Daily Progress */}
          <TabsContent value="daily" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Macros Card */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-blue-800 dark:text-blue-200">
                    Today's Macros
                    {todayProgress.isFastedDay && (
                      <Badge variant="secondary" className="ml-2 text-xs">Fasted Day</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Calories */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Calories</span>
                      <span>{todayProgress.calories}/{TARGETS.calories.target}</span>
                    </div>
                    <Progress 
                      value={getProgressPercentage(todayProgress.calories, TARGETS.calories.target)} 
                      className="h-2"
                    />
                  </div>

                  {/* Protein */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Protein</span>
                      <span>{todayProgress.protein}g ({TARGETS.protein.min}-{TARGETS.protein.max}g)</span>
                    </div>
                    <Progress 
                      value={getProgressPercentage(todayProgress.protein, TARGETS.protein.min)} 
                      className="h-2"
                    />
                  </div>

                  {/* Carbs */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Carbs</span>
                      <span>
                        {todayProgress.carbs}g (
                        {todayProgress.isFastedDay 
                          ? `${TARGETS.carbs.fastedDays.min}-${TARGETS.carbs.fastedDays.max}g`
                          : `${TARGETS.carbs.min}-${TARGETS.carbs.max}g`
                        })
                      </span>
                    </div>
                    <Progress 
                      value={getProgressPercentage(
                        todayProgress.carbs, 
                        todayProgress.isFastedDay ? TARGETS.carbs.fastedDays.min : TARGETS.carbs.min
                      )} 
                      className="h-2"
                    />
                  </div>

                  {/* Fats */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Fats</span>
                      <span>{todayProgress.fats}g ({TARGETS.fats.min}-{TARGETS.fats.max}g)</span>
                    </div>
                    <Progress 
                      value={getProgressPercentage(todayProgress.fats, TARGETS.fats.min)} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Workout & Recovery Card */}
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-green-800 dark:text-green-200">
                    Today's Training
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Workout Day {todayProgress.workoutType}</span>
                    {todayProgress.workoutCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {WORKOUT_SCHEDULE[todayProgress.workoutType as keyof typeof WORKOUT_SCHEDULE]}
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Recovery Target</span>
                      <span>WHOOP Green (60%+)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Sleep Target</span>
                      <span>{TARGETS.sleep.target}+ hours</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Weekly Progress */}
          <TabsContent value="weekly" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {weeklyData.workoutsCompleted}/5
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Workouts
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {weeklyData.avgRecovery}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg Recovery
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {weeklyData.avgSleep}h
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg Sleep
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {weeklyData.weightChange}lb
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Weight Change
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Weekly Targets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Weight Loss Goal:</span>
                  <span className="font-medium">1.5-2.0 lbs/week</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Training Days:</span>
                  <span className="font-medium">5 strength sessions</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Recovery Priority:</span>
                  <span className="font-medium">WHOOP + Lumen optimization</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>DEXA Check:</span>
                  <span className="font-medium">Every 6 weeks</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}