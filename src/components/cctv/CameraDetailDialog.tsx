import { useState } from 'react';
import { 
  Camera, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2,
  RotateCcw,
  Download,
  Settings,
  AlertTriangle,
  Clock,
  Wifi,
  WifiOff,
  Eye,
  HardHat,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Move
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface CameraData {
  id: string;
  name: string;
  location: string;
  status: string;
  recording: boolean;
  aiEnabled: boolean;
  alerts: number;
  lastActivity: string;
  thumbnail: string;
}

interface CameraDetailDialogProps {
  camera: CameraData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock event timeline for selected camera
const generateMockEvents = (cameraName: string) => [
  { id: 1, time: '14:32:15', type: 'motion', description: 'Motion detected in zone A', severity: 'info' },
  { id: 2, time: '14:28:03', type: 'ppe', description: 'Worker without helmet detected', severity: 'high' },
  { id: 3, time: '14:15:42', type: 'person', description: '3 workers entered area', severity: 'info' },
  { id: 4, time: '13:58:19', type: 'vehicle', description: 'Truck entered loading zone', severity: 'info' },
  { id: 5, time: '13:45:00', type: 'safety', description: 'Safety zone breach detected', severity: 'medium' },
  { id: 6, time: '13:30:22', type: 'motion', description: 'Motion detected in zone B', severity: 'info' },
];

const CameraDetailDialog = ({ camera, open, onOpenChange }: CameraDetailDialogProps) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [activeTab, setActiveTab] = useState('live');
  const [zoomLevel, setZoomLevel] = useState([100]);
  const [aiOverlay, setAiOverlay] = useState(true);
  const [motionDetection, setMotionDetection] = useState(true);

  if (!camera) return null;

  const mockEvents = generateMockEvents(camera.name);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'info': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ppe': return <HardHat className="h-3 w-3" />;
      case 'safety': return <AlertTriangle className="h-3 w-3" />;
      default: return <Eye className="h-3 w-3" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Main Video Area */}
          <div className="flex-1 bg-black relative">
            {/* Video Feed (Mock) */}
            <div className="relative aspect-video lg:aspect-auto lg:h-full">
              <img 
                src={camera.thumbnail} 
                alt={camera.name}
                className="w-full h-full object-cover"
                style={{ transform: `scale(${zoomLevel[0] / 100})` }}
              />
              
              {/* Live indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <Badge variant={camera.status === 'online' ? 'default' : 'destructive'}>
                  {camera.status === 'online' ? (
                    <><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" /> LIVE</>
                  ) : (
                    <><WifiOff className="h-3 w-3 mr-1" /> OFFLINE</>
                  )}
                </Badge>
                {camera.aiEnabled && aiOverlay && (
                  <Badge className="bg-purple-500 text-white">
                    <Eye className="h-3 w-3 mr-1" /> AI Active
                  </Badge>
                )}
              </div>

              {/* Timestamp overlay */}
              <div className="absolute top-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded font-mono">
                {new Date().toLocaleString()} | {camera.name}
              </div>

              {/* AI Detection overlay (mock bounding boxes) */}
              {aiOverlay && camera.aiEnabled && (
                <>
                  <div className="absolute top-1/3 left-1/4 w-16 h-24 border-2 border-green-500 rounded">
                    <span className="absolute -top-5 left-0 bg-green-500 text-white text-[10px] px-1 rounded">
                      Worker 94%
                    </span>
                  </div>
                  <div className="absolute top-1/2 right-1/3 w-20 h-28 border-2 border-yellow-500 rounded">
                    <span className="absolute -top-5 left-0 bg-yellow-500 text-black text-[10px] px-1 rounded">
                      No Helmet 87%
                    </span>
                  </div>
                </>
              )}

              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="text-white hover:bg-white/20"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="text-white hover:bg-white/20"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    <div className="h-6 w-px bg-white/30 mx-2" />
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <div className="w-24">
                      <Slider 
                        value={zoomLevel} 
                        onValueChange={setZoomLevel}
                        min={50}
                        max={200}
                        step={10}
                        className="cursor-pointer"
                      />
                    </div>
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                      <Move className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="w-full lg:w-80 border-l border-border bg-background flex flex-col">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {camera.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{camera.location}</p>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-2">
                <TabsTrigger value="live" className="flex-1">Events</TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="live" className="flex-1 m-0">
                <ScrollArea className="h-64 lg:h-[400px]">
                  <div className="p-4 space-y-2">
                    <h4 className="text-sm font-medium mb-3">Recent Events</h4>
                    {mockEvents.map((event) => (
                      <div 
                        key={event.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className={`p-1.5 rounded ${getSeverityColor(event.severity)}`}>
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.description}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {event.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="settings" className="flex-1 m-0">
                <ScrollArea className="h-64 lg:h-[400px]">
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">AI Overlay</p>
                        <p className="text-xs text-muted-foreground">Show detection boxes</p>
                      </div>
                      <Switch checked={aiOverlay} onCheckedChange={setAiOverlay} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Motion Detection</p>
                        <p className="text-xs text-muted-foreground">Alert on movement</p>
                      </div>
                      <Switch checked={motionDetection} onCheckedChange={setMotionDetection} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Recording</p>
                        <p className="text-xs text-muted-foreground">Continuous recording</p>
                      </div>
                      <Switch checked={camera.recording} />
                    </div>
                    <div className="pt-4 border-t space-y-3">
                      <h4 className="text-sm font-medium">Camera Info</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium capitalize">{camera.status}</span>
                        <span className="text-muted-foreground">Resolution</span>
                        <span className="font-medium">1920x1080</span>
                        <span className="text-muted-foreground">FPS</span>
                        <span className="font-medium">30</span>
                        <span className="text-muted-foreground">Storage</span>
                        <span className="font-medium">12.4 GB</span>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Quick Actions */}
            <div className="p-4 border-t space-y-2">
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Recording
              </Button>
              <Button className="w-full" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Camera Settings
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraDetailDialog;
