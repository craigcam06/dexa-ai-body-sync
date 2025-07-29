import { ParsedWhoopData } from "@/types/whoopData";

export interface CorrelationInsight {
  type: 'correlation';
  relationship: string;
  strength: 'strong' | 'moderate' | 'weak';
  direction: 'positive' | 'negative';
  confidence: number;
  title: string;
  message: string;
  actionable: string;
  metrics: {
    primary: string;
    secondary: string;
    correlation: number;
  };
}

export interface CorrelationRecommendation {
  category: 'recovery' | 'sleep' | 'training' | 'nutrition';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  basedOn: string[];
  confidence: number;
}

// Correlation calculation utility
const calculateCorrelation = (x: number[], y: number[]): number => {
  if (x.length !== y.length || x.length < 3) return 0;
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
};

// Get correlation strength and direction
const getCorrelationStrength = (correlation: number): { strength: 'strong' | 'moderate' | 'weak', direction: 'positive' | 'negative' } => {
  const abs = Math.abs(correlation);
  const strength = abs >= 0.7 ? 'strong' : abs >= 0.4 ? 'moderate' : 'weak';
  const direction = correlation >= 0 ? 'positive' : 'negative';
  return { strength, direction };
};

// Sleep Quality → Recovery Analysis
export const analyzeSleepRecoveryCorrelation = (data: ParsedWhoopData): CorrelationInsight | null => {
  if (!data.sleep?.length || !data.recovery?.length) return null;
  
  // Match sleep and recovery data by date
  const matchedData: Array<{ sleep: number, recovery: number }> = [];
  
  data.sleep.forEach(sleepEntry => {
    const recoveryEntry = data.recovery.find(r => {
      const sleepDate = new Date(sleepEntry.date).toDateString();
      const recoveryDate = new Date(r.date).toDateString();
      return sleepDate === recoveryDate;
    });
    
    if (recoveryEntry) {
      matchedData.push({
        sleep: sleepEntry.sleep_efficiency_percentage,
        recovery: recoveryEntry.recovery_score
      });
    }
  });
  
  if (matchedData.length < 5) return null;
  
  const sleepScores = matchedData.map(d => d.sleep);
  const recoveryScores = matchedData.map(d => d.recovery);
  const correlation = calculateCorrelation(sleepScores, recoveryScores);
  const { strength, direction } = getCorrelationStrength(correlation);
  
  if (Math.abs(correlation) < 0.3) return null;
  
  return {
    type: 'correlation',
    relationship: 'sleep-recovery',
    strength,
    direction,
    confidence: Math.abs(correlation),
    title: 'Sleep-Recovery Connection',
    message: direction === 'positive' 
      ? `Your sleep efficiency shows a ${strength} positive correlation with recovery (${(correlation * 100).toFixed(0)}%)`
      : `Poor sleep efficiency is significantly impacting your recovery scores`,
    actionable: direction === 'positive'
      ? 'Continue prioritizing sleep quality to maintain good recovery'
      : 'Focus on improving sleep efficiency to boost recovery scores',
    metrics: {
      primary: 'sleep_efficiency',
      secondary: 'recovery_score',
      correlation
    }
  };
};

// Training Load → Sleep Quality Analysis
export const analyzeTrainingLoadSleepCorrelation = (data: ParsedWhoopData): CorrelationInsight | null => {
  if (!data.workouts?.length || !data.sleep?.length) return null;
  
  // Calculate daily training load and match with sleep
  const dailyTrainingLoad = new Map<string, number>();
  
  data.workouts.forEach(workout => {
    const date = new Date(workout.date).toDateString();
    const currentLoad = dailyTrainingLoad.get(date) || 0;
    dailyTrainingLoad.set(date, currentLoad + workout.strain_score);
  });
  
  const matchedData: Array<{ training: number, sleep: number }> = [];
  
  data.sleep.forEach(sleepEntry => {
    const date = new Date(sleepEntry.date).toDateString();
    const trainingLoad = dailyTrainingLoad.get(date) || 0;
    
    matchedData.push({
      training: trainingLoad,
      sleep: sleepEntry.sleep_efficiency_percentage
    });
  });
  
  if (matchedData.length < 7) return null;
  
  const trainingLoads = matchedData.map(d => d.training);
  const sleepEfficiency = matchedData.map(d => d.sleep);
  const correlation = calculateCorrelation(trainingLoads, sleepEfficiency);
  const { strength, direction } = getCorrelationStrength(correlation);
  
  if (Math.abs(correlation) < 0.3) return null;
  
  return {
    type: 'correlation',
    relationship: 'training-sleep',
    strength,
    direction,
    confidence: Math.abs(correlation),
    title: 'Training Impact on Sleep',
    message: direction === 'negative'
      ? `High training loads are negatively affecting your sleep efficiency (${(Math.abs(correlation) * 100).toFixed(0)}% correlation)`
      : `Your training load has a positive relationship with sleep quality`,
    actionable: direction === 'negative'
      ? 'Consider adjusting training intensity or timing to improve sleep quality'
      : 'Your current training approach supports good sleep patterns',
    metrics: {
      primary: 'training_strain',
      secondary: 'sleep_efficiency',
      correlation
    }
  };
};

// HRV Trend → Recovery Readiness
export const analyzeHRVRecoveryTrend = (data: ParsedWhoopData): CorrelationInsight | null => {
  if (!data.recovery?.length || data.recovery.length < 10) return null;
  
  // Sort by date and get recent data
  const sortedRecovery = data.recovery
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14); // Last 2 weeks
  
  const hrvValues = sortedRecovery.map(r => r.hrv_rmssd_milli);
  const recoveryValues = sortedRecovery.map(r => r.recovery_score);
  
  // Calculate HRV trend (linear regression slope)
  const days = sortedRecovery.map((_, i) => i);
  const hrvTrend = calculateCorrelation(days, hrvValues);
  const correlation = calculateCorrelation(hrvValues, recoveryValues);
  
  if (Math.abs(correlation) < 0.4) return null;
  
  const { strength, direction } = getCorrelationStrength(correlation);
  const avgHRV = hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length;
  const recentHRV = hrvValues.slice(-3).reduce((a, b) => a + b, 0) / 3;
  
  return {
    type: 'correlation',
    relationship: 'hrv-recovery',
    strength,
    direction,
    confidence: Math.abs(correlation),
    title: 'HRV-Recovery Relationship',
    message: hrvTrend < -0.3
      ? 'Declining HRV trend indicates increasing stress or overreaching'
      : recentHRV > avgHRV
      ? 'Your HRV shows positive adaptation and good recovery capacity'
      : 'HRV patterns suggest stable but potentially stressed state',
    actionable: hrvTrend < -0.3
      ? 'Consider reducing training intensity and focusing on stress management'
      : 'Continue current training approach while monitoring HRV trends',
    metrics: {
      primary: 'hrv_rmssd',
      secondary: 'recovery_score',
      correlation
    }
  };
};

// Generate correlation-based recommendations
export const generateCorrelationRecommendations = (
  insights: CorrelationInsight[]
): CorrelationRecommendation[] => {
  const recommendations: CorrelationRecommendation[] = [];
  
  insights.forEach(insight => {
    switch (insight.relationship) {
      case 'sleep-recovery':
        if (insight.direction === 'negative' || insight.confidence < 0.5) {
          recommendations.push({
            category: 'sleep',
            priority: insight.strength === 'strong' ? 'high' : 'medium',
            title: 'Optimize Sleep for Better Recovery',
            description: 'Your sleep quality is directly impacting recovery. Focus on sleep hygiene and consistency.',
            action: 'Aim for 7-9 hours of sleep with consistent bedtime routine',
            basedOn: ['sleep-recovery correlation'],
            confidence: insight.confidence
          });
        }
        break;
        
      case 'training-sleep':
        if (insight.direction === 'negative' && insight.strength !== 'weak') {
          recommendations.push({
            category: 'training',
            priority: 'high',
            title: 'Adjust Training Load for Better Sleep',
            description: 'High training loads are negatively affecting your sleep quality.',
            action: 'Consider reducing training intensity or allowing more recovery time',
            basedOn: ['training-sleep correlation'],
            confidence: insight.confidence
          });
        }
        break;
        
      case 'hrv-recovery':
        if (insight.message.includes('Declining')) {
          recommendations.push({
            category: 'recovery',
            priority: 'high',
            title: 'Address Declining HRV Trend',
            description: 'Your HRV trend indicates increasing stress or potential overreaching.',
            action: 'Focus on stress management, sleep, and reduce training intensity',
            basedOn: ['hrv-recovery correlation'],
            confidence: insight.confidence
          });
        }
        break;
    }
  });
  
  return recommendations;
};

// Main correlation analysis function
export const analyzeHealthCorrelations = (data: ParsedWhoopData): {
  insights: CorrelationInsight[];
  recommendations: CorrelationRecommendation[];
} => {
  const insights: CorrelationInsight[] = [];
  
  // Analyze different correlations
  const sleepRecovery = analyzeSleepRecoveryCorrelation(data);
  if (sleepRecovery) insights.push(sleepRecovery);
  
  const trainingLoadSleep = analyzeTrainingLoadSleepCorrelation(data);
  if (trainingLoadSleep) insights.push(trainingLoadSleep);
  
  const hrvRecovery = analyzeHRVRecoveryTrend(data);
  if (hrvRecovery) insights.push(hrvRecovery);
  
  // Generate recommendations based on correlations
  const recommendations = generateCorrelationRecommendations(insights);
  
  return { insights, recommendations };
};