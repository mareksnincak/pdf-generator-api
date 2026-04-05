variable "sentry_dsn" {
  type      = string
  sensitive = true
}

variable "alarm_email" {
  type = string
}

provider "aws" {
  region = "eu-central-1"
}

resource "aws_ssm_parameter" "sentry_dsn" {
  name  = "pdf-generator-api-sentry-dsn"
  type  = "String"
  value = var.sentry_dsn

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "alarm_email" {
  name  = "pdf-generator-api-alarm-email"
  type  = "String"
  value = var.alarm_email

  lifecycle {
    ignore_changes = [value]
  }
}
