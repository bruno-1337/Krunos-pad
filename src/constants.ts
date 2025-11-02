export const DEFAULT_PAD_CONTENT = 'This is Empty';

export const PATHS = {
  PUBLIC: 'public',
  VIEWS: 'views',
  INDEX: 'index.html',
  PASSWORD: 'password.html',
  CONTENT: 'content.html'
} as const;

export const RATE_LIMIT = {
  PASSWORD_ATTEMPTS: 5,
  WINDOW_MS: 15 * 60 * 1000
} as const;

