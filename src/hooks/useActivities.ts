import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Activity } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Activity[];
    },
  });
}

export function useActivity(id: string | undefined) {
  return useQuery({
    queryKey: ['activities', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('activity')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Activity | null;
    },
    enabled: !!id,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (activity: Omit<Activity, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('activity')
        .insert(activity as never)
        .select()
        .single();
      
      if (error) throw error;
      return data as Activity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast({ title: 'Activity created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create activity', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...activity }: Partial<Activity> & { id: string }) => {
      const { data, error } = await supabase
        .from('activity')
        .update(activity as never)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Activity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast({ title: 'Activity updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update activity', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('activity')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast({ title: 'Activity deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete activity', description: error.message, variant: 'destructive' });
    },
  });
}
