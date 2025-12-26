import { Filter, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { formatDate } from '@/lib/formatters';
import type { Activity } from '@/types/database';

interface ReservationFiltersProps {
  filters: {
    date?: string;
    activityId?: string;
    status?: string;
  };
  onFiltersChange: (filters: { date?: string; activityId?: string; status?: string }) => void;
  activities: Activity[] | undefined;
  hasFilters: boolean;
  onClearFilters: () => void;
  datePickerOpen: boolean;
  onDatePickerOpenChange: (open: boolean) => void;
}

export function ReservationFilters({
  filters,
  onFiltersChange,
  activities,
  hasFilters,
  onClearFilters,
  datePickerOpen,
  onDatePickerOpenChange,
}: ReservationFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <Popover open={datePickerOpen} onOpenChange={onDatePickerOpenChange}>
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
              onFiltersChange({ ...filters, date: date ? format(date, 'yyyy-MM-dd') : undefined });
              onDatePickerOpenChange(false);
            }}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <Select
        value={filters.activityId || 'all'}
        onValueChange={(v) => onFiltersChange({ ...filters, activityId: v === 'all' ? undefined : v })}
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
        onValueChange={(v) => onFiltersChange({ ...filters, status: v === 'all' ? undefined : v })}
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
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
