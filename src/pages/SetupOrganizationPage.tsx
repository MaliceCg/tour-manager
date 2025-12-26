import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';

export default function SetupOrganizationPage() {
  const { isAuthenticated, isLoading, hasOrganization, createOrganization, joinOrganization, signOut } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (hasOrganization) {
    return <Navigate to="/" replace />;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgName.trim()) {
      toast.error('Please enter an organization name');
      return;
    }

    setIsSubmitting(true);
    const { error } = await createOrganization(orgName.trim());
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Organization created! Welcome aboard.');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgId.trim()) {
      toast.error('Please enter an organization ID');
      return;
    }

    setIsSubmitting(true);
    const { error } = await joinOrganization(orgId.trim());
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Joined organization!');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Set up your organization</CardTitle>
          <CardDescription>
            Create a new organization or join an existing one to start managing activities
          </CardDescription>
        </CardHeader>

        <div className="space-y-6">
          <form onSubmit={handleCreate}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  type="text"
                  placeholder="My Tour Company"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Organization'}
              </Button>
            </CardFooter>
          </form>

          <div className="px-6">
            <div className="h-px w-full bg-border" />
          </div>

          <form onSubmit={handleJoin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgId">Organization ID</Label>
                <Input
                  id="orgId"
                  type="text"
                  placeholder="e.g. 7b3f0c2e-..."
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" variant="secondary" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Joining...' : 'Join Organization'}
              </Button>

              <Button type="button" variant="ghost" className="w-full" onClick={signOut}>
                Sign out
              </Button>
            </CardFooter>
          </form>
        </div>
      </Card>
    </div>
  );
}
