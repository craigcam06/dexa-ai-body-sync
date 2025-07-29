export interface WhoopRecoveryData {
  date: string;
  recovery_score: number;
  hrv_rmssd_milli: number;
  resting_heart_rate: number;
  skin_temp_celsius: number;
}

export interface WhoopSleepData {
  date: string;
  total_sleep_time_milli: number;
  sleep_efficiency_percentage: number;
  slow_wave_sleep_time_milli: number;
  rem_sleep_time_milli: number;
  light_sleep_time_milli: number;
  wake_time_milli: number;
  sleep_score: number;
}

export interface WhoopWorkoutData {
  date: string;
  strain_score: number;
  kilojoule: number;
  average_heart_rate: number;
  max_heart_rate: number;
  duration_milli: number;
  workout_type: string;
}

export interface WhoopDailyData {
  date: string;
  steps: number;
  calories_burned: number;
  ambient_temperature_celsius: number;
}

export interface ParsedWhoopData {
  recovery: WhoopRecoveryData[];
  sleep: WhoopSleepData[];
  workouts: WhoopWorkoutData[];
  daily: WhoopDailyData[];
}

export interface CSVParseResult {
  success: boolean;
  data?: ParsedWhoopData;
  error?: string;
  rowsProcessed?: number;
}