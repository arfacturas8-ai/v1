# ==============================================
# AUTO SCALING CONFIGURATION
# ==============================================
# Advanced auto-scaling for ECS services
# Includes: Predictive scaling, custom metrics
# ==============================================

# ==============================================
# SERVICE DISCOVERY
# ==============================================

resource "aws_service_discovery_private_dns_namespace" "main" {
  name = "${local.name}.local"
  vpc  = module.vpc.vpc_id
  
  tags = local.tags
}

resource "aws_service_discovery_service" "api" {
  name = "api"
  
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    
    dns_records {
      ttl  = 10
      type = "A"
    }
    
    routing_policy = "MULTIVALUE"
  }
  
  health_check_grace_period_seconds = 30
  
  tags = local.tags
}

# ==============================================
# APPLICATION AUTO SCALING TARGET
# ==============================================

resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = var.environment == "production" ? 20 : 10
  min_capacity       = var.environment == "production" ? 3 : 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
  
  tags = local.tags
}

# ==============================================
# CPU-BASED SCALING POLICY
# ==============================================

resource "aws_appautoscaling_policy" "ecs_policy_cpu" {
  name               = "${local.name}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
  
  depends_on = [aws_appautoscaling_target.ecs_target]
}

# ==============================================
# MEMORY-BASED SCALING POLICY
# ==============================================

resource "aws_appautoscaling_policy" "ecs_policy_memory" {
  name               = "${local.name}-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
  
  depends_on = [aws_appautoscaling_target.ecs_target]
}

# ==============================================
# ALB REQUEST COUNT SCALING POLICY
# ==============================================

resource "aws_appautoscaling_policy" "ecs_policy_requests" {
  name               = "${local.name}-requests-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.api.arn_suffix}"
    }
    
    target_value       = 1000.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
  
  depends_on = [aws_appautoscaling_target.ecs_target]
}

# ==============================================
# CUSTOM METRIC SCALING (Response Time)
# ==============================================

resource "aws_cloudwatch_metric_alarm" "high_response_time" {
  alarm_name          = "${local.name}-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "120"
  statistic           = "Average"
  threshold           = "2.0"
  alarm_description   = "This metric monitors ALB response time"
  
  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
  
  alarm_actions = [aws_appautoscaling_policy.ecs_policy_scale_up.arn]
  ok_actions    = [aws_appautoscaling_policy.ecs_policy_scale_down.arn]
  
  tags = local.tags
}

# Scale up policy for response time
resource "aws_appautoscaling_policy" "ecs_policy_scale_up" {
  name               = "${local.name}-scale-up"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace
  
  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown               = 300
    metric_aggregation_type = "Average"
    
    step_adjustment {
      metric_interval_lower_bound = 0
      scaling_adjustment         = 2
    }
  }
  
  depends_on = [aws_appautoscaling_target.ecs_target]
}

# Scale down policy for response time
resource "aws_appautoscaling_policy" "ecs_policy_scale_down" {
  name               = "${local.name}-scale-down"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace
  
  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown               = 300
    metric_aggregation_type = "Average"
    
    step_adjustment {
      metric_interval_upper_bound = 0
      scaling_adjustment         = -1
    }
  }
  
  depends_on = [aws_appautoscaling_target.ecs_target]
}

# ==============================================
# SCHEDULED SCALING POLICIES
# ==============================================

# Scale up for expected high traffic periods
resource "aws_appautoscaling_scheduled_action" "scale_up_morning" {
  count = var.enable_scheduled_scaling ? 1 : 0
  
  name               = "${local.name}-scale-up-morning"
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  
  schedule = "cron(0 8 * * MON-FRI)"  # 8 AM UTC, Monday-Friday
  
  scalable_target_action {
    min_capacity = var.environment == "production" ? 5 : 3
    max_capacity = var.environment == "production" ? 20 : 10
  }
  
  depends_on = [aws_appautoscaling_target.ecs_target]
}

# Scale down for expected low traffic periods
resource "aws_appautoscaling_scheduled_action" "scale_down_night" {
  count = var.enable_scheduled_scaling ? 1 : 0
  
  name               = "${local.name}-scale-down-night"
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  
  schedule = "cron(0 2 * * *)"  # 2 AM UTC daily
  
  scalable_target_action {
    min_capacity = var.environment == "production" ? 3 : 2
    max_capacity = var.environment == "production" ? 15 : 8
  }
  
  depends_on = [aws_appautoscaling_target.ecs_target]
}

# ==============================================
# DATABASE AUTO SCALING
# ==============================================

# RDS Aurora Auto Scaling Target
resource "aws_appautoscaling_target" "rds_target" {
  max_capacity       = var.environment == "production" ? 10 : 5
  min_capacity       = 2
  resource_id        = "cluster:${aws_rds_cluster.main.cluster_identifier}"
  scalable_dimension = "rds:cluster:ReadReplicaCount"
  service_namespace  = "rds"
  
  tags = local.tags
}

# RDS CPU-based scaling policy
resource "aws_appautoscaling_policy" "rds_policy_cpu" {
  name               = "${local.name}-rds-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.rds_target.resource_id
  scalable_dimension = aws_appautoscaling_target.rds_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.rds_target.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "RDSReaderAverageCPUUtilization"
    }
    
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
  
  depends_on = [aws_appautoscaling_target.rds_target]
}

# RDS connection-based scaling policy
resource "aws_appautoscaling_policy" "rds_policy_connections" {
  name               = "${local.name}-rds-connections-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.rds_target.resource_id
  scalable_dimension = aws_appautoscaling_target.rds_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.rds_target.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "RDSReaderAverageDatabaseConnections"
    }
    
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
  
  depends_on = [aws_appautoscaling_target.rds_target]
}

# ==============================================
# CLOUDWATCH CUSTOM METRICS FOR SCALING
# ==============================================

# Lambda function to publish custom metrics
resource "aws_lambda_function" "custom_metrics" {
  filename      = "custom_metrics.zip"
  function_name = "${local.name}-custom-metrics"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "index.handler"
  runtime       = "python3.9"
  timeout       = 60
  
  source_code_hash = data.archive_file.custom_metrics_zip.output_base64sha256
  
  environment {
    variables = {
      ECS_CLUSTER_NAME = aws_ecs_cluster.main.name
      ECS_SERVICE_NAME = aws_ecs_service.api.name
      RDS_CLUSTER_ID   = aws_rds_cluster.main.cluster_identifier
      REDIS_CLUSTER_ID = aws_elasticache_replication_group.main.replication_group_id
    }
  }
  
  tags = local.tags
}

# Archive for Lambda function
data "archive_file" "custom_metrics_zip" {
  type        = "zip"
  output_path = "custom_metrics.zip"
  source {
    content = templatefile("${path.module}/lambda/custom_metrics.py", {
      cluster_name = aws_ecs_cluster.main.name
    })
    filename = "index.py"
  }
}

# CloudWatch Event to trigger custom metrics Lambda
resource "aws_cloudwatch_event_rule" "custom_metrics_schedule" {
  name                = "${local.name}-custom-metrics"
  description         = "Trigger custom metrics Lambda"
  schedule_expression = "rate(1 minute)"
  
  tags = local.tags
}

resource "aws_cloudwatch_event_target" "custom_metrics_target" {
  rule      = aws_cloudwatch_event_rule.custom_metrics_schedule.name
  target_id = "CustomMetricsTarget"
  arn       = aws_lambda_function.custom_metrics.arn
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_custom_metrics" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.custom_metrics.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.custom_metrics_schedule.arn
}

# ==============================================
# PREDICTIVE SCALING (AWS Forecast Integration)
# ==============================================

# CloudWatch metric for predictive scaling
resource "aws_cloudwatch_metric_alarm" "predictive_scaling_forecast" {
  count = var.environment == "production" ? 1 : 0
  
  alarm_name          = "${local.name}-predictive-scaling"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RequestCountPerTarget"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "500"
  alarm_description   = "Predictive scaling based on forecasted load"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    TargetGroup  = aws_lb_target_group.api.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }
  
  alarm_actions = [aws_appautoscaling_policy.ecs_policy_predictive_scale_up[0].arn]
  ok_actions    = [aws_appautoscaling_policy.ecs_policy_predictive_scale_down[0].arn]
  
  tags = local.tags
}

# Predictive scale up policy
resource "aws_appautoscaling_policy" "ecs_policy_predictive_scale_up" {
  count = var.environment == "production" ? 1 : 0
  
  name               = "${local.name}-predictive-scale-up"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace
  
  step_scaling_policy_configuration {
    adjustment_type         = "PercentChangeInCapacity"
    cooldown               = 180
    metric_aggregation_type = "Average"
    min_adjustment_magnitude = 1
    
    step_adjustment {
      metric_interval_lower_bound = 0
      metric_interval_upper_bound = 1000
      scaling_adjustment         = 50
    }
    
    step_adjustment {
      metric_interval_lower_bound = 1000
      scaling_adjustment         = 100
    }
  }
  
  depends_on = [aws_appautoscaling_target.ecs_target]
}

# Predictive scale down policy
resource "aws_appautoscaling_policy" "ecs_policy_predictive_scale_down" {
  count = var.environment == "production" ? 1 : 0
  
  name               = "${local.name}-predictive-scale-down"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace
  
  step_scaling_policy_configuration {
    adjustment_type         = "PercentChangeInCapacity"
    cooldown               = 300
    metric_aggregation_type = "Average"
    
    step_adjustment {
      metric_interval_upper_bound = 0
      scaling_adjustment         = -25
    }
  }
  
  depends_on = [aws_appautoscaling_target.ecs_target]
}

# ==============================================
# SCALING NOTIFICATIONS
# ==============================================

resource "aws_sns_topic" "scaling_notifications" {
  name = "${local.name}-scaling-notifications"
  
  tags = local.tags
}

resource "aws_sns_topic_subscription" "scaling_email" {
  topic_arn = aws_sns_topic.scaling_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch alarm for scaling events
resource "aws_cloudwatch_metric_alarm" "scaling_event" {
  alarm_name          = "${local.name}-scaling-events"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "DesiredCount"
  namespace           = "ECS/ContainerInsights"
  period              = "60"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "Alert when scaling occurs"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    ServiceName = aws_ecs_service.api.name
    ClusterName = aws_ecs_cluster.main.name
  }
  
  alarm_actions = [aws_sns_topic.scaling_notifications.arn]
  
  tags = local.tags
}