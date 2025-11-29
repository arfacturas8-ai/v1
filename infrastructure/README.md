# CRYB Platform - Enterprise Infrastructure

## Overview

This repository contains the complete enterprise-grade infrastructure for the CRYB Platform, a Facebook/Discord-scale social platform designed to handle millions of concurrent users. The infrastructure is built using modern DevOps practices with Kubernetes, Terraform, and comprehensive monitoring and security.

## 🏗️ Architecture Overview

### Core Components

- **Multi-Region EKS Clusters**: Production and disaster recovery clusters across AWS regions
- **Auto-Scaling Infrastructure**: KEDA, HPA, VPA, and Cluster Autoscaler for dynamic scaling
- **Service Mesh**: Istio for secure service-to-service communication
- **Monitoring Stack**: Prometheus, Grafana, and AlertManager for observability
- **Logging Stack**: Elasticsearch, Logstash, and Kibana (ELK) for centralized logging
- **Security Suite**: HashiCorp Vault, Falco, OPA Gatekeeper, and comprehensive security policies
- **Database Clusters**: PostgreSQL with TimescaleDB and Redis with high availability
- **CI/CD Pipelines**: GitHub Actions with security scanning and blue-green deployments

### Scaling Capabilities

- **API Services**: 6-200 pods with auto-scaling based on CPU, memory, and custom metrics
- **Database**: Multi-AZ clusters with automatic failover and read replicas
- **Real-time Services**: Dedicated nodes for voice/video communication
- **Monitoring**: 30-day retention with advanced alerting

## 📁 Directory Structure

```
infrastructure/
├── terraform/                    # Infrastructure as Code
│   ├── main.tf                  # Main Terraform configuration
│   ├── eks-cluster.tf           # EKS cluster configuration
│   ├── variables.tf             # Terraform variables
│   ├── autoscaling.tf           # Auto-scaling configuration
│   ├── cdn.tf                   # CloudFront CDN setup
│   └── iam.tf                   # IAM roles and policies
├── kubernetes/                   # Kubernetes manifests
│   ├── clusters/                # EKS cluster definitions
│   │   ├── eks-primary.yaml    # Primary cluster configuration
│   │   └── eks-secondary.yaml  # Secondary cluster configuration
│   ├── manifests/               # Application manifests
│   │   ├── 00-namespaces.yaml
│   │   ├── 01-api-deployment.yaml
│   │   ├── 02-database-cluster.yaml
│   │   ├── 03-monitoring-prometheus.yaml
│   │   ├── 04-logging-elk.yaml
│   │   ├── 05-istio-service-mesh.yaml
│   │   ├── 06-security-compliance.yaml
│   │   └── 07-autoscaling-performance.yaml
│   ├── helm-charts/             # Helm chart configurations
│   ├── operators/               # Kubernetes operators
│   ├── security/                # Security policies and configurations
│   ├── monitoring/              # Monitoring configurations
│   └── networking/              # Network policies and configurations
├── .github/workflows/           # CI/CD pipelines
│   ├── ci-cd-production.yml    # Production deployment pipeline
│   └── security-scanning.yml   # Security scanning pipeline
└── deploy-enterprise-infrastructure.sh  # Main deployment script
```

##  Quick Start

### Prerequisites

Before deploying the infrastructure, ensure you have the following tools installed:

- **AWS CLI** (v2.x)
- **kubectl** (v1.28+)
- **Terraform** (v1.0+)
- **Helm** (v3.13+)
- **eksctl** (v0.150+)
- **Docker** (v20.x+)

### AWS Setup

1. Configure AWS credentials:
```bash
aws configure
```

2. Create S3 bucket for Terraform state:
```bash
aws s3 mb s3://cryb-terraform-state
```

3. Create DynamoDB table for state locking:
```bash
aws dynamodb create-table \
    --table-name terraform-locks \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

### Deployment

1. Clone the repository:
```bash
git clone https://github.com/your-org/cryb-platform.git
cd cryb-platform/infrastructure
```

2. Set environment variables:
```bash
export AWS_REGION=us-east-1
export ENVIRONMENT=production
```

3. Deploy the complete infrastructure:
```bash
./deploy-enterprise-infrastructure.sh
```

### Advanced Deployment Options

Deploy with custom configuration:
```bash
./deploy-enterprise-infrastructure.sh \
    --environment staging \
    --region us-west-2 \
    --skip-secondary
```

Deploy only specific components:
```bash
# Skip Terraform (if already deployed)
./deploy-enterprise-infrastructure.sh --skip-terraform

# Deploy to single region
./deploy-enterprise-infrastructure.sh --skip-secondary
```

## 🏭 Production Deployment

### Step-by-Step Production Deployment

1. **Infrastructure Planning**
   ```bash
   cd terraform
   terraform plan -var="environment=production"
   ```

2. **Security Validation**
   ```bash
   # Run security scans
   .github/workflows/security-scanning.yml
   ```

3. **Infrastructure Deployment**
   ```bash
   ./deploy-enterprise-infrastructure.sh --environment production
   ```

4. **Post-Deployment Validation**
   ```bash
   # Run health checks
   kubectl get pods --all-namespaces
   kubectl get svc --all-namespaces
   ```

##  Monitoring and Observability

### Access Monitoring Dashboards

- **Grafana**: https://monitoring.cryb.ai
  - Default credentials: admin / [check secret]
  - Pre-configured dashboards for API, database, and infrastructure metrics

- **Kibana**: https://logs.cryb.ai
  - Centralized logging from all components
  - Real-time log analysis and alerting

- **Prometheus**: Internal access only
  - Metrics collection and alerting
  - Custom metrics for business logic

### Key Metrics to Monitor

1. **Application Metrics**
   - Request rate and latency
   - Error rates and availability
   - Active user connections
   - WebSocket connections

2. **Infrastructure Metrics**
   - Node resource utilization
   - Pod scaling events
   - Network traffic and latency
   - Storage utilization

3. **Database Metrics**
   - Connection pool utilization
   - Query performance
   - Replication lag
   - Cache hit rates

##  Security Features

### Security Components

1. **Network Security**
   - VPC with private/public subnets
   - Security groups and NACLs
   - Network policies with Istio

2. **Identity and Access Management**
   - RBAC with Kubernetes
   - Service accounts with minimal permissions
   - AWS IAM roles for service accounts (IRSA)

3. **Secrets Management**
   - HashiCorp Vault for secrets storage
   - External Secrets Operator for Kubernetes integration
   - Encrypted secrets at rest and in transit

4. **Runtime Security**
   - Falco for runtime threat detection
   - OPA Gatekeeper for policy enforcement
   - Pod security standards and contexts

5. **Compliance and Auditing**
   - CIS Kubernetes benchmark with kube-bench
   - Audit logging for all cluster activities
   - Security scanning in CI/CD pipelines

### Security Best Practices

1. **Network Security**
   - All inter-service communication encrypted with mTLS
   - Network segmentation with Istio
   - Ingress/egress traffic controls

2. **Container Security**
   - Non-root containers
   - Read-only root filesystems
   - Minimal base images
   - Regular vulnerability scanning

3. **Data Security**
   - Encryption at rest for all storage
   - Encrypted backups
   - Secure data transmission

## 🔄 CI/CD Pipelines

### GitHub Actions Workflows

1. **Production CI/CD Pipeline** (`.github/workflows/ci-cd-production.yml`)
   - Automated testing and quality gates
   - Security scanning with multiple tools
   - Blue-green deployments with rollback
   - Multi-region deployment

2. **Security Scanning Pipeline** (`.github/workflows/security-scanning.yml`)
   - Dependency vulnerability scanning
   - Container security scanning
   - Infrastructure security scanning (Terraform, Kubernetes)
   - Secret scanning
   - SAST/DAST security testing

### Deployment Strategies

1. **Blue-Green Deployment**
   - Zero-downtime deployments
   - Automatic rollback on failure
   - Traffic switching with Istio

2. **Canary Deployment**
   - Progressive traffic shifting
   - Real-time monitoring and validation
   - Automatic promotion or rollback

## ⚖️ Auto-Scaling Configuration

### Horizontal Pod Autoscaler (HPA)

- **API Services**: Scale based on CPU (70%), memory (80%), and custom metrics
- **Real-time Services**: Scale based on active connections and CPU (60%)
- **Database Replicas**: Scale based on connection count and query load

### Vertical Pod Autoscaler (VPA)

- Automatic resource optimization
- Right-sizing for cost efficiency
- Performance optimization

### Cluster Autoscaler

- Node-level scaling based on pod requirements
- Multi-AZ scaling for high availability
- Cost optimization with spot instances

### KEDA (Advanced Auto-scaling)

- Event-driven scaling
- Support for 50+ scalers
- Custom metrics from Prometheus, Redis, PostgreSQL

## 💾 Database Management

### PostgreSQL Cluster

- **Primary-Replica Setup**: 1 primary + 2 read replicas
- **High Availability**: Automatic failover with streaming replication
- **TimescaleDB**: For time-series data and analytics
- **Backup Strategy**: Automated daily backups with 30-day retention

### Redis Cluster

- **High Availability**: Master-replica setup with Sentinel
- **Persistence**: AOF and RDB backup strategies
- **Monitoring**: Real-time performance metrics
- **Scaling**: Horizontal scaling with sharding support

##  Networking and Service Mesh

### Istio Service Mesh

- **Traffic Management**: Load balancing, retries, timeouts
- **Security**: mTLS, authorization policies, JWT validation
- **Observability**: Distributed tracing, metrics collection
- **Resilience**: Circuit breakers, fault injection

### Network Policies

- **Namespace Isolation**: Default deny-all policies
- **Service-to-Service Communication**: Explicit allow rules
- **External Access**: Controlled egress for external services
- **Monitoring Traffic**: Dedicated network policies

##  Performance Optimization

### System-Level Optimizations

- **Kernel Parameters**: Optimized for high-concurrency workloads
- **Network Stack**: BBR congestion control, optimized TCP settings
- **Memory Management**: Optimized VM settings for containerized workloads
- **File System**: Optimized I/O for database and logging workloads

### Application-Level Optimizations

- **Connection Pooling**: Optimized database and Redis connections
- **Caching Strategies**: Multi-level caching with Redis
- **Load Balancing**: Intelligent routing with Istio
- **Resource Allocation**: Right-sized containers with VPA

## 🚨 Alerting and Incident Response

### Alert Categories

1. **Critical Alerts**
   - Service unavailability
   - High error rates (>5%)
   - Database connectivity issues
   - Security incidents

2. **Warning Alerts**
   - High resource utilization (>80%)
   - Slow response times (>2s)
   - Scaling events
   - Certificate expiration

3. **Information Alerts**
   - Deployment notifications
   - Backup completion
   - Scheduled maintenance

### Alert Channels

- **Slack**: Real-time notifications for development team
- **Email**: Daily/weekly summaries and critical alerts
- **PagerDuty**: On-call rotation for critical incidents
- **SMS**: High-priority alerts for production issues

##  Troubleshooting

### Common Issues

1. **Pod Startup Failures**
   ```bash
   kubectl describe pod <pod-name> -n <namespace>
   kubectl logs <pod-name> -n <namespace> --previous
   ```

2. **Service Discovery Issues**
   ```bash
   kubectl get svc -n <namespace>
   kubectl get endpoints -n <namespace>
   nslookup <service-name>.<namespace>.svc.cluster.local
   ```

3. **Network Connectivity**
   ```bash
   kubectl exec -it <pod-name> -n <namespace> -- nslookup kubernetes.default
   kubectl exec -it <pod-name> -n <namespace> -- curl -I <service-url>
   ```

4. **Database Connection Issues**
   ```bash
   kubectl exec -it cryb-postgres-primary-0 -n cryb-database -- psql -U cryb_admin -d cryb
   kubectl logs cryb-postgres-primary-0 -n cryb-database
   ```

### Debug Commands

```bash
# Cluster health
kubectl get nodes
kubectl top nodes
kubectl get events --sort-by=.metadata.creationTimestamp

# Application status
kubectl get pods --all-namespaces -o wide
kubectl get hpa --all-namespaces
kubectl get vpa --all-namespaces

# Service mesh status
istioctl proxy-status
istioctl analyze

# Monitoring access
kubectl port-forward svc/grafana 3000:3000 -n cryb-monitoring
kubectl port-forward svc/prometheus 9090:9090 -n cryb-monitoring
```

## 📚 Additional Resources

### Documentation Links

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Istio Documentation](https://istio.io/latest/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [KEDA Documentation](https://keda.sh/docs/)
- [HashiCorp Vault Documentation](https://www.vaultproject.io/docs)

### Best Practices Guides

- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)
- [Production-Ready Checklist](https://learnk8s.io/production-best-practices)
- [Monitoring Best Practices](https://prometheus.io/docs/practices/)

## 🤝 Contributing

### Development Workflow

1. Create feature branch from `main`
2. Make changes and test locally
3. Run security scans and linting
4. Submit pull request with description
5. Automated CI/CD pipeline validation
6. Code review and approval
7. Merge to main triggers deployment

### Testing Infrastructure Changes

```bash
# Validate Terraform changes
cd terraform
terraform validate
terraform plan

# Test Kubernetes manifests
kubectl apply --dry-run=client -f kubernetes/manifests/

# Run security scans
./scripts/security-scan.sh

# Performance testing
kubectl apply -f kubernetes/manifests/07-autoscaling-performance.yaml
```

## 📞 Support

### Emergency Contacts

- **On-Call Engineer**: [PagerDuty rotation]
- **Platform Team Lead**: platform-team@cryb.ai
- **Security Team**: security@cryb.ai

### Support Channels

- **Slack**: #platform-support
- **Email**: platform-support@cryb.ai
- **Documentation**: https://docs.cryb.ai
- **Status Page**: https://status.cryb.ai

---

**Note**: This infrastructure is designed for production-scale deployment. Always test changes in a staging environment before applying to production. Follow the principle of least privilege and maintain security best practices.

For questions or issues, please contact the Platform Engineering team or create an issue in this repository.