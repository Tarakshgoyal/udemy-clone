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
      <div className="flex items-center space-x-6 mb-12">
        {user ? (
          <>
            <div className="w-16 h-16 rounded-full bg-[#5624d0] text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold font-serif mb-1">Welcome back, {user.name.split(' ')[0]}!</h1>
              {user.role === 'CREATOR' ? (
                <Link href="/creator-studio" className="text-[#a435f0] font-bold text-sm hover:text-[#8710d8] underline">
                  Go to Creator Studio →
                </Link>
              ) : (
                <Link href="/my-courses/learning" className="text-[#5624d0] font-bold text-sm hover:text-[#401b9c] underline">
                  Continue learning →
                </Link>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
              🎓
            </div>
            <div>
              <h1 className="text-3xl font-bold font-serif mb-1">Welcome to Udemy</h1>
              <div className="flex gap-3">
                <Link href="/signup" className="text-[#5624d0] font-bold text-sm hover:text-[#401b9c] underline">
                  Sign up free
                </Link>
                <span className="text-gray-300">|</span>
                <Link href="/login" className="text-[#5624d0] font-bold text-sm hover:text-[#401b9c] underline">
                  Log in
                </Link>
              </div>
            </div>
          </>
        )}
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
