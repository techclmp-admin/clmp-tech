import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useAppearanceSettings } from '@/hooks/useAppearanceSettings';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { MobilePageWrapper, MobileSegmentedControl } from '@/components/mobile';
import { 
  User,
  Bell,
  Shield,
  Palette,
  Save
} from 'lucide-react';
import SimpleMFASettings from '@/components/SimpleMFASettings';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';
import { ChangeEmailDialog } from '@/components/ChangeEmailDialog';
import { AvatarUpload } from '@/components/AvatarUpload';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';

const SettingsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Use custom hooks
  const { preferences: notifications, updatePreference: updateNotification, loading: notificationsLoading } = useNotificationPreferences();
  const { settings: appearance, updateSettings: updateAppearance, loading: appearanceLoading } = useAppearanceSettings();

  // Profile settings
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    company: '',
    position: '',
    bio: '',
    avatar: ''
  });

  // Load profile data from Supabase
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        setProfileData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          company: data.company || '',
          position: data.role || '',
          bio: data.bio || '',
          avatar: data.avatar_url || ''
        });
      }
    };

    loadProfile();
  }, [user?.id]);


  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phone,
          company: profileData.company,
          role: profileData.position,
          bio: profileData.bio,
          avatar_url: profileData.avatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated."
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };



  const settingsTabs = [
    { value: 'profile', label: 'Profile', icon: User },
    { value: 'notifications', label: 'Notify', icon: Bell },
    { value: 'security', label: 'Security', icon: Shield },
    { value: 'mfa', label: 'MFA', icon: Shield },
    { value: 'appearance', label: 'Theme', icon: Palette },
  ];

  const [activeSettingsTab, setActiveSettingsTab] = useState('profile');

  return (
    <MobilePageWrapper
      title="Settings"
      subtitle="Manage your account settings and preferences"
    >
      {/* Mobile Segmented Control */}
      <div className="md:hidden">
        <MobileSegmentedControl
          options={settingsTabs}
          value={activeSettingsTab}
          onChange={setActiveSettingsTab}
          variant="card"
        />
      </div>

      <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="w-full">
        <TabsList className="hidden md:grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="mfa">MFA</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <AvatarUpload
                userId={user?.id || ''}
                currentAvatar={profileData.avatar}
                firstName={profileData.firstName}
                lastName={profileData.lastName}
                onAvatarChange={(url) => setProfileData({ ...profileData, avatar: url })}
              />

              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="flex-1"
                  />
                  <ChangeEmailDialog />
                </div>
                <p className="text-sm text-muted-foreground">
                  You'll need to verify both your current and new email addresses
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={profileData.position}
                  onChange={(e) => setProfileData({...profileData, position: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {notificationsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => {
                    const notificationInfo = getNotificationInfo(key);
                    return (
                      <div key={key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{notificationInfo.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                                {notificationInfo.label}
                              </Label>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {notificationInfo.description}
                            </p>
                          </div>
                        </div>
                        <Switch
                          id={key}
                          checked={value}
                          onCheckedChange={(checked) => updateNotification(key, checked)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <ChangePasswordDialog />
              </div>

              {/* Delete Account Section */}
              <div className="space-y-4 border-t pt-4">
                <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                  <h4 className="font-medium text-destructive mb-2">Danger Zone</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. All your data will be permanently removed.
                  </p>
                  <DeleteAccountDialog />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MFA Settings */}
        <TabsContent value="mfa" className="space-y-6">
          <SimpleMFASettings />
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {appearanceLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <div className="flex gap-2">
                        {(['light', 'dark', 'system'] as const).map((theme) => (
                          <Button
                            key={theme}
                            variant={appearance.theme === theme ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateAppearance({ theme })}
                            className="capitalize"
                          >
                            {theme}
                          </Button>
                        ))}
                      </div>
                    </div>

                  </div>

                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <div className="flex gap-2">
                      {['CAD', 'USD'].map((currency) => (
                        <Button
                          key={currency}
                          variant={appearance.currency === currency ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateAppearance({ currency })}
                        >
                          {currency}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </MobilePageWrapper>
  );
};

const getNotificationInfo = (key: string): { label: string; description: string; isActive: boolean; icon: string } => {
  const info: Record<string, { label: string; description: string; isActive: boolean; icon: string }> = {
    emailAlerts: {
      label: "Email Alerts",
      description: "Receive important alerts via email for invitations and project updates",
      isActive: true,
      icon: "📧"
    },
    pushNotifications: {
      label: "In-App Notifications",
      description: "Get real-time notifications in the notification bell",
      isActive: true,
      icon: "🔔"
    },
    projectUpdates: {
      label: "Project Updates",
      description: "Notifications when project milestones or status changes",
      isActive: true,
      icon: "📊"
    },
    securityAlerts: {
      label: "Security Alerts",
      description: "Important security notifications and login alerts",
      isActive: true,
      icon: "🔐"
    }
  };
  return info[key] || { label: key, description: "Manage this notification preference", isActive: true, icon: "🔔" };
};

export default SettingsPage;