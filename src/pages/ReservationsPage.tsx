import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useReservations,
  useCreateReservation,
  useUpdateReservation,
  useCancelReservation,
  useReservationUI,
  ReservationFilters,
  ReservationsList,
  CreateReservationDialog,
  EditReservationDialog,
  CancelReservationDialog,
} from '@/features/reservations';
import { useActivities } from '@/features/activities';
import { useSlots } from '@/features/slots';

export default function ReservationsPage() {
  const { data: activities } = useActivities();
  const { data: slots } = useSlots();

  const ui = useReservationUI(undefined, slots);
  const { data: reservations, isLoading } = useReservations(ui.filters);

  // Re-run UI hook with reservations data
  const uiWithData = useReservationUI(reservations, slots);

  const createReservation = useCreateReservation();
  const updateReservation = useUpdateReservation();
  const cancelReservation = useCancelReservation();

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uiWithData.createFormData.slot_id) return;
    await createReservation.mutateAsync({
      slot_id: uiWithData.createFormData.slot_id,
      customer_name: uiWithData.createFormData.customer_name,
      customer_email: uiWithData.createFormData.customer_email,
      people_count: uiWithData.createFormData.people_count,
      amount_paid: uiWithData.createFormData.amount_paid,
      payment_mode: uiWithData.createFormData.payment_mode,
      pickup_point: uiWithData.createFormData.pickup_point || null,
      status: uiWithData.createFormData.status,
    });
    uiWithData.setCreateDialogOpen(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uiWithData.selectedReservation) return;
    await updateReservation.mutateAsync({
      id: uiWithData.selectedReservation.id,
      ...uiWithData.formData,
      pickup_point: uiWithData.formData.pickup_point || null,
    });
    uiWithData.setEditDialogOpen(false);
  };

  const handleCancel = async () => {
    if (uiWithData.selectedReservation) {
      await cancelReservation.mutateAsync(uiWithData.selectedReservation.id);
      uiWithData.setCancelDialogOpen(false);
      uiWithData.setSelectedReservation(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Reservations</h1>
          <p className="text-muted-foreground mt-1">Manage all customer bookings</p>
        </div>
        <Button onClick={uiWithData.openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Reservation
        </Button>
      </div>

      <ReservationFilters
        filters={uiWithData.filters}
        onFiltersChange={uiWithData.setFilters}
        activities={activities}
        hasFilters={uiWithData.hasFilters}
        onClearFilters={uiWithData.clearFilters}
        datePickerOpen={uiWithData.datePickerOpen}
        onDatePickerOpenChange={uiWithData.setDatePickerOpen}
      />

      <ReservationsList
        upcomingReservations={uiWithData.upcomingReservations}
        pastReservations={uiWithData.pastReservations}
        isLoading={isLoading}
        hasFilters={uiWithData.hasFilters}
        onEdit={uiWithData.openEditDialog}
        onCancel={uiWithData.openCancelDialog}
      />

      <CreateReservationDialog
        open={uiWithData.createDialogOpen}
        onOpenChange={uiWithData.setCreateDialogOpen}
        formData={uiWithData.createFormData}
        onFormDataChange={uiWithData.setCreateFormData}
        selectedActivityForCreate={uiWithData.selectedActivityForCreate}
        onActivityChange={uiWithData.setSelectedActivityForCreate}
        activities={activities}
        availableSlots={uiWithData.availableSlots}
        onSubmit={handleCreateSubmit}
        isPending={createReservation.isPending}
      />

      <EditReservationDialog
        open={uiWithData.editDialogOpen}
        onOpenChange={uiWithData.setEditDialogOpen}
        formData={uiWithData.formData}
        onFormDataChange={uiWithData.setFormData}
        onSubmit={handleEditSubmit}
        isPending={updateReservation.isPending}
      />

      <CancelReservationDialog
        open={uiWithData.cancelDialogOpen}
        onOpenChange={uiWithData.setCancelDialogOpen}
        reservation={uiWithData.selectedReservation}
        onConfirm={handleCancel}
      />
    </div>
  );
}
