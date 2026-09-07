# CLAUDE.md

Reglas del proyecto. Este archivo se carga en **cada turno**, así que es corto a propósito.
Los documentos largos se leen bajo demanda, no se copian acá.

## Qué es esto

Visualizador navegable del ecosistema de agentes IA de atención y venta por WhatsApp.
No es una implementación del ecosistema: es su representación.

Documentos de referencia, leerlos cuando corresponda y no antes.
**Precedencia:** el contexto manda sobre qué es el ecosistema (arquitectura, datos, ruteo, estética); `INTERACCION.md` manda sobre cómo se navega (niveles, cámara, simulación). Si dos documentos se contradicen dentro del dominio del otro, gana el dueño del dominio — y avisa del choque en vez de elegir en silencio.

- `docs/CONTEXTO-ECOSISTEMA-AGENTES.md` — arquitectura, modelo de datos, reglas de ruteo, dirección visual. Leer completo antes de la primera línea de código.
- `docs/INTERACCION.md` — los tres niveles de navegación y el modelo de cámara. Leer antes de tocar el layout o el zoom.
- `docs/SKILLS-Y-LIBRERIAS-DISENO.md` — herramientas y librerías. Solo si hay que instalar algo.
- `referencias/` — capturas del diseño objetivo. **Mirarlas siempre antes de proponer estética.**

## Stack fijo

No cambiar sin pedirlo explícitamente:

- Vite + React + TypeScript
- SVG para nodos y aristas · Canvas solo para el fondo estelar
- `d3-force` se corre **una sola vez** en un script offline para generar posiciones; se congelan en el JSON. En runtime no hay física.
- `d3-zoom` para la cámara · `motion` para las transiciones
- Zod para validar el JSON de datos
- Sin backend, sin autenticación, sin estado global más allá de `useReducer`

## Reglas duras

- **Todo dato viene de `src/data/ecosystem.json`.** Cero nodos, aristas o etiquetas escritas en componentes. Si algo no se puede expresar en el JSON, se extiende el esquema, no se hardcodea.
- **`src/engine/router.ts` es una función pura** sin React ni imports de UI. Es el mismo motor que después se porta a producción.
- **Los fallos se ven.** JSON inválido → pantalla de error con la ruta del campo. Nodo huérfano → se dibuja marcado, no se omite. Nunca un `?? default` que esconda un dato faltante.
- **Nada de `localStorage` ni `sessionStorage`.**
- Español de Chile en toda la interfaz, neutro y sin modismos. Los identificadores del código en inglés.

## Estética

La dirección está en la sección 6 del contexto y en `referencias/`. Resumen operativo:

```
<tema_mapa_estelar>
Fondo casi negro azulado. Nodos claros sobre vacío. Líneas finas y tenues.
El color codifica tipo de nodo, nunca decora:
  relleno sólido claro = agente IA
  contorno azul acero  = paso determinista
  ámbar                = parámetros y ruta activa
  rojo apagado         = fallback y revisión humana
Versalitas espaciadas solo en etiquetas de área. El resto en sentence case.
Un único momento animado: el recorrido de la ruta.
</tema_mapa_estelar>
```

Prohibido: crema cálido sobre terracota, gradientes morados, tarjetas redondeadas idénticas, sombras suaves genéricas, una flecha "→" pegada al texto de cada botón.

## Cómo trabajar

1. **Plan antes de código.** Para cualquier cambio de estructura, layout o estética: propone el plan y espera aprobación. Para correcciones puntuales, ejecuta directo.
2. **Mírate.** Después de cada iteración visual, captura con Playwright, compárala contra `referencias/` y critica tu propio resultado antes de decir que terminaste. Una captura vale más que una explicación.
3. **Una cosa a la vez.** No mezcles refactor con feature nueva.
4. **Si el brief no alcanza, pregunta.** No inventes una regla de negocio ni un parámetro que no esté en el contexto. Las decisiones abiertas están listadas en la sección 9; si el trabajo choca con una, para y consulta.
