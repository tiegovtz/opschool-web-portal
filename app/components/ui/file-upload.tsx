"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileImage, FileIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface FileUploadProps {
  value?: string | File | null;
  onChange?: (file: File | null) => void;
  onUploadComplete?: (url: string) => void;
  accept?: string;
  maxSize?: number; // in bytes
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
  children?: React.ReactNode;
}

const FileUpload: React.FC<FileUploadProps> = ({
  value,
  onChange,
  onUploadComplete,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  placeholder = "Drop files here or click to upload",
  className,
  disabled = false,
  multiple = false,
  children,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Validate file size
      if (file.size > maxSize) {
        toast.error(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
        return;
      }

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }

      // Call onChange with the file
      if (onChange) {
        onChange(file);
      }

      // If there's an upload handler, simulate upload (you can replace this with actual upload logic)
      if (onUploadComplete) {
        simulateUpload(file);
      }
    },
    [maxSize, onChange, onUploadComplete]
  );

  // Simulate file upload (replace with actual upload logic)
  const simulateUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real implementation, you would upload to your server/cloud storage
      // const uploadedUrl = await uploadToServer(file);
      const mockUrl = URL.createObjectURL(file);

      setUploadProgress(100);

      if (onUploadComplete) {
        onUploadComplete(mockUrl);
      }

      toast.success("File uploaded successfully!");
    } catch (error) {
      toast.error("Upload failed. Please try again.");
    } finally {
      clearInterval(interval);
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    multiple,
    disabled: disabled || uploading,
    maxSize,
  });

  // Handle file removal
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    if (onChange) {
      onChange(null);
    }
  };

  // Get current file info
  const getCurrentFile = () => {
    if (value instanceof File) return value;
    return null;
  };

  const currentFile = getCurrentFile();
  const hasFile =
    currentFile || previewUrl || (typeof value === "string" && value);

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          "hover:border-primary/50 hover:bg-muted/25",
          isDragActive && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-50",
          hasFile && "border-solid border-border"
        )}
      >
        <input {...getInputProps()} />

        {/* Upload Progress */}
        {uploading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
            <div className="text-center space-y-2 w-full max-w-xs">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm font-medium">Uploading...</p>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
            </div>
          </div>
        )}

        {/* File Preview/Content */}
        {hasFile ? (
          <div className="space-y-4">
            {/* Image Preview */}
            {(previewUrl || (typeof value === "string" && value)) && (
              <div className="relative">
                <img
                  src={previewUrl || (typeof value === "string" ? value : "")}
                  alt="Preview"
                  className="max-w-full max-h-48 mx-auto rounded-md object-contain"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={handleRemove}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* File Info */}
            {currentFile && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center space-x-3">
                  {currentFile.type.startsWith("image/") ? (
                    <FileImage className="h-8 w-8 text-primary" />
                  ) : (
                    <FileIcon className="h-8 w-8 text-primary" />
                  )}
                  <div>
                    <p className="text-sm font-medium truncate max-w-48">
                      {currentFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(currentFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Upload Prompt */
          <div className="text-center py-8">
            {children || (
              <>
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {isDragActive ? "Drop files here" : placeholder}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {accept === "image/*" && "PNG, JPG, GIF up to "}
                    {maxSize / (1024 * 1024)}MB
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Additional Info */}
      <div className="mt-2 text-xs text-muted-foreground">
        <p>
          Supports: {accept === "image/*" ? "Images" : accept || "All files"} •
          Max size: {(maxSize / (1024 * 1024)).toFixed(0)}MB
          {multiple && " • Multiple files allowed"}
        </p>
      </div>
    </div>
  );
};

export default FileUpload;
