import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Clock, Code, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/formatters';
import type { Activity, PaymentType } from '@/types/database';

interface ActivityCardProps {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  onManageSchedule: (activityId: string) => void;
}

function formatPaymentType(type: PaymentType) {
  const labels: Record<PaymentType, string> = {
    deposit: 'Acompte requis',
    full: 'Paiement complet',
    on_site: 'Paiement sur place',
  };
  return labels[type];
}

export function ActivityCard({ activity, onEdit, onDelete, onManageSchedule }: ActivityCardProps) {
  const [widgetDialogOpen, setWidgetDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const widgetUrl = `${window.location.origin}/widget/${activity.id}`;
  const iframeCode = `<iframe 
  src="${widgetUrl}" 
  width="100%" 
  height="700" 
  frameborder="0" 
  style="max-width: 600px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
</iframe>`;

  const copyWidgetCode = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    toast.success('Code widget copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Card className="group">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">{activity.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {activity.description || 'Aucune description'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(activity)}>
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManageSchedule(activity.id)}>
                <Clock className="h-4 w-4 mr-2" />
                Gérer les créneaux
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setWidgetDialogOpen(true)}>
                <Code className="h-4 w-4 mr-2" />
                Intégrer sur mon site
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(activity)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-secondary">
              {activity.capacity} places
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-secondary">
              {formatPrice(activity.price)}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-secondary">
              {formatPaymentType(activity.payment_type)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={widgetDialogOpen} onOpenChange={setWidgetDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Intégrer le widget de réservation</DialogTitle>
            <DialogDescription>
              Copiez ce code et collez-le dans votre site web pour permettre à vos clients de réserver directement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                value={iframeCode}
                readOnly
                className="font-mono text-xs h-32 resize-none"
              />
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={copyWidgetCode}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-500" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copier
                  </>
                )}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Prévisualisation :</strong></p>
              <a 
                href={widgetUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Ouvrir le widget dans un nouvel onglet →
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}