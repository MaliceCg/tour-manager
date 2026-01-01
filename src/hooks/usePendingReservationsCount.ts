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

    // Fetch initial count
    const fetchCount = async () => {
      setIsLoading(true);
      try {
        const { count: pendingCount, error } = await (supabase as any)
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .eq('status', 'pending');

        if (!error && pendingCount !== null) {
          setCount(pendingCount);
        }
      } catch (e) {
        console.error('Error fetching pending count:', e);
      }
      setIsLoading(false);
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
          table: 'reservations',
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
