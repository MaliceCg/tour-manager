import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Slot, SlotWithActivity } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export function useSlots(activityId?: string) {
  return useQuery({
    queryKey: ['slots', activityId],
    queryFn: async () => {
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
    },
  });
}

export function useSlotsForDateRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['slots', 'range', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('slot')
        .select('*, activity(*)')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      
      if (error) throw error;
      return data as SlotWithActivity[];
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useSlot(id: string | undefined) {
  return useQuery({
    queryKey: ['slots', 'single', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('slot')
        .select('*, activity(*)')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as SlotWithActivity | null;
    },
    enabled: !!id,
  });
}

export function useCreateSlot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (slot: Omit<Slot, 'id' | 'created_at' | 'reserved_seats'>) => {
      const { data, error } = await supabase
        .from('slot')
        .insert({ ...slot, reserved_seats: 0 } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data as Slot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      toast({ title: 'Departure created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create departure', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateSlot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...slot }: Partial<Slot> & { id: string }) => {
      const { data, error } = await supabase
        .from('slot')
        .update(slot as never)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Slot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      toast({ title: 'Departure updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update departure', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteSlot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('slot')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      toast({ title: 'Departure deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete departure', description: error.message, variant: 'destructive' });
    },
  });
}
