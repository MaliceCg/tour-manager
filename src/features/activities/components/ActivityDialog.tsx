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
            <DialogTitle>{editingActivity ? 'Modifier l\'activité' : 'Nouvelle activité'}</DialogTitle>
            <DialogDescription>
              {editingActivity ? 'Mettez à jour les détails de l\'activité' : 'Créez un nouveau tour ou expérience'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                placeholder="ex. Tour en kayak au coucher du soleil"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
                placeholder="Décrivez l'activité..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacité</Label>
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
                <Label htmlFor="price">Prix</Label>
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
              <Label htmlFor="payment_type">Type de paiement</Label>
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
                  <SelectItem value="full">Paiement complet requis</SelectItem>
                  <SelectItem value="deposit">Acompte requis</SelectItem>
                  <SelectItem value="on_site">Paiement sur place</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {editingActivity ? 'Enregistrer' : 'Créer l\'activité'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}