"""Genera data/routes.js: tramos a pie (OSRM peatonal sobre OpenStreetMap) y
líneas de funicular/teleférico (geometría de OpenStreetMap vía Overpass).
Uso: python tools/build_routes.py <overpass.json> <salida.js>"""
import json, sys, time, urllib.request

OSRM = "https://routing.openstreetmap.de/routed-foot/route/v1/foot/"
UA = {"User-Agent": "tour-santiago-builder/1.0"}

P = {  # lon, lat (OpenStreetMap)
    "neptuno": (-70.64394, -33.44175),
    "cumbreSL": (-70.64343, -33.44030),
    "plaza": (-70.65060, -33.43780),
    "catedral": (-70.65125, -33.43768),
    "mercado": (-70.65104, -33.43378),
    "bellasartes": (-70.64358, -33.43534),
    "callePioNono": (-70.63596, -33.43244),
    "puentePN": (-70.63541, -33.43603),
    "forestal": (-70.63893, -33.43591),
    "funiPioNono": (-70.63587, -33.43006),
    "zoologico": (-70.63423, -33.43047),
    "funiCumbre": (-70.63351, -33.42654),
    "plazaMexico": (-70.63108, -33.42270),
    "virgen": (-70.63316, -33.42529),
    "teleCumbre": (-70.63239, -33.42491),
    "oasis": (-70.61553, -33.41455),
    "metroPV": (-70.61360, -33.42550),
}

def walk(*names):
    coords = ";".join(f"{P[n][0]},{P[n][1]}" for n in names)
    url = OSRM + coords + "?overview=full&geometries=geojson&steps=false"
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                d = json.load(r)
            rt = d["routes"][0]
            time.sleep(1)
            return {"coords": [[round(x, 6), round(y, 6)] for x, y in rt["geometry"]["coordinates"]],
                    "m": round(rt["distance"]), "min": round(rt["duration"] / 60)}
        except Exception as e:
            print("retry", names, e); time.sleep(3 * (i + 1))
    raise SystemExit("OSRM falló: %s" % (names,))

ov = json.load(open(sys.argv[1], encoding="utf-8"))
ways = {e["id"]: [[p["lon"], p["lat"]] for p in e["geometry"]] for e in ov["elements"]}
def chain(*ids):
    out = []
    for i in ids:
        seg = ways[abs(i)][::-1] if i < 0 else ways[i]
        out += seg if not out else seg[1:]
    return [[round(x, 6), round(y, 6)] for x, y in out]

segs = {
    # Orden del tour: San Cristóbal → Mercado Central → Plaza de Armas → Catedral → Santa Lucía
    "wTopF": walk("funiCumbre", "virgen"),
    "wTopT": walk("plazaMexico", "virgen"),
    "w4t": walk("funiPioNono", "zoologico"),
    "w5": walk("funiPioNono", "callePioNono", "puentePN", "forestal", "bellasartes"),
    "w4": walk("bellasartes", "mercado"),
    "wMP": walk("mercado", "plaza"),
    "w2": walk("plaza", "catedral"),
    "wCN": walk("catedral", "neptuno"),
    "wNC": walk("neptuno", "cumbreSL"),
}
segs["funicular"] = {"coords": chain(926855961, 926855962, 45305949, -1320118112, 786231391, 279028248)}
segs["telePioNono"] = {"coords": chain(-1352261427)}

with open(sys.argv[2], "w", encoding="utf-8") as f:
    f.write("// Generado por tools/build_routes.py — datos © OpenStreetMap (ODbL), ruteo OSRM peatonal.\n")
    f.write("window.ROUTES = " + json.dumps(segs, ensure_ascii=False, separators=(",", ":")) + ";\n")
for k, v in segs.items():
    print(k, len(v["coords"]), "pts", v.get("m"), "m", v.get("min"), "min")
