variable "name" { type = string }
variable "vpc_id" { type = string }
variable "subnet_ids" { type = list(string) }
variable "allowed_sg_ids" { type = list(string) }
variable "instance_type" {
  type    = string
  default = "kafka.m5.large"
}
variable "kafka_version" {
  type    = string
  default = "3.6.0"
}
variable "tags" {
  type    = map(string)
  default = {}
}
