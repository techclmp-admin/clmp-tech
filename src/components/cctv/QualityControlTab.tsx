import { useState } from 'react';
import { 
  ClipboardCheck, 
  Camera, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Eye,
  ZoomIn,
  Download,
  Plus,
  Filter,
  Search,
  MessageSquare,
  Calendar,
  User,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock quality inspection data with appropriate images
const mockInspections = [
  {
    id: 'qc-001',
    title: 'Concrete Pour - Section B Foundation',
    date: '2026-01-21',
    inspector: 'AI System + John Smith',
    status: 'passed',
    score: 95,
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop', // Concrete foundation work
    findings: [
      { item: 'Surface finish', status: 'passed', note: 'Smooth, no visible defects' },
      { item: 'Alignment', status: 'passed', note: 'Within tolerance ±2mm' },
      { item: 'Reinforcement coverage', status: 'passed', note: 'Adequate concrete cover' },
      { item: 'Curing conditions', status: 'warning', note: 'Monitor moisture levels' }
    ]
  },
  {
    id: 'qc-002',
    title: 'Steel Framework - Floor 3',
    date: '2026-01-20',
    inspector: 'AI System',
    status: 'warning',
    score: 78,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop', // Steel frame construction
    findings: [
      { item: 'Weld quality', status: 'passed', note: 'All welds meet specification' },
      { item: 'Bolt torque', status: 'warning', note: '3 bolts require re-torque' },
      { item: 'Alignment', status: 'passed', note: 'Column plumb within spec' },
      { item: 'Connection plates', status: 'failed', note: 'Missing gusset plate at Grid C-4' }
    ]
  },
  {
    id: 'qc-003',
    title: 'Scaffolding Safety Check',
    date: '2026-01-19',
    inspector: 'AI System + Safety Team',
    status: 'passed',
    score: 100,
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop', // Scaffolding with workers
    findings: [
      { item: 'Base plates', status: 'passed', note: 'Properly installed on solid ground' },
      { item: 'Bracing', status: 'passed', note: 'All diagonal braces in place' },
      { item: 'Guardrails', status: 'passed', note: 'Top rails and mid rails secure' },
      { item: 'Access ladder', status: 'passed', note: 'Properly secured and accessible' }
    ]
  }
];

// Mock defects detected by AI with construction defect images
const mockDefects = [
  {
    id: 'def-001',
    type: 'crack',
    severity: 'medium',
    location: 'Column A-3, Floor 2',
    camera: 'Building A - Zone 2',
    detectedAt: '2 hours ago',
    status: 'open',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop', // Concrete surface (simulating crack detection area)
    aiConfidence: 94
  },
  {
    id: 'def-002',
    type: 'misalignment',
    severity: 'low',
    location: 'Window Frame, Unit 201',
    camera: 'Scaffolding Zone',
    detectedAt: '5 hours ago',
    status: 'reviewing',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop', // Building exterior with windows
    aiConfidence: 87
  },
  {
    id: 'def-003',
    type: 'surface_defect',
    severity: 'high',
    location: 'Exterior Wall, Section C',
    camera: 'Main Entrance',
    detectedAt: '1 day ago',
    status: 'resolved',
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop', // Building wall section
    aiConfidence: 91
  }
];

// Quality checklist template
const qualityChecklist = [
  { category: 'Structural', items: ['Foundation integrity', 'Column alignment', 'Beam connections', 'Slab thickness'] },
  { category: 'Finishing', items: ['Surface smoothness', 'Paint quality', 'Joint sealing', 'Edge treatment'] },
  { category: 'MEP', items: ['Pipe routing', 'Electrical conduits', 'HVAC ducts', 'Fire protection'] },
  { category: 'Safety', items: ['Guardrails', 'Fire exits', 'Emergency signage', 'Accessibility'] }
];

interface QualityControlTabProps {
  isEnabled: boolean;
  isUpcoming: boolean;
}

const QualityControlTab = ({ isEnabled, isUpcoming }: QualityControlTabProps) => {
  const [activeSubTab, setActiveSubTab] = useState('inspections');
  const [selectedInspection, setSelectedInspection] = useState(mockInspections[0]);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  if (!isEnabled) {
    return (
      <Card className="p-8 text-center">
        <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Quality Control {isUpcoming ? 'Coming Soon' : 'Disabled'}
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {isUpcoming 
            ? 'AI-assisted quality inspection with defect detection and automated reporting.'
            : 'This feature has been disabled by an administrator.'}
        </p>
        {isUpcoming && <Badge className="mt-4" variant="secondary">Coming Soon</Badge>}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quality Score Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">92%</p>
              <p className="text-sm text-muted-foreground mt-1">Overall Quality Score</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold">47</p>
              <p className="text-sm text-muted-foreground mt-1">Inspections Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-yellow-600">5</p>
              <p className="text-sm text-muted-foreground mt-1">Open Defects</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">12</p>
              <p className="text-sm text-muted-foreground mt-1">AI Detections Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="defects">AI Defects</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
        </TabsList>

        {/* Inspections Tab */}
        <TabsContent value="inspections" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Input placeholder="Search inspections..." className="w-64" />
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              New Inspection
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Inspection List */}
            <div className="lg:col-span-1 space-y-3">
              {mockInspections.map((inspection) => (
                <Card 
                  key={inspection.id}
                  className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                    selectedInspection.id === inspection.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedInspection(inspection)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <img 
                        src={inspection.image} 
                        alt={inspection.title}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={
                              inspection.status === 'passed' ? 'default' :
                              inspection.status === 'warning' ? 'secondary' : 'destructive'
                            }
                          >
                            {inspection.score}%
                          </Badge>
                          {getStatusIcon(inspection.status)}
                        </div>
                        <p className="font-medium text-sm line-clamp-2">{inspection.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{inspection.date}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Inspection Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedInspection.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {selectedInspection.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {selectedInspection.inspector}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Report
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image with annotations */}
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={selectedInspection.image}
                    alt={selectedInspection.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Mock annotation markers */}
                  <div className="absolute top-1/4 left-1/3 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">1</div>
                  <div className="absolute top-1/2 right-1/4 w-6 h-6 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">2</div>
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="absolute top-2 right-2"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>

                {/* Findings */}
                <div className="space-y-3">
                  <h4 className="font-medium">Inspection Findings</h4>
                  {selectedInspection.findings.map((finding, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(finding.status)}
                        <span className="font-medium">{finding.item}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{finding.note}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Defects Tab */}
        <TabsContent value="defects" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">All</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">Open</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">Reviewing</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">Resolved</Badge>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-1" />
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockDefects.map((defect) => (
              <Card key={defect.id} className="overflow-hidden">
                <div className="relative">
                  <img 
                    src={defect.image}
                    alt={defect.type}
                    className="w-full h-40 object-cover"
                  />
                  {/* AI confidence badge */}
                  <Badge className="absolute top-2 left-2 bg-primary">
                    <Eye className="h-3 w-3 mr-1" />
                    AI {defect.aiConfidence}%
                  </Badge>
                  <Badge className={`absolute top-2 right-2 ${getSeverityColor(defect.severity)}`}>
                    {defect.severity.toUpperCase()}
                  </Badge>
                  {/* Defect marker overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-red-500 rounded-full animate-pulse opacity-50" />
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="capitalize">{defect.type.replace('_', ' ')}</Badge>
                    <Badge 
                      variant={
                        defect.status === 'open' ? 'destructive' :
                        defect.status === 'reviewing' ? 'secondary' : 'default'
                      }
                    >
                      {defect.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium flex items-center gap-1 mb-1">
                    <MapPin className="h-3 w-3" />
                    {defect.location}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Camera className="h-3 w-3" />
                    {defect.camera} • {defect.detectedAt}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Note
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Inspection Checklist</CardTitle>
              <CardDescription>
                AI-assisted checklist with auto-detection of items when possible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {qualityChecklist.map((category) => (
                  <div key={category.category} className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      {category.category}
                      <Badge variant="outline" className="text-xs">
                        {category.items.filter(item => checklistState[`${category.category}-${item}`]).length}/{category.items.length}
                      </Badge>
                    </h4>
                    <div className="space-y-2">
                      {category.items.map((item) => {
                        const key = `${category.category}-${item}`;
                        return (
                          <div 
                            key={key}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                          >
                            <Checkbox 
                              checked={checklistState[key] || false}
                              onCheckedChange={(checked) => 
                                setChecklistState(prev => ({ ...prev, [key]: !!checked }))
                              }
                            />
                            <span className="text-sm">{item}</span>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              AI Ready
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button variant="outline">Save Draft</Button>
                <Button>
                  Complete Inspection
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QualityControlTab;