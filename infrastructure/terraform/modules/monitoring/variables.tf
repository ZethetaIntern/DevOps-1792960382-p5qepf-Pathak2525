variable "name" { type = string }
variable "alert_email" { type = string }
variable "alb_arn_suffix" { type = string }
variable "target_group_arn_suffix" { type = string }
variable "aurora_cluster_id" {
  type    = string
  default = ""
}
variable "rpo_seconds" {
  type    = number
  default = 60
}
variable "dynamodb_table_name" {
  type    = string
  default = ""
}
variable "dynamodb_receiving_region" {
  type    = string
  default = ""
}
variable "tags" {
  type    = map(string)
  default = {}
}
