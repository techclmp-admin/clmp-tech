import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { format, differenceInDays, startOfWeek, startOfMonth, startOfQuarter, startOfYear, addDays, addMonths, addQuarters, addYears, parseISO } from "date-fns";
import { toast } from "sonner";
import { sortTasksByPhase, getTaskPhase, generateTaskDates, getPhaseColor } from "@/lib/constructionPhases";
import { useProjectFeatures } from "@/hooks/useProjectFeatures";
import { GanttChartSquare } from "lucide-react";
import { formatStatusLabel } from "@/lib/utils";

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

type ViewMode = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';

interface GanttChartProps {
  projectId: string;
}

const priorityColors = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-blue-500',
  low: 'bg-gray-500',
};

const statusColors: Record<string, string> = {
  'to do': 'bg-slate-400',
  'in progress': 'bg-blue-500',
  todo: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  review: 'bg-yellow-500',
  completed: 'bg-green-500',
};

const GanttChart: React.FC<GanttChartProps> = ({ projectId }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const queryClient = useQueryClient();
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();
  
  const featureEnabled = isFeatureEnabled('gantt_chart');
  const featureUpcoming = isFeatureUpcoming('gantt_chart');

  // Fetch tasks - sorted by construction phase
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['project-tasks-gantt', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      // Sort by construction phase for proper timeline ordering
      return sortTasksByPhase(data as Task[]);
    },
  });

  // Real-time subscription for task updates
  useEffect(() => {
    const channel = supabase
      .channel('gantt-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_tasks',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-tasks-gantt', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  // Update task dates mutation
  const updateTaskDatesMutation = useMutation({
    mutationFn: async ({ taskId, start_date, due_date }: { taskId: string; start_date: string; due_date: string }) => {
      const { error } = await supabase
        .from('project_tasks')
        .update({ start_date, due_date })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks-gantt', projectId] });
      toast.success('Task dates updated successfully');
      setIsEditDialogOpen(false);
      setSelectedTask(null);
    },
    onError: (error) => {
      console.error('Error updating task dates:', error);
      toast.error('Failed to update task dates');
    },
  });

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    // Format dates properly for input type="date" - parse as local date
    const startDate = task.start_date 
      ? task.start_date.split('T')[0] // Get just the date part (YYYY-MM-DD)
      : format(new Date(), 'yyyy-MM-dd');
    const dueDate = task.due_date 
      ? task.due_date.split('T')[0] // Get just the date part (YYYY-MM-DD)
      : format(new Date(), 'yyyy-MM-dd');
    
    setEditStartDate(startDate);
    setEditDueDate(dueDate);
    setIsEditDialogOpen(true);
  };

  const handleUpdateDates = () => {
    if (!selectedTask) return;

    if (editStartDate && editDueDate && new Date(editStartDate) > new Date(editDueDate)) {
      toast.error('Start date must be before due date');
      return;
    }

    updateTaskDatesMutation.mutate({
      taskId: selectedTask.id,
      start_date: editStartDate,
      due_date: editDueDate,
    });
  };

  const { chartData, timelineUnits } = useMemo(() => {
    if (tasks.length === 0) {
      return { chartData: [], timelineUnits: [] };
    }

    // Calculate date range based on tasks
    const now = new Date();
    
    // Helper function to parse date strings as local dates
    const parseLocalDate = (dateStr: string | null): Date | null => {
      if (!dateStr) return null;
      // Parse as local date by using the date part only
      const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
      return new Date(year, month - 1, day);
    };
    
    const allStartDates = tasks
      .map(task => parseLocalDate(task.start_date))
      .filter(Boolean) as Date[];
    
    const allEndDates = tasks
      .map(task => parseLocalDate(task.due_date))
      .filter(Boolean) as Date[];

    let startDate: Date;
    let endDate: Date;

    if (viewMode === 'all') {
      startDate = allStartDates.length > 0 
        ? new Date(Math.min(...allStartDates.map(d => d.getTime())))
        : startOfWeek(now);
      
      endDate = allEndDates.length > 0
        ? new Date(Math.max(...allEndDates.map(d => d.getTime())))
        : addDays(now, 30);
    } else {
      // Use start function based on view mode
      const startFn = {
        day: startOfWeek,
        week: startOfWeek,
        month: startOfMonth,
        quarter: startOfQuarter,
        year: startOfYear,
      }[viewMode];

      startDate = allStartDates.length > 0 
        ? startFn(new Date(Math.min(...allStartDates.map(d => d.getTime()))))
        : startFn(now);
      
      endDate = allEndDates.length > 0
        ? new Date(Math.max(...allEndDates.map(d => d.getTime())))
        : addDays(now, 30);
    }

    const totalDays = differenceInDays(endDate, startDate) + 1;

    // Generate timeline units based on view mode
    let timelineUnits: Array<{ start: Date; label: string }> = [];
    let unitDays: number;

    switch (viewMode) {
      case 'day':
        unitDays = 1;
        const numDays = Math.ceil(totalDays);
        timelineUnits = Array.from({ length: numDays }, (_, i) => {
          const day = addDays(startDate, i);
          return {
            start: day,
            label: format(day, 'MMM dd'),
          };
        });
        break;

      case 'week':
        unitDays = 7;
        const numWeeks = Math.ceil(totalDays / 7);
        timelineUnits = Array.from({ length: numWeeks }, (_, i) => {
          const weekStart = addDays(startDate, i * 7);
          return {
            start: weekStart,
            label: format(weekStart, 'MMM dd'),
          };
        });
        break;

      case 'month':
        const numMonths = Math.ceil(totalDays / 30);
        timelineUnits = Array.from({ length: numMonths }, (_, i) => {
          const monthStart = addMonths(startDate, i);
          return {
            start: monthStart,
            label: format(monthStart, 'MMM yyyy'),
          };
        });
        unitDays = 30;
        break;

      case 'quarter':
        const numQuarters = Math.ceil(totalDays / 90);
        timelineUnits = Array.from({ length: numQuarters }, (_, i) => {
          const quarterStart = addQuarters(startDate, i);
          return {
            start: quarterStart,
            label: format(quarterStart, 'QQQ yyyy'),
          };
        });
        unitDays = 90;
        break;

      case 'year':
        const numYears = Math.ceil(totalDays / 365);
        timelineUnits = Array.from({ length: numYears }, (_, i) => {
          const yearStart = addYears(startDate, i);
          return {
            start: yearStart,
            label: format(yearStart, 'yyyy'),
          };
        });
        unitDays = 365;
        break;

      case 'all':
        const numWeeksAll = Math.ceil(totalDays / 7);
        timelineUnits = Array.from({ length: numWeeksAll }, (_, i) => {
          const weekStart = addDays(startDate, i * 7);
          return {
            start: weekStart,
            label: format(weekStart, 'MMM dd'),
          };
        });
        unitDays = 7;
        break;
    }

    // Process ALL tasks for chart - generate dates for tasks without dates
    // Group tasks by phase to track index within phase
    const phaseTaskIndex: Record<string, number> = {};
    const projectStartDate = startDate;

    const chartData = tasks.map(task => {
      const phase = getTaskPhase(task.tags);
      const phaseKey = phase || 'Other';
      phaseTaskIndex[phaseKey] = (phaseTaskIndex[phaseKey] || 0);
      
      let taskStart: Date;
      let taskEnd: Date;

      if (task.start_date || task.due_date) {
        // Use actual dates if available
        taskStart = task.start_date ? parseLocalDate(task.start_date)! : parseLocalDate(task.created_at)!;
        taskEnd = task.due_date ? parseLocalDate(task.due_date)! : addDays(taskStart, 7);
      } else {
        // Generate estimated dates based on construction phase
        const generatedDates = generateTaskDates(projectStartDate, phase, phaseTaskIndex[phaseKey]);
        taskStart = generatedDates.startDate;
        taskEnd = generatedDates.dueDate;
      }
      
      phaseTaskIndex[phaseKey]++;
      
      const startOffset = Math.max(0, differenceInDays(taskStart, startDate));
      const duration = Math.max(1, differenceInDays(taskEnd, taskStart));
      const startPercentage = (startOffset / totalDays) * 100;
      const widthPercentage = (duration / totalDays) * 100;

      return {
        ...task,
        startPercentage,
        widthPercentage,
        startOffset,
        duration,
        taskStart,
        taskEnd,
        hasActualDates: !!(task.start_date || task.due_date),
        phase,
      };
    });

    return { chartData, timelineUnits };
  }, [tasks, viewMode]);

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
            <GanttChartSquare className="h-5 w-5" />
            Gantt Chart
            <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <GanttChartSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
          <p className="text-muted-foreground">Loading Gantt chart...</p>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-muted-foreground">No tasks found for this project</p>
            <p className="text-sm text-muted-foreground mt-2">Create some tasks to see the Gantt chart</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Project Timeline</CardTitle>
          {/* Mobile: scrollable; Desktop: inline */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 md:pb-0 md:mb-0 md:overflow-visible">
            <Button
              size="sm"
              variant={viewMode === 'day' ? 'default' : 'outline'}
              onClick={() => setViewMode('day')}
              className="flex-shrink-0"
            >
              Day
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'week' ? 'default' : 'outline'}
              onClick={() => setViewMode('week')}
              className="flex-shrink-0"
            >
              Week
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'month' ? 'default' : 'outline'}
              onClick={() => setViewMode('month')}
              className="flex-shrink-0"
            >
              Month
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'quarter' ? 'default' : 'outline'}
              onClick={() => setViewMode('quarter')}
              className="flex-shrink-0"
            >
              Quarter
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'year' ? 'default' : 'outline'}
              onClick={() => setViewMode('year')}
              className="flex-shrink-0"
            >
              Year
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'all' ? 'default' : 'outline'}
              onClick={() => setViewMode('all')}
              className="flex-shrink-0"
            >
              All
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Visual timeline showing task durations and dependencies across the project lifecycle.
        </p>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          {/* Timeline header */}
          <div className="flex border-b pb-2 mb-4 min-w-[800px]">
            <div className="w-64 flex-shrink-0 font-medium text-sm">Task</div>
            <div className="flex-1 relative">
              <div className="flex justify-between text-xs text-muted-foreground">
                {timelineUnits.map((unit, index) => (
                  <div key={index} className="text-center">
                    {unit.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Task rows */}
          <div className="space-y-3 min-w-[800px]">
            {chartData.map((task) => (
              <div key={task.id} className="flex items-center group hover:bg-muted/50 rounded p-2 cursor-pointer" onClick={() => handleTaskClick(task)}>
                {/* Task info */}
                <div className="w-64 flex-shrink-0 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm line-clamp-1">{task.title}</div>
                    {!task.hasActualDates && (
                      <span className="text-[10px] text-muted-foreground italic">(estimated)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {task.phase && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {task.phase}
                      </Badge>
                    )}
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                    >
                      {formatStatusLabel(task.status)}
                    </Badge>
                    {task.completion_percentage > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {task.completion_percentage}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Timeline bar */}
                <div className="flex-1 relative h-8 bg-muted/30 rounded" onClick={(e) => e.stopPropagation()}>
                  <div
                    className={`absolute top-1 bottom-1 rounded ${statusColors[task.status as keyof typeof statusColors]} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                    onClick={() => handleTaskClick(task)}
                    style={{
                      left: `${task.startPercentage}%`,
                      width: `${Math.max(task.widthPercentage, 2)}%`,
                    }}
                    title={`${task.title}\nStart: ${task.start_date ? task.start_date.split('T')[0] : 'N/A'}\nDue: ${task.due_date ? task.due_date.split('T')[0] : 'N/A'}\nDuration: ${task.duration} days`}
                  >
                    <div className="h-full flex items-center px-2">
                      <span className="text-xs text-white font-medium truncate">
                        {task.title}
                      </span>
                    </div>
                    
                    {/* Progress indicator */}
                    {task.completion_percentage > 0 && (
                      <div
                        className="absolute top-0 bottom-0 bg-white/30 rounded-l"
                        style={{
                          width: `${task.completion_percentage}%`,
                        }}
                      />
                    )}
                  </div>

                  {/* Due date indicator */}
                  {task.due_date && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                      style={{
                        left: `${task.startPercentage + task.widthPercentage}%`,
                      }}
                      title={`Due: ${task.due_date.split('T')[0]}`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded ${color}`} />
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Edit Task Dates Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task Dates</DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="font-medium">{selectedTask.title}</h4>
                <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDates} disabled={updateTaskDatesMutation.isPending}>
              {updateTaskDatesMutation.isPending ? 'Updating...' : 'Update Dates'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default GanttChart;