import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOBCCompliance = (projectId?: string) => {
  return useQuery({
    queryKey: ['obc-compliance', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('obc_compliance_items')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId
  });
};

export const useSafetyCompliance = (projectId?: string) => {
  return useQuery({
    queryKey: ['safety-compliance', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('safety_compliance')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId
  });
};

export const useSafetyIncidents = (projectId?: string) => {
  return useQuery({
    queryKey: ['safety-incidents', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('safety_incidents')
        .select('*')
        .eq('project_id', projectId)
        .order('incident_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId
  });
};

export const useInspections = (projectId?: string) => {
  return useQuery({
    queryKey: ['inspections', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('inspections')
        .select('*, permits(permit_number)')
        .eq('project_id', projectId)
        .order('inspection_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId
  });
};

export const useAddOBCCompliance = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase
        .from('obc_compliance_items')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obc-compliance'] });
      toast({
        title: 'Success',
        description: 'OBC compliance item added successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add compliance item',
        variant: 'destructive'
      });
    }
  });
};

export const useAddInspection = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase
        .from('inspections')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast({
        title: 'Success',
        description: 'Inspection scheduled successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add inspection',
        variant: 'destructive'
      });
    }
  });
};

export const useUpdateInspection = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { data: result, error } = await supabase
        .from('inspections')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast({
        title: 'Success',
        description: 'Inspection updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update inspection',
        variant: 'destructive'
      });
    }
  });
};

export const useAddSafetyIncident = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase
        .from('safety_incidents')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-incidents'] });
      toast({
        title: 'Success',
        description: 'Safety incident reported successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to report incident',
        variant: 'destructive'
      });
    }
  });
};
