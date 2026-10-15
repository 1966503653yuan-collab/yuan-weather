#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
APP='../dist/源的天气.app'
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources/web" build
cp ../web/dist/* "$APP/Contents/Resources/web/"
cp desktop/* "$APP/Contents/Resources/web/"
python3 - "$APP/Contents/Resources/web/index.html" <<'PYCODE'
import sys
p=sys.argv[1]
s=open(p).read().replace('</head>','<link rel="stylesheet" href="desktop.css"></head>').replace('</body>','<script type="module" src="desktop.js"></script></body>')
open(p,'w').write(s)
PYCODE
cp AppIcon.icns "$APP/Contents/Resources/AppIcon.icns"
cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleExecutable</key><string>YuanWeather</string><key>CFBundleIdentifier</key><string>com.yuan.weather.mac</string><key>CFBundleName</key><string>源的天气</string><key>CFBundleDisplayName</key><string>源的天气</string><key>CFBundleVersion</key><string>10</string><key>CFBundleShortVersionString</key><string>1.8.0</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleIconFile</key><string>AppIcon</string><key>LSMinimumSystemVersion</key><string>14.0</string><key>NSHighResolutionCapable</key><true/><key>NSAppTransportSecurity</key><dict><key>NSAllowsLocalNetworking</key><true/></dict></dict></plist>
PLIST
SDK="${SDKROOT:-$(xcrun --sdk macosx --show-sdk-path)}"
for arch in arm64 x86_64; do
 swiftc main.swift -sdk "$SDK" -target "$arch-apple-macos14.0" -O -o "build/YuanWeather-$arch" -module-cache-path build/module-cache
done
lipo -create build/YuanWeather-arm64 build/YuanWeather-x86_64 -output "$APP/Contents/MacOS/YuanWeather"
codesign --force --deep --sign - "$APP"
codesign --verify --deep --strict "$APP"
