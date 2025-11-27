# Icon Files

The extension includes icon files for the Chrome extension.

## Icon Files

The following icon files are included in the `icons/` folder:
- `icons/icon.svg` - Source SVG file
- `icons/icon16.png` (16x16 pixels) - Toolbar icon
- `icons/icon48.png` (48x48 pixels) - Extension management page icon
- `icons/icon128.png` (128x128 pixels) - Chrome Web Store icon

## Icon Design

The icon features a modern clock/timer design with:
- Blue color scheme matching the extension's UI (#5E6AD2)
- Clock face with hour and minute hands
- Play button overlay indicating timer functionality
- Clean, professional appearance suitable for all sizes

## Regenerating Icons

To regenerate the PNG files from the SVG source using ImageMagick:

```bash
cd icons
magick icon.svg -resize 16x16 icon16.png
magick icon.svg -resize 48x48 icon48.png
magick icon.svg -resize 128x128 icon128.png
```

Or using the deprecated `convert` command (if `magick` is not available):

```bash
cd icons
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png
```



