#!/usr/bin/env bash
# Node 20 + Android SDK 경로 설정
export PATH="$HOME/.nodebrew/node/v20.18.0/bin:$PATH"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
