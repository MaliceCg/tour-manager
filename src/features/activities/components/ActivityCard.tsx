import { MoreHorizontal, Pencil, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    deposit: 'Deposit required',
    full: 'Full payment',
    on_site: 'Pay on site',
  };
  return labels[type];
}

export function ActivityCard({ activity, onEdit, onDelete, onManageSchedule }: ActivityCardProps) {
  return (
    <Card className="group">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{activity.name}</CardTitle>
          <CardDescription className="line-clamp-2">
            {activity.description || 'No description'}
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
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onManageSchedule(activity.id)}>
              <Clock className="h-4 w-4 mr-2" />
              Manage schedule
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(activity)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-secondary">
            {activity.capacity} seats
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
  );
}
