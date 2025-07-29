import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    let code, client_id
    
    if (req.method === 'GET') {
      // Handle OAuth callback from Whoop (URL parameters)
      code = url.searchParams.get('code')
      client_id = '641ac502-42e1-4c38-8b51-15e0c5b5cbef'
      
      // If this is a callback with an authorization code, redirect to frontend
      if (code) {
        return Response.redirect(`${url.origin}/?code=${code}`)
      }
    } else if (req.method === 'POST') {
      // Handle POST request from frontend (JSON body)
      const body = await req.json()
      code = body.code
      client_id = body.client_id
    }
    
    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Authorization code is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const clientSecret = Deno.env.get('WHOOP_CLIENT_SECRET')
    
    if (!clientSecret) {
      console.error('Missing WHOOP_CLIENT_SECRET')
      return new Response(
        JSON.stringify({ error: 'OAuth configuration incomplete' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const redirectUri = `https://wkuziiubjtvickimapau.supabase.co/functions/v1/whoop-oauth`

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: client_id,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to exchange authorization code for token' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const tokenData = await tokenResponse.json()
    
    return new Response(
      JSON.stringify(tokenData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in whoop-oauth function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})