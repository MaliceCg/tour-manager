import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityCard } from './ActivityCard';
import type { Activity } from '@/types/database';

interface ActivitiesListProps {
  activities: Activity[] | undefined;
  isLoading: boolean;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  onManageSchedule: (activityId: string) => void;
  onCreateNew: () => void;
}

export function ActivitiesList({
  activities,
  isLoading,
  onEdit,
  onDelete,
  onManageSchedule,
  onCreateNew,
}: ActivitiesListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
              <Skeleton className="h-4 w-24 mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!activities?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Aucune activité pour le moment</p>
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Créer votre première activité
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          onEdit={onEdit}
          onDelete={onDelete}
          onManageSchedule={onManageSchedule}
        />
      ))}
    </div>
  );
}