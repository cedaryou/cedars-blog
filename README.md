# cedar's blog

A simple Craigslist-style personal blog built with [Astro](https://astro.build), deployed to [Vercel](https://vercel.com).

- **Live site:** https://cedaryou.com
- **Stack:** Astro 5 (SSR on Vercel), Markdown posts written in Obsidian, plain CSS

## Commands

```bash
npm install    # install dependencies
npm run dev    # local dev server at http://localhost:4321
npm run build  # production build to dist/
```

## Deploying

Push to `main` — Vercel auto-deploys.

## Writing a post

Add a `.md` file to `src/content/blog/` with frontmatter:

```markdown
---
title: "Post Title"
description: "Short description"
pubDate: 2026-01-01
author: "Cedar"
---

Body here...
```

The filename becomes the slug (`My Post.md` → `/blog/my-post`).

## Notes

- Blog posts live in `src/content/blog/` — that folder is also an Obsidian vault.
- Full project docs are in `CLAUDE.md`.
