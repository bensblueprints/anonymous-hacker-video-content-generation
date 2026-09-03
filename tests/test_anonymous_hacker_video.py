from __future__ import annotations

import importlib.util
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "anonymous_hacker_video.py"
SPEC = importlib.util.spec_from_file_location("anonymous_hacker_video", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def examples():
    return (
        ROOT / "examples" / "project.example.json",
        ROOT / "examples" / "scenes.example.json",
    )


def test_example_configs_validate():
    project, scenes = MODULE.validate_configs(*examples())
    assert project["product"]["name"] == "Flipper Zero"
    assert len(scenes) == 4


def test_first_scene_cannot_chain(tmp_path):
    project_path, scenes_path = examples()
    scenes = json.loads(scenes_path.read_text())
    scenes[0]["chain_from_previous"] = True
    bad = tmp_path / "bad.json"
    bad.write_text(json.dumps(scenes))
    with pytest.raises(MODULE.ConfigError, match="First scene"):
        MODULE.validate_configs(project_path, bad)


def test_cross_location_chain_is_rejected(tmp_path):
    project_path, scenes_path = examples()
    scenes = json.loads(scenes_path.read_text())
    scenes[2]["chain_from_previous"] = True
    scenes[2].pop("input_image", None)
    bad = tmp_path / "cross-location.json"
    bad.write_text(json.dumps(scenes))
    with pytest.raises(MODULE.ConfigError, match="chains across locations"):
        MODULE.validate_configs(project_path, bad)


def test_prompt_contains_character_scale_pacing_and_safety_locks():
    project, scenes = MODULE.validate_configs(*examples())
    prompt = MODULE.build_scene_prompt(project, scenes[0]).lower()
    for expected in (
        "guy fawkes",
        "hood fully raised",
        "same apparent pixel width",
        "2–4 seconds",
        "never walk backward",
        "educational and ethical",
        "no operational payload",
    ):
        assert expected in prompt


def test_stage_a_is_direct_edit_not_loose_reference():
    project, _ = MODULE.validate_configs(*examples())
    prompt = MODULE.stage_a_prompt(project).lower()
    assert "exactly the same pixel size" in prompt
    assert "do not use it merely as a loose reference" in prompt


def test_frame_quantization():
    frames, seconds = MODULE.quantize_seconds(10.9, 24)
    assert frames == 262
    assert seconds == pytest.approx(262 / 24)


def test_render_command_is_list_form_and_center_crops(tmp_path):
    command = MODULE.render_command(tmp_path / "raw.mp4", tmp_path / "out.mp4", 11.552, 10.9)
    assert isinstance(command, list)
    assert command[0] == "ffmpeg"
    video_filter = command[command.index("-vf") + 1]
    assert "crop=ih*9/16:ih:(iw-ih*9/16)/2:0" in video_filter
    assert "scale=1080:1920" in video_filter
    assert "format=yuv420p" in video_filter


def test_dry_run_needs_no_fal_key():
    project, scenes = examples()
    env = os.environ.copy()
    env.pop("FAL_KEY", None)
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "dry-run", "--project", str(project), "--scenes", str(scenes)],
        capture_output=True,
        text=True,
        env=env,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    assert "never walk backward" in result.stdout.lower()
    assert "chain" in result.stdout


def test_repository_contains_no_secrets_or_machine_specific_user_path():
    token_pattern = re.compile("g" + r"hp_[A-Za-z0-9]{20,}")
    forbidden_path = "/" + "Users" + "/" + "benji"
    for path in ROOT.rglob("*"):
        if (
            not path.is_file()
            or ".git" in path.parts
            or ".venv" in path.parts
            or "__pycache__" in path.parts
            or ".pytest_cache" in path.parts
            or "output" in path.parts
        ):
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        assert not token_pattern.search(text), path
        assert forbidden_path not in text, path
