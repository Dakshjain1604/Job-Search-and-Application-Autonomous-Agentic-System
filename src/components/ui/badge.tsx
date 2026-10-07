import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive/15 text-destructive border-destructive/20",
        outline: "text-foreground border-border",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-400",
        info:
          "border-sky-500/20 bg-sky-500/10 text-sky-400",
        mono:
          "border-border bg-muted/60 text-muted-foreground font-mono text-[10px]",
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
