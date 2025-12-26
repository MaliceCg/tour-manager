import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, addWeeks, subWeeks, parseISO } from 'date-fns';
import { useSlotsForDateRange } from '@/features/slots';
import { useReservations } from '@/features/reservations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { SlotWithActivity, ReservationWithSlot } from '@/types/database';

type ViewMode = 'week' | 'month';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedSlot, setSelectedSlot] = useState<SlotWithActivity | null>(null);

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === 'week') {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      };
    } else {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      };
    }
  }, [currentDate, viewMode]);

  const { data: slots, isLoading } = useSlotsForDateRange(
    format(dateRange.start, 'yyyy-MM-dd'),
    format(dateRange.end, 'yyyy-MM-dd')
  );

  const { data: reservations } = useReservations(
    selectedSlot ? { slotId: selectedSlot.id } : undefined
  );

  const days = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const map: Record<string, SlotWithActivity[]> = {};
    slots?.forEach((slot) => {
      const dateKey = slot.date;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(slot);
    });
    return map;
  }, [slots]);

  const handlePrev = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
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

  const getHeaderText = () => {
    if (viewMode === 'week') {
      return `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Calendar</h1>
          <p className="text-muted-foreground mt-1">Overview of all departures</p>
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
        </div>
        <h2 className="text-lg font-medium">{getHeaderText()}</h2>
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className={cn(
          "grid gap-2",
          viewMode === 'week' ? "grid-cols-7" : "grid-cols-7"
        )}>
          {/* Day headers */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}

          {/* Days */}
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const daySlots = slotsByDate[dateKey] || [];
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <Card 
                key={dateKey}
                className={cn(
                  "min-h-[120px] overflow-hidden",
                  !isCurrentMonth && viewMode === 'month' && "opacity-50",
                  isToday && "ring-1 ring-foreground"
                )}
              >
                <CardHeader className="p-2 pb-1">
                  <CardTitle className={cn(
                    "text-sm font-medium",
                    isToday && "text-foreground"
                  )}>
                    {format(day, 'd')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0 space-y-1">
                  {daySlots.slice(0, 3).map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className="w-full text-left p-1.5 rounded bg-secondary hover:bg-secondary/80 transition-colors text-xs"
                    >
                      <div className="font-medium truncate">
                        {slot.activity?.name || 'Activity'}
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>{formatTime(slot.time)}</span>
                        <span className="flex items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          {slot.total_seats - slot.reserved_seats}
                        </span>
                      </div>
                    </button>
                  ))}
                  {daySlots.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +{daySlots.length - 3} more
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Slot Details Dialog */}
      <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedSlot?.activity?.name}</DialogTitle>
            <DialogDescription>
              {selectedSlot && format(parseISO(selectedSlot.date), 'EEEE, MMMM d, yyyy')} at {selectedSlot && formatTime(selectedSlot.time)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Capacity</span>
              <span>{selectedSlot?.reserved_seats}/{selectedSlot?.total_seats} booked</span>
            </div>
            {selectedSlot?.default_pickup_point && (
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Pickup</span>
                <span>{selectedSlot.default_pickup_point}</span>
              </div>
            )}
            <div>
              <h4 className="font-medium mb-2">Reservations ({reservations?.length || 0})</h4>
              {!reservations?.length ? (
                <p className="text-sm text-muted-foreground">No reservations yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-auto">
                  {reservations.map((res) => (
                    <div key={res.id} className="flex items-center justify-between p-2 rounded bg-secondary text-sm">
                      <div>
                        <div className="font-medium">{res.customer_name}</div>
                        <div className="text-muted-foreground">{res.customer_email}</div>
                      </div>
                      <div className="text-right">
                        <div>{res.people_count} {res.people_count === 1 ? 'person' : 'people'}</div>
                        <div className={cn(
                          "text-xs",
                          res.status === 'cancelled' && "text-destructive"
                        )}>
                          {res.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
