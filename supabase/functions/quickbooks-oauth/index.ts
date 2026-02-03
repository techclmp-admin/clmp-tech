import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const requestBody = await req.json()
    const { action, ...body } = requestBody

    // Input validation for action
    if (!action || typeof action !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid action parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const validActions = ['connect', 'refresh_token', 'disconnect', 'test_connection']
    if (!validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    switch (action) {
      case 'connect': {
        const { authCode, realmId, state } = body

        // Input validation for connect action
        if (!authCode || typeof authCode !== 'string' || authCode.length > 500) {
          return new Response(
            JSON.stringify({ error: 'Invalid or missing authCode' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!realmId || typeof realmId !== 'string' || realmId.length > 100) {
          return new Response(
            JSON.stringify({ error: 'Invalid or missing realmId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // Exchange auth code for tokens
        const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${Deno.env.get('QUICKBOOKS_CLIENT_ID')}:${Deno.env.get('QUICKBOOKS_CLIENT_SECRET')}`)}`
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: Deno.env.get('QUICKBOOKS_REDIRECT_URI') || 'https://clmp.ca/auth/quickbooks/callback'
          })
        })

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange authorization code')
        }

        const tokens = await tokenResponse.json()
        
        // Get company info
        const companyResponse = await fetch(`https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/companyinfo/${realmId}`, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Accept': 'application/json'
          }
        })

        let companyName = 'Unknown Company'
        if (companyResponse.ok) {
          const companyData = await companyResponse.json()
          companyName = companyData?.QueryResponse?.CompanyInfo?.[0]?.CompanyName || 'Unknown Company'
        }

        // Store integration
        const { data: integration, error: integrationError } = await supabase
          .from('quickbooks_integrations')
          .insert({
            user_id: user.id,
            company_id: realmId,
            company_name: companyName,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            scope: tokens.scope || 'com.intuit.quickbooks.accounting',
            realmId: realmId
          })
          .select()
          .single()

        if (integrationError) {
          console.error('Integration error:', integrationError)
          throw new Error('Failed to save integration')
        }

        // Create default export settings
        await supabase
          .from('quickbooks_export_settings')
          .insert({
            integration_id: integration.id,
            auto_sync_enabled: false,
            sync_frequency: 'manual',
            export_customers: true,
            export_invoices: true,
            export_expenses: true,
            export_payments: true,
            export_projects_as_customers: true
          })

        return new Response(JSON.stringify({ success: true, integration }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'refresh_token': {
        const { integration_id } = body
        
        const { data: integration, error: fetchError } = await supabase
          .from('quickbooks_integrations')
          .select('*')
          .eq('id', integration_id)
          .eq('user_id', user.id)
          .single()

        if (fetchError || !integration) {
          throw new Error('Integration not found')
        }

        const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${Deno.env.get('QUICKBOOKS_CLIENT_ID')}:${Deno.env.get('QUICKBOOKS_CLIENT_SECRET')}`)}`
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: integration.refresh_token
          })
        })

        if (!tokenResponse.ok) {
          throw new Error('Failed to refresh token')
        }

        const tokens = await tokenResponse.json()

        const { error: updateError } = await supabase
          .from('quickbooks_integrations')
          .update({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || integration.refresh_token,
            token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', integration_id)

        if (updateError) {
          throw new Error('Failed to update tokens')
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'disconnect': {
        const { integration_id } = body
        
        const { error } = await supabase
          .from('quickbooks_integrations')
          .update({ is_active: false })
          .eq('id', integration_id)
          .eq('user_id', user.id)

        if (error) {
          throw new Error('Failed to disconnect integration')
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'test_connection': {
        const { integration_id } = body
        
        const { data: integration, error: fetchError } = await supabase
          .from('quickbooks_integrations')
          .select('*')
          .eq('id', integration_id)
          .eq('user_id', user.id)
          .single()

        if (fetchError || !integration) {
          throw new Error('Integration not found')
        }

        // Test connection by fetching company info
        const testResponse = await fetch(`https://sandbox-quickbooks.api.intuit.com/v3/company/${integration.realmId}/companyinfo/${integration.realmId}`, {
          headers: {
            'Authorization': `Bearer ${integration.access_token}`,
            'Accept': 'application/json'
          }
        })

        const isConnected = testResponse.ok

        return new Response(JSON.stringify({ 
          success: true, 
          connected: isConnected,
          status: isConnected ? 'connected' : 'error'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

  } catch (error: unknown) {
    console.error('QuickBooks OAuth error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})