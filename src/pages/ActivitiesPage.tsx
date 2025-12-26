import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  useActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  useActivityUI,
  ActivitiesList,
  ActivityDialog,
  DeleteActivityDialog,
} from '@/features/activities';

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const { data: activities, isLoading } = useActivities();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();

  const ui = useActivityUI();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ui.editingActivity) {
      await updateActivity.mutateAsync({ id: ui.editingActivity.id, ...ui.formData });
    } else {
      await createActivity.mutateAsync(ui.formData);
    }
    ui.closeDialog();
  };

  const handleDelete = async () => {
    if (ui.deletingActivity) {
      await deleteActivity.mutateAsync(ui.deletingActivity.id);
      ui.closeDeleteDialog();
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Activities</h1>
          <p className="text-muted-foreground mt-1">Manage your tours and experiences</p>
        </div>
        <Button onClick={ui.openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Activity
        </Button>
      </div>

      <ActivitiesList
        activities={activities}
        isLoading={isLoading}
        onEdit={ui.openEditDialog}
        onDelete={ui.openDeleteDialog}
        onManageSchedule={(id) => navigate(`/schedule/${id}`)}
        onCreateNew={ui.openCreateDialog}
      />

      <ActivityDialog
        open={ui.dialogOpen}
        onOpenChange={ui.setDialogOpen}
        editingActivity={ui.editingActivity}
        formData={ui.formData}
        onFormDataChange={ui.setFormData}
        onSubmit={handleSubmit}
        isPending={createActivity.isPending || updateActivity.isPending}
      />

      <DeleteActivityDialog
        open={ui.deleteDialogOpen}
        onOpenChange={ui.setDeleteDialogOpen}
        activity={ui.deletingActivity}
        onConfirm={handleDelete}
      />
    </div>
  );
}
