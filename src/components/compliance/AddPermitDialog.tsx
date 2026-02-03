import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";

interface AddPermitDialogProps {
  projectId: string;
  trigger?: React.ReactNode;
}

export const AddPermitDialog = ({ projectId, trigger }: AddPermitDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    permit_type: "",
    permit_number: "",
    application_date: new Date().toISOString().split('T')[0],
    status: "pending",
    issuing_authority: "",
    description: ""
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase
        .from('permits')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permits'] });
      toast({
        title: 'Success',
        description: 'Permit added successfully'
      });
      setOpen(false);
      setFormData({
        permit_type: "",
        permit_number: "",
        application_date: new Date().toISOString().split('T')[0],
        status: "pending",
        issuing_authority: "",
        description: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add permit',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addMutation.mutateAsync({
      ...formData,
      project_id: projectId
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add New Permit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Construction Permit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="permit_type">Permit Type *</Label>
            <Select
              value={formData.permit_type}
              onValueChange={(value) => setFormData({ ...formData, permit_type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select permit type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Building Permit">Building Permit</SelectItem>
                <SelectItem value="Demolition Permit">Demolition Permit</SelectItem>
                <SelectItem value="Plumbing Permit">Plumbing Permit</SelectItem>
                <SelectItem value="Electrical Permit">Electrical Permit</SelectItem>
                <SelectItem value="HVAC Permit">HVAC Permit</SelectItem>
                <SelectItem value="Excavation Permit">Excavation Permit</SelectItem>
                <SelectItem value="Sign Permit">Sign Permit</SelectItem>
                <SelectItem value="Change of Use">Change of Use</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="permit_number">Permit Number</Label>
            <Input
              id="permit_number"
              value={formData.permit_number}
              onChange={(e) => setFormData({ ...formData, permit_number: e.target.value })}
              placeholder="e.g., BP-2024-12345"
            />
          </div>

          <div>
            <Label htmlFor="application_date">Application Date *</Label>
            <Input
              id="application_date"
              type="date"
              value={formData.application_date}
              onChange={(e) => setFormData({ ...formData, application_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="issuing_authority">Issuing Authority</Label>
            <Input
              id="issuing_authority"
              value={formData.issuing_authority}
              onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
              placeholder="e.g., City of Toronto"
            />
          </div>

          <div>
            <Label htmlFor="description">Notes</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details about the permit"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? "Adding..." : "Add Permit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
