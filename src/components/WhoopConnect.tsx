import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Activity, Moon, Zap, AlertCircle, CheckCircle } from "lucide-react";
import { whoopService, WhoopRecovery, WhoopSleep, WhoopWorkout } from "@/services/whoopApi";

interface WhoopConnectProps {
  onDataUpdate?: (data: any) => void;
}

export const WhoopConnect = ({ onDataUpdate }: WhoopConnectProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whoopData, setWhoopData] = useState<{
    recovery: WhoopRecovery | null;
    sleep: WhoopSleep[];
    workouts: WhoopWorkout[];
  }>({
    recovery: null,
    sleep: [],
    workouts: []
  });

  useEffect(() => {
    // Check if already authenticated
    setIsAuthenticated(whoopService.isAuthenticated());
    
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      handleOAuthCallback(code);
    } else if (whoopService.isAuthenticated()) {
      fetchWhoopData();
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tokens = await whoopService.exchangeCodeForToken(code);
      whoopService.storeTokens(tokens);
      setIsAuthenticated(true);
      
      // Clear the code from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Fetch initial data
      await fetchWhoopData();
    } catch (error) {
      setError('Failed to connect to Whoop. Please try again.');
      console.error('OAuth callback error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWhoop = () => {
    const authUrl = whoopService.getAuthorizationUrl();
    window.location.href = authUrl;
  };

  const disconnectWhoop = () => {
    whoopService.clearTokens();
    setIsAuthenticated(false);
    setWhoopData({ recovery: null, sleep: [], workouts: [] });
    setError(null);
  };

  const fetchWhoopData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [recovery, sleep, workouts] = await Promise.all([
        whoopService.getLatestRecovery(),
        whoopService.getRecentSleep(7),
        whoopService.getRecentWorkouts(5)
      ]);

      const data = { recovery, sleep, workouts };
      setWhoopData(data);
      
      // Notify parent component of data update
      onDataUpdate?.(data);
    } catch (error) {
      setError('Failed to fetch Whoop data. Please try reconnecting.');
      console.error('Data fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (millis: number): string => {
    const hours = Math.floor(millis / (1000 * 60 * 60));
    const minutes = Math.floor((millis % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (!isAuthenticated) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-destructive" />
            Connect Whoop
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your Whoop device to track recovery, sleep, and strain data in real-time.
          </p>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Demo mode: Real Whoop integration requires secure backend setup. 
              Click below to see the integration interface.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={() => {
              // Demo: Show what the connection interface would look like
              setIsAuthenticated(true);
              setWhoopData({
                recovery: {
                  cycle_id: 1,
                  sleep_id: 1,
                  user_id: 1,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  score_state: "scored",
                  score: {
                    user_calibrating: false,
                    recovery_score: 85,
                    resting_heart_rate: 52,
                    hrv_rmssd_milli: 45,
                    spo2_percentage: 97.5,
                    skin_temp_celsius: 36.2
                  }
                },
                sleep: [
                  {
                    id: 1,
                    user_id: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    start: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
                    end: new Date(Date.now()).toISOString(),
                    timezone_offset: "-08:00",
                    nap: false,
                    score_state: "scored",
                    score: {
                      stage_summary: {
                        total_in_bed_time_milli: 8 * 60 * 60 * 1000,
                        total_awake_time_milli: 30 * 60 * 1000,
                        total_no_data_time_milli: 0,
                        total_light_sleep_time_milli: 3.5 * 60 * 60 * 1000,
                        total_slow_wave_sleep_time_milli: 2 * 60 * 60 * 1000,
                        total_rem_sleep_time_milli: 2 * 60 * 60 * 1000,
                        sleep_cycle_count: 5,
                        disturbance_count: 2
                      },
                      sleep_needed: {
                        baseline_milli: 8 * 60 * 60 * 1000,
                        need_from_sleep_debt_milli: 0,
                        need_from_recent_strain_milli: 30 * 60 * 1000,
                        need_from_recent_nap_milli: 0
                      },
                      respiratory_rate: 14.5,
                      sleep_performance_percentage: 87,
                      sleep_consistency_percentage: 92,
                      sleep_efficiency_percentage: 95
                    }
                  }
                ],
                workouts: [
                  {
                    id: 1,
                    user_id: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    end: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
                    timezone_offset: "-08:00",
                    sport_id: 1,
                    score_state: "scored",
                    score: {
                      strain: 16.2,
                      average_heart_rate: 145,
                      max_heart_rate: 185,
                      kilojoule: 1250,
                      percent_recorded: 98,
                      distance_meter: 5000,
                      altitude_gain_meter: 150,
                      altitude_change_meter: 75,
                      zone_duration: {
                        zone_zero_milli: 0,
                        zone_one_milli: 10 * 60 * 1000,
                        zone_two_milli: 15 * 60 * 1000,
                        zone_three_milli: 20 * 60 * 1000,
                        zone_four_milli: 10 * 60 * 1000,
                        zone_five_milli: 5 * 60 * 1000
                      }
                    }
                  }
                ]
              });
            }}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Connecting...' : 'Demo Whoop Connection'}
          </Button>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Recovery & strain tracking</p>
            <p>• Sleep performance analysis</p>
            <p>• Workout data integration</p>
            <p>• Heart rate variability</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-success" />
              Whoop Connected
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-success border-success">
                Live
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={disconnectWhoop}
              >
                Disconnect
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm">Data syncing automatically</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={fetchWhoopData}
              disabled={isLoading}
            >
              {isLoading ? 'Syncing...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Data */}
      {whoopData.recovery && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Today's Recovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {whoopData.recovery.score.recovery_score}%
                </div>
                <div className="text-xs text-muted-foreground">Recovery Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {whoopData.recovery.score.resting_heart_rate}
                </div>
                <div className="text-xs text-muted-foreground">Resting HR</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {Math.round(whoopData.recovery.score.hrv_rmssd_milli)}
                </div>
                <div className="text-xs text-muted-foreground">HRV (ms)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {whoopData.recovery.score.spo2_percentage.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">SpO2</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sleep */}
      {whoopData.sleep.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-primary" />
              Recent Sleep
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {whoopData.sleep.slice(0, 3).map((sleep, index) => (
                <div key={sleep.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <div className="font-medium">
                      {new Date(sleep.start).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDuration(sleep.score.stage_summary.total_in_bed_time_milli)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {sleep.score.sleep_performance_percentage}%
                    </div>
                    <div className="text-xs text-muted-foreground">Performance</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Workouts */}
      {whoopData.workouts.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Recent Workouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {whoopData.workouts.slice(0, 3).map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <div className="font-medium">
                      {new Date(workout.start).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDuration(new Date(workout.end).getTime() - new Date(workout.start).getTime())}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-warning">
                      {workout.score.strain.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Strain</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};