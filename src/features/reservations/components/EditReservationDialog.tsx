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
import type { PaymentType, ReservationStatus } from '@/types/database';
import type { ReservationFormData } from '../hooks/useReservationUI';

interface EditReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ReservationFormData;
  onFormDataChange: (data: ReservationFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function EditReservationDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  isPending,
}: EditReservationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Modifier la réservation</DialogTitle>
            <DialogDescription>Mettre à jour les détails de la réservation</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Nom du client</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => onFormDataChange({ ...formData, customer_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_email">Email</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => onFormDataChange({ ...formData, customer_email: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="people_count">Personnes</Label>
                <Input
                  id="people_count"
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
                <Label htmlFor="amount_paid">Montant payé</Label>
                <Input
                  id="amount_paid"
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
              <Label htmlFor="pickup_point">Point de rendez-vous</Label>
              <Input
                id="pickup_point"
                value={formData.pickup_point}
                onChange={(e) => onFormDataChange({ ...formData, pickup_point: e.target.value })}
                placeholder="ex. Hall de l'hôtel"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_mode">Mode de paiement</Label>
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
                    <SelectItem value="full">Paiement complet</SelectItem>
                    <SelectItem value="deposit">Acompte</SelectItem>
                    <SelectItem value="on_site">Sur place</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
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
                    <SelectItem value="confirmed">Confirmée</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}