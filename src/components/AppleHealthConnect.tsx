import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Activity, Scale, Footprints, RefreshCw, Database, TrendingUp, CheckCircle } from 'lucide-react';
import { HealthKitService, HealthData } from '@/services/healthKitService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AppleHealthConnectProps {
  onDataUpdate?: (data: HealthData) => void;
}

export const AppleHealthConnect: React.FC<AppleHealthConnectProps> = ({ onDataUpdate }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncedRecords, setSyncedRecords] = useState(0);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  const healthService = HealthKitService.getInstance();

  useEffect(() => {
    console.log('AppleHealthConnect mounted');
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      console.log('Getting current user...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.email);
      setUser(user);
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const handleConnect = async () => {
    console.log('handleConnect called, user:', user?.email);
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to connect Apple Health data.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Requesting health permissions...');
      const hasPermissions = await healthService.requestPermissions();
      console.log('Permissions result:', hasPermissions);
      
      if (hasPermissions) {
        setIsConnected(true);
        toast({
          title: "Apple Health Connected! 🎉",
          description: "Successfully connected to Apple Health. Demo data is now available.",
        });
        await syncHealthData();
      } else {
        toast({
          title: "Permission Denied",
          description: "Unable to access Apple Health data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error connecting to Apple Health:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Apple Health",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncHealthData = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to sync health data.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      // Get health data from HealthKit
      const data = await healthService.getAllHealthData();
      setHealthData(data);
      onDataUpdate?.(data);

      // Sync to Supabase database
      const syncResult = await healthService.syncAllDataToDatabase(user.id);
      
      if (syncResult.success) {
        setSyncedRecords(syncResult.recordCount);
        setLastSyncTime(new Date());
        toast({
          title: "Sync Complete! ✅",
          description: `Synced ${syncResult.recordCount} health records to your secure database.`,
        });
      } else {
        toast({
          title: "Partial Sync",
          description: `Health data loaded but database sync failed. Local data is available.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error syncing health data:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync health data",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const healthMetrics = [
    { 
      icon: Activity, 
      name: 'Workouts', 
      value: healthData?.workouts.length || 0,
      subtitle: 'sessions',
      color: 'text-blue-500'
    },
    { 
      icon: Scale, 
      name: 'Body Weight', 
      value: healthData?.bodyComposition[0]?.bodyWeight?.toFixed(1) || '--',
      subtitle: 'kg',
      color: 'text-green-500'
    },
    { 
      icon: Heart, 
      name: 'Heart Rate', 
      value: healthData?.heartRate[0]?.value || '--',
      subtitle: 'bpm (latest)',
      color: 'text-red-500'
    },
    { 
      icon: Footprints, 
      name: 'Steps Today', 
      value: healthData?.steps[0]?.value?.toLocaleString() || '--',
      subtitle: 'steps',
      color: 'text-purple-500'
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            Apple Health Integration
          </CardTitle>
          <CardDescription>
            Connect to Apple Health to automatically sync your fitness data and store it securely in your personal database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
            <div className="flex items-center gap-3">
              <CheckCircle className={`h-5 w-5 ${isConnected ? 'text-green-500' : 'text-gray-400'}`} />
              <div>
                <p className="font-medium">
                  {isConnected ? 'Connected to Apple Health' : 'Ready to Connect'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isConnected 
                    ? 'Health data accessible with database sync' 
                    : 'Connect to access your health metrics'
                  }
                </p>
              </div>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {/* Sync Information */}
          {isConnected && lastSyncTime && (
            <div className="flex items-center gap-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Database className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Database Sync Status</p>
                <p className="text-xs text-blue-700">
                  Last sync: {lastSyncTime.toLocaleString()} • {syncedRecords} records stored
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isConnected ? (
              <Button 
                onClick={handleConnect} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
                    Connect Apple Health
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={syncHealthData} 
                disabled={isSyncing}
                className="flex-1"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing Data...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Health Data
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Health Metrics Overview */}
          {isConnected && healthData && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
              {healthMetrics.map((metric, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center gap-2">
                    <metric.icon className={`h-4 w-4 ${metric.color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground truncate">{metric.name}</p>
                      <p className="text-lg font-bold truncate">{metric.value}</p>
                      <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Workouts */}
      {isConnected && healthData && healthData.workouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Workouts
            </CardTitle>
            <CardDescription>Latest workouts from Apple Health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthData.workouts.slice(0, 5).map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{workout.workoutType}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(workout.startDate)} • {workout.duration} minutes
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{workout.totalEnergyBurned || '--'} cal</p>
                    <Badge variant="secondary" className="text-xs">
                      {workout.workoutType.split(' ')[0]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Notice */}
      <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg border">
        <p className="font-medium text-blue-900 mb-1">📱 Enhanced for iOS</p>
        <p className="text-blue-700">
          While this demo works on all platforms, the full Apple Health integration requires an iOS device with HealthKit access. 
          Your data is securely stored in your personal Supabase database.
        </p>
      </div>
    </div>
  );
};