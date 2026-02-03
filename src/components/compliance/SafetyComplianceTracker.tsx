import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  HardHat,
  AlertTriangle,
  CheckCircle,
  FileText,
  Users,
  Calendar,
  ClipboardCheck
} from "lucide-react";
import { useSafetyCompliance, useSafetyIncidents } from "@/hooks/useComplianceData";

interface SafetyComplianceTrackerProps {
  projectId: string;
}

export const SafetyComplianceTracker = ({ projectId }: SafetyComplianceTrackerProps) => {
  const { data: complianceItems = [] } = useSafetyCompliance(projectId);
  const { data: dbIncidents = [] } = useSafetyIncidents(projectId);
  
  const safetyCategories = [
    {
      name: 'OHSA Compliance',
      progress: 92,
      items: [
        { name: 'Working at Heights Training', status: 'current', expiry: '2025-12-15', workers: 15 },
        { name: 'Fall Protection Plan', status: 'current', expiry: '2025-08-30', workers: 'All' },
        { name: 'Confined Space Training', status: 'expiring', expiry: '2025-12-10', workers: 8 },
        { name: 'WHMIS 2015 Certification', status: 'current', expiry: '2026-03-20', workers: 'All' }
      ]
    },
    {
      name: 'Site Safety Requirements',
      progress: 88,
      items: [
        { name: 'Daily Toolbox Talks', status: 'current', frequency: 'Daily' },
        { name: 'Weekly Safety Inspections', status: 'current', frequency: 'Weekly' },
        { name: 'Emergency Response Plan', status: 'current', review: 'Quarterly' },
        { name: 'First Aid Station', status: 'current', inspection: 'Monthly' }
      ]
    },
    {
      name: 'PPE Requirements',
      progress: 95,
      items: [
        { name: 'Hard Hats (CSA Z94.1)', status: 'current', compliance: '100%' },
        { name: 'Safety Boots (CSA Z195)', status: 'current', compliance: '100%' },
        { name: 'High-Vis Vests (CSA Z96)', status: 'current', compliance: '98%' },
        { name: 'Eye Protection', status: 'current', compliance: '100%' }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'bg-green-100 text-green-800';
      case 'expiring': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Safety Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
                <HardHat className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">245</p>
                <p className="text-sm text-muted-foreground">Days Without LTI</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">42</p>
                <p className="text-sm text-muted-foreground">Workers On Site</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Incidents (30 days)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                <ClipboardCheck className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">92%</p>
                <p className="text-sm text-muted-foreground">Safety Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safety Compliance Categories */}
      {safetyCategories.map((category, idx) => (
        <Card key={idx}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Progress value={category.progress} className="w-32 h-2" />
                <span className="text-sm font-semibold">{category.progress}%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {category.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      {item.expiry && <span>Expires: {item.expiry}</span>}
                      {item.workers && <span>Workers: {item.workers}</span>}
                      {item.frequency && <span>Frequency: {item.frequency}</span>}
                      {item.compliance && <span>Compliance: {item.compliance}</span>}
                    </div>
                  </div>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Recent Incidents & Corrective Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dbIncidents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No incidents reported</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dbIncidents.map((incident, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{new Date(incident.incident_date).toLocaleDateString()}</Badge>
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <span className="font-medium">{incident.incident_type}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{incident.description}</p>
                      {incident.corrective_measures && (
                        <p className="text-sm">
                          <span className="font-medium">Action:</span> {incident.corrective_measures}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <FileText className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Training */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Safety Training & Renewals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div>
                <p className="font-medium">Confined Space Training Renewal</p>
                <p className="text-sm text-muted-foreground">Due: December 10, 2025 (8 workers)</p>
              </div>
              <Button size="sm">Schedule</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div>
                <p className="font-medium">Monthly First Aid Station Inspection</p>
                <p className="text-sm text-muted-foreground">Due: December 1, 2025</p>
              </div>
              <Button size="sm">Schedule</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
