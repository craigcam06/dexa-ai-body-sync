import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Target, TrendingDown, Clock, Apple } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlanSetupProps {
  onPlanCreated: () => void;
}

export function PlanSetup({ onPlanCreated }: PlanSetupProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createCraigCampbellPlan = async () => {
    setIsCreating(true);
    try {
      // Craig Campbell Aggressive Cut Plan structure
      const craigPlanData = {
        plan_name: "Craig Campbell Aggressive Cut",
        plan_type: "cut",
        start_date: new Date().toISOString().split('T')[0],
        goals: {
          weight_loss_per_week: 1.75, // 1.5-2.0 lbs
          preserve_muscle: true,
          prioritize_metabolic_flexibility: true,
          target_body_fat: "sub-12%"
        },
        macros: {
          protein_grams: 240, // 230-250g
          carbs_grams: 165, // 150-180g (lower on fasted days)
          calories_target: 2300, // 2,300-2,400 (cut to 2,200 if plateau)
          carb_cycling: true,
          fasted_training_carbs: 30 // lower carbs on fasted training days
        },
        schedule: {
          fasted_training: {
            days: ["Wednesday", "Saturday"],
            time: "7:00 AM"
          },
          whoop_scan: "11:00 AM",
          breakfast_time: "7:30-11:00 AM",
          meal_cutoff: "19:30", // 7:30 PM
          final_meal_cutoff: "19:30"
        },
        workout_structure: {
          "Day A": {
            name: "Squat Focus",
            exercises: ["Squat", "Leg Press", "Leg Ext", "Hanging Leg Raise"]
          },
          "Day B": {
            name: "Upper Pull",
            exercises: ["Row", "Pullups", "Superset: Face Pull → Curl"]
          },
          "Day C": {
            name: "Deadlift Focus", 
            exercises: ["Deadlift", "Leg Press", "Leg Ext", "Ab Wheel"]
          },
          "Day D": {
            name: "Upper Push",
            exercises: ["Incline Bench", "Superset: Lat Raise → Rear Delt", "Superset: Skullcrusher → DB Curl", "OHP"]
          },
          "Day E": {
            name: "Full Body Power",
            exercises: ["Pulldown", "Row", "Upright Row → Face Pull", "Hammer → Rope Curl", "Chinups"]
          },
          rest_days: ["Sunday"], // Plus other days as needed
          stronglifts_frequency: "5x/week"
        },
        tracking_metrics: {
          daily: ["weight", "whoop_recovery", "sleep_hours", "lumen_scan", "meal_timing"],
          weekly: ["body_measurements", "strength_progression", "weight_trend"],
          monthly: ["body_fat_percentage", "metabolic_flexibility"],
          dexa_scan: "Week 6"
        }
      };

      const { data, error } = await supabase
        .from('fitness_plans')
        .insert({
          ...craigPlanData,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Plan Created Successfully! 🎯",
        description: "Craig Campbell Aggressive Cut plan is now active. Your AI Coach is ready with personalized recommendations.",
      });

      onPlanCreated();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: "Error",
        description: "Failed to create plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Setup Your Fitness Plan
        </CardTitle>
        <CardDescription>
          Get your Craig Campbell Aggressive Cut plan integrated with AI coaching
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Preview */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-sm">📋 Craig Campbell Aggressive Cut Plan</h3>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="font-medium">Goals</span>
              </div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 1.5-2.0 lbs/week loss</li>
                <li>• Preserve muscle mass</li>
                <li>• Metabolic flexibility</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Apple className="h-3 w-3 text-green-500" />
                <span className="font-medium">Macros</span>
              </div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 230-250g protein</li>
                <li>• 150-180g carbs</li>
                <li>• 2,300-2,400 kcal</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-500" />
                <span className="font-medium">Schedule</span>
              </div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Fasted AM (Wed/Sat)</li>
                <li>• 7:30 PM cutoff</li>
                <li>• 11:00 AM WHOOP scan</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-purple-500" />
                <span className="font-medium">Training</span>
              </div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 5 StrongLifts days</li>
                <li>• A/B/C/D/E rotation</li>
                <li>• Progressive overload</li>
              </ul>
            </div>
          </div>
        </div>

        {/* AI Integration Benefits */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">🤖 AI Coach Integration</h4>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="bg-muted/20 rounded p-2">
              <span className="font-medium">Daily Guidance:</span> "Your WHOOP recovery is 65% - modify today's squat day or proceed as planned?"
            </div>
            <div className="bg-muted/20 rounded p-2">
              <span className="font-medium">Macro Tracking:</span> "You're 40g short on protein today - here are quick high-protein options"
            </div>
            <div className="bg-muted/20 rounded p-2">
              <span className="font-medium">Sleep Optimization:</span> "Your 6.2h sleep may impact recovery - adjust tonight's routine?"
            </div>
            <div className="bg-muted/20 rounded p-2">
              <span className="font-medium">Training Adjustments:</span> "HRV trending down - consider deload or extra rest day"
            </div>
          </div>
        </div>

        <Button 
          onClick={createCraigCampbellPlan}
          disabled={isCreating}
          className="w-full"
          size="lg"
        >
          {isCreating ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Setting up plan...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Setup Craig Campbell Plan + AI Coach
            </div>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Plan will integrate with your WHOOP data for personalized daily recommendations
        </p>
      </CardContent>
    </Card>
  );
}