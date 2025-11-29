# ==============================================
# CRYB PLATFORM - EKS CLUSTER INFRASTRUCTURE
# ==============================================
# Production-grade EKS cluster with multi-AZ,
# auto-scaling, and comprehensive security
# ==============================================

# ==============================================
# EKS CLUSTER
# ==============================================

resource "aws_eks_cluster" "main" {
  name     = local.name
  role_arn = aws_iam_role.cluster.arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids              = concat(module.vpc.private_subnets, module.vpc.public_subnets)
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = var.cluster_endpoint_public_access_cidrs
    security_group_ids      = [aws_security_group.cluster.id]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  depends_on = [
    aws_iam_role_policy_attachment.cluster_AmazonEKSClusterPolicy,
    aws_iam_role_policy_attachment.cluster_AmazonEKSVPCResourceController,
    aws_cloudwatch_log_group.cluster,
  ]

  tags = merge(local.tags, {
    Name = "${local.name}-cluster"
  })
}

# ==============================================
# EKS NODE GROUPS
# ==============================================

# API Node Group
resource "aws_eks_node_group" "api" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${local.name}-api-nodes"
  node_role_arn   = aws_iam_role.node_group.arn
  subnet_ids      = module.vpc.private_subnets

  capacity_type  = "ON_DEMAND"
  instance_types = [var.api_instance_type]
  ami_type       = "AL2_x86_64"
  disk_size      = 100

  scaling_config {
    desired_size = 6
    max_size     = 100
    min_size     = 3
  }

  update_config {
    max_unavailable_percentage = 25
  }

  labels = {
    role     = "api"
    tier     = "application"
    nodegroup = "api-nodes"
  }

  taint {
    key    = "cryb.io/api-node"
    value  = "true"
    effect = "NO_SCHEDULE"
  }

  # Launch template for advanced configuration
  launch_template {
    id      = aws_launch_template.api_nodes.id
    version = aws_launch_template.api_nodes.latest_version
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_group_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.node_group_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.node_group_AmazonEC2ContainerRegistryReadOnly,
  ]

  tags = merge(local.tags, {
    "k8s.io/cluster-autoscaler/enabled"                = "true"
    "k8s.io/cluster-autoscaler/${aws_eks_cluster.main.name}" = "owned"
    "NodeGroup"                                        = "api"
  })
}

# Database Node Group
resource "aws_eks_node_group" "database" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${local.name}-database-nodes"
  node_role_arn   = aws_iam_role.node_group.arn
  subnet_ids      = module.vpc.private_subnets

  capacity_type  = "ON_DEMAND"
  instance_types = [var.database_instance_type]
  ami_type       = "AL2_x86_64"
  disk_size      = 200

  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 2
  }

  update_config {
    max_unavailable_percentage = 25
  }

  labels = {
    role     = "database"
    tier     = "data"
    nodegroup = "database-nodes"
  }

  taint {
    key    = "cryb.io/database-node"
    value  = "true"
    effect = "NO_SCHEDULE"
  }

  launch_template {
    id      = aws_launch_template.database_nodes.id
    version = aws_launch_template.database_nodes.latest_version
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_group_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.node_group_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.node_group_AmazonEC2ContainerRegistryReadOnly,
  ]

  tags = merge(local.tags, {
    "k8s.io/cluster-autoscaler/enabled"                = "true"
    "k8s.io/cluster-autoscaler/${aws_eks_cluster.main.name}" = "owned"
    "NodeGroup"                                        = "database"
  })
}

# Real-time Node Group
resource "aws_eks_node_group" "realtime" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${local.name}-realtime-nodes"
  node_role_arn   = aws_iam_role.node_group.arn
  subnet_ids      = module.vpc.private_subnets

  capacity_type  = "ON_DEMAND"
  instance_types = [var.realtime_instance_type]
  ami_type       = "AL2_x86_64"
  disk_size      = 100

  scaling_config {
    desired_size = 4
    max_size     = 20
    min_size     = 2
  }

  update_config {
    max_unavailable_percentage = 25
  }

  labels = {
    role     = "realtime"
    tier     = "communication"
    nodegroup = "realtime-nodes"
  }

  taint {
    key    = "cryb.io/realtime-node"
    value  = "true"
    effect = "NO_SCHEDULE"
  }

  launch_template {
    id      = aws_launch_template.realtime_nodes.id
    version = aws_launch_template.realtime_nodes.latest_version
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_group_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.node_group_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.node_group_AmazonEC2ContainerRegistryReadOnly,
  ]

  tags = merge(local.tags, {
    "k8s.io/cluster-autoscaler/enabled"                = "true"
    "k8s.io/cluster-autoscaler/${aws_eks_cluster.main.name}" = "owned"
    "NodeGroup"                                        = "realtime"
  })
}

# Monitoring Node Group
resource "aws_eks_node_group" "monitoring" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${local.name}-monitoring-nodes"
  node_role_arn   = aws_iam_role.node_group.arn
  subnet_ids      = module.vpc.private_subnets

  capacity_type  = "ON_DEMAND"
  instance_types = [var.monitoring_instance_type]
  ami_type       = "AL2_x86_64"
  disk_size      = 500

  scaling_config {
    desired_size = 3
    max_size     = 6
    min_size     = 2
  }

  update_config {
    max_unavailable_percentage = 25
  }

  labels = {
    role     = "monitoring"
    tier     = "observability"
    nodegroup = "monitoring-nodes"
  }

  taint {
    key    = "cryb.io/monitoring-node"
    value  = "true"
    effect = "NO_SCHEDULE"
  }

  launch_template {
    id      = aws_launch_template.monitoring_nodes.id
    version = aws_launch_template.monitoring_nodes.latest_version
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_group_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.node_group_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.node_group_AmazonEC2ContainerRegistryReadOnly,
  ]

  tags = merge(local.tags, {
    "k8s.io/cluster-autoscaler/enabled"                = "true"
    "k8s.io/cluster-autoscaler/${aws_eks_cluster.main.name}" = "owned"
    "NodeGroup"                                        = "monitoring"
  })
}

# ==============================================
# LAUNCH TEMPLATES
# ==============================================

resource "aws_launch_template" "api_nodes" {
  name_prefix   = "${local.name}-api-nodes-"
  image_id      = data.aws_ami.eks_worker.id
  instance_type = var.api_instance_type

  vpc_security_group_ids = [aws_security_group.node_group.id]

  user_data = base64encode(templatefile("${path.module}/userdata.sh", {
    cluster_name        = aws_eks_cluster.main.name
    cluster_endpoint    = aws_eks_cluster.main.endpoint
    cluster_ca          = aws_eks_cluster.main.certificate_authority[0].data
    bootstrap_arguments = "--container-runtime containerd --kubelet-extra-args '--node-labels=role=api,tier=application'"
  }))

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 100
      volume_type          = "gp3"
      iops                 = 3000
      throughput           = 125
      encrypted            = true
      kms_key_id          = aws_kms_key.eks.arn
      delete_on_termination = true
    }
  }

  monitoring {
    enabled = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.tags, {
      Name = "${local.name}-api-node"
      Role = "api"
    })
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_launch_template" "database_nodes" {
  name_prefix   = "${local.name}-database-nodes-"
  image_id      = data.aws_ami.eks_worker.id
  instance_type = var.database_instance_type

  vpc_security_group_ids = [aws_security_group.node_group.id]

  user_data = base64encode(templatefile("${path.module}/userdata.sh", {
    cluster_name        = aws_eks_cluster.main.name
    cluster_endpoint    = aws_eks_cluster.main.endpoint
    cluster_ca          = aws_eks_cluster.main.certificate_authority[0].data
    bootstrap_arguments = "--container-runtime containerd --kubelet-extra-args '--node-labels=role=database,tier=data'"
  }))

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 200
      volume_type          = "gp3"
      iops                 = 3000
      throughput           = 125
      encrypted            = true
      kms_key_id          = aws_kms_key.eks.arn
      delete_on_termination = true
    }
  }

  monitoring {
    enabled = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.tags, {
      Name = "${local.name}-database-node"
      Role = "database"
    })
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_launch_template" "realtime_nodes" {
  name_prefix   = "${local.name}-realtime-nodes-"
  image_id      = data.aws_ami.eks_worker.id
  instance_type = var.realtime_instance_type

  vpc_security_group_ids = [aws_security_group.node_group.id]

  user_data = base64encode(templatefile("${path.module}/userdata.sh", {
    cluster_name        = aws_eks_cluster.main.name
    cluster_endpoint    = aws_eks_cluster.main.endpoint
    cluster_ca          = aws_eks_cluster.main.certificate_authority[0].data
    bootstrap_arguments = "--container-runtime containerd --kubelet-extra-args '--node-labels=role=realtime,tier=communication'"
  }))

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 100
      volume_type          = "gp3"
      iops                 = 3000
      throughput           = 125
      encrypted            = true
      kms_key_id          = aws_kms_key.eks.arn
      delete_on_termination = true
    }
  }

  monitoring {
    enabled = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.tags, {
      Name = "${local.name}-realtime-node"
      Role = "realtime"
    })
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_launch_template" "monitoring_nodes" {
  name_prefix   = "${local.name}-monitoring-nodes-"
  image_id      = data.aws_ami.eks_worker.id
  instance_type = var.monitoring_instance_type

  vpc_security_group_ids = [aws_security_group.node_group.id]

  user_data = base64encode(templatefile("${path.module}/userdata.sh", {
    cluster_name        = aws_eks_cluster.main.name
    cluster_endpoint    = aws_eks_cluster.main.endpoint
    cluster_ca          = aws_eks_cluster.main.certificate_authority[0].data
    bootstrap_arguments = "--container-runtime containerd --kubelet-extra-args '--node-labels=role=monitoring,tier=observability'"
  }))

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 500
      volume_type          = "gp3"
      iops                 = 3000
      throughput           = 125
      encrypted            = true
      kms_key_id          = aws_kms_key.eks.arn
      delete_on_termination = true
    }
  }

  monitoring {
    enabled = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.tags, {
      Name = "${local.name}-monitoring-node"
      Role = "monitoring"
    })
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ==============================================
# EKS FARGATE PROFILES
# ==============================================

resource "aws_eks_fargate_profile" "serverless" {
  cluster_name           = aws_eks_cluster.main.name
  fargate_profile_name   = "${local.name}-serverless"
  pod_execution_role_arn = aws_iam_role.fargate_pod_execution_role.arn
  subnet_ids             = module.vpc.private_subnets

  selector {
    namespace = "kube-system"
    labels = {
      k8s-app = "kube-dns"
    }
  }

  selector {
    namespace = "default"
    labels = {
      fargate = "enabled"
    }
  }

  selector {
    namespace = "cryb-serverless"
  }

  tags = merge(local.tags, {
    Name = "${local.name}-fargate-serverless"
  })
}

# ==============================================
# EKS ADD-ONS
# ==============================================

resource "aws_eks_addon" "vpc_cni" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "vpc-cni"
  
  configuration_values = jsonencode({
    env = {
      ENABLE_POD_ENI             = "true"
      ENABLE_PREFIX_DELEGATION   = "true"
      POD_SECURITY_GROUP_ENFORCING_MODE = "standard"
    }
  })

  depends_on = [aws_eks_node_group.api]
}

resource "aws_eks_addon" "coredns" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "coredns"
  
  configuration_values = jsonencode({
    replicaCount = 3
    resources = {
      limits = {
        memory = "256Mi"
      }
      requests = {
        cpu    = "100m"
        memory = "128Mi"
      }
    }
  })

  depends_on = [aws_eks_fargate_profile.serverless]
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "kube-proxy"
  
  depends_on = [aws_eks_node_group.api]
}

resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "aws-ebs-csi-driver"
  service_account_role_arn = aws_iam_role.ebs_csi_driver.arn
  
  depends_on = [aws_eks_node_group.api]
}

resource "aws_eks_addon" "efs_csi_driver" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "aws-efs-csi-driver"
  
  depends_on = [aws_eks_node_group.api]
}

# ==============================================
# CLOUDWATCH LOG GROUP
# ==============================================

resource "aws_cloudwatch_log_group" "cluster" {
  name              = "/aws/eks/${local.name}/cluster"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.eks.arn

  tags = local.tags
}

# ==============================================
# DATA SOURCES
# ==============================================

data "aws_ami" "eks_worker" {
  filter {
    name   = "name"
    values = ["amazon-eks-node-${var.kubernetes_version}-v*"]
  }

  most_recent = true
  owners      = ["602401143452"] # Amazon EKS AMI Account ID
}

data "aws_eks_cluster" "cluster" {
  name = aws_eks_cluster.main.name
}

data "aws_eks_cluster_auth" "cluster" {
  name = aws_eks_cluster.main.name
}