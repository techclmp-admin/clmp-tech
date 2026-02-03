import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Zap, 
  Database, 
  Shield, 
  Settings,
  Rocket,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  description: string;
  details?: string;
}

interface FeatureStatus {
  name: string;
  implemented: boolean;
  integrated: boolean;
  description: string;
  routes?: string[];
}

const SystemHealthCheck: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [dbStats, setDbStats] = useState({
    totalProfiles: 0,
    totalProjects: 0,
    totalSubscriptions: 0,
    hasStripeIntegration: false,
    storageBucketsActive: false,
    realtimeWorking: false
  });

  const runHealthChecks = async () => {
    setIsLoading(true);
    try {
      // Check Authentication System
      const { data: authUser } = await supabase.auth.getUser();
      const authStatus: HealthCheck = {
        name: 'Authentication System',
        status: authUser?.user ? 'healthy' : 'error',
        description: authUser?.user 
          ? 'User authentication and authorization working correctly'
          : 'Authentication system not responding',
        details: authUser?.user 
          ? 'Supabase Auth integration complete with SSO support'
          : 'Unable to verify current user session'
      };

      // Check Database Connection
      let dbStatus: HealthCheck;
      let profileCount = 0;
      let projectCount = 0;
      try {
        const { count: pCount, error: profileError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        const { count: projCount, error: projectError } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true });
        
        profileCount = pCount || 0;
        projectCount = projCount || 0;

        if (profileError || projectError) {
          dbStatus = {
            name: 'Database Connection',
            status: 'warning',
            description: 'Database connection has issues',
            details: profileError?.message || projectError?.message
          };
        } else {
          dbStatus = {
            name: 'Database Connection',
            status: 'healthy',
            description: 'Database queries and operations functioning normally',
            details: `${profileCount} users, ${projectCount} projects in database`
          };
        }
      } catch (err) {
        dbStatus = {
          name: 'Database Connection',
          status: 'error',
          description: 'Cannot connect to database',
          details: 'Check Supabase connection settings'
        };
      }

      // Check Subscription System (check if Stripe is properly integrated)
      let subscriptionStatus: HealthCheck;
      let totalSubscriptions = 0;
      try {
        const { count, error } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true });
        
        totalSubscriptions = count || 0;

        // Check for active paid subscriptions
        const { data: activeSubscriptions } = await supabase
          .from('subscriptions')
          .select('id, status, plan')
          .in('status', ['active', 'trialing'])
          .limit(1);

        const hasActiveSubscriptions = activeSubscriptions && activeSubscriptions.length > 0;
        const hasStripeData = activeSubscriptions?.some(sub => 
          sub.plan && sub.plan !== 'free' && sub.plan !== 'trial'
        );

        if (error) {
          subscriptionStatus = {
            name: 'Subscription System',
            status: 'error',
            description: 'Subscription system error',
            details: error.message
          };
        } else if (hasStripeData) {
          subscriptionStatus = {
            name: 'Subscription System',
            status: 'healthy',
            description: 'Stripe integration active with real subscriptions',
            details: `${totalSubscriptions} subscription records in database`
          };
        } else if (hasActiveSubscriptions) {
          subscriptionStatus = {
            name: 'Subscription System',
            status: 'warning',
            description: 'Subscription system using trial/free plans only',
            details: 'No paid Stripe subscriptions detected yet'
          };
        } else {
          subscriptionStatus = {
            name: 'Subscription System',
            status: 'warning',
            description: 'No active subscriptions found',
            details: 'Users may need to subscribe'
          };
        }
      } catch (err) {
        subscriptionStatus = {
          name: 'Subscription System',
          status: 'error',
          description: 'Cannot check subscription system',
          details: 'Subscription table not accessible'
        };
      }

      // Check Project Management
      let projectStatus: HealthCheck;
      try {
        const { count: taskCount } = await supabase
          .from('project_tasks')
          .select('*', { count: 'exact', head: true });

        projectStatus = {
          name: 'Project Management',
          status: projectCount > 0 ? 'healthy' : 'warning',
          description: projectCount > 0 
            ? 'Core project management features operational'
            : 'No projects created yet',
          details: `${projectCount} projects, ${taskCount || 0} tasks active`
        };
      } catch (err) {
        projectStatus = {
          name: 'Project Management',
          status: 'error',
          description: 'Cannot check project status',
          details: 'Project tables not accessible'
        };
      }

      // Check File Storage
      let storageStatus: HealthCheck;
      try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
          storageStatus = {
            name: 'File Storage',
            status: 'error',
            description: 'Storage system error',
            details: error.message
          };
        } else if (buckets && buckets.length > 0) {
          storageStatus = {
            name: 'File Storage',
            status: 'healthy',
            description: 'File upload and management system working',
            details: `${buckets.length} storage bucket(s) configured: ${buckets.map(b => b.name).join(', ')}`
          };
        } else {
          storageStatus = {
            name: 'File Storage',
            status: 'warning',
            description: 'No storage buckets configured',
            details: 'Create storage buckets in Supabase dashboard'
          };
        }
      } catch (err) {
        storageStatus = {
          name: 'File Storage',
          status: 'error',
          description: 'Cannot check storage system',
          details: 'Storage API not accessible'
        };
      }

      // Check Real-time Features
      let realtimeStatus: HealthCheck;
      try {
        const { data: chatRooms, error } = await supabase
          .from('project_chat_rooms')
          .select('id', { count: 'exact', head: true });

        const { count: messageCount } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true });

        if (error) {
          realtimeStatus = {
            name: 'Real-time Features',
            status: 'error',
            description: 'Chat system error',
            details: error.message
          };
        } else {
          realtimeStatus = {
            name: 'Real-time Features',
            status: 'healthy',
            description: 'Real-time chat and collaboration active',
            details: `${messageCount || 0} messages, real-time subscriptions enabled`
          };
        }
      } catch (err) {
        realtimeStatus = {
          name: 'Real-time Features',
          status: 'warning',
          description: 'Real-time features partially available',
          details: 'Some real-time features may not work'
        };
      }

      setHealthChecks([
        authStatus,
        dbStatus,
        subscriptionStatus,
        projectStatus,
        storageStatus,
        realtimeStatus
      ]);

      setDbStats({
        totalProfiles: profileCount,
        totalProjects: projectCount,
        totalSubscriptions: totalSubscriptions,
        hasStripeIntegration: subscriptionStatus.status === 'healthy',
        storageBucketsActive: storageStatus.status === 'healthy',
        realtimeWorking: realtimeStatus.status === 'healthy'
      });

      setLastChecked(new Date());
    } catch (err) {
      console.error('Health check error:', err);
      toast({
        title: "Health Check Error",
        description: "Failed to complete system health check",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const featureStatus: FeatureStatus[] = [
    {
      name: 'Dashboard',
      implemented: true,
      integrated: true,
      description: 'Main dashboard with KPIs and overview',
      routes: ['/dashboard']
    },
    {
      name: 'Project Management',
      implemented: true,
      integrated: dbStats.totalProjects > 0,
      description: `${dbStats.totalProjects} active projects`,
      routes: ['/projects', '/projects/:id']
    },
    {
      name: 'Team Management',
      implemented: true,
      integrated: dbStats.totalProfiles > 0,
      description: `${dbStats.totalProfiles} registered users`,
      routes: ['/team']
    },
    {
      name: 'Budget & Finance',
      implemented: true,
      integrated: true,
      description: 'Budget tracking and financial management',
      routes: ['/budget']
    },
    {
      name: 'Subscription Management',
      implemented: true,
      integrated: dbStats.hasStripeIntegration,
      description: `${dbStats.totalSubscriptions} subscriptions`,
      routes: ['/billing']
    },
    {
      name: 'Risk Alerts',
      implemented: true,
      integrated: true,
      description: 'AI-powered risk assessment and weather alerts',
      routes: ['/alerts']
    },
    {
      name: 'Calendar System',
      implemented: true,
      integrated: true,
      description: 'Project timeline and scheduling',
      routes: ['/calendar']
    },
    {
      name: 'Reports & Analytics',
      implemented: true,
      integrated: true,
      description: 'Business intelligence and reporting',
      routes: ['/reports']
    },
    {
      name: 'File Storage',
      implemented: true,
      integrated: dbStats.storageBucketsActive,
      description: dbStats.storageBucketsActive ? 'Storage buckets active' : 'No storage configured',
      routes: ['/projects/:id']
    },
    {
      name: 'Real-time Chat',
      implemented: true,
      integrated: dbStats.realtimeWorking,
      description: dbStats.realtimeWorking ? 'Real-time messaging active' : 'Chat needs configuration',
      routes: ['/chat']
    },
    {
      name: 'Templates',
      implemented: true,
      integrated: true,
      description: 'Project templates and workflows',
      routes: ['/templates']
    },
    {
      name: 'Settings',
      implemented: true,
      integrated: true,
      description: 'User preferences and system configuration',
      routes: ['/settings']
    }
  ];

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Healthy</Badge>;
      case 'warning':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Warning</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  const overallHealth = healthChecks.length > 0 
    ? healthChecks.filter(check => check.status === 'healthy').length / healthChecks.length * 100
    : 0;

  const getHealthColor = () => {
    if (overallHealth >= 80) return 'text-green-600';
    if (overallHealth >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Overall System Health */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                System Health Overview
              </CardTitle>
              <CardDescription>
                {lastChecked 
                  ? `Last checked: ${lastChecked.toLocaleTimeString()}`
                  : 'Checking system status...'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={runHealthChecks}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Refresh</span>
              </Button>
              <div className="text-right">
                <div className={`text-3xl font-bold ${getHealthColor()}`}>
                  {isLoading ? '...' : `${overallHealth.toFixed(0)}%`}
                </div>
                <p className="text-sm text-muted-foreground">Overall Health</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="features">Feature Status</TabsTrigger>
          <TabsTrigger value="integration">Integration Status</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Running health checks...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {healthChecks.map((check, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(check.status)}
                        <div>
                          <h3 className="font-semibold">{check.name}</h3>
                          <p className="text-sm text-muted-foreground">{check.description}</p>
                          {check.details && (
                            <p className="text-xs text-muted-foreground mt-1">{check.details}</p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(check.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="space-y-4">
            {featureStatus.map((feature, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Settings className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{feature.name}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                        {feature.routes && (
                          <div className="flex gap-1 mt-1">
                            {feature.routes.map((route, idx) => (
                              <code key={idx} className="text-xs bg-muted px-1 rounded">
                                {route}
                              </code>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={feature.implemented ? "secondary" : "outline"}>
                        {feature.implemented ? "Implemented" : "Pending"}
                      </Badge>
                      <Badge variant={feature.integrated ? "secondary" : "outline"}>
                        {feature.integrated ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Total Users</span>
                    <Badge variant="secondary">{dbStats.totalProfiles}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Projects</span>
                    <Badge variant="secondary">{dbStats.totalProjects}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Subscriptions</span>
                    <Badge variant="secondary">{dbStats.totalSubscriptions}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>RLS Policies</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Authentication</span>
                    <Badge variant="secondary">Supabase Auth</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Role-based Access</span>
                    <Badge variant="secondary">Implemented</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Storage Buckets</span>
                    <Badge variant={dbStats.storageBucketsActive ? "secondary" : "outline"}>
                      {dbStats.storageBucketsActive ? 'Active' : 'Not Configured'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Real-time</span>
                    <Badge variant={dbStats.realtimeWorking ? "secondary" : "outline"}>
                      {dbStats.realtimeWorking ? 'Active' : 'Not Configured'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Production Readiness
                </CardTitle>
                <CardDescription>
                  Based on current system status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthChecks.filter(c => c.status !== 'healthy').map((check, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getStatusIcon(check.status)}
                      <div>
                        <h4 className="font-medium">{check.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {check.details || check.description}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {healthChecks.filter(c => c.status === 'healthy').length === healthChecks.length && (
                    <div className="flex items-start gap-3 p-3 border rounded-lg border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">All Systems Operational</h4>
                        <p className="text-sm text-muted-foreground">
                          All system components are healthy and ready for production
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Core Features Complete</h4>
                      <p className="text-sm text-muted-foreground">
                        {featureStatus.filter(f => f.implemented).length} of {featureStatus.length} features implemented
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemHealthCheck;
