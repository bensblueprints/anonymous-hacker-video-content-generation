#!/usr/bin/env python3
"""Config-driven Anonymous Hacker video generation pipeline.

The live image/video commands use fal.run. Validation, dry-run, timeline
math, rendering, and contact-sheet generation are local and never require
an API key.
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import math
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw

FPS = 24
IMAGE_ENDPOINT = "https://fal.run/fal-ai/nano-banana-2/edit"
VIDEO_ENDPOINT = "https://fal.run/minimax/h3-max/image-to-video"
CHARACTER_LOCK = (
    "Exactly one adult male Anonymous character; clean white Guy Fawkes mask "
    "completely covering the face; plain black hoodie with hood fully raised; "
    "fitted black gloves, black cargo pants, and complete black lace-up combat "
    "boots whenever feet are framed. Photorealistic anatomy. No exposed face, "
    "extra person, duplicate device, extra fingers, or weapon."
)
PACING_LOCK = (
    "Use one purposeful visual beat every 2–4 seconds: a deliberate prop action, "
    "head turn, lighting beat, camera beat, or clean cut. Avoid prolonged idle "
    "holds, slow drifting, generic swaying, and robotic movement. Never walk "
    "backward unless explicitly scripted. Walking must be grounded forward motion "
    "with natural weight transfer. Keep the shot readable rather than hyperactive."
)
SCALE_LOCK = (
    "Preserve the product's exact realistic scale relative to the hand and mask. "
    "Keep the same apparent pixel width, arms tucked, and product near the torso. "
    "No push-in, zoom, lens-thrust, stretching, enlargement, tablet-sized prop, "
    "or product duplication."
)
SAFETY_LOCK = (
    "Educational and ethical cybersecurity context only, using owned lab equipment "
    "or systems with express permission. Show no operational payload, attack command, "
    "credential, theft, persistence, evasion, or unauthorized-access instruction."
)


class ConfigError(ValueError):
    """Raised for invalid project or scene configuration."""


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ConfigError(f"Config not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ConfigError(f"Invalid JSON in {path}: {exc}") from exc


def validate_project(project: dict[str, Any]) -> None:
    required = {"project_name", "workdir", "product", "character"}
    missing = sorted(required - project.keys())
    if missing:
        raise ConfigError(f"Project missing fields: {', '.join(missing)}")
    product = project["product"]
    if not isinstance(product, dict) or not product.get("name"):
        raise ConfigError("project.product.name is required")
    dims = product.get("dimensions_mm")
    if not isinstance(dims, list) or len(dims) < 2 or any(float(x) <= 0 for x in dims):
        raise ConfigError("project.product.dimensions_mm requires at least two positive values")
    if not isinstance(project["character"], dict):
        raise ConfigError("project.character must be an object")


def validate_scenes(scenes: list[dict[str, Any]]) -> None:
    if not isinstance(scenes, list) or not scenes:
        raise ConfigError("Scenes must be a non-empty array")
    ids: list[int] = []
    previous_location: str | None = None
    for index, scene in enumerate(scenes):
        for field in ("id", "topic", "location", "duration", "target_seconds", "action", "beats"):
            if field not in scene:
                raise ConfigError(f"Scene {index + 1} missing {field}")
        scene_id = int(scene["id"])
        if scene_id in ids:
            raise ConfigError(f"Duplicate scene id: {scene_id}")
        ids.append(scene_id)
        duration = int(scene["duration"])
        if duration < 4 or duration > 15:
            raise ConfigError(f"Scene {scene_id} duration must be 4–15 seconds")
        if float(scene["target_seconds"]) <= 0:
            raise ConfigError(f"Scene {scene_id} target_seconds must be positive")
        beats = scene["beats"]
        if not isinstance(beats, list) or not beats:
            raise ConfigError(f"Scene {scene_id} requires pacing beats")
        if scene.get("chain_from_previous"):
            if index == 0:
                raise ConfigError("First scene cannot chain_from_previous")
            if previous_location != scene["location"]:
                raise ConfigError(
                    f"Scene {scene_id} chains across locations; create a topic frame and hard cut"
                )
        elif not scene.get("input_image"):
            raise ConfigError(f"Scene {scene_id} needs input_image when not chained")
        previous_location = str(scene["location"])


def validate_configs(project_path: Path, scenes_path: Path) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    project = load_json(project_path)
    scenes = load_json(scenes_path)
    if not isinstance(project, dict):
        raise ConfigError("Project config must be an object")
    validate_project(project)
    validate_scenes(scenes)
    return project, scenes


def resolve(base: Path, value: str | Path) -> Path:
    path = Path(value).expanduser()
    return path if path.is_absolute() else (base / path).resolve()


def quantize_seconds(seconds: float, fps: int = FPS) -> tuple[int, float]:
    frames = max(1, round(float(seconds) * fps))
    return frames, frames / fps


def product_description(project: dict[str, Any]) -> str:
    p = project["product"]
    dims = " × ".join(f"{float(x):g}" for x in p["dimensions_mm"])
    appearance = p.get("appearance", "preserve every visible product detail")
    return f"The single {p['name']} is approximately {dims} mm. {appearance}"


def build_scene_prompt(project: dict[str, Any], scene: dict[str, Any]) -> str:
    beat_text = "; ".join(str(x) for x in scene["beats"])
    transition = (
        "Continue from the supplied previous final frame within the same coherent action and location."
        if scene.get("chain_from_previous")
        else "This is a deliberate hard cut for a new paragraph/topic; use the supplied topic frame."
    )
    return "\n\n".join(
        [
            f"Photorealistic vertical 9:16 educational Reel. {transition}",
            CHARACTER_LOCK,
            product_description(project),
            f"Topic: {scene['topic']}. Location: {scene['location']}. Action: {scene['action']}",
            f"Purposeful beats: {beat_text}.",
            PACING_LOCK,
            SCALE_LOCK,
            SAFETY_LOCK,
            str(scene.get("extra_prompt", "")).strip(),
        ]
    ).strip()


def stage_a_prompt(project: dict[str, Any], extra: str = "") -> str:
    return "\n\n".join(
        [
            "Directly edit the supplied real in-hand photograph. Preserve the product itself at exactly the same pixel size, camera distance, position, orientation, and grip. Do not use it merely as a loose reference and do not redraw or resize it.",
            CHARACTER_LOCK,
            product_description(project),
            "Transform only the person, clothing, and requested background. Preserve hand placement while changing exposed hands to fitted black gloves. Remove source text overlays unless explicitly retained.",
            SCALE_LOCK,
            SAFETY_LOCK,
            extra.strip(),
        ]
    ).strip()


def stage_b_prompt(project: dict[str, Any], scene_text: str) -> str:
    return "\n\n".join(
        [
            "Use the supplied approved Stage-A edit as the sole authoritative character, product, grip, and physical-scale reference. Create a photorealistic vertical 9:16 target scene.",
            CHARACTER_LOCK,
            product_description(project),
            SCALE_LOCK,
            PACING_LOCK,
            SAFETY_LOCK,
            scene_text.strip(),
        ]
    ).strip()


def topic_frame_prompt(project: dict[str, Any], topic: str, location: str, action: str) -> str:
    return stage_b_prompt(
        project,
        f"New paragraph/topic: {topic}. New location: {location}. Compose a stable first frame ready for this action: {action}. This is a hard scene cut, not a forced continuation from the prior location.",
    )


def require_fal_key() -> str:
    key = os.environ.get("FAL_KEY", "").strip()
    if not key:
        raise ConfigError("FAL_KEY is required for live generation")
    return key


def image_data_url(path: Path, output_size: tuple[int, int] | None = None) -> str:
    image = Image.open(path).convert("RGB")
    if output_size:
        image = center_crop_ratio(image, output_size[0] / output_size[1]).resize(
            output_size, Image.Resampling.LANCZOS
        )
    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=92, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def center_crop_ratio(image: Image.Image, ratio: float) -> Image.Image:
    width, height = image.size
    current = width / height
    if math.isclose(current, ratio, rel_tol=1e-6):
        return image
    if current > ratio:
        target_width = round(height * ratio)
        left = (width - target_width) // 2
        return image.crop((left, 0, left + target_width, height))
    target_height = round(width / ratio)
    top = (height - target_height) // 2
    return image.crop((0, top, width, top + target_height))


def request_json(url: str, body: dict[str, Any] | None = None, timeout: int = 1200) -> dict[str, Any]:
    key = require_fal_key()
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8") if body is not None else None,
        headers={"Authorization": f"Key {key}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.load(response)
    except Exception as exc:
        raise RuntimeError(f"fal request failed for {url}: {type(exc).__name__}: {exc}") from exc


def download(url: str, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={"User-Agent": "anonymous-hacker-video/0.1"})
    with urllib.request.urlopen(request, timeout=600) as response:
        output.write_bytes(response.read())


def image_edit(source: Path, output: Path, prompt: str, aspect_ratio: str) -> None:
    result = request_json(
        IMAGE_ENDPOINT,
        {
            "prompt": prompt,
            "num_images": 1,
            "aspect_ratio": aspect_ratio,
            "output_format": "png",
            "safety_tolerance": "4",
            "sync_mode": True,
            "image_urls": [image_data_url(source)],
            "resolution": "2K",
            "limit_generations": True,
            "enable_web_search": False,
        },
    )
    images = result.get("images") or []
    if not images or not images[0].get("url"):
        raise RuntimeError("Image generation returned no image URL")
    download(images[0]["url"], output)


def generate_video(image: Path, prompt: str, duration: int) -> str:
    result = request_json(
        VIDEO_ENDPOINT,
        {
            "prompt": prompt,
            "image_url": image_data_url(image, (1080, 1920)),
            "duration": duration,
            "resolution": "768P",
            "enable_safety_checker": False,
            "prompt_expansion_mode": "balanced",
        },
    )
    if result.get("video", {}).get("url"):
        return str(result["video"]["url"])
    status_url, response_url = result.get("status_url"), result.get("response_url")
    if not status_url:
        raise RuntimeError("Video generation returned no video or queue status URL")
    for _ in range(240):
        status = request_json(status_url)
        state = status.get("status")
        if state == "COMPLETED":
            final = request_json(response_url) if response_url else status
            url = final.get("video", {}).get("url")
            if url:
                return str(url)
            raise RuntimeError("Completed video job returned no URL")
        if state in {"FAILED", "CANCELLED"}:
            raise RuntimeError(f"Video job ended with status {state}")
        time.sleep(5)
    raise TimeoutError("Video generation timed out")


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def probe_duration(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(json.loads(result.stdout)["format"]["duration"])


def probe_frame_count(path: Path) -> int:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries", "stream=nb_read_frames", "-of", "default=nw=1:nk=1", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return int(result.stdout.strip())


def frame_boundary(seconds: float | Decimal, fps: int = FPS) -> int:
    return int((Decimal(str(seconds)) * fps).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def cumulative_frame_counts(scenes: list[dict[str, Any]], offset: float = 0.0, fps: int = FPS) -> list[int]:
    cursor_seconds = Decimal(str(offset))
    cursor_frame = frame_boundary(cursor_seconds, fps)
    counts: list[int] = []
    for scene in scenes:
        cursor_seconds += Decimal(str(scene["target_seconds"]))
        end_frame = frame_boundary(cursor_seconds, fps)
        counts.append(end_frame - cursor_frame)
        cursor_frame = end_frame
    return counts


def extract_last_frame(video: Path, output: Path) -> None:
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-sseof", "-0.08", "-i", str(video), "-frames:v", "1", str(output)])


def output_dir(project_path: Path, project: dict[str, Any]) -> Path:
    path = resolve(project_path.parent, project["workdir"])
    path.mkdir(parents=True, exist_ok=True)
    return path


def cmd_validate(args: argparse.Namespace) -> int:
    project, scenes = validate_configs(args.project, args.scenes)
    total = sum(float(s["target_seconds"]) for s in scenes)
    print(f"VALID: {project['project_name']} — {len(scenes)} scenes — {total:.3f}s")
    return 0


def cmd_dry_run(args: argparse.Namespace) -> int:
    project, scenes = validate_configs(args.project, args.scenes)
    out = resolve(args.project.parent, project["workdir"])
    previous: Path | None = None
    print(f"project={project['project_name']} output={out}")
    for scene in scenes:
        image = previous if scene.get("chain_from_previous") else resolve(args.scenes.parent, scene["input_image"])
        raw = out / f"scene_{int(scene['id']):03d}_raw.mp4"
        final = out / f"scene_{int(scene['id']):03d}_reel.mp4"
        frames, actual = quantize_seconds(float(scene["target_seconds"]))
        print(json.dumps({"scene": scene["id"], "topic": scene["topic"], "input": str(image), "chain": bool(scene.get("chain_from_previous")), "raw": str(raw), "final": str(final), "target_seconds": scene["target_seconds"], "frames_24fps": frames, "quantized_seconds": actual, "prompt": build_scene_prompt(project, scene)}, indent=2, ensure_ascii=False))
        previous = out / f"last_frame_{int(scene['id']):03d}.png"
    return 0


def cmd_stage_a(args: argparse.Namespace) -> int:
    project = load_json(args.project); validate_project(project)
    prompt = stage_a_prompt(project, args.extra or "")
    if args.dry_run:
        print(prompt); return 0
    image_edit(args.source, args.output, prompt, "16:9")
    print(args.output); return 0


def cmd_stage_b(args: argparse.Namespace) -> int:
    project = load_json(args.project); validate_project(project)
    prompt = stage_b_prompt(project, args.scene)
    if args.dry_run:
        print(prompt); return 0
    image_edit(args.source, args.output, prompt, "9:16")
    image = Image.open(args.output).convert("RGB")
    center_crop_ratio(image, 9 / 16).resize((1080, 1920), Image.Resampling.LANCZOS).save(args.output)
    print(args.output); return 0


def cmd_topic_frame(args: argparse.Namespace) -> int:
    project = load_json(args.project); validate_project(project)
    prompt = topic_frame_prompt(project, args.topic, args.location, args.action)
    if args.dry_run:
        print(prompt); return 0
    image_edit(args.source, args.output, prompt, "9:16")
    image = Image.open(args.output).convert("RGB")
    center_crop_ratio(image, 9 / 16).resize((1080, 1920), Image.Resampling.LANCZOS).save(args.output)
    print(args.output); return 0


def cmd_generate(args: argparse.Namespace) -> int:
    project, scenes = validate_configs(args.project, args.scenes)
    out = resolve(args.project.parent, project["workdir"]) if args.dry_run else output_dir(args.project, project)
    previous: Path | None = None
    manifest = []
    for scene in scenes:
        scene_id = int(scene["id"])
        image = previous if scene.get("chain_from_previous") else resolve(args.scenes.parent, scene["input_image"])
        if image is None:
            raise ConfigError(f"Scene {scene_id} has no resolved input image")
        if not args.dry_run and not image.exists():
            raise ConfigError(f"Scene {scene_id} input image not found: {image}")
        prompt = build_scene_prompt(project, scene)
        raw = out / f"scene_{scene_id:03d}_raw.mp4"
        last = out / f"last_frame_{scene_id:03d}.png"
        if args.dry_run:
            print(json.dumps({"scene": scene_id, "input": str(image), "output": str(raw), "prompt": prompt}, indent=2, ensure_ascii=False))
        else:
            download(generate_video(image, prompt, int(scene["duration"])), raw)
            extract_last_frame(raw, last)
        manifest.append({"scene": scene_id, "input": str(image), "raw": str(raw), "last_frame": str(last), "prompt": prompt})
        previous = last
    if not args.dry_run:
        (out / "generation_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return 0


def render_command(raw: Path, output: Path, source_frames: int, target_frames: int) -> list[str]:
    ratio = target_frames / source_frames
    video_filter = (
        "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,"
        "scale=1080:1920:flags=lanczos,"
        f"setpts={ratio:.12f}*PTS,fps={FPS},"
        f"tpad=stop_mode=clone:stop_duration=1,trim=end_frame={target_frames},"
        "setpts=PTS-STARTPTS,format=yuv420p"
    )
    return ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw), "-vf", video_filter, "-frames:v", str(target_frames), "-an", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-x264-params", "keyint=48:min-keyint=48:scenecut=0", "-movflags", "+faststart", str(output)]


def cmd_render(args: argparse.Namespace) -> int:
    project, scenes = validate_configs(args.project, args.scenes)
    out = output_dir(args.project, project)
    offset = float(args.offset if args.offset is not None else project.get("narration_offset", 0))
    target_frames = cumulative_frame_counts(scenes, offset)
    rendered: list[Path] = []
    for scene, wanted_frames in zip(scenes, target_frames):
        scene_id = int(scene["id"]); raw = out / f"scene_{scene_id:03d}_raw.mp4"; final = out / f"scene_{scene_id:03d}_reel.mp4"
        if not raw.exists(): raise ConfigError(f"Missing raw clip: {raw}")
        run(render_command(raw, final, probe_frame_count(raw), wanted_frames))
        actual_frames = probe_frame_count(final)
        if actual_frames != wanted_frames:
            raise RuntimeError(f"Scene {scene_id}: expected {wanted_frames} rendered frames, got {actual_frames}")
        rendered.append(final)
    concat_file = out / "concat.txt"
    concat_file.write_text("".join(f"file '{str(p).replace(chr(39), chr(39)+chr(92)+chr(39)+chr(39))}'\n" for p in rendered), encoding="utf-8")
    silent = out / "assembled_silent.mp4"
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(concat_file), "-c", "copy", str(silent)])
    narration_value = args.narration or project.get("narration")
    if not narration_value: raise ConfigError("Narration path is required for render")
    narration = resolve(args.project.parent, narration_value)
    total = sum(float(s["target_seconds"]) for s in scenes)
    final_output = args.output or (out / "final_reel_1080x1920.mp4")
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(silent), "-ss", f"{offset:.3f}", "-i", str(narration), "-map", "0:v:0", "-map", "1:a:0", "-t", f"{total:.3f}", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(final_output)])
    print(final_output); return 0


def cmd_qc_sheet(args: argparse.Namespace) -> int:
    videos = [Path(x) for x in args.videos]
    if not videos: raise ConfigError("Provide at least one video")
    cards: list[Image.Image] = []
    with tempfile.TemporaryDirectory(prefix="anonymous-hacker-qc-") as tmp:
        temp = Path(tmp)
        for row, video in enumerate(videos, 1):
            duration = probe_duration(video)
            times = [0.35, duration * 0.33, duration * 0.66, max(0.35, duration - 0.35)]
            for column, timestamp in enumerate(times, 1):
                frame = temp / f"{row}_{column}.jpg"
                run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-ss", f"{timestamp:.3f}", "-i", str(video), "-frames:v", "1", "-q:v", "2", str(frame)])
                image = Image.open(frame).convert("RGB"); image.thumbnail((288, 504))
                card = Image.new("RGB", (310, 555), "#111111")
                card.paste(image, ((310 - image.width) // 2, 8))
                ImageDraw.Draw(card).text((10, 525), f"Clip {row} — {timestamp:.2f}s", fill="white")
                cards.append(card)
    sheet = Image.new("RGB", (1240, 555 * len(videos)), "#222222")
    for index, card in enumerate(cards): sheet.paste(card, ((index % 4) * 310, (index // 4) * 555))
    args.output.parent.mkdir(parents=True, exist_ok=True); sheet.save(args.output, quality=93)
    print(args.output); return 0


def parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Generate paragraph-aware Anonymous hacker videos with accurate product scale.")
    sub = p.add_subparsers(dest="command", required=True)
    def configs(name: str, help_text: str) -> argparse.ArgumentParser:
        c = sub.add_parser(name, help=help_text); c.add_argument("--project", type=Path, required=True); c.add_argument("--scenes", type=Path, required=True); return c
    v = configs("validate", "Validate project and scene JSON"); v.set_defaults(func=cmd_validate)
    d = configs("dry-run", "Print resolved scene operations without network calls"); d.set_defaults(func=cmd_dry_run)
    for name, help_text, func in [("stage-a", "Direct-edit a real in-hand reference", cmd_stage_a), ("stage-b", "Create a 9:16 scene from Stage A", cmd_stage_b)]:
        c=sub.add_parser(name,help=help_text); c.add_argument("--project",type=Path,required=True); c.add_argument("--source",type=Path,required=True); c.add_argument("--output",type=Path,required=True); c.add_argument("--dry-run",action="store_true")
        if name=="stage-a": c.add_argument("--extra",default="")
        else: c.add_argument("--scene",required=True)
        c.set_defaults(func=func)
    t=sub.add_parser("topic-frame",help="Create a fresh frame for a new paragraph/topic"); t.add_argument("--project",type=Path,required=True); t.add_argument("--source",type=Path,required=True); t.add_argument("--output",type=Path,required=True); t.add_argument("--topic",required=True); t.add_argument("--location",required=True); t.add_argument("--action",required=True); t.add_argument("--dry-run",action="store_true"); t.set_defaults(func=cmd_topic_frame)
    g=configs("generate","Generate H3 Max scene clips"); g.add_argument("--dry-run",action="store_true"); g.set_defaults(func=cmd_generate)
    r=configs("render","Retime, concatenate, and attach narration"); r.add_argument("--narration"); r.add_argument("--offset",type=float); r.add_argument("--output",type=Path); r.set_defaults(func=cmd_render)
    q=sub.add_parser("qc-sheet",help="Sample four frames per clip into a contact sheet"); q.add_argument("--videos",type=Path,nargs="+",required=True); q.add_argument("--output",type=Path,required=True); q.set_defaults(func=cmd_qc_sheet)
    return p


def main(argv: list[str] | None = None) -> int:
    try:
        args = parser().parse_args(argv)
        return int(args.func(args))
    except (ConfigError, RuntimeError, subprocess.CalledProcessError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
