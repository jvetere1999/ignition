#!/bin/bash
# Create valid icon files for Tauri bundling
# This script generates PNG, ICO, and ICNS files from a base image

set -e

ICONS_DIR="$(dirname "$0")/icons"
mkdir -p "$ICONS_DIR"

# Use ImageMagick if available to create real icons from the base PNG
# Otherwise use placeholder approach

# Create a simple DAW Watcher icon (blue waveform-like design) as SVG
SVG_CONTENT='<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" fill="#1E293B"/>
  <path d="M40 128L70 100L100 128L130 100L160 128L190 100L220 128" stroke="#3B82F6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="40" cy="128" r="3" fill="#3B82F6"/>
  <circle cx="70" cy="100" r="3" fill="#3B82F6"/>
  <circle cx="100" cy="128" r="3" fill="#3B82F6"/>
  <circle cx="130" cy="100" r="3" fill="#3B82F6"/>
  <circle cx="160" cy="128" r="3" fill="#3B82F6"/>
  <circle cx="190" cy="100" r="3" fill="#3B82F6"/>
  <circle cx="220" cy="128" r="3" fill="#3B82F6"/>
</svg>'

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
    echo "Using ImageMagick to generate icons..."
    
    # Create temporary SVG file
    TEMP_SVG=$(mktemp)
    echo "$SVG_CONTENT" > "$TEMP_SVG"
    
    # Generate PNG files at various sizes
    convert "$TEMP_SVG" -background none -size 32x32 "$ICONS_DIR/32x32.png"
    echo "Created 32x32.png"
    
    convert "$TEMP_SVG" -background none -size 128x128 "$ICONS_DIR/128x128.png"
    echo "Created 128x128.png"
    
    convert "$TEMP_SVG" -background none -size 256x256 "$ICONS_DIR/128x128@2x.png"
    echo "Created 128x128@2x.png"
    
    # Generate ICO file
    convert "$TEMP_SVG" -background none -define icon:auto-resize=256,128,96,64,48,32,16 "$ICONS_DIR/icon.ico"
    echo "Created icon.ico"
    
    # Generate ICNS file (macOS)
    # First create multi-resolution PNG
    convert "$TEMP_SVG" -background none -size 512x512 "$ICONS_DIR/icon_512.png"
    
    # Use sips to convert to ICNS if on macOS
    if command -v sips &> /dev/null; then
        # Create ICNS from PNG
        sips -s format icns "$ICONS_DIR/icon_512.png" --out "$ICONS_DIR/icon.icns" 2>/dev/null || \
        # Fallback: create minimal ICNS using iconutil if available
        (mkdir -p "$ICONS_DIR/AppIcon.iconset" && \
         convert "$TEMP_SVG" -background none -size 16x16 "$ICONS_DIR/AppIcon.iconset/icon_16x16.png" && \
         convert "$TEMP_SVG" -background none -size 32x32 "$ICONS_DIR/AppIcon.iconset/icon_32x32.png" && \
         convert "$TEMP_SVG" -background none -size 64x64 "$ICONS_DIR/AppIcon.iconset/icon_64x64.png" && \
         convert "$TEMP_SVG" -background none -size 128x128 "$ICONS_DIR/AppIcon.iconset/icon_128x128.png" && \
         convert "$TEMP_SVG" -background none -size 256x256 "$ICONS_DIR/AppIcon.iconset/icon_256x256.png" && \
         convert "$TEMP_SVG" -background none -size 512x512 "$ICONS_DIR/AppIcon.iconset/icon_512x512.png" && \
         iconutil -c icns "$ICONS_DIR/AppIcon.iconset" -o "$ICONS_DIR/icon.icns" && \
         rm -rf "$ICONS_DIR/AppIcon.iconset")
        echo "Created icon.icns"
    else
        echo "Warning: sips/iconutil not available, creating minimal ICNS..."
        # Fallback: copy PNG as ICNS (will work but not ideal)
        cp "$ICONS_DIR/icon_512.png" "$ICONS_DIR/icon.icns"
    fi
    
    # Tray icon (smaller, system tray appropriate)
    convert "$TEMP_SVG" -background none -size 32x32 "$ICONS_DIR/tray_icon.png"
    echo "Created tray_icon.png"
    
    # Cleanup
    rm "$TEMP_SVG" "$ICONS_DIR/icon_512.png" 2>/dev/null || true
    
else
    echo "ImageMagick not found, using minimal placeholder icons..."
    
    # Fallback: create minimal valid PNG files using base64
    # Minimal transparent 1x1 PNG
    PNG_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNgYPhfDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    for file in 32x32.png 128x128.png 128x128@2x.png tray_icon.png; do
        echo "$PNG_BASE64" | base64 -d > "$ICONS_DIR/$file"
        echo "Created $file (placeholder)"
    done
    
    # Create minimal ICO file
    # ICO file format with single 32x32 image
    printf '\x00\x00\x01\x00\x01\x00\x20\x20\x00\x00\x01\x00\x18\x00\x48\x00\x00\x00\x16\x00\x00\x00' > "$ICONS_DIR/icon.ico"
    echo "Created icon.ico (placeholder)"
    
    # Create minimal ICNS file (macOS Icon format)
    # Minimal ICNS with single 32x32 image
    printf '\x00\x00\x00\x20icns' > "$ICONS_DIR/icon.icns"
    echo "Created icon.icns (placeholder)"
fi

echo ""
echo "Icon files created in $ICONS_DIR:"
ls -lh "$ICONS_DIR"/*.png "$ICONS_DIR"/*.ico "$ICONS_DIR"/*.icns 2>/dev/null || echo "(Some files may be missing)"
