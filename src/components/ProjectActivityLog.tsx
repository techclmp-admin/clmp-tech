import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserMinus, UserCog, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface ActivityLog {
  id: string;
  project_id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  metadata: any;
  created_at: string;
}

interface Profile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface ProjectActivityLogProps {
  projectId: string;
}

export function ProjectActivityLog({ projectId }: ProjectActivityLogProps) {
  const queryClient = useQueryClient();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['project-activity-log', projectId],
    queryFn: async () => {
      // Fetch both activity log and role changes
      const [activityLogResult, roleChangesResult] = await Promise.all([
        supabase
          .from('project_activity_log')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('role_changes')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      if (activityLogResult.error) throw activityLogResult.error;
      if (roleChangesResult.error) throw roleChangesResult.error;

      // Combine and convert role changes to activity log format
      const roleChangeActivities = roleChangesResult.data?.map((rc: any) => ({
        id: rc.id,
        project_id: rc.project_id,
        user_id: rc.changed_by,
        action: 'role_changed',
        entity_type: 'role_change',
        entity_id: rc.id,
        description: null,
        metadata: { 
          target_user_id: rc.user_id,
          old_role: rc.old_role,
          new_role: rc.new_role,
          reason: rc.reason 
        },
        created_at: rc.created_at,
      })) || [];

      const allActivities = [
        ...(activityLogResult.data || []),
        ...roleChangeActivities
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Get all unique user IDs
      const userIds = new Set<string>();
      allActivities.forEach((activity: any) => {
        if (activity.user_id) userIds.add(activity.user_id);
        if (activity.metadata?.target_user_id) userIds.add(activity.metadata.target_user_id);
      });

      // Fetch profiles for all users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', Array.from(userIds));

      if (profilesError) throw profilesError;

      // Map profiles by ID
      const profileMap = new Map<string, Profile>();
      profiles?.forEach((profile: any) => {
        profileMap.set(profile.id, profile);
      });

      // Combine activities with profile data
      return allActivities.map((activity: any) => ({
        ...activity,
        user_profile: profileMap.get(activity.user_id),
        target_user_profile: activity.metadata?.target_user_id 
          ? profileMap.get(activity.metadata.target_user_id)
          : null,
      }));
    },
  });

  // Setup realtime subscription
  useEffect(() => {
    const activityChannel = supabase
      .channel('project-activity-log-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_activity_log',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-activity-log', projectId] });
        }
      )
      .subscribe();

    const roleChangesChannel = supabase
      .channel('role-changes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'role_changes',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-activity-log', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(roleChangesChannel);
    };
  }, [projectId, queryClient]);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'member_added':
        return <UserPlus className="h-4 w-4 text-green-600" />;
      case 'member_removed':
        return <UserMinus className="h-4 w-4 text-destructive" />;
      case 'role_changed':
        return <UserCog className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'member_added':
        return 'default';
      case 'member_removed':
        return 'destructive';
      case 'role_changed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getUserName = (profile: Profile | null | undefined) => {
    if (!profile) return 'Unknown User';
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.email || 'Unknown User';
  };

  const getActivityDescription = (activity: any) => {
    const actorName = getUserName(activity.user_profile);
    const targetName = getUserName(activity.target_user_profile);

    switch (activity.action) {
      case 'member_added':
        return (
          <span>
            <span className="font-medium">{actorName}</span> added{' '}
            <span className="font-medium">{targetName}</span> as{' '}
            <Badge variant="outline" className="mx-1 capitalize">
              {activity.metadata?.role || 'member'}
            </Badge>
          </span>
        );
      case 'member_removed':
        return (
          <span>
            <span className="font-medium">{actorName}</span> removed{' '}
            <span className="font-medium">{targetName}</span>
          </span>
        );
      case 'role_changed':
        return (
          <div className="space-y-1">
            <span>
              <span className="font-medium">{actorName}</span> changed{' '}
              <span className="font-medium">{targetName}</span>'s role from{' '}
              <Badge variant="outline" className="mx-1 capitalize">
                {activity.metadata?.old_role}
              </Badge> to{' '}
              <Badge variant="outline" className="mx-1 capitalize">
                {activity.metadata?.new_role}
              </Badge>
            </span>
            {activity.metadata?.reason && (
              <p className="text-xs text-muted-foreground italic mt-1">
                Reason: {activity.metadata.reason}
              </p>
            )}
          </div>
        );
      default:
        return activity.description || `${actorName} performed an action`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Log
        </CardTitle>
        <CardDescription>
          Recent team member changes and activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading activity log...
          </div>
        ) : activities && activities.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {activities.map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-1">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      {getActivityDescription(activity)}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={getActivityColor(activity.action) as any}
                        className="text-xs"
                      >
                        {activity.action.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { 
                          addSuffix: true 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No activity yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
