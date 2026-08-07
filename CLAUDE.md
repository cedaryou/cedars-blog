# Cedar's Blog

A simple Craigslist-style personal blog built with Astro.

## Quick Commands

```bash
npm run dev         # Start local server at http://localhost:4321
npm run build       # Build for production
npm run preview     # Preview production build
```

## Deployment

```bash
git add .
git commit -m "Description of changes"
git push
```

Pushing to main auto-deploys to Vercel.

- **GitHub repo:** https://github.com/cedaryou/cedars-blog
- **Live site:** https://cedaryou.com

## Project Structure

```
src/
├── content/blog/      # Blog posts (markdown files)
├── layouts/           # BaseLayout.astro (main template)
├── pages/
│   ├── index.astro    # Homepage
│   ├── about.astro    # About page
│   ├── 404.astro      # 404 page
│   └── blog/[...slug].astro  # Blog post template
└── styles/global.css  # All CSS styling
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
Astro slugifies filenames: `My Post.md` → `/blog/my-post`.

## Key Files to Edit

| What | File |
|------|------|
| About page | `src/pages/about.astro` |
| Site title/nav | `src/layouts/BaseLayout.astro` |
| Homepage | `src/pages/index.astro` |
| Styling | `src/styles/global.css` |
| 404 page | `src/pages/404.astro` |

## Notes

- Blog posts are written in Markdown
- Frontmatter (the `---` block) must have no extra spaces or special characters
- If editing in Obsidian, type frontmatter fresh rather than copying from elsewhere
- Preview locally with `npm run dev` before pushing
