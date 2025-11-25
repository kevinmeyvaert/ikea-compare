#!/bin/bash

# Custom Vercel ignore script that handles shallow clones
# Exit 0 = skip build, Exit 1 = proceed with build

PROJECT="@ikea-compare/komprare-web"

echo "≫ Checking if $PROJECT is affected..."

# If VERCEL_GIT_PREVIOUS_SHA is not set or empty, always build
if [ -z "$VERCEL_GIT_PREVIOUS_SHA" ]; then
  echo "✅ No previous SHA found - proceeding with build"
  exit 1
fi

# Try to fetch the base commit if it doesn't exist locally
if ! git cat-file -e "$VERCEL_GIT_PREVIOUS_SHA" 2>/dev/null; then
  echo "≫ Base commit not found locally, fetching from origin..."
  git fetch --depth=1 origin "$VERCEL_GIT_PREVIOUS_SHA" 2>/dev/null || true
fi

# Check if the commit exists now
if ! git cat-file -e "$VERCEL_GIT_PREVIOUS_SHA" 2>/dev/null; then
  echo "✅ Could not fetch base commit - proceeding with build"
  exit 1
fi

# Run nx affected to check if project is affected
echo "≫ Comparing $VERCEL_GIT_PREVIOUS_SHA...$VERCEL_GIT_COMMIT_SHA"
AFFECTED=$(npx nx show projects --affected --base="$VERCEL_GIT_PREVIOUS_SHA" --head="$VERCEL_GIT_COMMIT_SHA" 2>/dev/null)

if echo "$AFFECTED" | grep -q "$PROJECT"; then
  echo "✅ $PROJECT is affected - proceeding with build"
  exit 1
else
  echo "🛑 $PROJECT is not affected - skipping build"
  exit 0
fi
