export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * Check if a request from key (IP/user) is allowed
   * @param key Identifier (e.g. IP address)
   * @param limit Max requests allowed in window
   * @param windowMs Window duration in milliseconds (default 60000ms = 1 min)
   */
  check(key: string, limit: number = 10, windowMs: number = 60000): { success: boolean; remaining: number } {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

    if (validTimestamps.length >= limit) {
      return { success: false, remaining: 0 };
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return { success: true, remaining: limit - validTimestamps.length };
  }
}

export const rateLimiter = new RateLimiter();
