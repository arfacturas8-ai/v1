"use client";

import * as React from "react";
import { 
  Wifi,
  WifiOff,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  SignalZero,
  Activity,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Server,
  Router,
  Globe,
  Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceStore } from "@/lib/stores/use-voice-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface CallQualityIndicatorProps {
  variant?: 'minimal' | 'detailed' | 'floating';
  showDetails?: boolean;
  className?: string;
  onOpenSettings?: () => void;
}

interface QualityMetric {
  label: string;
  value: number;
  unit: string;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  description: string;
  trend?: 'up' | 'down' | 'stable';
}

export function CallQualityIndicator({ 
  variant = 'minimal',
  showDetails = false,
  className,
  onOpenSettings
}: CallQualityIndicatorProps) {
  const {
    networkQuality = 'good',
    bandwidthKbps = 128,
    latencyMs = 50,
    packetLoss = 0.5,
    isConnected = true,
    isConnecting = false,
    error = null
  } = useVoiceStore();

  const [detailsVisible, setDetailsVisible] = React.useState(showDetails);
  const [isRecovering, setIsRecovering] = React.useState(false);

  // Mock historical data for trends
  const [historicalData] = React.useState({
    latency: [45, 48, 52, 50, 47, 49],
    bandwidth: [120, 125, 128, 130, 128, 128],
    packetLoss: [0.3, 0.5, 0.4, 0.6, 0.5, 0.5]
  });

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'poor': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getQualityIcon = (quality: string, size = 'w-4 h-4') => {
    switch (quality) {
      case 'excellent': return <SignalHigh className={cn(size, 'text-green-500')} />;
      case 'good': return <Signal className={cn(size, 'text-blue-500')} />;
      case 'poor': return <SignalMedium className={cn(size, 'text-yellow-500')} />;
      case 'critical': return <SignalLow className={cn(size, 'text-red-500')} />;
      default: return <SignalZero className={cn(size, 'text-gray-500')} />;
    }
  };

  const getStatusIcon = () => {
    if (error) return <XCircle className="w-4 h-4 text-red-500" />;
    if (isRecovering) return <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />;
    if (isConnecting) return <Activity className="w-4 h-4 text-blue-500 animate-spin" />;
    if (isConnected) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-gray-500" />;
  };

  const getLatencyStatus = (latency: number): QualityMetric['status'] => {
    if (latency <= 50) return 'excellent';
    if (latency <= 100) return 'good';
    if (latency <= 200) return 'fair';
    if (latency <= 500) return 'poor';
    return 'critical';
  };

  const getBandwidthStatus = (bandwidth: number): QualityMetric['status'] => {
    if (bandwidth >= 128) return 'excellent';
    if (bandwidth >= 64) return 'good';
    if (bandwidth >= 32) return 'fair';
    if (bandwidth >= 16) return 'poor';
    return 'critical';
  };

  const getPacketLossStatus = (loss: number): QualityMetric['status'] => {
    if (loss <= 0.5) return 'excellent';
    if (loss <= 1.5) return 'good';
    if (loss <= 3) return 'fair';
    if (loss <= 5) return 'poor';
    return 'critical';
  };

  const getTrend = (data: number[]): 'up' | 'down' | 'stable' => {
    if (data.length < 2) return 'stable';
    const recent = data.slice(-3);
    const older = data.slice(-6, -3);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const threshold = 0.1; // 10% change threshold
    if (recentAvg > olderAvg * (1 + threshold)) return 'up';
    if (recentAvg < olderAvg * (1 - threshold)) return 'down';
    return 'stable';
  };

  const qualityMetrics: QualityMetric[] = [
    {
      label: 'Latency',
      value: latencyMs,
      unit: 'ms',
      status: getLatencyStatus(latencyMs),
      description: 'Round-trip time for audio packets',
      trend: getTrend(historicalData.latency)
    },
    {
      label: 'Bandwidth',
      value: bandwidthKbps,
      unit: 'kbps',
      status: getBandwidthStatus(bandwidthKbps),
      description: 'Available network bandwidth',
      trend: getTrend(historicalData.bandwidth)
    },
    {
      label: 'Packet Loss',
      value: packetLoss,
      unit: '%',
      status: getPacketLossStatus(packetLoss),
      description: 'Percentage of lost audio packets',
      trend: getTrend(historicalData.packetLoss)
    }
  ];

  const overallScore = Math.round(
    qualityMetrics.reduce((acc, metric) => {
      const scores = { excellent: 100, good: 80, fair: 60, poor: 40, critical: 20 };
      return acc + scores[metric.status];
    }, 0) / qualityMetrics.length
  );

  const renderMinimalView = () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          "flex items-center space-x-2 px-2 py-1 rounded-lg cursor-pointer transition-colors",
          "hover:bg-gray-800/50",
          className
        )}>
          {getQualityIcon(networkQuality)}
          <span className={cn(
            "text-sm font-medium",
            getQualityColor(networkQuality)
          )}>
            {networkQuality.charAt(0).toUpperCase() + networkQuality.slice(1)}
          </span>
          {getStatusIcon()}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="w-64">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Connection Quality</span>
            <Badge variant={networkQuality === 'excellent' ? 'default' : 
                           networkQuality === 'good' ? 'secondary' :
                           networkQuality === 'poor' ? 'destructive' : 'outline'}>
              {overallScore}/100
            </Badge>
          </div>
          <div className="space-y-1">
            {qualityMetrics.map(metric => (
              <div key={metric.label} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{metric.label}:</span>
                <span className={getQualityColor(metric.status)}>
                  {metric.value}{metric.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );

  const renderFloatingView = () => (
    <Card className={cn(
      "bg-gray-900/95 border-gray-700 backdrop-blur-sm shadow-lg",
      className
    )}>
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          {getQualityIcon(networkQuality, 'w-5 h-5')}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-200">Connection</span>
              <span className={cn("text-xs", getQualityColor(networkQuality))}>
                {networkQuality}
              </span>
            </div>
            <Progress value={overallScore} className="h-1.5" />
          </div>
          {getStatusIcon()}
        </div>
        
        {detailsVisible && (
          <>
            <Separator className="my-2" />
            <div className="grid grid-cols-3 gap-2 text-xs">
              {qualityMetrics.map(metric => (
                <div key={metric.label} className="text-center">
                  <div className="text-gray-400">{metric.label}</div>
                  <div className={cn("font-medium", getQualityColor(metric.status))}>
                    {metric.value}{metric.unit}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderDetailedView = () => (
    <Card className={cn("bg-gray-900 border-gray-700", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-200 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Connection Quality
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Badge variant={overallScore >= 80 ? 'default' : 
                           overallScore >= 60 ? 'secondary' :
                           overallScore >= 40 ? 'destructive' : 'outline'}>
              {overallScore}/100
            </Badge>
            
            {onOpenSettings && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <Gauge className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={onOpenSettings}>
                    <Server className="w-4 h-4 mr-2" />
                    Connection Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Router className="w-4 h-4 mr-2" />
                    Network Diagnostics
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Globe className="w-4 h-4 mr-2" />
                    Server Status
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/50">
          {getStatusIcon()}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-200">
                {error ? 'Connection Error' :
                 isRecovering ? 'Reconnecting...' :
                 isConnecting ? 'Connecting...' :
                 isConnected ? 'Connected' : 'Disconnected'}
              </span>
              <span className={cn("text-sm", getQualityColor(networkQuality))}>
                {networkQuality.charAt(0).toUpperCase() + networkQuality.slice(1)}
              </span>
            </div>
            <Progress value={overallScore} className="h-2" />
          </div>
        </div>
        
        {/* Detailed Metrics */}
        <div className="space-y-3">
          {qualityMetrics.map(metric => (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-200">
                    {metric.label}
                  </span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">{metric.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                <div className="flex items-center space-x-2">
                  {metric.trend === 'up' && <TrendingUp className="w-3 h-3 text-red-400" />}
                  {metric.trend === 'down' && <TrendingDown className="w-3 h-3 text-green-400" />}
                  <span className={cn(
                    "text-sm font-medium",
                    getQualityColor(metric.status)
                  )}>
                    {metric.value}{metric.unit}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Progress 
                  value={
                    metric.label === 'Latency' ? Math.max(0, 100 - (metric.value / 5)) :
                    metric.label === 'Bandwidth' ? Math.min(100, (metric.value / 128) * 100) :
                    Math.max(0, 100 - (metric.value * 20))
                  } 
                  className="flex-1 h-1.5" 
                />
                <Badge 
                  variant={metric.status === 'excellent' || metric.status === 'good' ? 'default' : 
                          metric.status === 'fair' ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {metric.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        {/* Error Information */}
        {error && (
          <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/30">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">
                Connection Issue
              </span>
            </div>
            <p className="text-sm text-red-300 mt-1">
              {(error as any)?.message || 'Unknown error'}
            </p>
          </div>
        )}
        
        {/* Recommendations */}
        {(networkQuality === 'poor' || networkQuality === 'critical') && (
          <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">
                Recommendations
              </span>
            </div>
            <ul className="text-sm text-yellow-300 space-y-1">
              {latencyMs > 200 && <li>• Try connecting to a closer server</li>}
              {packetLoss > 2 && <li>• Check your internet connection stability</li>}
              {bandwidthKbps < 32 && <li>• Close other applications using bandwidth</li>}
              <li>• Switch to a wired connection if using WiFi</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!isConnected && !isConnecting && !error) {
    return null;
  }

  return (
    <TooltipProvider>
      {variant === 'minimal' && renderMinimalView()}
      {variant === 'floating' && renderFloatingView()}
      {variant === 'detailed' && renderDetailedView()}
    </TooltipProvider>
  );
}

// Hook for managing call quality data
export function useCallQuality() {
  const {
    networkQuality,
    bandwidthKbps,
    latencyMs,
    packetLoss,
    isConnected,
    error
  } = useVoiceStore();

  const getOverallScore = React.useCallback(() => {
    const latencyScore = latencyMs <= 50 ? 100 : latencyMs <= 100 ? 80 : latencyMs <= 200 ? 60 : latencyMs <= 500 ? 40 : 20;
    const bandwidthScore = bandwidthKbps >= 128 ? 100 : bandwidthKbps >= 64 ? 80 : bandwidthKbps >= 32 ? 60 : bandwidthKbps >= 16 ? 40 : 20;
    const packetLossScore = packetLoss <= 0.5 ? 100 : packetLoss <= 1.5 ? 80 : packetLoss <= 3 ? 60 : packetLoss <= 5 ? 40 : 20;
    
    return Math.round((latencyScore + bandwidthScore + packetLossScore) / 3);
  }, [latencyMs, bandwidthKbps, packetLoss]);

  const getQualityLevel = React.useCallback(() => {
    const score = getOverallScore();
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    if (score >= 30) return 'poor';
    return 'critical';
  }, [getOverallScore]);

  return {
    networkQuality,
    bandwidthKbps,
    latencyMs,
    packetLoss,
    isConnected,
    error,
    overallScore: getOverallScore(),
    qualityLevel: getQualityLevel()
  };
}