import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onMouseDown, ...props }, ref) => {
    const handleMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
      // Prevent dialog from capturing focus
      e.stopPropagation();
      onMouseDown?.(e);
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-base ring-offset-background transition-colors duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary/50 hover:border-border/80 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        onMouseDown={handleMouseDown}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
