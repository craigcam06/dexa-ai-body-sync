import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Data structures for API responses
interface FatSecretFoodItem {
  food_id: string;
  food_name: string;
  brand_name?: string;
  food_description: string;
  food_url: string;
}

interface ProcessedFoodItem {
  external_id: string;
  api_source: string;
  name: string;
  brand: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  serving_size_g: number;
  serving_description: string | null;
}

// Get FatSecret access token
async function getFatSecretAccessToken(clientId: string, clientSecret: string): Promise<string | null> {
  try {
    console.log('Getting FatSecret access token...');
    const tokenResponse = await fetch('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: 'grant_type=client_credentials&scope=basic'
    });

    if (!tokenResponse.ok) {
      console.error('FatSecret token error:', tokenResponse.status, await tokenResponse.text());
      return null;
    }

    const tokenData = await tokenResponse.json();
    console.log('FatSecret token obtained successfully');
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting FatSecret token:', error);
    return null;
  }
}

// Search FatSecret API
async function searchFatSecretFoods(query: string, clientId?: string, clientSecret?: string): Promise<ProcessedFoodItem[]> {
  if (!clientId || !clientSecret) {
    console.log('FatSecret credentials not provided, skipping FatSecret search');
    return [];
  }

  console.log(`Searching FatSecret for: ${query}`);
  
  try {
    const accessToken = await getFatSecretAccessToken(clientId, clientSecret);
    if (!accessToken) {
      console.error('Failed to get FatSecret access token');
      return [];
    }

    const searchResponse = await fetch('https://platform.fatsecret.com/rest/server.api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${accessToken}`
      },
      body: new URLSearchParams({
        method: 'foods.search',
        search_expression: query,
        format: 'json'
      })
    });

    if (!searchResponse.ok) {
      console.error('FatSecret search error:', searchResponse.status, await searchResponse.text());
      return [];
    }

    const data = await searchResponse.json();
    console.log(`FatSecret returned ${data.foods?.food?.length || 0} results`);
    
    if (!data.foods?.food) {
      return [];
    }

    // Handle both single food and array of foods
    const foods = Array.isArray(data.foods.food) ? data.foods.food : [data.foods.food];
    
    const results: ProcessedFoodItem[] = [];
    
    for (const food of foods) {
      try {
        // Get detailed nutrition info for each food
        const nutritionResponse = await fetch('https://platform.fatsecret.com/rest/server.api', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${accessToken}`
          },
          body: new URLSearchParams({
            method: 'food.get',
            food_id: food.food_id,
            format: 'json'
          })
        });

        if (nutritionResponse.ok) {
          const nutritionData = await nutritionResponse.json();
          const serving = nutritionData.food?.servings?.serving;
          
          if (serving) {
            // Use the first serving or the 100g serving if available
            const servingData = Array.isArray(serving) ? serving[0] : serving;
            
            results.push({
              external_id: food.food_id,
              api_source: 'fatsecret',
              name: food.food_name,
              brand: food.brand_name || null,
              calories_per_100g: parseFloat(servingData.calories || '0'),
              protein_per_100g: parseFloat(servingData.protein || '0'),
              carbs_per_100g: parseFloat(servingData.carbohydrate || '0'),
              fats_per_100g: parseFloat(servingData.fat || '0'),
              serving_size_g: parseFloat(servingData.metric_serving_amount || '100'),
              serving_description: servingData.serving_description || null,
            });
          }
        }
      } catch (nutritionError) {
        console.error('Error getting nutrition for food:', food.food_id, nutritionError);
      }
    }
    
    return results;
  } catch (error) {
    console.error('FatSecret API error:', error);
    return [];
  }
}

// Search foods by barcode using FatSecret
async function searchFoodsByBarcode(barcode: string, clientId?: string, clientSecret?: string): Promise<ProcessedFoodItem[]> {
  if (!clientId || !clientSecret) {
    console.log('FatSecret credentials not provided, skipping barcode search');
    return [];
  }

  console.log(`Searching FatSecret by barcode: ${barcode}`);
  
  try {
    const accessToken = await getFatSecretAccessToken(clientId, clientSecret);
    if (!accessToken) {
      return [];
    }

    const searchResponse = await fetch('https://platform.fatsecret.com/rest/server.api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${accessToken}`
      },
      body: new URLSearchParams({
        method: 'food.find_id_for_barcode',
        barcode: barcode,
        format: 'json'
      })
    });

    if (!searchResponse.ok) {
      console.error('FatSecret barcode search error:', searchResponse.status);
      return [];
    }

    const data = await searchResponse.json();
    
    if (data.food_id?.value) {
      // Get detailed nutrition info for the found food
      const nutritionResponse = await fetch('https://platform.fatsecret.com/rest/server.api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${accessToken}`
        },
        body: new URLSearchParams({
          method: 'food.get',
          food_id: data.food_id.value,
          format: 'json'
        })
      });

      if (nutritionResponse.ok) {
        const nutritionData = await nutritionResponse.json();
        const food = nutritionData.food;
        const serving = food?.servings?.serving;
        
        if (serving) {
          const servingData = Array.isArray(serving) ? serving[0] : serving;
          
          return [{
            external_id: data.food_id.value,
            api_source: 'fatsecret',
            name: food.food_name,
            brand: food.brand_name || null,
            calories_per_100g: parseFloat(servingData.calories || '0'),
            protein_per_100g: parseFloat(servingData.protein || '0'),
            carbs_per_100g: parseFloat(servingData.carbohydrate || '0'),
            fats_per_100g: parseFloat(servingData.fat || '0'),
            serving_size_g: parseFloat(servingData.metric_serving_amount || '100'),
            serving_description: servingData.serving_description || null,
          }];
        }
      }
    }
    
    return [];
  } catch (error) {
    console.error('FatSecret barcode API error:', error);
    return [];
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== FOOD SEARCH REQUEST START ===');
  try {
    const { query, barcode, nlp_mode, cache = true } = await req.json();

    if (!query && !barcode) {
      return new Response(
        JSON.stringify({ error: 'Query or barcode parameter is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get FatSecret credentials from environment
    const fatSecretClientId = Deno.env.get('FATSECRET_CLIENT_ID');
    const fatSecretClientSecret = Deno.env.get('FATSECRET_CLIENT_SECRET');
    
    console.log('FatSecret credentials check:', {
      hasClientId: !!fatSecretClientId,
      hasClientSecret: !!fatSecretClientSecret,
      clientIdLength: fatSecretClientId?.length || 0,
      clientSecretLength: fatSecretClientSecret?.length || 0
    });

    let results: ProcessedFoodItem[] = [];

    if (barcode) {
      console.log('Processing barcode search:', barcode);
      
      // Check cache first for barcode
      const { data: cachedData } = await supabase
        .from('food_items')
        .select('*')
        .eq('barcode', barcode)
        .limit(10);

      if (cachedData && cachedData.length > 0) {
        console.log('Found cached barcode results:', cachedData.length);
        const processedResults = cachedData.map(item => ({
          external_id: item.external_id,
          api_source: item.api_source,
          name: item.name,
          brand: item.brand || null,
          calories_per_100g: Number(item.calories_per_100g),
          protein_per_100g: Number(item.protein_per_100g),
          carbs_per_100g: Number(item.carbs_per_100g),
          fats_per_100g: Number(item.fats_per_100g),
          serving_size_g: Number(item.serving_size_g || 100),
          serving_description: item.serving_description || null,
        }));

        return new Response(JSON.stringify({
          foods: processedResults,
          cached: true,
          sources: { fatsecret: cachedData.length }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('No cached barcode results, searching FatSecret API');
      results = await searchFoodsByBarcode(barcode, fatSecretClientId, fatSecretClientSecret);
      console.log('FatSecret barcode results:', results.length);

    } else if (query) {
      console.log('Processing query search:', query);
      
      // Check cache first for query
      const { data: cachedData } = await supabase
        .from('food_items')
        .select('*')
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%,search_terms.cs.{${query}}`)
        .limit(10);

      if (cachedData && cachedData.length > 0) {
        console.log('Found cached query results:', cachedData.length);
        const processedResults = cachedData.map(item => ({
          external_id: item.external_id,
          api_source: item.api_source,
          name: item.name,
          brand: item.brand || null,
          calories_per_100g: Number(item.calories_per_100g),
          protein_per_100g: Number(item.protein_per_100g),
          carbs_per_100g: Number(item.carbs_per_100g),
          fats_per_100g: Number(item.fats_per_100g),
          serving_size_g: Number(item.serving_size_g || 100),
          serving_description: item.serving_description || null,
        }));

        return new Response(JSON.stringify({
          foods: processedResults,
          cached: true,
          sources: { fatsecret: cachedData.length }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('No cached results, searching FatSecret API');
      results = await searchFatSecretFoods(query, fatSecretClientId, fatSecretClientSecret);
      console.log('FatSecret search results:', results.length);
    }

    // Cache results if enabled and we have results
    if (cache && results.length > 0) {
      console.log(`Caching ${results.length} food items`);
      
      const { error: insertError } = await supabase
        .from('food_items')
        .upsert(results, { 
          onConflict: 'external_id,api_source',
          ignoreDuplicates: true 
        });

      if (insertError) {
        console.error('Error caching food items:', insertError);
      } else {
        console.log('Successfully cached food items');
      }
    }

    console.log(`Returning ${results.length} total results`);
    
    return new Response(JSON.stringify({
      foods: results,
      cached: false,
      sources: { fatsecret: results.length }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in food-search function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});