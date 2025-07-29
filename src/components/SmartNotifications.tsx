import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Heart, Moon, X, Bell, BellOff } from 'lucide-react';
import { ParsedWhoopData } from '@/types/whoopData';
import { useToast } from '@/hooks/use-toast';

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

interface SmartNotificationsProps {
  whoopData?: ParsedWhoopData;
}

export function SmartNotifications({ whoopData }: SmartNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { toast } = useToast();

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

  if (!whoopData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Smart Notifications
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
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="mb-4">Upload your health data to receive smart notifications</p>
            <p className="text-sm">Get alerts when recovery drops below 50% or sleep efficiency is poor</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Smart Notifications
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
      <CardContent>
        {activeNotifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-3 opacity-50 text-green-500" />
            <p className="mb-2">All systems looking good! 🎉</p>
            <p className="text-sm">You'll be notified if any health metrics need attention</p>
          </div>
        ) : (
          <div className="space-y-4">
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
      </CardContent>
    </Card>
  );
}