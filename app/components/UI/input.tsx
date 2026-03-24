import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border px-3 py-2 text-base ring-offset-picton-blue-50 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-gray-800 dark:bg-picton-blue-950 dark:ring-offset-gray-950 dark:file:text-gray-50 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300 text-picton-blue-500 border-picton-blue-300 bg-picton-blue-50 file:text-picton-blue-600 placeholder:text-picton-blue-400 focus-visible:ring-picton-blue-800 focus-visible:ring-0",
          className
        )}
        ref={ref}
        {...props}
        spellCheck="false"
        // Grammarly disable spell checking
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
