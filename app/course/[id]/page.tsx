import React from 'react';
import Link from 'next/link';
import {
  PlayCircle, Award, Infinity, Smartphone, FileText,
  Check, ChevronDown, Globe, MonitorPlay, Download, Users, Star, Info, Lock
} from 'lucide-react';
import { db } from '@/db';
import { courses, enrollments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { courseCache } from '@/lib/cache';
import { cached } from '@/lib/cache/cached';
import RazorpayCheckout from '@/components/RazorpayCheckout';
import { getCurrentUser } from '@/lib/auth/guards';

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, user] = await Promise.all([getSession(), getCurrentUser()]);

  const course = await cached(courseCache, `course:${id}`, async () => {
    return db.query.courses.findFirst({
      where: eq(courses.id, id),
      with: {
        creator: { columns: { id: true, name: true, avatarUrl: true, bio: true } },
        topic: {
          with: { subcategory: { with: { category: true } } },
        },
        sections: {
          orderBy: (s, { asc }) => [asc(s.order)],
          with: {
            lectures: {
              orderBy: (l, { asc }) => [asc(l.order)],
              columns: { videoUrl: false },
            },
          },
        },
      },
    });
  });

  if (!course) notFound();

  let isEnrolled = false;
  if (session) {
    const [enrollment] = await db.select({ id: enrollments.id }).from(enrollments)
      .where(and(eq(enrollments.userId, session.userId), eq(enrollments.courseId, id))).limit(1);
    isEnrolled = !!enrollment;
  }

  const totalLectures = course.sections.reduce((sum, s) => sum + s.lectures.length, 0);
  const category = course.topic?.subcategory?.category;
  const subcategory = course.topic?.subcategory;

  return (
    <div className="w-full flex flex-col font-sans text-gray-900 pb-20">
      {/* Dark Hero */}
      <div className="bg-[#1c1d1f] text-white py-8 w-full">
        <div className="max-w-[1180px] mx-auto px-6 flex flex-col lg:flex-row relative">
          <div className="w-full lg:w-2/3 pr-0 lg:pr-12">
            {/* Breadcrumb */}
            {category && (
              <div className="text-[#c0c4fc] text-sm font-bold flex items-center gap-2 mb-4 flex-wrap">
                <Link href={`/categories/${category.slug}`} className="hover:text-white">{category.name}</Link>
                {subcategory && <><span>›</span><Link href={`/categories/${category.slug}/${subcategory.slug}`} className="hover:text-white">{subcategory.name}</Link></>}
                {course.topic && <><span>›</span><span>{course.topic.name}</span></>}
              </div>
            )}

            <h1 className="text-3xl lg:text-4xl font-bold mb-4 font-serif leading-tight">{course.title}</h1>
            <p className="text-lg mb-4 text-gray-100">{course.description.slice(0, 200)}{course.description.length > 200 ? '...' : ''}</p>

            <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-sm mb-4">
              {course.totalStudents > 10000 && (
                <span className="bg-[#eceb98] text-[#3d3c0a] font-bold px-2 py-1 text-xs">Bestseller</span>
              )}
              {course.rating > 0 && (
                <div className="flex items-center text-[#f69c08] font-bold">
                  <span className="mr-1">{course.rating.toFixed(1)}</span>
                  <Star className="w-3.5 h-3.5 fill-current" />
                </div>
              )}
              {course.totalReviews > 0 && (
                <span className="text-[#c0c4fc]">({course.totalReviews.toLocaleString()} ratings)</span>
              )}
              <span>{course.totalStudents.toLocaleString()} students</span>
            </div>

            <div className="text-sm mb-4">
              Created by <span className="text-[#c0c4fc] font-semibold">{course.creator?.name}</span>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1"><Info className="w-4 h-4" /><span>Last updated {new Date(course.updatedAt).toLocaleDateString('en-US', { month: 'numeric', year: 'numeric' })}</span></div>
              <div className="flex items-center gap-1"><Globe className="w-4 h-4" /><span>{course.language}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1180px] mx-auto px-6 mt-8 flex flex-col lg:flex-row relative">
        {/* Left Content */}
        <div className="w-full lg:w-2/3 pr-0 lg:pr-12">
          {/* What You'll Learn */}
          {course.whatYouLearn.length > 0 && (
            <div className="border border-gray-300 p-6 mb-10">
              <h2 className="text-2xl font-bold mb-4">What you&apos;ll learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                {course.whatYouLearn.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-gray-700 shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Course Includes */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">This course includes:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3">
              <div className="flex items-center gap-3 text-sm"><MonitorPlay className="w-4 h-4" /> {course.sections.length} sections • {totalLectures} lectures</div>
              <div className="flex items-center gap-3 text-sm"><Award className="w-4 h-4" /> Certificate of completion</div>
              <div className="flex items-center gap-3 text-sm"><Smartphone className="w-4 h-4" /> Access on mobile</div>
              <div className="flex items-center gap-3 text-sm"><Infinity className="w-4 h-4" /> Full lifetime access</div>
            </div>
          </div>

          {/* Course Content */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Course content</h2>
            <p className="text-sm text-gray-600 mb-2">{course.sections.length} sections • {totalLectures} lectures</p>
            <div className="border border-gray-300">
              {course.sections.map((section) => (
                <div key={section.id} className="border-b border-gray-300 last:border-b-0">
                  <div className="w-full flex items-center justify-between p-4 bg-gray-50 text-left">
                    <div className="flex items-center gap-3">
                      <ChevronDown className="w-4 h-4 text-gray-700" />
                      <span className="font-bold text-gray-900">{section.title}</span>
                    </div>
                    <span className="text-sm text-gray-600">{section.lectures.length} lectures</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {section.lectures.slice(0, 3).map(lecture => (
                      <div key={lecture.id} className="flex items-center gap-3 px-6 py-2.5 text-sm text-gray-700">
                        {lecture.isFree ? <PlayCircle className="w-4 h-4 text-[#5624d0]" /> : <Lock className="w-4 h-4 text-gray-400" />}
                        <span className="flex-1">{lecture.title}</span>
                        {lecture.isFree && <span className="text-[#5624d0] text-xs font-bold">Preview</span>}
                        {lecture.duration > 0 && <span className="text-gray-400 text-xs">{lecture.duration} min</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructor */}
          {course.creator && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">Instructor</h2>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-[#5624d0] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
                  {course.creator.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-lg text-[#5624d0]">{course.creator.name}</p>
                  {course.creator.bio && <p className="text-sm text-gray-600 mt-1">{course.creator.bio}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-1/3 mt-8 lg:mt-[-280px] z-10 hidden lg:block">
          <div className="bg-white border border-gray-300 shadow-xl sticky top-8">
            {course.thumbnailUrl && (
              <div className="relative w-full aspect-video bg-gray-900 cursor-pointer group overflow-hidden">
                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                {course.previewVideoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle className="w-16 h-16 text-white" fill="black" />
                  </div>
                )}
              </div>
            )}

            <div className="p-6">
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-bold">₹{course.price.toFixed(0)}</span>
                {course.originalPrice && (
                  <span className="text-lg text-gray-400 line-through">₹{course.originalPrice.toFixed(0)}</span>
                )}
                {course.originalPrice && (
                  <span className="text-green-600 font-bold text-sm">
                    {Math.round((1 - course.price / course.originalPrice) * 100)}% off
                  </span>
                )}
              </div>

              {isEnrolled ? (
                <Link
                  href={`/course/${id}/learn`}
                  className="w-full bg-[#5624d0] hover:bg-[#401b9c] text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors"
                >
                  <PlayCircle className="w-4 h-4" /> Go to Course
                </Link>
              ) : session ? (
                <RazorpayCheckout
                  courseId={id}
                  courseTitle={course.title}
                  price={course.price}
                  userName={user?.name}
                  userEmail={user?.email}
                />
              ) : (
                <Link
                  href="/login"
                  className="w-full bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold py-3 flex items-center justify-center transition-colors"
                >
                  Log in to buy
                </Link>
              )}

              <div className="mt-4 space-y-2 text-xs text-gray-500 text-center">
                <p>30-Day Money-Back Guarantee</p>
                <p>Full Lifetime Access</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
