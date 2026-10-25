# Idempotency + session table as a DynamoDB global table (v2).
# DESIGN NOTE: global tables use last-writer-wins. Keep payment ownership single-writer
# and never rely on this table as the payment ledger (Aurora is the source of truth).
resource "aws_dynamodb_table" "idempotency" {
  name             = var.table_name
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "idempotency_key"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "idempotency_key"
    type = "S"
  }

  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  replica {
    region_name            = var.replica_region
    point_in_time_recovery = true
  }

  deletion_protection_enabled = true
  tags                        = var.tags
}
