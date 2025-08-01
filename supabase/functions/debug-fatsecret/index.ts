import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const fatSecretClientId = Deno.env.get('FATSECRET_CLIENT_ID');
    const fatSecretClientSecret = Deno.env.get('FATSECRET_CLIENT_SECRET');
    
    console.log('Debug: Testing FatSecret API directly');
    console.log('Credentials available:', !!fatSecretClientId, !!fatSecretClientSecret);

    if (!fatSecretClientId || !fatSecretClientSecret) {
      throw new Error('FatSecret credentials not available');
    }

    // Step 1: Get access token
    console.log('Step 1: Getting access token...');
    const tokenResponse = await fetch('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${fatSecretClientId}:${fatSecretClientSecret}`)}`
      },
      body: 'grant_type=client_credentials&scope=basic'
    });

    console.log('Token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token error response:', errorText);
      throw new Error(`Token request failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token obtained successfully:', !!tokenData.access_token);

    // Step 2: Search for "apple" (simple test)
    console.log('Step 2: Searching for "apple"...');
    const searchResponse = await fetch('https://platform.fatsecret.com/rest/server.api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${tokenData.access_token}`
      },
      body: new URLSearchParams({
        method: 'foods.search',
        search_expression: 'apple',
        format: 'json'
      })
    });

    console.log('Search response status:', searchResponse.status);
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Search error response:', errorText);
      throw new Error(`Search request failed: ${searchResponse.status} - ${errorText}`);
    }

    const searchData = await searchResponse.json();
    console.log('Search data received:', JSON.stringify(searchData, null, 2));

    const result = {
      success: true,
      tokenObtained: !!tokenData.access_token,
      searchStatus: searchResponse.status,
      resultsCount: searchData.foods?.food?.length || 0,
      firstResult: searchData.foods?.food?.[0] || null,
      fullResponse: searchData
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Debug test error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});