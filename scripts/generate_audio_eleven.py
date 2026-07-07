#!/usr/bin/env python3
"""Erzeugt ALLE App-MP3s (audio/wNNN.mp3) mit einer ElevenLabs-Stimme.

Pendant zu generate_audio.py (edge-tts), aber fuer ElevenLabs-Premium-Stimmen.
Wortliste kommt wie immer per Regex aus js/data.js (eine Quelle der Wahrheit).

Voraussetzung:
  - Bezahlter ElevenLabs-Plan (Free-Tier darf keine Library-Stimmen per API).
  - Umgebungsvariable ELEVEN_API_KEY gesetzt (Key steht in keiner Datei).

Aufruf:
    ELEVEN_API_KEY=... python scripts/generate_audio_eleven.py --voice Na15FlRRkMEDtEW4nVVP
    ... --force            # vorhandene ueberschreiben
    ... --only w031,w038   # gezielt einzelne
    ... --voice <id> --model eleven_multilingual_v2

Standard-Stimme = Thanh Ngọc (Süd ♀), vom Nutzer im Audition-Vergleich gewaehlt.
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

DEFAULT_VOICE = "Na15FlRRkMEDtEW4nVVP"   # Thanh Ngọc – Süd ♀ (Audition-Sieger)
DEFAULT_MODEL = "eleven_v3"              # bestes Modell bei VN-Tönen (Nutzer-Test)
DEFAULT_LANG = "vi"                      # Sprache ERZWINGEN (sonst falsche Lautung)

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = ROOT / "js" / "data.js"
AUDIO_DIR = ROOT / "audio"
TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/{vid}"

# id kann "wNNN" (Wörter) oder "sNNN" (Sätze) sein -> selbe Pipeline für beide.
ENTRY_RE = re.compile(r'id:\s*"(?P<id>[ws]\d{3})"\s*,\s*vn:\s*"(?P<vn>[^"]+)"')


def load_words(source):
    text = Path(source).read_text(encoding="utf-8")
    words = [(m.group("id"), m.group("vn")) for m in ENTRY_RE.finditer(text)]
    if not words:
        sys.exit(f"Keine Einträge in {source} gefunden -- Regex/Datei prüfen.")
    return words


def synth(vid, text, key, model, lang):
    payload = {
        "text": text,
        "model_id": model,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.8},
    }
    if lang:
        payload["language_code"] = lang
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        TTS_URL.format(vid=vid), data=body,
        headers={"xi-api-key": key, "Content-Type": "application/json",
                 "Accept": "audio/mpeg"}, method="POST")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--voice", default=DEFAULT_VOICE)
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--lang", default=DEFAULT_LANG)
    p.add_argument("--source", default=str(DEFAULT_SOURCE),
                   help="Quelldatei (js/data.js = Wörter, js/sentences.js = Sätze)")
    p.add_argument("--force", action="store_true")
    p.add_argument("--only", default="")
    args = p.parse_args()

    key = os.environ.get("ELEVEN_API_KEY", "").strip()
    if not key:
        sys.exit("ELEVEN_API_KEY nicht gesetzt.")

    only = set(x.strip() for x in args.only.split(",") if x.strip()) or None
    words = load_words(args.source)
    if only:
        words = [w for w in words if w[0] in only]

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    todo = [(wid, vn) for wid, vn in words
            if args.force or not (AUDIO_DIR / f"{wid}.mp3").exists()]

    print(f"Stimme: {args.voice} · Modell: {args.model} · Sprache: {args.lang or '(auto)'}")
    print(f"Wörter: {len(words)} · zu generieren: {len(todo)}")
    if not todo:
        print("Nichts zu tun (--force erzwingt Neuerstellung).")
        return

    done, failed = 0, []
    for wid, vn in todo:
        try:
            data = synth(args.voice, vn, key, args.model, args.lang)
            if len(data) < 500:
                raise RuntimeError(f"zu wenig Daten: {data[:160]!r}")
            (AUDIO_DIR / f"{wid}.mp3").write_bytes(data)
            done += 1
            print(f"  [{done}/{len(todo)}] {wid}  {vn}")
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "replace")[:200]
            failed.append((wid, vn, f"HTTP {e.code}: {detail}"))
            print(f"  [FEHLER] {wid} {vn} -> HTTP {e.code}: {detail}")
        except Exception as e:
            failed.append((wid, vn, str(e)))
            print(f"  [FEHLER] {wid} {vn} -> {e}")
        time.sleep(0.4)  # sanfte Drosselung

    print(f"\nFertig: {done} erzeugt, {len(failed)} fehlgeschlagen.")
    if failed:
        print("Fehlgeschlagen:", ", ".join(f[0] for f in failed))
        sys.exit(1)


if __name__ == "__main__":
    main()
