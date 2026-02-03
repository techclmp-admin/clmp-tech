import { ReactNode } from "react";
import { useBotDetection } from "@/hooks/useBotDetection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

interface BotProtectionProps {
  children: ReactNode;
  enableProtection?: boolean;
}

export const BotProtection = ({ children, enableProtection = true }: BotProtectionProps) => {
  const { isBlocked, blockReason } = useBotDetection(enableProtection);

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-destructive" />
              <CardTitle>Access Denied</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {blockReason || 'Your access has been temporarily restricted due to suspicious activity.'}
            </p>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Possible reasons:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Too many requests in a short time</li>
                <li>Suspicious browser behavior detected</li>
                <li>Automated scraping detected</li>
              </ul>
              <p className="mt-4">
                If you believe this is an error, please contact support or try again later.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
