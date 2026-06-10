# Security Policy

## Reporting a Vulnerability

Please do not open a public issue for suspected security vulnerabilities.

If you find a security issue, contact the maintainer privately with:

- A clear description of the issue.
- Steps to reproduce it.
- The potential impact.
- Any suggested remediation, if known.

## API Key Safety

Chapterize is a client-side application. Any Gemini API key used in a deployed build can be visible to users through browser developer tools or network traffic.

Before deploying publicly:

- Restrict the Gemini API key to your production domain using HTTP referrer restrictions.
- Set conservative quota and billing alerts.
- Never commit `.env` or real API keys.
- Rotate the key immediately if it is accidentally exposed.

## Privacy Model

PDF splitting runs in the browser. The full PDF file is not uploaded by Chapterize, but text snippets from pages are sent to Gemini for chapter detection. Avoid processing documents that contain sensitive data unless that use is acceptable under your Gemini account and data policies.
