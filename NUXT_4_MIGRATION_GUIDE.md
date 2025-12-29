# Nuxt 4.0 → 4.2.x Migration Guide

This comprehensive guide covers migrating from Nuxt 4.0.0 to Nuxt 4.2.x, including directory structure changes, Vuetify integration updates, and Nuxt Content 2.x → 3.x migration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Pre-Migration Preparation](#phase-1-pre-migration-preparation)
3. [Phase 2: Nuxt 4.0 → 4.2.x Upgrade](#phase-2-nuxt-40--42x-upgrade)
4. [Phase 3: Directory Structure Migration](#phase-3-directory-structure-migration)
5. [Phase 4: Vuetify Integration Update](#phase-4-vuetify-integration-update)
6. [Phase 5: Nuxt Content 2.x → 3.x Migration](#phase-5-nuxt-content-2x--3x-migration)
7. [Phase 6: Configuration Updates](#phase-6-configuration-updates)
8. [Phase 7: Testing and Validation](#phase-7-testing-and-validation)
9. [Phase 8: Deployment](#phase-8-deployment)
10. [Common Issues and Solutions](#common-issues-and-solutions)
11. [Rollback Plan](#rollback-plan)

---

## Prerequisites

- Node.js 20.0.0 or higher
- Existing Nuxt 4.0.0 project
- Git repository (for version control)
- Backup of current project

---

## Phase 1: Pre-Migration Preparation

### 1.1 Create Backup and Branch

```bash
# Commit current state
git add .
git commit -m "Pre-migration: Nuxt 4.0.0 state"

# Create migration branch
git checkout -b migrate/nuxt-4.2
```

### 1.2 Document Current Configuration

Review and document:

- Current `nuxt.config.ts` settings
- Custom plugins and modules
- Build configuration
- Deployment settings (Netlify, Vercel, etc.)

### 1.3 Check Current Versions

```bash
# Check current Nuxt version
yarn info nuxt version
# or
npm list nuxt

# Check other key dependencies
yarn info vue version
yarn info vuetify version  # if using Vuetify
yarn info @nuxt/content version  # if using Nuxt Content
```

---

## Phase 2: Nuxt 4.0 → 4.2.x Upgrade

### 2.1 Upgrade Nuxt

```bash
# Using Yarn
yarn add nuxt@^4.2.2

# Using npm
npm install nuxt@^4.2.2

# Using pnpm
pnpm add nuxt@^4.2.2
```

### 2.2 Update Related Dependencies

```bash
# Update Nuxt DevTools (if used)
yarn add -D @nuxt/devtools@latest

# Update Vue if needed (Nuxt 4.2.x requires Vue 3.5+)
yarn add vue@^3.5.0
```

### 2.3 Run Nuxt Prepare

```bash
yarn nuxt prepare
# or
npm run nuxt prepare
```

This regenerates TypeScript types and ensures compatibility.

### 2.4 Run Migration Codemods (Optional but Recommended)

Nuxt provides automated codemods to help with migration:

```bash
# Run all migration codemods
npx codemod@0.18.7 nuxt/4/migration-recipe

# Or run specific codemods:
npx codemod@0.18.7 nuxt/4/file-structure
npx codemod@0.18.7 nuxt/4/default-data-error-value
npx codemod@0.18.7 nuxt/4/deprecated-dedupe-value
npx codemod@0.18.7 nuxt/4/shallow-function-reactivity
```

**Note:** Review changes before committing. Codemods are helpful but may need manual adjustments.

---

## Phase 3: Directory Structure Migration

Nuxt 4.2.x introduces a new default directory structure with `app/` as the `srcDir`. You have two options:

### Option A: Migrate to New Structure (Recommended)

#### 3.1 Create `app/` Directory

```bash
mkdir app
```

#### 3.2 Move Files to `app/` Directory

```bash
# Move core files
mv app.vue app/
mv error.vue app/  # if exists

# Move directories
mv pages app/
mv components app/
mv composables app/  # if exists
mv layouts app/  # if exists
mv middleware app/  # if exists
mv plugins app/
mv utils app/  # if exists
mv assets app/  # if exists

# Move config files (if they exist)
mv app.config.ts app/  # if exists
mv router.options.ts app/  # if exists
mv spa-loading-template.html app/  # if exists
```

#### 3.3 Keep Root-Level Directories

These should **remain at the root**:

- `nuxt.config.ts`
- `public/`
- `server/` (if exists)
- `content/` (if using Nuxt Content)
- `layers/` (if exists)
- `modules/` (if exists)
- `netlify.toml` / `vercel.json` / other deployment configs

#### 3.4 Final Structure

```
project-root/
├── app/
│   ├── app.vue
│   ├── pages/
│   ├── components/
│   ├── composables/
│   ├── layouts/
│   ├── middleware/
│   ├── plugins/
│   ├── utils/
│   ├── assets/
│   ├── app.config.ts
│   └── router.options.ts
├── public/
├── server/
├── content/  # Nuxt Content
├── nuxt.config.ts
└── package.json
```

### Option B: Keep Current Structure (Backward Compatible)

If you prefer to keep the old structure, Nuxt 4.2.x will auto-detect it. However, you should explicitly configure it:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // Revert srcDir to root
  srcDir: ".",

  // Specify app directory for router.options.ts
  dir: {
    app: "app",
  },

  // ... rest of config
});
```

**Recommendation:** Use Option A for better long-term compatibility and performance.

---

## Phase 4: Vuetify Integration Update

If your project uses Vuetify, follow these steps:

### 4.1 Upgrade Vuetify

```bash
# Upgrade Vuetify to latest 3.x
yarn add vuetify@^3.11.5

# Upgrade Material Design Icons
yarn add @mdi/font@latest
```

### 4.2 Choose Integration Method

#### Method A: Use vuetify-nuxt-module (Recommended)

```bash
# Install the module
yarn add -D vuetify-nuxt-module@latest
```

Update `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ["vuetify-nuxt-module"],

  vuetify: {
    moduleOptions: {
      // Module-specific options
    },
    vuetifyOptions: {
      ssr: true,
      theme: {
        defaultTheme: "dark",
        themes: {
          dark: {
            colors: {
              primary: "#1976D2",
              // ... your theme colors
            },
          },
          light: {
            colors: {
              primary: "#1976D2",
              // ... your theme colors
            },
          },
        },
      },
      // ... other Vuetify options
    },
  },

  // Remove old build.transpile if using module
  // build: { transpile: ['vuetify'] }  // Not needed with module
});
```

**Remove the old Vuetify plugin** (`app/plugins/vuetify.ts` or `plugins/vuetify.ts`) as the module handles setup automatically.

#### Method B: Manual Setup (If Not Using Module)

If you prefer manual setup, update your plugin location:

```typescript
// app/plugins/vuetify.ts (or plugins/vuetify.ts if using old structure)
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import { createVuetify } from "vuetify";

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    ssr: true,
    theme: {
      // ... your theme config
    },
  });
  app.vueApp.use(vuetify);
});
```

Update `nuxt.config.ts`:

```typescript
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

export default defineNuxtConfig({
  build: {
    transpile: ["vuetify"],
  },

  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) => {
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
  ],

  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
});
```

---

## Phase 5: Nuxt Content 2.x → 3.x Migration

If your project uses Nuxt Content, you need to migrate from v2 to v3.

### 5.1 Upgrade Nuxt Content

```bash
# Remove old version
yarn remove @nuxt/content

# Install Nuxt Content 3.x
yarn add @nuxt/content@^3.0.0
```

### 5.2 Update `nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  modules: [
    "@nuxt/content",
    // ... other modules
  ],

  // Nuxt Content 3.x configuration
  content: {
    // Content 3.x uses different API
    // Most configuration remains similar
    sources: {
      // If using multiple sources
    },
  },
});
```

### 5.3 Update Content Queries

Nuxt Content 3.x has API changes. Update your queries:

#### Before (Content 2.x):

```typescript
// app/pages/blog/[slug].vue
const { data: article } = await useAsyncData(
  `content-${route.params.slug}`,
  () => {
    return queryContent("/blog")
      .where({ _path: `/blog/${route.params.slug}` })
      .findOne();
  }
);
```

#### After (Content 3.x):

```typescript
// app/pages/blog/[slug].vue
const { data: article } = await useAsyncData(
  `content-${route.params.slug}`,
  () => {
    return queryContent()
      .where({ _path: `/blog/${route.params.slug}` })
      .findOne();
  }
);
```

**Key Changes:**

- `queryContent('/blog')` → `queryContent()` (path is now in where clause)
- Some query methods may have changed
- Component props may have changed

### 5.4 Update Content Components

If using `<ContentDoc>` or `<ContentRenderer>`, check for prop changes:

```vue
<!-- Before (Content 2.x) -->
<ContentDoc :path="`/blog/${slug}`" />

<!-- After (Content 3.x) - usually same, but verify -->
<ContentDoc :path="`/blog/${slug}`" />
```

### 5.5 Update Content Navigation

```typescript
// Before (Content 2.x)
const navigation = await fetchContentNavigation();

// After (Content 3.x) - usually same
const navigation = await fetchContentNavigation();
```

### 5.6 Check for Deprecated Features

Review the [Nuxt Content 3.x migration guide](https://content.nuxt.com/getting-started/migration) for:

- Deprecated query methods
- Changed component APIs
- New features to adopt

---

## Phase 6: Configuration Updates

### 6.1 Update `nuxt.config.ts`

#### Remove Deprecated Options

```typescript
export default defineNuxtConfig({
  // Remove if present (no longer needed):
  // build: { transpile: ['vuetify'] }  // If using vuetify-nuxt-module

  // Remove old generate config (use nitro.prerender instead):
  // generate: {
  //   routes: ['/']
  // }

  // Use this instead:
  nitro: {
    prerender: {
      routes: ["/"],
      // ignore: ['/admin']  // Routes to exclude
    },
  },
});
```

#### Update Compatibility Date

```typescript
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01", // Update to current or latest
  // ... rest of config
});
```

### 6.2 Update Import Paths

With the new directory structure, `~` alias now points to `app/`:

```typescript
// These still work the same way:
import MyComponent from "~/components/MyComponent.vue";
import { useMyComposable } from "~/composables/useMyComposable";
```

### 6.3 Update TypeScript Configuration (If Using TypeScript)

Nuxt 4.2.x generates separate TypeScript configs. Your `tsconfig.json` should extend:

```json
{
  "extends": "./.nuxt/tsconfig.json"
}
```

Or use project references (recommended for better type checking):

```json
{
  "files": [],
  "references": [
    { "path": "./.nuxt/tsconfig.app.json" },
    { "path": "./.nuxt/tsconfig.server.json" },
    { "path": "./.nuxt/tsconfig.shared.json" },
    { "path": "./.nuxt/tsconfig.node.json" }
  ]
}
```

---

## Phase 7: Testing and Validation

### 7.1 Development Server Test

```bash
yarn dev
```

Check for:

- ✅ Server starts without errors
- ✅ Pages load correctly
- ✅ Components render properly
- ✅ Routing works
- ✅ Auto-imports work
- ✅ Vuetify components (if used) render correctly
- ✅ Content pages (if used) load correctly

### 7.2 Build Test

```bash
yarn build
```

Check for:

- ✅ Build completes without errors
- ✅ No TypeScript errors
- ✅ No missing dependencies

### 7.3 Generate Test (For Static Sites)

```bash
yarn generate
```

Check for:

- ✅ Static generation completes
- ✅ `.output/public` directory is created
- ✅ All routes are generated
- ✅ Assets are included

### 7.4 Preview Test

```bash
yarn preview
```

Test the production build locally:

- ✅ All pages accessible
- ✅ Navigation works
- ✅ No console errors
- ✅ All features functional

### 7.5 Type Checking (If Using TypeScript)

```bash
yarn nuxt typecheck
# or
yarn vue-tsc --noEmit
```

---

## Phase 8: Deployment

### 8.1 Netlify Deployment

No changes needed if using standard configuration:

```toml
# netlify.toml
[build]
  command = "yarn generate"
  publish = ".output/public"

[build.environment]
  NODE_VERSION = "20"
```

**Verify:**

- Build command: `yarn generate` or `npm run generate`
- Publish directory: `.output/public`
- Node version: 20+

### 8.2 Vercel Deployment

No changes needed. Vercel auto-detects Nuxt 4.2.x.

### 8.3 Other Platforms

Ensure:

- Node.js 20+ is available
- Build command uses `yarn generate` or `yarn build`
- Output directory is `.output/public` (for static) or `.output` (for SSR)

---

## Common Issues and Solutions

### Issue 1: Module Not Found Errors

**Symptom:** `Cannot find module` errors after migration

**Solution:**

```bash
# Clear cache and reinstall
rm -rf node_modules .nuxt .output
yarn install
yarn nuxt prepare
```

### Issue 2: Import Path Errors

**Symptom:** Components or composables not found

**Solution:**

- Verify files are in `app/` directory (if using new structure)
- Check that `~` alias resolves correctly
- Use relative paths if needed: `../components/MyComponent.vue`

### Issue 3: Vuetify Components Not Rendering

**Symptom:** Vuetify components show as plain HTML

**Solution:**

- Verify `vuetify-nuxt-module` is in `modules` array
- Check `vuetifyOptions` configuration
- Ensure plugin was removed (if using module)
- Clear `.nuxt` and rebuild

### Issue 4: Content Queries Not Working

**Symptom:** `queryContent()` returns empty or errors

**Solution:**

- Verify `@nuxt/content@^3.0.0` is installed
- Update query syntax (see Phase 5.3)
- Check `content/` directory is at root (not in `app/`)
- Verify content files are in correct format

### Issue 5: TypeScript Errors

**Symptom:** Type errors after upgrade

**Solution:**

```bash
# Regenerate types
yarn nuxt prepare

# Check tsconfig.json extends .nuxt/tsconfig.json
# Update type imports if needed
```

### Issue 6: Build Fails on Netlify/Vercel

**Symptom:** Deployment fails

**Solution:**

- Verify Node version is 20+
- Check build logs for specific errors
- Ensure all dependencies are in `package.json`
- Clear build cache on platform

### Issue 7: Old Directory Structure Not Detected

**Symptom:** Nuxt can't find files after migration

**Solution:**

- Explicitly set `srcDir: '.'` in `nuxt.config.ts` (if keeping old structure)
- Or ensure all files are moved to `app/` directory

---

## Rollback Plan

If migration causes critical issues:

### 1. Revert Git Changes

```bash
git checkout main  # or your original branch
git branch -D migrate/nuxt-4.2  # Delete migration branch
```

### 2. Restore Dependencies

```bash
# Restore old package.json
git checkout main -- package.json yarn.lock

# Reinstall
yarn install
```

### 3. Restore Directory Structure

```bash
# If you moved files, restore them
git checkout main -- app.vue pages/ components/ plugins/
```

---

## Migration Checklist

Use this checklist to track your migration:

- [ ] Pre-migration backup created
- [ ] Git branch created
- [ ] Nuxt upgraded to 4.2.2
- [ ] Dependencies updated
- [ ] Migration codemods run (optional)
- [ ] Directory structure migrated (or configured)
- [ ] Vuetify updated (if used)
- [ ] Nuxt Content updated (if used)
- [ ] `nuxt.config.ts` updated
- [ ] Import paths verified
- [ ] Development server tested
- [ ] Build tested
- [ ] Generate tested (if static)
- [ ] Preview tested
- [ ] Type checking passed (if TypeScript)
- [ ] Deployment configuration verified
- [ ] All features tested
- [ ] Documentation updated

---

## Additional Resources

- [Nuxt 4.2.x Documentation](https://nuxt.com/docs)
- [Nuxt 4 Upgrade Guide](https://nuxt.com/docs/getting-started/upgrade)
- [Vuetify Nuxt Module](https://github.com/vuetifyjs/nuxt-module)
- [Nuxt Content 3.x Documentation](https://content.nuxt.com)
- [Nuxt Content Migration Guide](https://content.nuxt.com/getting-started/migration)

---

## Summary

This migration guide covers:

1. ✅ Nuxt 4.0 → 4.2.x upgrade
2. ✅ Directory structure migration (new `app/` structure)
3. ✅ Vuetify integration update (module vs manual)
4. ✅ Nuxt Content 2.x → 3.x migration
5. ✅ Configuration updates
6. ✅ Testing procedures
7. ✅ Deployment considerations
8. ✅ Common issues and solutions

Follow each phase sequentially, test thoroughly, and refer to the official documentation for specific edge cases.
