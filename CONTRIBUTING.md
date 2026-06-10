# Contributing

Thanks for your interest in improving Chapterize.

## Development Setup

1. Fork and clone the repository.
2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a local environment file:

   ```sh
   cp .env.example .env
   ```

4. Add your Gemini API key to `.env`.
5. Start the development server:

   ```sh
   npm run dev
   ```

## Before Opening a Pull Request

- Run `npm run lint`.
- Run `npm run build`.
- Keep changes focused and describe the user-facing impact.
- Do not commit `.env`, API keys, generated build output, or dependency folders.

## Reporting Issues

When reporting a bug, include:

- Browser and operating system.
- Whether the PDF is text-based or scanned.
- The approximate PDF size and page count.
- Any relevant console or activity log messages.
