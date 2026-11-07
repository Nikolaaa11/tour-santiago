# Megaprompt — Tour a pie por Santiago de Chile con mapa interactivo

> Escrito el 7-11-2026. Se ejecuta tal cual en Claude Code (Windows, Git Bash/PowerShell,
> con `gh` y la CLI de Vercel ya logueados).

## Rol

Eres un desarrollador front-end y guía turístico de Santiago. Construyes, pruebas y publicas
una página web de una sola vista, en español de Chile, que muestre un tour de un día por el
centro de Santiago sobre un mapa interactivo.

## Objetivo

Una persona que abre la página en el celular, en la calle, debe poder:

1. Ver la ruta completa dibujada sobre el mapa, con cada parada numerada.
2. Avanzar parada por parada (botones "Anterior / Siguiente", teclado ← →, o tocando un
   marcador) y que el mapa vuele a esa parada.
3. Leer por parada: qué es, por qué ir, horario, precio, cuánto tiempo quedarse, dato curioso
   y un enlace "Cómo llegar" a Google Maps a pie.
4. Elegir cómo subir al Cerro San Cristóbal: **funicular** (desde Bellavista) o
   **teleférico** (desde Providencia), y que la ruta del mapa cambie según la opción.
5. Ver su propia ubicación en el mapa (botón "Dónde estoy", solo si da permiso).

## Paradas obligatorias (verificar cada dato en fuentes oficiales antes de escribirlo)

| # | Parada | Qué verificar |
|---|--------|---------------|
| 1 | Cerro San Cristóbal — subida en funicular **o** teleférico (los dos salen de Pío Nono, Bellavista) | horarios, días cerrados, precios 2026, estaciones |
| 2 | Cumbre y Santuario de la Inmaculada Concepción | qué ver, mirador |
| 3 | Bajada y Parque Forestal / Bellas Artes | camino a pie al centro |
| 4 | Mercado Central | horario de locales y restaurantes, qué comer |
| 5 | Plaza de Armas | Metro, qué hay alrededor |
| 6 | Catedral Metropolitana de Santiago (una catedral **abierta** a visitas) | horario de visita, misas, entrada; si estuviera cerrada, elegir otra iglesia abierta y decirlo |
| 7 | Cerro Santa Lucía (entrada Terraza Neptuno, Alameda) | horario, días cerrado, registro de ingreso |

Orden pedido por el usuario (actualizado a mitad de la ejecución): **empezar en el San
Cristóbal y seguir al Mercado Central**. San Cristóbal → Mercado Central → Plaza de Armas →
Catedral → Santa Lucía. Si un horario real choca con ese orden (p. ej. la Catedral cierra
temprano el fin de semana), avisarlo en la página sin cambiar el orden.

Reglas de datos:
- Ningún horario ni precio sin fuente. Cada parada lleva su fuente y la fecha de revisión.
- Precios en pesos chilenos con punto de miles ($3.000).
- Si un dato no se pudo confirmar, mostrarlo como "confirmar antes de ir", nunca inventarlo.
- Coordenadas desde OpenStreetMap (Nominatim/Overpass), no de memoria.
- La ruta a pie se calcula por calles reales con un ruteador peatonal OSRM y se guarda como
  GeoJSON dentro del proyecto (la página no depende de una API de ruteo en vivo).

## Diseño

- Dirección: guía de viaje editorial, cálida y chilena — no plantilla de IA. Tipografía con
  carácter (una serif de titulares + una sans legible), paleta tomada de Santiago: ladrillo
  de la Catedral, verde del cerro, azul cordillera, crema de los muros coloniales.
- Escritorio: mapa grande a la derecha, panel de paradas a la izquierda.
  Celular: mapa arriba (~55 % de alto), tarjeta de la parada abajo, deslizable; sin scroll
  horizontal; botones de 44 px mínimo.
- Modo claro y oscuro (mapa y página), respetando `prefers-color-scheme`.
- Movimiento corto y con propósito: vuelo de cámara entre paradas, línea de la ruta que se
  dibuja; respetar `prefers-reduced-motion`.
- Accesible: contraste AA, foco visible, marcadores con nombre, todo usable con teclado.

## Técnica

- Sitio estático sin build: `index.html`, `styles.css`, `app.js`, `data/stops.js`,
  `data/route-*.geojson` (o embebido en JS para que funcione abriendo el archivo).
- Mapa: MapLibre GL JS (versión fija) con teselas vectoriales gratuitas sin clave
  (OpenFreeMap), atribución visible a OpenStreetMap. Si WebGL falla, mensaje claro.
- Metadatos: título, descripción, Open Graph, favicon SVG, `lang="es-CL"`.
- Sin datos personales del usuario en el sitio ni en el repo.

## Entregables y publicación

1. Carpeta `tour-santiago` con el sitio, `README.md` y este megaprompt.
2. Probar en el navegador integrado: escritorio y celular (375 px), modo oscuro, consola sin
   errores, cambio funicular/teleférico, navegación por teclado.
3. Git: commits con el correo *noreply* de GitHub del dueño del repo (si no, Vercel bloquea
   el deploy). Repo público `tour-santiago` creado con `gh`.
4. Vercel: proyecto en la cuenta personal, conectado al repo para que
   cada push a `main` despliegue; verificar con `curl` que la URL de producción responde 200
   y sirve la página nueva.

## Criterios de aceptación

- [ ] Las 7 paradas aparecen en el mapa y en la lista, con datos y fuente.
- [ ] El selector funicular/teleférico cambia la ruta dibujada y el texto.
- [ ] Funciona en 375 px y en escritorio, en claro y oscuro, sin errores de consola.
- [ ] Repo en GitHub y sitio en Vercel respondiendo en producción.
