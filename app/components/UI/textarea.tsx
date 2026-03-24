import * as React from "react";

import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300",
  {
    variants: {
      variant: {
        default: "border-neutral-200 bg-white placeholder:text-neutral-500",
        brand:
          "border-lemon-300 bg-lemon-50 placeholder:text-lemon-600 focus-visible:ring-lemon-600",
        picton:
          "border-picton-blue-300 bg-picton-blue-50 placeholder:text-picton-blue-500 focus-visible:ring-picton-blue-800 text-picton-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ variant, className }))}
        ref={ref}
        {...props}
        spellCheck="false"
        // Grammarly disable spell checking
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
