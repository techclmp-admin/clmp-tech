import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, Clock, AlertCircle, Calendar } from "lucide-react";

interface Permit {
  id: string;
  permit_type: string;
  permit_number: string;
  application_date: string;
  approval_date?: string | null;
  expiry_date?: string | null;
  status: string;
  issuing_authority: string;
  description?: string | null;
  fee_amount?: number | null;
  payment_status?: string;
  conditions?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}

interface ViewPermitDialogProps {
  permit: Permit;
}

export const ViewPermitDialog = ({ permit }: ViewPermitDialogProps) => {
  const [open, setOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800"><FileText className="w-3 h-3 mr-1" />Submitted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">View</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Permit Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">{permit.permit_type}</h3>
              <p className="text-muted-foreground">#{permit.permit_number}</p>
            </div>
            {getStatusBadge(permit.status)}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Application Date</p>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(permit.application_date).toLocaleDateString()}
              </p>
            </div>
            
            {permit.approval_date && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Approval Date</p>
                <p className="font-medium">{new Date(permit.approval_date).toLocaleDateString()}</p>
              </div>
            )}
            
            {permit.expiry_date && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Expiry Date</p>
                <p className="font-medium">{new Date(permit.expiry_date).toLocaleDateString()}</p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Issuing Authority</p>
              <p className="font-medium">{permit.issuing_authority}</p>
            </div>

            {permit.fee_amount !== null && permit.fee_amount !== undefined && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Fee Amount</p>
                <p className="font-medium">${permit.fee_amount.toLocaleString()}</p>
              </div>
            )}

            {permit.payment_status && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <Badge variant={permit.payment_status === 'paid' ? 'default' : 'secondary'}>
                  {permit.payment_status}
                </Badge>
              </div>
            )}
          </div>

          {permit.description && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-sm">{permit.description}</p>
            </div>
          )}

          {permit.conditions && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Conditions</p>
              <p className="text-sm p-3 bg-muted rounded-lg">{permit.conditions}</p>
            </div>
          )}

          {(permit.contact_person || permit.contact_email || permit.contact_phone) && (
            <div className="space-y-2 p-4 border rounded-lg">
              <p className="font-medium">Contact Information</p>
              {permit.contact_person && <p className="text-sm">{permit.contact_person}</p>}
              {permit.contact_email && <p className="text-sm text-muted-foreground">{permit.contact_email}</p>}
              {permit.contact_phone && <p className="text-sm text-muted-foreground">{permit.contact_phone}</p>}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
