import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddPermitDialog } from "./AddPermitDialog";
import { ViewPermitDialog } from "./ViewPermitDialog";

interface PermitTrackerProps {
  projectId: string;
}

export const PermitTracker = ({ projectId }: PermitTrackerProps) => {
  const { data: permits = [] } = useQuery({
    queryKey: ['permits', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permits')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400"><FileText className="w-3 h-3 mr-1" />Submitted</Badge>;
      case 'rejected':
      case 'expired':
        return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400"><AlertCircle className="w-3 h-3 mr-1" />{status === 'expired' ? 'Expired' : 'Rejected'}</Badge>;
      default:
        return <Badge variant="outline">{status || 'Draft'}</Badge>;
    }
  };

  const activePermits = permits.filter(p => p.status === 'approved' || p.status === 'submitted');
  const pendingPermits = permits.filter(p => p.status === 'pending');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Permit Tracker</CardTitle>
            <AddPermitDialog projectId={projectId} />
          </div>
          <p className="text-sm text-muted-foreground">
            Track construction permits and regulatory compliance
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Permits</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {permits.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Permits Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking permits for this project
                </p>
                <AddPermitDialog projectId={projectId} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {permits.map((permit: any) => (
                    <div key={permit.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <div>
                            <h4 className="font-semibold">{permit.permit_type}</h4>
                            <p className="text-sm text-muted-foreground">
                              #{permit.permit_number} • Applied: {new Date(permit.application_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(permit.status)}
                        <ViewPermitDialog permit={permit} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {pendingPermits.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-semibold mb-2">All Good!</h3>
                <p className="text-muted-foreground">
                  No permit alerts at this time
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {pendingPermits.map((permit: any) => (
                    <div key={permit.id} className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        <div>
                          <p className="font-medium">{permit.permit_type}</p>
                          <p className="text-sm text-muted-foreground">
                            Pending approval • {permit.permit_number || 'No number assigned'}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Follow Up</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
