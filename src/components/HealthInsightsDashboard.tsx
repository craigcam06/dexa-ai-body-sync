import React, { useEffect, useState, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Heart, 
  Moon, 
  X, 
  Bell, 
  BellOff, 
  TrendingUp, 
  TrendingDown,
  Brain,
  Target,
  Zap,
  Activity
} from 'lucide-react';
import { ParsedWhoopData } from '@/types/whoopData';
import { useToast } from '@/hooks/use-toast';
import { analyzeHealthCorrelations } from '@/utils/correlationAnalysis';

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

interface HealthInsightsDashboardProps {
  whoopData?: ParsedWhoopData;
}

export function HealthInsightsDashboard({ whoopData }: HealthInsightsDashboardProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { toast } = useToast();

  // Calculate health score
  const healthScore = useMemo(() => {
    if (!whoopData) return 0;
    
    let score = 0;
    let factors = 0;
    
    // Recovery score (30% weight)
    if (whoopData.recovery?.length > 0) {
      const recentRecovery = whoopData.recovery.slice(-7);
      const avgRecovery = recentRecovery.reduce((sum, r) => sum + r.recovery_score, 0) / recentRecovery.length;
      score += avgRecovery * 0.3;
      factors += 0.3;
    }
    
    // Sleep efficiency (25% weight)
    if (whoopData.sleep?.length > 0) {
      const recentSleep = whoopData.sleep.slice(-7);
      const avgSleepEfficiency = recentSleep.reduce((sum, s) => sum + s.sleep_efficiency_percentage, 0) / recentSleep.length;
      score += avgSleepEfficiency * 0.25;
      factors += 0.25;
    }
    
    // Sleep duration (20% weight)
    if (whoopData.sleep?.length > 0) {
      const recentSleep = whoopData.sleep.slice(-7);
      const avgSleepHours = recentSleep.reduce((sum, s) => sum + (s.total_sleep_time_milli / (1000 * 60 * 60)), 0) / recentSleep.length;
      const sleepScore = Math.min(100, Math.max(0, (avgSleepHours - 5) / 3 * 100)); // 5-8 hours scale
      score += sleepScore * 0.2;
      factors += 0.2;
    }
    
    // Training balance (15% weight)
    if (whoopData.workouts?.length > 0) {
      const weeklyStrain = whoopData.workouts.slice(-7).reduce((sum, w) => sum + w.strain_score, 0);
      const strainScore = weeklyStrain > 80 ? Math.max(0, 100 - (weeklyStrain - 80) * 2) : 100;
      score += strainScore * 0.15;
      factors += 0.15;
    }
    
    // HRV stability (10% weight)
    if (whoopData.recovery?.length > 7) {
      const recent14Days = whoopData.recovery.slice(-14);
      const hrv7DayAvg = recent14Days.slice(-7).reduce((sum, r) => sum + r.hrv_rmssd_milli, 0) / 7;
      const hrv14DayAvg = recent14Days.reduce((sum, r) => sum + r.hrv_rmssd_milli, 0) / 14;
      const hrvStability = Math.max(0, 100 - Math.abs(hrv7DayAvg - hrv14DayAvg) / hrv14DayAvg * 100);
      score += hrvStability * 0.1;
      factors += 0.1;
    }
    
    return factors > 0 ? score / factors : 0;
  }, [whoopData]);

  // Correlation analysis
  const correlationAnalysis = useMemo(() => {
    if (!whoopData) return { insights: [], recommendations: [] };
    console.log('🔍 Running correlation analysis...');
    const analysis = analyzeHealthCorrelations(whoopData);
    console.log('📊 Generated correlation insights:', analysis.insights.length);
    console.log('📝 Generated correlation recommendations:', analysis.recommendations.length);
    return analysis;
  }, [whoopData]);

  useEffect(() => {
    if (whoopData && notificationsEnabled) {
      checkHealthMetrics();
    }
  }, [whoopData, notificationsEnabled]);

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

      // Check HRV trend
      if (whoopData.recovery.length > 7) {
        const recent7Days = whoopData.recovery.slice(-7);
        const avgHRV = recent7Days.reduce((sum, r) => sum + r.hrv_rmssd_milli, 0) / recent7Days.length;
        const latestHRV = latestRecovery.hrv_rmssd_milli;
        
        if (latestHRV < avgHRV * 0.8) {
          newNotifications.push({
            id: `hrv-${Date.now()}`,
            type: 'warning',
            title: 'HRV Below Average',
            message: `Your HRV (${latestHRV.toFixed(1)}ms) is 20% below your 7-day average. This may indicate increased stress or fatigue.`,
            timestamp: new Date(),
            metric: 'HRV',
            value: latestHRV,
            threshold: avgHRV * 0.8
          });
        }
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

      // Check sleep duration
      const sleepHours = latestSleep.total_sleep_time_milli / (1000 * 60 * 60);
      if (sleepHours < 6.5) {
        newNotifications.push({
          id: `sleep-duration-${Date.now()}`,
          type: sleepHours < 5.5 ? 'critical' : 'warning',
          title: 'Insufficient Sleep',
          message: `You only got ${sleepHours.toFixed(1)} hours of sleep. Aim for 7-9 hours for optimal performance and recovery.`,
          timestamp: new Date(),
          metric: 'Sleep Duration',
          value: sleepHours,
          threshold: 6.5
        });
      }
    }

    // Check weekly strain balance
    if (whoopData.workouts?.length > 0) {
      const weeklyStrain = whoopData.workouts
        .slice(-7)
        .reduce((sum, w) => sum + w.strain_score, 0);
      
      if (weeklyStrain > 80) {
        newNotifications.push({
          id: `strain-${Date.now()}`,
          type: weeklyStrain > 100 ? 'critical' : 'warning',
          title: 'High Training Load',
          message: `Your weekly strain is ${weeklyStrain.toFixed(1)}. Risk of overtraining - consider adding recovery days.`,
          timestamp: new Date(),
          metric: 'Weekly Strain',
          value: weeklyStrain,
          threshold: 80
        });
      }
    }

    // Only add notifications that aren't already present
    const existingIds = notifications.map(n => n.id);
    const filteredNew = newNotifications.filter(n => !existingIds.includes(n.id));
    
    if (filteredNew.length > 0) {
      setNotifications(prev => [...prev, ...filteredNew]);
      
      // Show toast for critical notifications
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

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, dismissed: true } : n
      )
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    if (!notificationsEnabled) {
      toast({
        title: "Notifications Enabled",
        description: "You'll now receive smart health alerts.",
      });
    } else {
      toast({
        title: "Notifications Disabled",
        description: "Health notifications have been turned off.",
      });
    }
  };

  const activeNotifications = notifications.filter(n => !n.dismissed);

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      default: return 'default';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default: return <Heart className="h-5 w-5 text-blue-500" />;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  if (!whoopData) {
    return (
      <Card className="border-2 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Health Insights Dashboard
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleNotifications}
              className="flex items-center gap-2"
            >
              {notificationsEnabled ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              {notificationsEnabled ? 'Disable' : 'Enable'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
              <Brain className="h-12 w-12 text-primary/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload your health data to unlock insights</h3>
            <p className="text-sm mb-4">Get personalized health score, smart alerts, and AI-powered recommendations</p>
            <p className="text-xs">Supports Whoop data for recovery, sleep, and training analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Health Insights Dashboard
            {activeNotifications.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {activeNotifications.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
                className="text-muted-foreground"
              >
                Clear All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleNotifications}
              className="flex items-center gap-2"
            >
              {notificationsEnabled ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              {notificationsEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Health Score Section */}
        <div className="text-center py-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/10">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-background border-8 border-primary/20 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getHealthScoreColor(healthScore)}`}>
                    {healthScore.toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    HEALTH SCORE
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 rounded-full" style={{
                background: `conic-gradient(from 0deg, hsl(var(--primary)) ${healthScore * 3.6}deg, transparent ${healthScore * 3.6}deg)`
              }} />
            </div>
            <div className="text-center">
              <div className={`text-lg font-semibold ${getHealthScoreColor(healthScore)}`}>
                {getHealthScoreLabel(healthScore)}
              </div>
              <div className="text-sm text-muted-foreground">
                Based on recovery, sleep, and training balance
              </div>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        {activeNotifications.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold">Critical Alerts</h3>
            </div>
            {activeNotifications.map((notification) => (
              <Alert key={notification.id} variant={getAlertVariant(notification.type)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(notification.type)}
                    <div className="flex-1">
                      <AlertTitle className="flex items-center gap-2">
                        {notification.title}
                        <Badge 
                          variant={notification.type === 'critical' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {notification.type}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="mt-2">
                        {notification.message}
                      </AlertDescription>
                      <div className="mt-3 text-xs text-muted-foreground">
                        {notification.metric}: {notification.value.toFixed(1)} 
                        (threshold: {notification.threshold})
                        • {notification.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissNotification(notification.id)}
                    className="ml-2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Correlation Insights */}
        {correlationAnalysis.insights.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">Data Insights</h3>
                <Badge variant="outline" className="text-xs">
                  {correlationAnalysis.insights.length} found
                </Badge>
              </div>
              <div className="grid gap-3">
                {correlationAnalysis.insights.map((insight, index) => (
                  <div key={index} className="p-4 rounded-lg border bg-card/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={insight.direction === 'positive' ? 'default' : 'secondary'}>
                          {insight.strength} {insight.direction}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {(insight.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>
                      {insight.direction === 'positive' ? 
                        <TrendingUp className="h-4 w-4 text-green-500" /> : 
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      }
                    </div>
                    <h4 className="font-medium mb-1">{insight.relationship}</h4>
                    <p className="text-sm text-muted-foreground">{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* AI Recommendations */}
        {correlationAnalysis.recommendations.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold">AI Recommendations</h3>
                <Badge variant="outline" className="text-xs">
                  {correlationAnalysis.recommendations.length} actions
                </Badge>
              </div>
              <div className="grid gap-3">
                {correlationAnalysis.recommendations.map((rec, index) => (
                  <div key={index} className="p-4 rounded-lg border bg-gradient-to-r from-green-50/50 to-blue-50/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                          {rec.priority} priority
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {rec.category}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {(rec.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <h4 className="font-medium mb-1">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-blue-700">{rec.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* No Alerts State */}
        {activeNotifications.length === 0 && correlationAnalysis.insights.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-3 opacity-50 text-green-500" />
            <p className="mb-2">All systems looking good! 🎉</p>
            <p className="text-sm">Continue monitoring for new insights and recommendations</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}