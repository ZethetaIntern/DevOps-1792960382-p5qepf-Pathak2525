# Terraform — PaySecure DR (Mumbai ⇄ Hyderabad)

```bash
cd infrastructure/terraform
terraform init -backend-config=environments/dev/backend.hcl
terraform plan  -var-file=environments/dev/terraform.tfvars
# terraform apply only after review, in a sandbox AWS account
```

Modules: networking, compute (ECS Fargate + ALB), aurora (Global Database), dynamodb (global table),
redis (region-local), kafka (MSK per region), monitoring (SNS + CloudWatch alarms).

Notes
- Design/IaC reference. Not applied or validated against a live account in this repo; run `terraform validate` and review costs first.
- Aurora promotion, writer fencing and DNS switch are deliberately NOT automated here: they follow the approved runbooks.
- Cross-region Kafka replication (MirrorMaker 2 / MSK Replicator) is described in docs/replication-strategy.md.
- Confirm service and instance-class availability in ap-south-2 before applying.
