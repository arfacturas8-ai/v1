#!/bin/bash

echo "🔍 Setting up basic monitoring with PM2 metrics"
echo "=============================================="

# PM2 already has built-in monitoring
echo "Configuring PM2 monitoring..."

# Enable PM2 monitoring
pm2 install pm2-auto-pull
pm2 install pm2-server-monit

# Create monitoring dashboard script
cat > /home/ubuntu/cryb-platform/scripts/view-metrics.sh << 'SCRIPT'
#!/bin/bash
echo "📊 System Metrics Dashboard"
echo "=========================="
echo ""

# PM2 status
echo "🚀 Application Status:"
pm2 list

echo ""
echo "💾 Memory & CPU:"
pm2 monit

echo ""
echo "📈 Detailed Metrics:"
pm2 info cryb-api | grep -E "status|memory|cpu|restarts"
pm2 info cryb-frontend | grep -E "status|memory|cpu|restarts"

echo ""
echo "🔍 Recent Logs:"
pm2 logs --lines 5 --nostream

echo ""
echo "For real-time monitoring: pm2 monit"
echo "For web dashboard: pm2 web (then visit http://localhost:9615)"
SCRIPT

chmod +x /home/ubuntu/cryb-platform/scripts/view-metrics.sh

# Set up PM2 web monitoring
pm2 web

echo ""
echo "✅ Basic monitoring configured!"
echo ""
echo "Monitoring tools:"
echo "- View metrics: /home/ubuntu/cryb-platform/scripts/view-metrics.sh"
echo "- Real-time monitor: pm2 monit"
echo "- Web dashboard: http://localhost:9615"
echo "- Health checks: Already running via cron"
echo ""
echo "For advanced monitoring, consider:"
echo "- Datadog"
echo "- New Relic"
echo "- CloudWatch (AWS)"
echo "- Grafana Cloud (managed solution)"
