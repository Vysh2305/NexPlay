import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "live";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-primary/20 text-primary border border-primary/30",
    secondary: "border-transparent bg-secondary/20 text-secondary border border-secondary/30",
    destructive: "border-transparent bg-destructive/20 text-destructive border border-destructive/30",
    outline: "text-foreground border-white/10",
    live: "border-transparent bg-red-500/20 text-red-500 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse-slow"
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
