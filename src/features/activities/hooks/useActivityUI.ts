import { useState } from 'react';
import type { Activity, PaymentType } from '@/types/database';

export interface ActivityFormData {
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

export function useActivityUI() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState<ActivityFormData>(defaultFormData);

  const openCreateDialog = () => {
    setEditingActivity(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const openEditDialog = (activity: Activity) => {
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

  const openDeleteDialog = (activity: Activity) => {
    setDeletingActivity(activity);
    setDeleteDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingActivity(null);
  };

  return {
    // State
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    editingActivity,
    deletingActivity,
    formData,
    setFormData,

    // Actions
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialog,
    closeDeleteDialog,
  };
}
