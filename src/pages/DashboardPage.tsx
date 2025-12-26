import { useAuth } from '@/features/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Compass, Calendar, Users, TrendingUp, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchActivities } from '@/services/activities.service';
import { fetchReservations } from '@/services/reservations.service';
import { fetchSlots } from '@/services/slots.service';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfToday } from 'date-fns';
import { fr } from 'date-fns/locale';

interface KpiCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function KpiCard({ title, value, description, icon, isLoading }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { organization } = useAuth();

  const { data: activities = [], isLoading: loadingActivities } = useQuery({
    queryKey: ['activities'],
    queryFn: fetchActivities,
  });

  const { data: reservations = [], isLoading: loadingReservations } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => fetchReservations(),
  });

  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['slots'],
    queryFn: () => fetchSlots(),
  });

  const today = format(startOfToday(), 'yyyy-MM-dd');

  const upcomingSlots = slots.filter((s) => s.date >= today);
  const todayReservations = reservations.filter(
    (r) => r.slot?.date === today && r.status !== 'cancelled'
  );
  const confirmedReservations = reservations.filter((r) => r.status === 'confirmed');
  const totalRevenue = confirmedReservations.reduce((sum, r) => sum + (r.amount_paid || 0), 0);

  const isLoading = loadingActivities || loadingReservations || loadingSlots;

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {organization?.name || 'Tableau de bord'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Vue d'ensemble de votre organisation
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Activités"
          value={activities.length}
          description="Activités actives"
          icon={<Compass className="h-4 w-4" />}
          isLoading={loadingActivities}
        />
        <KpiCard
          title="Créneaux à venir"
          value={upcomingSlots.length}
          description={`À partir du ${format(startOfToday(), 'dd/MM', { locale: fr })}`}
          icon={<Calendar className="h-4 w-4" />}
          isLoading={loadingSlots}
        />
        <KpiCard
          title="Réservations du jour"
          value={todayReservations.length}
          description={format(startOfToday(), 'dd MMMM yyyy', { locale: fr })}
          icon={<Users className="h-4 w-4" />}
          isLoading={loadingReservations}
        />
        <KpiCard
          title="Chiffre d'affaires"
          value={`${totalRevenue.toLocaleString('fr-FR')} €`}
          description="Réservations confirmées"
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={loadingReservations}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Résumé des activités</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune activité créée. Commencez par ajouter une activité.
              </p>
            ) : (
              <ul className="space-y-2">
                {activities.slice(0, 5).map((activity) => (
                  <li key={activity.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{activity.name}</span>
                    <span className="text-muted-foreground">
                      {activity.capacity} places · {activity.price} €
                    </span>
                  </li>
                ))}
                {activities.length > 5 && (
                  <li className="text-xs text-muted-foreground">
                    +{activities.length - 5} autres activités
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prochains créneaux</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : upcomingSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun créneau à venir. Planifiez vos prochains créneaux.
              </p>
            ) : (
              <ul className="space-y-2">
                {upcomingSlots.slice(0, 5).map((slot) => (
                  <li key={slot.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{slot.activity?.name || 'Activité'}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(slot.date), 'dd/MM', { locale: fr })} à {slot.time} · {slot.reserved_seats}/{slot.total_seats}
                    </span>
                  </li>
                ))}
                {upcomingSlots.length > 5 && (
                  <li className="text-xs text-muted-foreground">
                    +{upcomingSlots.length - 5} autres créneaux
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}