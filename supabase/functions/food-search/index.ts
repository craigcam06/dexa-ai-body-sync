import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface USDAFoodItem {
  fdcId: number;
  description: string;
  brandOwner?: string;
  brandName?: string;
  ingredients?: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }>;
  servingSize?: number;
  servingSizeUnit?: string;
}

interface FatSecretFoodItem {
  food_id: string;
  food_name: string;
  brand_name?: string;
  food_type: string;
  food_url: string;
  servings: {
    serving: Array<{
      calcium?: string;
      calories?: string;
      carbohydrate?: string;
      cholesterol?: string;
      fat?: string;
      fiber?: string;
      iron?: string;
      protein?: string;
      sodium?: string;
      sugar?: string;
      serving_description?: string;
      metric_serving_amount?: string;
      metric_serving_unit?: string;
    }>;
  };
}

interface ProcessedFoodItem {
  external_id: string;
  api_source: 'usda' | 'fatsecret';
  name: string;
  brand?: string;
  barcode?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
  sodium_per_100g?: number;
  serving_size_g: number;
  serving_description?: string;
  search_terms: string[];
}

async function searchUSDAFoods(query: string): Promise<ProcessedFoodItem[]> {
  console.log(`Searching USDA for: ${query}`);
  
  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=10&api_key=DEMO_KEY`
    );
    
    if (!response.ok) {
      console.error('USDA API error:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    console.log(`USDA returned ${data.foods?.length || 0} results`);
    
    return (data.foods || []).map((food: USDAFoodItem) => {
      // Extract nutrients
      const nutrients = food.foodNutrients.reduce((acc, nutrient) => {
        switch (nutrient.nutrientId) {
          case 1008: acc.calories = nutrient.value; break;
          case 1003: acc.protein = nutrient.value; break;
          case 1005: acc.carbs = nutrient.value; break;
          case 1004: acc.fats = nutrient.value; break;
          case 1079: acc.fiber = nutrient.value; break;
          case 2000: acc.sugar = nutrient.value; break;
          case 1093: acc.sodium = nutrient.value; break;
        }
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, sodium: 0 });
      
      return {
        external_id: food.fdcId.toString(),
        api_source: 'usda' as const,
        name: food.description,
        brand: food.brandOwner || food.brandName,
        calories_per_100g: nutrients.calories,
        protein_per_100g: nutrients.protein,
        carbs_per_100g: nutrients.carbs,
        fats_per_100g: nutrients.fats,
        fiber_per_100g: nutrients.fiber,
        sugar_per_100g: nutrients.sugar,
        sodium_per_100g: nutrients.sodium / 1000, // Convert mg to g
        serving_size_g: food.servingSize || 100,
        serving_description: food.servingSizeUnit ? `${food.servingSize} ${food.servingSizeUnit}` : undefined,
        search_terms: [food.description.toLowerCase(), ...(food.brandName ? [food.brandName.toLowerCase()] : [])]
      };
    });
  } catch (error) {
    console.error('Error searching USDA:', error);
    return [];
  }
}

async function searchFatSecretFoods(query: string, fatSecretApiKey?: string): Promise<ProcessedFoodItem[]> {
  if (!fatSecretApiKey) {
    console.log('FatSecret API key not provided, skipping FatSecret search');
    return [];
  }
  
  console.log(`Searching FatSecret for: ${query}`);
  
  try {
    // Note: FatSecret requires OAuth 1.0 authentication which is complex
    // For now, we'll return empty array and focus on USDA
    // In production, you'd implement proper OAuth signing
    console.log('FatSecret integration pending OAuth implementation');
    return [];
  } catch (error) {
    console.error('Error searching FatSecret:', error);
    return [];
  }
}

async function searchFoodsByBarcode(barcode: string, fatSecretApiKey?: string): Promise<ProcessedFoodItem[]> {
  console.log(`Searching for barcode: ${barcode}`);
  
  // For now, return empty array as barcode lookup typically requires premium API access
  // USDA doesn't have barcode data, FatSecret requires premium
  console.log('Barcode search not implemented yet');
  return [];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, barcode, cache = true } = await req.json();
    
    if (!query && !barcode) {
      return new Response(
        JSON.stringify({ error: 'Query or barcode parameter required' }),
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
    
    // Get optional FatSecret API key
    const fatSecretApiKey = Deno.env.get('FATSECRET_API_KEY');

    let results: ProcessedFoodItem[] = [];

    if (barcode) {
      // Search by barcode
      if (cache) {
        const { data: cachedResults } = await supabase
          .from('food_items')
          .select('*')
          .eq('barcode', barcode)
          .limit(10);
        
        if (cachedResults && cachedResults.length > 0) {
          console.log(`Found ${cachedResults.length} cached barcode results`);
          return new Response(
            JSON.stringify({ foods: cachedResults, cached: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      results = await searchFoodsByBarcode(barcode, fatSecretApiKey);
    } else {
      // Search by query text
      if (cache) {
        const { data: cachedResults } = await supabase
          .from('food_items')
          .select('*')
          .textSearch('name', query, { type: 'websearch' })
          .limit(10);
        
        if (cachedResults && cachedResults.length > 0) {
          console.log(`Found ${cachedResults.length} cached text results`);
          return new Response(
            JSON.stringify({ foods: cachedResults, cached: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Search APIs in parallel
      const [usdaResults, fatSecretResults] = await Promise.all([
        searchUSDAFoods(query),
        searchFatSecretFoods(query, fatSecretApiKey)
      ]);
      
      results = [...usdaResults, ...fatSecretResults];
    }

    // Cache results if enabled
    if (cache && results.length > 0) {
      console.log(`Caching ${results.length} food items`);
      
      // Insert new food items (ignore conflicts)
      const { error: insertError } = await supabase
        .from('food_items')
        .upsert(results, { 
          onConflict: 'external_id,api_source',
          ignoreDuplicates: true 
        });
      
      if (insertError) {
        console.error('Error caching food items:', insertError);
      }
    }

    console.log(`Returning ${results.length} total results`);
    
    return new Response(
      JSON.stringify({ 
        foods: results,
        cached: false,
        sources: {
          usda: results.filter(f => f.api_source === 'usda').length,
          fatsecret: results.filter(f => f.api_source === 'fatsecret').length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Food search error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});