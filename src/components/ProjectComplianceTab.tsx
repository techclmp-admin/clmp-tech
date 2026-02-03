import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MobileCard } from "@/components/mobile";
import { useProjectFeatures } from "@/hooks/useProjectFeatures";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ShieldCheck, 
  FileText, 
  HardHat, 
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Plus,
  ChevronDown,
  Calendar
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  useOBCCompliance, 
  useSafetyCompliance,
  useInspections
} from "@/hooks/useComplianceData";
import { AddPermitDialog } from "@/components/compliance/AddPermitDialog";
import { AddInspectionDialog } from "@/components/compliance/AddInspectionDialog";
import { AddOBCComplianceDialog } from "@/components/compliance/AddOBCComplianceDialog";

interface ProjectComplianceTabProps {
  projectId: string;
  projectName: string;
}

export const ProjectComplianceTab = ({ projectId, projectName }: ProjectComplianceTabProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();
  
  const featureEnabled = isFeatureEnabled('compliance_tracking');
  const featureUpcoming = isFeatureUpcoming('compliance_tracking');

  // Fetch compliance data for this project
  const { data: obcItems = [] } = useOBCCompliance(projectId);
  const { data: safetyItems = [] } = useSafetyCompliance(projectId);
  const { data: inspections = [] } = useInspections(projectId);
  
  // Fetch permits
  const { data: permits = [] } = useQuery({
    queryKey: ['permits', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permits')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate stats
  const obcCompliance = obcItems.length > 0 
    ? Math.round((obcItems.filter((i: any) => i.status === 'approved' || i.status === 'verified').length / obcItems.length) * 100)
    : 0;
  
  const safetyCompliance = safetyItems.length > 0
    ? Math.round(safetyItems.reduce((sum: number, item: any) => sum + (item.compliance_percentage || 0), 0) / safetyItems.length)
    : 0;
    
  const passedInspections = inspections.filter((i: any) => i.status === 'passed').length;
  const totalInspections = inspections.length;
  
  const approvedPermits = permits.filter((p: any) => p.status === 'approved' || p.status === 'active').length;
  const pendingPermits = permits.filter((p: any) => p.status === 'pending' || p.status === 'submitted').length;

  // Get pending/urgent items
  const pendingItems = [
    ...permits.filter((p: any) => p.status === 'pending' || p.status === 'submitted').map((p: any) => ({
      id: p.id,
      type: 'permit',
      title: p.permit_type,
      status: p.status,
      date: p.application_date,
      urgency: 'medium'
    })),
    ...inspections.filter((i: any) => i.status === 'scheduled' || i.status === 'pending').map((i: any) => ({
      id: i.id,
      type: 'inspection',
      title: i.inspection_type,
      status: i.status,
      date: i.scheduled_date || i.inspection_date,
      urgency: 'high'
    })),
    ...obcItems.filter((o: any) => o.status === 'pending' || o.status === 'in_review').slice(0, 3).map((o: any) => ({
      id: o.id,
      type: 'obc',
      title: o.code_section || o.requirement,
      status: o.status,
      date: o.created_at,
      urgency: 'low'
    }))
  ].slice(0, 5);

  // Recent completed items
  const completedItems = [
    ...permits.filter((p: any) => p.status === 'approved').slice(0, 2).map((p: any) => ({
      id: p.id,
      type: 'permit',
      title: p.permit_type,
      date: p.issued_date || p.updated_at
    })),
    ...inspections.filter((i: any) => i.status === 'passed').slice(0, 2).map((i: any) => ({
      id: i.id,
      type: 'inspection',
      title: i.inspection_type,
      date: i.completed_date || i.updated_at
    }))
  ].slice(0, 3);

  const getStatusBadge = (status: string, type: string) => {
    if (status === 'pending' || status === 'submitted') {
      return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
    if (status === 'scheduled') {
      return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
    }
    if (status === 'approved' || status === 'passed' || status === 'verified') {
      return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'permit': return <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'inspection': return <ClipboardCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'obc': return <ShieldCheck className="w-4 h-4 text-primary" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleViewFullCompliance = () => {
    navigate(`/compliance?project=${projectId}`);
  };

  const overallCompliance = Math.round((obcCompliance + safetyCompliance) / 2);

  const hasAnyItems = obcItems.length > 0 || permits.length > 0 || inspections.length > 0 || safetyItems.length > 0;

  // If feature is disabled and not marked as upcoming, don't render
  if (!featureEnabled && !featureUpcoming) {
    return null;
  }

  // If feature is upcoming (disabled but marked to show), show upcoming message
  if (!featureEnabled && featureUpcoming) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Project Compliance</h2>
          <p className="text-sm text-muted-foreground">
            Track permits, inspections, OBC compliance, and safety requirements for this project.
          </p>
        </div>
        
        {/* Quick Add Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Quick Add
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <AddPermitDialog 
              projectId={projectId} 
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2 text-blue-600" />
                  Add Permit
                </DropdownMenuItem>
              }
            />
            <AddInspectionDialog 
              projectId={projectId}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                  <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                  Schedule Inspection
                </DropdownMenuItem>
              }
            />
            <AddOBCComplianceDialog 
              projectId={projectId}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                  <ShieldCheck className="w-4 h-4 mr-2 text-primary" />
                  Add OBC Item
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Overall Compliance Progress */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Compliance Overview
            </CardTitle>
            <div className="text-2xl font-bold text-primary">{overallCompliance}%</div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallCompliance} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Overall compliance score based on OBC and Safety requirements
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MobileCard
          title="OBC 2024"
          value={`${obcCompliance}%`}
          subtitle={`${obcItems.length} items`}
          icon={<ShieldCheck className="h-5 w-5 text-primary" />}
        />
        <MobileCard
          title="Permits"
          value={`${approvedPermits}/${permits.length}`}
          subtitle={pendingPermits > 0 ? `${pendingPermits} pending` : 'All approved'}
          icon={<FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        />
        <MobileCard
          title="Safety"
          value={`${safetyCompliance}%`}
          subtitle={`${safetyItems.length} items`}
          icon={<HardHat className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
        />
        <MobileCard
          title="Inspections"
          value={`${passedInspections}/${totalInspections}`}
          subtitle="Passed"
          icon={<ClipboardCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
        />
      </div>

      {/* Pending/Action Required */}
      {pendingItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getTypeIcon(item.type)}
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.type} • {item.date ? new Date(item.date).toLocaleDateString() : 'No date'}
                    </p>
                  </div>
                </div>
                {getStatusBadge(item.status, item.type)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recently Completed */}
      {completedItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Recently Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {completedItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg">
                <div className="flex items-center gap-3">
                  {getTypeIcon(item.type)}
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.type} • {item.date ? new Date(item.date).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Done
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!hasAnyItems && (
        <Card>
          <CardContent className="p-8 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Compliance Items Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking permits, inspections, and compliance requirements for this project.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <AddPermitDialog projectId={projectId} />
              <AddInspectionDialog projectId={projectId} />
              <AddOBCComplianceDialog projectId={projectId} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Full Compliance Link */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={handleViewFullCompliance} className="w-full md:w-auto">
          <ExternalLink className="w-4 h-4 mr-2" />
          View Full Compliance Dashboard
        </Button>
      </div>
    </div>
  );
};
