import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Shield, User } from 'lucide-react';
import type { AppRole } from '@/features/auth';

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  roles: AppRole[];
}

export default function TeamPage() {
  const { organization, isAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<AppRole>('member');

  // Fetch team members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('organization_id', organization.id);

      if (error) throw error;

      // Fetch roles for each member
      const membersWithRoles: TeamMember[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);
          
          return {
            ...profile,
            roles: (roles || []).map(r => r.role as AppRole)
          };
        })
      );

      return membersWithRoles;
    },
    enabled: !!organization?.id
  });

  // Note: Adding team members requires admin API access or inviting via email
  // For now, this shows existing members

  const handleAddMember = () => {
    toast.info('To add team members, they should sign up and be assigned to your organization.');
    setIsAddDialogOpen(false);
  };

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      // Remove user from organization by setting organization_id to null
      const { error } = await supabase
        .from('profiles')
        .update({ organization_id: null })
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Member removed from organization');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
        <p className="text-muted-foreground">Only admins can manage team members.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">Manage your organization's team</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No team members yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {members.map((member) => (
            <Card key={member.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{member.full_name || 'Unnamed'}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    {member.roles.map((role) => (
                      <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'}>
                        {role}
                      </Badge>
                    ))}
                  </div>
                  {member.id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMember.mutate(member.id)}
                      disabled={removeMember.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Invite a new member to your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              To add a team member, ask them to sign up at the registration page. 
              Then you can assign them to your organization through the database.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
