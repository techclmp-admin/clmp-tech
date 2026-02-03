import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Loader2 } from "lucide-react";

interface AvatarUploadProps {
  userId: string;
  currentAvatar?: string;
  firstName: string;
  lastName: string;
  onAvatarChange?: (url: string) => void;
}

export const AvatarUpload = ({ userId, currentAvatar, firstName, lastName, onAvatarChange }: AvatarUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatar);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPG, PNG, GIF)",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 1MB)
      if (file.size > 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 1MB",
          variant: "destructive"
        });
        return;
      }

      setUploading(true);

      // Generate unique file name with user ID folder
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      onAvatarChange?.(publicUrl);

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully."
      });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload avatar",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-6">
      <Avatar className="h-24 w-24">
        <AvatarImage src={avatarUrl} />
        <AvatarFallback>
          {firstName?.[0]}{lastName?.[0]}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-2">
        <Button 
          variant="outline" 
          size="sm" 
          disabled={uploading}
          onClick={() => document.getElementById('avatar-upload')?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Camera className="h-4 w-4 mr-2" />
          )}
          Change Avatar
        </Button>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <p className="text-sm text-muted-foreground">
          JPG, GIF or PNG. 1MB max.
        </p>
      </div>
    </div>
  );
};
