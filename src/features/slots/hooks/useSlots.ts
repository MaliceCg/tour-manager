import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import * as slotsService from '@/services/slots.service';

export function useSlots(activityId?: string) {
  return useQuery({
    queryKey: ['slots', activityId],
    queryFn: () => slotsService.fetchSlots(activityId),
  });
}

export function useSlotsForDateRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['slots', 'range', startDate, endDate],
    queryFn: () => slotsService.fetchSlotsForDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useSlot(id: string | undefined) {
  return useQuery({
    queryKey: ['slots', 'single', id],
    queryFn: () => slotsService.fetchSlot(id!),
    enabled: !!id,
  });
}

export function useCreateSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: slotsService.createSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      toast({ title: 'Créneau créé avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Échec de la création du créneau', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: slotsService.updateSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      toast({ title: 'Créneau mis à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Échec de la mise à jour du créneau', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: slotsService.deleteSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      toast({ title: 'Créneau supprimé' });
    },
    onError: (error: Error) => {
      toast({ title: 'Échec de la suppression du créneau', description: error.message, variant: 'destructive' });
    },
  });
}