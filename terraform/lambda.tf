# =========================================
# Lambda — Processor (SQS -> SES)
# =========================================

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambda/handler.py"
  output_path = "${path.module}/build/handler.zip"
}

resource "aws_lambda_function" "processor" {
  function_name = "${var.project_name}-processor"
  role          = aws_iam_role.lambda_exec.arn
  runtime       = "python3.12"
  handler       = "handler.lambda_handler"
  architectures = ["x86_64"]

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  timeout     = var.lambda_timeout_seconds
  memory_size = var.lambda_memory_mb

  # NOTA: el tope de 10 instancias simultáneas se aplica en el event source mapping
  # (scaling_config.maximum_concurrency). No usamos reserved_concurrent_executions
  # porque en cuentas nuevas de AWS la cuota total es 10, y reservar 10 aquí
  # dejaría 0 para cualquier otra Lambda (AWS lo rechaza).
  # Como Lambda SOLO se invoca desde SQS, el cap del event source mapping es efectivo.

  environment {
    variables = {
      ALERT_EMAIL_TO   = var.alert_email_to
      ALERT_EMAIL_FROM = var.alert_email_from
      LOG_LEVEL        = "INFO"
    }
  }

  logging_config {
    log_format = "Text"
    log_group  = aws_cloudwatch_log_group.lambda.name
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_cloudwatch_log_group.lambda,
  ]
}

# =========================================
# Event Source Mapping — SQS -> Lambda
# =========================================
# batch_size=10 + window=0  -> latencia mínima, máximo throughput
# ReportBatchItemFailures   -> si 1 msg falla, solo ése vuelve a la cola
# maximum_concurrency=10    -> refuerza el tope de 10 instancias

resource "aws_lambda_event_source_mapping" "sqs" {
  event_source_arn                   = aws_sqs_queue.events.arn
  function_name                      = aws_lambda_function.processor.arn
  batch_size                         = var.sqs_batch_size
  maximum_batching_window_in_seconds = 0
  function_response_types            = ["ReportBatchItemFailures"]
  enabled                            = true

  scaling_config {
    maximum_concurrency = var.lambda_reserved_concurrency
  }
}
