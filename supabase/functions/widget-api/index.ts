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

  try {
    // Use external Supabase project (where the actual data is)
    const supabaseUrl = Deno.env.get('EXTERNAL_SUPABASE_URL') || Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const path = url.pathname.split('/').filter(Boolean)
    const action = path[path.length - 1] // Last segment is the action

    // GET /widget-api/activity/:id
    if (req.method === 'GET' && action === 'activity') {
      const activityId = url.searchParams.get('id')
      
      if (!activityId) {
        return new Response(
          JSON.stringify({ error: 'Activity ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Fetching activity:', activityId)

      const { data: activity, error } = await supabase
        .from('activity')
        .select('*')
        .eq('id', activityId)
        .single()

      if (error) {
        console.error('Error fetching activity:', error)
        return new Response(
          JSON.stringify({ error: 'Activity not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(activity),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /widget-api/slots?activityId=xxx&startDate=xxx&endDate=xxx
    if (req.method === 'GET' && action === 'slots') {
      const activityId = url.searchParams.get('activityId')
      const startDate = url.searchParams.get('startDate')
      const endDate = url.searchParams.get('endDate')

      if (!activityId) {
        return new Response(
          JSON.stringify({ error: 'Activity ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Fetching slots for activity:', activityId, 'from', startDate, 'to', endDate)

      let query = supabase
        .from('slot')
        .select('*, activity(*)')
        .eq('activity_id', activityId)
        .order('date', { ascending: true })
        .order('time', { ascending: true })

      if (startDate) {
        query = query.gte('date', startDate)
      }
      if (endDate) {
        query = query.lte('date', endDate)
      }

      const { data: slots, error } = await query

      if (error) {
        console.error('Error fetching slots:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch slots' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Filter slots with available seats
      const availableSlots = slots?.filter(slot => 
        slot.total_seats - slot.reserved_seats > 0
      ) || []

      return new Response(
        JSON.stringify(availableSlots),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /widget-api/reservation
    if (req.method === 'POST' && action === 'reservation') {
      const body = await req.json()
      const { 
        slot_id, 
        customer_name, 
        customer_email, 
        customer_phone,
        people_count, 
        pickup_point,
        notes,
        payment_mode
      } = body

      console.log('Creating reservation:', body)

      // Validate required fields
      if (!slot_id || !customer_name || !customer_email || !people_count) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get the slot to check availability and get activity info
      const { data: slot, error: slotError } = await supabase
        .from('slot')
        .select('*, activity(*)')
        .eq('id', slot_id)
        .single()

      if (slotError || !slot) {
        console.error('Error fetching slot:', slotError)
        return new Response(
          JSON.stringify({ error: 'Slot not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check availability
      const availableSeats = slot.total_seats - slot.reserved_seats
      if (people_count > availableSeats) {
        return new Response(
          JSON.stringify({ error: 'Not enough seats available' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate amount (for now, on_site means amount_paid = 0)
      const activity = slot.activity
      const totalPrice = activity.price * people_count
      const amountPaid = payment_mode === 'on_site' ? 0 : totalPrice

      // Create the reservation
      const { data: reservation, error: reservationError } = await supabase
        .from('reservation')
        .insert({
          slot_id,
          customer_name,
          customer_email,
          people_count,
          amount_paid: amountPaid,
          payment_mode: payment_mode || 'on_site',
          pickup_point,
          status: 'confirmed',
          organization_id: slot.organization_id
        })
        .select()
        .single()

      if (reservationError) {
        console.error('Error creating reservation:', reservationError)
        return new Response(
          JSON.stringify({ error: 'Failed to create reservation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update the slot's reserved seats
      const { error: updateError } = await supabase
        .from('slot')
        .update({ reserved_seats: slot.reserved_seats + people_count })
        .eq('id', slot_id)

      if (updateError) {
        console.error('Error updating slot seats:', updateError)
        // Rollback the reservation
        await supabase.from('reservation').delete().eq('id', reservation.id)
        return new Response(
          JSON.stringify({ error: 'Failed to update slot availability' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Reservation created successfully:', reservation.id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          reservation,
          message: 'Réservation confirmée !'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
