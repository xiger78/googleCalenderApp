#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/env.sh"

cd "$ROOT"

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "❌ Node.js 18 이상이 필요합니다. (현재: $(node -v))"
  echo "   nodebrew use v20.18.0 실행 후 다시 시도하세요."
  exit 1
fi

AVD="${ANDROID_AVD:-Nexus_5X_API_29_x86}"

if ! adb devices | grep -q "device$"; then
  echo "📱 Android 에뮬레이터 시작 중: $AVD"
  emulator -avd "$AVD" -no-snapshot-load -gpu swiftshader_indirect >/dev/null 2>&1 &
  echo "⏳ 에뮬레이터 부팅 대기 중..."
  adb wait-for-device
  for i in $(seq 1 60); do
    if adb shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; then
      break
    fi
    sleep 2
  done
fi

echo "🚀 Expo Android 실행"
npx expo start --android
