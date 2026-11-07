# Santiago a pie: de la Virgen al Santa Lucía

Página de una sola vista con un tour a pie de un día por Santiago de Chile sobre un mapa
interactivo. Orden del recorrido:

1. **Cerro San Cristóbal**: subida en funicular (desde 1925) o en el Teleférico Pío Nono (2026); se elige en la página.
2. **Cumbre y Santuario** de la Inmaculada Concepción.
3. **Bajada y Parque Forestal**, por Pío Nono hasta el Museo Nacional de Bellas Artes.
4. **Mercado Central** (almuerzo).
5. **Plaza de Armas**.
6. **Catedral Metropolitana** (abierta a visitas todos los días).
7. **Cerro Santa Lucía**.

Horarios y precios revisados el 7-11-2026; cada parada cita sus fuentes en la página.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html`, `styles.css`, `app.js` | El sitio (estático, sin build). |
| `data/stops.js` | Paradas, textos, horarios (para el aviso «Abierto ahora»), precios y fuentes. |
| `data/routes.js` | Tramos a pie y líneas del funicular y teleférico (generado). |
| `tools/build_routes.py` | Regenera `data/routes.js`: ruteo peatonal OSRM sobre OpenStreetMap + geometría de las líneas desde `tools/overpass-lineas.json`. |
| `MEGAPROMPT.md` | El encargo completo con el que se construyó la página. |

## Correr localmente

```bash
python -m http.server 5173 --directory .
```

## Regenerar las rutas

```bash
python -I tools/build_routes.py tools/overpass-lineas.json data/routes.js
```

## Créditos

Mapa © colaboradores de OpenStreetMap (ODbL), teselas de OpenFreeMap, mapa con MapLibre GL JS,
ruta a pie calculada con OSRM (routing.openstreetmap.de).
