variable "environment" {
  type    = string
  default = "dev"
}

variable "primary_region" {
  type    = string
  default = "ap-south-1"
  validation {
    condition     = contains(["ap-south-1", "ap-south-2"], var.primary_region)
    error_message = "Data localisation: only Indian AWS regions (ap-south-1, ap-south-2) are allowed."
  }
}

variable "secondary_region" {
  type    = string
  default = "ap-south-2"
  validation {
    condition     = contains(["ap-south-1", "ap-south-2"], var.secondary_region)
    error_message = "Data localisation: only Indian AWS regions (ap-south-1, ap-south-2) are allowed."
  }
}

variable "primary_cidr" {
  type    = string
  default = "10.10.0.0/16"
}

variable "secondary_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "container_image" {
  type        = string
  description = "ECR image URI of the PaySecure payment service."
}

variable "primary_desired_count" {
  type    = number
  default = 3
}

variable "secondary_desired_count" {
  type        = number
  default     = 2
  description = "Warm standby baseline; scale to peak during failover (runbook 07)."
}

variable "aurora_instance_class" {
  type    = string
  default = "db.r6g.large"
}

variable "alert_email" { type = string }

variable "rpo_seconds" {
  type    = number
  default = 60
}

variable "primary_certificate_arn" {
  type    = string
  default = ""
}

variable "secondary_certificate_arn" {
  type    = string
  default = ""
}

variable "domain_name" {
  type    = string
  default = ""
}

variable "hosted_zone_id" {
  type    = string
  default = ""
}
