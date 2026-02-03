import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, CheckCircle, Clock, User, MapPin, FileText } from "lucide-react";

interface Inspection {
  id: string;
  inspection_type: string;
  inspection_date: string;
  inspector_name?: string | null;
  inspector_authority?: string | null;
  status: string;
  phase: string;
  notes?: string | null;
  result?: string | null;
}

interface PrepareInspectionDialogProps {
  inspection: Inspection;
}

const preparationChecklist = [
  "Review all relevant documentation and drawings",
  "Ensure area is accessible and clean",
  "Have all permits on-site and available",
  "Notify relevant team members of inspection time",
  "Complete any outstanding work in inspection area",
  "Prepare safety equipment if required",
  "Have previous inspection reports available",
  "Document any known issues to discuss"
];

export const PrepareInspectionDialog = ({ inspection }: PrepareInspectionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
  };

  const progress = Math.round((checkedItems.size / preparationChecklist.length) * 100);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Prepare</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Prepare for Inspection
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Inspection Details */}
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{inspection.inspection_type}</h3>
              <Badge variant="outline">{inspection.phase}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{new Date(inspection.inspection_date).toLocaleDateString()}</span>
              </div>
              
              {inspection.inspector_name && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{inspection.inspector_name}</span>
                </div>
              )}
              
              {inspection.inspector_authority && (
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{inspection.inspector_authority}</span>
                </div>
              )}
            </div>
            
            {inspection.notes && (
              <p className="text-sm text-muted-foreground border-t pt-3 mt-3">
                <span className="font-medium">Notes:</span> {inspection.notes}
              </p>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Preparation Progress</span>
              <span className="text-muted-foreground">{checkedItems.size}/{preparationChecklist.length} completed</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            <h4 className="font-medium">Preparation Checklist</h4>
            <div className="space-y-2">
              {preparationChecklist.map((item, index) => (
                <div 
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checkedItems.has(index) ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'hover:bg-muted'
                  }`}
                  onClick={() => toggleItem(index)}
                >
                  <Checkbox 
                    checked={checkedItems.has(index)}
                    onCheckedChange={() => toggleItem(index)}
                  />
                  <span className={`text-sm ${checkedItems.has(index) ? 'line-through text-muted-foreground' : ''}`}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ready Status */}
          {progress === 100 && (
            <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-200">
                All preparation items completed! You're ready for the inspection.
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
