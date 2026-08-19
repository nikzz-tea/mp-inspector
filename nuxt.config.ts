import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  app: {
    head: {
      title: 'osu! mp inspector',
      meta: [
        { name: 'description', content: 'Various information and stats about osu! matches' },
        { name: 'og:title', content: 'osu! mp inspector' },
        { name: 'og:description', content: 'Various information and stats about osu! matches' },
        { name: 'og:type', content: 'website' },
      ],
    },
  },
  runtimeConfig: {
    // @ts-ignore
    osuClientId: process.env.OSU_CLIENT_ID || '',
    // @ts-ignore
    osuClientSecret: process.env.OSU_CLIENT_SECRET || '',
  },
  css: ['~/assets/css/tailwind.css'],
  modules: [
    'shadcn-nuxt',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    '@vercel/analytics',
    '@vercel/speed-insights',
  ],
  shadcn: {
    prefix: '',
  },
  vite: {
    plugins: [tailwindcss()],
  },

  devtools: { enabled: false },
  compatibilityDate: '2025-07-15',
});
