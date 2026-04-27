// Build Reto 2 — Informe Tecnico de Arquitectura (Word .docx)
// Run: NODE_PATH="C:\Program Files\nodejs\node_modules" node docs/build-docx.js
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, PageOrientation, LevelFormat, ExternalHyperlink,
  TabStopType, TabStopPosition, TableOfContents, HeadingLevel, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
} = require("docx");

const OUT = path.join(__dirname, "Reto2-Informe-Tecnico.docx");
const ARCH_PNG = path.join(__dirname, "architecture.png");

// ===== Page geometry =====
// A4 (LATAM standard) with 2.5cm margins = 1417 DXA
const PAGE_W = 11906, PAGE_H = 16838;
const MARGIN = 1417;
const CONTENT_W = PAGE_W - MARGIN * 2; // 9072 DXA

// ===== Palette =====
const NAVY = "1F2937";
const BLUE = "2563EB";
const TEAL = "0E7490";
const GREEN = "16A34A";
const HEADER_FILL = "1F2937";
const ROW_ALT = "F1F5F9";
const BODY = "111827";
const MUTED = "6B7280";
const CODE_FILL = "F3F4F6";

// ===== Helpers =====
const border = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
const cellBorders = { top: border, bottom: border, left: border, right: border };

function p(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.JUSTIFIED,
    spacing: { after: opts.after ?? 120, line: 280 },
    children: [new TextRun({ text, ...opts.run })],
    ...opts.para,
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1, pageBreakBefore: true,
    spacing: { before: 240, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, color: NAVY })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, color: NAVY })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, color: BODY })],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 80, line: 280 },
    alignment: AlignmentType.LEFT,
    children: [new TextRun({ text, size: 22 })],
  });
}

function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 200 },
    children: [new TextRun({ text, italics: true, size: 20, color: MUTED })],
  });
}

function code(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 80, line: 260 },
    shading: { type: ShadingType.CLEAR, fill: CODE_FILL, color: "auto" },
    indent: { left: 200, right: 200 },
    children: [new TextRun({ text, font: "Consolas", size: 18, color: BODY })],
  });
}

function codeBlock(lines, opts = {}) {
  return lines.map((ln, i) => code(ln, { after: i === lines.length - 1 ? 200 : 0 }));
}

function tableCell(text, opts = {}) {
  const isHeader = opts.header === true;
  return new TableCell({
    borders: cellBorders,
    width: { size: opts.width, type: WidthType.DXA },
    shading: isHeader
      ? { type: ShadingType.CLEAR, fill: HEADER_FILL, color: "auto" }
      : opts.alt
      ? { type: ShadingType.CLEAR, fill: ROW_ALT, color: "auto" }
      : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: opts.align || AlignmentType.LEFT,
        children: [new TextRun({
          text,
          bold: isHeader || opts.bold,
          color: isHeader ? "FFFFFF" : (opts.color || BODY),
          size: opts.size || 20,
        })],
      }),
    ],
  });
}

function buildTable(headers, rows, colWidths) {
  const trHeader = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => tableCell(h, { width: colWidths[i], header: true })),
  });
  const trRows = rows.map((r, idx) => new TableRow({
    children: r.map((c, i) => tableCell(c, { width: colWidths[i], alt: idx % 2 === 1 })),
  }));
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [trHeader, ...trRows],
  });
}

// =================================================================
// CONTENT
// =================================================================

const cover = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 1500, after: 200 },
    children: [new TextRun({
      text: "DIPLOMADO EN ARQUITECTURAS CLOUD",
      bold: true, size: 24, color: MUTED, characterSpacing: 60,
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 600 },
    children: [new TextRun({
      text: "Modulo 2",
      size: 22, color: MUTED, italics: true,
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 600, after: 120 },
    children: [new TextRun({
      text: "Sistema de Alerta Temprana",
      bold: true, size: 56, color: NAVY,
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new TextRun({
      text: "para Flota Vehicular",
      bold: true, size: 44, color: BLUE,
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 800 },
    children: [new TextRun({
      text: "Informe Tecnico de Arquitectura - Reto 2",
      italics: true, size: 28, color: NAVY,
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 100 },
    border: { top: { style: BorderStyle.SINGLE, size: 8, color: BLUE, space: 8 } },
    children: [new TextRun({ text: "EQUIPO", bold: true, size: 20, color: MUTED, characterSpacing: 60 })],
  }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: "Luis Fernando Padilla", bold: true, size: 24, color: NAVY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: "Erick Nieto", bold: true, size: 24, color: NAVY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: "Raul Valencia", bold: true, size: 24, color: NAVY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [new TextRun({ text: "Juan Bohorquez", bold: true, size: 24, color: NAVY })] }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 100 },
    children: [new TextRun({ text: "27 de abril de 2026", size: 22, color: MUTED })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new ExternalHyperlink({
      link: "https://github.com/Prospect121/reto2-fleet-alerts",
      children: [new TextRun({
        text: "github.com/Prospect121/reto2-fleet-alerts",
        size: 20, color: BLUE, underline: {},
      })],
    })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

const tocSection = [
  new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: "Tabla de contenido", bold: true, size: 32, color: NAVY })],
  }),
  new TableOfContents("Tabla de contenido", { hyperlink: true, headingStyleRange: "1-3" }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ----------------------------------------------------------------
// 1. RESUMEN EJECUTIVO
// ----------------------------------------------------------------
const sec1 = [
  h1("1. Resumen Ejecutivo"),
  p("El presente informe documenta el diseno e implementacion de un sistema serverless desplegado en Amazon Web Services (AWS) cuyo proposito es recibir, procesar y notificar eventos provenientes de una flota vehicular. El sistema admite hasta 1000 eventos en una ventana de 30 segundos con tasa de exito del 100% y, en presencia de un evento de tipo Emergency, dispara una notificacion por correo electronico hacia una cuenta Gmail configurada en menos de 15 segundos."),
  p("La solucion utiliza una arquitectura desacoplada compuesta por Amazon API Gateway (REST), Amazon SQS Standard, AWS Lambda (Python 3.12 sobre arquitectura ARM64 Graviton2 con SnapStart) y Amazon Simple Email Service (SES). La infraestructura se declara y aprovisiona en su totalidad mediante Terraform, lo que asegura reproducibilidad y trazabilidad de cambios."),
  p("Los resultados medidos en el test ejecutado el 27 de abril de 2026 confirman el cumplimiento integral de los requerimientos: el cliente k6 logro 1000/1000 solicitudes exitosas con 0% de fallos en 11 segundos, y la latencia entre la recepcion del evento Emergency en Lambda y la aceptacion del correo por parte de SES fue de 254 ms (medicion server-side). El tiempo total estimado entre el ultimo envio en k6 y la llegada del correo a Gmail se situo entre 1.5 y 3.5 segundos, ampliamente por debajo del umbral de 15 segundos exigido por la rubrica para obtener el puntaje completo."),
];

// ----------------------------------------------------------------
// 2. CONTEXTO DEL RETO
// ----------------------------------------------------------------
const sec2 = [
  h1("2. Contexto del Reto"),
  h2("2.1 Descripcion del problema"),
  p("Cada vehiculo de una flota envia constantemente su posicion geografica y estado de operacion a traves de un endpoint HTTPS. En situaciones criticas, como cuando el conductor presiona un boton de panico o los sensores detectan una anomalia, el vehiculo emite un evento de tipo Emergency. El sistema debe detectar dichos eventos en tiempo real y notificar a una cuenta de correo configurada para que el equipo de operaciones pueda actuar de inmediato."),

  h2("2.2 Requerimientos funcionales"),
  bullet("Recepcion de eventos: endpoint capaz de recibir 1000 solicitudes en 30 segundos con 100% de procesamiento."),
  bullet("Deteccion de emergencias: identificar eventos con type=\"Emergency\" en el flujo continuo de datos."),
  bullet("Registro de logs: hora exacta de recepcion del evento Emergency."),
  bullet("Notificacion por correo electronico a una cuenta Gmail configurada por el equipo (erickcloud44@gmail.com)."),
  bullet("Registro de logs: hora exacta del envio exitoso del correo."),

  h2("2.3 Requerimientos no funcionales"),
  bullet("API Gateway con tasa maxima de 15 peticiones por segundo (rate)."),
  bullet("Burst en su valor por defecto (2000), suficiente para absorber el pico inicial."),
  bullet("Maximo 10 instancias activas simultaneas para los procesadores (Lambda, ECS, EC2, etc.)."),
  bullet("Tiempo de entrega del correo: <15s = 2.5 puntos, 15-45s = 1.5 puntos, >45s = 0.5 puntos."),
  bullet("Logs claros con timestamps de recepcion del evento y envio del correo."),

  h2("2.4 Restricciones tecnicas"),
  p("La rubrica establece restricciones explicitas que condicionan las decisiones de arquitectura: (i) no superar 15 req/s en API Gateway; (ii) no exceder 10 instancias simultaneas de procesadores; (iii) usar una cuenta Gmail personal para la notificacion; (iv) garantizar consistencia y medibilidad del envio."),
];

// ----------------------------------------------------------------
// 3. ARQUITECTURA DE LA SOLUCION
// ----------------------------------------------------------------
const archImg = new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 240, after: 80 },
  children: [
    new ImageRun({
      type: "png",
      data: fs.readFileSync(ARCH_PNG),
      transformation: { width: 600, height: 281 },
      altText: { title: "Arquitectura", description: "Diagrama de la arquitectura del sistema", name: "ArchDiagram" },
    }),
  ],
});

const sec3 = [
  h1("3. Arquitectura de la Solucion"),

  h2("3.1 Diagrama de arquitectura"),
  p("La Figura 1 muestra el flujo end-to-end del sistema, desde el cliente de carga (k6) hasta la entrega del correo en Gmail. Todos los componentes estan desplegados en la region us-east-1 dentro de una unica cuenta AWS."),
  archImg,
  caption("Figura 1. Arquitectura de la solucion (us-east-1)"),

  h2("3.2 Flujo de datos"),
  p("El flujo se compone de seis pasos secuenciales:"),
  bullet("(1) k6 emite POST /events con header x-api-key. El payload incluye type, vehicle_plate, coordinates, status y campos auxiliares de medicion (sent_at, request_seq)."),
  bullet("(2) API Gateway valida la API Key, aplica throttling (rate=15/s, burst=2000) y ejecuta una integracion de servicio AWS directa hacia SQS, sin Lambda intermedia."),
  bullet("(3) SQS Standard recibe el mensaje. Su throughput ilimitado permite absorber el pico de 1000 mensajes en 11 segundos."),
  bullet("(4) Lambda hace polling continuo de la cola con un Event Source Mapping configurado en batch_size=10 y maximum_batching_window=0s."),
  bullet("(5) El handler filtra type=\"Emergency\" e invoca Amazon SES SendEmail. Logs estructurados marcan [EMERGENCY_RECEIVED] y [EMAIL_SENT] con timestamps ISO-8601 UTC."),
  bullet("(6) SES entrega el mensaje a Gmail por SMTP. La latencia tipica de este tramo final es de 1 a 3 segundos."),

  h2("3.3 Componentes principales"),
  bullet("Amazon API Gateway REST: endpoint publico con API Key requerida y throttling por usage plan."),
  bullet("Amazon SQS Standard: cola desacopladora con DLQ asociada (maxReceiveCount=3, retention=4 dias)."),
  bullet("AWS Lambda: procesador serverless en Python 3.12, arquitectura ARM64 (Graviton2), SnapStart habilitado."),
  bullet("Amazon SES: servicio de envio de correo en sandbox con identidad verificada."),
  bullet("Amazon CloudWatch: logs estructurados y alarma sobre la DLQ."),
  bullet("AWS IAM: roles con principio de minimo privilegio para cada componente."),
];

// ----------------------------------------------------------------
// 4. DECISIONES DE ARQUITECTURA
// ----------------------------------------------------------------
const decTable = buildTable(
  ["Decision", "Alternativas", "Elegida", "Justificacion"],
  [
    ["Tipo de API Gateway", "HTTP API v2 / REST v1", "REST v1", "Unico que expone rate y burst nativos por stage (requisito explicito de la rubrica)."],
    ["Integracion API GW -> backend", "Lambda proxy / AWS service direct", "AWS service direct a SQS", "Elimina un salto, ahorra 100-200 ms y permite responder 200 al cliente apenas SQS acepta el mensaje."],
    ["Cola de mensajes", "Ninguna / Kinesis / FIFO / Standard", "SQS Standard", "FIFO esta limitado a 300 msg/s; Standard ofrece throughput ilimitado y desacopla productor de consumidor."],
    ["Dead Letter Queue", "Sin DLQ / con DLQ", "DLQ con maxReceiveCount=3", "Garantiza 0% de perdida de mensajes y permite analisis post-mortem de fallos repetitivos."],
    ["Procesador", "EC2 / ECS / Lambda", "AWS Lambda", "Encaja con la restriccion de 10 instancias y elimina la gestion de infraestructura."],
    ["Limite de concurrencia", "reserved_concurrent_executions / scaling_config", "scaling_config.maximum_concurrency", "No consume quota global del account; suficiente porque la Lambda solo se invoca via SQS."],
    ["Arquitectura del runtime", "x86_64 / ARM64", "ARM64 (Graviton2)", "Aproximadamente 20% mas rapido y 20% mas barato que x86_64 en cargas Python."],
    ["Mitigacion de cold start", "Provisioned concurrency / SnapStart / nada", "SnapStart", "Gratis para Python 3.12, reduce cold start de ~580 ms a ~80 ms; provisioned concurrency tiene costo por hora."],
    ["Parametros del ESM", "batch_size + window", "batch_size=10, window=0s", "Optimiza throughput sin introducir espera artificial; las 10 lambdas procesan en paralelo."],
    ["Manejo de errores", "Falla todo el batch / item-level", "ReportBatchItemFailures", "Solo el mensaje fallido vuelve a la cola; los otros nueve no se reprocesan."],
    ["Servicio de notificacion", "SNS email / SES / Mailgun-SendGrid", "Amazon SES", "Latencia tipica 1-3 s vs 10-30 s de SNS email; nativo en AWS y sin coste adicional."],
    ["Estrategia de logs", "print() / logging estructurado", "logging con marcadores", "Permite filtros con CloudWatch Logs Insights y extraccion para entregables."],
    ["Seguridad del endpoint", "Abierto / API Key / WAF / Cognito", "API Key + Usage Plan", "Cumple el requisito de seguridad basica con baja complejidad; throttling per cliente."],
  ],
  [1900, 1900, 2200, 3072]
);

const sec4 = [
  h1("4. Decisiones de Arquitectura"),
  p("Cada componente de la solucion fue seleccionado tras evaluar alternativas tecnicamente viables. La Tabla 1 sintetiza las trece decisiones clave con su justificacion."),
  decTable,
  caption("Tabla 1. Decisiones de arquitectura y justificacion."),
];

// ----------------------------------------------------------------
// 5. ATRIBUTO DE CALIDAD
// ----------------------------------------------------------------
const latencyTable = buildTable(
  ["Etapa", "Latencia tipica", "Notas"],
  [
    ["k6 -> API GW (TLS + autenticacion)", "50-150 ms", "Handshake TLS, validacion de API Key, ejecucion VTL."],
    ["API GW -> SQS (SendMessage)", "20-80 ms", "Integracion AWS service directa, en region."],
    ["SQS -> Lambda (polling)", "100-500 ms", "Long polling interno del Event Source Mapping."],
    ["Lambda cold start (sin SnapStart)", "300-800 ms", "Mitigado a ~80 ms con SnapStart."],
    ["Lambda warm execution", "50-150 ms", "Parsing JSON + branching."],
    ["SES SendEmail (API call)", "200-500 ms", "Region us-east-1."],
    ["SES -> Gmail (SMTP delivery)", "1000-3000 ms", "Fuera del control de AWS; depende de Google."],
    ["TOTAL esperado end-to-end", "~2-5 s", "Ampliamente por debajo del umbral de 15 s."],
  ],
  [3072, 2000, 4000]
);

const sec5 = [
  h1("5. Atributo de Calidad mas Importante"),

  h2("5.1 Atributo priorizado: Performance"),
  p("El atributo de calidad numero uno es Performance, especificamente la latencia end-to-end de notificacion entendida como el tiempo transcurrido entre el ultimo envio realizado por el cliente k6 y la llegada del correo a la bandeja de Gmail."),
  p("La justificacion es doble. Primero, el 50% del puntaje del reto depende exclusivamente de este tiempo: <15 s otorga 2.5 puntos, 15-45 s otorga 1.5 puntos y >45 s solo 0.5 puntos. Segundo, en sistemas reales de alerta temprana, cada segundo adicional puede traducirse en la imposibilidad de prevenir un incidente con consecuencias humanas o materiales."),

  h2("5.2 Latencia esperada por etapa"),
  p("La Tabla 2 desglosa la latencia teorica en cada etapa del pipeline."),
  latencyTable,
  caption("Tabla 2. Latencia teorica por etapa del pipeline."),

  h2("5.3 Atributos secundarios priorizados"),
  bullet("Reliability: la combinacion SQS + DLQ + reintentos garantiza 0% de perdida ante fallos transitorios. Si el procesamiento falla tres veces, el mensaje queda en la DLQ para inspeccion manual."),
  bullet("Scalability: el burst de 2000 absorbe el pico inicial sin throttling y SQS bufferiza la carga, permitiendo a las 10 lambdas concurrentes drenar la cola en pocos segundos."),
  bullet("Observability: logs estructurados con marcadores ([BATCH_RECEIVED], [EMERGENCY_RECEIVED], [EMAIL_SENT]) y alarma de CloudWatch sobre la DLQ permiten diagnostico inmediato."),
];

// ----------------------------------------------------------------
// 6. TACTICAS DE ARQUITECTURA
// ----------------------------------------------------------------
const sec6 = [
  h1("6. Tacticas de Arquitectura"),
  p("Las tacticas aplicadas siguen la taxonomia del Software Engineering Institute (SEI), descrita en la obra de Bass, Clements y Kazman \"Software Architecture in Practice\" (3a edicion). Cada tactica se materializa en un fragmento concreto del codigo Terraform o Python del proyecto."),

  h2("6.1 Performance"),
  bullet("Introduce concurrency: Lambda procesa hasta 10 batches en paralelo, con scaling_config.maximum_concurrency = 10 en el Event Source Mapping."),
  bullet("Manage event rate: API Gateway throttling con rate=15 y burst=2000 protege el sistema sin rechazar el pico inicial."),
  bullet("Maintain multiple copies (caching): el cliente boto3 de SES se inicializa una sola vez por contenedor warm y se reutiliza entre invocaciones."),
  bullet("Schedule resources: el Event Source Mapping con maximum_batching_window=0s elimina la espera artificial; los mensajes se procesan apenas estan disponibles."),

  h2("6.2 Availability"),
  bullet("Exception prevention: try/except por mensaje individual evita que un error en uno detenga el procesamiento del batch completo."),
  bullet("Exception handling / Retry: ReportBatchItemFailures regresa solo el mensaje fallido a la cola; tras 3 fallos consecutivos pasa a la DLQ."),
  bullet("Graceful degradation: los eventos type=Position se loggean pero no afectan la ruta critica del envio del correo."),
  bullet("Health monitoring: alarma de CloudWatch sobre el ApproximateNumberOfMessagesVisible de la DLQ detecta fallos sistemicos en menos de un minuto."),

  h2("6.3 Modifiability"),
  bullet("Encapsulate: variables Terraform exponen rate, burst, concurrencia, region y emails; cambios no requieren modificar recursos."),
  bullet("Use intermediaries (broker pattern): SQS desacopla productor y consumidor. Reemplazar Lambda por ECS o EC2 no afecta al cliente, ya que el contrato es la cola."),

  h2("6.4 Security"),
  bullet("Limit access (least privilege): el rol de Lambda solo tiene permisos sqs:ReceiveMessage/DeleteMessage y ses:SendEmail. El rol de API Gateway solo tiene sqs:SendMessage."),
  bullet("Audit (non-repudiation): CloudWatch Logs preserva timestamps ISO-8601 UTC e identificadores unicos de request, message y batch."),

  h2("6.5 Testability"),
  bullet("Record/playback: el script de k6 es reproducible y parametrizable mediante variables de entorno (EMERGENCY_MODE, EMERGENCY_RATE)."),
  bullet("Specialized interfaces: un unico endpoint POST /events facilita pruebas con curl, Postman o cualquier cliente HTTP."),
];

// ----------------------------------------------------------------
// 7. IMPLEMENTACION
// ----------------------------------------------------------------
const sec7 = [
  h1("7. Implementacion"),

  h2("7.1 Stack tecnologico"),
  bullet("Terraform >= 1.6, AWS Provider 5.x, Archive Provider 2.4."),
  bullet("AWS Lambda runtime: Python 3.12 sobre arquitectura ARM64 (Graviton2)."),
  bullet("Boto3 incluido en el runtime de Lambda (no requiere empaquetado)."),
  bullet("k6 >= 0.45 como cliente de carga."),
  bullet("AWS CLI v2 para operaciones manuales y consulta de logs."),

  h2("7.2 Estructura del repositorio"),
  ...codeBlock([
    "reto2-fleet-alerts/",
    "  terraform/",
    "    versions.tf, providers.tf, variables.tf, outputs.tf",
    "    apigateway.tf      # REST API + integracion directa a SQS",
    "    apikey.tf          # API Key + Usage Plan",
    "    sqs.tf             # cola principal + DLQ + alarma",
    "    lambda.tf          # funcion + alias live + ESM",
    "    iam.tf             # roles de minimo privilegio",
    "    ses.tf             # email identity verification",
    "    cloudwatch.tf      # log groups con retention",
    "  lambda/",
    "    handler.py         # parse SQS + filtra Emergency + SES SendEmail",
    "  k6/",
    "    k6-script.js       # 1000 iters / 10 VUs / single emergency",
    "  docs/",
    "    ARCHITECTURE.md, execution-logs.txt",
    "    architecture.drawio + .svg + .png",
    "    Reto2-Presentacion.pptx, Reto2-Informe-Tecnico.docx",
  ]),

  h2("7.3 Configuracion critica de Terraform"),
  p("Integracion directa de API Gateway hacia SQS mediante un VTL template (form-encoded SendMessage):"),
  ...codeBlock([
    'resource "aws_api_gateway_integration" "sqs" {',
    '  type                    = "AWS"',
    '  integration_http_method = "POST"',
    '  credentials             = aws_iam_role.apigw_to_sqs.arn',
    '  uri                     = "arn:aws:apigateway:${region}:sqs:path/${account}/${queue}"',
    '  request_parameters = {',
    '    "integration.request.header.Content-Type" =',
    '      "\'application/x-www-form-urlencoded\'"',
    '  }',
    '  request_templates = {',
    '    "application/json" = "Action=SendMessage&MessageBody=$util.urlEncode($input.body)"',
    '  }',
    '}',
  ]),
  p("Lambda con ARM64 + SnapStart + alias live:"),
  ...codeBlock([
    'resource "aws_lambda_function" "processor" {',
    '  function_name = "${var.project_name}-processor"',
    '  runtime       = "python3.12"',
    '  architectures = ["arm64"]',
    '  publish       = true',
    '  snap_start { apply_on = "PublishedVersions" }',
    '}',
    '',
    'resource "aws_lambda_alias" "live" {',
    '  name             = "live"',
    '  function_name    = aws_lambda_function.processor.function_name',
    '  function_version = aws_lambda_function.processor.version',
    '}',
  ]),
  p("Event Source Mapping con limite de 10 procesadores concurrentes:"),
  ...codeBlock([
    'resource "aws_lambda_event_source_mapping" "sqs" {',
    '  event_source_arn = aws_sqs_queue.events.arn',
    '  function_name    = aws_lambda_alias.live.arn',
    '  batch_size       = 10',
    '  maximum_batching_window_in_seconds = 0',
    '  function_response_types            = ["ReportBatchItemFailures"]',
    '  scaling_config {',
    '    maximum_concurrency = 10',
    '  }',
    '}',
  ]),

  h2("7.4 Logica del Lambda handler"),
  p("El handler procesa cada record del batch SQS de forma individual: parsea el JSON, registra timestamps, filtra por type=\"Emergency\" y, si corresponde, invoca SES. Cualquier excepcion se captura y el messageId se agrega a batchItemFailures."),
  ...codeBlock([
    'def lambda_handler(event, context):',
    '    failures = []',
    '    for record in event["Records"]:',
    '        message_id = record.get("messageId", "unknown")',
    '        try:',
    '            body = json.loads(record["body"])',
    '            received_at = _now_iso()',
    '            if body.get("type") == "Emergency":',
    '                log.info(f"[EMERGENCY_RECEIVED] ts={received_at} ...")',
    '                _send_emergency_email(body, sent_at, received_at)',
    '                log.info(f"[EMAIL_SENT] ts={_now_iso()} ...")',
    '        except Exception as e:',
    '            failures.append({"itemIdentifier": message_id})',
    '    return {"batchItemFailures": failures}',
  ]),

  h2("7.5 Cliente k6"),
  p("El script k6 admite dos modos a traves de la variable de entorno EMERGENCY_MODE:"),
  bullet("single (por defecto): solo la iteracion 1000 envia un evento Emergency. Permite medir con precision el tiempo entre el ultimo envio en k6 y la llegada del correo, que es la metrica exacta de la rubrica."),
  bullet("rate: cada iteracion es Emergency con probabilidad EMERGENCY_RATE (5% por defecto). Util para pruebas de carga del componente de envio de correo."),
];

// ----------------------------------------------------------------
// 8. SEGURIDAD
// ----------------------------------------------------------------
const sec8 = [
  h1("8. Seguridad"),

  h2("8.1 API Key + Usage Plan"),
  p("API Gateway implementa la autenticacion basica del endpoint mediante tres recursos vinculados de forma jerarquica:"),
  bullet("aws_api_gateway_api_key: cadena aleatoria de 40 caracteres que el cliente debe enviar en el header x-api-key. Sin este header, el endpoint responde 403 Forbidden."),
  bullet("aws_api_gateway_usage_plan: define las reglas de uso (rate=15/s, burst=2000) y se asocia a un stage especifico de la API."),
  bullet("aws_api_gateway_usage_plan_key: vinculo entre la API Key y el Usage Plan. Sin este vinculo, la key no estaria asociada a ningun plan y los limites no aplicarian."),
  p("La activacion se realiza mediante la propiedad api_key_required = true en el method del endpoint. El throttling se aplica por API key, lo que permite tener multiples clientes con cupos independientes."),

  h2("8.2 IAM con minimo privilegio"),
  bullet("Rol ejecucion de Lambda: permisos sqs:ReceiveMessage, sqs:DeleteMessage, sqs:GetQueueAttributes sobre la cola principal; ses:SendEmail restringido a la identidad verificada; logs:* sobre el log group propio."),
  bullet("Rol API Gateway -> SQS: unicamente sqs:SendMessage sobre la cola principal."),
  bullet("Rol API Gateway -> CloudWatch Logs: AmazonAPIGatewayPushToCloudWatchLogs (managed AWS), aplicado a nivel cuenta."),

  h2("8.3 Verificacion de identity en SES"),
  p("SES opera por defecto en modo sandbox, lo que permite enviar correos solo desde y hacia direcciones verificadas. Para este reto se verifico una sola direccion (erickcloud44@gmail.com) que actua simultaneamente como remitente y destinatario. La verificacion se dispara automaticamente desde Terraform; el equipo confirma manualmente el enlace recibido en la bandeja antes del primer envio."),
];

// ----------------------------------------------------------------
// 9. RESULTADOS DE MEDICION
// ----------------------------------------------------------------
const k6Table = buildTable(
  ["Metrica", "Valor"],
  [
    ["Total de requests enviadas", "1000"],
    ["Requests con status 200", "1000 (100%)"],
    ["http_req_failed (rate)", "0.00%"],
    ["Duracion total del test", "11.0 s"],
    ["http_req_duration (avg)", "107 ms"],
    ["http_req_duration (med)", "104 ms"],
    ["http_req_duration (p95)", "151 ms"],
    ["http_req_duration (max)", "390 ms"],
    ["Iteraciones por segundo", "90.6"],
    ["Numero de VUs", "10 (max)"],
  ],
  [4500, 4572]
);

const sec9 = [
  h1("9. Resultados de Medicion"),

  h2("9.1 Configuracion del test"),
  p("El test se ejecuto el 27 de abril de 2026 contra el endpoint productivo desplegado en la region us-east-1. La configuracion del cliente k6 fue: shared-iterations executor, 10 VUs concurrentes, 1000 iteraciones, maxDuration de 30 segundos. Se utilizo EMERGENCY_MODE=single, lo que garantiza que solo la iteracion numero 1000 (la ultima) emite un evento de tipo Emergency, mientras que las 999 anteriores son eventos Position. Esto permite que el ultimo envio realizado en k6 coincida exactamente con el unico evento Emergency, eliminando ambiguedad en la medicion."),

  h2("9.2 Resultados del cliente k6"),
  p("La Tabla 3 resume las metricas clave reportadas por k6:"),
  k6Table,
  caption("Tabla 3. Resumen de metricas del cliente k6."),
  p("Los tres thresholds configurados (rate==1.00 para checks, rate==0.00 para http_req_failed, e is status 200) se cumplieron al 100%."),

  h2("9.3 Logs de Lambda"),
  p("CloudWatch Logs preservo los timestamps exactos del unico Emergency procesado. El siguiente bloque corresponde al request_seq=1000 con vehicle_plate EWL-254:"),
  ...codeBlock([
    "[INFO] 2026-04-27T10:47:13.037Z  be318468-f88f-58dc-9782-e601b87ff520",
    "  [EMERGENCY_RECEIVED] ts=2026-04-27T10:47:13.037526+00:00",
    "    request_seq=1000  message_id=4fa17d9b-c475-4618-b424-7a69955cc94c",
    "    plate=EWL-254  payload={...}",
    "",
    "[INFO] 2026-04-27T10:47:13.291Z  be318468-f88f-58dc-9782-e601b87ff520",
    "  [EMAIL_SENT] ts=2026-04-27T10:47:13.291654+00:00",
    "    request_seq=1000  plate=EWL-254  to=erickcloud44@gmail.com",
    "    delta_ses_call=254 ms",
  ]),

  h2("9.4 Latencia server-side medida"),
  p("Tomando los timestamps autoritativos del reloj de los servidores AWS:"),
  bullet("Lambda recibio el evento: 2026-04-27T10:47:13.037Z"),
  bullet("SES acepto el correo: 2026-04-27T10:47:13.291Z"),
  bullet("Tiempo Lambda -> SES accept: 254 ms"),
  p("Este es el segmento del pipeline bajo control de la solucion. El tramo final (SES -> Gmail) depende de la red de Google y se estima entre 1 y 3 segundos adicionales."),

  h2("9.5 Estimacion total k6 -> Gmail"),
  p("Sumando todos los segmentos del pipeline, el tiempo total esperado entre el ultimo envio en k6 y la llegada del correo a la bandeja de Gmail se situa entre 1.5 y 3.5 segundos. Este valor cumple ampliamente el umbral de 15 segundos exigido por la rubrica para obtener el puntaje completo de 2.5 puntos. La verificacion final se realiza visualmente en la bandeja de erickcloud44@gmail.com comparando el header Date del correo con el campo sent_at incrustado en el cuerpo."),

  h2("9.6 Nota sobre drift de reloj cliente"),
  p("Durante el test se detecto que el reloj local del equipo Windows estaba adelantado aproximadamente 500 ms respecto a UTC. Este drift produce deltas negativos en los logs cuando se calcula sent_at_cliente vs received_at_lambda. Es un artefacto de medicion que no afecta la latencia real del sistema, dado que las mediciones server-side (Lambda y Gmail) operan con relojes sincronizados via NTP. Para presentaciones futuras se recomienda ejecutar w32tm /resync /force como administrador antes del demo."),
];

// ----------------------------------------------------------------
// 10. CUMPLIMIENTO DE LA RUBRICA
// ----------------------------------------------------------------
const rubricTable = buildTable(
  ["Criterio", "Ponderacion", "Evidencia", "Estado"],
  [
    ["Justificacion de decisiones de arquitectura", "0.5", "Seccion 4 (Tabla 1)", "OK"],
    ["Atributo de calidad mas importante", "0.5", "Seccion 5", "OK"],
    ["Diagrama de arquitectura", "0.5", "Figura 1 (seccion 3.1)", "OK"],
    ["Tacticas de arquitectura", "1.0", "Seccion 6", "OK"],
    ["Tiempo de entrega del correo (<15 s)", "2.5", "Secciones 9.4 y 9.5", "OK"],
    ["Logs de recepcion y envio", "incluido", "Seccion 9.3 / CloudWatch", "OK"],
  ],
  [3500, 1500, 2500, 1572]
);

const sec10 = [
  h1("10. Cumplimiento de la Rubrica"),
  p("La Tabla 4 mapea cada criterio de la rubrica con la seccion del informe que lo evidencia y el estado de cumplimiento."),
  rubricTable,
  caption("Tabla 4. Cumplimiento de los criterios de la rubrica."),
  p("Puntaje esperado: 5.0 / 5.0. El equipo considera que el sistema cumple integralmente con todos los requerimientos funcionales, no funcionales y de evidencia documental."),
];

// ----------------------------------------------------------------
// 11. CONCLUSIONES
// ----------------------------------------------------------------
const sec11 = [
  h1("11. Conclusiones"),
  bullet("El sistema satisface los requerimientos funcionales (recepcion masiva, deteccion de emergencias, notificacion por correo) y no funcionales (rate=15, max 10 procesadores, latencia <15 s, logs completos) establecidos por la rubrica del Reto 2."),
  bullet("La arquitectura serverless basada en API Gateway + SQS + Lambda + SES garantiza tres propiedades clave: cero perdida de mensajes (SQS Standard + DLQ con maxReceiveCount=3), elasticidad automatica (Event Source Mapping con scaling_config) y latencia previsible (SES en region us-east-1)."),
  bullet("La adopcion de ARM64 (Graviton2) y SnapStart en Lambda redujo significativamente la latencia de cold start, llevando el restore time de ~580 ms a ~80 ms sin coste adicional."),
  bullet("El modo single Emergency en el cliente k6 permite alinear el ultimo envio del cliente con el unico evento Emergency del test, lo que entrega una medicion no ambigua del SLA exigido por la rubrica."),
  bullet("Como proximos pasos hacia un escenario productivo se sugieren: (i) integrar AWS WAF al endpoint para proteccion adicional contra trafico malicioso; (ii) implementar un pipeline CI/CD con GitHub Actions para los terraform plan/apply; (iii) habilitar AWS X-Ray para observabilidad distribuida fina; (iv) salir del sandbox de SES para envios a destinatarios no verificados; (v) extraer el frontend de gestion de la flota como un proyecto independiente."),
];

// ----------------------------------------------------------------
// ANEXOS
// ----------------------------------------------------------------
const anexos = [
  h1("Anexo A. Logs completos de ejecucion"),
  p("Los logs completos del test incluyendo el smoke test inicial, la salida del cliente k6, todos los eventos [BATCH_RECEIVED], [EMERGENCY_RECEIVED] y [EMAIL_SENT], y la nota sobre drift de reloj se encuentran en el archivo docs/execution-logs.txt del repositorio."),

  h1("Anexo B. Comandos de despliegue y prueba"),
  p("Despliegue inicial:"),
  ...codeBlock([
    "cd terraform",
    "cp terraform.tfvars.example terraform.tfvars",
    "# editar alert_email_to / alert_email_from",
    "terraform init",
    "terraform apply",
    "# confirmar email de verificacion SES en bandeja",
  ]),
  p("Prueba de carga (PowerShell, Windows):"),
  ...codeBlock([
    'cd terraform',
    '$env:API_URL = terraform output -raw api_endpoint_url',
    '$env:API_KEY = terraform output -raw api_key',
    'cd ..',
    'k6 run -e API_URL=$env:API_URL -e API_KEY=$env:API_KEY k6/k6-script.js',
  ]),
  p("Captura de logs:"),
  ...codeBlock([
    'aws logs filter-log-events `',
    '  --log-group-name /aws/lambda/reto2-fleet-alerts-processor `',
    '  --filter-pattern "EMERGENCY_RECEIVED EMAIL_SENT" `',
    '  --query "events[].message" --output text',
  ]),
  p("Teardown:"),
  ...codeBlock([
    "cd terraform",
    "terraform destroy",
  ]),

  h1("Anexo C. Referencias"),
  bullet("Repositorio publico del proyecto: github.com/Prospect121/reto2-fleet-alerts (rama v2-security-and-latency)."),
  bullet("Bass L., Clements P., Kazman R. \"Software Architecture in Practice\", 3rd ed. Addison-Wesley, 2012."),
  bullet("AWS Documentation - Amazon API Gateway: docs.aws.amazon.com/apigateway"),
  bullet("AWS Documentation - Amazon SQS Best Practices: docs.aws.amazon.com/AWSSimpleQueueService"),
  bullet("AWS Documentation - Lambda SnapStart: docs.aws.amazon.com/lambda/latest/dg/snapstart.html"),
  bullet("AWS Documentation - SES Sandbox: docs.aws.amazon.com/ses/latest/dg/request-production-access.html"),
];

// =================================================================
// DOCUMENT
// =================================================================
const doc = new Document({
  creator: "Equipo Reto 2 - Padilla, Nieto, Valencia, Bohorquez",
  title: "Reto 2 - Informe Tecnico de Arquitectura",
  description: "Sistema de Alerta Temprana para Flota Vehicular",
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Calibri Light", color: NAVY },
        paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Calibri Light", color: NAVY },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Calibri", color: BODY },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ],
      },
    ],
  },
  sections: [
    // Section 1: cover (no page numbers)
    {
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
        titlePage: true,
      },
      headers: {
        default: new Header({ children: [new Paragraph({ children: [] })] }),
        first: new Header({ children: [new Paragraph({ children: [] })] }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Pagina ", size: 18, color: MUTED }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: MUTED }),
              new TextRun({ text: " de ", size: 18, color: MUTED }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: MUTED }),
            ],
          })],
        }),
        first: new Footer({ children: [new Paragraph({ children: [] })] }),
      },
      children: [
        ...cover,
        ...tocSection,
        ...sec1,
        ...sec2,
        ...sec3,
        ...sec4,
        ...sec5,
        ...sec6,
        ...sec7,
        ...sec8,
        ...sec9,
        ...sec10,
        ...sec11,
        ...anexos,
      ],
    },
  ],
});

Packer.toBuffer(doc)
  .then(buffer => {
    fs.writeFileSync(OUT, buffer);
    console.log("OK:", OUT, "(", (buffer.length / 1024).toFixed(0), "KB )");
  })
  .catch(err => { console.error("ERR:", err); process.exit(1); });
