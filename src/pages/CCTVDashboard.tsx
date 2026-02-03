import { useState, useMemo } from 'react';
import { 
  Camera, 
  Shield, 
  AlertTriangle, 
  Activity, 
  Eye, 
  Settings,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Grid3X3,
  List,
  Clock,
  MapPin,
  Wifi,
  WifiOff,
  HardHat,
  Construction,
  Users,
  TrendingUp,
  Bell,
  Search,
  Filter,
  Download,
  RefreshCw,
  Lock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MobilePageWrapper, MobileCard, MobileSegmentedControl } from '@/components/mobile';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import CameraDetailDialog from '@/components/cctv/CameraDetailDialog';
import AlertDetailDialog from '@/components/cctv/AlertDetailDialog';
import PlaybackTimeline from '@/components/cctv/PlaybackTimeline';
import ProgressTrackingTab from '@/components/cctv/ProgressTrackingTab';
import QualityControlTab from '@/components/cctv/QualityControlTab';
import RiskDetectionTab from '@/components/cctv/RiskDetectionTab';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';

// Mock camera data with construction-specific images
const mockCameras = [
  { 
    id: 'cam-001', 
    name: 'Main Entrance', 
    location: 'Building A - Gate 1',
    status: 'online',
    recording: true,
    aiEnabled: true,
    alerts: 2,
    lastActivity: '2 min ago',
    thumbnail: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=300&fit=crop' // Construction site gate with workers
  },
  { 
    id: 'cam-002', 
    name: 'Crane Area', 
    location: 'Building A - Zone 2',
    status: 'online',
    recording: true,
    aiEnabled: true,
    alerts: 0,
    lastActivity: '5 min ago',
    thumbnail: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop' // Tower crane at construction
  },
  { 
    id: 'cam-003', 
    name: 'Material Storage', 
    location: 'Warehouse - Section B',
    status: 'online',
    recording: true,
    aiEnabled: false,
    alerts: 1,
    lastActivity: '1 min ago',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' // Construction materials stacked
  },
  { 
    id: 'cam-004', 
    name: 'Parking Lot', 
    location: 'External - North',
    status: 'offline',
    recording: false,
    aiEnabled: true,
    alerts: 0,
    lastActivity: '1 hour ago',
    thumbnail: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=400&h=300&fit=crop' // Construction site parking with vehicles
  },
  { 
    id: 'cam-005', 
    name: 'Scaffolding Zone', 
    location: 'Building B - Level 3',
    status: 'online',
    recording: true,
    aiEnabled: true,
    alerts: 3,
    lastActivity: 'Just now',
    thumbnail: 'https://images.unsplash.com/photo-1517089596392-fb9a9033e05b?w=400&h=300&fit=crop' // Workers on construction scaffolding
  },
  { 
    id: 'cam-006', 
    name: 'Equipment Yard', 
    location: 'External - East',
    status: 'online',
    recording: true,
    aiEnabled: true,
    alerts: 0,
    lastActivity: '10 min ago',
    thumbnail: 'https://images.unsplash.com/photo-1580901368919-7738efb0f87e?w=400&h=300&fit=crop' // Excavators and construction equipment
  }
];

// Mock AI alerts with construction-specific images
const mockAlerts = [
  {
    id: 'alert-001',
    type: 'ppe_violation',
    severity: 'high',
    camera: 'Scaffolding Zone',
    description: 'Worker detected without safety helmet',
    timestamp: '2 min ago',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=200&h=150&fit=crop' // Workers on scaffolding
  },
  {
    id: 'alert-002',
    type: 'intrusion',
    severity: 'critical',
    camera: 'Main Entrance',
    description: 'Unauthorized access detected after hours',
    timestamp: '15 min ago',
    status: 'reviewing',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=200&h=150&fit=crop' // Construction gate
  },
  {
    id: 'alert-003',
    type: 'safety_hazard',
    severity: 'medium',
    camera: 'Material Storage',
    description: 'Blocked emergency exit detected',
    timestamp: '32 min ago',
    status: 'resolved',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=150&fit=crop' // Materials blocking area
  },
  {
    id: 'alert-004',
    type: 'ppe_violation',
    severity: 'high',
    camera: 'Crane Area',
    description: 'Missing high-visibility vest',
    timestamp: '1 hour ago',
    status: 'resolved',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&h=150&fit=crop' // Crane area workers
  }
];

// Mock analytics data
const analyticsData = {
  totalCameras: 12,
  onlineCameras: 10,
  aiProcessedFrames: 1847293,
  alertsToday: 23,
  ppeCompliance: 94,
  avgResponseTime: '2.3 min',
  storageUsed: 78,
  workersDetected: 47
};

const CCTVDashboard = () => {
  const isMobile = useIsMobile();
  const { isFeatureEnabled, isFeatureUpcoming, isLoading: featuresLoading } = useProjectFeatures();
  
  const [activeTab, setActiveTab] = useState('live');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCamera, setSelectedCamera] = useState<typeof mockCameras[0] | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<typeof mockAlerts[0] | null>(null);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [searchQuery, setSearchQuery] = useState('');
  const [cameraFilter, setCameraFilter] = useState('all');
  
  // Settings state
  const [ppeDetection, setPpeDetection] = useState(true);
  const [intrusionDetection, setIntrusionDetection] = useState(true);
  const [safetyZoneMonitoring, setSafetyZoneMonitoring] = useState(true);
  const [vehicleTracking, setVehicleTracking] = useState(false);
  const [workerCount, setWorkerCount] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [slackIntegration, setSlackIntegration] = useState(false);

  // Feature flags for CCTV sub-features
  const liveViewEnabled = isFeatureEnabled('cctv_live_view');
  const liveViewUpcoming = isFeatureUpcoming('cctv_live_view');
  const aiDetectionEnabled = isFeatureEnabled('cctv_ai_detection');
  const aiDetectionUpcoming = isFeatureUpcoming('cctv_ai_detection');
  const analyticsEnabled = isFeatureEnabled('cctv_analytics');
  const analyticsUpcoming = isFeatureUpcoming('cctv_analytics');
  const progressTrackingEnabled = isFeatureEnabled('cctv_progress_tracking');
  const progressTrackingUpcoming = isFeatureUpcoming('cctv_progress_tracking');
  const qualityControlEnabled = isFeatureEnabled('cctv_quality_control');
  const qualityControlUpcoming = isFeatureUpcoming('cctv_quality_control');
  const riskDetectionEnabled = isFeatureEnabled('cctv_risk_detection');
  const riskDetectionUpcoming = isFeatureUpcoming('cctv_risk_detection');

  // Build tab options based on feature flags
  const tabOptions = useMemo(() => {
    const tabs = [];
    
    // Live View tab
    if (liveViewEnabled || liveViewUpcoming) {
      tabs.push({ 
        value: 'live', 
        label: liveViewUpcoming ? 'Live View (Coming Soon)' : 'Live View',
        disabled: !liveViewEnabled,
        upcoming: liveViewUpcoming
      });
    }
    
    // AI Alerts tab
    if (aiDetectionEnabled || aiDetectionUpcoming) {
      tabs.push({ 
        value: 'alerts', 
        label: aiDetectionUpcoming ? 'AI Alerts (Coming Soon)' : 'AI Alerts',
        disabled: !aiDetectionEnabled,
        upcoming: aiDetectionUpcoming
      });
    }
    
    // Analytics tab
    if (analyticsEnabled || analyticsUpcoming) {
      tabs.push({ 
        value: 'analytics', 
        label: analyticsUpcoming ? 'Analytics (Coming Soon)' : 'Analytics',
        disabled: !analyticsEnabled,
        upcoming: analyticsUpcoming
      });
    }

    // Progress Tracking tab
    if (progressTrackingEnabled || progressTrackingUpcoming) {
      tabs.push({ 
        value: 'progress', 
        label: progressTrackingUpcoming ? 'Progress (Coming Soon)' : 'Progress',
        disabled: !progressTrackingEnabled,
        upcoming: progressTrackingUpcoming
      });
    }

    // Quality Control tab
    if (qualityControlEnabled || qualityControlUpcoming) {
      tabs.push({ 
        value: 'quality', 
        label: qualityControlUpcoming ? 'Quality (Coming Soon)' : 'Quality',
        disabled: !qualityControlEnabled,
        upcoming: qualityControlUpcoming
      });
    }

    // Risk Detection tab
    if (riskDetectionEnabled || riskDetectionUpcoming) {
      tabs.push({ 
        value: 'risk', 
        label: riskDetectionUpcoming ? 'Risk (Coming Soon)' : 'Risk',
        disabled: !riskDetectionEnabled,
        upcoming: riskDetectionUpcoming
      });
    }
    
    // Settings tab (always available)
    tabs.push({ value: 'settings', label: 'Settings', disabled: false, upcoming: false });
    
    return tabs;
  }, [liveViewEnabled, liveViewUpcoming, aiDetectionEnabled, aiDetectionUpcoming, analyticsEnabled, analyticsUpcoming, progressTrackingEnabled, progressTrackingUpcoming, qualityControlEnabled, qualityControlUpcoming, riskDetectionEnabled, riskDetectionUpcoming]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'ppe_violation': return <HardHat className="h-4 w-4" />;
      case 'intrusion': return <Shield className="h-4 w-4" />;
      case 'safety_hazard': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-500';
      case 'reviewing': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  const handleAlertStatusChange = (alertId: string, newStatus: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, status: newStatus } : a
    ));
    toast.success(`Alert ${newStatus === 'resolved' ? 'resolved' : 'acknowledged'}`);
  };

  const handleSettingSave = (settingName: string) => {
    toast.success(`${settingName} setting updated`);
  };

  return (
    <MobilePageWrapper
      title="CCTV AI Operation"
      subtitle="Real-time construction site monitoring"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" className="bg-primary">
            <Camera className="h-4 w-4 mr-1" />
            Add Camera
          </Button>
        </div>
      }
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MobileCard 
          title="Cameras Online" 
          value={`${analyticsData.onlineCameras}/${analyticsData.totalCameras}`}
          icon={Camera}
          iconClassName="bg-green-100 dark:bg-green-900/30"
        />
        <MobileCard 
          title="Alerts Today" 
          value={analyticsData.alertsToday}
          icon={AlertTriangle}
          iconClassName="bg-orange-100 dark:bg-orange-900/30"
        />
        <MobileCard 
          title="PPE Compliance" 
          value={`${analyticsData.ppeCompliance}%`}
          icon={HardHat}
          iconClassName="bg-blue-100 dark:bg-blue-900/30"
        />
        <MobileCard 
          title="Workers On Site" 
          value={analyticsData.workersDetected}
          icon={Users}
          iconClassName="bg-purple-100 dark:bg-purple-900/30"
        />
      </div>

      {/* Mobile Tabs */}
      {isMobile ? (
        <MobileSegmentedControl
          options={tabOptions.filter(t => !t.disabled).map(t => ({ value: t.value, label: t.label }))}
          value={activeTab}
          onChange={(val) => {
            const tab = tabOptions.find(t => t.value === val);
            if (tab && !tab.disabled) setActiveTab(val);
          }}
          className="mb-4"
        />
      ) : (
        <Tabs value={activeTab} onValueChange={(val) => {
          const tab = tabOptions.find(t => t.value === val);
          if (tab && !tab.disabled) setActiveTab(val);
        }} className="mb-6">
          <TabsList>
            {tabOptions.map(tab => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                disabled={tab.disabled}
                className={tab.upcoming ? 'opacity-60' : ''}
              >
                {tab.upcoming && <Lock className="h-3 w-3 mr-1" />}
                {tab.label.replace(' (Coming Soon)', '')}
                {tab.upcoming && (
                  <Badge variant="secondary" className="ml-1 text-[10px] py-0 px-1">Soon</Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Feature Disabled Placeholder */}
      {activeTab === 'live' && !liveViewEnabled && (
        <Card className="p-8 text-center">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Live View is {liveViewUpcoming ? 'Coming Soon' : 'Disabled'}</h3>
          <p className="text-muted-foreground">
            {liveViewUpcoming 
              ? 'This feature is currently under development and will be available soon.'
              : 'This feature has been disabled by an administrator.'}
          </p>
        </Card>
      )}

      {activeTab === 'alerts' && !aiDetectionEnabled && (
        <Card className="p-8 text-center">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI Alerts is {aiDetectionUpcoming ? 'Coming Soon' : 'Disabled'}</h3>
          <p className="text-muted-foreground">
            {aiDetectionUpcoming 
              ? 'This feature is currently under development and will be available soon.'
              : 'This feature has been disabled by an administrator.'}
          </p>
        </Card>
      )}

      {activeTab === 'analytics' && !analyticsEnabled && (
        <Card className="p-8 text-center">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analytics is {analyticsUpcoming ? 'Coming Soon' : 'Disabled'}</h3>
          <p className="text-muted-foreground">
            {analyticsUpcoming 
              ? 'This feature is currently under development and will be available soon.'
              : 'This feature has been disabled by an administrator.'}
          </p>
        </Card>
      )}

      {/* Live View Tab */}
      {activeTab === 'live' && liveViewEnabled && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                placeholder="Search cameras..." 
                className="w-40 md:w-64" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select value={cameraFilter} onValueChange={setCameraFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cameras</SelectItem>
                  <SelectItem value="online">Online Only</SelectItem>
                  <SelectItem value="alerts">With Alerts</SelectItem>
                  <SelectItem value="ai">AI Enabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Camera Grid */}
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
            : 'space-y-3'
          }>
            {mockCameras
              .filter(c => {
                if (cameraFilter === 'online') return c.status === 'online';
                if (cameraFilter === 'alerts') return c.alerts > 0;
                if (cameraFilter === 'ai') return c.aiEnabled;
                return true;
              })
              .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((camera) => (
              <Card 
                key={camera.id} 
                className={`overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                  selectedCamera?.id === camera.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => {
                  setSelectedCamera(camera);
                  setCameraDialogOpen(true);
                }}
              >
                <div className="relative">
                  <img 
                    src={camera.thumbnail} 
                    alt={camera.name}
                    className="w-full h-40 object-cover"
                  />
                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="absolute top-2 left-2 flex items-center gap-2">
                      <Badge 
                        variant={camera.status === 'online' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {camera.status === 'online' ? (
                          <><Wifi className="h-3 w-3 mr-1" /> Live</>
                        ) : (
                          <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
                        )}
                      </Badge>
                      {camera.aiEnabled && (
                        <Badge variant="secondary" className="text-xs bg-purple-500 text-white">
                          <Eye className="h-3 w-3 mr-1" /> AI
                        </Badge>
                      )}
                    </div>
                    {camera.alerts > 0 && (
                      <Badge 
                        className="absolute top-2 right-2 bg-red-500 text-white"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {camera.alerts}
                      </Badge>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <div className="text-white">
                        <p className="font-medium text-sm">{camera.name}</p>
                        <p className="text-xs opacity-80">{camera.location}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCamera(camera);
                            setCameraDialogOpen(true);
                          }}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {/* Recording indicator */}
                  {camera.recording && (
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
                {viewMode === 'list' && (
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {camera.lastActivity}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                          <Download className="h-3 w-3 mr-1" /> Export
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* AI Alerts Tab */}
      {activeTab === 'alerts' && aiDetectionEnabled && (
        <div className="space-y-4">
          {/* Alert Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">All</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              <HardHat className="h-3 w-3 mr-1" /> PPE
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              <Shield className="h-3 w-3 mr-1" /> Security
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              <AlertTriangle className="h-3 w-3 mr-1" /> Safety
            </Badge>
          </div>

          {/* Alerts List */}
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card 
                key={alert.id} 
                className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                onClick={() => {
                  setSelectedAlert(alert);
                  setAlertDialogOpen(true);
                }}
              >
                <div className="flex flex-col md:flex-row">
                  <img 
                    src={alert.image} 
                    alt="Alert snapshot"
                    className="w-full md:w-48 h-32 md:h-auto object-cover"
                  />
                  <CardContent className="p-4 flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getAlertTypeIcon(alert.type)}
                          {alert.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(alert.status)}`} />
                    </div>
                    <h3 className="font-medium mb-1">{alert.description}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Camera className="h-3 w-3" /> {alert.camera}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {alert.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                        View Details
                      </Button>
                      {alert.status === 'active' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAlertStatusChange(alert.id, 'reviewing');
                            }}
                          >
                            Acknowledge
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAlertStatusChange(alert.id, 'resolved');
                            }}
                          >
                            Resolve
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analyticsEnabled && (
        <div className="space-y-6">
          {/* AI Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                AI Performance Metrics
              </CardTitle>
              <CardDescription>Real-time AI processing statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-primary">{(analyticsData.aiProcessedFrames / 1000000).toFixed(1)}M</p>
                  <p className="text-sm text-muted-foreground">Frames Processed</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{analyticsData.ppeCompliance}%</p>
                  <p className="text-sm text-muted-foreground">PPE Compliance</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{analyticsData.avgResponseTime}</p>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">{analyticsData.storageUsed}%</p>
                  <p className="text-sm text-muted-foreground">Storage Used</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detection Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                AI Detection Summary (Today)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2">
                      <HardHat className="h-4 w-4" /> PPE Violations
                    </span>
                    <span className="font-medium">12</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Intrusion Alerts
                    </span>
                    <span className="font-medium">3</span>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Safety Hazards
                    </span>
                    <span className="font-medium">5</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2">
                      <Construction className="h-4 w-4" /> Equipment Issues
                    </span>
                    <span className="font-medium">2</span>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Tracking - Controlled by feature flag */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Construction Progress Tracking
                {progressTrackingUpcoming && (
                  <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                )}
                {!progressTrackingEnabled && !progressTrackingUpcoming && (
                  <Badge variant="outline" className="ml-2">Disabled</Badge>
                )}
              </CardTitle>
              <CardDescription>AI-powered visual progress analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {progressTrackingEnabled ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Progress tracking data will appear here when cameras are connected.</p>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-center">
                  <div>
                    <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg mb-2">
                      {progressTrackingUpcoming ? 'Progress Tracking Coming Soon' : 'Progress Tracking Disabled'}
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      {progressTrackingUpcoming 
                        ? 'AI will automatically capture and compare construction progress over time, generating visual timelines and reports.'
                        : 'This feature has been disabled by an administrator.'}
                    </p>
                    {progressTrackingUpcoming && (
                      <Badge className="mt-4" variant="secondary">Phase 2 Feature</Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Detection Settings</CardTitle>
              <CardDescription>Configure AI behavior and sensitivity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">PPE Detection</p>
                  <p className="text-sm text-muted-foreground">Detect missing helmets, vests, and safety gear</p>
                </div>
                <Switch 
                  checked={ppeDetection} 
                  onCheckedChange={(v) => {
                    setPpeDetection(v);
                    handleSettingSave('PPE Detection');
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Intrusion Detection</p>
                  <p className="text-sm text-muted-foreground">Alert on unauthorized access after hours</p>
                </div>
                <Switch 
                  checked={intrusionDetection}
                  onCheckedChange={(v) => {
                    setIntrusionDetection(v);
                    handleSettingSave('Intrusion Detection');
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Safety Zone Monitoring</p>
                  <p className="text-sm text-muted-foreground">Monitor restricted and hazardous areas</p>
                </div>
                <Switch 
                  checked={safetyZoneMonitoring}
                  onCheckedChange={(v) => {
                    setSafetyZoneMonitoring(v);
                    handleSettingSave('Safety Zone Monitoring');
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Vehicle Tracking</p>
                  <p className="text-sm text-muted-foreground">Track and log vehicle movements</p>
                </div>
                <Switch 
                  checked={vehicleTracking}
                  onCheckedChange={(v) => {
                    setVehicleTracking(v);
                    handleSettingSave('Vehicle Tracking');
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Worker Count</p>
                  <p className="text-sm text-muted-foreground">Real-time headcount tracking</p>
                </div>
                <Switch 
                  checked={workerCount}
                  onCheckedChange={(v) => {
                    setWorkerCount(v);
                    handleSettingSave('Worker Count');
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure alert delivery methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Send critical alerts via email</p>
                </div>
                <Switch 
                  checked={emailNotifications}
                  onCheckedChange={(v) => {
                    setEmailNotifications(v);
                    handleSettingSave('Email Notifications');
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Alerts</p>
                  <p className="text-sm text-muted-foreground">Send urgent alerts via SMS</p>
                </div>
                <Switch 
                  checked={smsAlerts}
                  onCheckedChange={(v) => {
                    setSmsAlerts(v);
                    handleSettingSave('SMS Alerts');
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">In-App Notifications</p>
                  <p className="text-sm text-muted-foreground">Show alerts in CLMP dashboard</p>
                </div>
                <Switch 
                  checked={inAppNotifications}
                  onCheckedChange={(v) => {
                    setInAppNotifications(v);
                    handleSettingSave('In-App Notifications');
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Slack Integration</p>
                  <p className="text-sm text-muted-foreground">Post alerts to Slack channel</p>
                </div>
                <Switch 
                  checked={slackIntegration}
                  onCheckedChange={(v) => {
                    setSlackIntegration(v);
                    handleSettingSave('Slack Integration');
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Storage & Retention</CardTitle>
              <CardDescription>Manage video storage settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span>Storage Used</span>
                  <span className="font-medium">{analyticsData.storageUsed}% of 500GB</span>
                </div>
                <Progress value={analyticsData.storageUsed} className="h-2" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Retention Period</p>
                  <p className="text-sm text-muted-foreground">How long to keep recordings</p>
                </div>
                <Select defaultValue="30">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Tracking Tab */}
      {activeTab === 'progress' && (
        <ProgressTrackingTab 
          isEnabled={progressTrackingEnabled} 
          isUpcoming={progressTrackingUpcoming} 
        />
      )}

      {/* Quality Control Tab */}
      {activeTab === 'quality' && (
        <QualityControlTab 
          isEnabled={qualityControlEnabled} 
          isUpcoming={qualityControlUpcoming} 
        />
      )}

      {/* Risk Detection Tab */}
      {activeTab === 'risk' && (
        <RiskDetectionTab 
          isEnabled={riskDetectionEnabled} 
          isUpcoming={riskDetectionUpcoming} 
        />
      )}
      <CameraDetailDialog 
        camera={selectedCamera}
        open={cameraDialogOpen}
        onOpenChange={setCameraDialogOpen}
      />

      {/* Alert Detail Dialog */}
      <AlertDetailDialog
        alert={selectedAlert}
        open={alertDialogOpen}
        onOpenChange={setAlertDialogOpen}
        onStatusChange={handleAlertStatusChange}
      />
    </MobilePageWrapper>
  );
};

export default CCTVDashboard;
