# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KOMPRÅRE (formerly ikea-compare) is an IKEA price comparison tool built as an Nx monorepo. The project enables users to compare IKEA product prices across Belgium, Netherlands, France, and Germany through multiple interfaces:

- **Next.js Web App** (`komprare-web`) - Main web application for product comparison
- **Chrome Extension** (`komprare-chrome-extension`) - Browser extension for on-site price comparison

Tech stack:
- Next.js 15.2.5 with React 19 and App Router
- TypeScript 5.9 with strict mode
- Tailwind CSS 3.4.3 for styling
- Firebase 12.5.0 (Firestore, Auth, Analytics)
- Nx 22.0.2 for monorepo management
- Webpack for Chrome extension bundling

## Workspace Structure

```
apps/
  ├── komprare-web/              # Next.js web application
  └── komprare-chrome-extension/ # Chrome extension (Manifest V3)

libs/
  ├── types/        # Shared TypeScript types (stores, products, scrapers)
  ├── scrapers/     # IKEA web scraping logic (axios + cheerio)
  └── firebase/     # Firebase services (auth, analytics, Firestore)
```

### Dependency Graph

```
komprare-web ──────┬──> @ikea-compare/firebase ──> @ikea-compare/types
                   └──> @ikea-compare/scrapers ──> @ikea-compare/types

komprare-chrome-extension ──┬──> @ikea-compare/firebase ──> @ikea-compare/types
                            └──> @ikea-compare/scrapers ──> @ikea-compare/types
```

## Common Commands

### Development

```bash
# Web app development
npx nx dev komprare-web          # Start dev server (localhost:3000)

# Chrome extension development
npx nx build komprare-chrome-extension               # Development build
npx nx build komprare-chrome-extension --prod        # Production build
npx nx package komprare-chrome-extension             # Build + create zip
```

### Production Builds

```bash
# Web app production build
npx nx build komprare-web

# Chrome extension release
npx nx zip komprare-chrome-extension     # Creates ikea-extension-v1.0.0.zip
```

### Code Quality

```bash
# Linting
npx nx lint komprare-web
npx nx lint komprare-chrome-extension
npx nx lint scrapers

# Type checking
npx nx typecheck types
npx nx typecheck scrapers
npx nx typecheck firebase

# Run affected tasks only
npx nx affected:lint
npx nx affected:test
```

### Library Builds

```bash
# Build shared libraries (required before building apps)
npx nx build types
npx nx build scrapers

# Build with dependencies
npx nx build komprare-web     # Automatically builds deps first
```

## Architecture Details

### Workspace Libraries

#### `@ikea-compare/types`
Central type definitions shared across all apps and libraries:
- Store types (`IkeaStore`, `StorePreferences`, `StoreAvailability`)
- Product types (`ProductData`, `ProductComparisonResult`)
- Scraper types (`ScraperResult`, `ScraperError`)
- Shopping list types (`ShoppingListAnalysis`)

**Important**: This is the single source of truth for types. Other libs/apps import from here, not from local type files.

#### `@ikea-compare/scrapers`
IKEA website scraping functionality:
- `scrapeIkeaProduct()` - Extracts product data from IKEA pages
- `isScraperError()` - Type guard for error handling
- Uses `axios` for HTTP requests (server-side)
- Uses `cheerio` for HTML parsing (server-side)
- Supports BE, NL, FR, DE country codes

**Architecture note**: The web app uses this in API routes (server-side), while the Chrome extension uses it in the service worker (browser context with native `fetch`).

#### `@ikea-compare/firebase`
Firebase integration layer:
- **Authentication**: Anonymous auth with `initializeAnonymousAuth()`
- **Analytics**: Optional analytics via `initializeFirebaseServices({ enableAnalytics: true })`
  - Web app enables analytics
  - Chrome extension disables analytics (not supported in extension context)
- **Firestore**: User data, store preferences, search history, favorites
- **Store Management**: Multi-country store selection and persistence

**Key exports**:
- `initializeFirebaseServices(options)` - Initialize Firebase with optional analytics
- `logAnalyticsEvent(name, params)` - Safe analytics wrapper (no-op if disabled)
- Store managers: `getSelectedStore()`, `setSelectedStore()`, `getStoresByCountry()`
- User data: `addToHistory()`, `addToFavorites()`, `getRecentSearches()`

### Next.js Configuration

The web app requires special configuration for workspace libraries:

```javascript
// next.config.js
{
  transpilePackages: ['@ikea-compare/scrapers', '@ikea-compare/types', '@ikea-compare/firebase'],
  // Required to resolve and bundle workspace packages
}
```

**TypeScript paths** must be configured in `tsconfig.json`:
```json
{
  "paths": {
    "@ikea-compare/types": ["../../libs/types/src/index.ts"],
    "@ikea-compare/scrapers": ["../../libs/scrapers/src/index.ts"],
    "@ikea-compare/firebase": ["../../libs/firebase/src/index.ts"]
  }
}
```

**Important**: Remove `rootDir` from tsconfig to allow imports from workspace packages outside the app's source directory.

### Chrome Extension Architecture

The extension uses Manifest V3 with multiple entry points:

- `sw.ts` - Service worker (background script) handles API calls and scraping
- `ikea-extension.content_script.ts` - Injected into IKEA pages for UI overlay
- `popup.ts` - Extension popup UI
- `options.ts` - Extension settings page

**Webpack configuration** (`webpack.config.js`):
- Custom resolve aliases for `@ikea-compare/*` packages
- Loads environment variables from `../komprare-web/.env.local`
- TypeScript project references required in `tsconfig.json`

### Firebase Analytics

Analytics is **conditionally initialized**:

**Web App**:
```typescript
// In layout.tsx - client component
import { FirebaseInit } from './components/FirebaseInit';

// FirebaseInit calls:
initializeFirebaseServices({ enableAnalytics: true });
```

**Chrome Extension**:
```typescript
// No explicit initialization needed - analytics disabled by default
// Firebase auto-initializes with enableAnalytics: false
```

**Usage in both**:
```typescript
import { logAnalyticsEvent } from '@ikea-compare/firebase';

// Safe to call - no-op if analytics disabled
logAnalyticsEvent('product_compared', { product_id: '12345' });
```

### TypeScript Module Resolution

All workspace libraries use `moduleResolution: "bundler"` (not `nodenext`) to avoid requiring `.js` extensions on imports:

```json
// libs/*/tsconfig.lib.json
{
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler"  // Not "nodenext"
  }
}
```

### Tailwind CSS Setup

The web app requires:
1. **postcss.config.js** in the app root:
   ```javascript
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   };
   ```
2. **tailwind.config.js** with correct content paths:
   ```javascript
   content: [
     './src/**/*.{ts,tsx,js,jsx,html}',
     // Not './pages/**/*' - uses App Router
   ]
   ```
3. **global.css** with Tailwind directives:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

## Naming Conventions

- **Project scope**: `@ikea-compare/*` (all workspace packages)
- **App names**: `komprare-web`, `komprare-chrome-extension`
- **Library names**: `types`, `scrapers`, `firebase` (without scope in folder names)
- **Import paths**: Always use scope: `@ikea-compare/types`, never relative paths across packages

## Common Issues & Solutions

### "Module not found: @ikea-compare/..."

1. Ensure `transpilePackages` in `next.config.js` includes the package
2. Add TypeScript path mapping in `tsconfig.json`
3. Remove `rootDir` from tsconfig if present
4. Check library has been built: `npx nx build <lib-name>`

### "Relative import paths need explicit file extensions"

Change `moduleResolution` from `nodenext` to `bundler` in the library's `tsconfig.lib.json`.

### Tailwind styles not working

1. Ensure `postcss.config.js` exists in app root
2. Restart dev server after adding PostCSS config
3. Verify `tailwind.config.js` content paths are correct

### Chrome extension build errors

1. Check webpack resolve aliases point to correct library paths
2. Ensure TypeScript project references include all used libs
3. Verify `.env.local` path in webpack config: `../komprare-web/.env.local`

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->
