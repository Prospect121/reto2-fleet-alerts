"""
Lambda handler — Reto 2: Fleet alert early-warning system.

Flow:
  SQS batch ─▶ for each record:
    - parse JSON body
    - log reception timestamp
    - if type == "Emergency": SES SendEmail to configured Gmail, log send timestamp
    - on exception: add messageId to batchItemFailures (ReportBatchItemFailures)

Env vars:
  ALERT_EMAIL_TO   — Gmail destinatario verificado en SES
  ALERT_EMAIL_FROM — Email remitente verificado en SES (mismo Gmail en sandbox)
"""

import json
import logging
import os
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

log = logging.getLogger()
log.setLevel(logging.INFO)

ses = boto3.client("ses")

EMAIL_TO = os.environ["ALERT_EMAIL_TO"]
EMAIL_FROM = os.environ["ALERT_EMAIL_FROM"]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _build_email_html(plate: str, status: str, coords: dict, received_at: str) -> str:
    lat = coords.get("latitude", "N/A")
    lon = coords.get("longitude", "N/A")
    return f"""
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2 style="color:#c0392b;">🚨 Alerta de Emergencia</h2>
        <p><strong>Placa:</strong> {plate}</p>
        <p><strong>Estado:</strong> {status}</p>
        <p><strong>Evento:</strong> Emergency</p>
        <p><strong>Coordenadas:</strong> lat={lat}, lon={lon}</p>
        <p><strong>Recibido (UTC):</strong> {received_at}</p>
        <hr/>
        <p style="font-size:0.8em;color:#888;">Sistema de alerta temprana — flota vehicular</p>
      </body>
    </html>
    """.strip()


def _send_emergency_email(body: dict, received_at: str) -> None:
    plate = body.get("vehicle_plate", "UNKNOWN")
    status = body.get("status", "UNKNOWN")
    coords = body.get("coordinates", {}) or {}
    ses.send_email(
        Source=EMAIL_FROM,
        Destination={"ToAddresses": [EMAIL_TO]},
        Message={
            "Subject": {"Data": "🚨 Alerta de Emergencia", "Charset": "UTF-8"},
            "Body": {
                "Html": {
                    "Data": _build_email_html(plate, status, coords, received_at),
                    "Charset": "UTF-8",
                }
            },
        },
    )


def lambda_handler(event, context):
    failures = []
    records = event.get("Records", [])
    log.info(f"[BATCH_RECEIVED] size={len(records)} request_id={context.aws_request_id}")

    for record in records:
        message_id = record.get("messageId", "unknown")
        try:
            body = json.loads(record["body"])
            received_at = _now_iso()
            evt_type = body.get("type")
            plate = body.get("vehicle_plate", "UNKNOWN")

            if evt_type == "Emergency":
                log.info(
                    f"[EMERGENCY_RECEIVED] ts={received_at} "
                    f"message_id={message_id} plate={plate} payload={json.dumps(body)}"
                )
                _send_emergency_email(body, received_at)
                log.info(
                    f"[EMAIL_SENT] ts={_now_iso()} "
                    f"message_id={message_id} plate={plate} to={EMAIL_TO}"
                )
            else:
                # Position o cualquier otro tipo: log ligero, no email
                log.info(
                    f"[POSITION_RECEIVED] ts={received_at} "
                    f"message_id={message_id} plate={plate}"
                )

        except ClientError as e:
            log.exception(
                f"[SES_ERROR] message_id={message_id} error={e.response.get('Error', {})}"
            )
            failures.append({"itemIdentifier": message_id})
        except Exception as e:
            log.exception(f"[PROCESSING_ERROR] message_id={message_id} error={e}")
            failures.append({"itemIdentifier": message_id})

    return {"batchItemFailures": failures}
