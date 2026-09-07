# Skills y librerías instalables para el diseño del diagrama

Reemplaza el "Grupo B" del archivo `MCP-Y-SKILLS.md`. Aquí van repositorios concretos que Cursor o Claude Code pueden descargar e instalar, orientados a una sola cosa: que el resultado se vea como el video de referencia.

Dos advertencias antes de empezar:

- **Estos repos son código de terceros que se ejecuta en tu máquina.** Los de Anthropic y Microsoft son seguros; los de la comunidad conviene abrirlos y leer el `SKILL.md` antes de instalar. El ecosistema creció muy rápido y hay mucho repo de una semana de vida.
- **Los comandos de instalación cambian.** Los de abajo salen de los README actuales. Si uno falla, la instalación manual siempre funciona: clonar el repo dentro de `~/.claude/skills/<nombre>/` (Claude Code) o `.cursor/skills/` (Cursor).

---

## 1. El punto de partida

<cite index="46-1">Existe un repositorio que cataloga específicamente lo que mejora la salida visual de Claude Code — skills, plugins, servidores MCP y trucos de CLAUDE.md, organizados por objetivo, con más de 70 herramientas en 10 secciones</cite>: **`wilwaldon/Claude-Code-Frontend-Design-Toolkit`**. Vale la pena leerlo completo; lo que sigue es la selección que aplica a este proyecto.

Un detalle de ese README que conviene corregir: atribuye el MCP de Chrome DevTools a Anthropic. El oficial es de Google, en `ChromeDevTools/chrome-devtools-mcp`. Usa ese.

---

## 2. Núcleo de diseño — instalar sí o sí

| Skill | Repo | Qué aporta a este diagrama |
|---|---|---|
| **frontend-design** (oficial) | `anthropics/claude-code` → `plugins/frontend-design` | <cite index="43-1">Guía para diseño visual distintivo, con dirección estética y tipografía que no lee como plantilla</cite>. Es la misma que usé para escribir la sección 6 del contexto. Instalar primero: el resto asume que está. |
| **UI/UX Pro Max** | `nextlevelbuilder/ui-ux-pro-max-skill` | <cite index="46-1">240+ estilos, 127 pares tipográficos y 99 pautas de UX; le dices el tipo de producto y elige un sistema de diseño coherente</cite>. Útil para no partir de cero en la dirección estética. También funciona en Cursor. |
| **Frontend Design Pro Demo** | `claudekit/frontend-design-pro-demo` | <cite index="46-1">11 estéticas con demos HTML/CSS funcionando y los prompts que las generaron</cite>. La relevante acá es *Dark OLED Luxury* — negro real con acentos claros — que es esencialmente el look del video. Poder decir "usa esa estética" y que el agente sepa a qué te refieres vale mucho. |
| **Taste Skill** | `Leonxlnx/taste-skill` | <cite index="46-1">Perillas ajustables de varianza de diseño, intensidad de movimiento y densidad visual</cite>. Para este proyecto: varianza alta, movimiento medio, densidad baja. |

---

## 3. Animación — la mitad del efecto del video

Lo que hace que el video se vea vivo no es el grafo, es el movimiento: la cámara que viaja, los nodos que aparecen escalonados, las líneas que se dibujan. Sin skills de animación el agente entrega un SVG estático correcto y aburrido.

| Skill | Repo | Nota |
|---|---|---|
| **Animation Design Skills** | `freshtechbro/claudedesignskills` | <cite index="46-1">23 skills que cubren GSAP + ScrollTrigger, Framer Motion, React Spring, Lottie, anime.js, y también 3D con Three.js, React Three Fiber, Babylon.js y PixiJS</cite>. Es el hueco que ninguna otra lista cubre: crear animaciones, no solo pulirlas. **La más importante de esta sección.** |
| **Design Motion Principles** | `kylezantos/design-motion-principles` | <cite index="46-1">Audita el código buscando UI condicional que debería estar animada y no lo está, con recomendaciones por severidad</cite>. Se corre después, sobre lo ya construido. |
| **Three.js Skills** | `CloudAI-X/threejs-skills` | Solo si el campo de estrellas y la profundidad los quieres en WebGL en vez de canvas 2D. Sube bastante la complejidad; yo lo dejaría para una segunda pasada. |

---

## 4. Grafos y visualización de datos

Acá está la diferencia entre "un diagrama bonito" y "un diagrama que representa bien un ecosistema". Un agente sin esta guía inventa un layout a mano y termina con nodos encimados.

| Skill | Repo | Nota |
|---|---|---|
| **data-visualization** | `NTCoding/claude-skillz` → `data-visualization/` | La más valiosa para tu caso concreto. Obliga al agente a <cite index="40-1">revisar dagre, d3-force y ELK.js antes de implementar cualquier layout propio</cite>, y fija el criterio de render: <cite index="40-1">SVG bajo 1.000 elementos, Canvas entre 1.000 y 10.000, WebGL sobre 10.000</cite>. Tu ecosistema tiene ~25 nodos: SVG, con todo lo que eso habilita (eventos del DOM, accesibilidad, nitidez a cualquier zoom). |
| **D3.js Visualization** | vía `ComposioHQ/awesome-claude-skills` | <cite index="39-1">Enseña a producir gráficos D3 y visualizaciones interactivas</cite>, de @chrisvoncsefalvay. |
| **claud3** | `dtran320/claud3` | <cite index="45-1">Plugin de D3 con principios de Tufte: genera HTML de un solo archivo con D3 v7 inline, tema oscuro y SVG responsivo, y audita cada salida contra 25 reglas de diseño</cite>. El tema oscuro por defecto calza con la referencia. |
| **Data Visualisation Plugin** | `danielrosehill/Claude-Data-Visualisation-And-Publishing-Plugin` | <cite index="41-1">Opinionado en la elección de herramienta: en vez de usar la librería que el modelo recuerde, elige desde un inventario mantenido según propósito, forma del dato, runtime y audiencia</cite>. Incluye una skill de *data-storytelling* que aplica bien al modo simulación. |

---

## 5. Ojos — sin esto nada de lo anterior sirve

Un agente que no ve lo que renderiza está diseñando a ciegas. Es el mayor salto de calidad de toda la lista.

```bash
claude mcp add playwright -s user -- npx @playwright/mcp@latest
claude mcp add chrome-devtools -s user -- npx chrome-devtools-mcp@latest
```

<cite index="46-1">Playwright MCP trae más de 25 herramientas y trabaja sobre snapshots del árbol de accesibilidad (2-5 KB) en vez de capturas (500 KB+)</cite>. Para este proyecto importa una bandera puntual: <cite index="46-1">`--vision auto` usa el árbol de accesibilidad casi siempre y cambia a visión automáticamente en canvas y WebGL</cite>. Un grafo SVG animado es justo el caso donde el árbol de accesibilidad no dice nada útil y hace falta mirar el píxel.

Chrome DevTools MCP entra cuando haya que perfilar: una animación de 25 nodos con partículas de fondo puede caer bajo 60 fps sin que nadie lo note hasta la demo.

---

## 6. Librerías de render

No son skills, pero definen qué es posible. Conviene fijarlas en el `CLAUDE.md` para que el agente no elija otra a mitad de camino.

| Librería | Para qué | Recomendación |
|---|---|---|
| **`vasturiano/react-force-graph`** | <cite index="31-1">Componentes React para grafos dirigidos por fuerzas en 2D, 3D, VR y AR, con canvas/WebGL para render y d3-force-3d como motor físico; soporta zoom, paneo, arrastre de nodos e interacción por hover y click</cite>. | La ruta más rápida al look del video. Contra: física en runtime = el diagrama se ve distinto cada vez que carga. Para un ecosistema documental eso es un defecto, no una gracia. |
| **`d3-force` + SVG propio** | Correr la simulación **una sola vez**, congelar las coordenadas en el JSON y renderizar SVG estático animable. | **Mi recomendación.** Layout orgánico de constelación, pero determinista y con control total del estilo. Es lo que asumen los archivos que ya te entregué. |
| **`d3-zoom`** | Cámara: zoom semántico y transiciones al entrar a un área. | Es la pieza que da el efecto macro → área → agentes que describes. |
| **ELK.js / dagre** | Layout jerárquico por capas. | Alternativa si el resultado orgánico queda ilegible. Menos espectacular, más claro. |
| **`bkrem/react-d3-tree`** | <cite index="47-1">Componente React para árboles D3 interactivos con clases distintas por tipo de nodo — raíz, rama, hoja</cite>. | Solo si terminas prefiriendo un árbol estricto al mapa estelar. |
| **Sigma.js + Graphology** | Grafos grandes sobre WebGL. | Sobredimensionado para 25 nodos. Anótalo por si el ecosistema crece a cientos. |

**El truco que más te va a servir:** `yusufkaraaslan/Skill_Seekers` — <cite index="46-1">lo apuntas a cualquier sitio de documentación y genera una skill de Claude desde ese contenido</cite>. Apúntalo a la documentación de la librería que elijas y tendrás una skill específica, en vez de que el agente invente API de memoria. Como respaldo, Context7 (`claude mcp add context7 -s user -- npx -y @upstash/context7-mcp@latest`) trae documentación viva de más de mil librerías.

---

## 7. Presupuesto de contexto

Esto importa y casi nadie lo considera: <cite index="46-1">los servidores MCP consumen tokens al inicio de cada sesión — Playwright ~5,3k, Chrome DevTools 5-6k, Figma 3-4k — y cinco servidores suman unos 55k antes de que escribas nada. Conviene mantener 3 a 5 activos como máximo, desactivar con `/mcp disable` lo que no se use, y preferir skills sobre MCP donde se pueda: las skills cargan unos 100 tokens al inicio</cite>.

Traducido a este proyecto: instala muchas skills sin culpa, pero mantén solo Playwright y Context7 encendidos mientras construyes.

---

## 8. Instalación recomendada

```bash
# Diseño
claude plugin add anthropic/frontend-design
claude plugin add nextlevelbuilder/ui-ux-pro-max-skill
claude plugin add claudekit/frontend-design-pro-demo

# Animación
claude plugin marketplace add freshtechbro/claudedesignskills
# luego instalar desde ahí: gsap, framer-motion

# Visualización (instalación manual, son repos sueltos)
git clone https://github.com/NTCoding/claude-skillz /tmp/skillz
cp -r /tmp/skillz/data-visualization ~/.claude/skills/

# Ojos y documentación
claude mcp add playwright -s user -- npx @playwright/mcp@latest
claude mcp add context7 -s user -- npx -y @upstash/context7-mcp@latest
```

En Cursor el destino es `.cursor/skills/` y varios de estos repos ya traen manifiestos para ambos.

---

## 9. Cómo pedírselo al agente

Con las skills instaladas, el prompt inicial:

> Lee `CONTEXTO-ECOSISTEMA-AGENTES.md` y `ecosystem.seed.json`. Construye la aplicación de la sección 5 siguiendo la dirección visual de la sección 6. Usa d3-force una sola vez para generar las posiciones y congélalas en el JSON; el render es SVG estático con d3-zoom para la cámara. Antes de escribir código, entrégame el plan de diseño de la skill frontend-design y espera aprobación. Después de cada iteración visual, toma captura con Playwright y critica tu propio resultado contra la sección 6.

Ese último punto es el que separa un resultado bueno de uno mediocre: el agente tiene que verse a sí mismo y corregirse, no entregar a ciegas.
