import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CorrelationData {
  date: string;
  sleepScore?: number;
  sleepDuration?: number;
  recoveryScore?: number;
  hrv?: number;
  restingHR?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  workoutStrain?: number;
  workoutDuration?: number;
  workoutType?: string;
  weight?: number;
  adherenceScore?: number;
}

interface CorrelationResult {
  metric1: string;
  metric2: string;
  correlation: number;
  strength: 'weak' | 'moderate' | 'strong';
  direction: 'positive' | 'negative';
  significance: number;
  insights: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { daysBack = 30 } = await req.json();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    console.log(`Analyzing correlations for user ${user.id} over ${daysBack} days`);

    // Fetch all relevant data
    const [whoopData, foodLogs, planProgress] = await Promise.all([
      supabaseClient
        .from('whoop_data')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true }),
      
      supabaseClient
        .from('user_food_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0]),
      
      supabaseClient
        .from('plan_progress')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })
    ]);

    if (whoopData.error || foodLogs.error || planProgress.error) {
      throw new Error('Failed to fetch user data');
    }

    // Combine data by date
    const correlationData = combineDataByDate(
      whoopData.data || [],
      foodLogs.data || [],
      planProgress.data || []
    );

    console.log(`Combined data for ${correlationData.length} days`);

    if (correlationData.length < 7) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient data for correlation analysis. Need at least 7 days of data.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate correlations
    const correlations = calculateCorrelations(correlationData);
    
    // Generate AI insights for top correlations
    const topCorrelations = correlations
      .filter(c => Math.abs(c.correlation) > 0.3 && c.significance > 0.05)
      .slice(0, 5);

    const aiInsights = await generateAIInsights(topCorrelations, correlationData);

    return new Response(JSON.stringify({
      success: true,
      dataPoints: correlationData.length,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      correlations: correlations,
      topCorrelations,
      aiInsights,
      summary: {
        strongestPositive: correlations.find(c => c.direction === 'positive' && c.strength === 'strong'),
        strongestNegative: correlations.find(c => c.direction === 'negative' && c.strength === 'strong'),
        totalAnalyzed: correlations.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in correlation-engine:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function combineDataByDate(whoopData: any[], foodLogs: any[], planProgress: any[]): CorrelationData[] {
  const dataByDate = new Map<string, CorrelationData>();

  // Process WHOOP data
  whoopData.forEach(entry => {
    const date = entry.date;
    if (!dataByDate.has(date)) {
      dataByDate.set(date, { date });
    }
    
    const dayData = dataByDate.get(date)!;
    const data = entry.data;

    if (entry.data_type === 'sleep') {
      dayData.sleepScore = data.sleep_score;
      dayData.sleepDuration = data.total_sleep_time_milli ? data.total_sleep_time_milli / (1000 * 60 * 60) : undefined;
    } else if (entry.data_type === 'recovery') {
      dayData.recoveryScore = data.recovery_score;
      dayData.hrv = data.hrv_rmssd_milli;
      dayData.restingHR = data.resting_heart_rate;
    } else if (entry.data_type === 'workout') {
      dayData.workoutStrain = data.strain_score;
      dayData.workoutDuration = data.duration_milli ? data.duration_milli / (1000 * 60 * 60) : undefined;
      dayData.workoutType = data.workout_type;
    }
  });

  // Process food logs - aggregate by date
  const nutritionByDate = new Map<string, { calories: number, protein: number, carbs: number, fats: number }>();
  
  foodLogs.forEach(log => {
    const date = log.date;
    if (!nutritionByDate.has(date)) {
      nutritionByDate.set(date, { calories: 0, protein: 0, carbs: 0, fats: 0 });
    }
    
    const nutrition = nutritionByDate.get(date)!;
    nutrition.calories += log.calories || 0;
    nutrition.protein += log.protein || 0;
    nutrition.carbs += log.carbs || 0;
    nutrition.fats += log.fats || 0;
  });

  nutritionByDate.forEach((nutrition, date) => {
    if (!dataByDate.has(date)) {
      dataByDate.set(date, { date });
    }
    
    const dayData = dataByDate.get(date)!;
    dayData.calories = nutrition.calories;
    dayData.protein = nutrition.protein;
    dayData.carbs = nutrition.carbs;
    dayData.fats = nutrition.fats;
  });

  // Process plan progress
  planProgress.forEach(progress => {
    const date = progress.date;
    if (!dataByDate.has(date)) {
      dataByDate.set(date, { date });
    }
    
    const dayData = dataByDate.get(date)!;
    dayData.weight = progress.weight;
    dayData.adherenceScore = progress.adherence_score;
  });

  return Array.from(dataByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function calculateCorrelations(data: CorrelationData[]): CorrelationResult[] {
  const metrics = [
    'sleepScore', 'sleepDuration', 'recoveryScore', 'hrv', 'restingHR',
    'calories', 'protein', 'carbs', 'fats', 'workoutStrain', 'workoutDuration',
    'weight', 'adherenceScore'
  ];

  const correlations: CorrelationResult[] = [];

  for (let i = 0; i < metrics.length; i++) {
    for (let j = i + 1; j < metrics.length; j++) {
      const metric1 = metrics[i];
      const metric2 = metrics[j];
      
      const correlation = pearsonCorrelation(data, metric1, metric2);
      
      if (!isNaN(correlation) && Math.abs(correlation) > 0.1) {
        const strength = Math.abs(correlation) > 0.7 ? 'strong' : 
                        Math.abs(correlation) > 0.4 ? 'moderate' : 'weak';
        
        correlations.push({
          metric1,
          metric2,
          correlation,
          strength,
          direction: correlation > 0 ? 'positive' : 'negative',
          significance: Math.abs(correlation),
          insights: generateBasicInsight(metric1, metric2, correlation)
        });
      }
    }
  }

  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}

function pearsonCorrelation(data: CorrelationData[], metric1: string, metric2: string): number {
  const pairs = data
    .filter(d => d[metric1 as keyof CorrelationData] != null && d[metric2 as keyof CorrelationData] != null)
    .map(d => [
      Number(d[metric1 as keyof CorrelationData]),
      Number(d[metric2 as keyof CorrelationData])
    ]);

  if (pairs.length < 3) return NaN;

  const n = pairs.length;
  const sum1 = pairs.reduce((sum, pair) => sum + pair[0], 0);
  const sum2 = pairs.reduce((sum, pair) => sum + pair[1], 0);
  const sum1Sq = pairs.reduce((sum, pair) => sum + pair[0] * pair[0], 0);
  const sum2Sq = pairs.reduce((sum, pair) => sum + pair[1] * pair[1], 0);
  const pSum = pairs.reduce((sum, pair) => sum + pair[0] * pair[1], 0);

  const num = pSum - (sum1 * sum2 / n);
  const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));

  return den === 0 ? 0 : num / den;
}

function generateBasicInsight(metric1: string, metric2: string, correlation: number): string {
  const direction = correlation > 0 ? 'increases' : 'decreases';
  const strength = Math.abs(correlation) > 0.7 ? 'strongly' : 
                  Math.abs(correlation) > 0.4 ? 'moderately' : 'weakly';
  
  return `${metric1} ${strength} ${direction} with ${metric2} (r=${correlation.toFixed(3)})`;
}

async function generateAIInsights(correlations: CorrelationResult[], data: CorrelationData[]): Promise<string> {
  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return "AI insights unavailable - OpenAI API key not configured";
    }

    const prompt = `As a health data analyst, provide exactly 3 actionable insights based on these correlations from ${data.length} days of health data:

${correlations.map(c => 
  `• ${c.metric1} vs ${c.metric2}: ${c.correlation.toFixed(3)} (${c.strength} ${c.direction})`
).join('\n')}

Format your response as exactly 3 separate insights, each separated by double line breaks. Each insight should:
1. Focus on one key pattern for health optimization
2. Provide one specific, actionable recommendation
3. Be concise but practical (2-3 sentences max)

Example format:
Insight 1: [Pattern description]. [Actionable recommendation].

Insight 2: [Pattern description]. [Actionable recommendation].

Insight 3: [Pattern description]. [Actionable recommendation].`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a health data analyst specializing in wearable device data and nutrition correlations.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    const aiData = await response.json();
    return aiData.choices[0].message.content;

  } catch (error) {
    console.error('Error generating AI insights:', error);
    return "AI insights temporarily unavailable";
  }
}