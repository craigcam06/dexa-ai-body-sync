import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { appleHealthService, HealthKitData } from '@/services/appleHealthService';
import { notificationService } from '@/services/notificationService';
import { Smartphone, Heart, Moon, Dumbbell, Apple, Bell, BellOff, RefreshCw, X } from 'lucide-react';

export const MobileHealthSync = () => {
  const [healthKitPermission, setHealthKitPermission] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [dailyNotifications, setDailyNotifications] = useState(false);
  const [notificationTime, setNotificationTime] = useState('08:00');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [healthData, setHealthData] = useState<HealthKitData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    notificationService.setupNotificationHandlers();
  }, []);

  const requestHealthKitPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await appleHealthService.requestPermissions();
      setHealthKitPermission(granted);
      
      if (granted) {
        toast({
          title: "HealthKit Connected",
          description: "You can now sync all your health data automatically",
        });
        await syncHealthData();
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable HealthKit access in iOS Settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Unable to connect to HealthKit",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const granted = await notificationService.requestPermissions();
      setNotificationPermission(granted);
      
      if (granted) {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive daily health insights and alerts",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in iOS Settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "Unable to setup notifications",
        variant: "destructive",
      });
    }
  };

  const syncHealthData = async () => {
    if (!healthKitPermission) {
      toast({
        title: "Permission Required",
        description: "Please enable HealthKit access first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await appleHealthService.getAllHealthData(30);
      setHealthData(data);
      await appleHealthService.saveToSupabase(data);
      setLastSync(new Date());
      
      toast({
        title: "Sync Complete",
        description: `Synced ${data.workouts.length} workouts, ${data.sleep.length} sleep records, and more`,
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Unable to sync health data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDailyNotifications = async (enabled: boolean) => {
    if (enabled && !notificationPermission) {
      await requestNotificationPermission();
      return;
    }

    setDailyNotifications(enabled);
    
    if (enabled) {
      const [hour, minute] = notificationTime.split(':').map(Number);
      await notificationService.scheduleDailyInsights(
        {
          recovery: 85,
          sleepScore: 78,
          recommendedTraining: "Upper body strength",
          macroTargets: { protein: 150, carbs: 200, fats: 80 },
          alerts: ["Stay hydrated today"]
        },
        { hour, minute }
      );
      
      toast({
        title: "Daily Insights Scheduled",
        description: `You'll receive daily health insights at ${notificationTime}`,
      });
    }
  };

  const getDataSummary = () => {
    if (!healthData) return null;

    return {
      workouts: healthData.workouts.length,
      sleep: healthData.sleep.length,
      nutrition: healthData.nutrition.length,
      recovery: healthData.recovery.length > 0 ? healthData.recovery[0].value : 0
    };
  };

  const summary = getDataSummary();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile Health Integration
          </CardTitle>
          <CardDescription>
            Connect Apple Health to automatically sync all your fitness data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* HealthKit Connection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Apple className="h-5 w-5" />
                <div>
                  <Label htmlFor="healthkit">Apple HealthKit</Label>
                  <p className="text-sm text-muted-foreground">
                    Sync workouts, sleep, nutrition, and recovery data
                  </p>
                </div>
              </div>
              {healthKitPermission ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Connected
                </Badge>
              ) : (
                <Button onClick={requestHealthKitPermission} disabled={isLoading}>
                  Connect
                </Button>
              )}
            </div>

            {healthKitPermission && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{summary?.workouts || 0}</p>
                    <p className="text-xs text-muted-foreground">Workouts</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">{summary?.sleep || 0}</p>
                    <p className="text-xs text-muted-foreground">Sleep Records</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">{summary?.recovery || 0}%</p>
                    <p className="text-xs text-muted-foreground">Recovery</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Apple className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">{summary?.nutrition || 0}</p>
                    <p className="text-xs text-muted-foreground">Nutrition</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Auto Sync */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {autoSync ? <RefreshCw className="h-5 w-5" /> : <X className="h-5 w-5" />}
              <div>
                <Label htmlFor="auto-sync">Auto Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync when health data changes
                </p>
              </div>
            </div>
            <Switch
              id="auto-sync"
              checked={autoSync}
              onCheckedChange={setAutoSync}
              disabled={!healthKitPermission}
            />
          </div>

          {/* Manual Sync */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Manual Sync</p>
              {lastSync && (
                <p className="text-xs text-muted-foreground">
                  Last synced: {lastSync.toLocaleDateString()} at {lastSync.toLocaleTimeString()}
                </p>
              )}
            </div>
            <Button
              onClick={syncHealthData}
              disabled={!healthKitPermission || isLoading}
              variant="outline"
            >
              {isLoading ? "Syncing..." : "Sync Now"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Smart Notifications
          </CardTitle>
          <CardDescription>
            Get daily insights and real-time health alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Notification Permission */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {notificationPermission ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              <div>
                <Label htmlFor="notifications">iOS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Allow notifications for health insights and alerts
                </p>
              </div>
            </div>
            {notificationPermission ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Enabled
              </Badge>
            ) : (
              <Button onClick={requestNotificationPermission}>
                Enable
              </Button>
            )}
          </div>

          {/* Daily Insights */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="daily-insights">Daily Insights</Label>
              <p className="text-sm text-muted-foreground">
                Recovery score, training recommendations, macro targets
              </p>
            </div>
            <Switch
              id="daily-insights"
              checked={dailyNotifications}
              onCheckedChange={toggleDailyNotifications}
            />
          </div>

          {/* Notification Time */}
          {dailyNotifications && (
            <div className="flex items-center justify-between">
              <Label htmlFor="notification-time">Notification Time</Label>
              <Select value={notificationTime} onValueChange={setNotificationTime}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="07:00">7:00 AM</SelectItem>
                  <SelectItem value="08:00">8:00 AM</SelectItem>
                  <SelectItem value="09:00">9:00 AM</SelectItem>
                  <SelectItem value="10:00">10:00 AM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};