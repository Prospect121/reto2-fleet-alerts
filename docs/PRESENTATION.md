# Outline de Presentación Sincrónica — Reto 2

Para los estudiantes que asisten al encuentro sincrónico, esta es la estructura de la presentación + demo en vivo. Cada bullet es una **slide** sugerida (8 slides totales) o un momento del demo.

---

## Slide 1 — Portada (15s)
- **Título**: Sistema de Alerta Temprana para Flota Vehicular
- **Subtítulo**: Reto 2 — Diplomado Arquitecturas Cloud, Módulo 2
- Tu nombre + fecha
- Logos: AWS, Terraform, Python, k6

---

## Slide 2 — El reto en 3 frases (45s)
- Endpoint que recibe 1000 eventos en 30s, 100% procesados.
- Cuando llega un evento `type=Emergency`, mandar correo a Gmail.
- Restricciones: API GW rate=15/s, máx 10 procesadores, correo en <15s para puntaje completo.

> **Hablar**: "El núcleo del problema es priorizar latencia sin perder confiabilidad."

---

## Slide 3 — Arquitectura (1 min)
- Diagrama (importar de `docs/ARCHITECTURE.md` sección 1, o re-dibujarlo en draw.io / Excalidraw).
- Recorrer el flujo: **k6 → API GW (REST) → SQS → Lambda → SES → Gmail**, con DLQ + CloudWatch lateral.
- Resaltar **integración directa API GW → SQS** (sin Lambda de ingesta).

> **Hablar**: "Cada componente está aquí por una razón específica. La integración directa a SQS me ahorra latencia y costo. SQS me da el desacople y el buffer. Lambda me da el control de concurrencia. SES me da entrega rápida a Gmail."

---

## Slide 4 — Decisiones de arquitectura (1.5 min)
Tabla con 5 columnas máximo (las más importantes):

| Pregunta | Respuesta | Razón |
|---|---|---|
| ¿REST o HTTP API? | **REST** | Único con `rate/burst` nativo (requisito) |
| ¿Lambda de ingesta? | **No** | API GW va directo a SQS — menos latencia |
| ¿FIFO o Standard? | **Standard** | Throughput ilimitado vs 300 msg/s |
| ¿Email vía SNS o SES? | **SES** | 1-3s vs 10-30s |
| ¿Cómo limito a 10 procesadores? | **`scaling_config.maximum_concurrency`** en ESM | Sin tocar quota global del account |

> **Hablar**: "Hablamos sobre las alternativas y por qué cada decisión."

---

## Slide 5 — Atributo de calidad (1 min)
- **Performance** (latencia de notificación) es el #1.
- **Por qué**: 50% del puntaje del reto, y en alerta temprana real cada segundo cuenta.
- **Secundarios**: Reliability (SQS+DLQ), Scalability (burst+queue), Observability (logs estructurados).

> **Hablar**: "Optimizar para latencia me llevó a varias decisiones: ARM64+SnapStart en Lambda, integración directa API GW→SQS, batch_size=10 sin window de espera."

---

## Slide 6 — Tácticas (2 min)
4 categorías × 1 táctica = 4 bullets:

- **Performance**: *Introduce concurrency* — Lambda paralela gobernada por SQS hasta 10 instancias.
- **Availability**: *Exception handling / Retry* — `ReportBatchItemFailures` reintenta solo el mensaje fallido (no todo el batch).
- **Modifiability**: *Use intermediaries* — SQS desacopla productor y consumidor; cambiar Lambda por ECS no afecta al cliente.
- **Security**: *Limit access* — IAM roles con principio de mínimo privilegio + API Key requerida en el endpoint.

> **Hablar**: Una frase por táctica con la línea exacta del Terraform/Python que la implementa.

---

## Slide 7 — DEMO EN VIVO (3 min)
**Esta es la slide del 50% del puntaje. Ensáyala.**

Pasos exactos:

1. Mostrar Gmail vacío en `erickcloud44@gmail.com` (búsqueda `subject:"🚨 Alerta #"`).
2. En la terminal:
   ```powershell
   cd terraform
   $env:API_URL = terraform output -raw api_endpoint_url
   $env:API_KEY = terraform output -raw api_key
   cd ..
   k6 run -e API_URL=$env:API_URL -e API_KEY=$env:API_KEY k6/k6-script.js
   ```
3. Mientras corre k6 (~10s): narrar que el último de los 1000 envíos es la única `Emergency`.
4. Cuando termine: mostrar `checks: 100.00% 1000/1000` + el log `>>> EMERGENCY sent at iteration 1000`.
5. Cambiar a CloudWatch Live Tail: mostrar `[EMERGENCY_RECEIVED]` y `[EMAIL_SENT]`.
6. Cambiar a Gmail, refrescar, abrir el correo.
7. Mostrar el cuerpo del email:
   - Subject: `🚨 Alerta #1000/1000 - PLATE-XXX`.
   - Tabla de 3 timestamps + 3 deltas.
8. Calcular en pantalla: **Gmail Date − sent_at = X segundos** → demostrar que <15s.

> **Mensaje clave**: "El último envío en k6 ES la única emergencia, así no hay ambigüedad sobre qué timestamp comparar."

---

## Slide 8 — Cumplimiento de la rúbrica + cierre (45s)
Tabla rápida:

| Requisito de la rúbrica | Estado |
|---|---|
| Justificación de decisiones | ✅ slide 4 |
| Atributo de calidad | ✅ slide 5 |
| Diagrama | ✅ slide 3 |
| Tácticas | ✅ slide 6 |
| Tiempo de entrega <15s | ✅ demo en vivo |
| Logs de recepción y envío | ✅ CloudWatch en demo |

- Repo público: `github.com/Prospect121/reto2-fleet-alerts` (rama `v2-security-and-latency`).
- Toda la infra es Terraform: 30 recursos, `terraform apply` y queda.
- Preguntas.

---

## Tips para la presentación sincrónica

- **Tiempo total**: apunta a 10–11 minutos hablando + 5 minutos de demo + 4 minutos de Q&A = 20 min.
- **No leas las slides**. Las slides son apoyo; tú narras lo que el evaluador no puede leer en pantalla.
- **El demo es lo que da los 2.5 puntos**. Si te falta tiempo, recorta slide 4 (decisiones) — no recortes el demo.
- **Ten dos terminales abiertas**: una para `k6 run`, otra para `aws logs tail`. Cambiar entre ellas en vivo se ve profesional.
- **Plan B si falla la red durante el demo**: ten una **grabación previa del demo funcionando** y muéstrala como respaldo. Avisa que es grabación.
- **Plan C si falla SES** (correo no llega): muestra los logs de CloudWatch — `[EMAIL_SENT]` confirma que la Lambda invocó SES exitosamente. La latencia SES→Gmail es la única parte fuera de tu control.

---

## Material visual recomendado

- **Diagrama**: re-dibujar el ASCII de `docs/ARCHITECTURE.md` en draw.io / Excalidraw / Figma para que se vea profesional. Exportar PNG y meterlo en la slide 3.
- **Captura del email recibido**: cuando hagas un dry-run del demo el día anterior, screenshot del email con todos los timestamps. Tenerla lista por si el demo en vivo falla.
- **Captura de CloudWatch**: igual, screenshot de las 2 líneas `[EMERGENCY_RECEIVED]` + `[EMAIL_SENT]` con timestamps reales.

---

## Pregunta-trampa probable y respuesta

**Q**: "¿Por qué no usaste WAF / Cognito / X-Ray / CI-CD?"
**A**: "Por scope. La rúbrica pide cumplir las restricciones funcionales y de tiempo; no pide controles de seguridad avanzados ni observabilidad distribuida. La capa que sí agregué — API Key con usage plan — me da autenticación básica y throttling per-client sin sumar complejidad. Lo demás está documentado en el README como mejoras 'siguientes pasos' si esto fuera a producción."

**Q**: "¿Qué pasa si SES falla durante el envío?"
**A**: "El handler atrapa el `ClientError` y agrega ese `messageId` a `batchItemFailures`. SQS lo regresa a la cola hasta 3 veces (visibility_timeout=60s). Si sigue fallando, va a la DLQ y la alarma de CloudWatch dispara. Ningún mensaje se pierde."

**Q**: "¿Por qué `batch_size=10` y no 1?"
**A**: "Para maximizar throughput sin sacrificar latencia. Con `window=0s`, Lambda no espera para llenar el batch — toma lo que haya. Si sólo hay 1 mensaje en la cola, lo procesa solo. Si hay 10, los procesa juntos. Con esto las 10 instancias procesan los 1000 eventos en paralelo de forma óptima."
