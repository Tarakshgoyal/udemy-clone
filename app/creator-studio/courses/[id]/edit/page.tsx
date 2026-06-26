import { requireCreator } from '@/lib/auth/guards';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import CourseEditForm from './_components/CourseEditForm';

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireCreator();

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
      topic: {
        with: { subcategory: { with: { category: true } } },
      },
    },
  });

  if (!course) notFound();
  if (course.creatorId !== session.userId) redirect('/creator-studio');

  return <CourseEditForm course={course} />;
}
