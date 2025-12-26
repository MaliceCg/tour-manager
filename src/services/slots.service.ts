import { supabase } from '@/lib/supabase';
import type { Slot, SlotWithActivity } from '@/types/database';

export interface CreateSlotInput {
  activity_id: string;
  date: string;
  time: string;
  total_seats: number;
  default_pickup_point: string | null;
  organization_id: string;
}

export interface UpdateSlotInput extends Partial<CreateSlotInput> {
  id: string;
}

// Fetch slots with optional activity filter
export async function fetchSlots(activityId?: string): Promise<SlotWithActivity[]> {
  let query = supabase
    .from('slot')
    .select('*, activity(*)')
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (activityId) {
    query = query.eq('activity_id', activityId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as SlotWithActivity[];
}

// Fetch slots for date range
export async function fetchSlotsForDateRange(startDate: string, endDate: string): Promise<SlotWithActivity[]> {
  const { data, error } = await supabase
    .from('slot')
    .select('*, activity(*)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) throw error;
  return data as SlotWithActivity[];
}

// Fetch single slot
export async function fetchSlot(id: string): Promise<SlotWithActivity | null> {
  const { data, error } = await supabase
    .from('slot')
    .select('*, activity(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as SlotWithActivity | null;
}

// Create slot
export async function createSlot(input: CreateSlotInput): Promise<Slot> {
  const { data, error } = await supabase
    .from('slot')
    .insert({ ...input, reserved_seats: 0 } as never)
    .select()
    .single();

  if (error) throw error;
  return data as Slot;
}

// Update slot
export async function updateSlot(input: UpdateSlotInput): Promise<Slot> {
  const { id, ...updates } = input;

  const { data, error } = await supabase
    .from('slot')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Slot;
}

// Delete slot
export async function deleteSlot(id: string): Promise<void> {
  const { error } = await supabase
    .from('slot')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
