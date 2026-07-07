#!/usr/bin/env python3
"""Erzeugt Aussprache-Samples fuer den Stimmen-VERGLEICH (voice-compare.html).

Anders als generate_audio.py (das die 250 App-MP3s mit EINER Stimme baut),
generiert dieses Script eine kleine, aussprache-kritische Wortauswahl mit
MEHREREN Engines/Stimmen nebeneinander, damit man (bzw. eine Muttersprachlerin)
die beste regionale Aussprache auswaehlen kann.

Ablage: compare/<voice_key>/<id>.mp3

Engines:
  - edge  : Microsoft edge-tts (vi-VN-NamMinhNeural / -HoaiMyNeural, noerdlich)
  - gtts  : Google Translate TTS (vi), klingt eher suedlich/neutral
  - piper : Piper Neural-TTS (optional; nur wenn installiert + Modell vorhanden)

Aufruf:
    python scripts/generate_compare.py            # alle verfuegbaren Engines
    python scripts/generate_compare.py --force     # neu erzeugen
    python scripts/generate_compare.py --only namminh,google
"""
import argparse
import asyncio
import json
import os
import time
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "compare"

# Aussprache-kritische Auswahl aus js/data.js: Initiale gi/d/r/tr/v (regional
# stark unterschiedlich) + verschiedene Toene. (id, vn, de)
SAMPLE = [
    ("w031", "gì",       "was"),
    ("w029", "gia đình", "Familie"),
    ("w068", "giúp",     "helfen"),
    ("w071", "giờ",      "Uhr / Stunde"),
    ("w038", "dạ",       "ja (respektvoll)"),
    ("w111", "rất",      "sehr"),
    ("w231", "trời",     "Himmel / Wetter"),
    ("w037", "vâng",     "ja (höflich)"),
    ("w042", "về",       "zurückkehren"),
    ("w036", "không",    "nein / nicht"),
    ("w054", "nước",     "Wasser / Land"),
    ("w183", "đường",    "Straße / Weg"),
]

# Stimmen-Registry. "region"/"label" wandern spaeter auch in voice-compare.html.
VOICES = {
    "namminh":   {"engine": "edge", "voice": "vi-VN-NamMinhNeural"},
    "hoaimy":    {"engine": "edge", "voice": "vi-VN-HoaiMyNeural"},
    "google":    {"engine": "gtts"},
    "piper_vais": {"engine": "piper", "model": "vi_VN-vais1000-medium"},
    "piper_25h":  {"engine": "piper", "model": "vi_VN-25hours_single-low"},
    # FPT.AI – die einzigen mit ECHTER Regional-Aussprache (miền Trung/Nam).
    # Nur aktiv, wenn Umgebungsvariable FPT_API_KEY gesetzt ist.
    "fpt_giahuy":   {"engine": "fpt", "voice": "giahuy"},   # Nam,  miền Trung (Da Nang)
    "fpt_ngoclam":  {"engine": "fpt", "voice": "ngoclam"},  # Nữ,   miền Trung (Huế)
    "fpt_minhquang":{"engine": "fpt", "voice": "minhquang"},# Nam,  miền Nam (Sài Gòn)
    "fpt_lannhi":   {"engine": "fpt", "voice": "lannhi"},   # Nữ,   miền Nam
}


def out_path(voice_key, word_id):
    return OUT_DIR / voice_key / f"{word_id}.mp3"


# ---- edge-tts --------------------------------------------------------------
async def gen_edge(voice, todo):
    import edge_tts
    sem = asyncio.Semaphore(4)

    async def one(vn, path):
        async with sem:
            await edge_tts.Communicate(vn, voice).save(str(path))

    await asyncio.gather(*(one(vn, p) for _, vn, p in todo))


# ---- gTTS ------------------------------------------------------------------
def gen_gtts(todo):
    from gtts import gTTS
    for _, vn, path in todo:
        gTTS(text=vn, lang="vi").save(str(path))


# ---- Piper -----------------------------------------------------------------
def piper_available(model):
    """Piper ist nutzbar, wenn das Modul importierbar und das Modell da ist."""
    try:
        import piper  # noqa: F401
    except Exception:
        return False
    return (MODELS_DIR / f"{model}.onnx").exists()


MODELS_DIR = ROOT / "scripts" / "piper_models"


def gen_piper(model, todo):
    from piper import PiperVoice
    import wave
    voice = PiperVoice.load(str(MODELS_DIR / f"{model}.onnx"))
    for _, vn, path in todo:
        wav_path = path.with_suffix(".wav")
        with wave.open(str(wav_path), "wb") as wf:
            voice.synthesize_wav(vn, wf)
        # Als .mp3-Endung ablegen waere gelogen -> wir speichern .wav und
        # verweisen in HTML direkt darauf.


# ---- ElevenLabs (Premium-Neural, multilingual inkl. VN) --------------------
# Liefert die MP3 direkt in der Antwort (kein Polling). Key aus ENV.
ELEVEN_TTS = "https://api.elevenlabs.io/v1/text-to-speech/{vid}"
ELEVEN_MODEL = "eleven_multilingual_v2"


def eleven_key():
    return os.environ.get("ELEVEN_API_KEY", "").strip()


def gen_eleven(voice_id, todo, key):
    for wid, vn, path in todo:
        body = json.dumps({
            "text": vn,
            "model_id": ELEVEN_MODEL,
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.8},
        }).encode("utf-8")
        req = urllib.request.Request(
            ELEVEN_TTS.format(vid=voice_id),
            data=body,
            headers={"xi-api-key": key, "Content-Type": "application/json",
                     "Accept": "audio/mpeg"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = resp.read()
        if len(data) < 500:
            raise RuntimeError(f"ElevenLabs lieferte zu wenig Daten bei {wid}: {data[:200]!r}")
        path.write_bytes(data)
        print(f"    [{wid}] {vn} -> ok")


# ---- FPT.AI (Regional: miền Trung / miền Nam) ------------------------------
# API v5: POST Text -> JSON {"async": "<mp3-url>"}; die MP3 wird asynchron
# erzeugt, daher die async-URL kurz danach pollen. Key aus ENV (nie in Datei).
FPT_ENDPOINT = "https://api.fpt.ai/hmi/tts/v5"


def fpt_key():
    return os.environ.get("FPT_API_KEY", "").strip()


def _fpt_post(text, voice_id, key):
    req = urllib.request.Request(
        FPT_ENDPOINT,
        data=text.encode("utf-8"),
        headers={"api-key": key, "voice": voice_id, "speed": "0"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def gen_fpt(voice_id, todo, key):
    for wid, vn, path in todo:
        # FPT verlangt >= 3 Zeichen; kurze Woerter mit Punkt padden (stumm).
        text = vn if len(vn) >= 3 else vn + "."

        # POST mit Backoff gegen das Free-Tier-Rate-Limit (kommt mal als
        # HTTP 429, mal als 200-JSON mit "rate limit"-Message).
        payload = {}
        delay = 15
        ok = False
        for _ in range(8):
            try:
                payload = _fpt_post(text, voice_id, key)
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    print(f"    [{wid}] HTTP 429 – warte {delay}s ...")
                    time.sleep(delay); delay = min(delay * 2, 90); continue
                raise
            if "rate limit" in (payload.get("message") or "").lower():
                print(f"    [{wid}] rate limit – warte {delay}s ...")
                time.sleep(delay); delay = min(delay * 2, 90); continue
            ok = True
            break
        if not ok or payload.get("error") or "async" not in payload:
            raise RuntimeError(f"FPT-Fehler bei {wid}: {payload}")
        async_url = payload["async"]

        # MP3 wird serverseitig erst erzeugt -> ein paar Sekunden pollen.
        last = None
        for _ in range(15):
            time.sleep(1.2)
            try:
                with urllib.request.urlopen(async_url, timeout=30) as a:
                    data = a.read()
                if data[:3] == b"ID3" or len(data) > 2000:  # sieht nach MP3 aus
                    path.write_bytes(data)
                    break
            except urllib.error.HTTPError as e:
                last = e  # 404/403 solange noch nicht fertig
        else:
            raise RuntimeError(f"MP3 nicht rechtzeitig fertig ({wid}/{voice_id}); letzter: {last}")

        print(f"    [{wid}] {vn} -> ok")
        time.sleep(8)  # Drossel gegen Free-Rate-Limit


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--only", default="")
    args = parser.parse_args()

    only = set(x.strip() for x in args.only.split(",") if x.strip()) or None

    for key, meta in VOICES.items():
        if only and key not in only:
            continue
        engine = meta["engine"]

        # Verfuegbarkeit pruefen
        if engine == "piper" and not piper_available(meta["model"]):
            print(f"[skip] {key}: Piper/Modell nicht verfuegbar")
            continue
        if engine == "fpt" and not fpt_key():
            print(f"[skip] {key}: FPT_API_KEY nicht gesetzt")
            continue
        if engine == "eleven" and not eleven_key():
            print(f"[skip] {key}: ELEVEN_API_KEY nicht gesetzt")
            continue

        (OUT_DIR / key).mkdir(parents=True, exist_ok=True)
        ext = ".wav" if engine == "piper" else ".mp3"
        todo = []
        for wid, vn, _de in SAMPLE:
            p = (OUT_DIR / key / f"{wid}{ext}")
            if p.exists() and not args.force:
                continue
            todo.append((wid, vn, p))

        if not todo:
            print(f"[ok]   {key}: nichts zu tun ({len(SAMPLE)} vorhanden)")
            continue

        print(f"[gen]  {key} ({engine}): {len(todo)} Samples ...")
        try:
            if engine == "edge":
                asyncio.run(gen_edge(meta["voice"], todo))
            elif engine == "gtts":
                gen_gtts(todo)
            elif engine == "piper":
                gen_piper(meta["model"], todo)
            elif engine == "fpt":
                gen_fpt(meta["voice"], todo, fpt_key())
            elif engine == "eleven":
                gen_eleven(meta["voice"], todo, eleven_key())
            print(f"       {key}: fertig")
        except Exception as e:
            print(f"[FEHLER] {key}: {e}")


if __name__ == "__main__":
    main()
