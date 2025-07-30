import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  RefreshCw, 
  Bell, 
  Clock, 
  Activity, 
  CheckCircle,
  AlertCircle,
  History,
  Zap,
  Database
} from 'lucide-react';
import { backgroundSyncService } from '@/services/backgroundSyncService';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface SyncConfig {
  autoSyncEnabled: boolean;
  syncInterval: number;
  dataTypes: string[];
  notifyOnSync: boolean;
  notifyOnErrors: boolean;
}

export const BackgroundSyncSettings: React.FC = () => {
  const [config, setConfig] = useState<SyncConfig>({
    autoSyncEnabled: false,
    syncInterval: 30,
    dataTypes: [],
    notifyOnSync: true,
    notifyOnErrors: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentConfig();
    loadSyncHistory();
  }, []);

  const loadCurrentConfig = () => {
    const currentConfig = backgroundSyncService.getConfig();
    setConfig(currentConfig);
    
    const lastSync = backgroundSyncService.getLastSyncTime();
    setLastSyncTime(lastSync);
  };

  const loadSyncHistory = () => {
    const history = backgroundSyncService.getSyncHistory();
    setSyncHistory(history);
  };

  const handleConfigChange = async (updates: Partial<SyncConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    backgroundSyncService.updateConfig(updates);

    if (updates.autoSyncEnabled !== undefined) {
      if (updates.autoSyncEnabled) {
        const success = await backgroundSyncService.startAutoSync();
        if (success) {
          toast({
            title: "Background Sync Enabled",
            description: `Health data will sync every ${newConfig.syncInterval} minutes`,
          });
        } else {
          toast({
            title: "Failed to Enable Sync",
            description: "Check your authentication and try again",
            variant: "destructive"
          });
          setConfig({ ...newConfig, autoSyncEnabled: false });
        }
      } else {
        backgroundSyncService.stopAutoSync();
        toast({
          title: "Background Sync Disabled",
          description: "Automatic health data sync has been turned off",
        });
      }
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const result = await backgroundSyncService.manualSync();
      
      if (result.success) {
        toast({
          title: "Manual Sync Complete",
          description: `Synced ${result.recordCount} records (${result.newRecords} new)`,
        });
        setLastSyncTime(result.lastSync);
        loadSyncHistory();
      } else {
        toast({
          title: "Sync Failed",
          description: result.errors.join(', ') || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "Failed to perform manual sync",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBridgeWhoop = async () => {
    setIsLoading(true);
    try {
      await backgroundSyncService.bridgeWhoopData();
      toast({
        title: "Whoop Data Bridged",
        description: "Whoop data has been converted to Apple Health format",
      });
      loadSyncHistory();
    } catch (error) {
      toast({
        title: "Bridge Failed",
        description: "Failed to bridge Whoop data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSyncStatusBadge = (entry: any) => {
    if (entry.success) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Success
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    }
  };

  const dataTypeOptions = [
    { id: 'workouts', label: 'Workouts', icon: Activity },
    { id: 'heart_rate', label: 'Heart Rate', icon: Activity },
    { id: 'steps', label: 'Steps', icon: Activity },
    { id: 'body_weight', label: 'Body Weight', icon: Activity },
    { id: 'active_energy', label: 'Active Energy', icon: Zap }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Background Sync Settings
          </CardTitle>
          <CardDescription>
            Configure automatic health data synchronization and bridging between sources
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="bridging">Data Bridging</TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-6">
              {/* Auto Sync Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Automatic Sync</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync health data in the background
                    </p>
                  </div>
                  <Switch
                    checked={config.autoSyncEnabled}
                    onCheckedChange={(checked) => handleConfigChange({ autoSyncEnabled: checked })}
                  />
                </div>

                {/* Sync Status */}
                <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className={cn(
                    "flex items-center gap-2",
                    config.autoSyncEnabled ? "text-green-600" : "text-gray-500"
                  )}>
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      config.autoSyncEnabled ? "bg-green-500" : "bg-gray-400"
                    )}></div>
                    <span className="text-sm font-medium">
                      {config.autoSyncEnabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {lastSyncTime && (
                    <div className="text-sm text-muted-foreground">
                      Last sync: {formatDistanceToNow(lastSyncTime)} ago
                    </div>
                  )}
                </div>
              </div>

              {/* Sync Interval */}
              {config.autoSyncEnabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Sync Interval</h4>
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        Every {config.syncInterval} minutes
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      How often to check for new health data
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Slider
                      value={[config.syncInterval]}
                      onValueChange={([value]) => handleConfigChange({ syncInterval: value })}
                      min={5}
                      max={120}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5 min</span>
                      <span>1 hour</span>
                      <span>2 hours</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Sync Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        Notify when new data is synced
                      </p>
                    </div>
                    <Switch
                      checked={config.notifyOnSync}
                      onCheckedChange={(checked) => handleConfigChange({ notifyOnSync: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Error Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        Notify when sync errors occur
                      </p>
                    </div>
                    <Switch
                      checked={config.notifyOnErrors}
                      onCheckedChange={(checked) => handleConfigChange({ notifyOnErrors: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Manual Sync */}
              <div className="pt-4 border-t">
                <Button 
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="w-full"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Manual Sync Now
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Recent Sync History
                </h4>
                <Button variant="outline" size="sm" onClick={loadSyncHistory}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>

              <div className="space-y-3">
                {syncHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No sync history available</p>
                  </div>
                ) : (
                  syncHistory.slice(0, 10).map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getSyncStatusBadge(entry)}
                            <span className="text-sm font-medium">
                              {format(new Date(entry.timestamp), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {entry.recordCount} total records • {entry.newRecords} new
                          </p>
                          {entry.errors.length > 0 && (
                            <p className="text-xs text-red-600">
                              Errors: {entry.errors.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="bridging" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4" />
                    Data Source Bridging
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Convert and combine data from different sources into a unified format
                  </p>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h5 className="text-sm font-medium">WHOOP to Apple Health Bridge</h5>
                        <p className="text-xs text-muted-foreground">
                          Convert WHOOP CSV data to Apple Health format for unified analysis
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleBridgeWhoop}
                        disabled={isLoading}
                        size="sm"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Bridging...
                          </>
                        ) : (
                          <>
                            <Zap className="h-3 w-3 mr-1" />
                            Bridge Data
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                  <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    🔄 How Data Bridging Works
                  </h5>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• WHOOP recovery scores → Apple Health recovery metrics</li>
                    <li>• WHOOP sleep data → Apple Health sleep analysis</li>
                    <li>• WHOOP strain scores → Apple Health workout intensity</li>
                    <li>• All data timestamped and properly attributed to source</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};