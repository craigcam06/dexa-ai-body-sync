import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, RotateCw, Smartphone, Clock, Heart, Dumbbell, Apple } from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import { backgroundSyncService } from '@/services/backgroundSyncService';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettings {
  dailyInsights: boolean;
  workoutReminders: boolean;
  recoveryAlerts: boolean;
  macroReminders: boolean;
  insightTime: { hour: number; minute: number };
  workoutTimes: string[];
  macroCheckTimes: string[];
}

interface WidgetConfig {
  enabled: boolean;
  type: 'recovery' | 'steps' | 'workouts' | 'all';
  updateFrequency: number;
}

export const MobileFeatures: React.FC = () => {
  const { toast } = useToast();
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    dailyInsights: false,
    workoutReminders: false,
    recoveryAlerts: false,
    macroReminders: false,
    insightTime: { hour: 8, minute: 0 },
    workoutTimes: [],
    macroCheckTimes: ['12:00', '18:00']
  });

  // Background sync state
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState(60);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Widget configuration
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({
    enabled: false,
    type: 'all',
    updateFrequency: 15
  });

  // Permissions state
  const [hasNotificationPermission, setHasNotificationPermission] = useState(true); // Start with true for demo
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    // For demo purposes, simulate permission granted
    setHasNotificationPermission(true);
  }, []);

  const loadSettings = () => {
    try {
      const savedNotifications = localStorage.getItem('notificationSettings');
      const savedSync = localStorage.getItem('backgroundSyncEnabled');
      const savedWidget = localStorage.getItem('widgetConfig');

      if (savedNotifications) {
        setNotificationSettings(JSON.parse(savedNotifications));
      }
      if (savedSync) {
        setSyncEnabled(JSON.parse(savedSync));
      }
      if (savedWidget) {
        setWidgetConfig(JSON.parse(savedWidget));
      }

      // Get last sync time
      const lastSyncTime = backgroundSyncService.getLastSyncTime();
      if (lastSyncTime) {
        setLastSync(new Date(lastSyncTime));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    try {
      // For demo purposes, always show as granted
      setHasNotificationPermission(true);
    } catch (error) {
      console.error('Failed to check permissions:', error);
      setHasNotificationPermission(true); // Still show as granted for demo
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const granted = await notificationService.requestPermissions();
      setHasNotificationPermission(granted);
      
      if (granted) {
        await notificationService.setupNotificationHandlers();
        toast({
          title: "Permissions Granted",
          description: "You'll now receive health reminders and insights."
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Enable notifications in your device settings to receive reminders.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Permission Error",
        description: "Failed to request notification permissions.",
        variant: "destructive"
      });
    }
  };

  const updateNotificationSettings = async (updates: Partial<NotificationSettings>) => {
    const newSettings = { ...notificationSettings, ...updates };
    setNotificationSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));

    // Apply notification scheduling
    if (hasNotificationPermission) {
      if (newSettings.dailyInsights) {
        await notificationService.scheduleDailyInsights(
          {
            recovery: 75,
            sleepScore: 85,
            recommendedTraining: "Moderate intensity",
            macroTargets: { protein: 150, carbs: 200, fats: 80 },
            alerts: []
          },
          newSettings.insightTime
        );
      }
    }

    toast({
      title: "Settings Updated",
      description: "Notification preferences have been saved."
    });
  };

  const toggleBackgroundSync = async (enabled: boolean) => {
    setSyncEnabled(enabled);
    localStorage.setItem('backgroundSyncEnabled', JSON.stringify(enabled));

    try {
      if (enabled) {
        await backgroundSyncService.startAutoSync();
        toast({
          title: "Sync Enabled",
          description: "Health data will sync automatically in the background."
        });
      } else {
        await backgroundSyncService.stopAutoSync();
        toast({
          title: "Sync Disabled",
          description: "Automatic background sync has been turned off."
        });
      }
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "Failed to update background sync settings.",
        variant: "destructive"
      });
    }
  };

  const performManualSync = async () => {
    setIsSyncing(true);
    try {
      const result = await backgroundSyncService.manualSync();
      setLastSync(new Date());
      
      toast({
        title: "Sync Complete",
        description: `Synced ${result.newRecords} new records (${result.recordCount} total).`
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync health data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const updateWidgetConfig = (updates: Partial<WidgetConfig>) => {
    const newConfig = { ...widgetConfig, ...updates };
    setWidgetConfig(newConfig);
    localStorage.setItem('widgetConfig', JSON.stringify(newConfig));

    toast({
      title: "Widget Updated",
      description: "Widget configuration has been saved."
    });
  };

  const addWorkoutReminder = () => {
    const time = prompt("Enter workout time (HH:MM):");
    if (time && /^\d{2}:\d{2}$/.test(time)) {
      const newTimes = [...notificationSettings.workoutTimes, time];
      updateNotificationSettings({ workoutTimes: newTimes });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Mobile Features
        </CardTitle>
        <CardDescription>
          Configure push notifications, background sync, and mobile widgets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="sync">
              <RotateCw className="h-4 w-4 mr-2" />
              Background Sync
            </TabsTrigger>
            <TabsTrigger value="widgets">
              <Apple className="h-4 w-4 mr-2" />
              Widgets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="permission-status">Notification Permission</Label>
                  <p className="text-sm text-muted-foreground">
                    Required to receive health reminders
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={hasNotificationPermission ? "default" : "secondary"}>
                    {hasNotificationPermission ? "Granted" : "Not Granted"}
                  </Badge>
                  {!hasNotificationPermission && (
                    <Button onClick={requestNotificationPermission} size="sm">
                      Request Permission
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="daily-insights">Daily Health Insights</Label>
                    <p className="text-sm text-muted-foreground">
                      Get daily recovery and training recommendations
                    </p>
                  </div>
                  <Switch
                    id="daily-insights"
                    checked={notificationSettings.dailyInsights}
                    onCheckedChange={(checked) => 
                      updateNotificationSettings({ dailyInsights: checked })
                    }
                  />
                </div>

                {notificationSettings.dailyInsights && (
                  <div className="flex items-center gap-4 ml-4">
                    <Label>Time:</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={notificationSettings.insightTime.hour}
                        onChange={(e) => updateNotificationSettings({
                          insightTime: {
                            ...notificationSettings.insightTime,
                            hour: parseInt(e.target.value)
                          }
                        })}
                        className="w-16"
                      />
                      <span>:</span>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={notificationSettings.insightTime.minute}
                        onChange={(e) => updateNotificationSettings({
                          insightTime: {
                            ...notificationSettings.insightTime,
                            minute: parseInt(e.target.value)
                          }
                        })}
                        className="w-16"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="workout-reminders">Workout Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about scheduled workouts
                    </p>
                  </div>
                  <Switch
                    id="workout-reminders"
                    checked={notificationSettings.workoutReminders}
                    onCheckedChange={(checked) => 
                      updateNotificationSettings({ workoutReminders: checked })
                    }
                  />
                </div>

                {notificationSettings.workoutReminders && (
                  <div className="ml-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Times:</Label>
                      <Button onClick={addWorkoutReminder} size="sm" variant="outline">
                        Add Time
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {notificationSettings.workoutTimes.map((time, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="recovery-alerts">Recovery Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get alerts when recovery is low
                    </p>
                  </div>
                  <Switch
                    id="recovery-alerts"
                    checked={notificationSettings.recoveryAlerts}
                    onCheckedChange={(checked) => 
                      updateNotificationSettings({ recoveryAlerts: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="macro-reminders">Macro Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded about macro targets
                    </p>
                  </div>
                  <Switch
                    id="macro-reminders"
                    checked={notificationSettings.macroReminders}
                    onCheckedChange={(checked) => 
                      updateNotificationSettings({ macroReminders: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sync" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="background-sync">Background Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync health data in the background
                  </p>
                </div>
                <Switch
                  id="background-sync"
                  checked={syncEnabled}
                  onCheckedChange={toggleBackgroundSync}
                />
              </div>

              {syncEnabled && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sync-interval">Sync Interval (minutes)</Label>
                    <Select 
                      value={syncInterval.toString()} 
                      onValueChange={(value) => setSyncInterval(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Last Sync</Label>
                  <span className="text-sm text-muted-foreground">
                    {lastSync ? lastSync.toLocaleString() : 'Never'}
                  </span>
                </div>
                <Button 
                  onClick={performManualSync} 
                  disabled={isSyncing}
                  className="w-full"
                >
                  {isSyncing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RotateCw className="h-4 w-4 mr-2" />
                      Manual Sync
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="widgets" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="widget-enabled">Enable Widgets</Label>
                  <p className="text-sm text-muted-foreground">
                    Show health data in iOS widgets
                  </p>
                </div>
                <Switch
                  id="widget-enabled"
                  checked={widgetConfig.enabled}
                  onCheckedChange={(checked) => updateWidgetConfig({ enabled: checked })}
                />
              </div>

              {widgetConfig.enabled && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="widget-type">Widget Type</Label>
                    <Select 
                      value={widgetConfig.type} 
                      onValueChange={(value: 'recovery' | 'steps' | 'workouts' | 'all') => 
                        updateWidgetConfig({ type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recovery">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            Recovery Only
                          </div>
                        </SelectItem>
                        <SelectItem value="steps">Steps Only</SelectItem>
                        <SelectItem value="workouts">
                          <div className="flex items-center gap-2">
                            <Dumbbell className="h-4 w-4" />
                            Workouts Only
                          </div>
                        </SelectItem>
                        <SelectItem value="all">All Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="widget-frequency">Update Frequency (minutes)</Label>
                    <Select 
                      value={widgetConfig.updateFrequency.toString()} 
                      onValueChange={(value) => updateWidgetConfig({ updateFrequency: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground mb-2">
                      To add widgets to your home screen:
                    </p>
                    <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                      <li>Long press on your home screen</li>
                      <li>Tap the "+" button</li>
                      <li>Search for "Health Sync"</li>
                      <li>Choose your preferred widget size</li>
                      <li>Tap "Add Widget"</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};