variable "name" { type = string }
variable "vpc_id" { type = string }
variable "public_subnet_ids" { type = list(string) }
variable "private_subnet_ids" { type = list(string) }
variable "container_image" { type = string }
variable "container_port" {
  type    = number
  default = 5000
}
variable "desired_count" {
  type    = number
  default = 3
}
variable "max_count" {
  type    = number
  default = 30
}
variable "cpu" {
  type    = number
  default = 1024
}
variable "memory" {
  type    = number
  default = 2048
}
variable "environment" {
  type    = map(string)
  default = {}
}
variable "certificate_arn" {
  type        = string
  default     = ""
  description = "ACM certificate for HTTPS. Empty = HTTP only (dev)."
}
variable "tags" {
  type    = map(string)
  default = {}
}
