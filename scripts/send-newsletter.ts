import 'dotenv/config';
import { Redis } from '@upstash/redis';
import { Resend } from 'resend';
import { marked } from 'marked';
import * as fs from 'fs';
import * as path from 'path';
import { createHmac } from 'crypto';

// Environment variables (loaded from .env)
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'newsletter@yourdomain.com';
const SITE_URL = process.env.SITE_URL || 'https://your-site.vercel.app';
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET;

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  console.error('Missing Upstash Redis credentials');
  process.exit(1);
}

if (!RESEND_API_KEY) {
  console.error('Missing RESEND_API_KEY');
  process.exit(1);
}

if (!UNSUBSCRIBE_SECRET) {
  console.error('Missing UNSUBSCRIBE_SECRET - generate one with: openssl rand -hex 32');
  process.exit(1);
}

function generateUnsubscribeToken(email: string): string {
  return createHmac('sha256', UNSUBSCRIBE_SECRET!)
    .update(email.toLowerCase().trim())
    .digest('hex');
}

const redis = new Redis({
  url: UPSTASH_REDIS_REST_URL,
  token: UPSTASH_REDIS_REST_TOKEN,
});

const resend = new Resend(RESEND_API_KEY);

interface PostFrontmatter {
  title: string;
  description?: string;
  pubDate: string;
}

function getLatestPost(): { slug: string; frontmatter: PostFrontmatter; content: string } | null {
  const blogDir = path.join(process.cwd(), 'src/content/blog');

  if (!fs.existsSync(blogDir)) {
    console.error('Blog directory not found');
    return null;
  }

  const files = fs.readdirSync(blogDir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const content = fs.readFileSync(path.join(blogDir, f), 'utf-8');
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

      if (!frontmatterMatch) return null;

      const frontmatter: Record<string, string> = {};
      frontmatterMatch[1].split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
          frontmatter[key.trim()] = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
        }
      });

      const body = content.replace(/^---\n[\s\S]*?\n---\n?/, '');

      return {
        slug: f.replace('.md', ''),
        frontmatter: frontmatter as unknown as PostFrontmatter,
        content: body,
        date: new Date(frontmatter.pubDate),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.date.getTime() - a!.date.getTime());

  if (files.length === 0) {
    console.error('No blog posts found');
    return null;
  }

  const latest = files[0]!;
  return {
    slug: latest.slug,
    frontmatter: latest.frontmatter,
    content: latest.content,
  };
}

async function sendNewsletter() {
  console.log('Fetching latest post...');
  const post = getLatestPost();

  if (!post) {
    process.exit(1);
  }

  console.log(`Latest post: "${post.frontmatter.title}"`);

  console.log('Fetching subscribers...');
  const subscribers = await redis.smembers('subscribers');

  if (subscribers.length === 0) {
    console.log('No subscribers found');
    process.exit(0);
  }

  console.log(`Found ${subscribers.length} subscriber(s)`);

  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  const postHtml = await marked(post.content);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { font-size: 24px; color: #800080; }
    .content { line-height: 1.6; color: #333; }
    .content h2 { font-size: 20px; margin-top: 24px; }
    .content h3 { font-size: 18px; margin-top: 20px; }
    .content p { margin: 12px 0; }
    .content ul, .content ol { margin: 12px 0; padding-left: 24px; }
    .content blockquote { border-left: 3px solid #ccc; padding-left: 15px; color: #555; margin: 15px 0; }
    .content code { background: #f5f5f5; padding: 2px 5px; font-family: monospace; }
    .content pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
    .view-online { display: inline-block; margin-top: 20px; color: #00c; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h1>${post.frontmatter.title}</h1>
  <div class="content">
    ${postHtml}
  </div>
  <p><a href="${postUrl}" class="view-online">View on website &rarr;</a></p>
  <div class="footer">
    <p>You received this because you subscribed to cedar's blog.</p>
    <p><a href="${SITE_URL}/api/unsubscribe?email=EMAIL_PLACEHOLDER&token=TOKEN_PLACEHOLDER">Unsubscribe</a></p>
  </div>
</body>
</html>
  `.trim();

  let sent = 0;
  let failed = 0;

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (const email of subscribers) {
    try {
      const emailStr = email as string;
      const token = generateUnsubscribeToken(emailStr);
      const personalizedHtml = htmlContent
        .replace('EMAIL_PLACEHOLDER', encodeURIComponent(emailStr))
        .replace('TOKEN_PLACEHOLDER', token);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email as string,
        subject: post.frontmatter.title,
        html: personalizedHtml,
      });
      console.log(`Sent to: ${email}`);
      sent++;
      // Rate limit: 2 emails per second (500ms between sends)
      await delay(500);
    } catch (error) {
      console.error(`Failed to send to ${email}:`, error);
      failed++;
    }
  }

  console.log(`\nDone! Sent: ${sent}, Failed: ${failed}`);
}

sendNewsletter().catch(console.error);
