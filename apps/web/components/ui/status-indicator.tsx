import * as React from "react";
import { cn } from "@/lib/utils";
import { UserStatus } from "@/lib/types";
import { cva, type VariantProps } from "class-variance-authority";

const statusVariants = cva(
  "rounded-full border-2 border-background",
  {
    variants: {
      status: {
        online: "bg-green-500",
        idle: "bg-yellow-500",
        dnd: "bg-red-500",
        invisible: "bg-gray-500",
        offline: "bg-gray-500",
      },
      size: {
        xs: "h-2 w-2",
        sm: "h-3 w-3",
        default: "h-4 w-4",
        lg: "h-5 w-5",
      },
    },
    defaultVariants: {
      status: "offline",
      size: "default",
    },
  }
);

interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusVariants> {
  status: UserStatus;
  animated?: boolean;
  showTooltip?: boolean;
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, status, size, animated = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          statusVariants({ status, size }),
          animated && status === UserStatus.ONLINE && "animate-pulse",
          className
        )}
        {...props}
      />
    );
  }
);
StatusIndicator.displayName = "StatusIndicator";

export { StatusIndicator, statusVariants };