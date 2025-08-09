BrightNote Kindle Highlights API
================================

A simple Node.js/Express API that automates Amazon Kindle Notebook to extract your book highlights using Puppeteer.

Important: This tool automates a personal login to your Amazon account in order to export your own highlights. Make sure your usage complies with Amazon's Terms of Service. Use at your own risk.

Features
- Extracts highlights for every book visible in your Kindle Notebook library
- Returns structured JSON per book: title, index, and array of highlight texts
- Simple HTTP API: POST your email/password to get highlights
- Built-in rate limiting (default: 3 requests per 5 minutes per IP) meant to avoid login limirs imposed by Amazon.

Requirements
- Node.js 18+ (tested on Node 20)
- macOS/Linux/Windows

Project structure
```
backend/
  controllers/
    main.js         # getHighlights controller (Puppeteer logic)
  server.js         # Express server entry
  package.json      # Dependencies and scripts
```

Installation
```bash
cd backend
npm install
```

Configuration
Environment variables (optional):
- PORT (default: 4000)
- LINK_REDIRECTION (optional override of the Amazon sign-in URL used to reach the notebook page)

Rate limiting is configured to 3 requests per 5 minutes per IP. Adjust it in `backend/server.js` if needed.

Run locally
```bash
cd backend
npm start
# Server will start at http://localhost:4000
```

API
POST /api/highlights
Request body (JSON):
```json
{
  "email": "your-amazon-email@example.com",
  "password": "your-amazon-password",
  "otp": "123456" // optional, only if your account requires MFA at runtime
}
```

Response (200): array of book objects
```json
[
  {
    "bookTitle": "Think and Grow Rich",
    "bookIndex": 0,
    "highlights": [
      "Highlight text 1",
      "Highlight text 2"
    ]
  },
  {
    "bookTitle": "$100M Offers: How To Make Offers So Good People Feel Stupid Saying No",
    "bookIndex": 1,
    "highlights": [
      "..."
    ]
  }
]
```

Example curl
```bash
curl -X POST http://localhost:4000/api/highlights \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-amazon-email@example.com",
    "password": "your-amazon-password"
  }'
```

Example JavaScript (fetch)
```javascript
const res = await fetch('http://localhost:4000/api/highlights', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'you@example.com', password: 'your-password' })
});
const data = await res.json();
console.log(data);
```

Notes and troubleshooting
- This uses Puppeteer to automate a browser session. If Amazon presents CAPTCHA or MFA, automation may pause or fail. The API supports passing an `otp` code if prompted during the flow. If CAPTCHA appears frequently, try logging in manually in a local browser first to reduce challenges, or adjust the automation strategy.
- Do not deploy over plain HTTP. Always terminate TLS (HTTPS) in production when sending credentials.
- Headless mode is enabled by default. If you need to debug interactively, you can switch to non-headless mode in `controllers/main.js`.

Security
- Never log or persist plaintext credentials. The API only reads the provided credentials to perform a single session and does not store them.
- Protect the endpoint behind authentication (e.g., API keys) if running beyond personal/local use.
- Keep dependencies updated regularly.

License
MIT


  