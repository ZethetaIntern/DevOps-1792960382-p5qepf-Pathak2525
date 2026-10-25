variable "name" { type = string }
variable "primary_vpc_id" { type = string }
variable "primary_subnet_ids" { type = list(string) }
variable "primary_allowed_sg_ids" { type = list(string) }
variable "secondary_vpc_id" { type = string }
variable "secondary_subnet_ids" { type = list(string) }
variable "secondary_allowed_sg_ids" { type = list(string) }
variable "engine_version" {
  type    = string
  default = "15.4"
}
variable "instance_class" {
  type    = string
  default = "db.r6g.large"
}
variable "instances_per_cluster" {
  type    = number
  default = 2
}
variable "tags" {
  type    = map(string)
  default = {}
}
