import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Search, Pencil, XCircle, Filter, X } from 'lucide-react';
import { useReservations, useUpdateReservation, useCancelReservation } from '@/hooks/useReservations';
import { useActivities } from '@/hooks/useActivities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { Reservation, ReservationWithSlot, ReservationStatus, PaymentType } from '@/types/database';

interface ReservationFormData {
  customer_name: string;
  customer_email: string;
  people_count: number;
  amount_paid: number;
  payment_mode: PaymentType;
  pickup_point: string;
  status: ReservationStatus;
}

export default function ReservationsPage() {
  const [filters, setFilters] = useState<{
    date?: string;
    activityId?: string;
    status?: string;
  }>({});
  
  const { data: reservations, isLoading } = useReservations(filters);
  const { data: activities } = useActivities();
  const updateReservation = useUpdateReservation();
  const cancelReservation = useCancelReservation();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationWithSlot | null>(null);
  const [formData, setFormData] = useState<ReservationFormData>({
    customer_name: '',
    customer_email: '',
    people_count: 1,
    amount_paid: 0,
    payment_mode: 'full',
    pickup_point: '',
    status: 'confirmed',
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleOpenEdit = (reservation: ReservationWithSlot) => {
    setSelectedReservation(reservation);
    setFormData({
      customer_name: reservation.customer_name,
      customer_email: reservation.customer_email,
      people_count: reservation.people_count,
      amount_paid: reservation.amount_paid,
      payment_mode: reservation.payment_mode,
      pickup_point: reservation.pickup_point || '',
      status: reservation.status,
    });
    setEditDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservation) return;
    
    await updateReservation.mutateAsync({
      id: selectedReservation.id,
      ...formData,
      pickup_point: formData.pickup_point || null,
    });
    
    setEditDialogOpen(false);
  };

  const handleCancel = async () => {
    if (selectedReservation) {
      await cancelReservation.mutateAsync(selectedReservation.id);
      setCancelDialogOpen(false);
      setSelectedReservation(null);
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasFilters = filters.date || filters.activityId || filters.status;

  const formatDate = (date: string) => {
    try {
      return format(parseISO(date), 'MMM d, yyyy');
    } catch {
      return date;
    }
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, 'h:mm a');
    } catch {
      return time;
    }
  };

  const getStatusBadge = (status: ReservationStatus) => {
    const variants: Record<ReservationStatus, 'default' | 'secondary' | 'destructive'> = {
      confirmed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
    };
    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    );
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Reservations</h1>
          <p className="text-muted-foreground mt-1">Manage all customer bookings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {filters.date ? formatDate(filters.date) : 'Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.date ? parseISO(filters.date) : undefined}
              onSelect={(date) => {
                setFilters({ ...filters, date: date ? format(date, 'yyyy-MM-dd') : undefined });
                setDatePickerOpen(false);
              }}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Select
          value={filters.activityId || 'all'}
          onValueChange={(v) => setFilters({ ...filters, activityId: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Activity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activities</SelectItem>
            {activities?.map((activity) => (
              <SelectItem key={activity.id} value={activity.id}>
                {activity.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status || 'all'}
          onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Reservations List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !reservations?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {hasFilters ? 'No reservations match your filters' : 'No reservations yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reservations.map((reservation) => (
            <Card key={reservation.id} className="group">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-6">
                  <div className="min-w-[140px]">
                    <div className="font-medium">{reservation.customer_name}</div>
                    <div className="text-sm text-muted-foreground">{reservation.customer_email}</div>
                  </div>
                  <div className="min-w-[150px]">
                    <div className="text-sm font-medium">{reservation.slot?.activity?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {reservation.slot?.date && formatDate(reservation.slot.date)} at {reservation.slot?.time && formatTime(reservation.slot.time)}
                    </div>
                  </div>
                  <div className="text-sm">
                    {reservation.people_count} {reservation.people_count === 1 ? 'person' : 'people'}
                  </div>
                  <div className="text-sm">
                    ${reservation.amount_paid.toFixed(2)}
                  </div>
                  {getStatusBadge(reservation.status)}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(reservation)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {reservation.status !== 'cancelled' && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setSelectedReservation(reservation);
                        setCancelDialogOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Reservation</DialogTitle>
              <DialogDescription>
                Update the reservation details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_email">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="people_count">People</Label>
                  <Input
                    id="people_count"
                    type="number"
                    min={1}
                    value={formData.people_count}
                    onChange={(e) => setFormData({ ...formData, people_count: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount_paid">Amount Paid</Label>
                  <Input
                    id="amount_paid"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.amount_paid}
                    onChange={(e) => setFormData({ ...formData, amount_paid: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickup_point">Pickup Point</Label>
                <Input
                  id="pickup_point"
                  value={formData.pickup_point}
                  onChange={(e) => setFormData({ ...formData, pickup_point: e.target.value })}
                  placeholder="e.g., Hotel Lobby"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_mode">Payment Mode</Label>
                  <Select
                    value={formData.payment_mode}
                    onValueChange={(value: PaymentType) => setFormData({ ...formData, payment_mode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full payment</SelectItem>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="on_site">Pay on site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: ReservationStatus) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateReservation.isPending}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel reservation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the reservation for {selectedReservation?.customer_name}. The seat will be released and made available again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep reservation</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancel reservation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
