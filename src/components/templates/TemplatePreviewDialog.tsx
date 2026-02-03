import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  DollarSign, 
  FileCheck, 
  Layers,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: any;
  onUseTemplate: () => void;
}

export const TemplatePreviewDialog = ({ 
  open, 
  onOpenChange, 
  template,
  onUseTemplate 
}: TemplatePreviewDialogProps) => {
  if (!template) return null;

  const templateData = template.template_data || {};
  const phases = templateData.phases || [];
  const tasks = templateData.default_tasks || [];
  const milestones = templateData.milestones || [];
  const permits = template.required_permits || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{template.name}</DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Key Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Duration</span>
                </div>
                <p className="font-medium">{template.estimated_duration}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Budget</span>
                </div>
                <p className="font-medium">{template.estimated_budget}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Layers className="h-4 w-4" />
                  <span className="text-sm">Complexity</span>
                </div>
                <Badge variant="outline" className="capitalize">
                  {template.complexity}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileCheck className="h-4 w-4" />
                  <span className="text-sm">Category</span>
                </div>
                <Badge variant="outline" className="capitalize">
                  {template.category}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Phases */}
            {phases.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Project Phases ({phases.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {phases.map((phase: string, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg border bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                          {idx + 1}
                        </div>
                        <span className="text-sm font-medium">{phase}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Tasks */}
            {tasks.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Default Tasks ({tasks.length})
                </h3>
                <div className="space-y-2">
                  {tasks.slice(0, 10).map((task: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{task.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.phase} • {task.duration}
                        </p>
                      </div>
                    </div>
                  ))}
                  {tasks.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      + {tasks.length - 10} more tasks...
                    </p>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Milestones */}
            {milestones.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Key Milestones</h3>
                <div className="space-y-2">
                  {milestones.map((milestone: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm">{milestone}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Required Permits */}
            {permits.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Required Permits ({permits.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {permits.map((permit: string, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {permit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Building Code */}
            {template.ontario_building_code_version && (
              <div>
                <h3 className="font-semibold mb-2">Building Code Compliance</h3>
                <Badge variant="outline">
                  {template.ontario_building_code_version}
                </Badge>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => {
            onUseTemplate();
            onOpenChange(false);
          }}>
            Use This Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
