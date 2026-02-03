import { useState } from 'react';
import { 
  Camera, 
  Calendar, 
  TrendingUp, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Download,
  ZoomIn,
  Maximize2,
  BarChart3,
  Layers,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

// Mock progress data with clear before/after construction phases
const mockProgressData = [
  {
    id: 'prog-001',
    date: '2026-01-15',
    camera: 'Main Entrance',
    beforeImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&h=400&fit=crop', // Empty construction lot with surveying
    afterImage: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=400&fit=crop', // Building with foundation and workers
    progressPercent: 35,
    phase: 'Foundation',
    notes: 'Concrete pouring completed for Section A'
  },
  {
    id: 'prog-002',
    date: '2026-01-18',
    camera: 'Building A - Zone 2',
    beforeImage: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=400&fit=crop', // Foundation stage
    afterImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop', // Steel framework rising with cranes
    progressPercent: 48,
    phase: 'Structural',
    notes: 'Steel framework installation in progress'
  },
  {
    id: 'prog-003',
    date: '2026-01-20',
    camera: 'Scaffolding Zone',
    beforeImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop', // Early steel structure
    afterImage: 'https://images.unsplash.com/photo-1517089596392-fb9a9033e05b?w=600&h=400&fit=crop', // Building with scaffolding and workers
    progressPercent: 62,
    phase: 'Structural',
    notes: 'External scaffolding completed for floors 1-5'
  }
];

const mockMilestones = [
  { phase: 'Site Prep', progress: 100, status: 'completed' },
  { phase: 'Foundation', progress: 100, status: 'completed' },
  { phase: 'Structural', progress: 65, status: 'in_progress' },
  { phase: 'MEP Rough-in', progress: 20, status: 'in_progress' },
  { phase: 'Exterior', progress: 0, status: 'pending' },
  { phase: 'Interior', progress: 0, status: 'pending' },
  { phase: 'Final', progress: 0, status: 'pending' }
];

interface ProgressTrackingTabProps {
  isEnabled: boolean;
  isUpcoming: boolean;
}

const ProgressTrackingTab = ({ isEnabled, isUpcoming }: ProgressTrackingTabProps) => {
  const [selectedProgress, setSelectedProgress] = useState(mockProgressData[0]);
  const [comparisonSlider, setComparisonSlider] = useState([50]);
  const [selectedCamera, setSelectedCamera] = useState('all');
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isEnabled) {
    return (
      <Card className="p-8 text-center">
        <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Progress Tracking {isUpcoming ? 'Coming Soon' : 'Disabled'}
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {isUpcoming 
            ? 'AI-powered construction progress tracking will automatically capture and compare images over time.'
            : 'This feature has been disabled by an administrator.'}
        </p>
        {isUpcoming && <Badge className="mt-4" variant="secondary">Phase 2 Feature</Badge>}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Overall Construction Progress
              </CardTitle>
              <CardDescription>AI-analyzed progress based on visual comparison</CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-1">
              62% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Milestone Progress */}
          <div className="space-y-4">
            {mockMilestones.map((milestone, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-28 text-sm font-medium">{milestone.phase}</div>
                <div className="flex-1">
                  <Progress 
                    value={milestone.progress} 
                    className="h-3"
                  />
                </div>
                <div className="w-16 text-right text-sm">
                  {milestone.progress}%
                </div>
                <Badge 
                  variant={
                    milestone.status === 'completed' ? 'default' :
                    milestone.status === 'in_progress' ? 'secondary' : 'outline'
                  }
                  className="w-24 justify-center"
                >
                  {milestone.status === 'completed' ? '✓ Done' :
                   milestone.status === 'in_progress' ? 'In Progress' : 'Pending'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Before/After Comparison */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Visual Progress Comparison
              </CardTitle>
              <CardDescription>Drag slider to compare before and after</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select Camera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cameras</SelectItem>
                  <SelectItem value="main">Main Entrance</SelectItem>
                  <SelectItem value="crane">Crane Area</SelectItem>
                  <SelectItem value="scaffold">Scaffolding Zone</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Comparison Slider */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {/* After Image (Background) */}
            <img 
              src={selectedProgress.afterImage}
              alt="After"
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Before Image (Clipped) */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${comparisonSlider[0]}%` }}
            >
              <img 
                src={selectedProgress.beforeImage}
                alt="Before"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ width: `${100 / (comparisonSlider[0] / 100)}%` }}
              />
            </div>
            
            {/* Slider Handle */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10 flex items-center justify-center"
              style={{ left: `${comparisonSlider[0]}%`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground rotate-180" />
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            {/* Labels */}
            <div className="absolute top-4 left-4 z-20">
              <Badge className="bg-black/70 text-white">Before</Badge>
            </div>
            <div className="absolute top-4 right-4 z-20">
              <Badge className="bg-black/70 text-white">After</Badge>
            </div>
            
            {/* Date Info */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between z-20">
              <Badge variant="secondary" className="bg-black/70 text-white border-0">
                <Calendar className="h-3 w-3 mr-1" />
                Jan 1, 2026
              </Badge>
              <Badge variant="secondary" className="bg-black/70 text-white border-0">
                <Calendar className="h-3 w-3 mr-1" />
                {selectedProgress.date}
              </Badge>
            </div>
          </div>
          
          {/* Slider Control */}
          <Slider
            value={comparisonSlider}
            onValueChange={setComparisonSlider}
            max={100}
            step={1}
            className="w-full"
          />
          
          {/* Progress Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{selectedProgress.progressPercent}%</p>
              <p className="text-xs text-muted-foreground">Phase Progress</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{selectedProgress.phase}</p>
              <p className="text-xs text-muted-foreground">Current Phase</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">+12%</p>
              <p className="text-xs text-muted-foreground">Weekly Change</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">On Track</p>
              <p className="text-xs text-muted-foreground">Status</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Gallery */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Progress Timeline
              </CardTitle>
              <CardDescription>Daily/weekly snapshots from all cameras</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockProgressData.map((item) => (
              <Card 
                key={item.id} 
                className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary overflow-hidden ${
                  selectedProgress.id === item.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedProgress(item)}
              >
                <div className="relative aspect-video">
                  <img 
                    src={item.afterImage} 
                    alt={item.camera}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-sm font-medium">{item.camera}</p>
                    <p className="text-white/80 text-xs">{item.date}</p>
                  </div>
                  <Badge 
                    className="absolute top-2 right-2 bg-primary"
                  >
                    {item.progressPercent}%
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{item.phase}</Badge>
                    <Button size="sm" variant="ghost">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {item.notes}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            AI Progress Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Detected Changes (Last 7 Days)</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Scaffolding extended to floor 5 (+2 floors)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Concrete work completed in Zone B
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  New equipment detected: Tower crane installed
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  Material delivery: Steel beams arrived
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Estimated Timeline</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Current Phase Completion</span>
                  <span className="font-medium">~15 days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Project Completion</span>
                  <span className="font-medium">~180 days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Schedule Variance</span>
                  <span className="font-medium text-green-600">2 days ahead</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressTrackingTab;