import { supabase } from '@/lib/supabase';
import type { Activity } from '@/types/database';

export interface CreateActivityInput {
  name: string;
  description: string | null;
  capacity: number;
  price: number;
  payment_type: Activity['payment_type'];
  organization_id: string;
}

export interface UpdateActivityInput extends Partial<Omit<CreateActivityInput, 'organization_id'>> {
  id: string;
}

// Fetch all activities (RLS filters by organization automatically)
export async function fetchActivities(): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activity')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Activity[];
}

// Fetch single activity
export async function fetchActivity(id: string): Promise<Activity | null> {
  const { data, error } = await supabase
    .from('activity')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Activity | null;
}

// Create activity
export async function createActivity(input: CreateActivityInput): Promise<Activity> {
  const { data, error } = await supabase
    .from('activity')
    .insert(input as never)
    .select()
    .single();

  if (error) throw error;
  return data as Activity;
}

// Update activity
export async function updateActivity(input: UpdateActivityInput): Promise<Activity> {
  const { id, ...updates } = input;

  const { data, error } = await supabase
    .from('activity')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Activity;
}

// Delete activity
export async function deleteActivity(id: string): Promise<void> {
  const { error } = await supabase
    .from('activity')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
