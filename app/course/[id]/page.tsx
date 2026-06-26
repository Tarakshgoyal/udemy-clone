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
      <div className="bg-[#1c1d1f] text-white py-8 w-full" style={{ minHeight: '320px' }}>
        <div className="max-w-[1180px] mx-auto px-6 flex flex-col lg:flex-row relative h-full">
          <div className="w-full lg:w-2/3 pr-0 lg:pr-12 flex flex-col justify-center">
            {/* Breadcrumb */}
            {category && (
              <div className="text-[#c0c4fc] text-sm font-bold flex items-center gap-2 mb-4 flex-wrap">
                <Link href={`/categories/${category.slug}`} className="hover:text-white">{category.name}</Link>
                {subcategory && <><span>›</span><Link href={`/categories/${category.slug}/${subcategory.slug}`} className="hover:text-white">{subcategory.name}</Link></>}
                {course.topic && <><span>›</span><span>{course.topic.name}</span></>}
              </div>
            )}

            <h1 className="text-3xl lg:text-4xl font-bold mb-4 font-serif leading-tight break-words">{course.title}</h1>
            <p className="text-lg mb-4 text-gray-100 break-words">{course.description.slice(0, 200)}{course.description.length > 200 ? '...' : ''}</p>

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
          {/* Premium Banner */}
          <div className="border border-[#d1d7dc] bg-white rounded-sm mb-10 w-full flex items-center p-4 shadow-sm">
            <div className="bg-[#a435f0] text-white p-4 flex flex-col justify-center items-center rounded-sm mr-4" style={{ minWidth: '120px' }}>
              <Award className="w-5 h-5 mb-1" />
              <span className="font-bold text-sm">Premium</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 leading-tight mb-1" style={{ fontSize: '15px' }}>Access 28,000+ top-rated courses with Udemy Personal Plan.</p>
              <Link href="#" className="text-[#5624d0] hover:text-[#401b9c] underline text-sm font-bold">Learn more</Link>
            </div>
            <div className="hidden lg:flex items-center justify-around pl-4 border-l border-gray-200 ml-4" style={{ width: '40%' }}>
              <div className="text-center w-1/2">
                <span className="font-bold text-xl block">{course.rating.toFixed(1)}</span>
                <div className="flex items-center justify-center text-[#f69c08] mb-0.5">
                  <Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" />
                </div>
                <span className="text-xs text-[#5624d0] underline">{course.totalReviews.toLocaleString()} ratings</span>
              </div>
              <div className="text-center w-1/2 border-l border-gray-200">
                <span className="font-bold text-xl block"><Users className="w-5 h-5 mx-auto mb-1 text-gray-700"/></span>
                <span className="text-xs text-gray-600">{course.totalStudents.toLocaleString()} learners</span>
              </div>
            </div>
          </div>

          {/* What You'll Learn */}
          {course.whatYouLearn.length > 0 && (
            <div className="bg-white border border-[#d1d7dc] p-6 lg:p-8 mb-10 w-full">
              <h2 className="text-2xl font-bold mb-6 font-serif text-gray-900">What you&apos;ll learn</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 w-full">
                {course.whatYouLearn.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 w-full">
                    <Check className="w-5 h-5 text-gray-900 shrink-0 mt-0.5" />
                    <span className="text-[14px] leading-relaxed text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}



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
        <div className="hidden lg:block absolute right-6 w-1/3 z-20 pointer-events-none h-full" style={{ top: '-260px', maxWidth: '340px' }}>
          <div className="bg-white border border-gray-200 shadow-xl sticky top-8 pointer-events-auto">
            {course.thumbnailUrl && (
              <div className="relative w-full aspect-video bg-gray-900 cursor-pointer group overflow-hidden">
                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                {course.previewVideoUrl && (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                        <PlayCircle className="w-16 h-16 text-gray-900" fill="white" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 text-center font-bold text-white z-10 drop-shadow-md">
                      Preview this course
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent"></div>
                  </>
                )}
              </div>
            )}

            <div className="p-6">
              {!isEnrolled && (
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
              )}

              {isEnrolled ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#a435f0] text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold leading-none">i</span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg">You purchased this course</span>
                  </div>
                  <Link
                    href={`/course/${id}/learn`}
                    className="w-full bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold py-3.5 flex items-center justify-center transition-colors rounded-sm text-[15px]"
                  >
                    Go to course
                  </Link>
                </div>
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

              <div className="mt-4 space-y-2 text-xs text-gray-500 text-center border-b border-gray-200 pb-4 mb-4">
                <p>30-Day Money-Back Guarantee</p>
                <p>Full Lifetime Access</p>
              </div>

              {/* Course Includes (Moved here per Udemy design) */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">This course includes:</h3>
                <div className="flex flex-col gap-y-2.5">
                  <div className="flex items-center gap-3 text-sm text-gray-700"><MonitorPlay className="w-4 h-4 shrink-0" /> {course.sections.length} sections • {totalLectures} lectures</div>
                  <div className="flex items-center gap-3 text-sm text-gray-700"><FileText className="w-4 h-4 shrink-0" /> 19 articles</div>
                  <div className="flex items-center gap-3 text-sm text-gray-700"><Download className="w-4 h-4 shrink-0" /> 167 downloadable resources</div>
                  <div className="flex items-center gap-3 text-sm text-gray-700"><Smartphone className="w-4 h-4 shrink-0" /> Access on mobile and TV</div>
                  <div className="flex items-center gap-3 text-sm text-gray-700"><Award className="w-4 h-4 shrink-0" /> Certificate of completion</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
