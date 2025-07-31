import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Activity, Scale, Footprints, RefreshCw, Database, TrendingUp, CheckCircle } from 'lucide-react';
import { HealthKitService, HealthData } from '@/services/healthKitService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { HealthKitDemo } from './HealthKitDemo';

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
          description: healthService.isAvailable 
            ? "Successfully connected to Apple Health. Real data access enabled." 
            : "Successfully connected. Demo data is now available.",
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
      <Card className="health-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Apple Health Integration</CardTitle>
                <CardDescription>
                  {healthService.isAvailable 
                    ? "Connect to sync real health data from your iPhone" 
                    : "Demo mode - real data available on iOS devices"}
                </CardDescription>
              </div>
            </div>
            <Badge variant={isConnected ? "default" : "outline"}>
              {isConnected ? "Connected" : "Not Connected"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!isConnected ? (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Ready to Connect</h3>
              <p className="text-muted-foreground mb-6">
                Grant permission to access your health data for personalized insights
              </p>
              <Button onClick={handleConnect} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Heart className="mr-2 h-4 w-4" />
                    Connect Apple Health
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Health Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                {healthMetrics.map((metric, index) => (
                  <div key={index} className="metric-card text-center">
                    <metric.icon className={`h-8 w-8 mx-auto mb-2 ${metric.color}`} />
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{metric.value}</p>
                      <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
                      <p className="text-sm font-medium">{metric.name}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sync Controls */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">{syncedRecords} records synced</p>
                    {lastSyncTime && (
                      <p className="text-muted-foreground">
                        Last sync: {lastSyncTime.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={syncHealthData} 
                  disabled={isSyncing}
                  variant="outline"
                  size="sm"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Sync Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <HealthKitDemo />
    </div>
  );
};