
import React, { useState, useEffect } from "react";
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
  console.log('WhoopConnect component rendering - checking for cached text');
  
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
    console.log('🔍 WhoopConnect CSV data received:', {
      recovery: data.recovery.map(r => ({ date: r.date, score: r.recovery_score })),
      sleep: data.sleep.map(s => ({ date: s.date, score: s.sleep_score })),
      workouts: data.workouts.length,
      daily: data.daily.length
    });
    setCsvData(data);
    onDataUpdate?.(data);
  };

  useEffect(() => {
    console.log('WhoopConnect mounted, checking auth status...');
    const isAuth = whoopService.isAuthenticated();
    console.log('Is authenticated:', isAuth);
    setIsAuthenticated(isAuth);
    
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    console.log('OAuth code from URL:', code);
    
    if (code && !isAuth) {
      handleOAuthCallback(code);
    } else if (isAuth) {
      fetchWhoopData();
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Starting OAuth callback with code:', code);
      const tokenResponse = await whoopService.exchangeCodeForToken(code);
      console.log('✅ Successfully received tokens');
      whoopService.storeTokens(tokenResponse);
      setIsAuthenticated(true);
      await fetchWhoopData();
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error('❌ OAuth callback failed:', err);
      console.error('❌ Full error details:', {
        message: err.message,
        stack: err.stack,
        error: err
      });
      setError(`Failed to authenticate with Whoop: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWhoop = () => {
    console.log('🚨 BUTTON CLICKED! connectWhoop function called');
    console.log('connectWhoop button clicked - this should show REAL WHOOP CONNECTION');
    try {
      console.log('🔗 About to get authorization URL...');
      const authUrl = whoopService.getAuthorizationUrl();
      console.log('✅ Got auth URL, about to redirect to:', authUrl);
      console.log('🔍 Full URL breakdown:', {
        url: authUrl,
        contains_client_id: authUrl.includes('641ac502-42e1-4c38-8b51-15e0c5b5cbef'),
        contains_redirect_uri: authUrl.includes('wkuziiubjtvickimapau.supabase.co'),
        contains_oauth_path: authUrl.includes('/oauth/oauth2/auth')
      });
      window.location.href = authUrl;
    } catch (error) {
      console.error('❌ Failed to get authorization URL:', error);
      setError('Failed to initiate OAuth flow');
    }
  };

  const disconnectWhoop = () => {
    whoopService.clearTokens();
    setIsAuthenticated(false);
    setWhoopData({ recovery: null, sleep: [], workouts: [] });
    setError(null);
    onDataUpdate?.(null);
  };

  const fetchWhoopData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [recovery, sleep, workouts] = await Promise.all([
        whoopService.getLatestRecovery(),
        whoopService.getRecentSleep(7),
        whoopService.getRecentWorkouts(7)
      ]);

      const data = { recovery, sleep, workouts };
      setWhoopData(data);
      onDataUpdate?.(data);
    } catch (err) {
      console.error('Failed to fetch Whoop data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const buttonText = '🔗 REAL WHOOP CONNECTION';
  console.log('Button text should be:', buttonText);

  if (!isAuthenticated && !csvData) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            🚀 WHOOP DATA CONNECTION V3
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
            
            <TabsContent value="csv" className="space-y-4">
              <CSVUploader onDataUpdate={handleCSVDataUpdate} />
              
              {csvData && (
                <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                  <p className="text-sm text-success font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    CSV Data Loaded Successfully!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sleep: {csvData.sleep.length} • Recovery: {csvData.recovery.length} • 
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
                <h3 className="font-semibold mb-2">✨ AUTHENTIC WHOOP API CONNECTION</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect directly to your Whoop account for live data sync
                </p>
                
                <div className="mt-4 space-y-3">
                  <Button 
                    onClick={connectWhoop}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? '🔄 Connecting...' : buttonText}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    Secure OAuth authentication - no passwords stored
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
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Whoop Integration
            </div>
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              {csvData ? 'CSV Loaded' : 'API Connected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                {csvData ? 'Data loaded from CSV file' : 'Live data from Whoop API'}
              </p>
              {!csvData && (
                <p className="text-xs text-muted-foreground">
                  Last synced: {new Date().toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {!csvData && (
                <Button variant="outline" size="sm" onClick={fetchWhoopData} disabled={isLoading}>
                  {isLoading ? 'Syncing...' : 'Refresh'}
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={csvData ? () => setCsvData(null) : disconnectWhoop}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {whoopData.recovery && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Latest Recovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {whoopData.recovery.score.recovery_score}%
                </div>
                <div className="text-xs text-muted-foreground">Recovery</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">
                  {whoopData.recovery.score.hrv_rmssd_milli}ms
                </div>
                <div className="text-xs text-muted-foreground">HRV</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">
                  {whoopData.recovery.score.resting_heart_rate}
                </div>
                <div className="text-xs text-muted-foreground">RHR</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {whoopData.sleep.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-blue-500" />
              Recent Sleep ({whoopData.sleep.length} nights)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {whoopData.sleep.slice(0, 3).map((sleep, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-background/50 rounded-lg border">
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

      {whoopData.workouts.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Recent Workouts ({whoopData.workouts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {whoopData.workouts.slice(0, 3).map((workout, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-background/50 rounded-lg border">
                  <div>
                    <div className="font-medium">
                      {workout.sport_id ? `Activity ${workout.sport_id}` : 'Unknown Activity'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(workout.start).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {workout.score?.strain || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Strain</div>
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
