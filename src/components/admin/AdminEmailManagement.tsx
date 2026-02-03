import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Mail, Edit, Eye, Send, History, CheckCircle, XCircle, Clock, RefreshCw, Users } from "lucide-react";
import { AdminBulkEmailManagement } from "./AdminBulkEmailManagement";
import { format } from "date-fns";

interface EmailTemplate {
  id: string;
  template_key: string;
  template_name: string;
  subject: string;
  html_content: string;
  description: string | null;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailLog {
  id: string;
  template_key: string;
  recipient_email: string;
  subject: string;
  status: string;
  resend_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export const AdminEmailManagement = () => {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [editForm, setEditForm] = useState({
    subject: "",
    html_content: "",
    description: "",
    is_active: true,
  });

  // Fetch email templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('template_name');
      
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  // Fetch email logs
  const { data: emailLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['email-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as EmailLog[];
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (data: Partial<EmailTemplate> & { id: string }) => {
      const { error } = await supabase
        .from('email_templates')
        .update({
          subject: data.subject,
          html_content: data.html_content,
          description: data.description,
          is_active: data.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Email template updated successfully');
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });

  // Send test email mutation
  const sendTestMutation = useMutation({
    mutationFn: async ({ template_key, email }: { template_key: string; email: string }) => {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          template_key,
          recipient_email: email,
          variables: {
            user_name: 'Test User',
            user_email: email,
            dashboard_url: 'https://clmp.ca/dashboard',
            reset_password_url: 'https://clmp.ca/auth?reset=true',
            reset_link: 'https://clmp.ca/auth?token=test-token',
            confirmation_link: 'https://clmp.ca/auth?confirm=test-token',
            change_date: format(new Date(), 'MMMM d, yyyy'),
            change_time: format(new Date(), 'h:mm a'),
            timezone: 'EST',
          },
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Test email sent successfully');
      setIsTestDialogOpen(false);
      setTestEmail("");
      queryClient.invalidateQueries({ queryKey: ['email-logs'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send test email: ${error.message}`);
    },
  });

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      subject: template.subject,
      html_content: template.html_content,
      description: template.description || "",
      is_active: template.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  const handleSendTest = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsTestDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;
    updateTemplateMutation.mutate({
      id: selectedTemplate.id,
      ...editForm,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getPreviewHtml = (html: string) => {
    // Replace template variables with sample values
    return html
      .replace(/{{user_name}}/g, 'John Smith')
      .replace(/{{user_email}}/g, 'john.smith@example.com')
      .replace(/{{dashboard_url}}/g, 'https://clmp.ca/dashboard')
      .replace(/{{reset_password_url}}/g, 'https://clmp.ca/auth?reset=true')
      .replace(/{{reset_link}}/g, 'https://clmp.ca/auth?token=abc123')
      .replace(/{{confirmation_link}}/g, 'https://clmp.ca/auth?confirm=abc123')
      .replace(/{{change_date}}/g, 'January 19, 2026')
      .replace(/{{change_time}}/g, '3:30 PM')
      .replace(/{{timezone}}/g, 'EST');
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Email Management</h2>
          <p className="text-muted-foreground text-sm">
            Manage email templates and view sending history
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['email-logs'] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Send History
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Bulk Campaigns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {templatesLoading ? (
            <Card>
              <CardContent className="py-10">
                <p className="text-center text-muted-foreground">Loading templates...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {templates?.map((template) => (
                <Card key={template.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Mail className="h-5 w-5" />
                          {template.template_name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Subject</Label>
                      <p className="text-sm font-medium truncate">{template.subject}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Variables</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.variables?.map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => handlePreview(template)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" onClick={() => handleSendTest(template)}>
                        <Send className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Email Send History</CardTitle>
              <CardDescription>Recent emails sent from the system</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <p className="text-center py-10 text-muted-foreground">Loading logs...</p>
              ) : emailLogs && emailLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Sent At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emailLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <span className="capitalize">{log.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.template_key}</Badge>
                        </TableCell>
                        <TableCell>{log.recipient_email}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{log.subject}</TableCell>
                        <TableCell>
                          {log.sent_at ? format(new Date(log.sent_at), 'MMM d, yyyy h:mm a') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-10 text-muted-foreground">No emails sent yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <AdminBulkEmailManagement />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Email Template: {selectedTemplate?.template_name}</DialogTitle>
            <DialogDescription>
              Modify the email subject, content, and settings
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={editForm.is_active}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Brief description of when this email is sent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={editForm.subject}
                  onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="html_content">HTML Content</Label>
                <Textarea
                  id="html_content"
                  value={editForm.html_content}
                  onChange={(e) => setEditForm({ ...editForm, html_content: e.target.value })}
                  className="min-h-[400px] font-mono text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Available Variables</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedTemplate?.variables?.map((variable) => (
                    <Badge key={variable} variant="secondary" className="text-xs">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={updateTemplateMutation.isPending}>
              {updateTemplateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Email Preview: {selectedTemplate?.template_name}</DialogTitle>
            <DialogDescription>
              Subject: {selectedTemplate?.subject}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {selectedTemplate && (
              <div 
                className="border rounded-lg overflow-hidden"
                dangerouslySetInnerHTML={{ __html: getPreviewHtml(selectedTemplate.html_content) }}
              />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test "{selectedTemplate?.template_name}" email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test_email">Recipient Email</Label>
              <Input
                id="test_email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedTemplate && sendTestMutation.mutate({ 
                template_key: selectedTemplate.template_key, 
                email: testEmail 
              })}
              disabled={!testEmail || sendTestMutation.isPending}
            >
              {sendTestMutation.isPending ? "Sending..." : "Send Test Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmailManagement;
