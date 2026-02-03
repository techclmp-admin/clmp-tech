import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Clock,
  FileText,
  DollarSign,
  Users
} from 'lucide-react';

const QuickBooksIntegration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch integrations
  const { data: integrations, isLoading } = useQuery({
    queryKey: ['quickbooks-integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quickbooks_integrations')
        .select('*, quickbooks_export_settings(*)')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch sync logs
  const { data: syncLogs } = useQuery({
    queryKey: ['quickbooks-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quickbooks_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  const connectToQuickBooks = () => {
    setIsConnecting(true);
    const clientId = 'YOUR_QUICKBOOKS_CLIENT_ID'; // This should come from env
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/quickbooks/callback');
    const scope = encodeURIComponent('com.intuit.quickbooks.accounting');
    const state = crypto.randomUUID();
    
    localStorage.setItem('qb_oauth_state', state);
    
    const authUrl = `https://appcenter.intuit.com/connect/oauth2?` +
      `client_id=${clientId}&` +
      `scope=${scope}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `state=${state}`;
    
    window.location.href = authUrl;
  };

  const disconnectMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { data, error } = await supabase.functions.invoke('quickbooks-oauth', {
        body: { action: 'disconnect', integration_id: integrationId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quickbooks-integrations'] });
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from QuickBooks",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { data, error } = await supabase.functions.invoke('quickbooks-oauth', {
        body: { action: 'test_connection', integration_id: integrationId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: data.connected ? "Connected" : "Connection Failed",
        description: data.connected ? "QuickBooks connection is working" : "Failed to connect to QuickBooks",
        variant: data.connected ? "default" : "destructive",
      });
    }
  });

  const exportDataMutation = useMutation({
    mutationFn: async ({ integrationId, exportType, entityIds }: { 
      integrationId: string; 
      exportType: string; 
      entityIds?: string[] 
    }) => {
      const { data, error } = await supabase.functions.invoke('quickbooks-export', {
        body: { 
          action: 'export', 
          integration_id: integrationId, 
          export_type: exportType,
          entity_ids: entityIds 
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quickbooks-sync-logs'] });
      toast({
        title: "Export Started",
        description: `Successfully exported ${data.results.success} records`,
      });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async ({ integrationId, settings }: { 
      integrationId: string; 
      settings: any 
    }) => {
      const { error } = await supabase
        .from('quickbooks_export_settings')
        .update(settings)
        .eq('integration_id', integrationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quickbooks-integrations'] });
      toast({
        title: "Settings Updated",
        description: "Export settings have been saved",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const activeIntegration = integrations?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">QuickBooks Integration</h1>
          <p className="text-muted-foreground">
            Export your construction data to QuickBooks for accounting
          </p>
        </div>
        
        {!activeIntegration && (
          <Button onClick={connectToQuickBooks} disabled={isConnecting}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Connect to QuickBooks
          </Button>
        )}
      </div>

      {activeIntegration ? (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="export">Export Data</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="logs">Sync Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Connection Status</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Company</p>
                    <p className="text-sm text-muted-foreground">
                      {activeIntegration.company_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Last Sync</p>
                    <p className="text-sm text-muted-foreground">
                      {activeIntegration.last_sync_at 
                        ? new Date(activeIntegration.last_sync_at).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnectionMutation.mutate(activeIntegration.id)}
                    disabled={testConnectionMutation.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${testConnectionMutation.isPending ? 'animate-spin' : ''}`} />
                    Test Connection
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectMutation.mutate(activeIntegration.id)}
                    disabled={disconnectMutation.isPending}
                  >
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => exportDataMutation.mutate({ 
                      integrationId: activeIntegration.id, 
                      exportType: 'projects' 
                    })}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Export Projects</p>
                      <p className="text-sm text-muted-foreground">As customers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => exportDataMutation.mutate({ 
                      integrationId: activeIntegration.id, 
                      exportType: 'expenses' 
                    })}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Export Expenses</p>
                      <p className="text-sm text-muted-foreground">Project costs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => exportDataMutation.mutate({ 
                      integrationId: activeIntegration.id, 
                      exportType: 'invoices' 
                    })}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Export Invoices</p>
                      <p className="text-sm text-muted-foreground">Billing data</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Data to QuickBooks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => exportDataMutation.mutate({ 
                      integrationId: activeIntegration.id, 
                      exportType: 'projects' 
                    })}
                    disabled={exportDataMutation.isPending}
                    className="h-20 flex-col"
                  >
                    <Users className="h-6 w-6 mb-2" />
                    Export All Projects
                  </Button>

                  <Button
                    onClick={() => exportDataMutation.mutate({ 
                      integrationId: activeIntegration.id, 
                      exportType: 'expenses' 
                    })}
                    disabled={exportDataMutation.isPending}
                    className="h-20 flex-col"
                  >
                    <DollarSign className="h-6 w-6 mb-2" />
                    Export All Expenses
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeIntegration.quickbooks_export_settings?.[0] && (
                  <ExportSettings 
                    settings={activeIntegration.quickbooks_export_settings[0]}
                    onUpdate={(settings) => updateSettingsMutation.mutate({ 
                      integrationId: activeIntegration.id, 
                      settings 
                    })}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Sync Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <SyncLogsList logs={syncLogs || []} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <ExternalLink className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Connect to QuickBooks</h3>
            <p className="text-muted-foreground mb-4">
              Export your construction projects, expenses, and invoices directly to QuickBooks for seamless accounting.
            </p>
            <Button onClick={connectToQuickBooks} disabled={isConnecting}>
              Connect Now
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const ExportSettings = ({ settings, onUpdate }: { 
  settings: any; 
  onUpdate: (settings: any) => void; 
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onUpdate(newSettings);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Auto Sync</label>
        <Switch
          checked={localSettings.auto_sync_enabled}
          onCheckedChange={(checked) => handleSettingChange('auto_sync_enabled', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Sync Frequency</label>
        <Select
          value={localSettings.sync_frequency}
          onValueChange={(value) => handleSettingChange('sync_frequency', value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="hourly">Hourly</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Export Options</h4>
        {[
          { key: 'export_customers', label: 'Customers' },
          { key: 'export_invoices', label: 'Invoices' },
          { key: 'export_expenses', label: 'Expenses' },
          { key: 'export_payments', label: 'Payments' },
          { key: 'export_projects_as_customers', label: 'Projects as Customers' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <label className="text-sm">{label}</label>
            <Switch
              checked={localSettings[key]}
              onCheckedChange={(checked) => handleSettingChange(key, checked)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const SyncLogsList = ({ logs }: { logs: any[] }) => (
  <div className="space-y-2">
    {logs.length === 0 ? (
      <p className="text-center text-muted-foreground py-4">No sync logs yet</p>
    ) : (
      logs.map((log) => (
        <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`p-1 rounded-full ${
              log.status === 'completed' ? 'bg-green-100' :
              log.status === 'failed' ? 'bg-red-100' :
              'bg-yellow-100'
            }`}>
              {log.status === 'completed' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : log.status === 'failed' ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <Clock className="h-4 w-4 text-yellow-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {log.sync_type} {log.direction}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(log.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm">
              {log.records_success || 0} success, {log.records_failed || 0} failed
            </p>
            <Badge variant={
              log.status === 'completed' ? 'default' :
              log.status === 'failed' ? 'destructive' :
              'secondary'
            }>
              {log.status}
            </Badge>
          </div>
        </div>
      ))
    )}
  </div>
);

export default QuickBooksIntegration;