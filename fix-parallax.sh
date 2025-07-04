#!/bin/bash

FILE_PATH="node_modules/react-parallax/@types/index.ts"

if [ -f "$FILE_PATH" ]; then
  echo "Fixing ReactNode import in $FILE_PATH"
  # Replace the problematic import with the fixed import
  sed -i 's/import React, { ReactNode } from '\''react'\'';/import React from '\''react'\'';\nimport type { ReactNode } from '\''react'\'';/g' "$FILE_PATH"
  echo "Fixed ReactNode import in $FILE_PATH"
else
  echo "File $FILE_PATH not found"
fi 