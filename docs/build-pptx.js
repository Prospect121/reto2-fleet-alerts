// Build Reto 2 Presentation (PowerPoint)
// Run: NODE_PATH="C:\Program Files\nodejs\node_modules" node docs/build-pptx.js
const path = require("path");
const pptxgen = require("pptxgenjs");

const OUT = path.join(__dirname, "Reto2-Presentacion.pptx");
const ARCH_PNG = path.join(__dirname, "architecture.png");

// Palette
const NAVY = "0F172A";       // dark backgrounds
const BLUE = "065A82";        // primary
const TEAL = "1C7293";        // secondary
const ACCENT = "2563EB";      // bright accent
const GREEN = "16A34A";       // success
const RED = "DC2626";         // emphasis / DLQ
const SLATE = "0F172A";       // body text
const MUTED = "64748B";       // captions
const LIGHT = "F8FAFC";       // light backgrounds
const LIGHT2 = "E2E8F0";      // light borders / band
const WHITE = "FFFFFF";

const FONT_HEAD = "Calibri";
const FONT_BODY = "Calibri";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
pres.author = "Luis Fernando Padilla, Erick Nieto, Raul Valencia, Juan Bohorquez";
pres.company = "Diplomado Arquitecturas Cloud — Modulo 2";
pres.title = "Reto 2 - Sistema de Alerta Temprana";

const TEAM = [
  "Luis Fernando Padilla",
  "Erick Nieto",
  "Raul Valencia",
  "Juan Bohorquez",
];
const TEAM_FOOTER = "Padilla / Nieto / Valencia / Bohorquez";

// Helpers
function addTitleBar(slide, title, subtitle) {
  slide.addText(title, {
    x: 0.5, y: 0.35, w: 12.3, h: 0.7,
    fontFace: FONT_HEAD, fontSize: 32, bold: true, color: NAVY,
    align: "left", valign: "middle", margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 1.05, w: 12.3, h: 0.4,
      fontFace: FONT_BODY, fontSize: 14, italic: true, color: MUTED,
      align: "left", valign: "middle", margin: 0,
    });
  }
}

function addFooter(slide, pageNum) {
  slide.addText(`Reto 2 - Sistema de Alerta Temprana | Equipo: ${TEAM_FOOTER} | 2026-04-27`,
    { x: 0.5, y: 7.05, w: 11.5, h: 0.3, fontFace: FONT_BODY, fontSize: 9, color: MUTED, align: "left", margin: 0 });
  slide.addText(`${pageNum}`,
    { x: 12.5, y: 7.05, w: 0.3, h: 0.3, fontFace: FONT_BODY, fontSize: 9, color: MUTED, align: "right", margin: 0 });
}

// =====================================================================
// SLIDE 1 — Portada (dark)
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };

  // Side accent bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.25, h: 7.5, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 }
  });

  // Eyebrow
  s.addText("RETO 2 - DIPLOMADO ARQUITECTURAS CLOUD - MODULO 2", {
    x: 0.9, y: 1.4, w: 11.5, h: 0.4,
    fontFace: FONT_HEAD, fontSize: 12, bold: true, color: "94A3B8",
    charSpacing: 4, margin: 0,
  });

  // Title
  s.addText("Sistema de Alerta Temprana", {
    x: 0.9, y: 1.95, w: 11.5, h: 1.2,
    fontFace: FONT_HEAD, fontSize: 54, bold: true, color: WHITE, margin: 0,
  });
  s.addText("para Flota Vehicular", {
    x: 0.9, y: 3.05, w: 11.5, h: 0.9,
    fontFace: FONT_HEAD, fontSize: 40, color: "60A5FA", margin: 0,
  });

  // Description
  s.addText("Endpoint serverless en AWS que recibe 1000 eventos en 30 segundos, detecta emergencias y notifica a Gmail en menos de 15 segundos.", {
    x: 0.9, y: 4.1, w: 11, h: 0.9,
    fontFace: FONT_BODY, fontSize: 16, color: "CBD5E1", italic: true, margin: 0,
  });

  // Stack
  s.addText("API Gateway REST  |  SQS  |  Lambda Python ARM64 + SnapStart  |  SES  |  100% Terraform", {
    x: 0.9, y: 5.1, w: 11, h: 0.4,
    fontFace: FONT_BODY, fontSize: 13, color: "94A3B8", margin: 0,
  });

  // Team block - 4 names in 2x2 grid with accent bar
  s.addShape(pres.shapes.RECTANGLE, { x: 0.9, y: 5.85, w: 0.06, h: 1.25, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } });
  s.addText("EQUIPO", {
    x: 1.1, y: 5.85, w: 11, h: 0.3,
    fontFace: FONT_HEAD, fontSize: 11, bold: true, color: "94A3B8", charSpacing: 4, margin: 0,
  });
  // Names in 2 columns x 2 rows
  const nameOpts = { fontFace: FONT_HEAD, fontSize: 16, bold: true, color: WHITE, margin: 0, valign: "middle" };
  s.addText(TEAM[0], { x: 1.1, y: 6.18, w: 5.5, h: 0.4, ...nameOpts });
  s.addText(TEAM[1], { x: 6.7, y: 6.18, w: 5.5, h: 0.4, ...nameOpts });
  s.addText(TEAM[2], { x: 1.1, y: 6.6, w: 5.5, h: 0.4, ...nameOpts });
  s.addText(TEAM[3], { x: 6.7, y: 6.6, w: 5.5, h: 0.4, ...nameOpts });
  // Date + repo
  s.addText("2026-04-27  |  github.com/Prospect121/reto2-fleet-alerts", {
    x: 0.9, y: 7.15, w: 11, h: 0.3,
    fontFace: FONT_BODY, fontSize: 11, color: "64748B", margin: 0,
  });
}

// =====================================================================
// SLIDE 2 — El reto en 3 puntos (3 cards)
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  addTitleBar(s, "El reto en 3 puntos", "Que tiene que cumplir el sistema");

  const cardY = 2.0, cardH = 4.4;
  const cardW = 3.9, gap = 0.3;
  const startX = (13.3 - (cardW * 3 + gap * 2)) / 2;

  const cards = [
    {
      n: "1",
      title: "Recepcion masiva",
      body: [
        "1000 eventos en 30 segundos",
        "100% procesados sin perdidas",
        "Endpoint estable bajo el pico",
      ],
      color: BLUE,
    },
    {
      n: "2",
      title: "Deteccion en tiempo real",
      body: [
        "Identificar type=Emergency",
        "Notificar por correo a Gmail",
        "Logs con hora exacta de evento y envio",
      ],
      color: TEAL,
    },
    {
      n: "3",
      title: "Restricciones tecnicas",
      body: [
        "API GW rate=15/s, burst=2000",
        "Maximo 10 procesadores concurrentes",
        "Correo en menos de 15 segundos = 2.5 puntos",
      ],
      color: ACCENT,
    },
  ];

  cards.forEach((c, i) => {
    const x = startX + i * (cardW + gap);

    // Card background
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: cardY, w: cardW, h: cardH,
      fill: { color: WHITE },
      line: { color: LIGHT2, width: 1 },
    });
    // Top color band
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: cardY, w: cardW, h: 0.18,
      fill: { color: c.color }, line: { color: c.color, width: 0 },
    });
    // Number badge
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.35, y: cardY + 0.55, w: 0.9, h: 0.9,
      fill: { color: c.color }, line: { color: c.color, width: 0 },
    });
    s.addText(c.n, {
      x: x + 0.35, y: cardY + 0.55, w: 0.9, h: 0.9,
      fontFace: FONT_HEAD, fontSize: 32, bold: true, color: WHITE,
      align: "center", valign: "middle", margin: 0,
    });
    // Title
    s.addText(c.title, {
      x: x + 0.35, y: cardY + 1.7, w: cardW - 0.7, h: 0.6,
      fontFace: FONT_HEAD, fontSize: 22, bold: true, color: NAVY, margin: 0,
    });
    // Bullets
    const bulletItems = c.body.map((t, idx) => ({
      text: t,
      options: { bullet: { code: "25A0" }, breakLine: idx < c.body.length - 1, color: SLATE },
    }));
    s.addText(bulletItems, {
      x: x + 0.35, y: cardY + 2.4, w: cardW - 0.7, h: cardH - 2.6,
      fontFace: FONT_BODY, fontSize: 15, color: SLATE,
      paraSpaceAfter: 6, valign: "top",
    });
  });

  addFooter(s, 2);
}

// =====================================================================
// SLIDE 3 — Diagrama
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  addTitleBar(s, "Arquitectura de la solucion", "Flujo desde el cliente k6 hasta Gmail (us-east-1)");

  // SVG/PNG fills the lower 5.5"
  // PNG aspect 8675x4061 ≈ 2.136
  const maxW = 12.3, maxH = 5.3;
  const aspect = 8675 / 4061;
  let w = maxW, h = w / aspect;
  if (h > maxH) { h = maxH; w = h * aspect; }
  const x = (13.3 - w) / 2;
  const y = 1.7 + (maxH - h) / 2;

  s.addImage({ path: ARCH_PNG, x, y, w, h });

  addFooter(s, 3);
}

// =====================================================================
// SLIDE 4 — Decisiones de arquitectura (table)
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  addTitleBar(s, "Decisiones de arquitectura", "Las 5 elecciones que mas impactan el SLA");

  const headerOpts = { fill: { color: NAVY }, color: WHITE, bold: true, fontFace: FONT_HEAD, fontSize: 13, align: "left", valign: "middle" };
  const cellOpts = { color: SLATE, fontFace: FONT_BODY, fontSize: 12, align: "left", valign: "middle" };

  const rows = [
    [
      { text: "Decision", options: headerOpts },
      { text: "Eleccion", options: headerOpts },
      { text: "Razon", options: headerOpts },
    ],
    [
      { text: "Tipo de API Gateway", options: cellOpts },
      { text: "REST (v1)", options: { ...cellOpts, bold: true, color: BLUE } },
      { text: "Unico que expone rate y burst nativos por stage (requisito explicito)", options: cellOpts },
    ],
    [
      { text: "Integracion API GW > backend", options: cellOpts },
      { text: "Directa a SQS (sin Lambda de ingesta)", options: { ...cellOpts, bold: true, color: BLUE } },
      { text: "Elimina un salto, baja 100-200ms; cliente recibe 200 al instante", options: cellOpts },
    ],
    [
      { text: "Cola de mensajes", options: cellOpts },
      { text: "SQS Standard (no FIFO)", options: { ...cellOpts, bold: true, color: BLUE } },
      { text: "FIFO limitado a 300 msg/s; Standard tiene throughput ilimitado", options: cellOpts },
    ],
    [
      { text: "Servicio de envio de correo", options: cellOpts },
      { text: "Amazon SES", options: { ...cellOpts, bold: true, color: BLUE } },
      { text: "Latencia 1-3s vs 10-30s de SNS email; nativo en AWS", options: cellOpts },
    ],
    [
      { text: "Limite de 10 procesadores", options: cellOpts },
      { text: "ESM scaling_config.maximum_concurrency", options: { ...cellOpts, bold: true, color: BLUE } },
      { text: "No usa quota global del account; suficiente porque la Lambda solo se invoca via SQS", options: cellOpts },
    ],
  ];

  s.addTable(rows, {
    x: 0.5, y: 1.7, w: 12.3,
    colW: [3.0, 3.6, 5.7],
    rowH: [0.55, 0.95, 0.95, 0.95, 0.95, 1.0],
    border: { type: "solid", pt: 1, color: LIGHT2 },
    fontFace: FONT_BODY,
  });

  addFooter(s, 4);
}

// =====================================================================
// SLIDE 5 — Atributo de calidad (two-column)
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  addTitleBar(s, "Atributo de calidad #1", "Que priorizamos y por que");

  // Left column - big word
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.7, w: 5.2, h: 5.0,
    fill: { color: NAVY }, line: { color: NAVY, width: 0 },
  });
  s.addText("PERFORMANCE", {
    x: 0.5, y: 2.5, w: 5.2, h: 1.2,
    fontFace: FONT_HEAD, fontSize: 36, bold: true, color: WHITE,
    align: "center", valign: "middle", margin: 0,
  });
  s.addText("Latencia de notificacion", {
    x: 0.5, y: 3.7, w: 5.2, h: 0.5,
    fontFace: FONT_BODY, fontSize: 16, italic: true, color: "94A3B8",
    align: "center", valign: "middle", margin: 0,
  });
  // Big stat
  s.addText("< 15s", {
    x: 0.5, y: 4.6, w: 5.2, h: 1.2,
    fontFace: FONT_HEAD, fontSize: 64, bold: true, color: "60A5FA",
    align: "center", valign: "middle", margin: 0,
  });
  s.addText("k6 -> Gmail (objetivo 2.5 puntos)", {
    x: 0.5, y: 5.85, w: 5.2, h: 0.4,
    fontFace: FONT_BODY, fontSize: 13, color: "CBD5E1",
    align: "center", valign: "middle", margin: 0,
  });

  // Right column
  s.addText("Por que es el #1", {
    x: 6.1, y: 1.8, w: 6.7, h: 0.5,
    fontFace: FONT_HEAD, fontSize: 20, bold: true, color: NAVY, margin: 0,
  });
  s.addText([
    { text: "El 50% del puntaje del reto depende del tiempo de entrega del correo.", options: { bullet: { code: "25A0" }, breakLine: true, color: SLATE } },
    { text: "En sistemas de alerta temprana reales, segundos = vidas o danos materiales.", options: { bullet: { code: "25A0" }, breakLine: true, color: SLATE } },
    { text: "La cadena de servicios (API GW > SQS > Lambda > SES > Gmail) suma latencia: cada decision la optimiza.", options: { bullet: { code: "25A0" }, color: SLATE } },
  ], {
    x: 6.1, y: 2.35, w: 6.7, h: 1.8,
    fontFace: FONT_BODY, fontSize: 14, color: SLATE, paraSpaceAfter: 8, valign: "top",
  });

  s.addText("Atributos secundarios priorizados", {
    x: 6.1, y: 4.4, w: 6.7, h: 0.5,
    fontFace: FONT_HEAD, fontSize: 18, bold: true, color: NAVY, margin: 0,
  });
  s.addText([
    { text: "Reliability - SQS + DLQ + reintentos garantizan 0% perdida.", options: { bullet: { code: "25A0" }, breakLine: true, color: SLATE } },
    { text: "Scalability - Burst de 2000 absorbe el pico inicial sin throttling.", options: { bullet: { code: "25A0" }, breakLine: true, color: SLATE } },
    { text: "Observability - Logs estructurados con timestamps ISO-8601 + alarma DLQ.", options: { bullet: { code: "25A0" }, color: SLATE } },
  ], {
    x: 6.1, y: 4.95, w: 6.7, h: 1.8,
    fontFace: FONT_BODY, fontSize: 13, color: SLATE, paraSpaceAfter: 6, valign: "top",
  });

  addFooter(s, 5);
}

// =====================================================================
// SLIDE 6 — Tacticas SEI (2x2 grid)
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  addTitleBar(s, "Tacticas de arquitectura", "Una por categoria SEI - Bass, Clements, Kazman");

  const cards = [
    {
      cat: "PERFORMANCE", color: BLUE,
      title: "Introduce concurrency",
      body: "10 instancias de Lambda en paralelo, gobernadas por el Event Source Mapping de SQS. scaling_config.maximum_concurrency = 10.",
    },
    {
      cat: "AVAILABILITY", color: GREEN,
      title: "Exception handling / Retry",
      body: "ReportBatchItemFailures reintenta solo el mensaje fallido. Tras 3 fallas va a la DLQ. Alarma de CloudWatch sobre la DLQ.",
    },
    {
      cat: "MODIFIABILITY", color: TEAL,
      title: "Use intermediaries (broker)",
      body: "SQS desacopla productor y consumidor. Cambiar Lambda por ECS o EC2 no afecta al cliente; el contrato es la cola.",
    },
    {
      cat: "SECURITY", color: RED,
      title: "Limit access (least privilege)",
      body: "Roles IAM minimos: Lambda solo SES SendEmail; API GW solo SQS SendMessage. Endpoint requiere header x-api-key.",
    },
  ];

  const cardW = 5.9, cardH = 2.5, gap = 0.4;
  const startX = (13.3 - cardW * 2 - gap) / 2;
  const startY = 1.85;

  cards.forEach((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = startX + col * (cardW + gap);
    const y = startY + row * (cardH + gap);

    // Card
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: cardW, h: cardH,
      fill: { color: LIGHT }, line: { color: LIGHT2, width: 1 },
    });
    // Category pill
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.3, y: y + 0.3, w: 1.9, h: 0.35,
      fill: { color: c.color }, line: { color: c.color, width: 0 },
    });
    s.addText(c.cat, {
      x: x + 0.3, y: y + 0.3, w: 1.9, h: 0.35,
      fontFace: FONT_HEAD, fontSize: 10, bold: true, color: WHITE,
      align: "center", valign: "middle", charSpacing: 2, margin: 0,
    });
    // Title
    s.addText(c.title, {
      x: x + 0.3, y: y + 0.85, w: cardW - 0.6, h: 0.6,
      fontFace: FONT_HEAD, fontSize: 20, bold: true, color: NAVY, margin: 0,
    });
    // Body
    s.addText(c.body, {
      x: x + 0.3, y: y + 1.5, w: cardW - 0.6, h: cardH - 1.6,
      fontFace: FONT_BODY, fontSize: 13, color: SLATE, margin: 0, valign: "top",
    });
  });

  addFooter(s, 6);
}

// =====================================================================
// SLIDE 7 — Demo en vivo (steps)
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  addTitleBar(s, "Demo en vivo", "Ruta del Emergency: del envio en k6 al correo en Gmail");

  const steps = [
    "Mostrar Gmail vacio - busqueda subject:Alerta #",
    "Correr k6 con EMERGENCY_MODE=single (solo iter 1000)",
    "k6 reporta 1000/1000 OK, 0% fallos en ~11s",
    "CloudWatch Live Tail: [EMERGENCY_RECEIVED] y [EMAIL_SENT]",
    "Abrir el correo en Gmail con subject Alerta #1000/1000",
    "Calcular delta: Gmail Date - sent_at < 15s",
  ];

  // 3 columns x 2 rows
  const cols = 3, rows = 2;
  const cellW = 4.0, cellH = 2.2, gap = 0.25;
  const startX = (13.3 - (cellW * cols + gap * (cols - 1))) / 2;
  const startY = 2.0;

  steps.forEach((text, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = startX + col * (cellW + gap);
    const y = startY + row * (cellH + gap);

    // Step card
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: cellW, h: cellH,
      fill: { color: WHITE }, line: { color: LIGHT2, width: 1 },
    });
    // Number circle
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.3, y: y + 0.3, w: 0.7, h: 0.7,
      fill: { color: ACCENT }, line: { color: ACCENT, width: 0 },
    });
    s.addText(`${i + 1}`, {
      x: x + 0.3, y: y + 0.3, w: 0.7, h: 0.7,
      fontFace: FONT_HEAD, fontSize: 22, bold: true, color: WHITE,
      align: "center", valign: "middle", margin: 0,
    });
    // Step text
    s.addText(text, {
      x: x + 1.2, y: y + 0.3, w: cellW - 1.4, h: cellH - 0.5,
      fontFace: FONT_BODY, fontSize: 14, color: SLATE, margin: 0, valign: "top",
    });
  });

  // Bottom callout
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 6.5, w: 12.3, h: 0.45,
    fill: { color: GREEN }, line: { color: GREEN, width: 0 },
  });
  s.addText("Truco: la iter 1000 es el UNICO Emergency, asi el ultimo envio en k6 ES la emergencia que medimos", {
    x: 0.5, y: 6.5, w: 12.3, h: 0.45,
    fontFace: FONT_BODY, fontSize: 12, italic: true, color: WHITE,
    align: "center", valign: "middle", margin: 0,
  });

  addFooter(s, 7);
}

// =====================================================================
// SLIDE 8 — Resultados medidos (3 big stats)
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  addTitleBar(s, "Resultados medidos", "Test del 2026-04-27 sobre el endpoint de produccion");

  const stats = [
    { num: "1000/1000", label: "Requests procesadas en k6", sub: "0% fallos | 11.0s totales", color: BLUE },
    { num: "254 ms", label: "Lambda recibe -> SES acepta", sub: "Medido server-side (sin drift)", color: TEAL },
    { num: "< 15 s", label: "Total estimado k6 -> Gmail", sub: "1.5 - 3.5 s reales | 2.5 puntos", color: GREEN },
  ];

  const cardW = 4.0, cardH = 3.2, gap = 0.3;
  const startX = (13.3 - (cardW * 3 + gap * 2)) / 2;
  const startY = 2.0;

  stats.forEach((st, i) => {
    const x = startX + i * (cardW + gap);
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: startY, w: cardW, h: cardH,
      fill: { color: LIGHT }, line: { color: LIGHT2, width: 1 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: startY, w: cardW, h: 0.12,
      fill: { color: st.color }, line: { color: st.color, width: 0 },
    });
    s.addText(st.num, {
      x, y: startY + 0.5, w: cardW, h: 1.2,
      fontFace: FONT_HEAD, fontSize: 48, bold: true, color: st.color,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(st.label, {
      x: x + 0.3, y: startY + 1.85, w: cardW - 0.6, h: 0.5,
      fontFace: FONT_HEAD, fontSize: 16, bold: true, color: NAVY,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(st.sub, {
      x: x + 0.3, y: startY + 2.4, w: cardW - 0.6, h: 0.55,
      fontFace: FONT_BODY, fontSize: 12, italic: true, color: MUTED,
      align: "center", valign: "middle", margin: 0,
    });
  });

  // Logs band
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 5.6, w: 12.3, h: 1.3,
    fill: { color: NAVY }, line: { color: NAVY, width: 0 },
  });
  s.addText("Logs del unico Emergency (iter 1000, plate EWL-254)", {
    x: 0.7, y: 5.7, w: 12, h: 0.35,
    fontFace: FONT_HEAD, fontSize: 12, bold: true, color: "94A3B8",
    charSpacing: 3, margin: 0,
  });
  s.addText([
    { text: "[EMERGENCY_RECEIVED] ts=2026-04-27T10:47:13.037+00:00 request_seq=1000", options: { color: "60A5FA", breakLine: true } },
    { text: "[EMAIL_SENT]         ts=2026-04-27T10:47:13.291+00:00 to=erickcloud44@gmail.com", options: { color: "4ADE80" } },
  ], {
    x: 0.7, y: 6.05, w: 12, h: 0.85,
    fontFace: "Consolas", fontSize: 11, paraSpaceAfter: 2, valign: "top", margin: 0,
  });

  addFooter(s, 8);
}

// =====================================================================
// SLIDE 9 — Cumplimiento de la rubrica
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  addTitleBar(s, "Cumplimiento de la rubrica", "Donde se evidencia cada criterio");

  const headerOpts = { fill: { color: NAVY }, color: WHITE, bold: true, fontFace: FONT_HEAD, fontSize: 13, align: "left", valign: "middle" };
  const cellOpts = { color: SLATE, fontFace: FONT_BODY, fontSize: 13, align: "left", valign: "middle" };
  const checkOpts = { color: GREEN, bold: true, fontFace: FONT_HEAD, fontSize: 18, align: "center", valign: "middle" };

  const rows = [
    [
      { text: "Criterio", options: headerOpts },
      { text: "Ponderacion", options: { ...headerOpts, align: "center" } },
      { text: "Evidencia", options: headerOpts },
      { text: "Estado", options: { ...headerOpts, align: "center" } },
    ],
    [
      { text: "Justificacion de decisiones", options: cellOpts },
      { text: "0.5", options: { ...cellOpts, align: "center" } },
      { text: "Slide 4 (tabla de 5 decisiones clave)", options: cellOpts },
      { text: "OK", options: checkOpts },
    ],
    [
      { text: "Atributo de calidad mas importante", options: cellOpts },
      { text: "0.5", options: { ...cellOpts, align: "center" } },
      { text: "Slide 5 (Performance + atributos secundarios)", options: cellOpts },
      { text: "OK", options: checkOpts },
    ],
    [
      { text: "Diagrama de arquitectura", options: cellOpts },
      { text: "0.5", options: { ...cellOpts, align: "center" } },
      { text: "Slide 3 (diagrama completo us-east-1)", options: cellOpts },
      { text: "OK", options: checkOpts },
    ],
    [
      { text: "Tacticas de arquitectura", options: cellOpts },
      { text: "1.0", options: { ...cellOpts, align: "center" } },
      { text: "Slide 6 (4 categorias SEI)", options: cellOpts },
      { text: "OK", options: checkOpts },
    ],
    [
      { text: "Tiempo de entrega del correo < 15s", options: cellOpts },
      { text: "2.5", options: { ...cellOpts, align: "center", bold: true, color: GREEN } },
      { text: "Slide 8 (1000/1000, 254ms, <15s)", options: cellOpts },
      { text: "OK", options: checkOpts },
    ],
    [
      { text: "Logs de recepcion y envio", options: cellOpts },
      { text: "incluido", options: { ...cellOpts, align: "center", italic: true } },
      { text: "Slide 8 + CloudWatch Live Tail en demo", options: cellOpts },
      { text: "OK", options: checkOpts },
    ],
  ];

  s.addTable(rows, {
    x: 0.5, y: 1.7, w: 12.3,
    colW: [4.3, 1.6, 5.0, 1.4],
    rowH: [0.55, 0.6, 0.6, 0.6, 0.6, 0.7, 0.7],
    border: { type: "solid", pt: 1, color: LIGHT2 },
    fontFace: FONT_BODY,
  });

  // Total
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 6.6, w: 12.3, h: 0.6,
    fill: { color: GREEN }, line: { color: GREEN, width: 0 },
  });
  s.addText("Puntaje esperado: 5.0 / 5.0", {
    x: 0.5, y: 6.6, w: 12.3, h: 0.6,
    fontFace: FONT_HEAD, fontSize: 18, bold: true, color: WHITE,
    align: "center", valign: "middle", margin: 0,
  });
}

// =====================================================================
// SLIDE 10 — Cierre
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };

  // Side accent bar
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.25, h: 7.5, fill: { color: ACCENT }, line: { color: ACCENT, width: 0 } });

  s.addText("Gracias.", {
    x: 0.9, y: 1.5, w: 11.5, h: 1.4,
    fontFace: FONT_HEAD, fontSize: 72, bold: true, color: WHITE, margin: 0,
  });
  s.addText("Preguntas y demo en vivo a continuacion.", {
    x: 0.9, y: 3.0, w: 11.5, h: 0.6,
    fontFace: FONT_BODY, fontSize: 22, italic: true, color: "94A3B8", margin: 0,
  });

  // Repo card
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.9, y: 4.2, w: 11.5, h: 2.4,
    fill: { color: "1E293B" }, line: { color: ACCENT, width: 0 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.9, y: 4.2, w: 0.08, h: 2.4,
    fill: { color: ACCENT }, line: { color: ACCENT, width: 0 },
  });
  s.addText("REPOSITORIO PUBLICO", {
    x: 1.2, y: 4.35, w: 11, h: 0.3,
    fontFace: FONT_HEAD, fontSize: 11, bold: true, color: "94A3B8", charSpacing: 4, margin: 0,
  });
  s.addText("github.com/Prospect121/reto2-fleet-alerts", {
    x: 1.2, y: 4.7, w: 11, h: 0.5,
    fontFace: FONT_HEAD, fontSize: 22, bold: true, color: WHITE, margin: 0,
  });
  s.addText("Rama: v2-security-and-latency", {
    x: 1.2, y: 5.2, w: 11, h: 0.4,
    fontFace: FONT_BODY, fontSize: 13, color: "CBD5E1", margin: 0,
  });
  s.addText([
    { text: "Infraestructura: 100% Terraform (30 recursos AWS)", options: { color: "CBD5E1", breakLine: true } },
    { text: "Procesador: AWS Lambda Python 3.12 ARM64 + SnapStart", options: { color: "CBD5E1", breakLine: true } },
    { text: "Resultado: 1000/1000 OK | Lambda > SES 254 ms | Total k6 > Gmail < 15 s", options: { color: "60A5FA" } },
  ], {
    x: 1.2, y: 5.55, w: 11, h: 1.0,
    fontFace: FONT_BODY, fontSize: 12, paraSpaceAfter: 4, margin: 0,
  });

  s.addText(`Equipo: ${TEAM.join("  |  ")}`, {
    x: 0.9, y: 6.75, w: 11.5, h: 0.3,
    fontFace: FONT_HEAD, fontSize: 11, bold: true, color: "CBD5E1", margin: 0,
  });
  s.addText("Diplomado Arquitecturas Cloud  |  Modulo 2  |  2026-04-27", {
    x: 0.9, y: 7.05, w: 11.5, h: 0.3,
    fontFace: FONT_BODY, fontSize: 10, color: "64748B", margin: 0,
  });
}

// Write file
pres.writeFile({ fileName: OUT })
  .then(name => console.log("OK:", name))
  .catch(err => { console.error("ERR:", err); process.exit(1); });
