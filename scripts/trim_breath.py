#!/usr/bin/env python3
"""Schneidet den Atem-/Ausatem-Artefakt am Wortende von ElevenLabs-v3-MP3s weg.

Beobachtung: v3 haengt nach dem Wort oft eine ~0,3–0,5 s lange leise Luecke und
dann einen kurzen, lauten Atemstoss an. Wir erkennen die letzte laengere Stille
(unter -30 dB) und schneiden dort ab (+ kleiner Rand + Fade-out gegen Knackser).
Mehrsilbige Woerter bleiben heil, weil kurze Silbenluecken (<0,12 s) ignoriert
werden.

Nutzt die portable ffmpeg-Binary aus imageio-ffmpeg (kein System-ffmpeg noetig).

Aufruf:
    python scripts/trim_breath.py <in_dir> <out_dir>
    python scripts/trim_breath.py audio audio           # in-place ueberschreiben
"""
import re
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

NOISE_DB = "-30dB"     # unter diesem Pegel = "Stille" (Atem-Luecke)
MIN_SIL = 0.12          # nur Stillen >= 0.12 s zaehlen (Silbenluecken ignorieren)
TAIL = 0.06             # so viel natuerlichen Ausklang nach Sprachende behalten
FADE = 0.04             # Fade-out-Dauer gegen Knackser
LEAD_MAX = 0.03         # fuehrende Stille bis hierhin wird abgeschnitten
BREATH_MAX = 0.20       # nur schneiden, wenn NACH der letzten Luecke <= so viel Audio
                        # kommt (= kurzer Atem/Trailing-Stille). Mehr = echtes
                        # Schlusswort (mehrsilbige Saetze) -> NICHT kappen.


def probe_silences(path):
    """Liste (start,end) der Stille-Intervalle >= MIN_SIL und Gesamtdauer."""
    p = subprocess.run(
        [FFMPEG, "-i", str(path), "-af",
         f"silencedetect=noise={NOISE_DB}:d={MIN_SIL}", "-f", "null", "-"],
        capture_output=True, text=True)
    err = p.stderr
    starts = [float(x) for x in re.findall(r"silence_start:\s*([0-9.]+)", err)]
    ends = [float(x) for x in re.findall(r"silence_end:\s*([0-9.]+)", err)]
    dur = None
    m = re.search(r"Duration:\s*(\d+):(\d+):([0-9.]+)", err)
    if m:
        dur = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))
    # silence_start ohne passendes _end = Stille bis Dateiende
    sil = []
    for i, s in enumerate(starts):
        e = ends[i] if i < len(ends) else (dur if dur else s)
        sil.append((s, e))
    return sil, dur


def cut_points(path):
    """(start_ss, cut_to) berechnen; None => nichts zu tun."""
    sil, dur = probe_silences(path)
    if dur is None:
        return None
    start_ss = 0.0
    # fuehrende Stille abschneiden
    if sil and sil[0][0] <= LEAD_MAX:
        start_ss = sil[0][1]
        sil = sil[1:]
    if not sil:
        return (start_ss, dur) if start_ss > 0 else None
    # Letzte (spaeteste) Stille betrachten: (ls, le). Was folgt danach bis Dateiende?
    ls, le = max(sil, key=lambda iv: iv[0])
    trailing = dur - le  # Audio nach der letzten Luecke
    if trailing <= BREATH_MAX:
        # kurzer Atemstoss ODER reine Trailing-Stille -> am Luecken-Anfang kappen
        cut_to = ls + TAIL
    else:
        # echtes Schlusswort nach der Luecke (mehrsilbiger Satz) -> nicht kappen
        cut_to = dur
    if cut_to >= dur - 0.01 and start_ss <= 0:
        return None  # nichts Nennenswertes zu schneiden
    return (start_ss, min(cut_to, dur))


def trim(inp, outp):
    pts = cut_points(inp)
    outp.parent.mkdir(parents=True, exist_ok=True)
    if pts is None:
        if inp != outp:
            outp.write_bytes(inp.read_bytes())
        return "unveraendert"
    start_ss, cut_to = pts
    length = max(0.05, cut_to - start_ss)
    fade_st = max(0.0, length - FADE)
    tmp = outp.with_suffix(".tmp.mp3")
    subprocess.run(
        [FFMPEG, "-y", "-ss", f"{start_ss:.3f}", "-i", str(inp),
         "-t", f"{length:.3f}", "-af", f"afade=t=out:st={fade_st:.3f}:d={FADE}",
         "-c:a", "libmp3lame", "-q:a", "4", str(tmp)],
        capture_output=True, text=True)
    tmp.replace(outp)
    return f"{start_ss:.2f}s..{cut_to:.2f}s"


def main():
    if len(sys.argv) != 3:
        sys.exit("Aufruf: python scripts/trim_breath.py <in_dir> <out_dir>")
    in_dir, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    files = sorted(in_dir.glob("*.mp3"))
    if not files:
        sys.exit(f"Keine MP3s in {in_dir}")
    for f in files:
        res = trim(f, out_dir / f.name)
        print(f"  {f.name}: {res}")
    print(f"Fertig: {len(files)} Dateien.")


if __name__ == "__main__":
    main()
