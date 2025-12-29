// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  
  modules: ['vuetify-nuxt-module'],

  vuetify: {
    moduleOptions: {},
    vuetifyOptions: {
      ssr: true,
      theme: {
        defaultTheme: 'dark',
        themes: {
          dark: {
            colors: {
              primary: '#1976D2',
              secondary: '#424242',
              accent: '#82B1FF',
              error: '#FF5252',
              info: '#2196F3',
              success: '#4CAF50',
              warning: '#FB8C00',
            },
          },
          light: {
            colors: {
              primary: '#1976D2',
              secondary: '#424242',
              accent: '#82B1FF',
              error: '#FF5252',
              info: '#2196F3',
              success: '#4CAF50',
              warning: '#FB8C00',
            },
          },
        },
      },
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
