import { Pencil, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime } from '@/lib/formatters';
import type { ReservationWithSlot, ReservationStatus } from '@/types/database';

interface ReservationCardProps {
  reservation: ReservationWithSlot;
  onEdit: (reservation: ReservationWithSlot) => void;
  onCancel: (reservation: ReservationWithSlot) => void;
  isPast?: boolean;
}

function getStatusBadge(status: ReservationStatus) {
  const variants: Record<ReservationStatus, 'default' | 'secondary' | 'destructive'> = {
    confirmed: 'default',
    pending: 'secondary',
    cancelled: 'destructive',
  };
  const labels: Record<ReservationStatus, string> = {
    confirmed: 'Confirmée',
    pending: 'En attente',
    cancelled: 'Annulée',
  };
  return (
    <Badge variant={variants[status]}>
      {labels[status]}
    </Badge>
  );
}

export function ReservationCard({ reservation, onEdit, onCancel, isPast = false }: ReservationCardProps) {
  return (
    <Card className={`group ${isPast ? 'opacity-60' : ''}`}>
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-6">
          <div className="min-w-[140px]">
            <div className="font-medium">{reservation.customer_name}</div>
            <div className="text-sm text-muted-foreground">{reservation.customer_email}</div>
          </div>
          <div className="min-w-[150px]">
            <div className="text-sm font-medium">{reservation.slot?.activity?.name}</div>
            <div className="text-sm text-muted-foreground">
              {reservation.slot?.date && formatDate(reservation.slot.date)} à{' '}
              {reservation.slot?.time && formatTime(reservation.slot.time)}
            </div>
          </div>
          <div className="text-sm">
            {reservation.people_count} {reservation.people_count === 1 ? 'personne' : 'personnes'}
          </div>
          <div className="text-sm">{reservation.amount_paid.toFixed(2)} €</div>
          {getStatusBadge(reservation.status)}
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => onEdit(reservation)}>
            <Pencil className="h-4 w-4" />
          </Button>
          {reservation.status !== 'cancelled' && (
            <Button variant="ghost" size="icon" onClick={() => onCancel(reservation)}>
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}