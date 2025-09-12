"use client";

import { useState, useEffect } from "react";
import { Badge } from "./badge";
import { api } from "@/lib/api";
import { socket } from "@/lib/socket";

interface ConnectionStatusProps {
  className?: string;
  showLabels?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ConnectionStatus({ className = "", showLabels = false, size = "sm" }: ConnectionStatusProps) {
  const [apiStatus, setApiStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  const [socketStatus, setSocketStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');

  useEffect(() => {
    // Check initial API connection
    const checkApiConnection = async () => {
      setApiStatus('connecting');
      const isConnected = await api.healthCheck();
      setApiStatus(isConnected ? 'connected' : 'error');
    };

    // Check socket status
    const updateSocketStatus = () => {
      setSocketStatus(socket.getConnectionStatus());
    };

    // Initial checks
    checkApiConnection();
    updateSocketStatus();

    // Set up intervals for monitoring
    const apiInterval = setInterval(checkApiConnection, 30000); // Check every 30 seconds
    const socketInterval = setInterval(updateSocketStatus, 5000); // Check every 5 seconds

    return () => {
      clearInterval(apiInterval);
      clearInterval(socketInterval);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return '●';
      case 'connecting':
        return '○';
      case 'error':
        return '✗';
      default:
        return '○';
    }
  };

  const getStatusLabel = (type: string, status: string) => {
    const base = type === 'api' ? 'API' : 'Socket';
    return `${base}: ${status}`;
  };

  if (!showLabels) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <span 
          className={`text-${getStatusColor(apiStatus)} text-${size}`}
          title={getStatusLabel('api', apiStatus)}
        >
          {getStatusText(apiStatus)}
        </span>
        <span 
          className={`text-${getStatusColor(socketStatus)} text-${size}`}
          title={getStatusLabel('socket', socketStatus)}
        >
          {getStatusText(socketStatus)}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant={getStatusColor(apiStatus) as any}
        className="text-xs"
      >
        API: {apiStatus}
      </Badge>
      <Badge 
        variant={getStatusColor(socketStatus) as any}
        className="text-xs"
      >
        Socket: {socketStatus}
      </Badge>
    </div>
  );
}

export default ConnectionStatus;