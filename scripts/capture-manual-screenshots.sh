#!/usr/bin/env bash
# Capture manual screenshots for a given language (ja|zh|ko|en).
# Usage: bash scripts/capture-manual-screenshots.sh zh
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
  adb install -r "$apk"
}

launch_app() {
  adb shell am force-stop "$PACKAGE" >/dev/null 2>&1 || true
  adb shell am start -n "$ACTIVITY" >/dev/null
  sleep 4
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

swipe_left() {
  local size
  size="$(get_size)"
  local w="${size%x*}"
  local h="${size#*x}"
  adb shell input swipe $((w * 80 / 100)) $((h / 2)) $((w * 20 / 100)) $((h / 2)) 300
  sleep 1
}

capture() {
  local name="$1"
  local path="$OUT_DIR/$name"
  adb exec-out screencap -p >"$path"
  echo "Saved $path"
}

set_language() {
  local idx
  idx="$(lang_picker_index "$LANG_CODE")"
  echo "Switching language to $LANG_CODE (picker index $idx)"
  tap_ratio 920 175
  sleep 2
  tap_ratio 500 430
  sleep 1
  for ((i = 0; i < idx; i++)); do
    adb shell input keyevent 20
    sleep 0.3
  done
  adb shell input keyevent 66
  sleep 2
}

capture_tab() {
  local tab_index="$1"
  local file_name="$2"
  local rx=$((70 + tab_index * 145))
  if ((rx > 930)); then
    rx=930
  fi
  tap_ratio "$rx" 175
  sleep 2
  capture "$file_name"
}

start_emulator
install_app
launch_app
set_language

capture_tab 0 screen-notifications.png
capture_tab 1 screen-work-date.png
capture_tab 2 screen-commute-time.png
capture_tab 3 screen-attendance-history.png
capture_tab 4 screen-year-holidays.png
capture_tab 5 screen-settings.png

echo "Done: $OUT_DIR"
