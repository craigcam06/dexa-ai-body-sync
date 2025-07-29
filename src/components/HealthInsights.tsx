import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Download, TrendingUp, AlertTriangle, CheckCircle, Sparkles, Heart, Moon, Dumbbell, Activity, Calendar, Network } from 'lucide-react';
import { ParsedWhoopData } from '@/types/whoopData';
import { useToast } from '@/hooks/use-toast';
import { 
  analyzeHealthCorrelations, 
  CorrelationInsight, 
  CorrelationRecommendation 
} from '@/utils/correlationAnalysis';

interface HealthInsightsProps {
  whoopData?: ParsedWhoopData;
}

interface Insight {
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  metric?: string;
  value?: number;
}

interface Recommendation {
  category: 'recovery' | 'sleep' | 'training' | 'nutrition';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function HealthInsights({ whoopData }: HealthInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [correlationInsights, setCorrelationInsights] = useState<CorrelationInsight[]>([]);
  const [correlationRecommendations, setCorrelationRecommendations] = useState<CorrelationRecommendation[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (whoopData) {
      generateInsights();
      generateRecommendations();
      generateCorrelationAnalysis();
    }
  }, [whoopData]);

  const generateCorrelationAnalysis = () => {
    if (!whoopData) return;
    
    console.log('🔍 Correlation Analysis Debug:');
    console.log('- Recovery data:', whoopData.recovery?.length || 0, 'entries');
    console.log('- Sleep data:', whoopData.sleep?.length || 0, 'entries');
    console.log('- Workout data:', whoopData.workouts?.length || 0, 'entries');
    console.log('- Daily data:', whoopData.daily?.length || 0, 'entries');
    console.log('- StrongLifts data:', whoopData.stronglifts?.length || 0, 'entries');
    
    const { insights: corrInsights, recommendations: corrRecs } = analyzeHealthCorrelations(whoopData);
    console.log('📊 Generated correlation insights:', corrInsights.length);
    console.log('📝 Generated correlation recommendations:', corrRecs.length);
    
    setCorrelationInsights(corrInsights);
    setCorrelationRecommendations(corrRecs);
  };

  // Calculate overall health score
  const calculateHealthScore = (): number => {
    if (!whoopData) return 0;
    
    let score = 0;
    let factors = 0;

    // Recovery score (30% weight)
    if (whoopData.recovery?.length > 0) {
      const latestRecovery = whoopData.recovery[whoopData.recovery.length - 1];
      score += (latestRecovery.recovery_score / 100) * 30;
      factors += 30;
    }

    // Sleep efficiency (25% weight)
    if (whoopData.sleep?.length > 0) {
      const latestSleep = whoopData.sleep[whoopData.sleep.length - 1];
      score += (latestSleep.sleep_efficiency_percentage / 100) * 25;
      factors += 25;
    }

    // Training load balance (20% weight)
    if (whoopData.workouts?.length > 0) {
      const weeklyStrain = whoopData.workouts
        .slice(-7)
        .reduce((sum, w) => sum + w.strain_score, 0);
      // Optimal strain is around 50-70 for the week
      const strainScore = weeklyStrain > 70 ? Math.max(0, 100 - (weeklyStrain - 70)) : Math.min(100, weeklyStrain * 1.5);
      score += (strainScore / 100) * 20;
      factors += 20;
    }

    // StrongLifts consistency (15% weight)
    if (whoopData.stronglifts?.length > 0) {
      const recentWorkouts = whoopData.stronglifts.filter(w => {
        const workoutDate = new Date(w.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return workoutDate >= weekAgo;
      });
      const consistencyScore = Math.min(100, (recentWorkouts.length / 3) * 100); // 3 workouts per week is ideal
      score += (consistencyScore / 100) * 15;
      factors += 15;
    }

    // HRV trend (10% weight)
    if (whoopData.recovery?.length > 1) {
      const recent = whoopData.recovery.slice(-7);
      const avgHRV = recent.reduce((sum, r) => sum + r.hrv_rmssd_milli, 0) / recent.length;
      const latestHRV = recent[recent.length - 1].hrv_rmssd_milli;
      const hrvScore = latestHRV >= avgHRV ? 100 : Math.max(0, (latestHRV / avgHRV) * 100);
      score += (hrvScore / 100) * 10;
      factors += 10;
    }

    return factors > 0 ? Math.round(score) : 0;
  };

  const generateInsights = () => {
    if (!whoopData) return;

    const newInsights: Insight[] = [];

    // Recovery insights
    if (whoopData.recovery.length > 0) {
      const latestRecovery = whoopData.recovery[whoopData.recovery.length - 1];
      const avgRecovery = whoopData.recovery.reduce((sum, r) => sum + r.recovery_score, 0) / whoopData.recovery.length;
      
      if (latestRecovery.recovery_score > avgRecovery + 10) {
        newInsights.push({
          type: 'success',
          title: 'Excellent Recovery',
          message: `Your latest recovery score of ${latestRecovery.recovery_score}% is ${Math.round(latestRecovery.recovery_score - avgRecovery)}% above your average. Great job!`,
          metric: 'Recovery',
          value: latestRecovery.recovery_score
        });
      } else if (latestRecovery.recovery_score < avgRecovery - 10) {
        newInsights.push({
          type: 'warning',
          title: 'Recovery Needs Attention',
          message: `Your latest recovery score of ${latestRecovery.recovery_score}% is below your average. Consider prioritizing sleep and stress management.`,
          metric: 'Recovery',
          value: latestRecovery.recovery_score
        });
      }

      // HRV insights
      const avgHRV = whoopData.recovery.reduce((sum, r) => sum + r.hrv_rmssd_milli, 0) / whoopData.recovery.length;
      if (latestRecovery.hrv_rmssd_milli > avgHRV * 1.1) {
        newInsights.push({
          type: 'success',
          title: 'High HRV',
          message: 'Your heart rate variability is above average, indicating good autonomic nervous system balance.',
          metric: 'HRV',
          value: latestRecovery.hrv_rmssd_milli
        });
      }
    }

    // Sleep insights
    if (whoopData.sleep.length > 0) {
      const latestSleep = whoopData.sleep[whoopData.sleep.length - 1];
      
      if (latestSleep.sleep_efficiency_percentage < 80) {
        newInsights.push({
          type: 'warning',
          title: 'Sleep Efficiency Low',
          message: `Your sleep efficiency of ${latestSleep.sleep_efficiency_percentage}% is below optimal. Aim for 85%+ for better recovery.`,
          metric: 'Sleep Efficiency',
          value: latestSleep.sleep_efficiency_percentage
        });
      }

      const totalSleepHours = latestSleep.total_sleep_time_milli / (1000 * 60 * 60);
      if (totalSleepHours < 7) {
        newInsights.push({
          type: 'warning',
          title: 'Insufficient Sleep',
          message: `You only got ${totalSleepHours.toFixed(1)} hours of sleep. Aim for 7-9 hours for optimal performance.`,
          metric: 'Sleep Duration',
          value: totalSleepHours
        });
      }
    }

    // Workout insights
    if (whoopData.workouts.length > 0) {
      const weeklyStrain = whoopData.workouts
        .slice(-7)
        .reduce((sum, w) => sum + w.strain_score, 0);
      
      if (weeklyStrain > 70) {
        newInsights.push({
          type: 'warning',
          title: 'High Training Load',
          message: `Your weekly strain of ${weeklyStrain.toFixed(1)} is quite high. Consider adding more recovery days.`,
          metric: 'Weekly Strain',
          value: weeklyStrain
        });
      }
    }

    setInsights(newInsights);
  };

  const generateRecommendations = () => {
    if (!whoopData) return;

    const newRecommendations: Recommendation[] = [];

    // Recovery-based recommendations
    if (whoopData.recovery?.length > 0) {
      const latestRecovery = whoopData.recovery[whoopData.recovery.length - 1];
      const avgRecovery = whoopData.recovery.reduce((sum, r) => sum + r.recovery_score, 0) / whoopData.recovery.length;
      
      if (latestRecovery.recovery_score < 60) {
        newRecommendations.push({
          category: 'recovery',
          priority: 'high',
          title: 'Focus on Active Recovery',
          description: 'Your recovery is low. Prioritize rest and gentle movement.',
          action: 'Take a rest day or do light yoga/walking',
          icon: Heart
        });
      }

      if (latestRecovery.hrv_rmssd_milli < avgRecovery * 0.9) {
        newRecommendations.push({
          category: 'recovery',
          priority: 'medium',
          title: 'Improve HRV',
          description: 'Your HRV is below average, indicating potential stress.',
          action: 'Practice deep breathing or meditation for 10 minutes',
          icon: Heart
        });
      }
    }

    // Sleep-based recommendations
    if (whoopData.sleep?.length > 0) {
      const latestSleep = whoopData.sleep[whoopData.sleep.length - 1];
      
      if (latestSleep.sleep_efficiency_percentage < 85) {
        newRecommendations.push({
          category: 'sleep',
          priority: 'high',
          title: 'Optimize Sleep Environment',
          description: `Sleep efficiency is ${latestSleep.sleep_efficiency_percentage}%. Aim for 85%+.`,
          action: 'Keep room cool (65-68°F), dark, and limit screens 1hr before bed',
          icon: Moon
        });
      }

      const totalSleepHours = latestSleep.total_sleep_time_milli / (1000 * 60 * 60);
      if (totalSleepHours < 7.5) {
        newRecommendations.push({
          category: 'sleep',
          priority: 'medium',
          title: 'Extend Sleep Duration',
          description: `You got ${totalSleepHours.toFixed(1)} hours. Aim for 7.5-9 hours.`,
          action: 'Go to bed 30 minutes earlier tonight',
          icon: Moon
        });
      }
    }

    // Training-based recommendations
    if (whoopData.workouts?.length > 0) {
      const weeklyStrain = whoopData.workouts.slice(-7).reduce((sum, w) => sum + w.strain_score, 0);
      
      if (weeklyStrain > 70) {
        newRecommendations.push({
          category: 'training',
          priority: 'high',
          title: 'Reduce Training Intensity',
          description: `Weekly strain is ${weeklyStrain.toFixed(1)}. Risk of overtraining.`,
          action: 'Take 1-2 easy days or complete rest',
          icon: Dumbbell
        });
      } else if (weeklyStrain < 30) {
        newRecommendations.push({
          category: 'training',
          priority: 'low',
          title: 'Increase Activity',
          description: 'Your training load is quite low this week.',
          action: 'Add 1-2 moderate intensity workouts',
          icon: Activity
        });
      }
    }

    // StrongLifts consistency
    if (whoopData.stronglifts?.length > 0) {
      const recentWorkouts = whoopData.stronglifts.filter(w => {
        const workoutDate = new Date(w.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return workoutDate >= weekAgo;
      });

      if (recentWorkouts.length < 3) {
        newRecommendations.push({
          category: 'training',
          priority: 'medium',
          title: 'Maintain Strength Training',
          description: `Only ${recentWorkouts.length} strength sessions this week.`,
          action: 'Aim for 3 strength sessions per week for optimal results',
          icon: Dumbbell
        });
      }
    }

    // General nutrition recommendation
    newRecommendations.push({
      category: 'nutrition',
      priority: 'low',
      title: 'Pre/Post Workout Nutrition',
      description: 'Optimize performance and recovery with proper timing.',
      action: 'Eat protein within 30min post-workout, carbs 1-2hr pre-workout',
      icon: Target
    });

    setRecommendations(newRecommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }));
  };

  // Export data function
  const exportHealthData = () => {
    if (!whoopData) {
      toast({
        title: "No Data Available",
        description: "Please upload your health data first to export it.",
        variant: "destructive",
      });
      return;
    }

    const dataToExport = {
      exportDate: new Date().toISOString(),
      healthScore: calculateHealthScore(),
      recovery: whoopData.recovery,
      sleep: whoopData.sleep,
      workouts: whoopData.workouts,
      stronglifts: whoopData.stronglifts,
      insights: insights,
      recommendations: recommendations
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-insights-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: "Your health insights have been downloaded successfully.",
    });
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default: return <TrendingUp className="h-5 w-5 text-blue-500" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'recovery': return Heart;
      case 'sleep': return Moon;
      case 'training': return Dumbbell;
      case 'nutrition': return Target;
      default: return Activity;
    }
  };

  const healthScore = calculateHealthScore();

  return (
    <div className="space-y-6">
      {/* Health Score */}
      {whoopData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Health Score
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportHealthData}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Insights
              </Button>
            </CardTitle>
            <CardDescription>
              Comprehensive score based on recovery, sleep, training, and consistency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary mb-2">{healthScore}</div>
                <div className="text-lg font-medium mb-4">
                  {healthScore >= 80 ? "🌟 Excellent" : 
                   healthScore >= 70 ? "✅ Good" : 
                   healthScore >= 60 ? "⚠️ Fair" : "🔴 Needs Attention"}
                </div>
                <div className="w-40 bg-secondary rounded-full h-3 mb-4">
                  <div 
                    className="bg-primary h-3 rounded-full transition-all duration-500"
                    style={{ width: `${healthScore}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Based on recovery ({Math.round(healthScore * 0.3)}%), sleep ({Math.round(healthScore * 0.25)}%), 
                  training balance ({Math.round(healthScore * 0.2)}%), and consistency ({Math.round(healthScore * 0.25)}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Correlation Insights */}
      {correlationInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Cross-Metric Correlations
            </CardTitle>
            <CardDescription>
              Intelligent analysis of relationships between your health metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {correlationInsights.map((insight, index) => (
                <div key={index} className="p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    <Network className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-blue-900">{insight.title}</h4>
                        <Badge className={`${insight.strength === 'strong' ? 'bg-green-100 text-green-800' : 
                                          insight.strength === 'moderate' ? 'bg-yellow-100 text-yellow-800' : 
                                          'bg-blue-100 text-blue-800'}`}>
                          {insight.strength} {insight.direction}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(insight.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-800">{insight.message}</p>
                      <div className="bg-white/60 border border-blue-300 rounded-md p-2">
                        <p className="text-sm font-medium text-blue-900">
                          🎯 {insight.actionable}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Correlation-Based Recommendations */}
      {correlationRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI-Powered Recommendations
            </CardTitle>
            <CardDescription>
              Data-driven action items based on correlation analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {correlationRecommendations.map((rec, index) => {
                const IconComponent = getCategoryIcon(rec.category);
                return (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                    <div className="flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-purple-600 mt-1" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-purple-900">{rec.title}</h4>
                        <Badge className={`${rec.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                          'bg-blue-100 text-blue-800'}`}>
                          {rec.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(rec.confidence * 100)}% data confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-purple-800">{rec.description}</p>
                      <div className="bg-white/60 border border-purple-300 rounded-md p-2">
                        <p className="text-sm font-medium text-purple-900">
                          💡 {rec.action}
                        </p>
                      </div>
                      <p className="text-xs text-purple-600">
                        Based on: {rec.basedOn.join(', ')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personalized Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription>
              Action items based on your current health data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec, index) => {
                const IconComponent = rec.icon;
                return (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg border hover:shadow-sm transition-shadow">
                    <div className="flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-primary mt-1" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{rec.title}</h4>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                      <div className="bg-primary/5 border border-primary/20 rounded-md p-2">
                        <p className="text-sm font-medium text-primary">💡 {rec.action}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Data Insights
            </CardTitle>
            <CardDescription>
              Key patterns and trends from your biometric data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge className={getInsightBadgeColor(insight.type)}>
                        {insight.metric}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!whoopData && (
        <Card>
          <CardContent className="text-center py-12">
            <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Health Data Available</h3>
            <p className="text-muted-foreground mb-4">
              Upload your Whoop data or connect your devices to see personalized insights and recommendations.
            </p>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Connect Devices
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}