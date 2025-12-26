import { useState } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useActivities, useCreateActivity, useUpdateActivity, useDeleteActivity } from '@/hooks/useActivities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Activity, PaymentType } from '@/types/database';

interface ActivityFormData {
  name: string;
  description: string;
  capacity: number;
  price: number;
  payment_type: PaymentType;
}

const defaultFormData: ActivityFormData = {
  name: '',
  description: '',
  capacity: 10,
  price: 0,
  payment_type: 'full',
};

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const { data: activities, isLoading } = useActivities();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState<ActivityFormData>(defaultFormData);

  const handleOpenCreate = () => {
    setEditingActivity(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      name: activity.name,
      description: activity.description || '',
      capacity: activity.capacity,
      price: activity.price,
      payment_type: activity.payment_type,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingActivity) {
      await updateActivity.mutateAsync({
        id: editingActivity.id,
        ...formData,
      });
    } else {
      await createActivity.mutateAsync(formData);
    }
    
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deletingActivity) {
      await deleteActivity.mutateAsync(deletingActivity.id);
      setDeleteDialogOpen(false);
      setDeletingActivity(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatPaymentType = (type: PaymentType) => {
    const labels: Record<PaymentType, string> = {
      deposit: 'Deposit required',
      full: 'Full payment',
      on_site: 'Pay on site',
    };
    return labels[type];
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Activities</h1>
          <p className="text-muted-foreground mt-1">Manage your tours and experiences</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Activity
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : activities?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No activities yet</p>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first activity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activities?.map((activity) => (
            <Card key={activity.id} className="group">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base">{activity.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {activity.description || 'No description'}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenEdit(activity)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/schedule/${activity.id}`)}>
                      <Clock className="h-4 w-4 mr-2" />
                      Manage schedule
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setDeletingActivity(activity);
                        setDeleteDialogOpen(true);
                      }}
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
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingActivity ? 'Edit Activity' : 'New Activity'}</DialogTitle>
              <DialogDescription>
                {editingActivity ? 'Update the activity details' : 'Create a new tour or experience'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sunset Kayak Tour"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the activity..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min={1}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_type">Payment Type</Label>
                <Select
                  value={formData.payment_type}
                  onValueChange={(value: PaymentType) => setFormData({ ...formData, payment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full payment required</SelectItem>
                    <SelectItem value="deposit">Deposit required</SelectItem>
                    <SelectItem value="on_site">Pay on site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createActivity.isPending || updateActivity.isPending}>
                {editingActivity ? 'Save changes' : 'Create activity'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingActivity?.name}" and all associated departures and reservations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
