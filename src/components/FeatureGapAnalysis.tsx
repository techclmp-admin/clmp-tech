import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Star,
  Target,
  Calendar,
  Shield,
  Smartphone,
  MessageSquare,
  Users,
  Database,
  Zap,
  FileSpreadsheet,
  Bell,
  Brain,
  Settings,
  Lock
} from 'lucide-react';

interface FeatureStatus {
  name: string;
  status: 'implemented' | 'partial' | 'missing' | 'planned';
  priority: 'high' | 'medium' | 'low';
  description: string;
  notes?: string;
  eta?: string;
}

interface FeatureModule {
  name: string;
  icon: React.ElementType;
  features: FeatureStatus[];
  completion: number;
}

const FeatureGapAnalysis: React.FC = () => {
  const modules: FeatureModule[] = [
    {
      name: 'Authentication & User Management',
      icon: Shield,
      completion: 90,
      features: [
        { name: 'Sign Up with Email', status: 'implemented', priority: 'high', description: 'Standard email/password flow with validation' },
        { name: 'Sign In with Email', status: 'implemented', priority: 'high', description: 'Session token + redirect on success' },
        { name: 'SSO (Google, Apple, FB)', status: 'implemented', priority: 'high', description: 'OAuth2 login, auto-provision user', notes: 'Google, GitHub, LinkedIn implemented' },
        { name: 'Forgot Password', status: 'implemented', priority: 'high', description: 'Reset password link via email' },
        { name: 'Session Persistence', status: 'implemented', priority: 'high', description: 'Auto-login if token/session valid' },
        { name: 'Role-based Access', status: 'implemented', priority: 'high', description: 'Admin / PM / Site / Viewer roles' }
      ]
    },
    {
      name: 'Project Management',
      icon: Target,
      completion: 95,
      features: [
        { name: 'Create Project', status: 'implemented', priority: 'high', description: 'Name, client, type, start/end date' },
        { name: 'Kanban Board', status: 'implemented', priority: 'high', description: 'Drag & drop tasks between columns' },
        { name: 'Gantt View', status: 'implemented', priority: 'high', description: 'Timeline with dependencies' },
        { name: 'Task CRUD', status: 'implemented', priority: 'high', description: 'Create/edit/delete tasks with assignee' },
        { name: 'File Upload', status: 'implemented', priority: 'high', description: 'Attach drawings/docs to tasks/projects' },
        { name: 'Task Progress Tracker', status: 'implemented', priority: 'high', description: '% completed, visual indicators' }
      ]
    },
    {
      name: 'Budget & Finance (CRA-Compliant)',
      icon: Database,
      completion: 75,
      features: [
        { name: 'Cost Entry', status: 'implemented', priority: 'high', description: 'Add cost items with category, amount, tax' },
        { name: 'CRA Tax Handling', status: 'partial', priority: 'high', description: 'Auto-calculate GST/HST by province', notes: 'Basic tax calculation implemented, needs provincial logic' },
        { name: 'Budget vs. Actual Report', status: 'implemented', priority: 'high', description: 'Chart showing over/under budget' },
        { name: 'Export to CSV', status: 'partial', priority: 'medium', description: 'Finance data export', notes: 'QuickBooks export available, need general CSV export' },
        { name: 'Integration: QuickBooks', status: 'implemented', priority: 'high', description: 'Sync expenses and invoices' },
        { name: 'Integration: Sage 50', status: 'missing', priority: 'medium', description: 'Optional integration for legacy clients', eta: 'Q1 2025' }
      ]
    },
    {
      name: 'AI & Risk Management',
      icon: Brain,
      completion: 85,
      features: [
        { name: 'Heads-Up Alerts', status: 'implemented', priority: 'high', description: 'Colored tiles for delays, weather, permits' },
        { name: 'Weather Integration', status: 'implemented', priority: 'high', description: 'Forecast tied to project address' },
        { name: 'Permit Status Tracker', status: 'partial', priority: 'medium', description: 'Manual entry + status tracking', notes: 'Basic tracking, needs workflow automation' },
        { name: 'Smart AI Risk Flags', status: 'implemented', priority: 'high', description: 'AI-powered risk detection and alerts' }
      ]
    },
    {
      name: 'Team & Collaboration',
      icon: Users,
      completion: 70,
      features: [
        { name: 'Invite Team Members', status: 'implemented', priority: 'high', description: 'By email or CSV upload' },
        { name: 'Assign Roles', status: 'implemented', priority: 'high', description: 'Set user role per project' },
        { name: 'Internal Chat (basic)', status: 'partial', priority: 'medium', description: 'In-task comments/notifications', notes: 'Chat infrastructure exists, needs UI implementation' },
        { name: 'Activity Feed', status: 'implemented', priority: 'high', description: 'Log all project events chronologically' }
      ]
    },
    {
      name: 'Integrations',
      icon: Zap,
      completion: 40,
      features: [
        { name: 'Slack Notifications', status: 'missing', priority: 'medium', description: 'Send project updates to Slack channels', eta: 'Q2 2025' },
        { name: 'Google Calendar (v2)', status: 'implemented', priority: 'medium', description: 'Sync task deadlines' },
        { name: 'Weather API', status: 'implemented', priority: 'high', description: 'Weather alerts and risk detection' }
      ]
    },
    {
      name: 'Onboarding & Setup',
      icon: Star,
      completion: 95,
      features: [
        { name: 'QuickStart Wizard', status: 'implemented', priority: 'high', description: 'Step-by-step setup guide' },
        { name: 'Template Selector', status: 'implemented', priority: 'high', description: 'Residential/Commercial/Infra starter packs' },
        { name: 'Onboarding Completion', status: 'partial', priority: 'medium', description: 'Show checklist with progress', notes: 'Basic completion tracking, needs visual progress bar' }
      ]
    },
    {
      name: 'Responsiveness & Platform',
      icon: Smartphone,
      completion: 60,
      features: [
        { name: 'Responsive Web UI', status: 'implemented', priority: 'high', description: 'Optimized for tablet & mobile' },
        { name: 'PWA Support', status: 'missing', priority: 'low', description: 'Installable app with offline fallback', eta: 'Q3 2025' },
        { name: 'Mobile App (v2)', status: 'planned', priority: 'low', description: 'Native app for time tracking', eta: 'Q4 2025' }
      ]
    },
    {
      name: 'Dashboard & Reports',
      icon: FileSpreadsheet,
      completion: 90,
      features: [
        { name: 'Project Summary Dashboard', status: 'implemented', priority: 'high', description: 'Budget, status, alerts in one screen' },
        { name: 'Financial Overview', status: 'implemented', priority: 'high', description: 'Budget vs Actual chart, costs table' },
        { name: 'KPI Tiles', status: 'implemented', priority: 'high', description: 'Tasks overdue, Budget risk, Missing docs' }
      ]
    },
    {
      name: 'Security & Compliance',
      icon: Lock,
      completion: 70,
      features: [
        { name: 'CRA Compliance', status: 'partial', priority: 'high', description: 'Full compliance with GST/HST handling', notes: 'Basic tax handling, needs audit trail' },
        { name: 'Data Residency', status: 'implemented', priority: 'high', description: 'All user data hosted in Canada' },
        { name: 'PIPEDA / GDPR Ready', status: 'partial', priority: 'medium', description: 'Right to be forgotten, data portability', notes: 'Privacy policies implemented, needs data export tools' },
        { name: 'Audit Logging', status: 'implemented', priority: 'high', description: 'Record logins, data updates, exports' },
        { name: 'MFA / Email Verify', status: 'partial', priority: 'medium', description: 'Optional for Admins', notes: 'Email verification exists, MFA needs implementation' }
      ]
    },
    {
      name: 'Support & Help',
      icon: MessageSquare,
      completion: 80,
      features: [
        { name: 'Help Center Link', status: 'implemented', priority: 'medium', description: 'Link to external knowledge base' },
        { name: 'Email Support', status: 'partial', priority: 'medium', description: 'Contact support@clmp.io', notes: 'Support page exists, needs email integration' },
        { name: 'FAQ Panel (optional)', status: 'implemented', priority: 'low', description: 'Expandable questions on dashboard' }
      ]
    },
    {
      name: 'QA & Metrics',
      icon: Bell,
      completion: 30,
      features: [
        { name: 'NPS Prompt (after 30d)', status: 'missing', priority: 'medium', description: 'Collect user satisfaction', eta: 'Q2 2025' },
        { name: 'Feature Adoption Events', status: 'partial', priority: 'medium', description: 'Track usage of modules', notes: 'Analytics events structure exists, needs implementation' },
        { name: 'Alert Dismissal Tracking', status: 'missing', priority: 'low', description: 'Which alerts were ignored/acted on', eta: 'Q2 2025' }
      ]
    }
  ];

  const getStatusIcon = (status: FeatureStatus['status']) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'missing':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'planned':
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: FeatureStatus['status']) => {
    switch (status) {
      case 'implemented':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Implemented</Badge>;
      case 'partial':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case 'missing':
        return <Badge variant="destructive">Missing</Badge>;
      case 'planned':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Planned</Badge>;
    }
  };

  const getPriorityBadge = (priority: FeatureStatus['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'medium':
        return <Badge variant="default" className="text-xs">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Low</Badge>;
    }
  };

  const overallCompletion = Math.round(
    modules.reduce((acc, module) => acc + module.completion, 0) / modules.length
  );

  const missingFeatures = modules.flatMap(module => 
    module.features.filter(f => f.status === 'missing')
  );

  const partialFeatures = modules.flatMap(module => 
    module.features.filter(f => f.status === 'partial')
  );

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                CLMP MVP Feature Gap Analysis
              </CardTitle>
              <CardDescription>
                Comparison with MVP specification requirements
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">{overallCompletion}%</div>
              <p className="text-sm text-muted-foreground">Overall Completion</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="modules">By Module</TabsTrigger>
          <TabsTrigger value="missing">Missing Features ({missingFeatures.length})</TabsTrigger>
          <TabsTrigger value="partial">Partial Implementation ({partialFeatures.length})</TabsTrigger>
          <TabsTrigger value="roadmap">Development Roadmap</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {modules.map((module, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <module.icon className="h-5 w-5 text-primary" />
                      {module.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{module.completion}%</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${module.completion}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {module.features.map((feature, fIndex) => (
                      <div key={fIndex} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex items-start gap-3 flex-1">
                          {getStatusIcon(feature.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{feature.name}</h4>
                              {getPriorityBadge(feature.priority)}
                            </div>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                            {feature.notes && (
                              <p className="text-xs text-blue-600 mt-1">{feature.notes}</p>
                            )}
                            {feature.eta && (
                              <p className="text-xs text-orange-600 mt-1">ETA: {feature.eta}</p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(feature.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="missing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Missing Features ({missingFeatures.length})
              </CardTitle>
              <CardDescription>
                Features from the MVP specification that are not yet implemented
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {missingFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start justify-between p-3 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3 flex-1">
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{feature.name}</h4>
                          {getPriorityBadge(feature.priority)}
                        </div>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                        {feature.eta && (
                          <p className="text-xs text-orange-600 mt-1">ETA: {feature.eta}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Partially Implemented Features ({partialFeatures.length})
              </CardTitle>
              <CardDescription>
                Features that have basic implementation but need completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {partialFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start justify-between p-3 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3 flex-1">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{feature.name}</h4>
                          {getPriorityBadge(feature.priority)}
                        </div>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                        {feature.notes && (
                          <p className="text-xs text-blue-600 mt-1">{feature.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Development Roadmap
              </CardTitle>
              <CardDescription>
                Planned development timeline for missing and partial features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Q1 2025 (High Priority)</h3>
                  <div className="space-y-2">
                    <div className="p-3 border border-red-200 rounded-lg">
                      <h4 className="font-medium">CRA Tax Handling Completion</h4>
                      <p className="text-sm text-muted-foreground">Complete provincial GST/HST calculation logic</p>
                    </div>
                    <div className="p-3 border border-red-200 rounded-lg">
                      <h4 className="font-medium">Sage 50 Integration</h4>
                      <p className="text-sm text-muted-foreground">Legacy accounting system integration</p>
                    </div>
                    <div className="p-3 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium">MFA Implementation</h4>
                      <p className="text-sm text-muted-foreground">Multi-factor authentication for admin users</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Q2 2025 (Medium Priority)</h3>
                  <div className="space-y-2">
                    <div className="p-3 border border-red-200 rounded-lg">
                      <h4 className="font-medium">Slack Integration</h4>
                      <p className="text-sm text-muted-foreground">Project notifications to Slack channels</p>
                    </div>
                    <div className="p-3 border border-red-200 rounded-lg">
                      <h4 className="font-medium">NPS Survey System</h4>
                      <p className="text-sm text-muted-foreground">User satisfaction tracking after 30 days</p>
                    </div>
                    <div className="p-3 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium">Internal Chat UI</h4>
                      <p className="text-sm text-muted-foreground">Complete chat interface implementation</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Q3 2025 (Enhancement)</h3>
                  <div className="space-y-2">
                    <div className="p-3 border border-red-200 rounded-lg">
                      <h4 className="font-medium">PWA Support</h4>
                      <p className="text-sm text-muted-foreground">Progressive Web App with offline capabilities</p>
                    </div>
                    <div className="p-3 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium">Advanced Analytics</h4>
                      <p className="text-sm text-muted-foreground">Feature adoption and usage tracking</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Q4 2025 (Future)</h3>
                  <div className="space-y-2">
                    <div className="p-3 border border-blue-200 rounded-lg">
                      <h4 className="font-medium">Native Mobile App</h4>
                      <p className="text-sm text-muted-foreground">iOS/Android app for time tracking</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeatureGapAnalysis;