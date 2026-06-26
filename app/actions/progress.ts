'use server';

import { db } from '@/db';
import { enrollments, lectureProgress, lectures, sections, courses } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/guards';

export async function markLectureComplete(enrollmentId: string, lectureId: string) {
  await requireAuth();

  // Upsert lecture progress
  await db
    .insert(lectureProgress)
    .values({ enrollmentId, lectureId, completed: true, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [lectureProgress.enrollmentId, lectureProgress.lectureId],
      set: { completed: true, updatedAt: new Date() },
    });

  // Recalculate overall enrollment progress
  await recalculateProgress(enrollmentId);
  return { success: true };
}

export async function updateWatchTime(enrollmentId: string, lectureId: string, watchedSeconds: number) {
  await requireAuth();

  await db
    .insert(lectureProgress)
    .values({ enrollmentId, lectureId, watchedSeconds, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [lectureProgress.enrollmentId, lectureProgress.lectureId],
      set: { watchedSeconds, updatedAt: new Date() },
    });

  return { success: true };
}

async function recalculateProgress(enrollmentId: string) {
  const [enrollment] = await db
    .select({ courseId: enrollments.courseId })
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);

  if (!enrollment) return;

  // Count total lectures in course
  const [totalResult] = await db
    .select({ total: count() })
    .from(lectures)
    .innerJoin(sections, eq(lectures.sectionId, sections.id))
    .where(eq(sections.courseId, enrollment.courseId));

  const total = Number(totalResult?.total ?? 0);
  if (total === 0) return;

  // Count completed lectures
  const [completedResult] = await db
    .select({ completed: count() })
    .from(lectureProgress)
    .where(and(eq(lectureProgress.enrollmentId, enrollmentId), eq(lectureProgress.completed, true)));

  const completed = Number(completedResult?.completed ?? 0);
  const progress = Math.round((completed / total) * 100);

  await db
    .update(enrollments)
    .set({ progress, ...(progress === 100 ? { completedAt: new Date() } : {}) })
    .where(eq(enrollments.id, enrollmentId));
}
