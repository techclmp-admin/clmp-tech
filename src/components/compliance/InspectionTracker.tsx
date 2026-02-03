import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Clock, XCircle, FileText, AlertCircle } from "lucide-react";
import { useInspections } from "@/hooks/useComplianceData";
import { AddInspectionDialog } from "./AddInspectionDialog";
import { PrepareInspectionDialog } from "./PrepareInspectionDialog";

interface InspectionTrackerProps {
  projectId: string;
}

export const InspectionTracker = ({ projectId }: InspectionTrackerProps) => {
  const { data: inspections = [] } = useInspections(projectId);

  // Use real data from database
  const upcomingInspections = inspections.filter(i => i.status === 'scheduled' || i.status === 'pending');
  const passedCount = inspections.filter(i => i.status === 'passed').length;
  const conditionalCount = inspections.filter(i => i.status === 'conditional').length;
  const failedCount = inspections.filter(i => i.status === 'failed').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Passed</Badge>;
      case 'conditional':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Conditional</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800"><Calendar className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{passedCount}</p>
                <p className="text-sm text-muted-foreground">Passed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{conditionalCount}</p>
                <p className="text-sm text-muted-foreground">Conditional</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingInspections.length}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inspections.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {inspections.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Inspections Yet</h3>
            <p className="text-muted-foreground mb-4">
              Schedule your first inspection to start tracking compliance
            </p>
            <AddInspectionDialog projectId={projectId} />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Upcoming Inspections Alert */}
          {upcomingInspections.length > 0 && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Upcoming Inspections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingInspections.map((inspection) => (
                    <div key={inspection.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium">{inspection.inspection_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(inspection.inspection_date).toLocaleDateString()} - {inspection.inspector_name || 'Inspector TBD'}
                        </p>
                        {inspection.notes && (
                          <p className="text-sm text-muted-foreground mt-1">Note: {inspection.notes}</p>
                        )}
                      </div>
                      <PrepareInspectionDialog inspection={inspection} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Inspections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>All Inspections</span>
                <AddInspectionDialog 
                  projectId={projectId}
                  trigger={<Button>Schedule Inspection</Button>}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inspections.map((inspection) => (
                  <div key={inspection.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{inspection.inspection_type}</h4>
                          {getStatusBadge(inspection.status)}
                          <Badge variant="outline">{inspection.phase}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Date:</span> {new Date(inspection.inspection_date).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Inspector:</span> {inspection.inspector_name || 'TBD'}
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-muted-foreground">Result:</span> {inspection.result || 'Pending'}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>

                    {inspection.deficiencies && Array.isArray(inspection.deficiencies) && inspection.deficiencies.length > 0 && (
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200">
                        <p className="font-medium text-sm mb-2">Deficiencies to Address:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {inspection.deficiencies.map((def: any, idx: number) => (
                            <li key={idx}>{typeof def === 'string' ? def : def.description}</li>
                          ))}
                        </ul>
                        {inspection.reinspection_date && (
                          <p className="text-sm mt-2">
                            <span className="font-medium">Re-inspection scheduled:</span> {new Date(inspection.reinspection_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {inspection.next_inspection && (
                      <div className="mt-3 text-sm text-muted-foreground">
                        <span className="font-medium">Next:</span> {inspection.next_inspection}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
