import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Plus, 
  CheckCircle, 
  TrendingUp, 
  Calendar,
  Heart,
  Moon,
  Dumbbell,
  Activity,
  X,
  Edit
} from 'lucide-react';
import { ParsedWhoopData } from '@/types/whoopData';
import { useToast } from '@/hooks/use-toast';

interface Goal {
  id: string;
  category: 'recovery' | 'sleep' | 'training' | 'general';
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  timeframe: 'daily' | 'weekly' | 'monthly';
  createdAt: Date;
  achievedAt?: Date;
  isAchieved: boolean;
}

interface GoalSettingProps {
  whoopData?: ParsedWhoopData;
}

const PRESET_GOALS = [
  {
    category: 'sleep' as const,
    title: 'Sleep 8+ Hours',
    description: 'Get at least 8 hours of sleep per night',
    targetValue: 8,
    unit: 'hours',
    timeframe: 'daily' as const
  },
  {
    category: 'recovery' as const,
    title: 'Recovery Above 70%',
    description: 'Maintain recovery score above 70%',
    targetValue: 70,
    unit: '%',
    timeframe: 'daily' as const
  },
  {
    category: 'sleep' as const,
    title: 'Sleep Efficiency 85%+',
    description: 'Achieve 85%+ sleep efficiency',
    targetValue: 85,
    unit: '%',
    timeframe: 'daily' as const
  },
  {
    category: 'training' as const,
    title: '3 Strength Sessions/Week',
    description: 'Complete 3 strength training sessions per week',
    targetValue: 3,
    unit: 'sessions',
    timeframe: 'weekly' as const
  },
  {
    category: 'general' as const,
    title: '10,000 Daily Steps',
    description: 'Walk at least 10,000 steps per day',
    targetValue: 10000,
    unit: 'steps',
    timeframe: 'daily' as const
  },
  {
    category: 'training' as const,
    title: 'Weekly Strain Balance',
    description: 'Keep weekly strain between 50-70',
    targetValue: 70,
    unit: 'strain',
    timeframe: 'weekly' as const
  }
];

export function GoalSetting({ whoopData }: GoalSettingProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [customGoal, setCustomGoal] = useState({
    title: '',
    description: '',
    targetValue: 0,
    unit: '',
    category: 'general' as Goal['category'],
    timeframe: 'daily' as Goal['timeframe']
  });
  const { toast } = useToast();

  // Load goals from localStorage on mount
  useEffect(() => {
    const savedGoals = localStorage.getItem('healthGoals');
    if (savedGoals) {
      try {
        const parsedGoals = JSON.parse(savedGoals).map((goal: any) => ({
          ...goal,
          createdAt: new Date(goal.createdAt),
          achievedAt: goal.achievedAt ? new Date(goal.achievedAt) : undefined
        }));
        setGoals(parsedGoals);
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    }
  }, []);

  // Save goals to localStorage whenever goals change
  useEffect(() => {
    localStorage.setItem('healthGoals', JSON.stringify(goals));
  }, [goals]);

  // Update goal progress when data changes
  useEffect(() => {
    if (whoopData && goals.length > 0) {
      updateGoalProgress();
    }
  }, [whoopData, goals.length]);

  const updateGoalProgress = () => {
    if (!whoopData) return;

    setGoals(prevGoals => 
      prevGoals.map(goal => {
        let currentValue = 0;
        let isAchieved = false;

        switch (goal.category) {
          case 'recovery':
            if (whoopData.recovery?.length > 0) {
              const latestRecovery = whoopData.recovery[whoopData.recovery.length - 1];
              currentValue = latestRecovery.recovery_score;
              isAchieved = currentValue >= goal.targetValue;
            }
            break;

          case 'sleep':
            if (whoopData.sleep?.length > 0) {
              const latestSleep = whoopData.sleep[whoopData.sleep.length - 1];
              if (goal.title.includes('Hours')) {
                currentValue = latestSleep.total_sleep_time_milli / (1000 * 60 * 60);
              } else if (goal.title.includes('Efficiency')) {
                currentValue = latestSleep.sleep_efficiency_percentage;
              }
              isAchieved = currentValue >= goal.targetValue;
            }
            break;

          case 'training':
            if (goal.timeframe === 'weekly') {
              if (goal.title.includes('Strength') && whoopData.stronglifts?.length > 0) {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                const recentWorkouts = whoopData.stronglifts.filter(w => 
                  new Date(w.date) >= weekAgo
                );
                currentValue = recentWorkouts.length;
                isAchieved = currentValue >= goal.targetValue;
              } else if (goal.title.includes('Strain') && whoopData.workouts?.length > 0) {
                const weeklyStrain = whoopData.workouts
                  .slice(-7)
                  .reduce((sum, w) => sum + w.strain_score, 0);
                currentValue = weeklyStrain;
                // For strain balance, we want it to be UNDER the target
                isAchieved = currentValue <= goal.targetValue && currentValue >= 50;
              }
            }
            break;

          case 'general':
            if (goal.title.includes('Steps') && whoopData.daily?.length > 0) {
              const latestDaily = whoopData.daily[whoopData.daily.length - 1];
              currentValue = latestDaily.steps;
              isAchieved = currentValue >= goal.targetValue;
            }
            break;
        }

        // Mark as achieved if it wasn't already and now is
        const achievedAt = !goal.isAchieved && isAchieved ? new Date() : goal.achievedAt;

        return {
          ...goal,
          currentValue,
          isAchieved,
          achievedAt
        };
      })
    );
  };

  const addPresetGoal = (preset: typeof PRESET_GOALS[0]) => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      ...preset,
      currentValue: 0,
      createdAt: new Date(),
      isAchieved: false
    };

    setGoals(prev => [...prev, newGoal]);
    
    toast({
      title: "Goal Added",
      description: `"${preset.title}" has been added to your goals`,
    });
  };

  const addCustomGoal = () => {
    if (!customGoal.title || !customGoal.targetValue) {
      toast({
        title: "Incomplete Goal",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newGoal: Goal = {
      id: Date.now().toString(),
      title: customGoal.title,
      description: customGoal.description,
      targetValue: customGoal.targetValue,
      unit: customGoal.unit,
      category: customGoal.category,
      timeframe: customGoal.timeframe,
      currentValue: 0,
      createdAt: new Date(),
      isAchieved: false
    };

    setGoals(prev => [...prev, newGoal]);
    setShowAddGoal(false);
    setCustomGoal({
      title: '',
      description: '',
      targetValue: 0,
      unit: '',
      category: 'general',
      timeframe: 'daily'
    });

    toast({
      title: "Custom Goal Added",
      description: `"${newGoal.title}" has been added to your goals`,
    });
  };

  const removeGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
    toast({
      title: "Goal Removed",
      description: "Goal has been removed from your list",
    });
  };

  const getCategoryIcon = (category: Goal['category']) => {
    switch (category) {
      case 'recovery': return Heart;
      case 'sleep': return Moon;
      case 'training': return Dumbbell;
      default: return Activity;
    }
  };

  const getCategoryColor = (category: Goal['category']) => {
    switch (category) {
      case 'recovery': return 'text-red-500 bg-red-50 border-red-200';
      case 'sleep': return 'text-purple-500 bg-purple-50 border-purple-200';
      case 'training': return 'text-blue-500 bg-blue-50 border-blue-200';
      default: return 'text-green-500 bg-green-50 border-green-200';
    }
  };

  const getProgressPercentage = (goal: Goal) => {
    if (goal.category === 'training' && goal.title.includes('Strain')) {
      // For strain balance, show progress towards the optimal range (50-70)
      if (goal.currentValue >= 50 && goal.currentValue <= 70) return 100;
      if (goal.currentValue < 50) return (goal.currentValue / 50) * 100;
      return Math.max(0, 100 - ((goal.currentValue - 70) / 30) * 100);
    }
    return Math.min(100, (goal.currentValue / goal.targetValue) * 100);
  };

  // Filter out preset goals that are already added
  const availablePresets = PRESET_GOALS.filter(preset => 
    !goals.some(goal => goal.title === preset.title)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Health Goals
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddGoal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Goal
            </Button>
          </CardTitle>
          <CardDescription>
            Set targets and track your progress towards better health
          </CardDescription>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="mb-4">No goals set yet</p>
              <p className="text-sm">Add some health goals to track your progress</p>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => {
                const IconComponent = getCategoryIcon(goal.category);
                const progressPercentage = getProgressPercentage(goal);
                
                return (
                  <div key={goal.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-full ${getCategoryColor(goal.category)}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{goal.title}</h3>
                            {goal.isAchieved && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {goal.description}
                          </p>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Progress</span>
                              <span className="font-medium">
                                {goal.currentValue.toFixed(goal.unit === 'hours' ? 1 : 0)} / {goal.targetValue} {goal.unit}
                              </span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {goal.timeframe}
                              </Badge>
                              {goal.isAchieved && goal.achievedAt && (
                                <span>Achieved {goal.achievedAt.toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGoal(goal.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Goal Modal/Card */}
      {showAddGoal && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Add New Goal</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddGoal(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preset Goals */}
            {availablePresets.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Quick Add (Recommended)</h4>
                <div className="grid grid-cols-1 gap-2">
                  {availablePresets.map((preset, index) => {
                    const IconComponent = getCategoryIcon(preset.category);
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        onClick={() => addPresetGoal(preset)}
                        className="justify-start h-auto p-3 text-left"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <IconComponent className={`h-4 w-4 ${getCategoryColor(preset.category).split(' ')[0]}`} />
                          <div className="flex-1">
                            <div className="font-medium">{preset.title}</div>
                            <div className="text-sm text-muted-foreground">{preset.description}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {preset.targetValue} {preset.unit}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Goal Form */}
            <div>
              <h4 className="font-medium mb-3">Create Custom Goal</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Goal Title</Label>
                    <Input
                      id="title"
                      value={customGoal.title}
                      onChange={(e) => setCustomGoal(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Daily Meditation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      className="w-full p-2 border border-input rounded-md bg-background"
                      value={customGoal.category}
                      onChange={(e) => setCustomGoal(prev => ({ ...prev, category: e.target.value as Goal['category'] }))}
                    >
                      <option value="general">General</option>
                      <option value="recovery">Recovery</option>
                      <option value="sleep">Sleep</option>
                      <option value="training">Training</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={customGoal.description}
                    onChange={(e) => setCustomGoal(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this goal is about"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="target">Target Value</Label>
                    <Input
                      id="target"
                      type="number"
                      value={customGoal.targetValue || ''}
                      onChange={(e) => setCustomGoal(prev => ({ ...prev, targetValue: Number(e.target.value) }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={customGoal.unit}
                      onChange={(e) => setCustomGoal(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="e.g., minutes, hours, %"
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeframe">Timeframe</Label>
                    <select
                      className="w-full p-2 border border-input rounded-md bg-background"
                      value={customGoal.timeframe}
                      onChange={(e) => setCustomGoal(prev => ({ ...prev, timeframe: e.target.value as Goal['timeframe'] }))}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <Button onClick={addCustomGoal} className="w-full">
                  Add Custom Goal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}