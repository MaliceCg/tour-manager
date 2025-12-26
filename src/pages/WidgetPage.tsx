import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, addMonths, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, CalendarIcon, Users, MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/formatters';
import type { Activity, SlotWithActivity } from '@/types/database';
import { fetchActivity } from '@/services/activities.service';
import { fetchSlotsForDateRange } from '@/services/slots.service';
import { createWidgetReservation } from '@/services/widget.service';

export default function WidgetPage() {
  const { activityId } = useParams<{ activityId: string }>();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [slots, setSlots] = useState<SlotWithActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<SlotWithActivity | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [step, setStep] = useState<'calendar' | 'form' | 'success'>('calendar');

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    people_count: 1,
    pickup_point: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch activity info (directly from the same DB as the app: src/lib/supabase.ts)
  useEffect(() => {
    if (!activityId) return;

    const run = async () => {
      try {
        setError(null);
        const data = await fetchActivity(activityId);
        if (!data) throw new Error('Activité non trouvée');
        setActivity(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      }
    };

    run();
  }, [activityId]);

  // Fetch slots when month changes
  useEffect(() => {
    if (!activityId) return;

    const run = async () => {
      setLoading(true);
      try {
        const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const end = format(endOfMonth(addMonths(currentMonth, 1)), 'yyyy-MM-dd');

        const data = await fetchSlotsForDateRange(start, end, activityId);
        // Keep only slots that still have available seats
        const available = data.filter(s => (s.total_seats - s.reserved_seats) > 0);
        setSlots(available);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [activityId, currentMonth]);

  // Get dates with available slots
  const datesWithSlots = useMemo(() => {
    const dates = new Set<string>();
    slots.forEach(slot => {
      dates.add(slot.date);
    });
    return dates;
  }, [slots]);

  // Get slots for selected date
  const slotsForDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return slots.filter(slot => slot.date === dateStr);
  }, [selectedDate, slots]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: SlotWithActivity) => {
    setSelectedSlot(slot);
    if (slot.default_pickup_point) {
      setFormData(prev => ({ ...prev, pickup_point: slot.default_pickup_point || '' }));
    }
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !activity) return;

    setSubmitting(true);
    try {
      setError(null);

      // Call the secure Postgres function for widget reservations
      const result = await createWidgetReservation({
        slot_id: selectedSlot.id,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        people_count: formData.people_count,
        pickup_point: formData.pickup_point || null,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la réservation');
      }

      // Refresh slots after booking
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(addMonths(currentMonth, 1)), 'yyyy-MM-dd');
      const refreshed = await fetchSlotsForDateRange(start, end, activityId);
      setSlots(refreshed.filter(s => (s.total_seats - s.reserved_seats) > 0));

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  };

  const availableSeats = selectedSlot
    ? selectedSlot.total_seats - selectedSlot.reserved_seats
    : 0;

  if (error && !activity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{activity.name}</CardTitle>
          {activity.description && (
            <CardDescription>{activity.description}</CardDescription>
          )}
          <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
            <Badge variant="secondary" className="text-sm">
              {formatPrice(activity.price)} / personne
            </Badge>
            <Badge variant="outline" className="text-sm">
              <Users className="h-3 w-3 mr-1" />
              {activity.capacity} places max
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {step === 'calendar' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  onMonthChange={setCurrentMonth}
                  locale={fr}
                  className={cn("p-3 pointer-events-auto rounded-md border")}
                  modifiers={{
                    available: (date) => datesWithSlots.has(format(date, 'yyyy-MM-dd'))
                  }}
                  modifiersStyles={{
                    available: { 
                      backgroundColor: 'hsl(var(--primary) / 0.1)',
                      fontWeight: 'bold'
                    }
                  }}
                  disabled={(date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return !datesWithSlots.has(dateStr) || date < new Date(new Date().setHours(0,0,0,0));
                  }}
                />
              </div>

              {loading && (
                <div className="flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {selectedDate && slotsForDate.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-center">
                    Créneaux du {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
                  </h3>
                  <div className="grid gap-2">
                    {slotsForDate.map(slot => {
                      const available = slot.total_seats - slot.reserved_seats;
                      return (
                        <Button
                          key={slot.id}
                          variant="outline"
                          className="w-full justify-between h-auto py-3"
                          onClick={() => handleSlotSelect(slot)}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">{slot.time}</span>
                          </div>
                          <Badge variant={available > 3 ? 'secondary' : 'destructive'}>
                            {available} place{available > 1 ? 's' : ''} disponible{available > 1 ? 's' : ''}
                          </Badge>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedDate && slotsForDate.length === 0 && !loading && (
                <p className="text-center text-muted-foreground">
                  Aucun créneau disponible pour cette date
                </p>
              )}
            </div>
          )}

          {step === 'form' && selectedSlot && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {format(parseISO(selectedSlot.date), 'EEEE d MMMM yyyy', { locale: fr })}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {selectedSlot.time}
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="customer_name">Nom complet *</Label>
                  <Input
                    id="customer_name"
                    required
                    value={formData.customer_name}
                    onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="Jean Dupont"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="customer_email">Email *</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    required
                    value={formData.customer_email}
                    onChange={e => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                    placeholder="jean@example.com"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="customer_phone">Téléphone</Label>
                  <Input
                    id="customer_phone"
                    type="tel"
                    value={formData.customer_phone}
                    onChange={e => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="people_count">Nombre de personnes *</Label>
                  <Input
                    id="people_count"
                    type="number"
                    min={1}
                    max={availableSeats}
                    required
                    value={formData.people_count}
                    onChange={e => setFormData(prev => ({ ...prev, people_count: parseInt(e.target.value) || 1 }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {availableSeats} place{availableSeats > 1 ? 's' : ''} disponible{availableSeats > 1 ? 's' : ''}
                  </p>
                </div>

                {selectedSlot.default_pickup_point && (
                  <div className="grid gap-2">
                    <Label htmlFor="pickup_point" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Point de ramassage
                    </Label>
                    <Input
                      id="pickup_point"
                      value={formData.pickup_point}
                      onChange={e => setFormData(prev => ({ ...prev, pickup_point: e.target.value }))}
                      placeholder="Lieu de rendez-vous"
                    />
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes ou demandes particulières</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Allergies, besoins spécifiques..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total à payer sur place</span>
                  <span className="text-lg font-bold">
                    {formatPrice(activity.price * formData.people_count)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setStep('calendar');
                    setError(null);
                  }}
                >
                  Retour
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Réservation...
                    </>
                  ) : (
                    'Confirmer la réservation'
                  )}
                </Button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-amber-500 mx-auto" />
              <h2 className="text-xl font-semibold">Demande de réservation envoyée !</h2>
              <p className="text-muted-foreground">
                Votre demande est en attente de confirmation. Vous recevrez un email à {formData.customer_email} dès qu'elle sera validée.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
                <p><strong>Activité :</strong> {activity.name}</p>
                <p><strong>Date :</strong> {selectedSlot && format(parseISO(selectedSlot.date), 'EEEE d MMMM yyyy', { locale: fr })}</p>
                <p><strong>Heure :</strong> {selectedSlot?.time}</p>
                <p><strong>Personnes :</strong> {formData.people_count}</p>
                <p><strong>Montant :</strong> {formatPrice(activity.price * formData.people_count)} (à régler sur place)</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
