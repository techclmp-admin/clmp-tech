import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Flame,
  Zap,
  Wind,
  Droplets,
  HardHat,
  Truck,
  Users,
  MapPin,
  Clock,
  Bell,
  Volume2,
  VolumeX,
  RefreshCw,
  Eye,
  Activity,
  Radio,
  CircleAlert,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock real-time risk data
const mockActiveRisks = [
  {
    id: 'risk-001',
    type: 'ppe_violation',
    severity: 'high',
    zone: 'Zone A - Scaffolding',
    camera: 'Scaffolding Zone',
    description: '3 workers without safety helmets detected',
    timestamp: 'Just now',
    aiConfidence: 96,
    status: 'active'
  },
  {
    id: 'risk-002',
    type: 'hazard_zone',
    severity: 'critical',
    zone: 'Zone B - Crane Area',
    camera: 'Crane Area',
    description: 'Unauthorized personnel in crane operating zone',
    timestamp: '30 sec ago',
    aiConfidence: 94,
    status: 'active'
  },
  {
    id: 'risk-003',
    type: 'equipment',
    severity: 'medium',
    zone: 'Zone C - Equipment Yard',
    camera: 'Equipment Yard',
    description: 'Forklift operating near pedestrian area',
    timestamp: '2 min ago',
    aiConfidence: 89,
    status: 'acknowledged'
  },
  {
    id: 'risk-004',
    type: 'environmental',
    severity: 'low',
    zone: 'Zone D - Material Storage',
    camera: 'Material Storage',
    description: 'Water pooling detected near electrical panel',
    timestamp: '5 min ago',
    aiConfidence: 78,
    status: 'monitoring'
  }
];

// Mock zone data for heatmap
const mockZones = [
  { id: 'zone-a', name: 'Scaffolding Area', riskLevel: 'high', workers: 12, incidents: 3 },
  { id: 'zone-b', name: 'Crane Zone', riskLevel: 'critical', workers: 4, incidents: 1 },
  { id: 'zone-c', name: 'Equipment Yard', riskLevel: 'medium', workers: 8, incidents: 0 },
  { id: 'zone-d', name: 'Material Storage', riskLevel: 'low', workers: 6, incidents: 0 },
  { id: 'zone-e', name: 'Main Entrance', riskLevel: 'low', workers: 3, incidents: 0 },
  { id: 'zone-f', name: 'Office Area', riskLevel: 'safe', workers: 15, incidents: 0 }
];

// Risk statistics
const riskStats = {
  activeAlerts: 4,
  resolvedToday: 12,
  avgResponseTime: '1.8 min',
  overallRiskScore: 72,
  workersMonitored: 47,
  zonesActive: 6
};

interface RiskDetectionTabProps {
  isEnabled: boolean;
  isUpcoming: boolean;
}

const RiskDetectionTab = ({ isEnabled, isUpcoming }: RiskDetectionTabProps) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedRisk, setSelectedRisk] = useState<typeof mockActiveRisks[0] | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      case 'safe': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  const getRiskIcon = (type: string) => {
    switch (type) {
      case 'ppe_violation': return <HardHat className="h-4 w-4" />;
      case 'hazard_zone': return <ShieldAlert className="h-4 w-4" />;
      case 'equipment': return <Truck className="h-4 w-4" />;
      case 'environmental': return <Droplets className="h-4 w-4" />;
      case 'fire': return <Flame className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (!isEnabled) {
    return (
      <Card className="p-8 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Risk Detection {isUpcoming ? 'Coming Soon' : 'Disabled'}
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {isUpcoming 
            ? 'Real-time AI-powered danger detection with heatmap visualization and instant alerts.'
            : 'This feature has been disabled by an administrator.'}
        </p>
        {isUpcoming && <Badge className="mt-4" variant="secondary">Coming Soon</Badge>}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Status Bar */}
      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-green-500 animate-pulse" />
                <span className="text-sm font-medium">Live Monitoring</span>
              </div>
              <Badge variant="secondary">
                <RefreshCw className="h-3 w-3 mr-1" />
                Updated {lastUpdate.toLocaleTimeString()}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={soundEnabled} 
                  onCheckedChange={setSoundEnabled}
                  id="sound"
                />
                <label htmlFor="sound" className="text-sm flex items-center gap-1 cursor-pointer">
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  Sound
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={autoRefresh} 
                  onCheckedChange={setAutoRefresh}
                  id="refresh"
                />
                <label htmlFor="refresh" className="text-sm cursor-pointer">Auto-refresh</label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <CircleAlert className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{riskStats.activeAlerts}</p>
            <p className="text-xs text-muted-foreground">Active Alerts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{riskStats.resolvedToday}</p>
            <p className="text-xs text-muted-foreground">Resolved Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{riskStats.avgResponseTime}</p>
            <p className="text-xs text-muted-foreground">Avg Response</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Activity className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{riskStats.overallRiskScore}%</p>
            <p className="text-xs text-muted-foreground">Safety Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Users className="h-8 w-8 mx-auto text-cyan-500 mb-2" />
            <p className="text-2xl font-bold">{riskStats.workersMonitored}</p>
            <p className="text-xs text-muted-foreground">Workers Monitored</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <MapPin className="h-8 w-8 mx-auto text-indigo-500 mb-2" />
            <p className="text-2xl font-bold">{riskStats.zonesActive}</p>
            <p className="text-xs text-muted-foreground">Active Zones</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone Heatmap */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Site Risk Heatmap
            </CardTitle>
            <CardDescription>Real-time danger zones visualization</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Simplified Heatmap Grid */}
            <div className="grid grid-cols-3 gap-3 aspect-video bg-muted/30 p-4 rounded-lg">
              {mockZones.map((zone) => (
                <div 
                  key={zone.id}
                  className={`rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${getRiskColor(zone.riskLevel)} bg-opacity-20 border-2 ${
                    zone.riskLevel === 'critical' ? 'border-red-500 animate-pulse' :
                    zone.riskLevel === 'high' ? 'border-orange-500' :
                    zone.riskLevel === 'medium' ? 'border-yellow-500' :
                    zone.riskLevel === 'low' ? 'border-blue-500' : 'border-green-500'
                  }`}
                >
                  <div className="text-center">
                    <p className="font-medium text-sm mb-1">{zone.name}</p>
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {zone.workers}
                      </span>
                      {zone.incidents > 0 && (
                        <Badge variant="destructive" className="text-[10px] px-1 py-0">
                          {zone.incidents} alerts
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className="text-xs">Critical</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-orange-500" />
                <span className="text-xs">High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500" />
                <span className="text-xs">Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-xs">Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-xs">Safe</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Live Alert Feed
            </CardTitle>
            <CardDescription>Real-time danger notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {mockActiveRisks.map((risk) => (
                  <Card 
                    key={risk.id}
                    className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                      risk.severity === 'critical' ? 'border-red-500 border-l-4' :
                      risk.severity === 'high' ? 'border-orange-500 border-l-4' : ''
                    } ${selectedRisk?.id === risk.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedRisk(risk)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getRiskColor(risk.severity)}`}>
                          {getRiskIcon(risk.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant={risk.status === 'active' ? 'destructive' : 'secondary'}
                              className="text-[10px]"
                            >
                              {risk.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{risk.timestamp}</span>
                          </div>
                          <p className="text-sm font-medium line-clamp-2">{risk.description}</p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {risk.zone}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">
                          View Camera
                        </Button>
                        <Button size="sm" variant="default" className="flex-1 h-7 text-xs">
                          Acknowledge
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* AI Detection Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            AI Detection Rules
          </CardTitle>
          <CardDescription>Configure what AI monitors in real-time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: HardHat, name: 'PPE Violations', description: 'Helmets, vests, gloves', enabled: true },
              { icon: ShieldAlert, name: 'Restricted Zones', description: 'Unauthorized access', enabled: true },
              { icon: Truck, name: 'Vehicle Proximity', description: 'Equipment near workers', enabled: true },
              { icon: Users, name: 'Crowd Detection', description: 'Unsafe gatherings', enabled: false },
              { icon: Flame, name: 'Fire/Smoke', description: 'Heat and smoke detection', enabled: true },
              { icon: Droplets, name: 'Water/Spills', description: 'Liquid hazards', enabled: false }
            ].map((rule, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <rule.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{rule.name}</p>
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                  </div>
                </div>
                <Switch defaultChecked={rule.enabled} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskDetectionTab;