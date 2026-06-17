import { NextResponse } from 'next/server';
import { hashPassword, createSessionToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const username = (body.username ?? '').trim();
  const password = body.password ?? '';

  if (!username || username.length < 3) {
    return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  // Only allow registration if no users exist yet
  const { rows: existing } = await query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM users',
  );
  if (Number(existing[0].count) > 0) {
    return NextResponse.json(
      { error: 'Registration is closed. Contact your administrator.' },
      { status: 403 },
    );
  }

  // Check username uniqueness
  const { rows: taken } = await query<{ id: number }>(
    'SELECT id FROM users WHERE username = $1',
    [username],
  );
  if (taken.length > 0) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  await query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [
    username,
    passwordHash,
  ]);

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
