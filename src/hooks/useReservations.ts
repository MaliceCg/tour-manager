import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Reservation, ReservationWithSlot, Slot } from '@/types/database';
import { toast } from '@/hooks/use-toast';

interface ReservationFilters {
  date?: string;
  activityId?: string;
  status?: string;
  slotId?: string;
}

export function useReservations(filters?: ReservationFilters) {
  return useQuery({
    queryKey: ['reservations', filters],
    queryFn: async () => {
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
    },
  });
}

export function useReservation(id: string | undefined) {
  return useQuery({
    queryKey: ['reservations', 'single', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('reservation')
        .select('*, slot(*, activity(*))')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as ReservationWithSlot | null;
    },
    enabled: !!id,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reservation: Omit<Reservation, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('reservation')
        .insert(reservation as never)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update reserved_seats in slot
      const { data: slotData } = await supabase
        .from('slot')
        .select('reserved_seats')
        .eq('id', reservation.slot_id)
        .single();
      
      if (slotData) {
        const currentSeats = (slotData as Slot).reserved_seats || 0;
        await supabase
          .from('slot')
          .update({ reserved_seats: currentSeats + reservation.people_count } as never)
          .eq('id', reservation.slot_id);
      }
      
      return data as Reservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      toast({ title: 'Reservation created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create reservation', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...reservation }: Partial<Reservation> & { id: string }) => {
      const { data, error } = await supabase
        .from('reservation')
        .update(reservation as never)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Reservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      toast({ title: 'Reservation updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update reservation', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      toast({ title: 'Reservation cancelled successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to cancel reservation', description: error.message, variant: 'destructive' });
    },
  });
}
