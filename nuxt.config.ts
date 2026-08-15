import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  app: {
    head: {
      title: 'osu! mp inspector',
    },
  },
  runtimeConfig: {
    // @ts-ignore
    osuClientId: process.env.OSU_CLIENT_ID || '',
    // @ts-ignore
    osuClientSecret: process.env.OSU_CLIENT_SECRET || '',
  },
  css: ['~/assets/css/tailwind.css'],
  modules: ['shadcn-nuxt', '@vercel/analytics'],
  shadcn: {
    prefix: '',
  },
  vite: {
    plugins: [tailwindcss()],
  },

  devtools: { enabled: false },
  compatibilityDate: '2025-07-15',
});
