import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: import.meta.env.UPSTASH_REDIS_REST_URL,
  token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
});

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const count = await redis.scard('subscribers');
    return new Response(
      JSON.stringify({ count }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Count error:', error);
    return new Response(
      JSON.stringify({ count: 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
