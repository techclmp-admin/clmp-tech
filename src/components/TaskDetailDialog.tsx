import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Pencil, Save, X } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn, formatStatusLabel } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to?: string;
  due_date?: string;
  created_at: string;
}

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
}

export function TaskDetailDialog({ task, open, onOpenChange, onTaskUpdated }: TaskDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  if (!task) return null;

  const currentTask = editedTask || task;

  const handleEdit = () => {
    setEditedTask({ ...task });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedTask(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedTask) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update({
          title: editedTask.title,
          description: editedTask.description,
          status: editedTask.status,
          priority: editedTask.priority,
          due_date: editedTask.due_date,
        })
        .eq('id', editedTask.id);

      if (error) throw error;

      toast({
        title: "Task updated",
        description: "The task has been updated successfully.",
      });

      onTaskUpdated();
      setIsEditing(false);
      setEditedTask(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'review':
        return 'outline';
      case 'todo':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Task Details</DialogTitle>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          <DialogDescription>
            Created on {format(new Date(currentTask.created_at), 'MMM dd, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            {isEditing ? (
              <Input
                value={editedTask?.title || ''}
                onChange={(e) => setEditedTask(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
            ) : (
              <p className="text-lg font-semibold">{currentTask.title}</p>
            )}
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              {isEditing ? (
                <Select
                  value={editedTask?.status}
                  onValueChange={(value) => setEditedTask(prev => prev ? { ...prev, status: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div>
                  <Badge variant={getStatusColor(currentTask.status) as any} className="capitalize">
                    {formatStatusLabel(currentTask.status)}
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              {isEditing ? (
                <Select
                  value={editedTask?.priority}
                  onValueChange={(value) => setEditedTask(prev => prev ? { ...prev, priority: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div>
                  <Badge variant={getPriorityColor(currentTask.priority) as any} className="capitalize">
                    {currentTask.priority}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            {isEditing ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editedTask?.due_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedTask?.due_date ? format(new Date(editedTask.due_date), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editedTask?.due_date ? new Date(editedTask.due_date) : undefined}
                    onSelect={(date) => setEditedTask(prev => prev ? { ...prev, due_date: date?.toISOString() } : null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <p className="text-sm">
                {currentTask.due_date ? format(new Date(currentTask.due_date), 'MMM dd, yyyy') : 'No due date'}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            {isEditing ? (
              <Textarea
                value={editedTask?.description || ''}
                onChange={(e) => setEditedTask(prev => prev ? { ...prev, description: e.target.value } : null)}
                rows={4}
                placeholder="Add a description..."
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {currentTask.description || 'No description'}
              </p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
