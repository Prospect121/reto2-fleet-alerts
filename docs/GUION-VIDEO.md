# Guion para el video / presentación — Reto 2

Texto **listo para leer en voz alta** durante el video o el encuentro sincrónico. Cada sección corresponde a una slide del `Reto2-Presentacion.pptx`. Marca aproximada de tiempos: total 10–12 minutos.

Cues entre corchetes:
- **[CLICK]** = avanza a la siguiente slide
- **[PAUSA]** = pausa breve para respirar
- **[MOSTRAR …]** = cambia a pantalla compartida (terminal, Gmail, CloudWatch)
- **[ÉNFASIS]** = palabra a resaltar al hablar

Tip: si te trabas, no te corrijas — sigue. La fluidez vale más que la perfección.

---

## SLIDE 1 — Portada (0:00 – 0:40)

> Hola. Somos el equipo conformado por Luis Fernando Padilla, Erick Nieto, Raul Valencia y Juan Bohorquez, y vamos a presentarles nuestra solución para el Reto 2 del Diplomado en Arquitecturas Cloud, módulo dos.
>
> El nombre del proyecto es **Sistema de Alerta Temprana para Flota Vehicular** y, en una frase, lo que construimos es lo siguiente: un endpoint serverless en AWS que recibe **mil eventos de vehículos en treinta segundos**, detecta los eventos de tipo Emergency en tiempo real, y manda un correo de alerta a Gmail en menos de quince segundos. Toda la infraestructura está declarada en Terraform, en un repositorio público de GitHub.
>
> [PAUSA] El video que van a ver tiene tres partes: primero les muestro la arquitectura y las decisiones que tomamos; segundo, les explico el atributo de calidad y las tácticas; y tercero, hacemos un **demo en vivo** que demuestra el cumplimiento del SLA.

**[CLICK → slide 2]**

---

## SLIDE 2 — El reto en 3 puntos (0:40 – 1:30)

> Antes de entrar a la arquitectura, recordemos qué es lo que el reto nos pide.
>
> Son **tres bloques** de requisitos. El primero, **recepción masiva**: el sistema tiene que aguantar mil eventos en treinta segundos sin perder ni una sola petición. El segundo, **detección en tiempo real**: dentro de ese flujo de eventos, identificar los que vienen marcados como Emergency y dispararlos por correo a una cuenta Gmail personal del equipo, dejando logs claros de cuándo se recibe el evento y cuándo se envía el correo.
>
> Y el tercero, [ÉNFASIS] **las restricciones técnicas**, que son las que más condicionan el diseño: API Gateway con tasa máxima de quince peticiones por segundo, máximo diez procesadores concurrentes, y el correo tiene que llegar en menos de quince segundos para que valga los dos punto cinco puntos completos. Si llega entre quince y cuarenta y cinco segundos baja a uno punto cinco, y si pasa de cuarenta y cinco solo da cero punto cinco. O sea, [ÉNFASIS] la mitad del puntaje del reto depende del tiempo de entrega.
>
> Eso es lo que tenemos que cumplir.

**[CLICK → slide 3]**

---

## SLIDE 3 — Arquitectura (1:30 – 2:30)

> Esta es la arquitectura completa. La voy a recorrer de izquierda a derecha.
>
> [PAUSA] Empezamos con el cliente, **k6**, que es la herramienta de carga que usamos para enviar las mil peticiones. k6 hace POST al endpoint de **API Gateway REST**, mandando además un header `x-api-key` para autenticarse.
>
> API Gateway aplica el throttling — quince por segundo de rate, dos mil de burst — y, en lugar de invocar una Lambda intermedia, lo que hace es una **integración directa de servicio AWS hacia SQS**. O sea: el endpoint deja el mensaje en la cola y le responde al cliente un doscientos al instante. Esto nos ahorra latencia y costo, porque no hay un Lambda de ingesta en el camino.
>
> De ahí, **SQS Standard** desacopla productor y consumidor. Tiene una cola DLQ asociada con `maxReceiveCount` igual a tres: si un mensaje falla tres veces, va a la DLQ y suena una alarma de CloudWatch. Eso garantiza cero pérdida.
>
> La **Lambda procesadora** hace polling de la cola en batches de diez mensajes, sin ventana de espera, hasta un máximo de diez instancias concurrentes — que es la otra restricción del reto. Si el evento es Emergency, llama a **SES `SendEmail`**; si es Position, solo registra el log y termina.
>
> Y finalmente, **SES** entrega el correo a Gmail por SMTP. La Lambda escribe logs estructurados en CloudWatch con marcadores de `EMERGENCY_RECEIVED` y `EMAIL_SENT`, con timestamps en UTC.

**[CLICK → slide 4]**

---

## SLIDE 4 — Decisiones de arquitectura (2:30 – 4:00)

> Cada componente que vieron está aquí por una razón. Les voy a comentar las cinco decisiones más importantes.
>
> **Primera**, ¿REST o HTTP API v2? Elegimos **REST** porque es el único de los dos que expone el rate y el burst nativos por stage, que es un requisito explícito del reto. HTTP API es más barato, pero no podía cumplir esa restricción.
>
> **Segunda**, ¿integramos API Gateway con una Lambda intermedia que escriba a SQS, o lo hacemos directo? Lo hicimos **directo a SQS** con un VTL template. Esto elimina un salto en la cadena, nos ahorra entre cien y doscientos milisegundos por request, baja el costo, y permite que el cliente reciba el doscientos apenas SQS acepta el mensaje.
>
> **Tercera**, ¿SQS FIFO o Standard? **Standard**, porque FIFO está limitado a trescientos mensajes por segundo y nuestro pico es de unos treinta y tres por segundo sostenidos pero con burst altísimo. Standard tiene throughput ilimitado.
>
> **Cuarta**, ¿SES o SNS para mandar el correo? **SES**, porque tiene una latencia típica de uno a tres segundos contra los diez a treinta segundos que puede tomar SNS email. La diferencia es enorme cuando tenemos un SLA de quince segundos.
>
> **Y quinta**, ¿cómo limitamos a diez procesadores concurrentes? Aquí hay dos formas: una es `reserved_concurrent_executions` en la Lambda, y la otra es `scaling_config.maximum_concurrency` en el Event Source Mapping. Elegimos la segunda porque [ÉNFASIS] no consume la quota global de la cuenta AWS, y es suficiente porque la Lambda solo se invoca a través de SQS. Esto fue importante porque trabajamos con cuentas AWS nuevas que tienen una quota total de diez — si reservábamos diez en una sola Lambda, no quedaba nada para el resto del account.

**[CLICK → slide 5]**

---

## SLIDE 5 — Atributo de calidad (4:00 – 4:50)

> [PAUSA breve] Si tuviéramos que elegir un solo atributo de calidad para esta solución, sería **Performance** — específicamente, la latencia de notificación end-to-end, que es el tiempo entre el último envío en k6 y la llegada del correo a Gmail.
>
> ¿Por qué Performance es el número uno? Por dos razones. La primera es práctica: **el cincuenta por ciento del puntaje del reto depende directamente de este número**. Menos de quince segundos da los dos punto cinco puntos completos.
>
> La segunda razón es más conceptual: en sistemas reales de alerta temprana, cada segundo cuenta. Estamos hablando de un botón de pánico en un vehículo. Un retraso de veinte segundos puede ser la diferencia entre prevenir un incidente o no.
>
> Por eso, todas las decisiones que vieron en la slide anterior están alineadas a optimizar latencia: [ÉNFASIS] integración directa, sin Lambda intermedia; SES en lugar de SNS; ARM64 con SnapStart para reducir el cold start; batch sin ventana de espera.
>
> Como atributos secundarios priorizamos **Reliability**, con SQS más DLQ que garantizan cero pérdida, y **Scalability**, donde el burst y la cola absorben el pico inicial sin throttling.

**[CLICK → slide 6]**

---

## SLIDE 6 — Tácticas de arquitectura (4:50 – 5:50)

> Para implementar lo anterior aplicamos tácticas concretas, siguiendo la taxonomía del Software Engineering Institute. Una por categoría.
>
> En **Performance**, la táctica clave es **Introduce concurrency**: las diez Lambdas en paralelo gobernadas por SQS. Es lo que nos permite drenar mil mensajes en pocos segundos.
>
> En **Availability**, **Exception handling con Retry**: usamos `ReportBatchItemFailures`, que hace que solo el mensaje que falla vuelva a la cola, no todo el batch de diez. Combinado con la DLQ y `maxReceiveCount` igual a tres, ningún mensaje se pierde.
>
> En **Modifiability**, **Use intermediaries**, o sea, el patrón broker. SQS desacopla por completo al productor del consumidor. Si mañana queremos cambiar la Lambda por un servicio en ECS o EC2, ni el cliente ni API Gateway se enteran. El contrato es la cola.
>
> Y en **Security**, **Limit access**, el principio de mínimo privilegio. El rol de Lambda solo tiene permiso para `SendEmail` sobre el identity verificado de SES. El rol de API Gateway solo tiene `SendMessage` sobre la cola. Y el endpoint requiere el header `x-api-key` para responder algo distinto a un cuatrocientos tres.

**[CLICK → slide 7]**

---

## SLIDE 7 — Demo en vivo (5:50 – 8:50)

> [PAUSA] Bien. Hasta aquí la teoría. Ahora viene la parte importante: el [ÉNFASIS] **demo en vivo** que demuestra el cumplimiento del SLA. Voy a hacer seis pasos.
>
> **[MOSTRAR Gmail]** Lo primero, este es mi Gmail con la búsqueda `subject:"Alerta #"` aplicada, así filtro solo los correos del sistema. Como ven, está vacío.
>
> **[MOSTRAR terminal]** Paso al terminal. Tengo dos variables de entorno listas: `API_URL` con el endpoint y `API_KEY` con la clave que obtuve del `terraform output`. Voy a ejecutar el script de k6.

```bash
k6 run -e API_URL=$env:API_URL -e API_KEY=$env:API_KEY k6/k6-script.js
```

> [Mientras corre] Lo que está pasando es que k6 está mandando mil peticiones distribuidas entre diez VUs. El script está configurado en modo `single`, lo que significa que las primeras novecientas noventa y nueve son eventos `Position` y solo la iteración mil es un `Emergency`. Esto es deliberado: la rúbrica mide [ÉNFASIS] el tiempo entre el último envío en k6 y la llegada del correo. Si el último envío es justamente la única emergencia, no hay ambigüedad sobre qué timestamp comparar.
>
> [Cuando termine k6] Listo, terminó. Ven dos cosas importantes: primero, los checks pasaron al **cien por ciento** — mil de mil. Y segundo, en el log de la consola me imprime `EMERGENCY sent at iteration 1000 of 1000`, con el `sent_at` exacto en formato ISO ocho mil seiscientos uno. Esa es la marca de tiempo del último envío.
>
> **[MOSTRAR CloudWatch Live Tail]** Cambio a CloudWatch. Pueden ver dos líneas: `[EMERGENCY_RECEIVED]` con timestamp, y `[EMAIL_SENT]` con timestamp. Si miran los deltas que registra el log, la latencia entre que la Lambda recibe el evento y que SES acepta el correo es de [ÉNFASIS] doscientos cincuenta y cuatro milisegundos. Esa es la parte del pipeline bajo nuestro control.
>
> **[MOSTRAR Gmail, refresh]** Y aquí está el correo, recién llegado. Lo abro.
>
> **[Abrir el correo]** Fíjense bien en dos cosas. Primero, el subject dice `Alerta #1000/1000`, así que sé exactamente que es la última iteración. Y segundo, dentro del cuerpo del correo hay una tabla con tres timestamps: el `sent_at` del cliente — que es el último envío en k6 — el `received_at` de la Lambda, y el `email_accepted_at` post-SES.
>
> Si comparo el `sent_at` con la hora de llegada que muestra Gmail acá arriba [SEÑALAR la fecha del email], la diferencia está en el orden de [ÉNFASIS] **dos a tres segundos**. Muy por debajo de los quince segundos del SLA.
>
> Eso es la prueba del cumplimiento.

**[CLICK → slide 8]**

---

## SLIDE 8 — Resultados medidos (8:50 – 9:40)

> Resumiendo las cifras del test que acaban de ver.
>
> Mil peticiones, mil exitosas, **cien por ciento** de procesamiento. Cero fallos. Once segundos totales para enviar las mil — k6 fue más rápido que los treinta segundos del límite porque el burst le dejó pasar todo en bloque.
>
> El tramo de Lambda hasta SES, que es la parte que controlamos, midió [ÉNFASIS] doscientos cincuenta y cuatro milisegundos. El tramo final de SES hasta Gmail no lo controlamos nosotros — depende de la red de Google — pero típicamente toma entre uno y tres segundos.
>
> Sumando todo, el total estimado entre el último envío en k6 y la llegada del correo está entre **uno punto cinco y tres punto cinco segundos**. Eso da los dos punto cinco puntos completos de la rúbrica.
>
> [PAUSA] Abajo pueden ver los logs reales del único Emergency: el `[EMERGENCY_RECEIVED]` a las diez cuarenta y siete trece punto cero treinta y siete UTC, y el `[EMAIL_SENT]` doscientos cincuenta y cuatro milisegundos después.

**[CLICK → slide 9]**

---

## SLIDE 9 — Cumplimiento de la rúbrica (9:40 – 10:20)

> Repasamos rápido los seis criterios de la rúbrica para asegurarnos de que está todo cubierto.
>
> Justificación de decisiones de arquitectura — slide cuatro, donde mostramos las cinco decisiones clave con su razón. **Cumplido**.
>
> Atributo de calidad más importante — slide cinco, Performance con justificación. **Cumplido**.
>
> Diagrama de arquitectura — slide tres, completo con todos los componentes en us-east-1. **Cumplido**.
>
> Tácticas de arquitectura — slide seis, con una táctica por cada categoría SEI. **Cumplido**.
>
> Tiempo de entrega del correo menor a quince segundos — lo demostramos en el demo en vivo, con números reales. **Cumplido**, con dos punto cinco puntos.
>
> Y logs de recepción y envío — los vieron en CloudWatch durante el demo. **Cumplido**.
>
> [ÉNFASIS] Puntaje esperado: **cinco sobre cinco**.

**[CLICK → slide 10]**

---

## SLIDE 10 — Cierre (10:20 – 10:50)

> Eso es todo. Gracias por su atención.
>
> Toda la implementación está en el repo público que ven en pantalla — `github.com/Prospect121/reto2-fleet-alerts`, rama `v2-security-and-latency`. La infraestructura es cien por ciento Terraform, treinta recursos AWS. La Lambda corre en Python tres punto doce sobre ARM sesenta y cuatro con SnapStart.
>
> El equipo está conformado por Luis Fernando Padilla, Erick Nieto, Raul Valencia y Juan Bohorquez. Quedamos atentos a sus preguntas.

**[FIN]**

---

## Notas de respaldo (por si pasa algo en el demo)

Si **k6 falla** en vivo (red, throttle, error 403):
> "Veo que tuvimos un problema de red, déjenme mostrarles la grabación previa del mismo demo donde se ve el flujo completo." [tener un screen recording de respaldo]

Si **el correo no llega** en el momento del demo:
> "Mientras llega el correo, déjenme mostrarles los logs de CloudWatch — pueden ver que `[EMAIL_SENT]` ya se registró, lo que significa que SES aceptó el mensaje. La latencia final SES-Gmail está fuera de nuestro control y depende de Google."

Si te preguntan **cómo manejan los mil eventos con rate de quince por segundo**:
> "API Gateway usa un algoritmo de token bucket. El bucket arranca con dos mil tokens — el burst — y se rellena a quince por segundo. Las mil peticiones consumen mil tokens del burst inicial, sin tocar el límite sostenido. Esa es la razón de que el reto pida explícitamente burst igual a dos mil."

Si te preguntan **por la seguridad del endpoint**:
> "Pusimos API Key con Usage Plan. Sin el header `x-api-key` correcto, el endpoint responde cuatrocientos tres. El throttling se aplica por API key, así que si en producción quisiéramos tener varios clientes, cada uno tendría su cupo independiente. Para autenticación de identidad real usaríamos Cognito, pero para el alcance del reto la API Key es suficiente."

Si te preguntan **qué falta para producción**:
> "Tres cosas principalmente. Primero, AWS WAF al frente del API Gateway para protección contra tráfico malicioso. Segundo, un pipeline de CI/CD con GitHub Actions para los `terraform plan` y `apply`. Tercero, salir del sandbox de SES para poder enviar a destinatarios no verificados."

Si te preguntan **por qué no usaron X-Ray**:
> "Por scope. La rúbrica no lo exige y agregaba complejidad. Para producción sí lo agregaríamos, junto con CloudWatch Insights para correlacionar trazas con logs estructurados."

---

## Ensayo recomendado

Antes de grabar o presentar, lee este guion completo en voz alta **dos veces** con cronómetro:

- Primera vez: te calibras con los tiempos. Si te pasas de doce minutos, recorta de Slide 4 (decisiones) — son las más densas.
- Segunda vez: marca con lápiz dónde quieres respirar y dónde quieres enfatizar.

Y antes del demo: corre el `k6 run` **una vez en seco** para verificar que SES esté verificado, la API Key no esté throttled y los timestamps salgan limpios. Esto te ahorra el susto de fallar en vivo.
