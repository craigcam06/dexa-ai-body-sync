import { WhoopDailyData, StrongLiftsData, WhoopRecoveryData } from "@/types/whoopData";

// TDEE Calculation utilities
export interface TDEEData {
  bmr: number;
  tdee: number;
  activityLevel: string;
}

export const calculateBMR = (weight: number, height: number, age: number, gender: 'male' | 'female'): number => {
  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

export const calculateTDEE = (
  weight: number, // in kg
  height: number, // in cm
  age: number,
  gender: 'male' | 'female',
  dailyData?: WhoopDailyData[],
  workouts?: StrongLiftsData[]
): TDEEData => {
  const bmr = calculateBMR(weight, height, age, gender);
  
  // Calculate activity multiplier based on recent data
  let activityMultiplier = 1.4; // Default sedentary-light activity
  let activityLevel = "Light Activity";
  
  if (dailyData && dailyData.length > 0) {
    // Get last 7 days of data
    const recentData = dailyData.slice(-7);
    const avgSteps = recentData.reduce((sum, day) => sum + day.steps, 0) / recentData.length;
    const avgCalories = recentData.reduce((sum, day) => sum + day.calories_burned, 0) / recentData.length;
    
    // Classify activity level based on steps and calories
    if (avgSteps > 12000 || avgCalories > 2800) {
      activityMultiplier = 1.725; // Very active
      activityLevel = "Very Active";
    } else if (avgSteps > 8000 || avgCalories > 2400) {
      activityMultiplier = 1.55; // Moderately active
      activityLevel = "Moderately Active";
    } else if (avgSteps > 5000 || avgCalories > 2000) {
      activityMultiplier = 1.4; // Light activity
      activityLevel = "Light Activity";
    } else {
      activityMultiplier = 1.2; // Sedentary
      activityLevel = "Sedentary";
    }
  }
  
  // Add extra calories for strength training
  if (workouts && workouts.length > 0) {
    const recentWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return workoutDate >= weekAgo;
    });
    
    if (recentWorkouts.length >= 3) {
      activityMultiplier += 0.1; // Boost for regular strength training
      activityLevel += " + Strength Training";
    }
  }
  
  const tdee = Math.round(bmr * activityMultiplier);
  
  return {
    bmr: Math.round(bmr),
    tdee,
    activityLevel
  };
};

// Strength Training Metrics
export interface StrengthMetrics {
  weekly: {
    volume: number;
    sets: number;
    workouts: number;
  };
  monthly: {
    volume: number;
    sets: number;
    workouts: number;
  };
}

export const calculateStrengthMetrics = (strongliftsData: StrongLiftsData[]): StrengthMetrics => {
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  
  // Filter data for weekly and monthly periods
  const weeklyData = strongliftsData.filter(workout => {
    const workoutDate = new Date(workout.date);
    return workoutDate >= weekAgo && workoutDate <= now;
  });
  
  const monthlyData = strongliftsData.filter(workout => {
    const workoutDate = new Date(workout.date);
    return workoutDate >= monthAgo && workoutDate <= now;
  });
  
  // Calculate metrics
  const calculatePeriodMetrics = (data: StrongLiftsData[]) => {
    const volume = data.reduce((sum, workout) => sum + (workout.volume || 0), 0);
    const sets = data.reduce((sum, workout) => sum + (workout.sets || 0), 0);
    
    // Count unique workout days
    const uniqueDays = new Set(data.map(workout => workout.date.split('T')[0]));
    const workouts = uniqueDays.size;
    
    return { volume, sets, workouts };
  };
  
  return {
    weekly: calculatePeriodMetrics(weeklyData),
    monthly: calculatePeriodMetrics(monthlyData)
  };
};

// User profile for TDEE calculation (this would typically come from user settings)
export const DEFAULT_USER_PROFILE = {
  weight: 95.5, // kg (210.4 lbs)
  height: 180, // cm (5'11")
  age: 35,
  gender: 'male' as const
};