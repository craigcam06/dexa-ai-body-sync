import { WhoopRecoveryData, WhoopSleepData, ParsedWhoopData } from "@/types/whoopData";
import { TDEEData } from "./healthMetrics";

export interface HealthScoreComponents {
  recovery: {
    score: number;
    weight: number;
    points: number;
  };
  energy: {
    score: number;
    weight: number;
    points: number;
  };
  bodyComposition: {
    score: number;
    weight: number;
    points: number;
  };
}

export interface HealthScoreResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  components: HealthScoreComponents;
  insights: string[];
}

export interface BodyCompositionData {
  currentBodyFat: number;
  targetBodyFat: number;
  currentLeanMass: number;
  targetLeanMass: number;
  monthlyBodyFatChange?: number;
  monthlyLeanMassChange?: number;
}

export interface EnergyBalanceData {
  tdee: number;
  intake: number;
  targetDeficit: number;
  actualDeficit: number;
  deficitAccuracy: number; // 0-1 scale
}

// Weights for health score calculation (must sum to 1.0)
const SCORE_WEIGHTS = {
  recovery: 0.40,      // 40% - most important for overall health
  energy: 0.35,        // 35% - critical for fat loss goal
  bodyComposition: 0.25 // 25% - lagging indicator, monthly tracking
};

/**
 * Calculate recovery health score from Whoop data
 */
export const calculateRecoveryScore = (whoopData?: ParsedWhoopData): number => {
  if (!whoopData?.recovery?.length || !whoopData?.sleep?.length) {
    return 0;
  }

  // Get last 7 days of data for trend analysis
  const recentRecovery = whoopData.recovery.slice(-7);
  const recentSleep = whoopData.sleep.slice(-7);

  if (recentRecovery.length === 0 || recentSleep.length === 0) {
    return 0;
  }

  // Average recovery score (0-100)
  const avgRecoveryScore = recentRecovery.reduce((sum, day) => sum + day.recovery_score, 0) / recentRecovery.length;
  
  // Average sleep score (convert sleep efficiency to 0-100 scale)
  const avgSleepEfficiency = recentSleep.reduce((sum, day) => sum + day.sleep_efficiency_percentage, 0) / recentSleep.length;
  
  // Combine recovery and sleep (weighted towards recovery)
  const combinedScore = (avgRecoveryScore * 0.6) + (avgSleepEfficiency * 0.4);
  
  return Math.round(combinedScore);
};

/**
 * Calculate energy balance score
 */
export const calculateEnergyScore = (energyData: EnergyBalanceData): number => {
  const { targetDeficit, actualDeficit, deficitAccuracy } = energyData;
  
  // Score based on hitting deficit target (0-100)
  let deficitScore = 0;
  
  if (targetDeficit === 0) {
    // Maintenance - score based on staying within ±50 calories
    deficitScore = Math.max(0, 100 - (Math.abs(actualDeficit) / 50) * 100);
  } else {
    // Deficit/surplus goal - score based on accuracy
    const deficitVariance = Math.abs(actualDeficit - targetDeficit) / Math.abs(targetDeficit);
    deficitScore = Math.max(0, 100 - (deficitVariance * 100));
  }
  
  // Factor in consistency (deficitAccuracy represents 7-day consistency)
  const consistencyScore = deficitAccuracy * 100;
  
  // Combine deficit accuracy and consistency
  const combinedScore = (deficitScore * 0.7) + (consistencyScore * 0.3);
  
  return Math.round(Math.min(100, combinedScore));
};

/**
 * Calculate body composition score
 */
export const calculateBodyCompositionScore = (bodyData: BodyCompositionData): number => {
  const { 
    currentBodyFat, 
    targetBodyFat, 
    currentLeanMass, 
    targetLeanMass,
    monthlyBodyFatChange = 0,
    monthlyLeanMassChange = 0
  } = bodyData;
  
  // Score based on progress towards goals (0-100)
  let fatProgressScore = 50; // Start at neutral
  let leanProgressScore = 50; // Start at neutral
  
  // Body fat progress (assuming goal is to reduce)
  if (targetBodyFat < currentBodyFat) {
    const fatProgressNeeded = currentBodyFat - targetBodyFat;
    if (monthlyBodyFatChange < 0) {
      // Making progress - score based on rate
      const monthsToGoal = fatProgressNeeded / Math.abs(monthlyBodyFatChange);
      fatProgressScore = Math.min(100, 50 + (50 / Math.max(1, monthsToGoal - 6))); // Optimal 6+ months
    }
  }
  
  // Lean mass progress (assuming goal is to increase)
  if (targetLeanMass > currentLeanMass) {
    const leanProgressNeeded = targetLeanMass - currentLeanMass;
    if (monthlyLeanMassChange > 0) {
      // Making progress - score based on rate
      const monthsToGoal = leanProgressNeeded / monthlyLeanMassChange;
      leanProgressScore = Math.min(100, 50 + (50 / Math.max(1, monthsToGoal - 12))); // Optimal 12+ months
    }
  }
  
  // Combine fat loss and lean gain scores
  const combinedScore = (fatProgressScore * 0.6) + (leanProgressScore * 0.4);
  
  return Math.round(combinedScore);
};

/**
 * Calculate overall health score
 */
export const calculateOverallHealthScore = (
  whoopData?: ParsedWhoopData,
  energyData?: EnergyBalanceData,
  bodyData?: BodyCompositionData
): HealthScoreResult => {
  
  // Calculate component scores
  const recoveryScore = calculateRecoveryScore(whoopData);
  const energyScore = energyData ? calculateEnergyScore(energyData) : 0;
  const bodyScore = bodyData ? calculateBodyCompositionScore(bodyData) : 0;
  
  // Calculate weighted points
  const recoveryPoints = Math.round(recoveryScore * SCORE_WEIGHTS.recovery);
  const energyPoints = Math.round(energyScore * SCORE_WEIGHTS.energy);
  const bodyPoints = Math.round(bodyScore * SCORE_WEIGHTS.bodyComposition);
  
  const totalScore = recoveryPoints + energyPoints + bodyPoints;
  const maxScore = 100;
  const percentage = Math.round((totalScore / maxScore) * 100);
  
  // Generate insights
  const insights: string[] = [];
  
  if (recoveryScore < 70) {
    insights.push("Focus on improving sleep quality and recovery");
  }
  if (energyScore < 70) {
    insights.push("Adjust nutrition to better hit calorie targets");
  }
  if (bodyScore < 70) {
    insights.push("Body composition changes take time - stay consistent");
  }
  if (totalScore >= 85) {
    insights.push("Excellent health metrics - maintain current approach");
  }
  
  return {
    totalScore,
    maxScore,
    percentage,
    components: {
      recovery: {
        score: recoveryScore,
        weight: SCORE_WEIGHTS.recovery,
        points: recoveryPoints
      },
      energy: {
        score: energyScore,
        weight: SCORE_WEIGHTS.energy,
        points: energyPoints
      },
      bodyComposition: {
        score: bodyScore,
        weight: SCORE_WEIGHTS.bodyComposition,
        points: bodyPoints
      }
    },
    insights
  };
};

/**
 * Get mock energy balance data (replace with real tracking)
 */
export const getMockEnergyData = (tdeeData: TDEEData): EnergyBalanceData => {
  const targetDeficit = -300; // Target 300 cal deficit
  const mockIntake = 2547; // This should come from nutrition tracking
  const actualDeficit = tdeeData.tdee - mockIntake;
  const deficitAccuracy = 0.85; // 85% consistency over past week
  
  return {
    tdee: tdeeData.tdee,
    intake: mockIntake,
    targetDeficit,
    actualDeficit,
    deficitAccuracy
  };
};

/**
 * Get mock body composition data (replace with DEXA tracking)
 */
export const getMockBodyCompositionData = (): BodyCompositionData => {
  return {
    currentBodyFat: 18.2,
    targetBodyFat: 12.0,
    currentLeanMass: 155.3,
    targetLeanMass: 160.0,
    monthlyBodyFatChange: -0.8, // Lost 0.8% body fat last month
    monthlyLeanMassChange: 2.1   // Gained 2.1 lbs lean mass last month
  };
};