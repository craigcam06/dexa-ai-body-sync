import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    console.log('Webhook received:', req.method, req.url);
    
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const body = await req.text();
    console.log('Webhook body:', body);

    // Verify webhook signature (you'll need to implement this based on Whoop's docs)
    // const signature = req.headers.get('X-Whoop-Signature');
    // if (!verifyWebhookSignature(body, signature)) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    const data = JSON.parse(body);
    console.log('Parsed webhook data:', data);

    // Process the webhook data
    // This is where you'd typically:
    // 1. Parse the webhook payload
    // 2. Update your database with new data
    // 3. Trigger any real-time updates to connected clients

    // For now, just log the received data
    console.log('Webhook processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});