# Contexto del proyecto — Visualizador del ecosistema de agentes IA (Haulmer)

> Documento de contexto para herramienta de escritorio (Cursor / Claude Code).
> Renombrar a `CLAUDE.md` o `AGENTS.md` si se quiere carga automática en la raíz del repo.
> **Este documento describe DOS cosas: (A) el ecosistema real que hay que representar, y (B) el visualizador que hay que construir.** No mezclarlas: el visualizador es una *lectura* del ecosistema, no su implementación.

---

## 0. Qué se construye

Una aplicación web de una sola pantalla que representa, como un mapa navegable, el ecosistema de agentes IA de atención y venta de Haulmer, con **un único canal de entrada: WhatsApp**.

No es un organigrama ni un diagrama de arquitectura estático. Es un **mapa de decisión ejecutable visualmente**: el usuario debe poder fijar los parámetros de un cliente ficticio (permanencia, partner, campaña, tipificado) y ver iluminarse la ruta exacta que ese mensaje recorrería, nodo por nodo, hasta el agente destino.

Ese modo de simulación es el corazón del producto. Todo lo demás (estética, panel de detalle, zoom) existe para sostenerlo.

**Audiencia:** equipos internos de Haulmer (Procesos, SAC, Ventas, Producto) y presentación a jefaturas. Debe entenderse sin que nadie explique nada.

---

## 1. El ecosistema a representar

### 1.1 Principio arquitectónico

Tres capas con responsabilidades separadas, y la separación es el mensaje central del diagrama:

| Capa | Naturaleza | Regla |
|---|---|---|
| Clasificación | **Agéntica** (LLM) | Interpreta lenguaje natural. Solo decide *qué quiere* el cliente. |
| Ruteo | **Determinista** (código/tabla) | Cruza la clasificación con parámetros de base de datos. Cero LLM. Auditable y reproducible. |
| Atención | **Agéntica** (LLM) | Agentes especializados, cada uno con su base de conocimiento y sus herramientas. |

El LLM nunca decide a qué embudo va un cliente. El LLM dice *qué pidió*; una tabla de reglas decide *quién lo atiende*. Esto es deliberado: permite auditar el ruteo, cambiar reglas sin tocar prompts, y explicar a un auditor por qué un cliente terminó donde terminó.

### 1.2 Flujo completo

```
WhatsApp (canal único)
   │
   ├─ [C0] Ingesta ................ webhook → dedup → mutex → buffer de mensajes
   │
   ├─ [C1] Identidad .............. lookup por teléfono E.164 en BD de parámetros
   │                               → arma el PERFIL (flags derivados)
   │
   ├─ [C2] Clasificación agéntica
   │        ├─ Clasificador de intención → { VENTAS | SAC } + confianza
   │        └─ Clasificador de tipificado (solo si SAC) → padre/hijo + dominio
   │
   ├─ [C3] Router determinista .... perfil × dominio del tipificado × ventanas
   │                               → destino + motivo (siempre explicitado)
   │
   ├─ [C4] Agentes especializados . Ventas | Onboarding | SAC | Campañas | Humano
   │
   └─ [C5] Persistencia ........... Jira (state store) · BigQuery · HubSpot · CSAT
```

### 1.3 Regla de negocio que originó el proyecto

> Si un cliente escribe, su teléfono **está** en la base de datos, y el tipificado que le asigna el clasificador pertenece al dominio *onboarding*, entonces la conversación se deriva al agente IA de Onboarding.

Generalizada, esa regla es la fila 3 de la tabla de ruteo (§3). El diagrama debe hacer visible por qué esa fila gana sobre las demás en ese caso.

---

## 2. Modelo de datos — parámetros

Esta es la parte crítica: el ruteo solo es tan bueno como los parámetros que puede leer.

### 2.1 Tabla `clientes`

Se alimenta **automáticamente en cada venta** (evento de compra de terminal/maquinita).

| Campo | Tipo | Origen | Notas |
|---|---|---|---|
| `telefono_e164` | STRING (PK) | Venta | Normalizado `+56...`. Clave de cruce con WhatsApp. |
| `cliente_id` | STRING | Venta | ID interno / HubSpot |
| `razon_social` | STRING | Venta | |
| `fecha_compra` | DATE | Venta | Ancla del tiempo de permanencia |
| `fecha_activacion` | DATE | Transaccional | Primera transacción real. Puede diferir de la compra. |
| `producto` | STRING | Venta | TUU POS, Fraccional, Webhosting, AndCo… |
| `es_partner` | BOOL | CRM | Cambia cola y persona del agente |
| `canal_venta` | STRING | Venta | Web, terreno, partner, marketplace |
| `estado` | ENUM | Sistema | `activo` · `inactivo` · `churn` |

**Derivados** (calculados, no almacenados):
- `permanencia_dias = today − fecha_compra`
- `es_cliente_nuevo = permanencia_dias <= UMBRAL_ONBOARDING` *(ver decisión abierta D1)*
- `existe_en_bd = true` si hay match por teléfono

### 2.2 Tabla `campanas`

Cada campaña que se lance **debe** completar este registro antes de salir. Sin registro, el clasificador no tiene contexto y el router no puede rutear: la conversación cae a revisión humana.

| Campo | Tipo | Notas |
|---|---|---|
| `campana_id` | STRING (PK) | |
| `nombre` | STRING | Nombre operativo, se inyecta al prompt del agente |
| `descripcion` | TEXT | **Contexto para el clasificador.** Qué se ofreció, con qué palabras, qué se espera que responda el cliente. Es el campo que más impacta la precisión. |
| `tipificado_asociado` | STRING | Tipificado esperado de las respuestas |
| `ventana_permanencia_min` | INT | Días. Segmento objetivo. |
| `ventana_permanencia_max` | INT | Días |
| `fecha_inicio` / `fecha_fin` | DATE | Fuera de rango, la campaña no aplica |
| `plantilla_wa` | STRING | Template de Meta usado en el envío |
| `activa` | BOOL | |

### 2.3 Tabla `campana_destinatarios`

| Campo | Tipo |
|---|---|
| `campana_id` | STRING |
| `telefono_e164` | STRING |
| `fecha_envio` | TIMESTAMP |
| `estado_envio` | ENUM (`enviado`, `leido`, `respondido`) |

Cruce clave: si un teléfono aparece aquí con envío reciente, su mensaje entrante es muy probablemente una **respuesta a campaña**, no un contacto espontáneo. Esto debe pesar en el ruteo.

### 2.4 Tabla `tipificados`

| Campo | Tipo | Notas |
|---|---|---|
| `tipificado_id` | STRING (PK) | |
| `padre` | STRING | Producto / categoría |
| `hijo` | STRING | Tipificado específico |
| `descripcion` | TEXT | Usada por el clasificador para decidir |
| `dominio` | ENUM | `ventas` · `sac` · `onboarding` · `campanas` ← **el campo que enruta** |
| `requiere_cliente_en_bd` | BOOL | `true` para todo el dominio onboarding |
| `prioridad` | INT | Desempate cuando aplican varias reglas |

Fuente actual: matrices en Google Sheets (una por espacio Jira). El visualizador debe leer un export, no la planilla en vivo.

### 2.5 Tabla `reglas_ruteo`

La tabla de decisión de §3, versionada como dato y no como código. Cambiar el ruteo = editar filas.

---

## 3. Lógica de ruteo (determinista)

Evaluación **en orden de prioridad, primera coincidencia gana**. Cada evaluación produce `{destino, regla_id, motivo}`. El motivo se persiste siempre.

| # | Condición | Destino |
|---|---|---|
| 1 | `intencion = VENTAS` | `AG_VENTAS` |
| 2 | `intencion = SAC` ∧ `en_campana_activa` ∧ `dominio = campanas` ∧ dentro de ventana | `AG_CAMPANAS` |
| 3 | `intencion = SAC` ∧ `existe_en_bd` ∧ `dominio = onboarding` ∧ `permanencia_dias ≤ UMBRAL` | `AG_ONBOARDING` |
| 4 | `intencion = SAC` ∧ `dominio = onboarding` ∧ `permanencia_dias > UMBRAL` | `AG_SAC` (ventana de onboarding vencida) |
| 5 | `intencion = SAC` ∧ `dominio = onboarding` ∧ `¬existe_en_bd` | `AG_SAC` (no se puede onboardear a un desconocido) |
| 6 | `intencion = SAC` ∧ `es_partner` | `AG_SAC` perfil partner → cola SAP *(ver D4)* |
| 7 | `intencion = SAC` ∧ `dominio = ventas` | `AG_VENTAS` (cross-sell de cliente existente) |
| 8 | `intencion = SAC` ∧ `dominio = sac` | `AG_SAC` |
| 9 | **Sin coincidencia** | `REVISION_HUMANA` + código de motivo |

### Fallos ruidosos, nunca degradación silenciosa

Cada uno de estos casos corta el flujo y escala con código de motivo visible; ninguno cae a un default genérico:

- `confianza_clasificador < 0.5` → `REVISION_HUMANA` (motivo `BAJA_CONFIANZA`)
- Tipificado fuera de matriz → `REVISION_HUMANA` (motivo `FUERA_DE_MATRIZ`)
- Teléfono en más de una campaña activa sin regla de precedencia → `REVISION_HUMANA` (motivo `CAMPANA_AMBIGUA`)
- Lookup de BD con timeout → `REVISION_HUMANA` (motivo `BD_NO_DISPONIBLE`), **no** se asume "cliente nuevo"

El último punto es importante y debe verse en el diagrama: un fallo de infraestructura no puede disfrazarse de dato de negocio.

---

## 4. Contrato de datos del visualizador

El grafo se construye desde un único `data/ecosystem.json`. **La UI no debe tener nodos hardcodeados.** Cambiar el ecosistema = editar el JSON.

```ts
type Capa = { id: string; nombre: string; orden: number; descripcion: string };

type TipoNodo = "agente" | "determinista" | "dato" | "externo" | "humano";
type Estado   = "produccion" | "desarrollo" | "propuesto";

type Nodo = {
  id: string;
  nombre: string;
  capa: string;                 // FK → Capa.id
  tipo: TipoNodo;
  estado: Estado;
  descripcion: string;          // 1–2 frases, lenguaje de negocio
  modelo?: string;              // solo tipo "agente"
  herramientas?: string[];
  parametros_lee?: string[];    // FK → Parametro.id
  escribe_en?: string[];        // FK → Nodo.id
  kb_namespaces?: string[];
  workflow_n8n?: string;
  pos?: { x: number; y: number }; // opcional: layout fijo. Si falta, se calcula.
};

type Arista = {
  origen: string;
  destino: string;
  tipo: "flujo" | "lectura" | "escritura" | "fallback";
  etiqueta?: string;
  condicion?: string;           // expresión legible, se muestra al hover
};

type Parametro = {
  id: string;
  nombre: string;
  fuente: string;               // tabla.campo
  tipo: "bool" | "int" | "enum" | "string" | "date";
  valores?: string[];
  derivado_de?: string;
  usado_por: string[];          // FK → Nodo.id
};

type ReglaRuteo = {
  id: string;
  prioridad: number;
  cuando: Record<string, unknown>;  // predicados sobre Parametro.id
  destino: string;                  // FK → Nodo.id
  motivo: string;
  explicacion: string;              // frase en español, se muestra en simulación
};
```

Se adjunta `ecosystem.seed.json` con el ecosistema real ya poblado. Validar con Zod al cargar y **fallar visiblemente** (pantalla de error con la ruta del campo inválido) si el JSON no cumple el esquema.

---

## 5. Requisitos funcionales

La navegación y el modo simulación están especificados en `docs/INTERACCION.md`, que es la fuente única para todo lo que sea comportamiento de la interfaz. Este documento no describe pantallas.

Lo que sí manda desde acá:

- **Las áreas del mapa son exactamente las `capas` de `ecosystem.json`.** No hay una taxonomía visual paralela a la arquitectónica.
- **El detalle de un nodo** muestra: nombre, capa, tipo, estado, descripción, modelo, herramientas, parámetros que lee, dónde escribe y workflow n8n asociado.
- **Los nodos en estado `propuesto` se dibujan con contorno punteado.** Hay que distinguir de un vistazo qué existe y qué está por construirse.
- **Las aristas de `lectura` y `escritura` se distinguen visualmente de las de `flujo`.**

## 6. Dirección de diseño

Referencia visual entregada por el cliente: mapa estelar sobre fondo oscuro, nodos circulares claros con glifo, líneas de conexión tenues, etiquetas de agrupación en versalitas espaciadas, marca de agua tipográfica grande y translúcida detrás de la constelación. **Seguir esa dirección.**

Donde la referencia no obliga, no gastar la libertad en defaults. En particular: no crema cálido sobre terracota, no tarjetas redondeadas idénticas, no gradientes decorativos.

### 6.1 El color codifica información, no decora

| Token | Hex | Significado |
|---|---|---|
| `--ink-900` | `#0D0F16` | Fondo |
| `--ink-700` | `#171A25` | Paneles, superficies elevadas |
| `--wire` | `#3A4152` | Aristas en reposo |
| `--star` | `#E9E3D6` | **Nodos agénticos (LLM)** — relleno sólido |
| `--det` | `#6E8CA8` | **Nodos deterministas** — contorno, sin relleno |
| `--signal` | `#F0A63C` | **Parámetros y ruta activa en simulación** |
| `--alert` | `#C4574A` | **Fallback / revisión humana** |

La distinción relleno-sólido (agente) vs. contorno (determinista) es la que sostiene el mensaje arquitectónico de §1.1. Debe leerse sin leyenda, aunque haya leyenda.

### 6.2 Tipografía
- **IBM Plex Sans Condensed** para etiquetas de capa y títulos. Vernáculo técnico, no editorial.
- **IBM Plex Mono** para IDs de nodo, códigos de motivo y valores de parámetro — aquí el monoespaciado sí codifica algo (son identificadores), no es decoración.
- Versalitas espaciadas **solo** en las etiquetas de agrupación, siguiendo la referencia. En el resto de la interfaz, sentence case.
- Prosa a menos de 80 caracteres por línea en el panel de detalle.

### 6.3 Movimiento
Un único momento orquestado: la animación de la ruta en simulación. Nada de fade-and-slide en cada panel ni transiciones de hover en todo lo que se mueve. El fondo puede tener un parpadeo estelar muy leve y continuo; nada más se mueve por sí solo. Respetar `prefers-reduced-motion`: con la preferencia activa, la ruta se revela de golpe con el mismo detalle textual.

### 6.4 Escritura en la interfaz
Nombrar los nodos por lo que hacen para el cliente, no por su implementación: "Reconoce al cliente por su teléfono", no "Lookup BigQuery". El nombre técnico va en el panel de detalle, no en el mapa.

---

## 7. Stack

- **Vite + React + TypeScript**
- **SVG** para nodos y aristas (accesible, inspeccionable, exportable). **Canvas** solo para el campo de estrellas de fondo.
- **Motion** (`motion/react`) para la animación de ruta. Sin librería de grafos pesada.
- Layout: posiciones fijas en el JSON, con `d3-force` opcional solo como herramienta para *generar* esas posiciones una vez, no en runtime.
- **Zod** para validar `ecosystem.json`.
- Sin backend. Sin estado global más allá de `useReducer` para la simulación.

```
src/
  data/ecosystem.json
  schema/ecosystem.ts       // tipos + Zod
  engine/router.ts          // motor de reglas — puro, testeable, sin React
  engine/router.test.ts
  components/Mapa.tsx
  components/Nodo.tsx
  components/Arista.tsx
  components/PanelDetalle.tsx
  components/PanelSimulacion.tsx
  components/CampoEstelar.tsx
  tokens.css
```

`engine/router.ts` debe ser una función pura `(perfil, clasificacion, reglas) => Resultado`. Es el mismo motor que después se porta a producción; que sea testeable en aislamiento no es opcional.

---

## 8. Criterios de aceptación

1. Cambiar `ecosystem.json` cambia el diagrama sin tocar componentes.
2. Un JSON inválido produce un error visible con la ruta del campo, no una pantalla en blanco ni un nodo faltante silencioso.
3. La regla de negocio de §1.3 se puede reproducir en el simulador en menos de cinco interacciones.
4. Las nueve reglas de §3 tienen test unitario sobre `router.ts`, incluidos los cuatro casos de fallo ruidoso.
5. Alguien de SAC que nunca vio el proyecto entiende, solo mirando la pantalla, qué decide un LLM y qué decide una tabla.
6. Responsive hasta 768 px. Foco de teclado visible. `prefers-reduced-motion` respetado.

---

## 9. Decisiones abiertas

Resolver antes de dar por cerrado el modelo. Mientras tanto, el código usa los valores marcados como supuesto y los deja en un solo lugar (`config.ts`), no dispersos.

- **D1 — Umbral de onboarding.** ¿Cuántos días dura la ventana y desde qué fecha se cuenta: `fecha_compra` o `fecha_activacion`? *Supuesto actual: 30 días desde `fecha_compra`.*
- **D2 — Dónde vive la BD de parámetros.** ¿BigQuery (consistente con el resto del stack) o Google Sheets (más editable por negocio)? Impacta latencia del lookup en el camino crítico de la conversación. *Supuesto: BigQuery para `clientes`, Sheets para `tipificados`.*
- **D3 — Multi-campaña.** ¿Un teléfono puede estar en dos campañas activas a la vez? Si sí, la precedencia debe ser dato (`prioridad` en `campanas`), no código. *Supuesto: no permitido; el caso cae a `REVISION_HUMANA`.*
- **D4 — Partner.** ¿`es_partner = true` enruta al proyecto SAP (Servicio de Atención Partners) como cola distinta, o solo cambia la persona y la base de conocimiento del agente SAC? Cambia si es un nodo aparte en el diagrama.
- **D5 — Prospecto desconocido con intención de compra.** Teléfono fuera de BD + intención VENTAS: ¿va al mismo `AG_VENTAS` o a un flujo de captación distinto?
- **D6 — Onboarding vs. SAC en solapamiento.** Un cliente de 10 días con una falla técnica real: ¿lo atiende Onboarding (por ventana) o SAC (por dominio del tipificado)? La tabla actual prioriza el dominio del tipificado; confirmar que es lo que quiere el negocio.
