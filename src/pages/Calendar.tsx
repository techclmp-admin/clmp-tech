import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  Trash2,
  Edit
} from 'lucide-react';
import {
  MobilePageWrapper,
  MobileSegmentedControl,
  MobileFilterChip,
} from '@/components/mobile';
import LocationAutocomplete from '@/components/LocationAutocomplete';

interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  event_type: string;
  event_status: string;
  created_by: string;
  entity_id?: string;
  event_data?: any;
  priority?: string;
  project?: { id: string; name: string };
  participants?: { user_id: string; status: string }[];
}

const CalendarPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<'month' | 'week' | 'day'>('month');
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filterProject, setFilterProject] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Form state for new/edit event
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    event_type: 'meeting',
    event_status: 'scheduled',
    entity_id: '',
    priority: 'medium'
  });

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  // Fetch projects for filter and event creation (only projects user is a member of)
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-calendar'],
    queryFn: async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return [];
      
      // Get project IDs where user is a member
      const { data: membershipData } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', currentUser.id);
      
      const projectIds = membershipData?.map(m => m.project_id) || [];
      if (projectIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', projectIds)
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch events from database (filtered by user's projects)
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events', currentDate.getMonth(), currentDate.getFullYear(), filterProject, user?.id],
    queryFn: async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return [];

      // Get user's project memberships
      const { data: memberships } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', currentUser.id);
      
      const userProjectIds = memberships?.map(m => m.project_id) || [];
      
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      let query = supabase
        .from('events')
        .select('*')
        .gte('start_date', startOfMonth.toISOString())
        .lte('start_date', endOfMonth.toISOString())
        .order('start_date');

      if (filterProject !== 'all') {
        query = query.eq('entity_id', filterProject);
      } else if (userProjectIds.length > 0) {
        // Filter to only show events for user's projects OR events they created
        query = query.or(`entity_id.in.(${userProjectIds.join(',')}),created_by.eq.${currentUser.id}`);
      }
      
      const { data: eventsData, error } = await query;
      if (error) throw error;
      
      // Fetch related projects and participants separately
      const eventsWithRelations = await Promise.all((eventsData || []).map(async (event) => {
        let project = null;
        if (event.entity_id) {
          const { data: projectData } = await supabase
            .from('projects')
            .select('id, name')
            .eq('id', event.entity_id)
            .single();
          project = projectData;
        }
        
        const { data: participantsData } = await supabase
          .from('event_participants')
          .select('user_id, status')
          .eq('event_id', event.id);
        
        return {
          ...event,
          project,
          participants: participantsData || []
        };
      }));
      
      return eventsWithRelations as Event[];
    },
    enabled: !!user
  });

  // Realtime subscription for events
  useEffect(() => {
    const channel = supabase
      .channel('calendar-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (newEvent: typeof eventForm) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('User not authenticated');
      
      // Exclude priority from direct insert, it's stored in event_data
      const { priority, ...eventData } = newEvent;
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          description: eventData.description || null,
          start_date: eventData.start_date,
          end_date: eventData.end_date,
          location: eventData.location || null,
          event_type: eventData.event_type,
          event_status: eventData.event_status,
          created_by: currentUser.id,
          entity_id: eventData.entity_id || null,
          event_data: { priority },
          is_public: false,
          registration_required: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({ title: 'Event created successfully' });
      setIsEventDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to create event', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<typeof eventForm> }) => {
      const { priority, ...restUpdates } = updates;
      const { data, error } = await supabase
        .from('events')
        .update({
          title: restUpdates.title,
          description: restUpdates.description || null,
          start_date: restUpdates.start_date,
          end_date: restUpdates.end_date,
          location: restUpdates.location || null,
          event_type: restUpdates.event_type,
          event_status: restUpdates.event_status,
          entity_id: restUpdates.entity_id || null,
          event_data: { priority }
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({ title: 'Event updated successfully' });
      setIsEventDialogOpen(false);
      setSelectedEvent(null);
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update event', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({ title: 'Event deleted successfully' });
      setIsViewDialogOpen(false);
      setSelectedEvent(null);
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to delete event', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      event_type: 'meeting',
      event_status: 'scheduled',
      entity_id: '',
      priority: 'medium'
    });
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    resetForm();
    setIsEventDialogOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      start_date: event.start_date,
      end_date: event.end_date,
      location: event.location || '',
      event_type: event.event_type,
      event_status: event.event_status,
      entity_id: event.entity_id || '',
      priority: event.event_data?.priority || 'medium'
    });
    setIsEventDialogOpen(true);
  };

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsViewDialogOpen(true);
  };

  const handleSubmitEvent = () => {
    if (!eventForm.title || !eventForm.start_date || !eventForm.end_date) {
      toast({ 
        title: 'Please fill in all required fields',
        variant: 'destructive' 
      });
      return;
    }

    if (selectedEvent) {
      updateEventMutation.mutate({ id: selectedEvent.id, updates: eventForm });
    } else {
      createEventMutation.mutate(eventForm);
    }
  };

  const handleDeleteEvent = (id: string) => {
    setEventToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteEvent = () => {
    if (eventToDelete) {
      deleteEventMutation.mutate(eventToDelete);
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  // Calculate statistics
  const stats = {
    total: events.length,
    inspections: events.filter(e => e.event_type === 'inspection').length,
    meetings: events.filter(e => e.event_type === 'meeting').length,
    deliveries: events.filter(e => e.event_type === 'delivery').length
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    // Use day 1 to avoid month-skipping bug when current day > days in target month
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + (direction === 'next' ? 1 : -1), 1);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const navigate = (direction: 'prev' | 'next') => {
    if (selectedView === 'month') {
      navigateMonth(direction);
    } else if (selectedView === 'week') {
      navigateWeek(direction);
    } else {
      navigateDay(direction);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-CA', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'inspection': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      case 'meeting': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      case 'delivery': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'review': return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') {
      return <AlertCircle className="h-3 w-3 text-destructive" />;
    }
    return null;
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter(e => new Date(e.start_date) >= now)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 4);
  };

  const viewOptions = [
    { value: 'month', label: 'Month' },
    { value: 'week', label: 'Week' },
    { value: 'day', label: 'Day' },
  ];

  const projectFilterOptions = [
    { value: 'all', label: 'All Projects' },
    ...(projects?.map(p => ({ value: p.id, label: p.name })) || [])
  ];

  return (
    <MobilePageWrapper
      title="Calendar"
      subtitle="Schedules, meetings & dates"
      actions={
        <div className="flex items-center gap-2">
          {/* Mobile: Icon-only buttons */}
          <Button 
            variant="ghost" 
            size="icon"
            className="md:hidden h-9 w-9 rounded-full"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button 
            size="icon"
            className="md:hidden h-9 w-9 rounded-full bg-primary"
            onClick={handleCreateEvent}
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          {/* Desktop: Full buttons */}
          <div className="hidden md:flex gap-2">
            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filter Events</DialogTitle>
                  <DialogDescription>Filter events by project</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Project</Label>
                    <Select value={filterProject} onValueChange={setFilterProject}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsFilterOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={handleCreateEvent}>
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>
      }
    >
      {/* Mobile Filter & Project Selector */}
      <div className="flex flex-wrap gap-2 mb-4 md:hidden">
        <MobileFilterChip
          options={projectFilterOptions}
          value={filterProject}
          onChange={setFilterProject}
          placeholder="Project"
        />
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base md:text-lg font-semibold min-w-[140px] md:min-w-[180px] text-center">
            {selectedView === 'day' 
              ? currentDate.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
              : selectedView === 'week'
              ? `Week of ${new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay()).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}`
              : currentDate.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
            }
          </h2>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>

        {/* View Selector - Mobile uses segmented control, Desktop uses button group */}
        <div className="md:hidden">
          <MobileSegmentedControl
            options={viewOptions}
            value={selectedView}
            onChange={(v) => setSelectedView(v as 'month' | 'week' | 'day')}
            size="sm"
          />
        </div>
        <div className="hidden md:flex rounded-lg border p-1">
          {(['month', 'week', 'day'] as const).map((view) => (
            <Button
              key={view}
              variant={selectedView === view ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedView(view)}
              className="capitalize"
            >
              {view}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-2 md:p-4">
              {/* Month View */}
              {selectedView === 'month' && (
                <>
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-1 md:mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={i} className="p-1 md:p-2 text-center text-xs md:text-sm font-medium text-muted-foreground">
                        <span className="md:hidden">{day}</span>
                        <span className="hidden md:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</span>
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-0.5 md:gap-1">
                    {getDaysInMonth(currentDate).map((day, index) => (
                      <div
                        key={index}
                        className={`min-h-[52px] md:min-h-24 p-0.5 md:p-1 border rounded-lg md:rounded transition-colors ${
                          day ? 'hover:bg-accent cursor-pointer active:bg-accent/70' : ''
                        } ${
                          day === new Date().getDate() &&
                          currentDate.getMonth() === new Date().getMonth() &&
                          currentDate.getFullYear() === new Date().getFullYear()
                            ? 'bg-primary/10 border-primary'
                            : 'border-border'
                        }`}
                      >
                        {day && (
                          <>
                            <div className="text-xs md:text-sm font-medium mb-0.5 md:mb-1 text-center md:text-left">{day}</div>
                            {/* Mobile: show dot indicators only */}
                            <div className="md:hidden flex justify-center gap-0.5 flex-wrap">
                              {getEventsForDay(day).slice(0, 3).map((event) => (
                                <div
                                  key={event.id}
                                  onClick={() => handleViewEvent(event)}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    event.event_type === 'inspection' ? 'bg-red-500' :
                                    event.event_type === 'meeting' ? 'bg-blue-500' :
                                    event.event_type === 'delivery' ? 'bg-green-500' :
                                    'bg-primary'
                                  }`}
                                />
                              ))}
                            </div>
                            {/* Desktop: show event cards */}
                            <div className="hidden md:block space-y-1">
                              {getEventsForDay(day).slice(0, 2).map((event) => (
                                <div
                                  key={event.id}
                                  onClick={() => handleViewEvent(event)}
                                  className={`text-xs p-1 rounded border cursor-pointer hover:opacity-80 ${getTypeColor(event.event_type)}`}
                                >
                                  <div className="flex items-center gap-1">
                                    {getPriorityIcon(event.event_data?.priority)}
                                    <span className="truncate">{event.title}</span>
                                  </div>
                                </div>
                              ))}
                              {getEventsForDay(day).length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{getEventsForDay(day).length - 2} more
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Week View */}
              {selectedView === 'week' && (
                <>
                  {/* Day Headers with dates */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {(() => {
                      const startOfWeek = new Date(currentDate);
                      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                        const dayDate = new Date(startOfWeek);
                        dayDate.setDate(startOfWeek.getDate() + index);
                        const isToday = dayDate.toDateString() === new Date().toDateString();
                        return (
                          <div key={day} className={`p-2 text-center ${isToday ? 'bg-primary/10 rounded' : ''}`}>
                            <div className="text-sm font-medium text-muted-foreground">{day}</div>
                            <div className={`text-lg font-bold ${isToday ? 'text-primary' : ''}`}>
                              {dayDate.getDate()}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Week Days Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const startOfWeek = new Date(currentDate);
                      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                      return Array.from({ length: 7 }, (_, index) => {
                        const dayDate = new Date(startOfWeek);
                        dayDate.setDate(startOfWeek.getDate() + index);
                        const dayEvents = events?.filter((event) => {
                          const eventDate = new Date(event.start_date);
                          return eventDate.toDateString() === dayDate.toDateString();
                        }) || [];
                        const isToday = dayDate.toDateString() === new Date().toDateString();
                        
                        return (
                          <div
                            key={index}
                            className={`min-h-48 p-2 border rounded ${isToday ? 'border-primary bg-primary/5' : 'border-border'}`}
                          >
                            <div className="space-y-1">
                              {dayEvents.map((event) => (
                                <div
                                  key={event.id}
                                  onClick={() => handleViewEvent(event)}
                                  className={`text-xs p-2 rounded border cursor-pointer hover:opacity-80 ${getTypeColor(event.event_type)}`}
                                >
                                  <div className="font-medium truncate">{event.title}</div>
                                  <div className="text-muted-foreground">
                                    {formatTime(new Date(event.start_date))}
                                  </div>
                                </div>
                              ))}
                              {dayEvents.length === 0 && (
                                <div className="text-xs text-muted-foreground text-center py-4">
                                  No events
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </>
              )}

              {/* Day View */}
              {selectedView === 'day' && (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold">
                      {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                    </div>
                    <div className="text-lg text-muted-foreground">
                      {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>

                  {/* Time slots */}
                  <div className="space-y-1">
                    {Array.from({ length: 24 }, (_, hour) => {
                      const hourEvents = events?.filter((event) => {
                        const eventDate = new Date(event.start_date);
                        return eventDate.toDateString() === currentDate.toDateString() &&
                               eventDate.getHours() === hour;
                      }) || [];
                      
                      return (
                        <div key={hour} className="flex gap-2 min-h-12 border-b border-border/50">
                          <div className="w-16 py-2 text-sm text-muted-foreground text-right pr-2">
                            {hour.toString().padStart(2, '0')}:00
                          </div>
                          <div className="flex-1 py-1">
                            {hourEvents.map((event) => (
                              <div
                                key={event.id}
                                onClick={() => handleViewEvent(event)}
                                className={`text-sm p-2 rounded border cursor-pointer hover:opacity-80 mb-1 ${getTypeColor(event.event_type)}`}
                              >
                                <div className="font-medium">{event.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatTime(new Date(event.start_date))} - {formatTime(new Date(event.end_date))}
                                </div>
                                {event.location && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <MapPin className="h-3 w-3" />
                                    {event.location}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="text-center text-muted-foreground py-4">Loading events...</div>
              ) : getUpcomingEvents().length === 0 ? (
                <div className="text-center text-muted-foreground py-4">No upcoming events</div>
              ) : (
                getUpcomingEvents().map((event) => (
                  <div key={event.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <Badge variant="outline" className={getTypeColor(event.event_type)}>
                        {event.event_type}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatTime(new Date(event.start_date))} - {formatTime(new Date(event.end_date))}
                        </span>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      
                      {event.project && (
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          <span>{event.project.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewEvent(event)}>
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditEvent(event)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Events</span>
                <span className="font-medium">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Inspections</span>
                <span className="font-medium">{stats.inspections}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Meetings</span>
                <span className="font-medium">{stats.meetings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Deliveries</span>
                <span className="font-medium">{stats.deliveries}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create/Edit Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
            <DialogDescription>
              {selectedEvent ? 'Update event details' : 'Add a new event to your calendar'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="Event title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Event description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date & Time *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={eventForm.start_date ? new Date(eventForm.start_date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEventForm({ ...eventForm, start_date: new Date(e.target.value).toISOString() })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date & Time *</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={eventForm.end_date ? new Date(eventForm.end_date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEventForm({ ...eventForm, end_date: new Date(e.target.value).toISOString() })}
                />
              </div>
            </div>

            <LocationAutocomplete
              value={eventForm.location}
              onChange={(value) => setEventForm({ ...eventForm, location: value })}
              placeholder="Event location"
              label="Location"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type *</Label>
                <Select value={eventForm.event_type} onValueChange={(value) => setEventForm({ ...eventForm, event_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={eventForm.priority} onValueChange={(value) => setEventForm({ ...eventForm, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entity_id">Project (Optional)</Label>
                <Select value={eventForm.entity_id || 'none'} onValueChange={(value) => setEventForm({ ...eventForm, entity_id: value === 'none' ? '' : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_status">Status</Label>
                <Select value={eventForm.event_status} onValueChange={(value) => setEventForm({ ...eventForm, event_status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitEvent}
              disabled={createEventMutation.isPending || updateEventMutation.isPending}
            >
              {createEventMutation.isPending || updateEventMutation.isPending ? 'Saving...' : selectedEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Event Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>Event Details</DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Badge className={getTypeColor(selectedEvent.event_type)}>
                  {selectedEvent.event_type}
                </Badge>
                <Badge variant="outline">
                  {selectedEvent.event_status}
                </Badge>
                {selectedEvent.event_data?.priority && (
                  <Badge variant="outline">
                    Priority: {selectedEvent.event_data.priority}
                  </Badge>
                )}
              </div>

              {selectedEvent.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(selectedEvent.start_date).toLocaleString()} - {new Date(selectedEvent.end_date).toLocaleString()}
                  </span>
                </div>

                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}

                {selectedEvent.project && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Project: {selectedEvent.project.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}
              disabled={deleteEventMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteEventMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              selectedEvent && handleEditEvent(selectedEvent);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEventToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobilePageWrapper>
  );
};

export default CalendarPage;