import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  X, 
  Eye, 
  EyeOff,
  Clock,
  TrendingUp,
  BarChart3,
  Users
} from 'lucide-react';

interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'error' | 'info' | 'success';
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  dismissedAt?: Date;
  viewedAt?: Date;
  userId: string;
  projectId?: string;
  category: string;
}

interface AlertStats {
  totalAlerts: number;
  dismissed: number;
  viewed: number;
  avgDismissalTime: number;
  dismissalRate: number;
}

const AlertDismissalTracker = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats>({
    totalAlerts: 0,
    dismissed: 0,
    viewed: 0,
    avgDismissalTime: 0,
    dismissalRate: 0
  });

  // Mock data - in real app, this would come from API/database
  useEffect(() => {
    const mockAlerts: Alert[] = [
      {
        id: '1',
        title: 'Budget Alert',
        message: 'Office Building project is 85% over budget',
        type: 'warning',
        severity: 'high',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        viewedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        dismissedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        userId: 'user-1',
        projectId: 'project-1',
        category: 'budget'
      },
      {
        id: '2',
        title: 'Deadline Warning',
        message: 'Permit submission due in 24 hours',
        type: 'warning',
        severity: 'critical',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        viewedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        userId: 'user-1',
        projectId: 'project-2',
        category: 'deadline'
      },
      {
        id: '3',
        title: 'Safety Compliance',
        message: 'Site inspection required for Luxury Family Home',
        type: 'error',
        severity: 'high',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        viewedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        dismissedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        userId: 'user-1',
        projectId: 'project-3',
        category: 'safety'
      },
      {
        id: '4',
        title: 'Weather Alert',
        message: 'Heavy rain forecast for next 48 hours',
        type: 'info',
        severity: 'medium',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        userId: 'user-1',
        category: 'weather'
      }
    ];

    setAlerts(mockAlerts);

    // Calculate stats
    const totalAlerts = mockAlerts.length;
    const dismissed = mockAlerts.filter(a => a.dismissedAt).length;
    const viewed = mockAlerts.filter(a => a.viewedAt).length;
    
    const dismissalTimes = mockAlerts
      .filter(a => a.dismissedAt && a.viewedAt)
      .map(a => (a.dismissedAt!.getTime() - a.viewedAt!.getTime()) / (1000 * 60)); // minutes
    
    const avgDismissalTime = dismissalTimes.length > 0 
      ? dismissalTimes.reduce((a, b) => a + b, 0) / dismissalTimes.length 
      : 0;

    const dismissalRate = viewed > 0 ? (dismissed / viewed) * 100 : 0;

    setStats({
      totalAlerts,
      dismissed,
      viewed,
      avgDismissalTime,
      dismissalRate
    });
  }, []);

  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, dismissedAt: new Date() }
        : alert
    ));
  };

  const handleViewAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId && !alert.viewedAt
        ? { ...alert, viewedAt: new Date() }
        : alert
    ));
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      case 'success': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      critical: 'destructive'
    };
    return variants[severity] || 'secondary';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Alert Management</h2>
        <p className="text-muted-foreground">
          Track alert engagement and dismissal patterns
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.totalAlerts}</div>
                <div className="text-sm text-muted-foreground">Total Alerts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Eye className="h-8 w-8 text-blue-500" />
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.viewed}</div>
                <div className="text-sm text-muted-foreground">Viewed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <X className="h-8 w-8 text-red-500" />
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.dismissed}</div>
                <div className="text-sm text-muted-foreground">Dismissed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Clock className="h-8 w-8 text-green-500" />
              <div className="text-right">
                <div className="text-2xl font-bold">{Math.round(stats.avgDismissalTime)}m</div>
                <div className="text-sm text-muted-foreground">Avg Dismissal Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.filter(alert => !alert.dismissedAt).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${getAlertTypeColor(alert.type)}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{alert.title}</h4>
                        <div className="flex items-center gap-2">
                            <Badge variant={getSeverityBadge(alert.severity)}>
                              {alert.severity}
                            </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTimeAgo(alert.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{alert.message}</p>
                      <div className="flex gap-2">
                        {!alert.viewedAt && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewAlert(alert.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Mark as Viewed
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDismissAlert(alert.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {alerts.filter(alert => !alert.dismissedAt).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No active alerts
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dismissed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dismissed Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.filter(alert => alert.dismissedAt).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-4 p-4 border rounded-lg opacity-60">
                    <div className={`w-2 h-2 rounded-full mt-2 ${getAlertTypeColor(alert.type)}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{alert.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            Dismissed
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {alert.dismissedAt && formatTimeAgo(alert.dismissedAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Dismissal Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.dismissalRate.toFixed(1)}%</div>
                    <p className="text-sm text-muted-foreground">of viewed alerts are dismissed</p>
                  </div>
                  <Progress value={stats.dismissalRate} className="h-3" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alert Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['budget', 'deadline', 'safety', 'weather'].map((category) => {
                    const count = alerts.filter(a => a.category === category).length;
                    const percentage = alerts.length > 0 ? (count / alerts.length) * 100 : 0;
                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{category}</span>
                          <span>{count} alerts</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Alert Response Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.filter(a => a.viewedAt || a.dismissedAt).map((alert) => {
                  const createdTime = alert.createdAt.getTime();
                  const viewedTime = alert.viewedAt?.getTime();
                  const dismissedTime = alert.dismissedAt?.getTime();
                  
                  const viewDelay = viewedTime ? Math.round((viewedTime - createdTime) / (1000 * 60)) : null;
                  const dismissDelay = dismissedTime && viewedTime ? Math.round((dismissedTime - viewedTime) / (1000 * 60)) : null;

                  return (
                    <div key={alert.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{alert.title}</h4>
                        <Badge variant={getSeverityBadge(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created: {formatTimeAgo(alert.createdAt)}</span>
                        {viewDelay !== null && (
                          <span>Viewed after: {viewDelay}m</span>
                        )}
                        {dismissDelay !== null && (
                          <span>Dismissed after: {dismissDelay}m</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlertDismissalTracker;