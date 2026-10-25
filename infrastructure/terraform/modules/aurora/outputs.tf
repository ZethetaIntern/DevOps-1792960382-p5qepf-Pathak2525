output "global_cluster_id" { value = aws_rds_global_cluster.this.id }
output "primary_cluster_id" { value = aws_rds_cluster.primary.id }
output "secondary_cluster_id" { value = aws_rds_cluster.secondary.id }
output "primary_endpoint" { value = aws_rds_cluster.primary.endpoint }
output "secondary_reader_endpoint" { value = aws_rds_cluster.secondary.reader_endpoint }
output "master_secret_arn" { value = aws_rds_cluster.primary.master_user_secret[0].secret_arn }
