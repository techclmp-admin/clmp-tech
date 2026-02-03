import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import SimpleCSVExportManager from "@/components/SimpleCSVExportManager";
import { OBCComplianceTracker } from "@/components/compliance/OBCComplianceTracker";
import { SafetyComplianceTracker } from "@/components/compliance/SafetyComplianceTracker";
import { InspectionTracker } from "@/components/compliance/InspectionTracker";
import { ProjectSelector } from "@/components/compliance/ProjectSelector";
import { PermitTracker } from "@/components/compliance/PermitTracker";
import { MobilePageWrapper, MobileCard, MobileSegmentedControl } from "@/components/mobile";
import { useProjectFeatures } from "@/hooks/useProjectFeatures";
import { 
  ShieldCheck, 
  FileText, 
  HardHat, 
  ClipboardCheck,
  Leaf,
  Download,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatProjectStatus } from "@/lib/utils";

const Compliance = () => {
  const [searchParams] = useSearchParams();
  const projectFromUrl = searchParams.get('project');
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();
  
  const [selectedProject, setSelectedProject] = useState<string>(projectFromUrl || '');
  const [activeTab, setActiveTab] = useState('overview');
  
  const featureEnabled = isFeatureEnabled('compliance_tracking');
  const featureUpcoming = isFeatureUpcoming('compliance_tracking');

  // Update selected project when URL parameter changes
  useEffect(() => {
    if (projectFromUrl) {
      setSelectedProject(projectFromUrl);
    }
  }, [projectFromUrl]);

  // Fetch all projects user has access to
  const { data: userProjects = [] } = useQuery({
    queryKey: ['user-projects-compliance'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status, project_members!inner(user_id)')
        .eq('project_members.user_id', user.id)
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch aggregated compliance data across ALL user projects
  const { data: aggregatedData } = useQuery({
    queryKey: ['compliance-aggregated', userProjects.map(p => p.id)],
    queryFn: async () => {
      if (userProjects.length === 0) return null;
      
      const projectIds = userProjects.map(p => p.id);
      
      // Fetch OBC compliance items
      const { data: obcItems } = await supabase
        .from('obc_compliance_items')
        .select('id, project_id, status')
        .in('project_id', projectIds);
      
      // Fetch permits
      const { data: permits } = await supabase
        .from('permits')
        .select('id, project_id, status, permit_type, expiry_date')
        .in('project_id', projectIds);
      
      // Fetch inspections
      const { data: inspections } = await supabase
        .from('inspections')
        .select('id, project_id, status, inspection_type, scheduled_date')
        .in('project_id', projectIds);
      
      // Fetch safety compliance
      const { data: safetyItems } = await supabase
        .from('safety_compliance')
        .select('id, project_id, status, compliance_percentage')
        .in('project_id', projectIds);

      // Calculate aggregated stats
      const obcTotal = obcItems?.length || 0;
      const obcCompliant = obcItems?.filter(i => i.status === 'approved' || i.status === 'verified').length || 0;
      
      const permitsTotal = permits?.length || 0;
      const permitsApproved = permits?.filter(p => p.status === 'approved' || p.status === 'active').length || 0;
      const permitsPending = permits?.filter(p => p.status === 'pending' || p.status === 'submitted').length || 0;
      const permitsExpiring = permits?.filter(p => {
        if (!p.expiry_date) return false;
        const daysUntilExpiry = Math.ceil((new Date(p.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }).length || 0;
      
      const inspectionsTotal = inspections?.length || 0;
      const inspectionsPassed = inspections?.filter(i => i.status === 'passed').length || 0;
      const inspectionsScheduled = inspections?.filter(i => i.status === 'scheduled').length || 0;
      
      const safetyTotal = safetyItems?.length || 0;
      const safetyAvg = safetyTotal > 0 
        ? Math.round(safetyItems!.reduce((sum, item) => sum + (item.compliance_percentage || 0), 0) / safetyTotal)
        : 0;

      // Get pending/action items per project
      const projectCompliance = userProjects.map(project => {
        const projectObc = obcItems?.filter(i => i.project_id === project.id) || [];
        const projectPermits = permits?.filter(p => p.project_id === project.id) || [];
        const projectInspections = inspections?.filter(i => i.project_id === project.id) || [];
        const projectSafety = safetyItems?.filter(s => s.project_id === project.id) || [];
        
        const obcCompliance = projectObc.length > 0 
          ? Math.round((projectObc.filter(i => i.status === 'approved' || i.status === 'verified').length / projectObc.length) * 100)
          : 0;
        
        const safetyCompliance = projectSafety.length > 0
          ? Math.round(projectSafety.reduce((sum, s) => sum + (s.compliance_percentage || 0), 0) / projectSafety.length)
          : 0;
        
        const pendingPermits = projectPermits.filter(p => p.status === 'pending' || p.status === 'submitted').length;
        const scheduledInspections = projectInspections.filter(i => i.status === 'scheduled').length;
        
        return {
          id: project.id,
          name: project.name,
          status: project.status,
          obcCompliance,
          safetyCompliance,
          permits: { total: projectPermits.length, approved: projectPermits.filter(p => p.status === 'approved').length, pending: pendingPermits },
          inspections: { total: projectInspections.length, passed: projectInspections.filter(i => i.status === 'passed').length, scheduled: scheduledInspections },
          overallCompliance: Math.round((obcCompliance + safetyCompliance) / 2),
          actionItems: pendingPermits + scheduledInspections
        };
      });

      return {
        obc: { total: obcTotal, compliant: obcCompliant, percentage: obcTotal > 0 ? Math.round((obcCompliant / obcTotal) * 100) : 0 },
        permits: { total: permitsTotal, approved: permitsApproved, pending: permitsPending, expiring: permitsExpiring },
        inspections: { total: inspectionsTotal, passed: inspectionsPassed, scheduled: inspectionsScheduled },
        safety: { total: safetyTotal, average: safetyAvg },
        projectCompliance,
        totalProjects: userProjects.length
      };
    },
    enabled: userProjects.length > 0
  });

  // Compliance sub-feature checks (map tab values to feature keys)
  const COMPLIANCE_TAB_FEATURE_MAP: Record<string, string> = {
    'overview': 'compliance_tracking', // always show if parent is enabled
    'obc': 'obc_compliance',
    'permits': 'permit_tracking',
    'safety': 'compliance_safety',
    'inspections': 'inspection_tracking',
    'exports': 'compliance_tracking', // always show if parent is enabled
  };

  const isComplianceTabEnabled = (tabValue: string) => 
    isFeatureEnabled(COMPLIANCE_TAB_FEATURE_MAP[tabValue] || 'compliance_tracking');
  const isComplianceTabUpcoming = (tabValue: string) => 
    isFeatureUpcoming(COMPLIANCE_TAB_FEATURE_MAP[tabValue] || 'compliance_tracking');

  // Sorted: enabled first, upcoming at end
  const complianceTabs = [
    { value: 'overview', label: 'Overview', icon: Building2 },
    { value: 'obc', label: 'OBC', icon: ShieldCheck },
    { value: 'permits', label: 'Permits', icon: FileText },
    { value: 'safety', label: 'Safety', icon: HardHat },
    { value: 'inspections', label: 'Inspect', icon: ClipboardCheck },
    { value: 'exports', label: 'Export', icon: Download },
  ]
    .filter(tab => isComplianceTabEnabled(tab.value) || isComplianceTabUpcoming(tab.value))
    .sort((a, b) => {
      const aUpcoming = isComplianceTabUpcoming(a.value);
      const bUpcoming = isComplianceTabUpcoming(b.value);
      if (aUpcoming === bUpcoming) return 0;
      return aUpcoming ? 1 : -1;
    });

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getComplianceBadge = (percentage: number) => {
    if (percentage >= 80) return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">Good</Badge>;
    if (percentage >= 50) return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">Needs Attention</Badge>;
    return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400">Critical</Badge>;
  };

  // If feature is disabled and not marked as upcoming, show disabled message
  if (!featureEnabled && !featureUpcoming) {
    return (
      <MobilePageWrapper
        title="Compliance Management"
        subtitle="This feature is currently disabled"
      >
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Feature Disabled</h3>
              <p className="text-muted-foreground">
                Compliance Tracking is currently disabled. Contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </MobilePageWrapper>
    );
  }

  // If feature is upcoming (disabled but marked to show), show upcoming message
  if (!featureEnabled && featureUpcoming) {
    return (
      <MobilePageWrapper
        title="Compliance Management"
        subtitle="Track permits, inspections, and OBC compliance"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Compliance Tracking
              <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">
                This feature is currently under development and will be available soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </MobilePageWrapper>
    );
  }

  return (
    <MobilePageWrapper
      title="Compliance Management"
      subtitle="Organization-wide compliance tracking - OBC 2024, OHSA, and regulatory requirements"
      actions={
        selectedProject ? (
          <ProjectSelector value={selectedProject} onChange={setSelectedProject} />
        ) : null
      }
    >
      {/* Organization Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MobileCard
          title="OBC Compliance"
          value={`${aggregatedData?.obc.percentage || 0}%`}
          subtitle={`${aggregatedData?.obc.compliant || 0}/${aggregatedData?.obc.total || 0} items`}
          icon={<ShieldCheck className="h-5 w-5 text-primary" />}
        />
        <MobileCard
          title="Permits"
          value={`${aggregatedData?.permits.approved || 0}/${aggregatedData?.permits.total || 0}`}
          subtitle={aggregatedData?.permits.pending ? `${aggregatedData.permits.pending} pending` : 'All processed'}
          icon={<FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        />
        <MobileCard
          title="Safety"
          value={`${aggregatedData?.safety.average || 0}%`}
          subtitle={`${aggregatedData?.safety.total || 0} items tracked`}
          icon={<HardHat className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
        />
        <MobileCard
          title="Inspections"
          value={`${aggregatedData?.inspections.passed || 0}/${aggregatedData?.inspections.total || 0}`}
          subtitle={aggregatedData?.inspections.scheduled ? `${aggregatedData.inspections.scheduled} scheduled` : 'None scheduled'}
          icon={<ClipboardCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
        />
      </div>

      {/* Mobile Segmented Control */}
      <div className="md:hidden">
        <MobileSegmentedControl
          options={complianceTabs}
          value={activeTab}
          onChange={setActiveTab}
          variant="card"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="hidden md:grid w-full" style={{ gridTemplateColumns: `repeat(${complianceTabs.length}, 1fr)` }}>
          {complianceTabs.map(tab => {
            const upcoming = isComplianceTabUpcoming(tab.value);
            return (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                disabled={upcoming}
                className={`relative ${upcoming ? 'opacity-50' : 'font-semibold'}`}
              >
                {upcoming && (
                  <Badge variant="secondary" className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0 h-4">Soon</Badge>
                )}
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Overview Tab - All Projects Summary */}
        <TabsContent value="overview" className="space-y-6">
          {/* Alerts Section */}
          {aggregatedData && (aggregatedData.permits.pending > 0 || aggregatedData.permits.expiring > 0 || aggregatedData.inspections.scheduled > 0) && (
            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Action Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {aggregatedData.permits.pending > 0 && (
                    <div className="flex items-center justify-between p-2 bg-background rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm">{aggregatedData.permits.pending} permits pending approval</span>
                      </div>
                      <Badge variant="secondary">{aggregatedData.permits.pending}</Badge>
                    </div>
                  )}
                  {aggregatedData.permits.expiring > 0 && (
                    <div className="flex items-center justify-between p-2 bg-background rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className="text-sm">{aggregatedData.permits.expiring} permits expiring within 30 days</span>
                      </div>
                      <Badge variant="secondary">{aggregatedData.permits.expiring}</Badge>
                    </div>
                  )}
                  {aggregatedData.inspections.scheduled > 0 && (
                    <div className="flex items-center justify-between p-2 bg-background rounded-lg">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">{aggregatedData.inspections.scheduled} inspections scheduled</span>
                      </div>
                      <Badge variant="secondary">{aggregatedData.inspections.scheduled}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Projects Compliance Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Project Compliance Status</CardTitle>
              <CardDescription>Compliance overview across all {aggregatedData?.totalProjects || 0} projects</CardDescription>
            </CardHeader>
            <CardContent>
              {aggregatedData?.projectCompliance && aggregatedData.projectCompliance.length > 0 ? (
                <div className="space-y-4">
                  {aggregatedData.projectCompliance.map((project) => (
                    <div 
                      key={project.id} 
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedProject(project.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-primary" />
                          <div>
                            <h4 className="font-medium">{project.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="capitalize text-xs">{formatProjectStatus(project.status)}</Badge>
                              {project.actionItems > 0 && (
                                <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs">
                                  {project.actionItems} actions
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getComplianceColor(project.overallCompliance)}`}>
                            {project.overallCompliance}%
                          </div>
                          {getComplianceBadge(project.overallCompliance)}
                        </div>
                      </div>
                      
                      <Progress value={project.overallCompliance} className="h-2 mb-3" />
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">OBC</span>
                          <p className="font-medium">{project.obcCompliance}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Safety</span>
                          <p className="font-medium">{project.safetyCompliance}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Permits</span>
                          <p className="font-medium">{project.permits.approved}/{project.permits.total}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Inspections</span>
                          <p className="font-medium">{project.inspections.passed}/{project.inspections.total}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
                  <p className="text-muted-foreground">
                    You don't have any projects yet. Create a project to start tracking compliance.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project-Specific Tabs - Require Project Selection */}
        <TabsContent value="obc" className="space-y-4">
          {selectedProject ? (
            <OBCComplianceTracker projectId={selectedProject} />
          ) : (
            <Card>
              <CardContent className="p-8 md:p-12 text-center">
                <ShieldCheck className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg md:text-xl font-semibold mb-2">Select a Project</h3>
                <p className="text-muted-foreground text-sm md:text-base mb-4">
                  Choose a project to view detailed OBC compliance tracking
                </p>
                <ProjectSelector value={selectedProject} onChange={setSelectedProject} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="permits" className="space-y-4">
          {selectedProject ? (
            <PermitTracker projectId={selectedProject} />
          ) : (
            <Card>
              <CardContent className="p-8 md:p-12 text-center">
                <FileText className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg md:text-xl font-semibold mb-2">Select a Project</h3>
                <p className="text-muted-foreground text-sm md:text-base mb-4">
                  Choose a project to view and manage permits
                </p>
                <ProjectSelector value={selectedProject} onChange={setSelectedProject} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="safety" className="space-y-4">
          {selectedProject ? (
            <SafetyComplianceTracker projectId={selectedProject} />
          ) : (
            <Card>
              <CardContent className="p-8 md:p-12 text-center">
                <HardHat className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg md:text-xl font-semibold mb-2">Select a Project</h3>
                <p className="text-muted-foreground text-sm md:text-base mb-4">
                  Choose a project to view safety compliance tracking
                </p>
                <ProjectSelector value={selectedProject} onChange={setSelectedProject} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inspections" className="space-y-4">
          {selectedProject ? (
            <InspectionTracker projectId={selectedProject} />
          ) : (
            <Card>
              <CardContent className="p-8 md:p-12 text-center">
                <ClipboardCheck className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg md:text-xl font-semibold mb-2">Select a Project</h3>
                <p className="text-muted-foreground text-sm md:text-base mb-4">
                  Choose a project to view and manage inspections
                </p>
                <ProjectSelector value={selectedProject} onChange={setSelectedProject} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="exports" className="space-y-4">
          <SimpleCSVExportManager />
        </TabsContent>
      </Tabs>
    </MobilePageWrapper>
  );
};

export default Compliance;
