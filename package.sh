#!/bin/bash

# Package script for Standup Timer Chrome Extension
# Creates a zip file ready for Chrome Web Store upload

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Extension name and version
EXTENSION_NAME="standup-timer"
VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)
ZIP_NAME="${EXTENSION_NAME}-v${VERSION}.zip"

echo -e "${GREEN}Packaging Standup Timer Extension v${VERSION}...${NC}"

# Remove old zip if it exists
if [ -f "$ZIP_NAME" ]; then
    echo -e "${YELLOW}Removing old package: $ZIP_NAME${NC}"
    rm "$ZIP_NAME"
fi

# Create a temporary directory for packaging
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo "Creating package in temporary directory..."

# Copy required files
echo "  - Copying manifest.json"
cp manifest.json "$TEMP_DIR/"

echo "  - Copying popup files"
cp popup.html popup.js "$TEMP_DIR/"

echo "  - Copying content script"
cp content.js "$TEMP_DIR/"

echo "  - Copying styles"
cp styles.css "$TEMP_DIR/"

echo "  - Copying privacy policy"
cp PRIVACY_POLICY.md "$TEMP_DIR/"

# Copy icons folder (only PNG files, exclude SVG and markdown)
echo "  - Copying icons"
mkdir -p "$TEMP_DIR/icons"
cp icons/icon16.png "$TEMP_DIR/icons/"
cp icons/icon48.png "$TEMP_DIR/icons/"
cp icons/icon128.png "$TEMP_DIR/icons/"

# Create zip file
echo -e "\n${GREEN}Creating zip file: $ZIP_NAME${NC}"
cd "$TEMP_DIR"
zip -r "$SCRIPT_DIR/$ZIP_NAME" . -q

# Clean up
cd "$SCRIPT_DIR"
rm -rf "$TEMP_DIR"

# Display package info
ZIP_SIZE=$(du -h "$ZIP_NAME" | cut -f1)
echo -e "${GREEN}✓ Package created successfully!${NC}"
echo -e "  File: ${GREEN}$ZIP_NAME${NC}"
echo -e "  Size: ${GREEN}$ZIP_SIZE${NC}"
echo -e "\n${YELLOW}Ready for Chrome Web Store upload!${NC}"



