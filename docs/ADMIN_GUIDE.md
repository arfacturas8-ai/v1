# CRYB Platform Admin Guide

This guide covers administrative functions for managing the CRYB Platform, including user management, content moderation, system monitoring, and troubleshooting.

## Table of Contents

1. [Admin Panel Access](#admin-panel-access)
2. [User Management](#user-management)
3. [Content Moderation](#content-moderation)
4. [Community Management](#community-management)
5. [System Monitoring](#system-monitoring)
6. [Troubleshooting Guide](#troubleshooting-guide)

## Admin Panel Access

### Getting Admin Access

**Prerequisites:**
- Valid CRYB Platform user account
- Admin or moderator privileges granted by a super admin
- Access to admin panel URL: https://admin.yourdomain.com

### Admin Roles and Permissions

**Super Admin:**
- Full system access
- Can grant/revoke admin privileges
- System configuration access
- Database management capabilities

**Admin:**
- User management (except other admins)
- Content moderation across all communities
- System monitoring access
- Community management

**Moderator:**
- Content moderation in assigned communities
- User management within assigned communities
- Limited system monitoring access

### Logging Into Admin Panel

1. **Navigate** to https://admin.yourdomain.com
2. **Login** with your CRYB Platform credentials
3. **Verify** your admin permissions are active
4. **Access** the admin dashboard

### Admin Dashboard Overview

**Dashboard Sections:**
- **System Health**: Real-time system status
- **User Statistics**: Active users, registrations, engagement
- **Content Metrics**: Posts, comments, media uploads
- **Moderation Queue**: Pending reports and actions
- **Recent Activity**: Latest platform activity
- **Quick Actions**: Common administrative tasks

**Key Metrics Displayed:**
- Total registered users
- Active users (last 24h, 7d, 30d)
- Total communities and posts
- Moderation actions taken
- System resource usage
- Error rates and performance metrics

## User Management

### User Search and Filtering

**Search Options:**
- **Username**: Exact or partial match
- **Email**: For verified accounts
- **Display Name**: Search by display name
- **User ID**: Direct user lookup
- **Registration Date**: Date range filtering
- **Status**: Active, suspended, banned, deleted

**Advanced Filters:**
- **Account Type**: Regular, verified, admin, moderator
- **Activity Level**: Active, inactive, new users
- **Verification Status**: Email verified, unverified
- **Risk Score**: Based on automated assessments
- **Location**: Geographic filtering (if available)

### User Profiles and Information

**Basic Information:**
- Username and display name
- Email address and verification status
- Registration date and last login
- Profile picture and bio
- Account status and restrictions

**Activity Metrics:**
- Post count and engagement rates
- Comment activity and karma score
- Community memberships
- Message activity and DM usage
- Voice/video call participation

**Moderation History:**
- Previous warnings and suspensions
- Community bans and restrictions
- Content removals and strikes
- Appeal history and resolutions

### User Actions

**Account Management:**
- **Verify Account**: Manually verify email/identity
- **Reset Password**: Force password reset
- **Update Profile**: Edit user information
- **Change Username**: Modify username (with restrictions)
- **Delete Account**: Permanent account removal

**Moderation Actions:**
- **Issue Warning**: Send formal warning to user
- **Temporary Suspension**: Time-limited account suspension
- **Permanent Ban**: Permanent account termination
- **Shadow Ban**: Limit visibility without notification
- **Restrict Features**: Disable specific features (posting, messaging, etc.)

**Communication:**
- **Send Message**: Direct admin message to user
- **Email User**: Send email notification
- **Announce to User**: System announcement
- **Request Information**: Request additional verification

### Bulk User Operations

**Mass Actions:**
- **Bulk Email**: Send announcements to user groups
- **Mass Suspension**: Suspend multiple accounts
- **Export User Data**: Generate user reports
- **Import User Lists**: Bulk operations from CSV
- **Community Migration**: Move users between communities

**Automated Actions:**
- **Inactive Account Cleanup**: Remove dormant accounts
- **Spam Account Detection**: Identify and remove spam accounts
- **Duplicate Account Removal**: Merge or remove duplicates
- **Compliance Actions**: GDPR deletion requests

### User Analytics

**Engagement Metrics:**
- Daily/monthly active users
- User retention rates
- Feature adoption rates
- Geographic distribution
- Device and platform usage

**Behavioral Analytics:**
- Content creation patterns
- Community participation
- Social network analysis
- Risk behavior indicators
- Feature usage statistics

## Content Moderation

### Moderation Dashboard

**Content Queue:**
- **Pending Reports**: User-submitted content reports
- **Auto-Flagged Content**: AI-detected problematic content
- **Appeals**: Content removal appeals
- **DMCA Requests**: Copyright violation claims
- **Community Reports**: Community-specific moderation requests

**Priority Levels:**
- **Critical**: Immediate safety concerns
- **High**: Policy violations requiring quick action
- **Medium**: Community guidelines violations
- **Low**: Minor infractions or spam

### Automated Moderation

**AI Moderation Features:**
- **Toxicity Detection**: Hate speech, harassment identification
- **NSFW Content Detection**: Adult content in images/videos
- **Spam Filtering**: Automated spam post/comment removal
- **Violence Detection**: Violent content identification
- **Copyright Detection**: Duplicate content identification

**Auto-Action Settings:**
- **Auto-Remove**: Automatically remove high-confidence violations
- **Flag for Review**: Queue suspicious content for manual review
- **Shadow Ban**: Automatically limit visibility of problematic content
- **User Scoring**: Adjust user risk scores based on content

**Custom Filters:**
- **Keyword Filters**: Block or flag specific words/phrases
- **URL Blacklists**: Block known malicious or spam domains
- **Image Hash Matching**: Detect known problematic images
- **Regex Patterns**: Advanced text pattern matching

### Manual Moderation

**Content Review Process:**
1. **Content Assessment**: Review reported/flagged content
2. **Context Evaluation**: Consider community rules and platform policies
3. **Action Decision**: Determine appropriate moderation action
4. **User Notification**: Inform user of action and reasoning
5. **Appeal Process**: Handle any appeals or disputes

**Moderation Actions:**
- **Approve**: Mark content as acceptable
- **Remove**: Delete content with reason
- **Edit**: Modify content (rare cases)
- **Lock**: Prevent further comments/interactions
- **Pin**: Highlight important community content
- **Archive**: Move old content to archives

**Bulk Moderation:**
- **Mass Content Removal**: Remove multiple related posts
- **Thread Locking**: Lock entire comment threads
- **Community Cleanup**: Remove spam from entire communities
- **User Content Purge**: Remove all content from specific users

### Moderation Tools

**Review Interface:**
- **Content Preview**: View full context of reported content
- **User History**: Quick access to user's moderation history
- **Community Context**: Understand community-specific rules
- **Similar Content**: Find related posts or patterns
- **Collaboration Tools**: Work with other moderators

**Communication Tools:**
- **Removal Reason Templates**: Standardized removal explanations
- **Warning Message System**: Escalating warning messages
- **Appeal Response Templates**: Standard appeal responses
- **Community Announcements**: Inform communities of policy changes

### Content Policies

**Platform-Wide Policies:**
- **Hate Speech**: Prohibited content targeting individuals/groups
- **Harassment**: Bullying, doxxing, targeted abuse
- **Violence**: Graphic violence, threats, self-harm
- **Spam**: Repetitive, commercial, or manipulative content
- **Misinformation**: Deliberately false or misleading information
- **Adult Content**: NSFW content outside designated areas
- **Copyright**: Unauthorized copyrighted material

**Community-Specific Rules:**
- **Topic Relevance**: On-topic posting requirements
- **Quality Standards**: Minimum effort or quality requirements
- **Civility Rules**: Community-specific behavior expectations
- **Formatting Guidelines**: Post structure and formatting rules

### Appeals Process

**Appeal Handling:**
1. **Appeal Submission**: User submits appeal with reasoning
2. **Initial Review**: Check original moderation decision
3. **Evidence Gathering**: Collect additional context if needed
4. **Decision**: Uphold, modify, or reverse original action
5. **Communication**: Inform user of final decision
6. **Documentation**: Record appeal and decision for future reference

**Appeal Outcomes:**
- **Uphold**: Original decision stands
- **Modify**: Reduce severity of original action
- **Reverse**: Completely overturn original decision
- **Partial Reverse**: Restore some but not all content/privileges

## Community Management

### Community Overview

**Community Metrics:**
- **Member Count**: Total and active members
- **Growth Rate**: New member acquisition
- **Engagement**: Posts, comments, upvotes per day
- **Retention**: Member activity over time
- **Health Score**: Overall community health metric

**Community Information:**
- **Description and Rules**: Community purpose and guidelines
- **Moderator Team**: List of community moderators
- **Category and Tags**: Community classification
- **Visibility Settings**: Public, private, or restricted access
- **Creation Date**: When community was established

### Community Settings

**Basic Settings:**
- **Name and Description**: Community branding
- **Icon and Banner**: Visual identity
- **Category**: Primary topic classification
- **Visibility**: Public, private, or invite-only
- **Membership**: Open, approval required, or invite-only

**Advanced Settings:**
- **Posting Permissions**: Who can create posts
- **Comment Settings**: Comment restrictions and requirements
- **Vote Settings**: Upvote/downvote configurations
- **Media Settings**: Image and video upload permissions
- **Bot Integration**: Automated moderation bots

**Content Settings:**
- **NSFW Marking**: Adult content designation
- **Spoiler Requirements**: Spoiler tag enforcement
- **Link Permissions**: External link posting rules
- **Crosspost Settings**: Allow crossposting to/from community
- **Archive Settings**: Post archiving timeframes

### Community Moderation

**Moderator Management:**
- **Add Moderators**: Invite new community moderators
- **Remove Moderators**: Revoke moderator privileges
- **Permissions**: Set specific moderator capabilities
- **Activity Monitoring**: Track moderator actions
- **Training Resources**: Provide moderation guidelines

**Community Rules:**
- **Rule Creation**: Add custom community rules
- **Rule Enforcement**: Automated and manual enforcement
- **Rule Templates**: Use platform standard rule sets
- **Rule Communication**: Ensure members understand rules
- **Rule Updates**: Modify rules with community notification

**Automated Moderation:**
- **AutoModerator**: Set up automated moderation rules
- **Keyword Filters**: Community-specific word filters
- **Spam Protection**: Anti-spam measures
- **New User Restrictions**: Limit new member activities
- **Rate Limiting**: Prevent spam posting

### Community Analytics

**Growth Metrics:**
- Member acquisition and retention rates
- Post and comment volume trends
- Engagement rate changes over time
- Most active posting times and days
- Geographic member distribution

**Content Analytics:**
- Top performing posts and topics
- Most active discussion threads
- Content type preferences (text, image, video)
- External link sharing patterns
- Crosspost activity analysis

**Member Behavior:**
- Most active members and contributors
- Member interaction patterns
- Community role distribution
- Feature usage statistics
- Moderation action frequency

### Community Health Tools

**Health Monitoring:**
- **Activity Levels**: Monitor community engagement
- **Toxicity Scores**: Track negative behavior trends
- **Moderator Response Time**: Measure moderation efficiency
- **Member Satisfaction**: Survey and feedback analysis
- **Growth Sustainability**: Assess long-term viability

**Intervention Tools:**
- **Community Spotlights**: Promote healthy communities
- **Moderator Support**: Additional resources for struggling communities
- **Community Mergers**: Combine similar or inactive communities
- **Quarantine**: Restrict community visibility for policy violations
- **Closure**: Permanently close communities if necessary

## System Monitoring

### Real-Time Monitoring

**System Health Dashboard:**
- **Server Status**: All application servers online status
- **Database Performance**: Query times, connections, locks
- **Cache Performance**: Redis hit rates, memory usage
- **API Response Times**: Endpoint performance metrics
- **WebSocket Connections**: Real-time connection status
- **Error Rates**: Application and system error tracking

**Performance Metrics:**
- **CPU Usage**: Per-server CPU utilization
- **Memory Usage**: RAM consumption and available memory
- **Disk Space**: Storage usage and available space
- **Network Traffic**: Bandwidth utilization and patterns
- **Load Average**: System load and capacity utilization

### Application Monitoring

**API Monitoring:**
- **Endpoint Performance**: Response times for all API endpoints
- **Request Volume**: API calls per minute/hour/day
- **Error Tracking**: 4xx and 5xx error rates and details
- **Authentication**: Login success/failure rates
- **Rate Limiting**: API rate limit hit frequency

**Database Monitoring:**
- **Query Performance**: Slow query identification
- **Connection Pool**: Database connection utilization
- **Index Usage**: Database index efficiency
- **Replication Lag**: Master-slave replication delays
- **Backup Status**: Backup completion and integrity

**Cache Monitoring:**
- **Hit/Miss Ratios**: Cache effectiveness metrics
- **Memory Usage**: Redis memory consumption
- **Key Expiration**: Cache key lifecycle tracking
- **Connection Count**: Redis client connections
- **Command Statistics**: Most used Redis commands

### Security Monitoring

**Security Events:**
- **Failed Login Attempts**: Brute force attack detection
- **Suspicious Activity**: Unusual user behavior patterns
- **API Abuse**: Abnormal API usage patterns
- **Content Violations**: Policy violation trending
- **Account Takeovers**: Potential compromised accounts

**System Security:**
- **SSL Certificate Status**: Certificate expiration monitoring
- **Firewall Logs**: Network security event tracking
- **Intrusion Detection**: System compromise indicators
- **Vulnerability Scanning**: Regular security assessments
- **Compliance Monitoring**: GDPR, CCPA compliance tracking

### Alerting System

**Alert Categories:**
- **Critical**: System down, data loss, security breaches
- **High**: Performance degradation, high error rates
- **Medium**: Resource usage warnings, slow queries
- **Low**: Informational alerts, maintenance notifications

**Alert Channels:**
- **Email**: Detailed alert emails to admin team
- **SMS**: Critical alerts via text message
- **Slack/Discord**: Team communication channels
- **Dashboard**: Visual alerts in admin panel
- **PagerDuty**: Integration with incident management

**Alert Configuration:**
- **Threshold Settings**: Customize alert trigger points
- **Escalation Rules**: Automatic escalation procedures
- **Acknowledgment**: Alert acknowledgment system
- **Snoozing**: Temporary alert suppression
- **Resolution Tracking**: Alert lifecycle management

### Log Management

**Log Aggregation:**
- **Application Logs**: API, web, and worker service logs
- **System Logs**: Server and infrastructure logs
- **Security Logs**: Authentication and security events
- **Audit Logs**: Administrative action tracking
- **Performance Logs**: Detailed performance metrics

**Log Analysis:**
- **Search and Filter**: Advanced log search capabilities
- **Pattern Recognition**: Identify recurring issues
- **Correlation**: Link related events across services
- **Trending**: Identify patterns over time
- **Export**: Download logs for external analysis

## Troubleshooting Guide

### Common Issues and Solutions

#### Database Issues

**Problem: Slow Database Queries**
```sql
-- Identify slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
AND correlation < 0.1;
```

**Solutions:**
- Add appropriate database indexes
- Optimize query structure
- Increase database memory allocation
- Consider query caching

**Problem: Database Connection Exhaustion**
```bash
# Check current connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check connection limits
sudo -u postgres psql -c "SHOW max_connections;"
```

**Solutions:**
- Implement connection pooling (PgBouncer)
- Increase max_connections setting
- Optimize application connection handling
- Identify and fix connection leaks

#### Redis Issues

**Problem: High Memory Usage**
```bash
# Check Redis memory usage
redis-cli info memory

# Identify large keys
redis-cli --bigkeys

# Check key expiration
redis-cli ttl key_name
```

**Solutions:**
- Implement key expiration policies
- Use appropriate data structures
- Enable Redis compression
- Monitor and clean up large keys

**Problem: Redis Connection Timeouts**
```bash
# Check Redis status
redis-cli ping

# Monitor connections
redis-cli info clients
```

**Solutions:**
- Increase connection timeout settings
- Implement connection retry logic
- Monitor Redis server performance
- Check network connectivity

#### Application Issues

**Problem: High API Response Times**
```bash
# Check PM2 process status
pm2 status

# Monitor application logs
pm2 logs cryb-api --lines 100

# Check system resources
htop
```

**Solutions:**
- Scale API instances horizontally
- Optimize slow API endpoints
- Implement response caching
- Add performance monitoring

**Problem: WebSocket Connection Issues**
```bash
# Check WebSocket connections
netstat -an | grep :3001 | grep ESTABLISHED | wc -l

# Monitor socket.io logs
pm2 logs cryb-api | grep socket
```

**Solutions:**
- Implement sticky sessions for load balancing
- Check firewall and proxy settings
- Monitor WebSocket connection limits
- Implement connection fallback mechanisms

#### System Resource Issues

**Problem: High CPU Usage**
```bash
# Identify CPU-intensive processes
top -o %CPU

# Check system load
uptime

# Monitor process CPU usage
ps aux --sort=-%cpu | head -10
```

**Solutions:**
- Scale horizontally with more instances
- Optimize CPU-intensive operations
- Implement caching to reduce processing
- Profile application for performance bottlenecks

**Problem: High Memory Usage**
```bash
# Check memory usage
free -h

# Identify memory-intensive processes
ps aux --sort=-%mem | head -10

# Check for memory leaks
valgrind --tool=memcheck application
```

**Solutions:**
- Implement memory limits for processes
- Identify and fix memory leaks
- Optimize memory usage in applications
- Add more RAM to servers

### Diagnostic Tools and Commands

**System Diagnostics:**
```bash
# System health check
sudo /home/cryb/scripts/system-health.sh

# Comprehensive system info
sudo lshw -short

# Disk usage analysis
sudo du -sh /var/log/* | sort -hr

# Network connectivity test
sudo netstat -tulpn | grep LISTEN
```

**Application Diagnostics:**
```bash
# Application health checks
curl -s http://localhost:3001/health | jq
curl -s http://localhost:3000/api/health | jq

# Database connectivity test
pg_isready -h localhost -p 5432 -U cryb

# Redis connectivity test
redis-cli ping
```

**Performance Analysis:**
```bash
# System performance snapshot
sudo sar -u 1 10  # CPU usage
sudo sar -r 1 10  # Memory usage
sudo sar -d 1 10  # Disk I/O

# Network performance
sudo iftop -i eth0
sudo nethogs
```

### Emergency Procedures

#### Service Recovery

**API Service Down:**
1. Check PM2 process status: `pm2 status`
2. Restart API service: `pm2 restart cryb-api`
3. Check logs for errors: `pm2 logs cryb-api`
4. Verify health endpoint: `curl http://localhost:3001/health`
5. If persistent, check database and Redis connectivity

**Database Issues:**
1. Check PostgreSQL status: `sudo systemctl status postgresql`
2. Restart if needed: `sudo systemctl restart postgresql`
3. Check disk space: `df -h`
4. Verify database connectivity: `pg_isready`
5. Check for corrupted tables: `sudo -u postgres psql -c "SELECT * FROM pg_stat_database;"`

**Full System Recovery:**
```bash
# Stop all services
sudo systemctl stop nginx
pm2 stop all
sudo systemctl stop postgresql
sudo systemctl stop redis

# Check and fix disk space if needed
sudo find /var/log -name "*.log" -type f -mtime +7 -delete

# Restart services in order
sudo systemctl start postgresql
sudo systemctl start redis
pm2 start ecosystem.config.js
sudo systemctl start nginx

# Verify all services
sudo /home/cryb/scripts/health-check.sh
```

#### Data Recovery

**Database Backup Restoration:**
```bash
# Stop API services
pm2 stop cryb-api

# Restore from backup
sudo -u postgres dropdb cryb
sudo -u postgres createdb cryb
sudo -u postgres psql cryb < /var/backups/cryb/latest_backup.sql

# Restart services
pm2 start cryb-api
```

**File Recovery:**
```bash
# Restore media files from backup
sudo rsync -av /var/backups/cryb/media/latest/ /var/uploads/cryb/

# Fix permissions
sudo chown -R cryb:cryb /var/uploads/cryb
sudo chmod -R 755 /var/uploads/cryb
```

### Support and Escalation

**Internal Support:**
- **Level 1**: Basic troubleshooting, user support
- **Level 2**: Technical issues, system administration
- **Level 3**: Database issues, security incidents
- **Emergency**: Critical system failures, data loss

**External Support:**
- **Hosting Provider**: Infrastructure issues
- **Database Support**: PostgreSQL enterprise support
- **Security Team**: Security incidents and investigations
- **Legal Team**: DMCA, compliance, and legal issues

**Documentation:**
- **Runbooks**: Detailed procedures for common issues
- **Architecture Docs**: System design and dependencies
- **Contact Lists**: Emergency contact information
- **Escalation Procedures**: When and how to escalate issues

---

This admin guide provides comprehensive coverage of administrative functions for the CRYB Platform. Regular review and updates ensure effective platform management and user experience.

**Best Practices:**
- Regular monitoring and maintenance
- Proactive issue identification and resolution
- Clear communication with users about policies and changes
- Continuous improvement of moderation processes
- Security-first approach to all administrative actions

**Training Resources:**
- Platform administrator training modules
- Community management best practices
- Moderation guidelines and procedures
- Emergency response training
- Regular policy update training

**Last Updated**: September 2025  
**Version**: 1.0  
**Platform Version**: 0.0.1