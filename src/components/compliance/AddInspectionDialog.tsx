import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAddInspection } from "@/hooks/useComplianceData";
import { Calendar, Plus } from "lucide-react";

interface AddInspectionDialogProps {
  projectId: string;
  trigger?: React.ReactNode;
}

export const AddInspectionDialog = ({ projectId, trigger }: AddInspectionDialogProps) => {
  const [open, setOpen] = useState(false);
  const addMutation = useAddInspection();
  
  const [formData, setFormData] = useState({
    inspection_type: "",
    inspection_date: "",
    inspector_name: "",
    inspector_authority: "",
    phase: "construction",
    status: "scheduled",
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
      inspection_type: "",
      inspection_date: "",
      inspector_name: "",
      inspector_authority: "",
      phase: "construction",
      status: "scheduled",
      notes: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Inspection
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Inspection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="inspection_type">Inspection Type *</Label>
            <Select
              value={formData.inspection_type}
              onValueChange={(value) => setFormData({ ...formData, inspection_type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Building">Building</SelectItem>
                <SelectItem value="Electrical">Electrical</SelectItem>
                <SelectItem value="Plumbing">Plumbing</SelectItem>
                <SelectItem value="HVAC">HVAC</SelectItem>
                <SelectItem value="Building Envelope">Building Envelope</SelectItem>
                <SelectItem value="Fire Protection">Fire Protection</SelectItem>
                <SelectItem value="Final">Final Inspection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="inspection_date">Inspection Date *</Label>
            <Input
              id="inspection_date"
              type="date"
              value={formData.inspection_date}
              onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="inspector_name">Inspector Name</Label>
            <Input
              id="inspector_name"
              value={formData.inspector_name}
              onChange={(e) => setFormData({ ...formData, inspector_name: e.target.value })}
              placeholder="e.g., John Smith"
            />
          </div>

          <div>
            <Label htmlFor="inspector_authority">Inspector Authority/Company</Label>
            <Input
              id="inspector_authority"
              value={formData.inspector_authority}
              onChange={(e) => setFormData({ ...formData, inspector_authority: e.target.value })}
              placeholder="e.g., Ontario Building Inspections Inc."
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
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="conditional">Conditional Pass</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes or requirements"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? "Scheduling..." : "Schedule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
