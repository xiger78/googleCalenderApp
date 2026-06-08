#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/env.sh"

export JAVA_HOME="${JAVA_HOME:-/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

cd "$ROOT"

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "❌ Node.js 18 이상이 필요합니다."
  exit 1
fi

if [ ! -d android ]; then
  echo "📦 Android 네이티브 프로젝트 생성 중..."
  npx expo prebuild --platform android --no-install
fi

echo "🔨 APK 빌드 중..."
cd android
./gradlew assembleRelease

APK_SRC="app/build/outputs/apk/release/app-release.apk"
APK_DST="$ROOT/dist/출퇴근관리-v1.0.0.apk"
mkdir -p "$ROOT/dist"
cp "$APK_SRC" "$APK_DST"

echo "✅ APK 생성 완료: $APK_DST"
ls -lh "$APK_DST"
