import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: import.meta.env.UPSTASH_REDIS_REST_URL,
  token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
});

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const email = url.searchParams.get('email');

  if (!email) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/unsubscribe?error=missing' },
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
