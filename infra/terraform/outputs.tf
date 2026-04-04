output "sentry_dsn_parameter_name" {
  value = aws_ssm_parameter.sentry_dsn.name
}

output "alarm_email_parameter_name" {
  value = aws_ssm_parameter.alarm_email.name
}