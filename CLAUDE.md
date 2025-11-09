# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Nx monorepo workspace containing a Next.js application called `ikea-compare`. The project uses:

- Next.js 15.2.4 with React 19
- TypeScript with strict mode enabled
- Tailwind CSS for styling
- ESLint for linting
- Nx for monorepo management and task orchestration

## Project Structure

The workspace is organized as an Nx monorepo:

- `/apps/ikea-compare/` - The main Next.js application
  - `src/app/` - Next.js App Router directory with pages, layouts, and API routes
  - `src/app/api/` - API routes (e.g., `/api/hello`)
  - `public/` - Static assets
- Root-level configuration files apply to the entire workspace
- Workspace apps are defined in `apps/*` (see `package.json` workspaces)

## Common Commands

### Development

```bash
# Start development server
npx nx dev ikea-compare

# Build for production
npx nx build ikea-compare

# Start production server (requires build first)
npx nx start ikea-compare
```

### Code Quality

```bash
# Run ESLint
npx nx lint ikea-compare

# Type checking (if configured)
npx nx typecheck ikea-compare
```

### Nx Utilities

```bash
# Show all available targets for the project
npx nx show project ikea-compare

# View project details in browser
npx nx show project ikea-compare --web

# View dependency graph
npx nx graph

# See what's affected by changes
npx nx affected:graph
```

### Adding New Features

```bash
# Generate a new library
npx nx g @nx/react:lib mylib

# Generate a new Next.js component
npx nx g @nx/next:component path/to/component

# Generate a new Next.js library
npx nx g @nx/next:library ui
```

## TypeScript Configuration

The workspace uses a strict TypeScript configuration with:

- Strict mode enabled
- `noUnusedLocals`, `noImplicitReturns`, `noFallthroughCasesInSwitch` enabled
- Module resolution set to `bundler`
- Custom condition: `@ikea-compare/source`

Base TypeScript config is in `tsconfig.base.json`, with project-specific configs extending it.

## Architecture Notes

### Nx Workspace

- Tasks are inferred automatically by Nx plugins for Next.js and ESLint
- The `@nx/next/plugin` automatically configures build, dev, start, and serve-static targets
- Build tasks have dependency management with `build-deps` and `watch-deps` targets
- Caching is enabled for build and lint targets to improve performance

### Next.js Configuration

- The app uses Nx's Next.js plugin (`@nx/next`) via `withNx` in `next.config.js`
- Standard Next.js App Router structure (Next.js 15+)

### Package Management

- Root-level `package.json` contains all dependencies
- Individual app `package.json` files define app-specific metadata
- Yarn/npm workspaces are configured for `apps/*`

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
