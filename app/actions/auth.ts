'use server';

import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession, deleteSession } from '@/lib/auth/session';
import { SignupSchema, LoginSchema, type FormState } from '@/lib/validations';

// ─── Signup ───────────────────────────────────────────────────────────────────

export async function signup(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role') ?? 'USER',
  };

  const parsed = SignupSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password, role } = parsed.data;

  // Check if email already exists
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return { errors: { email: ['An account with this email already exists'] } };
  }

  const passwordHash = await hashPassword(password);

  const [newUser] = await db
    .insert(users)
    .values({ name, email, passwordHash, role })
    .returning({ id: users.id, role: users.role });

  if (!newUser) {
    return { message: 'Failed to create account. Please try again.' };
  }

  await createSession(newUser.id, newUser.role);
  redirect(newUser.role === 'CREATOR' ? '/creator-studio' : '/');
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return { errors: { email: ['Invalid email or password'] } };
  }

  const passwordMatch = await verifyPassword(password, user.passwordHash);
  if (!passwordMatch) {
    return { errors: { email: ['Invalid email or password'] } };
  }

  await createSession(user.id, user.role);
  redirect(user.role === 'CREATOR' ? '/creator-studio' : '/');
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/login');
}
