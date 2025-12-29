import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  
  build: {
    transpile: ['vuetify']
  },

  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
  ],

  vite: {
    vue: {
      template: {
        transformAssetUrls
      }
    }
  },

  // Static site generation for Netlify
  nitro: {
    prerender: {
      routes: ['/']
    }
  },

  // Ensure static generation
  ssr: true,
  
  app: {
    head: {
      htmlAttrs: {
        lang: 'en'
      },
      title: 'Ipsumify: A Lorem Ipsum Generator',
      meta: [
        { charset: 'UTF-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'description', content: 'Generate structured placeholder text in markdown format for your projects.' }
      ]
    }
  }
})
