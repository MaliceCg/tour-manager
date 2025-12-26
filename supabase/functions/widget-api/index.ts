import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Widget now talks directly to the same database as the app (src/lib/supabase.ts).
  // This backend function is intentionally disabled.
  return new Response(
    JSON.stringify({
      error: 'widget-api disabled',
      message: 'Le widget utilise maintenant des appels directs côté client.',
    }),
    { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
