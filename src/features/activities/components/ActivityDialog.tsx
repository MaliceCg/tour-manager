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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Activity, PaymentType } from '@/types/database';
import type { ActivityFormData } from '../hooks/useActivityUI';

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingActivity: Activity | null;
  formData: ActivityFormData;
  onFormDataChange: (data: ActivityFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function ActivityDialog({
  open,
  onOpenChange,
  editingActivity,
  formData,
  onFormDataChange,
  onSubmit,
  isPending,
}: ActivityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{editingActivity ? 'Edit Activity' : 'New Activity'}</DialogTitle>
            <DialogDescription>
              {editingActivity ? 'Update the activity details' : 'Create a new tour or experience'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                placeholder="e.g., Sunset Kayak Tour"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
                placeholder="Describe the activity..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, capacity: parseInt(e.target.value) || 1 })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.price}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, price: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_type">Payment Type</Label>
              <Select
                value={formData.payment_type}
                onValueChange={(value: PaymentType) =>
                  onFormDataChange({ ...formData, payment_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full payment required</SelectItem>
                  <SelectItem value="deposit">Deposit required</SelectItem>
                  <SelectItem value="on_site">Pay on site</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {editingActivity ? 'Save changes' : 'Create activity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
