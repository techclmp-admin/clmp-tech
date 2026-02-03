import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  RefreshCw, 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle,
  Settings,
  Calendar,
  DollarSign
} from 'lucide-react';

const Sage50Integration = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionSettings, setConnectionSettings] = useState({
    serverPath: '',
    database: '',
    username: '',
    password: '',
    autoSync: true,
    syncInterval: 60
  });

  const [syncStats, setSyncStats] = useState({
    lastSync: '2025-01-07 10:30 AM',
    totalTransactions: 156,
    pendingSync: 12,
    errors: 0
  });

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsConnected(true);
      toast({
        title: "Connected to Sage 50",
        description: "Successfully connected to your Sage 50 database."
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Sage 50. Please check your settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSyncStats(prev => ({
        ...prev,
        lastSync: new Date().toLocaleString(),
        pendingSync: 0
      }));
      toast({
        title: "Sync Complete",
        description: "All data has been synchronized with Sage 50."
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Exporting project data to Sage 50 format..."
    });
  };

  const handleImport = () => {
    toast({
      title: "Import Started",
      description: "Importing financial data from Sage 50..."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sage 50 Integration</h2>
          <p className="text-muted-foreground">
            Sync financial data with your Sage 50 accounting system
          </p>
        </div>
        <Badge variant={isConnected ? "default" : "secondary"}>
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="sync">Data Sync</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Connection Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serverPath">Server Path</Label>
                  <Input
                    id="serverPath"
                    placeholder="\\Server\Sage50Data"
                    value={connectionSettings.serverPath}
                    onChange={(e) => setConnectionSettings({
                      ...connectionSettings,
                      serverPath: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="database">Database Name</Label>
                  <Input
                    id="database"
                    placeholder="SAMDAT"
                    value={connectionSettings.database}
                    onChange={(e) => setConnectionSettings({
                      ...connectionSettings,
                      database: e.target.value
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={connectionSettings.username}
                    onChange={(e) => setConnectionSettings({
                      ...connectionSettings,
                      username: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={connectionSettings.password}
                    onChange={(e) => setConnectionSettings({
                      ...connectionSettings,
                      password: e.target.value
                    })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleConnect} 
                  disabled={isLoading || isConnected}
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Calendar className="h-8 w-8 text-blue-500" />
                  <div className="text-right">
                    <div className="text-2xl font-bold">{syncStats.lastSync}</div>
                    <div className="text-sm text-muted-foreground">Last Sync</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div className="text-right">
                    <div className="text-2xl font-bold">{syncStats.totalTransactions}</div>
                    <div className="text-sm text-muted-foreground">Total Transactions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <RefreshCw className="h-8 w-8 text-orange-500" />
                  <div className="text-right">
                    <div className="text-2xl font-bold">{syncStats.pendingSync}</div>
                    <div className="text-sm text-muted-foreground">Pending Sync</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {syncStats.errors > 0 ? (
                    <XCircle className="h-8 w-8 text-red-500" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  )}
                  <div className="text-right">
                    <div className="text-2xl font-bold">{syncStats.errors}</div>
                    <div className="text-sm text-muted-foreground">Sync Errors</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Manual Sync Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={handleSync} 
                  disabled={!isConnected || isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {isLoading ? 'Syncing...' : 'Sync Now'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleExport}
                  disabled={!isConnected}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Export to Sage 50
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleImport}
                  disabled={!isConnected}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Import from Sage 50
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Sync Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Auto Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync data at regular intervals
                  </p>
                </div>
                <Switch
                  checked={connectionSettings.autoSync}
                  onCheckedChange={(checked) => 
                    setConnectionSettings({
                      ...connectionSettings,
                      autoSync: checked
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
                <Input
                  id="syncInterval"
                  type="number"
                  min="5"
                  max="1440"
                  value={connectionSettings.syncInterval}
                  onChange={(e) => setConnectionSettings({
                    ...connectionSettings,
                    syncInterval: parseInt(e.target.value)
                  })}
                />
              </div>

              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Sage50Integration;