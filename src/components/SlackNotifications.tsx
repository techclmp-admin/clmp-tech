import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Bell, 
  Settings, 
  TestTube,
  CheckCircle,
  AlertTriangle,
  Users,
  Calendar
} from 'lucide-react';

const SlackNotifications = () => {
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [notificationSettings, setNotificationSettings] = useState({
    projectUpdates: true,
    taskAssignments: true,
    deadlineAlerts: true,
    budgetWarnings: true,
    teamNotifications: true,
    weeklyReports: false
  });

  const [testMessage, setTestMessage] = useState('Hello from Canadian Build Smarts! 🏗️');

  const handleConnect = async () => {
    if (!webhookUrl) {
      toast({
        title: "Error",
        description: "Please enter your Slack webhook URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Test the webhook URL
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          text: "🎉 Canadian Build Smarts connected successfully!",
          attachments: [{
            color: "good",
            fields: [{
              title: "Status",
              value: "Integration Active",
              short: true
            }, {
              title: "Connected At",
              value: new Date().toLocaleString(),
              short: true
            }]
          }]
        }),
      });

      setIsConnected(true);
      toast({
        title: "Connected to Slack",
        description: "Slack notifications have been enabled successfully.",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Slack. Please check your webhook URL.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!webhookUrl || !isConnected) {
      toast({
        title: "Error",
        description: "Please connect to Slack first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          text: testMessage,
          attachments: [{
            color: "#2196F3",
            fields: [{
              title: "Test Notification",
              value: "This is a test message from Canadian Build Smarts",
              short: false
            }]
          }]
        }),
      });

      toast({
        title: "Test Message Sent",
        description: "Check your Slack channel for the test message.",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to send test message. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendProjectNotification = async (type: string) => {
    if (!isConnected) return;

    const notifications = {
      'project-update': {
        text: "📋 Project Update",
        color: "#2196F3",
        title: "Project Status Changed",
        value: "111 Facer project moved to Construction phase"
      },
      'task-assignment': {
        text: "👷 New Task Assignment",
        color: "#FF9800",
        title: "Task Assigned",
        value: "Foundation inspection assigned to John Smith"
      },
      'deadline-alert': {
        text: "⏰ Deadline Alert",
        color: "#F44336",
        title: "Upcoming Deadline",
        value: "Permit approval due in 2 days for Luxury Family Home project"
      },
      'budget-warning': {
        text: "💰 Budget Warning",
        color: "#FF5722",
        title: "Budget Alert",
        value: "Office Building project is at 85% of budget"
      }
    };

    const notification = notifications[type as keyof typeof notifications];
    
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          text: notification.text,
          attachments: [{
            color: notification.color,
            fields: [{
              title: notification.title,
              value: notification.value,
              short: false
            }, {
              title: "Time",
              value: new Date().toLocaleString(),
              short: true
            }]
          }]
        }),
      });

      toast({
        title: "Notification Sent",
        description: `${notification.title} sent to Slack successfully.`,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Slack Notifications</h2>
          <p className="text-muted-foreground">
            Send project updates and alerts to your Slack workspace
          </p>
        </div>
        <Badge variant={isConnected ? "default" : "secondary"}>
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Connection Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Connection Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook">Slack Webhook URL</Label>
              <Input
                id="webhook"
                placeholder="https://hooks.slack.com/services/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                type="password"
              />
              <p className="text-sm text-muted-foreground">
                Create a webhook in your Slack app settings
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleConnect} 
                disabled={isLoading || isConnected}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                {isLoading ? 'Connecting...' : isConnected ? 'Connected' : 'Connect'}
              </Button>
              {isConnected && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsConnected(false)}
                >
                  Disconnect
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testMessage">Test Message</Label>
              <Textarea
                id="testMessage"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter your test message..."
              />
            </div>

            <Button 
              onClick={handleTest}
              disabled={!isConnected || isLoading}
              className="w-full flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              Send Test Message
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notificationSettings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {getNotificationDescription(key)}
                </p>
              </div>
              <Switch
                checked={value}
                onCheckedChange={(checked) => 
                  setNotificationSettings({
                    ...notificationSettings,
                    [key]: checked
                  })
                }
                disabled={!isConnected}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Demo Notifications */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Demo Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => sendProjectNotification('project-update')}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Project Update
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => sendProjectNotification('task-assignment')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Task Assignment
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => sendProjectNotification('deadline-alert')}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Deadline Alert
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => sendProjectNotification('budget-warning')}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Budget Warning
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const getNotificationDescription = (key: string) => {
  const descriptions: Record<string, string> = {
    projectUpdates: "Get notified when project status or phase changes",
    taskAssignments: "Receive alerts when tasks are assigned to team members",
    deadlineAlerts: "Get warnings about upcoming project deadlines",
    budgetWarnings: "Receive alerts when budgets exceed thresholds",
    teamNotifications: "Get notified about team member activities",
    weeklyReports: "Receive weekly project summary reports"
  };
  return descriptions[key] || "Enable this notification type";
};

export default SlackNotifications;