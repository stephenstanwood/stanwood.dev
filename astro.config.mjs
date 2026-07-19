// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://stanwood.dev',
  trailingSlash: 'never',
  redirects: {
    '/tb': {
      status: 301,
      destination: '/office',
    },
    '/youtube': {
      status: 301,
      destination: '/office',
    },
  },
  output: 'static',
  adapter: vercel(),
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  integrations: [
    react(),
    sitemap({
      // Private pages: password-gated dashboards and working queues.
      filter: (page) =>
        !['/tv', '/office', '/money', '/money-login', '/li', '/li-login'].includes(
          new URL(page).pathname.replace(/\/$/, ''),
        ),
    }),
  ],
  vite: {
    // @ts-ignore - tailwindcss/vite type mismatch with astro's bundled vite
    plugins: [tailwindcss()],
    server: {
      fs: {
        allow: ['..']
      }
    }
  }
});
