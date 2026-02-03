import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, FileText, Calendar, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const AdminAuditLogs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('24h');

  // Fetch audit logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', timeRange],
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

  const filteredLogs = logs?.filter(log => {
    const search = searchQuery.toLowerCase();
    return log.ip_address?.toString().toLowerCase().includes(search);
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Logs
            </span>
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Logs */}
          <div className="space-y-3">
            {filteredLogs?.map((log: any) => (
              <div key={log.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {String(log.ip_address || 'unknown')}
                    </code>
                    {log.is_blocked && (
                      <Badge variant="destructive">Blocked</Badge>
                    )}
                    {log.is_bot && !log.is_blocked && (
                      <Badge variant="secondary">Bot</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Fingerprint: {log.fingerprint_hash?.slice(0, 16) || 'N/A'}...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Risk Score: {log.risk_score || 0}
                </p>
                {log.block_reason && (
                  <p className="text-xs text-destructive mt-2">
                    Reason: {log.block_reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
