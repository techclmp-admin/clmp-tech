import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobilePageWrapper, MobileCard, MobileSegmentedControl } from "@/components/mobile";
import { 
  ShieldAlert, 
  Activity, 
  Ban,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  FileText,
  Clock
} from "lucide-react";

const SecurityDashboard = () => {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [activeTab, setActiveTab] = useState('logs');

  // Fetch bot detection logs
  const { data: botLogs = [] } = useQuery({
    queryKey: ['bot-logs', timeRange],
    queryFn: async () => {
      const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : 168;
      const since = new Date(Date.now() - hours * 3600000).toISOString();
      
      const { data, error } = await supabase
        .from('bot_detection_logs')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch rate limit violations
  const { data: rateLimits = [] } = useQuery({
    queryKey: ['rate-limits', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advanced_rate_limits')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate stats
  const totalRequests = botLogs.length;
  const blockedRequests = botLogs.filter(log => log.is_blocked).length;
  const suspiciousRequests = botLogs.filter(log => log.is_bot && !log.is_blocked).length;
  const cleanRequests = botLogs.filter(log => !log.is_bot).length;
  const blockRate = totalRequests > 0 ? ((blockedRequests / totalRequests) * 100).toFixed(1) : '0';

  // Top blocked IPs
  const ipCounts: Record<string, number> = {};
  botLogs.forEach(log => {
    if (log.is_blocked && log.ip_address) {
      const ip = String(log.ip_address);
      ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    }
  });
  const topBlockedIPs = Object.entries(ipCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const timeRangeOptions = [
    { value: '1h', label: '1 Hour', icon: <Clock className="h-4 w-4" /> },
    { value: '24h', label: '24 Hours', icon: <Clock className="h-4 w-4" /> },
    { value: '7d', label: '7 Days', icon: <Clock className="h-4 w-4" /> },
  ];

  const tabOptions = [
    { value: 'logs', label: 'Detection Logs', icon: <FileText className="h-5 w-5" /> },
    { value: 'blocked-ips', label: 'Blocked IPs', icon: <Ban className="h-5 w-5" /> },
    { value: 'rate-limits', label: 'Rate Limits', icon: <ShieldAlert className="h-5 w-5" /> },
  ];

  return (
    <MobilePageWrapper
      title="Security Dashboard"
      subtitle="Bot detection, rate limiting, and security monitoring"
      actions={
        <div className="hidden md:flex gap-2">
          <Button
            variant={timeRange === '1h' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('1h')}
          >
            1 Hour
          </Button>
          <Button
            variant={timeRange === '24h' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('24h')}
          >
            24 Hours
          </Button>
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </Button>
        </div>
      }
    >
      {/* Mobile Time Range Selector */}
      <div className="md:hidden">
        <MobileSegmentedControl
          options={timeRangeOptions}
          value={timeRange}
          onChange={(v) => setTimeRange(v as '1h' | '24h' | '7d')}
        />
      </div>

      {/* Stats - Mobile Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MobileCard
          title="Total Requests"
          value={totalRequests.toString()}
          icon={<Activity className="h-5 w-5 text-blue-600" />}
        />
        <MobileCard
          title="Blocked"
          value={blockedRequests.toString()}
          subtitle={`${blockRate}% block rate`}
          icon={<Ban className="h-5 w-5 text-red-600" />}
          variant="filled"
        />
        <MobileCard
          title="Suspicious"
          value={suspiciousRequests.toString()}
          icon={<AlertTriangle className="h-5 w-5 text-yellow-600" />}
        />
        <MobileCard
          title="Clean Traffic"
          value={cleanRequests.toString()}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
        />
      </div>

      {/* Mobile Segmented Control for Tabs */}
      <div className="md:hidden">
        <MobileSegmentedControl
          options={tabOptions}
          value={activeTab}
          onChange={setActiveTab}
          variant="card"
        />
      </div>

      {/* Desktop Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Detection Logs</TabsTrigger>
          <TabsTrigger value="blocked-ips">Blocked IPs</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tab Content */}
      {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Detection Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {botLogs.slice(0, 20).map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <code className="text-sm font-mono">{String(log.ip_address || 'unknown')}</code>
                      {log.is_blocked && <Badge variant="destructive">Blocked</Badge>}
                      {log.is_bot && !log.is_blocked && <Badge variant="secondary">Bot</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{log.request_path || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Score: {log.risk_score || 0} • {new Date(log.created_at).toLocaleString()}
                    </p>
                    {log.block_reason && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Reason: {log.block_reason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {botLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No detection events in this time range
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'blocked-ips' && (
        <Card>
          <CardHeader>
            <CardTitle>Top Blocked IPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topBlockedIPs.map(([ip, count]) => (
                <div key={ip} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <code className="text-sm font-mono">{ip}</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      {count} blocked request{count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Unblock
                  </Button>
                </div>
              ))}
              {topBlockedIPs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No blocked IPs in this time range
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'rate-limits' && (
        <Card>
          <CardHeader>
            <CardTitle>Rate Limit Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rateLimits.slice(0, 20).map((limit) => (
                <div key={limit.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <code className="text-sm font-mono">{limit.identifier}</code>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-xs text-muted-foreground">
                        Requests: {limit.request_count}
                      </p>
                      {limit.is_blocked && (
                        <Badge variant="destructive">Blocked</Badge>
                      )}
                      {limit.consecutive_violations > 0 && (
                        <Badge variant="secondary">
                          {limit.consecutive_violations} violation{limit.consecutive_violations !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {rateLimits.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No rate limit data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </MobilePageWrapper>
  );
};

export default SecurityDashboard;
