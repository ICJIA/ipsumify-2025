# Ipsumify: A Lorem Ipsum Generator

A modern, browser-based Lorem Ipsum generator built with Nuxt 4 and Vuetify. This tool helps developers and writers create placeholder content for testing and layout purposes.

## Features

- Generate markdown-formatted placeholder text
- Customizable output options:
  - Headers (with optional underlining)
  - Code snippets (inline or block format)
  - Lists
  - External links (inline or reference-style)
  - Text styling (emphasis and strong)
- Adjustable content length
- Copy to clipboard functionality
- Download as .md, .txt, or .html files
- Dark/Light theme support
- No wrapping option for specific use cases
- Comprehensive accessibility testing with axe-core

## Site

https://ipsumify.com/

## Tech Stack

- **Nuxt 4** - Vue.js framework
- **Vuetify 3** - Material Design component framework
- **Vue 3** - Progressive JavaScript framework
- **ES6 Modules** - Modern JavaScript module system
- **axe-core** - Accessibility testing engine
- **Puppeteer** - Headless browser automation for testing

## Migration Guide

This project has been migrated to Nuxt 4.2.x using the new directory structure. If you're migrating a similar project, see the comprehensive migration guide:

📖 **[Nuxt 4.0 → 4.2.x Migration Guide](./NUXT_4_MIGRATION_GUIDE.md)**

The guide covers:

- Nuxt 4.0 → 4.2.x upgrade steps
- Directory structure migration (new `app/` structure)
- Vuetify integration updates
- Nuxt Content 2.x → 3.x migration
- Configuration updates and common issues

📖 **[Netlify Deployment Guide](./NETLIFY_DEPLOYMENT.md)** - Complete guide for deploying Nuxt 4 static sites to Netlify

## Prerequisites

- Node.js 20.x or higher
- Yarn 1.22.22

## Installation

1. Clone the repository:

```bash
git clone https://github.com/ICJIA/ipsumify-2025
cd ipsumify-2025
```

2. Install dependencies:

```bash
yarn install
```

## Development

Start the development server:

```bash
yarn dev
```

The app will be available at `http://localhost:3000`

### Available Scripts

- `yarn dev` - Start the development server
- `yarn build` - Build the application for production
- `yarn generate` - Generate a static site
- `yarn preview` - Preview the production build locally
- `yarn a11y:audit` - Run a full accessibility audit (see below)

## Accessibility Testing

This project includes comprehensive accessibility testing using [axe-core](https://www.deque.com/axe/), the same engine powering Google Lighthouse and other industry-standard accessibility tools.

### Running a Full Accessibility Audit

The accessibility audit script tests your application across multiple viewports and themes to ensure WCAG compliance:

1. **Start the development server** (required for the audit):

```bash
yarn dev
```

2. **In a separate terminal, run the audit**:

```bash
yarn a11y:audit
```

The audit script will:

- Check that the dev server is running on `http://localhost:3000`
- Read URLs from `public/sitemap.xml`
- Test each URL across multiple viewports:
  - Desktop (1920x1080)
  - Tablet (768x1024)
  - Mobile (375x812)
- Test both dark and light themes
- Generate comprehensive reports

### Audit Outputs

After running the audit, you'll find the following files in `public/documentation/accessibility/`:

- **`index.html`** - Comprehensive HTML report with:

  - Summary statistics (violations, passes, pages tested)
  - Violations grouped by rule
  - Detailed violation information with impact levels
  - Full test results for all pages, viewports, and themes
  - Information about axe-core and accessibility standards

- **`violations.json`** - JSON file containing all accessibility violations
- **`errors.json`** - Same as violations.json (for compatibility)

The script will exit with:

- **Exit code 0** if no violations are found
- **Exit code 1** if violations are detected

### What Gets Tested

The audit checks for WCAG 2.1 Level A and AA compliance, including:

- Semantic HTML and ARIA attributes
- Keyboard navigation
- Color contrast ratios
- Focus management
- Form labels
- Image alt text
- Heading structure
- Landmark regions
- Interactive element accessibility
- Language attributes

### Viewing the Report

After running the audit, open `public/documentation/accessibility/index.html` in your browser to view the detailed report.

## Building for Production

Generate a static site:

```bash
yarn generate
```

The generated files will be in `.output/public`

Preview the production build:

```bash
yarn preview
```

## Deployment to Netlify

This project is configured for easy deployment to Netlify. **See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) for complete deployment guide.**

### Quick Setup

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. In Netlify dashboard, create a new site from Git
3. Netlify will automatically use the configuration from `netlify.toml`

### Critical Configuration

The `netlify.toml` file must use these exact settings:

```toml
[build]
  command = "yarn generate"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"  # Match your .nvmrc
```

**Important:**

- ✅ Use `publish = "dist"` (NOT `.output/public`)
- ✅ Use `command = "yarn generate` (no modifications)
- ✅ Match Node version to your `.nvmrc` file
- ✅ Let Netlify handle the directory mapping - no copy steps needed

The site will be automatically deployed on every push to your main branch.

## Usage

1. Open the application in your web browser
2. Configure your desired options using the checkboxes
3. Set the number of markdown paragraphs you want to generate (default is `10`)
4. Click "Generate some markdown!" to create your placeholder text
5. Use the copy or download buttons to export your content

## Project Structure

```
ipsumify-2025/
├── app/                # Nuxt 4.2.x app directory (new structure)
│   ├── app.vue        # Root component
│   ├── components/    # Vue components
│   │   ├── ThemeToggle.vue
│   │   ├── ResetButton.vue
│   │   └── Toast.vue
│   └── pages/         # Nuxt pages
│       └── index.vue  # Main page
├── scripts/           # Build and testing scripts
│   └── accessibility-audit.mjs  # ES6 accessibility audit script
├── public/            # Static assets
│   ├── documentation/
│   │   └── accessibility/  # Accessibility audit reports
│   │       ├── index.html  # HTML audit report
│   │       ├── violations.json  # JSON violations data
│   │       └── errors.json  # JSON errors data
│   └── sitemap.xml    # Sitemap for audit script
├── nuxt.config.ts     # Nuxt configuration
├── netlify.toml       # Netlify deployment config
├── package.json       # Dependencies and scripts
└── NUXT_4_MIGRATION_GUIDE.md  # Migration guide for Nuxt 4.0 → 4.2.x
```

## Code Standards

- **ES6 Modules**: The project uses ES6 module syntax (`import`/`export`)
- **TypeScript**: Configuration files use TypeScript
- **Accessibility**: WCAG 2.1 Level A and AA compliance
- **Modern JavaScript**: Leverages modern JavaScript features and syntax

## Credits

Inspired by [Lorem Markdownum](https://jaspervdj.be/lorem-markdownum/).

## License

MIT
