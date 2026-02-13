import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Mail, 
  Send, 
  Plus, 
  Users, 
  Play, 
  Pause, 
  Trash2, 
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  FileText,
  TrendingUp,
  MousePointerClick,
  BarChart3,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { useAuth } from "@/hooks/useAuth";

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  description: string | null;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  complained_count: number;
  created_at: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
}

interface EmailEvent {
  id: string;
  campaign_id: string;
  event_type: string;
  link_url: string | null;
  user_agent: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  subscription_plan: string | null;
}

export const AdminBulkEmailManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [recipientsDialogOpen, setRecipientsDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    description: "",
    html_content: getDefaultTemplate(),
    recipientFilter: "all" as "all" | "standard" | "enterprise" | "trial" | "custom",
    customEmails: "",
  });

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Fetch campaigns
  const { data: campaigns = [], isLoading: campaignsLoading, refetch: refetchCampaigns } = useQuery({
    queryKey: ["email-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as EmailCampaign[];
    },
  });

  // Fetch users for recipient selection
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users-for-email"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, subscription_plan")
        .order("email");
      
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // Fetch email events for selected campaign analytics
  const { data: campaignEvents = [], refetch: refetchEvents } = useQuery({
    queryKey: ["campaign-events", selectedCampaign?.id],
    queryFn: async () => {
      if (!selectedCampaign?.id) return [];
      const { data, error } = await supabase
        .from("email_events")
        .select("id, campaign_id, event_type, link_url, user_agent, created_at")
        .eq("campaign_id", selectedCampaign.id)
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as EmailEvent[];
    },
    enabled: !!selectedCampaign?.id && analyticsDialogOpen,
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      // Determine recipients
      let recipients: { email: string; name: string; user_id?: string }[] = [];

      if (formData.recipientFilter === "custom" && formData.customEmails) {
        // Parse custom emails
        const emails = formData.customEmails.split(/[\n,]/).map(e => e.trim()).filter(e => e);
        recipients = emails.map(email => ({
          email,
          name: email.split("@")[0],
        }));
      } else if (formData.recipientFilter === "custom" && selectedUsers.length > 0) {
        // Use selected users
        recipients = users
          .filter(u => selectedUsers.includes(u.id))
          .map(u => ({
            email: u.email,
            name: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email.split("@")[0],
            user_id: u.id,
          }));
      } else {
        // Filter by subscription plan
        let filteredUsers = users;
        if (formData.recipientFilter !== "all") {
          filteredUsers = users.filter(u => u.subscription_plan === formData.recipientFilter);
        }
        recipients = filteredUsers.map(u => ({
          email: u.email,
          name: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email.split("@")[0],
          user_id: u.id,
        }));
      }

      if (recipients.length === 0) {
        throw new Error("No recipients selected");
      }

      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from("email_campaigns")
        .insert({
          name: formData.name,
          subject: formData.subject,
          description: formData.description,
          html_content: formData.html_content,
          status: "draft",
          total_recipients: recipients.length,
          created_by: user?.id,
          recipient_filter: { type: formData.recipientFilter },
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Insert recipients
      const recipientRecords = recipients.map(r => ({
        campaign_id: campaign.id,
        recipient_email: r.email,
        recipient_name: r.name,
        user_id: r.user_id || null,
        status: "pending",
      }));

      const { error: recipientsError } = await supabase
        .from("email_campaign_recipients")
        .insert(recipientRecords);

      if (recipientsError) throw recipientsError;

      return campaign;
    },
    onSuccess: () => {
      toast.success("Campaign created successfully");
      setCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });

  // Send campaign mutation
  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      setIsSending(true);
      
      // Process in batches
      let hasMore = true;
      let totalSent = 0;
      let totalFailed = 0;

      while (hasMore) {
        const { data, error } = await supabase.functions.invoke("send-bulk-email", {
          body: { campaign_id: campaignId, batch_size: 10 },
        });

        if (error) throw error;

        totalSent += data.sent || 0;
        totalFailed += data.failed || 0;
        hasMore = data.hasMore;

        // Refresh campaign data
        await refetchCampaigns();

        // Small delay between batches
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return { sent: totalSent, failed: totalFailed };
    },
    onSuccess: (data) => {
      toast.success(`Campaign completed! Sent: ${data.sent}, Failed: ${data.failed}`);
      setIsSending(false);
    },
    onError: (error: Error) => {
      toast.error(`Campaign failed: ${error.message}`);
      setIsSending(false);
    },
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from("email_campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campaign deleted");
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      subject: "",
      description: "",
      html_content: getDefaultTemplate(),
      recipientFilter: "all",
      customEmails: "",
    });
    setSelectedUsers([]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline"><FileText className="w-3 h-3 mr-1" />Draft</Badge>;
      case "sending":
        return <Badge variant="default" className="bg-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Sending</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "cancelled":
        return <Badge variant="secondary"><Pause className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFilteredUserCount = () => {
    if (formData.recipientFilter === "all") return users.length;
    if (formData.recipientFilter === "custom") {
      if (formData.customEmails) {
        return formData.customEmails.split(/[\n,]/).filter(e => e.trim()).length;
      }
      return selectedUsers.length;
    }
    return users.filter(u => u.subscription_plan === formData.recipientFilter).length;
  };

  // Stats
  const stats = {
    total: campaigns.length,
    draft: campaigns.filter(c => c.status === "draft").length,
    sending: campaigns.filter(c => c.status === "sending").length,
    completed: campaigns.filter(c => c.status === "completed").length,
    totalSent: campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0),
    totalOpened: campaigns.reduce((acc, c) => acc + (c.opened_count || 0), 0),
    totalClicked: campaigns.reduce((acc, c) => acc + (c.clicked_count || 0), 0),
  };

  // Calculate analytics for selected campaign
  const getAnalyticsData = () => {
    if (!selectedCampaign) return null;
    
    const sent = selectedCampaign.sent_count || 0;
    const opened = selectedCampaign.opened_count || 0;
    const clicked = selectedCampaign.clicked_count || 0;
    const bounced = selectedCampaign.bounced_count || 0;
    const complained = selectedCampaign.complained_count || 0;
    const failed = selectedCampaign.failed_count || 0;

    const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(1) : "0";
    const clickRate = sent > 0 ? ((clicked / sent) * 100).toFixed(1) : "0";
    const clickToOpenRate = opened > 0 ? ((clicked / opened) * 100).toFixed(1) : "0";
    const bounceRate = sent > 0 ? ((bounced / sent) * 100).toFixed(1) : "0";

    return {
      sent,
      opened,
      clicked,
      bounced,
      complained,
      failed,
      openRate,
      clickRate,
      clickToOpenRate,
      bounceRate,
    };
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Mail className="h-8 w-8 text-primary" />
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Campaigns</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.draft}</div>
                <div className="text-sm text-muted-foreground">Drafts</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Loader2 className="h-8 w-8 text-blue-500" />
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.sending}</div>
                <div className="text-sm text-muted-foreground">Sending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.totalSent}</div>
                <div className="text-sm text-muted-foreground">Emails Sent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Bulk Email Campaigns
              </CardTitle>
              <CardDescription>
                Create and manage email campaigns for marketing or system announcements
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetchCampaigns()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No campaigns yet. Create your first campaign!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const progress = campaign.total_recipients > 0 
                    ? Math.round(((campaign.sent_count + campaign.failed_count) / campaign.total_recipients) * 100)
                    : 0;

                  return (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-muted-foreground">{campaign.subject}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={progress} className="h-2 w-24" />
                          <div className="text-xs text-muted-foreground">
                            {campaign.sent_count}/{campaign.total_recipients} sent
                            {campaign.failed_count > 0 && (
                              <span className="text-destructive ml-1">({campaign.failed_count} failed)</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(campaign.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setPreviewDialogOpen(true);
                            }}
                            title="Preview Email"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(campaign.status === "completed" || campaign.status === "sending") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCampaign(campaign);
                                setAnalyticsDialogOpen(true);
                              }}
                              title="View Analytics"
                            >
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                          )}
                          {campaign.status === "draft" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => sendCampaignMutation.mutate(campaign.id)}
                              disabled={isSending}
                            >
                              {isSending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {campaign.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Create Email Campaign</DialogTitle>
            <DialogDescription>
              Create a new bulk email campaign for marketing or announcements
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Campaign Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., January Newsletter"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Subject *</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., New Features Available!"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Internal note about this campaign"
                />
              </div>

              <div className="space-y-2">
                <Label>Recipients</Label>
                <Select
                  value={formData.recipientFilter}
                  onValueChange={(value: any) => setFormData({ ...formData, recipientFilter: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users ({users.length})</SelectItem>
                    <SelectItem value="standard">Standard Plan ({users.filter(u => u.subscription_plan === "standard").length})</SelectItem>
                    <SelectItem value="enterprise">Enterprise Plan ({users.filter(u => u.subscription_plan === "enterprise").length})</SelectItem>
                    <SelectItem value="trial">Trial Users ({users.filter(u => u.subscription_plan === "trial").length})</SelectItem>
                    <SelectItem value="custom">Custom Selection</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {getFilteredUserCount()} recipient(s) will receive this email
                </p>
              </div>

              {formData.recipientFilter === "custom" && (
                <div className="space-y-2">
                  <Label>Custom Email List (or select users below)</Label>
                  <Textarea
                    value={formData.customEmails}
                    onChange={(e) => setFormData({ ...formData, customEmails: e.target.value })}
                    placeholder="Enter emails separated by commas or new lines"
                    rows={3}
                  />
                  
                  <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                      {users.slice(0, 50).map((u) => (
                        <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedUsers.includes(u.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUsers([...selectedUsers, u.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                              }
                            }}
                          />
                          <span className="text-sm">
                            {u.first_name} {u.last_name} ({u.email})
                          </span>
                          {u.subscription_plan && (
                            <Badge variant="outline" className="text-xs">{u.subscription_plan}</Badge>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Email Content (HTML)</Label>
                <Textarea
                  value={formData.html_content}
                  onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                  className="min-h-[300px] font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Available variables: {"{{user_name}}"}, {"{{user_email}}"}, {"{{unsubscribe_link}}"}
                </p>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createCampaignMutation.mutate()}
              disabled={!formData.name || !formData.subject || !formData.html_content || createCampaignMutation.isPending}
            >
              {createCampaignMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Campaign Preview: {selectedCampaign?.name}</DialogTitle>
            <DialogDescription>
              Subject: {selectedCampaign?.subject}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedCampaign && (
              <div 
                className="border rounded-lg p-4"
                dangerouslySetInnerHTML={{ 
                  __html: selectedCampaign.html_content
                    .replace(/{{user_name}}/g, "John Smith")
                    .replace(/{{user_email}}/g, "john@example.com")
                    .replace(/{{unsubscribe_link}}/g, "#")
                }}
              />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={analyticsDialogOpen} onOpenChange={setAnalyticsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Campaign Analytics: {selectedCampaign?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed engagement metrics for this email campaign
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {selectedCampaign && (() => {
              const analytics = getAnalyticsData();
              if (!analytics) return null;

              const pieData = [
                { name: "Opened", value: analytics.opened, color: "hsl(var(--primary))" },
                { name: "Not Opened", value: analytics.sent - analytics.opened, color: "hsl(var(--muted))" },
              ].filter(d => d.value > 0);

              const eventTypeCounts = campaignEvents.reduce((acc, event) => {
                acc[event.event_type] = (acc[event.event_type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);

              const barData = Object.entries(eventTypeCounts).map(([type, count]) => ({
                type: type.replace("email.", ""),
                count,
              }));

              const clickedLinks = campaignEvents
                .filter(e => e.event_type === "email.clicked" && e.link_url)
                .reduce((acc, event) => {
                  const url = event.link_url || "Unknown";
                  acc[url] = (acc[url] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);

              return (
                <div className="space-y-6 p-1">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-primary">{analytics.openRate}%</div>
                        <div className="text-sm text-muted-foreground">Open Rate</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {analytics.opened} / {analytics.sent}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-primary">{analytics.clickRate}%</div>
                        <div className="text-sm text-muted-foreground">Click Rate</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {analytics.clicked} / {analytics.sent}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-primary">{analytics.clickToOpenRate}%</div>
                        <div className="text-sm text-muted-foreground">Click-to-Open</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {analytics.clicked} / {analytics.opened}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-destructive">{analytics.bounceRate}%</div>
                        <div className="text-sm text-muted-foreground">Bounce Rate</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {analytics.bounced} bounced
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Delivery Stats */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Delivery Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold">{analytics.sent}</div>
                          <div className="text-xs text-muted-foreground">Sent</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-green-600">{analytics.opened}</div>
                          <div className="text-xs text-muted-foreground">Opened</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-blue-600">{analytics.clicked}</div>
                          <div className="text-xs text-muted-foreground">Clicked</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-orange-600">{analytics.bounced}</div>
                          <div className="text-xs text-muted-foreground">Bounced</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-red-600">{analytics.complained}</div>
                          <div className="text-xs text-muted-foreground">Complaints</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-muted-foreground">{analytics.failed}</div>
                          <div className="text-xs text-muted-foreground">Failed</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Charts Row */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Open Rate Pie Chart */}
                    {pieData.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Open Rate Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={70}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  labelLine={false}
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Event Types Bar Chart */}
                    {barData.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Event Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={barData}>
                                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Clicked Links */}
                  {Object.keys(clickedLinks).length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <MousePointerClick className="h-4 w-4" />
                          Clicked Links
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>URL</TableHead>
                              <TableHead className="text-right">Clicks</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(clickedLinks)
                              .sort(([, a], [, b]) => b - a)
                              .map(([url, count]) => (
                                <TableRow key={url}>
                                  <TableCell className="font-mono text-xs max-w-[400px] truncate">
                                    {url}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">{count}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recent Events */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>Recent Events</span>
                        <Button variant="ghost" size="sm" onClick={() => refetchEvents()}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {campaignEvents.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          No events recorded yet. Events will appear here as recipients interact with the email.
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Event</TableHead>
                              <TableHead>Details</TableHead>
                              <TableHead>Time</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {campaignEvents.slice(0, 20).map((event) => (
                              <TableRow key={event.id}>
                                <TableCell>
                                  <Badge variant={
                                    event.event_type.includes("opened") ? "default" :
                                    event.event_type.includes("clicked") ? "secondary" :
                                    event.event_type.includes("bounced") ? "destructive" :
                                    "outline"
                                  }>
                                    {event.event_type.replace("email.", "")}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                  {event.link_url || event.user_agent || "-"}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {format(new Date(event.created_at), "MMM d, HH:mm")}
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
            })()}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function getDefaultTemplate(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CLMP Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f97316; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">CLMP</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px;">Hello {{user_name}},</h2>
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                We're excited to share some updates with you!
              </p>
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                [Your message content goes here]
              </p>
              <p style="margin: 30px 0; text-align: center;">
                <a href="https://clmp.ca/dashboard" style="display: inline-block; padding: 12px 30px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Visit Dashboard
                </a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; color: #888888; font-size: 12px;">
                © 2026 CLMP. All rights reserved.
              </p>
              <p style="margin: 10px 0 0; color: #888888; font-size: 12px;">
                <a href="{{unsubscribe_link}}" style="color: #888888;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}