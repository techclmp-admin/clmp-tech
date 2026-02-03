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

    const { action, integration_id, export_type, entity_ids } = await req.json()

    // Get integration
    const { data: integration, error: integrationError } = await supabase
      .from('quickbooks_integrations')
      .select('*, quickbooks_export_settings(*)')
      .eq('id', integration_id)
      .eq('user_id', user.id)
      .single()

    if (integrationError || !integration) {
      throw new Error('Integration not found')
    }

    // Create sync log
    const { data: syncLog, error: logError } = await supabase
      .from('quickbooks_sync_logs')
      .insert({
        integration_id: integration_id,
        sync_type: export_type,
        direction: 'export',
        status: 'processing'
      })
      .select()
      .single()

    if (logError) {
      throw new Error('Failed to create sync log')
    }

    try {
      let results: { success: number; failed: number; errors: string[] } = { success: 0, failed: 0, errors: [] }

      switch (export_type) {
        case 'projects': {
          // Export projects as customers in QuickBooks
          const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .in('id', entity_ids || [])

          if (projectsError) throw projectsError

          for (const project of projects) {
            try {
              // Check if already mapped
              const { data: existingMapping } = await supabase
                .from('quickbooks_export_mappings')
                .select('*')
                .eq('integration_id', integration_id)
                .eq('local_entity_type', 'project')
                .eq('local_entity_id', project.id)
                .single()

              let quickbooksId = existingMapping?.quickbooks_entity_id

              if (!quickbooksId) {
                // Create customer in QuickBooks
                const customerData = {
                  Name: project.name,
                  CompanyName: project.name,
                  Notes: project.description
                }

                const response = await fetch(`https://sandbox-quickbooks.api.intuit.com/v3/company/${integration.realmId}/customer`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${integration.access_token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(customerData)
                })

                if (!response.ok) {
                  throw new Error(`Failed to create customer: ${response.statusText}`)
                }

                const result = await response.json()
                quickbooksId = result.QueryResponse?.Customer?.[0]?.Id

                // Create mapping
                await supabase
                  .from('quickbooks_export_mappings')
                  .insert({
                    integration_id: integration_id,
                    local_entity_type: 'project',
                    local_entity_id: project.id,
                    quickbooks_entity_type: 'Customer',
                    quickbooks_entity_id: quickbooksId
                  })
              }

              results.success++
            } catch (error: unknown) {
              results.failed++
              const errorMessage = error instanceof Error ? error.message : 'Unknown error'
              results.errors.push(`Project ${project.name}: ${errorMessage}`)
            }
          }
          break;
        }

        case 'expenses': {
          // Export project expenses
          const { data: expenses, error: expensesError } = await supabase
            .from('project_expenses')
            .select('*, projects(name)')
            .in('id', entity_ids || [])

          if (expensesError) throw expensesError

          for (const expense of expenses) {
            try {
              // Get project mapping
              const { data: projectMapping } = await supabase
                .from('quickbooks_export_mappings')
                .select('*')
                .eq('integration_id', integration_id)
                .eq('local_entity_type', 'project')
                .eq('local_entity_id', expense.project_id)
                .single()

              const expenseData = {
                Account: {
                  value: integration.quickbooks_export_settings[0]?.default_expense_account_ref || "1"
                },
                Amount: expense.amount,
                Ref: expense.description,
                Customer: projectMapping ? {
                  value: projectMapping.quickbooks_entity_id
                } : undefined
              }

              const response = await fetch(`https://sandbox-quickbooks.api.intuit.com/v3/company/${integration.realmId}/expense`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${integration.access_token}`,
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(expenseData)
              })

              if (!response.ok) {
                throw new Error(`Failed to create expense: ${response.statusText}`)
              }

              results.success++
            } catch (error: unknown) {
              results.failed++
              const errorMessage = error instanceof Error ? error.message : 'Unknown error'
              results.errors.push(`Expense ${expense.description}: ${errorMessage}`)
            }
          }
          break;
        }

        default:
          throw new Error('Unsupported export type')
      }

      // Update sync log
      await supabase
        .from('quickbooks_sync_logs')
        .update({
          status: 'completed',
          records_processed: results.success + results.failed,
          records_success: results.success,
          records_failed: results.failed,
          error_message: results.errors.length > 0 ? results.errors.join('; ') : null,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id)

      return new Response(JSON.stringify({ 
        success: true, 
        results,
        sync_log_id: syncLog.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (error: unknown) {
      // Update sync log with error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await supabase
        .from('quickbooks_sync_logs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id)

      throw error
    }

  } catch (error: unknown) {
    console.error('QuickBooks export error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})