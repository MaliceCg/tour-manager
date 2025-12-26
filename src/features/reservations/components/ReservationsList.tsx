import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ReservationCard } from './ReservationCard';
import type { ReservationWithSlot } from '@/types/database';

interface ReservationsListProps {
  upcomingReservations: ReservationWithSlot[];
  pastReservations: ReservationWithSlot[];
  isLoading: boolean;
  hasFilters: boolean;
  onEdit: (reservation: ReservationWithSlot) => void;
  onCancel: (reservation: ReservationWithSlot) => void;
}

export function ReservationsList({
  upcomingReservations,
  pastReservations,
  isLoading,
  hasFilters,
  onEdit,
  onCancel,
}: ReservationsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (upcomingReservations.length === 0 && pastReservations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {hasFilters ? 'No reservations match your filters' : 'No reservations yet'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Reservations */}
      {upcomingReservations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Upcoming Reservations</h2>
          {upcomingReservations.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              onEdit={onEdit}
              onCancel={onCancel}
            />
          ))}
        </div>
      )}

      {/* Past Reservations */}
      {pastReservations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Past Reservations</h2>
          {pastReservations.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              onEdit={onEdit}
              onCancel={onCancel}
              isPast
            />
          ))}
        </div>
      )}
    </div>
  );
}
