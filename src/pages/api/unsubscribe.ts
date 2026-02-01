import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';
import { createHmac, timingSafeEqual } from 'crypto';

const redis = new Redis({
  url: import.meta.env.UPSTASH_REDIS_REST_URL,
  token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
});

const UNSUBSCRIBE_SECRET = import.meta.env.UNSUBSCRIBE_SECRET;

function verifyToken(email: string, token: string): boolean {
  if (!UNSUBSCRIBE_SECRET) {
    console.error('UNSUBSCRIBE_SECRET not configured');
    return false;
  }

  const expectedToken = createHmac('sha256', UNSUBSCRIBE_SECRET)
    .update(email.toLowerCase().trim())
    .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
  } catch {
    return false;
  }
}

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const email = url.searchParams.get('email');
  const token = url.searchParams.get('token');

  if (!email || !token) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/unsubscribe?error=missing' },
    });
  }

  if (!verifyToken(email, token)) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/unsubscribe?error=invalid' },
    });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    await redis.srem('subscribers', normalizedEmail);

    return new Response(null, {
      status: 302,
      headers: { Location: '/unsubscribe?success=true' },
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new Response(null, {
      status: 302,
      headers: { Location: '/unsubscribe?error=failed' },
    });
  }
};
