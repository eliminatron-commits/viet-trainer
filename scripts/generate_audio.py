#!/usr/bin/env python3
"""Generiert die Aussprache-MP3s fuer Viet-Trainer aus js/data.js via edge-tts.

Quelle der Wahrheit ist js/data.js (nicht dieses Script): die Wortliste wird
per Regex aus den {id, vn}-Eintraegen extrahiert, damit Wortschatz und Audio
nie auseinanderlaufen koennen.

Voraussetzung: `pip install edge-tts`

Aufruf:
    python scripts/generate_audio.py                  # fehlende MP3s erzeugen
    python scripts/generate_audio.py --force           # alle neu erzeugen
    python scripts/generate_audio.py --voice vi-VN-NamMinhNeural
    python scripts/generate_audio.py --only w001,w042  # gezielt einzelne IDs

Namenskonvention: audio/<id>.mp3 (z.B. audio/w001.mp3), passend zu
VT.Audio.play() in js/audio.js.
"""
import argparse
import asyncio
import re
import sys
from pathlib import Path

DEFAULT_VOICE = "vi-VN-NamMinhNeural"  # vietnamesische Neural-Stimme (männlich)

ROOT = Path(__file__).resolve().parent.parent
DATA_JS = ROOT / "js" / "data.js"
AUDIO_DIR = ROOT / "audio"

ENTRY_RE = re.compile(
    r'id:\s*"(?P<id>w\d{3})"\s*,\s*vn:\s*"(?P<vn>[^"]+)"'
)


def load_words():
    """Extrahiert (id, vn) Paare aus js/data.js in Vorkommensreihenfolge."""
    text = DATA_JS.read_text(encoding="utf-8")
    words = [(m.group("id"), m.group("vn")) for m in ENTRY_RE.finditer(text)]
    if not words:
        sys.exit(f"Keine Wörter in {DATA_JS} gefunden -- Regex/Datei prüfen.")
    return words


async def generate_one(edge_tts, word_id, text, voice, out_path, semaphore):
    async with semaphore:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(str(out_path))


async def run(words, voice, force, only_ids):
    try:
        import edge_tts
    except ImportError:
        sys.exit("edge-tts fehlt. Installieren mit: pip install edge-tts")

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    if only_ids:
        words = [w for w in words if w[0] in only_ids]

    todo = []
    for word_id, vn in words:
        out_path = AUDIO_DIR / f"{word_id}.mp3"
        if out_path.exists() and not force:
            continue
        todo.append((word_id, vn, out_path))

    print(f"Stimme: {voice}")
    print(f"Wörter gesamt: {len(words)} · zu generieren: {len(todo)} "
          f"({'--force, alle neu' if force else 'nur fehlende'})")

    if not todo:
        print("Nichts zu tun -- alle MP3s vorhanden. (--force erzwingt Neuerstellung)")
        return

    # Parallelität begrenzen, um die Edge-TTS-Endpunkte nicht zu überlasten.
    semaphore = asyncio.Semaphore(5)
    failed = []
    done = 0

    async def worker(word_id, vn, out_path):
        nonlocal done
        try:
            await generate_one(edge_tts, word_id, vn, voice, out_path, semaphore)
            done += 1
            print(f"  [{done}/{len(todo)}] {word_id}  {vn}  -> {out_path.name}")
        except Exception as e:
            failed.append((word_id, vn, str(e)))
            print(f"  [FEHLER] {word_id}  {vn}  -> {e}")

    await asyncio.gather(*(worker(*t) for t in todo))

    print(f"\nFertig: {done} erzeugt, {len(failed)} fehlgeschlagen.")
    if failed:
        print("Fehlgeschlagene IDs:", ", ".join(f[0] for f in failed))
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--voice", default=DEFAULT_VOICE, help=f"edge-tts Stimme (Standard: {DEFAULT_VOICE})")
    parser.add_argument("--force", action="store_true", help="vorhandene MP3s ueberschreiben")
    parser.add_argument("--only", default="", help="Kommagetrennte Liste von IDs, z.B. w001,w002")
    args = parser.parse_args()

    only_ids = set(x.strip() for x in args.only.split(",") if x.strip()) or None
    words = load_words()
    asyncio.run(run(words, args.voice, args.force, only_ids))


if __name__ == "__main__":
    main()
