import CourseCarousel from '@/components/CourseCarousel';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth/guards';
import { courseCache } from '@/lib/cache';
import { cached } from '@/lib/cache/cached';
import Link from 'next/link';

async function getRecommendedCourses() {
  return cached(courseCache, 'courses:home:recommended', async () => {
    return db.query.courses.findMany({
      where: eq(courses.status, 'PUBLISHED'),
      orderBy: desc(courses.totalStudents),
      limit: 8,
      with: { creator: { columns: { id: true, name: true } } },
    });
  });
}

async function getNewestCourses() {
  return cached(courseCache, 'courses:home:newest', async () => {
    return db.query.courses.findMany({
      where: eq(courses.status, 'PUBLISHED'),
      orderBy: desc(courses.createdAt),
      limit: 8,
      with: { creator: { columns: { id: true, name: true } } },
    });
  });
}

export default async function Home() {
  const [user, recommendedCourses, newestCourses] = await Promise.all([
    getCurrentUser(),
    getRecommendedCourses(),
    getNewestCourses(),
  ]);

  const toCardProps = (course: typeof recommendedCourses[0]) => ({
    id: course.id,
    imageSrc: course.thumbnailUrl ?? `https://images.unsplash.com/photo-1555949963-aa79dcee57d5?w=480&q=80`,
    title: course.title,
    authors: (course as any).creator?.name ?? 'Instructor',
    rating: course.rating,
    reviews: course.totalReviews,
    price: course.price,
    originalPrice: course.originalPrice ?? undefined,
    badges: course.totalStudents > 10000 ? ['Bestseller'] : [],
  });

  return (
    <div className="max-w-[1340px] mx-auto px-6 py-10 w-full">
      {/* Hero Section */}
      <div className="relative w-full bg-[#f7f9fa] overflow-hidden mb-12 border border-gray-200">
        <div className="max-w-[1340px] mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between relative z-10">
          <div className="bg-white p-6 md:p-8 shadow-lg max-w-md w-full z-10 border border-gray-100">
            {user ? (
              <>
                <h1 className="text-4xl font-bold font-serif mb-3 leading-tight text-gray-900">
                  Welcome back, {user.name.split(' ')[0]}!
                </h1>
                <p className="text-gray-600 mb-6 text-sm">
                  Ready to dive back in? Continue your journey and reach your goals.
                </p>
                {user.role === 'CREATOR' ? (
                  <Link href="/creator-studio" className="inline-block bg-[#5624d0] hover:bg-[#401b9c] text-white font-bold px-6 py-3 transition-colors text-sm w-full text-center">
                    Go to Creator Studio
                  </Link>
                ) : (
                  <Link href="/my-courses/learning" className="inline-block bg-[#5624d0] hover:bg-[#401b9c] text-white font-bold px-6 py-3 transition-colors text-sm w-full text-center">
                    Continue Learning
                  </Link>
                )}
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold font-serif mb-3 leading-tight text-gray-900">
                  Skills that drive you forward
                </h1>
                <p className="text-gray-600 mb-6 text-sm">
                  Technology and the world of work change fast — with us, you're faster. Get the skills to achieve goals and stay competitive.
                </p>
                <div className="flex gap-3">
                  <Link href="/signup" className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold px-4 py-3 transition-colors text-center text-sm border border-gray-900">
                    Sign up for free
                  </Link>
                  <Link href="/login" className="flex-1 bg-white hover:bg-gray-50 text-gray-900 font-bold px-4 py-3 transition-colors text-center text-sm border border-gray-900">
                    Log in
                  </Link>
                </div>
              </>
            )}
          </div>
          
          <div className="hidden md:block absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden bg-white">
            {/* Using a placeholder unsplash image that looks like a student learning or a premium graphic */}
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop" 
              alt="Students learning" 
              className="w-full h-full object-cover object-center opacity-90"
            />
            {/* Subtle gradient overlay to blend into the left side */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#f7f9fa] via-transparent to-transparent" />
          </div>
        </div>
      </div>

      {/* Recommended Section */}
      {recommendedCourses.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-2 font-serif">What to learn next</h2>
          <h3 className="text-xl font-bold mb-4">Most popular courses</h3>
          <CourseCarousel courses={recommendedCourses.map(toCardProps)} />
        </div>
      )}

      {/* Newest Courses Section */}
      {newestCourses.length > 0 && (
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-4">Newest courses</h3>
          <CourseCarousel courses={newestCourses.map(toCardProps)} />
        </div>
      )}

      {/* Empty state */}
      {recommendedCourses.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-4">No courses published yet.</p>
          {user?.role === 'CREATOR' && (
            <Link href="/creator-studio/courses/new" className="text-[#a435f0] font-bold hover:underline">
              Create your first course →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
