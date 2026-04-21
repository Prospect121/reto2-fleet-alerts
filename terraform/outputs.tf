output "api_endpoint_url" {
  description = "URL POST para enviar eventos (usar en k6 y curl)"
  value       = "${aws_api_gateway_stage.prod.invoke_url}/events"
}

output "queue_url" {
  value = aws_sqs_queue.events.url
}

output "dlq_url" {
  value = aws_sqs_queue.dlq.url
}

output "lambda_name" {
  value = aws_lambda_function.processor.function_name
}

output "lambda_log_group" {
  value = aws_cloudwatch_log_group.lambda.name
}

output "ses_verification_pending" {
  description = "Recordatorio: confirmar el email de verificación SES antes de probar"
  value       = "Revisa la bandeja de ${var.alert_email_from} y haz click en el link de verificación de AWS SES."
}
