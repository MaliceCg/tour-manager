import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';

export function usePendingReservationsCount() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { organization } = useAuth();

  useEffect(() => {
    if (!organization?.id) {
      setCount(0);
      setIsLoading(false);
      return;
    }

    // Fetch count (works on every page because this hook is used in AppLayout)
    const fetchCount = async () => {
      setIsLoading(true);
      try {
        const { data, count: pendingCount, error } = await (supabase as any)
          .from('reservation')
          .select('id', { count: 'exact' })
          .eq('organization_id', organization.id)
          .eq('status', 'pending');

        if (error) throw error;

        // supabase may return count=null depending on configuration; fallback to data length
        setCount(typeof pendingCount === 'number' ? pendingCount : (data?.length ?? 0));
      } catch {
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('pending-reservations-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservation',
          filter: `organization_id=eq.${organization.id}`,
        },
        () => {
          // Refetch count on any change
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id]);

  return { count, isLoading };
}
