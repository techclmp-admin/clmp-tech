import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, Clock, User, Calendar, Edit, Trash2, MoreVertical, Columns } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useProjectFeatures } from "@/hooks/useProjectFeatures";
import { format, formatDistanceToNow } from "date-fns";
import { sortTasksByPhase, getTaskPhase, getPhaseColor } from "@/lib/constructionPhases";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  completion_percentage: number;
  tags: string[] | null;
  created_at: string;
  created_by: string;
  project_id: string;
}

interface KanbanBoardProps {
  projectId: string;
}

const statusColumns = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-100' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'review', title: 'Review', color: 'bg-yellow-100' },
  { id: 'completed', title: 'Completed', color: 'bg-green-100' },
];

const priorityColors = {
  urgent: 'destructive',
  high: 'orange',
  medium: 'blue',
  low: 'gray',
};

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onTaskClick: (task: Task) => void;
}

function TaskCard({ task, isDragging, onTaskClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-grab hover:shadow-md transition-shadow mb-3 active:cursor-grabbing"
      {...attributes}
      {...listeners}
      onClick={() => onTaskClick(task)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium line-clamp-2">
            {task.title}
          </CardTitle>
          <div className="p-1 hover:bg-muted rounded opacity-50 hover:opacity-100">
            <GripVertical className="h-3 w-3" />
          </div>
        </div>
        {task.description && (
          <CardDescription className="text-xs line-clamp-2">
            {task.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={priorityColors[task.priority as keyof typeof priorityColors] as any} className="text-xs">
              {task.priority}
            </Badge>
            {task.completion_percentage > 0 && (
              <Badge variant="outline" className="text-xs">
                {task.completion_percentage}%
              </Badge>
            )}
          </div>
          
          {/* Construction Phase Tag - Primary identifier */}
          {task.tags && task.tags.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {getTaskPhase(task.tags) || task.tags[0]}
            </Badge>
          )}
          
          {task.due_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(task.due_date), 'MMM dd')}</span>
            </div>
          )}
          
          {task.estimated_hours && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{task.estimated_hours}h</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface KanbanColumnProps {
  column: typeof statusColumns[0];
  tasks: Task[];
  onAddTask: (status: string) => void;
  onTaskClick: (task: Task) => void;
}

function KanbanColumn({ column, tasks, onAddTask, onTaskClick }: KanbanColumnProps) {
  const {
    setNodeRef,
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col w-80 min-h-[500px] bg-muted/30 rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${column.color.replace('bg-', 'bg-')}`} />
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onAddTask(column.id)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onTaskClick={onTaskClick} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId }) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('todo');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    start_date: new Date().toISOString().split('T')[0], // Default to today
    due_date: '',
    estimated_hours: '',
  });
  const [editTask, setEditTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    start_date: '',
    due_date: '',
    estimated_hours: '',
    completion_percentage: 0,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();
  
  const featureEnabled = isFeatureEnabled('kanban_board');
  const featureUpcoming = isFeatureUpcoming('kanban_board');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch tasks - sorted by construction phase
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      // Sort by construction phase for consistent ordering
      return sortTasksByPhase(data as Task[]);
    },
  });

  // Group tasks by status while maintaining phase order within each column
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    statusColumns.forEach(column => {
      // Filter by status and maintain the phase-based order
      grouped[column.id] = tasks.filter(task => task.status === column.id);
    });
    return grouped;
  }, [tasks]);

  const handleAddTask = (status: string) => {
    setSelectedStatus(status);
    setIsCreateDialogOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setEditTask({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      start_date: task.start_date ? new Date(task.start_date).toISOString().split('T')[0] : '',
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
      estimated_hours: task.estimated_hours?.toString() || '',
      completion_percentage: task.completion_percentage || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = async () => {
    if (!selectedTask || !editTask.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task title",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('project_tasks')
        .update({
          title: editTask.title,
          description: editTask.description || null,
          priority: editTask.priority,
          status: editTask.status,
          start_date: editTask.start_date || null,
          due_date: editTask.due_date || null,
          estimated_hours: editTask.estimated_hours ? parseInt(editTask.estimated_hours) : null,
          completion_percentage: editTask.completion_percentage,
        })
        .eq('id', selectedTask.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      
      toast({
        title: "Task updated",
        description: "Task has been updated successfully",
      });

      setIsEditDialogOpen(false);
      setSelectedTask(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    try {
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', selectedTask.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedTask(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task title",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('project_tasks')
        .insert({
          project_id: projectId,
          title: newTask.title,
          description: newTask.description || null,
          status: selectedStatus,
          priority: newTask.priority,
          start_date: newTask.start_date || null,
          due_date: newTask.due_date || null,
          estimated_hours: newTask.estimated_hours ? parseInt(newTask.estimated_hours) : null,
          created_by: user.id,
          completion_percentage: 0,
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      
      toast({
        title: "Task created",
        description: "New task has been added successfully",
      });

      // Reset form
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        start_date: new Date().toISOString().split('T')[0],
        due_date: '',
        estimated_hours: '',
      });
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      
      toast({
        title: "Task updated",
        description: "Task status has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which column the task was dropped on
    const targetStatus = statusColumns.find(col => col.id === overId)?.id;
    
    if (targetStatus) {
      const task = tasks.find(t => t.id === activeId);
      if (task && task.status !== targetStatus) {
        updateTaskStatus(activeId, targetStatus);
      }
    }

    setActiveTask(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // If dropping on another task, get that task's status
    const overTask = tasks.find(t => t.id === overId);
    if (overTask) {
      const activeTask = tasks.find(t => t.id === activeId);
      if (activeTask && activeTask.status !== overTask.status) {
        // This would trigger a local update for better UX
        // but we'll handle it in dragEnd for actual persistence
      }
    }
  };

  // If feature is disabled and not marked as upcoming, don't render
  if (!featureEnabled && !featureUpcoming) {
    return null;
  }

  // If feature is upcoming (disabled but marked to show), show upcoming message
  if (!featureEnabled && featureUpcoming) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Columns className="h-5 w-5" />
            Kanban Board
            <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Columns className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
            <p className="text-muted-foreground">
              This feature is currently under development and will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          {statusColumns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByStatus[column.id] || []}
              onAddTask={handleAddTask}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} isDragging onTaskClick={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to {statusColumns.find(c => c.id === selectedStatus)?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Task description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
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
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="estimated_hours">Estimated Hours</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  placeholder="0"
                  value={newTask.estimated_hours}
                  onChange={(e) => setNewTask({ ...newTask, estimated_hours: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={newTask.start_date}
                  onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask}>Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                placeholder="Task title"
                value={editTask.title}
                onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Task description"
                rows={3}
                value={editTask.description}
                onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editTask.status}
                  onValueChange={(value) => setEditTask({ ...editTask, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusColumns.map(col => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={editTask.priority}
                  onValueChange={(value) => setEditTask({ ...editTask, priority: value })}
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
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-estimated_hours">Estimated Hours</Label>
                <Input
                  id="edit-estimated_hours"
                  type="number"
                  placeholder="0"
                  value={editTask.estimated_hours}
                  onChange={(e) => setEditTask({ ...editTask, estimated_hours: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-completion">Completion %</Label>
                <Input
                  id="edit-completion"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={editTask.completion_percentage}
                  onChange={(e) => setEditTask({ ...editTask, completion_percentage: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-start_date">Start Date</Label>
                <Input
                  id="edit-start_date"
                  type="date"
                  value={editTask.start_date}
                  onChange={(e) => setEditTask({ ...editTask, start_date: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-due_date">Due Date</Label>
                <Input
                  id="edit-due_date"
                  type="date"
                  value={editTask.due_date}
                  onChange={(e) => setEditTask({ ...editTask, due_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="destructive" 
              onClick={() => {
                setIsEditDialogOpen(false);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTask}>Update Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              "{selectedTask?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsEditDialogOpen(true)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KanbanBoard;