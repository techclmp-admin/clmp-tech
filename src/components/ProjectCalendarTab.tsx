import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  CalendarDays,
  Clock,
  MapPin,
  Plus,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { format, isToday, isSameDay } from 'date-fns';

interface ProjectCalendarTabProps {
  projectId: string;
  projectName: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  event_type: string;
  event_status: string;
  event_data?: any;
}

export const ProjectCalendarTab: React.FC<ProjectCalendarTabProps> = ({ 
  projectId, 
  projectName 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();
  
  const featureEnabled = isFeatureEnabled('calendar_view');
  const featureUpcoming = isFeatureUpcoming('calendar_view');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    event_type: 'meeting',
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

  // Fetch events for this project
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['project-events', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('entity_id', projectId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data as Event[];
    },
    enabled: !!projectId
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (newEvent: typeof eventForm) => {
      if (!user) throw new Error('User not authenticated');
      
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
          event_status: 'scheduled',
          created_by: user.id,
          entity_id: projectId,
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
      queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({ title: 'Event created successfully' });
      setIsCreateDialogOpen(false);
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

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      event_type: 'meeting',
      priority: 'medium'
    });
  };

  const handleCreateEvent = () => {
    // Pre-fill start date if a date is selected
    if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd'T'HH:mm");
      setEventForm(prev => ({
        ...prev,
        start_date: dateStr,
        end_date: dateStr
      }));
    }
    setIsCreateDialogOpen(true);
  };

  const handleSubmitEvent = () => {
    if (!eventForm.title || !eventForm.start_date || !eventForm.end_date) {
      toast({ 
        title: 'Please fill in all required fields',
        variant: 'destructive' 
      });
      return;
    }
    createEventMutation.mutate(eventForm);
  };

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsViewDialogOpen(true);
  };

  const goToFullCalendar = () => {
    // Navigate to calendar with project filter
    navigate(`/calendar?project=${projectId}`);
  };

  // Get upcoming events (next 7)
  const upcomingEvents = events
    .filter(e => new Date(e.start_date) >= new Date())
    .slice(0, 7);

  // Get events for selected date
  const eventsForSelectedDate = selectedDate 
    ? events.filter(e => isSameDay(new Date(e.start_date), selectedDate))
    : [];

  // Get dates with events for calendar highlighting
  const datesWithEvents = events.map(e => new Date(e.start_date));

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'inspection': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      case 'meeting': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      case 'delivery': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'milestone': return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
      case 'deadline': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'cancelled': return <AlertCircle className="h-3 w-3 text-red-500" />;
      default: return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), 'h:mm a');
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
            <CalendarDays className="h-5 w-5" />
            Calendar View
            <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Mini Calendar */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendar
            </span>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={goToFullCalendar}
              className="h-8 text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Full View
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{
              hasEvent: datesWithEvents
            }}
            modifiersStyles={{
              hasEvent: { 
                fontWeight: 'bold',
                backgroundColor: 'hsl(var(--primary) / 0.1)',
                borderRadius: '50%'
              }
            }}
            className="rounded-md border-0 w-full"
          />
          
          {/* Events for selected date */}
          {selectedDate && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">
                {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM dd, yyyy')}
              </h4>
              {eventsForSelectedDate.length === 0 ? (
                <p className="text-xs text-muted-foreground">No events</p>
              ) : (
                <div className="space-y-2">
                  {eventsForSelectedDate.map(event => (
                    <div 
                      key={event.id}
                      onClick={() => handleViewEvent(event)}
                      className={`p-2 rounded-lg border cursor-pointer hover:opacity-80 ${getTypeColor(event.event_type)}`}
                    >
                      <div className="flex items-center gap-1 text-xs font-medium">
                        {getStatusIcon(event.event_status)}
                        <span className="truncate">{event.title}</span>
                      </div>
                      <div className="text-xs opacity-70 mt-0.5">
                        {formatTime(event.start_date)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events List */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Events
            </span>
            <Button size="sm" onClick={handleCreateEvent}>
              <Plus className="h-4 w-4 mr-1" />
              Add Event
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading events...
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No upcoming events</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Add inspections, meetings, or milestones
              </p>
              <Button size="sm" className="mt-4" onClick={handleCreateEvent}>
                <Plus className="h-4 w-4 mr-1" />
                Create First Event
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div 
                  key={event.id}
                  onClick={() => handleViewEvent(event)}
                  className="flex items-start gap-4 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                >
                  {/* Date badge */}
                  <div className="flex-shrink-0 w-14 text-center">
                    <div className="text-xs text-muted-foreground uppercase">
                      {format(new Date(event.start_date), 'MMM')}
                    </div>
                    <div className="text-2xl font-bold">
                      {format(new Date(event.start_date), 'dd')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(event.start_date), 'EEE')}
                    </div>
                  </div>

                  {/* Event details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{event.title}</h4>
                      <Badge variant="outline" className={`text-xs ${getTypeColor(event.event_type)}`}>
                        {event.event_type}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(event.start_date)} - {formatTime(event.end_date)}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0">
                    {getStatusIcon(event.event_status)}
                  </div>
                </div>
              ))}

              {events.length > 7 && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={goToFullCalendar}
                >
                  View All {events.length} Events
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Event to {projectName}</DialogTitle>
            <DialogDescription>
              Create a new event for this project
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={eventForm.title}
                onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Event title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={eventForm.description}
                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Event description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date & Time *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={eventForm.start_date}
                  onChange={(e) => setEventForm(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date & Time *</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={eventForm.end_date}
                  onChange={(e) => setEventForm(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={eventForm.location}
                onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Event location"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type *</Label>
                <Select 
                  value={eventForm.event_type} 
                  onValueChange={(value) => setEventForm(prev => ({ ...prev, event_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={eventForm.priority} 
                  onValueChange={(value) => setEventForm(prev => ({ ...prev, priority: value }))}
                >
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitEvent} disabled={createEventMutation.isPending}>
              {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Event Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>Event Details</DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getTypeColor(selectedEvent.event_type)}>
                  {selectedEvent.event_type}
                </Badge>
                <Badge variant="outline">
                  {selectedEvent.event_status}
                </Badge>
                {selectedEvent.event_data?.priority === 'high' && (
                  <Badge variant="destructive">High Priority</Badge>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(selectedEvent.start_date), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {formatTime(selectedEvent.start_date)} - {formatTime(selectedEvent.end_date)}
                  </span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.description && (
                  <div className="pt-2 border-t">
                    <p className="text-muted-foreground">{selectedEvent.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={goToFullCalendar}>
              <Eye className="h-4 w-4 mr-2" />
              View in Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
