import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 dark:border-gray-800 dark:focus:ring-gray-300",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gray-900 text-gray-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/80",
        secondary:
          "border-transparent bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-800/80",
        destructive:
          "border-transparent bg-red-100 text-red-400 dark:bg-red-900 dark:text-red-50 dark:hover:bg-red-900/80",
        success:
          "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-50 dark:hover:bg-green-900/80",
        pending:
          "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-50 dark:hover:bg-yellow-900/80",
        outline: "text-gray-950 dark:text-gray-50",
        picton: "border-transparent bg-picton-blue-100 text-picton-blue-500 dark:bg-picton-blue-900 dark:text-picton-blue-50 dark:hover:bg-picton-blue-900/80 font-normal hover:bg-picton-blue-100/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
