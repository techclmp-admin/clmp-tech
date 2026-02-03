import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Smartphone, Key, AlertTriangle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SimpleMFASettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");

  useEffect(() => {
    loadMFAStatus();
  }, [user?.id]);

  const loadMFAStatus = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_mfa_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setMfaEnabled(data.is_enabled);
        setPhoneNumber(data.phone_number || '');
      }
    } catch (error) {
      console.error('Error loading MFA status:', error);
    }
  };

  const handleEnrollMFA = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);

      toast({
        title: "MFA Setup Started",
        description: "Scan the QR code with your authenticator app."
      });
    } catch (error: any) {
      console.error('MFA enrollment error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start MFA setup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (verificationCode.length !== 6) return;

    setLoading(true);
    try {
      // Verify the code
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];

      if (!totpFactor) throw new Error('No MFA factor found');

      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: totpFactor.id,
        code: verificationCode
      });

      if (verifyError) throw verifyError;

      // Save to our database
      await supabase
        .from('user_mfa_settings')
        .upsert({
          user_id: user?.id,
          is_enabled: true,
          last_used_method: 'totp',
          last_used_at: new Date().toISOString()
        });

      setMfaEnabled(true);
      setVerificationCode('');
      
      toast({
        title: "MFA Enabled",
        description: "Two-factor authentication has been successfully enabled."
      });
    } catch (error: any) {
      console.error('MFA verification error:', error);
      toast({
        title: "Error",
        description: error.message || "Invalid verification code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    setLoading(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      
      for (const factor of factors?.totp || []) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      await supabase
        .from('user_mfa_settings')
        .update({ is_enabled: false })
        .eq('user_id', user?.id);

      setMfaEnabled(false);
      
      toast({
        title: "MFA Disabled",
        description: "Two-factor authentication has been disabled."
      });
    } catch (error: any) {
      console.error('MFA disable error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to disable MFA",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Multi-Factor Authentication</h1>
        <p className="text-muted-foreground mt-2">
          Secure your account with additional authentication methods
        </p>
      </div>

      {mfaEnabled ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Shield className="w-5 h-5" />
              MFA is Enabled
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                Your account is protected with multi-factor authentication. 
                You'll need your authenticator app to sign in.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Button variant="outline">
                <Key className="w-4 h-4 mr-2" />
                View Backup Codes
              </Button>
              
              <Button variant="outline">
                <Smartphone className="w-4 h-4 mr-2" />
                Reconfigure Authenticator
              </Button>

              <Button 
                variant="destructive" 
                onClick={handleDisableMFA}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Disable MFA
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Your account is not protected by multi-factor authentication. 
              Enable MFA to add an extra layer of security.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Enable Authenticator App
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  1. Download an authenticator app like Google Authenticator or Authy
                </p>
                <p className="text-sm text-muted-foreground">
                  2. Scan the QR code or enter the setup key manually
                </p>
                <p className="text-sm text-muted-foreground">
                  3. Enter the verification code from your app
                </p>
              </div>

              {!qrCode ? (
                <div className="flex justify-center">
                  <Button onClick={handleEnrollMFA} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate QR Code
                  </Button>
                </div>
              ) : (
                <div className="flex justify-center p-8 bg-gray-50 rounded-lg">
                  <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
                </div>
              )}

              {secret && (
                <div className="space-y-2">
                  <Label>Manual Entry Key</Label>
                  <Input value={secret} readOnly />
                  <p className="text-xs text-muted-foreground">
                    Use this key if you can't scan the QR code
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="verification">Verification Code</Label>
                <Input
                  id="verification"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
              </div>

              <Button 
                className="w-full"
                onClick={handleVerifyAndEnable}
                disabled={verificationCode.length !== 6 || loading || !qrCode}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enable MFA
              </Button>
            </CardContent>
        </Card>
        </div>
      )}
    </div>
  );
};

export default SimpleMFASettings;