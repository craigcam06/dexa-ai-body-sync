import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('AI Health Coach function called');
    console.log('Available env vars:', Object.keys(Deno.env.toObject()));
    console.log('OpenAI key exists:', !!openAIApiKey);
    console.log('OpenAI key length:', openAIApiKey?.length || 0);
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key not configured. Please check Supabase secrets.');
    }

    const { message, healthData, planData } = await req.json();
    console.log('Request received:', { message, hasHealthData: !!healthData, hasPlanData: !!planData });

    // Build comprehensive health analysis context with Craig Campbell plan integration
    let systemContext = `You are an advanced AI Health Coach with expertise in exercise science, nutrition, sleep optimization, and recovery strategies, specifically trained on Craig Campbell's coaching methodologies. 

You analyze comprehensive biometric data to provide highly personalized, science-based recommendations. Your responses should be:
- Actionable and specific to the Craig Campbell Aggressive Cut protocol when applicable
- Evidence-based using actual WHOOP data patterns
- Tailored to the user's current metrics and plan adherence
- Include specific targets based on their plan structure
- Provide step-by-step guidance for plan modifications

CRAIG CAMPBELL PROTOCOL EXPERTISE:
- Aggressive cut: 1.5-2.0 lbs/week loss while preserving muscle
- Metabolic flexibility through Lumen tracking
- Fasted training on Wed/Sat with reduced carbs (30g)
- Meal cutoff at 7:30 PM for metabolic benefits
- 230-250g protein, 150-180g carbs, 2300-2400 calories
- StrongLifts 5x5 progression with A/B/C/D/E rotation
- WHOOP-guided training adjustments based on recovery scores

When providing recommendations, always reference:
1. Current WHOOP metrics vs plan targets
2. Plan adherence and suggested modifications
3. Correlation between recovery, sleep, and performance
4. Specific next-day action items
5. Progressive adjustments to maintain momentum

Format responses with clear sections when appropriate (🏋️ Training, 💤 Sleep, 🥗 Nutrition, 🔄 Recovery).
`;

    // Plan-specific context integration
    if (planData) {
      const daysSinceStart = Math.floor((new Date().getTime() - new Date(planData.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      systemContext += `

ACTIVE PLAN CONTEXT:
- Plan: ${planData.plan_name} (Day ${daysSinceStart})
- Type: ${planData.plan_type.toUpperCase()}
- Macros: ${planData.macros.protein_grams}g protein, ${planData.macros.carbs_grams}g carbs, ${planData.macros.calories_target} calories
- Current phase: ${daysSinceStart <= 14 ? 'Initial adaptation' : daysSinceStart <= 42 ? 'Progressive phase' : 'Advanced optimization'}
- Workout rotation: Currently on ${planData.workout_structure ? Object.keys(planData.workout_structure)[Math.floor(daysSinceStart % 5)] || 'Day A' : 'structured program'}

`;
    }

    // Advanced health data analysis
    let healthInsights = "";
    
    if (healthData) {
      // Recovery Analysis with Trends
      if (healthData.recovery && healthData.recovery.length > 0) {
        const latest = healthData.recovery[healthData.recovery.length - 1];
        const recent7 = healthData.recovery.slice(-7);
        const avg7day = recent7.reduce((sum: number, r: any) => sum + r.recovery_score, 0) / recent7.length;
        const avg30day = healthData.recovery.reduce((sum: number, r: any) => sum + r.recovery_score, 0) / healthData.recovery.length;
        const recoveryTrend = avg7day > avg30day ? "improving" : "declining";
        
        healthInsights += `RECOVERY ANALYSIS:
- Current: ${latest.recovery_score}% (7-day avg: ${avg7day.toFixed(1)}%, 30-day avg: ${avg30day.toFixed(1)}%)
- Trend: ${recoveryTrend} (${(avg7day - avg30day).toFixed(1)}% change)
- HRV: ${latest.hrv_rmssd_milli}ms, RHR: ${latest.resting_heart_rate}bpm
- Recovery readiness: ${latest.recovery_score >= 70 ? 'HIGH' : latest.recovery_score >= 50 ? 'MODERATE' : 'LOW'}

`;
      }
      
      // Sleep Analysis with Efficiency Patterns
      if (healthData.sleep && healthData.sleep.length > 0) {
        const latest = healthData.sleep[healthData.sleep.length - 1];
        const recent7 = healthData.sleep.slice(-7);
        const avgSleep = recent7.reduce((sum: number, s: any) => sum + (s.total_sleep_time_milli / (1000 * 60 * 60)), 0) / recent7.length;
        const avgEfficiency = recent7.reduce((sum: number, s: any) => sum + s.sleep_efficiency_percentage, 0) / recent7.length;
        const hours = (latest.total_sleep_time_milli / (1000 * 60 * 60)).toFixed(1);
        
        healthInsights += `SLEEP ANALYSIS:
- Last night: ${hours}h (${latest.sleep_efficiency_percentage}% efficiency)
- 7-day avg: ${avgSleep.toFixed(1)}h (${avgEfficiency.toFixed(1)}% efficiency)
- Sleep debt: ${avgSleep < 7.5 ? `${(7.5 - avgSleep).toFixed(1)}h deficit` : 'optimal'}
- Quality indicators: ${latest.sleep_efficiency_percentage >= 85 ? 'EXCELLENT' : latest.sleep_efficiency_percentage >= 75 ? 'GOOD' : 'NEEDS IMPROVEMENT'}

`;
      }
      
      // Training Load & Workout Analysis
      if (healthData.workouts && healthData.workouts.length > 0) {
        const recent7 = healthData.workouts.slice(-7);
        const weeklyStrain = recent7.reduce((sum: number, w: any) => sum + w.strain_score, 0);
        const avgStrain = weeklyStrain / recent7.length;
        const workoutTypes = [...new Set(recent7.map((w: any) => w.workout_type))];
        
        healthInsights += `TRAINING ANALYSIS:
- Weekly strain: ${weeklyStrain.toFixed(1)} (avg per workout: ${avgStrain.toFixed(1)})
- Training load: ${weeklyStrain > 60 ? 'HIGH' : weeklyStrain > 40 ? 'MODERATE' : 'LOW'}
- Recent activities: ${workoutTypes.join(', ')}
- Volume trend: ${recent7.length >= 4 ? 'Consistent' : 'Variable'}

`;
      }

      // StrongLifts Strength Training Analysis
      if (healthData.stronglifts && healthData.stronglifts.length > 0) {
        const totalVolume = healthData.stronglifts.reduce((sum: number, workout: any) => sum + (workout.volume || 0), 0);
        const uniqueDays = new Set(healthData.stronglifts.map((w: any) => w.date.split('T')[0]));
        const totalWorkouts = uniqueDays.size;
        const exercises = [...new Set(healthData.stronglifts.map((w: any) => w.exercise))];
        
        healthInsights += `STRENGTH TRAINING (StrongLifts):
- Total volume: ${totalVolume.toLocaleString()} lbs across ${totalWorkouts} sessions
- Exercises tracked: ${exercises.join(', ')}
- Training frequency: ${(totalWorkouts / 4).toFixed(1)} sessions/week (recent month)

`;
      }

      // Lifestyle & Journal Insights
      if (healthData.journal && healthData.journal.length > 0) {
        const recentEntries = healthData.journal.slice(-5);
        const stressIndicators = recentEntries.filter((j: any) => j.question_text.toLowerCase().includes('stress')).length;
        const energyIndicators = recentEntries.filter((j: any) => j.question_text.toLowerCase().includes('energy')).length;
        
        healthInsights += `LIFESTYLE FACTORS:
- Recent journal patterns: ${recentEntries.map((j: any) => `${j.question_text}: ${j.answered_yes ? 'Yes' : 'No'}`).join(', ')}
- Stress tracking: ${stressIndicators > 0 ? 'Monitored' : 'Not tracked'}
- Energy tracking: ${energyIndicators > 0 ? 'Monitored' : 'Not tracked'}

`;
      }

      // Add correlation insights
      if (healthData.recovery && healthData.sleep && healthData.recovery.length > 0 && healthData.sleep.length > 0) {
        healthInsights += `CORRELATIONS & INSIGHTS:
- Sleep-Recovery relationship: Monitor how sleep quality affects next-day recovery
- Training-Recovery balance: Current recovery suggests ${healthData.recovery[healthData.recovery.length - 1].recovery_score >= 70 ? 'capacity for higher intensity' : 'need for active recovery'}
- Personalized recommendations based on your unique patterns and goals

`;
      }
    }

    systemContext += healthInsights;

    console.log('Making OpenAI API request...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: systemContext + `

Based on this comprehensive data analysis, provide personalized recommendations that:
1. Address current patterns and trends
2. Suggest specific targets and metrics
3. Include actionable steps for the next 24-48 hours
4. Consider the interplay between recovery, sleep, training, and nutrition
5. Provide progressive strategies for long-term improvement

Always cite specific data points from their metrics when making recommendations.`
          },
          { role: 'user', content: message }
        ],
        max_tokens: 600,
        temperature: 0.3
      }),
    });

    console.log('OpenAI API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI response generated successfully');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-health-coach function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});