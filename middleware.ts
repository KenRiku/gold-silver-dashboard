import { timingSafeEqual } from 'node:crypto';

/**
 * Password gate for the whole site (Vercel Routing Middleware).
 *
 * Every request, including /api/quotes and the built JS that carries data/*.json, needs the
 * username and password set in the Vercel environment variables SITE_USERNAME and SITE_PASSWORD.
 * If either is missing the site stays locked rather than opening up.
 */
export const config = {
  runtime: 'nodejs',
};

const REALM = 'Gold & silver dashboard';

export default function middleware(request: Request): Response {
  const username = process.env.SITE_USERNAME;
  const password = process.env.SITE_PASSWORD;
  if (!username || !password) {
    return new Response('This site is locked: SITE_USERNAME and SITE_PASSWORD are not set in Vercel.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  const supplied = parseBasicAuth(request.headers.get('authorization'));
  if (supplied && safeEqual(supplied.username, username) && safeEqual(supplied.password, password)) {
    // Same as next() from @vercel/functions: let the request continue to the page or API.
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }

  return new Response('Password required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}

function parseBasicAuth(header: string | null): { username: string; password: string } | null {
  if (!header || !header.startsWith('Basic ')) return null;
  let decoded: string;
  try {
    decoded = Buffer.from(header.slice(6).trim(), 'base64').toString('utf8');
  } catch {
    return null;
  }
  const colon = decoded.indexOf(':');
  if (colon < 0) return null;
  return { username: decoded.slice(0, colon), password: decoded.slice(colon + 1) };
}

/** Compares without leaking how many leading characters matched. */
function safeEqual(supplied: string, expected: string): boolean {
  const a = Buffer.from(supplied, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}
