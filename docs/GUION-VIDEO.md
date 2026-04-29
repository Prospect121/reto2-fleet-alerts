# Guion para video y presentación — Reto 2

Texto pensado para **leer en voz alta y que suene natural**, como si estuvieras explicándole a un colega lo que hicieron. Lenguaje familiar, sin jerga innecesaria, con analogías cuando ayudan.

Cues entre corchetes:
- **[CLICK]** = avanza a la siguiente slide
- **[PAUSA]** = respira, deja un segundo de silencio
- **[MOSTRAR …]** = cambia de pantalla compartida (terminal, Gmail, CloudWatch)
- **[ÉNFASIS]** = la palabra clave para resaltar al hablar

Tip importante: **si te trabas, no te corrijas en voz alta** — sigue. Es mil veces mejor un guion fluido con dos tropiezos que uno perfecto pero robótico.

Tiempo total apuntado: 10–12 minutos.

---

## SLIDE 1 — Portada (0:00 – 0:35)

> Hola, ¿qué tal? Somos cuatro estudiantes del módulo dos del diplomado: Luis Fernando, Erick, Raul y Juan. Hoy les venimos a contar cómo resolvimos el reto número dos.
>
> [PAUSA] El reto, dicho rápido, era construir un sistema que recibe muchos datos de unos vehículos, identifica cuándo hay una emergencia, y manda un correo de aviso. Suena sencillo, pero la gracia está en que pasen mil peticiones en treinta segundos sin perder ni una, y que el correo llegue en menos de quince segundos.
>
> Lo armamos todo en AWS, con la infraestructura escrita en código y subida a un repositorio público de GitHub. En unos diez minutos les muestro cómo funciona, qué decisiones tomamos, y al final hacemos un demo en vivo para que vean los tiempos reales.

**[CLICK → slide 2]**

---

## SLIDE 2 — El reto en 3 puntos (0:35 – 1:25)

> Antes de meternos en lo técnico, recordemos rapidito qué pidieron en el reto. Son tres cosas.
>
> [PAUSA] La primera: el sistema tiene que aguantar **mil peticiones en treinta segundos**. Y no "más o menos" — tienen que pasar las mil. Si se cae una sola, ya quedamos mal.
>
> La segunda: dentro de esas mil peticiones, algunas vienen marcadas como "Emergency" — son las del botón de pánico del vehículo. Cuando aparece una de esas, hay que mandar un correo a Gmail. Y dejar registrado en algún lado a qué hora llegó la emergencia y a qué hora salió el correo.
>
> Y la tercera, que es la más enredada: las restricciones técnicas. No podemos pasarnos de quince peticiones por segundo. No podemos tener más de diez procesadores trabajando al mismo tiempo. Y el correo tiene que llegar en menos de quince segundos.
>
> [ÉNFASIS] Esa última es clave, porque la mitad de la nota del reto se juega ahí. Quince segundos o menos, dos puntos cinco. Más de eso, baja la nota.

**[CLICK → slide 3]**

---

## SLIDE 3 — Arquitectura (1:25 – 2:30)

> Esta es la arquitectura completa. La voy a explicar como un cuento, de izquierda a derecha.
>
> [PAUSA] Empezamos en el cliente. Esto es k6, una herramienta que simula los vehículos mandando peticiones. Cada petición es como una llamada que entra al sistema.
>
> La llamada cae primero en **API Gateway**, que viene siendo el portero del edificio. Revisa que traigas la llave correcta — un header llamado `x-api-key` — y verifica que no estés mandando demasiadas peticiones de golpe. Si todo está en orden, deja pasar la llamada.
>
> Acá hay un detalle importante. Lo típico sería: el portero llama a una función Lambda, y esa Lambda escribe en una cola. Pero nosotros le ahorramos un paso: el portero **deja el mensaje directo en la cola**, sin pasar por una Lambda intermedia. Eso baja la latencia.
>
> Esa cola se llama **SQS**. Es básicamente un buzón de mensajes ordenados. Tenemos uno principal y uno de respaldo — la DLQ — para los mensajes problemáticos.
>
> Después viene la **Lambda procesadora**, que es la función chiquita que se levanta cuando hay mensajes en el buzón. Los lee de a diez, mira cada uno y se pregunta: ¿este es de tipo Emergency? Si sí, manda un correo usando **SES**, el servicio de correos de AWS. Si no, lo registra y sigue.
>
> Y todo lo que pasa queda guardado en **CloudWatch**, que es como la bitácora central del sistema. Ahí podemos ir a ver qué hizo cada componente y a qué hora.

**[CLICK → slide 4]**

---

## SLIDE 4 — Decisiones de arquitectura (2:30 – 4:00)

> Bueno, ¿y por qué armamos el sistema así y no de otra forma? Hubo cinco decisiones importantes que les quiero comentar.
>
> [PAUSA] **La primera.** AWS te da dos sabores de API Gateway: el viejo, REST, y el nuevo, HTTP API. El nuevo es más rápido y más barato. Uno diría: pues el nuevo, ¿cierto? Pero no, porque el reto pide explícitamente poder configurar las quince peticiones por segundo, y esa configuración solo existe en el viejo. Así que toca usar REST.
>
> **La segunda.** El patrón típico sería: API Gateway llama a una Lambda, y la Lambda escribe en la cola. Pero si uno lo piensa, esa Lambda intermedia no hace nada útil — solo recibir y volver a mandar. Es un paso muerto que suma tiempo. Entonces lo eliminamos: el API Gateway escribe directo en la cola. Nos ahorramos como cien o doscientos milisegundos por petición.
>
> **La tercera.** Las colas SQS vienen en dos modos: FIFO y Standard. FIFO te garantiza que los mensajes lleguen en el orden en que entraron, pero solo aguanta trescientos por segundo. Para nuestro pico, cuando llegan las mil de golpe, no alcanza. Standard no garantiza orden estricto, pero su capacidad es ilimitada. En nuestro caso, no importa el orden — importa la velocidad. Así que Standard.
>
> **La cuarta.** Para mandar correos, AWS tiene dos servicios: SNS y SES. SNS es genérico y los correos pueden tardar entre diez y treinta segundos en llegar. SES está hecho específicamente para correo y tarda entre uno y tres segundos. [ÉNFASIS] Con un límite de quince segundos, esa diferencia define si ganamos la nota completa o la mitad.
>
> **Y la quinta**, que es la más sutil. Para limitar las Lambdas a diez al tiempo, había dos formas. La obvia es decirle a la función directamente "máximo diez", pero eso choca con la cuota global de la cuenta AWS, que también es diez. Si reservas las diez para una sola función, no te queda nada para nada más. Entonces lo hicimos del otro lado: en el conector que une la cola con la Lambda, ahí pusimos el tope. Funciona igual, pero no toca la cuota global.

**[CLICK → slide 5]**

---

## SLIDE 5 — Atributo de calidad (4:00 – 4:50)

> Si me preguntan cuál es el atributo de calidad más importante de esta solución, sin pensarlo dos veces les respondo: **Performance**. La velocidad con la que llega el correo desde que se manda la petición hasta que aparece en la bandeja.
>
> [PAUSA] Y la razón es muy directa. Por un lado, la mitad de la nota del reto se juega ahí. Eso ya es razón suficiente. Pero más allá de la nota, en un sistema real de alerta temprana — estamos hablando de un botón de pánico en un vehículo — cada segundo cuenta. No es lo mismo que llegue el aviso en tres segundos que en treinta.
>
> Por eso todas las decisiones que les conté antes apuntan al mismo objetivo: bajar latencia. Saltarse la Lambda intermedia. Usar SES en vez de SNS. Procesar los mensajes apenas llegan, sin esperar a llenar el lote.
>
> Como atributos secundarios también cuidamos otros dos. Uno es la **confiabilidad**: la cola y la DLQ aseguran que no se pierda ningún mensaje, incluso si la Lambda tiene un problema. Y el otro es la **escalabilidad**: el burst de dos mil aguanta el pico inicial sin trabarse.

**[CLICK → slide 6]**

---

## SLIDE 6 — Tácticas (4:50 – 5:50)

> Para implementar todo eso aplicamos cuatro tácticas concretas, una por cada categoría de las que vimos en clase.
>
> [PAUSA] En **Performance**, la táctica es **introducir concurrencia**: las diez Lambdas trabajando al mismo tiempo. Si tuviéramos una sola Lambda procesando los mensajes uno detrás del otro, nos demoraríamos un montón. Diez al tiempo, drenamos la cola en pocos segundos.
>
> En **Availability**, la táctica es **reintentar con manejo de errores**. Si por algún motivo la Lambda se cae procesando un mensaje, ese mensaje vuelve a la cola y se reintenta. Si después de tres intentos sigue fallando, se va a la DLQ y suena una alarma. Pero ningún mensaje se pierde, nunca.
>
> En **Modifiability**, usamos el patrón **broker** — la cola como punto intermedio. Mañana podemos cambiar la Lambda por un servidor Docker o por una EC2, y ni el cliente ni el API Gateway se enteran. La cola es el contrato.
>
> Y en **Security**, **mínimo privilegio**. La Lambda solo tiene permiso para mandar correos, nada más. El API Gateway solo tiene permiso para escribir en la cola, nada más. Y el endpoint pide la llave para cualquier petición — sin esa llave, responde un cuatrocientos tres y chao.

**[CLICK → slide 7]**

---

## SLIDE 7 — Demo en vivo (5:50 – 8:50)

> [PAUSA breve] Bueno, llegó la parte importante. Vamos a hacer el demo en vivo, los seis pasos que ven en la slide.
>
> **Primero**, miren mi Gmail.
>
> **[MOSTRAR Gmail]** Tengo una búsqueda activa que dice "Alerta numeral", para filtrar solo los correos del sistema. Como ven, está vacío. No hay ninguno.
>
> **Segundo**, paso al terminal.
>
> **[MOSTRAR terminal]** Tengo dos variables ya cargadas: la URL del endpoint, y la llave de acceso. Las saqué con `terraform output` un momento antes de empezar el video. Voy a correr el script de k6.
>
> **[Ejecutar `k6 run -e API_URL=$env:API_URL -e API_KEY=$env:API_KEY k6/k6-script.js`]**
>
> [Mientras corre k6] Mientras corre, les explico qué está pasando. k6 está mandando mil peticiones, distribuidas entre diez "vehículos virtuales" que trabajan en paralelo. El script está configurado en modo `single`, lo que quiere decir que las primeras novecientas noventa y nueve peticiones son eventos normales, de tipo Position. **Solo la última, la número mil, es la emergencia**.
>
> ¿Por qué lo hicimos así? Porque la rúbrica mide el tiempo entre el último envío en k6 y la llegada del correo. Si el último envío es justamente la única emergencia que se manda, no hay duda sobre qué reloj comparar contra qué reloj.
>
> [Cuando termine k6, ~10s después]
>
> **Tercero**, miren los resultados. Terminó en once segundos. Los checks pasaron al cien por ciento — [ÉNFASIS] mil de mil. Cero fallos. Y miren acá arriba [SEÑALAR el log de la consola]: k6 me imprimió "Emergency sent at iteration 1000 of 1000", con el timestamp exacto del último envío.
>
> **Cuarto**, paso a CloudWatch.
>
> **[MOSTRAR CloudWatch Live Tail]** Aquí está el log de la Lambda en tiempo real. Pueden ver dos líneas. La primera dice "EMERGENCY_RECEIVED" — ese es el momento exacto en que la Lambda recibió la emergencia. La segunda dice "EMAIL_SENT" — ese es el momento en que SES aceptó el correo. La diferencia entre las dos es de [ÉNFASIS] doscientos cincuenta y cuatro milisegundos. Un cuarto de segundo.
>
> **Quinto**, vuelvo a Gmail.
>
> **[MOSTRAR Gmail con refresh]** Y ahí está el correo, recién llegado. Lo abro.
>
> **[Abrir correo]** Miren el subject: "Alerta numeral mil sobre mil", con la placa del vehículo virtual. Y dentro del cuerpo del correo armamos una tabla con tres marcas de tiempo: cuándo se envió desde k6, cuándo lo recibió la Lambda, y cuándo lo aceptó SES.
>
> **Sexto y último**, comparemos. Si tomo el "sent_at" del cuerpo del correo y lo resto contra la hora de llegada que muestra Gmail acá arriba [SEÑALAR la hora del email] — esta de acá — la diferencia está en el orden de [ÉNFASIS] **dos a tres segundos**. Muy por debajo del límite de quince.
>
> Eso es la prueba del cumplimiento, hecha en vivo.

**[CLICK → slide 8]**

---

## SLIDE 8 — Resultados medidos (8:50 – 9:40)

> Las cifras del test que acaban de ver, resumidas.
>
> [PAUSA] Mil peticiones, mil exitosas. **Cero errores**. Once segundos en total — fuimos más rápidos que los treinta del límite porque el burst nos dejó pasar todo en bloque al principio.
>
> El tramo que controlamos nosotros — desde que la Lambda recibe el mensaje hasta que SES acepta el correo — fueron doscientos cincuenta y cuatro milisegundos. Un cuarto de segundo.
>
> El tramo final, de SES a Gmail, no lo controlamos — eso depende de la red de Google — pero típicamente toma entre uno y tres segundos.
>
> Sumando todo, el correo termina llegando entre **uno y medio y tres segundos y medio** después del último envío. Bien por debajo de los quince. Eso son los dos puntos cinco completos.
>
> Abajo en la slide pueden ver los logs reales: a las diez cuarenta y siete y trece segundos, la Lambda recibió la emergencia. Doscientos cincuenta y cuatro milisegundos después, SES la aceptó.

**[CLICK → slide 9]**

---

## SLIDE 9 — Cumplimiento de la rúbrica (9:40 – 10:20)

> Repasemos rápido los seis puntos de la rúbrica para asegurarnos de que cubrimos todo.
>
> [PAUSA] Justificación de las decisiones de arquitectura — slide cuatro. **Listo**.
>
> Atributo de calidad más importante — slide cinco. **Listo**.
>
> Diagrama de la arquitectura — slide tres, completo. **Listo**.
>
> Tácticas de arquitectura — slide seis, una por cada categoría. **Listo**.
>
> Tiempo de entrega del correo en menos de quince segundos — el demo lo demostró con números reales. **Listo**, con los dos puntos cinco completos.
>
> Y los logs de recepción y envío — los vieron en CloudWatch durante el demo. **Listo**.
>
> [ÉNFASIS] Puntaje esperado: cinco sobre cinco.

**[CLICK → slide 10]**

---

## SLIDE 10 — Cierre (10:20 – 10:50)

> Y eso fue. Todo el código, la infraestructura, los logs, el documento técnico, este mismo Power Point — todo está en el repositorio público que ven en pantalla.
>
> [PAUSA] Gracias por la atención. El equipo somos Luis Fernando, Erick, Raul y Juan. Si tienen preguntas, las contestamos con gusto.

**[FIN del video / inicio Q&A si es presentación]**

---

## Plan B si algo falla durante el demo

**Si k6 da error** (red, throttle, 403):
> "Veo que tuvimos un problema con la conexión. Déjenme mostrarles la grabación previa donde se ve el flujo completo igual." [tener un screen recording de respaldo listo]

**Si el correo no llega en el momento del demo**:
> "Mientras llega, déjenme mostrarles los logs de CloudWatch — pueden ver que SES ya aceptó el mensaje. La latencia final hasta Gmail está fuera de nuestro control y depende de Google."

**Si te trabas o te equivocas en una cifra**:
> No te corrijas. Sigue. Si es muy importante, dilo de nuevo más adelante con naturalidad: "Como les decía, fueron doscientos cincuenta y cuatro milisegundos."

---

## Preguntas que probablemente les hagan en Q&A (con respuestas listas)

**P: ¿Cómo logran mil peticiones en treinta segundos si el límite es quince por segundo?**
> "Buena pregunta. API Gateway no aplica el límite petición por petición — usa un algoritmo que se llama token bucket. El bucket arranca con dos mil tokens, que es el burst. Cada petición consume un token y se rellena a quince por segundo. Las mil peticiones de k6 consumen mil tokens del bucket inicial sin tocar el límite sostenido. Por eso el reto pide explícitamente burst igual a dos mil."

**P: ¿Por qué solo API Key y no algo más fuerte como Cognito?**
> "Por dos razones. Una, scope: el reto pide seguridad básica, no autenticación de identidad de usuario. Dos, simplicidad: la API Key con Usage Plan ya nos da autenticación y throttling por cliente. Si en producción tuviéramos varios clientes, cada uno tendría su llave y su cupo independiente. Para identidad real sí usaríamos Cognito."

**P: ¿Qué le falta a esto para llegar a producción?**
> "Tres cosas. Primero, AWS WAF al frente del API Gateway, para protección contra tráfico malicioso. Segundo, un pipeline de CI/CD con GitHub Actions, para que cualquier cambio pase por revisión antes de aplicarse. Y tercero, salir del sandbox de SES, que limita el envío a direcciones verificadas. En producción uno necesita poder mandarle a cualquier destinatario."

**P: ¿Por qué no usaron X-Ray para trazas distribuidas?**
> "Por scope. La rúbrica no lo exigía y agregaba complejidad sin un beneficio inmediato para este reto. En producción sí lo agregaríamos, sobre todo para correlacionar trazas entre los componentes y poder hacer debugging más fino."

**P: ¿Qué pasa si el reloj del cliente está desfasado?**
> "Lo notamos en una de las pruebas — el reloj de Windows estaba adelantado como medio segundo respecto a UTC. Eso afecta solo la comparación que mostramos en el cuerpo del correo, pero no la rúbrica, porque las marcas de tiempo de Lambda y de Gmail vienen de relojes sincronizados por NTP. La que vale para la nota es la diferencia entre el sent_at y el header Date de Gmail, no el delta interno del log."

---

## Cómo ensayar

Antes de grabar o presentar, leelo dos veces en voz alta con cronómetro:

1. **Primera pasada**: te calibras con los tiempos. Si te pasas de doce minutos, recortá la slide cuatro (decisiones) — esa es la más densa, podés saltar la quinta decisión si vas largo.
2. **Segunda pasada**: marcá con lápiz dónde querés respirar y dónde querés enfatizar.

Y antes del demo en vivo: corré el `k6 run` **una vez en seco** para verificar que SES está verificado, la API Key no está throttled, y los timestamps salen limpios. Eso te ahorra el susto de que falle en directo.
