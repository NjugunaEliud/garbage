import { NextResponse } from 'next/server';
import { createSessionToken, verifyPassword } from '@/lib/auth';
import { query } from '@/lib/db';
import { timingSafeEqual, createHash } from 'crypto';

function safeCompare(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const username = (body.username ?? '').trim();
  const password = body.password ?? '';

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
  }

  let authenticated = false;

  // 1. Check DB users first
  try {
    const { rows } = await query<{ username: string; password_hash: string }>(
      'SELECT username, password_hash FROM users WHERE username = $1',
      [username],
    );
    if (rows.length > 0) {
      authenticated = await verifyPassword(password, rows[0].password_hash);
    }
  } catch {
    // DB not yet migrated — fall through to env var check
  }

  // 2. Fall back to env var credentials (backwards compat)
  if (!authenticated) {
    const validUser = process.env.ADMIN_USERNAME ?? '';
    const validPass = process.env.ADMIN_PASSWORD ?? '';
    if (validUser && validPass) {
      authenticated = safeCompare(username, validUser) && safeCompare(password, validPass);
    }
  }

  if (!authenticated) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const token = await createSessionToken(username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}
