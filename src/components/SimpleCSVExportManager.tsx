import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Calendar, Users, ShieldCheck, HardHat, ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SimpleCSVExportManager = () => {
  const [selectedDataType, setSelectedDataType] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  
  const exportHistory = [
    {
      id: "1",
      exportType: "Projects",
      recordCount: 25,
      status: "completed",
      createdAt: "2024-01-15 10:30 AM",
      fileUrl: "#"
    },
    {
      id: "2", 
      exportType: "Team Members",
      recordCount: 12,
      status: "completed", 
      createdAt: "2024-01-14 3:45 PM",
      fileUrl: "#"
    },
    {
      id: "3",
      exportType: "Budget Reports",
      recordCount: 8,
      status: "pending",
      createdAt: "2024-01-16 9:15 AM",
      fileUrl: null
    }
  ];

  const dataTypes = [
    { value: "obc_compliance", label: "OBC Compliance Items", icon: ShieldCheck },
    { value: "permits", label: "Permits", icon: FileText },
    { value: "safety_compliance", label: "Safety Compliance", icon: HardHat },
    { value: "inspections", label: "Inspections", icon: ClipboardCheck },
    { value: "projects", label: "Projects", icon: FileText },
    { value: "project_members", label: "Project Members", icon: Users },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle null/undefined
          if (value === null || value === undefined) return '';
          // Handle objects/arrays
          if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';');
          // Escape commas and quotes
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!selectedDataType) return;
    
    setIsExporting(true);
    try {
      let data: any[] = [];
      let tableName = '';
      
      switch (selectedDataType) {
        case 'obc_compliance':
          tableName = 'obc_compliance_items';
          const { data: obcData } = await supabase
            .from('obc_compliance_items')
            .select('*');
          data = obcData || [];
          break;
          
        case 'permits':
          tableName = 'permits';
          const { data: permitData } = await supabase
            .from('permits')
            .select('*');
          data = permitData || [];
          break;
          
        case 'safety_compliance':
          tableName = 'safety_compliance';
          const { data: safetyData } = await supabase
            .from('safety_compliance')
            .select('*');
          data = safetyData || [];
          break;
          
        case 'inspections':
          tableName = 'inspections';
          const { data: inspectionData } = await supabase
            .from('inspections')
            .select('*');
          data = inspectionData || [];
          break;
          
        case 'projects':
          tableName = 'projects';
          const { data: projectData } = await supabase
            .from('projects')
            .select('*');
          data = projectData || [];
          break;
          
        case 'project_members':
          tableName = 'project_members';
          const { data: memberData } = await supabase
            .from('project_members')
            .select('*');
          data = memberData || [];
          break;
      }
      
      if (data.length === 0) {
        toast({
          title: 'No Data',
          description: 'No data available to export',
          variant: 'destructive'
        });
        return;
      }
      
      const csv = convertToCSV(data);
      const filename = `${tableName}_export_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csv, filename);
      
      toast({
        title: 'Export Successful',
        description: `Exported ${data.length} records to ${filename}`
      });
      
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export data',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">CSV Export Manager</h1>
        <p className="text-muted-foreground mt-2">
          Export your data for compliance and reporting purposes
        </p>
      </div>

      {/* Export Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Data Type</label>
            <Select value={selectedDataType} onValueChange={setSelectedDataType}>
              <SelectTrigger>
                <SelectValue placeholder="Choose data to export" />
              </SelectTrigger>
              <SelectContent>
                {dataTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleExport}
            disabled={!selectedDataType || isExporting}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Start Export'}
          </Button>
        </CardContent>
      </Card>

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exportHistory.map((export_item) => (
              <div key={export_item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{export_item.exportType}</h4>
                    <Badge className={getStatusColor(export_item.status)}>
                      {export_item.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {export_item.recordCount} records • {export_item.createdAt}
                  </p>
                </div>
                
                {export_item.status === "completed" && export_item.fileUrl && (
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleCSVExportManager;