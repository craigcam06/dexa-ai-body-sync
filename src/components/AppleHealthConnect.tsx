import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Activity, Scale, Footprints } from 'lucide-react';
import { HealthKitService, HealthData } from '@/services/healthKitService';
import { useToast } from '@/hooks/use-toast';

interface AppleHealthConnectProps {
  onDataUpdate?: (data: HealthData) => void;
}

export const AppleHealthConnect: React.FC<AppleHealthConnectProps> = ({ onDataUpdate }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const { toast } = useToast();

  const healthService = HealthKitService.getInstance();

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const hasPermissions = await healthService.requestPermissions();
      if (hasPermissions) {
        setIsConnected(true);
        toast({
          title: "Apple Health Connected",
          description: "Successfully connected to Apple Health",
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
    try {
      const data = await healthService.getAllHealthData();
      setHealthData(data);
      onDataUpdate?.(data);
      toast({
        title: "Data Synced",
        description: `Synced ${data.workouts.length} workouts and health metrics`,
      });
    } catch (error) {
      console.error('Error syncing health data:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync health data",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Apple Health Integration
          </CardTitle>
          <CardDescription>
            Connect to Apple Health to automatically sync your fitness data, including StrongLifts workouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={isConnected ? syncHealthData : handleConnect}
              disabled={isLoading}
              className="min-w-[200px]"
            >
              {isLoading ? (
                "Connecting..."
              ) : isConnected ? (
                "🔄 Sync Health Data"
              ) : (
                "🍎 Connect Apple Health"
              )}
            </Button>
            {isConnected && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Connected
              </Badge>
            )}
          </div>

          {isConnected && healthData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Workouts</p>
                      <p className="text-2xl font-bold">{healthData.workouts.length}</p>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Body Weight</p>
                      <p className="text-2xl font-bold">
                        {healthData.bodyComposition[0]?.bodyWeight?.toFixed(1) || '--'} kg
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {healthData.bodyComposition[0] ? formatDate(healthData.bodyComposition[0].date) : 'No data'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Heart Rate</p>
                      <p className="text-2xl font-bold">
                        {healthData.heartRate[0]?.value || '--'} bpm
                      </p>
                      <p className="text-xs text-muted-foreground">Latest reading</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Footprints className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Steps Today</p>
                      <p className="text-2xl font-bold">
                        {healthData.steps[0]?.value?.toLocaleString() || '--'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {healthData.steps[0] ? formatDate(healthData.steps[0].date) : 'No data'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {isConnected && healthData && healthData.workouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Workouts</CardTitle>
            <CardDescription>Latest workouts from Apple Health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthData.workouts.slice(0, 5).map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{workout.workoutType}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(workout.startDate)} • {workout.duration} minutes
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{workout.totalEnergyBurned || '--'} cal</p>
                    <Badge variant="secondary" className="text-xs">
                      {workout.workoutType}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};