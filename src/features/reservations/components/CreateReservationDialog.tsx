import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, formatTime } from '@/lib/formatters';
import type { Activity, SlotWithActivity, PaymentType, ReservationStatus } from '@/types/database';
import type { CreateReservationFormData } from '../hooks/useReservationUI';

interface CreateReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CreateReservationFormData;
  onFormDataChange: (data: CreateReservationFormData) => void;
  selectedActivityForCreate: string;
  onActivityChange: (activityId: string) => void;
  activities: Activity[] | undefined;
  availableSlots: SlotWithActivity[];
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function CreateReservationDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  selectedActivityForCreate,
  onActivityChange,
  activities,
  availableSlots,
  onSubmit,
  isPending,
}: CreateReservationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>New Reservation</DialogTitle>
            <DialogDescription>Create a reservation for a departure</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Activity</Label>
              <Select
                value={selectedActivityForCreate}
                onValueChange={(v) => {
                  onActivityChange(v);
                  onFormDataChange({ ...formData, slot_id: '' });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity" />
                </SelectTrigger>
                <SelectContent>
                  {activities?.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id}>
                      {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Departure</Label>
              <Select
                value={formData.slot_id}
                onValueChange={(v) => {
                  const slot = availableSlots.find((s) => s.id === v);
                  onFormDataChange({
                    ...formData,
                    slot_id: v,
                    pickup_point: slot?.default_pickup_point || '',
                  });
                }}
                disabled={!selectedActivityForCreate}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={selectedActivityForCreate ? 'Select departure' : 'Select activity first'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      {formatDate(slot.date)} at {formatTime(slot.time)} ({slot.total_seats - slot.reserved_seats}{' '}
                      seats left)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create_customer_name">Customer Name</Label>
              <Input
                id="create_customer_name"
                value={formData.customer_name}
                onChange={(e) => onFormDataChange({ ...formData, customer_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_customer_email">Email</Label>
              <Input
                id="create_customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => onFormDataChange({ ...formData, customer_email: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_people_count">People</Label>
                <Input
                  id="create_people_count"
                  type="number"
                  min={1}
                  value={formData.people_count}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, people_count: parseInt(e.target.value) || 1 })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_amount_paid">Amount Paid</Label>
                <Input
                  id="create_amount_paid"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.amount_paid}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, amount_paid: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create_pickup_point">Pickup Point</Label>
              <Input
                id="create_pickup_point"
                value={formData.pickup_point}
                onChange={(e) => onFormDataChange({ ...formData, pickup_point: e.target.value })}
                placeholder="e.g., Hotel Lobby"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select
                  value={formData.payment_mode}
                  onValueChange={(value: PaymentType) =>
                    onFormDataChange({ ...formData, payment_mode: value })
                  }
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
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: ReservationStatus) =>
                    onFormDataChange({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !formData.slot_id}>
              Create Reservation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
