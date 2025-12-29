# Netlify Deployment Guide for Nuxt 4 Static Sites

This guide documents the correct way to deploy Nuxt 4 static sites (using `yarn generate`) to Netlify. It includes what we tried, what didn't work, and the final working solution.

## Quick Start (TL;DR)

**Use this exact configuration:**

```toml
# netlify.toml
[build]
  command = "yarn generate"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"  # or match your .nvmrc
```

**That's it.** No copy steps, no symlinks, no modifications to your `package.json` generate script.

---

## What We Tried (And Why It Didn't Work)

### ❌ Attempt 1: Using `.output/public` as Publish Directory

**Configuration:**

```toml
[build]
  command = "yarn generate"
  publish = ".output/public"
```

**Result:** Failed with error: "Deploy directory '.output/public' does not exist"

**Why it failed:** While Nuxt generates files to `.output/public` locally, Netlify's build environment expects `dist` as the publish directory. The build completes successfully, but Netlify can't find the directory for deployment.

---

### ❌ Attempt 2: Copy Script in package.json

**Configuration:**

```json
{
  "scripts": {
    "generate": "nuxt generate && npm run copy-dist",
    "copy-dist": "rm -rf dist && cp -r .output/public dist"
  }
}
```

```toml
[build]
  command = "yarn generate"
  publish = "dist"
```

**Result:** Unnecessary complexity, and still had issues

**Why it didn't work:**

- Added unnecessary steps
- The copy command was copying the directory structure incorrectly
- Netlify doesn't need this - it handles the mapping automatically

---

### ❌ Attempt 3: Symlink Approach

**Configuration:**
Tried using symlinks from `dist` to `.output/public`

**Result:** Symlinks don't work reliably on Netlify's build environment

**Why it didn't work:** Netlify's build system doesn't follow symlinks the same way local development does.

---

## ✅ What Finally Worked

**The Simple Solution:**

```toml
# netlify.toml
[build]
  command = "yarn generate"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"  # Match your .nvmrc
```

**Key Points:**

1. **Build command:** Just `yarn generate` - no modifications needed
2. **Publish directory:** `dist` - Netlify automatically maps this
3. **Node version:** Match your `.nvmrc` file (22+ recommended for Nuxt 4.2.x)

**Why this works:**

- Nuxt generates to `.output/public` during the build
- Netlify's build system automatically handles the mapping to `dist`
- No copy steps, symlinks, or modifications needed
- Simple, clean, and reliable

---

## Complete Setup Instructions

### Step 1: Create `netlify.toml`

Create or update `netlify.toml` in your project root:

```toml
[build]
  command = "yarn generate"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"
```

**Important:**

- Use `yarn generate` (or `npm run generate` if using npm)
- Use `publish = "dist"` (NOT `.output/public`)
- Set `NODE_VERSION` to match your `.nvmrc` or use 22+ (20+ minimum)

### Step 2: Ensure `.nvmrc` Exists (Recommended)

Create a `.nvmrc` file in your project root:

```
22
```

Or whatever Node version you're using. This helps ensure consistency between local development and Netlify builds.

### Step 3: Verify Your `package.json`

Your `generate` script should be simple:

```json
{
  "scripts": {
    "generate": "nuxt generate"
  }
}
```

**Don't add:**

- ❌ Copy steps
- ❌ Post-build scripts
- ❌ Symlink creation
- ❌ Any modifications to the generate command

### Step 4: Deploy to Netlify

1. Push your code to Git (GitHub, GitLab, or Bitbucket)
2. In Netlify dashboard, create a new site from Git
3. Netlify will automatically detect the `netlify.toml` configuration
4. The build will run `yarn generate` and deploy from `dist`

---

## Common Issues and Solutions

### Issue: "Deploy directory does not exist"

**Symptom:** Build completes but deploy fails with "Deploy directory 'X' does not exist"

**Solution:**

- ✅ Use `publish = "dist"` in `netlify.toml`
- ❌ Don't use `publish = ".output/public"`
- Verify your build command is `yarn generate` (no modifications)

---

### Issue: Plugin Installation Errors

**Symptom:** Build fails with errors about plugins/extensions (like "neon") failing to install

**Solution:**

1. Go to Netlify dashboard
2. Navigate to: Site settings → Build & deploy → Build plugins
3. Remove any plugins you don't need
4. Plugins configured in the dashboard can cause failures even if not in `netlify.toml`

**Common culprits:**

- Neon (database plugin - remove if not using a database)
- Other third-party plugins you're not using

---

### Issue: Node Version Mismatch

**Symptom:** Build fails with Node version errors

**Solution:**

- Set `NODE_VERSION` in `netlify.toml` to match your `.nvmrc`
- Use Node 20+ (22+ recommended for Nuxt 4.2.x)
- Ensure your local Node version matches

---

### Issue: Build Succeeds But Site Doesn't Load

**Symptom:** Build completes but deployed site shows errors or blank page

**Solution:**

- Check Netlify build logs for warnings
- Verify all dependencies are in `package.json` (not just `package-lock.json` or `yarn.lock`)
- Clear Netlify build cache and rebuild
- Check browser console for runtime errors

---

## Verification Checklist

Before deploying, verify:

- [ ] `netlify.toml` exists with correct configuration
- [ ] `publish = "dist"` (not `.output/public`)
- [ ] `command = "yarn generate"` (no modifications)
- [ ] `NODE_VERSION` matches your `.nvmrc` or is 22+
- [ ] `.nvmrc` file exists (recommended)
- [ ] `package.json` has simple `generate` script (no copy steps)
- [ ] No unnecessary plugins in Netlify dashboard
- [ ] Local `yarn generate` works and creates `.output/public`

---

## Testing Locally

You can test the Netlify build process locally:

```bash
# Install Netlify CLI if you haven't
npm install -g netlify-cli

# Build and test
yarn generate
netlify dev
```

Or use the Netlify CLI to simulate the build:

```bash
netlify build
```

---

## Why This Configuration Works

1. **Nuxt generates to `.output/public`:** This is Nuxt's standard output location for static generation
2. **Netlify expects `dist`:** Netlify's build system is configured to look for `dist` as the publish directory
3. **Automatic mapping:** Netlify automatically handles the mapping between Nuxt's output and its expected publish directory
4. **No manual intervention needed:** You don't need to copy, symlink, or modify anything - Netlify does it for you

---

## For Other Nuxt 4 Projects

This configuration works for **any** Nuxt 4 project using static site generation (`yarn generate`):

- ✅ Single-page applications
- ✅ Multi-page static sites
- ✅ Sites with Nuxt Content
- ✅ Sites with Vuetify or other UI frameworks
- ✅ Any Nuxt 4.x project using `generate` command

**The key is:**

- Use `yarn generate` as the build command
- Use `dist` as the publish directory
- Set the correct Node version
- Let Netlify handle the rest

---

## Additional Resources

- [Netlify Build Configuration](https://docs.netlify.com/configure-builds/file-based-configuration/)
- [Nuxt 4 Deployment Documentation](https://nuxt.com/docs/getting-started/deployment)
- [Netlify Static Site Deployment](https://docs.netlify.com/site-deploys/create-deploys/)

---

## Summary

**The correct Netlify configuration for Nuxt 4 static sites:**

```toml
[build]
  command = "yarn generate"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"
```

**Remember:**

- ✅ Simple is better
- ✅ Let Netlify handle the directory mapping
- ✅ Don't add unnecessary copy steps or scripts
- ✅ Match your Node version to `.nvmrc`

This configuration has been tested and works reliably for Nuxt 4.2.x static site generation on Netlify.
