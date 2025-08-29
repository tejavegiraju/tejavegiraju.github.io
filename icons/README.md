# Icon Generation Instructions

To generate the required PWA icons from the SVG file, you can use one of these methods:

## Method 1: Using ImageMagick (Recommended)
If you have ImageMagick installed, run these commands in the icons directory:

```bash
# Convert SVG to PNG at various sizes
magick icon.svg -resize 16x16 icon-16x16.png
magick icon.svg -resize 32x32 icon-32x32.png
magick icon.svg -resize 72x72 icon-72x72.png
magick icon.svg -resize 96x96 icon-96x96.png
magick icon.svg -resize 128x128 icon-128x128.png
magick icon.svg -resize 144x144 icon-144x144.png
magick icon.svg -resize 152x152 icon-152x152.png
magick icon.svg -resize 180x180 icon-180x180.png
magick icon.svg -resize 192x192 icon-192x192.png
magick icon.svg -resize 384x384 icon-384x384.png
magick icon.svg -resize 512x512 icon-512x512.png
```

## Method 2: Using Inkscape
If you have Inkscape installed:

```bash
# Convert SVG to PNG at various sizes
inkscape --export-png=icon-16x16.png --export-width=16 --export-height=16 icon.svg
inkscape --export-png=icon-32x32.png --export-width=32 --export-height=32 icon.svg
# ... repeat for other sizes
```

## Method 3: Online Tools
You can also use online tools like:
- favicon.io
- realfavicongenerator.net
- png-pixel.com

## Method 4: Design Software
Open the SVG in:
- Adobe Illustrator
- Figma
- Canva
- GIMP

Export at the required sizes listed above.

## Required Sizes
- 16x16 (favicon)
- 32x32 (favicon)
- 72x72 (mobile)
- 96x96 (mobile)
- 128x128 (mobile)
- 144x144 (Windows tile)
- 152x152 (iOS)
- 180x180 (iOS)
- 192x192 (Android)
- 384x384 (Android)
- 512x512 (splash screen)
