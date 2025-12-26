import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, ChevronLeft, Users, CalendarClock } from 'lucide-react';
import { format, parseISO, addWeeks, addMonths, addDays, getDay, startOfWeek, isBefore, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useActivities, useActivity } from '@/features/activities';
import { useSlots, useCreateSlot, useUpdateSlot, useDeleteSlot } from '@/features/slots';
import { useAuth } from '@/features/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import type { Slot, SlotWithActivity } from '@/types/database';

type RecurrenceFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface RecurrenceOptions {
  enabled: boolean;
  frequency: RecurrenceFrequency;
  days: number[]; // 0 = Sunday, 1 = Monday, etc.
  endDate: string;
}

const WEEKDAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
  { value: 0, label: 'Dim' },
];

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Chaque semaine' },
  { value: 'monthly', label: 'Chaque mois' },
  { value: 'quarterly', label: 'Chaque trimestre' },
  { value: 'yearly', label: 'Chaque année' },
];

interface SlotFormData {
  activity_id: string;
  date: string;
  time: string;
  total_seats: number;
  default_pickup_point: string;
}

export default function SchedulePage() {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { organization } = useAuth();
  
  const { data: activities, isLoading: loadingActivities } = useActivities();
  const { data: activity } = useActivity(activityId);
  
  const [selectedActivityId, setSelectedActivityId] = useState(activityId || '');
  const { data: slots, isLoading: loadingSlots } = useSlots(selectedActivityId || undefined);
  
  const createSlot = useCreateSlot();
  const updateSlot = useUpdateSlot();
  const deleteSlot = useDeleteSlot();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<Slot | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  const defaultEndDate = format(addMonths(new Date(), 3), 'yyyy-MM-dd');
  
  const [formData, setFormData] = useState<SlotFormData>({
    activity_id: selectedActivityId,
    date: today,
    time: '09:00',
    total_seats: 10,
    default_pickup_point: '',
  });

  const [recurrence, setRecurrence] = useState<RecurrenceOptions>({
    enabled: false,
    frequency: 'weekly',
    days: [getDay(new Date())], // Default to today's day
    endDate: defaultEndDate,
  });

  const handleActivityChange = (id: string) => {
    setSelectedActivityId(id);
    setFormData(prev => ({ ...prev, activity_id: id }));
    if (id && id !== activityId) {
      navigate(`/schedule/${id}`, { replace: true });
    } else if (!id) {
      navigate('/schedule', { replace: true });
    }
  };

  const handleOpenCreate = () => {
    const selectedActivity = activities?.find(a => a.id === selectedActivityId);
    setEditingSlot(null);
    setFormData({
      activity_id: selectedActivityId,
      date: today,
      time: '09:00',
      total_seats: selectedActivity?.capacity || 10,
      default_pickup_point: '',
    });
    setRecurrence({
      enabled: false,
      frequency: 'weekly',
      days: [getDay(new Date())],
      endDate: format(addMonths(new Date(), 3), 'yyyy-MM-dd'),
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (slot: Slot) => {
    setEditingSlot(slot);
    setFormData({
      activity_id: slot.activity_id,
      date: slot.date,
      time: slot.time,
      total_seats: slot.total_seats,
      default_pickup_point: slot.default_pickup_point || '',
    });
    setDialogOpen(true);
  };

  // Generate all dates based on recurrence settings
  const generateRecurringDates = (): string[] => {
    if (!recurrence.enabled) {
      return [formData.date];
    }

    const dates: string[] = [];
    const startDate = parseISO(formData.date);
    const endDate = parseISO(recurrence.endDate);
    
    // For each selected day, generate dates
    for (const dayOfWeek of recurrence.days) {
      // Find the first occurrence of this day starting from startDate
      let currentDate = startDate;
      const startDayOfWeek = getDay(startDate);
      
      // Calculate days until the target day
      let daysUntilTarget = dayOfWeek - startDayOfWeek;
      if (daysUntilTarget < 0) daysUntilTarget += 7;
      
      currentDate = addDays(startDate, daysUntilTarget);
      
      // If the first occurrence is before start date, move to next week
      if (isBefore(currentDate, startDate)) {
        currentDate = addDays(currentDate, 7);
      }

      // Generate dates based on frequency
      while (!isAfter(currentDate, endDate)) {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
        
        switch (recurrence.frequency) {
          case 'weekly':
            currentDate = addWeeks(currentDate, 1);
            break;
          case 'monthly':
            currentDate = addMonths(currentDate, 1);
            break;
          case 'quarterly':
            currentDate = addMonths(currentDate, 3);
            break;
          case 'yearly':
            currentDate = addMonths(currentDate, 12);
            break;
        }
      }
    }

    // Remove duplicates and sort
    return [...new Set(dates)].sort();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      default_pickup_point: formData.default_pickup_point || null,
    };
    
    if (editingSlot) {
      await updateSlot.mutateAsync({ id: editingSlot.id, ...data });
    } else {
      const datesToCreate = generateRecurringDates();
      
      // Create slots for all dates
      for (const date of datesToCreate) {
        await createSlot.mutateAsync({
          ...data,
          date,
          organization_id: organization?.id || '',
        });
      }
    }
    
    setDialogOpen(false);
  };

  const toggleDay = (day: number) => {
    setRecurrence(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day],
    }));
  };

  const previewCount = recurrence.enabled ? generateRecurringDates().length : 1;

  const handleDelete = async () => {
    if (deletingSlot) {
      await deleteSlot.mutateAsync(deletingSlot.id);
      setDeleteDialogOpen(false);
      setDeletingSlot(null);
    }
  };

  const formatDateDisplay = (date: string) => {
    try {
      return format(parseISO(date), 'EEEE d MMMM yyyy', { locale: fr });
    } catch {
      return date;
    }
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      return `${hours}h${minutes}`;
    } catch {
      return time;
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  
  const futureSlots = slots?.filter(slot => slot.date >= todayStr) || [];
  const pastSlots = slots?.filter(slot => slot.date < todayStr) || [];
  
  futureSlots.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  pastSlots.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  const groupSlotsByDate = (slotsToGroup: SlotWithActivity[]) => {
    return slotsToGroup.reduce((acc, slot) => {
      const date = slot.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(slot);
      return acc;
    }, {} as Record<string, SlotWithActivity[]>);
  };

  const groupedFutureSlots = groupSlotsByDate(futureSlots);
  const groupedPastSlots = groupSlotsByDate(pastSlots);

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        {activityId && (
          <Button variant="ghost" size="icon" onClick={() => navigate('/schedule')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Créneaux</h1>
          <p className="text-muted-foreground mt-1">Gérez les départs de vos activités</p>
        </div>
      </div>

      <div className="mb-6">
        <Label htmlFor="activity-select" className="mb-2 block">Sélectionner une activité</Label>
        {loadingActivities ? (
          <Skeleton className="h-10 w-full max-w-sm" />
        ) : (
          <Select value={selectedActivityId} onValueChange={handleActivityChange}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Choisir une activité..." />
            </SelectTrigger>
            <SelectContent>
              {activities?.map((act) => (
                <SelectItem key={act.id} value={act.id}>
                  {act.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!selectedActivityId ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Sélectionnez une activité pour gérer ses créneaux</p>
          </CardContent>
        </Card>
      ) : loadingSlots ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">
              Créneaux de {activity?.name || 'l\'activité'}
            </h2>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau créneau
            </Button>
          </div>

          {!slots?.length ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">Aucun créneau planifié</p>
                <Button onClick={handleOpenCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le premier créneau
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {futureSlots.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                    Créneaux à venir
                  </h3>
                  <div className="space-y-6">
                    {Object.entries(groupedFutureSlots).map(([date, dateSlots]) => (
                      <div key={date}>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">
                          {formatDateDisplay(date)}
                        </h4>
                        <div className="space-y-2">
                          {dateSlots?.map((slot) => (
                            <Card key={slot.id} className="group">
                              <CardContent className="flex items-center justify-between py-4">
                                <div className="flex items-center gap-4">
                                  <div className="text-lg font-medium w-24">
                                    {formatTime(slot.time)}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>
                                      {slot.reserved_seats}/{slot.total_seats} réservés
                                    </span>
                                  </div>
                                  {slot.default_pickup_point && (
                                    <span className="text-sm text-muted-foreground">
                                      RDV : {slot.default_pickup_point}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(slot)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      setDeletingSlot(slot);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pastSlots.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                    Créneaux passés
                  </h3>
                  <div className="space-y-6 opacity-60">
                    {Object.entries(groupedPastSlots).map(([date, dateSlots]) => (
                      <div key={date}>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">
                          {formatDateDisplay(date)}
                        </h4>
                        <div className="space-y-2">
                          {dateSlots?.map((slot) => (
                            <Card key={slot.id} className="group">
                              <CardContent className="flex items-center justify-between py-4">
                                <div className="flex items-center gap-4">
                                  <div className="text-lg font-medium w-24">
                                    {formatTime(slot.time)}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>
                                      {slot.reserved_seats}/{slot.total_seats} réservés
                                    </span>
                                  </div>
                                  {slot.default_pickup_point && (
                                    <span className="text-sm text-muted-foreground">
                                      RDV : {slot.default_pickup_point}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(slot)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      setDeletingSlot(slot);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingSlot ? 'Modifier le créneau' : 'Nouveau créneau'}</DialogTitle>
              <DialogDescription>
                {editingSlot ? 'Mettre à jour les détails du créneau' : 'Planifier un nouveau créneau'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Heure</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_seats">Nombre de places</Label>
                <Input
                  id="total_seats"
                  type="number"
                  min={1}
                  value={formData.total_seats}
                  onChange={(e) => setFormData({ ...formData, total_seats: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickup_point">Point de rendez-vous (optionnel)</Label>
                <Input
                  id="pickup_point"
                  value={formData.default_pickup_point}
                  onChange={(e) => setFormData({ ...formData, default_pickup_point: e.target.value })}
                  placeholder="ex. Hall de l'hôtel, Entrée de la plage"
                />
              </div>

              {/* Recurrence section - only show when creating */}
              {!editingSlot && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="recurrence-toggle">Récurrence</Label>
                    </div>
                    <Switch
                      id="recurrence-toggle"
                      checked={recurrence.enabled}
                      onCheckedChange={(checked) => setRecurrence(prev => ({ ...prev, enabled: checked }))}
                    />
                  </div>

                  {recurrence.enabled && (
                    <div className="space-y-4 pl-6 animate-fade-in">
                      <div className="space-y-2">
                        <Label>Fréquence</Label>
                        <Select 
                          value={recurrence.frequency} 
                          onValueChange={(value: RecurrenceFrequency) => setRecurrence(prev => ({ ...prev, frequency: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FREQUENCY_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Jours de la semaine</Label>
                        <div className="flex flex-wrap gap-2">
                          {WEEKDAYS.map(day => (
                            <div key={day.value} className="flex items-center">
                              <Checkbox
                                id={`day-${day.value}`}
                                checked={recurrence.days.includes(day.value)}
                                onCheckedChange={() => toggleDay(day.value)}
                              />
                              <Label 
                                htmlFor={`day-${day.value}`} 
                                className="ml-2 text-sm font-normal cursor-pointer"
                              >
                                {day.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="end-date">Date de fin</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={recurrence.endDate}
                          min={formData.date}
                          onChange={(e) => setRecurrence(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                      </div>

                      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                        <strong>{previewCount}</strong> créneau{previewCount > 1 ? 'x' : ''} sera{previewCount > 1 ? 'ont' : ''} créé{previewCount > 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={createSlot.isPending || updateSlot.isPending || (recurrence.enabled && recurrence.days.length === 0)}
              >
                {createSlot.isPending ? 'Création...' : editingSlot ? 'Enregistrer' : `Créer ${previewCount > 1 ? `${previewCount} créneaux` : 'le créneau'}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le créneau ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement ce créneau et toutes les réservations associées. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}