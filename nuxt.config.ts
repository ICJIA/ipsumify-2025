// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },

  css: ['~/assets/css/main.css'],

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
              primary: '#2563EB',
              secondary: '#64748B',
              accent: '#60A5FA',
              error: '#EF4444',
              info: '#3B82F6',
              success: '#22C55E',
              warning: '#F59E0B',
              surface: '#1E293B',
              'on-surface': '#E2E8F0',
              background: '#0F172A',
              'on-background': '#E2E8F0',
            },
          },
          light: {
            colors: {
              primary: '#2563EB',
              secondary: '#64748B',
              accent: '#2563EB',
              error: '#DC2626',
              info: '#2563EB',
              success: '#16A34A',
              warning: '#D97706',
              surface: '#FFFFFF',
              'on-surface': '#1E293B',
              background: '#F8FAFC',
              'on-background': '#1E293B',
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
