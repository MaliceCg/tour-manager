import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import * as reservationsService from '@/services/reservations.service';
import type { ReservationFilters } from '@/services/reservations.service';

export function useReservations(filters?: ReservationFilters) {
  return useQuery({
    queryKey: ['reservations', filters],
    queryFn: () => reservationsService.fetchReservations(filters),
  });
}

export function useReservation(id: string | undefined) {
  return useQuery({
    queryKey: ['reservations', 'single', id],
    queryFn: () => reservationsService.fetchReservation(id!),
    enabled: !!id,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reservationsService.createReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      toast({ title: 'Réservation créée avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Échec de la création', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reservationsService.updateReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      toast({ title: 'Réservation mise à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Échec de la mise à jour', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reservationsService.cancelReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      toast({ title: 'Réservation annulée' });
    },
    onError: (error: Error) => {
      toast({ title: "Échec de l'annulation", description: error.message, variant: 'destructive' });
    },
  });
}