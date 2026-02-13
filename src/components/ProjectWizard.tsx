import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckCircle, Circle, ArrowRight, ArrowLeft, AlertCircle, Loader2, FolderPlus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { TeamMemberInvite } from "@/components/TeamMemberInvite";
import { useQueryClient } from '@tanstack/react-query';
import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SubscriptionUpgradeModal } from "@/components/SubscriptionUpgradeModal";
import { seedOntarioTemplates } from "@/utils/seedTemplates";

interface TeamMember {
  value: string;
  type: 'email' | 'member_code';
  displayName?: string;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template_data: any;
}

interface WizardStep {
  id: number;
  title: string;
  description: string;
}

const steps: WizardStep[] = [
  { id: 1, title: "Project Basics", description: "Name, description, and category" },
  { id: 2, title: "Timeline & Budget", description: "Dates and financial planning" },
  { id: 3, title: "Template Selection", description: "Choose a project template" },
  { id: 4, title: "Team Setup", description: "Invite team members" },
];

interface ProjectWizardProps {
  onClose: () => void;
}

const ProjectWizard: React.FC<ProjectWizardProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    budget: '',
    location: '',
    templateId: '',
    teamMembers: [] as TeamMember[],
  });
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { limits } = useSubscription();

  React.useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('project_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load project templates",
        variant: "destructive"
      });
    }
  };

  const handleLoadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const result = await seedOntarioTemplates();
      if (!result?.success) {
        throw new Error('No templates were loaded');
      }

      const description =
        typeof result.failed === 'number' && result.failed > 0
          ? `Loaded ${result.count} templates (${result.failed} skipped).`
          : `Loaded ${result.count} templates.`;

      toast({
        title: "Templates Loaded",
        description,
      });
      await fetchTemplates();
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTeamMember = (member: TeamMember) => {
    updateFormData('teamMembers', [...formData.teamMembers, member]);
  };

  const handleRemoveTeamMember = (value: string) => {
    updateFormData('teamMembers', formData.teamMembers.filter(m => m.value !== value));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() && formData.category;
      case 2:
        return formData.startDate && formData.endDate;
      case 3:
        return true; // Template is optional
      case 4:
        return true; // Team members are optional
      default:
        return false;
    }
  };

  const createProject = async () => {
    setLoading(true);
    try {
      // Check subscription limits before creating project
      if (limits && !limits.can_create_project) {
        setShowUpgradeModal(true);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Creating project with data:', {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        start_date: formData.startDate?.toISOString().split('T')[0],
        end_date: formData.endDate?.toISOString().split('T')[0],
        budget: formData.budget ? parseFloat(formData.budget) : null,
        location: formData.location,
        created_by: user.id,
        owner_id: user.id,
        status: 'planning',
        priority: 'medium'
      });

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          start_date: formData.startDate?.toISOString().split('T')[0],
          end_date: formData.endDate?.toISOString().split('T')[0],
          budget: formData.budget ? parseFloat(formData.budget) : null,
          location: formData.location,
          created_by: user.id,
          owner_id: user.id,
          status: 'planning',
          priority: 'medium'
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Add creator as owner in project_members
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: project.id,
          user_id: user.id,
          role: 'owner',
          invited_by: user.id
        });

      if (memberError) {
        console.error('Error adding creator to project members:', memberError);
        // Don't throw - project was created successfully
      }

      // Send team invitations if any
      if (formData.teamMembers.length > 0) {
        // Resolve member codes to emails
        const invitationPromises = formData.teamMembers.map(async (member) => {
          let email = member.value;
          
          // If it's a member code, look up the email
          if (member.type === 'member_code') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('member_code', member.value)
              .single();
            
            if (profile?.email) {
              email = profile.email;
            } else {
              console.warn(`No email found for member code: ${member.value}`);
              return null;
            }
          }
          
          return {
            project_id: project.id,
            invited_by: user.id,
            email,
            role: 'member',
            invitation_token: crypto.randomUUID(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          };
        });

        const invitations = (await Promise.all(invitationPromises)).filter(Boolean);
        
        if (invitations.length > 0) {
          const { error: inviteError } = await supabase
            .from('team_invitations')
            .insert(invitations);

          if (inviteError) throw inviteError;
        }
      }

      // Apply template if selected
      if (formData.templateId) {
        const template = templates.find(t => t.id === formData.templateId);
        if (template && template.template_data.default_tasks) {
          const tasks = template.template_data.default_tasks.map((task: any) => ({
            project_id: project.id,
            title: task.name,
            description: `Task from ${template.name} template`,
            status: 'todo',
            priority: 'medium',
            created_by: user.id,
            tags: task.phase ? [task.phase] : []
          }));

          const { error: tasksError } = await supabase
            .from('project_tasks')
            .insert(tasks);

          if (tasksError) throw tasksError;
        }
      }

      toast({
        title: "Success!",
        description: "Project created successfully"
      });

      // Invalidate projects query to refresh the list immediately
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      navigate(`/projects/${project.id}`);
      onClose();
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Project description"
                rows={3}
              />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(value) => updateFormData('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential Construction</SelectItem>
                  <SelectItem value="commercial">Commercial Construction</SelectItem>
                  <SelectItem value="renovation">Renovation</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <LocationAutocomplete
              value={formData.location}
              onChange={(value) => updateFormData('location', value)}
              placeholder="Search for project location"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => updateFormData('startDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => updateFormData('endDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label htmlFor="budget">Budget (CAD)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => updateFormData('budget', e.target.value)}
                placeholder="Project budget"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg border border-dashed">
              <Label className="text-lg">Choose a Template (Optional)</Label>
              <p className="text-sm text-muted-foreground mt-2">
                Templates include pre-defined phases and tasks to help you get started quickly. 
                You can skip this step and create a blank project, or select a template below.
              </p>
            </div>
            
            {templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 bg-muted/30 rounded-lg border border-dashed">
                <FolderPlus className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Templates Available</h3>
                <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
                  Load professional Ontario construction templates with pre-defined phases, tasks, and compliance requirements.
                </p>
                <Button
                  onClick={handleLoadTemplates}
                  disabled={isLoadingTemplates}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isLoadingTemplates ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Templates...
                    </>
                  ) : (
                    <>
                      <FolderPlus className="mr-2 h-4 w-4" />
                      Load Professional Templates
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card 
                    key={template.id} 
                    className={cn(
                      "cursor-pointer transition-all",
                      formData.templateId === template.id 
                        ? "ring-2 ring-primary shadow-lg" 
                        : "hover:bg-accent hover:shadow-md"
                    )}
                    onClick={() => updateFormData('templateId', template.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        {formData.templateId === template.id ? (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <Badge variant="secondary" className="w-fit">
                        {template.category}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <TeamMemberInvite
            teamMembers={formData.teamMembers}
            onAddMember={handleAddTeamMember}
            onRemoveMember={handleRemoveTeamMember}
            subscriptionLimits={limits}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <style>{`@media (max-width: 767px) { nav.fixed.bottom-0 { display: none !important; } }`}</style>
      <div className="bg-background rounded-lg w-full max-w-5xl max-h-[85vh] md:max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 md:p-6 border-b">
          <h2 className="text-lg md:text-2xl font-semibold">Create New Project</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Follow these steps to set up your construction project</p>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-start justify-between gap-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold mb-2 shrink-0",
                    currentStep >= step.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {step.id}
                  </div>
                  <div className="text-center w-full">
                    <p className={cn(
                      "text-xs md:text-sm font-semibold mb-0.5 truncate",
                      currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex items-center pt-5 shrink-0">
                    <div className={cn(
                      "w-4 md:w-8 h-0.5",
                      currentStep > step.id ? "bg-primary" : "bg-border"
                    )} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {/* Subscription limit warning */}
          {limits && !limits.can_create_project && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Project Limit Reached</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>You've reached the maximum number of projects ({limits.current_projects}/{limits.max_projects}) for your {limits.plan_name || 'current'} plan.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-background hover:bg-background/80"
                >
                  View Upgrade Options
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="p-4 md:px-6 md:py-4 border-t bg-background shrink-0 space-y-2 md:space-y-0 md:flex md:items-center md:justify-between">
          <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between w-full gap-2 md:gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button variant="outline" size="sm" onClick={onClose} className="flex-1 md:flex-none md:h-10 md:px-4">
                Cancel
              </Button>
              {currentStep > 1 && (
                <Button variant="outline" size="sm" onClick={prevStep} className="flex-1 md:flex-none md:h-10 md:px-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto md:gap-3">
              {currentStep === 3 && (
                <Button variant="ghost" size="sm" onClick={nextStep} className="flex-1 md:flex-none md:h-10 md:px-4 md:order-first">
                  Skip Template
                </Button>
              )}
              {currentStep < steps.length ? (
                <Button size="sm" onClick={nextStep} disabled={!canProceed()} className="flex-1 md:flex-none md:h-10 md:px-4">
                  {currentStep === 3 && formData.templateId ? 'Continue with Template' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  size="sm"
                  onClick={createProject} 
                  disabled={!canProceed() || loading || (limits && !limits.can_create_project)}
                  className="flex-1 md:flex-none md:h-10 md:px-4"
                >
                  {loading ? "Creating..." : "Create Project"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <SubscriptionUpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        limitType="projects"
        currentPlan={limits?.plan_name}
        currentUsage={limits ? { current: limits.current_projects, max: limits.max_projects } : undefined}
      />
    </div>
  );
};

export default ProjectWizard;