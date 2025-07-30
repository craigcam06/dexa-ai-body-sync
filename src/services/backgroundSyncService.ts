import { HealthKitService } from './healthKitService';
import { notificationService } from './notificationService';
import { supabase } from '@/integrations/supabase/client';

interface SyncResult {
  success: boolean;
  recordCount: number;
  newRecords: number;
  errors: string[];
  lastSync: Date;
}

interface SyncConfig {
  autoSyncEnabled: boolean;
  syncInterval: number; // in minutes
  dataTypes: string[];
  notifyOnSync: boolean;
  notifyOnErrors: boolean;
}

class BackgroundSyncService {
  private static instance: BackgroundSyncService;
  private healthService: HealthKitService;
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private config: SyncConfig = {
    autoSyncEnabled: false,
    syncInterval: 30, // 30 minutes default
    dataTypes: ['workouts', 'heart_rate', 'steps', 'body_weight', 'active_energy'],
    notifyOnSync: true,
    notifyOnErrors: true
  };

  private constructor() {
    this.healthService = HealthKitService.getInstance();
    this.loadConfig();
  }

  public static getInstance(): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService();
    }
    return BackgroundSyncService.instance;
  }

  private loadConfig() {
    try {
      const savedConfig = localStorage.getItem('backgroundSyncConfig');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.error('Failed to load sync config:', error);
    }
  }

  private saveConfig() {
    try {
      localStorage.setItem('backgroundSyncConfig', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save sync config:', error);
    }
  }

  public getConfig(): SyncConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<SyncConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();

    // Restart sync if interval changed
    if (this.isRunning && newConfig.syncInterval) {
      this.stopAutoSync();
      this.startAutoSync();
    }
  }

  public async startAutoSync(): Promise<boolean> {
    if (this.isRunning) {
      console.log('Background sync already running');
      return true;
    }

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Cannot start background sync: user not authenticated');
        return false;
      }

      // Request notification permissions
      const hasNotificationPermission = await notificationService.requestPermissions();
      if (!hasNotificationPermission) {
        console.warn('Notification permission denied - sync will run silently');
      }

      this.isRunning = true;
      this.config.autoSyncEnabled = true;
      this.saveConfig();

      // Perform initial sync
      await this.performSync();

      // Set up interval
      const intervalMs = this.config.syncInterval * 60 * 1000;
      this.syncInterval = setInterval(() => {
        this.performSync();
      }, intervalMs);

      console.log(`Background sync started with ${this.config.syncInterval} minute interval`);
      
      if (this.config.notifyOnSync) {
        await notificationService.showNotification({
          title: 'Health Sync Active',
          body: `Background sync enabled - checking every ${this.config.syncInterval} minutes`,
          icon: '🔄'
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to start background sync:', error);
      this.isRunning = false;
      return false;
    }
  }

  public stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    this.isRunning = false;
    this.config.autoSyncEnabled = false;
    this.saveConfig();
    
    console.log('Background sync stopped');
  }

  public isAutoSyncRunning(): boolean {
    return this.isRunning;
  }

  private async performSync(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      recordCount: 0,
      newRecords: 0,
      errors: [],
      lastSync: new Date()
    };

    try {
      console.log('Performing background health sync...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get current record count before sync
      const { count: beforeCount } = await supabase
        .from('apple_health_data')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Perform the sync
      const syncResult = await this.healthService.syncAllDataToDatabase(user.id);
      
      if (!syncResult.success) {
        throw new Error('Health data sync failed');
      }

      // Get record count after sync
      const { count: afterCount } = await supabase
        .from('apple_health_data')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      result.success = true;
      result.recordCount = syncResult.recordCount;
      result.newRecords = (afterCount || 0) - (beforeCount || 0);

      // Store sync result for tracking
      await this.storeSyncResult(user.id, result);

      // Notify if new data was synced
      if (result.newRecords > 0 && this.config.notifyOnSync) {
        await notificationService.showNotification({
          title: 'Health Data Synced',
          body: `${result.newRecords} new health records added`,
          icon: '✅'
        });
      }

      console.log(`Background sync completed: ${result.recordCount} total records, ${result.newRecords} new`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      result.errors.push(errorMessage);
      console.error('Background sync failed:', error);

      if (this.config.notifyOnErrors) {
        await notificationService.showNotification({
          title: 'Health Sync Failed',
          body: errorMessage,
          icon: '❌'
        });
      }
    }

    return result;
  }

  private async storeSyncResult(userId: string, result: SyncResult) {
    try {
      // Store sync history in localStorage for now
      // In a real app, you might want a dedicated table for this
      const syncHistory = JSON.parse(localStorage.getItem('syncHistory') || '[]');
      syncHistory.unshift({
        userId,
        timestamp: result.lastSync.toISOString(),
        success: result.success,
        recordCount: result.recordCount,
        newRecords: result.newRecords,
        errors: result.errors
      });

      // Keep only last 50 sync results
      if (syncHistory.length > 50) {
        syncHistory.splice(50);
      }

      localStorage.setItem('syncHistory', JSON.stringify(syncHistory));
    } catch (error) {
      console.error('Failed to store sync result:', error);
    }
  }

  public getSyncHistory(): any[] {
    try {
      return JSON.parse(localStorage.getItem('syncHistory') || '[]');
    } catch (error) {
      console.error('Failed to get sync history:', error);
      return [];
    }
  }

  public async manualSync(): Promise<SyncResult> {
    console.log('Performing manual sync...');
    return await this.performSync();
  }

  public getLastSyncTime(): Date | null {
    try {
      const history = this.getSyncHistory();
      if (history.length > 0) {
        return new Date(history[0].timestamp);
      }
    } catch (error) {
      console.error('Failed to get last sync time:', error);
    }
    return null;
  }

  public async bridgeWhoopData(): Promise<void> {
    try {
      // Get stored Whoop data
      const whoopData = JSON.parse(localStorage.getItem('whoopData') || '[]');
      if (whoopData.length === 0) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Bridging Whoop data to Apple Health format...');

      // Convert Whoop data to Apple Health format and store
      const bridgedRecords = [];

      for (const entry of whoopData) {
        // Bridge recovery data
        if (entry.recovery_score) {
          bridgedRecords.push({
            user_id: user.id,
            data_type: 'recovery_score',
            value: parseFloat(entry.recovery_score),
            unit: '%',
            start_date: entry.cycle_start || new Date().toISOString(),
            source_name: 'WHOOP',
            source_bundle_id: 'com.whoop',
            metadata: {
              hrv: entry.hrv,
              resting_hr: entry.resting_hr,
              skin_temp: entry.skin_temp,
              source: 'whoop_bridge'
            }
          });
        }

        // Bridge sleep data
        if (entry.sleep_performance) {
          bridgedRecords.push({
            user_id: user.id,
            data_type: 'sleep_performance',
            value: parseFloat(entry.sleep_performance),
            unit: '%',
            start_date: entry.cycle_start || new Date().toISOString(),
            source_name: 'WHOOP',
            source_bundle_id: 'com.whoop',
            metadata: {
              sleep_duration: entry.sleep_duration,
              sleep_efficiency: entry.sleep_efficiency,
              deep_sleep: entry.deep_sleep,
              rem_sleep: entry.rem_sleep,
              source: 'whoop_bridge'
            }
          });
        }

        // Bridge strain data
        if (entry.strain) {
          bridgedRecords.push({
            user_id: user.id,
            data_type: 'strain_score',
            value: parseFloat(entry.strain),
            unit: 'score',
            start_date: entry.cycle_start || new Date().toISOString(),
            source_name: 'WHOOP',
            source_bundle_id: 'com.whoop',
            metadata: {
              calories_burned: entry.calories_burned,
              avg_hr: entry.avg_hr,
              max_hr: entry.max_hr,
              source: 'whoop_bridge'
            }
          });
        }
      }

      if (bridgedRecords.length > 0) {
        const { error } = await supabase
          .from('apple_health_data')
          .upsert(bridgedRecords, {
            onConflict: 'user_id,data_type,start_date',
            ignoreDuplicates: true
          });

        if (error) {
          console.error('Failed to bridge Whoop data:', error);
        } else {
          console.log(`Successfully bridged ${bridgedRecords.length} Whoop records`);
        }
      }
    } catch (error) {
      console.error('Error bridging Whoop data:', error);
    }
  }

  public async detectDataGaps(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Query recent health data
      const { data: recentData } = await supabase
        .from('apple_health_data')
        .select('data_type, start_date')
        .eq('user_id', user.id)
        .gte('start_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('start_date', { ascending: false });

      const gaps = [];
      const expectedTypes = ['workouts', 'heart_rate', 'steps'];
      const today = new Date();

      for (const type of expectedTypes) {
        const typeData = recentData?.filter(d => d.data_type === type) || [];
        
        if (typeData.length === 0) {
          gaps.push({
            type,
            period: 'Last 7 days',
            severity: 'high',
            suggestion: `No ${type} data found - check Apple Health connection`
          });
        } else {
          const latestRecord = new Date(typeData[0].start_date);
          const daysSinceLastRecord = (today.getTime() - latestRecord.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysSinceLastRecord > 2) {
            gaps.push({
              type,
              period: `${Math.round(daysSinceLastRecord)} days ago`,
              severity: daysSinceLastRecord > 5 ? 'high' : 'medium',
              suggestion: `Latest ${type} data is ${Math.round(daysSinceLastRecord)} days old - sync recommended`
            });
          }
        }
      }

      return gaps;
    } catch (error) {
      console.error('Error detecting data gaps:', error);
      return [];
    }
  }
}

export const backgroundSyncService = BackgroundSyncService.getInstance();
