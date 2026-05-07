# Berojgar Engineer

A clean, fast, **100% static** computer-science learning blog built with **Astro 4** + **Markdown**. Designed to be deployed on **GitHub Pages** at `https://rbcrossley.github.io`.

> No backend. No database. No runtime API calls. Builds to plain HTML/CSS/JS that you can host on **GitHub Pages**, Netlify, Vercel, Cloudflare Pages, or any static host.

---

## 🚀 Quick Start (local development)

```bash
# 1. Install Node.js 20+ and Yarn (one time)
# 2. Clone your repo and install
git clone https://github.com/rbcrossley/rbcrossley.github.io.git
cd rbcrossley.github.io
yarn install

# 3. Run the local dev server
yarn dev          # http://localhost:3000

# 4. Build the production static site
yarn build        # output goes to ./dist

# 5. Preview the production build
yarn preview
```

---

## 🌐 Deploy to GitHub Pages

Your repo `rbcrossley.github.io` is a **user page**, so it serves at the root (`https://rbcrossley.github.io/`). The included GitHub Action handles everything automatically:

1. Push your changes to the `main` branch.
2. Go to **Settings → Pages → Build and deployment → Source = GitHub Actions** (one-time setup).
3. Every push triggers `.github/workflows/deploy.yml` which builds & publishes the site.

That’s it. ~2 minutes after every push, the site is live at **https://rbcrossley.github.io/**.

---

## 📁 Project Structure

```
.
├── theme.config.js                    # 🎨 Site-wide colors & brand info
├── astro.config.mjs                   # build config
├── src/
│   ├── content/
│   │   ├── courses/                   # Subjects (JSON)
│   │   ├── topics/                    # Topic articles (Markdown)
│   │   └── blog/                      # Blog posts (Markdown)
│   ├── components/                    # Header, Footer, Sidebar...
│   ├── layouts/Base.astro             # Shared layout
│   ├── lib/link.ts                    # Link helper for base path
│   └── pages/                         # Route files
│       ├── index.astro                # Homepage
│       ├── [slug].astro               # Auto-routes /<topic-slug>
│       ├── courses.astro              # /courses
│       ├── blog/                      # /blog and /blog/<post>
│       ├── about.astro
│       ├── contact.astro
│       ├── privacy-policy.astro       # AdSense-required
│       ├── terms.astro
│       ├── disclaimer.astro
│       └── cookie-policy.astro
├── public/                            # Static assets (favicon, images you upload)
└── .github/workflows/deploy.yml       # Auto-deploy
```

---

## ✍️ How to Add Content

### A. Add a new subject (course)

Subjects are defined as JSON files inside `src/content/courses/`.

**Example:** create `src/content/courses/machine-learning.json`:

```json
{
  "slug": "machine-learning",
  "title": "Machine Learning",
  "short": "Machine Learning",
  "icon": "/images/icons/ml.png",
  "description": "Algorithms and statistical models used by computers to perform tasks without explicit instructions.",
  "sections": [
    {
      "name": "Introduction",
      "topics": [
        { "slug": "machine-learning",        "title": "Introduction to ML" },
        { "slug": "supervised-learning",     "title": "Supervised Learning" },
        { "slug": "unsupervised-learning",   "title": "Unsupervised Learning" }
      ]
    },
    {
      "name": "Algorithms",
      "topics": [
        { "slug": "linear-regression",       "title": "Linear Regression" },
        { "slug": "decision-trees",          "title": "Decision Trees" }
      ]
    }
  ]
}
```

**Field meanings:**
| Field | Purpose |
|-------|---------|
| `slug` | URL part. Course landing page = `/<slug>` (here: `/machine-learning`) |
| `title` | Full course name |
| `short` | Short label shown on the homepage card |
| `description` | Short text shown on the `/courses` page |
| `sections[]` | Array of sidebar groups (e.g., “Introduction”, “Algorithms”) |
| `sections[].topics[]` | Array of `{slug, title}` for the sidebar |

After saving, the new course appears automatically on:
- The homepage (with auto-generated initial badge `ML`)
- `/courses`
- The dropdown is hard-coded — to add to the **Courses dropdown**, edit `src/components/Header.astro`.

> **Tip:** the FIRST topic slug should usually equal the course slug, so `/machine-learning` shows the intro article (see step B).

---

### B. Add a new topic (article)

Articles are Markdown files inside `src/content/topics/`.

**Example:** create `src/content/topics/supervised-learning.md`:

```markdown
---
title: Supervised Learning
course: machine-learning      # must match a course slug
section: Introduction
description: Supervised learning is a type of machine learning where a model learns from labeled training data.
---

## What is Supervised Learning?

In supervised learning, the algorithm is given a dataset where the **correct answers** are provided. The algorithm tries to learn the mapping from inputs to outputs.

## Common Algorithms

- **Linear Regression** — predicts a continuous output
- **Logistic Regression** — predicts a binary outcome
- **Decision Trees** — tree-based decision making
- **Support Vector Machines** — find the best separating line

## Example Code

```python
from sklearn.linear_model import LinearRegression
model = LinearRegression()
model.fit(X_train, y_train)
predictions = model.predict(X_test)
```

## Discover more

The `discoverMore` field below is optional. If omitted, the right sidebar will auto-fill with neighbour topics.
```

**Frontmatter fields:**
| Field | Required | Purpose |
|-------|----------|---------|
| `title` | ✅ | Article title (h1) |
| `course` | ✅ | Slug of the parent course (must match a course JSON `slug`) |
| `section` | ⛔ | Sidebar group name (informational only) |
| `description` | ⛔ | Used for `<meta description>` and on listings |
| `order` | ⛔ | Numeric order hint |
| `discoverMore` | ⛔ | Custom right-sidebar list `[{ title, href }]` |

**Article URL** = `/<filename-without-extension>` → here `/supervised-learning`.

> Make sure each topic’s slug is also listed under the correct course’s `sections[].topics[]` so it appears in the sidebar.

---

### C. Add a blog post

Blog posts live in `src/content/blog/`.

**Example:** `src/content/blog/my-first-post.md`:

```markdown
---
title: My First Blog Post
description: A short summary that appears on the blog index card.
date: 2026-05-12
author: rb
---

## Hello world!

Write whatever you want here in **Markdown**.

![A cool image](/images/blog/my-first-post-hero.jpg)

> Blockquotes work, *italic* works, **bold** works, [links](https://google.com) work.
```

**Frontmatter fields:**
| Field | Required | Purpose |
|-------|----------|---------|
| `title` | ✅ | Post title |
| `description` | ⛔ | Excerpt on blog index |
| `date` | ✅ | YYYY-MM-DD — used for sorting |
| `author` | ⛔ | Defaults to `cst` if omitted |

The post URL is `/blog/my-first-post`.

---

### D. Add images

1. **Put image files in `public/images/`** (create the folder if it doesn’t exist). For example:
   ```
   public/
     images/
       blog/
         my-first-post-hero.jpg
       icons/
         ml.png
       articles/
         osi-model-diagram.png
   ```

2. **Reference them with an absolute path starting with `/`**, e.g. inside Markdown:

   ```markdown
   ![OSI model diagram](/images/articles/osi-model-diagram.png)
   ```

   Or with width / alignment:

   ```html
   <img src="/images/articles/osi-model-diagram.png" alt="OSI model" width="600" style="margin: 0 auto;" />
   ```

3. **Recommended specs**
   - Hero / blog cover: **1200 × 675 px**, JPG ≤ 200 KB
   - Inline diagrams: **800 × auto**, PNG with transparency
   - Course icons: **128 × 128 px**, PNG
   - Always include `alt` text — it’s good for SEO and accessibility.

4. **Optimisation tip:** run images through [squoosh.app](https://squoosh.app) before committing to keep the repo small.

---

## 🎨 Customising Colors

Edit `theme.config.js`:

```js
export default {
  colors: {
    primary: '#E91E63',         // accent (links, buttons, active items)
    primaryDark: '#C2185B',     // hover
    primaryLight: '#FDE8EC',    // header bg / sidebar headers
    logo: '#A02020',            // logo background
    heroBg: '#2E3141',          // dark hero background
    heroAccent: '#E91E63',      // hero heading
    sidebarSection: '#FBD9DC',
    sidebarActive: '#E91E63',
    footerBg: '#2E3141',
    // … see file for the full list
  },
  site: {
    name: 'Berojgar Engineer',
    tagline: 'Concept Clarity for Computer Science Students',
    logoText: 'BE',
    domain: 'rbcrossley.github.io',
    contactEmail: 'contact@berojgarengineer.com',
  },
};
```

After changing, run `yarn dev` (auto-reloads) or rebuild for production.

---

## 💰 Google AdSense Integration

The site already includes the standard AdSense-required pages:

- `/about` — About Us
- `/contact` — Contact Us
- `/privacy-policy` — Privacy Policy (mentions AdSense + DART cookies + GDPR + CCPA)
- `/terms` — Terms & Conditions
- `/disclaimer` — Disclaimer
- `/cookie-policy` — Cookie Policy

All four legal pages are linked from the **Legal** column in the footer.

### Add your AdSense publisher ID

1. Get your AdSense `ca-pub-XXXXXXXXXXXXXXXX` from <https://www.google.com/adsense/>.
2. Open `src/layouts/Base.astro`.
3. Inside `<head>`, add:

   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
   ```

4. Replace the `XXXXXXXXXXXXXXXX` with your real ID, commit and push.
5. Add an `ads.txt` file at the repo root (i.e., `public/ads.txt`):

   ```
   google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
   ```

6. To insert auto-ads or in-article ads, paste the AdSense `<ins class="adsbygoogle">` snippet anywhere inside Markdown content (it will render as raw HTML).

> Make sure you have at least 15–25 quality articles before applying for AdSense.

---

## 📦 Commands Reference

| Command         | What it does                                  |
|-----------------|-----------------------------------------------|
| `yarn dev`      | Local dev server at http://localhost:3000     |
| `yarn start`    | Same as `dev` (alias)                         |
| `yarn build`    | Build static site to `./dist/`                |
| `yarn preview`  | Preview the built site                        |

---

## 🆘 Common Issues

**Q: I added a new topic but it doesn’t show in the course sidebar.**
A: Make sure you added the topic’s slug to the relevant course JSON under `sections[].topics[]`.

**Q: I added a course but its homepage page (`/<slug>`) is blank.**
A: Create a topic Markdown with the same filename as the course slug. e.g. course slug `machine-learning` → also create `src/content/topics/machine-learning.md`.

**Q: Images don’t show after deploy.**
A: Ensure the image is inside `public/` and you reference it with an absolute path starting with `/`. Astro copies everything in `public/` to the site root verbatim.

**Q: Can I disable AdSense pages?**
A: Just delete the page files and remove the corresponding `<a>` tags in `src/components/Footer.astro`.

---

## ✅ Static Site Guarantee

- ❌ No backend / no API calls / no database
- ❌ No runtime environment variables
- ❌ No server-side rendering at request time
- ✅ 100% static output — plain HTML, CSS and minimal JS
- ✅ Works offline once loaded
- ✅ Hostable on GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3, or any plain web server.
