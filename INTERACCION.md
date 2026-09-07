# Modelo de interacción — navegación en tres niveles

Fuente única para el comportamiento de la interfaz. La sección 5 del contexto apunta acá y no describe pantallas: si algo de navegación o simulación aparece en otro documento, este manda.

La navegación es jerárquica, no un mapa plano.

La idea central: **el mapa no cambia de pantalla, cambia de escala.** No hay rutas ni vistas separadas. Hay una sola escena y una cámara que se acerca. Lo que cambia con la distancia es qué información se revela — zoom semántico, no zoom óptico.

---

## Los tres niveles

### L1 — Ecosistema

Lo primero que se ve. Una constelación por área, flotando en el vacío.

**Las áreas son las `capas` de `ecosystem.json`, tal cual, sin agregar ni fusionar:** Ingesta, Identidad, Clasificación, Ruteo, Atención y Datos. No se inventa una taxonomía visual distinta de la arquitectónica; si mañana cambia una capa en el JSON, cambia el mapa.

- Cada área es un **cúmulo**: sus nodos dibujados chicos, sin etiqueta individual, con un halo tenue que los agrupa.
- Solo se etiquetan las áreas, en versalitas espaciadas, con el conteo de agentes debajo.
- Las aristas entre áreas se dibujan agregadas: una línea por par de áreas conectadas, con grosor según cuántas conexiones reales resume.
- El nodo de entrada de WhatsApp pertenece a Ingesta en los datos, pero se dibuja abajo al centro, fuera del halo de su cúmulo. Es el único punto por donde entra todo y el mapa tiene que decirlo sin leyenda.
- Ruteo tiene un solo nodo y eso está bien: una estrella sola donde las demás áreas son cúmulos es exactamente el argumento de la arquitectura. Un punto único decide, y decide sin modelo de lenguaje.

A esta distancia la pregunta que responde la pantalla es: *¿de qué está hecho esto y por dónde entra un cliente?*

### L2 — Área

Se entra con click en el cúmulo o en su etiqueta. La cámara viaja y encuadra esa área.

- Los nodos del área se separan, crecen y muestran su nombre.
- Aparecen las aristas internas reales, con sus etiquetas y condiciones.
- Las otras áreas siguen ahí, en el borde del encuadre, atenuadas. **No desaparecen.** Que se vean fuera de foco es lo que mantiene la noción de dónde estás parado.
- Las conexiones que salen del área hacia afuera se dibujan hasta el borde, apuntando a su destino.

Responde: *¿qué pasa dentro de esta área y cómo se conecta con el resto?*

### L3 — Agente

Se entra con click en un nodo. La cámara se acerca hasta que ese nodo llena el encuadre y se abre por dentro.

- Un agente deja de ser un círculo y se convierte en su propia constelación pequeña: modelo, herramientas, espacios de conocimiento que consulta, dónde escribe, con qué condiciones deriva.
- Un nodo determinista muestra sus entradas, su lógica y sus salidas posibles, incluidas las de fallo.
- El panel lateral acompaña con lo que no cabe en el dibujo: descripción larga, workflow n8n asociado, estado, parámetros que lee.

Responde: *¿qué hace realmente este agente y con qué cuenta para hacerlo?*

---

## Cámara

Una sola transformación `d3-zoom` sobre el grupo raíz del SVG. El nivel se deriva de la escala, no se guarda como estado aparte:

```ts
const nivel = (k: number) => (k < 1.8 ? "L1" : k < 4.5 ? "L2" : "L3");
```

Reglas:

- **Transición de 600–800 ms con easing suave.** Más rápido se siente brusco, más lento aburre. El viaje entre niveles es la única animación no disparada por la simulación.
- **Zoom con rueda y trackpad siempre habilitado.** El click es un atajo que anima hacia un encuadre calculado, no la única forma de moverse.
- **Escape sube un nivel.** Click en el vacío también. Siempre hay salida.
- **Migas de pan arriba a la izquierda**, en texto plano: `Ecosistema / Atención / Agente de Soporte`. Cada segmento es clickeable.
- **El estado va en la URL** (`?n=ag_sac`). Sin esto no se puede mandar un link a un colega apuntando a un agente específico, que es la mitad de la utilidad de la herramienta.
- **La entrada de datos manda sobre la cámara**: si el usuario está en L3 y ejecuta una simulación, la cámara se retira a L1 automáticamente, porque la ruta cruza áreas.

## Revelado por nivel

| Elemento | L1 | L2 | L3 |
|---|---|---|---|
| Etiqueta de área | sí | atenuada | no |
| Nombre de nodo | no | sí | sí |
| Aristas internas | agregadas | reales | reales |
| Condición en la arista | no | al hover | siempre |
| Interior del agente | no | no | sí |
| Campo de estrellas | denso | medio | tenue |

El campo de estrellas se ralea al acercarse. Es lo que da sensación física de profundidad y cuesta casi nada implementar.

---

## Modo simulación
Panel de controles para construir un caso:
- teléfono en BD: sí / no
- permanencia (slider en días, 0–365)
- es partner: sí / no
- en campaña activa: selector de campaña (o ninguna)
- intención clasificada: VENTAS / SAC
- tipificado: selector alimentado desde la matriz

Al ejecutar:
1. La ruta se ilumina **paso a paso**, con retardo suficiente para seguirla con la vista (~400 ms por salto).
2. En el router, se muestra qué reglas se evaluaron, cuáles no aplicaron y cuál ganó — con su `explicacion` en español.
3. Los nodos no involucrados bajan de opacidad, no desaparecen.
4. Si el caso cae en `REVISION_HUMANA`, la ruta se dibuja igual, terminando en ese nodo con el código de motivo. Los caminos de fallo son ciudadanos de primera clase del diagrama.

Debe existir un botón para reiniciar y otro para copiar el caso como JSON (sirve para armar casos de prueba reales).


La simulación se ejecuta contra `engine/router.ts`, el mismo motor puro que se porta a producción. La pantalla no reimplementa las reglas.

---

## Extensión del esquema de datos

El `ecosystem.seed.json` que ya tienes cubre L1 y L2. Para L3 hay que agregar `interior` a los nodos:

```ts
type Nodo = {
  // ...campos existentes
  interior?: {
    nodos: {
      id: string;
      nombre: string;
      tipo: "modelo" | "herramienta" | "conocimiento" | "salida" | "guardia";
      descripcion: string;
    }[];
    aristas: { origen: string; destino: string; etiqueta?: string }[];
  };
};
```

Ejemplo para el agente de soporte:

```json
"interior": {
  "nodos": [
    { "id": "sac_modelo", "nombre": "Claude Haiku 4.5", "tipo": "modelo",
      "descripcion": "Responde en español de Chile con el contexto de la conversación completa." },
    { "id": "sac_kb", "nombre": "Busca en el conocimiento", "tipo": "herramienta",
      "descripcion": "Consulta la base vectorial antes de responder o derivar." },
    { "id": "sac_ns_pagos", "nombre": "Pagos electrónicos", "tipo": "conocimiento", "descripcion": "" },
    { "id": "sac_ns_soluciones", "nombre": "Soluciones generales", "tipo": "conocimiento", "descripcion": "" },
    { "id": "sac_guardia", "nombre": "Antes de derivar, intenta resolver", "tipo": "guardia",
      "descripcion": "Solo deriva de inmediato si hay riesgo o frustración detectada. En cualquier otro caso busca primero." },
    { "id": "sac_ticket", "nombre": "Actualiza el ticket", "tipo": "salida", "descripcion": "" }
  ],
  "aristas": [
    { "origen": "sac_modelo", "destino": "sac_kb" },
    { "origen": "sac_kb", "destino": "sac_ns_pagos" },
    { "origen": "sac_kb", "destino": "sac_ns_soluciones" },
    { "origen": "sac_modelo", "destino": "sac_guardia" },
    { "origen": "sac_guardia", "destino": "sac_ticket" }
  ]
}
```

Poblar el `interior` de los cinco agentes a mano es tedioso y se desactualiza sola. Es exactamente el trabajo para la sesión de extracción con el MCP de n8n: leer los workflows reales y generar los interiores desde ahí.

---

## Orden de construcción

1. L2 primero, con un área sola. Es el nivel donde se define el lenguaje visual de nodos y aristas.
2. L1 después, agregando los nodos de esa área en un cúmulo. Si L2 está bien resuelto, L1 es una simplificación.
3. La cámara y las transiciones entre L1 y L2.
4. L3, que es el más vistoso y el que más se puede posponer.
5. El modo simulación al final, sobre la cámara ya funcionando.

Construir en el orden inverso — empezar por la vista macro impresionante — es la trampa habitual: queda bonito en la primera captura y sin nada adentro.

## Fuera de alcance

Editar el grafo desde la interfaz. Conexión en vivo a n8n, Jira o BigQuery. Autenticación. Búsqueda de texto sobre los nodos (útil, pero solo cuando el ecosistema pase de unos 50 nodos). Comparar dos rutas de simulación lado a lado.
