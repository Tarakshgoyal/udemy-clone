import { taskQueue } from './index';
import { db } from '@/db';
import { courses, enrollments } from '@/db/schema';
import { eq, avg, count } from 'drizzle-orm';

/**
 * Registered task handlers for the task queue.
 * All handlers are idempotent and safe to retry.
 */

// ─── enrollment-confirmation ──────────────────────────────────────────────────
taskQueue.register<{ userId: string; courseId: string; courseTitle: string; userName: string }>(
  'enrollment-confirmation',
  async ({ userId, courseId, courseTitle, userName }) => {
    // In production this would send an email via a transactional email service
    console.log(`[Queue] 📧 Enrollment confirmation for user ${userName} (${userId}) — Course: "${courseTitle}" (${courseId})`);
  }
);

// ─── update-course-stats ──────────────────────────────────────────────────────
taskQueue.register<{ courseId: string }>(
  'update-course-stats',
  async ({ courseId }) => {
    const [enrollmentCount] = await db
      .select({ count: count() })
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));

    const [reviewStats] = await db
      .select({ avgRating: avg(courses.rating), totalReviews: count() })
      .from(courses)
      .where(eq(courses.id, courseId));

    await db
      .update(courses)
      .set({
        totalStudents: Number(enrollmentCount?.count ?? 0),
        updatedAt: new Date(),
      })
      .where(eq(courses.id, courseId));

    console.log(`[Queue] 📊 Updated stats for course ${courseId}: ${enrollmentCount?.count} students`);
  }
);

// ─── cache-invalidate ─────────────────────────────────────────────────────────
taskQueue.register<{ pattern: string; cacheType: 'course' | 'taxonomy' | 'user' }>(
  'cache-invalidate',
  async ({ pattern, cacheType }) => {
    const { courseCache, taxonomyCache, userCache } = await import('@/lib/cache');
    const cache = cacheType === 'course' ? courseCache : cacheType === 'taxonomy' ? taxonomyCache : userCache;
    cache.invalidatePattern(pattern);
    console.log(`[Queue] 🗑️ Cache invalidated: ${cacheType} pattern "${pattern}"`);
  }
);

// ─── log-analytics ────────────────────────────────────────────────────────────
taskQueue.register<{ event: string; userId?: string; courseId?: string; metadata?: Record<string, unknown> }>(
  'log-analytics',
  async ({ event, userId, courseId, metadata }) => {
    // In production: send to analytics service (Mixpanel, PostHog, etc.)
    console.log(`[Queue] 📈 Analytics: ${event}`, { userId, courseId, metadata });
  }
);

console.log('[Queue] ✅ All task handlers registered');
