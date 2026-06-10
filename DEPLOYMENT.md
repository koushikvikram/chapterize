# Deployment Guide

Chapterize is a client-side React application built with Vite. It can be deployed to any static hosting platform.

## Important: API Key Exposure

`VITE_GEMINI_API_KEY` is bundled into the client-side app at build time. In a public deployment, users can inspect browser traffic and see the key.

Before deploying publicly:

- Restrict the Gemini API key to your production domain with HTTP referrer restrictions.
- Set quota and billing alerts.
- Use a separate key for production.
- Never commit `.env` or real API keys.

## Build Settings

Use these settings for most static hosting providers:

- Build command: `npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_GEMINI_API_KEY`

## Vercel

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/).
3. Add `VITE_GEMINI_API_KEY` in the project environment variables.
4. Deploy.

## Netlify

1. Push the repository to GitHub.
2. Import the project in [Netlify](https://www.netlify.com/).
3. Set the build command to `npm run build`.
4. Set the publish directory to `dist`.
5. Add `VITE_GEMINI_API_KEY` in environment variables.
6. Deploy.

## GitHub Pages

GitHub Pages can host the built static files, but it does not provide runtime-secret protection for client-side environment variables. Use GitHub Actions secrets during build and still restrict the resulting browser-exposed Gemini key by HTTP referrer.

If the site is served from a repository subpath, configure Vite's `base` option in `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/chapterize/',
})
```

## Post-Deployment Checklist

- Confirm the app loads over HTTPS.
- Confirm uploads, chapter detection, individual downloads, and ZIP downloads work.
- Confirm the production Gemini key is referrer-restricted to the deployed domain.
- Confirm quotas and billing alerts are configured.