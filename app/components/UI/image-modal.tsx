"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

/**
 * Props for the ImageModal component
 */
interface ImageModalProps {
  /** The source URL of the image */
  src: string;
  /** Alternative text for the image */
  alt: string;
  /** Additional CSS classes for the trigger image */
  className?: string;
  /** Custom trigger element. If not provided, uses the image itself as trigger */
  children?: React.ReactNode;
}

/**
 * ImageModal component that displays an image in an enlargeable overlay
 *
 * Features:
 * - Click image to open in full-screen overlay
 * - Dark backdrop with centered image
 * - Responsive design (95% viewport on mobile/desktop)
 * - Click outside or press ESC to close
 * - Hover effects on trigger image
 *
 * @param props - The ImageModal props
 * @returns JSX element containing the image modal
 */
export function ImageModal({ src, alt, className, children }: ImageModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <button className="cursor-pointer hover:opacity-80 transition-opacity">
            <img
              src={src}
              alt={alt}
              className={cn(
                "max-w-md w-full h-auto rounded-lg border border-gray-200 shadow-sm",
                className,
              )}
            />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto p-0 border-0 bg-transparent shadow-none overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Image</DialogTitle>
        </VisuallyHidden>
        <div className="relative flex items-center justify-center">
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
