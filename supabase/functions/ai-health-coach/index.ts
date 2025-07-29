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

    const { message, healthData } = await req.json();
    console.log('Request received:', { message, hasHealthData: !!healthData });

    // Build context from health data including StrongLifts
    let systemContext = "You are a professional health and fitness coach analyzing biometric data. Provide helpful, personalized advice based on the user's data. Keep responses concise and actionable. ";
    
    // Add StrongLifts data analysis
    if (healthData && healthData.stronglifts && healthData.stronglifts.length > 0) {
      const totalVolume = healthData.stronglifts.reduce((sum: number, workout: any) => sum + (workout.volume || 0), 0);
      const uniqueDays = new Set(healthData.stronglifts.map((w: any) => w.date.split('T')[0]));
      const totalWorkouts = uniqueDays.size;
      systemContext += `StrongLifts data: Total ${healthData.stronglifts.length} exercises, ${totalWorkouts} workout days, ${totalVolume.toLocaleString()} lbs total volume. `;
    }
    
    if (healthData) {
      if (healthData.recovery && healthData.recovery.length > 0) {
        const latest = healthData.recovery[healthData.recovery.length - 1];
        const avg = healthData.recovery.reduce((sum: number, r: any) => sum + r.recovery_score, 0) / healthData.recovery.length;
        systemContext += `Recovery data: Latest ${latest.recovery_score}%, average ${avg.toFixed(1)}%, HRV ${latest.hrv_rmssd_milli}ms, RHR ${latest.resting_heart_rate}bpm. `;
      }
      
      if (healthData.sleep && healthData.sleep.length > 0) {
        const latest = healthData.sleep[healthData.sleep.length - 1];
        const hours = (latest.total_sleep_time_milli / (1000 * 60 * 60)).toFixed(1);
        const avgEfficiency = healthData.sleep.reduce((sum: number, s: any) => sum + s.sleep_efficiency_percentage, 0) / healthData.sleep.length;
        systemContext += `Sleep data: Latest ${hours}h total, ${latest.sleep_efficiency_percentage}% efficiency (avg ${avgEfficiency.toFixed(1)}%). `;
      }
      
      if (healthData.workouts && healthData.workouts.length > 0) {
        const latest = healthData.workouts[healthData.workouts.length - 1];
        const weeklyStrain = healthData.workouts.slice(-7).reduce((sum: number, w: any) => sum + w.strain_score, 0);
        systemContext += `Workout data: Latest ${latest.workout_type}, strain ${latest.strain_score}, weekly strain ${weeklyStrain.toFixed(1)}. `;
      }

      if (healthData.journal && healthData.journal.length > 0) {
        const recentEntries = healthData.journal.slice(-3);
        systemContext += `Recent journal insights: ${recentEntries.map((j: any) => `${j.question_text}: ${j.answered_yes ? 'Yes' : 'No'}`).join(', ')}. `;
      }
    }

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
            content: systemContext + "Focus on actionable recommendations for recovery, sleep optimization, training adjustments, and overall health improvements."
          },
          { role: 'user', content: message }
        ],
        max_tokens: 400,
        temperature: 0.7
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