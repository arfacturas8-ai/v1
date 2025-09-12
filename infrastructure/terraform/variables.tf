# ==============================================
# TERRAFORM VARIABLES
# ==============================================

variable "aws_region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., production, staging, development)"
  type        = string
  default     = "production"
  
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be production, staging, or development."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# ==============================================
# ECS CONFIGURATION
# ==============================================

variable "fargate_cpu" {
  description = "Fargate instance CPU units to provision (1 vCPU = 1024 CPU units)"
  type        = number
  default     = 1024
}

variable "fargate_memory" {
  description = "Fargate instance memory to provision (in MiB)"
  type        = number
  default     = 2048
}

variable "app_count" {
  description = "Number of docker containers to run"
  type        = number
  default     = 2
}

# ==============================================
# DATABASE CONFIGURATION
# ==============================================

variable "db_instance_class" {
  description = "The instance class for the RDS database"
  type        = string
  default     = "db.r6g.large"
}

variable "db_allocated_storage" {
  description = "The amount of storage to allocate for the RDS database (GB)"
  type        = number
  default     = 100
}

variable "db_max_allocated_storage" {
  description = "The upper limit to which Amazon RDS can automatically scale the storage"
  type        = number
  default     = 1000
}

# ==============================================
# REDIS CONFIGURATION
# ==============================================

variable "redis_node_type" {
  description = "The compute and memory capacity of the nodes in the Redis cluster"
  type        = string
  default     = "cache.r6g.large"
}

# ==============================================
# DOMAIN CONFIGURATION
# ==============================================

variable "domain_name" {
  description = "The domain name for the application"
  type        = string
  default     = "cryb.ai"
}

variable "api_subdomain" {
  description = "The subdomain for the API"
  type        = string
  default     = "api"
}

variable "livekit_subdomain" {
  description = "The subdomain for LiveKit"
  type        = string
  default     = "livekit"
}

variable "monitoring_subdomain" {
  description = "The subdomain for monitoring"
  type        = string
  default     = "monitoring"
}

variable "storage_subdomain" {
  description = "The subdomain for storage"
  type        = string
  default     = "storage"
}

# ==============================================
# SSL CONFIGURATION
# ==============================================

variable "create_acm_certificate" {
  description = "Whether to create ACM certificate"
  type        = bool
  default     = true
}

# ==============================================
# CLOUDFRONT CONFIGURATION
# ==============================================

variable "cloudfront_price_class" {
  description = "CloudFront distribution price class"
  type        = string
  default     = "PriceClass_100"
  
  validation {
    condition     = contains(["PriceClass_All", "PriceClass_200", "PriceClass_100"], var.cloudfront_price_class)
    error_message = "CloudFront price class must be one of: PriceClass_All, PriceClass_200, PriceClass_100."
  }
}

# ==============================================
# MONITORING CONFIGURATION
# ==============================================

variable "enable_detailed_monitoring" {
  description = "Enable detailed monitoring for resources"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30
}

# ==============================================
# BACKUP CONFIGURATION
# ==============================================

variable "backup_retention_period" {
  description = "The number of days to retain backups"
  type        = number
  default     = 30
}

variable "backup_window" {
  description = "The daily time range during which automated backups are created"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "The weekly time range during which system maintenance can occur"
  type        = string
  default     = "Sun:04:00-Sun:05:00"
}

# ==============================================
# SECURITY CONFIGURATION
# ==============================================

variable "enable_waf" {
  description = "Enable AWS WAF for the load balancer"
  type        = bool
  default     = true
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC Flow Logs"
  type        = bool
  default     = true
}

variable "enable_guardduty" {
  description = "Enable AWS GuardDuty"
  type        = bool
  default     = true
}

# ==============================================
# NOTIFICATION CONFIGURATION
# ==============================================

variable "notification_email" {
  description = "Email address for notifications"
  type        = string
  default     = "admin@cryb.ai"
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for notifications"
  type        = string
  default     = ""
  sensitive   = true
}

variable "discord_webhook_url" {
  description = "Discord webhook URL for notifications"
  type        = string
  default     = ""
  sensitive   = true
}

# ==============================================
# COST OPTIMIZATION
# ==============================================

variable "enable_spot_instances" {
  description = "Enable Spot instances for cost optimization"
  type        = bool
  default     = false
}

variable "enable_scheduled_scaling" {
  description = "Enable scheduled scaling for predictable workloads"
  type        = bool
  default     = true
}

# ==============================================
# FEATURE FLAGS
# ==============================================

variable "enable_elasticsearch" {
  description = "Enable Elasticsearch cluster"
  type        = bool
  default     = true
}

variable "enable_s3_static_hosting" {
  description = "Enable S3 static website hosting for web app"
  type        = bool
  default     = true
}

variable "enable_cdn" {
  description = "Enable CloudFront CDN"
  type        = bool
  default     = true
}

# ==============================================
# TAGS
# ==============================================

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}