import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useProjectFeatures } from "@/hooks/useProjectFeatures";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  ArrowUpDown,
  Calendar,
  User,
  Flag,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ListTodo,
} from "lucide-react";
import { format } from "date-fns";
import { getTaskSortOrder, getTaskPhase } from "@/lib/constructionPhases";
import { formatStatusLabel } from "@/lib/utils";


interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  start_date: string | null;
  due_date: string | null;
  assigned_to: string | null;
  progress?: number;
  tags?: string[] | null;
}

interface TasksTableProps {
  tasks: Task[];
  projectId: string;
}

interface TeamMember {
  user_id: string;
  profiles: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export function TasksTable({ tasks, projectId }: TasksTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("phase"); // Default to phase sorting for construction sequence
  
  const featureEnabled = isFeatureEnabled('task_management');
  const featureUpcoming = isFeatureUpcoming('task_management');
  
  // Fetch team members for assignment
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          user_id,
          profiles (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data as unknown as TeamMember[];
    },
    enabled: !!projectId,
  });
  
  // Dialog States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    start_date: "",
    due_date: "",
    estimated_hours: "",
  });

  // Create Task Mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: typeof newTask) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("project_tasks")
        .insert({
          project_id: projectId,
          title: taskData.title,
          description: taskData.description || null,
          status: taskData.status,
          priority: taskData.priority,
          start_date: taskData.start_date || null,
          due_date: taskData.due_date || null,
          estimated_hours: taskData.estimated_hours ? parseInt(taskData.estimated_hours) : null,
          created_by: user.id,
          completion_percentage: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      setIsAddDialogOpen(false);
      setNewTask({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        start_date: "",
        due_date: "",
        estimated_hours: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
      console.error("Error creating task:", error);
    },
  });

  // Update Task Mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      const { error } = await supabase
        .from("project_tasks")
        .update(updates)
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingTask(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
      console.error("Error updating task:", error);
    },
  });

  // Delete Task Mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      console.log('Attempting to delete task:', taskId);
      const { error, data } = await supabase
        .from("project_tasks")
        .delete()
        .eq("id", taskId)
        .select();

      console.log('Delete response:', { data, error });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  // Duplicate Task Mutation
  const duplicateTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("project_tasks")
        .insert({
          project_id: projectId,
          title: `${task.title} (Copy)`,
          description: task.description,
          status: task.status,
          priority: task.priority,
          start_date: task.start_date,
          due_date: task.due_date,
          created_by: user.id,
          completion_percentage: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", projectId] });
      toast({
        title: "Success",
        description: "Task duplicated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to duplicate task",
        variant: "destructive",
      });
      console.error("Error duplicating task:", error);
    },
  });

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingTask) return;
    updateTaskMutation.mutate({
      taskId: editingTask.id,
      updates: {
        title: editingTask.title,
        description: editingTask.description,
        status: editingTask.status,
        priority: editingTask.priority,
        start_date: editingTask.start_date,
        due_date: editingTask.due_date,
      },
    });
  };

  const handleDelete = (taskId: string) => {
    setTaskToDelete(taskId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete);
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleDuplicate = (task: Task) => {
    duplicateTaskMutation.mutate(task);
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTaskMutation.mutate({
      taskId,
      updates: { status: newStatus },
    });
  };

  const handleAssignTask = (taskId: string, userId: string | null) => {
    updateTaskMutation.mutate({
      taskId,
      updates: { assigned_to: userId },
    });
  };

  const getAssigneeName = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const member = teamMembers.find(m => m.user_id === userId);
    if (!member?.profiles) return "Unknown";
    const { first_name, last_name, email } = member.profiles;
    if (first_name && last_name) return `${first_name} ${last_name}`;
    if (first_name) return first_name;
    return email;
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "completed") return <CheckCircle2 className="h-4 w-4" />;
    if (statusLower === "in_progress") return <Clock className="h-4 w-4" />;
    if (statusLower === "blocked") return <AlertCircle className="h-4 w-4" />;
    return <Circle className="h-4 w-4" />;
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    const statusLower = status.toLowerCase();
    if (statusLower === "completed") return "default";
    if (statusLower === "in_progress") return "secondary";
    if (statusLower === "blocked") return "destructive";
    return "outline";
  };

  const getPriorityColor = (priority: string) => {
    const priorityLower = priority?.toLowerCase() || "medium";
    if (priorityLower === "high" || priorityLower === "urgent") return "text-destructive";
    if (priorityLower === "medium") return "text-warning";
    return "text-muted-foreground";
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedTasks(prev =>
      prev.length === filteredTasks.length ? [] : filteredTasks.map(t => t.id)
    );
  };

  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      // Default: Sort by construction phase (Canadian standards)
      if (sortBy === "phase") {
        const orderA = getTaskSortOrder(a.tags || null);
        const orderB = getTaskSortOrder(b.tags || null);
        if (orderA !== orderB) return orderA - orderB;
        // Within same phase, sort by created_at
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "created_at") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "due_date") {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (sortBy === "priority") {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority?.toLowerCase() as keyof typeof priorityOrder] || 2) -
          (priorityOrder[b.priority?.toLowerCase() as keyof typeof priorityOrder] || 2);
      }
      return 0;
    });

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && dueDate !== null;
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
            <ListTodo className="h-5 w-5" />
            Task Management
            <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ListTodo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
            <p className="text-muted-foreground">
              This feature is currently under development and will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Filters</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="p-2 space-y-2">
                <div>
                  <label className="text-xs font-medium mb-1 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">Priority</label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy("phase")}>
                Construction Phase
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("created_at")}>
                Created Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("due_date")}>
                Due Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("priority")}>
                Priority
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button className="w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <span className="text-sm font-medium">
            {selectedTasks.length} task{selectedTasks.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2 sm:ml-auto flex-wrap">
            <Button variant="outline" size="sm" className="h-8 text-xs">Change Status</Button>
            <Button variant="outline" size="sm" className="h-8 text-xs">Assign</Button>
            <Button variant="destructive" size="sm" className="h-8 text-xs">Delete</Button>
          </div>
        </div>
      )}

      {/* Mobile Task Cards */}
      <div className="md:hidden space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-card">
            <Circle className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground font-medium mt-4">No tasks found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first task to get started"}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 border rounded-lg bg-card ${
                isOverdue(task.due_date) ? 'border-l-4 border-l-destructive' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Checkbox
                    checked={selectedTasks.includes(task.id)}
                    onCheckedChange={() => toggleTaskSelection(task.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => handleEdit(task)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleDuplicate(task)}>Duplicate</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="font-normal">Change Status</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => handleStatusChange(task.id, "todo")}>To Do</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleStatusChange(task.id, "in_progress")}>In Progress</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleStatusChange(task.id, "completed")}>Completed</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleStatusChange(task.id, "blocked")}>Blocked</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onSelect={() => handleDelete(task.id)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant={getStatusVariant(task.status)} className="gap-1 text-xs">
                  {getStatusIcon(task.status)}
                  {formatStatusLabel(task.status)}
                </Badge>
                <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                  <Flag className="h-3 w-3 mr-1" />
                  {task.priority || "Medium"}
                </Badge>
                {task.progress !== undefined && task.progress > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {task.progress}%
                  </Badge>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  {task.due_date && (
                    <div className={`flex items-center gap-1 ${isOverdue(task.due_date) ? "text-destructive font-medium" : ""}`}>
                      <Calendar className="h-3 w-3" />
                      {format(new Date(task.due_date), "MMM dd")}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-[100px]">{getAssigneeName(task.assigned_to)}</span>
                  </div>
                </div>
                {task.progress !== undefined && (
                  <div className="flex items-center gap-2 w-20">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${task.progress || 0}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Tasks Table */}
      <div className="hidden md:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="min-w-[300px]">Task</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-32">Priority</TableHead>
              <TableHead className="w-40">Assignee</TableHead>
              <TableHead className="w-32">Start Date</TableHead>
              <TableHead className="w-32">Due Date</TableHead>
              <TableHead className="w-20">Progress</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Circle className="h-12 w-12 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-medium">No tasks found</p>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Create your first task to get started"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={() => toggleTaskSelection(task.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium hover:text-primary cursor-pointer">
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(task.status)} className="gap-1">
                      {getStatusIcon(task.status)}
                      {formatStatusLabel(task.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Flag className={`h-3 w-3 ${getPriorityColor(task.priority)}`} />
                      <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority || "Medium"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 px-2 hover:bg-accent">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {task.assigned_to ? getAssigneeName(task.assigned_to).charAt(0).toUpperCase() : <User className="h-3 w-3" />}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{getAssigneeName(task.assigned_to)}</span>
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuLabel>Assign to</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => handleAssignTask(task.id, null)}>
                          <User className="h-4 w-4 mr-2" />
                          Unassigned
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {teamMembers.map((member) => (
                          <DropdownMenuItem
                            key={member.user_id}
                            onSelect={() => handleAssignTask(task.id, member.user_id)}
                          >
                            <Avatar className="h-5 w-5 mr-2">
                              <AvatarFallback className="text-xs">
                                {member.profiles?.first_name?.charAt(0) || member.profiles?.email?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            {member.profiles?.first_name && member.profiles?.last_name
                              ? `${member.profiles.first_name} ${member.profiles.last_name}`
                              : member.profiles?.first_name || member.profiles?.email || 'Unknown'}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    {task.start_date ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(task.start_date), "MMM dd")}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.due_date ? (
                      <div className={`flex items-center gap-1 text-sm ${isOverdue(task.due_date) ? "text-destructive font-medium" : ""}`}>
                        <Calendar className="h-3 w-3" />
                        {format(new Date(task.due_date), "MMM dd")}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${task.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground min-w-[30px]">
                        {task.progress || 0}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={(e) => {
                          e.preventDefault();
                          handleEdit(task);
                        }}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => {
                          e.preventDefault();
                          handleDuplicate(task);
                        }}>
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="font-normal">Change Status</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={(e) => {
                          e.preventDefault();
                          handleStatusChange(task.id, "todo");
                        }}>
                          To Do
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => {
                          e.preventDefault();
                          handleStatusChange(task.id, "in_progress");
                        }}>
                          In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => {
                          e.preventDefault();
                          handleStatusChange(task.id, "completed");
                        }}>
                          Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => {
                          e.preventDefault();
                          handleStatusChange(task.id, "blocked");
                        }}>
                          Blocked
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onSelect={(e) => {
                            e.preventDefault();
                            handleDelete(task.id);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      {filteredTasks.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            Showing {filteredTasks.length} of {tasks.length} tasks
          </span>
          <div className="flex gap-3 text-xs sm:text-sm">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              {tasks.filter(t => t.status.toLowerCase() === "completed").length}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              {tasks.filter(t => t.status.toLowerCase() === "in_progress").length}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full" />
              {tasks.filter(t => t.status.toLowerCase() === "todo").length}
            </span>
          </div>
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
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
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newTask.status}
                  onValueChange={(value) => setNewTask({ ...newTask, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
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
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createTaskMutation.mutate(newTask)}
              disabled={!newTask.title || createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          
          {editingTask && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  placeholder="Task title"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Task description"
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingTask.status}
                    onValueChange={(value) => setEditingTask({ ...editingTask, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={editingTask.priority}
                    onValueChange={(value) => setEditingTask({ ...editingTask, priority: value })}
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
                  <Label htmlFor="edit-start-date">Start Date</Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={editingTask.start_date || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, start_date: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-due-date">Due Date</Label>
                  <Input
                    id="edit-due-date"
                    type="date"
                    value={editingTask.due_date || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={!editingTask?.title || updateTaskMutation.isPending}
            >
              {updateTaskMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
