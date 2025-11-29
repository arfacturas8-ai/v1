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
