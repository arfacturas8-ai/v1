import React, { useState, useEffect, useRef, useMemo } from 'react';
import { webrtcService } from '../../services/webrtc';

const AnalyticsDashboard = ({
  roomId,
  isAdmin = false,
  onExportData,
  onAlertConfig
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('1h');
  const [realTimeData, setRealTimeData] = useState({});
  const [historicalData, setHistoricalData] = useState({});
  const [participants, setParticipants] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const chartRefs = {
    bandwidth: useRef(null),
    quality: useRef(null),
    participants: useRef(null),
    latency: useRef(null)
  };

  const refreshInterval = useRef(null);

  // Real-time data collection
  useEffect(() => {
    const collectRealTimeData = async () => {
      try {
        const stats = await webrtcService.getDetailedStats();
        const roomStats = await webrtcService.getRoomStats(roomId);

        setRealTimeData({
          timestamp: Date.now(),
          bandwidth: {
            upload: stats.bandwidth?.upload || 0,
            download: stats.bandwidth?.download || 0
          },
          quality: {
            video: stats.video?.quality || 0,
            audio: stats.audio?.quality || 0
          },
          latency: {
            rtt: stats.connection?.rtt || 0,
            jitter: stats.connection?.jitter || 0
          },
          participants: {
            total: roomStats.participantCount || 0,
            speaking: roomStats.speakingCount || 0,
            video: roomStats.videoCount || 0
          },
          connection: {
            packetLoss: stats.connection?.packetLoss || 0,
            connectionState: stats.connection?.state || 'unknown'
          }
        });

        setParticipants(roomStats.participants || []);

      } catch (error) {
        console.error('Error collecting real-time data:', error);
      }
    };

    collectRealTimeData();
    setIsLoading(false);

    if (autoRefresh) {
      refreshInterval.current = setInterval(collectRealTimeData, 5000);
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [roomId, autoRefresh]);

  // Historical data fetching
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const data = await webrtcService.getHistoricalAnalytics(roomId, timeRange);
        setHistoricalData(data);
      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };

    fetchHistoricalData();
  }, [roomId, timeRange]);

  // Alert monitoring
  useEffect(() => {
    const checkAlerts = () => {
      const newAlerts = [];

      if (realTimeData.bandwidth?.upload > 5000 || realTimeData.bandwidth?.download > 5000) {
        newAlerts.push({
          id: `bandwidth-${Date.now()}`,
          type: 'warning',
          title: 'High Bandwidth Usage',
          message: `Current bandwidth: ${realTimeData.bandwidth.upload + realTimeData.bandwidth.download} kbps`,
          timestamp: Date.now()
        });
      }

      if (realTimeData.quality?.video < 3 || realTimeData.quality?.audio < 3) {
        newAlerts.push({
          id: `quality-${Date.now()}`,
          type: 'error',
          title: 'Poor Connection Quality',
          message: 'Video or audio quality is below acceptable threshold',
          timestamp: Date.now()
        });
      }

      if (realTimeData.latency?.rtt > 300) {
        newAlerts.push({
          id: `latency-${Date.now()}`,
          type: 'warning',
          title: 'High Latency Detected',
          message: `RTT: ${realTimeData.latency.rtt}ms`,
          timestamp: Date.now()
        });
      }

      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 50));
      }
    };

    if (realTimeData.timestamp) {
      checkAlerts();
    }
  }, [realTimeData]);

  // Chart rendering
  useEffect(() => {
    if (!realTimeData.timestamp || !chartRefs.bandwidth.current) return;

    renderBandwidthChart();
    renderQualityChart();
    renderParticipantsChart();
    renderLatencyChart();
  }, [realTimeData, historicalData]);

  const renderBandwidthChart = () => {
    const canvas = chartRefs.bandwidth.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(margin.left, margin.top, chartWidth, chartHeight);

    const data = generateSampleData(50);
    const maxValue = Math.max(...data.map(d => Math.max(d.upload, d.download)));

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = margin.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#5865f2';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = margin.left + (chartWidth / (data.length - 1)) * index;
      const y = margin.top + chartHeight - (point.upload / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    ctx.strokeStyle = '#00d2d3';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = margin.left + (chartWidth / (data.length - 1)) * index;
      const y = margin.top + chartHeight - (point.download / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Inter';
    ctx.fillText(`Upload: ${realTimeData.bandwidth?.upload || 0} kbps`, margin.left, height - 20);
    ctx.fillText(`Download: ${realTimeData.bandwidth?.download || 0} kbps`, margin.left + 150, height - 20);
  };

  const renderQualityChart = () => {
    const canvas = chartRefs.quality.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const meterWidth = 60;
    const meterHeight = height - 40;
    const videoX = width / 4 - meterWidth / 2;
    const audioX = (3 * width) / 4 - meterWidth / 2;

    drawQualityMeter(ctx, videoX, 20, meterWidth, meterHeight, realTimeData.quality?.video || 0, 'Video');
    drawQualityMeter(ctx, audioX, 20, meterWidth, meterHeight, realTimeData.quality?.audio || 0, 'Audio');
  };

  const renderParticipantsChart = () => {
    const canvas = chartRefs.participants.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    const total = realTimeData.participants?.total || 0;
    const speaking = realTimeData.participants?.speaking || 0;
    const video = realTimeData.participants?.video || 0;

    let startAngle = 0;

    if (speaking > 0) {
      const speakingAngle = (speaking / total) * 2 * Math.PI;
      drawPieSlice(ctx, centerX, centerY, radius, startAngle, startAngle + speakingAngle, '#00d2d3');
      startAngle += speakingAngle;
    }

    const videoOnly = video - speaking;
    if (videoOnly > 0) {
      const videoAngle = (videoOnly / total) * 2 * Math.PI;
      drawPieSlice(ctx, centerX, centerY, radius, startAngle, startAngle + videoAngle, '#5865f2');
      startAngle += videoAngle;
    }

    const audioOnly = total - video;
    if (audioOnly > 0) {
      const audioAngle = (audioOnly / total) * 2 * Math.PI;
      drawPieSlice(ctx, centerX, centerY, radius, startAngle, startAngle + audioAngle, '#7f8c8d');
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(total.toString(), centerX, centerY);
    ctx.font = '12px Inter';
    ctx.fillText('Participants', centerX, centerY + 20);
  };

  const renderLatencyChart = () => {
    const canvas = chartRefs.latency.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    const rtt = realTimeData.latency?.rtt || 0;
    const maxRTT = 500;
    const angle = (rtt / maxRTT) * Math.PI;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
    ctx.stroke();

    const color = rtt < 100 ? '#00d2d3' : rtt < 200 ? '#f39c12' : '#ff4757';
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, Math.PI + angle);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(`${rtt}ms`, centerX, centerY + 10);
    ctx.font = '12px Inter';
    ctx.fillText('Latency', centerX, centerY + 30);
  };

  const drawQualityMeter = (ctx, x, y, width, height, value, label) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x, y, width, height);

    const barHeight = height / 5;
    const colors = ['#ff4757', '#ff7675', '#fdcb6e', '#6c5ce7', '#00d2d3'];

    for (let i = 0; i < 5; i++) {
      const barY = y + height - (i + 1) * barHeight;
      ctx.fillStyle = i < value ? colors[i] : 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(x + 5, barY + 2, width - 10, barHeight - 4);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + width / 2, y + height + 15);
  };

  const drawPieSlice = (ctx, centerX, centerY, radius, startAngle, endAngle, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
  };

  const generateSampleData = (points) => {
    return Array.from({ length: points }, (_, i) => ({
      upload: Math.random() * 1000 + 500,
      download: Math.random() * 2000 + 1000,
      timestamp: Date.now() - (points - i) * 5000
    }));
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const exportData = () => {
    const exportData = {
      roomId,
      timeRange,
      timestamp: Date.now(),
      realTimeData,
      historicalData,
      participants,
      alerts
    };

    if (onExportData) {
      onExportData(exportData);
    } else {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${roomId}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  if (isLoading) {
    return (
      <div style={{color: "var(--text-primary)"}} className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e]  gap-5">
        <div className="w-10 h-10 border-3 border-white/30 border-t-[#5865f2] rounded-full "></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div style={{color: "var(--text-primary)"}} className="flex flex-col h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e]  font-['Inter',-apple-system,BlinkMacSystemFont,sans-serif] overflow-hidden">
      {/* Header */}
      <div style={{borderColor: "var(--border-subtle)"}} className="flex flex-col md:flex-row justify-between items-stretch md:items-center px-6 py-5 bg-white/5 backdrop-blur-[10px] border-b  gap-4 md:gap-0">
        <div className="flex-1">
          <h2 style={{color: "var(--text-primary)"}} className="text-2xl font-semibold m-0 mb-1 ">Analytics Dashboard</h2>
          <p className="text-sm text-[#b0b3b8] m-0">Room: {roomId}</p>
        </div>

        <div className="flex items-center gap-5 justify-between flex-wrap">
          <div className="flex items-center gap-2">
            <label style={{color: "var(--text-primary)"}} className="text-sm  whitespace-nowrap">Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{color: "var(--text-primary)"}} style={{borderColor: "var(--border-default)"}} className="px-3 py-2 bg-white/10 border  rounded-md  text-sm focus:outline-none focus:shadow-[0_0_0_3px_rgba(88,101,242,0.3)]"
            >
              <option value="5m">5 minutes</option>
              <option value="1h">1 hour</option>
              <option value="6h">6 hours</option>
              <option value="24h">24 hours</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
            </select>
          </div>

          <div className="flex items-center">
            <label style={{color: "var(--text-primary)"}} className="flex items-center gap-2 text-sm  cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 accent-[#5865f2]"
              />
              Auto Refresh
            </label>
          </div>

          <button
            onClick={exportData}
            style={{color: "var(--text-primary)"}} className="px-4 py-2.5 bg-[#5865f2] border-none rounded-md  font-medium cursor-pointer transition-all duration-200 hover:bg-[#4752c4] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:ring-offset-2"
          >
            Export Data
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-[#ff4757]/10 border-b border-[#ff4757]/30 px-6 py-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-[#ff4757] m-0">Active Alerts ({alerts.length})</h3>
            <button
              onClick={clearAllAlerts}
              className="px-3 py-1.5 bg-transparent border border-[#ff4757] rounded text-[#ff4757] cursor-pointer text-xs transition-all duration-200 hover:bg-[#ff4757]/10 focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:ring-offset-2"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {alerts.slice(0, 3).map(alert => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 px-4 py-3 rounded-lg relative ${
                  alert.type === 'warning' ? 'bg-[#f39c12]/10 border-l-4 border-[#f39c12]' :
                  alert.type === 'error' ? 'bg-[#ff4757]/10 border-l-4 border-[#ff4757]' :
                  'bg-[#5865f2]/10 border-l-4 border-[#5865f2]'
                }`}
              >
                <div className="flex-1">
                  <strong className="block font-semibold mb-1">{alert.title}</strong>
                  <p className="m-0 mb-1 text-sm text-[#b0b3b8]">{alert.message}</p>
                  <span className="text-xs text-[#7f8c8d]">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  style={{color: "var(--text-primary)"}} className="bg-transparent border-none text-[#7f8c8d] cursor-pointer text-lg p-0 w-5 h-5 flex items-center justify-center hover:"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{borderColor: "var(--border-subtle)"}} className="flex bg-white/5 border-b  overflow-x-auto">
        {['overview', 'participants', 'performance', 'history'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 bg-transparent border-none cursor-pointer transition-all duration-200 text-sm font-medium relative capitalize whitespace-nowrap min-w-[100px] md:min-w-0 focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:ring-offset-2 ${
              activeTab === tab
                ? 'text-[#5865f2] bg-[#5865f2]/10 after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#5865f2]'
                : 'text-[#b0b3b8] hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-white/5">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div style={{borderColor: "var(--border-subtle)"}} className="bg-white/5 rounded-xl p-5 backdrop-blur-[10px] border ">
                <h3 style={{color: "var(--text-primary)"}} className="text-base font-semibold m-0 mb-4 ">Bandwidth Usage</h3>
                <canvas
                  ref={chartRefs.bandwidth}
                  width={300}
                  height={200}
                  className="w-full h-auto rounded-lg"
                />
              </div>

              <div style={{borderColor: "var(--border-subtle)"}} className="bg-white/5 rounded-xl p-5 backdrop-blur-[10px] border ">
                <h3 style={{color: "var(--text-primary)"}} className="text-base font-semibold m-0 mb-4 ">Connection Quality</h3>
                <canvas
                  ref={chartRefs.quality}
                  width={300}
                  height={200}
                  className="w-full h-auto rounded-lg"
                />
              </div>

              <div style={{borderColor: "var(--border-subtle)"}} className="bg-white/5 rounded-xl p-5 backdrop-blur-[10px] border ">
                <h3 style={{color: "var(--text-primary)"}} className="text-base font-semibold m-0 mb-4 ">Participants</h3>
                <canvas
                  ref={chartRefs.participants}
                  width={300}
                  height={200}
                  className="w-full h-auto rounded-lg"
                />
              </div>

              <div style={{borderColor: "var(--border-subtle)"}} className="bg-white/5 rounded-xl p-5 backdrop-blur-[10px] border ">
                <h3 style={{color: "var(--text-primary)"}} className="text-base font-semibold m-0 mb-4 ">Latency</h3>
                <canvas
                  ref={chartRefs.latency}
                  width={300}
                  height={200}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>

            {/* Real-time Stats */}
            <div className="bg-white/5 rounded-xl p-6">
              <h3 style={{color: "var(--text-primary)"}} className="text-lg font-semibold m-0 mb-5 ">Real-time Statistics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-[#b0b3b8] font-medium">Packet Loss</label>
                  <span className={`text-xl font-semibold ${(realTimeData.connection?.packetLoss || 0) > 0.05 ? 'text-[#f39c12]' : 'text-[#00d2d3]'}`}>
                    {((realTimeData.connection?.packetLoss || 0) * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-[#b0b3b8] font-medium">Jitter</label>
                  <span className={`text-xl font-semibold ${(realTimeData.latency?.jitter || 0) > 50 ? 'text-[#f39c12]' : 'text-[#00d2d3]'}`}>
                    {realTimeData.latency?.jitter || 0}ms
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-[#b0b3b8] font-medium">Connection State</label>
                  <span className={`text-base px-2 py-1 rounded inline-block ${
                    (realTimeData.connection?.connectionState || 'unknown') === 'connected' ? 'bg-[#00d2d3]/20 text-[#00d2d3]' :
                    (realTimeData.connection?.connectionState || 'unknown') === 'connecting' ? 'bg-[#f39c12]/20 text-[#f39c12]' :
                    'bg-[#ff4757]/20 text-[#ff4757]'
                  }`}>
                    {realTimeData.connection?.connectionState || 'Unknown'}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-[#b0b3b8] font-medium">Active Speakers</label>
                  <span style={{color: "var(--text-primary)"}} className="text-xl font-semibold ">{realTimeData.participants?.speaking || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center mb-5 gap-3">
              <h3 style={{color: "var(--text-primary)"}} className="text-lg font-semibold m-0 ">Active Participants ({participants.length})</h3>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search participants..."
                  style={{color: "var(--text-primary)"}} style={{borderColor: "var(--border-subtle)"}} className="px-4 py-2.5 bg-white/5 border  rounded-md  text-sm w-full md:w-[250px] focus:outline-none focus:shadow-[0_0_0_3px_rgba(88,101,242,0.3)]"
                />
                <select style={{color: "var(--text-primary)"}} style={{borderColor: "var(--border-subtle)"}} className="px-4 py-2.5 bg-white/5 border  rounded-md  text-sm focus:outline-none focus:shadow-[0_0_0_3px_rgba(88,101,242,0.3)]">
                  <option value="all">All</option>
                  <option value="speaking">Speaking</option>
                  <option value="video">Video On</option>
                  <option value="audio">Audio Only</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {participants.map(participant => (
                <div key={participant.id} className="flex flex-col md:flex-row items-stretch md:items-center gap-4 px-4 py-4 bg-white/5 rounded-xl transition-all duration-200 hover:bg-white/10">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    {participant.avatar ? (
                      <img src={participant.avatar} alt={participant.name} className="w-full h-full object-cover" />
                    ) : (
                      <div style={{color: "var(--text-primary)"}} className="w-full h-full bg-[#5865f2] flex items-center justify-center  font-semibold text-lg">
                        {participant.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div style={{color: "var(--text-primary)"}} className="text-base font-semibold  mb-1">{participant.name || 'Unknown'}</div>
                    <div className="flex gap-2">
                      {participant.isSpeaking && <span className="px-2 py-0.5 rounded-xl text-xs font-medium bg-[#00d2d3]/20 text-[#00d2d3]">Speaking</span>}
                      {participant.hasVideo && <span className="px-2 py-0.5 rounded-xl text-xs font-medium bg-[#5865f2]/20 text-[#5865f2]">Video</span>}
                      {participant.hasAudio && <span style={{color: "var(--text-primary)"}} className="px-2 py-0.5 rounded-xl text-xs font-medium bg-white/10 ">Audio</span>}
                    </div>
                  </div>

                  <div className="flex gap-5 items-center">
                    <div className="flex flex-col items-center gap-1">
                      <label className="text-xs text-[#b0b3b8]">Quality</label>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div
                            key={i}
                            className={`w-1 h-4 rounded-sm ${i <= (participant.quality || 0) ? 'bg-[#00d2d3]' : 'bg-white/20'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <label className="text-xs text-[#b0b3b8]">Latency</label>
                      <span className={`${(participant.latency || 0) > 200 ? 'text-[#f39c12]' : 'text-[#00d2d3]'}`}>
                        {participant.latency || 0}ms
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2">
                      <button style={{color: "var(--text-primary)"}} style={{borderColor: "var(--border-default)"}} className="px-3 py-1.5 border  bg-transparent  rounded cursor-pointer text-xs transition-all duration-200 hover:bg-[#f39c12]/10 hover:border-[#f39c12] hover:text-[#f39c12] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:ring-offset-2">Mute</button>
                      <button style={{color: "var(--text-primary)"}} style={{borderColor: "var(--border-default)"}} className="px-3 py-1.5 border  bg-transparent  rounded cursor-pointer text-xs transition-all duration-200 hover:bg-[#ff4757]/10 hover:border-[#ff4757] hover:text-[#ff4757] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:ring-offset-2">Kick</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="flex flex-col gap-6">
            <h3 style={{color: "var(--text-primary)"}} className="text-lg font-semibold m-0 mb-5 ">Performance Analysis</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <div style={{borderColor: "var(--border-subtle)"}} className="bg-white/5 rounded-xl p-5 border ">
                <h4 style={{color: "var(--text-primary)"}} className="text-base font-semibold m-0 mb-4 ">Network Performance</h4>
                <div className="flex flex-col gap-3">
                  <div style={{borderColor: "var(--border-subtle)"}} className="flex justify-between items-center py-2 border-b  last:border-b-0">
                    <span className="text-[#b0b3b8] text-sm">Average RTT:</span>
                    <span style={{color: "var(--text-primary)"}} className=" font-semibold">{realTimeData.latency?.rtt || 0}ms</span>
                  </div>
                  <div style={{borderColor: "var(--border-subtle)"}} className="flex justify-between items-center py-2 border-b  last:border-b-0">
                    <span className="text-[#b0b3b8] text-sm">Packet Loss:</span>
                    <span style={{color: "var(--text-primary)"}} className=" font-semibold">{((realTimeData.connection?.packetLoss || 0) * 100).toFixed(2)}%</span>
                  </div>
                  <div style={{borderColor: "var(--border-subtle)"}} className="flex justify-between items-center py-2 border-b  last:border-b-0">
                    <span className="text-[#b0b3b8] text-sm">Bandwidth Utilization:</span>
                    <span style={{color: "var(--text-primary)"}} className=" font-semibold">{(realTimeData.bandwidth?.upload + realTimeData.bandwidth?.download) || 0} kbps</span>
                  </div>
                </div>
              </div>

              <div style={{borderColor: "var(--border-subtle)"}} className="bg-white/5 rounded-xl p-5 border ">
                <h4 style={{color: "var(--text-primary)"}} className="text-base font-semibold m-0 mb-4 ">Media Quality</h4>
                <div className="flex flex-col gap-3">
                  <div style={{borderColor: "var(--border-subtle)"}} className="flex justify-between items-center py-2 border-b  last:border-b-0">
                    <span className="text-[#b0b3b8] text-sm">Video Quality:</span>
                    <span style={{color: "var(--text-primary)"}} className=" font-semibold">{realTimeData.quality?.video || 0}/5</span>
                  </div>
                  <div style={{borderColor: "var(--border-subtle)"}} className="flex justify-between items-center py-2 border-b  last:border-b-0">
                    <span className="text-[#b0b3b8] text-sm">Audio Quality:</span>
                    <span style={{color: "var(--text-primary)"}} className=" font-semibold">{realTimeData.quality?.audio || 0}/5</span>
                  </div>
                  <div style={{borderColor: "var(--border-subtle)"}} className="flex justify-between items-center py-2 border-b  last:border-b-0">
                    <span className="text-[#b0b3b8] text-sm">Frame Rate:</span>
                    <span style={{color: "var(--text-primary)"}} className=" font-semibold">30 fps</span>
                  </div>
                </div>
              </div>

              <div style={{borderColor: "var(--border-subtle)"}} className="bg-white/5 rounded-xl p-5 border ">
                <h4 style={{color: "var(--text-primary)"}} className="text-base font-semibold m-0 mb-4 ">Resource Usage</h4>
                <div className="flex flex-col gap-3">
                  <div style={{borderColor: "var(--border-subtle)"}} className="flex justify-between items-center py-2 border-b  last:border-b-0">
                    <span className="text-[#b0b3b8] text-sm">CPU Usage:</span>
                    <span style={{color: "var(--text-primary)"}} className=" font-semibold">15%</span>
                  </div>
                  <div style={{borderColor: "var(--border-subtle)"}} className="flex justify-between items-center py-2 border-b  last:border-b-0">
                    <span className="text-[#b0b3b8] text-sm">Memory Usage:</span>
                    <span style={{color: "var(--text-primary)"}} className=" font-semibold">180 MB</span>
                  </div>
                  <div style={{borderColor: "var(--border-subtle)"}} className="flex justify-between items-center py-2 border-b  last:border-b-0">
                    <span className="text-[#b0b3b8] text-sm">GPU Usage:</span>
                    <span style={{color: "var(--text-primary)"}} className=" font-semibold">8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex flex-col gap-6">
            <h3 style={{color: "var(--text-primary)"}} className="text-lg font-semibold m-0 ">Historical Data</h3>
            <div className="bg-white/5 rounded-xl p-6">
              <h4 style={{color: "var(--text-primary)"}} className="text-base font-semibold m-0 mb-5 ">Session Summary</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-[#b0b3b8] font-medium">Total Duration:</label>
                  <span style={{color: "var(--text-primary)"}} className="text-lg font-semibold ">{formatDuration(Date.now() - (historicalData.sessionStart || Date.now()))}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-[#b0b3b8] font-medium">Peak Participants:</label>
                  <span style={{color: "var(--text-primary)"}} className="text-lg font-semibold ">{historicalData.peakParticipants || 0}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-[#b0b3b8] font-medium">Average Quality:</label>
                  <span style={{color: "var(--text-primary)"}} className="text-lg font-semibold ">{(historicalData.averageQuality || 0).toFixed(1)}/5</span>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-[#b0b3b8] font-medium">Data Transferred:</label>
                  <span style={{color: "var(--text-primary)"}} className="text-lg font-semibold ">{(historicalData.dataTransferred || 0).toFixed(2)} MB</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
