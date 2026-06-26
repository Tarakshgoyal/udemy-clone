import 'server-only';
import { redirect } from 'next/navigation';
import { getSession, type SessionPayload } from './session';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

export async function requireCreator(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'CREATOR') redirect('/');
  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    return user ?? null;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionPayload | null> {
  return getSession();
}
