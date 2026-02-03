import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Database, Shield, Bell } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const AdminSettings = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { toast } = useToast();

  const handleSaveSettings = () => {
    toast({
      title: 'Settings saved',
      description: 'Application settings have been updated successfully',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Application Settings
          </CardTitle>
          <CardDescription>
            Configure global application settings and features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Maintenance Mode */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="maintenance">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable access to the application
                </p>
              </div>
            </div>
            <Switch
              id="maintenance"
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>

          {/* User Registration */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="registration">User Registration</Label>
                <p className="text-sm text-muted-foreground">
                  Allow new users to register accounts
                </p>
              </div>
            </div>
            <Switch
              id="registration"
              checked={registrationEnabled}
              onCheckedChange={setRegistrationEnabled}
            />
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="notifications">System Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Enable system-wide notifications
                </p>
              </div>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>

          <Button onClick={handleSaveSettings} className="w-full">
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
