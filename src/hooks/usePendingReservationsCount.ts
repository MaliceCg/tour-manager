import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';


export function usePendingReservationsCount() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  

  useEffect(() => {
    let isActive = true;

    const fetchCount = async () => {
      try {
        const { data, count: pendingCount, error } = await (supabase as any)
          .from('reservation')
          .select('id', { count: 'exact' })
          .eq('status', 'pending');

        if (error) throw error;

        const nextCount = typeof pendingCount === 'number' ? pendingCount : (data?.length ?? 0);
        if (isActive) setCount(nextCount);
      } catch {
        if (isActive) setCount(0);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    // initial fetch
    setIsLoading(true);
    fetchCount();

    // reliable refresh even without realtime configuration
    const interval = window.setInterval(fetchCount, 15000);

    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, []);

  return { count, isLoading };
}
