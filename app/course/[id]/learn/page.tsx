import { requireAuth } from '@/lib/auth/guards';
import { db } from '@/db';
import { courses, enrollments, sections, lectures, lectureProgress } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import LecturePlayer from './_components/LecturePlayer';

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lecture?: string }>;
}) {
  const { id } = await params;
  const { lecture: lectureId } = await searchParams;
  const session = await requireAuth();

  // Verify enrollment
  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, session.userId), eq(enrollments.courseId, id)))
    .limit(1);

  if (!enrollment) redirect(`/course/${id}`);

  // Load course with all sections and lectures
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, id),
    with: {
      sections: {
        orderBy: (s, { asc }) => [asc(s.order)],
        with: {
          lectures: {
            orderBy: (l, { asc }) => [asc(l.order)],
          },
        },
      },
    },
  });

  if (!course) notFound();

  // Load lecture progress for this enrollment
  const progress = await db
    .select()
    .from(lectureProgress)
    .where(eq(lectureProgress.enrollmentId, enrollment.id));

  // Find the active lecture
  const allLectures = course.sections.flatMap(s => s.lectures);
  const activeLecture = lectureId
    ? allLectures.find(l => l.id === lectureId)
    : allLectures[0];

  const completedLectureIds = new Set(progress.filter(p => p.completed).map(p => p.lectureId));

  return (
    <LecturePlayer
      course={course}
      enrollment={enrollment}
      activeLecture={activeLecture ?? null}
      completedLectureIds={Array.from(completedLectureIds)}
    />
  );
}
