import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "glass";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", isLoading, children, disabled, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden active:scale-[0.98]";
    
    const variants = {
      default: "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(26,255,168,0.2)] hover:shadow-[0_0_25px_rgba(26,255,168,0.4)] hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground shadow-lg hover:bg-secondary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_15px_rgba(225,29,72,0.2)]",
      outline: "border-2 border-primary/50 text-primary hover:bg-primary/10 hover:border-primary backdrop-blur-sm",
      ghost: "hover:bg-muted text-foreground",
      glass: "bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white"
    };
    
    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-6 text-base",
      lg: "h-14 px-8 text-lg font-bold",
      icon: "h-11 w-11"
    };

    return (
      <motion.button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        whileHover={{ y: -1 }}
        whileTap={{ y: 0 }}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        <span className={cn("relative z-10 flex items-center justify-center gap-2", isLoading && "opacity-70")}>
          {children}
        </span>
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button };
