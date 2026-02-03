import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Ticket, 
  MessageSquare, 
  BarChart3, 
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  MessageCircle,
  Loader2,
  Star
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const AdminSupportManagement = () => {
  const [activeTab, setActiveTab] = useState('tickets');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Support Management</h2>
        <p className="text-muted-foreground">Manage tickets, feedback, and NPS responses</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="nps" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            NPS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          <TicketsManagement />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <FeedbackManagement />
        </TabsContent>

        <TabsContent value="nps" className="space-y-4">
          <NPSManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const TicketsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tickets, isLoading, refetch } = useQuery({
    queryKey: ['admin-support-tickets', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('ticket_status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: string; updates: Record<string, string> }) => {
      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      toast({ title: "Success", description: "Ticket updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  const getPriorityVariant = (priority: string): "destructive" | "secondary" | "outline" | "default" => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const filteredTickets = tickets?.filter(ticket =>
    searchQuery === '' ||
    ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: tickets?.length || 0,
    open: tickets?.filter(t => t.ticket_status === 'open' || t.status === 'open').length || 0,
    inProgress: tickets?.filter(t => t.ticket_status === 'in_progress' || t.status === 'in_progress').length || 0,
    resolved: tickets?.filter(t => t.ticket_status === 'resolved' || t.status === 'resolved').length || 0
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Ticket className="h-8 w-8 text-primary" />
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <AlertCircle className="h-8 w-8 text-chart-1" />
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.open}</div>
                <div className="text-sm text-muted-foreground">Open</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Clock className="h-8 w-8 text-chart-4" />
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.inProgress}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-8 w-8 text-chart-2" />
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.resolved}</div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTickets?.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tickets found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets?.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-sm">
                      {ticket.ticket_number || '-'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {ticket.subject}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityVariant(ticket.priority_level || ticket.priority || 'normal')}>
                        {ticket.priority_level || ticket.priority || 'normal'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(ticket.ticket_status || ticket.status || 'open')}`} />
                        <span className="capitalize">{(ticket.ticket_status || ticket.status || 'open').replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ticket.ticket_status || ticket.status || 'open'}
                        onValueChange={(value) => updateTicketMutation.mutate({
                          ticketId: ticket.id,
                          updates: { ticket_status: value, status: value }
                        })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const FeedbackManagement = () => {
  const { data: feedback, isLoading, refetch } = useQuery({
    queryKey: ['admin-support-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} 
      />
    ));
  };

  const stats = {
    total: feedback?.length || 0,
    avgRating: feedback?.length ? (feedback.reduce((acc, f) => acc + (f.rating || 0), 0) / feedback.length).toFixed(1) : '0',
    positive: feedback?.filter(f => (f.rating || 0) >= 4).length || 0,
    negative: feedback?.filter(f => (f.rating || 0) < 3).length || 0
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Star className="h-8 w-8 text-chart-4" />
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.avgRating}</div>
                <div className="text-sm text-muted-foreground">Avg Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-8 w-8 text-chart-2" />
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.positive}</div>
                <div className="text-sm text-muted-foreground">Positive</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.negative}</div>
                <div className="text-sm text-muted-foreground">Negative</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Feedback</CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : feedback?.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No feedback received yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedback?.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1">
                        {getRatingStars(item.rating || 0)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {item.feedback && (
                      <p className="text-sm text-muted-foreground">{item.feedback}</p>
                    )}
                    {item.page_url && (
                      <p className="text-xs text-muted-foreground mt-2">Page: {item.page_url}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const NPSManagement = () => {
  const { data: npsResponses, isLoading, refetch } = useQuery({
    queryKey: ['admin-nps-responses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nps_responses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const calculateNPS = () => {
    if (!npsResponses?.length) return { score: 0, promoters: 0, passives: 0, detractors: 0 };
    
    const promoters = npsResponses.filter(r => r.score >= 9).length;
    const passives = npsResponses.filter(r => r.score >= 7 && r.score < 9).length;
    const detractors = npsResponses.filter(r => r.score < 7).length;
    const total = npsResponses.length;
    
    const score = Math.round(((promoters - detractors) / total) * 100);
    
    return { score, promoters, passives, detractors };
  };

  const npsStats = calculateNPS();
  const total = npsResponses?.length || 0;

  return (
    <div className="space-y-4">
      {/* NPS Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className={`text-6xl font-bold mb-2 ${
                npsStats.score >= 50 ? 'text-chart-2' : 
                npsStats.score >= 0 ? 'text-chart-4' : 'text-destructive'
              }`}>
                {npsStats.score}
              </div>
              <p className="text-muted-foreground">Net Promoter Score</p>
              <p className="text-sm text-muted-foreground mt-2">
                Based on {total} responses
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-chart-2">Promoters (9-10)</span>
                <span>{npsStats.promoters} ({total ? Math.round((npsStats.promoters / total) * 100) : 0}%)</span>
              </div>
              <Progress 
                value={total ? (npsStats.promoters / total) * 100 : 0} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-chart-4">Passives (7-8)</span>
                <span>{npsStats.passives} ({total ? Math.round((npsStats.passives / total) * 100) : 0}%)</span>
              </div>
              <Progress 
                value={total ? (npsStats.passives / total) * 100 : 0} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-destructive">Detractors (0-6)</span>
                <span>{npsStats.detractors} ({total ? Math.round((npsStats.detractors / total) * 100) : 0}%)</span>
              </div>
              <Progress 
                value={total ? (npsStats.detractors / total) * 100 : 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Responses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent NPS Responses</CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : npsResponses?.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No NPS responses yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {npsResponses?.slice(0, 10).map((response) => (
                <Card key={response.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          response.score >= 9 ? 'bg-chart-2' :
                          response.score >= 7 ? 'bg-chart-4' : 'bg-destructive'
                        }`}>
                          {response.score}
                        </div>
                        <Badge variant={
                          response.score >= 9 ? 'default' :
                          response.score >= 7 ? 'secondary' : 'destructive'
                        }>
                          {response.score >= 9 ? 'Promoter' : response.score >= 7 ? 'Passive' : 'Detractor'}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {response.feedback && (
                      <p className="text-sm text-muted-foreground mt-2">
                        "{response.feedback}"
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSupportManagement;
