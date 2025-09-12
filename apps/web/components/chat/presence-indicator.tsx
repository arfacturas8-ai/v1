"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { User, UserStatus } from "@/lib/types";

interface PresenceIndicatorProps {
  user: User;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
  isTyping?: boolean;
}

const statusColors = {
  [UserStatus.ONLINE]: "bg-green-500",
  [UserStatus.IDLE]: "bg-yellow-500",
  [UserStatus.DND]: "bg-red-500",
  [UserStatus.INVISIBLE]: "bg-gray-500",
  [UserStatus.OFFLINE]: "bg-gray-500",
};

const statusLabels = {
  [UserStatus.ONLINE]: "Online",
  [UserStatus.IDLE]: "Away",
  [UserStatus.DND]: "Do Not Disturb",
  [UserStatus.INVISIBLE]: "Invisible",
  [UserStatus.OFFLINE]: "Offline",
};

const sizeClasses = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4",
};

const ringClasses = {
  sm: "ring-1",
  md: "ring-2",
  lg: "ring-2",
};

export function PresenceIndicator({ 
  user, 
  size = "md", 
  showTooltip = false, 
  className,
  isTyping = false
}: PresenceIndicatorProps) {
  const statusColor = statusColors[user.status] || statusColors[UserStatus.OFFLINE];
  const statusLabel = statusLabels[user.status] || statusLabels[UserStatus.OFFLINE];
  
  const getDisplayLabel = () => {
    if (isTyping && user.status === UserStatus.ONLINE) {
      return "Typing...";
    }
    return statusLabel;
  };
  
  const indicator = (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "rounded-full ring-gray-800 relative",
        isTyping ? "bg-blue-500" : statusColor,
        sizeClasses[size],
        ringClasses[size],
        className
      )}
      aria-label={`${user.displayName || user.username} is ${getDisplayLabel().toLowerCase()}`}
    >
      {/* Typing indicator animation */}
      {isTyping && user.status === UserStatus.ONLINE && (
        <motion.div 
          className={cn(
            "absolute inset-0 rounded-full bg-blue-400",
            sizeClasses[size]
          )}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.5, 1]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Add pulsing animation for online status */}
      {user.status === UserStatus.ONLINE && !isTyping && (
        <motion.div 
          className={cn(
            "absolute inset-0 rounded-full bg-green-400",
            sizeClasses[size]
          )}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.8, 0, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}
    </motion.div>
  );

  if (showTooltip) {
    return (
      <div className="relative group">
        {indicator}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          {getDisplayLabel()}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    );
  }

  return indicator;
}

interface UserAvatarProps {
  user: User;
  size?: "sm" | "md" | "lg" | "xl";
  showPresence?: boolean;
  className?: string;
}

const avatarSizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8", 
  lg: "w-10 h-10",
  xl: "w-12 h-12",
};

const presenceSizeMap = {
  sm: "sm" as const,
  md: "sm" as const,
  lg: "md" as const, 
  xl: "md" as const,
};

export function UserAvatar({ 
  user, 
  size = "md", 
  showPresence = true,
  className 
}: UserAvatarProps) {
  const displayName = user.displayName || user.username;
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={cn("relative inline-block", className)}>
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={displayName}
          className={cn(
            "rounded-full object-cover",
            avatarSizeClasses[size]
          )}
        />
      ) : (
        <div
          className={cn(
            "rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium",
            avatarSizeClasses[size],
            size === "sm" ? "text-xs" : size === "xl" ? "text-base" : "text-sm"
          )}
        >
          {initials}
        </div>
      )}
      
      {showPresence && (
        <div className="absolute -bottom-0.5 -right-0.5">
          <PresenceIndicator 
            user={user} 
            size={presenceSizeMap[size]}
            showTooltip={size === "lg" || size === "xl"}
          />
        </div>
      )}
    </div>
  );
}