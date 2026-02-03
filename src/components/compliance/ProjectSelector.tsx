import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";

interface ProjectSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

export const ProjectSelector = ({ value, onChange }: ProjectSelectorProps) => {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['user-projects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .select('*, project_members!inner(user_id, role)')
        .eq('project_members.user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Building2 className="w-4 h-4 animate-pulse" />
        <span className="text-sm">Loading projects...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Building2 className="w-4 h-4" />
        <span className="text-sm">No projects available</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
