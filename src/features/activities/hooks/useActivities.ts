import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import * as activitiesService from '@/services/activities.service';

export function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: activitiesService.fetchActivities,
  });
}

export function useActivity(id: string | undefined) {
  return useQuery({
    queryKey: ['activities', id],
    queryFn: () => activitiesService.fetchActivity(id!),
    enabled: !!id,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activitiesService.createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast({ title: 'Activité créée avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Échec de la création', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activitiesService.updateActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast({ title: 'Activité mise à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Échec de la mise à jour', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activitiesService.deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast({ title: 'Activité supprimée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Échec de la suppression', description: error.message, variant: 'destructive' });
    },
  });
}