import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, Download, TrendingUp, AlertTriangle, CheckCircle, 
  Heart, Moon, Dumbbell, Activity, Bell, BellOff, X, BarChart3, Network
} from 'lucide-react';
import { ParsedWhoopData } from '@/types/whoopData';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  analyzeHealthCorrelations, 
  CorrelationInsight, 
  CorrelationRecommendation 
} from '@/utils/correlationAnalysis';

interface UnifiedHealthInsightsProps {
  whoopData?: ParsedWhoopData;
}

interface Notification {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  metric: string;
  value: number;
  threshold: number;
  dismissed?: boolean;
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

export function UnifiedHealthInsights({ whoopData }: UnifiedHealthInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [correlationInsights, setCorrelationInsights] = useState<CorrelationInsight[]>([]);
  const [correlationRecommendations, setCorrelationRecommendations] = useState<CorrelationRecommendation[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (whoopData) {
      generateInsights();
      generateRecommendations();
      generateCorrelationAnalysis();
      if (notificationsEnabled) {
        checkHealthMetrics();
      }
    }
  }, [whoopData, notificationsEnabled]);

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
      const consistencyScore = Math.min(100, (recentWorkouts.length / 3) * 100);
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

  const generateCorrelationAnalysis = () => {
    if (!whoopData) return;
    
    const { insights: corrInsights, recommendations: corrRecs } = analyzeHealthCorrelations(whoopData);
    setCorrelationInsights(corrInsights);
    setCorrelationRecommendations(corrRecs);
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

    setInsights(newInsights);
  };

  const generateRecommendations = () => {
    if (!whoopData) return;

    const newRecommendations: Recommendation[] = [];

    // Recovery-based recommendations
    if (whoopData.recovery?.length > 0) {
      const latestRecovery = whoopData.recovery[whoopData.recovery.length - 1];
      
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
      }
    }

    setRecommendations(newRecommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }));
  };

  const checkHealthMetrics = () => {
    if (!whoopData) return;

    const newNotifications: Notification[] = [];

    // Check recovery score
    if (whoopData.recovery?.length > 0) {
      const latestRecovery = whoopData.recovery[whoopData.recovery.length - 1];
      
      if (latestRecovery.recovery_score < 50) {
        newNotifications.push({
          id: `recovery-${Date.now()}`,
          type: latestRecovery.recovery_score < 30 ? 'critical' : 'warning',
          title: 'Low Recovery Alert',
          message: `Your recovery score is ${latestRecovery.recovery_score}%. Consider taking a rest day or reducing training intensity.`,
          timestamp: new Date(),
          metric: 'Recovery Score',
          value: latestRecovery.recovery_score,
          threshold: 50
        });
      }
    }

    // Check sleep efficiency
    if (whoopData.sleep?.length > 0) {
      const latestSleep = whoopData.sleep[whoopData.sleep.length - 1];
      
      if (latestSleep.sleep_efficiency_percentage < 75) {
        newNotifications.push({
          id: `sleep-${Date.now()}`,
          type: latestSleep.sleep_efficiency_percentage < 65 ? 'critical' : 'warning',
          title: 'Poor Sleep Efficiency',
          message: `Your sleep efficiency was only ${latestSleep.sleep_efficiency_percentage}%. Aim for 85%+ for optimal recovery.`,
          timestamp: new Date(),
          metric: 'Sleep Efficiency',
          value: latestSleep.sleep_efficiency_percentage,
          threshold: 75
        });
      }
    }

    // Only add new notifications
    const existingIds = notifications.map(n => n.id);
    const filteredNew = newNotifications.filter(n => !existingIds.includes(n.id));
    
    if (filteredNew.length > 0) {
      setNotifications(prev => [...prev, ...filteredNew]);
      
      filteredNew.forEach(notification => {
        if (notification.type === 'critical') {
          toast({
            title: notification.title,
            description: notification.message,
            variant: "destructive",
          });
        }
      });
    }
  };

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
      insights,
      recommendations,
      correlationInsights,
      correlationRecommendations
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

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, dismissed: true } : n
      )
    );
  };

  const activeNotifications = notifications.filter(n => !n.dismissed);
  const healthScore = calculateHealthScore();

  // Process data for charts
  const recoveryTrendData = whoopData?.recovery
    .slice(-30)
    .map((r, index) => ({
      day: index + 1,
      recovery: r.recovery_score,
      hrv: r.hrv_rmssd_milli,
      date: r.date
    })) || [];

  const sleepTrendData = whoopData?.sleep
    .slice(-14)
    .map((s, index) => ({
      day: index + 1,
      efficiency: s.sleep_efficiency_percentage,
      totalSleep: s.total_sleep_time_milli / (1000 * 60 * 60),
      date: s.date
    })) || [];

  if (!whoopData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Health Insights & Analytics
          </CardTitle>
          <CardDescription>
            Upload your health data to see comprehensive insights, analytics, and smart notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No data available for analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Score & Notifications Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Export
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{healthScore}</div>
              <div className="text-sm text-muted-foreground">Overall Health Score</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Smart Alerts
                {activeNotifications.length > 0 && (
                  <Badge variant="destructive">{activeNotifications.length}</Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              >
                {notificationsEnabled ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeNotifications.length === 0 ? (
              <div className="text-center">
                <Heart className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm text-muted-foreground">All systems good!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeNotifications.slice(0, 2).map((notification) => (
                  <Alert key={notification.id} variant={notification.type === 'critical' ? 'destructive' : 'default'}>
                    <div className="flex items-center justify-between">
                      <div>
                        <AlertTitle className="text-sm">{notification.title}</AlertTitle>
                        <AlertDescription className="text-xs">{notification.message}</AlertDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissNotification(notification.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Card>
        <Tabs defaultValue="insights" className="space-y-4">
          <CardHeader className="pb-3">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="correlations">Correlations</TabsTrigger>
              <TabsTrigger value="recommendations">Actions</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="insights" className="space-y-4">
              {insights.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No specific insights at this time. Keep monitoring your metrics!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.map((insight, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${
                      insight.type === 'success' ? 'bg-green-50 border-green-200' :
                      insight.type === 'warning' ? 'bg-orange-50 border-orange-200' :
                      'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        {insight.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-500 mt-1" /> :
                         insight.type === 'warning' ? <AlertTriangle className="h-5 w-5 text-orange-500 mt-1" /> :
                         <TrendingUp className="h-5 w-5 text-blue-500 mt-1" />}
                        <div>
                          <h4 className="font-medium">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Recovery Chart */}
              <div>
                <h3 className="text-lg font-medium mb-4">Recovery & HRV Trends</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={recoveryTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="recovery" stroke="#8884d8" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="hrv" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Sleep Chart */}
              <div>
                <h3 className="text-lg font-medium mb-4">Sleep Analysis (Last 14 Days)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={sleepTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="efficiency" fill="#8884d8" />
                    <Bar dataKey="totalSleep" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="correlations" className="space-y-4">
              {correlationInsights.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Network className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Not enough data for correlation analysis. Upload more data for insights!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {correlationInsights.slice(0, 3).map((insight, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                      <div className="flex items-start gap-3">
                        <Network className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h4 className="font-medium text-blue-900">{insight.title}</h4>
                            <Badge className={`${insight.strength === 'strong' ? 'bg-green-100 text-green-800' : 
                                              insight.strength === 'moderate' ? 'bg-yellow-100 text-yellow-800' : 
                                              'bg-blue-100 text-blue-800'}`}>
                              {insight.strength} {insight.direction}
                            </Badge>
                          </div>
                          <p className="text-sm text-blue-800">{insight.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {recommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No specific recommendations at this time. Keep up the great work!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start gap-3">
                        <rec.icon className="h-5 w-5 text-primary mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{rec.title}</h4>
                            <Badge className={
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {rec.priority} priority
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                          <p className="text-sm font-medium text-primary">Action: {rec.action}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}