import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';
import { resolveMx } from 'dns/promises';

const redis = new Redis({
  url: import.meta.env.UPSTASH_REDIS_REST_URL,
  token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function hasValidMxRecords(email: string): Promise<boolean> {
  const domain = email.split('@')[1];
  if (!domain) return false;

  try {
    const records = await resolveMx(domain);
    return records && records.length > 0;
  } catch {
    // DNS lookup failed - domain doesn't exist or has no MX records
    return false;
  }
}

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if email domain can receive mail
    const validDomain = await hasValidMxRecords(normalizedEmail);
    if (!validDomain) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if already subscribed
    const exists = await redis.sismember('subscribers', normalizedEmail);
    if (exists) {
      return new Response(
        JSON.stringify({ message: "You're already subscribed!" }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add to subscribers set
    await redis.sadd('subscribers', normalizedEmail);

    return new Response(
      JSON.stringify({ message: 'Thanks for subscribing!' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Subscribe error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to subscribe' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
