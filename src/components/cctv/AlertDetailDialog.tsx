import { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Camera,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  Play,
  Download,
  Share2,
  MessageSquare,
  HardHat,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface AlertData {
  id: string;
  type: string;
  severity: string;
  camera: string;
  description: string;
  timestamp: string;
  status: string;
  image: string;
}

interface AlertDetailDialogProps {
  alert: AlertData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (alertId: string, newStatus: string) => void;
}

const AlertDetailDialog = ({ alert, open, onOpenChange, onStatusChange }: AlertDetailDialogProps) => {
  const [notes, setNotes] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!alert) return null;

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
      case 'ppe_violation': return <HardHat className="h-5 w-5" />;
      case 'intrusion': return <Shield className="h-5 w-5" />;
      case 'safety_hazard': return <AlertTriangle className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active': return { color: 'bg-red-500', label: 'Active', icon: <AlertTriangle className="h-3 w-3" /> };
      case 'reviewing': return { color: 'bg-yellow-500', label: 'Under Review', icon: <Clock className="h-3 w-3" /> };
      case 'resolved': return { color: 'bg-green-500', label: 'Resolved', icon: <CheckCircle className="h-3 w-3" /> };
      default: return { color: 'bg-muted', label: status, icon: null };
    }
  };

  // Mock multiple snapshots
  const mockSnapshots = [
    alert.image,
    alert.image.replace('w=200', 'w=201'), // Slightly different to simulate different frames
    alert.image.replace('w=200', 'w=202'),
  ];

  const handleAcknowledge = () => {
    onStatusChange?.(alert.id, 'reviewing');
    toast.success('Alert acknowledged and under review');
  };

  const handleResolve = () => {
    onStatusChange?.(alert.id, 'resolved');
    toast.success('Alert marked as resolved');
    onOpenChange(false);
  };

  const handleDismiss = () => {
    toast.info('Alert dismissed');
    onOpenChange(false);
  };

  const handleAddNote = () => {
    if (notes.trim()) {
      toast.success('Note added to alert');
      setNotes('');
    }
  };

  const statusInfo = getStatusInfo(alert.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                {getAlertTypeIcon(alert.type)}
              </div>
              <div>
                <DialogTitle className="text-lg">{alert.description}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Alert ID: {alert.id}
                </p>
              </div>
            </div>
            <Badge className={`${statusInfo.color} text-white`}>
              {statusInfo.icon}
              <span className="ml-1">{statusInfo.label}</span>
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Image Viewer */}
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden bg-muted">
              <img 
                src={mockSnapshots[currentImageIndex]} 
                alt="Alert snapshot"
                className="w-full aspect-video object-cover"
              />
              {/* Navigation arrows */}
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                disabled={currentImageIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setCurrentImageIndex(Math.min(mockSnapshots.length - 1, currentImageIndex + 1))}
                disabled={currentImageIndex === mockSnapshots.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {/* Image counter */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {currentImageIndex + 1} / {mockSnapshots.length}
              </div>
              {/* Timestamp */}
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-mono">
                {alert.timestamp}
              </div>
            </div>
            
            {/* Thumbnail strip */}
            <div className="flex gap-2">
              {mockSnapshots.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-16 h-12 rounded overflow-hidden border-2 transition-all ${
                    idx === currentImageIndex ? 'border-primary' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={src} alt={`Frame ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Quick actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Play className="h-4 w-4 mr-1" /> Play Clip
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Alert Info */}
            <div className="space-y-3">
              <h4 className="font-medium">Alert Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Type</span>
                </div>
                <span className="font-medium capitalize">{alert.type.replace('_', ' ')}</span>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Detected</span>
                </div>
                <span className="font-medium">{alert.timestamp}</span>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Camera className="h-4 w-4" />
                  <span>Camera</span>
                </div>
                <span className="font-medium">{alert.camera}</span>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Location</span>
                </div>
                <span className="font-medium">Building A - Zone 2</span>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>AI Confidence</span>
                </div>
                <span className="font-medium">87%</span>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">AI Analysis</h4>
              <p className="text-sm text-muted-foreground">
                {alert.type === 'ppe_violation' && 
                  'AI detected a worker without proper safety helmet in the designated construction zone. The worker was observed for approximately 3 minutes before this alert was triggered.'}
                {alert.type === 'intrusion' && 
                  'Motion detected in a restricted area after working hours. No authorized personnel scheduled for this location at this time.'}
                {alert.type === 'safety_hazard' && 
                  'Potential safety violation detected. The emergency exit route appears to be partially blocked by construction materials.'}
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Add Note
              </h4>
              <Textarea 
                placeholder="Add investigation notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
              <Button size="sm" onClick={handleAddNote} disabled={!notes.trim()}>
                Save Note
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2">
          {alert.status === 'active' && (
            <>
              <Button variant="outline" onClick={handleDismiss}>
                <XCircle className="h-4 w-4 mr-2" />
                Dismiss
              </Button>
              <Button variant="secondary" onClick={handleAcknowledge}>
                <Clock className="h-4 w-4 mr-2" />
                Acknowledge
              </Button>
              <Button onClick={handleResolve}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve
              </Button>
            </>
          )}
          {alert.status === 'reviewing' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={handleResolve}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Resolved
              </Button>
            </>
          )}
          {alert.status === 'resolved' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AlertDetailDialog;
