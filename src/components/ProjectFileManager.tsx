import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Upload, File, Download, Trash2, Eye, FileText, Image, Video, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProjectFeatures } from "@/hooks/useProjectFeatures";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ProjectFileManagerProps {
  projectId: string;
  projectName: string;
}

interface ProjectFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  description: string | null;
  category: string;
  is_public: boolean;
  created_at: string;
  uploaded_by: string;
  uploader_profile?: {
    first_name: string | null;
    last_name: string | null;
  };
}

const ProjectFileManager: React.FC<ProjectFileManagerProps> = ({ projectId, projectName }) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [isPublic, setIsPublic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isFeatureEnabled, isFeatureUpcoming } = useProjectFeatures();
  
  const featureEnabled = isFeatureEnabled('file_manager');
  const featureUpcoming = isFeatureUpcoming('file_manager');

  // Fetch project files
  const { data: files, isLoading: filesLoading } = useQuery({
    queryKey: ['project-files', projectId],
    queryFn: async () => {
      const { data: filesData, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get uploader profiles
      if (filesData && filesData.length > 0) {
        const uploaderIds = [...new Set(filesData.map(file => file.uploaded_by))];
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', uploaderIds);

        if (profilesError) {
          console.error('Error fetching uploader profiles:', profilesError);
          return filesData;
        }

        // Combine data
        return filesData.map(file => ({
          ...file,
          uploader_profile: profiles?.find(p => p.id === file.uploaded_by) || null
        })) as ProjectFile[];
      }

      return filesData || [];
    },
  });

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return File;
    
    if (fileType.startsWith('image/')) return Image;
    if (fileType.startsWith('video/')) return Video;
    if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
    if (fileType.includes('zip') || fileType.includes('rar')) return Archive;
    
    return File;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "File size must be less than 50MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create file path: user_id/project_id/filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${projectId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Save file metadata to database
      const { error: dbError } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          name: file.name,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: file.type,
          description: description.trim() || null,
          category,
          is_public: isPublic,
          uploaded_by: user.id
        });

      if (dbError) throw dbError;

      setUploadProgress(100);

      toast({
        title: "Upload successful!",
        description: `${file.name} has been uploaded`
      });

      // Reset form
      setDescription('');
      setCategory('general');
      setIsPublic(false);
      setIsUploadOpen(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh files list
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (file: ProjectFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(file.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (file: ProjectFile) => {
    if (!confirm(`Are you sure you want to delete ${file.file_name}?`)) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      toast({
        title: "File deleted",
        description: `${file.file_name} has been deleted`
      });

      // Refresh files list
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });

    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'documents': return 'bg-blue-100 text-blue-800';
      case 'images': return 'bg-green-100 text-green-800';
      case 'plans': return 'bg-purple-100 text-purple-800';
      case 'reports': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // If feature is disabled and not marked as upcoming, don't render
  if (!featureEnabled && !featureUpcoming) {
    return null;
  }

  // If feature is upcoming (disabled but marked to show), show upcoming message
  if (!featureEnabled && featureUpcoming) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Project Files
            <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
          </CardTitle>
          <CardDescription>
            Upload and manage project files and documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
            <p className="text-muted-foreground">
              This feature is currently under development and will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5" />
                Project Files
              </CardTitle>
              <CardDescription>
                Manage documents, images, and other files for {projectName}
              </CardDescription>
            </div>
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload New File</DialogTitle>
                  <DialogDescription>
                    Add a file to this project
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>File</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="*"
                    />
                    <Button
                      variant="outline"
                      onClick={handleFileSelect}
                      className="w-full"
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Choose File"}
                    </Button>
                    {uploading && (
                      <div className="mt-2">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-sm text-muted-foreground mt-1">
                          {uploadProgress}% uploaded
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe this file..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="documents">Documents</SelectItem>
                        <SelectItem value="images">Images</SelectItem>
                        <SelectItem value="plans">Plans & Drawings</SelectItem>
                        <SelectItem value="reports">Reports</SelectItem>
                        <SelectItem value="contracts">Contracts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="isPublic">Make this file public to all project members</Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsUploadOpen(false)}
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {filesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading files...</p>
            </div>
          ) : files && files.length > 0 ? (
            <div className="space-y-3">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.file_type);
                return (
                  <div key={file.id} className="p-3 md:p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    {/* Mobile Layout */}
                    <div className="md:hidden">
                      <div className="flex items-start gap-3">
                        <FileIcon className="h-10 w-10 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate pr-2">{file.file_name}</h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(file.category)}`}>
                              {file.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(file.file_size)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="truncate">
                              by {file.uploader_profile?.first_name} {file.uploader_profile?.last_name}
                            </span>
                            <span className="flex-shrink-0">{new Date(file.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(file)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(file)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {file.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 pl-13">
                          {file.description}
                        </p>
                      )}
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <FileIcon className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{file.file_name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(file.category)}`}>
                              {file.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(file.file_size)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              by {file.uploader_profile?.first_name} {file.uploader_profile?.last_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(file.created_at).toLocaleDateString()}
                            </span>
                            {file.is_public && (
                              <Badge variant="outline" className="text-xs">Public</Badge>
                            )}
                          </div>
                          {file.description && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {file.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(file)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No files uploaded</h3>
              <p className="text-muted-foreground mb-4">
                Get started by uploading your first project file
              </p>
              <Button onClick={() => setIsUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectFileManager;