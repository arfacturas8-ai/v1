"use client";

import * as React from "react";
import { Separator } from "@/components/ui/separator";

interface MessageDividerProps {
  date: Date;
}

export function MessageDivider({ date }: MessageDividerProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    
    // Check if it's today
    if (messageDate.toDateString() === now.toDateString()) {
      return "Today";
    }
    
    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    // Check if it's within the last week
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (messageDate > weekAgo) {
      return messageDate.toLocaleDateString(undefined, { 
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // For older dates
    return messageDate.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex items-center my-6">
      <Separator className="flex-1" />
      <div className="px-4 py-1 bg-gray-800 rounded-full">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {formatDate(date)}
        </span>
      </div>
      <Separator className="flex-1" />
    </div>
  );
}