import { RATE_LIMIT } from '../constants';

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();

  checkLimit(identifier: string): boolean {
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    if (!entry) {
      this.attempts.set(identifier, { attempts: 1, firstAttempt: now });
      return true;
    }

    if (now - entry.firstAttempt > RATE_LIMIT.WINDOW_MS) {
      this.attempts.set(identifier, { attempts: 1, firstAttempt: now });
      return true;
    }

    if (entry.attempts >= RATE_LIMIT.PASSWORD_ATTEMPTS) {
      return false;
    }

    entry.attempts++;
    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.attempts.entries()) {
      if (now - value.firstAttempt > RATE_LIMIT.WINDOW_MS) {
        this.attempts.delete(key);
      }
    }
  }
}

export const passwordRateLimiter = new RateLimiter();

setInterval(() => {
  passwordRateLimiter.cleanup();
}, RATE_LIMIT.WINDOW_MS);

