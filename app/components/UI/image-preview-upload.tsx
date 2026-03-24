"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileImage, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface ImagePreviewUploadProps {
  /** Current file or URL string */
  value?: File | string | null;
  /** Called when file changes (File object or null when removed) */
  onChange?: (file: File | null) => void;
  /** Accept filter for file input */
  accept?: string;
  /** Maximum file size in bytes (default 5MB) */
  maxSize?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether upload is in progress (for showing loading state) */
  isUploading?: boolean;
}

/**
 * ImagePreviewUpload Component
 *
 * A file upload component that shows a local preview of selected images
 * WITHOUT uploading them immediately. The parent component is responsible
 * for handling the actual upload when needed (e.g., on form submit).
 *
 * Features:
 * - Drag and drop support
 * - Click to select file
 * - Local preview using FileReader
 * - File size validation
 * - File type validation
 * - Remove functionality
 */
const ImagePreviewUpload: React.FC<ImagePreviewUploadProps> = ({
  value,
  onChange,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  placeholder = "Drop image here or click to upload",
  className,
  disabled = false,
  isUploading = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generate preview URL when value changes
  useEffect(() => {
    if (value instanceof File) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(value);
    } else if (typeof value === "string" && value) {
      setPreviewUrl(value);
    } else {
      setPreviewUrl(null);
    }

    // Cleanup object URLs
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [value]);

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

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Call onChange with the file
      if (onChange) {
        onChange(file);
      }
    },
    [maxSize, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"] },
    multiple: false,
    disabled: disabled || isUploading,
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

  const hasPreview = previewUrl || (typeof value === "string" && value);

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer",
          "hover:border-primary/50 hover:bg-muted/25",
          isDragActive && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-50",
          hasPreview && "border-solid border-border"
        )}
      >
        <input {...getInputProps()} />

        {/* Upload Progress Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
            <div className="text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p className="text-sm font-medium">Uploading...</p>
            </div>
          </div>
        )}

        {/* Preview or Upload Prompt */}
        {hasPreview ? (
          <div className="relative">
            <img
              src={previewUrl || (typeof value === "string" ? value : "")}
              alt="Preview"
              className="max-w-full max-h-32 mx-auto rounded-md object-contain"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-3 w-3" />
            </Button>
            {value instanceof File && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                {value.name} ({(value.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <FileImage className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {isDragActive ? "Drop image here" : placeholder}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max {(maxSize / (1024 * 1024)).toFixed(0)}MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagePreviewUpload;
