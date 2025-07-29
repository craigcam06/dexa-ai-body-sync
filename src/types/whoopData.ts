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

export interface StrongLiftsData {
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  volume: number;
  one_rep_max?: number;
  workout_duration?: number;
}

export interface WhoopJournalData {
  date: string;
  question_text: string;
  answered_yes: boolean;
  notes: string;
}

export interface ParsedWhoopData {
  recovery: WhoopRecoveryData[];
  sleep: WhoopSleepData[];
  workouts: WhoopWorkoutData[];
  daily: WhoopDailyData[];
  journal: WhoopJournalData[];
  stronglifts: StrongLiftsData[];
}

export interface CSVParseResult {
  success: boolean;
  data?: ParsedWhoopData;
  error?: string;
  rowsProcessed?: number;
}