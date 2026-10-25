environment             = "dev"
container_image         = "REPLACE_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/paysecure-api:latest"
alert_email             = "dr-alerts-dev@example.com"
primary_desired_count   = 2
secondary_desired_count = 1
aurora_instance_class   = "db.r6g.large"
