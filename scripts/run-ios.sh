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

XCODE_VERSION=$(xcodebuild -version 2>/dev/null | head -1 | awk '{print $2}' || echo "0")
XCODE_MAJOR=$(echo "$XCODE_VERSION" | cut -d. -f1)

if [ "$XCODE_MAJOR" -lt 14 ]; then
  echo "❌ iOS 시뮬레이터 실행에 Xcode 14.1 이상이 필요합니다."
  echo "   현재 Xcode: $XCODE_VERSION"
  echo "   App Store에서 Xcode를 업데이트하거나 Android 에뮬레이터를 사용하세요:"
  echo "   npm run android:emu"
  exit 1
fi

echo "🚀 Expo iOS 실행"
npx expo start --ios
