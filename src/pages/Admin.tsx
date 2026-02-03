import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  FolderOpen,
  Activity,
  BarChart3,
  FileText,
  Settings,
  Sliders,
  Mail,
  Tag,
  CreditCard,
  Plug,
  Send,
  ShieldAlert,
  HeadphonesIcon,
  Lock
} from 'lucide-react';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminUserManagement } from '@/components/admin/AdminUserManagement';
import { AdminRoleManagement } from '@/components/admin/AdminRoleManagement';
import { AdminProjectManagement } from '@/components/admin/AdminProjectManagement';
import { AdminSystemHealth } from '@/components/admin/AdminSystemHealth';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { AdminAuditLogs } from '@/components/admin/AdminAuditLogs';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { AdminFeatureManagement } from '@/components/admin/AdminFeatureManagement';
import { AdminContactManagement } from '@/components/admin/AdminContactManagement';
import { AdminPromoCodeManagement } from '@/components/admin/AdminPromoCodeManagement';
import { AdminSubscriptionManagement } from '@/components/admin/AdminSubscriptionManagement';
import { SubscriptionAnalyticsDashboard } from '@/components/admin/SubscriptionAnalyticsDashboard';
import { AdminEmailManagement } from '@/components/admin/AdminEmailManagement';
import { AdminSupportManagement } from '@/components/admin/AdminSupportManagement';
import { AdminAdminFeatures } from '@/components/admin/AdminAdminFeatures';
import SecurityDashboard from '@/pages/SecurityDashboard';
import Integrations from '@/pages/Integrations';
import { useUserRole } from '@/hooks/useUserRole';
import { useAdminFeatures } from '@/hooks/useAdminFeatures';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Tab configuration with feature keys
const adminTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, featureKey: 'admin_dashboard' },
  { id: 'users', label: 'Users', icon: Users, featureKey: 'admin_users' },
  { id: 'roles', label: 'Roles', icon: Shield, featureKey: 'admin_roles' },
  { id: 'projects', label: 'Projects', icon: FolderOpen, featureKey: 'admin_projects' },
  { id: 'emails', label: 'Emails', icon: Send, featureKey: 'admin_emails' },
  { id: 'contacts', label: 'Contacts', icon: Mail, featureKey: 'admin_contacts' },
  { id: 'support', label: 'Support', icon: HeadphonesIcon, featureKey: 'admin_support' },
  { id: 'promo-codes', label: 'Promo', icon: Tag, featureKey: 'admin_promo_codes' },
  { id: 'subscriptions', label: 'Subs', icon: CreditCard, featureKey: 'admin_subscriptions' },
  { id: 'system', label: 'System Status', icon: Activity, featureKey: 'admin_system' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, featureKey: 'admin_analytics' },
  { id: 'logs', label: 'Logs', icon: FileText, featureKey: 'admin_audit_logs' },
  { id: 'security', label: 'Security', icon: ShieldAlert, featureKey: 'admin_security' },
  { id: 'settings', label: 'Settings', icon: Settings, featureKey: 'admin_settings' },
];

const ComingSoonPlaceholder = ({ featureName }: { featureName: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Lock className="h-5 w-5" />
        {featureName}
      </CardTitle>
    </CardHeader>
    <CardContent className="text-center py-12">
      <Badge variant="outline" className="mb-4 text-amber-600 border-amber-300 bg-amber-50">
        Coming Soon
      </Badge>
      <p className="text-muted-foreground">
        This feature is under development and will be available soon.
      </p>
    </CardContent>
  </Card>
);

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isSystemAdmin } = useUserRole();
  const { canAccessFeature, isFeatureUpcoming, getFeatureInfo } = useAdminFeatures();

  // Render tab trigger with access control
  const renderTabTrigger = (tab: typeof adminTabs[0]) => {
    const canAccess = canAccessFeature(tab.featureKey);
    const isUpcoming = isFeatureUpcoming(tab.featureKey);
    const Icon = tab.icon;

    // Don't render if Operation Admin doesn't have access and it's not upcoming
    if (!isSystemAdmin && !canAccess && !isUpcoming) {
      return null;
    }

    return (
      <TabsTrigger 
        key={tab.id}
        value={tab.id} 
        className="flex items-center gap-1.5 px-3 py-2 relative"
        disabled={isUpcoming && !isSystemAdmin}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="hidden md:inline text-sm">{tab.label}</span>
        {isUpcoming && !isSystemAdmin && (
          <Badge variant="outline" className="absolute -top-1 -right-1 text-[10px] px-1 py-0 bg-amber-50 text-amber-600 border-amber-300">
            Soon
          </Badge>
        )}
      </TabsTrigger>
    );
  };

  // Render tab content with access control
  const renderTabContent = (tabId: string, component: React.ReactNode, featureKey: string) => {
    const canAccess = canAccessFeature(featureKey);
    const isUpcoming = isFeatureUpcoming(featureKey);
    const featureInfo = getFeatureInfo(featureKey);

    // System Admin always sees full content
    if (isSystemAdmin) {
      return (
        <TabsContent key={tabId} value={tabId} className="space-y-6">
          {component}
        </TabsContent>
      );
    }

    // Operation Admin - show placeholder if upcoming
    if (isUpcoming) {
      return (
        <TabsContent key={tabId} value={tabId} className="space-y-6">
          <ComingSoonPlaceholder featureName={featureInfo?.feature_name || tabId} />
        </TabsContent>
      );
    }

    // Operation Admin - show content if has access
    if (canAccess) {
      return (
        <TabsContent key={tabId} value={tabId} className="space-y-6">
          {component}
        </TabsContent>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive system management and monitoring
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex h-auto flex-wrap gap-1 p-1 min-w-full">
            {/* Regular admin tabs */}
            {adminTabs.map(renderTabTrigger)}
            
            {/* System Admin only tabs */}
            {isSystemAdmin && (
              <>
                <TabsTrigger value="admin-features" className="flex items-center gap-1.5 px-3 py-2">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline text-sm">Admin Features</span>
                </TabsTrigger>
                <TabsTrigger value="features" className="flex items-center gap-1.5 px-3 py-2">
                  <Sliders className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline text-sm">Features</span>
                </TabsTrigger>
                <TabsTrigger value="integrations" className="flex items-center gap-1.5 px-3 py-2">
                  <Plug className="h-4 w-4 shrink-0" />
                  <span className="hidden lg:inline text-sm">Integrations</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        {/* Regular admin tab contents */}
        {renderTabContent('dashboard', <AdminDashboard />, 'admin_dashboard')}
        {renderTabContent('users', <AdminUserManagement />, 'admin_users')}
        {renderTabContent('roles', <AdminRoleManagement />, 'admin_roles')}
        {renderTabContent('projects', <AdminProjectManagement />, 'admin_projects')}
        {renderTabContent('emails', <AdminEmailManagement />, 'admin_emails')}
        {renderTabContent('contacts', <AdminContactManagement />, 'admin_contacts')}
        {renderTabContent('support', <AdminSupportManagement />, 'admin_support')}
        {renderTabContent('promo-codes', <AdminPromoCodeManagement />, 'admin_promo_codes')}
        {renderTabContent('subscriptions', <AdminSubscriptionManagement />, 'admin_subscriptions')}
        {renderTabContent('system', <AdminSystemHealth />, 'admin_system')}
        {renderTabContent('analytics', <SubscriptionAnalyticsDashboard />, 'admin_analytics')}
        {renderTabContent('logs', <AdminAuditLogs />, 'admin_audit_logs')}
        {renderTabContent('security', <SecurityDashboard />, 'admin_security')}
        {renderTabContent('settings', <AdminSettings />, 'admin_settings')}

        {/* System Admin only tab contents */}
        {isSystemAdmin && (
          <>
            <TabsContent value="admin-features" className="space-y-6">
              <AdminAdminFeatures />
            </TabsContent>
            <TabsContent value="features" className="space-y-6">
              <AdminFeatureManagement />
            </TabsContent>
            <TabsContent value="integrations" className="space-y-6">
              <Integrations />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Admin;
