import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Activity, Moon, Zap, AlertCircle, CheckCircle, Upload, ExternalLink } from "lucide-react";
import { whoopService, WhoopRecovery, WhoopSleep, WhoopWorkout } from "@/services/whoopApi";
import { CSVUploader } from "./CSVUploader";
import { ParsedWhoopData } from "@/types/whoopData";

interface WhoopConnectProps {
  onDataUpdate?: (data: any) => void;
}

export const WhoopConnect = ({ onDataUpdate }: WhoopConnectProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<ParsedWhoopData | null>(null);
  const [whoopData, setWhoopData] = useState<{
    recovery: WhoopRecovery | null;
    sleep: WhoopSleep[];
    workouts: WhoopWorkout[];
  }>({
    recovery: null,
    sleep: [],
    workouts: []
  });

  const handleCSVDataUpdate = (data: ParsedWhoopData) => {
    setCsvData(data);
    // Convert CSV data to format expected by dashboard
    if (data.recovery.length > 0) {
      const latestRecovery = data.recovery[data.recovery.length - 1];
      onDataUpdate?.({
        recovery: {
          score: {
            recovery_score: latestRecovery.recovery_score,
            hrv_rmssd_milli: latestRecovery.hrv_rmssd_milli,
            resting_heart_rate: latestRecovery.resting_heart_rate,
            skin_temp_celsius: latestRecovery.skin_temp_celsius
          }
        }
      });
    }
  };

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

  if (!isAuthenticated && !csvData) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Whoop Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="csv" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="csv" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                CSV Upload
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                API Connect
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="csv">
              <CSVUploader onDataUpdate={handleCSVDataUpdate} />
              {csvData && (
                <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                  <p className="text-sm font-medium text-success">CSV Data Loaded</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recovery: {csvData.recovery.length} • Sleep: {csvData.sleep.length} • 
                    Workouts: {csvData.workouts.length} • Daily: {csvData.daily.length}
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="api" className="space-y-4">
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Activity className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Connect Your Whoop Account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sync your recovery, sleep, and strain data automatically
                </p>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Demo mode: Real Whoop integration requires developer API keys. 
                    Use CSV upload for now or apply for developer access.
                  </AlertDescription>
                </Alert>
                
                <div className="mt-4 space-y-3">
                  <Button 
                    onClick={() => {
                      // Demo connection
                      setIsAuthenticated(true);
                      // Set demo data...
                    }}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Connecting...' : 'Demo API Connection'}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    Need real API access? 
                    <a 
                      href="https://developer.whoop.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline ml-1"
                    >
                      Apply here <ExternalLink className="h-3 w-3 inline" />
                    </a>
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
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