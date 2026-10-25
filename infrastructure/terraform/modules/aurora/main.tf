resource "aws_kms_key" "primary" {
  provider            = aws.primary
  description         = "${var.name} Aurora primary"
  enable_key_rotation = true
  tags                = var.tags
}

resource "aws_kms_key" "secondary" {
  provider            = aws.secondary
  description         = "${var.name} Aurora secondary"
  enable_key_rotation = true
  tags                = var.tags
}

resource "aws_db_subnet_group" "primary" {
  provider   = aws.primary
  name       = "${var.name}-primary"
  subnet_ids = var.primary_subnet_ids
  tags       = var.tags
}

resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "${var.name}-secondary"
  subnet_ids = var.secondary_subnet_ids
  tags       = var.tags
}

resource "aws_security_group" "primary" {
  provider    = aws.primary
  name_prefix = "${var.name}-aurora-"
  vpc_id      = var.primary_vpc_id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.primary_allowed_sg_ids
  }
  tags = var.tags
}

resource "aws_security_group" "secondary" {
  provider    = aws.secondary
  name_prefix = "${var.name}-aurora-"
  vpc_id      = var.secondary_vpc_id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.secondary_allowed_sg_ids
  }
  tags = var.tags
}

resource "aws_rds_global_cluster" "this" {
  provider                  = aws.primary
  global_cluster_identifier = "${var.name}-global"
  engine                    = "aurora-postgresql"
  engine_version            = var.engine_version
  database_name             = "paysecure"
  storage_encrypted         = true
}

resource "aws_rds_cluster" "primary" {
  provider                        = aws.primary
  cluster_identifier              = "${var.name}-primary"
  global_cluster_identifier       = aws_rds_global_cluster.this.id
  engine                          = aws_rds_global_cluster.this.engine
  engine_version                  = aws_rds_global_cluster.this.engine_version
  database_name                   = "paysecure"
  master_username                 = "paysecure_admin"
  manage_master_user_password     = true
  db_subnet_group_name            = aws_db_subnet_group.primary.name
  vpc_security_group_ids          = [aws_security_group.primary.id]
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.primary.arn
  backup_retention_period         = 14
  deletion_protection             = true
  skip_final_snapshot             = false
  final_snapshot_identifier       = "${var.name}-primary-final"
  enabled_cloudwatch_logs_exports = ["postgresql"]
  tags                            = var.tags
}

resource "aws_rds_cluster_instance" "primary" {
  provider                     = aws.primary
  count                        = var.instances_per_cluster
  identifier                   = "${var.name}-primary-${count.index}"
  cluster_identifier           = aws_rds_cluster.primary.id
  engine                       = aws_rds_cluster.primary.engine
  engine_version               = aws_rds_cluster.primary.engine_version
  instance_class               = var.instance_class
  performance_insights_enabled = true
  tags                         = var.tags
}

resource "aws_rds_cluster" "secondary" {
  provider                  = aws.secondary
  cluster_identifier        = "${var.name}-secondary"
  global_cluster_identifier = aws_rds_global_cluster.this.id
  engine                    = aws_rds_global_cluster.this.engine
  engine_version            = aws_rds_global_cluster.this.engine_version
  db_subnet_group_name      = aws_db_subnet_group.secondary.name
  vpc_security_group_ids    = [aws_security_group.secondary.id]
  storage_encrypted         = true
  kms_key_id                = aws_kms_key.secondary.arn
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.name}-secondary-final"
  tags                      = var.tags
  depends_on                = [aws_rds_cluster_instance.primary]
}

resource "aws_rds_cluster_instance" "secondary" {
  provider           = aws.secondary
  count              = var.instances_per_cluster
  identifier         = "${var.name}-secondary-${count.index}"
  cluster_identifier = aws_rds_cluster.secondary.id
  engine             = aws_rds_cluster.secondary.engine
  engine_version     = aws_rds_cluster.secondary.engine_version
  instance_class     = var.instance_class
  tags               = var.tags
}
