variable "table_name" { type = string }
variable "replica_region" { type = string }
variable "tags" {
  type    = map(string)
  default = {}
}
