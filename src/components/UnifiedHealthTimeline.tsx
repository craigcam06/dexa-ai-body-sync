import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Heart, 
  Footprints, 
  Scale, 
  Zap, 
  Bed, 
  RefreshCw,
  Calendar,
  TrendingUp,
  Filter,
  Eye,
  Download
} from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { HealthKitService, HealthData } from '@/services/healthKitService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  type: 'workout' | 'heart_rate' | 'steps' | 'weight' | 'sleep' | 'recovery' | 'whoop_sync';
  timestamp: Date;
  title: string;
  value: string;
  source: 'apple_health' | 'whoop' | 'manual';
  icon: React.ComponentType<any>;
  color: string;
  details?: any;
  isSynced?: boolean;
}

interface UnifiedData {
  appleHealth: HealthData;
  whoopData: any[];
  timeline: TimelineEvent[];
  lastSync: Date | null;
}

interface DataGap {
  type: string;
  period: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export const UnifiedHealthTimeline: React.FC = () => {
  const [unifiedData, setUnifiedData] = useState<UnifiedData>({
    appleHealth: { workouts: [], bodyComposition: [], heartRate: [], steps: [], activeEnergy: [] },
    whoopData: [],
    timeline: [],
    lastSync: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedView, setSelectedView] = useState<'timeline' | 'gaps' | 'insights'>('timeline');
  const [dataGaps, setDataGaps] = useState<DataGap[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const { toast } = useToast();

  const healthService = HealthKitService.getInstance();

  useEffect(() => {
    loadUnifiedData();
  }, []);

  const loadUnifiedData = async () => {
    setIsLoading(true);
    try {
      // Get Apple Health data
      const appleHealthData = await healthService.getAllHealthData();
      
      // Get Whoop data from localStorage (already parsed from CSV)
      const whoopData = JSON.parse(localStorage.getItem('whoopData') || '[]');
      
      // Create unified timeline
      const timeline = createUnifiedTimeline(appleHealthData, whoopData);
      
      // Analyze data gaps
      const gaps = analyzeDataGaps(appleHealthData, whoopData);
      
      setUnifiedData({
        appleHealth: appleHealthData,
        whoopData,
        timeline,
        lastSync: new Date()
      });
      
      setDataGaps(gaps);
      
    } catch (error) {
      console.error('Error loading unified data:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load unified health data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createUnifiedTimeline = (appleHealth: HealthData, whoop: any[]): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Add Apple Health workouts
    appleHealth.workouts.forEach(workout => {
      events.push({
        id: `apple_workout_${workout.id}`,
        type: 'workout',
        timestamp: new Date(workout.startDate),
        title: workout.workoutType,
        value: `${workout.duration} min • ${workout.totalEnergyBurned || 0} cal`,
        source: 'apple_health',
        icon: Activity,
        color: 'text-blue-500',
        details: workout,
        isSynced: true
      });
    });

    // Add Apple Health heart rate (daily averages)
    const dailyHeartRate = groupByDay(appleHealth.heartRate);
    Object.entries(dailyHeartRate).forEach(([date, readings]) => {
      const readingsArray = Array.isArray(readings) ? readings : [];
      const avgHR = readingsArray.length > 0 ? readingsArray.reduce((sum, r) => sum + r.value, 0) / readingsArray.length : 0;
      events.push({
        id: `apple_hr_${date}`,
        type: 'heart_rate',
        timestamp: new Date(date),
        title: 'Heart Rate (Avg)',
        value: `${Math.round(avgHR)} bpm`,
        source: 'apple_health',
        icon: Heart,
        color: 'text-red-500',
        details: { average: avgHR, readings: readingsArray.length },
        isSynced: true
      });
    });

    // Add Apple Health steps
    appleHealth.steps.forEach(step => {
      events.push({
        id: `apple_steps_${step.date}`,
        type: 'steps',
        timestamp: new Date(step.date),
        title: 'Daily Steps',
        value: `${step.value.toLocaleString()} steps`,
        source: 'apple_health',
        icon: Footprints,
        color: 'text-purple-500',
        details: step,
        isSynced: true
      });
    });

    // Add Whoop data
    whoop.forEach((entry, index) => {
      if (entry.recovery_score) {
        events.push({
          id: `whoop_recovery_${index}`,
          type: 'recovery',
          timestamp: new Date(entry.cycle_start || Date.now()),
          title: 'Recovery Score',
          value: `${entry.recovery_score}%`,
          source: 'whoop',
          icon: Zap,
          color: 'text-green-500',
          details: entry,
          isSynced: true
        });
      }

      if (entry.sleep_performance) {
        events.push({
          id: `whoop_sleep_${index}`,
          type: 'sleep',
          timestamp: new Date(entry.cycle_start || Date.now()),
          title: 'Sleep Performance',
          value: `${entry.sleep_performance}% • ${entry.sleep_duration || 0}h`,
          source: 'whoop',
          icon: Bed,
          color: 'text-indigo-500',
          details: entry,
          isSynced: true
        });
      }
    });

    // Sort by timestamp (most recent first)
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const groupByDay = (data: any[]) => {
    return data.reduce((acc, item) => {
      const day = format(new Date(item.date), 'yyyy-MM-dd');
      if (!acc[day]) acc[day] = [];
      acc[day].push(item);
      return acc;
    }, {} as Record<string, any[]>);
  };

  const analyzeDataGaps = (appleHealth: HealthData, whoop: any[]): DataGap[] => {
    const gaps: DataGap[] = [];
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Check for missing Apple Health data
    if (appleHealth.workouts.length === 0) {
      gaps.push({
        type: 'Workouts',
        period: 'Last 30 days',
        severity: 'medium',
        suggestion: 'Connect Apple Health to track workouts automatically'
      });
    }

    // Check for missing Whoop data
    if (whoop.length === 0) {
      gaps.push({
        type: 'Recovery Data',
        period: 'All time',
        severity: 'high',
        suggestion: 'Upload Whoop CSV data to get recovery insights'
      });
    }

    // Check for recent activity gaps
    const recentWorkouts = appleHealth.workouts.filter(w => 
      new Date(w.startDate) > lastWeek
    );
    
    if (recentWorkouts.length === 0) {
      gaps.push({
        type: 'Recent Activity',
        period: 'Last 7 days',
        severity: 'low',
        suggestion: 'Log recent workouts or sync Apple Health data'
      });
    }

    return gaps;
  };

  const performBackgroundSync = async () => {
    setIsSyncing(true);
    setSyncProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Step 1: Sync Apple Health (30%)
      setSyncProgress(10);
      const healthData = await healthService.getAllHealthData();
      setSyncProgress(30);

      // Step 2: Store in database (60%)
      const syncResult = await healthService.syncAllDataToDatabase(user.id);
      setSyncProgress(60);

      // Step 3: Refresh unified view (80%)
      await loadUnifiedData();
      setSyncProgress(80);

      // Step 4: Complete (100%)
      setSyncProgress(100);

      if (syncResult.success) {
        toast({
          title: "Background Sync Complete! ✅",
          description: `Successfully synced ${syncResult.recordCount} health records`,
        });
      } else {
        toast({
          title: "Sync Warning",
          description: "Some data may not have synced properly",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Background sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync health data in background",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  const formatTimelineDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  const exportUnifiedData = async () => {
    try {
      const dataToExport = {
        exportDate: new Date().toISOString(),
        timeline: unifiedData.timeline,
        summary: {
          totalWorkouts: unifiedData.appleHealth.workouts.length,
          totalSteps: unifiedData.appleHealth.steps.reduce((sum, s) => sum + s.value, 0),
          whoopEntries: unifiedData.whoopData.length,
          dataGaps: dataGaps.length
        }
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unified-health-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Unified health data exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export unified data",
        variant: "destructive"
      });
    }
  };

  const getSourceBadge = (source: string) => {
    const styles = {
      apple_health: 'bg-gray-100 text-gray-800 border-gray-300',
      whoop: 'bg-red-100 text-red-800 border-red-300',
      manual: 'bg-blue-100 text-blue-800 border-blue-300'
    };

    const labels = {
      apple_health: 'Apple Health',
      whoop: 'WHOOP',
      manual: 'Manual'
    };

    return (
      <Badge variant="outline" className={cn('text-xs', styles[source as keyof typeof styles])}>
        {labels[source as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Unified Health Timeline
              </CardTitle>
              <CardDescription>
                Combined view of all your health data sources with automatic gap detection
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportUnifiedData}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button 
                onClick={performBackgroundSync}
                disabled={isSyncing}
                size="sm"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Background Sync
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Sync Progress */}
          {isSyncing && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Syncing health data...</span>
                <span>{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          )}

          {/* Data Sources Status */}
          <div className="flex items-center gap-4 mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Apple Health: {unifiedData.appleHealth.workouts.length + unifiedData.appleHealth.steps.length} records</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">WHOOP: {unifiedData.whoopData.length} records</span>
            </div>
            {unifiedData.lastSync && (
              <div className="text-sm text-muted-foreground">
                Last sync: {formatDistanceToNow(unifiedData.lastSync)} ago
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="gaps" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Data Gaps ({dataGaps.length})
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                      <div className="w-10 h-10 bg-muted rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                      <div className="w-20 h-6 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {unifiedData.timeline.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No health data found. Connect your data sources to get started.</p>
                    </div>
                  ) : (
                    unifiedData.timeline.map((event, index) => {
                      const IconComponent = event.icon;
                      const showDateHeader = index === 0 || 
                        formatTimelineDate(event.timestamp) !== formatTimelineDate(unifiedData.timeline[index - 1].timestamp);

                      return (
                        <div key={event.id}>
                          {showDateHeader && (
                            <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b py-2 mb-4">
                              <h3 className="font-semibold text-lg">
                                {formatTimelineDate(event.timestamp)}
                              </h3>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              "bg-white/50 dark:bg-black/20 border"
                            )}>
                              <IconComponent className={cn("h-5 w-5", event.color)} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium truncate">{event.title}</p>
                                {getSourceBadge(event.source)}
                                {event.isSynced && (
                                  <div className="w-2 h-2 bg-green-500 rounded-full" title="Synced" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{event.value}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(event.timestamp, 'h:mm a')}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="gaps" className="mt-6">
              <div className="space-y-4">
                {dataGaps.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="text-lg font-medium text-green-600">No Data Gaps Found! 🎉</p>
                    <p>Your health data coverage looks complete.</p>
                  </div>
                ) : (
                  dataGaps.map((gap, index) => (
                    <Card key={index} className={cn(
                      "border-l-4",
                      gap.severity === 'high' && "border-l-red-500 bg-red-50 dark:bg-red-950/20",
                      gap.severity === 'medium' && "border-l-orange-500 bg-orange-50 dark:bg-orange-950/20",
                      gap.severity === 'low' && "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{gap.type}</h4>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  gap.severity === 'high' && "border-red-300 text-red-700",
                                  gap.severity === 'medium' && "border-orange-300 text-orange-700",
                                  gap.severity === 'low' && "border-yellow-300 text-yellow-700"
                                )}
                              >
                                {gap.severity} priority
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Missing data for: {gap.period}
                            </p>
                            <p className="text-sm font-medium">{gap.suggestion}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Data Coverage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Apple Health</span>
                        <span className="text-sm font-medium">
                          {unifiedData.appleHealth.workouts.length + unifiedData.appleHealth.steps.length} records
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">WHOOP Data</span>
                        <span className="text-sm font-medium">{unifiedData.whoopData.length} records</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Timeline Events</span>
                        <span className="text-sm font-medium">{unifiedData.timeline.length} events</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sync Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Last Full Sync</span>
                        <span className="text-sm font-medium">
                          {unifiedData.lastSync ? formatDistanceToNow(unifiedData.lastSync) + ' ago' : 'Never'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Data Sources</span>
                        <span className="text-sm font-medium">2 connected</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Background Sync</span>
                        <span className="text-sm font-medium text-green-600">Active</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};