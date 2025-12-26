import { supabase } from '@/lib/supabase';

export interface CreateWidgetReservationInput {
  slot_id: string;
  customer_name: string;
  customer_email: string;
  people_count: number;
  pickup_point?: string | null;
}

export interface WidgetReservationResult {
  success: boolean;
  error?: string;
  reservation_id?: string;
  message?: string;
}

/**
 * Creates a reservation via the secure Postgres function.
 * This function is callable by anonymous users but validates all inputs server-side.
 */
export async function createWidgetReservation(
  input: CreateWidgetReservationInput
): Promise<WidgetReservationResult> {
  const { data, error } = await supabase.rpc('create_widget_reservation', {
    p_slot_id: input.slot_id,
    p_customer_name: input.customer_name,
    p_customer_email: input.customer_email,
    p_people_count: input.people_count,
    p_pickup_point: input.pickup_point || null,
  });

  if (error) {
    console.error('Error calling create_widget_reservation:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la réservation',
    };
  }

  // The function returns a JSON object
  return data as WidgetReservationResult;
}
