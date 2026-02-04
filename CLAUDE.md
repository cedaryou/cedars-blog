# Cedar's Blog

A simple Craigslist-style personal blog built with Astro.

## Quick Commands

```bash
npm run dev         # Start local server at http://localhost:4321
npm run build       # Build for production
npm run preview     # Preview production build
npm run newsletter  # Send newsletter to subscribers
```

## Deployment

```bash
git add .
git commit -m "Description of changes"
git push
```

Pushing to main auto-deploys to Vercel.

- **GitHub repo:** https://github.com/cedaryou/cedars-blog
- **Live site:** Check Vercel dashboard for URL

## Project Structure

```
src/
├── content/blog/      # Blog posts (markdown files)
├── layouts/           # BaseLayout.astro (main template)
├── pages/
│   ├── index.astro    # Homepage
│   ├── about.astro    # About page
│   ├── subscribe.astro # Newsletter signup
│   ├── api/subscribe.ts # Subscribe API endpoint
│   └── blog/[...slug].astro  # Blog post template
└── styles/global.css  # All CSS styling
scripts/
└── send-newsletter.ts # Manual newsletter sender
```

## Adding a New Blog Post

Create a new `.md` file in `src/content/blog/` with this format:

```markdown
---
title: "Your Post Title"
description: "Brief description"
pubDate: 2025-01-29
author: "Cedar"
---

Your content here...
```

The filename becomes the URL slug (e.g., `my-post.md` → `/blog/my-post`).

## Key Files to Edit

| What | File |
|------|------|
| About page | `src/pages/about.astro` |
| Site title/nav | `src/layouts/BaseLayout.astro` |
| Homepage | `src/pages/index.astro` |
| Styling | `src/styles/global.css` |
| Subscribe page | `src/pages/subscribe.astro` |
| Subscribe API | `src/pages/api/subscribe.ts` |
| Unsubscribe API | `src/pages/api/unsubscribe.ts` |

## Newsletter

Send a newsletter to all subscribers after publishing a new post:

```bash
npm run newsletter
```

Requires environment variables (see `.env.example`):
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from [Upstash](https://console.upstash.com/)
- `RESEND_API_KEY` from [Resend](https://resend.com/api-keys)
- `FROM_EMAIL` - your verified sender email
- `SITE_URL` - your deployed site URL
- `UNSUBSCRIBE_SECRET` - HMAC secret for signed unsubscribe links (generate with `openssl rand -hex 32`)

## Security

- Unsubscribe links use HMAC-SHA256 signed tokens to prevent unauthorized unsubscriptions
- The token is generated from the email + `UNSUBSCRIBE_SECRET` and verified server-side
- Both `.env` and Vercel must have matching `UNSUBSCRIBE_SECRET` values

## Notes

- Blog posts are written in Markdown
- Frontmatter (the `---` block) must have no extra spaces or special characters
- If editing in Obsidian, type frontmatter fresh rather than copying from elsewhere
- Preview locally with `npm run dev` before pushing
