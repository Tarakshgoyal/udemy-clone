import { NextRequest } from 'next/server';
import { db } from '@/db';
import { courses, enrollments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { courseCache } from '@/lib/cache';
import { cached } from '@/lib/cache/cached';
import { getSession } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const course = await cached(courseCache, `course:${id}`, async () => {
      return db.query.courses.findFirst({
        where: eq(courses.id, id),
        with: {
          creator: { columns: { id: true, name: true, avatarUrl: true, bio: true } },
          topic: {
            with: {
              subcategory: {
                with: { category: true },
              },
            },
          },
          sections: {
            orderBy: (s, { asc }) => [asc(s.order)],
            with: {
              lectures: {
                orderBy: (l, { asc }) => [asc(l.order)],
                columns: { videoUrl: false }, // Don't expose video URLs in listing
              },
            },
          },
          reviews: {
            with: { user: { columns: { id: true, name: true, avatarUrl: true } } },
            limit: 10,
            orderBy: (r, { desc }) => [desc(r.createdAt)],
          },
        },
      });
    });

    if (!course) {
      return Response.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check enrollment status if user is logged in
    const session = await getSession();
    let isEnrolled = false;
    if (session) {
      const [enrollment] = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(and(eq(enrollments.userId, session.userId), eq(enrollments.courseId, id)))
        .limit(1);
      isEnrolled = !!enrollment;
    }

    return Response.json({ course, isEnrolled });
  } catch (error) {
    console.error('Course detail API error:', error);
    return Response.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}
