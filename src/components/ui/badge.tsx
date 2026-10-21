import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] font-medium leading-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/15 text-primary",
        conflict: "border-destructive/40 bg-destructive/10 text-destructive",
        duplicate: "border-warn/40 bg-warn/10 text-warn",
        ok: "border-ok/40 bg-ok/10 text-ok",
        muted: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
