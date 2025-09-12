"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  onResize: (width: number) => void;
  className?: string;
  side?: "left" | "right";
}

export function ResizablePanel({
  children,
  defaultWidth,
  minWidth,
  maxWidth,
  onResize,
  className,
  side = "left",
}: ResizablePanelProps) {
  const [width, setWidth] = React.useState(defaultWidth);
  const [isResizing, setIsResizing] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const startResizing = React.useCallback((mouseDownEvent: React.MouseEvent) => {
    setIsResizing(true);
    
    const startWidth = width;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      const deltaX = mouseMoveEvent.clientX - startX;
      const newWidth = side === "right" 
        ? startWidth - deltaX
        : startWidth + deltaX;
      
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      setWidth(clampedWidth);
      onResize(clampedWidth);
    };

    const stopDrag = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  }, [width, minWidth, maxWidth, onResize, side]);

  return (
    <div
      ref={panelRef}
      className={cn("flex flex-col relative", className)}
      style={{ width: `${width}px` }}
    >
      {children}
      
      {/* Resize handle */}
      <div
        className={cn(
          "absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors group",
          side === "right" ? "left-0" : "right-0",
          isResizing && "bg-blue-500"
        )}
        onMouseDown={startResizing}
      >
        {/* Visual indicator */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-gray-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
            side === "right" ? "-left-0.5" : "-right-0.5",
            isResizing && "opacity-100"
          )}
        />
      </div>
    </div>
  );
}