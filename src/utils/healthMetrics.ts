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
  console.log('💪 calculateStrengthMetrics called with:');
  console.log('  - Data type:', typeof strongliftsData);
  console.log('  - Is array:', Array.isArray(strongliftsData));
  console.log('  - Data length:', strongliftsData?.length);
  console.log('  - Sample entries:', strongliftsData?.slice(0, 3).map(w => ({ 
    date: w.date, 
    exercise: w.exercise, 
    volume: w.volume,
    sets: w.sets 
  })));
  
  if (!strongliftsData || strongliftsData.length === 0) {
    return {
      weekly: { volume: 0, sets: 0, workouts: 0 },
      monthly: { volume: 0, sets: 0, workouts: 0 }
    };
  }

  // Filter data to include recent years (2022-2025)
  const filteredData = strongliftsData.filter(workout => {
    const workoutYear = new Date(workout.date).getFullYear();
    console.log(`Workout: ${workout.exercise}, date: ${workout.date}, parsed year: ${workoutYear}`);
    return workoutYear >= 2022 && workoutYear <= 2025;
  });

  if (filteredData.length === 0) {
    return {
      weekly: { volume: 0, sets: 0, workouts: 0 },
      monthly: { volume: 0, sets: 0, workouts: 0 }
    };
  }

  // Sort filtered data by date to get the most recent entries
  const sortedData = filteredData.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get the most recent date in the filtered data
  const mostRecentDate = new Date(sortedData[0].date);
  
  // Calculate 7 days and 30 days before the most recent workout
  const weekBefore = new Date(mostRecentDate);
  weekBefore.setDate(weekBefore.getDate() - 7);
  
  const monthBefore = new Date(mostRecentDate);
  monthBefore.setDate(monthBefore.getDate() - 30);
  
  // Filter data for weekly and monthly periods from the most recent date
  const weeklyData = filteredData.filter(workout => {
    const workoutDate = new Date(workout.date);
    return workoutDate >= weekBefore && workoutDate <= mostRecentDate;
  });
  
  const monthlyData = filteredData.filter(workout => {
    const workoutDate = new Date(workout.date);
    return workoutDate >= monthBefore && workoutDate <= mostRecentDate;
  });
  
  // Calculate metrics
  const calculatePeriodMetrics = (data: StrongLiftsData[]) => {
    const volume = data.reduce((sum, workout) => sum + (workout.volume || 0), 0);
    const sets = data.reduce((sum, workout) => sum + (workout.sets || 0), 0);
    
    // Count unique workout days
    const uniqueDays = new Set(data.map(workout => {
      // Handle both date formats: "2022/06/02" and "2022-06-02"
      const dateStr = workout.date.includes('/') 
        ? workout.date.split('T')[0] 
        : workout.date.split('T')[0];
      return dateStr;
    }));
    const workouts = uniqueDays.size;
    
    return { volume, sets, workouts };
  };
  
  const weeklyMetrics = calculatePeriodMetrics(weeklyData);
  const monthlyMetrics = calculatePeriodMetrics(monthlyData);
  
  console.log('Strength metrics calculated:', {
    totalWorkouts: strongliftsData.length,
    mostRecentDate: mostRecentDate.toISOString(),
    weekBefore: weekBefore.toISOString(),
    monthBefore: monthBefore.toISOString(),
    weeklyData: weeklyData.length,
    monthlyData: monthlyData.length,
    weeklyVolume: weeklyMetrics.volume,
    monthlyVolume: monthlyMetrics.volume,
    weekly: weeklyMetrics,
    monthly: monthlyMetrics,
    weeklyWorkouts: weeklyData.map(w => ({ date: w.date, volume: w.volume })),
    monthlyWorkouts: monthlyData.map(w => ({ date: w.date, volume: w.volume }))
  });
  
  return {
    weekly: weeklyMetrics,
    monthly: monthlyMetrics
  };
};

// User profile for TDEE calculation (this would typically come from user settings)
export const DEFAULT_USER_PROFILE = {
  weight: 95.5, // kg (210.4 lbs)
  height: 180, // cm (5'11")
  age: 35,
  gender: 'male' as const
};