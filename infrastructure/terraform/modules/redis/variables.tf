variable "name" { type = string }
variable "vpc_id" { type = string }
variable "subnet_ids" { type = list(string) }
variable "allowed_sg_ids" { type = list(string) }
variable "node_type" {
  type    = string
  default = "cache.r6g.large"
}
variable "tags" {
  type    = map(string)
  default = {}
}
