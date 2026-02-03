import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

interface AdminRouteProps {
  children: ReactNode;
  systemAdminOnly?: boolean;
}

export const AdminRoute = ({ children, systemAdminOnly = false }: AdminRouteProps) => {
  const { isAdmin, isSystemAdmin, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check for System Admin only routes
  if (systemAdminOnly && !isSystemAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-destructive" />
              <CardTitle>Access Denied</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This page requires System Admin access.
            </p>
            <p className="text-sm text-muted-foreground">
              If you believe you should have access, please contact your system administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check for any admin access
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-destructive" />
              <CardTitle>Access Denied</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this page. Admin access is required.
            </p>
            <p className="text-sm text-muted-foreground">
              If you believe you should have access, please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
