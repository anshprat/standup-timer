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

# Function to categorize commit message
categorize_commit() {
    local message=$1
    local lower_msg=$(echo "$message" | tr '[:upper:]' '[:lower:]')

    # Check for conventional commit prefixes or keywords
    if echo "$lower_msg" | grep -qE '^(feat|feature):|add:|added:' || echo "$lower_msg" | grep -qiE '^add |^added '; then
        echo "Added"
    elif echo "$lower_msg" | grep -qE '^(fix|bugfix):|fixed:' || echo "$lower_msg" | grep -qiE '^fix |^fixed |^bugfix'; then
        echo "Fixed"
    elif echo "$lower_msg" | grep -qE '^(chore|refactor|perf|style):|changed:' || echo "$lower_msg" | grep -qiE '^change |^changed |^refactor|^update |^updated '; then
        echo "Changed"
    elif echo "$lower_msg" | grep -qE '^(remove|delete):|removed:' || echo "$lower_msg" | grep -qiE '^remove |^removed |^delete '; then
        echo "Removed"
    else
        echo "Changed"
    fi
}

# Function to clean up commit message
clean_commit_message() {
    local message=$1
    # Remove conventional commit prefixes
    message=$(echo "$message" | sed -E 's/^(feat|feature|fix|bugfix|chore|refactor|perf|style|remove|delete|docs|test|build|ci)(\([^)]*\))?:\s*//')
    # Remove common prefixes like "add:", "added:", "fix:", "fixed:", etc.
    message=$(echo "$message" | sed -E 's/^(add|added|fix|fixed|change|changed|update|updated|remove|removed|delete|deleted):\s*//i')
    # Capitalize first letter (using awk for cross-platform compatibility)
    message=$(echo "$message" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')
    echo "$message"
}

# Function to update CHANGELOG.md
update_changelog() {
    local version=$1
    local date=$(date +%Y-%m-%d)

    if [ ! -f CHANGELOG.md ]; then
        echo -e "${YELLOW}CHANGELOG.md not found. Skipping changelog update.${NC}"
        return
    fi

    # Get commits since last tag
    local commit_range
    if [ -n "$LAST_TAG" ]; then
        commit_range="${LAST_TAG}..HEAD"
    else
        commit_range="HEAD"
    fi

    # Extract commit messages (exclude merge commits and version bump commits)
    local commits=$(git log "$commit_range" --no-merges --pretty=format:"%s" | grep -v -E "^(Bump version|Release version|Merge)")

    if [ -z "$commits" ]; then
        echo -e "${YELLOW}No commits found to generate changelog. Skipping.${NC}"
        return
    fi

    # Categorize commits (using separate variables for bash 3.2 compatibility)
    local added_commits=""
    local fixed_commits=""
    local changed_commits=""
    local removed_commits=""

    while IFS= read -r commit; do
        if [ -n "$commit" ]; then
            category=$(categorize_commit "$commit")
            cleaned_message=$(clean_commit_message "$commit")

            case $category in
                "Added")
                    if [ -n "$added_commits" ]; then
                        added_commits="${added_commits}"$'\n'"- $cleaned_message"
                    else
                        added_commits="- $cleaned_message"
                    fi
                    ;;
                "Fixed")
                    if [ -n "$fixed_commits" ]; then
                        fixed_commits="${fixed_commits}"$'\n'"- $cleaned_message"
                    else
                        fixed_commits="- $cleaned_message"
                    fi
                    ;;
                "Changed")
                    if [ -n "$changed_commits" ]; then
                        changed_commits="${changed_commits}"$'\n'"- $cleaned_message"
                    else
                        changed_commits="- $cleaned_message"
                    fi
                    ;;
                "Removed")
                    if [ -n "$removed_commits" ]; then
                        removed_commits="${removed_commits}"$'\n'"- $cleaned_message"
                    else
                        removed_commits="- $cleaned_message"
                    fi
                    ;;
            esac
        fi
    done <<< "$commits"

    # Build changelog entry
    local changes=""
    if [ -n "$added_commits" ]; then
        changes="${changes}### Added"$'\n'
        changes="${changes}$added_commits"$'\n'
        changes="${changes}"$'\n'
    fi
    if [ -n "$fixed_commits" ]; then
        changes="${changes}### Fixed"$'\n'
        changes="${changes}$fixed_commits"$'\n'
        changes="${changes}"$'\n'
    fi
    if [ -n "$changed_commits" ]; then
        changes="${changes}### Changed"$'\n'
        changes="${changes}$changed_commits"$'\n'
        changes="${changes}"$'\n'
    fi
    if [ -n "$removed_commits" ]; then
        changes="${changes}### Removed"$'\n'
        changes="${changes}$removed_commits"$'\n'
        changes="${changes}"$'\n'
    fi

    if [ -z "$changes" ]; then
        echo -e "${YELLOW}No changes to add to changelog. Skipping.${NC}"
        return
    fi

    echo -e "\n${GREEN}Generated changelog entries from commits:${NC}"
    echo "$changes"

    echo -e "${YELLOW}Do you want to edit these entries before adding to CHANGELOG? (y/n)${NC}"
    read -r EDIT_CONFIRM

    if [ "$EDIT_CONFIRM" == "y" ] || [ "$EDIT_CONFIRM" == "Y" ]; then
        # Create temp file with generated changes
        TEMP_CHANGES=$(mktemp)
        echo "$changes" > "$TEMP_CHANGES"

        # Open in editor
        ${EDITOR:-vi} "$TEMP_CHANGES"

        # Read edited content
        changes=$(cat "$TEMP_CHANGES")
        rm "$TEMP_CHANGES"
    fi

    # Create temp file with new entry
    TEMP_CHANGELOG=$(mktemp)
    TEMP_CHANGES_FILE=$(mktemp)

    # Write changes to a temp file to avoid awk newline issues
    echo "$changes" > "$TEMP_CHANGES_FILE"

    # Find the line with "## [" to insert after header
    awk -v version="$version" -v date="$date" -v changes_file="$TEMP_CHANGES_FILE" '
        /^## \[/ && !inserted {
            print "## [" version "] - " date
            print ""
            while ((getline line < changes_file) > 0) {
                print line
            }
            close(changes_file)
            inserted=1
        }
        {print}
    ' CHANGELOG.md > "$TEMP_CHANGELOG"

    mv "$TEMP_CHANGELOG" CHANGELOG.md
    rm "$TEMP_CHANGES_FILE"
    echo -e "${GREEN}✓ Updated CHANGELOG.md${NC}"
}

# Bump version if needed
if [ -n "$BUMP_TYPE" ]; then
    NEW_VERSION=$(bump_version "$VERSION" "$BUMP_TYPE")
    echo -e "${GREEN}Bumping version: ${VERSION} -> ${NEW_VERSION} (${BUMP_TYPE})${NC}"
    update_manifest_version "$NEW_VERSION"
    VERSION=$NEW_VERSION

    # Check if CHANGELOG.md was modified since last tag
    CHANGELOG_MODIFIED=false
    if [ -n "$LAST_TAG" ] && [ -f "CHANGELOG.md" ]; then
        if ! git diff --quiet "${LAST_TAG}" HEAD -- CHANGELOG.md 2>/dev/null; then
            CHANGELOG_MODIFIED=true
            echo -e "${GREEN}CHANGELOG.md has been updated since last tag${NC}"
        fi
    fi

    # Only update changelog if it wasn't manually modified
    if [ "$CHANGELOG_MODIFIED" = false ]; then
        update_changelog "$VERSION"
    else
        echo -e "${YELLOW}Skipping changelog update (already modified manually)${NC}"
    fi
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

    # Check if manifest.json or CHANGELOG.md has changes to commit
    if ! git diff --quiet manifest.json CHANGELOG.md 2>/dev/null; then
        echo -e "${YELLOW}Committing version bump to git...${NC}"
        git add manifest.json CHANGELOG.md
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





