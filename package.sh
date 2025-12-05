#!/bin/bash

# Package script for Standup Timer Chrome Extension
# Creates a zip file ready for Chrome Web Store upload
# Handles version bumping and git tagging

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Extension name
EXTENSION_NAME="standup-timer"

# Function to get current version from manifest
get_current_version() {
    grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4
}

# Function to bump version
bump_version() {
    local version=$1
    local bump_type=$2

    IFS='.' read -r -a parts <<< "$version"
    local major="${parts[0]}"
    local minor="${parts[1]}"
    local patch="${parts[2]}"

    case $bump_type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            echo -e "${RED}Invalid bump type. Use: major, minor, or patch${NC}"
            exit 1
            ;;
    esac

    echo "${major}.${minor}.${patch}"
}

# Function to update version in manifest.json
update_manifest_version() {
    local new_version=$1
    sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"${new_version}\"/" manifest.json
    rm manifest.json.bak
}

# Check if we should bump version
BUMP_TYPE=""
if [ "$1" == "major" ] || [ "$1" == "minor" ] || [ "$1" == "patch" ]; then
    BUMP_TYPE=$1
fi

# Get current version
VERSION=$(get_current_version)

# Check if there are changes compared to the last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -n "$LAST_TAG" ]; then
    # Remove 'v' prefix if present
    LAST_TAG_VERSION=${LAST_TAG#v}

    if git diff --quiet "${LAST_TAG}" HEAD 2>/dev/null; then
        echo -e "${YELLOW}No changes detected since last tag (${LAST_TAG})${NC}"
        if [ -z "$BUMP_TYPE" ]; then
            echo -e "${YELLOW}Skipping version bump. Use './package.sh [major|minor|patch]' to force a version bump.${NC}"
        fi
    else
        echo -e "${GREEN}Changes detected since last tag (${LAST_TAG})${NC}"
        if [ -z "$BUMP_TYPE" ]; then
            BUMP_TYPE="patch"
            echo -e "${YELLOW}Auto-bumping patch version...${NC}"
        fi
    fi
else
    echo -e "${YELLOW}No previous tags found.${NC}"
fi

# Bump version if needed
if [ -n "$BUMP_TYPE" ]; then
    NEW_VERSION=$(bump_version "$VERSION" "$BUMP_TYPE")
    echo -e "${GREEN}Bumping version: ${VERSION} -> ${NEW_VERSION} (${BUMP_TYPE})${NC}"
    update_manifest_version "$NEW_VERSION"
    VERSION=$NEW_VERSION
fi

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

# Git operations: commit version changes and create tag
if [ -n "$BUMP_TYPE" ]; then
    echo -e "\n${GREEN}Creating git tag v${VERSION}...${NC}"

    # Check if manifest.json has changes to commit
    if ! git diff --quiet manifest.json 2>/dev/null; then
        echo -e "${YELLOW}Committing version bump to git...${NC}"
        git add manifest.json
        git commit -m "Bump version to ${VERSION}"
    fi

    # Create and push tag
    if git rev-parse "v${VERSION}" >/dev/null 2>&1; then
        echo -e "${YELLOW}Tag v${VERSION} already exists${NC}"
    else
        git tag -a "v${VERSION}" -m "Release version ${VERSION}"
        echo -e "${GREEN}✓ Created tag v${VERSION}${NC}"
    fi

    # Ask if user wants to push
    echo -e "\n${YELLOW}Push changes and tags to remote? (y/n)${NC}"
    read -r PUSH_CONFIRM
    if [ "$PUSH_CONFIRM" == "y" ] || [ "$PUSH_CONFIRM" == "Y" ]; then
        git push origin main
        git push origin "v${VERSION}"
        echo -e "${GREEN}✓ Pushed to remote${NC}"
    else
        echo -e "${YELLOW}Skipped push. To push manually run:${NC}"
        echo -e "  git push origin main"
        echo -e "  git push origin v${VERSION}"
    fi
fi

echo -e "\n${YELLOW}Ready for Chrome Web Store upload!${NC}"



