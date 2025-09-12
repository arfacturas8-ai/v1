# ==============================================
# CLOUDFRONT CDN CONFIGURATION
# ==============================================
# Production-ready CDN with:
# - Edge caching
# - Security headers
# - Geographic restrictions
# - Real-time logs
# - WAF integration
# ==============================================

# ==============================================
# S3 BUCKETS FOR STATIC CONTENT
# ==============================================

# S3 bucket for static web content
resource "aws_s3_bucket" "static_content" {
  bucket = "${local.name}-static-content"
  
  tags = local.tags
}

resource "aws_s3_bucket_public_access_block" "static_content" {
  bucket = aws_s3_bucket.static_content.id
  
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "static_content" {
  bucket = aws_s3_bucket.static_content.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.static_content.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
          }
        }
      }
    ]
  })
  
  depends_on = [aws_s3_bucket_public_access_block.static_content]
}

resource "aws_s3_bucket_website_configuration" "static_content" {
  bucket = aws_s3_bucket.static_content.id
  
  index_document {
    suffix = "index.html"
  }
  
  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_versioning" "static_content" {
  bucket = aws_s3_bucket.static_content.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "static_content" {
  bucket = aws_s3_bucket.static_content.id
  
  rule {
    id     = "delete_old_versions"
    status = "Enabled"
    
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
  
  rule {
    id     = "transition_to_ia"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

# S3 bucket for CloudFront logs
resource "aws_s3_bucket" "cloudfront_logs" {
  bucket = "${local.name}-cloudfront-logs"
  
  tags = local.tags
}

resource "aws_s3_bucket_public_access_block" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id
  
  rule {
    id     = "delete_old_logs"
    status = "Enabled"
    
    expiration {
      days = 90
    }
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}

# ==============================================
# ORIGIN ACCESS CONTROL
# ==============================================

resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${local.name}-oac"
  description                       = "OAC for ${local.name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ==============================================
# WAF WEB ACL FOR CLOUDFRONT
# ==============================================

resource "aws_wafv2_web_acl" "cloudfront" {
  count = var.enable_waf ? 1 : 0
  
  name  = "${local.name}-cloudfront-waf"
  scope = "CLOUDFRONT"
  
  default_action {
    allow {}
  }
  
  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }
  
  # AWS Managed Rules - Common Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 10
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }
  
  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 20
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }
  
  # Geo-blocking rule (optional)
  rule {
    name     = "GeoBlockingRule"
    priority = 30
    
    action {
      block {}
    }
    
    statement {
      geo_match_statement {
        country_codes = ["CN", "RU", "KP"]  # Block China, Russia, North Korea
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "GeoBlockingRule"
      sampled_requests_enabled   = true
    }
  }
  
  tags = local.tags
}

# ==============================================
# CLOUDFRONT DISTRIBUTION
# ==============================================

resource "aws_cloudfront_distribution" "main" {
  comment             = "CRYB Platform CDN"
  default_root_object = "index.html"
  enabled             = true
  http_version        = "http2and3"
  is_ipv6_enabled     = true
  price_class         = var.cloudfront_price_class
  web_acl_id          = var.enable_waf ? aws_wafv2_web_acl.cloudfront[0].arn : null
  
  # S3 Origin for static content
  origin {
    domain_name              = aws_s3_bucket.static_content.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
    origin_id                = "S3-${aws_s3_bucket.static_content.bucket}"
    
    custom_header {
      name  = "X-Origin-Verify"
      value = random_password.origin_verify.result
    }
  }
  
  # ALB Origin for dynamic content
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB-${aws_lb.main.name}"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
    
    custom_header {
      name  = "X-Origin-Verify"
      value = random_password.origin_verify.result
    }
  }
  
  # Default cache behavior for dynamic content
  default_cache_behavior {
    allowed_methods          = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods           = ["GET", "HEAD", "OPTIONS"]
    target_origin_id         = "ALB-${aws_lb.main.name}"
    compress                 = true
    viewer_protocol_policy   = "redirect-to-https"
    
    cache_policy_id          = aws_cloudfront_cache_policy.dynamic.id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.dynamic.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.main.id
  }
  
  # Static assets cache behavior
  ordered_cache_behavior {
    path_pattern             = "/static/*"
    allowed_methods          = ["GET", "HEAD", "OPTIONS"]
    cached_methods           = ["GET", "HEAD", "OPTIONS"]
    target_origin_id         = "S3-${aws_s3_bucket.static_content.bucket}"
    compress                 = true
    viewer_protocol_policy   = "redirect-to-https"
    
    cache_policy_id          = aws_cloudfront_cache_policy.static.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.main.id
  }
  
  # API cache behavior
  ordered_cache_behavior {
    path_pattern             = "/api/*"
    allowed_methods          = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods           = ["GET", "HEAD", "OPTIONS"]
    target_origin_id         = "ALB-${aws_lb.main.name}"
    compress                 = true
    viewer_protocol_policy   = "redirect-to-https"
    
    cache_policy_id          = aws_cloudfront_cache_policy.api.id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.dynamic.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.main.id
  }
  
  # Geographic restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  # SSL Certificate
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.main.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  # Domain aliases
  aliases = [
    var.domain_name,
    "www.${var.domain_name}",
    "cdn.${var.domain_name}"
  ]
  
  # Logging configuration
  logging_config {
    bucket          = aws_s3_bucket.cloudfront_logs.bucket_domain_name
    prefix          = "cloudfront-logs/"
    include_cookies = false
  }
  
  # Custom error responses
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
  
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
  
  tags = local.tags
  
  depends_on = [aws_acm_certificate_validation.main]
}

# ==============================================
# CACHE POLICIES
# ==============================================

# Cache policy for static assets
resource "aws_cloudfront_cache_policy" "static" {
  name        = "${local.name}-static-cache-policy"
  comment     = "Policy for static assets with long TTL"
  default_ttl = 86400      # 1 day
  max_ttl     = 31536000   # 1 year
  min_ttl     = 86400      # 1 day
  
  parameters_in_cache_key_and_forwarded_to_origin {
    query_strings_config {
      query_string_behavior = "none"
    }
    
    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["CloudFront-Viewer-Country", "CloudFront-Is-Desktop-Viewer", "CloudFront-Is-Mobile-Viewer"]
      }
    }
    
    cookies_config {
      cookie_behavior = "none"
    }
    
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}

# Cache policy for API responses
resource "aws_cloudfront_cache_policy" "api" {
  name        = "${local.name}-api-cache-policy"
  comment     = "Policy for API with short TTL"
  default_ttl = 0          # No caching by default
  max_ttl     = 300        # 5 minutes max
  min_ttl     = 0
  
  parameters_in_cache_key_and_forwarded_to_origin {
    query_strings_config {
      query_string_behavior = "all"
    }
    
    headers_config {
      header_behavior = "whitelist"
      headers {
        items = [
          "Authorization",
          "Content-Type",
          "Accept",
          "User-Agent",
          "CloudFront-Viewer-Country"
        ]
      }
    }
    
    cookies_config {
      cookie_behavior = "all"
    }
    
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}

# Cache policy for dynamic content
resource "aws_cloudfront_cache_policy" "dynamic" {
  name        = "${local.name}-dynamic-cache-policy"
  comment     = "Policy for dynamic content with moderate TTL"
  default_ttl = 300        # 5 minutes
  max_ttl     = 3600       # 1 hour
  min_ttl     = 0
  
  parameters_in_cache_key_and_forwarded_to_origin {
    query_strings_config {
      query_string_behavior = "all"
    }
    
    headers_config {
      header_behavior = "whitelist"
      headers {
        items = [
          "Accept",
          "Accept-Language",
          "User-Agent",
          "CloudFront-Viewer-Country",
          "CloudFront-Is-Desktop-Viewer",
          "CloudFront-Is-Mobile-Viewer"
        ]
      }
    }
    
    cookies_config {
      cookie_behavior = "whitelist"
      cookies {
        items = ["session", "auth-token"]
      }
    }
    
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}

# ==============================================
# ORIGIN REQUEST POLICIES
# ==============================================

resource "aws_cloudfront_origin_request_policy" "dynamic" {
  name    = "${local.name}-dynamic-origin-request-policy"
  comment = "Policy for forwarding headers to origin"
  
  query_strings_config {
    query_string_behavior = "all"
  }
  
  headers_config {
    header_behavior = "whitelist"
    headers {
      items = [
        "Accept",
        "Accept-Language",
        "Authorization",
        "Content-Type",
        "Origin",
        "Referer",
        "User-Agent",
        "X-Forwarded-For",
        "X-Forwarded-Host",
        "X-Forwarded-Proto"
      ]
    }
  }
  
  cookies_config {
    cookie_behavior = "all"
  }
}

# ==============================================
# RESPONSE HEADERS POLICY
# ==============================================

resource "aws_cloudfront_response_headers_policy" "main" {
  name    = "${local.name}-response-headers-policy"
  comment = "Security headers policy"
  
  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 63072000
      include_subdomains         = true
      preload                   = true
    }
    
    content_type_options {
      override = true
    }
    
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
  }
  
  custom_headers_config {
    items {
      header   = "X-Frame-Options"
      value    = "DENY"
      override = true
    }
    
    items {
      header   = "X-Content-Type-Options"
      value    = "nosniff"
      override = true
    }
    
    items {
      header   = "X-XSS-Protection"
      value    = "1; mode=block"
      override = true
    }
    
    items {
      header   = "Permissions-Policy"
      value    = "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()"
      override = true
    }
  }
}

# ==============================================
# ROUTE 53 RECORDS
# ==============================================

data "aws_route53_zone" "main" {
  name = var.domain_name
}

resource "aws_route53_record" "main" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"
  
  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"
  
  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "cdn" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "cdn.${var.domain_name}"
  type    = "A"
  
  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# ==============================================
# RANDOM PASSWORD FOR ORIGIN VERIFICATION
# ==============================================

resource "random_password" "origin_verify" {
  length  = 32
  special = true
}

# ==============================================
# CLOUDWATCH MONITORING
# ==============================================

resource "aws_cloudwatch_dashboard" "cloudfront" {
  dashboard_name = "${local.name}-cloudfront"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.main.id],
            [".", "BytesDownloaded", ".", "."],
            [".", "BytesUploaded", ".", "."]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "CloudFront Traffic"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/CloudFront", "CacheHitRate", "DistributionId", aws_cloudfront_distribution.main.id],
            [".", "OriginLatency", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "CloudFront Performance"
        }
      }
    ]
  })
}

# CloudWatch alarms for CloudFront
resource "aws_cloudwatch_metric_alarm" "cloudfront_high_error_rate" {
  alarm_name          = "${local.name}-cloudfront-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This metric monitors CloudFront 4xx error rate"
  
  dimensions = {
    DistributionId = aws_cloudfront_distribution.main.id
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
  
  tags = local.tags
}

resource "aws_cloudfront_monitoring_subscription" "main" {
  distribution_id = aws_cloudfront_distribution.main.id
  
  monitoring_subscription {
    realtime_metrics_subscription_config {
      realtime_metrics_subscription_status = "Enabled"
    }
  }
}