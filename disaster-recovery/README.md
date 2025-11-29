# CRYB Platform Disaster Recovery System

## Overview

The CRYB Platform Disaster Recovery System provides comprehensive disaster recovery capabilities for the CRYB platform, including automated detection, orchestrated recovery procedures, and detailed incident reporting.

## Quick Start

### Emergency Recovery

For immediate disaster recovery, run the master recovery script:

```bash
sudo /home/ubuntu/cryb-platform/disaster-recovery/scripts/master-recovery.sh
```

The script will automatically:
1. Detect the disaster scenario
2. Execute appropriate recovery procedures
3. Validate recovery success
4. Generate detailed reports

### Manual Recovery

For specific scenarios, use individual recovery scripts:

```bash
# Database recovery
sudo ./scripts/database-recovery.sh auto

# Application recovery
sudo ./scripts/application-recovery.sh full

# Security breach recovery
sudo ./scripts/security-recovery.sh

# Complete infrastructure recovery
sudo ./scripts/complete-recovery.sh
```

## Directory Structure

```
disaster-recovery/
├── README.md                    # This file
├── procedures/
│   └── DISASTER_RECOVERY_PLAN.md  # Comprehensive recovery procedures
├── config/
│   └── recovery.conf            # Recovery configuration
├── scripts/
│   ├── master-recovery.sh       # Main orchestration script
│   ├── database-recovery.sh     # Database-specific recovery
│   ├── application-recovery.sh  # Application recovery
│   ├── complete-recovery.sh     # Complete infrastructure recovery
│   └── security-recovery.sh     # Security breach recovery
└── tests/
    └── recovery-tests.sh        # Recovery procedure tests
```

## Recovery Scenarios

### 1. Database Failure
- **Detection**: Database connectivity lost, API health checks failing
- **Recovery**: Automatic failover to standby or restore from backup
- **RTO**: 1 hour
- **RPO**: 15 minutes

### 2. Application Failure
- **Detection**: API/Web services not responding
- **Recovery**: Container restart, rollback, or rebuild
- **RTO**: 2 hours
- **RPO**: 1 hour

### 3. Security Breach
- **Detection**: Security indicators, unusual activity
- **Recovery**: Isolation, forensics, clean rebuild
- **RTO**: 4 hours
- **RPO**: Variable (data integrity dependent)

### 4. Complete Infrastructure Failure
- **Detection**: Multiple system failures
- **Recovery**: Full infrastructure rebuild
- **RTO**: 4-8 hours
- **RPO**: 1 hour

## Configuration

Edit `/home/ubuntu/cryb-platform/disaster-recovery/config/recovery.conf` to customize:

- Database connection settings
- Backup directories and retention
- Notification webhooks
- Recovery timeouts and thresholds
- Security settings

### Key Configuration Options

```bash
# Recovery Objectives
RTO_CRITICAL=3600     # 1 hour for critical services
RPO_DATABASE=900      # 15 minutes for database

# Backup Configuration
BACKUP_DIR="/backup"
CLEAN_BACKUP_DIR="/backup/clean"

# Notifications
NOTIFICATION_WEBHOOK="https://hooks.slack.com/..."
SECURITY_WEBHOOK="https://hooks.slack.com/..."
```

## Prerequisites

### System Requirements
- Ubuntu 20.04 LTS or later
- Docker and Docker Compose
- PostgreSQL client tools
- Root or sudo access

### Required Tools
```bash
# Install required tools
sudo apt update
sudo apt install -y postgresql-client curl wget tar gzip
```

### Backup Setup
```bash
# Create backup directories
sudo mkdir -p /backup/{database,application,clean}
sudo chown -R ubuntu:ubuntu /backup
```

## Usage Examples

### Scenario Detection
The master recovery script automatically detects scenarios:

```bash
# Automatic scenario detection and recovery
sudo ./scripts/master-recovery.sh

# Force specific scenario
sudo ./scripts/database-recovery.sh auto
sudo ./scripts/application-recovery.sh full
```

### Point-in-Time Recovery
```bash
# Database point-in-time recovery
sudo ./scripts/database-recovery.sh pitr "2024-01-15 14:30:00"
```

### Security Incident Response
```bash
# Immediate security response
sudo ./scripts/security-recovery.sh
```

## Monitoring and Alerts

### Log Locations
- **Recovery Logs**: `/var/log/disaster-recovery/`
- **Application Logs**: `/var/log/cryb/`
- **System Logs**: `/var/log/syslog`

### Monitoring Integration
The recovery system integrates with:
- Prometheus for metrics collection
- Grafana for visualization
- Slack/Teams for notifications
- Status page updates

### Health Checks
```bash
# Check system health
curl http://localhost:3002/api/health

# Check database connectivity
pg_isready -h localhost -p 5432

# Check all services
docker-compose ps
```

## Testing and Validation

### Recovery Testing
```bash
# Run recovery tests
sudo ./tests/recovery-tests.sh

# Test specific scenario
sudo ./tests/recovery-tests.sh database
```

### Validation Checks
The system performs automatic validation:
- Database connectivity and integrity
- API health and functionality
- Web application accessibility
- Admin panel availability
- Data consistency checks

## Security Considerations

### Access Control
- Recovery scripts require root/sudo access
- Sensitive configuration stored securely
- Audit logging enabled for all recovery operations

### Forensics and Evidence
During security incidents:
- Complete system state captured
- Memory dumps preserved
- Network traffic analyzed
- File integrity verified

### Compliance
- GDPR/CCPA compliance procedures
- SOC 2 Type II requirements
- Incident documentation and reporting

## Troubleshooting

### Common Issues

#### Recovery Script Fails
```bash
# Check prerequisites
sudo ./scripts/master-recovery.sh --validate

# Check logs
tail -f /var/log/disaster-recovery/recovery.log

# Manual validation
sudo ./scripts/master-recovery.sh --validate-only
```

#### Database Recovery Issues
```bash
# Check database status
pg_isready -h localhost -p 5432

# Check available backups
ls -la /backup/database/

# Manual database recovery
sudo ./scripts/database-recovery.sh backup /path/to/backup.sql
```

#### Service Start Failures
```bash
# Check Docker status
docker ps -a

# Check container logs
docker-compose logs api web admin

# Rebuild containers
sudo ./scripts/application-recovery.sh rebuild
```

### Recovery Validation Failures
If recovery validation fails:

1. **Check Service Status**
   ```bash
   docker-compose ps
   systemctl status docker
   ```

2. **Review Logs**
   ```bash
   tail -100 /var/log/disaster-recovery/recovery.log
   docker-compose logs --tail=50
   ```

3. **Manual Service Restart**
   ```bash
   docker-compose restart api web
   ```

4. **Database Connectivity**
   ```bash
   psql -h localhost -p 5432 -U cryb_user -d cryb_platform -c "SELECT 1;"
   ```

## Maintenance

### Regular Tasks
- **Weekly**: Test backup restoration
- **Monthly**: Full recovery drill
- **Quarterly**: Update recovery procedures
- **Annually**: Comprehensive DR review

### Backup Maintenance
```bash
# Cleanup old backups
find /backup -type f -mtime +30 -delete

# Verify backup integrity
sudo ./scripts/backup-validation.sh
```

### Configuration Updates
After system changes:
1. Update recovery configuration
2. Test recovery procedures
3. Update documentation
4. Train team members

## Support and Escalation

### Emergency Contacts
- **Technical Lead**: [Contact Information]
- **Security Team**: [Contact Information]
- **Management**: [Contact Information]

### Escalation Procedures
1. **Level 1** (0-30 min): On-call engineer
2. **Level 2** (30-60 min): Technical lead + Incident commander
3. **Level 3** (60+ min): CTO + Senior management
4. **External** (2+ hours): Vendor support + Legal team

## Documentation

### Key Documents
- [Disaster Recovery Plan](procedures/DISASTER_RECOVERY_PLAN.md)
- [Recovery Configuration](config/recovery.conf)
- [Security Incident Response](procedures/SECURITY_INCIDENT_RESPONSE.md)

### Recovery Reports
All recovery operations generate detailed reports:
- Timeline and actions taken
- Success/failure status
- Performance metrics
- Lessons learned
- Recommendations

## Version History

- **v1.0** - Initial disaster recovery implementation
- Comprehensive recovery scenarios
- Automated detection and response
- Security incident handling
- Complete infrastructure recovery

---

**Important**: This disaster recovery system is critical infrastructure. Test all procedures regularly and keep documentation updated. For emergency situations, prioritize system recovery over documentation.