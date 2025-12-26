import { useState, useMemo } from 'react';
import { parseISO, isAfter, startOfDay } from 'date-fns';
import type { ReservationWithSlot, ReservationStatus, PaymentType, SlotWithActivity } from '@/types/database';

export interface ReservationFormData {
  customer_name: string;
  customer_email: string;
  people_count: number;
  amount_paid: number;
  payment_mode: PaymentType;
  pickup_point: string;
  status: ReservationStatus;
}

export interface CreateReservationFormData extends ReservationFormData {
  slot_id: string;
}

interface ReservationFilters {
  date?: string;
  activityId?: string;
  status?: string;
}

const defaultFormData: ReservationFormData = {
  customer_name: '',
  customer_email: '',
  people_count: 1,
  amount_paid: 0,
  payment_mode: 'full',
  pickup_point: '',
  status: 'confirmed',
};

const defaultCreateFormData: CreateReservationFormData = {
  slot_id: '',
  customer_name: '',
  customer_email: '',
  people_count: 1,
  amount_paid: 0,
  payment_mode: 'full',
  pickup_point: '',
  status: 'confirmed',
};

export function useReservationUI(reservations: ReservationWithSlot[] | undefined, slots: SlotWithActivity[] | undefined) {
  const [filters, setFilters] = useState<ReservationFilters>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationWithSlot | null>(null);
  const [selectedActivityForCreate, setSelectedActivityForCreate] = useState<string>('');
  const [formData, setFormData] = useState<ReservationFormData>(defaultFormData);
  const [createFormData, setCreateFormData] = useState<CreateReservationFormData>(defaultCreateFormData);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Filter slots by selected activity and only show future slots with available seats
  const availableSlots = useMemo(() => {
    return slots?.filter((slot) => {
      if (selectedActivityForCreate && slot.activity_id !== selectedActivityForCreate) return false;
      const slotDate = parseISO(slot.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (slotDate < today) return false;
      const availableSeats = slot.total_seats - slot.reserved_seats;
      return availableSeats > 0;
    }) || [];
  }, [slots, selectedActivityForCreate]);

  // Separate reservations into upcoming and past
  const { upcomingReservations, pastReservations } = useMemo(() => {
    if (!reservations) return { upcomingReservations: [], pastReservations: [] };

    const today = startOfDay(new Date());

    const upcoming = reservations
      .filter((r) => {
        if (!r.slot?.date) return false;
        const slotDate = startOfDay(parseISO(r.slot.date));
        return isAfter(slotDate, today) || slotDate.getTime() === today.getTime();
      })
      .sort((a, b) => {
        const dateA = a.slot?.date ? parseISO(a.slot.date) : new Date(0);
        const dateB = b.slot?.date ? parseISO(b.slot.date) : new Date(0);
        return dateA.getTime() - dateB.getTime();
      });

    const past = reservations
      .filter((r) => {
        if (!r.slot?.date) return false;
        const slotDate = startOfDay(parseISO(r.slot.date));
        return slotDate.getTime() < today.getTime();
      })
      .sort((a, b) => {
        const dateA = a.slot?.date ? parseISO(a.slot.date) : new Date(0);
        const dateB = b.slot?.date ? parseISO(b.slot.date) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

    return { upcomingReservations: upcoming, pastReservations: past };
  }, [reservations]);

  const hasFilters = filters.date || filters.activityId || filters.status;

  const openCreateDialog = () => {
    setSelectedActivityForCreate('');
    setCreateFormData(defaultCreateFormData);
    setCreateDialogOpen(true);
  };

  const openEditDialog = (reservation: ReservationWithSlot) => {
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

  const openCancelDialog = (reservation: ReservationWithSlot) => {
    setSelectedReservation(reservation);
    setCancelDialogOpen(true);
  };

  const clearFilters = () => {
    setFilters({});
  };

  return {
    // State
    filters,
    setFilters,
    createDialogOpen,
    setCreateDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    cancelDialogOpen,
    setCancelDialogOpen,
    selectedReservation,
    setSelectedReservation,
    selectedActivityForCreate,
    setSelectedActivityForCreate,
    formData,
    setFormData,
    createFormData,
    setCreateFormData,
    datePickerOpen,
    setDatePickerOpen,
    
    // Computed
    availableSlots,
    upcomingReservations,
    pastReservations,
    hasFilters,
    selectedSlot: slots?.find(s => s.id === createFormData.slot_id) as SlotWithActivity | undefined,
    
    // Actions
    openCreateDialog,
    openEditDialog,
    openCancelDialog,
    clearFilters,
  };
}
