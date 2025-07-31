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

  const url = new URL(req.url)
  
  // Handle GET request (OAuth callback from Whoop)
  if (req.method === 'GET') {
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')
    
    if (error) {
      console.error('OAuth error from Whoop:', error)
      // Redirect to current project URL
      return Response.redirect(`${req.headers.get('origin') || 'https://ca5e6ad9-0815-453c-b8fe-ca7faca99c8d.lovableproject.com'}/?auth=error`)
    }
    
    if (code) {
      console.log('Received authorization code, redirecting to frontend')
      // Redirect to current project URL with the code
      return Response.redirect(`${req.headers.get('origin') || 'https://ca5e6ad9-0815-453c-b8fe-ca7faca99c8d.lovableproject.com'}/?code=${code}`)
    }
    
    return new Response(
      JSON.stringify({ error: 'No authorization code received' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  // Handle POST request (token exchange from frontend)
  if (req.method === 'POST') {
    try {
      const body = await req.json()
      const { code, client_id } = body
      
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
      console.error('Error processing POST request:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to process token exchange request' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
  }

  // Method not allowed
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { 
      status: 405, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
})