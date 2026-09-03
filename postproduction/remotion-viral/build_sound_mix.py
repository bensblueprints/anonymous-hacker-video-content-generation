#!/usr/bin/env python3
"""Create restrained procedural transition SFX and mux them under narration."""
from __future__ import annotations

import argparse
import json
import math
import subprocess
from pathlib import Path

FPS = 24
TOTAL_FRAMES = 7103
TOTAL_SECONDS = TOTAL_FRAMES / FPS
BOUNDARIES = [
    10.90, 18.38, 28.92, 40.11, 51.32, 62.63, 71.91, 80.40,
    90.89, 101.90, 111.96, 120.40, 129.18, 139.42, 150.77,
    160.78, 172.18, 184.92, 193.86, 203.16, 213.18, 224.32,
    234.05, 244.14, 252.78, 261.96, 274.01, 284.08,
]
MAJOR = [40.11, 90.89, 139.42, 184.92, 234.05, 274.01]
IMPACTS = [40.11, 90.89, 139.42, 186.40, 234.05, 274.01]


def run(command: list[str]) -> None:
    print("+", " ".join(command))
    subprocess.run(command, check=True)


def make_sfx(folder: Path) -> dict[str, Path]:
    folder.mkdir(parents=True, exist_ok=True)
    static = folder / "static_tick.wav"
    whoosh = folder / "digital_whoosh.wav"
    impact = folder / "low_impact.wav"

    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "lavfi", "-i",
        "anoisesrc=color=white:sample_rate=48000:duration=0.16:amplitude=0.12",
        "-af", "highpass=f=1600,lowpass=f=9000,afade=t=in:st=0:d=0.015,"
        "afade=t=out:st=0.08:d=0.08,volume=0.35,pan=stereo|c0=c0|c1=c0,"
        "loudnorm=I=-16:TP=-3:LRA=1",
        "-c:a", "pcm_s24le", str(static),
    ])
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "lavfi", "-i",
        "anoisesrc=color=pink:sample_rate=48000:duration=0.50:amplitude=0.18",
        "-af", "highpass=f=280,lowpass=f=7200,tremolo=f=13:d=0.28,"
        "afade=t=in:st=0:d=0.06,afade=t=out:st=0.22:d=0.28,"
        "volume=0.30,pan=stereo|c0=0.82*c0|c1=c0,loudnorm=I=-16:TP=-3:LRA=1",
        "-c:a", "pcm_s24le", str(whoosh),
    ])
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "lavfi", "-i", "sine=frequency=58:sample_rate=48000:duration=0.45",
        "-f", "lavfi", "-i", "sine=frequency=116:sample_rate=48000:duration=0.28",
        "-filter_complex",
        "[0:a]volume=0.32,afade=t=out:st=0.03:d=0.42[a0];"
        "[1:a]volume=0.10,afade=t=out:st=0.02:d=0.26[a1];"
        "[a0][a1]amix=inputs=2:normalize=0,lowpass=f=420,"
        "pan=stereo|c0=c0|c1=c0,loudnorm=I=-16:TP=-3:LRA=1[out]",
        "-map", "[out]", "-c:a", "pcm_s24le", str(impact),
    ])
    return {"static": static, "whoosh": whoosh, "impact": impact}


def db_gain(db: float) -> float:
    return math.pow(10.0, db / 20.0)


def delayed_tracks(source: str, times: list[float], prefix: str, gain_db: float) -> tuple[list[str], list[str]]:
    branches = "".join(f"[{prefix}{i}]" for i in range(len(times)))
    filters = [f"[{source}]asplit={len(times)}{branches}"]
    outputs: list[str] = []
    gain = db_gain(gain_db)
    for i, seconds in enumerate(times):
        delay = round(seconds * 1000)
        out = f"{prefix}d{i}"
        filters.append(f"[{prefix}{i}]volume={gain:.8f},adelay={delay}|{delay}[{out}]")
        outputs.append(out)
    return filters, outputs


def write_filter(path: Path) -> None:
    filters = [
        "[1:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=0.95[voice]"
    ]
    static_filters, static_out = delayed_tracks("2:a", BOUNDARIES, "s", -25.0)
    whoosh_filters, whoosh_out = delayed_tracks("3:a", MAJOR, "w", -22.0)
    impact_filters, impact_out = delayed_tracks("4:a", IMPACTS, "i", -20.0)
    filters.extend(static_filters + whoosh_filters + impact_filters)
    mix_inputs = "[voice]" + "".join(f"[{name}]" for name in static_out + whoosh_out + impact_out)
    count = 1 + len(static_out) + len(whoosh_out) + len(impact_out)
    filters.append(
        f"{mix_inputs}amix=inputs={count}:duration=longest:dropout_transition=0:normalize=0,"
        f"alimiter=limit=0.89:level=false,apad,atrim=duration={TOTAL_SECONDS:.9f}[outa]"
    )
    path.write_text(";\n".join(filters) + "\n")


def write_manifest(path: Path) -> None:
    payload = {
        "fps": FPS,
        "total_frames": TOTAL_FRAMES,
        "duration_seconds": TOTAL_SECONDS,
        "static": {"times_seconds": BOUNDARIES, "gain_db": -25.0},
        "whoosh": {"times_seconds": MAJOR, "gain_db": -22.0},
        "impact": {"times_seconds": IMPACTS, "gain_db": -20.0},
        "voice_gain_db": 20 * math.log10(0.95),
        "limiter_linear": 0.89,
    }
    path.write_text(json.dumps(payload, indent=2) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--video", type=Path, help="Silent Remotion video")
    parser.add_argument("--source", type=Path, help="Original video containing narration")
    parser.add_argument("--output", type=Path, help="Final muxed MP4")
    parser.add_argument("--prepare-only", action="store_true", help="Only create SFX and manifest")
    args = parser.parse_args()

    work = Path(__file__).resolve().parent
    assets = make_sfx(work / "sfx")
    filter_script = work / "sound_mix.ffmpeg"
    manifest = work / "sound_manifest.json"
    write_filter(filter_script)
    write_manifest(manifest)

    if args.prepare_only:
        print(f"Prepared {manifest} and {filter_script}")
        return
    if not args.video or not args.source or not args.output:
        parser.error("--video, --source, and --output are required unless --prepare-only is used")
    for item in (args.video, args.source):
        if not item.is_file():
            parser.error(f"Missing input: {item}")
    args.output.parent.mkdir(parents=True, exist_ok=True)

    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "warning",
        "-i", str(args.video), "-i", str(args.source),
        "-i", str(assets["static"]), "-i", str(assets["whoosh"]),
        "-i", str(assets["impact"]),
        "-filter_complex_script", str(filter_script),
        "-map", "0:v:0", "-map", "[outa]",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        "-ar", "48000", "-ac", "2", "-t", f"{TOTAL_SECONDS:.9f}",
        "-movflags", "+faststart", str(args.output),
    ])
    print(f"Created {args.output}")


if __name__ == "__main__":
    main()
