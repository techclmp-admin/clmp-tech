import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ShieldCheck
} from "lucide-react";
import { useOBCCompliance } from "@/hooks/useComplianceData";
import { AddOBCComplianceDialog } from "./AddOBCComplianceDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface OBCComplianceTrackerProps {
  projectId: string;
}

interface ComplianceItem {
  id: string;
  code_section?: string;
  requirement?: string;
  description?: string;
  status?: string;
  division?: string;
  article?: string;
  notes?: string;
}

export const OBCComplianceTracker = ({ projectId }: OBCComplianceTrackerProps) => {
  const { data: complianceItems = [] } = useOBCCompliance(projectId);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ComplianceItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Group items by division (OBC parts)
  const obcCategories = [
    { id: 'Part 3', name: 'Fire Protection (Part 3)' },
    { id: 'Part 4', name: 'Structural Safety (Part 4)' },
    { id: 'Part 5', name: 'Building Envelope (Part 5)' },
    { id: 'Part 6', name: 'HVAC & Plumbing (Part 6)' },
    { id: 'Part 8', name: 'Health & Safety (Part 8)' },
    { id: 'Part 9', name: 'Small Buildings (Part 9)' },
    { id: 'SB-10', name: 'Energy Efficiency (SB-10)' },
    { id: 'Part 3.8', name: 'Barrier-Free Design (Part 3.8)' }
  ].map(cat => {
    const items = complianceItems.filter((item: any) => 
      item.division === cat.id || item.code_section?.startsWith(cat.id)
    );
    const progress = items.length > 0 
      ? Math.round((items.filter((i: any) => i.status === 'approved' || i.status === 'verified').length / items.length) * 100)
      : 0;
    const status = progress === 100 ? 'compliant' : progress > 50 ? 'in_progress' : 'non_compliant';
    return { ...cat, progress, items, status };
  });

  const overallCompliance = complianceItems.length > 0
    ? Math.round((complianceItems.filter((i: any) => i.status === 'approved' || i.status === 'verified').length / complianceItems.length) * 100)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'default';
      case 'in_progress': return 'secondary';
      case 'non_compliant': return 'destructive';
      default: return 'outline';
    }
  };

  const getItemStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'verified':
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'in_review':
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400"><Clock className="w-3 h-3 mr-1" />In Review</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'non_compliant':
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400"><AlertCircle className="w-3 h-3 mr-1" />Non-Compliant</Badge>;
      default:
        return <Badge variant="outline">{status || 'Pending'}</Badge>;
    }
  };

  const pendingItems = complianceItems.filter((item: any) => item.status === 'pending' || item.status === 'in_review');

  const handleReviewClick = (item: ComplianceItem) => {
    setSelectedItem(item);
    setReviewStatus(item.status || 'pending');
    setReviewNotes(item.notes || '');
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedItem) return;
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        status: reviewStatus,
        notes: reviewNotes,
        updated_at: new Date().toISOString()
      };
      
      if (reviewStatus === 'verified' || reviewStatus === 'approved') {
        updateData.verified_at = new Date().toISOString();
        updateData.verified_by = user?.id;
      }
      
      const { error } = await supabase
        .from('obc_compliance_items')
        .update(updateData)
        .eq('id', selectedItem.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['obc-compliance'] });
      toast({ title: "Review submitted", description: "Compliance item status updated successfully" });
      setReviewDialogOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update compliance item", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Compliance Header */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                Ontario Building Code 2024 Compliance
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track compliance with all OBC requirements
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{overallCompliance}%</div>
              <p className="text-sm text-muted-foreground">Overall Compliance</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallCompliance} className="h-3" />
        </CardContent>
      </Card>

      {complianceItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Compliance Items Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking OBC 2024 compliance items for this project
            </p>
            <AddOBCComplianceDialog projectId={projectId} />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Compliance Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {obcCategories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <Badge variant={getStatusColor(category.status)}>
                      {category.progress}%
                    </Badge>
                  </div>
                  <Progress value={category.progress} className="h-2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No items tracked yet</p>
                    ) : (
                      category.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.code_section || item.requirement}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.description || `${item.division || ''} ${item.article || ''}`}
                            </p>
                          </div>
                          {getItemStatusBadge(item.status)}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Required Actions */}
          {pendingItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Required Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                {pendingItems.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        <div>
                          <p className="font-medium">{item.code_section || item.requirement}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.description || 'Pending review'}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleReviewClick(item)}>
                        Review
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Compliance Item</DialogTitle>
            <DialogDescription>
              Update the status and add notes for this compliance item
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedItem.code_section || selectedItem.requirement}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedItem.description || `${selectedItem.division || ''} ${selectedItem.article || ''}`}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="verified">Verified / Compliant</SelectItem>
                    <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Review Notes</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes about this compliance item..."
                  rows={4}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReviewSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
