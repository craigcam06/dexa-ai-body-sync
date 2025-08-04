import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DexaScanResult {
  id: string;
  date: string;
  body_fat_percentage: number;
  lean_mass_kg: number;
  total_weight_kg: number;
  visceral_fat_rating?: number;
  bone_density?: number;
  muscle_mass_kg: number;
  regional_data?: {
    arms?: { fat_percentage: number; lean_mass_kg: number };
    legs?: { fat_percentage: number; lean_mass_kg: number };
    trunk?: { fat_percentage: number; lean_mass_kg: number };
  };
}

interface BodyspecData {
  results: DexaScanResult[];
  latest_scan?: DexaScanResult;
  progress_metrics?: {
    body_fat_change: number;
    lean_mass_change: number;
    total_weight_change: number;
    scan_count: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('BodySpec API Connector called');
    
    const { action } = await req.json();
    
    if (action !== 'fetch_scan_data') {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the authorization header to extract the user's token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client to get user info
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // TODO: Replace with actual BodySpec API call when user provides Bearer token
    // For now, return mock data to demonstrate the integration
    const mockBodyspecData: BodyspecData = {
      results: [
        {
          id: "scan_001",
          date: "2024-01-15",
          body_fat_percentage: 18.5,
          lean_mass_kg: 68.2,
          total_weight_kg: 82.4,
          muscle_mass_kg: 65.1,
          visceral_fat_rating: 3,
          bone_density: 1.25,
          regional_data: {
            arms: { fat_percentage: 15.2, lean_mass_kg: 12.8 },
            legs: { fat_percentage: 16.8, lean_mass_kg: 28.4 },
            trunk: { fat_percentage: 21.3, lean_mass_kg: 27.0 }
          }
        },
        {
          id: "scan_002", 
          date: "2024-02-15",
          body_fat_percentage: 17.8,
          lean_mass_kg: 69.1,
          total_weight_kg: 82.1,
          muscle_mass_kg: 65.8,
          visceral_fat_rating: 2,
          bone_density: 1.26,
          regional_data: {
            arms: { fat_percentage: 14.5, lean_mass_kg: 13.1 },
            legs: { fat_percentage: 16.2, lean_mass_kg: 28.8 },
            trunk: { fat_percentage: 20.1, lean_mass_kg: 27.2 }
          }
        }
      ]
    };

    // Calculate progress metrics
    if (mockBodyspecData.results.length >= 2) {
      const latest = mockBodyspecData.results[mockBodyspecData.results.length - 1];
      const previous = mockBodyspecData.results[mockBodyspecData.results.length - 2];
      
      mockBodyspecData.latest_scan = latest;
      mockBodyspecData.progress_metrics = {
        body_fat_change: latest.body_fat_percentage - previous.body_fat_percentage,
        lean_mass_change: latest.lean_mass_kg - previous.lean_mass_kg,
        total_weight_change: latest.total_weight_kg - previous.total_weight_kg,
        scan_count: mockBodyspecData.results.length
      };
    }

    console.log('Returning BodySpec data for user:', user.id);
    
    return new Response(
      JSON.stringify(mockBodyspecData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in bodyspec-api-connector:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});