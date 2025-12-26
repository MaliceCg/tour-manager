import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, ChevronLeft, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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
import type { Slot, SlotWithActivity } from '@/types/database';

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
  const [formData, setFormData] = useState<SlotFormData>({
    activity_id: selectedActivityId,
    date: today,
    time: '09:00',
    total_seats: 10,
    default_pickup_point: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      default_pickup_point: formData.default_pickup_point || null,
    };
    
    if (editingSlot) {
      await updateSlot.mutateAsync({ id: editingSlot.id, ...data });
    } else {
      await createSlot.mutateAsync({
        ...data,
        organization_id: organization?.id || '',
      });
    }
    
    setDialogOpen(false);
  };

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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createSlot.isPending || updateSlot.isPending}>
                {editingSlot ? 'Enregistrer' : 'Créer le créneau'}
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