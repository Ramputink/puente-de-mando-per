#!/usr/bin/env python3
"""Genera dist/: la versión web instalable (PWA) de la app. Uso: python3 tools/build_web.py

index.html se queda como fragmento porque así lo publica el artefacto de claude.ai;
aquí se envuelve en un documento completo y se añaden manifest y service worker.
"""
import hashlib, json, re, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
COPY = ["css", "js", "data", "img"]
# Se cachean al abrirlas por primera vez, no al instalar: pesan demasiado.
NO_PRECACHE = (".pdf", "img/carta.webp", "img/carta-md.webp")

HEAD = """<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0f1e29">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="PER">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-180.png">
</head><body>
"""
TAIL = """
<script>if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js"));</script>
</body></html>
"""

def main():
    shutil.rmtree(DIST, ignore_errors=True)
    DIST.mkdir()
    for d in COPY:
        shutil.copytree(ROOT / d, DIST / d, ignore=shutil.ignore_patterns(".DS_Store"))
    shutil.copytree(ROOT / "web" / "icons", DIST / "icons", ignore=shutil.ignore_patterns(".DS_Store"))
    shutil.copy(ROOT / "web" / "manifest.webmanifest", DIST)
    (DIST / ".nojekyll").touch()
    (DIST / "index.html").write_text(HEAD + (ROOT / "index.html").read_text("utf-8") + TAIL, "utf-8")

    files = sorted(p.relative_to(DIST).as_posix() for p in DIST.rglob("*") if p.is_file() and p.name != ".nojekyll")
    digest = hashlib.sha256()
    for f in files:
        digest.update(f.encode()); digest.update((DIST / f).read_bytes())
    pre = ["./"] + [f for f in files if not f.endswith(NO_PRECACHE)]
    sw = (ROOT / "web" / "sw.js").read_text("utf-8")
    sw = sw.replace("__VERSION__", digest.hexdigest()[:12]).replace('"__PRECACHE__"', json.dumps(pre))
    (DIST / "sw.js").write_text(sw, "utf-8")
    size = sum((DIST / f).stat().st_size for f in files) / 1e6
    print(f"dist/: {len(files)} ficheros, {size:.1f} MB, {len(pre)} precacheados")

main()
