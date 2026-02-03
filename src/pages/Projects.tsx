
import React, { useState, useEffect } from 'react';
import { useOutletContext, Link, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProjectWizard from '@/components/ProjectWizard';
import EditProjectDialog from '@/components/EditProjectDialog';
import { DeleteProjectDialog } from '@/components/DeleteProjectDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Users, 
  MoreVertical,
  Building,
  Home,
  Zap,
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  Copy,
  CheckCircle,
  Clock,
  Pause,
  PlayCircle,
  Crown,
  X,
  Map,
  LayoutGrid
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MobilePageWrapper,
} from '@/components/mobile';
import ProjectMapView from '@/components/ProjectMapView';
import { formatProjectStatus } from '@/lib/utils';

interface ContextType {
  language: string;
}

const Projects = () => {
  const { language } = useOutletContext<ContextType>();
  const [searchTerm, setSearchTerm] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Show wizard automatically when on /projects/new route
  useEffect(() => {
    if (location.pathname === '/projects/new') {
      setShowWizard(true);
    }
  }, [location.pathname]);

  const handleCloseWizard = () => {
    setShowWizard(false);
    // Navigate back to projects if we were on /projects/new
    if (location.pathname === '/projects/new') {
      navigate('/projects');
    }
  };

  const translations = {
    en: {
      projects: 'Projects',
      newProject: 'New Project',
      searchProjects: 'Search projects...',
      allProjects: 'All Projects',
      activeProjects: 'Active',
      completedProjects: 'Completed',
      client: 'Client',
      budget: 'Budget',
      progress: 'Progress',
      dueDate: 'Due Date',
      teamMembers: 'Team Members',
      noProjects: 'No projects found',
      createFirst: 'Create your first project',
      edit: 'Edit',
      duplicate: 'Duplicate',
      archive: 'Archive',
      delete: 'Delete',
      changeStatus: 'Change Status',
      statusPlanning: 'Planning',
      statusActive: 'Active',
      statusOnHold: 'On Hold',
      statusCompleted: 'Completed'
    },
    fr: {
      projects: 'Projets',
      newProject: 'Nouveau Projet',
      searchProjects: 'Rechercher projets...',
      allProjects: 'Tous les Projets',
      activeProjects: 'Actifs',
      completedProjects: 'Complétés',
      client: 'Client',
      budget: 'Budget',
      progress: 'Progrès',
      dueDate: 'Échéance',
      teamMembers: 'Membres Équipe',
      noProjects: 'Aucun projet trouvé',
      createFirst: 'Créez votre premier projet',
      edit: 'Modifier',
      duplicate: 'Dupliquer',
      archive: 'Archiver',
      delete: 'Supprimer',
      changeStatus: 'Changer le statut',
      statusPlanning: 'Planification',
      statusActive: 'Actif',
      statusOnHold: 'En attente',
      statusCompleted: 'Complété'
    }
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ['projects', showArchived],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      // Fetch all projects where user is a member (including created by user)
      const { data: membershipData, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id, role')
        .eq('user_id', user.id);
      
      if (membershipError) throw membershipError;
      
      const projectIds = membershipData?.map(m => m.project_id) || [];
      
      if (projectIds.length === 0) return [];
      
      // Fetch projects data
      let query = supabase
        .from('projects')
        .select(`
          *,
          project_members(user_id, role)
        `)
        .in('id', projectIds)
        .order('created_at', { ascending: false });
      
      // Filter by archived status
      if (showArchived) {
        query = query.eq('status', 'archived');
      } else {
        query = query.neq('status', 'archived');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Attach current user's role and ownership to each project
      return (data || []).map(project => ({
        ...project,
        currentUserRole: membershipData?.find(m => m.project_id === project.id)?.role,
        isOwner: project.created_by === user.id
      }));
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    refetchOnMount: 'always', // Always refetch when component mounts
  });

  // Realtime subscription for projects and project_members
  useEffect(() => {
    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_members'
        },
        () => {
          // Refetch when members join or leave projects
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'residential': return Home;
      case 'commercial': return Building;
      case 'infrastructure': return Zap;
      default: return Building;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'on_hold': return 'outline';
      case 'planned': return 'secondary';
      case 'archived': return 'destructive';
      default: return 'outline';
    }
  };

  const filteredProjects = projects?.filter(project => {
    // Search filter
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(project.status);
    
    // Category filter
    const matchesCategory = typeFilters.length === 0 || typeFilters.includes(project.category);
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleTypeFilter = (type: string) => {
    setTypeFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setStatusFilters([]);
    setTypeFilters([]);
  };

  const hasActiveFilters = statusFilters.length > 0 || typeFilters.length > 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'fr' ? 'fr-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Mutations
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: language === 'fr' ? 'Succès' : 'Success',
        description: language === 'fr' ? 'Projet supprimé avec succès' : 'Project deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'fr' ? 'Erreur' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, updates }: { projectId: string; updates: any }) => {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: language === 'fr' ? 'Succès' : 'Success',
        description: language === 'fr' ? 'Projet mis à jour avec succès' : 'Project updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'fr' ? 'Erreur' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const handleDeleteProject = () => {
    if (selectedProject) {
      deleteProjectMutation.mutate(selectedProject.id);
      setDeleteDialogOpen(false);
      setSelectedProject(null);
    }
  };

  const handleArchiveProject = (project: any) => {
    updateProjectMutation.mutate({
      projectId: project.id,
      updates: { status: 'archived' }
    });
  };

  const handleUnarchiveProject = (project: any) => {
    updateProjectMutation.mutate({
      projectId: project.id,
      updates: { status: 'planning' }
    });
  };

  const handleDuplicateProject = async (project: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Extract only the database columns, excluding client-side fields
      const {
        id,
        currentUserRole,
        isOwner,
        project_members,
        created_at,
        updated_at,
        ...projectData
      } = project;

      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          name: `${project.name} (Copy)`,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Creator is automatically added as admin by database trigger
      // No need to manually insert into project_members

      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: language === 'fr' ? 'Succès' : 'Success',
        description: language === 'fr' ? 'Projet dupliqué avec succès' : 'Project duplicated successfully',
      });
    } catch (error: any) {
      toast({
        title: language === 'fr' ? 'Erreur' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleChangeStatus = (project: any, newStatus: string) => {
    updateProjectMutation.mutate({
      projectId: project.id,
      updates: { status: newStatus }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return Clock;
      case 'active': return PlayCircle;
      case 'on_hold': return Pause;
      case 'completed': return CheckCircle;
      case 'archived': return Archive;
      default: return Clock;
    }
  };

  return (
    <MobilePageWrapper
      title={t.projects}
      subtitle={language === 'fr' ? 'Gérez vos projets de construction' : 'Manage your construction projects'}
      actions={
        <div className="flex items-center gap-2">
          {/* Mobile: Icon button */}
          <Button size="icon" className="md:hidden h-9 w-9 rounded-full bg-primary" onClick={() => setShowWizard(true)}>
            <Plus className="h-4 w-4" />
          </Button>
          {/* Desktop: Full button */}
          <Button className="hidden md:inline-flex" onClick={() => setShowWizard(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t.newProject}
          </Button>
        </div>
      }
    >
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1 max-w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.searchProjects}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showArchived ? "default" : "outline"}
            size="sm"
            className="rounded-full h-9"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? <ArchiveRestore className="h-4 w-4 md:mr-2" /> : <Archive className="h-4 w-4 md:mr-2" />}
            <span className="hidden md:inline">{showArchived ? (language === 'fr' ? 'Actifs' : 'Active') : (language === 'fr' ? 'Archivés' : 'Archived')}</span>
          </Button>
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant={hasActiveFilters ? "default" : "outline"} size="sm" className="rounded-full h-9 relative">
                <Filter className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Filter</span>
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                    {statusFilters.length + typeFilters.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-1">
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              
              {/* Status Filters */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <div className="space-y-2">
                  {['planning', 'active', 'on_hold', 'completed'].map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={statusFilters.includes(status)}
                        onCheckedChange={() => toggleStatusFilter(status)}
                      />
                      <label htmlFor={`status-${status}`} className="text-sm cursor-pointer capitalize">
                        {status.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Category Filters */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Category</Label>
                <div className="space-y-2">
                  {['residential', 'commercial', 'infrastructure', 'industrial', 'renovation'].map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={typeFilters.includes(type)}
                        onCheckedChange={() => toggleTypeFilter(type)}
                      />
                      <label htmlFor={`type-${type}`} className="text-sm cursor-pointer capitalize">
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
          
          {/* View Mode Toggle */}
          <div className="flex rounded-full border overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none h-9 px-3"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none h-9 px-3"
              onClick={() => setViewMode('map')}
            >
              <Map className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {!showArchived ? (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.allProjects}</p>
                    <p className="text-2xl font-bold">{projects?.length || 0}</p>
                  </div>
                  <Building className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.activeProjects}</p>
                    <p className="text-2xl font-bold">
                      {projects?.filter(p => p.status === 'active').length || 0}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t.completedProjects}</p>
                    <p className="text-2xl font-bold">
                      {projects?.filter(p => p.status === 'completed').length || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'fr' ? 'Projets Archivés' : 'Archived Projects'}
                  </p>
                  <p className="text-2xl font-bold">{projects?.length || 0}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {language === 'fr' 
                      ? 'Ces projets n\'affectent pas les limites de votre abonnement' 
                      : 'These projects do not count towards your subscription limits'}
                  </p>
                </div>
                <Archive className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Projects View */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : viewMode === 'map' ? (
        /* Map View */
        <ProjectMapView projects={filteredProjects || []} language={language} />
      ) : filteredProjects && filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const ProjectIcon = getProjectTypeIcon('residential'); // Default icon since we don't have project_type
            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <ProjectIcon className="h-5 w-5 text-primary" />
                      <Badge variant={getStatusColor(project.status) as any}>
                        {formatProjectStatus(project.status)}
                      </Badge>
                      {project.isOwner ? (
                        <Badge variant="default" className="text-xs flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          Owner
                        </Badge>
                      ) : (
                        project.currentUserRole && (
                          <Badge 
                            variant="secondary"
                            className="text-xs capitalize"
                          >
                            {project.currentUserRole}
                          </Badge>
                        )
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={(e) => e.preventDefault()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={(e) => {
                          e.preventDefault();
                          setSelectedProject(project);
                          setEditDialogOpen(true);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t.edit}
                        </DropdownMenuItem>
                        
                        {project.isOwner && (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <PlayCircle className="h-4 w-4 mr-2" />
                              {t.changeStatus}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem onClick={(e) => {
                                e.preventDefault();
                                handleChangeStatus(project, 'planning');
                              }}>
                                <Clock className="h-4 w-4 mr-2" />
                                {t.statusPlanning}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.preventDefault();
                                handleChangeStatus(project, 'active');
                              }}>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                {t.statusActive}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.preventDefault();
                                handleChangeStatus(project, 'on_hold');
                              }}>
                                <Pause className="h-4 w-4 mr-2" />
                                {t.statusOnHold}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.preventDefault();
                                handleChangeStatus(project, 'completed');
                              }}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {t.statusCompleted}
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}

                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={(e) => {
                          e.preventDefault();
                          handleDuplicateProject(project);
                        }}>
                          <Copy className="h-4 w-4 mr-2" />
                          {t.duplicate}
                        </DropdownMenuItem>
                        
                        {project.isOwner && (
                          <>
                            {showArchived ? (
                              <DropdownMenuItem onClick={(e) => {
                                e.preventDefault();
                                handleUnarchiveProject(project);
                              }}>
                                <ArchiveRestore className="h-4 w-4 mr-2" />
                                {language === 'fr' ? 'Désarchiver' : 'Unarchive'}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={(e) => {
                                e.preventDefault();
                                handleArchiveProject(project);
                              }}>
                                <Archive className="h-4 w-4 mr-2" />
                                {t.archive}
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedProject(project);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t.delete}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription>
                    {project.description && (
                      <span className="text-sm">
                        {project.description}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>{t.progress}</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                    <Progress value={project.progress || 0} className="h-2" />
                  </div>

                  {/* Budget */}
                  {project.budget > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-muted-foreground">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {t.budget}
                      </span>
                      <span className="font-medium">{formatCurrency(project.budget)}</span>
                    </div>
                  )}

                  {/* Due Date */}
                  {project.end_date && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {t.dueDate}
                      </span>
                      <span className="font-medium">
                        {new Date(project.end_date).toLocaleDateString(
                          language === 'fr' ? 'fr-CA' : 'en-CA'
                        )}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to={`/projects/${project.id}`}>
                        {language === 'fr' ? 'Voir Détails' : 'View Details'}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">{t.noProjects}</h3>
            <p className="text-muted-foreground mb-4">
              {language === 'fr' ? 
                'Commencez par créer votre premier projet de construction' : 
                'Get started by creating your first construction project'
              }
            </p>
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t.createFirst}
            </Button>
          </CardContent>
        </Card>
      )}
      
      {showWizard && (
        <ProjectWizard onClose={handleCloseWizard} />
      )}

      {/* Edit Project Dialog */}
      {selectedProject && (
        <EditProjectDialog 
          project={selectedProject}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          language={language}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteProjectDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        projectId={selectedProject?.id || null}
        projectName={selectedProject?.name || null}
        onConfirm={handleDeleteProject}
        language={language}
      />
    </MobilePageWrapper>
  );
};

export default Projects;
