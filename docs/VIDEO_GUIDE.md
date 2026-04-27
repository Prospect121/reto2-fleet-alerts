# Guía para el Video de Explicación — Reto 2

Esta guía sirve para grabar un video de **8–12 minutos** que cubra los entregables exigidos por la rúbrica:
- Justificación de decisiones de arquitectura (0.5)
- Atributo de calidad más importante (0.5)
- Diagrama de arquitectura (0.5)
- Tácticas de arquitectura (1.0)
- Demostración del tiempo de entrega del correo (2.5)

---

## Antes de grabar (checklist)

- [ ] `terraform apply` ya ejecutado, `terraform output api_endpoint_url` retorna URL real.
- [ ] Email `erickcloud44@gmail.com` **verificado en SES** (link confirmado en Gmail).
- [ ] Bandeja de Gmail abierta y sin emails previos del sistema (búsqueda `"🚨 Alerta #"` debería estar vacía o filtrada por fecha).
- [ ] Pestañas listas en el navegador:
  1. AWS Console → API Gateway → `reto2-fleet-alerts` → Stages → prod (mostrar Rate=15, Burst=2000).
  2. AWS Console → Lambda → `reto2-fleet-alerts-processor` (mostrar runtime ARM64, SnapStart, alias `live`).
  3. AWS Console → SQS → `reto2-fleet-alerts-events` (mostrar la queue principal y la DLQ).
  4. AWS Console → CloudWatch → Log groups → `/aws/lambda/reto2-fleet-alerts-processor` → Live Tail abierto.
  5. Gmail abierto en `erickcloud44@gmail.com`.
- [ ] VS Code abierto en `reto2-fleet-alerts/` con `docs/ARCHITECTURE.md` y `lambda/handler.py` visibles.
- [ ] Terminal PowerShell abierta dentro de `reto2-fleet-alerts/` (root).
- [ ] OBS / grabador con audio probado, captura de pantalla a 1080p.

---

## Estructura sugerida del video (8–12 min)

### 0:00 – 0:30 · Intro (30s)
> "Hola, soy Erick, este es mi reto 2 del Diplomado en Arquitecturas Cloud, Módulo 2. Voy a presentar el sistema de alerta temprana para flota vehicular. El sistema recibe 1000 eventos en 30 segundos por un endpoint, detecta los `type=Emergency` y manda un correo a Gmail en menos de 15 segundos. Todo está en AWS, 100% Terraform, repo público en GitHub."

### 0:30 – 1:30 · Diagrama y flujo (1 min)
- Mostrar `docs/ARCHITECTURE.md` sección 1 (diagrama ASCII) en pantalla completa.
- Recorrer el flujo de izquierda a derecha:
  > "El cliente k6 manda POST con `x-api-key` al API Gateway. La integración del API Gateway es directa a SQS — sin Lambda de ingesta — entonces responde 200 en cuanto la cola acepta. SQS desacopla y bufferiza. La Lambda hace polling de SQS en batches de 10, filtra por `type=Emergency`, y dispara un `SendEmail` de SES. Si todo falla 3 veces, el mensaje cae a la DLQ y suena una alarma de CloudWatch."

### 1:30 – 3:00 · Decisiones de arquitectura (1.5 min)
Abrir `docs/ARCHITECTURE.md` sección 2 (tabla). Recorrer **3 decisiones clave**:

1. **API Gateway REST en lugar de HTTP API v2**
   > "REST es el único que expone `rate_limit` y `burst_limit` nativos por stage — el reto exige rate=15 explícito. HTTP API es más barato pero no puede cumplir esa restricción."

2. **Integración API GW → SQS directa (sin Lambda de ingesta)**
   > "Eliminé un salto: en vez de API GW → Lambda → SQS, mando los eventos directo a SQS desde el API Gateway con un VTL template. Eso me ahorra 100-200 ms por request, baja costo, y el cliente recibe 200 apenas SQS acepta el mensaje."

3. **SQS Standard + DLQ**
   > "FIFO está limitado a 300 msg/s, no sirve para el pico de 33 req/s en burst. Standard tiene throughput ilimitado y desacopla la ingesta del procesamiento, garantizando 0% pérdida. La DLQ recibe mensajes que fallan 3 veces, con alarma asociada."

(Mencionar de paso: ARM64 + SnapStart para mejor cold start, y API Key para seguridad.)

### 3:00 – 4:00 · Atributo de calidad (1 min)
Abrir `ARCHITECTURE.md` sección 3.
> "El atributo de calidad #1 que prioricé es **Performance**, específicamente la latencia desde el último envío en k6 hasta la llegada del correo. Razón: el 50% del puntaje del reto depende directamente de este número — menos de 15 segundos da 2.5 puntos. En sistemas de alerta temprana reales, segundos cuentan."
>
> "Como atributos secundarios, prioricé Reliability — con SQS y DLQ ningún evento se pierde — y Scalability, porque el burst del API GW absorbe el pico inicial."

### 4:00 – 6:00 · Tácticas de arquitectura (2 min)
Abrir `ARCHITECTURE.md` sección 4. Mencionar **una táctica por categoría** y mostrar dónde está en el código:

- **Performance / Introduce concurrency** → mostrar `terraform/lambda.tf` con `scaling_config { maximum_concurrency = 10 }`.
- **Performance / Manage event rate** → mostrar `terraform/apikey.tf` con `throttle_settings { rate_limit = 15, burst_limit = 2000 }`.
- **Availability / Retry** → mostrar `lambda/handler.py` función `lambda_handler` con `batchItemFailures` y la cola DLQ en `terraform/sqs.tf` con `maxReceiveCount = 3`.
- **Modifiability / Use intermediaries (broker)** → señalar SQS en el diagrama: "Si mañana cambio Lambda por ECS, ni el API ni el cliente cambian — la cola es el contrato."
- **Security / Limit access** → mostrar `terraform/iam.tf`: el rol de Lambda solo tiene `ses:SendEmail`, el rol del API GW solo `sqs:SendMessage`.

### 6:00 – 9:00 · Demo en vivo (3 min) — **lo más importante**
Esta es la sección que da los 2.5 puntos del tiempo de entrega. Hacerlo en un **solo take**:

1. **Mostrar la consola de AWS** con CloudWatch Live Tail abierto sobre `/aws/lambda/reto2-fleet-alerts-processor`.
2. **Mostrar Gmail** en `erickcloud44@gmail.com` con la búsqueda `subject:"🚨 Alerta #"` aplicada (debe estar vacía o con runs anteriores claramente marcados).
3. **En la terminal**, ejecutar:
   ```powershell
   cd terraform
   $env:API_URL = terraform output -raw api_endpoint_url
   $env:API_KEY = terraform output -raw api_key
   cd ..
   k6 run -e API_URL=$env:API_URL -e API_KEY=$env:API_KEY k6/k6-script.js
   ```
4. **Mientras k6 corre** (~10s), narrar:
   > "Estoy mandando 1000 requests en menos de 15 segundos, entre 10 VUs. Por defecto el script está en modo `single` — la iteración 1000 es la única `Emergency`, las otras 999 son `Position`. Eso me permite medir con precisión: el último envío en k6 ES la única emergencia."
5. **Cuando k6 termine**, mostrar:
   - El log `>>> EMERGENCY sent at iteration 1000 / 1000 — sent_at=2026-04-27T...` en el output de k6 (anotar mentalmente la hora).
   - `checks: 100.00% 1000 out of 1000` y `http_req_failed: 0.00%` → restricción cumplida.
6. **Cambiar a CloudWatch Live Tail** y mostrar:
   ```
   [EMERGENCY_RECEIVED] ts=... request_seq=1000 plate=...
   [EMAIL_SENT] ts=... delta_sent_to_received=... delta_ses_call=... delta_total=...
   ```
7. **Cambiar a Gmail**, refrescar, mostrar el correo recibido. Abrirlo y mostrar:
   - Subject: `🚨 Alerta #1000/1000 - PLATE-XXX`.
   - Tabla de timestamps (sent_at / received_at / email_sent_at).
   - Deltas calculados.
8. **Calcular en pantalla** la diferencia entre el `sent_at` del body y la hora de llegada que muestra Gmail (esquina superior derecha del email):
   > "El último envío en k6 fue a las HH:MM:SS.sss. El correo llegó a las HH:MM:SS.sss según Gmail. Diferencia: X segundos. Bien debajo de los 15s — puntaje completo."

### 9:00 – 11:00 · Logs y cumplimiento (2 min)
- Volver a CloudWatch, **filtrar por `EMERGENCY_RECEIVED OR EMAIL_SENT`** y mostrar las 2 líneas (recepción + envío) — los logs requeridos por la rúbrica.
- Mostrar `docs/ARCHITECTURE.md` sección 5 (cumplimiento de restricciones) y leer rápido la tabla:
  > "Rate=15: implementado en el usage plan. Burst=2000: igual. Máx 10 procesadores: `scaling_config.maximum_concurrency=10`. 0% pérdida: SQS+DLQ. Logs de recepción y envío: ahí están."

### 11:00 – 12:00 · Cierre (1 min)
- Abrir el repo en GitHub, mostrar la estructura.
- Mencionar:
  > "Todo el código está en el repo público github.com/Prospect121/reto2-fleet-alerts en la rama `v2-security-and-latency`. Toda la infra es Terraform — `terraform apply` y queda. El script de k6 y la documentación están en `/docs`. Gracias."

---

## Tips de grabación

- **Resolución**: graba a 1080p. Si grabas a 720p, los textos de CloudWatch / VS Code se ven borrosos.
- **Audio**: usa micrófono externo o auriculares con micro. El audio del laptop suena hueco y mete eco.
- **Zoom**: cuando muestres CloudWatch, **haz zoom** (Ctrl/Cmd + en el browser) hasta que las líneas de log sean legibles. La pantalla de logs por defecto es ilegible al revisar el video en el celular.
- **Cursor**: activa "highlight cursor" en OBS (o en macOS "Aumentar el cursor"). Ayuda al espectador a seguirte.
- **Velocidad**: habla despacio, pero edita los silencios. Mejor 9 minutos densos que 12 con pausas.
- **Si el demo falla en vivo**: graba el demo aparte y empálmalo. No reinicies el video.
- **Subtítulos**: si vas a subir a YouTube/Drive, autogenera subtítulos al final — facilita evaluación.

---

## Errores comunes a evitar

| Síntoma | Causa | Fix antes de grabar |
|---|---|---|
| `terraform output` devuelve "No outputs found" | Lo corriste fuera de `terraform/` | `cd terraform` antes |
| k6 dice "invalid URL" | `$env:API_URL` está vacía o con texto de warning | Verifica `$env:API_URL` antes de correr k6 |
| 403 Forbidden en todos los requests | API Key recién creada, propagation lag | Espera 60s después del `terraform apply` |
| No llega el correo | SES sin verificar | Confirma el link en `erickcloud44@gmail.com` |
| Llega tarde (>15s) la primera vez | Cold start de Lambda sin SnapStart aplicado | Después del primer apply, hacé un dummy invoke para "calentar" el alias |
| Gmail muestra el correo en spam | Headers SES no fully autenticados al primer envío | Marca como "no es spam" antes del demo, o usa un envío de prueba previo |

---

## Comandos exactos para tener a mano (copy-paste durante el demo)

```powershell
# 1. Setup vars
cd terraform
$env:API_URL = terraform output -raw api_endpoint_url
$env:API_KEY = terraform output -raw api_key
cd ..
echo $env:API_URL

# 2. Run k6 (single emergency mode — default)
k6 run -e API_URL=$env:API_URL -e API_KEY=$env:API_KEY k6/k6-script.js

# 3. Tail logs (en otra terminal)
aws logs tail /aws/lambda/reto2-fleet-alerts-processor --follow --filter-pattern "EMERGENCY_RECEIVED EMAIL_SENT"

# 4. Capturar logs para entregable (después del demo)
aws logs tail /aws/lambda/reto2-fleet-alerts-processor --since 5m --filter-pattern "EMERGENCY_RECEIVED EMAIL_SENT" > docs/execution-logs.txt
```
