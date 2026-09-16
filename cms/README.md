# Berojgar Engineer CMS (local-only)

A private, GUI-based Markdown editor for writing/editing blog posts, running
entirely on your own laptop. It talks straight to GitHub — save/publish in
the editor commits directly to `rbcrossley/rbcrossley.github.io`, which
triggers the same `.github/workflows/deploy.yml` → GitHub Pages build you
already have. Nothing about the public site changes; this folder is never
built into `dist/` and never deployed anywhere.

Two pieces live here:

- `admin/` — [Decap CMS](https://decapcms.org), a static admin UI + `config.yml` schema mirroring `../src/content/config.ts`.
- `server.js` — a ~100-line Express server that does exactly one thing GitHub requires: exchange an OAuth code for an access token using your OAuth App's client secret (a secret that can't live in browser JavaScript). Everything else (reading/writing files, committing) happens directly from your browser to GitHub's API.

It binds to `127.0.0.1` only — not your network, not the internet. Only
this laptop can ever reach it, and only while it's running.

## One-time setup

### 1. Create a GitHub OAuth App

Go to <https://github.com/settings/developers> → **OAuth Apps** → **New OAuth App**, signed in as whichever GitHub account has write access to this repo (the one that already pushes to it).

| Field | Value |
|---|---|
| Application name | `Berojgar Engineer CMS` (anything you like) |
| Homepage URL | `http://localhost:8081` |
| Authorization callback URL | `http://localhost:8081/callback` |

GitHub OAuth Apps only allow one callback URL, and it must match exactly —
including `http://` (not `https`) since this never leaves your machine.

Click **Register application**, then **Generate a new client secret**. Copy
both the **Client ID** and the **Client secret** — the secret is only shown
once.

### 2. Configure the local server

```bash
cd cms
cp .env.example .env
```

Open `cms/.env` and paste in the two values:

```
GITHUB_OAUTH_CLIENT_ID=your_client_id_here
GITHUB_OAUTH_CLIENT_SECRET=your_client_secret_here
```

`cms/.env` is already covered by the repo's root `.gitignore` (it ignores
`.env` at any depth) — it will never be committed.

### 3. Install and run

```bash
npm run cms:install   # one-time, installs the one dependency (Express)
npm run cms           # starts the server
```

You'll see:

```
Berojgar Engineer CMS running at http://localhost:8081/
Bound to 127.0.0.1 only — not reachable from your network or the internet.
```

Open <http://localhost:8081> in your browser, click **Login with GitHub**,
approve the OAuth consent screen. You're in.

Stop it any time with `Ctrl+C` — there's nothing else running, nothing to
clean up.

## Day-to-day: writing a post

1. `npm run cms` (from the repo root), open <http://localhost:8081>.
2. **New Blog Posts** → fill in **Title** (the slug is generated from it automatically) → write the **Article** using the toolbar (bold, italic, headings, lists, links, blockquote, code, code blocks, images).
3. Pick **Categories**, optionally a **Cover Image** and **Tags**, leave **Draft** on while you're still writing.
4. **Save** — this commits the file to `src/content/blog/` on `main` with `draft: true`, so it exists in the repo but `isPublished()` keeps it off the live site, the sitemap, and the app feed.
5. When ready, open the post again, turn **Draft** off, and save — that commit is what actually publishes it. The push triggers the normal GitHub Actions build, and it's live in a couple of minutes, same as any manual commit today.

Editing an existing post works the same way — open it from the **Blog
Posts** list, everything (including the existing frontmatter and body) loads
into the same form.

**Tables**: not a toolbar button in Decap's Markdown editor. Use the "Show
raw Markdown" toggle in the top-right of the Article field to type or paste
a Markdown table directly — the rest of that field is plain Markdown too,
so hand-editing there is always safe.

**Images**: uploaded through the Cover Image field or inserted inline go to
`public/images/blog/`, the exact folder every existing post's images
already live in.

## Why this is actually private, not just hidden

Nothing here is reachable unless this server is running on your laptop, and
even then, signing in only works if the GitHub account you authorize with
has write access to `rbcrossley/rbcrossley.github.io` — GitHub itself
enforces that on every read/write call, not this app. See the architecture
write-up (`cms-architecture-plan.md` in the b10g project) for the full
explanation.

## Troubleshooting

- **"Missing GITHUB_OAUTH_CLIENT_ID / ..."** — `cms/.env` doesn't exist yet or is missing a value. Re-check step 2.
- **OAuth redirects to the wrong place / "redirect_uri mismatch"** — the callback URL registered on the GitHub OAuth App must be exactly `http://localhost:8081/callback`. If you changed `PORT` in `.env`, update the OAuth App's callback URL and `BASE_URL` to match.
- **Login succeeds but you can't see/save posts** — the GitHub account you authorized with doesn't have write access to the repo. Log in with the account that already pushes to `rbcrossley/rbcrossley.github.io`.
- **Port already in use** — set `PORT=` to something else in `cms/.env` and update the OAuth App's callback URL to match.
