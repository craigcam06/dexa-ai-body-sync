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
    
    console.log('Testing secrets availability:', {
      hasClientId: !!fatSecretClientId,
      hasClientSecret: !!fatSecretClientSecret,
      clientIdLength: fatSecretClientId?.length || 0,
      clientSecretLength: fatSecretClientSecret?.length || 0
    });

    const result = {
      success: true,
      secrets: {
        FATSECRET_CLIENT_ID: !!fatSecretClientId,
        FATSECRET_CLIENT_SECRET: !!fatSecretClientSecret,
        clientIdLength: fatSecretClientId?.length || 0,
        clientSecretLength: fatSecretClientSecret?.length || 0
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in test-secrets function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});