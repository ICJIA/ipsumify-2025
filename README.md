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

## Site

https://ipsumify.com/

## Tech Stack

- **Nuxt 4** - Vue.js framework
- **Vuetify 3** - Material Design component framework
- **Vue 3** - Progressive JavaScript framework

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

This project is configured for easy deployment to Netlify:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. In Netlify dashboard, create a new site from Git
3. Netlify will automatically detect Nuxt and use the build settings from `netlify.toml`:
   - Build command: `yarn generate`
   - Publish directory: `.output/public`
   - Node version: 20

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
├── components/          # Vue components
│   ├── ThemeToggle.vue
│   ├── ResetButton.vue
│   └── Toast.vue
├── pages/              # Nuxt pages
│   └── index.vue      # Main page
├── plugins/           # Nuxt plugins
│   └── vuetify.ts     # Vuetify configuration
├── app.vue            # Root component
├── nuxt.config.ts     # Nuxt configuration
├── netlify.toml       # Netlify deployment config
└── package.json       # Dependencies
```

## Credits

Inspired by [Lorem Markdownum](https://jaspervdj.be/lorem-markdownum/).

## License

MIT
