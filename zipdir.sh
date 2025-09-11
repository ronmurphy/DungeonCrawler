#!/bin/bash

# zipdir.sh - Archive a directory as tar.gz or zip
# Usage: ./zipdir.sh <directory> [format]
# Format can be 'tar' or 'zip' (default: tar)

# Check if directory argument is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <directory> [format]"
    echo "Format options: tar (default), zip"
    echo "Example: $0 Test"
    echo "Example: $0 Test zip"
    exit 1
fi

# Get the directory name and format
DIR_NAME="$1"
FORMAT="${2:-tar}"  # Default to tar if no format specified

# Check if the directory exists
if [ ! -d "$DIR_NAME" ]; then
    echo "Error: Directory '$DIR_NAME' does not exist."
    exit 1
fi

# Get the current timestamp for unique filenames (optional)
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

case "$FORMAT" in
    "tar"|"tar.gz"|"tgz")
        ARCHIVE_NAME="${DIR_NAME}.tar.gz"
        echo "Creating tar.gz archive: $ARCHIVE_NAME"
        tar -czf "$ARCHIVE_NAME" "$DIR_NAME"
        if [ $? -eq 0 ]; then
            echo "Successfully created: $ARCHIVE_NAME"
            echo "Size: $(du -h "$ARCHIVE_NAME" | cut -f1)"
        else
            echo "Error creating tar.gz archive"
            exit 1
        fi
        ;;
    "zip")
        ARCHIVE_NAME="${DIR_NAME}.zip"
        echo "Creating zip archive: $ARCHIVE_NAME"
        zip -r "$ARCHIVE_NAME" "$DIR_NAME"
        if [ $? -eq 0 ]; then
            echo "Successfully created: $ARCHIVE_NAME"
            echo "Size: $(du -h "$ARCHIVE_NAME" | cut -f1)"
        else
            echo "Error creating zip archive"
            exit 1
        fi
        ;;
    *)
        echo "Error: Unsupported format '$FORMAT'"
        echo "Supported formats: tar, zip"
        exit 1
        ;;
esac