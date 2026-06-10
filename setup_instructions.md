# Chapterize Setup Instructions

This guide explains how to run Chapterize locally from the repository.

## Prerequisites

- Node.js 18 or newer
- npm
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## 1. Clone and Install

```sh
git clone <repository-url>
cd chapterize
npm install
```

## 2. Configure Environment Variables

Create a local `.env` file from the example:

```sh
cp .env.example .env
```

Add your Gemini API key:

```sh
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

Do not commit `.env` or real API keys.

## 3. Run the App

```sh
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.

## 4. Validate Changes

Before opening a pull request or publishing changes, run:

```sh
npm run lint
npm run build
```

## Notes

- pdf.js, pdf-lib, and JSZip are loaded dynamically in the browser.
- The full PDF file is processed locally in browser memory.
- Text snippets are sent to Gemini for chapter detection.

## Troubleshooting

- **Missing API key:** Confirm `.env` exists and contains `VITE_GEMINI_API_KEY`.
- **Detached ArrayBuffer errors:** PDF parsing can transfer buffers to a worker. Chapterize reloads a fresh buffer before splitting, but very large files can still stress browser memory.
- **Large PDFs:** Text-based PDFs usually work better than large scanned/image-heavy PDFs.