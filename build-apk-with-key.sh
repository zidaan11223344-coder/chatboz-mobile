#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' 'بناء شات باز عبر Expo EAS'
printf '%s' 'ألصق مفتاح الوصول EXPO_TOKEN ثم اضغط Enter: '
read -r -s EXPO_TOKEN_INPUT
printf '\n'

if [[ -z "${EXPO_TOKEN_INPUT}" ]]; then
  echo 'لم يتم إدخال مفتاح وصول.' >&2
  exit 1
fi

export EXPO_TOKEN="${EXPO_TOKEN_INPUT}"
unset EXPO_TOKEN_INPUT

if ! command -v npx >/dev/null 2>&1; then
  echo 'Node.js و npm مطلوبان.' >&2
  exit 1
fi

npx --yes eas-cli@23.0.0 whoami
npx --yes eas-cli@23.0.0 build --platform android --profile preview

unset EXPO_TOKEN
echo 'تم إرسال البناء إلى EAS. افتح الرابط الذي يظهر في الطرفية لتنزيل APK.'
