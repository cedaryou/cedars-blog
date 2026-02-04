import 'dotenv/config';
import { Redis } from '@upstash/redis';
import { resolveMx } from 'dns/promises';

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  console.error('Missing Upstash Redis credentials');
  process.exit(1);
}

const redis = new Redis({
  url: UPSTASH_REDIS_REST_URL,
  token: UPSTASH_REDIS_REST_TOKEN,
});

async function hasValidMxRecords(email: string): Promise<boolean> {
  const domain = email.split('@')[1];
  if (!domain) return false;

  try {
    const records = await resolveMx(domain);
    return records && records.length > 0;
  } catch {
    return false;
  }
}

async function cleanupSubscribers() {
  console.log('Fetching subscribers...');
  const subscribers = await redis.smembers('subscribers');

  if (subscribers.length === 0) {
    console.log('No subscribers found');
    return;
  }

  console.log(`Found ${subscribers.length} subscriber(s)\n`);

  let valid = 0;
  let removed = 0;

  for (const email of subscribers) {
    const emailStr = email as string;
    const isValid = await hasValidMxRecords(emailStr);

    if (isValid) {
      console.log(`✓ ${emailStr}`);
      valid++;
    } else {
      console.log(`✗ ${emailStr} (removing)`);
      await redis.srem('subscribers', emailStr);
      removed++;
    }
  }

  console.log(`\nDone! Valid: ${valid}, Removed: ${removed}`);
}

cleanupSubscribers().catch(console.error);
