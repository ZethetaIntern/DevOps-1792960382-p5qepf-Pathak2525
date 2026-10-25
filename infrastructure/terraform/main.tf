terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }
  # Remote state: copy environments/<env>/backend.hcl and run
  #   terraform init -backend-config=environments/dev/backend.hcl
  backend "s3" {}
}

# Mumbai = primary, Hyderabad = recovery. Both are Indian regions (data localisation).
provider "aws" {
  alias  = "mumbai"
  region = var.primary_region
  default_tags { tags = local.tags }
}

provider "aws" {
  alias  = "hyderabad"
  region = var.secondary_region
  default_tags { tags = local.tags }
}

locals {
  name = "paysecure-${var.environment}"
  tags = {
    Project     = "PaySecure-DR"
    Environment = var.environment
    ManagedBy   = "terraform"
    DataClass   = "payment-india-only"
  }
}

# ---------------- networking (one VPC per region, non-overlapping CIDRs)
module "network_primary" {
  source     = "./modules/networking"
  providers  = { aws = aws.mumbai }
  name       = "${local.name}-mum"
  cidr_block = var.primary_cidr
  tags       = local.tags
}

module "network_secondary" {
  source     = "./modules/networking"
  providers  = { aws = aws.hyderabad }
  name       = "${local.name}-hyd"
  cidr_block = var.secondary_cidr
  tags       = local.tags
}

# ---------------- compute (warm standby: Hyderabad runs reduced but pre-warmed capacity)
module "compute_primary" {
  source             = "./modules/compute"
  providers          = { aws = aws.mumbai }
  name               = "${local.name}-mum"
  vpc_id             = module.network_primary.vpc_id
  public_subnet_ids  = module.network_primary.public_subnet_ids
  private_subnet_ids = module.network_primary.private_subnet_ids
  container_image    = var.container_image
  desired_count      = var.primary_desired_count
  certificate_arn    = var.primary_certificate_arn
  environment        = { NODE_ENV = "production", REGION_ROLE = "primary", ALLOW_REAL_FAILOVER = "false" }
  tags               = local.tags
}

module "compute_secondary" {
  source             = "./modules/compute"
  providers          = { aws = aws.hyderabad }
  name               = "${local.name}-hyd"
  vpc_id             = module.network_secondary.vpc_id
  public_subnet_ids  = module.network_secondary.public_subnet_ids
  private_subnet_ids = module.network_secondary.private_subnet_ids
  container_image    = var.container_image
  desired_count      = var.secondary_desired_count
  certificate_arn    = var.secondary_certificate_arn
  environment        = { NODE_ENV = "production", REGION_ROLE = "standby", ALLOW_REAL_FAILOVER = "false" }
  tags               = local.tags
}

# ---------------- data stores
module "aurora" {
  source = "./modules/aurora"
  providers = {
    aws.primary   = aws.mumbai
    aws.secondary = aws.hyderabad
  }
  name                     = local.name
  primary_vpc_id           = module.network_primary.vpc_id
  primary_subnet_ids       = module.network_primary.private_subnet_ids
  primary_allowed_sg_ids   = [module.compute_primary.app_security_group_id]
  secondary_vpc_id         = module.network_secondary.vpc_id
  secondary_subnet_ids     = module.network_secondary.private_subnet_ids
  secondary_allowed_sg_ids = [module.compute_secondary.app_security_group_id]
  instance_class           = var.aurora_instance_class
  tags                     = local.tags
}

module "dynamodb" {
  source         = "./modules/dynamodb"
  providers      = { aws = aws.mumbai }
  table_name     = "${local.name}-idempotency"
  replica_region = var.secondary_region
  tags           = local.tags
}

module "redis_primary" {
  source         = "./modules/redis"
  providers      = { aws = aws.mumbai }
  name           = "${local.name}-mum"
  vpc_id         = module.network_primary.vpc_id
  subnet_ids     = module.network_primary.private_subnet_ids
  allowed_sg_ids = [module.compute_primary.app_security_group_id]
  tags           = local.tags
}

module "redis_secondary" {
  source         = "./modules/redis"
  providers      = { aws = aws.hyderabad }
  name           = "${local.name}-hyd"
  vpc_id         = module.network_secondary.vpc_id
  subnet_ids     = module.network_secondary.private_subnet_ids
  allowed_sg_ids = [module.compute_secondary.app_security_group_id]
  tags           = local.tags
}

module "kafka_primary" {
  source         = "./modules/kafka"
  providers      = { aws = aws.mumbai }
  name           = "${local.name}-mum"
  vpc_id         = module.network_primary.vpc_id
  subnet_ids     = module.network_primary.private_subnet_ids
  allowed_sg_ids = [module.compute_primary.app_security_group_id]
  tags           = local.tags
}

module "kafka_secondary" {
  source         = "./modules/kafka"
  providers      = { aws = aws.hyderabad }
  name           = "${local.name}-hyd"
  vpc_id         = module.network_secondary.vpc_id
  subnet_ids     = module.network_secondary.private_subnet_ids
  allowed_sg_ids = [module.compute_secondary.app_security_group_id]
  tags           = local.tags
}

# ---------------- monitoring (alarms live in the region where the metric is emitted)
module "monitoring_primary" {
  source                  = "./modules/monitoring"
  providers               = { aws = aws.mumbai }
  name                    = "${local.name}-mum"
  alert_email             = var.alert_email
  alb_arn_suffix          = module.compute_primary.alb_arn_suffix
  target_group_arn_suffix = module.compute_primary.target_group_arn_suffix
  tags                    = local.tags
}

module "monitoring_secondary" {
  source                    = "./modules/monitoring"
  providers                 = { aws = aws.hyderabad }
  name                      = "${local.name}-hyd"
  alert_email               = var.alert_email
  alb_arn_suffix            = module.compute_secondary.alb_arn_suffix
  target_group_arn_suffix   = module.compute_secondary.target_group_arn_suffix
  aurora_cluster_id         = module.aurora.secondary_cluster_id
  rpo_seconds               = var.rpo_seconds
  dynamodb_table_name       = module.dynamodb.table_name
  dynamodb_receiving_region = var.secondary_region
  tags                      = local.tags
}

# ---------------- DNS failover (optional: set domain_name + hosted_zone_id)
# Route 53 health checks are global; failover routing is the *traffic* control.
# Promotion of Aurora is still a separate, approved action (runbooks 01/02).
resource "aws_route53_health_check" "primary" {
  provider          = aws.mumbai
  count             = var.domain_name == "" ? 0 : 1
  fqdn              = module.compute_primary.alb_dns_name
  port              = var.primary_certificate_arn == "" ? 80 : 443
  type              = var.primary_certificate_arn == "" ? "HTTP" : "HTTPS"
  resource_path     = "/api/health"
  failure_threshold = 3
  request_interval  = 10
  tags              = merge(local.tags, { Name = "${local.name}-primary-hc" })
}

resource "aws_route53_record" "primary" {
  provider        = aws.mumbai
  count           = var.domain_name == "" ? 0 : 1
  zone_id         = var.hosted_zone_id
  name            = var.domain_name
  type            = "A"
  set_identifier  = "primary-mumbai"
  health_check_id = aws_route53_health_check.primary[0].id
  failover_routing_policy {
    type = "PRIMARY"
  }
  alias {
    name                   = module.compute_primary.alb_dns_name
    zone_id                = module.compute_primary.alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "secondary" {
  provider       = aws.mumbai
  count          = var.domain_name == "" ? 0 : 1
  zone_id        = var.hosted_zone_id
  name           = var.domain_name
  type           = "A"
  set_identifier = "secondary-hyderabad"
  failover_routing_policy {
    type = "SECONDARY"
  }
  alias {
    name                   = module.compute_secondary.alb_dns_name
    zone_id                = module.compute_secondary.alb_zone_id
    evaluate_target_health = true
  }
}
