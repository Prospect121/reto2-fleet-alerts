# Guía de Onboarding — Levantar el Reto 2 desde otra PC

Esta guía permite a cualquier integrante del equipo (o un evaluador) clonar el repo, desplegar la infraestructura en AWS y correr la prueba de carga end-to-end **desde cero**, sin contexto previo del proyecto.

**Tiempo estimado**: 30-45 minutos (la mayor parte espera por `terraform apply` y la verificación SES).

---

## 0. Pre-requisitos (instalación una vez por máquina)

Verifica las versiones con `aws --version`, `terraform -version`, `k6 version`, `git --version`. Si falta algo, instálalo:

| Herramienta | Versión mínima | Windows (winget) | macOS (brew) | Linux (apt/dnf) |
|---|---|---|---|---|
| **AWS CLI** | v2 | `winget install Amazon.AWSCLI` | `brew install awscli` | `sudo apt install awscli` |
| **Terraform** | 1.6+ | `winget install Hashicorp.Terraform` | `brew install terraform` | Ver hashicorp.com/downloads |
| **k6** | 0.45+ | `winget install k6.k6` | `brew install k6` | Ver k6.io/docs/get-started/installation |
| **Git** | cualquiera | `winget install Git.Git` | `brew install git` | `sudo apt install git` |
| **Node.js** *(opcional)* | 18+ | `winget install OpenJS.NodeJS` | `brew install node` | Ver nodejs.org |

> **Node.js solo se necesita si vas a regenerar la presentación o el informe Word**. No hace falta para el deploy.

### Verificación rápida

```bash
aws --version           # aws-cli/2.x
terraform -version      # Terraform v1.6+
k6 version              # k6 v0.45+
git --version           # git 2.x
```

---

## 1. Cuenta AWS y credenciales

Necesitas una cuenta AWS con permisos suficientes para crear: API Gateway, Lambda, SQS, SES, IAM, CloudWatch. Una cuenta personal con tu IAM user de admin alcanza.

### 1.1 Crear access keys (si no las tienes)

AWS Console → IAM → Users → tu-usuario → Security credentials → **Create access key** → "Command Line Interface (CLI)" → guarda el Access Key ID y el Secret.

### 1.2 Configurar el AWS CLI

```bash
aws configure
# AWS Access Key ID:     AKIA...
# AWS Secret Access Key: ...
# Default region name:   us-east-1     <-- IMPORTANTE: us-east-1
# Default output format: json
```

### 1.3 Verificar que apunta a AWS real (no LocalStack u otro endpoint)

```bash
aws sts get-caller-identity
```

Debe retornar tu Account ID real y el ARN de tu IAM user. Si ves un error de "endpoint URL: http://localhost:4566" es porque tienes variables de LocalStack persistentes; bórralas:

**Windows (PowerShell)** — cerrar y reabrir terminal después:
```powershell
[Environment]::SetEnvironmentVariable('AWS_ENDPOINT_URL',     $null, 'User')
[Environment]::SetEnvironmentVariable('AWS_ACCESS_KEY_ID',    $null, 'User')
[Environment]::SetEnvironmentVariable('AWS_SECRET_ACCESS_KEY',$null, 'User')
```

**macOS / Linux**: edita `~/.bashrc` o `~/.zshrc` y elimina cualquier `export AWS_ENDPOINT_URL=...` o `export AWS_ACCESS_KEY_ID=test`. Recarga con `source ~/.bashrc`.

---

## 2. Clonar el repositorio

```bash
git clone https://github.com/Prospect121/reto2-fleet-alerts.git
cd reto2-fleet-alerts
git checkout v2-security-and-latency
```

---

## 3. Configurar variables del proyecto

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edita `terraform.tfvars` con tu editor favorito. **Solo dos líneas son obligatorias**: el correo Gmail al que llegará la alerta. Puedes usar el mismo Gmail como `from` y `to` (SES sandbox solo necesita una verificación):

```hcl
aws_region       = "us-east-1"
project_name     = "reto2-fleet-alerts"
environment      = "prod"
alert_email_to   = "TU-CORREO@gmail.com"     # <-- ajustar
alert_email_from = "TU-CORREO@gmail.com"     # <-- ajustar (puede ser el mismo)
```

> **No commitees `terraform.tfvars`** — está en `.gitignore`. Solo el `.example` debe versionarse.

---

## 4. Desplegar la infraestructura

```bash
terraform init      # descarga providers (~30 segundos)
terraform apply     # crea 30 recursos (~3-5 minutos)
```

Cuando termine, Terraform imprime los outputs:

```
api_endpoint_url = "https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/events"
api_key          = <sensitive>
queue_url        = "https://sqs.us-east-1.amazonaws.com/.../reto2-fleet-alerts-events"
ses_verification_pending = "Revisa la bandeja de TU-CORREO@gmail.com..."
```

---

## 5. Verificar el correo en SES (paso manual)

AWS SES envía un correo titulado **"Amazon Web Services - Email Address Verification Request"** a la dirección que configuraste. Abre tu Gmail y haz click en el link **"verify this email address"**.

Confirma con:

```bash
aws ses get-identity-verification-attributes \
  --identities TU-CORREO@gmail.com \
  --query 'VerificationAttributes."TU-CORREO@gmail.com".VerificationStatus' \
  --output text
```

Debe imprimir `Success`. Si dice `Pending`, vuelve al correo y haz click en el link.

> **Sin esta verificación, el envío de correos fallará silenciosamente** — la Lambda registrará un error de SES en CloudWatch y el mensaje irá a la DLQ.

---

## 6. Smoke test (un solo Emergency)

Esto valida la cadena completa antes de la prueba de carga.

### 6.1 Capturar endpoint y key en variables de entorno

**Bash / Git Bash** (desde `terraform/`):
```bash
export API_URL=$(terraform output -raw api_endpoint_url)
export API_KEY=$(terraform output -raw api_key)
echo "URL = $API_URL"
echo "KEY length = ${#API_KEY}"
```

**PowerShell** (desde `terraform/`):
```powershell
$env:API_URL = terraform output -raw api_endpoint_url
$env:API_KEY = terraform output -raw api_key
$env:API_URL                                    # debe imprimir https://...
"API_KEY length = $($env:API_KEY.Length)"       # debe ser 40
```

> ⚠️ `terraform output` **debe correrse desde `terraform/`** (donde está el state). Si lo corres fuera, devuelve el warning "No outputs found" y la variable queda con basura ANSI.

### 6.2 Enviar una emergencia con curl

**Bash** (con jq opcional):
```bash
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"type":"Emergency","vehicle_plate":"SMOKE-001","coordinates":{"latitude":4.6,"longitude":-74.1},"status":"OK"}'
# Esperado: {"status":"queued"}
```

**PowerShell**:
```powershell
Invoke-WebRequest -Method Post -Uri $env:API_URL `
  -Headers @{ 'x-api-key' = $env:API_KEY } `
  -ContentType 'application/json' `
  -Body '{"type":"Emergency","vehicle_plate":"SMOKE-001","coordinates":{"latitude":4.6,"longitude":-74.1},"status":"OK"}' `
  -UseBasicParsing
# Esperado: StatusCode 200, Content {"status":"queued"}
```

### 6.3 Verificar

- En tu Gmail debe llegar un correo con subject `🚨 Alerta de Emergencia - SMOKE-001` en menos de 10 segundos.
- En CloudWatch (`/aws/lambda/reto2-fleet-alerts-processor`) deben aparecer dos líneas: `[EMERGENCY_RECEIVED]` y `[EMAIL_SENT]`.

Si pasa, el sistema está OK para la carga. Si no llega el correo:
- Confirma que SES está en `Success` (paso 5).
- Revisa la cola DLQ por si hubo errores: `aws sqs get-queue-attributes --queue-url $(terraform output -raw dlq_url) --attribute-names ApproximateNumberOfMessages`.
- Revisa logs de Lambda: `aws logs tail /aws/lambda/reto2-fleet-alerts-processor --since 5m`.

---

## 7. Prueba de carga con k6 (1000 reqs / 30s)

Vuelve a la raíz del repo:

```bash
cd ..
```

**Bash**:
```bash
k6 run -e API_URL="$API_URL" -e API_KEY="$API_KEY" k6/k6-script.js
```

**PowerShell**:
```powershell
k6 run -e API_URL=$env:API_URL -e API_KEY=$env:API_KEY k6/k6-script.js
```

**Resultado esperado**:
```
checks.............: 100.00% 1000 out of 1000
http_req_failed....: 0.00%   0 out of 1000
duración total....: ~11s
```

Y k6 imprime:
```
>>> EMERGENCY sent at iteration 1000 / 1000 — sent_at=2026-XX-XXTHH:MM:SS.sssZ
```

> Por defecto el script usa `EMERGENCY_MODE=single`: solo la iteración #1000 es Emergency. Si quieres el modo legacy (5% emergencias), agrega `-e EMERGENCY_MODE=rate -e EMERGENCY_RATE=0.05`.

En tu Gmail debe llegar **un correo** con subject `🚨 Alerta #1000/1000 - PLACA-XXX`. La diferencia entre el `sent_at` (visible en el body del correo) y la hora de llegada que muestra Gmail (header Date) es la métrica de la rúbrica — debe ser **menos de 15 segundos**.

---

## 8. Inspeccionar logs (opcional)

Capturar los logs del último Emergency procesado:

```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/reto2-fleet-alerts-processor \
  --filter-pattern '"EMERGENCY_RECEIVED" "EMAIL_SENT"' \
  --query 'events[].message' --output text
```

En PowerShell, reemplaza `\` por backtick `` ` `` al final de cada línea.

---

## 9. Destruir la infraestructura (cuando termines)

**MUY IMPORTANTE**: AWS cobra por hora mientras la API Gateway, Lambda y SQS están desplegados. Cuando hayas terminado las pruebas, ejecuta:

```bash
cd terraform
terraform destroy
```

Confirma con `yes` cuando pregunte. Esto elimina los **30 recursos** creados, incluyendo:
- API Gateway + stage + deployment + API Key + usage plan
- SQS queue + DLQ + alarma
- Lambda + alias + event source mapping
- IAM roles y policies
- CloudWatch log groups (con sus logs)
- SES email identity (deja Gmail intacto)

> Si después quieres volver a desplegar, simplemente corre `terraform apply` otra vez. **Importante**: el endpoint URL y la API Key serán DIFERENTES (no son persistentes entre destroys). Vuelve a hacer `terraform output` para obtener los nuevos valores.

---

## 10. Regenerar los entregables (opcional, requiere Node.js)

Solo si modificas el `build-pptx.js`, `build-docx.js` o el diagrama y quieres regenerar:

```bash
# Una sola vez por máquina
npm install -g pptxgenjs sharp docx

# Convertir el SVG actualizado a PNG (si modificaste el diagrama)
NODE_PATH="$(npm root -g)" node -e "require('sharp')('docs/architecture.drawio.svg', {density: 200}).png().toFile('docs/architecture.png')"

# Regenerar la presentación PowerPoint
NODE_PATH="$(npm root -g)" node docs/build-pptx.js

# Regenerar el informe Word
NODE_PATH="$(npm root -g)" node docs/build-docx.js
```

En PowerShell, reemplaza `$(npm root -g)` por el path real (por ejemplo `"C:\Program Files\nodejs\node_modules"`).

---

## Errores comunes y soluciones

| Síntoma | Causa más común | Solución |
|---|---|---|
| `terraform apply` falla con `InvalidParameterValueException: Specified ReservedConcurrentExecutions exceeds account quota` | Cuenta AWS nueva con quota total = 10 | Ya está mitigado en este proyecto: usamos `scaling_config.maximum_concurrency` en el ESM, no `reserved_concurrent_executions` en la Lambda. Si te sale el error, revisa que tu rama esté en `v2-security-and-latency`. |
| `403 Forbidden` en todos los requests con `x-api-key` correcto | API Key recién creada, propagación lenta | Espera 60 segundos después de `terraform apply` y reintenta. |
| `terraform output` devuelve "No outputs found" + caracteres ANSI raros | Lo corriste fuera de `terraform/` | Vuelve a entrar a `terraform/` y reintenta. |
| El correo no llega a Gmail | SES no verificado | Paso 5 — confirma el link. |
| El correo llega pero deltas en el log son negativos | Drift de reloj cliente Windows | Como admin: `w32tm /resync /force`. No afecta a la rúbrica (timestamps server-side son válidos). |
| `k6 run` falla con "invalid URL" | `$API_URL` está vacía o tiene basura ANSI | Ver paso 6.1; verifica con `echo $API_URL` antes de correr k6. |
| `aws ses verify-email-identity` "User is not authorized" | Tu IAM user no tiene `ses:VerifyEmailIdentity` | Adjunta la policy `AmazonSESFullAccess` o ejecuta el `terraform apply` con un usuario admin. |

---

## Resumen ultra-rápido (copy-paste para alguien con todo instalado)

```bash
git clone https://github.com/Prospect121/reto2-fleet-alerts.git
cd reto2-fleet-alerts
git checkout v2-security-and-latency

cd terraform
cp terraform.tfvars.example terraform.tfvars
# editar emails en terraform.tfvars
terraform init && terraform apply -auto-approve

# Confirmar link de verificación SES en Gmail
# Capturar URL y KEY:
export API_URL=$(terraform output -raw api_endpoint_url)
export API_KEY=$(terraform output -raw api_key)

# Smoke test
curl -X POST "$API_URL" -H "Content-Type: application/json" -H "x-api-key: $API_KEY" \
  -d '{"type":"Emergency","vehicle_plate":"TEST-001","coordinates":{"latitude":0,"longitude":0},"status":"OK"}'

# Prueba de carga
cd ..
k6 run -e API_URL="$API_URL" -e API_KEY="$API_KEY" k6/k6-script.js

# Cuando termines:
cd terraform
terraform destroy -auto-approve
```
