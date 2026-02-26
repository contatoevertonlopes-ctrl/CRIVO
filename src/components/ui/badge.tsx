import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/88",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/70 ring-1 ring-border/30",
        destructive: "border-transparent bg-destructive/12 text-expense ring-1 ring-destructive/20 hover:bg-destructive/20",
        outline: "border-border text-foreground bg-background/50",
        income: "border-transparent bg-income-muted text-income-muted-foreground ring-1 ring-income/20",
        expense: "border-transparent bg-expense-muted text-expense-muted-foreground ring-1 ring-expense/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
