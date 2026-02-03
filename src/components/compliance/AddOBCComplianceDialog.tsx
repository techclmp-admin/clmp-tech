import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAddOBCCompliance } from "@/hooks/useComplianceData";
import { Plus, ShieldCheck } from "lucide-react";

interface AddOBCComplianceDialogProps {
  projectId: string;
  trigger?: React.ReactNode;
}

export const AddOBCComplianceDialog = ({ projectId, trigger }: AddOBCComplianceDialogProps) => {
  const [open, setOpen] = useState(false);
  const addMutation = useAddOBCCompliance();
  
  const [formData, setFormData] = useState({
    code_section: "",
    division: "",
    article: "",
    requirement: "",
    description: "",
    status: "pending",
    compliance_method: "",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addMutation.mutateAsync({
      ...formData,
      project_id: projectId
    });
    setOpen(false);
    setFormData({
      code_section: "",
      division: "",
      article: "",
      requirement: "",
      description: "",
      status: "pending",
      compliance_method: "",
      notes: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Compliance Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Add OBC 2024 Compliance Item
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="division">OBC Division *</Label>
              <Select
                value={formData.division}
                onValueChange={(value) => setFormData({ ...formData, division: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Part 3">Part 3 - Fire Protection</SelectItem>
                  <SelectItem value="Part 4">Part 4 - Structural Design</SelectItem>
                  <SelectItem value="Part 5">Part 5 - Environmental Separation</SelectItem>
                  <SelectItem value="Part 6">Part 6 - HVAC</SelectItem>
                  <SelectItem value="Part 7">Part 7 - Plumbing Services</SelectItem>
                  <SelectItem value="Part 8">Part 8 - Safety Measures</SelectItem>
                  <SelectItem value="Part 9">Part 9 - Housing and Small Buildings</SelectItem>
                  <SelectItem value="Part 10">Part 10 - Change of Use</SelectItem>
                  <SelectItem value="Part 11">Part 11 - Renovation</SelectItem>
                  <SelectItem value="Part 12">Part 12 - Resource Conservation</SelectItem>
                  <SelectItem value="SB-10">SB-10 - Energy Efficiency</SelectItem>
                  <SelectItem value="SB-12">SB-12 - Energy Efficiency (Housing)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="code_section">Code Section *</Label>
              <Input
                id="code_section"
                value={formData.code_section}
                onChange={(e) => setFormData({ ...formData, code_section: e.target.value })}
                placeholder="e.g., 3.2.2.1"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="article">Article/Clause</Label>
            <Input
              id="article"
              value={formData.article}
              onChange={(e) => setFormData({ ...formData, article: e.target.value })}
              placeholder="e.g., Fire Separation Requirements"
            />
          </div>

          <div>
            <Label htmlFor="requirement">Requirement *</Label>
            <Input
              id="requirement"
              value={formData.requirement}
              onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
              placeholder="e.g., Fire separation between units"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the compliance requirement"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="compliance_method">Compliance Method</Label>
              <Select
                value={formData.compliance_method}
                onValueChange={(value) => setFormData({ ...formData, compliance_method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prescriptive">Prescriptive</SelectItem>
                  <SelectItem value="alternative">Alternative Solution</SelectItem>
                  <SelectItem value="performance">Performance-Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes or documentation references"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? "Adding..." : "Add Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
