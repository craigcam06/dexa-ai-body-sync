interface WhoopAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

interface WhoopTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface WhoopRecovery {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: string;
  score: {
    user_calibrating: boolean;
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
    spo2_percentage: number;
    skin_temp_celsius: number;
  };
}

interface WhoopSleep {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: string;
  score: {
    stage_summary: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_no_data_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      sleep_cycle_count: number;
      disturbance_count: number;
    };
    sleep_needed: {
      baseline_milli: number;
      need_from_sleep_debt_milli: number;
      need_from_recent_strain_milli: number;
      need_from_recent_nap_milli: number;
    };
    respiratory_rate: number;
    sleep_performance_percentage: number;
    sleep_consistency_percentage: number;
    sleep_efficiency_percentage: number;
  };
}

interface WhoopWorkout {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  sport_id: number;
  score_state: string;
  score: {
    strain: number;
    average_heart_rate: number;
    max_heart_rate: number;
    kilojoule: number;
    percent_recorded: number;
    distance_meter: number;
    altitude_gain_meter: number;
    altitude_change_meter: number;
    zone_duration: {
      zone_zero_milli: number;
      zone_one_milli: number;
      zone_two_milli: number;
      zone_three_milli: number;
      zone_four_milli: number;
      zone_five_milli: number;
    };
  };
}

class WhoopService {
  private baseUrl = 'https://api.prod.whoop.com';
  private authConfig: WhoopAuthConfig;

  constructor() {
    this.authConfig = {
      clientId: process.env.WHOOP_CLIENT_ID || '',
      redirectUri: `${window.location.origin}/auth/whoop/callback`,
      scopes: ['read:recovery', 'read:cycles', 'read:workout', 'read:sleep', 'read:profile', 'read:body_measurement']
    };
  }

  // Generate OAuth authorization URL
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      redirect_uri: this.authConfig.redirectUri,
      response_type: 'code',
      scope: this.authConfig.scopes.join(' '),
      state: this.generateState()
    });

    return `${this.baseUrl}/oauth/oauth2/auth?${params.toString()}`;
  }

  // Generate random state for OAuth security
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<WhoopTokenResponse> {
    const response = await fetch(`${this.baseUrl}/oauth/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.authConfig.clientId,
        client_secret: process.env.WHOOP_CLIENT_SECRET || '',
        code: code,
        redirect_uri: this.authConfig.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return response.json();
  }

  // Store tokens securely
  storeTokens(tokens: WhoopTokenResponse): void {
    localStorage.setItem('whoop_access_token', tokens.access_token);
    localStorage.setItem('whoop_refresh_token', tokens.refresh_token);
    localStorage.setItem('whoop_expires_at', (Date.now() + tokens.expires_in * 1000).toString());
  }

  // Get stored access token
  getAccessToken(): string | null {
    const token = localStorage.getItem('whoop_access_token');
    const expiresAt = localStorage.getItem('whoop_expires_at');
    
    if (!token || !expiresAt) return null;
    
    if (Date.now() > parseInt(expiresAt)) {
      // Token expired, should refresh
      this.clearTokens();
      return null;
    }
    
    return token;
  }

  // Clear stored tokens
  clearTokens(): void {
    localStorage.removeItem('whoop_access_token');
    localStorage.removeItem('whoop_refresh_token');
    localStorage.removeItem('whoop_expires_at');
  }

  // Make authenticated API request
  private async makeAuthenticatedRequest(endpoint: string): Promise<any> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No valid access token available');
    }

    const response = await fetch(`${this.baseUrl}/developer/v1${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get latest recovery data
  async getLatestRecovery(): Promise<WhoopRecovery | null> {
    try {
      const data = await this.makeAuthenticatedRequest('/recovery?limit=1');
      return data.records?.[0] || null;
    } catch (error) {
      console.error('Error fetching recovery data:', error);
      return null;
    }
  }

  // Get recent sleep data
  async getRecentSleep(limit = 7): Promise<WhoopSleep[]> {
    try {
      const data = await this.makeAuthenticatedRequest(`/activity/sleep?limit=${limit}`);
      return data.records || [];
    } catch (error) {
      console.error('Error fetching sleep data:', error);
      return [];
    }
  }

  // Get recent workouts
  async getRecentWorkouts(limit = 10): Promise<WhoopWorkout[]> {
    try {
      const data = await this.makeAuthenticatedRequest(`/activity/workout?limit=${limit}`);
      return data.records || [];
    } catch (error) {
      console.error('Error fetching workout data:', error);
      return [];
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  // Get user profile
  async getUserProfile(): Promise<any> {
    try {
      return await this.makeAuthenticatedRequest('/user/profile/basic');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Get body measurements
  async getBodyMeasurements(): Promise<any> {
    try {
      return await this.makeAuthenticatedRequest('/user/measurement/body');
    } catch (error) {
      console.error('Error fetching body measurements:', error);
      return null;
    }
  }
}

export const whoopService = new WhoopService();
export type { WhoopRecovery, WhoopSleep, WhoopWorkout };