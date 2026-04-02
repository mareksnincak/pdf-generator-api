variable "aws_region" {
  type = string
}

variable "sentry_dsn" {
  type = string
  sensitive = true
}

provider "aws" {
  region = var.aws_region
}

resource "aws_ssm_parameter" "sentry_dsn" {
  name = "pdf-generator-api-sentry-dsn"
  type = "SecureString"
  value = var.sentry_dsn

  lifecycle {
    ignore_changes = [value]
  }
}
