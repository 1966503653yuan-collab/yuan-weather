#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
SDK="${ANDROID_HOME:?Set ANDROID_HOME to your Android SDK directory}"
BT="$SDK/build-tools/${ANDROID_BUILD_TOOLS:-35.0.0}"
JAR="$SDK/platforms/android-35/android.jar"
if [ -n "${JAVA_HOME:-}" ]; then export PATH="$JAVA_HOME/bin:$PATH"; fi
mkdir -p build/classes build/dex build/assets/web ../dist
cp ../web/dist/* build/assets/web/
"$BT/aapt2" compile --dir res -o build/resources.zip
"$BT/aapt2" link -o build/base.apk --manifest AndroidManifest.xml -I "$JAR" --java build/generated -A build/assets build/resources.zip
javac -source 8 -target 8 -classpath "$JAR" -d build/classes src/com/yuan/weather/MainActivity.java
"$BT/d8" --lib "$JAR" --min-api 26 --output build/dex build/classes/com/yuan/weather/*.class
cp build/base.apk build/unaligned.apk
(cd build/dex && zip -q ../unaligned.apk classes.dex)
"$BT/zipalign" -f 4 build/unaligned.apk build/aligned.apk
if [ -n "${YUAN_KEYSTORE:-}" ]; then
 : "${YUAN_KEY_ALIAS:?Set YUAN_KEY_ALIAS}"
 : "${YUAN_STORE_PASSWORD:?Set YUAN_STORE_PASSWORD}"
 : "${YUAN_KEY_PASSWORD:?Set YUAN_KEY_PASSWORD}"
 export YUAN_STORE_PASSWORD YUAN_KEY_PASSWORD
 "$BT/apksigner" sign --ks "$YUAN_KEYSTORE" --ks-key-alias "$YUAN_KEY_ALIAS" --ks-pass env:YUAN_STORE_PASSWORD --key-pass env:YUAN_KEY_PASSWORD --out ../dist/YuanWeather-1.8.0-Android.apk build/aligned.apk
 "$BT/apksigner" verify --verbose ../dist/YuanWeather-1.8.0-Android.apk
else
 cp build/aligned.apk ../dist/YuanWeather-1.8.0-Android-unsigned.apk
 echo "Unsigned APK created. Set YUAN_KEYSTORE and signing environment variables to create an installable APK."
fi
