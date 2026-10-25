environment             = "staging"
container_image         = "REPLACE_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/paysecure-api:staging"
alert_email             = "dr-alerts-staging@example.com"
primary_desired_count   = 3
secondary_desired_count = 3
aurora_instance_class   = "db.r6g.xlarge"
rpo_seconds             = 60
