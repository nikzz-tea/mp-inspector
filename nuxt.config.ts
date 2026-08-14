import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  app: {
    head: {
      title: 'osu! mp inspector',
    },
  },

  css: ['~/assets/css/tailwind.css'],
  modules: ['shadcn-nuxt'],
  shadcn: {
    prefix: '',
  },
  vite: {
    plugins: [tailwindcss()],
  },

  devtools: { enabled: false },
  compatibilityDate: '2025-07-15',
});
