import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/lib/supabase';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  FileImage, 
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'logo' | 'community_photo';
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
  uploadProgress: number;
  url?: string;
  error?: string;
}

interface MediaUploadModalProps {
  open: boolean;
  onClose: () => void;
  onMediaUploaded: (mediaUrls: { logos: string[], communityPhotos: string[] }) => void;
  existingMedia?: {
    logos: string[];
    communityPhotos: string[];
  };
}

export function MediaUploadModal({ 
  open, 
  onClose, 
  onMediaUploaded, 
  existingMedia 
}: MediaUploadModalProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    // Handle file rejections
    fileRejections.forEach((rejection) => {
      toast({
        title: "File rejected",
        description: `${rejection.file.name}: ${rejection.errors[0].message}`,
        variant: "destructive"
      });
    });

    // Process accepted files
    const newFiles: MediaFile[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      type: file.name.toLowerCase().includes('logo') ? 'logo' : 'community_photo',
      uploadStatus: 'pending',
      uploadProgress: 0
    }));

    setMediaFiles(prev => [...prev, ...newFiles]);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeFile = (id: string) => {
    setMediaFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const updateFileType = (id: string, type: 'logo' | 'community_photo') => {
    setMediaFiles(prev => prev.map(file => 
      file.id === id ? { ...file, type } : file
    ));
  };

  const uploadFile = async (mediaFile: MediaFile): Promise<string> => {
    const fileExt = mediaFile.file.name.split('.').pop();
    const fileName = `${mediaFile.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${user?.id}/${mediaFile.type}s/${fileName}`;

    const { data, error } = await supabase.storage
      .from('campaign-media')
      .upload(filePath, mediaFile.file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('campaign-media')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleUploadAll = async () => {
    if (mediaFiles.length === 0) {
      toast({
        title: "No files to upload",
        description: "Please add some files first.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    const uploadPromises = mediaFiles.map(async (mediaFile) => {
      try {
        // Update status to uploading
        setMediaFiles(prev => prev.map(f => 
          f.id === mediaFile.id 
            ? { ...f, uploadStatus: 'uploading', uploadProgress: 0 }
            : f
        ));

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setMediaFiles(prev => prev.map(f => 
            f.id === mediaFile.id && f.uploadProgress < 90
              ? { ...f, uploadProgress: f.uploadProgress + 10 }
              : f
          ));
        }, 200);

        const url = await uploadFile(mediaFile);

        clearInterval(progressInterval);

        // Update to completed
        setMediaFiles(prev => prev.map(f => 
          f.id === mediaFile.id 
            ? { ...f, uploadStatus: 'completed', uploadProgress: 100, url }
            : f
        ));

        return { ...mediaFile, url };
      } catch (error: any) {
        console.error('Upload error:', error);
        setMediaFiles(prev => prev.map(f => 
          f.id === mediaFile.id 
            ? { ...f, uploadStatus: 'error', error: error.message }
            : f
        ));
        throw error;
      }
    });

    try {
      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Organize by type
      const logos = uploadedFiles
        .filter(f => f.type === 'logo' && f.url)
        .map(f => f.url!);
      
      const communityPhotos = uploadedFiles
        .filter(f => f.type === 'community_photo' && f.url)
        .map(f => f.url!);

      // Include existing media
      const allMedia = {
        logos: [...(existingMedia?.logos || []), ...logos],
        communityPhotos: [...(existingMedia?.communityPhotos || []), ...communityPhotos]
      };

      onMediaUploaded(allMedia);
      
      toast({
        title: "Upload successful",
        description: `${uploadedFiles.length} files uploaded successfully.`
      });

      // Clear files after successful upload
      setMediaFiles([]);
      onClose();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Some files failed to upload. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: MediaFile['uploadStatus']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileImage className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Upload Campaign Media
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop files here' : 'Drag & drop images here'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse files
            </p>
            <p className="text-xs text-gray-400">
              Supports: JPEG, PNG, GIF, WebP (max 10MB each)
            </p>
          </div>

          {/* File List */}
          {mediaFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Files to Upload ({mediaFiles.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mediaFiles.map((mediaFile) => (
                  <Card key={mediaFile.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Preview */}
                        <div className="flex-shrink-0">
                          <img
                            src={mediaFile.preview}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded-md"
                          />
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium truncate">
                              {mediaFile.file.name}
                            </p>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(mediaFile.uploadStatus)}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFile(mediaFile.id)}
                                disabled={isUploading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Type Selector */}
                          <div className="flex gap-2 mb-2">
                            <Badge
                              variant={mediaFile.type === 'logo' ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => updateFileType(mediaFile.id, 'logo')}
                            >
                              Logo
                            </Badge>
                            <Badge
                              variant={mediaFile.type === 'community_photo' ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => updateFileType(mediaFile.id, 'community_photo')}
                            >
                              Community Photo
                            </Badge>
                          </div>

                          {/* Progress Bar */}
                          {mediaFile.uploadStatus === 'uploading' && (
                            <Progress value={mediaFile.uploadProgress} className="h-2" />
                          )}

                          {/* Error Message */}
                          {mediaFile.uploadStatus === 'error' && (
                            <p className="text-xs text-red-500 mt-1">{mediaFile.error}</p>
                          )}

                          {/* File Size */}
                          <p className="text-xs text-gray-500 mt-1">
                            {(mediaFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Existing Media */}
          {existingMedia && (existingMedia.logos.length > 0 || existingMedia.communityPhotos.length > 0) && (
            <div className="space-y-4">
              <h3 className="font-medium">Existing Media</h3>
              
              {existingMedia.logos.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Logos ({existingMedia.logos.length})</h4>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {existingMedia.logos.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Logo ${index + 1}`}
                        className="w-full h-16 object-cover rounded-md border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {existingMedia.communityPhotos.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Community Photos ({existingMedia.communityPhotos.length})</h4>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {existingMedia.communityPhotos.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Community photo ${index + 1}`}
                        className="w-full h-16 object-cover rounded-md border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUploadAll} 
            disabled={mediaFiles.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              `Upload ${mediaFiles.length} Files`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
