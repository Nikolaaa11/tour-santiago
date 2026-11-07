"""Busca coordenadas de los locales en OpenStreetMap (Nominatim) y avisa si quedan lejos de su parada.
Uso: python -I tools/geocode_spots.py <entrada.json> <salida.json>
entrada: [{"id", "name", "address", "near": [lon, lat]}]  ->  salida: {id: [lon, lat] | null}"""
import json, math, sys, time, urllib.parse, urllib.request

UA = {"User-Agent": "tour-santiago-builder/1.0"}
VIEWBOX = "-70.665,-33.415,-70.600,-33.450"  # centro de Santiago y el San Cristóbal


def dist_m(a, b):
    dx = (a[0] - b[0]) * 111320 * math.cos(math.radians(a[1]))
    dy = (a[1] - b[1]) * 110540
    return math.hypot(dx, dy)


def search(q):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": q, "format": "json", "limit": 5, "countrycodes": "cl", "viewbox": VIEWBOX, "bounded": 1})
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        res = json.load(r)
    time.sleep(1.1)
    return [[float(x["lon"]), float(x["lat"]), x.get("display_name", "")] for x in res]


items = json.load(open(sys.argv[1], encoding="utf-8"))
out = {}
for it in items:
    found = None
    for q in (f'{it["name"]}, Santiago', f'{it["address"]}, Santiago, Chile'):
        try:
            res = search(q)
        except Exception as e:  # red caída o límite de uso
            print("error", it["id"], e)
            res = []
        res = [r for r in res if dist_m(r[:2], it["near"]) < 1500]
        if res:
            found = res[0]
            break
    out[it["id"]] = [round(found[0], 6), round(found[1], 6)] if found else None
    print(it["id"], "->", out[it["id"]], (found[2][:80] if found else "SIN RESULTADO"),
          f'({round(dist_m(found[:2], it["near"]))} m de la parada)' if found else "")
json.dump(out, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
