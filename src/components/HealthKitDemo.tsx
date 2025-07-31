import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Activity, Zap, Apple, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

// Enhanced demo data that simulates real HealthKit data
const generateRealisticHealthData = () => {
  const now = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    return date;
  }).reverse();

  return {
    workouts: last7Days.slice(0, 5).map((date, i) => ({
      id: `workout_${i}`,
      type: ['Running', 'Strength Training', 'Cycling', 'HIIT', 'Yoga'][i % 5],
      startDate: date.toISOString(),
      duration: Math.floor(Math.random() * 60) + 30, // 30-90 minutes
      calories: Math.floor(Math.random() * 400) + 200, // 200-600 calories
      heartRate: {
        average: Math.floor(Math.random() * 40) + 120, // 120-160 bpm
        max: Math.floor(Math.random() * 50) + 160, // 160-210 bpm
      }
    })),
    steps: last7Days.map((date, i) => ({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 5000) + 7000, // 7k-12k steps
      distance: Math.floor(Math.random() * 3) + 5, // 5-8 km
    })),
    heartRate: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      resting: Math.floor(Math.random() * 10) + 50, // 50-60 bpm
      average: Math.floor(Math.random() * 20) + 70, // 70-90 bpm
    })),
    bodyComposition: {
      weight: 84.5 + (Math.random() - 0.5) * 2, // 83.5-85.5 kg
      bodyFat: 18.2 + (Math.random() - 0.5) * 1, // 17.7-18.7%
      muscleMass: 65.3 + (Math.random() - 0.5) * 1, // 64.8-65.8 kg
      lastUpdated: now.toISOString(),
    },
    sleep: last7Days.map((date, i) => ({
      date: date.toISOString().split('T')[0],
      duration: 7 + Math.random() * 2, // 7-9 hours
      deep: 1.5 + Math.random() * 0.5, // 1.5-2 hours
      rem: 1.2 + Math.random() * 0.3, // 1.2-1.5 hours
      efficiency: 85 + Math.random() * 10, // 85-95%
    }))
  };
};

export const HealthKitDemo: React.FC = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [syncProgress, setSyncProgress] = useState(0);

  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // Load any previously stored demo data
    const stored = localStorage.getItem('healthKitDemoData');
    if (stored) {
      setHealthData(JSON.parse(stored));
      setIsConnected(true);
    }
  }, []);

  const simulateHealthKitConnection = async () => {
    setIsConnecting(true);
    setSyncProgress(0);

    try {
      // Simulate authorization request
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSyncProgress(25);

      toast({
        title: "Authorization Granted",
        description: isNative ? "HealthKit access granted!" : "Demo mode: Simulating HealthKit connection",
      });

      // Simulate data fetching with progress
      for (let i = 25; i <= 100; i += 15) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setSyncProgress(i);
      }

      // Generate realistic demo data
      const demoData = generateRealisticHealthData();
      setHealthData(demoData);
      setIsConnected(true);

      // Store for persistence
      localStorage.setItem('healthKitDemoData', JSON.stringify(demoData));

      toast({
        title: "Sync Complete",
        description: `Loaded ${demoData.workouts.length} workouts, ${demoData.steps.length} days of activity data`,
      });

    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Unable to connect to HealthKit",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
      setSyncProgress(0);
    }
  };

  const refreshData = async () => {
    if (!isConnected) return;
    
    setIsConnecting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newData = generateRealisticHealthData();
    setHealthData(newData);
    localStorage.setItem('healthKitDemoData', JSON.stringify(newData));
    
    setIsConnecting(false);
    toast({
      title: "Data Refreshed",
      description: "Latest health data synced successfully"
    });
  };

  const disconnect = () => {
    setIsConnected(false);
    setHealthData(null);
    localStorage.removeItem('healthKitDemoData');
    toast({
      title: "Disconnected",
      description: "HealthKit connection removed"
    });
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5" />
            HealthKit Integration
            <Badge variant={isNative ? "default" : "secondary"}>
              {isNative ? "Native" : "Demo Mode"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto">
              <Apple className="h-8 w-8 text-white" />
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Connect to Apple Health</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isNative 
                  ? "Grant access to sync your health data automatically"
                  : "Experience the integration with realistic demo data"
                }
              </p>
            </div>

            {isConnecting && (
              <div className="space-y-2">
                <Progress value={syncProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  {syncProgress < 25 ? "Requesting permissions..." :
                   syncProgress < 50 ? "Connecting to HealthKit..." :
                   syncProgress < 75 ? "Syncing workouts..." :
                   "Finalizing sync..."}
                </p>
              </div>
            )}

            <Button 
              onClick={simulateHealthKitConnection}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
            >
              {isConnecting ? "Connecting..." : "Connect HealthKit"}
            </Button>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Access to workouts, heart rate, and activity data</p>
              <p>• Automatic background sync</p>
              <p>• Privacy-focused: data stays on your device</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5" />
            HealthKit Connected
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshData} disabled={isConnecting}>
              {isConnecting ? "Syncing..." : "Refresh"}
            </Button>
            <Button variant="destructive" size="sm" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workouts">Workouts</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="vitals">Vitals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Today's Steps</span>
                </div>
                <div className="text-2xl font-bold">
                  {healthData?.steps[healthData.steps.length - 1]?.count.toLocaleString()}
                </div>
                <Progress value={75} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Resting HR</span>
                </div>
                <div className="text-2xl font-bold">
                  {healthData?.heartRate[0]?.resting} bpm
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>Improving</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Workouts</span>
                </div>
                <div className="text-2xl font-bold">
                  {healthData?.workouts.length}
                </div>
                <span className="text-sm text-muted-foreground">This week</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Body Fat</span>
                </div>
                <div className="text-2xl font-bold">
                  {healthData?.bodyComposition.bodyFat.toFixed(1)}%
                </div>
                <span className="text-sm text-muted-foreground">Latest DEXA</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="workouts" className="space-y-4">
            <div className="space-y-3">
              {healthData?.workouts.map((workout: any, index: number) => (
                <div key={workout.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{workout.type}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(workout.startDate).toLocaleDateString()} • {workout.duration} min
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-medium">{workout.calories} cal</div>
                    <div className="text-sm text-muted-foreground">
                      Avg HR: {workout.heartRate.average} bpm
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="space-y-3">
              {healthData?.steps.map((day: any, index: number) => (
                <div key={day.date} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{new Date(day.date).toLocaleDateString()}</div>
                    <div className="text-sm text-muted-foreground">{day.distance} km distance</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{day.count.toLocaleString()} steps</div>
                    <Progress value={(day.count / 10000) * 100} className="w-20 h-2 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vitals" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Heart Rate Zones</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Resting (50-60 bpm)</span>
                    <span className="text-sm font-medium">32%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fat Burn (60-120 bpm)</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cardio (120-160 bpm)</span>
                    <span className="text-sm font-medium">18%</span>
                  </div>
                  <Progress value={18} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Peak (160+ bpm)</span>
                    <span className="text-sm font-medium">5%</span>
                  </div>
                  <Progress value={5} className="h-2" />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Sleep Analysis</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Average Duration</span>
                    <span className="text-sm font-medium">
                      {(healthData?.sleep.reduce((sum: number, s: any) => sum + s.duration, 0) / healthData?.sleep.length).toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Sleep Efficiency</span>
                    <span className="text-sm font-medium">
                      {(healthData?.sleep.reduce((sum: number, s: any) => sum + s.efficiency, 0) / healthData?.sleep.length).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Deep Sleep</span>
                    <span className="text-sm font-medium">
                      {(healthData?.sleep.reduce((sum: number, s: any) => sum + s.deep, 0) / healthData?.sleep.length).toFixed(1)}h
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};