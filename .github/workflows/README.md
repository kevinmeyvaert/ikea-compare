# GitHub Actions Workflows

This directory contains automated workflows for CI/CD pipelines.

## Workflows

### CI Workflow (`ci.yml`)

**Triggers:**
- Push to `main` branch
- Pull requests to any branch

**What it does:**
1. **Affected Linting** - Runs ESLint on all projects affected by changes
2. **Affected Type Checking** - Runs TypeScript type checking on affected projects
3. **Affected Tests** - Runs Jest tests for all affected projects with coverage
4. **Affected Builds** - Builds all affected projects to ensure they compile successfully

**Key features:**
- Uses `nx affected` to run only tasks for changed projects (efficient CI)
- Runs tasks in parallel (`--parallel=3`) for faster execution
- Fetches full git history for accurate change detection
- Uploads test coverage to Codecov (optional)
- Prevents merging if uncommitted changes detected after build
- Cancels previous runs on the same PR to save resources

**Nx Affected Commands:**
The workflow uses Nx's intelligent change detection to run only what's necessary:
```bash
npx nx affected --target=test --parallel=3
npx nx affected --target=lint --parallel=3
npx nx affected --target=build --parallel=3
```

## Integration with Vercel

This repository uses **Vercel** for deployment (configured in `vercel.json`). Vercel automatically:
- Deploys to **production** when CI passes on `main` branch
- Creates **preview deployments** for pull requests after CI passes
- Blocks deployments if CI checks fail

No additional deployment workflow is needed - Vercel integrates directly with GitHub status checks.

## Setup Requirements

### Required Secrets
None required for basic CI. Optional secrets:
- `CODECOV_TOKEN` - For uploading coverage reports to Codecov

### Branch Protection Rules (Recommended)

Configure branch protection for `main` in GitHub settings:
1. Require status checks to pass before merging
2. Required checks: `CI` and `CI Success`
3. Require branches to be up to date before merging
4. Require linear history (optional)

## Nx Cloud (Optional)

To speed up CI with distributed caching, connect to Nx Cloud:
```bash
npx nx connect
```

Then add `NX_CLOUD_ACCESS_TOKEN` to GitHub secrets.

## Local Testing

Test the workflow commands locally:
```bash
# Run affected tests
npx nx affected --target=test --base=main

# Run affected linting
npx nx affected --target=lint --base=main

# Run affected builds
npx nx affected --target=build --base=main

# Run all tests in monorepo
npx nx run-many --target=test --all
```

## Troubleshooting

**Tests failing in CI but passing locally:**
- Ensure you've committed all changes
- Check for environment-specific issues
- Run `npm ci` instead of `npm install` locally

**Nx affected not detecting changes:**
- Verify git history is fully fetched (`fetch-depth: 0`)
- Check that `nrwl/nx-set-shas@v4` action is running
- Ensure changes are committed and pushed

**Type checking failures:**
- Run `npx nx affected --target=typecheck` locally
- Check `tsconfig.json` configurations in each project
- Verify all dependencies are properly installed
