import test from 'node:test';
import assert from 'node:assert/strict';

// In-memory rate limiter logic test
class SlidingWindowRateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

    if (validTimestamps.length >= limit) {
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }
}

test('Analytics & Rate Limiter Logic Test', async (t) => {
  await t.test('Rate limiter blocks excess requests over threshold', () => {
    const limiter = new SlidingWindowRateLimiter();
    const ip = '192.168.1.100';

    // Allow 3 requests per second
    assert.equal(limiter.isAllowed(ip, 3, 1000), true);
    assert.equal(limiter.isAllowed(ip, 3, 1000), true);
    assert.equal(limiter.isAllowed(ip, 3, 1000), true);
    // 4th request should be blocked
    assert.equal(limiter.isAllowed(ip, 3, 1000), false);
  });
});
