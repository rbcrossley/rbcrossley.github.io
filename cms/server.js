// =============================================================================
// Local-only GitHub OAuth proxy + static server for the Decap CMS admin.
// -----------------------------------------------------------------------------
// What this is: the smallest possible "backend" Decap CMS needs. It exists
// for exactly one reason — exchanging a GitHub OAuth code for an access
// token requires your GitHub OAuth App's CLIENT_SECRET, and a secret can't
// live in browser JS. Everything else (listing posts, reading/writing files,
// committing) happens directly from the browser straight to GitHub's API,
// using the token this server hands back.
//
// This binds to 127.0.0.1 ONLY — not 0.0.0.0 — so it is not reachable from
// your network, let alone the internet. Nothing here is deployed anywhere.
// You run it, use it, and stop it (Ctrl+C) when you're done writing.
//
// Run with:  npm start   (from inside cms/)
// =============================================================================

import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Tiny .env loader (no dependency needed for something this small).
// Looks for cms/.env — see .env.example for the two values it needs.
// ---------------------------------------------------------------------------
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const rawLine of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvFile(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT || 8081);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const CLIENT_ID = process.env.GITHUB_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_OAUTH_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    '\nMissing GITHUB_OAUTH_CLIENT_ID / GITHUB_OAUTH_CLIENT_SECRET.\n' +
      'Copy cms/.env.example to cms/.env and fill in the values from your GitHub OAuth App.\n' +
      'See cms/README.md for exact setup steps.\n'
  );
  process.exit(1);
}

// In-memory CSRF state, cleared on restart — fine, since this process only
// ever lives for the length of one local editing session.
const pendingStates = new Set();

const app = express();

// Serve the Decap admin bundle (index.html + config.yml) at "/".
app.use(express.static(path.join(__dirname, 'admin')));

app.get('/auth', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.add(state);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: `${BASE_URL}/callback`,
    scope: 'repo',
    state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

app.get('/callback', async (req, res) => {
  const { code, state, error, error_description: errorDescription } = req.query;

  if (error) {
    res.status(400).send(`GitHub OAuth error: ${error} — ${errorDescription || ''}`);
    return;
  }
  if (!state || !pendingStates.has(String(state))) {
    res.status(400).send('Invalid or expired OAuth state. Close this window and try signing in again.');
    return;
  }
  pendingStates.delete(String(state));

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: `${BASE_URL}/callback`,
      }),
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      res
        .status(400)
        .send(`GitHub token exchange failed: ${tokenData.error_description || tokenData.error || 'no access_token in response'}`);
      return;
    }

    // Hand the token back to the Decap admin tab via the postMessage
    // handshake its GitHub backend expects. The token only ever exists in
    // this response and in the admin tab's memory — never written to disk,
    // never logged.
    const payload = JSON.stringify({ token: tokenData.access_token, provider: 'github' });
    // Built via JSON.stringify rather than hand-escaping quotes, so the
    // token (or anything else in the payload) can never break out of the
    // string literal below.
    const message = JSON.stringify(`authorization:github:success:${payload}`);
    res.setHeader('Content-Type', 'text/html');
    res.end(`<!doctype html>
<html>
  <body>
    <script>
      (function () {
        function receiveMessage(e) {
          window.opener.postMessage(${message}, e.origin);
          window.removeEventListener('message', receiveMessage, false);
        }
        window.addEventListener('message', receiveMessage, false);
        window.opener.postMessage('authorizing:github', '*');
      })();
    </script>
    You can close this window.
  </body>
</html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Unexpected error during GitHub token exchange — see the terminal running `npm start`.');
  }
});

// 127.0.0.1, not 0.0.0.0 — refuses connections from anywhere but this machine.
app.listen(PORT, '127.0.0.1', () => {
  console.log(`\nBerojgar Engineer CMS running at http://localhost:${PORT}/`);
  console.log('Bound to 127.0.0.1 only — not reachable from your network or the internet.');
  console.log('Press Ctrl+C to stop.\n');
});
