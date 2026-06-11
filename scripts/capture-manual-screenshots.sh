#!/usr/bin/env bash
# Capture manual screenshots for a given language (ja|zh|ko|en).
# Usage: bash scripts/capture-manual-screenshots.sh ko
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/env.sh"

LANG_CODE="${1:-zh}"
OUT_DIR="$ROOT/docs/images/$LANG_CODE"
PACKAGE="com.googlecalenderapp"
ACTIVITY="${PACKAGE}/.MainActivity"
AVD="${ANDROID_AVD:-Nexus_5X_API_29_x86}"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

mkdir -p "$OUT_DIR"

lang_picker_index() {
  case "$1" in
    ja) echo 0 ;;
    zh) echo 1 ;;
    ko) echo 2 ;;
    en) echo 3 ;;
    *)
      echo "Unsupported language: $1 (use ja, zh, ko, en)" >&2
      exit 1
      ;;
  esac
}

start_emulator() {
  if adb devices | grep -q "device$"; then
    return
  fi
  echo "Starting emulator: $AVD"
  emulator -avd "$AVD" -no-snapshot-load -gpu swiftshader_indirect >/dev/null 2>&1 &
  adb wait-for-device
  for _ in $(seq 1 90); do
    if adb shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; then
      break
    fi
    sleep 2
  done
  sleep 3
}

install_app() {
  local apk="$ROOT/dist/出退勤管理-v1.0.0.apk"
  if [[ ! -f "$apk" ]]; then
    echo "APK not found. Run: npm run build:apk"
    exit 1
  fi
  if adb shell pm path "$PACKAGE" >/dev/null 2>&1; then
    echo "App already installed, skipping reinstall"
    return
  fi
  adb shell pm trim-caches 1000000000 >/dev/null 2>&1 || true
  adb install -r "$apk"
}

reset_app() {
  adb shell pm clear "$PACKAGE" >/dev/null
}

launch_app() {
  adb shell am start -n "$ACTIVITY" >/dev/null
  sleep 5
}

get_size() {
  adb shell wm size | awk '/Physical size/ {gsub(/[^0-9x]/,"",$3); print $3}'
}

tap_ratio() {
  local rx="$1"
  local ry="$2"
  local size
  size="$(get_size)"
  local w="${size%x*}"
  local h="${size#*x}"
  local x=$((w * rx / 1000))
  local y=$((h * ry / 1000))
  adb shell input tap "$x" "$y"
  sleep 1
}

tap_by_labels() {
  local labels="$1"
  python3 - "$labels" <<'PY'
import re, subprocess, sys

labels = sys.argv[1].split()
subprocess.run(["adb", "shell", "uiautomator", "dump", "/sdcard/uidump.xml"], check=True, stdout=subprocess.DEVNULL)
xml = subprocess.check_output(["adb", "shell", "cat", "/sdcard/uidump.xml"], text=True)

def center(bounds):
    m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds)
    if not m:
        return None
    x1, y1, x2, y2 = map(int, m.groups())
    return (x1 + x2) // 2, (y1 + y2) // 2

nodes = re.findall(r'<node[^>]+>', xml)
for label in labels:
    for node in nodes:
        text_m = re.search(r'text="([^"]*)"', node)
        if not text_m:
            continue
        text = text_m.group(1)
        if not text or (label not in text and text not in label):
            continue
        bounds_m = re.search(r'bounds="(\[[^\]]+\]\[[^\]]+\])"', node)
        if not bounds_m:
            continue
        point = center(bounds_m.group(1))
        if not point:
            continue
        x, y = point
        subprocess.run(["adb", "shell", "input", "tap", str(x), str(y)], check=True)
        print(f"Tapped '{text}' at {x},{y}")
        sys.exit(0)

sys.exit(1)
PY
}

open_settings() {
  tap_ratio 930 175
  sleep 2
}

open_language_picker() {
  tap_ratio 500 560
  sleep 2
}

select_picker_index() {
  local idx="$1"
  local i
  for ((i = 0; i < idx; i++)); do
    adb shell input keyevent 20
    sleep 0.4
  done
  adb shell input keyevent 66
  sleep 0.5
}

set_language() {
  local idx
  idx="$(lang_picker_index "$LANG_CODE")"
  if [[ "$idx" == "0" ]]; then
    echo "Default language is Japanese"
    return
  fi

  echo "Switching language to $LANG_CODE (picker index $idx)"
  open_settings
  open_language_picker
  select_picker_index "$idx"
  sleep 3
}

capture() {
  local name="$1"
  local path="$OUT_DIR/$name"
  adb exec-out screencap -p >"$path"
  echo "Saved $path"
}

capture_tab() {
  local tab_index="$1"
  local file_name="$2"
  local tab_count=6
  local rx=$(( (tab_index * 2 + 1) * 1000 / (tab_count * 2) ))
  tap_ratio "$rx" 175
  sleep 2
  capture "$file_name"
}

start_emulator
install_app
reset_app
launch_app
set_language

capture_tab 0 screen-notifications.png
capture_tab 1 screen-work-date.png
capture_tab 2 screen-commute-time.png
capture_tab 3 screen-attendance-history.png
capture_tab 4 screen-year-holidays.png
capture_tab 5 screen-settings.png

echo "Done: $OUT_DIR"
