
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
import { supabase } from "@/integrations/supabase/client";

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

  // Save CSV data to database
  const saveCSVDataToDatabase = async (data: ParsedWhoopData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      // Save recovery data
      for (const recovery of data.recovery) {
        console.log('💾 Saving recovery to database:', recovery);
        const { data: saved, error } = await supabase.from('whoop_data').upsert({
          user_id: user.id,
          data_type: 'recovery',
          date: recovery.date,
          data: recovery as any
        });
        if (error) {
          console.error('❌ Error saving recovery:', error);
        } else {
          console.log('✅ Successfully saved recovery:', saved);
        }
      }

      // Save sleep data
      for (const sleep of data.sleep) {
        await supabase.from('whoop_data').upsert({
          user_id: user.id,
          data_type: 'sleep',
          date: sleep.date,
          data: sleep as any
        });
      }

      // Save workout data
      for (const workout of data.workouts) {
        await supabase.from('whoop_data').upsert({
          user_id: user.id,
          data_type: 'workout',
          date: workout.date,
          data: workout as any
        });
      }

      console.log('✅ CSV data saved to database successfully');
    } catch (error) {
      console.error('❌ Failed to save CSV data to database:', error);
    }
  };

  // Load CSV data from database
  const loadCSVDataFromDatabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: whoopRecords, error } = await supabase
        .from('whoop_data')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Failed to load CSV data from database:', error);
        return;
      }

      if (whoopRecords && whoopRecords.length > 0) {
        // Group data by type with proper type casting
        const recovery = whoopRecords.filter(r => r.data_type === 'recovery').map(r => {
          console.log('📊 Raw recovery record from DB:', r);
          return r.data as any;
        });
        const sleep = whoopRecords.filter(r => r.data_type === 'sleep').map(r => {
          console.log('📊 Raw sleep record from DB:', r);
          return r.data as any;
        });
        const workouts = whoopRecords.filter(r => r.data_type === 'workout').map(r => r.data as any);
        const daily = whoopRecords.filter(r => r.data_type === 'daily').map(r => r.data as any);
        const journal = whoopRecords.filter(r => r.data_type === 'journal').map(r => r.data as any);

        const loadedData: ParsedWhoopData = {
          recovery,
          sleep,
          workouts,
          daily,
          journal,
          stronglifts: []
        };

        console.log('✅ Loaded CSV data from database:', loadedData);
        console.log('🔍 First recovery entry details:', recovery[0]);
        setCsvData(loadedData);
        onDataUpdate?.(loadedData);
      }
    } catch (error) {
      console.error('❌ Failed to load CSV data from database:', error);
    }
  };

  const handleCSVDataUpdate = async (data: ParsedWhoopData) => {
    console.log('🔄 CSV data update received:', data);
    console.log('📊 Data summary:', {
      recovery: data.recovery?.length || 0,
      sleep: data.sleep?.length || 0,
      workouts: data.workouts?.length || 0,
      daily: data.daily?.length || 0,
      journal: data.journal?.length || 0,
      stronglifts: data.stronglifts?.length || 0
    });
    
    // Log sample data for debugging
    if (data.recovery?.length > 0) {
      console.log('📊 Sample recovery data:', data.recovery[0]);
    }
    if (data.sleep?.length > 0) {
      console.log('📊 Sample sleep data:', data.sleep[0]);
    }
    
    setCsvData(data);
    await saveCSVDataToDatabase(data);
    if (onDataUpdate) {
      onDataUpdate(data);
    }
  };

  useEffect(() => {
    console.log('WhoopConnect mounted, checking auth status...');
    const isAuth = whoopService.isAuthenticated();
    console.log('Is authenticated:', isAuth);
    setIsAuthenticated(isAuth);
    
    // Load any saved CSV data from database
    loadCSVDataFromDatabase();
    
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
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Heart className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display">Connect Health Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="csv" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="csv" className="flex items-center gap-2 text-sm">
                <Upload className="h-3 w-3" />
                CSV Upload
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center gap-2 text-sm">
                <Activity className="h-3 w-3" />
                Live API
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="csv" className="space-y-4">
              <CSVUploader onDataUpdate={handleCSVDataUpdate} />
              
              {csvData && (
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Data Loaded Successfully
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Sleep: {csvData.sleep.length} • Recovery: {csvData.recovery.length} • 
                    Workouts: {csvData.workouts.length} • Daily: {csvData.daily.length}
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="api" className="space-y-4">
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium mb-2 text-sm">Live WHOOP Connection</h3>
                <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
                  Connect directly to your WHOOP account for real-time data sync
                </p>
                
                <Button 
                  onClick={connectWhoop}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 btn-interactive"
                >
                  {isLoading ? '🔄 Connecting...' : '🔗 Connect WHOOP'}
                </Button>
                
                <p className="text-xs text-muted-foreground mt-3">
                  Secure OAuth • No passwords stored
                </p>
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchWhoopData} 
                  disabled={isLoading}
                  className="flex items-center gap-1"
                >
                  <Activity className="h-3 w-3" />
                  {isLoading ? 'Syncing...' : 'Refresh Data'}
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

      {(whoopData.recovery || (csvData && csvData.recovery.length > 0)) && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Latest Recovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            {whoopData.recovery ? (
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
            ) : csvData && csvData.recovery.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {csvData.recovery[0].recovery_score ? `${csvData.recovery[0].recovery_score}%` : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Recovery</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-500">
                      {csvData.recovery[0].hrv_rmssd_milli ? `${csvData.recovery[0].hrv_rmssd_milli}ms` : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">HRV</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-500">
                      {csvData.recovery[0].resting_heart_rate || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">RHR</div>
                  </div>
                </div>
                
                {/* Detailed Debug Section */}
                <details className="mt-2 border rounded p-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer font-mono">🔍 Debug Recovery Data</summary>
                  <div className="mt-2 space-y-2 text-xs">
                    <div><strong>Total recovery entries:</strong> {csvData.recovery.length}</div>
                    <div><strong>First entry date:</strong> {csvData.recovery[0]?.date}</div>
                    <div><strong>Latest entry date:</strong> {csvData.recovery[csvData.recovery.length - 1]?.date}</div>
                    <div className="mt-2"><strong>First 3 entries:</strong></div>
                    <pre className="bg-background p-2 rounded overflow-auto text-xs">
                      {JSON.stringify(csvData.recovery.slice(0, 3), null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(whoopData.sleep.length > 0 || (csvData && csvData.sleep.length > 0)) && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-blue-500" />
              Recent Sleep ({whoopData.sleep.length > 0 ? whoopData.sleep.length : csvData.sleep.length} nights)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {whoopData.sleep.length > 0 ? (
                whoopData.sleep.slice(0, 3).map((sleep, index) => (
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
                ))
              ) : csvData && csvData.sleep.length > 0 && (
                <div className="space-y-3">
                  {csvData.sleep.slice(0, 3).map((sleep, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-background/50 rounded-lg border">
                      <div>
                        <div className="font-medium">
                          {sleep.date}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDuration(sleep.total_sleep_time_milli)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {sleep.sleep_score ? `${sleep.sleep_score}%` : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Detailed Debug Section */}
                  <details className="mt-2 border rounded p-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer font-mono">🔍 Debug Sleep Data</summary>
                    <div className="mt-2 space-y-2 text-xs">
                      <div><strong>Total sleep entries:</strong> {csvData.sleep.length}</div>
                      <div><strong>First entry date:</strong> {csvData.sleep[0]?.date}</div>
                      <div><strong>Latest entry date:</strong> {csvData.sleep[csvData.sleep.length - 1]?.date}</div>
                      <div className="mt-2"><strong>First 3 entries:</strong></div>
                      <pre className="bg-background p-2 rounded overflow-auto text-xs">
                        {JSON.stringify(csvData.sleep.slice(0, 3), null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              )}
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
