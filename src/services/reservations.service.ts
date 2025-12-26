import { supabase } from '@/lib/supabase';
import type { Reservation, ReservationWithSlot, Slot } from '@/types/database';

export interface ReservationFilters {
  date?: string;
  activityId?: string;
  status?: string;
  slotId?: string;
}

export interface CreateReservationInput {
  slot_id: string;
  customer_name: string;
  customer_email: string;
  people_count: number;
  amount_paid: number;
  payment_mode: Reservation['payment_mode'];
  pickup_point: string | null;
  status: Reservation['status'];
  organization_id: string;
}

export interface UpdateReservationInput extends Partial<Omit<Reservation, 'id' | 'created_at' | 'slot_id'>> {
  id: string;
}

// Fetch all reservations with optional filters
export async function fetchReservations(filters?: ReservationFilters): Promise<ReservationWithSlot[]> {
  let query = supabase
    .from('reservation')
    .select('*, slot(*, activity(*))')
    .order('created_at', { ascending: false });

  if (filters?.slotId) {
    query = query.eq('slot_id', filters.slotId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) throw error;

  let result = data as ReservationWithSlot[];

  // Filter by date client-side (since date is in slot)
  if (filters?.date) {
    result = result.filter(r => r.slot?.date === filters.date);
  }

  // Filter by activity client-side
  if (filters?.activityId) {
    result = result.filter(r => r.slot?.activity_id === filters.activityId);
  }

  return result;
}

// Fetch single reservation
export async function fetchReservation(id: string): Promise<ReservationWithSlot | null> {
  const { data, error } = await supabase
    .from('reservation')
    .select('*, slot(*, activity(*))')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as ReservationWithSlot | null;
}

// Create reservation and update slot reserved_seats
export async function createReservation(input: CreateReservationInput): Promise<Reservation> {
  const { data, error } = await supabase
    .from('reservation')
    .insert(input as never)
    .select()
    .single();

  if (error) throw error;

  // Update reserved_seats in slot
  const { data: slotData } = await supabase
    .from('slot')
    .select('reserved_seats')
    .eq('id', input.slot_id)
    .single();

  if (slotData) {
    const currentSeats = (slotData as Slot).reserved_seats || 0;
    await supabase
      .from('slot')
      .update({ reserved_seats: currentSeats + input.people_count } as never)
      .eq('id', input.slot_id);
  }

  return data as Reservation;
}

// Update reservation
export async function updateReservation(input: UpdateReservationInput): Promise<Reservation> {
  const { id, ...updates } = input;
  
  const { data, error } = await supabase
    .from('reservation')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Reservation;
}

// Cancel reservation and update slot reserved_seats
export async function cancelReservation(id: string): Promise<ReservationWithSlot> {
  // First get the reservation to know people_count
  const { data: reservationData, error: fetchError } = await supabase
    .from('reservation')
    .select('*, slot(*)')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const reservation = reservationData as ReservationWithSlot;

  // Update status
  const { error: updateError } = await supabase
    .from('reservation')
    .update({ status: 'cancelled' } as never)
    .eq('id', id);

  if (updateError) throw updateError;

  // Update reserved_seats in slot
  if (reservation.slot) {
    const newSeats = Math.max(0, reservation.slot.reserved_seats - reservation.people_count);
    await supabase
      .from('slot')
      .update({ reserved_seats: newSeats } as never)
      .eq('id', reservation.slot_id);
  }

  return reservation;
}
