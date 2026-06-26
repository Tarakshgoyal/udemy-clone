'use server';

import { redirect } from 'next/navigation';
import { db } from '@/db';
import { courses, sections, lectures } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireCreator } from '@/lib/auth/guards';
import { CourseSchema, SectionSchema, LectureSchema, type FormState } from '@/lib/validations';
import { courseCache } from '@/lib/cache';
import { taskQueue } from '@/lib/queue';

// ─── Create Course ─────────────────────────────────────────────────────────────

export async function createCourse(state: FormState, formData: FormData): Promise<FormState> {
  const session = await requireCreator();

  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    price: formData.get('price'),
    originalPrice: formData.get('originalPrice') || undefined,
    level: formData.get('level'),
    language: formData.get('language'),
    topicId: formData.get('topicId') || undefined,
    thumbnailUrl: formData.get('thumbnailUrl') || undefined,
    whatYouLearn: formData.getAll('whatYouLearn').map(String).filter(Boolean),
    requirements: formData.getAll('requirements').map(String).filter(Boolean),
  };

  const parsed = CourseSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const slug = parsed.data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) + '-' + Date.now().toString(36);

  const [course] = await db
    .insert(courses)
    .values({ ...parsed.data, slug, creatorId: session.userId })
    .returning({ id: courses.id, slug: courses.slug });

  if (!course) return { message: 'Failed to create course' };

  // Invalidate list cache
  courseCache.invalidatePattern('courses:list');

  redirect(`/creator-studio/courses/${course.id}/edit`);
}

// ─── Update Course ─────────────────────────────────────────────────────────────

export async function updateCourse(courseId: string, state: FormState, formData: FormData): Promise<FormState> {
  const session = await requireCreator();

  // Verify ownership
  const [existing] = await db.select({ creatorId: courses.creatorId }).from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!existing || existing.creatorId !== session.userId) {
    return { message: 'Course not found or access denied' };
  }

  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    price: formData.get('price'),
    originalPrice: formData.get('originalPrice') || undefined,
    level: formData.get('level'),
    language: formData.get('language'),
    topicId: formData.get('topicId') || undefined,
    thumbnailUrl: formData.get('thumbnailUrl') || undefined,
    previewVideoUrl: formData.get('previewVideoUrl') || undefined,
    whatYouLearn: formData.getAll('whatYouLearn').map(String).filter(Boolean),
    requirements: formData.getAll('requirements').map(String).filter(Boolean),
  };

  const parsed = CourseSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.update(courses).set({ ...parsed.data, updatedAt: new Date() }).where(eq(courses.id, courseId));

  // Invalidate caches
  courseCache.delete(`course:${courseId}`);
  courseCache.invalidatePattern('courses:list');

  return { message: 'Course updated successfully' };
}

// ─── Publish Course ─────────────────────────────────────────────────────────────

export async function publishCourse(courseId: string): Promise<void> {
  const session = await requireCreator();

  const [existing] = await db.select({ creatorId: courses.creatorId }).from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!existing || existing.creatorId !== session.userId) {
    throw new Error('Course not found or access denied');
  }

  await db.update(courses).set({ status: 'PUBLISHED', updatedAt: new Date() }).where(eq(courses.id, courseId));
  courseCache.delete(`course:${courseId}`);
  courseCache.invalidatePattern('courses:list');
}

// ─── Unpublish Course ──────────────────────────────────────────────────────────

export async function unpublishCourse(courseId: string): Promise<void> {
  const session = await requireCreator();

  const [existing] = await db.select({ creatorId: courses.creatorId }).from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!existing || existing.creatorId !== session.userId) {
    throw new Error('Course not found or access denied');
  }

  await db.update(courses).set({ status: 'DRAFT', updatedAt: new Date() }).where(eq(courses.id, courseId));
  courseCache.delete(`course:${courseId}`);
  courseCache.invalidatePattern('courses:list');
}

// ─── Add Section ─────────────────────────────────────────────────────────────

export async function addSection(state: FormState<any>, formData: FormData): Promise<FormState<any>> {
  const session = await requireCreator();

  const raw = { title: formData.get('title'), courseId: formData.get('courseId') };
  const parsed = SectionSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  // Verify ownership
  const [course] = await db.select({ creatorId: courses.creatorId }).from(courses).where(eq(courses.id, parsed.data.courseId)).limit(1);
  if (!course || course.creatorId !== session.userId) return { message: 'Access denied' };

  // Get current max order
  const existingSections = await db.select({ order: sections.order }).from(sections).where(eq(sections.courseId, parsed.data.courseId));
  const maxOrder = existingSections.reduce((max, s) => Math.max(max, s.order), 0);

  const [section] = await db.insert(sections).values({ ...parsed.data, order: maxOrder + 1 }).returning();
  courseCache.delete(`course:${parsed.data.courseId}`);

  return { data: section } as FormState<any>;
}

// ─── Add Lecture ──────────────────────────────────────────────────────────────

export async function addLecture(state: FormState<any>, formData: FormData): Promise<FormState<any>> {
  await requireCreator();

  const raw = {
    title: formData.get('title'),
    sectionId: formData.get('sectionId'),
    videoUrl: formData.get('videoUrl') || undefined,
    duration: formData.get('duration') || 0,
    isFree: formData.get('isFree') === 'true',
    description: formData.get('description') || undefined,
  };

  const parsed = LectureSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const existingLectures = await db.select({ order: lectures.order }).from(lectures).where(eq(lectures.sectionId, parsed.data.sectionId));
  const maxOrder = existingLectures.reduce((max, l) => Math.max(max, l.order), 0);

  const [lecture] = await db.insert(lectures).values({ ...parsed.data, order: maxOrder + 1 }).returning();

  return { data: lecture } as FormState<any>;
}

// ─── Delete Lecture ───────────────────────────────────────────────────────────

export async function deleteLecture(lectureId: string): Promise<{ success: boolean }> {
  await requireCreator();
  await db.delete(lectures).where(eq(lectures.id, lectureId));
  return { success: true };
}

// ─── Delete Section ───────────────────────────────────────────────────────────

export async function deleteSection(sectionId: string): Promise<{ success: boolean }> {
  await requireCreator();
  await db.delete(sections).where(eq(sections.id, sectionId));
  return { success: true };
}

// ─── Update Lecture Video URL ─────────────────────────────────────────────────

export async function updateLectureVideo(lectureId: string, videoUrl: string, duration?: number): Promise<{ success: boolean }> {
  await requireCreator();
  await db.update(lectures).set({ videoUrl, ...(duration ? { duration } : {}) }).where(eq(lectures.id, lectureId));
  return { success: true };
}
